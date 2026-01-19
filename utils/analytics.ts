import axios from "./api";

// Generate or retrieve session ID
const getSessionId = (): string => {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// Track page view
export const trackPageView = async (
  pageType: 'media_hub' | 'fonts_hub' | 'font_detail',
  pageIdentifier?: string
) => {
  try {
    const sessionId = getSessionId();
    
    await axios.post('/api/analytics/track-view', {
      page_type: pageType,
      page_identifier: pageIdentifier,
    }, {
      headers: {
        'x-session-id': sessionId
      }
    });
  } catch (error) {
    // Silently fail - don't disrupt user experience
    console.debug('Analytics tracking failed:', error);
  }
};

// Hook for React components
export const usePageViewTracking = (
  pageType: 'media_hub' | 'fonts_hub' | 'font_detail',
  pageIdentifier?: string
) => {
  if (typeof window !== 'undefined') {
    // Track on mount
    trackPageView(pageType, pageIdentifier);
  }
};
