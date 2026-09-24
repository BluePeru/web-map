'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import TacticalHeader from '@/components/ui/TacticalHeader';
import ControlPanel from '@/components/ui/ControlPanel';
import DetailDrawer from '@/components/ui/DetailDrawer';
import TacticalTicker from '@/components/ui/TacticalTicker';
import TikTokActionMenu from '@/components/ui/TikTokActionMenu';
import { B2BLeadModal } from '@/components/ui/LeadComponents';
import { useMapStore } from '@/store/useMapStore';
import { Loader2 } from 'lucide-react';

// Dynamic import with SSR disabled for Mapbox GL JS WebGL canvas
const MapCanvas = dynamic(() => import('@/components/map/MapCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#09090b] flex flex-col items-center justify-center space-y-3">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-blue-500/20 animate-ping absolute" />
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
      <p className="font-mono text-xs tracking-wider text-zinc-400">
        INICIALIZANDO MOTOR CARTOGRÁFICO GL...
      </p>
    </div>
  ),
});

export default function HomePage() {
  const { setHudCollapsed } = useMapStore();

  // Restore collapsed state preference on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('blue_hud_collapsed');
      if (saved === 'true') {
        setHudCollapsed(true);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [setHudCollapsed]);

  return (
    <main className="relative w-screen h-screen overflow-hidden select-none bg-[#09090b]">
      {/* 1. Top Tactical Bar */}
      <TacticalHeader />

      {/* 2. Fullscreen Cartographic Canvas */}
      <div className="absolute inset-0 w-full h-full">
        <MapCanvas />
      </div>

      {/* 3. Collapsible HUD Control Panel */}
      <ControlPanel />

      {/* 4. Bottom Continuous Tactical Ticker */}
      <TacticalTicker />

      {/* 5. Right Tactical Action Menu (TikTok-style) */}
      <TikTokActionMenu />

      {/* 6. Incident / Hexagon Detail Drawer */}
      <DetailDrawer />

      {/* 7. Unified Modal for B2B Leads */}
      <B2BLeadModal />
    </main>
  );
}
