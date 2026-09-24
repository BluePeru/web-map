import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import DetailDrawer from '@/components/ui/DetailDrawer';
import TacticalHeader from '@/components/ui/TacticalHeader';
import TikTokActionMenu from '@/components/ui/TikTokActionMenu';
import { useMapStore } from '@/store/useMapStore';

describe('UI Components', () => {
  beforeEach(() => {
    useMapStore.setState({
      selectedIncident: null,
      selectedHexagon: null,
      visibleIncidentCount: 42,
      isLeadModalOpen: false,
      currentStyleId: 'dark',
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

  describe('TikTokActionMenu', () => {
    it('renders the map style button with default label and cycles on click', () => {
      render(<TikTokActionMenu />);

      // Initial state is dark
      expect(screen.getByText('Oscuro')).toBeInTheDocument();

      const layerBtn = screen.getByTitle(/Cambiar estilo de mapa/i);
      fireEvent.click(layerBtn);

      // Store should transition to satellite
      expect(useMapStore.getState().currentStyleId).toBe('satellite');
      expect(screen.getByText('Satélite')).toBeInTheDocument();

      // Feedback toast should be rendered
      expect(screen.getByText('Estilo: Satelital Híbrido')).toBeInTheDocument();
    });

    it('hides smoothly when an incident or hexagon is selected to avoid drawer collision', () => {
      const { container, rerender } = render(<TikTokActionMenu />);

      const menuDiv = container.firstChild as HTMLElement;
      expect(menuDiv).toHaveClass('opacity-100');
      expect(menuDiv).not.toHaveClass('opacity-0');

      // Select an incident
      act(() => {
        useMapStore.setState({
          selectedIncident: {
            id: 'inc-1',
            title: 'Robo',
            description: '',
            type: 'ROBBERY',
            color: '#F59E0B',
            pulseIcon: 'pulsing-dot-theft',
            incidentAt: '2026-09-17T12:00:00Z',
            createdAt: '2026-09-17T12:00:00Z',
            mediaUrl: null,
            temporalPrecision: 'EXACT',
          },
        });
      });

      rerender(<TikTokActionMenu />);
      expect(menuDiv).toHaveClass('opacity-0');
      expect(menuDiv).toHaveClass('pointer-events-none');
    });

    it('renders additional extensible action items when provided via props', () => {
      const customAction = {
        id: 'gps',
        label: 'Mi Ubicación',
        icon: () => <span data-testid="gps-icon" />,
        onClick: vi.fn(),
      };

      render(<TikTokActionMenu actions={[customAction]} />);

      expect(screen.getByText('Mi Ubicación')).toBeInTheDocument();
      expect(screen.getByTestId('gps-icon')).toBeInTheDocument();

      const customBtn = screen.getByTitle('Mi Ubicación');
      fireEvent.click(customBtn);
      expect(customAction.onClick).toHaveBeenCalledTimes(1);
    });
  });
});
