# Lead Generation & Subscription Flow

## Overview
This document describes the new lead generation and subscription system that replaces the previous payment mockup.

## Key Features
- Lead capture with plan selection
- 24-hour trial period for all users
- Invoice generation with IVA (optional)
- Email delivery via Resend API
- Subscription verification and management
- Automated trial expiration checks

---

## Pricing Structure

### Annual Plans (MXN)
- **Básico**: $2,000/año
- **Profesional**: $4,000/año  
- **Empresarial**: $6,000/año

### IVA Handling
- IVA (16%) is **only added** if user checks "Requiero factura"
- Prices are displayed without IVA by default
- Total calculation: `base_price + (base_price * 0.16)` if invoice required

---

## User Flow

### 1. Lead Registration (`register.html`)
User fills out form with:
- **Required**: Full name, email, plan selection
- **Optional**: Phone, company, custom solution request
- **Checkboxes**: 
  - Requires invoice (adds IVA)
  - Requires custom solution (shows text field)

### 2. Lead Creation (Backend)
When form is submitted to `/api/leads`:

1. **Validate input data**
   - Email format validation
   - Plan validation (basico, profesional, empresarial)
   - Required fields check

2. **Create lead record**
   - Generate unique `lead_id`
   - Store all form data in `leads` table
   - Status: `pending`

3. **Create temporary user account**
   - Generate username from email + random suffix
   - Generate temporary password
   - Set `trial_active = 1`

4. **Create trial subscription**
   - Generate `subscription_id`
   - Set trial period: 24 hours from creation
   - Calculate pricing with optional IVA
   - Status: `trial`
   - Link to user and lead

5. **Generate invoice (if required)**
   - Create invoice record with unique number
   - Calculate subtotal, IVA, and total
   - Status: `pending`

6. **Send invoice email via Resend**
   - Professional HTML email template
   - Invoice details and next steps
   - Sales team contact information
   - Mark invoice as `sent`

7. **Return trial access**
   - Generate session token
   - Return credentials and trial expiration time
   - Redirect to editor with 24-hour access

---

## Subscription States

### Trial (`trial`)
- Initial state for all new leads
- Duration: 24 hours from creation
- Full access to platform features
- Automatic expiration check via cron

### Active (`active`)
- Payment has been verified by admin
- Trial converted to full 1-year subscription
- Access granted until subscription end date

### Expired (`expired`)
- Trial period ended without payment verification
- Access to platform denied
- User sees message to contact sales

### Cancelled (`cancelled`)
- Manually cancelled by admin or user
- Access denied

---

## Trial Expiration System

### Cron Job (Hourly)
Configured in `wrangler.toml`:
```toml
[triggers]
crons = ["0 * * * *"]
```

Runs `checkAndExpireTrials()` function every hour:

1. **Find expired trials**
   - Query subscriptions with `status = 'trial'` and `trial_end < NOW()`

2. **For each expired trial:**
   - **If payment NOT verified**:
     - Set subscription status to `expired`
     - Set user `trial_active = 0`
     - User loses access
   
   - **If payment verified**:
     - Set subscription status to `active`
     - Set subscription_start to now
     - Set subscription_end to +1 year
     - Set user `trial_active = 0`
     - User maintains access for 1 year

---

## Subscription Verification Middleware

Function: `checkSubscriptionStatus(env, userId)`

Called before any CV operation (GET/POST/PUT/DELETE):

### Checks:
1. Does user have a subscription?
2. What is the current status?
3. Is trial still active?
4. Is subscription expired?

### Returns:
```javascript
{
  allowed: boolean,
  status: 'trial' | 'active' | 'expired',
  message: string,
  trialEnd?: string,
  subscriptionEnd?: string
}
```

### Behavior:
- If `allowed = false`: Return 403 with message
- If `allowed = true`: Continue with request

---

## Admin Endpoints

### 1. Verify Payment
**Endpoint**: `POST /api/admin/subscriptions/verify-payment`

**Headers**:
```
Authorization: Bearer {ADMIN_SECRET}
```

**Body**:
```json
{
  "subscriptionId": "sub_1234567890"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Pago verificado exitosamente",
  "subscription": { ... }
}
```

**Effect**:
- Sets `payment_verified = 1`
- Sets `payment_verified_at = NOW()`
- Next cron run will activate subscription

