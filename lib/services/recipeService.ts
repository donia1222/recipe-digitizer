import { Recipe } from './types';
import { API_CONFIG, getApiUrl, getApiHeaders } from './api-config';

// Helper function to get current user from localStorage
function getCurrentUser(): { id: string; name: string } | null {
  if (typeof window === 'undefined') return null;

  try {
    const currentUserStr = localStorage.getItem('current-user');
    if (currentUserStr) {
      const user = JSON.parse(currentUserStr);
      return { id: user.id, name: user.name };
    }
  } catch (error) {
    console.error('Error getting current user:', error);
  }

  return null;
}

/**
 * Servicio de Recetas
 * Usa APIs de producción o localStorage según configuración
 */
export class RecipeService {
  private static STORAGE_KEY = 'recipeHistory';
  private static SERVINGS_KEY = 'recipe-servings';
  private static ORIGINAL_SERVINGS_KEY = 'recipe-original-servings';
  private static IMAGES_KEY_PREFIX = 'recipe-images-';

  /**
   * Obtener recetas por usuario
   */
  static async getByUser(userId: string): Promise<Recipe[]> {
    try {
      // Usar API en producción
      if (API_CONFIG.USE_PRODUCTION) {
        const timestamp = Date.now();
        const url = getApiUrl(`${API_CONFIG.PRODUCTION.ENDPOINTS.RECIPES}?user_id=${userId}&_t=${timestamp}`);
        console.log("🌐 Calling API:", url);
        console.log("🔍 User ID parameter:", userId);

        const response = await fetch(url, {
          method: 'GET',
          headers: getApiHeaders()
        });

        if (!response.ok) {
          throw new Error('Error fetching user recipes');
        }

        const data = await response.json();
        console.log("📡 Server response:", data);
        console.log("🔍 Debug info from server:", data.debug);
        return data.data || [];
      }

      // Fallback a localStorage para desarrollo
      return this.getFromLocalStorage().filter(recipe => recipe.user_id === userId);
    } catch (error) {
      console.error('Error fetching user recipes:', error);
      return [];
    }
  }

  /**
   * Obtener todas las recetas
   */
  static async getAll(): Promise<Recipe[]> {
    try {
      // Usar API en producción
      if (API_CONFIG.USE_PRODUCTION) {
        const response = await fetch(getApiUrl(API_CONFIG.PRODUCTION.ENDPOINTS.RECIPES), {
          method: 'GET',
          headers: getApiHeaders()
        });

        if (!response.ok) {
          throw new Error('Error fetching recipes');
        }

        const data = await response.json();
        return data.data || [];
      }

      // Usar localStorage en desarrollo
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting recipes:', error);
      return [];
    }
  }

  /**
   * Obtener receta por ID
   * Futuro: GET /api/recipes/:id
   */
  static async getById(id: number): Promise<Recipe | null> {
    const recipes = await this.getAll();
    return recipes.find(r => r.id === id) || null;
  }

