<?php
/**
 * API DE AUTENTICACIÓN
 * Archivo: wwwdimijizp/apis/auth.php
 *
 * Endpoints:
 * POST /auth.php?action=login - Login de usuario
 * POST /auth.php?action=logout - Logout
 * GET  /auth.php?action=verify - Verificar sesión
 * POST /auth.php?action=role - Login con rol específico
 */

require_once 'config.php';

// Configurar CORS
setCORSHeaders();

// Obtener conexión a BD
$db = getDBConnection();

// Determinar acción
$action = $_GET['action'] ?? 'verify';
$method = $_SERVER['REQUEST_METHOD'];

// ============================================
// RUTAS DE LA API
// ============================================

switch ($action) {
    case 'login':
        if ($method === 'POST') {
            loginUser($db);
        } else {
            sendError('Método no permitido', 405);
        }
        break;

    case 'role':
        if ($method === 'POST') {
            loginWithRole($db);
        } else {
            sendError('Método no permitido', 405);
        }
        break;

    case 'logout':
        if ($method === 'POST') {
            logoutUser($db);
        } else {
            sendError('Método no permitido', 405);
        }
        break;

    case 'verify':
        if ($method === 'GET') {
            verifySession($db);
        } else {
            sendError('Método no permitido', 405);
        }
        break;

    default:
        sendError('Acción no válida', 400);
}

// ============================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================

/**
 * Login de usuario (admin con contraseña)
 */
function loginUser($db) {
    try {
        // Obtener datos del request - fix para JSON
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        // Validar campos requeridos
        if (empty($data['password'])) {
            sendError('Contraseña requerida', 400);
        }

        // Verificar contraseña de admin
        if ($data['password'] !== ADMIN_PASSWORD) {
            // Log intento fallido
            logError('Failed login attempt', ['ip' => $_SERVER['REMOTE_ADDR']]);
            sendError('Contraseña incorrecta', 401);
        }

        // Obtener usuario admin
        $stmt = $db->prepare("SELECT * FROM users WHERE role = 'admin' LIMIT 1");
        $stmt->execute();
        $user = $stmt->fetch();

        if (!$user) {
            sendError('Usuario admin no encontrado', 500);
        }

        // Crear sesión
        $sessionId = generateSessionId();
        $expiresAt = date('Y-m-d H:i:s', time() + JWT_EXPIRY);

        $sql = "INSERT INTO sessions (id, user_id, ip_address, user_agent, expires_at)
                VALUES (:id, :user_id, :ip, :agent, :expires)
                ON DUPLICATE KEY UPDATE expires_at = :expires";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':id' => $sessionId,
            ':user_id' => $user['id'],
            ':ip' => $_SERVER['REMOTE_ADDR'] ?? '',
            ':agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            ':expires' => $expiresAt
        ]);

        // Actualizar última actividad
        $db->exec("UPDATE users SET last_active = NOW() WHERE id = '{$user['id']}'");

        // Log de auditoría
        $sql = "INSERT INTO audit_log (user_id, action, ip_address)
                VALUES (:user_id, 'login', :ip)";
        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':user_id' => $user['id'],
            ':ip' => $_SERVER['REMOTE_ADDR'] ?? ''
        ]);

        sendJSON([
            'success' => true,
            'message' => 'Login exitoso',
            'data' => [
                'sessionId' => $sessionId,
                'user' => formatUser($user),
                'expiresAt' => $expiresAt
            ]
        ]);

    } catch (Exception $e) {
        logError('Error during login', ['error' => $e->getMessage()]);
        sendError('Error durante el login', 500);
    }
}

/**
 * Login con rol específico (worker/guest)
 */
