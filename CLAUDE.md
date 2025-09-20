# Recipe Digitizer - Documentación Completa de la Aplicación

## 📱 Descripción General

Recipe Digitizer es una Progressive Web App (PWA) sofisticada para la digitalización, gestión y análisis de recetas mediante inteligencia artificial. Diseñada específicamente para el contexto del Altersheim Gärbi en Suiza, ofrece una solución completa sin necesidad de backend tradicional.

## 🏗️ Arquitectura Técnica

### Stack Tecnológico Principal
- **Framework**: Next.js 15.2.4 con App Router
- **Frontend**: React 19 con TypeScript
- **Styling**: Tailwind CSS 3.4.17 con configuración personalizada
- **UI Components**: ShadCN/UI + Radix UI
- **Animaciones**: Framer Motion
- **Iconos**: Lucide React
- **PWA**: Service Worker nativo con cache offline

### Estructura del Proyecto
```
recipe-digitizer-main/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Layout principal con PWA
│   ├── page.tsx           # Página principal (AppWrapper)
│   ├── admin/             # Panel de administración
│   └── offline/           # Página offline PWA
├── components/            # Componentes React
│   ├── admin/            # Componentes de administración
│   ├── ui/               # Componentes base ShadCN
│   └── [componentes principales]
├── lib/                   # Servicios y utilidades
│   ├── actions.ts        # Server Actions para APIs
│   └── utils.ts          # Utilidades helpers
└── public/               # Assets estáticos y PWA
    ├── manifest.json     # PWA manifest
    └── sw.js            # Service Worker
```

## 🔐 Sistema de Autenticación y Roles

### Modelo de Tres Roles

#### 1. Administrator (admin)
- **Acceso**: Requiere contraseña (`NEXT_PUBLIC_RECIPE`)
- **Capacidades**:
  - Panel de administración completo
  - Gestión de usuarios y recetas
  - Aprobación de recetas pendientes
  - Gestión de sub-administradores
  - Acceso a estadísticas del sistema

#### 2. Mitarbeiter (worker)
- **Acceso**: Directo sin contraseña
- **Capacidades**:
  - Digitalización de recetas
  - Biblioteca personal de recetas
  - Sistema de comentarios
  - Edición de recetas propias
  - Ajuste de porciones

#### 3. Gast (guest)
- **Acceso**: Directo sin contraseña
- **Capacidades**:
  - Visualización de recetas
  - Búsqueda en biblioteca
  - Vista de comentarios (sin crear)
  - Acceso limitado sin digitalización

### Implementación Técnica
- **Persistencia**: localStorage (`recipe-auth`, `user-role`)
- **Validación**: Cliente-side con redirecciones automáticas
- **Protección de rutas**: Verificación de rol en `/admin`
- **Sin backend**: Todo gestionado localmente

## 📸 Funcionalidades de Digitalización de Recetas

### Métodos de Captura

#### 1. Cámara del Dispositivo
- Acceso nativo a cámara
- Modal optimizado (formato 3:4)
- Prioridad cámara trasera en móviles
- Preview antes del análisis

#### 2. Upload de Imágenes
- Soporte formatos estándar (JPG, PNG, etc.)
- Preview y confirmación
- Compresión automática para optimización

#### 3. Scanner de Documentos
- API experimental de scanning web
- Fallback automático a selector de archivos
- Optimizado para documentos de recetas

### Análisis con Inteligencia Artificial

#### Integración con FoodScan AI
- **Endpoint**: `https://foodscan-ai.com/responseImageAnalysis.php`
- **Modelo**: GPT-4.1
- **Procesamiento**: Server Actions (evita CORS)
- **Formato**: Base64 encoding de imágenes

#### Extracción Automática
- **Título**: Nombre de la receta
- **Ingredientes**: Lista estructurada con cantidades
- **Instrucciones**: Pasos numerados
- **Porciones**: Detección automática del texto
- **Idioma**: Alemán por defecto

### Gestión de Recetas

