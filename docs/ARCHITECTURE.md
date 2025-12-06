# Architecture Documentation - CV Manager

## System Overview

CV Manager is a serverless application built on Cloudflare Workers that provides CV management with multi-provider AI optimization capabilities.

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  login.html  │  │ editor.html  │  │ preview.html │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Cloudflare Workers                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   src/index.js                       │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │   │
│  │  │    Auth    │  │  CV CRUD   │  │  AI Routes │    │   │
│  │  │  Handlers  │  │  Handlers  │  │  Handlers  │    │   │
│  │  └────────────┘  └────────────┘  └────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              src/ai-providers.js                     │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │   │
│  │  │  OpenAI  │ │ Anthropic│ │  Gemini  │ │Blackbox│ │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Cloudflare D1 Database                     │
│  ┌──────────────┐              ┌──────────────┐            │
│  │    users     │──────────────│     cvs      │            │
│  │              │   1:N        │              │            │
│  └──────────────┘              └──────────────┘            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    External AI APIs                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐    │
│  │ OpenAI   │ │ Anthropic│ │  Google  │ │  Blackbox  │    │
│  │   API    │ │   API    │ │ Gemini   │ │    AI      │    │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
- **HTML5/CSS3** - Semantic markup and modern styling
- **Vanilla JavaScript** - No framework dependencies
- **LocalStorage** - Client-side session management

### Backend
- **Cloudflare Workers** - Serverless edge computing
- **Cloudflare D1** - SQLite-based serverless database
- **Cloudflare Assets** - Static file serving

### AI Integration
- **OpenAI API** - GPT-4, GPT-3.5-turbo
- **Anthropic API** - Claude 3.5 Sonnet, Claude 3 Opus
- **Google Gemini API** - Gemini 1.5 Pro, Gemini 1.5 Flash
- **Blackbox AI API** - Multi-model access

### Development & Testing
- **Vitest** - Unit and integration testing
- **Wrangler** - Cloudflare Workers CLI
- **Node.js** - Development environment

---

## Project Structure

```
cv-rafael/
├── src/
│   ├── index.js              # Main Worker entry point
│   └── ai-providers.js       # AI provider abstraction layer
├── public/
│   ├── login.html            # Authentication page
│   ├── register.html         # User registration
│   ├── editor.html           # CV editor (main app)
│   ├── preview.html          # CV preview
│   └── index.html            # Landing page
├── tests/
│   ├── auth.test.js          # Authentication tests
│   ├── api.test.js           # API endpoint tests
│   ├── database.test.js      # Database tests
│   └── ai.test.js            # AI provider tests
├── scripts/
│   ├── db-setup.js           # Automated DB setup
│   ├── db-verify.js          # DB integrity verification
│   └── db-backup.js          # DB backup utility
├── docs/
│   ├── API.md                # API documentation
│   └── ARCHITECTURE.md       # This file
├── backups/                  # Database backups (generated)
├── init_database.sql         # Initial DB schema + data
├── migration.sql             # Migration scripts
├── schema.sql                # DB schema only
├── wrangler.toml             # Cloudflare configuration
├── vitest.config.js          # Test configuration
└── package.json              # Dependencies and scripts
```

---

## Core Components

### 1. Authentication System

**Location:** `src/index.js` (handleAPI function)

**Flow:**
```
User Input → POST /api/register or /api/login
    ↓
Validate credentials
    ↓
Check database (D1)
    ↓
Generate JWT-like token (base64)
    ↓
Return token to client
    ↓
Client stores in sessionStorage
    ↓
Include in Authorization header for subsequent requests
```

**Token Structure:**
```javascript
const token = btoa(`${userId}:${username}:${timestamp}`);
// Example: "dXNlcl9yYWZhZWw6cmFmYWVsOjE3MDk1NjcwMDA="
```

**Security Features:**
- Password validation (min 6 characters)
- Username uniqueness check
- Session-based authentication
- Token validation on protected routes

---

### 2. CV Management System

**Location:** `src/index.js` (CV CRUD handlers)

