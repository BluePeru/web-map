import { useQuery } from '@tanstack/react-query';
import { IncidentFeatureCollection } from '@/types/map';

async function fetchRecentEvents(days: number = 30): Promise<IncidentFeatureCollection> {
  const response = await fetch(`/api/events/recent?days=${days}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${response.status} al obtener incidentes.`);
  }
  return response.json();
}

export function useRecentEvents(days: number = 30) {
  return useQuery<IncidentFeatureCollection, Error>({
    queryKey: ['recentEvents', days],
    queryFn: () => fetchRecentEvents(days),
    staleTime: 60_000,
    gcTime: 600_000,
  });
}
