import type { Metadata } from 'next';
import './globals.css';
import QueryProvider from '@/components/providers/QueryProvider';

export const metadata: Metadata = {
  title: 'BLUE INTEL — Monitoreo Territorial Táctico (B1 Perú)',
  description:
    'Visualización cartográfica táctica en tiempo real de seguridad territorial, mapas de calor H3 y analítica de incidentes verificados en Lima Metropolitana.',
  openGraph: {
    title: 'BLUE INTEL — Plataforma Táctica de Seguridad Territorial',
    description:
      'Mapas de calor H3 y telemetría de seguridad en tiempo real. Auditoría predictiva para flotas y operaciones críticas.',
    url: 'https://b1peru.com/mapa',
    siteName: 'Blue Intel by B1 Perú',
    locale: 'es_PE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BLUE INTEL — Monitoreo Territorial Táctico',
    description:
      'Mapas de calor H3 y telemetría de seguridad en tiempo real. Auditoría predictiva para flotas y operaciones críticas.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-[#09090b] text-zinc-100 antialiased overflow-hidden w-screen h-screen">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
