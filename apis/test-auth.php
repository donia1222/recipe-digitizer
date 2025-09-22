<?php
/**
 * TEST DE AUTENTICACIÓN SIMPLIFICADO
 */

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Debug info
$response = [
    'method' => $_SERVER['REQUEST_METHOD'],
    'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'not set',
    'raw_input' => file_get_contents('php://input'),
];

// Parse input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

$response['parsed_data'] = $data;
$response['password_received'] = $data['password'] ?? 'NOT RECEIVED';

// Check password
if ($data && isset($data['password'])) {
    if ($data['password'] === 'Andrea1606') {
        $response['auth_result'] = 'SUCCESS - Password matches';

        // Try to connect to DB and get admin
        try {
            $pdo = new PDO(
                'mysql:host=owoxogis.mysql.db.internal;dbname=owoxogis_recipedigitalizer;charset=utf8mb4',
                'owoxogis_recipe',
                'sevelen9475'
            );

            $stmt = $pdo->query("SELECT id, name, role FROM users WHERE role = 'admin' LIMIT 1");
            $admin = $stmt->fetch(PDO::FETCH_ASSOC);

            $response['admin_user'] = $admin;
            $response['login'] = 'WOULD BE SUCCESSFUL';

        } catch (Exception $e) {
            $response['db_error'] = $e->getMessage();
        }

    } else {
        $response['auth_result'] = 'FAILED - Wrong password';
    }
} else {
    $response['auth_result'] = 'FAILED - No password in request';
}

echo json_encode($response, JSON_PRETTY_PRINT);
?>