**Data Model:**
```javascript
{
  id: "cv_1234567890",           // Unique identifier
  user_id: "user_rafael",         // Owner reference
  name: "My Professional CV",     // Display name
  data: {                         // JSON CV content
    name: "John Doe",
    role: "Developer",
    location: "City, Country",
    phone: "+1 234 567 8900",
    email: "john@example.com",
    linkedin: "/in/johndoe",
    summary: "Professional summary...",
    experiences: [...],
    education: [...],
    skills: "Skill1, Skill2",
    tools: "Tool1, Tool2",
    profileImage: "data:image/jpeg;base64,..."
  },
  slug: "abc123xyz456",          // Public URL identifier
  is_public: 0,                  // Visibility flag
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z"
}
```

**Operations:**
- **Create:** Generate unique ID and slug, store in D1
- **Read:** Fetch by user_id or slug
- **Update:** Modify data, update timestamp
- **Delete:** Remove from database (CASCADE)

**Access Control:**
- Users can only access their own CVs
- Public CVs accessible via slug without auth
- All operations validate user ownership

---

### 3. AI Provider System

**Location:** `src/ai-providers.js`

**Architecture:**
```
┌─────────────────────────────────────────────┐
│         AI Provider Abstraction Layer       │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │   optimizeWithAI(options)           │   │
│  │   - Unified interface                │   │
│  │   - Provider selection               │   │
│  │   - Error handling                   │   │
│  └─────────────────────────────────────┘   │
│                    │                        │
│       ┌────────────┼────────────┐          │
│       ▼            ▼            ▼          │
│  ┌────────┐  ┌────────┐  ┌────────┐       │
│  │ OpenAI │  │Anthropic│  │ Gemini │       │
│  │Provider│  │Provider │  │Provider│       │
│  └────────┘  └────────┘  └────────┘       │
│       │            │            │          │
│       └────────────┼────────────┘          │
│                    ▼                        │
│  ┌─────────────────────────────────────┐   │
│  │   compareProviders(options)         │   │
│  │   - Parallel execution               │   │
│  │   - Result aggregation               │   │
│  │   - Failure tolerance                │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

**Provider Interface:**
```javascript
async function callProvider(apiKey, model, prompt, cvData) {
  // 1. Format request for specific provider
  // 2. Make API call
  // 3. Parse response
  // 4. Return standardized format
  return {
    provider: 'openai',
    model: 'gpt-4',
    suggestion: 'AI-generated content...',
    usage: { prompt_tokens: 100, completion_tokens: 200 }
  };
}
```

**Features:**
- **Provider Abstraction:** Unified interface for all AI providers
- **Automatic Fallback:** Graceful degradation if provider fails
- **Parallel Comparison:** Compare multiple providers simultaneously
- **Usage Tracking:** Monitor token consumption per provider

---

### 4. Database Schema

**Location:** `init_database.sql`, `schema.sql`

**Tables:**

#### users
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,                    -- user_1234567890
  username TEXT UNIQUE NOT NULL,          -- rafael
  password_hash TEXT NOT NULL,            -- Plain text (demo) or bcrypt
  email TEXT,                             -- Optional
  email_verified INTEGER DEFAULT 0,       -- 0 or 1
  email_verification_token TEXT,          -- For email verification
  created_at TEXT NOT NULL                -- ISO 8601 timestamp
);
```

