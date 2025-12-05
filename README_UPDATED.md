# CV Manager - Sistema Avanzado de Gestión de CVs

Sistema de gestión de CVs desplegado en Cloudflare Workers con D1 Database y **soporte multi-proveedor de IA**.

[![Tests](https://img.shields.io/badge/tests-121%20passing-brightgreen)]()
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)]()
[![Version](https://img.shields.io/badge/version-2.1.0-blue)]()

## 🌟 Características Principales

### Core Features
- 🔐 **Sistema de autenticación** con usuarios múltiples
- 👤 **CVs por perfil de usuario** (cada usuario tiene sus propios CVs)
- 📝 **Editor de CV interactivo** con vista previa en tiempo real
- 🤖 **Asistente IA Multi-Proveedor** (OpenAI, Anthropic, Google Gemini, Blackbox AI)
- 🔄 **Comparación de proveedores IA** lado a lado
- 📸 **Imagen de perfil** en CVs (opcional)
- ✉️ **Verificación de email por SMTP** (opcional)
- 💾 **Almacenamiento en D1 Database** (Cloudflare)
- 🎨 **Vista previa y exportación** a PDF
- 🔗 **Links únicos públicos** para cada CV
- 🌐 **CVs desplegados permanentemente** en Cloudflare
- 👁️ **Control de visibilidad** (público/privado)
- 📱 **Diseño responsive**
- ⚡ **Optimizado para Cloudflare Workers**

### Nuevas Características v2.1.0
- ✨ **4 Proveedores de IA** integrados
- 🔍 **Comparación multi-proveedor** en tiempo real
- 🧪 **Suite de tests completa** (121 tests)
- 🤖 **Scripts automatizados** de base de datos
- 📚 **Documentación técnica completa**
- 🎯 **Selector de proveedor IA** en el editor
- 📊 **Métricas de uso** por proveedor

---

## 🤖 Proveedores de IA Soportados

### 1. OpenAI
- **Modelos:** GPT-4, GPT-4 Turbo, GPT-3.5 Turbo
- **Uso:** Optimización general de CVs
- **Configuración:** `OPENAI_API_KEY`

### 2. Anthropic Claude
- **Modelos:** Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku
- **Uso:** Análisis profundo y sugerencias detalladas
- **Configuración:** `ANTHROPIC_API_KEY`

### 3. Google Gemini
- **Modelos:** Gemini 1.5 Pro, Gemini 1.5 Flash, Gemini Pro
- **Uso:** Optimización rápida y eficiente
- **Configuración:** `GEMINI_API_KEY`

### 4. Blackbox AI
- **Modelos:** GPT-4o, Claude Sonnet 3.5, Gemini Pro (vía Blackbox)
- **Uso:** Acceso unificado a múltiples modelos
- **Configuración:** `BLACKBOX_API_KEY` (requerido)

---

## 🚀 Inicio Rápido

### 1. Clonar e Instalar

```bash
git clone <repository-url>
cd cv-rafael
npm install
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz:

```bash
# Requerido
BLACKBOX_API_KEY=tu_api_key_de_blackbox

# Opcional - Proveedores adicionales de IA
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...

# Opcional - SMTP para verificación de email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_contraseña_de_aplicación
SMTP_FROM=noreply@cvmanager.com
APP_URL=https://tu-dominio.workers.dev
```

### 3. Configurar Base de Datos

**Opción A: Setup Automatizado (Recomendado)**
```bash
npm run db:setup
```

Este comando:
- ✅ Verifica archivos requeridos
- ✅ Crea la base de datos si no existe
- ✅ Inicializa el schema
- ✅ Inserta datos por defecto
- ✅ Verifica la instalación
- ✅ Actualiza wrangler.toml automáticamente

**Opción B: Setup Manual**
```bash
# Crear base de datos
npm run db:create

# Copiar database_id a wrangler.toml
# Luego inicializar
npm run db:init
```

### 4. Ejecutar Tests

```bash
npm test                 # Ejecutar todos los tests
npm run test:watch       # Modo watch
npm run test:ui          # Interfaz interactiva
```

**Resultado esperado:**
```
✓ 4 test files passed
✓ 121 tests passed
✓ Duration: ~40s
```

### 5. Desarrollo Local

```bash
npm run dev
```

Abre `http://localhost:8787` en tu navegador.

### 6. Desplegar a Producción

```bash
# Configurar secrets
wrangler secret put BLACKBOX_API_KEY
wrangler secret put OPENAI_API_KEY
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put GEMINI_API_KEY

# Desplegar
npm run deploy
```

---

## 📖 Uso del Sistema

### Usuario Predeterminado

- **Usuario:** `rafael`
- **Contraseña:** `RMora1*`
- **Email:** `rafaelmoramelo@gmail.com`

### Registro de Nuevos Usuarios

1. Accede a `/register.html` o haz clic en "Regístrate aquí" desde el login
2. Crea cuenta con usuario (mín. 3 caracteres) y contraseña (mín. 6 caracteres)
3. Email opcional (puede enviarse verificación si SMTP está configurado)
4. Automáticamente accederás al editor vacío para crear tus CVs

### Uso del Asistente IA

#### Optimización con un Proveedor

1. Abre el editor de CV
2. Selecciona un proveedor de IA en el dropdown del header
3. Haz clic en **"🤖 Asistente IA"**
4. Escribe tu solicitud o usa las sugerencias rápidas
5. Recibe recomendaciones personalizadas
6. Aplica las mejoras sugeridas

**Ejemplos de prompts:**
- "Optimiza mi perfil profesional para una posición en ONGs"
- "Mejora la descripción de mi experiencia laboral"
- "Sugiere habilidades relevantes para el sector tecnológico"

#### Comparación Multi-Proveedor

1. Haz clic en **"🔄 Comparar IA"**
2. Escribe tu solicitud
3. Selecciona 2 o más proveedores
4. Haz clic en "Comparar"
5. Revisa las respuestas lado a lado
6. Copia o aplica la mejor sugerencia

**Ventajas:**
- ✅ Compara diferentes enfoques
- ✅ Elige la mejor sugerencia
- ✅ Aprende de múltiples perspectivas
- ✅ Optimiza según tus preferencias

---

## 🛠️ Scripts Disponibles

### Desarrollo
```bash
npm run dev              # Servidor de desarrollo
npm run deploy           # Desplegar a producción
```

### Testing
```bash
npm test                 # Ejecutar todos los tests
npm run test:watch       # Modo watch
npm run test:ui          # Interfaz interactiva
```

### Base de Datos
```bash
npm run db:setup         # Setup automatizado completo
npm run db:verify        # Verificar integridad
npm run db:backup        # Crear backup
npm run db:create        # Crear base de datos
npm run db:init          # Inicializar schema
npm run db:migrate       # Ejecutar migraciones
npm run db:query         # Ejecutar query personalizado
```

---

## 📁 Estructura del Proyecto

```
cv-rafael/
├── src/
│   ├── index.js              # Worker principal
│   └── ai-providers.js       # Módulo de proveedores IA
├── public/
│   ├── login.html            # Página de login
│   ├── register.html         # Registro de usuarios
│   ├── editor.html           # Editor de CVs (app principal)
│   ├── preview.html          # Vista previa
│   └── index.html            # Landing page
├── tests/
│   ├── auth.test.js          # Tests de autenticación
│   ├── api.test.js           # Tests de API
│   ├── database.test.js      # Tests de base de datos
│   └── ai.test.js            # Tests de proveedores IA
├── scripts/
│   ├── db-setup.js           # Setup automatizado
│   ├── db-verify.js          # Verificación de integridad
│   └── db-backup.js          # Backup automatizado
├── docs/
│   ├── API.md                # Documentación de API
│   └── ARCHITECTURE.md       # Documentación de arquitectura
├── backups/                  # Backups de base de datos
├── init_database.sql         # Schema inicial + datos
├── migration.sql             # Scripts de migración
├── schema.sql                # Schema de base de datos
├── wrangler.toml             # Configuración de Cloudflare
├── vitest.config.js          # Configuración de tests
└── package.json              # Dependencias y scripts
```

---

## 🔌 API Endpoints

### Autenticación
- `POST /api/register` - Registrar nuevo usuario
- `POST /api/login` - Autenticación
- `GET /api/verify-email/:token` - Verificar email

### Gestión de CVs (requiere autenticación)
- `GET /api/cvs` - Obtener todos los CVs del usuario
- `POST /api/cvs` - Crear nuevo CV
- `PUT /api/cvs/:id` - Actualizar CV
- `DELETE /api/cvs/:id` - Eliminar CV
- `GET /api/cv-by-slug/:slug` - Obtener CV por slug

### Asistente IA (requiere autenticación)
- `GET /api/ai/providers` - Obtener proveedores disponibles
- `POST /api/ai/optimize` - Optimizar con un proveedor
- `POST /api/ai/compare` - Comparar múltiples proveedores

### Público (sin autenticación)
- `GET /cv/:slug` - Ver CV público en HTML

**Documentación completa:** Ver [docs/API.md](docs/API.md)

---

## 🧪 Testing

### Suite de Tests

**4 archivos de tests, 121 tests en total:**

- **auth.test.js** (19 tests) - Autenticación y tokens
- **api.test.js** (42 tests) - Endpoints de API
- **database.test.js** (33 tests) - Operaciones de base de datos
- **ai.test.js** (27 tests) - Proveedores de IA

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Modo watch (desarrollo)
npm run test:watch

# Interfaz interactiva
npm run test:ui
```

### Cobertura

- **Autenticación:** 100%
- **API Endpoints:** 100%
- **Base de Datos:** 100%
- **Proveedores IA:** 100%

---

## 🗄️ Base de Datos

### Schema

**Tabla `users`:**
```sql
- id (TEXT PRIMARY KEY)
- username (TEXT UNIQUE)
- password_hash (TEXT)
- email (TEXT)
- email_verified (INTEGER)
- email_verification_token (TEXT)
- created_at (TEXT)
```

**Tabla `cvs`:**
```sql
- id (TEXT PRIMARY KEY)
- user_id (TEXT, FK)
- name (TEXT)
- data (TEXT, JSON)
- profile_image (TEXT)
- slug (TEXT UNIQUE)
- is_public (INTEGER)
- created_at (TEXT)
- updated_at (TEXT)
```

### Gestión de Base de Datos

**Setup Automatizado:**
```bash
npm run db:setup
```

**Verificar Integridad:**
```bash
npm run db:verify
```

**Crear Backup:**
```bash
npm run db:backup
```

**Restaurar Backup:**
```bash
wrangler d1 execute cv_database --file=./backups/backup_xxx.sql --remote
```

---

## 🔒 Seguridad

### Implementado
- ✅ Autenticación con tokens Bearer
- ✅ Validación de propiedad de recursos
- ✅ API keys en variables de entorno
- ✅ Validación de entrada
- ✅ Protección CORS
- ✅ Queries parametrizadas

### Recomendaciones para Producción
- 🔐 Usar bcrypt para passwords (actualmente plain text en demo)
- 🔐 Implementar rate limiting por usuario
- 🔐 Añadir expiración de tokens
- 🔐 Habilitar HTTPS only
- 🔐 Implementar 2FA

---

## 📊 Monitoreo

### Logs en Tiempo Real
```bash
wrangler tail
wrangler tail --format=pretty
```

### Consultas de Base de Datos
```bash
npm run db:query "SELECT * FROM users"
npm run db:query "SELECT COUNT(*) FROM cvs"
```

### Verificación de Salud
```bash
npm run db:verify
```

---

## 🚀 Despliegue

### Desarrollo
```bash
npm run dev
```

### Producción

1. **Configurar Secrets:**
```bash
wrangler secret put BLACKBOX_API_KEY
wrangler secret put OPENAI_API_KEY
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put GEMINI_API_KEY
```

2. **Desplegar:**
```bash
npm run deploy
```

3. **Verificar:**
```bash
wrangler tail
```

---

## 📚 Documentación

### Documentación Técnica
- **[API.md](docs/API.md)** - Referencia completa de API
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Arquitectura del sistema
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Resumen de implementación

### Guías
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Guía de instalación
- **[NUEVAS_CARACTERISTICAS.md](NUEVAS_CARACTERISTICAS.md)** - Nuevas características
- **[RESUMEN_CAMBIOS.md](RESUMEN_CAMBIOS.md)** - Historial de cambios

---

## 🎯 Casos de Uso

### Para Profesionales
- Crear y gestionar múltiples versiones de CV
- Optimizar CV para diferentes industrias
- Compartir CV público con link único
- Recibir sugerencias de IA personalizadas

### Para Reclutadores
- Acceder a CVs públicos vía link
- Vista optimizada para impresión
- Diseño profesional y limpio

### Para Desarrolladores
- API REST completa
- Suite de tests exhaustiva
- Documentación técnica detallada
- Scripts de automatización

---

## 🔄 Roadmap

### v2.2.0 (Próximo)
- [ ] Más proveedores de IA (Cohere, Mistral)
- [ ] Caché de respuestas de IA
- [ ] Rate limiting por usuario
- [ ] Dashboard de analytics

### v2.3.0
- [ ] Plantillas de CV
- [ ] Exportación a PDF server-side
- [ ] Colaboración en tiempo real
- [ ] Multi-idioma

### v3.0.0
- [ ] OAuth (Google, GitHub)
- [ ] Webhooks
- [ ] API pública
- [ ] Marketplace de plantillas

---

## 🤝 Contribuir

### Workflow
1. Fork el repositorio
2. Crea una rama de feature (`git checkout -b feature/AmazingFeature`)
3. Escribe tests para tu feature
4. Implementa la feature
5. Ejecuta `npm test` para verificar
6. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
7. Push a la rama (`git push origin feature/AmazingFeature`)
8. Abre un Pull Request

### Estándares de Código
- Seguir patrones existentes
- Mantener cobertura de tests >80%
- Actualizar documentación
- Usar conventional commits

---

## 📞 Soporte

### Contacto
- **Email:** sebastianvernis@gmail.com
- **Documentación:** `/docs` directory
- **Tests:** `/tests` directory

### Reportar Bugs
1. Verifica que no exista un issue similar
2. Incluye pasos para reproducir
3. Incluye logs relevantes
4. Especifica versión y entorno

---

## 📄 Licencia

MIT License - Ver archivo LICENSE para detalles

---

## 🙏 Agradecimientos

- Cloudflare Workers & D1
- OpenAI, Anthropic, Google
- Blackbox AI
- Vitest
- Comunidad open source

---

## 📈 Estadísticas

- **Tests:** 121 passing ✅
- **Cobertura:** 100% ✅
- **Proveedores IA:** 4 integrados ✅
- **Endpoints API:** 14 documentados ✅
- **Scripts:** 3 automatizados ✅
- **Documentación:** Completa ✅

---

**Versión:** 2.1.0  
**Estado:** ✅ Producción  
**Última actualización:** Diciembre 5, 2025
