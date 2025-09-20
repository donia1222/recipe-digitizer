# 🍳 Migración Recipe Digitizer a Base de Datos

## 📋 Guía Completa para Migrar de localStorage a MySQL con HostPoint

### 🎯 Objetivo
Migrar toda la aplicación Recipe Digitizer de almacenamiento local (localStorage) a una base de datos MySQL con API PHP, manteniendo todas las funcionalidades actuales y añadiendo nuevas características.

---

## 📊 Estado Actual de la Aplicación

### Datos que se guardan en localStorage:
- `recipe-servings` - Porciones de recetas
- `recipe-original-servings` - Porciones originales
- `recipeHistory` - Historial de recetas analizadas
- `recipeFolders` - Carpetas organizativas
- `recipe-images-{id}` - Imágenes de recetas (Base64)
- `recipeDigitizerSettings` - Configuraciones de usuario
- `recipe-auth` - Estado de autenticación
- `user-role` - Rol del usuario (admin/worker/guest)
- `userRecipes` - Recetas del usuario
- `userNotifications` - Notificaciones

### Tecnologías actuales:
- **Frontend**: Next.js 15 + React 19 + TypeScript
- **UI**: Radix UI + Tailwind CSS
- **Almacenamiento**: localStorage (navegador)
- **Autenticación**: Básica con localStorage

---

## 🗄️ Estructura de Base de Datos MySQL

