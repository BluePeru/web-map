import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/lead/route';
import { NextRequest } from 'next/server';

describe('POST /api/lead', () => {
  it('returns 400 when required fields are missing', async () => {
    const req = new NextRequest('http://localhost/api/lead', {
      method: 'POST',
      body: JSON.stringify({ name: 'Carlos' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it('returns 200 and formatted WhatsApp URL when valid payload is provided', async () => {
    const req = new NextRequest('http://localhost/api/lead', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Carlos Mendoza',
        company: 'Transportes Lima S.A.C.',
        contact: '999888777',
        operationType: 'Flotas y Transporte',
        message: 'Auditoría en ruta Callao',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.whatsappUrl).toContain('wa.me');
    expect(data.whatsappUrl).toContain('Carlos%20Mendoza');
    expect(data.whatsappUrl).toContain('Transportes%20Lima');
  });
});
