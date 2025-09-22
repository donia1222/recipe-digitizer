<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

$action = $_GET['action'] ?? 'verify';

// Conexión a BD
try {
    $pdo = new PDO(
        'mysql:host=owoxogis.mysql.db.internal;dbname=owoxogis_recipedigitalizer;charset=utf8mb4',
        'owoxogis_recipe',
        'sevelen9475'
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error de conexión BD'
    ]);
    exit;
}

if ($action === 'verify') {
    echo json_encode([
        'success' => false,
        'authenticated' => false,
        'message' => 'No hay sesión activa'
    ]);
    exit;
}

if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!isset($data['username']) || !isset($data['password'])) {
        echo json_encode([
            'success' => false,
            'error' => 'Usuario y contraseña requeridos'
        ]);
        exit;
    }

    $username = $data['username'];
    $password = $data['password'];

    // Buscar usuario en la base de datos
    $stmt = $pdo->prepare("SELECT * FROM users WHERE (name = :username OR email = :username) AND active = 1");
    $stmt->execute([':username' => $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode([
            'success' => false,
            'error' => 'Usuario no encontrado o inactivo'
        ]);
        exit;
    }

    // Verificar contraseña
    if (empty($user['password'])) {
        echo json_encode([
            'success' => false,
            'error' => 'Usuario sin contraseña configurada'
        ]);
        exit;
    }

    if (!password_verify($password, $user['password'])) {
        echo json_encode([
            'success' => false,
            'error' => 'Contraseña incorrecta'
        ]);
        exit;
    }

    // Actualizar último login
    try {
        $stmt = $pdo->prepare("UPDATE users SET last_active = NOW() WHERE id = :id");
        $stmt->execute([':id' => $user['id']]);
    } catch (Exception $e) {
        // Ignorar error de actualización
    }

    // Crear token de sesión
    $token = bin2hex(random_bytes(32));

    // Login exitoso
    echo json_encode([
        'success' => true,
        'message' => 'Login exitoso',
        'token' => $token,
        'user' => [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role'],
            'active' => $user['active'] ? 1 : 0
        ]
    ]);
    exit;
}

echo json_encode([
    'success' => false,
    'error' => 'Acción no válida'
]);
?>