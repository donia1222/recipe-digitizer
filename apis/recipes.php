<?php
/**
 * API DE RECETAS
 * Archivo: wwwdimijizp/apis/recipes.php
 *
 * Endpoints:
 * GET    /recipes.php - Listar todas las recetas
 * GET    /recipes.php?id=X - Obtener receta específica
 * POST   /recipes.php - Crear nueva receta
 * PUT    /recipes.php?id=X - Actualizar receta
 * DELETE /recipes.php?id=X - Eliminar receta
 */

require_once 'config.php';

// Configurar CORS
setCORSHeaders();

// Obtener conexión a BD
$db = getDBConnection();

// Determinar método HTTP
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

// ============================================
// RUTAS DE LA API
// ============================================

switch ($method) {
    case 'GET':
        if ($id) {
            getRecipe($db, $id);
        } else {
            getRecipes($db);
        }
        break;

    case 'POST':
        createRecipe($db);
        break;

    case 'PUT':
        if ($id) {
            updateRecipe($db, $id);
        } else {
            sendError('ID de receta requerido', 400);
        }
        break;

    case 'DELETE':
        if ($id) {
            deleteRecipe($db, $id);
        } else {
            sendError('ID de receta requerido', 400);
        }
        break;

    default:
        sendError('Método no permitido', 405);
}

// ============================================
// FUNCIONES DE API
// ============================================

/**
 * Obtener todas las recetas
 */
function getRecipes($db) {
    try {
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = intval($_GET['limit'] ?? ITEMS_PER_PAGE);
        $offset = ($page - 1) * $limit;
        $status = $_GET['status'] ?? null;
        $search = $_GET['search'] ?? null;
        $userId = $_GET['user_id'] ?? null;
        $favorites = $_GET['favorites'] ?? null;

        // Construir query base
        $sql = "SELECT r.*, u.name as author_name, u.role as author_role,
                (SELECT COUNT(*) FROM comments WHERE recipe_id = r.id) as comment_count,
                (SELECT COUNT(*) FROM user_favorites WHERE recipe_id = r.id) as favorite_count
                FROM recipes r
                LEFT JOIN users u ON r.user_id = u.id
                WHERE 1=1";

        $params = [];

        // Filtros
        if ($status) {
            $sql .= " AND r.status = :status";
            $params[':status'] = $status;
        }

        if ($search) {
            $sql .= " AND (r.title LIKE :search OR r.analysis LIKE :search)";
            $params[':search'] = "%$search%";
        }

        if ($userId) {
            $sql .= " AND r.user_id = :user_id";
            $params[':user_id'] = $userId;
        }

        if ($favorites && $userId) {
            $sql .= " AND EXISTS (SELECT 1 FROM user_favorites WHERE recipe_id = r.id AND user_id = :fav_user_id)";
            $params[':fav_user_id'] = $userId;
        }

        // Contar total
        $countSql = "SELECT COUNT(*) FROM recipes r WHERE 1=1" .
                    str_replace("r.*,", "", substr($sql, strpos($sql, "WHERE")));
        $stmt = $db->prepare(str_replace("SELECT r.*", "SELECT COUNT(*)", $sql));
        $stmt->execute($params);
        $total = $stmt->fetchColumn();

        // Obtener resultados paginados
        $sql .= " ORDER BY r.created_at DESC LIMIT :limit OFFSET :offset";
        $stmt = $db->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $recipes = $stmt->fetchAll();

        // Formatear respuesta
        $response = [
            'success' => true,
            'data' => array_map('formatRecipe', $recipes),
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ];

        sendJSON($response);

    } catch (Exception $e) {
        logError('Error getting recipes', ['error' => $e->getMessage()]);
        sendError('Error al obtener recetas', 500);
    }
}

/**
 * Obtener una receta específica
 */