#### cvs
```sql
CREATE TABLE cvs (
  id TEXT PRIMARY KEY,                    -- cv_1234567890
  user_id TEXT NOT NULL,                  -- Foreign key to users
  name TEXT NOT NULL,                     -- CV display name
  data TEXT NOT NULL,                     -- JSON string
  profile_image TEXT,                     -- Base64 image data
  slug TEXT UNIQUE NOT NULL,              -- abc123xyz456
  is_public INTEGER DEFAULT 0,            -- 0 or 1
  created_at TEXT NOT NULL,               -- ISO 8601 timestamp
  updated_at TEXT NOT NULL,               -- ISO 8601 timestamp
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Indexes:**
```sql
CREATE INDEX idx_cvs_user_id ON cvs(user_id);
CREATE INDEX idx_cvs_updated_at ON cvs(updated_at DESC);
CREATE INDEX idx_cvs_slug ON cvs(slug);
CREATE INDEX idx_cvs_public ON cvs(is_public);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email_verification ON users(email_verification_token);
```

**Relationships:**
- One user → Many CVs (1:N)
- CASCADE delete: Deleting user removes all their CVs

---

## Data Flow

### 1. User Registration Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│  Worker  │────▶│    D1    │────▶│   SMTP   │
│          │     │          │     │ Database │     │  Server  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                │                 │                │
     │ POST /register │                 │                │
     │───────────────▶│                 │                │
     │                │ Validate input  │                │
     │                │─────────────────│                │
     │                │ Check username  │                │
     │                │────────────────▶│                │
     │                │◀────────────────│                │
     │                │ Insert user     │                │
     │                │────────────────▶│                │
     │                │◀────────────────│                │
     │                │ Send verification email         │
     │                │────────────────────────────────▶│
     │                │ Generate token  │                │
     │◀───────────────│                 │                │
     │ {token, userId}│                 │                │
```

### 2. CV Creation Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│  Worker  │────▶│    D1    │
│          │     │          │     │ Database │
└──────────┘     └──────────┘     └──────────┘
     │                │                 │
     │ POST /api/cvs  │                 │
     │ + Auth token   │                 │
     │───────────────▶│                 │
     │                │ Validate token  │
     │                │─────────────────│
     │                │ Extract user_id │
     │                │─────────────────│
     │                │ Generate slug   │
     │                │─────────────────│
     │                │ Insert CV       │
     │                │────────────────▶│
     │                │◀────────────────│
     │◀───────────────│                 │
     │ {success, slug}│                 │
```

### 3. AI Optimization Flow

```
┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌──────────┐
│  Client  │─▶│  Worker  │─▶│ AI Providers │─▶│ External │
│          │  │          │  │    Module    │  │ AI APIs  │
└──────────┘  └──────────┘  └──────────────┘  └──────────┘
     │             │              │                  │
     │ POST /ai/optimize          │                  │
     │ + provider + cvData        │                  │
     │────────────▶│              │                  │
     │             │ Validate auth│                  │
     │             │──────────────│                  │
     │             │ Get API keys │                  │
     │             │──────────────│                  │
     │             │ Call provider│                  │
     │             │─────────────▶│                  │
     │             │              │ Format request   │
     │             │              │─────────────────▶│
     │             │              │◀─────────────────│
     │             │              │ Parse response   │
     │             │◀─────────────│                  │
     │◀────────────│              │                  │
     │ {suggestion, usage}        │                  │
```

### 4. Multi-Provider Comparison Flow

```
┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌──────────┐
│  Client  │─▶│  Worker  │─▶│ AI Providers │─▶│ Multiple │
│          │  │          │  │    Module    │  │ AI APIs  │
└──────────┘  └──────────┘  └──────────────┘  └──────────┘
     │             │              │                  │
     │ POST /ai/compare           │                  │
     │ + providers[] + cvData     │                  │
     │────────────▶│              │                  │
     │             │ Validate auth│                  │
     │             │──────────────│                  │
     │             │ Call compare │                  │
     │             │─────────────▶│                  │
     │             │              │ Parallel calls   │
     │             │              │─────────────────▶│
     │             │              │ (OpenAI)         │
     │             │              │─────────────────▶│
     │             │              │ (Anthropic)      │
     │             │              │─────────────────▶│
     │             │              │ (Gemini)         │
     │             │              │◀─────────────────│
     │             │              │ Aggregate results│
     │             │◀─────────────│                  │
     │◀────────────│              │                  │
     │ {results: [...]}           │                  │
