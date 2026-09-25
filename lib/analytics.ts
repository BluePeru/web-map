/**
 * Google Analytics 4 (GA4) Helper Utilities
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}

export function trackLeadSubmission(company?: string, operationType?: string) {
  trackEvent('b2b_lead_submit', {
    company: company || 'unknown',
    operation_type: operationType || 'unknown',
    page_location: typeof window !== 'undefined' ? window.location.href : '',
  });
}

export function trackIncidentSelection(incidentId: string, crimeType: string) {
  trackEvent('select_incident', {
    incident_id: incidentId,
    crime_type: crimeType,
  });
}

export function trackTimeWindowChange(timeWindow: string) {
  trackEvent('filter_time_window', {
    time_window: timeWindow,
  });
}
