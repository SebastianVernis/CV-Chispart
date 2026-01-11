# Changelog - Sistema de CVs

## [2.0.0] - Sistema Multi-Usuario

### ✨ Nuevas Características

#### Sistema de Usuarios
- **CVs por perfil**: Cada usuario tiene acceso únicamente a sus propios CVs
- **Tabla de usuarios**: Nueva tabla `users` en la base de datos
- **Autenticación mejorada**: Los tokens incluyen `user_id` para identificación única
- **Seguridad reforzada**: Validación en backend para todas las operaciones CRUD

#### Gestión de Educación
- **Sección de Educación**: Nueva sección en el editor de CV
- **Campos**: Título/Grado, Institución, Período
- **CRUD completo**: Agregar, editar, eliminar educaciones
- **Visualización pública**: Aparece en los CVs públicos

#### Optimización con IA
- **Optimización por campo**: Botones individuales para optimizar cada sección
  - Perfil Profesional
  - Competencias Clave
  - Herramientas
  - Responsabilidades (por cada experiencia)
- **Prompts especializados**: Contexto específico según el campo
- **Aplicación directa**: Los cambios se aplican automáticamente al campo correspondiente
- **Interfaz mejorada**: Modal con scroll, preview y botones de acción

### 🔄 Cambios en Base de Datos

#### Nueva Estructura
```sql
-- Tabla de usuarios
users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT,
  created_at TEXT NOT NULL
)

-- Tabla de CVs actualizada
cvs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,  -- NUEVO CAMPO
  name TEXT NOT NULL,
  data TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  is_public INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
)
```

#### Migración
- Script `migration.sql` para bases de datos existentes
- Migra todos los CVs existentes al usuario `user_rafael`
- Comando: `npm run db:migrate`

### 🛠️ Cambios Técnicos

#### Backend (src/index.js)
- `getUserIdFromAuth()`: Nueva función para extraer user_id del token
- Login mejorado: Query a tabla `users` y generación de token con user_id
- Todos los endpoints de CVs filtran por `user_id`
- Validación de permisos en UPDATE y DELETE

#### Frontend
- **login.html**: Guarda `userId` y `username` en sessionStorage
- **editor.html**: 
  - Sección de educación completa
  - Sistema de optimización por campo con IA
  - Funciones para gestionar educación
  - Modal mejorado con scroll
- **index.html**: Redirige automáticamente a login

### 📦 Nuevos Scripts

```json
{
  "db:migrate": "wrangler d1 execute cv_database --file=./migration.sql --remote"
}
```

### 🔐 Seguridad

- **Aislamiento de datos**: Los usuarios solo acceden a sus propios CVs
- **Validación en backend**: Cada operación verifica el `user_id`
- **Tokens seguros**: Incluyen identificación única del usuario
- **Foreign Keys**: Garantizan integridad referencial

### 📝 Datos Predeterminados

#### Usuario por defecto
- **Username**: rafael
- **User ID**: user_rafael
- **Email**: rafaelmoramelo@gmail.com

#### CV predeterminado incluye
- **Información personal**: Nombre, rol, contacto
- **Educación**: Licenciatura en Ciencias de la Comunicación - UNAM
- **2 Experiencias laborales**: GSP y GADUSA
- **Competencias y herramientas**

### 🚀 Instrucciones de Actualización

#### Para instalación nueva:
```bash
npm run db:init
```

#### Para actualizar base de datos existente:
```bash
npm run db:migrate
```

### 📊 Impacto

- **Escalabilidad**: El sistema ahora soporta múltiples usuarios sin límites
- **Multi-tenancy**: Cada usuario tiene su espacio aislado
- **Productividad**: IA integrada acelera la creación de CVs profesionales
- **Completitud**: Sección de educación añade más valor al CV

---

## [1.0.0] - Versión Inicial

- Sistema de gestión de CVs
- Editor interactivo
- Links públicos compartibles
- Autenticación básica
- Base de datos D1
