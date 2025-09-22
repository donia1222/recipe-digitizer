<?php
/**
 * FIX PARA USUARIO ADMIN
 * Archivo temporal para arreglar el login de admin
 * BORRAR DESPUÉS DE USAR
 */

header('Content-Type: application/json');

// Configuración
$config = [
    'host' => 'owoxogis.mysql.db.internal',
    'db' => 'owoxogis_recipedigitalizer',
    'user' => 'owoxogis_recipe',
    'pass' => 'sevelen9475'
];

try {
    $dsn = "mysql:host={$config['host']};dbname={$config['db']};charset=utf8mb4";
    $pdo = new PDO($dsn, $config['user'], $config['pass']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Generar hash de la contraseña
    $password = 'Andrea1606';
    $hash = password_hash($password, PASSWORD_BCRYPT);

    // Actualizar usuario admin
    $sql = "UPDATE users SET password = :password WHERE id = 'admin-001'";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':password' => $hash]);

    echo json_encode([
        'success' => true,
        'message' => 'Admin password updated',
        'hash' => $hash
    ], JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
?>