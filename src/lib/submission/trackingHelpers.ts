// Helper functions for ID generation, session management, and tracking data

// Generate a unique temporary ID (UUID format)
export const generateTempId = (): string => {
  // Generate a proper UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
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
  
  // Clear invalid temp_id format (not UUID)
  if (tempId && !tempId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
    console.log('Clearing invalid temp_id:', tempId);
    localStorage.removeItem('calculator_temp_id');
    tempId = null;
  }
  
  if (!tempId) {
    tempId = generateTempId();
    localStorage.setItem('calculator_temp_id', tempId);
    console.log('Generated new UUID temp_id:', tempId);
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