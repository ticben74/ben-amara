
export type AnalyticsEvent = 'view_intervention' | 'start_tour' | 'post_memory' | 'generate_art' | 'qr_scan';

export const trackEvent = (event: AnalyticsEvent, metadata: Record<string, any> = {}) => {
  const stats = JSON.parse(localStorage.getItem('platform_stats') || '[]');
  const newEvent = {
    id: Math.random().toString(36).substr(2, 9),
    event,
    metadata: {
      ...metadata,
      userAgent: navigator.userAgent.slice(0, 50),
      language: navigator.language
    },
    timestamp: new Date().toISOString()
  };
  
  const updatedStats = [newEvent, ...stats].slice(0, 100); 
  localStorage.setItem('platform_stats', JSON.stringify(updatedStats));
  
  // Dispatch a custom event to notify listeners (like the Stats tab)
  window.dispatchEvent(new CustomEvent('analytics_updated', { detail: newEvent }));
};

export const getStats = () => {
  return JSON.parse(localStorage.getItem('platform_stats') || '[]');
};
