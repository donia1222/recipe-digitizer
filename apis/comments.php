<?php
/**
 * API DE COMENTARIOS
 * Archivo: wwwdimijizp/apis/comments.php
 *
 * Endpoints:
 * GET    /comments.php?recipe_id=X - Obtener comentarios de una receta
 * POST   /comments.php - Crear nuevo comentario
 * PUT    /comments.php?id=X - Actualizar comentario (likes)
 * DELETE /comments.php?id=X - Eliminar comentario
 */

require_once 'config.php';

// Configurar CORS
setCORSHeaders();

// Obtener conexión a BD
$db = getDBConnection();

// Determinar método HTTP
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$recipeId = $_GET['recipe_id'] ?? null;

// ============================================
// RUTAS DE LA API
// ============================================

switch ($method) {
    case 'GET':
        if ($recipeId) {
            getComments($db, $recipeId);
        } else {
            sendError('ID de receta requerido', 400);
        }
        break;

    case 'POST':
        createComment($db);
        break;

    case 'PUT':
        if ($id) {
            updateComment($db, $id);
        } else {
            sendError('ID de comentario requerido', 400);
        }
        break;

    case 'DELETE':
        if ($id) {
            deleteComment($db, $id);
        } else {
            sendError('ID de comentario requerido', 400);
        }
        break;

    default:
        sendError('Método no permitido', 405);
}

// ============================================
// FUNCIONES DE API
// ============================================

/**
 * Obtener comentarios de una receta
 */
function getComments($db, $recipeId) {
    try {
        $sql = "SELECT c.*, u.name as author_name, u.avatar, u.role
                FROM comments c
                LEFT JOIN users u ON c.user_id = u.id
                WHERE c.recipe_id = :recipe_id
                ORDER BY c.created_at DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute([':recipe_id' => $recipeId]);
        $comments = $stmt->fetchAll();

        // Formatear comentarios
        $formatted = array_map(function($comment) {
            return [
                'id' => $comment['id'],
                'author' => $comment['author_name'] ?? $comment['author_name'] ?? 'Anónimo',
                'role' => $comment['author_role'] ?? $comment['role'] ?? 'guest',
                'avatar' => $comment['avatar'] ?? '👤',
                'content' => $comment['content'],
                'likes' => intval($comment['likes']),
                'likedBy' => json_decode($comment['liked_by'] ?? '[]', true),
                'timestamp' => $comment['created_at'],
                'isEdited' => (bool)$comment['is_edited']
            ];
        }, $comments);

        sendJSON([
            'success' => true,
            'data' => $formatted,
            'total' => count($formatted)
        ]);

    } catch (Exception $e) {
        logError('Error getting comments', ['recipeId' => $recipeId, 'error' => $e->getMessage()]);
        sendError('Error al obtener comentarios', 500);
    }
}

/**
 * Crear nuevo comentario
 */
function createComment($db) {
    try {
        $data = getRequestData();

        // Validar campos requeridos
        if (empty($data['recipe_id']) || empty($data['content'])) {
            sendError('ID de receta y contenido requeridos', 400);
        }

        // Verificar que la receta existe
        $stmt = $db->prepare("SELECT id FROM recipes WHERE id = :id");
        $stmt->execute([':id' => $data['recipe_id']]);
        if (!$stmt->fetch()) {
            sendError('Receta no encontrada', 404);
        }

        // Limitar longitud del comentario
        if (strlen($data['content']) > 500) {
            sendError('Comentario demasiado largo (máx 500 caracteres)', 400);
        }

        // Insertar comentario
        $commentId = generateUUID();
        $sql = "INSERT INTO comments (
                    id, recipe_id, user_id, author_name, author_role, content
                ) VALUES (
                    :id, :recipe_id, :user_id, :author_name, :author_role, :content
                )";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':id' => $commentId,
            ':recipe_id' => $data['recipe_id'],
            ':user_id' => $data['user_id'] ?? null,
            ':author_name' => $data['author'] ?? 'Anónimo',
            ':author_role' => $data['role'] ?? 'guest',
            ':content' => sanitize($data['content'])
        ]);

        // Log de auditoría
        if (!empty($data['user_id'])) {
            $sql = "INSERT INTO audit_log (user_id, action, entity_type, entity_id)
                    VALUES (:user_id, 'create_comment', 'comment', :comment_id)";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                ':user_id' => $data['user_id'],
                ':comment_id' => $commentId
            ]);
        }

        sendJSON([
            'success' => true,
            'message' => 'Comentario creado exitosamente',
            'data' => [
                'id' => $commentId,
                'timestamp' => date('Y-m-d H:i:s')
            ]
        ], 201);

    } catch (Exception $e) {
        logError('Error creating comment', ['error' => $e->getMessage()]);
        sendError('Error al crear comentario', 500);
    }
}

