<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Si es una petición OPTIONS, terminar aquí
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Conexión a BD
try {
    $pdo = new PDO(
        'mysql:host=owoxogis.mysql.db.internal;dbname=owoxogis_recipedigitalizer;charset=utf8mb4',
        'owoxogis_recipe',
        'sevelen9475'
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Error de conexión BD: ' . $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Listar recetas
        try {
            $stmt = $pdo->query("SELECT * FROM recipes ORDER BY created_at DESC");
            $recipes = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Procesar recetas para usar image_url si existe
            foreach ($recipes as &$recipe) {
                // Si hay image_url, usar esa en lugar de base64
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
            }

            echo json_encode([
                'success' => true,
                'data' => $recipes,
                'pagination' => [
                    'page' => 1,
                    'limit' => 12,
                    'total' => count($recipes),
                    'pages' => 1
                ]
            ]);
        } catch (Exception $e) {
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'POST':
        // Crear receta
        try {
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            error_log('POST data received: ' . print_r($data, true));

            // Generar IDs
            $recipeId = 'recipe_' . time() . '_' . rand(1000, 9999);

            // Procesar imagen si existe
            $imageUrl = '';
            if (!empty($data['image'])) {
                // Extraer base64 data
                if (strpos($data['image'], 'data:image') === 0) {
                    // Es una imagen base64
                    $imageData = $data['image'];

                    // Intentar guardar como archivo
                    try {
                        // Extraer tipo de imagen
                        preg_match('/data:image\/(\w+);base64,/', $imageData, $matches);
                        $imageType = $matches[1] ?? 'jpg';

                        // Crear nombre de archivo único
                        $filename = $recipeId . '.' . $imageType;
                        $uploadPath = __DIR__ . '/uploads/' . $filename;

                        // Crear directorio si no existe
                        if (!file_exists(__DIR__ . '/uploads')) {
                            mkdir(__DIR__ . '/uploads', 0777, true);
                        }

                        // Extraer y decodificar base64
                        $base64 = preg_replace('/^data:image\/\w+;base64,/', '', $imageData);
                        $decodedImage = base64_decode($base64);

                        // Guardar archivo
                        if (file_put_contents($uploadPath, $decodedImage)) {
                            $imageUrl = 'https://web.lweb.ch/recipedigitalizer/apis/uploads/' . $filename;
                            error_log('Image saved to: ' . $uploadPath);
                        } else {
                            error_log('Failed to save image file');
                        }
                    } catch (Exception $imgError) {
                        error_log('Error saving image: ' . $imgError->getMessage());
                    }
                }
            }

            // Insertar receta
            $sql = "INSERT INTO recipes (
                        recipe_id, title, analysis, image_base64, image_url,
                        user_id, status, created_at
                    ) VALUES (
                        :recipe_id, :title, :analysis, :image, :image_url,
                        :user_id, :status, NOW()
                    )";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':recipe_id' => $recipeId,
                ':title' => $data['title'] ?? 'Sin título',
                ':analysis' => $data['analysis'] ?? '',
                ':image' => $data['image'] ?? '',
                ':image_url' => $imageUrl,
                ':user_id' => $data['user_id'] ?? 'admin-001',
                ':status' => $data['status'] ?? 'approved'
            ]);

            $newId = $pdo->lastInsertId();

            echo json_encode([
                'success' => true,
                'message' => 'Receta creada exitosamente',
                'data' => [
                    'id' => intval($newId),
                    'recipeId' => $recipeId,
                    'imageUrl' => $imageUrl
                ]
            ]);

        } catch (Exception $e) {
            error_log('Error creating recipe: ' . $e->getMessage());
            echo json_encode([
                'success' => false,
                'error' => 'Error al crear receta: ' . $e->getMessage()
            ]);
        }
        break;

    case 'DELETE':
        // Eliminar receta
        $id = $_GET['id'] ?? null;
        if (!$id) {
            echo json_encode(['error' => 'ID requerido']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM recipes WHERE id = :id");
            $stmt->execute([':id' => $id]);

            echo json_encode([
                'success' => true,
                'message' => 'Receta eliminada'
            ]);
        } catch (Exception $e) {
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    default:
        echo json_encode(['error' => 'Método no soportado']);
}
?>