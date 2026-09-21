'use client';

import React from 'react';
import { useMapStore, ALL_CATEGORY_IDS, CategoryFilterId } from '@/store/useMapStore';
import {
  Layers,
  Flame,
  Radio,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Car,
  HelpCircle,
  Sliders,
} from 'lucide-react';
import { TimeWindow } from '@/types/map';

const CATEGORY_META: Record<
  CategoryFilterId,
  { label: string; icon: React.ComponentType<{ className?: string }>; colorClass: string; activeClass: string }
> = {
  VIOLENT: {
    label: 'Violentos / Armas',
    icon: ShieldAlert,
    colorClass: 'text-red-400',
    activeClass: 'bg-red-950/60 border-red-700/80 text-red-200 shadow-red-950/50',
  },
  THEFT: {
    label: 'Robos / Hurtos',
    icon: ShieldAlert,
    colorClass: 'text-amber-400',
    activeClass: 'bg-amber-950/60 border-amber-700/80 text-amber-200 shadow-amber-950/50',
  },
  ACCIDENT: {
    label: 'Accidentes',
    icon: Car,
    colorClass: 'text-blue-400',
    activeClass: 'bg-blue-950/60 border-blue-700/80 text-blue-200 shadow-blue-950/50',
  },
  FIRE: {
    label: 'Incendios',
    icon: Flame,
    colorClass: 'text-orange-400',
    activeClass: 'bg-orange-950/60 border-orange-700/80 text-orange-200 shadow-orange-950/50',
  },
  OTHER: {
    label: 'Otros Delitos',
    icon: HelpCircle,
    colorClass: 'text-zinc-400',
    activeClass: 'bg-zinc-800/80 border-zinc-600/80 text-zinc-200 shadow-zinc-900/50',
  },
};

export default function ControlPanel() {
  const {
    isHudCollapsed,
    toggleHud,
    showHeatmap,
    showIncidents,
    toggleHeatmap,
    toggleIncidents,
    timeWindow,
    setTimeWindow,
    selectedCategories,
    toggleCategory,
  } = useMapStore();

  const timeWindows: { id: TimeWindow; label: string }[] = [
    { id: '24h', label: '24h' },
    { id: '7d', label: '7 días' },
    { id: '30d', label: '30 días' },
  ];

  return (
    <div className="absolute top-16 left-3 md:left-6 z-20 transition-all duration-300 pointer-events-none">
      <div className="flex items-start pointer-events-auto">
        {/* Main Card */}
        <div
          className={`transition-all duration-300 origin-left overflow-hidden ${
            isHudCollapsed
              ? 'w-0 opacity-0 -translate-x-4 pointer-events-none'
              : 'w-72 md:w-80 opacity-100 translate-x-0'
          }`}
        >
          <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800/90 rounded-xl p-4 shadow-2xl text-zinc-200 space-y-4">
            {/* Header / Collapse trigger */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold tracking-wider text-zinc-300 uppercase">
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                <span>Panel de Control</span>
              </div>
              <button
                onClick={toggleHud}
                title="Colapsar panel (Modo Panorámico)"
                className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Layer Toggles */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-zinc-500" /> Capas Activas
              </span>
              <div className="grid grid-cols-2 gap-2">
                {/* Heatmap H3 toggle */}
                <button
                  onClick={toggleHeatmap}
                  className={`flex items-center space-x-2 px-2.5 py-2 rounded-lg border text-xs font-mono transition-all ${
                    showHeatmap
                      ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-300'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-500'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      showHeatmap ? 'bg-emerald-400 ring-2 ring-emerald-500/30' : 'bg-zinc-600'
                    }`}
                  />
                  <span>Calor H3</span>
                </button>

                {/* Radar Pings toggle */}
                <button
                  onClick={toggleIncidents}
                  className={`flex items-center space-x-2 px-2.5 py-2 rounded-lg border text-xs font-mono transition-all ${
                    showIncidents
                      ? 'bg-blue-950/50 border-blue-700/60 text-blue-300'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-500'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      showIncidents ? 'bg-blue-400 ring-2 ring-blue-500/30' : 'bg-zinc-600'
                    }`}
                  />
                  <span>Radar Pings</span>
                </button>
              </div>
            </div>

            {/* Time Window Selector */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-zinc-500" /> Ventana Temporal
              </span>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-900/90 rounded-lg border border-zinc-800">
                {timeWindows.map((tw) => (
                  <button
                    key={tw.id}
                    onClick={() => setTimeWindow(tw.id)}
                    className={`py-1.5 px-2 text-[11px] font-mono font-medium rounded-md transition-all ${
                      timeWindow === tw.id
                        ? 'bg-zinc-800 text-blue-400 border border-zinc-700 shadow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {tw.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Filter className="w-3 h-3 text-zinc-500" /> Tipos de Incidentes
              </span>
              <div className="flex flex-wrap gap-1.5">
                {ALL_CATEGORY_IDS.map((catId) => {
                  const meta = CATEGORY_META[catId];
                  const isSelected = selectedCategories.includes(catId);
                  const Icon = meta.icon;

                  return (
                    <button
                      key={catId}
                      onClick={() => toggleCategory(catId)}
                      className={`flex items-center space-x-1.5 px-2 py-1 rounded-md text-[11px] font-mono border transition-all ${
                        isSelected
                          ? `${meta.activeClass} shadow-sm`
                          : 'bg-zinc-900/50 border-zinc-800/80 text-zinc-500 hover:text-zinc-400'
                      }`}
                    >
                      <Icon className={`w-3 h-3 ${isSelected ? meta.colorClass : 'text-zinc-600'}`} />
                      <span>{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Expand toggle button when HUD is collapsed */}
        {isHudCollapsed && (
          <button
            onClick={toggleHud}
            title="Mostrar Panel de Control"
            className="flex items-center space-x-1.5 px-3 py-2 bg-zinc-950/90 backdrop-blur-md border border-zinc-800/90 rounded-xl shadow-2xl text-zinc-300 hover:text-white hover:border-zinc-700 transition-all active:scale-95 pointer-events-auto"
          >
            <Sliders className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-mono font-medium hidden sm:inline">Panel</span>
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          </button>
        )}
      </div>
    </div>
  );
}
