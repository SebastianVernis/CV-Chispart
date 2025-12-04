# CV Manager - Rafael Mora Melo

Sistema de gestión de CVs desplegado en Cloudflare Workers con D1 Database.

## Características

- 🔐 Sistema de autenticación con usuarios
- 👤 **CVs por perfil de usuario** (cada usuario tiene sus propios CVs)
- 📝 Editor de CV interactivo
- 🤖 **Asistente IA con Blackbox AI** para optimización de contenido
- 📸 **Imagen de perfil** en CVs (opcional)
- ✉️ **Verificación de email por SMTP** (opcional, no forzosa)
- 💾 Almacenamiento en D1 Database (Cloudflare)
- 🎨 Vista previa y exportación a PDF
- 🔗 Links únicos públicos para cada CV
- 🌐 CVs desplegados de forma permanente en Cloudflare
- 👁️ Control de visibilidad (público/privado)
- 📱 Diseño responsive
- ⚡ Optimizado para Cloudflare Workers
- 🔄 Gestión de sesiones activa por usuario

## Sistema de Usuarios

### Usuario Predeterminado (Rafael)
- **Usuario**: `rafael`
- **Contraseña**: `RMora1*`
- **Email**: `rafaelmoramelo@gmail.com`
- Incluye CV principal con toda la información profesional

### Registro de Nuevos Usuarios
Los nuevos usuarios pueden:
1. Acceder a `/register.html` o hacer clic en "Regístrate aquí" desde el login
2. Crear cuenta con usuario (mín. 3 caracteres) y contraseña (mín. 6 caracteres)
3. Email opcional (puede enviarse verificación si SMTP está configurado)
4. Automáticamente accederán a un editor vacío para crear sus propios CVs
5. El primer CV será completamente vacío, listo para personalizar

> **Nota**: Cada usuario tiene acceso únicamente a sus propios CVs. El sistema soporta múltiples usuarios independientes.

### Nuevas Características (Actualización Reciente)

#### 📸 Imagen de Perfil
- Sube una foto de perfil para tu CV (máx. 2MB)
- Vista previa antes de guardar
- Aparece del lado derecho en el CV generado
- Completamente opcional

#### ✉️ Verificación de Email (Opcional)
- Sistema de verificación por email si SMTP está configurado
- **NO es obligatorio** para crear cuenta
- Configuración opcional en archivo `.env`

#### 🆕 CV Vacío al Iniciar
- Los nuevos usuarios ya no ven información predeterminada
- Primer CV completamente vacío: "Mi Primer CV"
- Listo para personalizar desde cero

## Instalación y Despliegue

### 1. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
BLACKBOX_API_KEY=tu_api_key_de_blackbox

# SMTP (Opcional - para verificación de email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_contraseña_de_aplicación
SMTP_FROM=noreply@cvmanager.com
APP_URL=https://tu-dominio.workers.dev
```

**Obtener API Key de Blackbox:**
1. Ve a [Blackbox AI](https://www.blackbox.ai/)
2. Crea una cuenta o inicia sesión
3. Obtén tu API Key desde el dashboard

**Configurar SMTP (Opcional):**
- Si deseas habilitar verificación de email, configura las variables SMTP
- Funciona con Gmail, Outlook, SendGrid, etc.
- Si no configuras SMTP, la app funciona sin verificación de email

Para producción en Cloudflare Workers:

```bash
wrangler secret put BLACKBOX_API_KEY
# Opcionalmente:
wrangler secret put SMTP_USER
wrangler secret put SMTP_PASS
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Crear base de datos D1

```bash
npm run db:create
```

Esto te devolverá un `database_id`. Cópialo y actualízalo en `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "cv_database"
database_id = "TU_DATABASE_ID_AQUI"
```

### 4. Inicializar el schema de la base de datos

**Para base de datos nueva (incluye usuario Rafael y su CV):**
```bash
npm run db:init
```

Esto ejecutará `init_database.sql` que:
- Crea las tablas `users` y `cvs` con las nuevas columnas
- Inserta el usuario `rafael` (contraseña: `RMora1*`)
- Crea su CV principal con toda la información

**Para base de datos existente (migración de datos antiguos):**
```bash
wrangler d1 execute cv_database --file=migration.sql --remote
```

**Para actualizar base de datos existente con nuevas características:**
```bash
npm run db:migrate-email-image
```

Esto ejecutará `migration_email_image.sql` que:
- Añade columnas `email_verified` y `email_verification_token` a tabla `users`
- Añade columna `profile_image` a tabla `cvs`
- Crea índices necesarios

**Para añadir solo el CV de Rafael a una base de datos existente:**
```bash
wrangler d1 execute cv_database --file=seed_rafael_cv.sql --remote
```

### 5. Probar localmente

```bash
npm run dev
```

Abre `http://localhost:8787` en tu navegador.

### 6. Desplegar a producción

```bash
npm run deploy
```

## Uso del Asistente IA

El asistente de inteligencia artificial integrado puede ayudarte a:

- 🎯 Optimizar tu perfil profesional
- 📝 Mejorar descripciones de experiencia laboral
- 💡 Sugerir habilidades relevantes para tu industria
- 🎨 Adaptar tu CV a diferentes sectores (ONG, corporativo, tecnología, etc.)
- ✨ Generar contenido profesional y efectivo

