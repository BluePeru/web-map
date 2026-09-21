import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, company, contact, operationType, message } = body;

    if (!name?.trim() || !company?.trim() || !contact?.trim()) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: nombre, empresa o información de contacto.' },
        { status: 400 }
      );
    }

    console.log('[API Lead B2B] Solicitud recibida:', {
      name,
      company,
      contact,
      operationType: operationType || 'No especificado',
      message: message || '',
      receivedAt: new Date().toISOString(),
    });

    const phone = process.env.NEXT_PUBLIC_B2B_WHATSAPP_PHONE || '51999999999';
    const text = encodeURIComponent(
      `Hola equipo B1 Perú, mi nombre es ${name.trim()} de la empresa ${company.trim()}.\n` +
      `Deseo solicitar información sobre auditoría de seguridad territorial.\n` +
      `Tipo de operación: ${operationType?.trim() || 'General'}\n` +
      `Contacto: ${contact.trim()}\n` +
      `Detalles: ${message?.trim() || 'Sin comentarios adicionales'}`
    );

    const whatsappUrl = `https://wa.me/${phone}?text=${text}`;

    return NextResponse.json({
      success: true,
      whatsappUrl,
    });
  } catch (err: any) {
    console.error('[API Lead B2B] Error al procesar lead:', err);
    return NextResponse.json(
      { error: err.message || 'Error interno del servidor al procesar solicitud.' },
      { status: 500 }
    );
  }
}
