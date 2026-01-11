# API Documentation - CV Manager

Complete API reference for the CV Manager application deployed on Cloudflare Workers.

## Base URL

```
Production: https://your-worker.workers.dev
Development: http://localhost:8787
```

## Authentication

Most endpoints require authentication using Bearer tokens.

### Headers

```http
Authorization: Bearer <token>
Content-Type: application/json
```

### Token Format

Tokens are base64-encoded strings containing:
```
user_id:username:timestamp
```

---

## Authentication Endpoints

### Register User

Create a new user account.

**Endpoint:** `POST /api/register`

**Request Body:**
```json
{
  "username": "string (min 3 chars, required)",
  "password": "string (min 6 chars, required)",
  "email": "string (optional)"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "token": "base64_encoded_token",
  "userId": "user_1234567890",
  "username": "newuser",
  "emailSent": false,
  "message": "Usuario creado exitosamente"
}
```

**Error Responses:**
- `400` - Missing or invalid fields
- `409` - Username already exists
- `500` - Server error

**Example:**
```bash
curl -X POST http://localhost:8787/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "securepass123",
    "email": "john@example.com"
  }'
```

---

### Login

Authenticate and receive a session token.

**Endpoint:** `POST /api/login`

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "base64_encoded_token",
  "userId": "user_rafael",
  "username": "rafael"
}
```

**Error Responses:**
- `401` - Invalid credentials
- `500` - Server error

**Example:**
```bash
curl -X POST http://localhost:8787/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "rafael",
    "password": "RMora1*"
  }'
```

---

### Verify Email

Verify user email address using verification token.

**Endpoint:** `GET /api/verify-email/:token`

**URL Parameters:**
- `token` - Email verification token (string)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Email verificado exitosamente"
}
```

**Error Responses:**
- `400` - Invalid or expired token
- `500` - Server error

---

## CV Management Endpoints

All CV endpoints require authentication.

### Get All CVs

Retrieve all CVs for the authenticated user.

