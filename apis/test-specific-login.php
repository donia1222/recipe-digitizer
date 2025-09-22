<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Test login específico
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Si no hay datos POST, usar GET para pruebas
if (!$data) {
    $data = [
        'username' => $_GET['username'] ?? 'perro',
        'password' => $_GET['password'] ?? 'perro'
    ];
}

try {
    $pdo = new PDO(
        'mysql:host=owoxogis.mysql.db.internal;dbname=owoxogis_recipedigitalizer;charset=utf8mb4',
        'owoxogis_recipe',
        'sevelen9475'
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $username = $data['username'];
    $password = $data['password'];

    // Log para debug
    error_log("Login attempt for: $username");

    // Buscar usuario
    $stmt = $pdo->prepare("SELECT * FROM users WHERE (name = :username OR email = :username) AND active = 1");
    $stmt->execute([':username' => $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode([
            'success' => false,
            'error' => 'Usuario no encontrado o inactivo',
            'debug' => [
                'searched_for' => $username,
                'query' => "SELECT * FROM users WHERE (name = '$username' OR email = '$username') AND active = 1"
            ]
        ]);
        exit;
    }

    // Verificar password
    if (empty($user['password'])) {
        echo json_encode([
            'success' => false,
            'error' => 'Usuario sin contraseña configurada',
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email']
            ]
        ]);
        exit;
    }

    if (!password_verify($password, $user['password'])) {
        echo json_encode([
            'success' => false,
            'error' => 'Contraseña incorrecta',
            'debug' => [
                'username' => $username,
                'password_provided' => $password,
                'user_found' => true,
                'has_password' => true
            ]
        ]);
        exit;
    }

    // Login exitoso
    $token = bin2hex(random_bytes(32));

    echo json_encode([
        'success' => true,
        'message' => 'Login exitoso',
        'token' => $token,
        'user' => [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role'],
            'active' => $user['active']
        ],
        'debug' => [
            'username_used' => $username,
            'password_used' => $password,
            'password_verified' => true
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>