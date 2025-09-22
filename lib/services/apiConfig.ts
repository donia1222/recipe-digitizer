export const API_CONFIG = {
  USE_PRODUCTION: true, // Set to true to use production APIs

  PRODUCTION: {
    BASE_URL: 'https://web.lweb.ch/recipedigitalizer/apis',
    ENDPOINTS: {
      AUTH: '/auth-simple.php',
      RECIPES: '/recipes-simple.php',
      COMMENTS: '/comments.php',
      USERS: '/users.php'
    }
  },

  DEVELOPMENT: {
    BASE_URL: 'http://localhost:3001/api',
    ENDPOINTS: {
      AUTH: '/auth',
      RECIPES: '/recipes',
      COMMENTS: '/comments',
      USERS: '/users'
    }
  }
};

export const getApiUrl = (endpoint: string): string => {
  const config = API_CONFIG.USE_PRODUCTION ? API_CONFIG.PRODUCTION : API_CONFIG.DEVELOPMENT;
  return `${config.BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
};

export const getApiHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Add auth token if exists
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};