<?php
/**
 * API DE FAVORITOS
 * Archivo: wwwdimijizp/apis/favorites.php
 *
 * Endpoints:
 * GET    /favorites.php?user_id=X - Obtener favoritos del usuario
 * POST   /favorites.php - Toggle favorito {user_id, recipe_id}
 */

// Incluir archivo de configuración
require_once 'config.php';

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

// Si es una petición OPTIONS, terminar aquí
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Conexión a BD usando la función del config
try {
    $pdo = getDBConnection();
} catch (Exception $e) {
    echo json_encode(['error' => 'Error de conexión BD']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Obtener favoritos de un usuario
        try {
            $user_id = $_GET['user_id'] ?? null;

            if (!$user_id) {
                echo json_encode([
                    'success' => false,
                    'error' => 'user_id es requerido'
                ]);
                exit;
            }

            $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
            $limit = isset($_GET['limit']) ? max(1, min(50, (int)$_GET['limit'])) : 6;
            $offset = ($page - 1) * $limit;

            error_log("DEBUG: Favorites - user_id: {$user_id}, page: {$page}, limit: {$limit}");

            // Obtener el conteo total de favoritos del usuario
            $countStmt = $pdo->prepare("
                SELECT COUNT(*)
                FROM user_favorites uf
                INNER JOIN recipes r ON uf.recipe_id = r.id
                WHERE uf.user_id = ?
            ");
            $countStmt->execute([$user_id]);
            $totalFavorites = (int)$countStmt->fetchColumn();

            // Obtener favoritos con datos completos de recetas (con paginación)
            $stmt = $pdo->prepare("
                SELECT
                    r.id,
                    r.recipe_id,
                    r.title,
                    r.analysis,
                    r.image_url,
                    r.image_base64,
                    r.user_id,
                    r.category_id,
                    r.servings,
                    r.original_servings,
                    r.status,
                    r.created_at,
                    r.updated_at,
                    c.name as category_name,
                    c.color as category_color,
                    uf.created_at as favorited_at,
                    1 as is_favorite
                FROM user_favorites uf
                INNER JOIN recipes r ON uf.recipe_id = r.id
                LEFT JOIN recipe_categories c ON r.category_id = c.id
                WHERE uf.user_id = ?
                ORDER BY uf.created_at DESC
                LIMIT ? OFFSET ?
            ");
            $stmt->execute([$user_id, $limit, $offset]);
            $favorites = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Procesar cada receta favorita (igual que recipes-simple.php)
            foreach ($favorites as &$recipe) {
                // Procesar imagen principal
                if (!empty($recipe['image_url'])) {
                    $recipe['image'] = $recipe['image_url'];
                } else if (!empty($recipe['image_base64'])) {
                    $recipe['image'] = $recipe['image_base64'];
                } else {
                    $recipe['image'] = '';
                }

                // Cargar imágenes adicionales
                $additionalImagesStmt = $pdo->prepare("SELECT * FROM recipe_images WHERE recipe_id = ? ORDER BY display_order");
                $additionalImagesStmt->execute([$recipe['id']]);
                $additionalImages = $additionalImagesStmt->fetchAll(PDO::FETCH_ASSOC);
                $recipe['additional_images'] = $additionalImages;

                // Asegurar que date no sea null
                if (empty($recipe['date'])) {
                    $recipe['date'] = $recipe['created_at'] ?? date('Y-m-d H:i:s');
                }
            }

            echo json_encode([
                'success' => true,
                'data' => $favorites,
                'total' => $totalFavorites,
                'page' => $page,
                'limit' => $limit,
                'totalPages' => ceil($totalFavorites / $limit)
            ]);

        } catch (Exception $e) {
            error_log('Error getting favorites: ' . $e->getMessage());
            echo json_encode([
                'success' => false,
                'error' => 'Error al obtener favoritos: ' . $e->getMessage()
            ]);
        }
        break;

    case 'POST':
        // Toggle favorito
        try {
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            $user_id = $data['user_id'] ?? null;
            $recipe_id = $data['recipe_id'] ?? null;

            if (!$user_id || !$recipe_id) {
                echo json_encode([
                    'success' => false,
                    'error' => 'user_id y recipe_id son requeridos'
                ]);
                exit;
            }

            error_log("DEBUG: Toggle favorite - user_id: {$user_id}, recipe_id: {$recipe_id}");

            // Verificar si la receta existe
            $checkRecipeStmt = $pdo->prepare("SELECT id FROM recipes WHERE id = ?");
            $checkRecipeStmt->execute([$recipe_id]);
            if (!$checkRecipeStmt->fetch()) {
                echo json_encode([
                    'success' => false,
                    'error' => 'Receta no encontrada'
                ]);
                exit;
            }

            // Verificar si el usuario existe, si no, crearlo automáticamente
            $checkUserStmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
            $checkUserStmt->execute([$user_id]);
            if (!$checkUserStmt->fetch()) {
                // Auto-crear usuario si no existe (para workers/guests)
                try {
                    $insertUserStmt = $pdo->prepare("INSERT INTO users (id, name, role, active, created_at) VALUES (?, ?, ?, 1, NOW())");

                    // Determinar nombre y rol basado en el user_id
                    $userName = 'Usuario #' . substr($user_id, -4);
                    $userRole = 'guest';

                    if (strpos($user_id, 'worker') !== false) {
                        $userName = 'Worker #' . substr($user_id, -4);
                        $userRole = 'worker';
                    } elseif (strpos($user_id, 'admin') !== false) {
                        $userName = 'Admin #' . substr($user_id, -4);
                        $userRole = 'admin';
                    }

                    $insertUserStmt->execute([$user_id, $userName, $userRole]);
                    error_log("✅ Auto-created user: " . $user_id . " (" . $userName . ")");
                } catch (Exception $e) {
                    error_log("❌ Error creating user: " . $e->getMessage());
                    echo json_encode([
                        'success' => false,
                        'error' => 'Error al crear usuario automáticamente'
                    ]);
                    exit;
                }
            }

            // Usar el stored procedure para toggle favorito
            $stmt = $pdo->prepare("CALL sp_toggle_favorite(?, ?)");
            $stmt->execute([$user_id, $recipe_id]);

            // Verificar el estado actual después del toggle
            $checkStmt = $pdo->prepare("SELECT 1 FROM user_favorites WHERE user_id = ? AND recipe_id = ?");
            $checkStmt->execute([$user_id, $recipe_id]);
            $isFavorite = $checkStmt->fetch() ? true : false;

            // Si se agregó a favoritos, verificar/crear categoría "Favoriten" para este usuario
            if ($isFavorite) {
                try {
                    // Verificar si existe categoría "Favoriten" para este usuario
                    $checkCategoryStmt = $pdo->prepare("
                        SELECT id FROM recipe_categories
                        WHERE name = 'Favoriten' AND (user_id = ? OR user_id IS NULL)
                        LIMIT 1
                    ");
                    $checkCategoryStmt->execute([$user_id]);

                    if (!$checkCategoryStmt->fetch()) {
                        // Crear categoría "Favoriten" para este usuario
                        $createCategoryStmt = $pdo->prepare("
                            INSERT INTO recipe_categories (id, name, color, user_id, created_at)
                            VALUES (?, 'Favoriten', '#fbbf24', ?, NOW())
                        ");

                        $categoryId = 'favorites_' . $user_id;
                        $createCategoryStmt->execute([$categoryId, $user_id]);

                        error_log("✅ Auto-created 'Favoriten' category for user: " . $user_id);
                    }
                } catch (Exception $e) {
                    error_log("❌ Error creating Favoriten category: " . $e->getMessage());
                    // No fallar el toggle por error de categoría
                }
            }

            echo json_encode([
                'success' => true,
                'is_favorite' => $isFavorite,
                'message' => $isFavorite ? 'Agregado a favoritos' : 'Eliminado de favoritos'
            ]);

        } catch (Exception $e) {
            error_log('Error toggling favorite: ' . $e->getMessage());
            echo json_encode([
                'success' => false,
                'error' => 'Error al procesar favorito: ' . $e->getMessage()
            ]);
        }
        break;

    default:
        echo json_encode([
            'success' => false,
            'error' => 'Método no permitido'
        ]);
        http_response_code(405);
        break;
}
?>