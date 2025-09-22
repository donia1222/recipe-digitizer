<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Test creating and verifying a user
try {
    $pdo = new PDO(
        'mysql:host=owoxogis.mysql.db.internal;dbname=owoxogis_recipedigitalizer;charset=utf8mb4',
        'owoxogis_recipe',
        'sevelen9475'
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Test user data
    $testUser = 'test_' . time();
    $testPass = 'test123';
    $testEmail = 'test' . time() . '@example.com';

    // Create user
    $userId = 'user_' . uniqid();
    $hashedPassword = password_hash($testPass, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("INSERT INTO users (id, name, email, password, role, active, created_at)
                          VALUES (:id, :name, :email, :password, :role, 1, NOW())");

    $result = $stmt->execute([
        ':id' => $userId,
        ':name' => $testUser,
        ':email' => $testEmail,
        ':password' => $hashedPassword,
        ':role' => 'worker'
    ]);

    if ($result) {
        // Test login
        $stmt = $pdo->prepare("SELECT * FROM users WHERE name = :name");
        $stmt->execute([':name' => $testUser]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        $loginWorks = false;
        if ($user && password_verify($testPass, $user['password'])) {
            $loginWorks = true;
        }

        echo json_encode([
            'success' => true,
            'test_user_created' => true,
            'user_data' => [
                'id' => $userId,
                'name' => $testUser,
                'email' => $testEmail,
                'role' => 'worker'
            ],
            'login_test' => [
                'username' => $testUser,
                'password' => $testPass,
                'would_work' => $loginWorks
            ],
            'message' => $loginWorks ?
                "Usuario de prueba creado. Intenta login con: $testUser / $testPass" :
                "Usuario creado pero login falló"
        ], JSON_PRETTY_PRINT);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to create test user']);
    }

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
?>