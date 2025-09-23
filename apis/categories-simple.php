<?php
// Incluir archivo de configuración
require_once 'config.php';

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, Cache-Control");
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
        // Obtener todas las categorías
        try {
            $stmt = $pdo->query("
                SELECT c.*,
                       (SELECT COUNT(*) FROM recipes WHERE category_id = c.id) as recipe_count,
                       parent.name as parent_name
                FROM recipe_categories c
                LEFT JOIN recipe_categories parent ON c.parent_id = parent.id
                WHERE c.is_active = 1
                ORDER BY c.display_order, c.name
            ");

            $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'data' => $categories
            ]);
        } catch (Exception $e) {
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'POST':
        // Crear nueva categoría
        try {
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            error_log('POST category data received: ' . print_r($data, true));

            // Validar datos
            if (empty($data['name'])) {
                echo json_encode(['success' => false, 'error' => 'Nombre de categoría requerido']);
                exit;
            }

            // Insertar categoría
            $sql = "INSERT INTO recipe_categories (
                        name, color, parent_id, user_id, display_order
                    ) VALUES (
                        :name, :color, :parent_id, :user_id, :display_order
                    )";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':name' => $data['name'],
                ':color' => $data['color'] ?? '#3b82f6',
                ':parent_id' => $data['parent_id'] ?? null,
                ':user_id' => $data['user_id'] ?? null,
                ':display_order' => $data['display_order'] ?? 0
            ]);

            $newId = $pdo->lastInsertId();

            echo json_encode([
                'success' => true,
                'message' => 'Categoría creada exitosamente',
                'data' => [
                    'id' => $newId
                ]
            ]);

        } catch (Exception $e) {
            error_log('Error creating category: ' . $e->getMessage());
            echo json_encode([
                'success' => false,
                'error' => 'Error al crear categoría: ' . $e->getMessage()
            ]);
        }
        break;

    case 'PUT':
        // Actualizar categoría
        try {
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            $id = $_GET['id'] ?? null;
            if (!$id) {
                echo json_encode(['error' => 'ID de categoría requerido']);
                exit;
            }

            // Verificar que la categoría existe
            $checkStmt = $pdo->prepare("SELECT id FROM recipe_categories WHERE id = :id");
            $checkStmt->execute([':id' => $id]);
            if (!$checkStmt->fetch()) {
                echo json_encode(['error' => 'Categoría no encontrada']);
                exit;
            }

            // Preparar campos para actualizar
            $updateFields = [];
            $params = [':id' => $id];

            if (isset($data['name'])) {
                $updateFields[] = 'name = :name';
                $params[':name'] = $data['name'];
            }

            if (isset($data['color'])) {
                $updateFields[] = 'color = :color';
                $params[':color'] = $data['color'];
            }

            if (isset($data['parent_id'])) {
                $updateFields[] = 'parent_id = :parent_id';
                $params[':parent_id'] = $data['parent_id'];
            }

            if (isset($data['display_order'])) {
                $updateFields[] = 'display_order = :display_order';
                $params[':display_order'] = $data['display_order'];
            }

            if (isset($data['is_active'])) {
                $updateFields[] = 'is_active = :is_active';
                $params[':is_active'] = $data['is_active'] ? 1 : 0;
            }

            // Siempre actualizar updated_at
            $updateFields[] = 'updated_at = NOW()';

            if (count($updateFields) <= 1) { // Solo updated_at
                echo json_encode(['error' => 'No hay campos para actualizar']);
                exit;
            }

            // Ejecutar actualización
            $sql = "UPDATE recipe_categories SET " . implode(', ', $updateFields) . " WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            echo json_encode([
                'success' => true,
                'message' => 'Categoría actualizada exitosamente'
            ]);

        } catch (Exception $e) {
            error_log('Error updating category: ' . $e->getMessage());
            echo json_encode([
                'success' => false,
                'error' => 'Error al actualizar categoría: ' . $e->getMessage()
            ]);
        }
        break;

    case 'DELETE':
        // Eliminar categoría
        try {
            $id = $_GET['id'] ?? null;
            if (!$id) {
                echo json_encode(['error' => 'ID de categoría requerido']);
                exit;
            }

            // Verificar que existe
            $stmt = $pdo->prepare("SELECT id FROM recipe_categories WHERE id = :id");
            $stmt->execute([':id' => $id]);
            if (!$stmt->fetch()) {
                echo json_encode(['error' => 'Categoría no encontrada']);
                exit;
            }

            // Mover recetas a "sin categoría" antes de eliminar
            $stmt = $pdo->prepare("UPDATE recipes SET category_id = NULL WHERE category_id = :id");
            $stmt->execute([':id' => $id]);

            // Eliminar subcategorías (mover también sus recetas)
            $stmt = $pdo->prepare("
                UPDATE recipes SET category_id = NULL
                WHERE category_id IN (SELECT id FROM recipe_categories WHERE parent_id = :id)
            ");
            $stmt->execute([':id' => $id]);

            // Eliminar la categoría (CASCADE eliminará subcategorías)
            $stmt = $pdo->prepare("DELETE FROM recipe_categories WHERE id = :id");
            $stmt->execute([':id' => $id]);

            echo json_encode([
                'success' => true,
                'message' => 'Categoría eliminada exitosamente'
            ]);

        } catch (Exception $e) {
            error_log('Error deleting category: ' . $e->getMessage());
            echo json_encode([
                'success' => false,
                'error' => 'Error al eliminar categoría: ' . $e->getMessage()
            ]);
        }
        break;

    default:
        echo json_encode(['error' => 'Método no soportado']);
}
?>