#### CRUD Completo
- **Create**: Digitalización y análisis IA
- **Read**: Biblioteca con vistas grid/list
- **Update**: Edición inline con preview
- **Delete**: Eliminación con confirmación

#### Funciones Avanzadas
- **Favoritos**: Sistema de marcado con estrellas
- **Historial**: Últimas 10 recetas automáticamente
- **Búsqueda**: Filtrado en tiempo real
- **Compartir**: Generación de enlaces compartibles
- **Imprimir**: Formato optimizado para impresión
- **Múltiples imágenes**: Galería por receta

## 🔢 Sistema de Ajuste de Porciones

### Recálculo Inteligente
- **API**: `https://foodscan-ai.com/responseChat.php`
- **Modelo**: GPT-4.1
- **Funcionalidad**: Ajuste proporcional de ingredientes
- **Persistencia**: Guarda porciones originales y ajustadas

### Interfaz de Usuario
- Modal dedicado con inputs numéricos
- Preview de cambios en tiempo real
- Botón de reset a porciones originales
- Feedback visual durante el procesamiento

## 💬 Sistema de Comentarios

### Características Principales
- **Por receta**: Comentarios individuales por plato
- **Sistema de likes**: Toggle con contador
- **Roles visuales**: Badges distintivos por usuario
- **Límite**: 500 caracteres con contador
- **Fechas relativas**: "vor 2 Stunden" format

### Datos de Demostración
- Comentarios pre-poblados de ejemplo
- Avatares y roles claramente identificados
- Simulación de interacciones sociales

## 👨‍💼 Panel de Administración

### Dashboard Principal

#### Estadísticas en Tiempo Real
- **Recetas pendientes**: 5 (con notificación)
- **Usuarios activos**: 12
- **Total recetas aprobadas**: 127
- **Sub-administradores**: 3

#### Módulos de Gestión
1. **Gestión de Usuarios**
   - Lista completa de usuarios
   - Edición de roles y permisos
   - Activación/desactivación de cuentas

2. **Gestión de Recetas**
   - Aprobación de pendientes
   - Edición masiva
   - Eliminación con confirmación

3. **Sub-Administradores**
   - Delegación de permisos específicos
   - Gestión de accesos limitados

4. **Recetas Pendientes**
   - Cola de aprobación
   - Preview antes de aprobar
   - Rechazo con comentarios

### Funciones IA Futuras (Marcadas como "Bald verfügbar")
- Creación de recetas con IA
- Análisis de platos por foto
- Chat con chef IA experto

## 💾 Almacenamiento y Datos

### localStorage como Base de Datos
```javascript
// Estructura de almacenamiento
{
  'recipeHistory': HistoryItem[],        // Historial de recetas
  'recipe-servings': string,             // Porciones actuales
  'recipe-original-servings': string,    // Porciones originales
  'recipe-images-${id}': string[],       // Imágenes adicionales
  'recipe-auth': 'granted' | null,       // Estado de autenticación
  'user-role': Role | null,              // Rol del usuario
  'recipe-comments-${id}': Comment[]     // Comentarios por receta
}
```

### Modelo de Datos Principal
```typescript
interface HistoryItem {
  id: number;
  recipeId?: string;
  image: string;          // Base64
  analysis: string;       // Texto de la receta
  date: string;          // ISO timestamp
  folderId?: string;     // Categorización
  title?: string;        // Título extraído
  isFavorite?: boolean;  // Marcado como favorito
}

interface Comment {
  id: string;
  author: string;
  role: 'admin' | 'worker' | 'guest';
  content: string;
  likes: number;
  timestamp: string;
}
```

## 🌐 APIs Externas y Servicios

### FoodScan AI (Análisis de Recetas)
- **Base URL**: `https://foodscan-ai.com/`
- **Autenticación**: No requerida
- **Límites**: No documentados
- **Formato**: FormData con imagen base64

### Server Actions (Next.js)
```typescript
// lib/actions.ts
- analyzeRecipeImage(): Análisis de imágenes
- recalculateServings(): Recálculo de porciones
```

## 📱 Progressive Web App (PWA)

