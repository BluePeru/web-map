'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMapStore, CategoryFilterId } from '@/store/useMapStore';
import { useRecentEvents } from '@/lib/useRecentEvents';
import { registerAllPulseImages } from '@/lib/mapboxPulseFactory';
import { formatEventRelativeTime } from '@/lib/timeUtils';
import { IncidentFeatureCollection, IncidentProperties, HexagonProperties, CrimeType } from '@/types/map';

function createBalloonMarkerElement(label: string): HTMLDivElement {
  const container = document.createElement('div');
  container.className = 'group relative cursor-pointer transition-transform hover:scale-105 active:scale-95 select-none';

  const bubble = document.createElement('div');
  bubble.className = 'bg-slate-900/95 border border-slate-700/80 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-lg shadow-black/50 backdrop-blur-sm whitespace-nowrap flex items-center gap-1.5';
  bubble.textContent = label;

  const arrow = document.createElement('div');
  arrow.className = 'w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-slate-900/95 mx-auto -mt-[1px]';

  container.appendChild(bubble);
  container.appendChild(arrow);
  return container;
}

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
  const markersMapRef = useRef<Map<string, { marker: mapboxgl.Marker; props: IncidentProperties; label: string }>>(new Map());

  // Zustand state
  const {
    latitude,
    longitude,
    zoom,
    pitch,
    showHeatmap,
    showIncidents,
    timeWindow,
    selectedCategories,
    selectIncident,
    selectHexagon,
    clearSelection,
    setVisibleIncidentCount,
    setViewport,
  } = useMapStore();

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

  // Update visible incidents count based on current map viewport bounds
  const updateVisibleCount = useCallback(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;

    try {
      const bounds = map.getBounds();
      if (!bounds) return;
      let count = 0;
      for (const feat of filteredEvents.features) {
        const coords = feat.geometry.coordinates;
        if (bounds.contains(new mapboxgl.LngLat(coords[0], coords[1]))) {
          count++;
        }
      }
      setVisibleIncidentCount(count);
    } catch {
      // Ignored if map is in transition
    }
  }, [filteredEvents, setVisibleIncidentCount]);

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
    mapboxgl.accessToken = token;

    const styleUrl = process.env.NEXT_PUBLIC_MAPBOX_STYLE || 'mapbox://styles/mapbox/dark-v11';
    const blueApiBaseUrl = process.env.NEXT_PUBLIC_BLUE_API_BASE_URL || 'https://dev.b1peru.com/api';

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: styleUrl,
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

    map.on('load', () => {
      mapLoadedRef.current = true;
      setIsMapLoaded(true);

      // 1. Register GPU Animated Radar Pulses
      registerAllPulseImages(map);

      // 2. Add H3 Vector Tiles Source
      const tileUrl = `${blueApiBaseUrl}/v1/tiles/{z}/{x}/{y}.pbf?mode=risk&v=10`;
      map.addSource('heatmap-source', {
        type: 'vector',
        tiles: [tileUrl],
        maxzoom: 15,
      });

      // 3. Add H3 Fill Layer
      map.addLayer({
        id: 'heatmap-fill',
        type: 'fill',
        source: 'heatmap-source',
        'source-layer': 'risk-hexagons',
        layout: {
          visibility: showHeatmap ? 'visible' : 'none',
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

      // 4. Add H3 Stroke Layer
      map.addLayer({
        id: 'heatmap-stroke',
        type: 'line',
        source: 'heatmap-source',
        'source-layer': 'risk-hexagons',
        layout: {
          visibility: showHeatmap ? 'visible' : 'none',
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

      // 5. Add Events GeoJSON Source
      map.addSource('events-source', {
        type: 'geojson',
        data: filteredEvents,
      });

      // 6. Add Pulsing Radar Dot Layer (Symbol)
      map.addLayer({
        id: 'event-pings-layer',
        type: 'symbol',
        source: 'events-source',
        layout: {
          'icon-image': ['get', 'pulseIcon'],
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          visibility: showIncidents ? 'visible' : 'none',
        },
      });

      // 7. Add Solid Core Layer (Circle)
      map.addLayer({
        id: 'event-dots-layer',
        type: 'circle',
        source: 'events-source',
        layout: {
          visibility: showIncidents ? 'visible' : 'none',
        },
        paint: {
          'circle-radius': 4.5,
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff',
        },
      });

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
      const incidentFeatures = map.queryRenderedFeatures(e.point, {
        layers: ['event-pings-layer', 'event-dots-layer'],
      });

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
      const hexFeatures = map.queryRenderedFeatures(e.point, {
        layers: ['heatmap-fill'],
      });

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
      markersMapRef.current.forEach((entry) => entry.marker.remove());
      markersMapRef.current.clear();
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      map.remove();
      mapRef.current = null;
      mapLoadedRef.current = false;
      setIsMapLoaded(false);
    };
  }, []);

  // Synchronize DOM Balloon Markers reactively
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    const markersMap = markersMapRef.current;

    // 1. Toggle visibility fast via CSS display
    markersMap.forEach(({ marker }) => {
      marker.getElement().style.display = showIncidents ? '' : 'none';
    });

    if (!showIncidents) return;

    const currentEventIds = new Set<string>();

    for (const feat of filteredEvents.features) {
      const coords = feat.geometry?.coordinates;
      if (!coords || coords.length < 2) continue;

      const props = feat.properties;
      const label = formatEventRelativeTime(props.incidentAt, props.createdAt);
      if (!label) continue;

      const eventId = props.id;
      currentEventIds.add(eventId);

      const existing = markersMap.get(eventId);
      if (existing) {
        // Update label text if changed
        if (existing.label !== label) {
          const bubble = existing.marker.getElement().querySelector('div');
          if (bubble) bubble.textContent = label;
          existing.label = label;
        }
        // Keep properties fresh for click handler
        existing.props = props;
      } else {
        const el = createBalloonMarkerElement(label);
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const current = markersMap.get(eventId);
          if (current) {
            selectIncident(current.props);
          }
        });

        const marker = new mapboxgl.Marker({
          element: el,
          anchor: 'bottom',
          offset: [0, -8],
        })
          .setLngLat([coords[0], coords[1]])
          .addTo(map);

        markersMap.set(eventId, { marker, props, label });
      }
    }

    // 2. Remove markers that are no longer in filtered events or whose label became null
    markersMap.forEach((entry, id) => {
      if (!currentEventIds.has(id)) {
        entry.marker.remove();
        markersMap.delete(id);
      }
    });
  }, [filteredEvents, isMapLoaded, showIncidents, selectIncident]);

  // Update GeoJSON data reactively when filteredEvents change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;

    const source = map.getSource('events-source') as mapboxgl.GeoJSONSource | undefined;
    if (source) {
      source.setData(filteredEvents);
    }
    updateVisibleCount();
  }, [filteredEvents, updateVisibleCount]);

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
