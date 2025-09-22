<?php
/**
 * CONFIGURACIÓN DE BASE DE DATOS Y SISTEMA
 * Archivo: wwwdimijizp/apis/config.php
 *
 * IMPORTANTE: Cambiar estos valores con los datos de Hostpoint
 */

// Prevenir acceso directo
if (!defined('API_ACCESS')) {
    define('API_ACCESS', true);
}

// ============================================
// CONFIGURACIÓN DE BASE DE DATOS - HOSTPOINT
// ============================================
define('DB_HOST', 'owoxogis.mysql.db.internal'); // Host de Hostpoint
define('DB_NAME', 'owoxogis_recipedigitalizer'); // Nombre de la BD
define('DB_USER', 'owoxogis_recipe'); // Usuario MySQL
define('DB_PASS', 'sevelen9475'); // Contraseña MySQL de Hostpoint
define('DB_CHARSET', 'utf8mb4');

// ============================================
// CONFIGURACIÓN DE SEGURIDAD
// ============================================
define('JWT_SECRET', 'sevelen9475'); // Cambiar por una clave segura
define('JWT_EXPIRY', 86400); // 24 horas en segundos
define('ADMIN_PASSWORD', 'Andrea1606'); // Contraseña de admin (misma que en Next.js)

// ============================================
// CONFIGURACIÓN DE CORS
// ============================================
define('ALLOWED_ORIGIN', '*'); // Permitir todos los orígenes temporalmente
define('ALLOWED_METHODS', 'GET, POST, PUT, DELETE, OPTIONS');
define('ALLOWED_HEADERS', 'Content-Type, Authorization, X-Requested-With');

// ============================================
// CONFIGURACIÓN DE UPLOADS
// ============================================
define('UPLOAD_DIR', __DIR__ . '/../uploads/'); // Directorio de uploads
define('UPLOAD_URL', 'https://web.lweb.ch/recipedigitalizer/uploads/'); // URL base para imágenes
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB máximo
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'gif', 'webp']);

// ============================================
// CONFIGURACIÓN DE API
// ============================================
define('API_VERSION', 'v1');
define('ITEMS_PER_PAGE', 12);
define('DEBUG_MODE', false); // Cambiar a false en producción

// ============================================
// ZONA HORARIA
// ============================================
date_default_timezone_set('Europe/Zurich');

// ============================================
// FUNCIONES DE CONEXIÓN A BASE DE DATOS
// ============================================

/**
 * Obtener conexión PDO a la base de datos
 */
function getDBConnection() {
    static $pdo = null;

    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ];

            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);

        } catch (PDOException $e) {
            if (DEBUG_MODE) {
                die("Error de conexión: " . $e->getMessage());
            } else {
                die("Error de conexión a la base de datos");
            }
        }
    }

    return $pdo;
}

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

/**
 * Configurar headers CORS
 */
function setCORSHeaders() {
    header("Access-Control-Allow-Origin: " . ALLOWED_ORIGIN);
    header("Access-Control-Allow-Methods: " . ALLOWED_METHODS);
    header("Access-Control-Allow-Headers: " . ALLOWED_HEADERS);
    header("Access-Control-Max-Age: 3600");
    header("Content-Type: application/json; charset=UTF-8");

    // Si es una petición OPTIONS (preflight), terminar aquí
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

/**
 * Enviar respuesta JSON
 */
function sendJSON($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

/**
 * Enviar error JSON
 */
function sendError($message, $statusCode = 400) {
    sendJSON(['error' => $message], $statusCode);
}

/**
 * Validar token JWT (simplificado - considera usar firebase/php-jwt en producción)
 */
function validateJWT($token) {
    // Implementación básica - en producción usar librería JWT
    if (!$token) {
        return false;
    }

    // Aquí iría la validación real del JWT
    // Por ahora retornamos true para desarrollo
    return true;
}

/**
 * Obtener datos del request body
 */
function getRequestData() {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

    if (strpos($contentType, 'application/json') !== false) {
        $input = file_get_contents('php://input');
        return json_decode($input, true) ?? [];
    }

    return $_POST;
}

/**
 * Sanitizar entrada
 */
function sanitize($input) {
    if (is_array($input)) {
        return array_map('sanitize', $input);
    }
    return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
}

/**
 * Generar ID único
 */
function generateUUID() {
    return sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

/**
 * Log de errores (para debugging)
 */
function logError($message, $context = []) {
    if (DEBUG_MODE) {
        error_log(date('Y-m-d H:i:s') . " - " . $message . " - " . json_encode($context));
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================

// Configurar reporte de errores
if (DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Configurar límites
ini_set('post_max_size', '10M');
ini_set('upload_max_filesize', '10M');
ini_set('max_execution_time', 300);

// Crear directorio de uploads si no existe
if (!file_exists(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0755, true);
}

?>