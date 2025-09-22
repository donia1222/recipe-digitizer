// Tipos compartidos para los servicios
// Cuando migres a BD, solo necesitas actualizar estos tipos

export interface Recipe {
  id: number;
  recipeId?: string;
  image: string;
  analysis: string;
  date: string;
  folderId?: string;
  title?: string;
  isFavorite?: boolean;
  servings?: number;
  originalServings?: number;
  additionalImages?: string[];
  status?: 'pending' | 'approved' | 'rejected';
  user_id?: string;
}

export interface Comment {
  id: string;
  author: string;
  role: 'admin' | 'worker' | 'guest';
  content: string;
  likes: number;
  timestamp: string;
  recipeId?: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  role: 'admin' | 'worker' | 'guest' | 'user';
  avatar?: string;
  active: boolean;
  lastActive?: string;
  recipesCreated?: number;
  permissions?: string[];
}

export type UserRole = 'admin' | 'worker' | 'guest';

export interface AuthState {
  isAuthenticated: boolean;
  role?: UserRole;
}