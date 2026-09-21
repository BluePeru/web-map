export type CrimeType =
  | 'SHOOTING'
  | 'ASSAULT'
  | 'ROBBERY'
  | 'THEFT'
  | 'ACCIDENT'
  | 'FIRE'
  | 'OTHER';

export type TemporalPrecision = 'EXACT' | 'PART_OF_DAY' | 'PUBLICATION_DATE';

export type TimeWindow = '24h' | '7d' | '30d';

export interface IncidentProperties {
  id: string;
  title: string;
  description: string;
  type: CrimeType;
  color: string;
  pulseIcon: string;
  incidentAt: string;
  createdAt: string;
  mediaUrl: string | null;
  temporalPrecision: TemporalPrecision;
}

export interface IncidentFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  properties: IncidentProperties;
}

export interface IncidentFeatureCollection {
  type: 'FeatureCollection';
  features: IncidentFeature[];
}

export interface HexagonProperties {
  h3_index: string;
  risk_score: number;
  risk_label?: string;
  top_crime?: string;
  advice?: string;
  resolution?: number;
  opacity?: number;
}
