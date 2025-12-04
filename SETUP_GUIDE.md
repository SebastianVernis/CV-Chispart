# Guía de Configuración - CV Manager

## 🎯 Resumen de Cambios

### 1. Sistema de Usuarios Multi-cuenta
- ✅ Usuario Rafael pre-configurado con CV completo
- ✅ Flujo de registro para nuevos usuarios
- ✅ Cada usuario tiene sus propios CVs aislados

### 2. Optimización de IA por Campo
- ✅ Las recomendaciones de IA ahora son contextuales al campo específico
- ✅ Solo se envía información relevante para cada optimización
- ✅ Consulta general mantiene acceso al CV completo

---

## 📋 Configuración Inicial

### Paso 1: Instalar dependencias
```bash
npm install
```

### Paso 2: Configurar API Key de Blackbox AI
```bash
# Crear archivo .env local
echo "BLACKBOX_API_KEY=tu_api_key" > .env

# Para producción en Cloudflare
wrangler secret put BLACKBOX_API_KEY
```

### Paso 3: Crear base de datos D1
```bash
npm run db:create
```

Copiar el `database_id` que devuelve y actualizarlo en `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "cv_database"
database_id = "TU_DATABASE_ID_AQUI"
```

### Paso 4: Inicializar base de datos
```bash
# Esto crea las tablas, usuario Rafael y su CV
npm run db:init
```

### Paso 5: Probar localmente
```bash
npm run dev
# Abre http://localhost:8787
```

### Paso 6: Desplegar a producción
```bash
npm run deploy
```

---

## 👤 Cuentas de Usuario

### Usuario Rafael (Predeterminado)
- **Usuario**: `rafael`
- **Contraseña**: `RMora1*`
- **Incluye**: CV Principal con toda la información profesional

**Datos del CV:**
- Nombre: Rafael Mora Melo
- Rol: Coordinador de Comunicación & Relaciones Públicas
- 2 Experiencias profesionales (GSP y GADUSA)
- Educación: Licenciatura en Ciencias de la Comunicación (UNAM)
- Habilidades y herramientas completas

### Nuevos Usuarios
Los usuarios pueden registrarse desde:
- URL: `/register.html`
- Link en la página de login: "Regístrate aquí"

**Requisitos:**
- Usuario: mínimo 3 caracteres
- Contraseña: mínimo 6 caracteres
- Email: opcional

**Al registrarse:**
- Se crea cuenta automáticamente
- Se redirige al editor
- Comienza con un CV vacío para personalizar

---

## 🤖 Sistema de IA Optimizado

### Optimización por Campo Específico
Cada campo ahora envía solo el contexto relevante:

**Perfil Profesional:**
- Rol actual
- Lista de experiencias (solo títulos y fechas)
- Enfoque del CV (sector objetivo)

**Habilidades:**
- Rol actual
- Lista de experiencias (solo títulos)
- Habilidades actuales
- Enfoque del CV

**Herramientas:**
- Rol actual
- Herramientas actuales
- Enfoque del CV

**Responsabilidades (por experiencia):**
- Cargo específico
- Empresa
- Responsabilidades actuales
- Enfoque del CV

### Consulta General (Asistente IA)
- Mantiene acceso completo al CV
- Para análisis y recomendaciones generales
- Se activa desde el botón "🤖 Asistente IA"

---

## 📁 Archivos de Base de Datos

### `init_database.sql`
Inicialización completa desde cero:
- Crea tablas `users` y `cvs`
- Crea índices
- Inserta usuario Rafael
- Inserta CV principal de Rafael

**Uso:**
```bash
npm run db:init
```

### `migration.sql`
Para migrar datos existentes:
- Crea tabla de usuarios
- Migra CVs existentes al usuario Rafael
- Mantiene datos antiguos

**Uso:**
```bash
npm run db:migrate
```

### `seed_rafael_cv.sql`
Solo añade el CV de Rafael:
- Para bases de datos que ya tienen usuarios
- Inserta únicamente el CV principal

**Uso:**
```bash
npm run db:seed
```

---

## 🔒 Seguridad

### Autenticación
- Login con usuario/contraseña
- Tokens de sesión en sessionStorage
- Validación en cada request a la API

