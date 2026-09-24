# Design Spec: Cinta Táctica Continua Inferior (Tactical Bottom Ticker) en Web Map

**Fecha:** 2026-09-24  
**Estado:** Aprobado  
**Alcance:** [`web-map`](file:///D:/safe_app/web-map)  

---

## 1. Contexto y Objetivos

La plataforma **Blue Web Map** cuenta con un mapa interactivo Mapbox GL oscuro con capas de calor H3 e incidentes radar. Actualmente, en la esquina inferior izquierda se visualiza el logotipo de Mapbox y no existe un canal directo de información resumida y dinámica en tiempo real.

El objetivo de esta especificación es implementar una cinta informativa (*ticker / marquee*) continua en el borde inferior de la pantalla, que cumpla con los siguientes requisitos:

1. **Flujo continuo e ininterrumpido (Enfoque 1 - CSS Acelerado por GPU):** El contenido se desplaza suavemente de derecha a izquierda en bucle infinito, sin tirones (*zero-jank*) ni carga innecesaria en el hilo de ejecución de JavaScript.
2. **Pausa al pasar el cursor (Hover-to-Pause):** El movimiento se detiene cuando el usuario posiciona el ratón sobre cualquier punto de la cinta en dispositivos con cursor (`@media (hover: hover)`), permitiendo una lectura cómoda.
3. **Ocultación visual del logo de Mapbox:** La barra se ubica en el borde inferior (`fixed bottom-0 left-0 right-0 z-20`) con una altura de `h-10` (40px) y fondo 100% opaco `bg-[#09090b]` (idéntico al fondo cartográfico de la aplicación), eliminando cualquier trasluz del logotipo de Mapbox (`.mapboxgl-ctrl-bottom-left`, ~31px de alto con margen).
4. **Diseño de extremo a extremo sin elementos fijos:** Flujo limpio y uniforme a través de todo el ancho del viewport (sin etiquetas estáticas en el lateral).
5. **Estructura desacoplada con datos mockeados y cobertura ultra-wide (4K):** Contiene estadísticas y alertas territoriales simuladas iniciales. Para garantizar que no existan huecos visuales en ninguna resolución (incluyendo pantallas 4K de 3840px), la secuencia de ítems se replica de forma suficiente dentro de dos bloques idénticos que se desplazan de `0%` a `-50%` (o dos tracks paralelos de `0%` a `-100%`).

---

## 2. Arquitectura de Componentes

### 2.1 Componente [`TacticalTicker.tsx`](file:///D:/safe_app/web-map/components/ui/TacticalTicker.tsx)
- Ubicación: `components/ui/TacticalTicker.tsx`
- Naturaleza: Componente React cliente (`'use client'`).
- Jerarquía en [`app/page.tsx`](file:///D:/safe_app/web-map/app/page.tsx):
  ```
  <HomePage> (app/page.tsx)
    ├── <TacticalHeader />       (z-20 top-0)
    ├── <MapCanvas />            (inset-0 WebGL)
    ├── <ControlPanel />         (z-20 top-16 left-3)
    ├── <TacticalTicker />       (z-20 fixed bottom-0 left-0 right-0)
    ├── <DetailDrawer />         (z-30 fixed bottom-0 en mobile / top-16 right-0 en desktop)
    └── <B2BLeadModal />         (z-50)
  ```

### 2.2 Modelo de Datos y Mocks
Estructura tipada extensible para consumo futuro por API o SSE con polaridad/sentimiento determinista:

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

Mapeo determinista de estilos según `sentiment`:
- `positive`: texto `text-emerald-400`, borde/fondo sutil esmeralda (e.g. reducción de delincuencia, tiempos de respuesta optimizados).
- `negative`: texto `text-rose-400`, borde/fondo sutil carmesí (e.g. alza en incidentes, zonas críticas).
- `neutral`: texto `text-blue-400` o `text-zinc-300` (e.g. estabilidad territorial o información general).

Iconografía asociada según `trend`:
- `up`: `<TrendingUp className="w-3.5 h-3.5" />`
- `down`: `<TrendingDown className="w-3.5 h-3.5" />`
- `neutral`: `<Activity className="w-3.5 h-3.5" />`

Datos simulados iniciales (`MOCK_TICKER_ITEMS`):
1. `{ id: 't-1', category: 'ALERT', label: 'ZONA MÁS ACTIVA', value: 'La Punta', detail: 'Mayor concentración de reportes en 24h', trend: 'up', sentiment: 'negative' }`
2. `{ id: 't-2', category: 'STATS', label: 'ACTIVIDAD LM', value: '+34%', detail: 'respecto al mes anterior', trend: 'up', sentiment: 'negative' }`
3. `{ id: 't-3', category: 'ALERT', label: 'PUNTOS CRÍTICOS', value: 'Callao Centro', detail: 'Alertas preventivas activadas', trend: 'neutral', sentiment: 'neutral' }`
4. `{ id: 't-4', category: 'SYSTEM', label: 'ÍNDICE DE RIESGO PSC', value: '0.42', detail: 'Nivel Medio - Estabilidad sectorial', trend: 'neutral', sentiment: 'positive' }`
5. `{ id: 't-5', category: 'STATS', label: 'TIEMPO DE RESPUESTA', value: '8.5 min', detail: '-12% reducción en despacho', trend: 'down', sentiment: 'positive' }`

---

## 3. Implementación Estética y Animación

### 3.1 Clases Tailwind y Estructura Visual
- **Barra Contenedora:**
  - `h-10 w-full bg-[#09090b] border-t border-zinc-800/80 shadow-2xl`
  - `fixed bottom-0 left-0 right-0 z-20 overflow-hidden flex items-center select-none`
  - Clase `group` para pausar la animación al hacer hover en dispositivos compatibles:
    `[@media(hover:hover)]:hover:[&_.ticker-track]:[animation-play-state:paused]`
  - Clase de accesibilidad: `motion-reduce:[&_.ticker-track]:[animation:none]`
- **Pista de Animación (Track) y Prevención de Huecos (Soporte 4K):**
  - Para cubrir monitores 4K ($3840\text{px}$) sin interrupciones, el set de 5 ítems se repite 3 veces por ciclo base ($\sim 15$ ítems por mitad, cubriendo más de $4500\text{px}$).
  - La pista completa se compone de dos bloques idénticos (Mitad 1 y Mitad 2 con `aria-hidden="true"`) desplazándose de `translateX(0%)` a `translateX(-50%)`:
    ```tsx
    <div className="flex items-center whitespace-nowrap ticker-track animate-ticker">
      {/* Mitad 1 */}
      <div className="flex items-center space-x-8 pr-8">
        {REPEATED_ITEMS.map((item, idx) => (
          <TickerItemView key={`m1-${item.id}-${idx}`} item={item} />
        ))}
      </div>
      {/* Mitad 2 (Duplicado para continuidad infinita) */}
      <div className="flex items-center space-x-8 pr-8" aria-hidden="true">
        {REPEATED_ITEMS.map((item, idx) => (
          <TickerItemView key={`m2-${item.id}-${idx}`} item={item} />
        ))}
      </div>
    </div>
    ```
- **Ítems del Ticker:**
  - Etiqueta: `font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-medium`
  - Valor: `font-mono text-xs font-bold text-zinc-100`
  - Detalle: `font-mono text-[11px] text-zinc-400`
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
    ticker: 'ticker 45s linear infinite',
  },
}
```

---

## 4. Pruebas y Criterios de Aceptación

1. **Ocultación Efectiva:** El logo de Mapbox ubicado en `.mapboxgl-ctrl-bottom-left` no es visible en ninguna resolución ni proporción de pantalla gracias al fondo opaco `bg-[#09090b]` y altura `h-10`.
2. **Fluidez y Continuidad 4K:** La cinta corre de forma suave a 60 fps sin huecos en blanco ni saltos visuales al reiniciar el bucle en monitores hasta 4K.
3. **Pausa al Hover:** Al posicionar el cursor sobre la cinta en dispositivos de escritorio, la animación se congela inmediatamente; al retirar el cursor, la animación continúa desde la misma posición.
4. **Comportamiento en Dispositivos Móviles:** Si el usuario pulsa un hexágono o incidente y se despliega [`DetailDrawer.tsx`](file:///D:/safe_app/web-map/components/ui/DetailDrawer.tsx), este se superpone en `z-30` de manera limpia.
5. **Accesibilidad:** Usuarios con `prefers-reduced-motion: reduce` no experimentan movimiento continuo.
6. **Pruebas Unitarias Automatizadas:** Prueba unitaria en `tests/TacticalTicker.test.tsx` verificando renderizado de ítems, duplicación continua accesible (`aria-hidden`) y clases de animación.
7. **Validación de Código:** `npm run build` y `npm run lint` ejecutan con 0 errores y 0 advertencias.
