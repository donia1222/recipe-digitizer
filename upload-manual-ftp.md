# 📤 SUBIR ARCHIVOS MANUALMENTE POR FTP

## Opción 1: Con FileZilla (Recomendado)

1. **Descargar FileZilla**: https://filezilla-project.org/

2. **Conectar a Hostpoint**:
   - Host: `ftp.tudominio.ch` (o la IP que te dieron)
   - Usuario: Tu usuario FTP creado
   - Contraseña: Tu contraseña FTP
   - Puerto: 21

3. **Navegar en el servidor**:
   - Ir a: `/web/recipedigitalizer/`
   - Crear carpeta: `apis`
   - Entrar en `apis`

4. **Subir archivos**:
   - Desde tu PC, carpeta `apis/`:
     - `config.php`
     - `recipes.php`
     - `auth.php`
     - `comments.php`
   - Arrastrar y soltar a FileZilla

5. **Crear carpeta uploads**:
   - Volver a `/web/recipedigitalizer/`
   - Crear carpeta: `uploads`
   - Click derecho → Permisos → 755

## Opción 2: Con Terminal (Mac/Linux)

```bash
# Conectar por FTP
ftp ftp.tudominio.ch

# Login con tus credenciales
# Usuario: recipe_ftp
# Password: tu_password

# Navegar al directorio
cd /web/recipedigitalizer/apis/

# Subir archivos
put apis/config.php
put apis/recipes.php
put apis/auth.php
put apis/comments.php

# Crear carpeta uploads
cd ..
mkdir uploads
chmod 755 uploads

# Salir
quit
```

## Opción 3: Con Cyberduck (Mac)

1. Descargar Cyberduck: https://cyberduck.io/
2. Nueva conexión → FTP
3. Servidor: `ftp.tudominio.ch`
4. Usuario y contraseña
5. Arrastrar archivos

## 📁 Estructura Final en el Servidor:

```
/web/recipedigitalizer/
├── apis/
│   ├── config.php
│   ├── recipes.php
│   ├── auth.php
│   └── comments.php
└── uploads/
    └── (vacío, permisos 755)
```

## ⚠️ IMPORTANTE:

- **NO subir** `.env.ftp` al servidor
- **NO subir** `deploy-ftp.sh` al servidor
- Solo subir los 4 archivos PHP de la carpeta `apis/`