import { describe, it, expect, beforeEach } from 'vitest';
import { useMapStore, ALL_CATEGORY_IDS } from '@/store/useMapStore';

describe('useMapStore', () => {
  beforeEach(() => {
    // Reset to initial state
    useMapStore.setState({
      showHeatmap: true,
      showIncidents: true,
      currentStyleId: 'dark',
      timeWindow: '30d',
      selectedCategories: [...ALL_CATEGORY_IDS],
      isHudCollapsed: false,
      selectedIncident: null,
      selectedHexagon: null,
      isLeadModalOpen: false,
      visibleIncidentCount: 0,
    });
  });

  it('handles layer toggles correctly', () => {
    const store = useMapStore.getState();
    expect(store.showHeatmap).toBe(true);
    expect(store.showIncidents).toBe(true);

    store.toggleHeatmap();
    expect(useMapStore.getState().showHeatmap).toBe(false);

    store.toggleIncidents();
    expect(useMapStore.getState().showIncidents).toBe(false);
  });

  it('updates time window filter', () => {
    const store = useMapStore.getState();
    expect(store.timeWindow).toBe('30d');

    store.setTimeWindow('24h');
    expect(useMapStore.getState().timeWindow).toBe('24h');

    store.setTimeWindow('7d');
    expect(useMapStore.getState().timeWindow).toBe('7d');
  });

  it('handles category filter selection and toggle reset', () => {
    const store = useMapStore.getState();
    expect(store.selectedCategories).toHaveLength(ALL_CATEGORY_IDS.length);

    // Toggle out VIOLENT
    store.toggleCategory('VIOLENT');
    expect(useMapStore.getState().selectedCategories).not.toContain('VIOLENT');

    // Toggle in VIOLENT
    store.toggleCategory('VIOLENT');
    expect(useMapStore.getState().selectedCategories).toContain('VIOLENT');
  });

  it('handles HUD collapse and expansion', () => {
    const store = useMapStore.getState();
    expect(store.isHudCollapsed).toBe(false);

    store.toggleHud();
    expect(useMapStore.getState().isHudCollapsed).toBe(true);

    store.toggleHud();
    expect(useMapStore.getState().isHudCollapsed).toBe(false);
  });

  it('manages selection mutually exclusively between incident and hexagon', () => {
    const store = useMapStore.getState();

    const mockIncident = {
      id: 'inc-1',
      title: 'Robo a transeúnte',
      description: 'Hecho reportado en San Isidro',
      type: 'ROBBERY' as const,
      color: '#F59E0B',
      pulseIcon: 'pulsing-dot-theft',
      incidentAt: '2026-09-17T12:00:00Z',
      createdAt: '2026-09-17T12:00:00Z',
      mediaUrl: null,
      temporalPrecision: 'EXACT' as const,
    };

    const mockHexagon = {
      h3_index: '8860145293fffff',
      risk_score: 0.72,
      risk_label: 'Alto Riesgo',
      top_crime: 'Robo Agravado',
      advice: 'Incrementar patrullaje en horarios nocturnos',
    };

    // Select incident
    store.selectIncident(mockIncident);
    expect(useMapStore.getState().selectedIncident).toEqual(mockIncident);
    expect(useMapStore.getState().selectedHexagon).toBeNull();

    // Select hexagon (incident must be cleared)
    store.selectHexagon(mockHexagon);
    expect(useMapStore.getState().selectedHexagon).toEqual(mockHexagon);
    expect(useMapStore.getState().selectedIncident).toBeNull();

    // Clear selection
    store.clearSelection();
    expect(useMapStore.getState().selectedIncident).toBeNull();
    expect(useMapStore.getState().selectedHexagon).toBeNull();
  });

  it('handles B2B modal open and close', () => {
    const store = useMapStore.getState();
    expect(store.isLeadModalOpen).toBe(false);

    store.openLeadModal();
    expect(useMapStore.getState().isLeadModalOpen).toBe(true);

    store.closeLeadModal();
    expect(useMapStore.getState().isLeadModalOpen).toBe(false);
  });

  it('cycles through map styles in continuous loop and allows direct style setting', () => {
    const store = useMapStore.getState();
    expect(store.currentStyleId).toBe('dark');

    // 1 -> navigation
    store.cycleMapStyle();
    expect(useMapStore.getState().currentStyleId).toBe('navigation');

    // 2 -> wraps back to dark
    store.cycleMapStyle();
    expect(useMapStore.getState().currentStyleId).toBe('dark');

    // Direct setting
    store.setMapStyle('navigation');
    expect(useMapStore.getState().currentStyleId).toBe('navigation');
  });
});
