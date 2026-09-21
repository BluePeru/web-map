'use client';

import React from 'react';
import { useMapStore } from '@/store/useMapStore';
import { Shield, Radio, Building2 } from 'lucide-react';

export default function TacticalHeader() {
  const { visibleIncidentCount, openLeadModal } = useMapStore();

  return (
    <header className="absolute top-0 left-0 right-0 z-20 h-14 bg-zinc-950/85 backdrop-blur-md border-b border-zinc-800/80 px-3 md:px-6 flex items-center justify-between shadow-2xl">
      {/* Brand & Live status */}
      <div className="flex items-center space-x-3 md:space-x-5">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold shadow-inner">
            <Shield className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5 leading-none">
              <span className="font-extrabold tracking-wider text-sm text-zinc-100 uppercase">
                BLUE <span className="text-blue-500">INTEL</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                B1 PERÚ
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono tracking-tight hidden sm:block">
              SISTEMA DE MONITOREO TERRITORIAL
            </p>
          </div>
        </div>

        {/* Live indicator */}
        <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/50">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-mono font-medium text-emerald-400 tracking-wide flex items-center gap-1">
            <Radio className="w-3 h-3 hidden md:inline" /> LIVE (PSC 30D)
          </span>
        </div>
      </div>

      {/* Metrics & B2B CTA */}
      <div className="flex items-center space-x-3 md:space-x-5">
        {/* Incident count in viewport */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg px-2.5 py-1 flex items-baseline space-x-1.5">
          <span className="text-zinc-500 text-[10px] md:text-xs font-mono uppercase hidden sm:inline">
            Incidentes en foco:
          </span>
          <span className="font-mono text-xs md:text-sm font-bold text-zinc-100">
            {visibleIncidentCount}
          </span>
        </div>

        {/* B2B Modal Trigger */}
        <button
          onClick={openLeadModal}
          className="group relative flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-medium tracking-wide shadow-lg shadow-blue-900/30 border border-blue-400/30 transition-all duration-200 active:scale-95"
        >
          <Building2 className="w-3.5 h-3.5 text-blue-200" />
          <span className="hidden md:inline font-mono">Integración API / Empresas</span>
          <span className="md:hidden font-mono">Empresas</span>
        </button>
      </div>
    </header>
  );
}
