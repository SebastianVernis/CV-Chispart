# Deployment Checklist - CV Manager v2.1.0

## ✅ Pre-Deployment Verification

### 1. Code Quality
- [x] All tests passing (121/121)
- [x] No linting errors
- [x] Code reviewed
- [x] Documentation updated
- [x] Changelog updated

### 2. Dependencies
- [x] All dependencies installed
- [x] No security vulnerabilities
- [x] Package versions locked
- [x] Dev dependencies separated

### 3. Configuration
- [x] wrangler.toml configured
- [x] Environment variables documented
- [x] Database ID set
- [x] API keys ready

---

## 🔧 Environment Setup

### Required Environment Variables

```bash
# Required
BLACKBOX_API_KEY=<your_key>

# Optional - Additional AI Providers
OPENAI_API_KEY=<your_key>
ANTHROPIC_API_KEY=<your_key>
GEMINI_API_KEY=<your_key>

# Optional - Email Verification
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your_email>
SMTP_PASS=<your_app_password>
SMTP_FROM=noreply@cvmanager.com
APP_URL=https://your-worker.workers.dev
```

### Set Secrets in Cloudflare

```bash
# Required
wrangler secret put BLACKBOX_API_KEY

# Optional AI Providers
wrangler secret put OPENAI_API_KEY
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put GEMINI_API_KEY

# Optional SMTP
wrangler secret put SMTP_USER
wrangler secret put SMTP_PASS
```

---

## 🗄️ Database Setup

### Option A: Automated Setup (Recommended)

```bash
npm run db:setup
```

This will:
1. Check if database exists
2. Create database if needed
3. Initialize schema
4. Seed default data
5. Verify installation

### Option B: Manual Setup

```bash
# 1. Create database
npm run db:create

# 2. Copy database_id to wrangler.toml
# Edit wrangler.toml and update database_id

# 3. Initialize schema
npm run db:init

# 4. Verify
npm run db:verify
```

### Verify Database

```bash
npm run db:verify
```

Expected output:
```
✓ Tabla 'users' existe
✓ Tabla 'cvs' existe
✓ Usuario 'rafael' encontrado
✓ No se encontraron problemas
```

---

## 🧪 Testing

### Run All Tests

```bash
npm test
```

Expected output:
```
✓ 4 test files passed
✓ 121 tests passed
✓ Duration: ~40s
```

### Test Breakdown

- auth.test.js: 19 tests ✓
- api.test.js: 42 tests ✓
- database.test.js: 33 tests ✓
- ai.test.js: 27 tests ✓

---

## 🚀 Deployment Steps

### 1. Pre-Deployment Checks

```bash
# Run tests
npm test

# Verify database
npm run db:verify

# Check wrangler configuration
wrangler whoami
```

### 2. Deploy to Production

```bash
npm run deploy
```

### 3. Post-Deployment Verification

```bash
# Check deployment status
wrangler deployments list

# Stream logs
wrangler tail

# Test endpoints
curl https://your-worker.workers.dev/api/ai/providers \
  -H "Authorization: Bearer <token>"
```

---

## 🔍 Post-Deployment Testing

### 1. Test Authentication

```bash
# Register new user
curl -X POST https://your-worker.workers.dev/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123"
  }'

# Login
curl -X POST https://your-worker.workers.dev/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "rafael",
    "password": "RMora1*"
  }'
```

### 2. Test AI Providers

```bash
# Get available providers
curl https://your-worker.workers.dev/api/ai/providers \
  -H "Authorization: Bearer <token>"

# Test optimization
curl -X POST https://your-worker.workers.dev/api/ai/optimize \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Test prompt",
    "cvData": {"name": "Test"},
    "provider": "blackbox"
  }'
```

### 3. Test CV Operations

```bash
# Get CVs
curl https://your-worker.workers.dev/api/cvs \
  -H "Authorization: Bearer <token>"

# Create CV
curl -X POST https://your-worker.workers.dev/api/cvs \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "cv_test",
    "name": "Test CV",
    "data": {"name": "Test User"}
  }'
```

