# 📋 INSTRUCCIONES DE DEPLOY A HOSTPOINT

## ✅ ARCHIVOS CREADOS Y LISTOS:

### 1️⃣ **Script SQL** (`database/mysql_complete_setup.sql`)
- Contiene TODAS las tablas necesarias
- Datos iniciales incluidos
- Vistas y procedimientos almacenados

### 2️⃣ **Archivos PHP** (en carpeta `apis/`)
- `config.php` - Configuración con tus datos de Hostpoint
- `recipes.php` - API de recetas
- `auth.php` - API de autenticación
- `comments.php` - API de comentarios

### 3️⃣ **Deploy Script** (`deploy-ftp.sh`)
- Script automático para subir archivos por FTP

---

## 🚀 PASOS PARA CONFIGURAR EN HOSTPOINT:

### **PASO 1: Configurar Base de Datos**

1. Acceder a phpMyAdmin de Hostpoint
2. Seleccionar la BD: `owoxogis_recipedigitalizer`
3. Ir a pestaña "SQL"
4. Copiar TODO el contenido de `database/mysql_complete_setup.sql`
5. Pegar y ejecutar
6. Verificar que se crearon las tablas

### **PASO 2: Actualizar Contraseña MySQL**

Editar `apis/config.php` línea 20:
```php
define('DB_PASS', 'TU_PASSWORD_AQUI'); // ⚠️ Poner la contraseña real
```

### **PASO 3: Crear Cuenta FTP en Hostpoint**

**En el Panel de Control de Hostpoint:**

1. Ir a **"FTP-Accounts"** (no SSH Keys)
2. Click en **"Crear nuevo FTP Account"**
3. Configurar:
   - **Usuario FTP**: `recipe_ftp` (o el que prefieras)
   - **Contraseña**: (genera una segura)
   - **Directorio**: `/web/recipedigitalizer/`
   - **Permisos**: Lectura y Escritura

4. Guardar los datos de conexión:
   - **Servidor**: `ftp.tudominio.ch` o la IP que te den
   - **Puerto**: 21 (FTP) o 22 (SFTP)
   - **Usuario**: El que creaste
   - **Contraseña**: La que pusiste

5. Editar `.env.ftp` con estos datos:
```bash
FTP_HOST=ftp.tudominio.ch
FTP_USER=recipe_ftp
FTP_PASS=tu_password_ftp
```

### **PASO 4: Subir Archivos**

Opción A - Automático:
```bash
./deploy-ftp.sh
```

Opción B - Manual por FTP:
1. Conectar a Hostpoint por FTP
2. Navegar a `/web/recipedigitalizer/apis/`
3. Subir los 4 archivos PHP

### **PASO 5: Crear Directorio de Uploads**

En Hostpoint (por FTP o panel):
1. Crear carpeta: `/web/recipedigitalizer/uploads/`
2. Dar permisos: 755

---

## 🧪 PROBAR LAS APIS:

### Test de conexión:
```
https://web.lweb.ch/recipedigitalizer/apis/auth.php?action=verify
```

### Test de recetas:
```
https://web.lweb.ch/recipedigitalizer/apis/recipes.php
```

### Test de login admin:
```bash
curl -X POST https://web.lweb.ch/recipedigitalizer/apis/auth.php?action=login \
  -H "Content-Type: application/json" \
  -d '{"password":"Andrea1606"}'
```

---

## 📝 ESTRUCTURA DE URLs DE LA API:

```
BASE: https://web.lweb.ch/recipedigitalizer/apis/

ENDPOINTS:
- GET    /recipes.php              - Listar recetas
- GET    /recipes.php?id=1         - Ver receta
- POST   /recipes.php              - Crear receta
- PUT    /recipes.php?id=1         - Actualizar
- DELETE /recipes.php?id=1         - Eliminar

- POST   /auth.php?action=login    - Login admin
- POST   /auth.php?action=role     - Login worker/guest
- GET    /auth.php?action=verify   - Verificar sesión
- POST   /auth.php?action=logout   - Logout

- GET    /comments.php?recipe_id=1 - Ver comentarios
- POST   /comments.php              - Crear comentario
- PUT    /comments.php?id=1        - Like/Unlike
- DELETE /comments.php?id=1        - Eliminar
```

---

## ⚠️ IMPORTANTE - SEGURIDAD:

1. **Cambiar JWT_SECRET** en `config.php` línea 26:
```php
define('JWT_SECRET', 'genera_una_clave_aleatoria_larga_aqui');
```

2. **Verificar CORS** en producción (línea 33)

3. **Cambiar DEBUG_MODE a false** en producción (línea 51)

---

## 🔄 CUANDO ESTÉ TODO LISTO:

Dime cuando hayas:
1. ✅ Ejecutado el SQL en phpMyAdmin
2. ✅ Actualizado la contraseña MySQL
3. ✅ Subido los archivos PHP
4. ✅ Creado carpeta uploads

Y yo actualizaré los servicios de Next.js para conectar con las APIs PHP.

---

## 📞 SOPORTE:

Si hay algún error:
1. Verificar logs de PHP en Hostpoint
2. Probar las APIs con Postman/curl
3. Verificar permisos de archivos (644) y carpetas (755)

¡Éxito con el deploy! 🚀