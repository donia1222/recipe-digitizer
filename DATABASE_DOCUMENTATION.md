# 📊 Documentación del Sistema de Base de Datos - Recipe Digitizer

## 🎯 Estado Actual del Proyecto

### ✅ Implementado y Funcionando:
- **Base de datos MySQL** en Hostpoint (MariaDB 10.6)
- **Sistema de autenticación** con usuarios y roles
- **CRUD completo** de usuarios, recetas y comentarios
- **APIs PHP** para todas las operaciones
- **Login funcional** con validación de contraseñas
- **Almacenamiento de imágenes** (base64 y archivos)

### 🚧 Pendiente:
- Sistema de sesiones persistentes con tokens
- API para estadísticas y analytics
- Sistema de backup automático
- Optimización de consultas para grandes volúmenes

---

## 🗄️ Estructura de la Base de Datos

### Información de Conexión
```
Host: owoxogis.mysql.db.internal
Database: owoxogis_recipedigitalizer
User: owoxogis_recipe
Password: sevelen9475
```

### Tablas Principales

#### 1. **users**
```sql
- id (VARCHAR 36) - ID único del usuario
- name (VARCHAR 255) - Nombre del usuario
- email (VARCHAR 255) - Email único
- password (VARCHAR 255) - Contraseña hasheada con bcrypt
- role (ENUM: admin/worker/guest) - Rol del usuario
- active (BOOLEAN) - Estado activo/inactivo
- created_at (DATETIME) - Fecha de creación
- last_active (DATETIME) - Último login
- recipes_created (INT) - Contador de recetas
```

#### 2. **recipes**
```sql
- id (INT) - ID autoincremental
- user_id (VARCHAR 36) - ID del usuario creador
- title (VARCHAR 255) - Título de la receta
- analysis (TEXT) - Contenido completo de la receta
- image (TEXT) - Imagen en base64
- image_url (VARCHAR 500) - URL de la imagen guardada
- status (ENUM: pending/approved/rejected) - Estado
- created_at (DATETIME) - Fecha de creación
- updated_at (DATETIME) - Última actualización
```

#### 3. **comments**
```sql
- id (INT) - ID autoincremental
- recipe_id (INT) - ID de la receta
- user_id (VARCHAR 36) - ID del usuario
- content (TEXT) - Contenido del comentario
- likes (INT) - Número de likes
- created_at (DATETIME) - Fecha de creación
```

#### 4. **sub_admins**
```sql
- id (INT) - ID autoincremental
- sub_admin_id (VARCHAR 36) - ID único
- name (VARCHAR 255) - Nombre
- email (VARCHAR 255) - Email
- permissions (JSON) - Permisos específicos
- status (ENUM: active/inactive) - Estado
- created_at (DATETIME) - Fecha de creación
- created_by (VARCHAR 36) - ID del admin creador
```

---

## 📁 Archivos PHP y sus Funciones

### 1. **auth-simple.php**
**Propósito**: Autenticación de usuarios

**Endpoints**:
- `GET ?action=verify` - Verifica sesión activa
- `POST ?action=login` - Login con usuario y contraseña

**Funcionamiento**:
```php
// Login request
POST /auth-simple.php?action=login
{
  "username": "usuario",
  "password": "contraseña"
}

// Response exitosa
{
  "success": true,
  "token": "...",
  "user": {
    "id": "...",
    "name": "...",
    "role": "admin|worker|guest"
  }
}
```

### 2. **users.php**
**Propósito**: CRUD completo de usuarios

**Endpoints**:
- `GET /users.php` - Lista todos los usuarios
- `GET /users.php/123` - Obtiene usuario específico
- `POST /users.php` - Crea nuevo usuario
- `PUT /users.php/123` - Actualiza usuario
- `DELETE /users.php/123` - Elimina usuario

**Características**:
- Hashea contraseñas con bcrypt automáticamente
- No retorna contraseñas en las respuestas
- Valida emails únicos

### 3. **recipes-simple.php**
**Propósito**: Gestión de recetas

**Endpoints**:
- `GET /recipes-simple.php` - Lista todas las recetas
- `POST /recipes-simple.php` - Crea nueva receta
- `PUT /recipes-simple.php?id=123` - Actualiza receta
- `DELETE /recipes-simple.php?id=123` - Elimina receta

**Características**:
- Guarda imágenes como base64 y archivos físicos
- Carpeta de uploads: `/apis/uploads/`
- Maneja estados: pending, approved, rejected

### 4. **comments.php**
**Propósito**: Sistema de comentarios

**Endpoints**:
- `GET /comments.php?recipe_id=123` - Obtiene comentarios de una receta
- `POST /comments.php` - Crea nuevo comentario
- `DELETE /comments.php?id=123` - Elimina comentario

### 5. **sub-admins.php**
**Propósito**: Gestión de sub-administradores

**Endpoints**:
- `GET /sub-admins.php` - Lista sub-admins
- `POST /sub-admins.php` - Crea sub-admin
- `PUT /sub-admins.php/123` - Actualiza permisos
- `DELETE /sub-admins.php/123` - Elimina sub-admin

---

## 🔧 Archivos de Utilidad y Testing

