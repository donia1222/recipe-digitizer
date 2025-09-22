#!/bin/bash

echo "🚀 Deploying PHP files to Hostpoint..."

# FTP credentials from environment or hardcoded
FTP_HOST="${FTP_HOST:-sl1809.web.hostpoint.ch}"
FTP_USER="${FTP_USER:-recipe_ftp@web.lweb.ch}"
FTP_PASS="${FTP_PASS:-Sevelen94752}"

# Use lftp for more reliable FTP transfers
echo ""
echo "📋 Using lftp for reliable transfer..."

# Check if lftp is installed
if ! command -v lftp &> /dev/null; then
    echo "⚠️ lftp not found. Installing..."
    if command -v brew &> /dev/null; then
        brew install lftp
    else
        echo "❌ Please install lftp manually: sudo apt-get install lftp"
        exit 1
    fi
fi

# Create lftp script
cat > deploy_script.lftp << 'EOF'
set ftp:ssl-allow no
set ftp:passive-mode on
open ftp://recipe_ftp%40web.lweb.ch:Sevelen94752@sl1809.web.hostpoint.ch
cd /recipedigitalizer/apis
lcd apis

# Upload PHP files
put config.php
put auth-simple.php
put recipes-simple.php
put comments.php
put users.php
put sub-admins.php

# Create uploads directory if it doesn't exist
mkdir -f uploads
chmod 777 uploads

bye
EOF

echo "📤 Uploading files..."

# Execute lftp script
lftp -f deploy_script.lftp

if [ $? -eq 0 ]; then
    echo "✅ Files uploaded successfully!"
else
    echo "⚠️ Some files may have failed to upload"
fi

# Clean up
rm -f deploy_script.lftp

echo ""
echo "✨ Deploy complete!"
echo ""
echo "📝 Test URLs:"
echo "https://web.lweb.ch/recipedigitalizer/apis/auth-simple.php?action=verify"
echo "https://web.lweb.ch/recipedigitalizer/apis/recipes-simple.php"
echo ""
echo "📂 Uploads folder:"
echo "https://web.lweb.ch/recipedigitalizer/apis/uploads/"