'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '@/store/useMapStore';
import {
  X,
  AlertTriangle,
  Calendar,
  Clock,
  MapPin,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';

function formatRelativeTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Fecha reciente';
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) {
      const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      return `Hace ${diffMins} min`;
    }
    if (diffHours < 24) return `Hace ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  } catch {
    return 'Fecha reciente';
  }
}

function formatExactDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('es-PE', {
      timeZone: 'America/Lima',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return dateString;
  }
}

export default function DetailDrawer() {
  const { selectedIncident, selectedHexagon, clearSelection } = useMapStore();
  const [copied, setCopied] = useState(false);

  const isOpen = Boolean(selectedIncident || selectedHexagon);

  const handleCopyCoords = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ opacity: 0, x: 50, y: 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 50, y: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 240 }}
          className="fixed bottom-0 md:bottom-auto md:top-16 right-0 z-30 w-full md:w-96 max-h-[80vh] md:max-h-[calc(100vh-5rem)] md:mr-6 bg-zinc-950/95 backdrop-blur-xl border-t md:border border-zinc-800/90 rounded-t-2xl md:rounded-2xl shadow-2xl overflow-y-auto flex flex-col text-zinc-200"
        >
          {/* Header */}
          <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between sticky top-0 bg-zinc-950/95 backdrop-blur-md z-10">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-300">
                {selectedIncident ? 'Detalle de Incidente PSC' : 'Auditoría Territorial H3'}
              </h3>
            </div>
            <button
              onClick={clearSelection}
              aria-label="Cerrar panel de detalle"
              className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Incident View */}
          {selectedIncident && (
            <div className="p-5 space-y-4">
              {/* Category & Precision badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="px-2.5 py-1 rounded-md text-xs font-mono font-bold tracking-wide uppercase border"
                  style={{
                    backgroundColor: `${selectedIncident.color}15`,
                    borderColor: `${selectedIncident.color}40`,
                    color: selectedIncident.color,
                  }}
                >
                  {selectedIncident.type}
                </span>

                <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400">
                  PRECISIÓN: {selectedIncident.temporalPrecision}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-base font-bold text-zinc-100 leading-snug">
                {selectedIncident.title}
              </h2>

              {/* Description */}
              {selectedIncident.description && (
                <div className="bg-zinc-900/60 border border-zinc-800/70 rounded-xl p-3.5 text-xs text-zinc-300 leading-relaxed">
                  <p>{selectedIncident.description}</p>
                </div>
              )}

              {/* Media preview */}
              {selectedIncident.mediaUrl && (
                <div className="relative rounded-xl overflow-hidden border border-zinc-800 group">
                  <img
                    src={selectedIncident.mediaUrl}
                    alt={selectedIncident.title}
                    className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <a
                    href={selectedIncident.mediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/70 hover:bg-black/90 backdrop-blur-md rounded-md text-[10px] font-mono text-white flex items-center gap-1 border border-white/20"
                  >
                    <ExternalLink className="w-3 h-3" /> Ver original
                  </a>
                </div>
              )}

              {/* Timestamp metadata */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/60">
                <div className="space-y-1">
                  <div className="text-zinc-500 text-[10px] uppercase flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-400" /> Tiempo Relativo
                  </div>
                  <div className="text-zinc-200 font-semibold">
                    {formatRelativeTime(selectedIncident.incidentAt)}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-zinc-500 text-[10px] uppercase flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-zinc-400" /> Fecha y Hora
                  </div>
                  <div className="text-zinc-300 text-[11px]">
                    {formatExactDate(selectedIncident.incidentAt)}
                  </div>
                </div>
              </div>

              {/* System Note */}
              <p className="text-[10px] font-mono text-zinc-500 italic">
                * Evento verificado y geocodificado por el pipeline PSC para B1 Perú.
              </p>
            </div>
          )}

          {/* Hexagon View */}
          {selectedHexagon && (
            <div className="p-5 space-y-4">
              {/* Risk Level Badge & Score */}
              <div className="flex items-center justify-between bg-zinc-900/70 p-3.5 rounded-xl border border-zinc-800">
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                    Nivel de Riesgo
                  </span>
                  <div className="flex items-center space-x-2 mt-0.5">
                    {selectedHexagon.risk_score >= 0.6 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-red-950/60 border border-red-700/60 text-red-400">
                        <AlertTriangle className="w-3.5 h-3.5" /> Zona Roja
                      </span>
                    ) : selectedHexagon.risk_score >= 0.25 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-amber-950/60 border border-amber-700/60 text-amber-400">
                        <ShieldAlert className="w-3.5 h-3.5" /> Zona Precaución
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-950/60 border border-emerald-700/60 text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5" /> Zona Segura
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="text-2xl font-black tracking-tight text-zinc-100">
                    {selectedHexagon.risk_score.toFixed(2)}
                  </span>
                  <span className="text-zinc-500 text-xs block">/ 1.00</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, selectedHexagon.risk_score * 100))}%`,
                    backgroundColor:
                      selectedHexagon.risk_score >= 0.6
                        ? '#EF4444'
                        : selectedHexagon.risk_score >= 0.25
                        ? '#F97316'
                        : '#22C55E',
                  }}
                />
              </div>

              {/* Recency / Opacity info */}
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 bg-zinc-900/50 px-2.5 py-1.5 rounded-lg border border-zinc-800">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-zinc-500" /> Antigüedad de hechos:
                </span>
                <span className={selectedHexagon.opacity && selectedHexagon.opacity < 1 ? 'text-amber-400/90' : 'text-emerald-400/90'}>
                  {selectedHexagon.opacity && selectedHexagon.opacity < 1
                    ? 'Histórica (90 a 360 días)'
                    : 'Reciente (últimos 90 días)'}
                </span>
              </div>

              {/* Top Crime */}
              {selectedHexagon.top_crime && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                    Incidencia Delictiva Principal
                  </span>
                  <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs font-mono font-medium text-zinc-200">
                    {selectedHexagon.top_crime}
                  </div>
                </div>
              )}

              {/* Tactical Advice */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Recomendación Preventiva
                </span>
                <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-900/40 text-xs text-blue-200/90 leading-relaxed font-sans">
                  {selectedHexagon.advice ||
                    'Haz zoom en la zona para ver recomendaciones tácticas a nivel de calle.'}
                </div>
              </div>

              {/* H3 Index details */}
              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                <span>H3 Index:</span>
                <span className="text-zinc-400 select-all">{selectedHexagon.h3_index}</span>
              </div>
            </div>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
