import mapboxgl from 'mapbox-gl';

export function createPulsingDot(
  map: mapboxgl.Map,
  colorRgb: [number, number, number],
  size: number = 100
): {
  width: number;
  height: number;
  data: Uint8Array | Uint8ClampedArray;
  context: CanvasRenderingContext2D | null;
  onAdd: () => void;
  render: () => boolean;
} {
  const duration = 1500;
  const [r, g, b] = colorRgb;

  return {
    width: size,
    height: size,
    data: new Uint8Array(size * size * 4),
    context: null,

    onAdd: function () {
      const canvas = document.createElement('canvas');
      canvas.width = this.width;
      canvas.height = this.height;
      this.context = canvas.getContext('2d', { willReadFrequently: true });
    },

    render: function () {
      const t = (performance.now() % duration) / duration;

      const radius = (size / 2) * 0.3;
      const outerRadius = (size / 2) * 0.65 * t + radius;
      const context = this.context;

      if (!context) return false;

      context.clearRect(0, 0, this.width, this.height);

      // Outer radar pulse ring
      context.beginPath();
      context.arc(this.width / 2, this.height / 2, outerRadius, 0, Math.PI * 2);
      context.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.max(0, 1 - t)})`;
      context.fill();

      // Middle halo
      context.beginPath();
      context.arc(this.width / 2, this.height / 2, radius * 1.3, 0, Math.PI * 2);
      context.fillStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
      context.fill();

      // Inner core
      context.beginPath();
      context.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(${r}, ${g}, ${b}, 1)`;
      context.strokeStyle = '#ffffff';
      context.lineWidth = 2;
      context.fill();
      context.stroke();

      // Update pixel buffer
      this.data = context.getImageData(0, 0, this.width, this.height).data;

      // Keep animation looping
      map.triggerRepaint();

      return true;
    },
  };
}

export const PULSE_CONFIGS: { id: string; rgb: [number, number, number] }[] = [
  { id: 'pulsing-dot-danger', rgb: [239, 68, 68] }, // #EF4444
  { id: 'pulsing-dot-theft', rgb: [245, 158, 11] }, // #F59E0B
  { id: 'pulsing-dot-accident', rgb: [59, 130, 246] }, // #3B82F6
  { id: 'pulsing-dot-fire', rgb: [249, 115, 22] }, // #F97316
  { id: 'pulsing-dot-other', rgb: [107, 114, 128] }, // #6B7280
];

export function registerAllPulseImages(map: mapboxgl.Map) {
  for (const config of PULSE_CONFIGS) {
    if (!map.hasImage(config.id)) {
      map.addImage(config.id, createPulsingDot(map, config.rgb) as any, { pixelRatio: 2 });
    }
  }
}
