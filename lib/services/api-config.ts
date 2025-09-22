/**
 * Configuración de APIs
 * Cambiar USE_PRODUCTION a true para usar APIs de producción
 */

export const API_CONFIG = {
  // CAMBIAR A true PARA PRODUCCIÓN
  USE_PRODUCTION: true,

  // URLs de producción
  PRODUCTION: {
    BASE_URL: 'https://web.lweb.ch/recipedigitalizer/apis',
    ENDPOINTS: {
      // Auth
      LOGIN: '/auth-simple.php?action=login',
      LOGOUT: '/auth-simple.php?action=logout',
      VERIFY: '/auth-simple.php?action=verify',
      LOGIN_ROLE: '/auth-simple.php?action=role',

      // Recipes
      RECIPES: '/recipes-simple.php',
      RECIPE_BY_ID: (id: number) => `/recipes-simple.php?id=${id}`,

      // Comments
      COMMENTS: (recipeId: string) => `/comments.php?recipe_id=${recipeId}`,
      COMMENT_BY_ID: (id: string) => `/comments.php?id=${id}`,

      // Users
      USERS: '/users.php',
      USER_BY_ID: (id: string) => `/users.php?id=${id}`,
    }
  },

  // URLs de desarrollo (localStorage)
  DEVELOPMENT: {
    USE_LOCALSTORAGE: true
  }
};

// Helper para obtener la URL completa
export function getApiUrl(endpoint: string): string {
  if (!API_CONFIG.USE_PRODUCTION) {
    return endpoint; // En desarrollo, retornar solo el endpoint
  }

  return `${API_CONFIG.PRODUCTION.BASE_URL}${endpoint}`;
}

// Helper para obtener headers
export function getApiHeaders(includeAuth: boolean = false): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (includeAuth && API_CONFIG.USE_PRODUCTION) {
    const sessionId = localStorage.getItem('api-session-id');
    if (sessionId) {
      headers['Authorization'] = `Bearer ${sessionId}`;
    }
  }

  return headers;
}