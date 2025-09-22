# 🧪 PRUEBAS DE LAS APIS DESPUÉS DE SUBIR

## 1. TEST BÁSICO DE CONEXIÓN

Abrir en navegador:
```
https://web.lweb.ch/recipedigitalizer/apis/auth.php?action=verify
```

Deberías ver:
```json
{
  "success": false,
  "authenticated": false,
  "message": "No hay sesión activa"
}
```

## 2. TEST DE RECETAS

```
https://web.lweb.ch/recipedigitalizer/apis/recipes.php
```

Deberías ver:
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 0,
    "pages": 0
  }
}
```

## 3. TEST DE LOGIN ADMIN

Con Postman o curl:
```bash
curl -X POST "https://web.lweb.ch/recipedigitalizer/apis/auth.php?action=login" \
  -H "Content-Type: application/json" \
  -d '{"password":"Andrea1606"}'
```

## 4. SI HAY ERRORES

### Error 500:
- Revisar contraseña MySQL en config.php línea 20
- Verificar que ejecutaste el SQL completo

### Error 404:
- Verificar que los archivos están en `/apis/`
- Verificar permisos (644 para archivos)

### Error de CORS:
- El dominio frontend debe ser https://web.lweb.ch

## 5. SIGUIENTE PASO

Cuando las APIs respondan correctamente, dime para:
1. Actualizar los servicios de Next.js
2. Cambiar las URLs de localhost a las APIs de producción
3. Hacer el build final de Next.js

## 📝 CHECKLIST ANTES DE CONTINUAR:

- [ ] SQL ejecutado en phpMyAdmin
- [ ] Contraseña MySQL actualizada en config.php
- [ ] 4 archivos PHP subidos a `/apis/`
- [ ] Carpeta `/uploads/` creada con permisos 755
- [ ] Test básico funciona (auth.php?action=verify)
- [ ] Test de recetas funciona (recipes.php)