```

---

## Security Considerations

### 1. Authentication
- ✅ Token-based authentication
- ✅ Session validation on protected routes
- ⚠️ Passwords stored in plain text (demo only)
- 🔒 **Production:** Use bcrypt or Argon2 for password hashing

### 2. Authorization
- ✅ User ownership validation for CV operations
- ✅ Public/private CV access control
- ✅ User ID extracted from token, not client input

### 3. Input Validation
- ✅ Username length (min 3 chars)
- ✅ Password length (min 6 chars)
- ✅ Email format validation
- ✅ Required field checks

### 4. API Security
- ✅ API keys stored in environment variables
- ✅ Never exposed to client
- ✅ CORS headers configured
- ✅ Rate limiting via Cloudflare

### 5. Data Protection
- ✅ User data isolation
- ✅ CASCADE delete for data integrity
- ✅ Unique constraints on usernames and slugs

---

## Performance Optimization

### 1. Database
- **Indexes:** Optimized queries with strategic indexes
- **Prepared Statements:** Parameterized queries prevent SQL injection
- **Efficient Queries:** SELECT only needed columns

### 2. Caching
- **Static Assets:** Cached by Cloudflare CDN
- **Public CVs:** Cache-Control headers (5 minutes)
- **Client-side:** SessionStorage for auth tokens

### 3. Edge Computing
- **Global Distribution:** Cloudflare Workers run at edge locations
- **Low Latency:** Requests served from nearest data center
- **Scalability:** Automatic scaling with traffic

### 4. AI Optimization
- **Parallel Execution:** Multiple providers called simultaneously
- **Timeout Handling:** Graceful degradation on slow responses
- **Token Management:** Monitor and optimize prompt sizes

---

## Deployment

### Development
```bash
npm run dev                    # Start local development server
```

### Testing
```bash
npm test                       # Run test suite
npm run test:watch             # Watch mode
npm run test:ui                # UI mode
```

### Database Setup
```bash
npm run db:setup               # Automated setup
npm run db:verify              # Verify integrity
npm run db:backup              # Create backup
```

### Production
```bash
npm run deploy                 # Deploy to Cloudflare Workers
```

---

## Monitoring & Debugging

### Logs
```bash
wrangler tail                  # Stream live logs
wrangler tail --format=pretty  # Formatted logs
```

### Database Queries
```bash
npm run db:query "SELECT * FROM users"
```

### Health Checks
```bash
npm run db:verify              # Database integrity check
```

---

## Scalability

### Current Limits
- **Cloudflare Workers:** 10ms CPU time per request (free tier)
- **D1 Database:** 5 GB storage (free tier)
- **Requests:** 100,000/day (free tier)

### Scaling Strategies
1. **Upgrade Cloudflare Plan:** Increase limits
2. **Optimize Queries:** Reduce database operations
3. **Implement Caching:** Redis or KV for frequently accessed data
4. **Batch Operations:** Combine multiple operations
5. **Async Processing:** Queue heavy operations

---

## Future Enhancements

### Planned Features
- [ ] Real-time collaboration
- [ ] CV templates
- [ ] Export to PDF (server-side)
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] OAuth integration (Google, GitHub)
- [ ] Webhook notifications
- [ ] API rate limiting per user
- [ ] Advanced search and filtering

### Technical Improvements
- [ ] Password hashing (bcrypt)
- [ ] JWT tokens with expiration
- [ ] Database migrations system
- [ ] Comprehensive error logging
- [ ] Performance monitoring
- [ ] Automated backups
- [ ] CI/CD pipeline
- [ ] End-to-end tests

---

## Contributing

### Development Workflow
1. Fork repository
2. Create feature branch
3. Write tests
4. Implement feature
5. Run test suite
6. Submit pull request

### Code Standards
- **Style:** Follow existing patterns
- **Testing:** Maintain >80% coverage
- **Documentation:** Update docs for new features
- **Commits:** Use conventional commits

---

## Support

For questions or issues:
- **Email:** sebastianvernis@gmail.com
- **Documentation:** `/docs` directory
- **Tests:** `/tests` directory

---

## License

MIT License - See LICENSE file for details
