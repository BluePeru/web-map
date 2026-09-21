import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DetailDrawer from '@/components/ui/DetailDrawer';
import TacticalHeader from '@/components/ui/TacticalHeader';
import { useMapStore } from '@/store/useMapStore';

describe('UI Components', () => {
  beforeEach(() => {
    useMapStore.setState({
      selectedIncident: null,
      selectedHexagon: null,
      visibleIncidentCount: 42,
      isLeadModalOpen: false,
    });
  });

  describe('DetailDrawer', () => {
    it('renders nothing when no feature is selected', () => {
      const { container } = render(<DetailDrawer />);
      expect(container.firstChild).toBeNull();
    });

    it('renders incident details correctly when an incident is selected', () => {
      useMapStore.setState({
        selectedIncident: {
          id: 'test-incident-1',
          title: 'Incidente Oficial PSC Lima',
          description: 'Descripción periodística del hecho reportado',
          type: 'SHOOTING',
          color: '#EF4444',
          pulseIcon: 'pulsing-dot-danger',
          incidentAt: '2026-09-17T12:00:00Z',
          createdAt: '2026-09-17T12:00:00Z',
          mediaUrl: 'https://example.com/foto.jpg',
          temporalPrecision: 'EXACT',
        },
      });

      render(<DetailDrawer />);

      expect(screen.getByText('Detalle de Incidente PSC')).toBeInTheDocument();
      expect(screen.getByText('Incidente Oficial PSC Lima')).toBeInTheDocument();
      expect(screen.getByText('Descripción periodística del hecho reportado')).toBeInTheDocument();
      expect(screen.getByText('SHOOTING')).toBeInTheDocument();
      expect(screen.getByText('PRECISIÓN: EXACT')).toBeInTheDocument();

      // Close button clears selection
      const closeBtn = screen.getByRole('button', { name: /cerrar/i });
      fireEvent.click(closeBtn);
      expect(useMapStore.getState().selectedIncident).toBeNull();
    });

    it('renders hexagon details and fallback advice for low-zoom zones', () => {
      useMapStore.setState({
        selectedHexagon: {
          h3_index: '8860145293fffff',
          risk_score: 0.85,
          top_crime: 'Robo a mano armada',
          // advice is intentionally omitted to test macro-zoom fallback
        },
      });

      render(<DetailDrawer />);

      expect(screen.getByText('Auditoría Territorial H3')).toBeInTheDocument();
      expect(screen.getByText('Zona Roja')).toBeInTheDocument();
      expect(screen.getByText('0.85')).toBeInTheDocument();
      expect(screen.getByText('Robo a mano armada')).toBeInTheDocument();
      expect(
        screen.getByText('Haz zoom en la zona para ver recomendaciones tácticas a nivel de calle.')
      ).toBeInTheDocument();
    });
  });

  describe('TacticalHeader', () => {
    it('renders branding, visible incidents count, and triggers B2B modal on CTA click', () => {
      render(<TacticalHeader />);

      expect(screen.getByText('INTEL')).toBeInTheDocument();
      expect(screen.getByText('B1 PERÚ')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();

      const ctaBtn = screen.getByRole('button', { name: /Integración API \/ Empresas/i });
      fireEvent.click(ctaBtn);
      expect(useMapStore.getState().isLeadModalOpen).toBe(true);
    });
  });
});