### 2. List All Leads
**Endpoint**: `GET /api/admin/leads`

**Headers**:
```
Authorization: Bearer {ADMIN_SECRET}
```

**Response**:
```json
{
  "success": true,
  "leads": [
    {
      "id": "lead_...",
      "full_name": "...",
      "email": "...",
      "plan_selected": "profesional",
      "requires_invoice": 1,
      "requires_custom_solution": 0,
      "status": "pending",
      "created_at": "..."
    }
  ]
}
```

---

## Database Schema

### Leads Table
```sql
CREATE TABLE leads (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  plan_selected TEXT NOT NULL,
  requires_invoice INTEGER DEFAULT 0,
  requires_custom_solution INTEGER DEFAULT 0,
  custom_solution_description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT NOT NULL
);
```

### Subscriptions Table
```sql
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  lead_id TEXT,
  plan TEXT NOT NULL,
  price REAL NOT NULL,
  includes_iva INTEGER DEFAULT 0,
  iva_amount REAL DEFAULT 0,
  total_amount REAL NOT NULL,
  status TEXT DEFAULT 'trial',
  trial_start TEXT NOT NULL,
  trial_end TEXT NOT NULL,
  payment_verified INTEGER DEFAULT 0,
  payment_verified_at TEXT,
  subscription_start TEXT,
  subscription_end TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);
```

### Invoices Table
```sql
CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL,
  lead_id TEXT NOT NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  subtotal REAL NOT NULL,
  iva_amount REAL DEFAULT 0,
  total REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  issued_at TEXT NOT NULL,
  sent_at TEXT,
  paid_at TEXT,
  pdf_url TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);
```

### Users Table Updates
```sql
ALTER TABLE users ADD COLUMN subscription_id TEXT;
ALTER TABLE users ADD COLUMN trial_active INTEGER DEFAULT 0;
```

---

## Email Configuration

### Resend API
Set environment variable in Cloudflare Workers:
```
RESEND_API_KEY=re_...
```

### Invoice Email Template
- Professional HTML design
- Includes invoice number and amounts
- Clear next steps for user
- Sales contact information
- Automatic sending on invoice generation

**Subject**: `Factura {invoice_number} - CV Manager`

**From**: `CV Manager <noreply@cvmanager.com>`

---

## Migration Steps

### 1. Run Database Migration
```bash
wrangler d1 execute cv_database --file=./migration_leads_subscriptions.sql --remote
```

### 2. Set Environment Variables
In Cloudflare Dashboard or `wrangler.toml`:
```toml
[vars]
RESEND_API_KEY = "re_your_key_here"
ADMIN_SECRET = "your-secure-admin-key"
```

### 3. Deploy Updated Worker
```bash
wrangler deploy
```

### 4. Test Flow
1. Visit `/register.html`
2. Fill out lead form
3. Select plan and options
4. Submit and receive 24-hour trial access
5. Verify email received (if invoice requested)
6. Test admin endpoints to verify payment
7. Wait for cron or trigger manually

---

## Testing Admin Endpoints

### Verify Payment
```bash
curl -X POST https://your-worker.workers.dev/api/admin/subscriptions/verify-payment \
  -H "Authorization: Bearer your-admin-secret" \
  -H "Content-Type: application/json" \
  -d '{"subscriptionId": "sub_1234567890"}'
```

### List Leads
```bash
curl https://your-worker.workers.dev/api/admin/leads \
  -H "Authorization: Bearer your-admin-secret"
```

---

## Security Considerations

1. **Admin Authentication**: Use strong `ADMIN_SECRET` in production
2. **Email Validation**: Prevents duplicate leads with same email
3. **Trial Limits**: 24-hour hard limit enforced
4. **Subscription Checks**: All CV operations require valid subscription
5. **Temporary Passwords**: Auto-generated, not exposed to user

---

## Future Enhancements

- [ ] Payment gateway integration (Stripe, PayPal, MercadoPago)
- [ ] PDF invoice generation
- [ ] Email notifications for trial expiration
- [ ] Lead status management dashboard
- [ ] Custom solution workflow
- [ ] Renewal reminders
- [ ] Usage analytics per subscription tier

---

## Support

For questions or issues with the lead generation flow:
- Review this documentation
- Check database migration status
- Verify environment variables are set
- Review worker logs in Cloudflare Dashboard
- Test with curl commands for admin endpoints