### Archivos de Diagnóstico:
1. **test-db.php** - Verifica conexión y muestra estadísticas
2. **debug-users.php** - Diagnóstico completo del sistema de usuarios
3. **test-login.php** - Prueba específica de login
4. **test-create-user.php** - Crea usuario de prueba
5. **create-admin.php** - Crea usuario admin inicial (ELIMINAR DESPUÉS DE USAR)

---

## 🚀 Cómo Usar el Sistema

### 1. Crear un Usuario
```javascript
// Frontend (Next.js)
const user = await UserService.createUser({
  name: "Juan",
  email: "juan@example.com",
  password: "mi_password",
  role: "worker"
})
```

### 2. Login
```javascript
const result = await UserService.login("juan", "mi_password")
if (result.success) {
  // Usuario autenticado
  localStorage.setItem('auth-token', result.token)
}
```

### 3. Crear una Receta
```javascript
const recipe = await RecipeService.create({
  title: "Mi Receta",
  analysis: "Contenido...",
  image: "base64...",
  user_id: currentUser.id
})
```

---

## 📦 Configuración Frontend

### Archivo: `/lib/services/apiConfig.ts`
```typescript
export const API_CONFIG = {
  USE_PRODUCTION: true, // Cambiar a false para desarrollo local
  PRODUCTION: {
    BASE_URL: 'https://web.lweb.ch/recipedigitalizer/apis',
    ENDPOINTS: {
      AUTH: '/auth-simple.php',
      RECIPES: '/recipes-simple.php',
      COMMENTS: '/comments.php',
      USERS: '/users.php'
    }
  }
}
```

### Services Disponibles:
- `UserService` - Gestión de usuarios y autenticación
- `RecipeService` - CRUD de recetas
- `CommentService` - Sistema de comentarios

---

## 🔐 Seguridad

### Implementado:
- ✅ Contraseñas hasheadas con bcrypt
- ✅ Validación de datos en PHP
- ✅ Headers CORS configurados
- ✅ Escape de SQL injection con PDO prepared statements
- ✅ Tokens de sesión aleatorios

### Recomendaciones Futuras:
- ⚠️ Implementar JWT para tokens
- ⚠️ Añadir rate limiting
- ⚠️ Implementar HTTPS obligatorio
- ⚠️ Añadir logs de auditoría
- ⚠️ Implementar caducidad de sesiones

---

## 📝 Notas de Implementación

### Flujo de Autenticación Actual:
1. Usuario envía credenciales a `auth-simple.php`
2. PHP valida contra base de datos
3. Si es correcto, genera token y retorna datos del usuario
4. Frontend guarda token en localStorage
5. Token se envía en headers para requests autenticadas

### Manejo de Imágenes:
1. Frontend envía imagen como base64
2. PHP guarda en campo `image` (base64)
3. PHP también guarda archivo físico en `/uploads/`
4. Campo `image_url` contiene la URL pública

### Roles y Permisos:
- **admin**: Acceso total al sistema
- **worker**: Puede crear/editar recetas, comentar
- **guest**: Solo lectura y comentarios limitados

---

## 🛠️ Comandos SQL Útiles

### Ver usuarios activos:
```sql
SELECT name, email, role, last_active
FROM users
WHERE active = 1
ORDER BY last_active DESC;
```

### Recetas pendientes de aprobación:
```sql
SELECT r.*, u.name as author
FROM recipes r
JOIN users u ON r.user_id = u.id
WHERE r.status = 'pending';
```

### Estadísticas del sistema:
```sql
SELECT
  (SELECT COUNT(*) FROM users WHERE active = 1) as active_users,
  (SELECT COUNT(*) FROM recipes WHERE status = 'approved') as approved_recipes,
  (SELECT COUNT(*) FROM recipes WHERE status = 'pending') as pending_recipes,
  (SELECT COUNT(*) FROM comments) as total_comments;
```

---

## 🚨 Solución de Problemas Comunes

### Error: "Load failed" en login
- Verificar que `auth-simple.php` está subido
- Comprobar headers CORS
- Ver consola del navegador para error específico

### Usuarios no pueden hacer login:
- Verificar que tienen contraseña en BD
- Comprobar que están activos
- Usar `debug-users.php` para diagnóstico

### Imágenes no se guardan:
- Verificar permisos de carpeta `/uploads/`
- Comprobar límite de upload en PHP
- Verificar que base64 es válido

---

## 📅 Próximos Pasos Recomendados

1. **Corto Plazo**:
   - [ ] Implementar recuperación de contraseña
   - [ ] Añadir paginación a las listas
   - [ ] Sistema de notificaciones

2. **Medio Plazo**:
   - [ ] Migrar a JWT tokens
   - [ ] Implementar WebSockets para real-time
   - [ ] Sistema de caché Redis

3. **Largo Plazo**:
   - [ ] API GraphQL
   - [ ] Microservicios
   - [ ] Docker containerization

---

## 📞 Contacto y Soporte

**Desarrollo**: Lweb Schweiz
**Base de Datos**: Hostpoint
**Última Actualización**: Enero 2025

---

*Este documento debe actualizarse con cada cambio significativo en la estructura de la base de datos o APIs.*