### Características PWA
- **Instalable**: En dispositivos móviles y desktop
- **Offline**: Página dedicada cuando sin conexión
- **Cache**: Service Worker con estrategia cache-first
- **Actualización**: Skip waiting para nuevas versiones

### Manifest Configuration
```json
{
  "name": "Recipe Digitizer",
  "short_name": "Recipes",
  "theme_color": "#4F7B52",
  "background_color": "#ffffff",
  "display": "standalone",
  "orientation": "portrait"
}
```

### Service Worker Strategy
- Cache de recursos estáticos
- Fallback a red cuando disponible
- Página offline dedicada
- Auto-actualización con skip waiting

## 🎨 Diseño y UX

### Sistema de Diseño
- **Base**: ShadCN/UI con Radix UI
- **Temas**: Light/Dark mode ready
- **Colores**: Verde principal (#4F7B52)
- **Tipografía**: System fonts optimizadas
- **Responsive**: Mobile-first approach

### Componentes UI Principales
- Buttons, Cards, Modals (ShadCN)
- Custom sidebar navigation
- Loading overlays con progress
- Toast notifications
- Form validation

## 📊 Flujos de Trabajo Principales

### 1. Flujo de Digitalización
```
Inicio → Selección método captura →
Captura/Upload → Preview →
Análisis IA → Resultado →
Edición (opcional) → Guardar
```

### 2. Flujo de Administración
```
Login Admin → Dashboard →
Selección módulo → CRUD operations →
Confirmación → Actualización estado
```

### 3. Flujo de Usuario Regular
```
Selección rol → Dashboard →
Biblioteca → Búsqueda/Navegación →
Vista receta → Acciones (comentar, ajustar, etc.)
```

## 🚀 Despliegue y Configuración

### Variables de Entorno Requeridas
```bash
NEXT_PUBLIC_RECIPE=        # Contraseña de administrador
```

### Comandos de Desarrollo
```bash
npm install                # Instalar dependencias
npm run dev               # Desarrollo local
npm run build            # Build de producción
npm run start            # Iniciar producción
npm run lint             # Linting
npm run type-check       # TypeScript check
```

### Plataformas de Despliegue Recomendadas
- **Vercel**: Configuración incluida (vercel.json)
- **Netlify**: Compatible con Next.js
- **Self-hosted**: Node.js 18+ requerido

## 📈 Métricas y Performance

### Optimizaciones Implementadas
- Code splitting automático (Next.js)
- Lazy loading de componentes
- Compresión de imágenes base64
- Cache agresivo con Service Worker
- Minificación de assets

### Performance Targets
- **FCP**: < 1.5s
- **LCP**: < 2.5s
- **TTI**: < 3.5s
- **CLS**: < 0.1

## 🔧 Mantenimiento y Actualizaciones

### Áreas de Mejora Identificadas
1. Migración a base de datos real
2. Backend API para multi-usuario
3. Autenticación con JWT/OAuth
4. CDN para imágenes
5. Análisis mejorado con modelos propios

### Dependencias Críticas
- FoodScan AI API (externa)
- localStorage (límite ~10MB)
- Compatibilidad navegador moderno

## 📝 Notas Importantes

### Limitaciones Actuales
- **Sin sincronización**: Datos solo locales
- **Límite storage**: ~10MB por dominio
- **Sin backup**: Pérdida si se borra caché
- **Un dispositivo**: No multi-dispositivo
- **API externa**: Dependencia de FoodScan

### Seguridad
- **Contraseña admin**: En variable de entorno
- **Sin encriptación**: Datos en texto plano
- **CORS**: Manejado con Server Actions
- **XSS**: Protección básica React

## 🎯 Casos de Uso Principales

1. **Personal de cocina**: Digitalizar recetas manuscritas
2. **Administrador**: Gestionar y aprobar contenido
3. **Invitados**: Consultar recetas disponibles
4. **Chef**: Ajustar porciones para eventos

---

*Última actualización: Enero 2025*
*Versión: 1.0.0*
*Desarrollado para: Altersheim Gärbi*