import { UserRole, AuthState } from './types';
import { UserService } from './userService';
import { API_CONFIG, getApiUrl, getApiHeaders } from './api-config';

/**
 * Servicio de Autenticación
 * Usa API de producción o localStorage según configuración
 */
export class AuthService {
  private static AUTH_KEY = 'recipe-auth';
  private static ROLE_KEY = 'user-role';
  private static SESSION_KEY = 'auth-session';

  /**
   * Verificar si el usuario está autenticado
   * Futuro: Verificar JWT token
   */
  static async isAuthenticated(): Promise<boolean> {
    const authStatus = localStorage.getItem(this.AUTH_KEY);
    return authStatus === 'granted';
  }

  /**
   * Obtener el rol actual del usuario
   * Futuro: Decodificar del JWT token
   */
  static async getCurrentRole(): Promise<UserRole | null> {
    const role = localStorage.getItem(this.ROLE_KEY) as UserRole;
    return role || null;
  }

  /**
   * Login como administrador
   */
  static async loginAsAdmin(password: string): Promise<{ success: boolean; message?: string; sessionId?: string }> {
    try {
      // Usar API en producción
      if (API_CONFIG.USE_PRODUCTION) {
        const response = await fetch(getApiUrl(API_CONFIG.PRODUCTION.ENDPOINTS.LOGIN), {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({ password })
        });

        const data = await response.json();

        if (data.success) {
          // Guardar sesión
          localStorage.setItem(this.AUTH_KEY, 'granted');
          localStorage.setItem(this.ROLE_KEY, 'admin');
          localStorage.setItem(this.SESSION_KEY, data.data.sessionId);
          localStorage.setItem('api-session-id', data.data.sessionId);

          // Guardar info del usuario
          localStorage.setItem('current-user', JSON.stringify(data.data.user));

          return {
            success: true,
            sessionId: data.data.sessionId
          };
        }

        return {
          success: false,
          message: data.error || 'Error de autenticación'
        };
      }

      // Usar validación local en desarrollo
      const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_RECIPE || 'Andrea1606';

      if (password === ADMIN_PASSWORD) {
        localStorage.setItem(this.AUTH_KEY, 'granted');
        localStorage.setItem(this.ROLE_KEY, 'admin');
        localStorage.setItem(this.SESSION_KEY, new Date().toISOString());

        await UserService.setCurrentUser('1');
        return { success: true };
      }

      return {
        success: false,
        message: 'Contraseña incorrecta'
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Error de conexión'
      };
    }
  }

  /**
   * Login como rol específico (worker/guest)
   * Futuro: POST /api/auth/login/role
   */
  static async loginAsRole(role: 'worker' | 'guest'): Promise<{ success: boolean }> {
    localStorage.setItem(this.ROLE_KEY, role);
    localStorage.setItem(this.SESSION_KEY, new Date().toISOString());

    // Establecer un usuario mock según el rol
    if (role === 'worker') {
      await UserService.setCurrentUser('2'); // Hans Weber por defecto
    } else {
      await UserService.setCurrentUser('4'); // Peter Fischer por defecto
    }

    return { success: true };
  }

  /**
   * Logout
   * Futuro: POST /api/auth/logout
   */
  static async logout(): Promise<void> {
    localStorage.removeItem(this.AUTH_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.SESSION_KEY);
    await UserService.setCurrentUser(null);
  }

  /**
   * Obtener estado de autenticación completo
   * Futuro: GET /api/auth/status
   */
  static async getAuthState(): Promise<AuthState> {
    const isAuthenticated = await this.isAuthenticated();
    const role = await this.getCurrentRole();

    return {
      isAuthenticated,
      role: role || undefined
    };
  }

  /**
   * Verificar si el usuario tiene un rol específico
   */
  static async hasRole(requiredRole: UserRole): Promise<boolean> {
    const currentRole = await this.getCurrentRole();

    if (!currentRole) return false;

    // Admin tiene acceso a todo
    if (currentRole === 'admin') return true;

    return currentRole === requiredRole;
  }

  /**
   * Verificar si el usuario puede realizar una acción
   * Futuro: Verificar permisos específicos del JWT
   */
  static async canPerform(action: string): Promise<boolean> {
    const role = await this.getCurrentRole();

    const permissions: Record<UserRole, string[]> = {
      admin: ['all'],
      worker: ['create_recipe', 'edit_own', 'comment', 'view'],
      guest: ['view', 'comment_view']
    };

    if (!role) return false;

    const userPermissions = permissions[role] || [];

    return userPermissions.includes('all') || userPermissions.includes(action);
  }

  /**
   * Renovar sesión
   * Futuro: POST /api/auth/refresh
   */
  static async refreshSession(): Promise<boolean> {
    const session = localStorage.getItem(this.SESSION_KEY);

    if (!session) return false;

    const sessionDate = new Date(session);
    const now = new Date();
    const diffHours = (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60);

    // Sesión expira después de 24 horas
    if (diffHours > 24) {
      await this.logout();
      return false;
    }

    // Renovar timestamp de sesión
    localStorage.setItem(this.SESSION_KEY, now.toISOString());
    return true;
  }

  /**
   * Verificar si la sesión está activa
   */
  static async isSessionValid(): Promise<boolean> {
    const session = localStorage.getItem(this.SESSION_KEY);

    if (!session) return false;

    const sessionDate = new Date(session);
    const now = new Date();
    const diffHours = (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60);

    return diffHours <= 24;
  }

  /**
   * Obtener tiempo restante de sesión en minutos
   */
  static async getSessionTimeRemaining(): Promise<number> {
    const session = localStorage.getItem(this.SESSION_KEY);

    if (!session) return 0;

    const sessionDate = new Date(session);
    const now = new Date();
    const diffMinutes = (24 * 60) - ((now.getTime() - sessionDate.getTime()) / (1000 * 60));

    return Math.max(0, Math.floor(diffMinutes));
  }

  /**
   * Cambiar rol (para desarrollo/testing)
   * En producción esto requeriría re-autenticación
   */
  static async switchRole(newRole: UserRole): Promise<void> {
    localStorage.setItem(this.ROLE_KEY, newRole);

    // Cambiar al usuario mock correspondiente
    const roleUserMap: Record<UserRole, string> = {
      admin: '1',
      worker: '2',
      guest: '4'
    };

    await UserService.setCurrentUser(roleUserMap[newRole]);
  }
}