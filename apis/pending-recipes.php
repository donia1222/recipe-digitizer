<?php
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
        // Check if requesting statistics
        if (isset($_GET['stats']) && $_GET['stats'] === 'true') {
            try {
                // Get pending count
                $pendingStmt = $pdo->query("SELECT COUNT(*) as count FROM recetas_pendientes");
                $pendingCount = $pendingStmt->fetch(PDO::FETCH_ASSOC)['count'];

                // Get approved count (from main recipes table with approved status)
                $approvedStmt = $pdo->query("SELECT COUNT(*) as count FROM recipes WHERE status = 'approved'");
                $approvedCount = $approvedStmt->fetch(PDO::FETCH_ASSOC)['count'];

                // Get rejected count from audit log
                $rejectedStmt = $pdo->query("
                    SELECT COUNT(*) as count
                    FROM audit_log
                    WHERE action = 'reject_recipe' AND DATE(created_at) >= DATE(NOW() - INTERVAL 30 DAY)
                ");
                $rejectedCount = $rejectedStmt->fetch(PDO::FETCH_ASSOC)['count'];

                echo json_encode([
                    'success' => true,
                    'stats' => [
                        'pending' => (int)$pendingCount,
                        'approved' => (int)$approvedCount,
                        'rejected' => (int)$rejectedCount
                    ]
                ]);

            } catch (Exception $e) {
                echo json_encode(['error' => 'Error getting statistics: ' . $e->getMessage()]);
            }
            break;
        }

        // Obtener todas las recetas pendientes
        try {
            $stmt = $pdo->query("
                SELECT rp.*, u.name as user_name, u.role as user_role
                FROM recetas_pendientes rp
                LEFT JOIN users u ON rp.user_id = u.id
                ORDER BY rp.created_at DESC
            ");

            $pendingRecipes = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Procesar cada receta para incluir imágenes adicionales
            foreach ($pendingRecipes as &$recipe) {
                // Cargar imágenes adicionales
                $additionalImagesStmt = $pdo->prepare("SELECT * FROM recetas_pendientes_images WHERE recipe_id = ? ORDER BY display_order");
                $additionalImagesStmt->execute([$recipe['id']]);
                $additionalImages = $additionalImagesStmt->fetchAll(PDO::FETCH_ASSOC);
                $recipe['additional_images'] = $additionalImages;

                // Formatear imagen principal
                if (!empty($recipe['image_url'])) {
                    $recipe['image'] = $recipe['image_url'];
                } else if (!empty($recipe['image_base64'])) {
                    $recipe['image'] = $recipe['image_base64'];
                } else {
                    $recipe['image'] = '';
                }

                // Asegurar que date no sea null
                if (empty($recipe['date'])) {
                    $recipe['date'] = $recipe['created_at'] ?? date('Y-m-d H:i:s');
                }

                // Formatear para el frontend
                $recipe['status'] = 'pending'; // Todas son pendientes
            }

            echo json_encode([
                'success' => true,
                'data' => $pendingRecipes,
                'total' => count($pendingRecipes)
            ]);

        } catch (Exception $e) {
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'POST':
        // Aprobar o rechazar receta
        try {
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            $action = $data['action'] ?? '';
            $recipeId = $data['recipe_id'] ?? '';
            $approvedBy = $data['approved_by'] ?? 'admin-001';

            if (!$recipeId || !in_array($action, ['approve', 'reject'])) {
                echo json_encode(['error' => 'Acción o ID de receta inválido']);
                exit;
            }

            if ($action === 'approve') {
                // MOVER DE recetas_pendientes A recipes

                // 1. Obtener la receta pendiente
                $getRecipeStmt = $pdo->prepare("SELECT * FROM recetas_pendientes WHERE id = ?");
                $getRecipeStmt->execute([$recipeId]);
                $pendingRecipe = $getRecipeStmt->fetch(PDO::FETCH_ASSOC);

                if (!$pendingRecipe) {
                    echo json_encode(['error' => 'Receta pendiente no encontrada']);
                    exit;
                }

                // 2. Insertar en recipes con status 'approved'
                $insertRecipeStmt = $pdo->prepare("
                    INSERT INTO recipes (
                        recipe_id, title, ingredients, instructions, analysis,
                        image_url, image_base64, user_id, folder_id,
                        servings, original_servings, is_favorite, prep_time,
                        cook_time, difficulty, category, category_id, tags, views,
                        status, created_at, updated_at
                    ) VALUES (
                        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                        'approved', ?, NOW()
                    )
                ");

                $insertRecipeStmt->execute([
                    $pendingRecipe['recipe_id'],
                    $pendingRecipe['title'],
                    $pendingRecipe['ingredients'],
                    $pendingRecipe['instructions'],
                    $pendingRecipe['analysis'],
                    $pendingRecipe['image_url'],
                    $pendingRecipe['image_base64'],
                    $pendingRecipe['user_id'],
                    $pendingRecipe['folder_id'],
                    $pendingRecipe['servings'],
                    $pendingRecipe['original_servings'],
                    $pendingRecipe['is_favorite'],
                    $pendingRecipe['prep_time'],
                    $pendingRecipe['cook_time'],
                    $pendingRecipe['difficulty'],
                    $pendingRecipe['category'],
                    $pendingRecipe['category_id'],
                    $pendingRecipe['tags'],
                    $pendingRecipe['views'],
                    $pendingRecipe['created_at']
                ]);

                $newRecipeId = $pdo->lastInsertId();

                // 3. Mover imágenes adicionales
                $getImagesStmt = $pdo->prepare("SELECT * FROM recetas_pendientes_images WHERE recipe_id = ?");
                $getImagesStmt->execute([$recipeId]);
                $pendingImages = $getImagesStmt->fetchAll(PDO::FETCH_ASSOC);

                foreach ($pendingImages as $image) {
                    $insertImageStmt = $pdo->prepare("
                        INSERT INTO recipe_images (recipe_id, image_url, image_base64, caption, display_order, created_at)
                        VALUES (?, ?, ?, ?, ?, ?)
                    ");

                    $insertImageStmt->execute([
                        $newRecipeId,
                        $image['image_url'],
                        $image['image_base64'],
                        $image['caption'],
                        $image['display_order'],
                        $image['created_at']
                    ]);
                }

                // 4. Eliminar de tablas pendientes
                $deleteImagesStmt = $pdo->prepare("DELETE FROM recetas_pendientes_images WHERE recipe_id = ?");
                $deleteImagesStmt->execute([$recipeId]);

                $deleteRecipeStmt = $pdo->prepare("DELETE FROM recetas_pendientes WHERE id = ?");
                $deleteRecipeStmt->execute([$recipeId]);

                // 5. Log de auditoría
                try {
                    $auditStmt = $pdo->prepare("
                        INSERT INTO audit_log (user_id, action, entity_type, entity_id, details)
                        VALUES (?, 'approve_recipe', 'recipe', ?, ?)
                    ");
                    $auditStmt->execute([
                        $approvedBy,
                        $newRecipeId,
                        json_encode(['original_pending_id' => $recipeId, 'title' => $pendingRecipe['title']])
                    ]);
                } catch (Exception $auditError) {
                    // Log error but don't fail the approval
                    error_log('Audit log error: ' . $auditError->getMessage());
                }

                echo json_encode([
                    'success' => true,
                    'message' => 'Receta aprobada y movida a recipes',
                    'new_recipe_id' => $newRecipeId
                ]);

            } else if ($action === 'reject') {
                // RECHAZAR - Solo eliminar de pendientes

                // 1. Eliminar imágenes adicionales
                $deleteImagesStmt = $pdo->prepare("DELETE FROM recetas_pendientes_images WHERE recipe_id = ?");
                $deleteImagesStmt->execute([$recipeId]);

                // 2. Eliminar receta pendiente
                $deleteRecipeStmt = $pdo->prepare("DELETE FROM recetas_pendientes WHERE id = ?");
                $deleteRecipeStmt->execute([$recipeId]);

                // 3. Log de auditoría
                try {
                    $auditStmt = $pdo->prepare("
                        INSERT INTO audit_log (user_id, action, entity_type, entity_id, details)
                        VALUES (?, 'reject_recipe', 'pending_recipe', ?, ?)
                    ");
                    $auditStmt->execute([
                        $approvedBy,
                        $recipeId,
                        json_encode(['action' => 'rejected_and_deleted'])
                    ]);
                } catch (Exception $auditError) {
                    error_log('Audit log error: ' . $auditError->getMessage());
                }

                echo json_encode([
                    'success' => true,
                    'message' => 'Receta rechazada y eliminada'
                ]);
            }

        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'error' => 'Error al procesar receta: ' . $e->getMessage()
            ]);
        }
        break;

    default:
        echo json_encode(['error' => 'Método no soportado']);
}
?>