### Aislamiento de Datos
- Cada usuario solo ve sus propios CVs
- Queries filtradas por `user_id`
- Foreign keys con `ON DELETE CASCADE`

### Notas de Seguridad
⚠️ **Demo/Desarrollo**: Las contraseñas se almacenan en texto plano para facilitar el desarrollo.

🔐 **Para Producción**: Implementar:
- Bcrypt para hash de contraseñas
- Rate limiting en endpoints
- HTTPS obligatorio
- Validación de inputs robusta

---

## 🚀 Comandos Útiles

```bash
# Desarrollo
npm run dev              # Servidor local

# Base de datos
npm run db:create        # Crear DB en Cloudflare
npm run db:init          # Inicializar con schema y datos
npm run db:migrate       # Migrar datos existentes
npm run db:seed          # Solo añadir CV de Rafael

# Despliegue
npm run deploy           # Publicar a producción

# Consultas manuales
npm run db:query "SELECT * FROM users"
npm run db:query "SELECT id, name, user_id FROM cvs"
```

---

## 📊 Estructura de la Base de Datos

### Tabla `users`
```sql
id              TEXT PRIMARY KEY
username        TEXT UNIQUE NOT NULL
password_hash   TEXT NOT NULL
email           TEXT
created_at      TEXT NOT NULL
```

### Tabla `cvs`
```sql
id              TEXT PRIMARY KEY
user_id         TEXT NOT NULL (FK -> users.id)
name            TEXT NOT NULL
data            TEXT NOT NULL (JSON)
slug            TEXT UNIQUE NOT NULL
is_public       INTEGER DEFAULT 0
created_at      TEXT NOT NULL
updated_at      TEXT NOT NULL
```

---

## 🌐 Rutas de la Aplicación

### Públicas
- `/` → Redirige a `/login.html`
- `/login.html` → Página de inicio de sesión
- `/register.html` → Página de registro
- `/cv/:slug` → CV público (si is_public = 1)

### Protegidas (requieren autenticación)
- `/editor.html` → Editor de CVs
- `/preview.html` → Vista previa de CV

### API Endpoints
- `POST /api/register` → Crear cuenta
- `POST /api/login` → Iniciar sesión
- `GET /api/cvs` → Listar CVs del usuario
- `POST /api/cvs` → Crear nuevo CV
- `PUT /api/cvs/:id` → Actualizar CV
- `DELETE /api/cvs/:id` → Eliminar CV
- `POST /api/ai/optimize` → Optimizar con IA

---

## 🐛 Solución de Problemas

### Error: "No autorizado"
- Verificar que el token esté en sessionStorage
- Reiniciar sesión (logout + login)

### Error: "CV no encontrado"
- Verificar que el CV pertenezca al usuario actual
- Revisar el `user_id` en la base de datos

### Error de IA: "Error al procesar"
- Verificar que BLACKBOX_API_KEY esté configurada
- Revisar límites de la API (rate limiting)

### Base de datos vacía después de deploy
- Ejecutar `npm run db:init` en remoto
- Verificar que `database_id` en wrangler.toml sea correcto

---

## 📝 Próximos Pasos Recomendados

### Seguridad
- [ ] Implementar bcrypt para contraseñas
- [ ] Añadir rate limiting
- [ ] Validación robusta de inputs
- [ ] Tokens JWT con expiración

### Funcionalidades
- [ ] Recuperación de contraseña
- [ ] Plantillas de CV predefinidas
- [ ] Exportación a Word/PDF
- [ ] Historial de cambios (versionado)

### UX/UI
- [ ] Tutorial interactivo para nuevos usuarios
- [ ] Preview en tiempo real mientras editas
- [ ] Temas/estilos personalizables
- [ ] Sugerencias automáticas al escribir

---

## 📧 Soporte

Para problemas o preguntas:
1. Revisar esta guía
2. Consultar logs con `wrangler tail`
3. Verificar estado de Cloudflare Workers
4. Revisar documentación de Cloudflare D1

---

**¡Configuración completa! 🎉**

El sistema está listo para usar con el usuario Rafael y abierto para nuevos registros.