function getRecipe($db, $id) {
    try {
        $sql = "SELECT r.*, u.name as author_name, u.role as author_role,
                (SELECT COUNT(*) FROM comments WHERE recipe_id = r.id) as comment_count,
                (SELECT COUNT(*) FROM user_favorites WHERE recipe_id = r.id) as favorite_count
                FROM recipes r
                LEFT JOIN users u ON r.user_id = u.id
                WHERE r.id = :id";

        $stmt = $db->prepare($sql);
        $stmt->execute([':id' => $id]);
        $recipe = $stmt->fetch();

        if (!$recipe) {
            sendError('Receta no encontrada', 404);
        }

        // Obtener imágenes adicionales
        $sql = "SELECT * FROM recipe_images WHERE recipe_id = :id ORDER BY display_order";
        $stmt = $db->prepare($sql);
        $stmt->execute([':id' => $id]);
        $images = $stmt->fetchAll();

        $recipe['additional_images'] = $images;

        // Incrementar vistas
        $db->exec("CALL sp_increment_views($id)");

        sendJSON([
            'success' => true,
            'data' => formatRecipe($recipe)
        ]);

    } catch (Exception $e) {
        logError('Error getting recipe', ['id' => $id, 'error' => $e->getMessage()]);
        sendError('Error al obtener receta', 500);
    }
}

/**
 * Crear nueva receta
 */
function createRecipe($db) {
    try {
        $data = getRequestData();

        // Validar campos requeridos
        if (empty($data['title']) && empty($data['analysis'])) {
            sendError('Título o análisis requerido', 400);
        }

        // Preparar datos
        $recipeId = 'recipe_' . time() . '_' . rand(1000, 9999);
        $userId = $data['user_id'] ?? null;

        $sql = "INSERT INTO recipes (
                    recipe_id, title, ingredients, instructions, analysis,
                    image_url, image_base64, user_id, folder_id, status,
                    servings, original_servings, category, tags
                ) VALUES (
                    :recipe_id, :title, :ingredients, :instructions, :analysis,
                    :image_url, :image_base64, :user_id, :folder_id, :status,
                    :servings, :original_servings, :category, :tags
                )";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':recipe_id' => $recipeId,
            ':title' => $data['title'] ?? null,
            ':ingredients' => json_encode($data['ingredients'] ?? []),
            ':instructions' => $data['instructions'] ?? null,
            ':analysis' => $data['analysis'] ?? null,
            ':image_url' => $data['image_url'] ?? null,
            ':image_base64' => $data['image'] ?? null, // Temporal, migrar a URL
            ':user_id' => $userId,
            ':folder_id' => $data['folder_id'] ?? null,
            ':status' => $data['status'] ?? 'pending',
            ':servings' => $data['servings'] ?? null,
            ':original_servings' => $data['original_servings'] ?? null,
            ':category' => $data['category'] ?? null,
            ':tags' => json_encode($data['tags'] ?? [])
        ]);

        $newId = $db->lastInsertId();

        // Log de auditoría
        if ($userId) {
            $sql = "INSERT INTO audit_log (user_id, action, entity_type, entity_id)
                    VALUES (:user_id, 'create_recipe', 'recipe', :recipe_id)";
            $stmt = $db->prepare($sql);
            $stmt->execute([':user_id' => $userId, ':recipe_id' => $newId]);

            // Incrementar contador de recetas del usuario
            $db->exec("UPDATE users SET recipes_created = recipes_created + 1 WHERE id = '$userId'");
        }

        sendJSON([
            'success' => true,
            'message' => 'Receta creada exitosamente',
            'data' => [
                'id' => intval($newId),
                'recipeId' => $recipeId
            ]
        ], 201);

    } catch (Exception $e) {
        logError('Error creating recipe', ['error' => $e->getMessage()]);
        sendError('Error al crear receta', 500);
    }
}

/**
 * Actualizar receta
 */
