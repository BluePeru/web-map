'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMapStore, CategoryFilterId, MAPBOX_STYLES } from '@/store/useMapStore';
import { useRecentEvents } from '@/lib/useRecentEvents';
import { registerAllPulseImages } from '@/lib/mapboxPulseFactory';
import { IncidentFeatureCollection, IncidentProperties, HexagonProperties, CrimeType } from '@/types/map';

const CATEGORY_GROUP_MAP: Record<CategoryFilterId, CrimeType[]> = {
  VIOLENT: ['SHOOTING', 'ASSAULT'],
  THEFT: ['ROBBERY', 'THEFT'],
  ACCIDENT: ['ACCIDENT'],
  FIRE: ['FIRE'],
  OTHER: ['OTHER'],
};

export default function MapCanvas() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapLoadedRef = useRef<boolean>(false);
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);

  // Zustand state
  const {
    latitude,
    longitude,
    zoom,
    pitch,
    showHeatmap,
    showIncidents,
    currentStyleId,
    timeWindow,
    selectedCategories,
    selectIncident,
    selectHexagon,
    clearSelection,
    setVisibleIncidentCount,
    setViewport,
  } = useMapStore();

  const prevStyleIdRef = useRef<string>(currentStyleId);

  // Data hook (BFF)
  const { data: rawEvents } = useRecentEvents(30);

  // Filter events in memory based on timeWindow & selectedCategories
  const filteredEvents: IncidentFeatureCollection = useMemo(() => {
    if (!rawEvents || !rawEvents.features) {
      return { type: 'FeatureCollection', features: [] };
    }

    const now = Date.now();
    let windowMs = 30 * 24 * 60 * 60 * 1000;
    if (timeWindow === '24h') windowMs = 24 * 60 * 60 * 1000;
    else if (timeWindow === '7d') windowMs = 7 * 24 * 60 * 60 * 1000;

    const cutoffTime = now - windowMs;

    // Allowed crime types
    const allowedCrimeTypes = new Set<CrimeType>();
    selectedCategories.forEach((cat) => {
      CATEGORY_GROUP_MAP[cat]?.forEach((t) => allowedCrimeTypes.add(t));
    });

    const features = rawEvents.features.filter((feat) => {
      const incidentDate = new Date(feat.properties.incidentAt || feat.properties.createdAt).getTime();
      if (incidentDate < cutoffTime) return false;

      const crimeType = feat.properties.type;
      if (!allowedCrimeTypes.has(crimeType)) return false;

      return true;
    });

    return {
      type: 'FeatureCollection',
      features,
    };
  }, [rawEvents, timeWindow, selectedCategories]);

  const filteredEventsRef = useRef<IncidentFeatureCollection>(filteredEvents);
  useEffect(() => {
    filteredEventsRef.current = filteredEvents;
  }, [filteredEvents]);

  // Update visible incidents count based on current map viewport bounds
  const updateVisibleCount = useCallback(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;

    try {
      const bounds = map.getBounds();
      if (!bounds) return;
      let count = 0;
      for (const feat of filteredEventsRef.current.features) {
        const coords = feat.geometry.coordinates;
        if (bounds.contains(new mapboxgl.LngLat(coords[0], coords[1]))) {
          count++;
        }
      }
      setVisibleIncidentCount(count);
    } catch {
      // Ignored if map is in transition
    }
  }, [setVisibleIncidentCount]);

  // Modularized Custom Layers Setup (idempotent with defensive guards)
  const setupCustomLayers = useCallback((map: mapboxgl.Map) => {
    // 1. Register GPU Animated Radar Pulses
    registerAllPulseImages(map);

    // 2. Read live state from Zustand to prevent stale closures
    const { showHeatmap: liveShowHeatmap, showIncidents: liveShowIncidents } = useMapStore.getState();
    const blueApiBaseUrl = process.env.NEXT_PUBLIC_BLUE_API_BASE_URL || 'https://dev.b1peru.com/api';

    // 3. Add H3 Vector Tiles Source
    if (!map.getSource('heatmap-source')) {
      const tileUrl = `${blueApiBaseUrl}/v1/tiles/{z}/{x}/{y}.pbf?mode=risk&v=10`;
      map.addSource('heatmap-source', {
        type: 'vector',
        tiles: [tileUrl],
        maxzoom: 15,
      });
    }

    // 4. Add H3 Fill Layer
    if (!map.getLayer('heatmap-fill')) {
      map.addLayer({
        id: 'heatmap-fill',
        type: 'fill',
        source: 'heatmap-source',
        'source-layer': 'risk-hexagons',
        layout: {
          visibility: liveShowHeatmap ? 'visible' : 'none',
        },
        paint: {
          'fill-opacity': ['*', 0.55, ['to-number', ['coalesce', ['get', 'opacity'], 1.0], 1.0]],
          'fill-color': [
            'step',
            ['get', 'risk_score'],
            '#22c55e', // < 0.25 (Bajo)
            0.25,
            '#f97316', // 0.25 - 0.59 (Medio)
            0.6,
            '#ef4444', // >= 0.60 (Alto)
          ],
        },
      });
    }

    // 5. Add H3 Stroke Layer
    if (!map.getLayer('heatmap-stroke')) {
      map.addLayer({
        id: 'heatmap-stroke',
        type: 'line',
        source: 'heatmap-source',
        'source-layer': 'risk-hexagons',
        layout: {
          visibility: liveShowHeatmap ? 'visible' : 'none',
        },
        paint: {
          'line-width': 1.2,
          'line-opacity': ['*', 0.75, ['to-number', ['coalesce', ['get', 'opacity'], 1.0], 1.0]],
          'line-color': [
            'step',
            ['get', 'risk_score'],
            '#16a34a',
            0.25,
            '#ea580c',
            0.6,
            '#dc2626',
          ],
        },
      });
    }

    // 6. Add Events GeoJSON Source
    if (!map.getSource('events-source')) {
      map.addSource('events-source', {
        type: 'geojson',
        data: filteredEventsRef.current,
      });
    }

    // 7. Add Pulsing Radar Dot Layer (Symbol)
    if (!map.getLayer('event-pings-layer')) {
      map.addLayer({
        id: 'event-pings-layer',
        type: 'symbol',
        source: 'events-source',
        layout: {
          'icon-image': ['get', 'pulseIcon'],
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'icon-pitch-alignment': 'map',
          'icon-rotation-alignment': 'map',
          visibility: liveShowIncidents ? 'visible' : 'none',
        },
      });
    }

    // 8. Add Solid Core Layer (Circle)
    if (!map.getLayer('event-dots-layer')) {
      map.addLayer({
        id: 'event-dots-layer',
        type: 'circle',
        source: 'events-source',
        layout: {
          visibility: liveShowIncidents ? 'visible' : 'none',
        },
        paint: {
          'circle-radius': 4.5,
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff',
          'circle-pitch-alignment': 'map',
          'circle-pitch-scale': 'map',
        },
      });
    }
  }, []);

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
    mapboxgl.accessToken = token;

    const initialStyleConfig = MAPBOX_STYLES.find((s) => s.id === useMapStore.getState().currentStyleId);
    const initialStyleUrl = initialStyleConfig?.url || process.env.NEXT_PUBLIC_MAPBOX_STYLE || MAPBOX_STYLES[0].url;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: initialStyleUrl,
      center: [longitude, latitude],
      zoom: zoom,
      pitch: pitch,
      attributionControl: false,
    });

    mapRef.current = map;

    // WebGL context lost resilience
    const canvas = map.getCanvas();
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      console.warn('[MapCanvas] WebGL context lost. Attempting recovery...');
    };
    canvas.addEventListener('webglcontextlost', handleContextLost);

    map.on('style.load', () => {
      setupCustomLayers(map);
      updateVisibleCount();
    });

    map.on('error', (e) => {
      console.warn('[MapCanvas] Error cartográfico:', e);
    });

    map.on('load', () => {
      mapLoadedRef.current = true;
      setIsMapLoaded(true);
      setupCustomLayers(map);
      updateVisibleCount();
    });

    // Handle Viewport Changes
    map.on('moveend', () => {
      const center = map.getCenter();
      setViewport({
        latitude: center.lat,
        longitude: center.lng,
        zoom: map.getZoom(),
        pitch: map.getPitch(),
      });
      updateVisibleCount();
    });

    // Click Precedence Handler
    map.on('click', (e) => {
      // 1. Check for incident clicks first
      const incidentLayers = ['event-pings-layer', 'event-dots-layer'].filter((id) => !!map.getLayer(id));
      const incidentFeatures = incidentLayers.length > 0
        ? map.queryRenderedFeatures(e.point, { layers: incidentLayers })
        : [];

      if (incidentFeatures && incidentFeatures.length > 0) {
        const feat = incidentFeatures[0];
        const props = feat.properties as any;
        selectIncident({
          id: props.id,
          title: props.title,
          description: props.description,
          type: props.type,
          color: props.color,
          pulseIcon: props.pulseIcon,
          incidentAt: props.incidentAt,
          createdAt: props.createdAt,
          mediaUrl: props.mediaUrl || null,
          temporalPrecision: props.temporalPrecision,
        });
        return;
      }

      // 2. Check for H3 Hexagon click if no incident was clicked
      const hexFeatures = map.getLayer('heatmap-fill')
        ? map.queryRenderedFeatures(e.point, { layers: ['heatmap-fill'] })
        : [];

      if (hexFeatures && hexFeatures.length > 0) {
        const hex = hexFeatures[0];
        const props = hex.properties as any;
        selectHexagon({
          h3_index: props.h3_index || String(props.id || 'N/A'),
          risk_score: typeof props.risk_score === 'number' ? props.risk_score : parseFloat(props.risk_score || '0'),
          risk_label: props.risk_label,
          top_crime: props.top_crime,
          advice: props.advice,
          resolution: props.resolution,
          opacity: typeof props.opacity === 'number' ? props.opacity : parseFloat(props.opacity || '1.0'),
        });
        return;
      }

      // 3. Clicked empty space
      clearSelection();
    });

    // Interactive pointer cursors
    const enterPointer = () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    const leavePointer = () => {
      map.getCanvas().style.cursor = '';
    };

    ['event-pings-layer', 'event-dots-layer', 'heatmap-fill'].forEach((layerId) => {
      map.on('mouseenter', layerId, enterPointer);
      map.on('mouseleave', layerId, leavePointer);
    });

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      map.remove();
      mapRef.current = null;
      mapLoadedRef.current = false;
      setIsMapLoaded(false);
    };
  }, []);

  // Dynamically switch Mapbox style when currentStyleId changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;
    if (prevStyleIdRef.current === currentStyleId) return;
    prevStyleIdRef.current = currentStyleId;

    const styleConfig = MAPBOX_STYLES.find((s) => s.id === currentStyleId);
    if (styleConfig) {
      map.setStyle(styleConfig.url);
    }
  }, [currentStyleId, isMapLoaded]);

  // Update GeoJSON data reactively when filteredEvents change or map finishes loading
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    const source = map.getSource('events-source') as mapboxgl.GeoJSONSource | undefined;
    if (source) {
      source.setData(filteredEvents);
    }
    updateVisibleCount();
  }, [filteredEvents, isMapLoaded, updateVisibleCount]);

  // Update Heatmap Visibility reactively
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;

    const visibility = showHeatmap ? 'visible' : 'none';
    if (map.getLayer('heatmap-fill')) {
      map.setLayoutProperty('heatmap-fill', 'visibility', visibility);
    }
    if (map.getLayer('heatmap-stroke')) {
      map.setLayoutProperty('heatmap-stroke', 'visibility', visibility);
    }
  }, [showHeatmap]);

  // Update Incidents Visibility reactively
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;

    const visibility = showIncidents ? 'visible' : 'none';
    if (map.getLayer('event-pings-layer')) {
      map.setLayoutProperty('event-pings-layer', 'visibility', visibility);
    }
    if (map.getLayer('event-dots-layer')) {
      map.setLayoutProperty('event-dots-layer', 'visibility', visibility);
    }
  }, [showIncidents]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
