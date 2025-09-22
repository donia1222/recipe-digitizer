<?php
require_once 'config.php';

// Configurar CORS
setCORSHeaders();

// Conexión a BD
try {
    $pdo = getDBConnection();
} catch (PDOException $e) {
    echo json_encode(['error' => 'Error de conexión BD: ' . $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['REQUEST_URI'];

// Extract ID from path if present (e.g., /users.php/user_123)
$id = null;
if (preg_match('/\/users\.php\/([a-zA-Z0-9_\.\-]+)/', $path, $matches)) {
    $id = $matches[1];
}

switch ($method) {
    case 'GET':
        // Listar usuarios o obtener uno específico
        try {
            if ($id) {
                $stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id");
                $stmt->execute([':id' => $id]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($user) {
                    // No enviar password
                    unset($user['password']);
                    echo json_encode(['success' => true, 'data' => $user]);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Usuario no encontrado']);
                }
            } else {
                $stmt = $pdo->query("SELECT * FROM users ORDER BY created_at DESC");
                $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

                // Remover passwords
                foreach ($users as &$user) {
                    unset($user['password']);
                }

                echo json_encode([
                    'success' => true,
                    'data' => $users
                ]);
            }
        } catch (Exception $e) {
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'POST':
        // Crear nuevo usuario
        try {
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            // Validar datos requeridos - acepta tanto 'name' como 'username'
            $username = $data['name'] ?? $data['username'] ?? null;
            if (empty($username) || empty($data['email'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Nombre y email son requeridos']);
                exit;
            }

            // Generar ID único (UUID)
            $userId = isset($data['id']) ? $data['id'] : uniqid('user_', true);

            // Hash password si se proporciona
            $password = null;
            if (!empty($data['password'])) {
                $password = password_hash($data['password'], PASSWORD_DEFAULT);
            }

            // Insertar usuario
            $sql = "INSERT INTO users (
                        id, name, email, password, role,
                        active, created_at
                    ) VALUES (
                        :id, :name, :email, :password, :role,
                        :active, NOW()
                    )";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':id' => $userId,
                ':name' => $username,
                ':email' => $data['email'],
                ':password' => $password,
                ':role' => $data['role'] ?? 'guest',
                ':active' => isset($data['status']) ? ($data['status'] === 'active' ? 1 : 0) : 1
            ]);

            // Obtener usuario creado usando el ID que generamos
            $stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id");
            $stmt->execute([':id' => $userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user) {
                unset($user['password']);
                echo json_encode([
                    'success' => true,
                    'message' => 'Usuario creado exitosamente',
                    'data' => $user
                ]);
            } else {
                // Si no se encuentra, devolver datos básicos
                echo json_encode([
                    'success' => true,
                    'message' => 'Usuario creado exitosamente',
                    'data' => [
                        'id' => $userId,
                        'name' => $username,
                        'email' => $data['email'],
                        'role' => $data['role'] ?? 'guest',
                        'active' => isset($data['status']) ? ($data['status'] === 'active' ? 1 : 0) : 1
                    ]
                ]);
            }

        } catch (Exception $e) {
            error_log('Error creating user: ' . $e->getMessage());
            echo json_encode([
                'success' => false,
                'error' => 'Error al crear usuario: ' . $e->getMessage()
            ]);
        }
        break;

    case 'PUT':
        // Actualizar usuario
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID de usuario requerido']);
            exit;
        }

        try {
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            // Construir query dinámicamente
            $updates = [];
            $params = [':id' => $id];

            if (isset($data['username']) || isset($data['name'])) {
                $updates[] = "name = :name";
                $params[':name'] = $data['username'] ?? $data['name'];
            }
            if (isset($data['email'])) {
                $updates[] = "email = :email";
                $params[':email'] = $data['email'];
            }
            if (isset($data['role'])) {
                $updates[] = "role = :role";
                $params[':role'] = $data['role'];
            }
            if (isset($data['status'])) {
                $updates[] = "active = :active";
                $params[':active'] = $data['status'] === 'active' ? 1 : 0;
            }
            if (!empty($data['password'])) {
                $updates[] = "password = :password";
                $params[':password'] = password_hash($data['password'], PASSWORD_DEFAULT);
            }

            if (empty($updates)) {
                echo json_encode(['success' => true, 'message' => 'Nada que actualizar']);
                exit;
            }

            $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            echo json_encode([
                'success' => true,
                'message' => 'Usuario actualizado exitosamente'
            ]);

        } catch (Exception $e) {
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        // Eliminar usuario
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID de usuario requerido']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = :id");
            $stmt->execute([':id' => $id]);

            echo json_encode([
                'success' => true,
                'message' => 'Usuario eliminado exitosamente'
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