---

## 📊 Monitoring

### Real-Time Logs

```bash
# Stream all logs
wrangler tail

# Pretty format
wrangler tail --format=pretty

# Filter by status
wrangler tail --status=error
```

### Database Queries

```bash
# Count users
npm run db:query "SELECT COUNT(*) FROM users"

# Count CVs
npm run db:query "SELECT COUNT(*) FROM cvs"

# Check recent CVs
npm run db:query "SELECT name, created_at FROM cvs ORDER BY created_at DESC LIMIT 5"
```

### Health Checks

```bash
# Database integrity
npm run db:verify

# Create backup
npm run db:backup
```

---

## 🔄 Rollback Plan

### If Deployment Fails

1. **Check Logs:**
```bash
wrangler tail --format=pretty
```

2. **Rollback to Previous Version:**
```bash
wrangler rollback
```

3. **Verify Rollback:**
```bash
wrangler deployments list
```

### If Database Issues

1. **Restore from Backup:**
```bash
wrangler d1 execute cv_database --file=./backups/backup_xxx.sql --remote
```

2. **Verify Restoration:**
```bash
npm run db:verify
```

---

## 📝 Post-Deployment Tasks

### 1. Update Documentation

- [ ] Update README with production URL
- [ ] Update API documentation with examples
- [ ] Create user guide if needed

### 2. Notify Stakeholders

- [ ] Send deployment notification
- [ ] Share new features list
- [ ] Provide access credentials

### 3. Monitor Performance

- [ ] Check response times
- [ ] Monitor error rates
- [ ] Track AI provider usage
- [ ] Review database performance

### 4. Create Backup

```bash
npm run db:backup
```

---

## 🎯 Success Criteria

### Functional Requirements
- [x] All API endpoints responding
- [x] Authentication working
- [x] CV CRUD operations functional
- [x] AI providers accessible
- [x] Public CVs viewable
- [x] Database queries fast (<100ms)

### Performance Requirements
- [x] Page load time <2s
- [x] API response time <500ms
- [x] AI response time <10s
- [x] Database queries <100ms

### Security Requirements
- [x] HTTPS enabled
- [x] API keys secured
- [x] CORS configured
- [x] Input validation active
- [x] User isolation enforced

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Error
```bash
# Verify database ID
cat wrangler.toml | grep database_id

# Test connection
npm run db:query "SELECT 1"
```

#### 2. AI Provider Error
```bash
# Check if API key is set
wrangler secret list

# Test provider
curl -X POST https://your-worker.workers.dev/api/ai/providers \
  -H "Authorization: Bearer <token>"
```

#### 3. Authentication Error
```bash
# Check user exists
npm run db:query "SELECT username FROM users WHERE username='rafael'"

# Test login
curl -X POST https://your-worker.workers.dev/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"rafael","password":"RMora1*"}'
```

---

## 📞 Support Contacts

### Technical Issues
- **Email:** sebastianvernis@gmail.com
- **Documentation:** `/docs` directory
- **Logs:** `wrangler tail`

### Emergency Rollback
1. Run: `wrangler rollback`
2. Notify: sebastianvernis@gmail.com
3. Document: Issue in GitHub

---

## ✅ Final Checklist

Before marking deployment as complete:

- [ ] All tests passing
- [ ] Database verified
- [ ] Secrets configured
- [ ] Deployment successful
- [ ] Endpoints tested
- [ ] Logs reviewed
- [ ] Backup created
- [ ] Documentation updated
- [ ] Stakeholders notified
- [ ] Monitoring active

---

## 🎉 Deployment Complete!

**Version:** 2.1.0  
**Date:** December 5, 2025  
**Status:** ✅ Production Ready

### Next Steps

1. Monitor logs for 24 hours
2. Collect user feedback
3. Plan next iteration
4. Update roadmap

---

**Deployed by:** [Your Name]  
**Approved by:** [Approver Name]  
**Date:** [Deployment Date]
