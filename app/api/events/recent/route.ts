import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { CrimeType, IncidentFeatureCollection } from '@/types/map';

const CATEGORY_COLORS: Record<string, { color: string; icon: string }> = {
  SHOOTING: { color: '#EF4444', icon: 'pulsing-dot-danger' },
  ASSAULT: { color: '#EF4444', icon: 'pulsing-dot-danger' },
  ROBBERY: { color: '#F59E0B', icon: 'pulsing-dot-theft' },
  THEFT: { color: '#F59E0B', icon: 'pulsing-dot-theft' },
  ACCIDENT: { color: '#3B82F6', icon: 'pulsing-dot-accident' },
  FIRE: { color: '#F97316', icon: 'pulsing-dot-fire' },
  OTHER: { color: '#6B7280', icon: 'pulsing-dot-other' },
};

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const rawDays = parseInt(searchParams.get('days') || '30', 10);
    const days = isNaN(rawDays) ? 30 : Math.min(Math.max(rawDays, 1), 30);

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        type: 'FeatureCollection',
        features: [],
        warning: 'Supabase credentials not configured in environment',
      });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data, error } = await supabaseServer
      .from('events')
      .select('id, title, description, type, latitude, longitude, media_url, created_at, incident_at, temporal_precision')
      .eq('source', 'OFFICIAL')
      .is('deleted_at', null)
      .or(`incident_at.gte.${cutoffDate.toISOString()},and(incident_at.is.null,created_at.gte.${cutoffDate.toISOString()})`)
      .order('incident_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API recent events] Supabase query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const features = (data || [])
      .filter((ev) => ev.latitude != null && ev.longitude != null)
      .map((ev) => {
        const typeKey = (ev.type?.toUpperCase() || 'OTHER') as CrimeType;
        const mapping = CATEGORY_COLORS[typeKey] || CATEGORY_COLORS.OTHER;
        return {
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [Number(ev.longitude), Number(ev.latitude)] as [number, number],
          },
          properties: {
            id: String(ev.id),
            title: ev.title || 'Incidente Reportado',
            description: ev.description || '',
            type: (CATEGORY_COLORS[typeKey] ? typeKey : 'OTHER') as CrimeType,
            color: mapping.color,
            pulseIcon: mapping.icon,
            incidentAt: ev.incident_at || ev.created_at,
            createdAt: ev.created_at,
            mediaUrl: ev.media_url || null,
            temporalPrecision: ev.temporal_precision || 'PUBLICATION_DATE',
          },
        };
      });

    const response = NextResponse.json({
      type: 'FeatureCollection',
      features,
    } as IncidentFeatureCollection);

    // Edge CDN Caching
    response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
    return response;
  } catch (err: any) {
    console.error('[API recent events] Unexpected error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
