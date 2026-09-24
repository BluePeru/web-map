import { create } from 'zustand';
import { IncidentProperties, HexagonProperties, TimeWindow } from '@/types/map';

export type CategoryFilterId = 'VIOLENT' | 'THEFT' | 'ACCIDENT' | 'FIRE' | 'OTHER';

export const ALL_CATEGORY_IDS: CategoryFilterId[] = [
  'VIOLENT',
  'THEFT',
  'ACCIDENT',
  'FIRE',
  'OTHER',
];

export interface MapboxStyleOption {
  id: string;
  name: string;
  shortLabel: string;
  url: string;
}

export const MAPBOX_STYLES: MapboxStyleOption[] = [
  { id: 'dark', name: 'Oscuro Táctico', shortLabel: 'Oscuro', url: 'mapbox://styles/mapbox/dark-v11' },
  { id: 'navigation', name: 'Navegación Nocturna', shortLabel: 'Navegación', url: 'mapbox://styles/mapbox/navigation-night-v1' },
];

interface MapState {
  // Viewport
  latitude: number;
  longitude: number;
  zoom: number;
  pitch: number;
  setViewport: (viewport: Partial<{ latitude: number; longitude: number; zoom: number; pitch: number }>) => void;

  // Layer toggles
  showHeatmap: boolean;
  showIncidents: boolean;
  toggleHeatmap: () => void;
  toggleIncidents: () => void;

  // Map style
  currentStyleId: string;
  cycleMapStyle: () => void;
  setMapStyle: (styleId: string) => void;

  // Time window filter
  timeWindow: TimeWindow;
  setTimeWindow: (timeWindow: TimeWindow) => void;

  // Category filters
  selectedCategories: CategoryFilterId[];
  toggleCategory: (category: CategoryFilterId) => void;

  // HUD / Panoramic mode
  isHudCollapsed: boolean;
  toggleHud: () => void;
  setHudCollapsed: (collapsed: boolean) => void;

  // Selection
  selectedIncident: IncidentProperties | null;
  selectedHexagon: HexagonProperties | null;
  selectIncident: (incident: IncidentProperties) => void;
  selectHexagon: (hexagon: HexagonProperties) => void;
  clearSelection: () => void;

  // B2B Conversion Modal
  isLeadModalOpen: boolean;
  openLeadModal: () => void;
  closeLeadModal: () => void;

  // Metrics
  visibleIncidentCount: number;
  setVisibleIncidentCount: (count: number) => void;
}

export const useMapStore = create<MapState>((set) => ({
  // Defaults centered on Lima Metropolitana
  latitude: Number(process.env.NEXT_PUBLIC_DEFAULT_LAT || -12.0464),
  longitude: Number(process.env.NEXT_PUBLIC_DEFAULT_LNG || -77.0428),
  zoom: Number(process.env.NEXT_PUBLIC_DEFAULT_ZOOM || 11.5),
  pitch: Number(process.env.NEXT_PUBLIC_DEFAULT_PITCH || 45),
  setViewport: (viewport) => set((state) => ({ ...state, ...viewport })),

  // Toggles
  showHeatmap: true,
  showIncidents: true,
  toggleHeatmap: () => set((state) => ({ showHeatmap: !state.showHeatmap })),
  toggleIncidents: () => set((state) => ({ showIncidents: !state.showIncidents })),

  // Map style
  currentStyleId: 'dark',
  cycleMapStyle: () =>
    set((state) => {
      const currentIndex = MAPBOX_STYLES.findIndex((s) => s.id === state.currentStyleId);
      const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % MAPBOX_STYLES.length;
      return { currentStyleId: MAPBOX_STYLES[nextIndex].id };
    }),
  setMapStyle: (styleId) => set({ currentStyleId: styleId }),

  // Time window
  timeWindow: '30d',
  setTimeWindow: (timeWindow) => set({ timeWindow }),

  // Category filters
  selectedCategories: [...ALL_CATEGORY_IDS],
  toggleCategory: (category) =>
    set((state) => {
      const exists = state.selectedCategories.includes(category);
      if (exists) {
        // Don't allow empty selection if desired, or allow toggling off
        if (state.selectedCategories.length === 1) {
          // If only 1 left, toggle resets to all
          return { selectedCategories: [...ALL_CATEGORY_IDS] };
        }
        return {
          selectedCategories: state.selectedCategories.filter((c) => c !== category),
        };
      } else {
        return {
          selectedCategories: [...state.selectedCategories, category],
        };
      }
    }),

  // HUD Collapsible state
  isHudCollapsed: false,
  toggleHud: () =>
    set((state) => {
      const nextVal = !state.isHudCollapsed;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('blue_hud_collapsed', String(nextVal));
        } catch {
          // Ignore localStorage errors
        }
      }
      return { isHudCollapsed: nextVal };
    }),
  setHudCollapsed: (collapsed) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('blue_hud_collapsed', String(collapsed));
      } catch {
        // Ignore localStorage errors
      }
    }
    set({ isHudCollapsed: collapsed });
  },

  // Selection
  selectedIncident: null,
  selectedHexagon: null,
  selectIncident: (incident) =>
    set({
      selectedIncident: incident,
      selectedHexagon: null,
    }),
  selectHexagon: (hexagon) =>
    set({
      selectedHexagon: hexagon,
      selectedIncident: null,
    }),
  clearSelection: () =>
    set({
      selectedIncident: null,
      selectedHexagon: null,
    }),

  // Lead modal
  isLeadModalOpen: false,
  openLeadModal: () => set({ isLeadModalOpen: true }),
  closeLeadModal: () => set({ isLeadModalOpen: false }),

  // Reactive metrics
  visibleIncidentCount: 0,
  setVisibleIncidentCount: (count) => set({ visibleIncidentCount: count }),
}));