### Cómo usar el asistente:

1. Abre el editor de CV
2. Haz clic en el botón **"🤖 Asistente IA"**
3. Escribe tu solicitud o usa las sugerencias rápidas
4. Recibe recomendaciones personalizadas basadas en tu CV actual
5. Aplica las mejoras sugeridas

**Ejemplos de prompts:**
- "Optimiza mi perfil profesional para una posición en ONGs"
- "Mejora la descripción de mi experiencia laboral"
- "Sugiere habilidades relevantes para el sector tecnológico"

## Sistema de Usuarios

El sistema ahora soporta múltiples usuarios, cada uno con sus propios CVs:

**Base de datos:**
- **Tabla `users`**: Almacena usuarios con username, password_hash, email
- **Tabla `cvs`**: Incluye campo `user_id` para asociar CVs con usuarios
- **Relación**: Cada CV pertenece a un usuario específico

**Seguridad:**
- Los usuarios solo pueden ver/editar/eliminar sus propios CVs
- Los tokens de sesión incluyen el `user_id`
- Validación en backend para cada operación

**Usuario predeterminado:**
- Username: `rafael`
- User ID: `user_rafael`
- Todos los CVs existentes se migran a este usuario

## Estructura del Proyecto

```
CVRafael/
├── src/
│   └── index.js          # Worker de Cloudflare (con auth por usuario)
├── public/
│   ├── login.html        # Página de login
│   ├── editor.html       # Editor de CVs
│   ├── preview.html      # Vista previa del CV
│   ├── index.html        # Redirección a login
│   └── Rafael_Mora.jpeg  # Foto de perfil
├── schema.sql            # Schema de base de datos (con users)
├── migration.sql         # Script de migración para BD existente
├── wrangler.toml         # Configuración de Cloudflare
└── package.json          # Dependencias
```

## API Endpoints

### Autenticación
- `POST /api/register` - Registrar nuevo usuario (email opcional)
- `POST /api/login` - Autenticación
- `GET /api/verify-email/:token` - Verificar email (si SMTP configurado)

### Gestión de CVs (requiere autenticación)
- `GET /api/cvs` - Obtener todos los CVs del usuario autenticado
- `POST /api/cvs` - Crear nuevo CV (retorna `slug`, incluye `profile_image`)
- `PUT /api/cvs/:id` - Actualizar CV (incluye campos `is_public` y `profile_image`)
- `DELETE /api/cvs/:id` - Eliminar CV
- `GET /api/cv-by-slug/:slug` - Obtener CV por slug

### Asistente IA (requiere autenticación)
- **`POST /api/ai/optimize`** - Optimizar contenido del CV con IA

**Request:**
```json
{
  "prompt": "Optimiza mi perfil profesional",
  "cvData": {
    "name": "...",
    "role": "...",
    "summary": "...",
    "experiences": [...],
    "skills": "...",
    "tools": "..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "suggestion": "Texto optimizado generado por IA..."
}
```

### Público (sin autenticación)
- `GET /cv/:slug` - Ver CV público en HTML

## Links Públicos

Cada CV creado genera automáticamente un link único:
```
https://tu-dominio.workers.dev/cv/abc123xyz456
```

**Características:**
- Link único de 12 caracteres alfanuméricos
- Se puede activar/desactivar la visibilidad pública desde el editor
- El CV se renderiza en HTML estático optimizado
- Soporta SEO y Open Graph tags
- Compatible con impresión y exportación a PDF

## Tecnologías

- **Cloudflare Workers**: Servidor edge
- **Cloudflare D1**: Base de datos SQL
- **Vanilla JavaScript**: Sin frameworks
- **LocalStorage**: Fallback offline

## Características de Seguridad

- Autenticación con token Bearer
- Sesiones temporales
- Validación en servidor y cliente
- Protección CORS
- API Key de Blackbox AI protegida en variables de entorno
- Archivo `.env` excluido del control de versiones

## Mantenimiento

### Ver logs

```bash
wrangler tail
```

### Consultar base de datos

```bash
npm run db:query "SELECT * FROM cvs"
```

### Backup de datos

```bash
wrangler d1 export cv_database --output backup.sql
```

## Documentación Adicional

- **[NUEVAS_CARACTERISTICAS.md](./NUEVAS_CARACTERISTICAS.md)**: Guía detallada de las nuevas funcionalidades
- **[RESUMEN_CAMBIOS.md](./RESUMEN_CAMBIOS.md)**: Resumen completo de cambios implementados

## Cambios Recientes

### Versión 2.0 (Última actualización)
- ✅ Imagen de perfil en CVs
- ✅ Verificación de email opcional por SMTP
- ✅ CV vacío para nuevos usuarios
- ✅ Header limpio sin nombre predeterminado
- ✅ Gestión de sesiones verificada y activa
- ✅ Migración de base de datos para nuevas columnas

Ver [RESUMEN_CAMBIOS.md](./RESUMEN_CAMBIOS.md) para detalles completos.

## Soporte

Para problemas o preguntas, contacta a rafaelmoramelo@gmail.com