**Endpoint:** `GET /api/cvs`

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
[
  {
    "id": "cv_123",
    "user_id": "user_rafael",
    "name": "My Professional CV",
    "data": "{\"name\":\"John Doe\",\"role\":\"Developer\"}",
    "profile_image": "data:image/jpeg;base64,...",
    "slug": "abc123xyz456",
    "is_public": 0,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

**Error Responses:**
- `401` - Unauthorized
- `500` - Server error

---

### Create CV

Create a new CV.

**Endpoint:** `POST /api/cvs`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "id": "cv_1234567890",
  "name": "My New CV",
  "data": {
    "name": "John Doe",
    "role": "Software Developer",
    "location": "New York, USA",
    "phone": "+1 234 567 8900",
    "email": "john@example.com",
    "linkedin": "/in/johndoe",
    "summary": "Experienced software developer...",
    "experiences": [
      {
        "role": "Senior Developer",
        "company": "Tech Corp",
        "dates": "2020-2023",
        "responsibilities": "Led development team\nImplemented new features"
      }
    ],
    "education": [
      {
        "degree": "Bachelor of Computer Science",
        "institution": "University Name",
        "dates": "2015-2019"
      }
    ],
    "skills": "JavaScript, Python, React, Node.js",
    "tools": "Git, Docker, AWS, VS Code"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "id": "cv_1234567890",
  "slug": "abc123xyz456"
}
```

**Error Responses:**
- `401` - Unauthorized
- `500` - Server error

---

### Update CV

Update an existing CV.

**Endpoint:** `PUT /api/cvs/:id`

**Headers:** `Authorization: Bearer <token>`

**URL Parameters:**
- `id` - CV ID (string)

**Request Body:**
```json
{
  "name": "Updated CV Name",
  "data": {
    "name": "John Doe",
    "role": "Senior Software Developer",
    ...
  },
  "is_public": 1
}
```

**Success Response (200):**
```json
{
  "success": true
}
```

**Error Responses:**
- `401` - Unauthorized
- `404` - CV not found or not authorized
- `500` - Server error

---

### Delete CV

Delete a CV.

**Endpoint:** `DELETE /api/cvs/:id`

**Headers:** `Authorization: Bearer <token>`

**URL Parameters:**
- `id` - CV ID (string)

**Success Response (200):**
```json
{
  "success": true
}
```

**Error Responses:**
- `401` - Unauthorized
- `500` - Server error

---

### Get CV by Slug

Retrieve a CV by its unique slug (requires authentication).

**Endpoint:** `GET /api/cv-by-slug/:slug`

**Headers:** `Authorization: Bearer <token>`

**URL Parameters:**
- `slug` - CV slug (12-character alphanumeric string)

**Success Response (200):**
```json
{
  "id": "cv_123",
  "user_id": "user_rafael",
  "name": "My CV",
  "data": "{...}",
  "slug": "abc123xyz456",
  "is_public": 1,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `401` - Unauthorized
- `404` - CV not found
- `500` - Server error

---

## AI Assistant Endpoints

All AI endpoints require authentication.

### Get Available Providers

Get list of configured AI providers.

**Endpoint:** `GET /api/ai/providers`

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "providers": ["openai", "anthropic", "gemini", "blackbox"],
  "default": "blackbox"
}
```

**Error Responses:**
- `401` - Unauthorized
- `500` - Server error

---

### Optimize with AI (Single Provider)

Optimize CV content using a single AI provider.

**Endpoint:** `POST /api/ai/optimize`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "prompt": "Optimize my professional summary for a tech role",
  "cvData": {
    "name": "John Doe",
    "role": "Developer",
    "summary": "I am a developer with experience...",
    "experiences": [...],
    "skills": "JavaScript, Python",
    "tools": "Git, Docker"
  },
  "provider": "openai",
  "model": "gpt-4"
}
```

**Parameters:**
- `prompt` (required) - What you want to optimize
- `cvData` (required) - Current CV data
- `provider` (optional) - AI provider to use (default: "blackbox")
  - Options: "openai", "anthropic", "gemini", "blackbox"
- `model` (optional) - Specific model to use

**Success Response (200):**
```json
{
  "success": true,
  "provider": "openai",
  "model": "gpt-4",
  "suggestion": "Here's an optimized version of your professional summary:\n\nExperienced Software Developer with 5+ years...",
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 200,
    "total_tokens": 350
  }
}
```

**Error Responses:**
- `401` - Unauthorized
- `500` - AI provider error or server error

**Example:**
```bash
curl -X POST http://localhost:8787/api/ai/optimize \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Improve my skills section",
    "cvData": {"name": "John", "skills": "JavaScript"},
    "provider": "openai"
  }'
```

---

### Compare Multiple Providers

Compare responses from multiple AI providers.

**Endpoint:** `POST /api/ai/compare`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "prompt": "Optimize my professional summary",
  "cvData": {
    "name": "John Doe",
    "role": "Developer",
    "summary": "Current summary...",
    ...
  },
  "providers": ["openai", "anthropic", "gemini", "blackbox"]
}
```

**Parameters:**
- `prompt` (required) - What you want to optimize
- `cvData` (required) - Current CV data
- `providers` (required) - Array of providers to compare (minimum 1)

**Success Response (200):**
```json
{
  "success": true,
  "results": [
    {
      "success": true,
      "provider": "openai",
      "model": "gpt-3.5-turbo",
      "suggestion": "OpenAI's optimized version...",
      "usage": {
        "prompt_tokens": 150,
        "completion_tokens": 200
      }
    },
    {
      "success": true,
      "provider": "anthropic",
      "model": "claude-3-5-sonnet-20241022",
      "suggestion": "Claude's optimized version...",
      "usage": {
        "input_tokens": 150,
        "output_tokens": 200
      }
    },
    {
      "success": false,
      "provider": "gemini",
      "error": "Google Gemini API key not configured"
    },
    {
      "success": true,
      "provider": "blackbox",
      "model": "blackboxai/openai/gpt-4o",
      "suggestion": "Blackbox's optimized version...",
      "usage": {
        "prompt_tokens": 150,
        "completion_tokens": 200
      }
    }
  ]
}
```

**Error Responses:**
- `401` - Unauthorized
- `500` - Server error

**Example:**
```bash
curl -X POST http://localhost:8787/api/ai/compare \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Optimize my CV",
    "cvData": {"name": "John"},
    "providers": ["openai", "anthropic"]
  }'
```

---

## Public Endpoints

### View Public CV

View a public CV by its slug (no authentication required).

**Endpoint:** `GET /cv/:slug`

**URL Parameters:**
- `slug` - CV slug (12-character alphanumeric string)

**Success Response (200):**
Returns HTML page with rendered CV.

**Error Responses:**
- `404` - CV not found or not public
- `500` - Server error

**Example:**
```
https://your-worker.workers.dev/cv/abc123xyz456
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

Or for validation errors:

```json
{
  "success": false,
  "message": "Validation error message"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

---

## Rate Limiting

Currently, there are no rate limits implemented. However, Cloudflare Workers have built-in protections against abuse.

---

## CORS

All API endpoints support CORS with the following headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## Environment Variables

Required environment variables for full functionality:

```bash
# Required
BLACKBOX_API_KEY=your_blackbox_api_key

# Optional (for multi-provider AI support)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...

# Optional (for email verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@cvmanager.com
APP_URL=https://your-worker.workers.dev
```

Set in production using:
```bash
wrangler secret put BLACKBOX_API_KEY
wrangler secret put OPENAI_API_KEY
# etc...
```

---

## Testing

Use the provided test suite:

```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:ui          # UI mode
```

---

## Support

For issues or questions:
- Email: sebastianvernis@gmail.com
- GitHub: [Repository URL]