### Tabla: `users`
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'worker', 'guest') DEFAULT 'guest',
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    avatar_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);
```

### Tabla: `recipes`
```sql
CREATE TABLE recipes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    servings INT DEFAULT 2,
    original_servings INT DEFAULT 2,
    folder_id INT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    tags JSON,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    prep_time INT, -- minutos
    cook_time INT, -- minutos
    calories_per_serving INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL,
    INDEX idx_user_recipes (user_id),
    INDEX idx_public_recipes (is_public),
    FULLTEXT KEY ft_recipe_search (title, content)
);
```

### Tabla: `folders`
```sql
CREATE TABLE folders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- hex color
    is_shared BOOLEAN DEFAULT FALSE,
    parent_folder_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_folder_id) REFERENCES folders(id) ON DELETE CASCADE,
    INDEX idx_user_folders (user_id)
);
```

### Tabla: `recipe_images`
```sql
CREATE TABLE recipe_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    recipe_id INT NOT NULL,
    image_data LONGTEXT NOT NULL, -- Base64 encoded
    image_name VARCHAR(255),
    image_size INT, -- bytes
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    INDEX idx_recipe_images (recipe_id)
);
```

### Tabla: `user_settings`
```sql
CREATE TABLE user_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_setting (user_id, setting_key)
);
```

### Tabla: `notifications`
```sql
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(255),
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_notifications (user_id, is_read)
);
```

### Tabla: `recipe_history`
```sql
CREATE TABLE recipe_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    recipe_id INT NOT NULL,
    action ENUM('created', 'viewed', 'edited', 'deleted') NOT NULL,
    metadata JSON, -- datos adicionales del historial
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    INDEX idx_user_history (user_id, created_at)
);
```

### Tabla: `sessions` (para autenticación)
```sql
CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id INT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_session_expiry (expires_at)
);
```

---

## 🔌 Estructura API PHP

### Estructura de Carpetas en HostPoint:
```
/public_html/tu-dominio/
├── api/
│   ├── config/
│   │   ├── database.php
│   │   ├── cors.php
│   │   └── auth.php
│   ├── middleware/
│   │   ├── auth_middleware.php
│   │   └── role_middleware.php
│   ├── controllers/
│   │   ├── AuthController.php
│   │   ├── UserController.php
│   │   ├── RecipeController.php
│   │   ├── FolderController.php
│   │   ├── ImageController.php
│   │   └── AdminController.php
│   ├── models/
│   │   ├── User.php
│   │   ├── Recipe.php
│   │   ├── Folder.php
│   │   └── Database.php
│   ├── utils/
│   │   ├── response.php
│   │   ├── validation.php
│   │   └── helpers.php
│   └── endpoints/
│       ├── auth.php
│       ├── users.php
│       ├── recipes.php
│       ├── folders.php
│       ├── images.php
│       ├── admin.php
│       └── settings.php
├── install/
│   ├── setup.php
│   ├── migrate.php
│   └── database.sql
└── _next/ (archivos compilados de Next.js)
```

### Endpoints de la API:

#### **Autenticación**
- `POST /api/auth.php?action=login` - Iniciar sesión
- `POST /api/auth.php?action=logout` - Cerrar sesión
- `POST /api/auth.php?action=register` - Registrar usuario
- `GET /api/auth.php?action=verify` - Verificar sesión
- `POST /api/auth.php?action=forgot-password` - Recuperar contraseña

#### **Usuarios**
- `GET /api/users.php` - Listar usuarios (admin)
- `GET /api/users.php?id={id}` - Obtener usuario específico
- `POST /api/users.php` - Crear usuario
- `PUT /api/users.php?id={id}` - Actualizar usuario
- `DELETE /api/users.php?id={id}` - Eliminar usuario
- `GET /api/users.php?action=profile` - Perfil del usuario actual

#### **Recetas**
- `GET /api/recipes.php` - Listar recetas del usuario
- `GET /api/recipes.php?id={id}` - Obtener receta específica
- `POST /api/recipes.php` - Crear nueva receta
- `PUT /api/recipes.php?id={id}` - Actualizar receta
- `DELETE /api/recipes.php?id={id}` - Eliminar receta
- `GET /api/recipes.php?action=public` - Recetas públicas
- `GET /api/recipes.php?action=search&q={query}` - Buscar recetas

#### **Carpetas**
- `GET /api/folders.php` - Listar carpetas del usuario
- `POST /api/folders.php` - Crear carpeta
- `PUT /api/folders.php?id={id}` - Actualizar carpeta
- `DELETE /api/folders.php?id={id}` - Eliminar carpeta
- `POST /api/folders.php?action=move&recipe_id={id}&folder_id={id}` - Mover receta

#### **Imágenes**
- `POST /api/images.php` - Subir imagen
- `GET /api/images.php?recipe_id={id}` - Obtener imágenes de receta
- `DELETE /api/images.php?id={id}` - Eliminar imagen

#### **Configuraciones**
- `GET /api/settings.php` - Obtener configuraciones del usuario
- `POST /api/settings.php` - Guardar configuraciones
- `PUT /api/settings.php?key={key}` - Actualizar configuración específica

#### **Admin**
- `GET /api/admin.php?action=stats` - Estadísticas del sistema
- `GET /api/admin.php?action=users` - Gestión de usuarios
- `POST /api/admin.php?action=user-role` - Cambiar rol de usuario
- `GET /api/admin.php?action=system-settings` - Configuraciones del sistema

---

## 🚀 Proceso de Deployment

### 1. Preparación del Hosting (HostPoint)

#### Crear Base de Datos:
1. Acceder al panel de HostPoint
2. Crear nueva base de datos MySQL
3. Crear usuario de base de datos
4. Asignar permisos completos al usuario

#### Configurar FTP:
1. Obtener credenciales FTP del hosting
2. Configurar acceso FTP en tu PC local

### 2. Script de Deployment (`deploy.sh`)

```bash
#!/bin/bash

# Configuración
FTP_HOST="ftp.tu-hosting.com"
FTP_USER="tu_usuario_ftp"
FTP_PASS="tu_password_ftp"
REMOTE_PATH="/public_html/tu-dominio"
LOCAL_BUILD_PATH="./out"

echo "🚀 Iniciando deployment de Recipe Digitizer..."

# 1. Build de la aplicación Next.js
echo "📦 Compilando aplicación Next.js..."
npm run build
npm run export

# 2. Verificar que el build fue exitoso
if [ ! -d "$LOCAL_BUILD_PATH" ]; then
    echo "❌ Error: No se encontró el directorio de build"
    exit 1
fi

# 3. Subir archivos via FTP
echo "📤 Subiendo archivos al servidor..."
lftp -c "
set ftp:ssl-allow no
open -u $FTP_USER,$FTP_PASS $FTP_HOST
mirror -R $LOCAL_BUILD_PATH $REMOTE_PATH/_next --verbose
put api/ $REMOTE_PATH/api/
put install/ $REMOTE_PATH/install/
quit
"

