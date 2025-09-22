#!/bin/bash

# ============================================
# SCRIPT DE DEPLOY FTP A HOSTPOINT
# ============================================

echo "🚀 Iniciando deploy a Hostpoint..."

# Cargar variables de entorno
source .env.ftp

# Archivos PHP a subir
FILES=(
    "apis/config.php"
    "apis/recipes.php"
    "apis/auth.php"
    "apis/comments.php"
)

# Función para subir archivo
upload_file() {
    local file=$1
    local remote_file=$(basename $file)

    echo "📤 Subiendo $file..."

    curl -T "$file" \
        --user "$FTP_USER:$FTP_PASS" \
        "ftp://$FTP_HOST$FTP_REMOTE_DIR$remote_file"

    if [ $? -eq 0 ]; then
        echo "✅ $file subido exitosamente"
    else
        echo "❌ Error subiendo $file"
        exit 1
    fi
}

# Subir cada archivo
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        upload_file "$file"
    else
        echo "⚠️ Archivo no encontrado: $file"
    fi
done

echo ""
echo "✨ Deploy completado!"
echo ""
echo "📝 IMPORTANTE - Siguientes pasos:"
echo "1. Acceder a phpMyAdmin en Hostpoint"
echo "2. Ejecutar el script SQL: database/mysql_complete_setup.sql"
echo "3. Actualizar la contraseña MySQL en config.php"
echo "4. Crear directorio 'uploads' con permisos 755"
echo "5. Probar las APIs:"
echo "   - https://web.lweb.ch/recipedigitalizer/apis/auth.php?action=verify"
echo "   - https://web.lweb.ch/recipedigitalizer/apis/recipes.php"
echo ""