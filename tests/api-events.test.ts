import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/events/recent/route';
import { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

vi.mock('@/lib/supabaseServer', () => ({
  supabaseServer: {
    from: vi.fn(),
  },
}));

describe('GET /api/events/recent', () => {
  const mockOrder = vi.fn();
  const mockGte = vi.fn().mockReturnValue({ order: mockOrder });
  const mockIs = vi.fn().mockReturnValue({ gte: mockGte });
  const mockEq = vi.fn().mockReturnValue({ is: mockIs });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

  beforeEach(() => {
    vi.clearAllMocks();
    (supabaseServer.from as any).mockReturnValue({
      select: mockSelect,
    });
  });

  it('queries official events with default 30 days and valid GeoJSON mapping', async () => {
    mockOrder.mockResolvedValueOnce({
      data: [
        {
          id: 'ev-1',
          title: 'Asalto en Miraflores',
          description: 'Sujetos armados en moto',
          type: 'ROBBERY',
          latitude: -12.12,
          longitude: -77.03,
          media_url: 'https://example.com/img.jpg',
          created_at: '2026-09-17T10:00:00Z',
          incident_at: '2026-09-17T09:30:00Z',
          temporal_precision: 'EXACT',
        },
      ],
      error: null,
    });

    const req = new NextRequest('http://localhost/api/events/recent');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(supabaseServer.from).toHaveBeenCalledWith('events');
    expect(mockEq).toHaveBeenCalledWith('source', 'OFFICIAL');
    expect(mockIs).toHaveBeenCalledWith('deleted_at', null);
    expect(mockGte).toHaveBeenCalledWith('created_at', expect.any(String));

    expect(body.type).toBe('FeatureCollection');
    expect(body.features).toHaveLength(1);

    const feature = body.features[0];
    expect(feature.geometry.coordinates).toEqual([-77.03, -12.12]);
    expect(feature.properties.id).toBe('ev-1');
    expect(feature.properties.title).toBe('Asalto en Miraflores');
    expect(feature.properties.type).toBe('ROBBERY');
    expect(feature.properties.color).toBe('#F59E0B');
    expect(feature.properties.pulseIcon).toBe('pulsing-dot-theft');
    expect(feature.properties.incidentAt).toBe('2026-09-17T09:30:00Z');
  });

  it('clamps days parameter between 1 and 30', async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: null });

    // Test with days=100 (should clamp to 30)
    const reqHigh = new NextRequest('http://localhost/api/events/recent?days=100');
    const resHigh = await GET(reqHigh);
    expect(resHigh.status).toBe(200);

    const cutoffHighCall = mockGte.mock.calls[0][1];
    const cutoffHighDate = new Date(cutoffHighCall);
    const expected30DaysAgo = new Date();
    expected30DaysAgo.setDate(expected30DaysAgo.getDate() - 30);
    expect(Math.abs(cutoffHighDate.getTime() - expected30DaysAgo.getTime())).toBeLessThan(5000);

    // Test with days=-5 (should clamp to 1)
    mockOrder.mockResolvedValueOnce({ data: [], error: null });
    const reqLow = new NextRequest('http://localhost/api/events/recent?days=-5');
    const resLow = await GET(reqLow);
    expect(resLow.status).toBe(200);

    const cutoffLowCall = mockGte.mock.calls[1][1];
    const cutoffLowDate = new Date(cutoffLowCall);
    const expected1DayAgo = new Date();
    expected1DayAgo.setDate(expected1DayAgo.getDate() - 1);
    expect(Math.abs(cutoffLowDate.getTime() - expected1DayAgo.getTime())).toBeLessThan(5000);
  });

  it('returns 500 when Supabase returns an error', async () => {
    mockOrder.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database connection failed' },
    });

    const req = new NextRequest('http://localhost/api/events/recent');
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Database connection failed');
  });
});
