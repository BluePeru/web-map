/**
 * Utility functions for relative time formatting of event markers.
 * Parity with blue-android / PSC specifications.
 */

export function formatEventRelativeTime(
  incidentAt?: string | null,
  createdAt?: string | null,
  nowDate?: Date
): string | null {
  const dateStr = incidentAt || createdAt;
  if (!dateStr || !dateStr.trim()) return null;

  const targetDate = new Date(dateStr);
  if (isNaN(targetDate.getTime())) return null;

  const now = nowDate || new Date();
  const diffMs = now.getTime() - targetDate.getTime();

  // Tolerance for clock-skew or slight future drift (up to 15 minutes ahead)
  if (diffMs < 0 && diffMs > -15 * 60 * 1000) {
    return 'Hoy';
  }

  // Future dates beyond tolerance or negative diffs
  if (diffMs < 0) {
    return null;
  }

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Events older than 30 days are excluded from marker rendering ("ahí mueren")
  if (diffDays > 30) {
    return null;
  }

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Hace 1 día';
  if (diffDays >= 2 && diffDays <= 6) return `Hace ${diffDays} días`;
  if (diffDays >= 7 && diffDays <= 13) return 'Hace una semana';
  if (diffDays >= 14 && diffDays <= 20) return 'Hace dos semanas';
  if (diffDays >= 21 && diffDays <= 30) return 'Hace tres semanas';

  return null;
}
