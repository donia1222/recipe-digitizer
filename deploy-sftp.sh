#!/bin/bash

# Script de despliegue automático para archivos PHP a Hostpoint
# Usa SFTP con autenticación por contraseña

echo "🚀 Iniciando despliegue de archivos PHP a Hostpoint..."

# Cargar variables del archivo .env.deploy
if [ -f .env.deploy ]; then
    export $(cat .env.deploy | xargs)
else
    echo "❌ Error: Archivo .env.deploy no encontrado"
    exit 1
fi

HOST="$SFTP_HOST"
USER="$SFTP_USER"
PASS="$SFTP_PASS"
REMOTE_PATH="$SFTP_REMOTE_PATH"
LOCAL_PATH="./apis"

echo "📋 Configuración:"
echo "   Host: $HOST"
echo "   Usuario: $USER"
echo "   Ruta remota: $REMOTE_PATH"
echo "   Ruta local: $LOCAL_PATH"

# Verificar que la carpeta apis existe
if [ ! -d "$LOCAL_PATH" ]; then
    echo "❌ Error: La carpeta $LOCAL_PATH no existe"
    exit 1
fi

# Crear lista de archivos a subir
FILES=(
    "config.php"
    "auth-simple.php"
    "recipes-simple.php"
    "comments.php"
)

echo ""
echo "📤 Subiendo archivos PHP..."

# Subir cada archivo usando sshpass con sftp
for file in "${FILES[@]}"; do
    if [ -f "$LOCAL_PATH/$file" ]; then
        echo "   📄 Subiendo $file..."

        # Usar expect para automatizar SFTP con contraseña
        expect << EOF
spawn sftp $USER@$HOST
expect "password:"
send "$PASS\r"
expect "sftp>"
send "cd $REMOTE_PATH\r"
expect "sftp>"
send "put $LOCAL_PATH/$file\r"
expect "sftp>"
send "bye\r"
expect eof
EOF

        if [ $? -eq 0 ]; then
            echo "   ✅ $file subido correctamente"
        else
            echo "   ❌ Error al subir $file"
        fi
    else
        echo "   ⚠️ Archivo no encontrado: $LOCAL_PATH/$file"
    fi
done

# Crear carpeta uploads si no existe
echo ""
echo "📁 Verificando carpeta uploads..."
expect << EOF
spawn sftp $USER@$HOST
expect "password:"
send "$PASS\r"
expect "sftp>"
send "cd $REMOTE_PATH\r"
expect "sftp>"
send "mkdir uploads\r"
expect "sftp>"
send "chmod 777 uploads\r"
expect "sftp>"
send "bye\r"
expect eof
EOF

echo ""
echo "✨ Despliegue completado!"
echo ""
echo "📝 URLs de prueba:"
echo "   $API_BASE_URL/auth-simple.php?action=verify"
echo "   $API_BASE_URL/recipes-simple.php"
echo ""
echo "📂 Carpeta de uploads:"
echo "   $API_BASE_URL/uploads/"