function updateRecipe($db, $id) {
    try {
        $data = getRequestData();

        // Verificar que la receta existe
        $stmt = $db->prepare("SELECT id FROM recipes WHERE id = :id");
        $stmt->execute([':id' => $id]);
        if (!$stmt->fetch()) {
            sendError('Receta no encontrada', 404);
        }

        // Construir query de actualización dinámica
        $fields = [];
        $params = [':id' => $id];

        $allowedFields = [
            'title', 'ingredients', 'instructions', 'analysis',
            'image_url', 'status', 'servings', 'original_servings',
            'category', 'is_favorite'
        ];

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = :$field";
                $params[":$field"] = is_array($data[$field])
                    ? json_encode($data[$field])
                    : $data[$field];
            }
        }

        if (empty($fields)) {
            sendError('No hay campos para actualizar', 400);
        }

        $sql = "UPDATE recipes SET " . implode(', ', $fields) .
               ", updated_at = NOW() WHERE id = :id";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        // Log de auditoría
        if (!empty($data['user_id'])) {
            $sql = "INSERT INTO audit_log (user_id, action, entity_type, entity_id, details)
                    VALUES (:user_id, 'update_recipe', 'recipe', :recipe_id, :details)";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                ':user_id' => $data['user_id'],
                ':recipe_id' => $id,
                ':details' => json_encode(['fields' => array_keys($data)])
            ]);
        }

        sendJSON([
            'success' => true,
            'message' => 'Receta actualizada exitosamente',
            'data' => ['id' => intval($id)]
        ]);

    } catch (Exception $e) {
        logError('Error updating recipe', ['id' => $id, 'error' => $e->getMessage()]);
        sendError('Error al actualizar receta', 500);
    }
}

/**
 * Eliminar receta
 */
function deleteRecipe($db, $id) {
    try {
        // Verificar que existe
        $stmt = $db->prepare("SELECT id, user_id FROM recipes WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $recipe = $stmt->fetch();

        if (!$recipe) {
            sendError('Receta no encontrada', 404);
        }

        // Eliminar (las FK CASCADE eliminarán comentarios e imágenes)
        $stmt = $db->prepare("DELETE FROM recipes WHERE id = :id");
        $stmt->execute([':id' => $id]);

        // Log de auditoría
        $userId = $_GET['user_id'] ?? null;
        if ($userId) {
            $sql = "INSERT INTO audit_log (user_id, action, entity_type, entity_id)
                    VALUES (:user_id, 'delete_recipe', 'recipe', :recipe_id)";
            $stmt = $db->prepare($sql);
            $stmt->execute([':user_id' => $userId, ':recipe_id' => $id]);
        }

        sendJSON([
            'success' => true,
            'message' => 'Receta eliminada exitosamente'
        ]);

    } catch (Exception $e) {
        logError('Error deleting recipe', ['id' => $id, 'error' => $e->getMessage()]);
        sendError('Error al eliminar receta', 500);
    }
}

/**
 * Formatear receta para respuesta
 */
function formatRecipe($recipe) {
    return [
        'id' => intval($recipe['id']),
        'recipeId' => $recipe['recipe_id'],
        'title' => $recipe['title'],
        'ingredients' => json_decode($recipe['ingredients'] ?? '[]', true),
        'instructions' => $recipe['instructions'],
        'analysis' => $recipe['analysis'],
        'image' => $recipe['image_url'] ?? $recipe['image_base64'], // Preferir URL
        'date' => $recipe['created_at'],
        'folderId' => $recipe['folder_id'],
        'status' => $recipe['status'],
        'servings' => intval($recipe['servings'] ?? 0),
        'originalServings' => intval($recipe['original_servings'] ?? 0),
        'isFavorite' => (bool)$recipe['is_favorite'],
        'category' => $recipe['category'],
        'tags' => json_decode($recipe['tags'] ?? '[]', true),
        'views' => intval($recipe['views'] ?? 0),
        'author' => [
            'id' => $recipe['user_id'],
            'name' => $recipe['author_name'] ?? 'Anónimo',
            'role' => $recipe['author_role'] ?? 'guest'
        ],
        'stats' => [
            'comments' => intval($recipe['comment_count'] ?? 0),
            'favorites' => intval($recipe['favorite_count'] ?? 0)
        ],
        'additionalImages' => $recipe['additional_images'] ?? []
    ];
}

?>