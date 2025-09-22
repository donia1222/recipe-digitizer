<?php
// Debug version of auth-simple.php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

try {
    echo json_encode(['debug' => 'Headers set successfully']);

    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        http_response_code(200);
        exit(0);
    }

    echo json_encode(['debug' => 'OPTIONS check passed']);

    // Incluir archivo de configuración
    require_once 'config.php';
    echo json_encode(['debug' => 'Config loaded successfully']);

    $action = $_GET['action'] ?? 'verify';
    echo json_encode(['debug' => 'Action: ' . $action]);

    // Conexión a BD usando la función del config
    try {
        $pdo = getDBConnection();
        echo json_encode(['debug' => 'Database connection successful']);
    } catch (Exception $e) {
        echo json_encode([
            'debug' => 'Database connection failed',
            'error' => $e->getMessage()
        ]);
        exit;
    }

    if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        echo json_encode(['debug' => 'Processing login request']);

        $input = file_get_contents('php://input');
        echo json_encode(['debug' => 'Raw input: ' . $input]);

        $data = json_decode($input, true);
        echo json_encode(['debug' => 'Decoded data', 'data' => $data]);

        if (!isset($data['username']) || !isset($data['password'])) {
            echo json_encode([
                'success' => false,
                'error' => 'Usuario y contraseña requeridos',
                'debug' => 'Missing username or password'
            ]);
            exit;
        }

        $username = $data['username'];
        $password = $data['password'];

        echo json_encode(['debug' => 'Credentials received', 'username' => $username]);

        // Test database query
        try {
            $stmt = $pdo->prepare("SELECT * FROM users WHERE (name = :username OR email = :username) AND active = 1");
            $stmt->execute([':username' => $username]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            echo json_encode(['debug' => 'Query executed', 'user_found' => $user ? true : false]);

            if ($user) {
                echo json_encode(['debug' => 'User data', 'user' => $user]);
            }

        } catch (Exception $e) {
            echo json_encode([
                'debug' => 'Query failed',
                'error' => $e->getMessage()
            ]);
            exit;
        }
    }

    echo json_encode(['debug' => 'Script completed successfully']);

} catch (Exception $e) {
    echo json_encode([
        'debug' => 'Fatal error',
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
?>