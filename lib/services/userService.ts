import { API_CONFIG, getApiUrl, getApiHeaders } from './api-config';

export interface User {
  id: string | number;  // Puede ser string (UUID) o number según el contexto
  name: string;         // Cambio de username a name
  username?: string;    // Mantener para compatibilidad
  email: string;
  password?: string;
  role: 'admin' | 'worker' | 'guest';
  active?: boolean | number;  // Base de datos usa boolean/tinyint
  status?: 'active' | 'inactive';  // Para compatibilidad con UI
  created_at?: string;
  last_active?: string;  // Cambio de last_login a last_active
  last_login?: string;   // Mantener para compatibilidad
  recipes_created?: number;
  permissions?: any;
  avatar?: string;
}

export interface SubAdmin {
  id?: number;
  sub_admin_id: string;
  name: string;
  email: string;
  password?: string;
  permissions: string[];
  status: 'active' | 'inactive';
  created_at?: string;
  created_by?: string;
}

export class UserService {
  // User CRUD operations
  static async getUserById(userId: string): Promise<User | null> {
    if (!API_CONFIG.USE_PRODUCTION) {
      const users = this.getUsersFromLocalStorage();
      return users.find(user => user.id.toString() === userId) || null;
    }

    try {
      const response = await fetch(getApiUrl(API_CONFIG.PRODUCTION.ENDPOINTS.USER_BY_ID(userId)), {
        method: 'GET',
        headers: getApiHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // User not found
        }
        throw new Error('Failed to fetch user');
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }
  }

  static async getAllUsers(): Promise<User[]> {
    if (!API_CONFIG.USE_PRODUCTION) {
      return this.getUsersFromLocalStorage();
    }

    try {
      const response = await fetch(getApiUrl(API_CONFIG.PRODUCTION.ENDPOINTS.USERS), {
        method: 'GET',
        headers: getApiHeaders(),
      });

      if (!response.ok) {
        console.error('Failed to fetch users, status:', response.status);
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      console.log('Raw API response:', data);

      if (data.success && Array.isArray(data.data)) {
        // Ensure proper type conversion
        return data.data.map((user: any) => ({
          ...user,
          id: user.id || user.user_id,
          name: user.name || user.username,
          active: user.active === 1 || user.active === true,
          status: (user.active === 1 || user.active === true) ? 'active' : 'inactive'
        }));
      }

      return [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return this.getUsersFromLocalStorage();
    }
  }

  static async createUser(user: Omit<User, 'id'>): Promise<User> {
    // Save to localStorage first
    const users = this.getUsersFromLocalStorage();
    const newUser = {
      ...user,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
    };
    users.push(newUser);
    localStorage.setItem('admin-users', JSON.stringify(users));

    // Try to save to database
    if (API_CONFIG.USE_PRODUCTION) {
      try {
        // Ensure we send the right field names to the API
        const apiData = {
          name: user.name,  // Solo enviamos 'name', no 'username'
          email: user.email,
          password: user.password,
          role: user.role,
          status: user.status || (user.active ? 'active' : 'inactive')
        };

        console.log('Sending user data to API:', apiData);

        const response = await fetch(getApiUrl(API_CONFIG.PRODUCTION.ENDPOINTS.USERS), {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify(apiData),
        });

        if (!response.ok) throw new Error('Failed to create user');

        const data = await response.json();
        console.log('Create user API response:', data);

        if (data.success && data.data) {
          // Normalize the response to match our User interface
          const createdUser = {
            ...data.data,
            id: data.data.id || newUser.id,
            name: data.data.name || data.data.username || user.name,
            username: data.data.username || data.data.name,
            status: (data.data.active === 1 || data.data.active === true) ? 'active' : 'inactive'
          };

          // Update localStorage with the server response
          const users = this.getUsersFromLocalStorage();
          const index = users.findIndex(u => u.id === newUser.id);
          if (index !== -1) {
            users[index] = createdUser;
            localStorage.setItem('admin-users', JSON.stringify(users));
          }

          return createdUser;
        }
      } catch (error) {
        console.error('Error creating user in database:', error);
      }
    }

    return newUser;
  }

  static async updateUser(id: number | string, updates: Partial<User>): Promise<boolean> {
    // Update localStorage
    const users = this.getUsersFromLocalStorage();
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      localStorage.setItem('admin-users', JSON.stringify(users));
    }

    // Try to update in database
    if (API_CONFIG.USE_PRODUCTION) {
      try {
        const response = await fetch(getApiUrl(`${API_CONFIG.PRODUCTION.ENDPOINTS.USERS}/${id}`), {
          method: 'PUT',
          headers: getApiHeaders(),
          body: JSON.stringify(updates),
        });

        return response.ok;
      } catch (error) {
        console.error('Error updating user:', error);
      }
    }

    return true;
  }

  static async deleteUser(id: number | string): Promise<boolean> {
    // Remove from localStorage
    const users = this.getUsersFromLocalStorage();
    const filtered = users.filter(u => u.id !== id);
    localStorage.setItem('admin-users', JSON.stringify(filtered));

    // Try to delete from database
    if (API_CONFIG.USE_PRODUCTION) {
      try {
        const response = await fetch(getApiUrl(`${API_CONFIG.PRODUCTION.ENDPOINTS.USERS}/${id}`), {
          method: 'DELETE',
          headers: getApiHeaders(),
        });

        return response.ok;
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }

    return true;
  }

  // SubAdmin CRUD operations
  static async getAllSubAdmins(): Promise<SubAdmin[]> {
    if (!API_CONFIG.USE_PRODUCTION) {
      return this.getSubAdminsFromLocalStorage();
    }

    try {
      const response = await fetch(getApiUrl('/sub-admins'), {
        method: 'GET',
        headers: getApiHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch sub-admins');

      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error fetching sub-admins:', error);
      return this.getSubAdminsFromLocalStorage();
    }
  }

  static async createSubAdmin(subAdmin: Omit<SubAdmin, 'id'>): Promise<SubAdmin> {
    // Save to localStorage
    const subAdmins = this.getSubAdminsFromLocalStorage();
    const newSubAdmin = {
      ...subAdmin,
      id: Date.now(),
      created_at: new Date().toISOString(),
      created_by: 'admin',
    };
    subAdmins.push(newSubAdmin);
    localStorage.setItem('sub-admins', JSON.stringify(subAdmins));

    // Try to save to database
    if (API_CONFIG.USE_PRODUCTION) {
      try {
        const response = await fetch(getApiUrl('/sub-admins'), {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify(subAdmin),
        });

        if (!response.ok) throw new Error('Failed to create sub-admin');

        const data = await response.json();
        if (data.success) {
          return data.data;
        }
      } catch (error) {
        console.error('Error creating sub-admin:', error);
      }
    }

    return newSubAdmin;
  }

  // Authentication
  /**
   * Get current user from server using token
   */
  static async getCurrentUserFromServer(): Promise<{success: boolean, user?: User, error?: string}> {
    if (!API_CONFIG.USE_PRODUCTION) {
      return { success: false, error: 'Only available in production' };
    }

    try {
      const token = localStorage.getItem('auth-token');
      if (!token) {
        return { success: false, error: 'No token found' };
      }

      const response = await fetch(getApiUrl(API_CONFIG.PRODUCTION.ENDPOINTS.VERIFY), {
        method: 'GET',
        headers: {
          ...getApiHeaders(),
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        return { success: false, error: 'Invalid token' };
      }

      const data = await response.json();
      if (data.success && data.user) {
        // Update localStorage with fresh data
        localStorage.setItem('current-user', JSON.stringify(data.user));
        return { success: true, user: data.user };
      }

      return { success: false, error: data.error || 'Invalid response' };
    } catch (error) {
      console.error('Error getting current user:', error);
      return { success: false, error: 'Network error' };
    }
  }

  static async login(username: string, password: string): Promise<{success: boolean, user?: User, token?: string, error?: string}> {
    if (!API_CONFIG.USE_PRODUCTION) {
      // Mock authentication for development
      if (username === 'admin' && password === process.env.NEXT_PUBLIC_RECIPE) {
        return {
          success: true,
          user: {
            id: 1,
            name: 'admin',
            username: 'admin',
            email: 'admin@example.com',
            role: 'admin',
            status: 'active',
          } as User,
        };
      }
      return { success: false, error: 'Invalid credentials' };
    }

    try {
      console.log('Attempting login for user:', username);
      const url = getApiUrl(API_CONFIG.PRODUCTION.ENDPOINTS.LOGIN);
      console.log('Login URL:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ username, password }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        console.error('Response not OK:', response.status, response.statusText);
        return { success: false, error: `Server error: ${response.status}` };
      }

      const data = await response.json();
      console.log('Login response data:', data);

      if (data.success && data.user) {
        // Store token and user info
        if (data.token) {
          localStorage.setItem('auth-token', data.token);
        }
        if (data.user) {
          localStorage.setItem('current-user', JSON.stringify(data.user));
          // Ensure user has correct interface
          data.user = {
            ...data.user,
            name: data.user.name || data.user.username,
            status: data.user.active ? 'active' : 'inactive'
          };
        }
        return data;
      } else if (data.error) {
        console.error('Login failed:', data.error);
        return { success: false, error: data.error };
      } else {
        return { success: false, error: 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  static async verifyAuth(): Promise<boolean> {
    const token = localStorage.getItem('auth-token');
    if (!token && API_CONFIG.USE_PRODUCTION) return false;

    if (!API_CONFIG.USE_PRODUCTION) {
      return localStorage.getItem('recipe-auth') === 'granted';
    }

    try {
      const response = await fetch(getApiUrl(API_CONFIG.PRODUCTION.ENDPOINTS.VERIFY), {
        method: 'GET',
        headers: {
          ...getApiHeaders(),
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Auth verification error:', error);
      return false;
    }
  }

  // Helper methods
  private static getUsersFromLocalStorage(): User[] {
    try {
      const users = localStorage.getItem('admin-users');
      return users ? JSON.parse(users) : [];
    } catch {
      return [];
    }
  }

  private static getSubAdminsFromLocalStorage(): SubAdmin[] {
    try {
      const subAdmins = localStorage.getItem('sub-admins');
      return subAdmins ? JSON.parse(subAdmins) : [];
    } catch {
      return [];
    }
  }

  static logout() {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('current-user');
    localStorage.removeItem('recipe-auth');
    localStorage.removeItem('user-role');
  }

  static getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem('current-user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }
}