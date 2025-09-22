<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Database connection test
try {
    $pdo = new PDO(
        'mysql:host=owoxogis.mysql.db.internal;dbname=owoxogis_recipedigitalizer;charset=utf8mb4',
        'owoxogis_recipe',
        'sevelen9475'
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Test users table
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM users");
    $userCount = $stmt->fetch(PDO::FETCH_ASSOC);

    // Get all users
    $stmt = $pdo->query("SELECT id, name, email, role, active, created_at FROM users ORDER BY created_at DESC");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Test sub_admins table
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM sub_admins");
    $subAdminCount = $stmt->fetch(PDO::FETCH_ASSOC);

    // Test recipes table
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM recipes");
    $recipeCount = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'message' => 'Database connection successful',
        'stats' => [
            'users' => $userCount['total'],
            'sub_admins' => $subAdminCount['total'],
            'recipes' => $recipeCount['total']
        ],
        'users_list' => $users
    ], JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed: ' . $e->getMessage()
    ]);
}
?>