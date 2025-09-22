-- ============================================
-- RECIPE DIGITIZER - SCRIPT SQL COMPLETO
-- COPIAR Y PEGAR EN PHPMYADMIN HOSTPOINT
-- ============================================

-- Eliminar base de datos si existe y crear nueva
-- DROP DATABASE IF EXISTS recipe_digitizer;
-- CREATE DATABASE recipe_digitizer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE recipe_digitizer;

-- ============================================
-- TABLA DE USUARIOS
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255), -- Hash BCrypt para admin, NULL para workers/guests
    role ENUM('admin', 'worker', 'guest') NOT NULL DEFAULT 'guest',
    avatar VARCHAR(50) DEFAULT '👤',
    active BOOLEAN DEFAULT TRUE,
    last_active DATETIME,
    recipes_created INT DEFAULT 0,
    permissions JSON, -- Array de permisos específicos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role (role),
    INDEX idx_active (active),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA DE RECETAS
-- ============================================
CREATE TABLE IF NOT EXISTS recipes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    recipe_id VARCHAR(100) UNIQUE, -- ID único para compartir
    title VARCHAR(500),
    ingredients TEXT, -- JSON array
    instructions TEXT,
    analysis TEXT, -- Texto completo del análisis IA
    image_url VARCHAR(500), -- URL de imagen principal
    image_base64 LONGTEXT, -- Respaldo temporal para migración
    user_id VARCHAR(36),
    folder_id VARCHAR(100),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    servings INT,
    original_servings INT,
    is_favorite BOOLEAN DEFAULT FALSE,
    prep_time INT, -- En minutos
    cook_time INT, -- En minutos
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    category VARCHAR(100), -- Categoría de la receta
    tags JSON, -- Array de etiquetas
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_favorite (is_favorite),
    INDEX idx_user (user_id),
    INDEX idx_created (created_at),
    FULLTEXT idx_search (title, analysis, instructions)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA DE COMENTARIOS
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    recipe_id INT NOT NULL,
    user_id VARCHAR(36),
    author_name VARCHAR(255), -- Para usuarios no registrados
    author_role ENUM('admin', 'worker', 'guest') DEFAULT 'guest',
    content TEXT NOT NULL,
    likes INT DEFAULT 0,
    liked_by JSON, -- Array de user_ids que dieron like
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_recipe (recipe_id),
    INDEX idx_user (user_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA DE IMÁGENES ADICIONALES
-- ============================================
CREATE TABLE IF NOT EXISTS recipe_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    recipe_id INT NOT NULL,
    image_url VARCHAR(500),
    image_base64 LONGTEXT, -- Temporal para migración
    caption VARCHAR(255),
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    INDEX idx_recipe (recipe_id),
    INDEX idx_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA DE FAVORITOS (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS user_favorites (
    user_id VARCHAR(36) NOT NULL,
    recipe_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, recipe_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_recipe (recipe_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA DE SESIONES
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    payload TEXT,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA DE SUB-ADMINISTRADORES
-- ============================================
CREATE TABLE IF NOT EXISTS sub_admins (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL UNIQUE,
    can_approve_recipes BOOLEAN DEFAULT FALSE,
    can_manage_users BOOLEAN DEFAULT FALSE,
    can_delete_content BOOLEAN DEFAULT FALSE,
    can_view_analytics BOOLEAN DEFAULT FALSE,
    assigned_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA DE AUDITORÍA (LOG DE ACCIONES)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(36),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50), -- 'recipe', 'user', 'comment', etc
    entity_id VARCHAR(36),
    details JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA DE CONFIGURACIÓN
-- ============================================
CREATE TABLE IF NOT EXISTS app_config (
    config_key VARCHAR(100) PRIMARY KEY,
    config_value TEXT,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INSERTAR DATOS INICIALES
-- ============================================

-- Usuario Admin por defecto
INSERT INTO users (id, name, email, password, role, avatar, active, recipes_created) VALUES
('admin-001', 'Andrea Müller', 'andrea@altersheim-gaerbi.ch', '$2b$10$YourHashedPasswordHere', 'admin', '👨‍💼', TRUE, 0);

-- Usuarios de demostración
INSERT INTO users (id, name, email, role, avatar, active, recipes_created) VALUES
('worker-001', 'Hans Weber', 'hans@altersheim-gaerbi.ch', 'worker', '👨‍🍳', TRUE, 0),
('worker-002', 'Maria Schmidt', 'maria@altersheim-gaerbi.ch', 'worker', '👩‍🍳', TRUE, 0),
('guest-001', 'Peter Fischer', 'peter@visitor.com', 'guest', '👤', TRUE, 0);

-- Configuración inicial
INSERT INTO app_config (config_key, config_value, description) VALUES
('app_name', 'Recipe Digitizer', 'Nombre de la aplicación'),
('max_image_size', '5242880', 'Tamaño máximo de imagen en bytes (5MB)'),
('recipes_per_page', '12', 'Recetas por página en la lista'),
('enable_ai_analysis', 'true', 'Activar análisis con IA'),
('ai_api_endpoint', 'https://foodscan-ai.com/responseImageAnalysis.php', 'Endpoint de la API de IA'),
('session_lifetime', '1440', 'Duración de sesión en minutos (24 horas)');

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista de recetas con información completa
CREATE OR REPLACE VIEW v_recipes_full AS
SELECT
    r.*,
    u.name as author_name,
    u.role as author_role,
    (SELECT COUNT(*) FROM comments WHERE recipe_id = r.id) as comment_count,
    (SELECT COUNT(*) FROM user_favorites WHERE recipe_id = r.id) as favorite_count,
    (SELECT COUNT(*) FROM recipe_images WHERE recipe_id = r.id) as image_count
FROM recipes r
LEFT JOIN users u ON r.user_id = u.id;

-- Vista de estadísticas de usuarios
CREATE OR REPLACE VIEW v_user_stats AS
SELECT
    u.*,
    (SELECT COUNT(*) FROM recipes WHERE user_id = u.id) as total_recipes,
    (SELECT COUNT(*) FROM recipes WHERE user_id = u.id AND status = 'approved') as approved_recipes,
    (SELECT COUNT(*) FROM comments WHERE user_id = u.id) as total_comments,
    (SELECT COUNT(*) FROM user_favorites WHERE user_id = u.id) as total_favorites
FROM users u;

-- ============================================
-- PROCEDIMIENTOS ALMACENADOS
-- ============================================

DELIMITER //

-- Procedimiento para aprobar receta
CREATE PROCEDURE sp_approve_recipe(
    IN p_recipe_id INT,
    IN p_approved_by VARCHAR(36)
)
BEGIN
    UPDATE recipes
    SET status = 'approved',
        updated_at = NOW()
    WHERE id = p_recipe_id;

    INSERT INTO audit_log (user_id, action, entity_type, entity_id)
    VALUES (p_approved_by, 'approve_recipe', 'recipe', p_recipe_id);
END//

-- Procedimiento para incrementar vistas
CREATE PROCEDURE sp_increment_views(IN p_recipe_id INT)
BEGIN
    UPDATE recipes
    SET views = views + 1
    WHERE id = p_recipe_id;
END//

-- Procedimiento para toggle favorito
CREATE PROCEDURE sp_toggle_favorite(
    IN p_user_id VARCHAR(36),
    IN p_recipe_id INT
)
BEGIN
    IF EXISTS (SELECT 1 FROM user_favorites WHERE user_id = p_user_id AND recipe_id = p_recipe_id) THEN
        DELETE FROM user_favorites WHERE user_id = p_user_id AND recipe_id = p_recipe_id;
    ELSE
        INSERT INTO user_favorites (user_id, recipe_id) VALUES (p_user_id, p_recipe_id);
    END IF;
END//

DELIMITER ;

-- ============================================
-- ÍNDICES ADICIONALES PARA PERFORMANCE
-- ============================================
CREATE INDEX idx_recipes_status_created ON recipes(status, created_at DESC);
CREATE INDEX idx_comments_recipe_created ON comments(recipe_id, created_at DESC);
CREATE INDEX idx_audit_user_created ON audit_log(user_id, created_at DESC);

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
-- Verificar tablas creadas:
-- SHOW TABLES;
--
-- Verificar estructura de una tabla:
-- DESCRIBE users;
--
-- Contar registros iniciales:
-- SELECT 'users' as tabla, COUNT(*) as total FROM users
-- UNION SELECT 'recipes', COUNT(*) FROM recipes
-- UNION SELECT 'config', COUNT(*) FROM app_config;