# 4. Verificar deployment
echo "✅ Deployment completado!"
echo "🌐 Tu aplicación está disponible en: https://tu-dominio.com"
echo "🔧 Ejecuta la instalación en: https://tu-dominio.com/install/setup.php"
```

### 3. Automatización con GitHub Actions (Opcional)

```yaml
# .github/workflows/deploy.yml
name: Deploy to HostPoint

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2

    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm install

    - name: Build application
      run: npm run build && npm run export

    - name: Deploy via FTP
      uses: SamKirkland/FTP-Deploy-Action@4.0.0
      with:
        server: ${{ secrets.FTP_HOST }}
        username: ${{ secrets.FTP_USER }}
        password: ${{ secrets.FTP_PASS }}
        local-dir: ./out/
        server-dir: /public_html/tu-dominio/
```

---

## 🔄 Migración de Datos

### 1. Script de Migración de localStorage a MySQL

#### Frontend - Exportar datos de localStorage:
```javascript
// Función para exportar todos los datos del localStorage
function exportLocalStorageData() {
  const data = {
    recipes: JSON.parse(localStorage.getItem('recipeHistory') || '[]'),
    folders: JSON.parse(localStorage.getItem('recipeFolders') || '[]'),
    settings: JSON.parse(localStorage.getItem('recipeDigitizerSettings') || '{}'),
    userRecipes: JSON.parse(localStorage.getItem('userRecipes') || '[]'),
    notifications: JSON.parse(localStorage.getItem('userNotifications') || '[]'),
    servings: localStorage.getItem('recipe-servings'),
    originalServings: localStorage.getItem('recipe-original-servings'),
    auth: localStorage.getItem('recipe-auth'),
    userRole: localStorage.getItem('user-role')
  };

  // Exportar imágenes
  const images = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('recipe-images-')) {
      images[key] = localStorage.getItem(key);
    }
  }
  data.images = images;

  return data;
}

