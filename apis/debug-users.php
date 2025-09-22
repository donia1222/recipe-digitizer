<?php
header('Content-Type: text/html; charset=utf-8');
header("Access-Control-Allow-Origin: *");

// Archivo de depuración completa para usuarios
?>
<!DOCTYPE html>
<html>
<head>
    <title>Debug Users System</title>
    <style>
        body { font-family: monospace; padding: 20px; }
        .success { color: green; }
        .error { color: red; }
        .info { color: blue; }
        pre { background: #f4f4f4; padding: 10px; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f2f2f2; }
        .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ccc; }
    </style>
</head>
<body>
    <h1>Sistema de Usuarios - Diagnóstico Completo</h1>

<?php
try {
    $pdo = new PDO(
        'mysql:host=owoxogis.mysql.db.internal;dbname=owoxogis_recipedigitalizer;charset=utf8mb4',
        'owoxogis_recipe',
        'sevelen9475'
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "<p class='success'>✓ Conexión a BD exitosa</p>";

    // 1. Listar todos los usuarios
    echo "<div class='test-section'>";
    echo "<h2>1. Usuarios en la Base de Datos</h2>";

    $stmt = $pdo->query("SELECT id, name, email, role, active, created_at,
                         CASE WHEN password IS NOT NULL AND password != '' THEN 'SI' ELSE 'NO' END as tiene_password
                         FROM users ORDER BY created_at DESC");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "<p>Total usuarios: " . count($users) . "</p>";
    echo "<table>";
    echo "<tr><th>ID</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Activo</th><th>Tiene Password</th><th>Creado</th></tr>";

    foreach ($users as $user) {
        $activeClass = $user['active'] == 1 ? 'success' : 'error';
        $passClass = $user['tiene_password'] == 'SI' ? 'success' : 'error';
        echo "<tr>";
        echo "<td>" . substr($user['id'], 0, 20) . "...</td>";
        echo "<td><strong>" . htmlspecialchars($user['name']) . "</strong></td>";
        echo "<td>" . htmlspecialchars($user['email']) . "</td>";
        echo "<td>" . $user['role'] . "</td>";
        echo "<td class='$activeClass'>" . ($user['active'] == 1 ? 'SI' : 'NO') . "</td>";
        echo "<td class='$passClass'>" . $user['tiene_password'] . "</td>";
        echo "<td>" . $user['created_at'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
    echo "</div>";

    // 2. Test de creación de usuario
    echo "<div class='test-section'>";
    echo "<h2>2. Test de Creación de Usuario</h2>";

    $testName = 'test_' . date('His');
    $testEmail = 'test_' . date('His') . '@test.com';
    $testPassword = 'test123';
    $testId = 'user_test_' . uniqid();

    echo "<p>Creando usuario de prueba:</p>";
    echo "<ul>";
    echo "<li>Nombre: <strong>$testName</strong></li>";
    echo "<li>Email: $testEmail</li>";
    echo "<li>Password: <strong>$testPassword</strong></li>";
    echo "<li>Rol: worker</li>";
    echo "</ul>";

    $hashedPassword = password_hash($testPassword, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("INSERT INTO users (id, name, email, password, role, active, created_at)
                          VALUES (:id, :name, :email, :password, 'worker', 1, NOW())");

    $created = $stmt->execute([
        ':id' => $testId,
        ':name' => $testName,
        ':email' => $testEmail,
        ':password' => $hashedPassword
    ]);

    if ($created) {
        echo "<p class='success'>✓ Usuario creado exitosamente</p>";

        // Verificar que se guardó
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id");
        $stmt->execute([':id' => $testId]);
        $newUser = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($newUser) {
            echo "<p class='success'>✓ Usuario encontrado en BD</p>";
            echo "<p>Hash del password guardado: <code>" . substr($newUser['password'], 0, 60) . "...</code></p>";

            // Test de verificación de password
            $passwordCorrect = password_verify($testPassword, $newUser['password']);
            if ($passwordCorrect) {
                echo "<p class='success'>✓ Password se puede verificar correctamente</p>";
            } else {
                echo "<p class='error'>✗ Password NO se puede verificar</p>";
            }
        } else {
            echo "<p class='error'>✗ Usuario NO se encontró después de crear</p>";
        }
    } else {
        echo "<p class='error'>✗ Error al crear usuario</p>";
    }
    echo "</div>";

    // 3. Test de Login
    echo "<div class='test-section'>";
    echo "<h2>3. Test de Login (Simulación)</h2>";

    // Test con el usuario recién creado
    if (isset($testName)) {
        echo "<p>Probando login con: <strong>$testName / $testPassword</strong></p>";

        $stmt = $pdo->prepare("SELECT * FROM users WHERE (name = :username OR email = :username) AND active = 1");
        $stmt->execute([':username' => $testName]);
        $loginUser = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($loginUser) {
            echo "<p class='success'>✓ Usuario encontrado por nombre</p>";

            if (!empty($loginUser['password'])) {
                echo "<p class='success'>✓ Usuario tiene password</p>";

                if (password_verify($testPassword, $loginUser['password'])) {
                    echo "<p class='success'>✓ PASSWORD CORRECTO - LOGIN EXITOSO</p>";
                    echo "<div style='background: #d4edda; padding: 10px; margin: 10px 0;'>";
                    echo "<strong>Este usuario PUEDE hacer login con:</strong><br>";
                    echo "Usuario: $testName<br>";
                    echo "Password: $testPassword<br>";
                    echo "Rol: " . $loginUser['role'];
                    echo "</div>";
                } else {
                    echo "<p class='error'>✗ Password incorrecto</p>";
                }
            } else {
                echo "<p class='error'>✗ Usuario sin password</p>";
            }
        } else {
            echo "<p class='error'>✗ Usuario no encontrado o inactivo</p>";
        }
    }
    echo "</div>";

    // 4. Test con usuario específico
    echo "<div class='test-section'>";
    echo "<h2>4. Verificar Usuario Específico</h2>";
    echo "<p>Para verificar un usuario específico, añade <code>?user=NOMBRE</code> a la URL</p>";

    if (isset($_GET['user'])) {
        $checkUser = $_GET['user'];
        echo "<p>Verificando usuario: <strong>$checkUser</strong></p>";

        $stmt = $pdo->prepare("SELECT * FROM users WHERE name = :name");
        $stmt->execute([':name' => $checkUser]);
        $userToCheck = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($userToCheck) {
            echo "<table>";
            echo "<tr><th>Campo</th><th>Valor</th></tr>";
            echo "<tr><td>ID</td><td>" . $userToCheck['id'] . "</td></tr>";
            echo "<tr><td>Nombre</td><td>" . $userToCheck['name'] . "</td></tr>";
            echo "<tr><td>Email</td><td>" . $userToCheck['email'] . "</td></tr>";
            echo "<tr><td>Rol</td><td>" . $userToCheck['role'] . "</td></tr>";
            echo "<tr><td>Activo</td><td>" . ($userToCheck['active'] ? 'SI' : 'NO') . "</td></tr>";
            echo "<tr><td>Tiene Password</td><td>" . (!empty($userToCheck['password']) ? 'SI' : 'NO') . "</td></tr>";
            echo "</table>";

            if (!empty($userToCheck['password'])) {
                echo "<p class='info'>Este usuario tiene password configurado.</p>";

                if (isset($_GET['pass'])) {
                    $testPass = $_GET['pass'];
                    if (password_verify($testPass, $userToCheck['password'])) {
                        echo "<p class='success'>✓ Password '$testPass' es CORRECTO</p>";
                    } else {
                        echo "<p class='error'>✗ Password '$testPass' es INCORRECTO</p>";
                    }
                } else {
                    echo "<p>Para probar el password, añade <code>&pass=CONTRASEÑA</code> a la URL</p>";
                }
            } else {
                echo "<p class='error'>Este usuario NO tiene password configurado</p>";
            }
        } else {
            echo "<p class='error'>Usuario '$checkUser' no encontrado</p>";
        }
    }
    echo "</div>";

} catch (PDOException $e) {
    echo "<p class='error'>Error de BD: " . $e->getMessage() . "</p>";
}
?>

    <div class='test-section'>
        <h2>Instrucciones</h2>
        <ol>
            <li>Este archivo muestra todos los usuarios en la BD</li>
            <li>Crea un usuario de prueba automáticamente</li>
            <li>Verifica que el password funciona</li>
            <li>Para verificar un usuario específico: <code>?user=NOMBRE&pass=PASSWORD</code></li>
        </ol>

        <h3>Si el login no funciona:</h3>
        <ul>
            <li>Verifica que el usuario aparece en la tabla</li>
            <li>Verifica que tiene password (columna "Tiene Password")</li>
            <li>Verifica que está activo</li>
            <li>Usa el nombre exacto (sensible a mayúsculas)</li>
        </ul>
    </div>

</body>
</html>