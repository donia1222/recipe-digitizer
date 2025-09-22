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
        // Listar sub-admins
        try {
            $stmt = $pdo->query("SELECT * FROM sub_admins ORDER BY created_at DESC");
            $subAdmins = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Remover passwords
            foreach ($subAdmins as &$admin) {
                unset($admin['password']);
            }

            echo json_encode([
                'success' => true,
                'data' => $subAdmins
            ]);
        } catch (Exception $e) {
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'POST':
        // Crear nuevo sub-admin
        try {
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            error_log('Creating sub-admin: ' . print_r($data, true));

            // Validar datos requeridos
            if (empty($data['name']) || empty($data['email'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Nombre y email son requeridos']);
                exit;
            }

            // Generar sub_admin_id si no existe
            $subAdminId = $data['sub_admin_id'] ?? 'sub_admin_' . time() . '_' . rand(1000, 9999);

            // Hash password si se proporciona
            $password = null;
            if (!empty($data['password'])) {
                $password = password_hash($data['password'], PASSWORD_DEFAULT);
            }

            // Convertir array de permisos a JSON
            $permissions = json_encode($data['permissions'] ?? []);

            // Insertar sub-admin
            $sql = "INSERT INTO sub_admins (
                        sub_admin_id, name, email, password, permissions,
                        status, created_by, created_at
                    ) VALUES (
                        :sub_admin_id, :name, :email, :password, :permissions,
                        :status, :created_by, NOW()
                    )";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':sub_admin_id' => $subAdminId,
                ':name' => $data['name'],
                ':email' => $data['email'],
                ':password' => $password,
                ':permissions' => $permissions,
                ':status' => $data['status'] ?? 'active',
                ':created_by' => $data['created_by'] ?? 'admin'
            ]);

            $newId = $pdo->lastInsertId();

            // Obtener sub-admin creado
            $stmt = $pdo->prepare("SELECT * FROM sub_admins WHERE id = :id");
            $stmt->execute([':id' => $newId]);
            $subAdmin = $stmt->fetch(PDO::FETCH_ASSOC);
            unset($subAdmin['password']);

            echo json_encode([
                'success' => true,
                'message' => 'Sub-administrador creado exitosamente',
                'data' => $subAdmin
            ]);

        } catch (Exception $e) {
            error_log('Error creating sub-admin: ' . $e->getMessage());
            echo json_encode([
                'success' => false,
                'error' => 'Error al crear sub-administrador: ' . $e->getMessage()
            ]);
        }
        break;

    case 'PUT':
        // Actualizar sub-admin
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID requerido']);
            exit;
        }

        try {
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            // Construir query dinámicamente
            $updates = [];
            $params = [':id' => $id];

            if (isset($data['name'])) {
                $updates[] = "name = :name";
                $params[':name'] = $data['name'];
            }
            if (isset($data['email'])) {
                $updates[] = "email = :email";
                $params[':email'] = $data['email'];
            }
            if (isset($data['permissions'])) {
                $updates[] = "permissions = :permissions";
                $params[':permissions'] = json_encode($data['permissions']);
            }
            if (isset($data['status'])) {
                $updates[] = "status = :status";
                $params[':status'] = $data['status'];
            }
            if (!empty($data['password'])) {
                $updates[] = "password = :password";
                $params[':password'] = password_hash($data['password'], PASSWORD_DEFAULT);
            }

            if (empty($updates)) {
                echo json_encode(['success' => true, 'message' => 'Nada que actualizar']);
                exit;
            }

            $sql = "UPDATE sub_admins SET " . implode(', ', $updates) . " WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            echo json_encode([
                'success' => true,
                'message' => 'Sub-administrador actualizado exitosamente'
            ]);

        } catch (Exception $e) {
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        // Eliminar sub-admin
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID requerido']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM sub_admins WHERE id = :id");
            $stmt->execute([':id' => $id]);

            echo json_encode([
                'success' => true,
                'message' => 'Sub-administrador eliminado exitosamente'
            ]);
        } catch (Exception $e) {
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método no soportado']);
}
?>