function loginWithRole($db) {
    try {
        $data = getRequestData();

        // Validar rol
        if (empty($data['role']) || !in_array($data['role'], ['worker', 'guest'])) {
            sendError('Rol no válido', 400);
        }

        $role = $data['role'];
        $userName = $data['name'] ?? null;

        // Para workers, obtener o crear usuario
        if ($role === 'worker' && $userName) {
            // Buscar usuario existente
            $stmt = $db->prepare("SELECT * FROM users WHERE name = :name AND role = 'worker'");
            $stmt->execute([':name' => $userName]);
            $user = $stmt->fetch();

            if (!$user) {
                // Crear nuevo worker
                $userId = generateUUID();
                $sql = "INSERT INTO users (id, name, role, avatar, active)
                        VALUES (:id, :name, 'worker', '👨‍🍳', TRUE)";
                $stmt = $db->prepare($sql);
                $stmt->execute([
                    ':id' => $userId,
                    ':name' => $userName
                ]);

                $user = [
                    'id' => $userId,
                    'name' => $userName,
                    'role' => 'worker',
                    'avatar' => '👨‍🍳',
                    'active' => true
                ];
            }
        } else if ($role === 'guest') {
            // Para guests, crear sesión temporal
            $user = [
                'id' => 'guest-' . time(),
                'name' => $userName ?? 'Gast',
                'role' => 'guest',
                'avatar' => '👤',
                'active' => true
            ];
        } else {
            sendError('Nombre requerido para trabajadores', 400);
        }

        // Crear sesión
        $sessionId = generateSessionId();
        $expiresAt = date('Y-m-d H:i:s', time() + JWT_EXPIRY);

        // Solo guardar sesión si no es guest temporal
        if (strpos($user['id'], 'guest-') !== 0) {
            $sql = "INSERT INTO sessions (id, user_id, ip_address, user_agent, expires_at)
                    VALUES (:id, :user_id, :ip, :agent, :expires)";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                ':id' => $sessionId,
                ':user_id' => $user['id'],
                ':ip' => $_SERVER['REMOTE_ADDR'] ?? '',
                ':agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                ':expires' => $expiresAt
            ]);

            // Actualizar última actividad
            $db->exec("UPDATE users SET last_active = NOW() WHERE id = '{$user['id']}'");
        }

        sendJSON([
            'success' => true,
            'message' => 'Login exitoso como ' . $role,
            'data' => [
                'sessionId' => $sessionId,
                'user' => formatUser($user),
                'expiresAt' => $expiresAt
            ]
        ]);

    } catch (Exception $e) {
        logError('Error during role login', ['error' => $e->getMessage()]);
        sendError('Error durante el login', 500);
    }
}

/**
 * Logout de usuario
 */
function logoutUser($db) {
    try {
        $sessionId = $_SERVER['HTTP_AUTHORIZATION'] ?? $_POST['sessionId'] ?? null;

        if ($sessionId) {
            // Eliminar sesión
            $stmt = $db->prepare("DELETE FROM sessions WHERE id = :id");
            $stmt->execute([':id' => $sessionId]);

            // Log de auditoría
            $stmt = $db->prepare("SELECT user_id FROM sessions WHERE id = :id");
            $stmt->execute([':id' => $sessionId]);
            $session = $stmt->fetch();

            if ($session) {
                $sql = "INSERT INTO audit_log (user_id, action, ip_address)
                        VALUES (:user_id, 'logout', :ip)";
                $stmt = $db->prepare($sql);
                $stmt->execute([
                    ':user_id' => $session['user_id'],
                    ':ip' => $_SERVER['REMOTE_ADDR'] ?? ''
                ]);
            }
        }

        sendJSON([
            'success' => true,
            'message' => 'Logout exitoso'
        ]);

    } catch (Exception $e) {
        logError('Error during logout', ['error' => $e->getMessage()]);
        sendError('Error durante el logout', 500);
    }
}

/**
 * Verificar sesión activa
 */
function verifySession($db) {
    try {
        $sessionId = $_SERVER['HTTP_AUTHORIZATION'] ?? $_GET['sessionId'] ?? null;

        if (!$sessionId) {
            sendJSON([
                'success' => false,
                'authenticated' => false,
                'message' => 'No hay sesión activa'
            ]);
            return;
        }

        // Verificar sesión
        $sql = "SELECT s.*, u.* FROM sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.id = :id AND s.expires_at > NOW()";
        $stmt = $db->prepare($sql);
        $stmt->execute([':id' => $sessionId]);
        $session = $stmt->fetch();

        if (!$session) {
            sendJSON([
                'success' => false,
                'authenticated' => false,
                'message' => 'Sesión inválida o expirada'
            ]);
            return;
        }

        // Renovar sesión si está próxima a expirar (menos de 1 hora)
        $expiresIn = strtotime($session['expires_at']) - time();
        if ($expiresIn < 3600) {
            $newExpiry = date('Y-m-d H:i:s', time() + JWT_EXPIRY);
            $stmt = $db->prepare("UPDATE sessions SET expires_at = :expires WHERE id = :id");
            $stmt->execute([':expires' => $newExpiry, ':id' => $sessionId]);
            $session['expires_at'] = $newExpiry;
        }

        sendJSON([
            'success' => true,
            'authenticated' => true,
            'data' => [
                'user' => formatUser($session),
                'expiresAt' => $session['expires_at'],
                'expiresIn' => strtotime($session['expires_at']) - time()
            ]
        ]);

    } catch (Exception $e) {
        logError('Error verifying session', ['error' => $e->getMessage()]);
        sendError('Error al verificar sesión', 500);
    }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Generar ID de sesión
 */
function generateSessionId() {
    return bin2hex(random_bytes(32));
}

/**
 * Formatear usuario para respuesta
 */
function formatUser($user) {
    return [
        'id' => $user['id'],
        'name' => $user['name'],
        'email' => $user['email'] ?? null,
        'role' => $user['role'],
        'avatar' => $user['avatar'] ?? '👤',
        'active' => (bool)$user['active'],
        'recipesCreated' => intval($user['recipes_created'] ?? 0),
        'permissions' => json_decode($user['permissions'] ?? '[]', true),
        'lastActive' => $user['last_active']
    ];
}

?>