  /**
   * Guardar nueva receta
   */
  static async create(recipe: Omit<Recipe, 'id'>): Promise<Recipe> {
    try {
      console.log('🔵 RecipeService.create iniciado');
      console.log('🔵 USE_PRODUCTION:', API_CONFIG.USE_PRODUCTION);
      console.log('🔵 Recipe data:', recipe);

      // Usar API en producción
      if (API_CONFIG.USE_PRODUCTION) {
        const url = getApiUrl(API_CONFIG.PRODUCTION.ENDPOINTS.RECIPES);
        console.log('🔵 POST to:', url);

        // Use user_id from recipe if provided, otherwise get from localStorage
        const currentUser = getCurrentUser();
        const userId = recipe.user_id || currentUser?.id || 'admin-001';

        const payload = {
          ...recipe,
          user_id: userId,
          status: 'approved'
        };
        console.log('🔵 Payload:', payload);

        const response = await fetch(url, {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify(payload)
        });

        console.log('🔵 Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Error response:', errorText);
          throw new Error('Error creating recipe');
        }

        const data = await response.json();
        console.log('✅ Recipe created in DB:', data);

        // Retornar la receta creada
        return {
          ...recipe,
          id: data.data.id,
          recipeId: data.data.recipeId,
          date: new Date().toISOString()
        } as Recipe;
      }

      // Usar localStorage en desarrollo
      const recipes = await this.getAll();
      const newRecipe: Recipe = {
        ...recipe,
        id: Date.now(),
        date: new Date().toISOString()
      };

      recipes.unshift(newRecipe);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recipes));

      return newRecipe;
    } catch (error) {
      console.error('Error creating recipe:', error);
      throw error;
    }
  }

  /**
   * Actualizar receta existente
   * API: PUT /api/recipes/:id
   */
  static async update(id: number, updates: Partial<Recipe>): Promise<Recipe | null> {
    try {
      // Usar API en producción
      if (API_CONFIG.USE_PRODUCTION) {
        const url = getApiUrl(API_CONFIG.PRODUCTION.ENDPOINTS.RECIPE_BY_ID(id));
        console.log('🔵 PUT to:', url);
        console.log('🔵 Updates:', updates);

        const response = await fetch(url, {
          method: 'PUT',
          headers: getApiHeaders(),
          body: JSON.stringify(updates)
        });

        console.log('🔵 Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Error response:', errorText);
          throw new Error('Error updating recipe');
        }

        const data = await response.json();
        console.log('✅ Recipe updated in DB:', data);

        return data.data || null;
      }

      // Fallback a localStorage para desarrollo
      const recipes = await this.getAll();
      const index = recipes.findIndex(r => r.id === id);

      if (index === -1) return null;

      recipes[index] = { ...recipes[index], ...updates };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recipes));

      return recipes[index];
    } catch (error) {
      console.error('Error updating recipe:', error);
      return null;
    }
  }

  /**
   * Eliminar receta
   */
  static async delete(id: number): Promise<boolean> {
    try {
      // Usar API en producción
      if (API_CONFIG.USE_PRODUCTION) {
        const response = await fetch(getApiUrl(API_CONFIG.PRODUCTION.ENDPOINTS.RECIPE_BY_ID(id)), {
          method: 'DELETE',
          headers: getApiHeaders()
        });

        return response.ok;
      }

      // Usar localStorage en desarrollo
      const recipes = await this.getAll();
      const filtered = recipes.filter(r => r.id !== id);

      if (filtered.length === recipes.length) return false;

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));

      // Limpiar datos relacionados
      localStorage.removeItem(`${this.IMAGES_KEY_PREFIX}${id}`);
      localStorage.removeItem(`recipe-comments-${id}`);

      return true;
    } catch (error) {
      console.error('Error deleting recipe:', error);
      return false;
    }
  }

  /**
   * Buscar recetas
   * Futuro: GET /api/recipes/search?q=query
   */
  static async search(query: string): Promise<Recipe[]> {
    const recipes = await this.getAll();
    const lowQuery = query.toLowerCase();

    return recipes.filter(recipe =>
      recipe.title?.toLowerCase().includes(lowQuery) ||
      recipe.analysis?.toLowerCase().includes(lowQuery)
    );
  }

  /**
   * Obtener recetas favoritas
   * Futuro: GET /api/recipes?favorites=true
   */
  static async getFavorites(): Promise<Recipe[]> {
    const recipes = await this.getAll();
    return recipes.filter(r => r.isFavorite);
  }

  /**
   * Alternar favorito
   * Futuro: PATCH /api/recipes/:id/favorite
   */
  static async toggleFavorite(id: number): Promise<boolean> {
    const recipe = await this.getById(id);
    if (!recipe) return false;

    await this.update(id, { isFavorite: !recipe.isFavorite });
    return true;
  }

  /**
   * Obtener recetas pendientes
   * Futuro: GET /api/recipes?status=pending
   */
  static async getPending(): Promise<Recipe[]> {
    const recipes = await this.getAll();
    return recipes.filter(r => r.status === 'pending');
  }

  /**
   * Aprobar receta
   * Futuro: PATCH /api/recipes/:id/approve
   */
  static async approve(id: number): Promise<boolean> {
    const updated = await this.update(id, { status: 'approved' });
    return !!updated;
  }

  /**
   * Rechazar receta
   * Futuro: PATCH /api/recipes/:id/reject
   */
  static async reject(id: number): Promise<boolean> {
    const updated = await this.update(id, { status: 'rejected' });
    return !!updated;
  }

  /**
   * Guardar imágenes adicionales
   * Futuro: POST /api/recipes/:id/images
   */
  static async saveAdditionalImages(id: number, images: string[]): Promise<void> {
    // Guardar en localStorage (cache local)
    localStorage.setItem(`${this.IMAGES_KEY_PREFIX}${id}`, JSON.stringify(images));

    // Si estamos en producción, sincronizar con la base de datos
    if (API_CONFIG.USE_PRODUCTION) {
      try {
        const url = getApiUrl(API_CONFIG.PRODUCTION.ENDPOINTS.RECIPE_BY_ID(id));
        console.log('🖼️ Syncing additional images to database:', { id, imagesCount: images.length });

        const response = await fetch(url, {
          method: 'PUT',
          headers: getApiHeaders(),
          body: JSON.stringify({
            additional_images: images
          })
        });

        if (!response.ok) {
          console.error('❌ Failed to sync additional images to database');
          throw new Error('Failed to sync additional images');
        }

        const data = await response.json();
        console.log('✅ Additional images synced to database:', data);
      } catch (error) {
        console.error('❌ Error syncing additional images:', error);
        // No lanzar error para no romper la funcionalidad local
      }
    }
  }

  /**
   * Obtener imágenes adicionales
   * Carga desde la base de datos en producción, fallback a localStorage
   */
  static async getAdditionalImages(id: number): Promise<string[]> {
    // Si estamos en producción, obtener desde la base de datos
    if (API_CONFIG.USE_PRODUCTION) {
      try {
        const url = getApiUrl(API_CONFIG.PRODUCTION.ENDPOINTS.RECIPE_BY_ID(id));
        const response = await fetch(url, {
          method: 'GET',
          headers: getApiHeaders()
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.additional_images) {
            const dbImages = data.data.additional_images.map((img: any) =>
              img.image_url || img.image_base64 || ''
            ).filter((url: string) => url !== '');

            // También guardar en localStorage como cache
            localStorage.setItem(`${this.IMAGES_KEY_PREFIX}${id}`, JSON.stringify(dbImages));
            return dbImages;
          }
        }
      } catch (error) {
        console.error('❌ Error loading additional images from database:', error);
      }
    }

    // Fallback a localStorage
    const stored = localStorage.getItem(`${this.IMAGES_KEY_PREFIX}${id}`);
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Actualizar porciones
   * Futuro: PATCH /api/recipes/:id/servings
   */
  static async updateServings(id: number, servings: number, originalServings?: number): Promise<void> {
    localStorage.setItem(this.SERVINGS_KEY, servings.toString());
    if (originalServings) {
      localStorage.setItem(this.ORIGINAL_SERVINGS_KEY, originalServings.toString());
    }
  }

  /**
   * Obtener porciones actuales
   */
  static async getCurrentServings(): Promise<{ current: string; original: string }> {
    return {
      current: localStorage.getItem(this.SERVINGS_KEY) || '',
      original: localStorage.getItem(this.ORIGINAL_SERVINGS_KEY) || ''
    };
  }
}