// Crear archivo de migración
function downloadMigrationFile() {
  const data = exportLocalStorageData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'recipe-digitizer-migration.json';
  a.click();
}
```

#### Backend - Script de importación PHP:
```php
// install/migrate.php
<?php
// Script para importar datos del archivo de migración
if ($_POST['action'] === 'import') {
    $uploadedFile = $_FILES['migration_file'];
    $migrationData = json_decode(file_get_contents($uploadedFile['tmp_name']), true);

    // Importar usuarios, recetas, carpetas, etc.
    importMigrationData($migrationData);
}
?>
```

### 2. Mapeo de Datos

#### localStorage → MySQL:
- `recipeHistory` → tabla `recipes` + `recipe_history`
- `recipeFolders` → tabla `folders`
- `recipe-images-*` → tabla `recipe_images`
- `userRecipes` → tabla `recipes`
- `userNotifications` → tabla `notifications`
- `recipeDigitizerSettings` → tabla `user_settings`
- `recipe-auth` + `user-role` → tabla `users` + `sessions`

---

## 🔐 Sistema de Autenticación

### 1. Flujo de Autenticación
1. **Login**: Usuario envía credenciales → API valida → genera session token
2. **Middleware**: Cada request verifica token de sesión
3. **Roles**: Admin, Worker, Guest con permisos diferenciados
4. **Logout**: Invalida session token

### 2. Seguridad
- Passwords hasheados con `password_hash()` PHP
- Sessions con tokens seguros
- Validación CSRF
- Rate limiting en login
- HTTPS obligatorio en producción

---

## 👤 Panel de Administración

### Funcionalidades Admin:
1. **Gestión de Usuarios**
   - Ver lista de usuarios
   - Crear/editar/eliminar usuarios
   - Cambiar roles y permisos
   - Ver estadísticas de uso

2. **Gestión de Contenido**
   - Ver todas las recetas del sistema
   - Moderar contenido público
   - Gestionar carpetas compartidas
   - Estadísticas de recetas

3. **Configuración del Sistema**
   - Configuraciones globales
   - Límites de almacenamiento
   - Configuración de email
   - Backup y mantenimiento

4. **Estadísticas y Reportes**
   - Usuarios activos
   - Recetas creadas por período
   - Uso de almacenamiento
   - Logs de actividad

---

## 📱 Actualización del Frontend

### 1. Reemplazar localStorage con API calls:
```typescript
// hooks/useApi.ts
export const useRecipes = () => {
  const [recipes, setRecipes] = useState([]);

  const fetchRecipes = async () => {
    const response = await fetch('/api/recipes.php');
    const data = await response.json();
    setRecipes(data);
  };

  const createRecipe = async (recipe) => {
    await fetch('/api/recipes.php', {
      method: 'POST',
      body: JSON.stringify(recipe)
    });
    fetchRecipes(); // Refresh
  };

  return { recipes, fetchRecipes, createRecipe };
};
```

### 2. Context para autenticación:
```typescript
// contexts/AuthContext.tsx
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = async (credentials) => {
    const response = await fetch('/api/auth.php?action=login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    const data = await response.json();
    setUser(data.user);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## 🛠️ Instalación y Configuración

### 1. Pasos de Instalación:

1. **Preparar Hosting**
   - Crear base de datos MySQL
   - Configurar FTP
   - Subir archivos

2. **Ejecutar Setup**
   - Visitar `/install/setup.php`
   - Configurar conexión a DB
   - Crear usuario admin inicial
   - Importar estructura de tablas

3. **Migrar Datos**
   - Exportar datos de localStorage
   - Importar via `/install/migrate.php`
   - Verificar migración

4. **Configurar Frontend**
   - Actualizar endpoints de API
   - Probar autenticación
   - Verificar funcionalidades

### 2. Configuración de Producción:

```php
// api/config/database.php
<?php
return [
    'host' => 'localhost', // o IP del servidor MySQL
    'dbname' => 'tu_base_datos',
    'username' => 'tu_usuario_db',
    'password' => 'tu_password_db',
    'charset' => 'utf8mb4',
    'options' => [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]
];
?>
```

---

## 🧪 Testing y Validación

### 1. Checklist de Funcionalidades:
- [ ] Login/logout funciona correctamente
- [ ] Creación/edición/eliminación de recetas
- [ ] Gestión de carpetas
- [ ] Subida y visualización de imágenes
- [ ] Panel de administración
- [ ] Roles y permisos
- [ ] Migración de datos completa
- [ ] Backup y restauración

### 2. Testing de API:
```bash
# Test de login
curl -X POST "https://tu-dominio.com/api/auth.php?action=login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# Test de recetas
curl -X GET "https://tu-dominio.com/api/recipes.php" \
  -H "Authorization: Bearer tu_token"
```

---

## 📞 Soporte y Mantenimiento

### 1. Backup Automático:
```bash
#!/bin/bash
# backup.sh - Ejecutar diariamente via cron
mysqldump -u usuario -p password base_datos > backup_$(date +%Y%m%d).sql
```

### 2. Monitoreo:
- Logs de errores PHP
- Monitoreo de espacio en disco
- Alertas de seguridad
- Estadísticas de uso

### 3. Actualizaciones:
- Versionado de la API
- Migraciones de DB
- Updates del frontend
- Patches de seguridad

---

## 🎉 Beneficios de la Migración

1. **✅ Persistencia de Datos**: Los datos no se pierden al limpiar el navegador
2. **👥 Multi-usuario**: Varios usuarios pueden usar la aplicación
3. **🔐 Seguridad**: Sistema de autenticación robusto
4. **📊 Panel Admin**: Gestión centralizada de usuarios y contenido
5. **📱 Sincronización**: Acceso desde múltiples dispositivos
6. **🔄 Backup**: Respaldo automático de datos
7. **⚡ Performance**: Mejor rendimiento con base de datos
8. **🌐 Escalabilidad**: Fácil agregar nuevas funcionalidades

---

## 🚨 Consideraciones Importantes

1. **Backup**: Siempre hacer backup antes de migrar
2. **Testing**: Probar en entorno de desarrollo primero
3. **SSL**: Configurar HTTPS para seguridad
4. **Performance**: Optimizar consultas de base de datos
5. **Límites**: Configurar límites de almacenamiento
6. **Monitoreo**: Implementar logs y alertas

---

¿Estás listo para proceder con la implementación? 🚀