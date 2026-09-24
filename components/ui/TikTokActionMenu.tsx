'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers } from 'lucide-react';
import { useMapStore, MAPBOX_STYLES } from '@/store/useMapStore';

export interface TacticalActionItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  feedbackText?: string;
}

export interface TikTokActionMenuProps {
  actions?: TacticalActionItem[];
}

export default function TikTokActionMenu({ actions }: TikTokActionMenuProps) {
  const { currentStyleId, cycleMapStyle, selectedIncident, selectedHexagon } = useMapStore();
  const [feedback, setFeedback] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const currentStyle =
    MAPBOX_STYLES.find((s) => s.id === currentStyleId) || MAPBOX_STYLES[0];

  const handleCycleStyle = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Determine the next style name to display in feedback
    const currentIndex = MAPBOX_STYLES.findIndex((s) => s.id === currentStyleId);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % MAPBOX_STYLES.length;
    const nextStyle = MAPBOX_STYLES[nextIndex];

    cycleMapStyle();
    setFeedback(`Estilo: ${nextStyle.name}`);

    timeoutRef.current = setTimeout(() => {
      setFeedback(null);
    }, 1500);
  };

  // Drawer collision check: hide smoothly when DetailDrawer is open (right sidebar z-30)
  const isDrawerOpen = Boolean(selectedIncident || selectedHexagon);

  return (
    <div
      className={`fixed right-3 md:right-5 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-3.5 select-none transition-all duration-300 pointer-events-none ${
        isDrawerOpen
          ? 'opacity-0 pointer-events-none translate-x-6'
          : 'opacity-100 pointer-events-auto translate-x-0'
      }`}
    >
      {/* 1. Default Style Switcher Layer Button (TikTok Style) */}
      <div className="relative flex items-center justify-center">
        {/* Floating Lateral Micro-Toast with Framer Motion */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, x: 10, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-14 top-1/2 -translate-y-1/2 bg-zinc-950/95 border border-zinc-700/90 px-2.5 py-1 rounded-md text-xs font-mono text-zinc-100 whitespace-nowrap shadow-2xl pointer-events-none z-30"
            >
              {feedback}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleCycleStyle}
          aria-label={`Cambiar estilo de mapa (Activo: ${currentStyle.name})`}
          title={`Cambiar estilo de mapa (Activo: ${currentStyle.name})`}
          className="group relative w-11 h-11 md:w-12 md:h-12 rounded-full bg-zinc-950/85 backdrop-blur-md border border-zinc-700/80 hover:border-blue-500/80 text-zinc-200 shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
        >
          <Layers className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
        </button>
      </div>

      {/* 2. Optional additional custom actions for future extensibility */}
      {actions?.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            onClick={action.onClick}
            title={action.label}
            className="group relative w-12 h-12 rounded-full bg-zinc-950/85 backdrop-blur-md border border-zinc-700/80 hover:border-blue-500/80 text-zinc-200 shadow-2xl flex flex-col items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
          >
            <Icon className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
            <span className="text-[9px] font-mono font-bold tracking-tight text-zinc-400 group-hover:text-zinc-200 uppercase mt-0.5 leading-none">
              {action.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
