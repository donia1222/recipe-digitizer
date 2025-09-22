import { Comment } from './types';

/**
 * Servicio de Comentarios
 * Actualmente usa localStorage
 * Preparado para migrar a API/BD
 */
export class CommentService {
  private static COMMENTS_KEY_PREFIX = 'recipe-comments-';

  // Comentarios mock para demostración
  private static mockComments: Record<string, Comment[]> = {
    'default': [
      {
        id: '1',
        author: 'Hans Weber',
        role: 'worker',
        content: 'Diese Rezept ist fantastisch! Die Gäste lieben es immer wieder.',
        likes: 12,
        timestamp: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: '2',
        author: 'Maria Schmidt',
        role: 'worker',
        content: 'Ich habe es heute zum ersten Mal gemacht. Super einfach und lecker!',
        likes: 8,
        timestamp: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: '3',
        author: 'Peter Fischer',
        role: 'guest',
        content: 'Schmeckt wie bei Oma! ❤️',
        likes: 15,
        timestamp: new Date(Date.now() - 172800000).toISOString()
      }
    ]
  };

  /**
   * Obtener comentarios de una receta
   * Futuro: GET /api/recipes/:recipeId/comments
   */
  static async getByRecipeId(recipeId: string): Promise<Comment[]> {
    try {
      const stored = localStorage.getItem(`${this.COMMENTS_KEY_PREFIX}${recipeId}`);

      if (!stored) {
        // Retornar comentarios mock para demostración
        if (this.mockComments[recipeId]) {
          return this.mockComments[recipeId];
        }
        return this.mockComments['default'] || [];
      }

      return JSON.parse(stored);
    } catch (error) {
      console.error('Error getting comments:', error);
      return [];
    }
  }

  /**
   * Crear nuevo comentario
   * Futuro: POST /api/recipes/:recipeId/comments
   */
  static async create(recipeId: string, commentData: Omit<Comment, 'id' | 'timestamp'>): Promise<Comment> {
    const comments = await this.getByRecipeId(recipeId);

    const newComment: Comment = {
      ...commentData,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      recipeId
    };

    comments.unshift(newComment);
    localStorage.setItem(`${this.COMMENTS_KEY_PREFIX}${recipeId}`, JSON.stringify(comments));

    return newComment;
  }

  /**
   * Actualizar comentario
   * Futuro: PUT /api/comments/:id
   */
  static async update(recipeId: string, commentId: string, updates: Partial<Comment>): Promise<Comment | null> {
    const comments = await this.getByRecipeId(recipeId);
    const index = comments.findIndex(c => c.id === commentId);

    if (index === -1) return null;

    comments[index] = { ...comments[index], ...updates };
    localStorage.setItem(`${this.COMMENTS_KEY_PREFIX}${recipeId}`, JSON.stringify(comments));

    return comments[index];
  }

  /**
   * Eliminar comentario
   * Futuro: DELETE /api/comments/:id
   */
  static async delete(recipeId: string, commentId: string): Promise<boolean> {
    const comments = await this.getByRecipeId(recipeId);
    const filtered = comments.filter(c => c.id !== commentId);

    if (filtered.length === comments.length) return false;

    localStorage.setItem(`${this.COMMENTS_KEY_PREFIX}${recipeId}`, JSON.stringify(filtered));
    return true;
  }

  /**
   * Dar like a un comentario
   * Futuro: POST /api/comments/:id/like
   */
  static async toggleLike(recipeId: string, commentId: string, increment: boolean = true): Promise<boolean> {
    const comment = await this.getCommentById(recipeId, commentId);
    if (!comment) return false;

    const newLikes = increment ? comment.likes + 1 : Math.max(0, comment.likes - 1);
    await this.update(recipeId, commentId, { likes: newLikes });

    return true;
  }

  /**
   * Obtener un comentario específico
   * Futuro: GET /api/comments/:id
   */
  static async getCommentById(recipeId: string, commentId: string): Promise<Comment | null> {
    const comments = await this.getByRecipeId(recipeId);
    return comments.find(c => c.id === commentId) || null;
  }

  /**
   * Obtener todos los comentarios de un usuario
   * Futuro: GET /api/users/:userId/comments
   */
  static async getByUserId(userId: string): Promise<Comment[]> {
    // En el futuro, esto consultaría la BD directamente
    // Por ahora, tendríamos que iterar sobre todas las recetas
    const allComments: Comment[] = [];

    // Obtener las keys de localStorage que empiezan con el prefijo
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.COMMENTS_KEY_PREFIX)) {
        const comments = JSON.parse(localStorage.getItem(key) || '[]');
        const userComments = comments.filter((c: Comment) => c.author === userId);
        allComments.push(...userComments);
      }
    }

    return allComments;
  }

  /**
   * Contar comentarios de una receta
   * Futuro: GET /api/recipes/:recipeId/comments/count
   */
  static async getCount(recipeId: string): Promise<number> {
    const comments = await this.getByRecipeId(recipeId);
    return comments.length;
  }

  /**
   * Obtener estadísticas de comentarios
   * Futuro: GET /api/comments/stats
   */
  static async getStats(): Promise<{
    totalComments: number;
    totalLikes: number;
    averagePerRecipe: number;
  }> {
    let totalComments = 0;
    let totalLikes = 0;
    let recipesWithComments = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.COMMENTS_KEY_PREFIX)) {
        recipesWithComments++;
        const comments: Comment[] = JSON.parse(localStorage.getItem(key) || '[]');
        totalComments += comments.length;
        totalLikes += comments.reduce((sum, c) => sum + c.likes, 0);
      }
    }

    return {
      totalComments,
      totalLikes,
      averagePerRecipe: recipesWithComments > 0 ? totalComments / recipesWithComments : 0
    };
  }

  /**
   * Eliminar todos los comentarios de una receta
   * Futuro: DELETE /api/recipes/:recipeId/comments
   */
  static async deleteAllByRecipeId(recipeId: string): Promise<void> {
    localStorage.removeItem(`${this.COMMENTS_KEY_PREFIX}${recipeId}`);
  }
}