Para que `[b1peru.com/mapa](https://b1peru.com/mapa)` no parezca un proyecto universitario ni un clon barato de Google Maps, el stack debe proyectar el estándar de plataformas como **Palantir Gotham, Flightradar24 o Kepler.gl**: una interfaz táctica, fluida a 60 FPS, en modo oscuro y con tiempos de carga sub-segundo.

Aquí tienes la arquitectura del stack frontend y visualización recomendada.

---

### 1. El Núcleo Gráfico: Deck.gl + Mapbox GL JS (o MapLibre)

El error más común en aplicaciones geoespaciales es convertir los hexágonos H3 a polígonos GeoJSON y pintarlos en Mapbox. Eso satura la memoria del navegador y congela el hilo principal al hacer zoom.

* **Motor de Capas: `@deck.gl/geo-layers` (`H3HexagonLayer`)**
* **Por qué:** Deck.gl fue creado originalmente por Uber específicamente para renderizar H3 directamente en la GPU vía WebGL/WebGPU.
* **Eficiencia:** Tu backend no necesita enviar coordenadas de vértices (`[lat, lng]` por cada esquina del hexágono). Solo envías un array plano ultra comprimido: `[{ hex: "886b36240dfffff", risk: 85 }, ...]`. Deck.gl calcula la geometría directamente en el chip de video. Renderiza 50,000 hexágonos sin perder un solo frame.


* **Mapa Base: Mapbox GL JS v3 (o MapLibre GL JS)**
* Úsalo únicamente como base cartográfica vectorizada de fondo.
* **Estética:** Estilo personalizado monocromático ultra oscuro (*Mapbox Dark* o *Carto Dark Matter*) con saturación de etiquetas reducida para que destaquen las pulsaciones y los hexágonos fluorescentes/térmicos.


* **Marcadores con Animación de Pulso (Ping/Radar):**
* Para evitar miles de nodos DOM pesados (`<div>`), los incidentes se renderizan con un **`ScatterplotLayer` de Deck.gl** o mediante una capa personalizada en Mapbox usando el **Canvas 2D API / WebGL Shader** (el clásico patrón de *pulsing dot* de Mapbox). La onda expansiva se anima en GPU por tiempo ($t$), consumiendo cero recursos de CPU.



---

### 2. Framework de Aplicación y UI

* **Framework: Next.js (App Router)**
* La ruta `/mapa` se sirve como una página con renderizado dinámico en cliente (`use client` con dynamic import `ssr: false` para el mapa), pero permitiendo que los metadatos de la página (Open Graph con captura del mapa, títulos dinámicos y descripción) se generen en el servidor para cuando compartan enlaces por WhatsApp, LinkedIn o Twitter.


* **Sistema de Diseño: Tailwind CSS + Radix UI / shadcn/ui**
* **Estética "Tactical Cyberpunk / Enterprise":** Paleta zinc/slate profundo (`bg-zinc-950`), bordes sutiles con bordes semitransparentes (`border-zinc-800/60`), desenfoques de fondo (`backdrop-blur-md`) y acentos de color en verde táctico, ámbar o rojo carmesí para el riesgo.
* Tipografía: Sans-serif limpia (Inter o Geist) combinada con una fuente monoespaciada para coordenadas y métricas (JetBrains Mono o Geist Mono).


* **Animaciones de Interfaz: Framer Motion**
* Para la apertura suave del drawer lateral cuando el usuario hace clic en un hexágono o incidente, transiciones del HUD (Head-Up Display) y loaders sin saltos de layout.



---

### 3. Gestión de Estado y Data Fetching

* **Cliente de Datos: TanStack Query (React Query)**
* **Cache & Deduplicación:** Si el usuario hace zoom out y luego zoom in a la misma zona, los datos ya están en memoria caché; no se vuelve a disparar una petición a tu backend.
* Manejo automático de *stale-while-revalidate* para refrescar eventos en segundo plano cada 30 o 60 segundos sin recargar la página.


* **Estado Local: Zustand**
* Para controlar el viewport actual (bounding box, zoom level), filtros activos (últimas 24h, 7 días, tipo de delito) y el incidente actualmente inspeccionado. Evita re-renders innecesarios en el canvas.



---

### 4. Arquitectura de Ingesta y Servicio de Datos (Backend / Edge)

Para que el mapa responda en menos de 200 ms:

1. **Agregación H3 precomputada:**
* La base de datos (PostgreSQL/PostGIS con la extensión H3 o tu servicio actual) no debe calcular H3 al vuelo en cada consulta.
* Debes tener tablas o vistas materializadas precalculadas para resoluciones clave según el zoom:
* **Zoom lejano (Vista Lima completa):** Resolución H3 `7`.
* **Zoom intermedio (Distrito):** Resolución H3 `8`.
* **Zoom cercano (Manzanas/Calles):** Resolución H3 `9`.




2. **Payload en formato Compact JSON / FlatBuffers:**
* En lugar de JSONs anidados, la API responde un array bidimensional comprimido con Brotli/Gzip: `[ ["886b3624...", 92, 14], ... ]` (Hex, Score, Total eventos).


3. **Edge Caching (Cloudflare o Vercel Edge):**
* Configura una directiva `Cache-Control: public, s-maxage=120, stale-while-revalidate=600`.
* Si 500 personas en Lima abren la web simultáneamente tras un tuit viral, el 99% de las peticiones pegan contra el Edge CDN de Lima/São Paulo, protegiendo tu servidor principal de caerse.



---

### 5. Anatomía del Layout en `[b1peru.com/mapa](https://b1peru.com/mapa)` (El Embudo de Conversión)

La página debe ser el equilibrio exacto entre herramienta pública y anzuelo comercial:

```
┌────────────────────────────────────────────────────────────────────────┐
│  [B1 LOGO]   Incidentes: 1,420 | Alto Riesgo: 28%    [API / Empresas] │ <- Header táctico
├──────────────────────────┬─────────────────────────────────────────────┤
│ CONTROLES Y FILTROS      │                                             │
│ ┌──────────────────────┐ │                                             │
│ │ Capas:               │ │                   MAPA FULLSCREEN           │
│ │ [x] Calor H3         │ │            (Deck.gl + Mapbox Dark)          │
│ │ [x] Pings en vivo    │ │                                             │
│ ├──────────────────────┤ │        ⬡⬡⬡                                  │
│ │ Ventana:             │ │       ⬡⬡[⦿]⬡⬡  <-- Incidentes con pulso     │
│ │ [ 24h ] [ 7d ]       │ │        ⬡⬡⬡                                  │
│ └──────────────────────┘ │                                             │
│                          │                                             │
│ LEAD TRAP CARD:          │ DRAWER DE DETALLE (Flotante a la derecha)   │
│ "¿Monitoreas flotas o    │ - Zona: Tomás Valle / Univ. (S.M.P.)        │
│  locales en esta zona?   │ - Índice de riesgo: 8.7/10                  │
│  [Auditar mi ruta B2B]"  │ - Precedentes: Asalto a mano armada (3d)    │
└──────────────────────────┴─────────────────────────────────────────────┘

```

* **El gancho:** El usuario civil explora libremente, ve la densidad de calor en su distrito y consulta los últimos incidentes.
* **El cierre comercial:** Al hacer clic en una zona crítica o activar un filtro avanzado, aparece un botón discreto pero prominente: *"Integra el Motor de Predicción Territorial a tu Central de Operaciones (API / Webhook)"*, derivando directo a un formulario de contacto de alto valor o WhatsApp comercial.
