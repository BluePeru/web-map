# Plan de Implementación: Cinta Táctica Continua Inferior (Tactical Bottom Ticker) en Web Map

Este plan describe la hoja de ruta técnica paso a paso para implementar la cinta informativa (*ticker / marquee*) continua en [`web-map`](file:///D:/safe_app/web-map), conforme a la especificación técnica aprobada en [`docs/superpowers/specs/2026-09-24-tactical-bottom-ticker-design.md`](file:///D:/safe_app/web-map/docs/superpowers/specs/2026-09-24-tactical-bottom-ticker-design.md).

---

## Resumen de Fases

- [x] **Fase 1: Configuración de Animación en Tailwind CSS** (Extender keyframes y animation en `tailwind.config.ts`)
- [x] **Fase 2: Construcción del Componente `TacticalTicker.tsx`** (Tipado, mocks deterministas, vista de ítem, duplicación 4K y soporte de hover/accesibilidad)
- [x] **Fase 3: Integración en `HomePage` (`app/page.tsx`)** (Montar componente sobre el canvas con jerarquía z-index correcta)
- [x] **Fase 4: Pruebas Unitarias Automatizadas** (Crear `tests/TacticalTicker.test.tsx` con Vitest y Testing Library)
- [x] **Fase 5: Verificación de Calidad y Compilación** (Ejecución de test suites, `npm run build` y `npm run lint`)

---

## Detalle Paso a Paso por Fase

### Fase 1: Configuración de Animación en Tailwind CSS

1. **Editar [`tailwind.config.ts`](file:///D:/safe_app/web-map/tailwind.config.ts)**:
   - Añadir en `theme.extend`:
     ```typescript
     keyframes: {
       ticker: {
         '0%': { transform: 'translateX(0%)' },
         '100%': { transform: 'translateX(-50%)' },
       },
     },
     animation: {
       ticker: 'ticker 45s linear infinite',
     },
     ```
   - Verificar sintaxis y formateo.

---

### Fase 2: Construcción del Componente `TacticalTicker.tsx`

2. **Crear [`components/ui/TacticalTicker.tsx`](file:///D:/safe_app/web-map/components/ui/TacticalTicker.tsx)**:
   - Directiva `'use client'`.
   - Definir interfaces tipadas:
     ```typescript
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
     ```
   - Definir array base `MOCK_TICKER_ITEMS` con las métricas territoriales acordadas:
     1. `"ZONA MÁS ACTIVA"` → `"La Punta"` (detalle: `"Mayor concentración de reportes en 24h"`, `trend: 'up'`, `sentiment: 'negative'`).
     2. `"ACTIVIDAD LM"` → `"+34%"` (detalle: `"respecto al mes anterior"`, `trend: 'up'`, `sentiment: 'negative'`).
     3. `"PUNTOS CRÍTICOS"` → `"Callao Centro"` (detalle: `"Alertas preventivas activadas"`, `trend: 'neutral'`, `sentiment: 'neutral'`).
     4. `"ÍNDICE DE RIESGO PSC"` → `"0.42"` (detalle: `"Nivel Medio - Estabilidad sectorial"`, `trend: 'neutral'`, `sentiment: 'positive'`).
     5. `"TIEMPO DE RESPUESTA"` → `"8.5 min"` (detalle: `"-12% reducción en despacho"`, `trend: 'down'`, `sentiment: 'positive'`).
   - Crear repetición para ultra-wide / 4K:
     ```typescript
     const REPEATED_ITEMS = Array(3).fill(MOCK_TICKER_ITEMS).flat();
     ```
   - Implementar sub-componente `TickerItemView`:
     - Renderizar badge de categoría opcional.
     - Etiqueta en `font-mono text-[11px] text-zinc-400`.
     - Valor resaltado con su color semántico (`sentiment`: `positive` -> `text-emerald-400`, `negative` -> `text-rose-400`, `neutral` -> `text-blue-400`).
     - Icono de tendencia (`TrendingUp`, `TrendingDown`, `Activity`).
     - Detalle contextual entre paréntesis o texto secundario en `text-zinc-400`.
     - Separador táctico `◆` en `text-zinc-700/80`.
   - Implementar contenedor principal:
     - `fixed bottom-0 left-0 right-0 z-20 h-10 w-full bg-[#09090b] border-t border-zinc-800/80 shadow-2xl overflow-hidden flex items-center select-none pointer-events-auto group`
     - Clases hover y accesibilidad: `[@media(hover:hover)]:hover:[&_.ticker-track]:[animation-play-state:paused] motion-reduce:[&_.ticker-track]:[animation:none]`
     - Pista flex con Mitad 1 visible y Mitad 2 con `aria-hidden="true"`.

---

### Fase 3: Integración en `HomePage`

3. **Modificar [`app/page.tsx`](file:///D:/safe_app/web-map/app/page.tsx)**:
   - Importar `TacticalTicker` desde `@/components/ui/TacticalTicker`.
   - Renderizar `<TacticalTicker />` como elemento de UI persistente junto a `ControlPanel` y `DetailDrawer`.

---

### Fase 4: Pruebas Unitarias Automatizadas

4. **Crear [`tests/TacticalTicker.test.tsx`](file:///D:/safe_app/web-map/tests/TacticalTicker.test.tsx)**:
   - Probar que el componente se monta sin errores.
   - Probar que se renderizan los textos clave simulados (`La Punta`, `+34%`, `Callao Centro`).
   - Probar que el segundo bloque de repetición incluye `aria-hidden="true"`.
   - Probar que contiene las clases estructurales de cobertura (`fixed`, `bottom-0`, `h-10`, `bg-[#09090b]`).
   - Ejecutar la suite: `npm run test`.

---

### Fase 5: Verificación de Calidad y Compilación

5. **Ejecutar Suite Completa de Tests**:
   - `npm run test`
6. **Ejecutar Linteo**:
   - `npm run lint`
7. **Ejecutar Build de Producción**:
   - `npm run build`
8. **Confirmación Git**:
   - Registrar los cambios completados en el control de versiones.
