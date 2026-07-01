const getBaseURL = () => {
  // If we're running on the Django port (8000), use relative URLs
  if (window.location.port === '8000') {
    return '';
  }
  // Otherwise (e.g., Vite dev server), hit the local Django server
  // We use window.location.hostname to match 'localhost' or '127.0.0.1' automatically
  return `${window.location.protocol}//${window.location.hostname}:8000`;
};

export const API_BASE_URL = getBaseURL();
export const API_URL = `${API_BASE_URL}/api`;
