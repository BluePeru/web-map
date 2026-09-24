# Design Spec: Cinta Táctica Continua Inferior (Tactical Bottom Ticker) en Web Map

**Fecha:** 2026-09-24  
**Estado:** Aprobado  
**Alcance:** [`web-map`](file:///D:/safe_app/web-map)  

---

## 1. Contexto y Objetivos

La plataforma **Blue Web Map** cuenta con un mapa interactivo Mapbox GL oscuro con capas de calor H3 e incidentes radar. Actualmente, en la esquina inferior izquierda se visualiza el logotipo de Mapbox y no existe un canal directo de información resumida y dinámica en tiempo real.

El objetivo de esta especificación es implementar una cinta informativa (*ticker / marquee*) continua en el borde inferior de la pantalla, que cumpla con los siguientes requisitos:

1. **Flujo continuo e ininterrumpido (Enfoque 1 - CSS Acelerado por GPU):** El contenido se desplaza suavemente de derecha a izquierda en bucle infinito, sin tirones (*zero-jank*) ni carga innecesaria en el hilo de ejecución de JavaScript.
2. **Pausa al pasar el cursor (Hover-to-Pause):** El movimiento se detiene cuando el usuario posiciona el ratón sobre cualquier punto de la cinta, permitiendo una lectura cómoda.
3. **Ocultación visual del logo de Mapbox:** La barra se ubica en el borde inferior (`bottom-0 left-0 right-0 z-20`) con una altura de `h-10` (40px) y fondo translúcido oscuro (`bg-zinc-950/95`), cubriendo completamente la insignia de Mapbox (`.mapboxgl-ctrl-bottom-left`, ~31px de alto con margen).
4. **Diseño de extremo a extremo sin elementos fijos:** Flujo limpio y uniforme a través de todo el ancho del viewport (sin etiquetas estáticas en el lateral).
5. **Estructura desacoplada con datos mockeados:** Contiene estadísticas y alertas territoriales simuladas iniciales, con duplicación automática del conjunto para garantizar que en cualquier resolución (desde smartphones hasta pantallas 4K) no existan huecos visuales.

---

## 2. Arquitectura de Componentes

### 2.1 Componente [`TacticalTicker.tsx`](file:///D:/safe_app/web-map/components/ui/TacticalTicker.tsx)
- Ubicación: `components/ui/TacticalTicker.tsx`
- Naturaleza: Componente React cliente (`'use client'`).
- Jerarquía:
  ```
  <HomePage> (app/page.tsx)
    ├── <TacticalHeader />       (z-20 top-0)
    ├── <MapCanvas />            (inset-0 WebGL)
    ├── <ControlPanel />         (z-20 top-16 left-3)
    ├── <TacticalTicker />       (z-20 bottom-0 left-0 right-0)
    ├── <DetailDrawer />         (z-30 fixed bottom-0 en mobile / top-16 right-0 en desktop)
    └── <B2BLeadModal />         (z-50)
  ```

### 2.2 Modelo de Datos y Mocks
Estructura tipada extensible para consumo futuro por API o SSE:

```typescript
export interface TickerItem {
  id: string;
  category?: 'ALERT' | 'STATS' | 'TREND' | 'SYSTEM';
  label: string;
  value: string;
  detail?: string;
  trend?: 'up' | 'down' | 'neutral';
}
```

Datos simulados iniciales:
- `id: 't-1'`: `"ZONA MÁS ACTIVA"` → `"La Punta"` (detalle: `"Mayor concentración de reportes en 24h"`, tendencia `neutral`).
- `id: 't-2'`: `"ACTIVIDAD LM"` → `"+34%"` (detalle: `"respecto al mes anterior"`, tendencia `up`).
- `id: 't-3'`: `"PUNTOS CRÍTICOS"` → `"Callao Centro"` (detalle: `"Alertas preventivas activadas"`, tendencia `up`).
- `id: 't-4'`: `"ÍNDICE DE RIESGO PSC"` → `"0.42"` (detalle: `"Nivel Medio - Estabilidad sectorial"`, tendencia `neutral`).
- `id: 't-5'`: `"TIEMPO DE RESPUESTA"` → `"8.5 min"` (detalle: `"-12% reducción en despacho"`, tendencia `down`).

---

## 3. Implementación Estética y Animación

### 3.1 Clases Tailwind y Estructura Visual
- **Barra Contenedora:**
  - `h-10 w-full bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800/80 shadow-2xl`
  - `fixed bottom-0 left-0 right-0 z-20 overflow-hidden flex items-center select-none`
  - Clase `group` para controlar el estado de animación en los hijos.
- **Pista de Animación (Track):**
  - Dos listas idénticas del array de ítems renderizadas una tras otra dentro de un contenedor flex:
  - `flex items-center space-x-8 whitespace-nowrap animate-ticker group-hover:[animation-play-state:paused]`
- **Ítems del Ticker:**
  - Etiqueta: `font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-medium`
  - Valor: `font-mono text-xs font-bold text-zinc-100`
  - Detalle: `font-mono text-[11px] text-zinc-400`
  - Indicador de tendencia:
    - `up`: `text-rose-400` con icono `TrendingUp` o `text-emerald-400` según contexto de mejora/alerta.
    - `down`: `text-emerald-400` con icono `TrendingDown`.
    - `neutral`: `text-blue-400` con icono `Activity`.
  - Separadores tácticos entre ítems: rombo sutil (`◆`) en `text-zinc-700/80`.

### 3.2 Keyframes y Configuración CSS
En [`tailwind.config.ts`](file:///D:/safe_app/web-map/tailwind.config.ts):
```typescript
extend: {
  keyframes: {
    ticker: {
      '0%': { transform: 'translateX(0%)' },
      '100%': { transform: 'translateX(-50%)' },
    },
  },
  animation: {
    ticker: 'ticker 40s linear infinite',
  },
}
```
Con dos listas idénticas (`[...ITEMS, ...ITEMS]`) y `translateX(-50%)`, el desplazamiento se vuelve matemáticamente continuo y sin saltos visuales.

---

## 4. Pruebas y Criterios de Aceptación

1. **Ocultación Efectiva:** El logo de Mapbox ubicado en `.mapboxgl-ctrl-bottom-left` no debe ser visible en ninguna resolución ni proporción de pantalla.
2. **Fluidez:** La cinta debe correr de forma suave a 60 fps sin bloquear la interacción con el mapa ni el paneo/zoom.
3. **Pausa al Hover:** Al posicionar el cursor sobre la cinta, la animación se congela inmediatamente; al retirar el cursor, la animación continúa desde la misma posición.
4. **Comportamiento en Dispositivos Móviles:** Si el usuario pulsa un hexágono o incidente y se despliega [`DetailDrawer.tsx`](file:///D:/safe_app/web-map/components/ui/DetailDrawer.tsx), este se superpone en `z-30` de manera limpia.
5. **Validación de Código:** `npm run build` y `npm run lint` ejecutan sin errores de TypeScript ni advertencias de Next.js.
