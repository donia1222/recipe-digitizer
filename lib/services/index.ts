/**
 * Exportación centralizada de todos los servicios
 * Esto facilita la importación y el uso en los componentes
 */

export { RecipeService } from './recipeService';
export { UserService } from './userService';
export { CommentService } from './commentService';
export { AuthService } from './authService';

export type {
  Recipe,
  Comment,
  User,
  UserRole,
  AuthState
} from './types';

/**
 * Inicialización de servicios (si es necesario)
 * Llamar esto en el layout principal o en _app.tsx
 */
export async function initializeServices() {
  // En el futuro, aquí podrías:
  // - Establecer conexión con la BD
  // - Verificar tokens de autenticación
  // - Cargar configuración inicial
  // - Sincronizar datos offline/online

  console.log('Services initialized');
}