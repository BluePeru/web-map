'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

export type TickerSentiment = 'positive' | 'negative' | 'neutral';
export type TickerTrend = 'up' | 'down' | 'neutral';

export interface TickerItem {
  id: string;
  category?: 'ALERT' | 'STATS' | 'TREND' | 'SYSTEM';
  label: string;
  value: string;
  detail?: string;
  trend?: TickerTrend;
  sentiment?: TickerSentiment;
}

export const MOCK_TICKER_ITEMS: TickerItem[] = [
  {
    id: 't-1',
    category: 'ALERT',
    label: 'ZONA MÁS ACTIVA',
    value: 'La Punta',
    detail: 'Mayor concentración de reportes en 24h',
    trend: 'up',
    sentiment: 'negative',
  },
  {
    id: 't-2',
    category: 'STATS',
    label: 'ACTIVIDAD LM',
    value: '+34%',
    detail: 'respecto al mes anterior',
    trend: 'up',
    sentiment: 'negative',
  },
  {
    id: 't-3',
    category: 'ALERT',
    label: 'PUNTOS CRÍTICOS',
    value: 'Callao Centro',
    detail: 'Alertas preventivas activadas',
    trend: 'neutral',
    sentiment: 'neutral',
  },
  {
    id: 't-4',
    category: 'SYSTEM',
    label: 'ÍNDICE DE RIESGO PSC',
    value: '0.42',
    detail: 'Nivel Medio - Estabilidad sectorial',
    trend: 'neutral',
    sentiment: 'positive',
  },
  {
    id: 't-5',
    category: 'STATS',
    label: 'TIEMPO DE RESPUESTA',
    value: '8.5 min',
    detail: '-12% reducción en despacho',
    trend: 'down',
    sentiment: 'positive',
  },
];

// Repeat 3 times per half to guarantee seamless coverage (>4500px) on 4K / Ultra-wide displays
const REPEATED_ITEMS = Array(3).fill(MOCK_TICKER_ITEMS).flat();

function TickerItemView({ item }: { item: TickerItem }) {
  const sentimentColor =
    item.sentiment === 'positive'
      ? 'text-emerald-400'
      : item.sentiment === 'negative'
      ? 'text-rose-400'
      : 'text-blue-400';

  const TrendIcon =
    item.trend === 'up'
      ? TrendingUp
      : item.trend === 'down'
      ? TrendingDown
      : Activity;

  return (
    <div className="flex items-center space-x-2 shrink-0">
      {item.category && (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono tracking-wider">
          {item.category}
        </span>
      )}
      <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
        {item.label}:
      </span>
      <span className={`font-mono text-xs font-bold flex items-center gap-1 ${sentimentColor}`}>
        <TrendIcon className="w-3.5 h-3.5 inline shrink-0" />
        {item.value}
      </span>
      {item.detail && (
        <span className="font-mono text-[11px] text-zinc-400">
          ({item.detail})
        </span>
      )}
      <span className="text-zinc-700/80 pl-4 font-mono text-[10px]" aria-hidden="true">
        ◆
      </span>
    </div>
  );
}

export default function TacticalTicker() {
  return (
    <aside
      aria-label="Cinta de información territorial en tiempo real"
      className="fixed bottom-0 left-0 right-0 z-20 h-10 w-full bg-[#09090b] border-t border-zinc-800/80 shadow-2xl overflow-hidden flex items-center select-none pointer-events-auto group [@media(hover:hover)]:hover:[&_.ticker-track]:[animation-play-state:paused] motion-reduce:[&_.ticker-track]:[animation:none]"
    >
      <div className="flex items-center whitespace-nowrap ticker-track animate-ticker">
        {/* Mitad 1: Conjunto principal */}
        <div className="flex items-center space-x-8 pr-8">
          {REPEATED_ITEMS.map((item, idx) => (
            <TickerItemView key={`m1-${item.id}-${idx}`} item={item} />
          ))}
        </div>

        {/* Mitad 2: Duplicado para desplazamiento continuo infinito */}
        <div className="flex items-center space-x-8 pr-8" aria-hidden="true">
          {REPEATED_ITEMS.map((item, idx) => (
            <TickerItemView key={`m2-${item.id}-${idx}`} item={item} />
          ))}
        </div>
      </div>
    </aside>
  );
}
