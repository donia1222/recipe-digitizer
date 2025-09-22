<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Script para crear el usuario admin inicial
// IMPORTANTE: Eliminar este archivo después de usarlo por seguridad

try {
    // Conexión a BD
    $pdo = new PDO(
        'mysql:host=owoxogis.mysql.db.internal;dbname=owoxogis_recipedigitalizer;charset=utf8mb4',
        'owoxogis_recipe',
        'sevelen9475'
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Verificar si ya existe un admin
    $stmt = $pdo->prepare("SELECT * FROM users WHERE name = :name OR role = 'admin' LIMIT 1");
    $stmt->execute([':name' => 'admin']);
    $existingAdmin = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existingAdmin) {
        // Si ya existe, actualizar la contraseña
        $stmt = $pdo->prepare("UPDATE users SET
            password = :password,
            role = 'admin',
            active = 1,
            last_active = NOW()
            WHERE id = :id");

        $result = $stmt->execute([
            ':password' => password_hash('sevelen9475', PASSWORD_DEFAULT),
            ':id' => $existingAdmin['id']
        ]);

        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Usuario admin actualizado exitosamente',
                'user' => [
                    'id' => $existingAdmin['id'],
                    'name' => $existingAdmin['name'],
                    'email' => $existingAdmin['email'],
                    'role' => 'admin'
                ]
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'error' => 'Error al actualizar el usuario admin'
            ]);
        }
    } else {
        // Crear nuevo usuario admin
        $adminId = 'admin_' . uniqid();

        $stmt = $pdo->prepare("INSERT INTO users (
            id,
            name,
            email,
            password,
            role,
            active,
            created_at,
            last_active
        ) VALUES (
            :id,
            :name,
            :email,
            :password,
            :role,
            1,
            NOW(),
            NOW()
        )");

        $result = $stmt->execute([
            ':id' => $adminId,
            ':name' => 'admin',
            ':email' => 'admin@garbi.ch',
            ':password' => password_hash('sevelen9475', PASSWORD_DEFAULT),
            ':role' => 'admin'
        ]);

        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Usuario admin creado exitosamente',
                'user' => [
                    'id' => $adminId,
                    'name' => 'admin',
                    'email' => 'admin@garbi.ch',
                    'role' => 'admin'
                ],
                'credentials' => [
                    'username' => 'admin',
                    'password' => 'sevelen9475'
                ]
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'error' => 'Error al crear el usuario admin'
            ]);
        }
    }

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error de base de datos: ' . $e->getMessage()
    ]);
}
?>