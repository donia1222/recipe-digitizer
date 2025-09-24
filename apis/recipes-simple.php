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

/**
 * Optimiza una imagen base64: comprime y redimensiona
 * @param string $base64Data - Imagen en formato base64
 * @param string $filename - Nombre del archivo de salida
 * @return array - ['success' => bool, 'url' => string, 'optimized_data' => string]
 */
function optimizeImage($base64Data, $filename) {
    try {
        if (!extension_loaded('gd')) {
            return ['success' => false, 'optimized_data' => $base64Data];
        }

        // Extraer y decodificar base64
        $base64 = preg_replace('/^data:image\/\w+;base64,/', '', $base64Data);
        $imageData = base64_decode($base64);
        if ($imageData === false) {
            return ['success' => false, 'optimized_data' => $base64Data];
        }

        // Crear imagen desde string
        $sourceImage = imagecreatefromstring($imageData);
        if ($sourceImage === false) {
            return ['success' => false, 'optimized_data' => $base64Data];
        }

        // Obtener dimensiones originales
        $originalWidth = imagesx($sourceImage);
        $originalHeight = imagesy($sourceImage);

        // Calcular nuevas dimensiones (max 1200x1600)
        $maxWidth = 1200;
        $maxHeight = 1600;
        $ratio = min($maxWidth / $originalWidth, $maxHeight / $originalHeight, 1);

        if ($ratio < 1) {
            $newWidth = round($originalWidth * $ratio);
            $newHeight = round($originalHeight * $ratio);

            // Crear imagen optimizada
            $optimizedImage = imagecreatetruecolor($newWidth, $newHeight);
            imagecopyresampled($optimizedImage, $sourceImage, 0, 0, 0, 0, $newWidth, $newHeight, $originalWidth, $originalHeight);
        } else {
            $optimizedImage = $sourceImage;
        }

        // Capturar imagen optimizada como base64
        ob_start();
        imagejpeg($optimizedImage, null, 80); // 80% calidad
        $optimizedData = ob_get_contents();
        ob_end_clean();

        // Limpiar memoria
        imagedestroy($sourceImage);
        if ($ratio < 1) {
            imagedestroy($optimizedImage);
        }

        // Convertir de vuelta a base64
        $mimeType = 'image/jpeg';
        $optimizedBase64 = 'data:' . $mimeType . ';base64,' . base64_encode($optimizedData);

        error_log("🖼️ Image optimized: {$filename} | Original size: " . round(strlen($imageData)/1024, 1) . "KB → Optimized: " . round(strlen($optimizedData)/1024, 1) . "KB");

        return [
            'success' => true,
            'optimized_data' => $optimizedBase64
        ];

    } catch (Exception $e) {
        error_log("❌ Image optimization error: " . $e->getMessage());
        return ['success' => false, 'optimized_data' => $base64Data];
    }
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Obtener receta específica por ID o listar recetas
        try {
            $id = $_GET['id'] ?? null;
            $user_id = $_GET['user_id'] ?? null;

            // Debug: Log what we received
            error_log("DEBUG: Received id parameter: " . ($id ?? "NULL"));
            error_log("DEBUG: Received user_id parameter: " . ($user_id ?? "NULL"));
            error_log("DEBUG: All GET parameters: " . json_encode($_GET));

            // Si se proporciona ID, obtener receta específica
            if ($id) {
                $stmt = $pdo->prepare("
                    SELECT r.*, c.name as category_name, c.color as category_color
                    FROM recipes r
                    LEFT JOIN recipe_categories c ON r.category_id = c.id
                    WHERE r.id = ?
                ");
                $stmt->execute([$id]);
                $recipe = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$recipe) {
                    echo json_encode(['success' => false, 'error' => 'Receta no encontrada']);
                    exit;
                }

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

                echo json_encode([
                    'success' => true,
                    'data' => $recipe
                ]);
                exit;
            }

            if ($user_id) {
                // Debug: Ver todos los user_ids disponibles
                $debug_stmt = $pdo->query("SELECT DISTINCT user_id FROM recipes");
                $all_user_ids = $debug_stmt->fetchAll(PDO::FETCH_COLUMN);

                // Filtrar por usuario específico
                error_log("DEBUG: Filtering by user_id: " . $user_id);
                error_log("DEBUG: Available user_ids: " . json_encode($all_user_ids));

                $stmt = $pdo->prepare("
                    SELECT r.*, c.name as category_name, c.color as category_color
                    FROM recipes r
                    LEFT JOIN recipe_categories c ON r.category_id = c.id
                    WHERE r.user_id = ?
                    ORDER BY r.created_at DESC
                ");
                $stmt->execute([$user_id]);
            } else {
                // Devolver todas las recetas
                error_log("DEBUG: No user_id provided, returning all recipes");
                $stmt = $pdo->query("
                    SELECT r.*, c.name as category_name, c.color as category_color
                    FROM recipes r
                    LEFT JOIN recipe_categories c ON r.category_id = c.id
                    ORDER BY r.created_at DESC
                ");
            }

            $recipes = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Debug: Log how many recipes found
            error_log("DEBUG: Found " . count($recipes) . " recipes after filtering");

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
                'data' => $recipes,
                'debug' => [
                    'user_id_requested' => $user_id,
                    'recipes_found' => count($recipes),
                    'timestamp' => date('Y-m-d H:i:s'),
                    'all_user_ids_in_db' => $user_id ? $all_user_ids : 'not_requested'
                ],
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
                    // Optimizar imagen ANTES de procesarla
                    $optimizationResult = optimizeImage($data['image'], $recipeId);
                    $imageData = $optimizationResult['optimized_data'];

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

            // Insertar receta en RECETAS_PENDIENTES (requiere aprobación)
            $sql = "INSERT INTO recetas_pendientes (
                        recipe_id, title, analysis, image_base64, image_url,
                        user_id, category_id, created_at
                    ) VALUES (
                        :recipe_id, :title, :analysis, :image, :image_url,
                        :user_id, :category_id, NOW()
                    )";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':recipe_id' => $recipeId,
                ':title' => $data['title'] ?? 'Sin título',
                ':analysis' => $data['analysis'] ?? '',
                ':image' => $data['image'] ?? '',
                ':image_url' => $imageUrl,
                ':user_id' => $data['user_id'] ?? 'admin-001',
                ':category_id' => $data['category_id'] ?? null
            ]);

            $newId = $pdo->lastInsertId();

            // Procesar imágenes adicionales si existen
            if (!empty($data['additional_images']) && is_array($data['additional_images'])) {
                $displayOrder = 0;
                foreach ($data['additional_images'] as $additionalImage) {
                    $additionalImageUrl = '';

                    // Procesar imagen adicional
                    if (!empty($additionalImage) && strpos($additionalImage, 'data:image') === 0) {
                        // Optimizar imagen adicional ANTES de procesarla
                        $additionalOptimizationResult = optimizeImage($additionalImage, $recipeId . '_additional_' . $displayOrder);
                        $additionalImage = $additionalOptimizationResult['optimized_data'];

                        try {
                            // Extraer tipo de imagen
                            preg_match('/data:image\/(\w+);base64,/', $additionalImage, $matches);
                            $imageType = $matches[1] ?? 'jpg';

                            // Crear nombre de archivo único para imagen adicional
                            $additionalFilename = $recipeId . '_additional_' . $displayOrder . '.' . $imageType;
                            $additionalUploadPath = __DIR__ . '/uploads/' . $additionalFilename;

                            // Extraer y decodificar base64
                            $base64 = preg_replace('/^data:image\/\w+;base64,/', '', $additionalImage);
                            $decodedImage = base64_decode($base64);

                            // Guardar archivo
                            if (file_put_contents($additionalUploadPath, $decodedImage)) {
                                $additionalImageUrl = 'https://web.lweb.ch/recipedigitalizer/apis/uploads/' . $additionalFilename;
                                error_log('Additional image saved to: ' . $additionalUploadPath);
                            }
                        } catch (Exception $e) {
                            error_log('Error saving additional image: ' . $e->getMessage());
                        }
                    }

                    // Insertar imagen adicional en recipe_images
                    if (!empty($additionalImageUrl)) {
                        try {
                            $additionalImageStmt = $pdo->prepare("
                                INSERT INTO recetas_pendientes_images (recipe_id, image_url, image_base64, display_order)
                                VALUES (?, ?, ?, ?)
                            ");
                            $additionalImageStmt->execute([
                                $newId,
                                $additionalImageUrl,
                                $additionalImage,
                                $displayOrder
                            ]);
                            error_log('Additional image record created for PENDING recipe ID: ' . $newId);
                        } catch (Exception $e) {
                            error_log('Error inserting additional image record: ' . $e->getMessage());
                        }
                    }

                    $displayOrder++;
                }
            }

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
            // Primero eliminar imágenes adicionales asociadas
            $deleteImagesStmt = $pdo->prepare("DELETE FROM recipe_images WHERE recipe_id = ?");
            $deleteImagesStmt->execute([$id]);

            // Luego eliminar la receta principal
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

    case 'PUT':
        // Actualizar receta
        try {
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            error_log('PUT data received: ' . print_r($data, true));

            // Obtener ID de la receta desde la URL o los datos
            $id = $_GET['id'] ?? $data['id'] ?? null;
            if (!$id) {
                echo json_encode(['error' => 'ID de receta requerido']);
                exit;
            }

            // Verificar que la receta existe
            $checkStmt = $pdo->prepare("SELECT * FROM recipes WHERE id = :id");
            $checkStmt->execute([':id' => $id]);
            $existingRecipe = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if (!$existingRecipe) {
                echo json_encode(['error' => 'Receta no encontrada']);
                exit;
            }

            // Preparar campos para actualizar
            $updateFields = [];
            $params = [':id' => $id];

            if (isset($data['title'])) {
                $updateFields[] = 'title = :title';
                $params[':title'] = $data['title'];
            }

            if (isset($data['analysis'])) {
                $updateFields[] = 'analysis = :analysis';
                $params[':analysis'] = $data['analysis'];
            }

            if (isset($data['status'])) {
                $updateFields[] = 'status = :status';
                $params[':status'] = $data['status'];
            }

            if (isset($data['servings'])) {
                $updateFields[] = 'servings = :servings';
                $params[':servings'] = $data['servings'];
            }

            if (isset($data['original_servings'])) {
                $updateFields[] = 'original_servings = :original_servings';
                $params[':original_servings'] = $data['original_servings'];
            }

            if (isset($data['is_favorite'])) {
                $updateFields[] = 'is_favorite = :is_favorite';
                $params[':is_favorite'] = $data['is_favorite'] ? 1 : 0;
            }

            if (isset($data['category_id'])) {
                $updateFields[] = 'category_id = :category_id';
                $params[':category_id'] = $data['category_id'];
            }

            // Siempre actualizar updated_at
            $updateFields[] = 'updated_at = NOW()';

            if (empty($updateFields)) {
                echo json_encode(['error' => 'No hay campos para actualizar']);
                exit;
            }

            // Construir y ejecutar query
            $sql = "UPDATE recipes SET " . implode(', ', $updateFields) . " WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            // Procesar imágenes adicionales si se proporcionan
            if (isset($data['additional_images'])) {
                // Primero eliminar imágenes adicionales existentes
                $deleteImagesStmt = $pdo->prepare("DELETE FROM recipe_images WHERE recipe_id = ?");
                $deleteImagesStmt->execute([$id]);

                // Agregar nuevas imágenes adicionales
                if (is_array($data['additional_images'])) {
                    $displayOrder = 0;
                    foreach ($data['additional_images'] as $additionalImage) {
                        $additionalImageUrl = '';

                        // Procesar imagen adicional
                        if (!empty($additionalImage) && strpos($additionalImage, 'data:image') === 0) {
                            // Optimizar imagen adicional ANTES de procesarla
                            $additionalOptimizationResult = optimizeImage($additionalImage, $recipeId . '_additional_' . $displayOrder . '_' . time());
                            $additionalImage = $additionalOptimizationResult['optimized_data'];

                            try {
                                // Extraer tipo de imagen
                                preg_match('/data:image\/(\w+);base64,/', $additionalImage, $matches);
                                $imageType = $matches[1] ?? 'jpg';

                                // Crear nombre de archivo único para imagen adicional
                                $recipeId = $existingRecipe['recipe_id'] ?? 'recipe_' . $id;
                                $additionalFilename = $recipeId . '_additional_' . $displayOrder . '_' . time() . '.' . $imageType;
                                $additionalUploadPath = __DIR__ . '/uploads/' . $additionalFilename;

                                // Crear directorio si no existe
                                if (!file_exists(__DIR__ . '/uploads')) {
                                    mkdir(__DIR__ . '/uploads', 0777, true);
                                }

                                // Extraer y decodificar base64
                                $base64 = preg_replace('/^data:image\/\w+;base64,/', '', $additionalImage);
                                $decodedImage = base64_decode($base64);

                                // Guardar archivo
                                if (file_put_contents($additionalUploadPath, $decodedImage)) {
                                    $additionalImageUrl = 'https://web.lweb.ch/recipedigitalizer/apis/uploads/' . $additionalFilename;
                                    error_log('Additional image updated and saved to: ' . $additionalUploadPath);
                                }
                            } catch (Exception $e) {
                                error_log('Error saving additional image during update: ' . $e->getMessage());
                            }
                        } else if (!empty($additionalImage) && filter_var($additionalImage, FILTER_VALIDATE_URL)) {
                            // Si es una URL válida, usarla directamente
                            $additionalImageUrl = $additionalImage;
                        }

                        // Insertar imagen adicional en recipe_images
                        if (!empty($additionalImageUrl)) {
                            try {
                                $additionalImageStmt = $pdo->prepare("
                                    INSERT INTO recipe_images (recipe_id, image_url, image_base64, display_order)
                                    VALUES (?, ?, ?, ?)
                                ");
                                $additionalImageStmt->execute([
                                    $id,
                                    $additionalImageUrl,
                                    $additionalImage,
                                    $displayOrder
                                ]);
                                error_log('Additional image record updated for recipe ID: ' . $id);
                            } catch (Exception $e) {
                                error_log('Error updating additional image record: ' . $e->getMessage());
                            }
                        }

                        $displayOrder++;
                    }
                }
            }

            // Obtener receta actualizada
            $updatedStmt = $pdo->prepare("SELECT * FROM recipes WHERE id = :id");
            $updatedStmt->execute([':id' => $id]);
            $updatedRecipe = $updatedStmt->fetch(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'message' => 'Receta actualizada exitosamente',
                'data' => $updatedRecipe
            ]);

        } catch (Exception $e) {
            error_log('Error updating recipe: ' . $e->getMessage());
            echo json_encode([
                'success' => false,
                'error' => 'Error al actualizar receta: ' . $e->getMessage()
            ]);
        }
        break;

    default:
        echo json_encode(['error' => 'Método no soportado']);
}
?>