-- ============================================
-- CREAR TABLA RECETAS_PENDIENTES
-- EJECUTAR EN PHPMYADMIN DE HOSTPOINT
-- ============================================

CREATE TABLE IF NOT EXISTS recetas_pendientes (
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
    servings INT,
    original_servings INT,
    is_favorite BOOLEAN DEFAULT FALSE,
    prep_time INT, -- En minutos
    cook_time INT, -- En minutos
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    category VARCHAR(100), -- Categoría de la receta
    category_id VARCHAR(100), -- ID de categoría
    tags JSON, -- Array de etiquetas
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_created (created_at DESC),
    FULLTEXT idx_search (title, analysis, instructions)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla para imágenes adicionales de recetas pendientes
CREATE TABLE IF NOT EXISTS recetas_pendientes_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    recipe_id INT NOT NULL,
    image_url VARCHAR(500),
    image_base64 LONGTEXT, -- Temporal para migración
    caption VARCHAR(255),
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipe_id) REFERENCES recetas_pendientes(id) ON DELETE CASCADE,
    INDEX idx_recipe (recipe_id),
    INDEX idx_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verificar que se crearon las tablas
SHOW TABLES LIKE '%pendientes%';