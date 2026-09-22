import { describe, it, expect } from 'vitest';
import { formatEventRelativeTime } from '@/lib/timeUtils';

describe('formatEventRelativeTime', () => {
  const baseDate = new Date('2026-09-21T12:00:00Z');

  it('returns "Hoy" for events that happened earlier today', () => {
    const eventDate = new Date('2026-09-21T08:00:00Z').toISOString();
    expect(formatEventRelativeTime(eventDate, null, baseDate)).toBe('Hoy');
  });

  it('returns "Hoy" for events within 15 minutes clock-skew into the future', () => {
    const eventDate = new Date('2026-09-21T12:05:00Z').toISOString();
    expect(formatEventRelativeTime(eventDate, null, baseDate)).toBe('Hoy');
  });

  it('returns null for events more than 15 minutes into the future', () => {
    const eventDate = new Date('2026-09-21T13:00:00Z').toISOString();
    expect(formatEventRelativeTime(eventDate, null, baseDate)).toBeNull();
  });

  it('returns "Hace 1 día" for events from 1 day ago', () => {
    const eventDate = new Date('2026-09-20T10:00:00Z').toISOString();
    expect(formatEventRelativeTime(eventDate, null, baseDate)).toBe('Hace 1 día');
  });

  it('returns "Hace 4 días" for events from 4 days ago', () => {
    const eventDate = new Date('2026-09-17T12:00:00Z').toISOString();
    expect(formatEventRelativeTime(eventDate, null, baseDate)).toBe('Hace 4 días');
  });

  it('returns "Hace una semana" for events between 7 and 13 days ago', () => {
    const sevenDaysAgo = new Date('2026-09-14T12:00:00Z').toISOString();
    const tenDaysAgo = new Date('2026-09-11T12:00:00Z').toISOString();
    const thirteenDaysAgo = new Date('2026-09-08T12:00:00Z').toISOString();

    expect(formatEventRelativeTime(sevenDaysAgo, null, baseDate)).toBe('Hace una semana');
    expect(formatEventRelativeTime(tenDaysAgo, null, baseDate)).toBe('Hace una semana');
    expect(formatEventRelativeTime(thirteenDaysAgo, null, baseDate)).toBe('Hace una semana');
  });

  it('returns "Hace dos semanas" for events between 14 and 20 days ago', () => {
    const fourteenDaysAgo = new Date('2026-09-07T12:00:00Z').toISOString();
    const seventeenDaysAgo = new Date('2026-09-04T12:00:00Z').toISOString();
    const twentyDaysAgo = new Date('2026-09-01T12:00:00Z').toISOString();

    expect(formatEventRelativeTime(fourteenDaysAgo, null, baseDate)).toBe('Hace dos semanas');
    expect(formatEventRelativeTime(seventeenDaysAgo, null, baseDate)).toBe('Hace dos semanas');
    expect(formatEventRelativeTime(twentyDaysAgo, null, baseDate)).toBe('Hace dos semanas');
  });

  it('returns "Hace tres semanas" for events between 21 and 30 days ago', () => {
    const twentyOneDaysAgo = new Date('2026-08-31T12:00:00Z').toISOString();
    const twentyFiveDaysAgo = new Date('2026-08-27T12:00:00Z').toISOString();
    const thirtyDaysAgo = new Date('2026-08-22T12:00:00Z').toISOString();

    expect(formatEventRelativeTime(twentyOneDaysAgo, null, baseDate)).toBe('Hace tres semanas');
    expect(formatEventRelativeTime(twentyFiveDaysAgo, null, baseDate)).toBe('Hace tres semanas');
    expect(formatEventRelativeTime(thirtyDaysAgo, null, baseDate)).toBe('Hace tres semanas');
  });

  it('returns null for events older than 30 days ("ahí muere")', () => {
    const thirtyOneDaysAgo = new Date('2026-08-21T10:00:00Z').toISOString();
    const twoMonthsAgo = new Date('2026-07-20T12:00:00Z').toISOString();

    expect(formatEventRelativeTime(thirtyOneDaysAgo, null, baseDate)).toBeNull();
    expect(formatEventRelativeTime(twoMonthsAgo, null, baseDate)).toBeNull();
  });

  it('prioritizes incidentAt over createdAt', () => {
    const incidentAt = new Date('2026-09-20T10:00:00Z').toISOString(); // 1 day ago
    const createdAt = new Date('2026-09-21T11:00:00Z').toISOString();  // Today

    expect(formatEventRelativeTime(incidentAt, createdAt, baseDate)).toBe('Hace 1 día');
  });

  it('falls back to createdAt when incidentAt is null or undefined', () => {
    const createdAt = new Date('2026-09-20T10:00:00Z').toISOString(); // 1 day ago
    expect(formatEventRelativeTime(null, createdAt, baseDate)).toBe('Hace 1 día');
    expect(formatEventRelativeTime(undefined, createdAt, baseDate)).toBe('Hace 1 día');
  });

  it('handles invalid or empty dates gracefully by returning null', () => {
    expect(formatEventRelativeTime(null, null, baseDate)).toBeNull();
    expect(formatEventRelativeTime('', '', baseDate)).toBeNull();
    expect(formatEventRelativeTime('invalid-date', null, baseDate)).toBeNull();
  });
});
