// Helper functions for ID generation, session management, and tracking data

// Generate a unique temporary ID
export const generateTempId = (): string => {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get session ID from browser
export const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('calculator_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('calculator_session_id', sessionId);
  }
  return sessionId;
};

// Get or create temp ID from localStorage
export const getTempId = (): string => {
  let tempId = localStorage.getItem('calculator_temp_id');
  if (!tempId) {
    tempId = generateTempId();
    localStorage.setItem('calculator_temp_id', tempId);
  }
  return tempId;
};

// Get tracking data from browser/URL
export const getTrackingData = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    user_agent: navigator.userAgent,
    referrer_url: document.referrer,
    utm_source: urlParams.get('utm_source'),
    utm_medium: urlParams.get('utm_medium'),
    utm_campaign: urlParams.get('utm_campaign'),
  };
};