/**
 * Actualizar comentario (principalmente likes)
 */
function updateComment($db, $id) {
    try {
        $data = getRequestData();

        // Verificar que el comentario existe
        $stmt = $db->prepare("SELECT * FROM comments WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $comment = $stmt->fetch();

        if (!$comment) {
            sendError('Comentario no encontrado', 404);
        }

        // Manejar toggle de like
        if (isset($data['action']) && $data['action'] === 'toggle_like') {
            $userId = $data['user_id'] ?? 'anonymous_' . time();
            $likedBy = json_decode($comment['liked_by'] ?? '[]', true);

            if (in_array($userId, $likedBy)) {
                // Quitar like
                $likedBy = array_diff($likedBy, [$userId]);
                $likes = max(0, $comment['likes'] - 1);
            } else {
                // Agregar like
                $likedBy[] = $userId;
                $likes = $comment['likes'] + 1;
            }

            $sql = "UPDATE comments SET likes = :likes, liked_by = :liked_by WHERE id = :id";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                ':likes' => $likes,
                ':liked_by' => json_encode(array_values($likedBy)),
                ':id' => $id
            ]);

            sendJSON([
                'success' => true,
                'message' => 'Like actualizado',
                'data' => [
                    'likes' => $likes,
                    'userLiked' => in_array($userId, $likedBy)
                ]
            ]);
        }
        // Actualizar contenido (solo autor)
        else if (isset($data['content'])) {
            // Verificar que es el autor
            if ($comment['user_id'] !== $data['user_id']) {
                sendError('No autorizado para editar este comentario', 403);
            }

            $sql = "UPDATE comments SET content = :content, is_edited = TRUE WHERE id = :id";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                ':content' => sanitize($data['content']),
                ':id' => $id
            ]);

            sendJSON([
                'success' => true,
                'message' => 'Comentario actualizado'
            ]);
        } else {
            sendError('Acción no válida', 400);
        }

    } catch (Exception $e) {
        logError('Error updating comment', ['id' => $id, 'error' => $e->getMessage()]);
        sendError('Error al actualizar comentario', 500);
    }
}

/**
 * Eliminar comentario
 */
function deleteComment($db, $id) {
    try {
        // Verificar que existe y obtener autor
        $stmt = $db->prepare("SELECT user_id, recipe_id FROM comments WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $comment = $stmt->fetch();

        if (!$comment) {
            sendError('Comentario no encontrado', 404);
        }

        // Verificar permisos (solo autor o admin)
        $userId = $_GET['user_id'] ?? null;
        $userRole = $_GET['user_role'] ?? null;

        if ($userRole !== 'admin' && $comment['user_id'] !== $userId) {
            sendError('No autorizado para eliminar este comentario', 403);
        }

        // Eliminar comentario
        $stmt = $db->prepare("DELETE FROM comments WHERE id = :id");
        $stmt->execute([':id' => $id]);

        // Log de auditoría
        if ($userId) {
            $sql = "INSERT INTO audit_log (user_id, action, entity_type, entity_id)
                    VALUES (:user_id, 'delete_comment', 'comment', :comment_id)";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                ':user_id' => $userId,
                ':comment_id' => $id
            ]);
        }

        sendJSON([
            'success' => true,
            'message' => 'Comentario eliminado exitosamente'
        ]);

    } catch (Exception $e) {
        logError('Error deleting comment', ['id' => $id, 'error' => $e->getMessage()]);
        sendError('Error al eliminar comentario', 500);
    }
}

?>