import { optimizeWithAI, compareProviders, getAvailableProviders, AI_PROVIDERS } from './ai-providers.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Public CV routes (e.g., /cv/abc123xyz)
    if (path.startsWith('/cv/')) {
      return handlePublicCV(path, env, corsHeaders);
    }

    // API Routes
    if (path.startsWith('/api/')) {
      return handleAPI(request, env, corsHeaders);
    }

    // Static file serving
    return handleStatic(request, env, ctx, corsHeaders);
  },

  // Cron trigger for checking trial expirations
  async scheduled(event, env, ctx) {
    console.log('Running scheduled trial expiration check...');
    await checkAndExpireTrials(env);
  },
};

async function handleAPI(request, env, corsHeaders) {
  const url = new URL(request.url);
  const path = url.pathname;

  try {
    // Get available AI providers
    if (path === '/api/ai/providers' && request.method === 'GET') {
      const authHeader = request.headers.get('Authorization');
      if (!isAuthenticated(authHeader)) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const apiKeys = {
        blackbox: env.BLACKBOX_API_KEY,
      };

      const availableProviders = getAvailableProviders(apiKeys);

      return new Response(JSON.stringify({ 
        success: true,
        providers: availableProviders,
        allProviders: AI_PROVIDERS,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // AI optimization endpoint - single provider
    if (path === '/api/ai/optimize' && request.method === 'POST') {
      const authHeader = request.headers.get('Authorization');
      if (!isAuthenticated(authHeader)) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { prompt, cvData, provider, model } = await request.json();
      
      if (!prompt || !cvData) {
        return new Response(JSON.stringify({ 
          error: 'Prompt y datos del CV son requeridos' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        const apiKeys = {
          blackbox: env.BLACKBOX_API_KEY,
        };

        const result = await optimizeWithAI({
          model: model || 'blackboxai/openai/gpt-4o',
          prompt,
          cvData,
          apiKeys,
        });

        return new Response(JSON.stringify({ 
          success: true,
          ...result,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (aiError) {
        console.error('Error calling AI provider:', aiError);
        return new Response(JSON.stringify({ 
          error: 'Error al procesar la solicitud con IA',
          details: aiError.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // AI comparison endpoint - multiple providers
    if (path === '/api/ai/compare' && request.method === 'POST') {
      const authHeader = request.headers.get('Authorization');
      if (!isAuthenticated(authHeader)) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { prompt, cvData, models } = await request.json();
      
      if (!prompt || !cvData || !models || models.length === 0) {
        return new Response(JSON.stringify({ 
          error: 'Prompt, datos del CV y modelos son requeridos' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        const apiKeys = {
          blackbox: env.BLACKBOX_API_KEY,
        };

        const results = await compareProviders({
          models,
          prompt,
          cvData,
          apiKeys,
        });

        return new Response(JSON.stringify({ 
          success: true,
          results,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (aiError) {
        console.error('Error comparing AI providers:', aiError);
        return new Response(JSON.stringify({ 
          error: 'Error al comparar proveedores de IA',
          details: aiError.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Lead generation endpoint (replaces register)
    if (path === '/api/leads' && request.method === 'POST') {
      const { 
        fullName, 
        email, 
        phone, 
        company, 
        plan, 
        requiresInvoice,
        requiresCustomSolution,
        customSolutionDescription 
      } = await request.json();
      
      // Validations
      if (!fullName || !email || !plan) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Nombre completo, email y plan son requeridos' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Email inválido' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Validate plan
      const validPlans = ['basico', 'profesional', 'empresarial'];
      if (!validPlans.includes(plan)) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Plan inválido' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      try {
        // Check if email already exists as lead
        const { results: existingLeads } = await env.DB.prepare(
          'SELECT id FROM leads WHERE email = ?'
        ).bind(email).all();

        if (existingLeads.length > 0) {
          return new Response(JSON.stringify({ 
            success: false, 
            message: 'Ya existe una solicitud con este email' 
          }), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Create lead
        const leadId = 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const now = new Date().toISOString();
        
        await env.DB.prepare(
          `INSERT INTO leads (
            id, full_name, email, phone, company, plan_selected, 
            requires_invoice, requires_custom_solution, custom_solution_description, 
            status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          leadId, 
          fullName, 
          email, 
          phone || null, 
          company || null, 
          plan,
          requiresInvoice ? 1 : 0,
          requiresCustomSolution ? 1 : 0,
          customSolutionDescription || null,
          'pending',
          now
        ).run();

        // Create temporary user account for trial
        const userId = 'user_' + Date.now();
        const tempPassword = generateSlug(); // Generate temporary password
        const username = email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 5);
        
        await env.DB.prepare(
          'INSERT INTO users (id, username, password_hash, email, email_verified, trial_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(userId, username, tempPassword, email, 0, 1, now).run();

        // Create trial subscription
        const subscriptionId = 'sub_' + Date.now();
        const trialStart = new Date();
        const trialEnd = new Date(trialStart.getTime() + 24 * 60 * 60 * 1000); // 24 hours
        
        // Calculate pricing
        const planPrices = {
          basico: 700,
          profesional: 1000,
          empresarial: 1500
        };
        const basePrice = planPrices[plan];
        const ivaAmount = requiresInvoice ? basePrice * 0.16 : 0;
        const totalAmount = basePrice + ivaAmount;

        await env.DB.prepare(
          `INSERT INTO subscriptions (
            id, user_id, lead_id, plan, price, includes_iva, iva_amount, total_amount,
            status, trial_start, trial_end, payment_verified, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          subscriptionId,
          userId,
          leadId,
          plan,
          basePrice,
          requiresInvoice ? 1 : 0,
          ivaAmount,
          totalAmount,
          'trial',
          trialStart.toISOString(),
          trialEnd.toISOString(),
          0,
          now,
          now
        ).run();

        // Update user with subscription
        await env.DB.prepare(
          'UPDATE users SET subscription_id = ? WHERE id = ?'
        ).bind(subscriptionId, userId).run();

        // Generate invoice if required
        let invoiceData = null;
        if (requiresInvoice) {
          const invoiceId = 'inv_' + Date.now();
          const invoiceNumber = 'INV-' + Date.now();
          
          await env.DB.prepare(
            `INSERT INTO invoices (
              id, subscription_id, lead_id, invoice_number, subtotal, iva_amount, total,
              status, issued_at, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            invoiceId,
            subscriptionId,
            leadId,
            invoiceNumber,
            basePrice,
            ivaAmount,
            totalAmount,
            'pending',
            now,
            now
          ).run();

          invoiceData = {
            invoiceId,
            invoiceNumber,
            subtotal: basePrice,
            iva: ivaAmount,
            total: totalAmount
          };

          // Send invoice via Resend
          if (env.RESEND_API_KEY) {
            try {
              await sendInvoiceEmail(env, email, fullName, invoiceData, plan);
            } catch (emailError) {
              console.error('Error sending invoice email:', emailError);
            }
          }
        }

        // Generate session token
        const token = btoa(`${userId}:${username}:${Date.now()}`);
        
        return new Response(JSON.stringify({ 
          success: true, 
          token,
          userId,
          username,
          leadId,
          subscriptionId,
          trialEnd: trialEnd.toISOString(),
          invoice: invoiceData,
          message: 'Lead creado exitosamente. Nuestro equipo de ventas se comunicará pronto contigo.'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Lead creation error:', error);
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Error al procesar la solicitud' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Login endpoint
    if (path === '/api/login' && request.method === 'POST') {
      const { username, password } = await request.json();
      
      try {
        // Query user from database
        const { results } = await env.DB.prepare(
          'SELECT * FROM users WHERE username = ?'
        ).bind(username).all();

        if (results.length === 0) {
          return new Response(JSON.stringify({ success: false, message: 'Credenciales inválidas' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const user = results[0];
        
        // Simple password check (in production use bcrypt)
        const isValidPassword = password === user.password_hash;
        
        if (isValidPassword) {
          // Generate session token with user_id
          const token = btoa(`${user.id}:${username}:${Date.now()}`);
          return new Response(JSON.stringify({ 
            success: true, 
            token,
            userId: user.id,
            username: user.username
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        return new Response(JSON.stringify({ success: false, message: 'Credenciales inválidas' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Login error:', error);
        return new Response(JSON.stringify({ success: false, message: 'Error en el servidor' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Admin endpoint to mark subscription as paid
    if (path === '/api/admin/subscriptions/verify-payment' && request.method === 'POST') {
      const authHeader = request.headers.get('Authorization');
      
      // Simple admin check (in production use proper admin authentication)
      if (!authHeader || authHeader !== `Bearer ${env.ADMIN_SECRET || 'admin-secret-key'}`) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { subscriptionId } = await request.json();
      
      if (!subscriptionId) {
        return new Response(JSON.stringify({ error: 'subscriptionId es requerido' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        const now = new Date().toISOString();
        
        // Mark payment as verified
        await env.DB.prepare(
          'UPDATE subscriptions SET payment_verified = ?, payment_verified_at = ?, updated_at = ? WHERE id = ?'
        ).bind(1, now, now, subscriptionId).run();

        // Get subscription details
        const { results } = await env.DB.prepare(
          'SELECT * FROM subscriptions WHERE id = ?'
        ).bind(subscriptionId).all();

        if (results.length === 0) {
          return new Response(JSON.stringify({ error: 'Suscripción no encontrada' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const subscription = results[0];

        return new Response(JSON.stringify({ 
          success: true,
          message: 'Pago verificado exitosamente',
          subscription
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Error verifying payment:', error);
        return new Response(JSON.stringify({ error: 'Error al verificar pago' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Admin endpoint to list all leads
    if (path === '/api/admin/leads' && request.method === 'GET') {
      const authHeader = request.headers.get('Authorization');
      
      if (!authHeader || authHeader !== `Bearer ${env.ADMIN_SECRET || 'admin-secret-key'}`) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        const { results } = await env.DB.prepare(
          'SELECT * FROM leads ORDER BY created_at DESC'
        ).all();

        return new Response(JSON.stringify({ success: true, leads: results }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Error fetching leads:', error);
        return new Response(JSON.stringify({ error: 'Error al obtener leads' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Get all CVs
    if (path === '/api/cvs' && request.method === 'GET') {
      const authHeader = request.headers.get('Authorization');
      const userId = getUserIdFromAuth(authHeader);
      if (!userId) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check subscription status
      const subscriptionStatus = await checkSubscriptionStatus(env, userId);
      if (!subscriptionStatus.allowed) {
        return new Response(JSON.stringify({ 
          error: 'Acceso denegado',
          message: subscriptionStatus.message,
          trialExpired: true
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { results } = await env.DB.prepare(
        'SELECT * FROM cvs WHERE user_id = ? ORDER BY updated_at DESC'
      ).bind(userId).all();
      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create CV
    if (path === '/api/cvs' && request.method === 'POST') {
      const authHeader = request.headers.get('Authorization');
      const userId = getUserIdFromAuth(authHeader);
      if (!userId) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check subscription status
      const subscriptionStatus = await checkSubscriptionStatus(env, userId);
      if (!subscriptionStatus.allowed) {
        return new Response(JSON.stringify({ 
          error: 'Acceso denegado',
          message: subscriptionStatus.message,
          trialExpired: true
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { id, name, data } = await request.json();
      const now = new Date().toISOString();
      const slug = generateSlug();
      
      await env.DB.prepare(
        'INSERT INTO cvs (id, user_id, name, data, slug, is_public, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(id, userId, name, JSON.stringify(data), slug, 0, now, now).run();

      return new Response(JSON.stringify({ success: true, id, slug }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update CV
    if (path.match(/^\/api\/cvs\/[^/]+$/) && request.method === 'PUT') {
      const authHeader = request.headers.get('Authorization');
      const userId = getUserIdFromAuth(authHeader);
      if (!userId) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const id = path.split('/').pop();
      const { name, data, is_public } = await request.json();
      const now = new Date().toISOString();
      
      // Verify CV belongs to user
      const { results } = await env.DB.prepare(
        'SELECT id FROM cvs WHERE id = ? AND user_id = ?'
      ).bind(id, userId).all();

      if (results.length === 0) {
        return new Response(JSON.stringify({ error: 'CV no encontrado o no autorizado' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      await env.DB.prepare(
        'UPDATE cvs SET name = ?, data = ?, is_public = ?, updated_at = ? WHERE id = ? AND user_id = ?'
      ).bind(name, JSON.stringify(data), is_public !== undefined ? (is_public ? 1 : 0) : 0, now, id, userId).run();

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Delete CV
    if (path.match(/^\/api\/cvs\/[^/]+$/) && request.method === 'DELETE') {
      const authHeader = request.headers.get('Authorization');
      const userId = getUserIdFromAuth(authHeader);
      if (!userId) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const id = path.split('/').pop();
      await env.DB.prepare(
        'DELETE FROM cvs WHERE id = ? AND user_id = ?'
      ).bind(id, userId).run();

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get CV by slug (for copying link)
    if (path.match(/^\/api\/cv-by-slug\/[^/]+$/) && request.method === 'GET') {
      const authHeader = request.headers.get('Authorization');
      if (!isAuthenticated(authHeader)) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const slug = path.split('/').pop();
      const { results } = await env.DB.prepare('SELECT * FROM cvs WHERE slug = ?').bind(slug).all();
      
      if (results.length > 0) {
        return new Response(JSON.stringify(results[0]), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'CV no encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Email verification endpoint
    if (path.match(/^\/api\/verify-email\/[^/]+$/) && request.method === 'GET') {
      const token = path.split('/').pop();
      
      try {
        const { results } = await env.DB.prepare(
          'SELECT id FROM users WHERE email_verification_token = ?'
        ).bind(token).all();

        if (results.length === 0) {
          return new Response(JSON.stringify({ success: false, message: 'Token inválido o expirado' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        await env.DB.prepare(
          'UPDATE users SET email_verified = 1, email_verification_token = NULL WHERE email_verification_token = ?'
        ).bind(token).run();

        return new Response(JSON.stringify({ success: true, message: 'Email verificado exitosamente' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Email verification error:', error);
        return new Response(JSON.stringify({ success: false, message: 'Error al verificar email' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

function generateSlug() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  for (let i = 0; i < 12; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

async function sendVerificationEmail(env, email, token, username) {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    console.log('SMTP not configured, skipping email verification');
    return;
  }

  const verificationUrl = `${env.APP_URL || 'http://localhost:8787'}/api/verify-email/${token}`;
  
  const emailContent = `Hola ${username},\n\nGracias por registrarte en CV Manager.\n\nPor favor verifica tu correo electrónico haciendo clic en el siguiente enlace:\n${verificationUrl}\n\nSi no solicitaste esta cuenta, puedes ignorar este mensaje.\n\nSaludos,\nEquipo CV Manager`;

  try {
    const response = await fetch(`https://${env.SMTP_HOST}:${env.SMTP_PORT || 587}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${env.SMTP_USER}:${env.SMTP_PASS}`)}`
      },
      body: JSON.stringify({
        from: env.SMTP_FROM || env.SMTP_USER,
        to: email,
        subject: 'Verifica tu correo - CV Manager',
        text: emailContent
      })
    });

    if (!response.ok) {
      throw new Error(`SMTP error: ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw error;
  }
}

function isAuthenticated(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  // Simple token validation
  const token = authHeader.substring(7);
  try {
    const decoded = atob(token);
    return decoded.includes(':');
  } catch {
    return false;
  }
}

function getUserIdFromAuth(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const decoded = atob(token);
    const parts = decoded.split(':');
    return parts[0]; // user_id is first part
  } catch {
    return null;
  }
}

async function checkSubscriptionStatus(env, userId) {
  try {
    const { results: subscriptions } = await env.DB.prepare(
      'SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(userId).all();

    if (subscriptions.length === 0) {
      return { allowed: false, message: 'No se encontró una suscripción activa' };
    }

    const subscription = subscriptions[0];
    const now = new Date();

    // Check trial status
    if (subscription.status === 'trial') {
      const trialEnd = new Date(subscription.trial_end);
      
      if (now > trialEnd) {
        // Trial expired, check payment
        if (subscription.payment_verified === 0) {
          return { 
            allowed: false, 
            message: 'Tu período de prueba ha expirado. Por favor, contacta a nuestro equipo de ventas para activar tu suscripción.' 
          };
        } else {
          // Payment verified, activate subscription
          const subscriptionEnd = new Date(now);
          subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1); // 1 year subscription
          
          await env.DB.prepare(
            'UPDATE subscriptions SET status = ?, subscription_start = ?, subscription_end = ?, updated_at = ? WHERE id = ?'
          ).bind('active', now.toISOString(), subscriptionEnd.toISOString(), now.toISOString(), subscription.id).run();

          await env.DB.prepare(
            'UPDATE users SET trial_active = ? WHERE id = ?'
          ).bind(0, userId).run();
          
          return { allowed: true, status: 'active' };
        }
      }
      
      // Trial still active
      return { allowed: true, status: 'trial', trialEnd: subscription.trial_end };
    }

    // Check active subscription
    if (subscription.status === 'active') {
      const subscriptionEnd = new Date(subscription.subscription_end);
      
      if (now > subscriptionEnd) {
        await env.DB.prepare(
          'UPDATE subscriptions SET status = ?, updated_at = ? WHERE id = ?'
        ).bind('expired', now.toISOString(), subscription.id).run();
        
        return { 
          allowed: false, 
          message: 'Tu suscripción ha expirado. Por favor, renueva tu plan.' 
        };
      }
      
      return { allowed: true, status: 'active', subscriptionEnd: subscription.subscription_end };
    }

    // Expired or cancelled
    return { 
      allowed: false, 
      message: 'Tu suscripción no está activa. Por favor, contacta a nuestro equipo de ventas.' 
    };

  } catch (error) {
    console.error('Error checking subscription status:', error);
    return { allowed: false, message: 'Error al verificar suscripción' };
  }
}

async function sendInvoiceEmail(env, email, fullName, invoiceData, plan) {
  if (!env.RESEND_API_KEY) {
    console.log('Resend API key not configured');
    return;
  }

  const planNames = {
    basico: 'Plan Básico',
    profesional: 'Plan Profesional',
    empresarial: 'Plan Empresarial'
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .invoice-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #eee; }
        .row.total { font-weight: bold; font-size: 1.2em; border-bottom: none; border-top: 2px solid #333; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Factura de Suscripción</h1>
          <p>CV Manager - Sistema Profesional de Currículums</p>
        </div>
        <div class="content">
          <p>Estimado/a ${fullName},</p>
          <p>Gracias por tu interés en nuestro servicio. A continuación encontrarás los detalles de tu factura:</p>
          
          <div class="invoice-details">
            <h3>Factura: ${invoiceData.invoiceNumber}</h3>
            <div class="row">
              <span>Plan seleccionado:</span>
              <span>${planNames[plan]}</span>
            </div>
            <div class="row">
              <span>Subtotal:</span>
              <span>$${invoiceData.subtotal.toFixed(2)} MXN</span>
            </div>
            ${invoiceData.iva > 0 ? `
            <div class="row">
              <span>IVA (16%):</span>
              <span>$${invoiceData.iva.toFixed(2)} MXN</span>
            </div>
            ` : ''}
            <div class="row total">
              <span>Total:</span>
              <span>$${invoiceData.total.toFixed(2)} MXN</span>
            </div>
          </div>

          <p><strong>Próximos pasos:</strong></p>
          <ul>
            <li>Nuestro equipo de ventas se comunicará contigo en las próximas 24 horas</li>
            <li>Tienes acceso de prueba por 24 horas para explorar todas las funcionalidades</li>
            <li>Una vez confirmado el pago, tu cuenta será activada por 1 año completo</li>
          </ul>

          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>

          <div class="footer">
            <p>CV Manager - Gestión Profesional de Currículums</p>
            <p>Este es un correo automático, por favor no responder.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'CV Manager <noreply@cvmanager.com>',
        to: email,
        subject: `Factura ${invoiceData.invoiceNumber} - CV Manager`,
        html: htmlContent
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    console.log('Invoice email sent successfully:', result);

    // Update invoice status
    const now = new Date().toISOString();
    await env.DB.prepare(
      'UPDATE invoices SET status = ?, sent_at = ? WHERE id = ?'
    ).bind('sent', now, invoiceData.invoiceId).run();

    return result;
  } catch (error) {
    console.error('Failed to send invoice email:', error);
    throw error;
  }
}

async function checkAndExpireTrials(env) {
  try {
    const now = new Date();
    
    // Get all trial subscriptions that have expired
    const { results: expiredTrials } = await env.DB.prepare(
      'SELECT * FROM subscriptions WHERE status = ? AND trial_end < ?'
    ).bind('trial', now.toISOString()).all();

    console.log(`Found ${expiredTrials.length} expired trials to process`);

    for (const subscription of expiredTrials) {
      // Check if payment was verified
      if (subscription.payment_verified === 0) {
        // Mark subscription as expired
        await env.DB.prepare(
          'UPDATE subscriptions SET status = ?, updated_at = ? WHERE id = ?'
        ).bind('expired', now.toISOString(), subscription.id).run();

        // Disable trial for user
        await env.DB.prepare(
          'UPDATE users SET trial_active = ? WHERE id = ?'
        ).bind(0, subscription.user_id).run();

        console.log(`Expired trial for subscription ${subscription.id}`);
      } else {
        // Payment was verified, activate subscription
        const subscriptionEnd = new Date(now);
        subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
        
        await env.DB.prepare(
          'UPDATE subscriptions SET status = ?, subscription_start = ?, subscription_end = ?, updated_at = ? WHERE id = ?'
        ).bind('active', now.toISOString(), subscriptionEnd.toISOString(), now.toISOString(), subscription.id).run();

        await env.DB.prepare(
          'UPDATE users SET trial_active = ? WHERE id = ?'
        ).bind(0, subscription.user_id).run();

        console.log(`Activated subscription ${subscription.id} after trial`);
      }
    }

    return { processed: expiredTrials.length };
  } catch (error) {
    console.error('Error checking trial expirations:', error);
    throw error;
  }
}

async function handlePublicCV(path, env, corsHeaders) {
  const slug = path.replace('/cv/', '');
  
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM cvs WHERE slug = ? AND is_public = 1'
    ).bind(slug).all();

    if (results.length === 0) {
      return new Response('CV no encontrado o no público', {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      });
    }

    const cv = results[0];
    const cvData = JSON.parse(cv.data);
    
    return new Response(generateCVHTML(cvData), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    return new Response('Error al cargar CV', {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/html' },
    });
  }
}

function generateCVHTML(cvData) {
  const skills = cvData.skills ? cvData.skills.split(',').map(s => `<span class="chip">${s.trim()}</span>`).join('') : '';
  const tools = cvData.tools ? cvData.tools.split(',').map(t => `<span class="tag">${t.trim()}</span>`).join('') : '';
  const profileImage = cvData.profileImage || '';
  
  let experiencesHTML = '';
  if (cvData.experiences && cvData.experiences.length > 0) {
    experiencesHTML = cvData.experiences.map(exp => {
      const responsibilities = exp.responsibilities.split('\n').filter(r => r.trim()).map(r => `<li>${r.trim()}</li>`).join('');
      return `
        <article class="experience-item">
          <div class="experience-header">
            <div>
              <div class="experience-role">${exp.role}</div>
              <div class="experience-company">${exp.company}</div>
            </div>
            <div class="experience-dates">${exp.dates}</div>
          </div>
          <ul class="bullet-list">
            ${responsibilities}
          </ul>
        </article>
      `;
    }).join('');
  }

  let educationHTML = '';
  if (cvData.education && cvData.education.length > 0) {
    educationHTML = cvData.education.map(edu => {
      return `
        <article class="experience-item">
          <div class="experience-header">
            <div>
              <div class="experience-role">${edu.degree}</div>
              <div class="experience-company">${edu.institution}</div>
            </div>
            <div class="experience-dates">${edu.dates}</div>
          </div>
        </article>
      `;
    }).join('');
  }

  return `<!DOCTYPE html>
<html lang="es" data-color-scheme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="${cvData.name} - ${cvData.role}" />
  <meta name="robots" content="index, follow" />
  <meta property="og:type" content="profile" />
  <meta property="og:title" content="${cvData.name} - ${cvData.role}" />
  <meta property="og:description" content="${cvData.summary}" />
  <title>${cvData.name} - CV Profesional</title>
  <style>
    :root {
      --color-cream-50: rgba(252, 252, 249, 1);
      --color-slate-900: rgba(19, 52, 59, 1);
      --color-slate-500: rgba(98, 108, 113, 1);
      --color-teal-500: rgba(33, 128, 141, 1);
      --font-family-base: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --font-size-xs: 11px;
      --font-size-sm: 12px;
      --font-size-md: 14px;
      --font-size-lg: 16px;
      --font-size-xl: 18px;
      --space-4: 4px;
      --space-6: 6px;
      --space-8: 8px;
      --space-12: 12px;
      --space-16: 16px;
      --space-20: 20px;
      --space-24: 24px;
      --radius-lg: 12px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html {
      font-size: var(--font-size-md);
      font-family: var(--font-family-base);
      line-height: 1.5;
      color: var(--color-slate-900);
      background: radial-gradient(circle at top, #f0f0f0 0, #d9d9d9 40%, #bfbfbf 100%);
      -webkit-font-smoothing: antialiased;
    }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-24);
    }
    .container {
      width: 100%;
      max-width: 960px;
    }
    .cv-wrapper {
      display: grid;
      grid-template-columns: 1.1fr 1.7fr;
      gap: var(--space-24);
      background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 40%, #f7f7f7 100%);
      border-radius: var(--radius-lg);
      border: 1px solid rgba(120, 120, 120, 0.3);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04);
      overflow: hidden;
    }
    .cv-sidebar {
      padding: var(--space-20);
      background: linear-gradient(180deg, #f0f0f0 0%, #d8d8d8 50%, #cfcfcf 100%);
      border-right: 1px solid rgba(120, 120, 120, 0.25);
    }
    .profile-image {
      width: 120px;
      height: 120px;
      border-radius: 8px;
      object-fit: cover;
      margin-bottom: var(--space-16);
      border: 2px solid rgba(120, 120, 120, 0.3);
    }
    .cv-main {
      padding: var(--space-20) var(--space-24);
      background: radial-gradient(circle at top left, #f5f5f5 0, #e3e3e3 45%, #f7f7f7 100%);
    }
    .name {
      font-size: var(--font-size-lg);
      font-weight: 600;
      margin-bottom: var(--space-4);
    }
    .role {
      font-size: var(--font-size-sm);
      color: var(--color-slate-500);
      margin-bottom: var(--space-16);
    }
    .section-title {
      font-size: var(--font-size-sm);
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--color-slate-500);
      margin-bottom: var(--space-8);
    }
    .divider {
      height: 1px;
      width: 100%;
      background: linear-gradient(to right, rgba(120, 120, 120, 0.4), rgba(120, 120, 120, 0.1));
      margin: var(--space-12) 0 var(--space-16);
    }
    .contact-item {
      font-size: var(--font-size-sm);
      margin-bottom: var(--space-6);
      color: var(--color-slate-500);
    }
    .tag, .chip {
      padding: 3px 8px;
      border-radius: 999px;
      border: 1px solid rgba(120, 120, 120, 0.35);
      font-size: var(--font-size-xs);
      color: var(--color-slate-500);
      background: linear-gradient(135deg, #f9f9f9 0%, #e9e9e9 100%);
      display: inline-block;
      margin: 0 var(--space-4) var(--space-4) 0;
    }
    .summary {
      font-size: var(--font-size-sm);
      color: var(--color-slate-500);
    }
    .experience-item {
      margin-bottom: var(--space-16);
    }
    .experience-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: var(--space-8);
      margin-bottom: var(--space-4);
    }
    .experience-role {
      font-weight: 550;
      font-size: var(--font-size-md);
    }
    .experience-company {
      font-size: var(--font-size-sm);
      color: var(--color-slate-500);
    }
    .experience-dates {
      font-size: var(--font-size-xs);
      color: var(--color-slate-500);
      white-space: nowrap;
    }
    .bullet-list {
      list-style: none;
      padding-left: 0;
    }
    .bullet-list li {
      position: relative;
      padding-left: 16px;
      margin-bottom: 4px;
      font-size: var(--font-size-sm);
      color: var(--color-slate-500);
    }
    .bullet-list li::before {
      content: "";
      position: absolute;
      left: 4px;
      top: 7px;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: rgba(120, 120, 120, 0.85);
    }
    @media print {
      html { background: white !important; }
      body { background: white !important; align-items: flex-start; padding: 0; }
      .container { max-width: 100%; }
      .cv-wrapper { box-shadow: none !important; border: none !important; border-radius: 0 !important; background: white !important; }
      .cv-sidebar { background: white !important; border-right: 1px solid #e0e0e0 !important; }
      .cv-main { background: white !important; }
      .tag, .chip { background: white !important; border: 1px solid #e0e0e0 !important; }
    }
    @media (max-width: 768px) {
      body { align-items: flex-start; }
      .cv-wrapper { grid-template-columns: 1fr; }
      .cv-sidebar { border-right: none; border-bottom: 1px solid #e0e0e0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <article class="cv-wrapper">
      <aside class="cv-sidebar">
        <header>
          <h1 class="name">${cvData.name || ''}</h1>
          <h2 class="role">${cvData.role || ''}</h2>
          <p class="contact-item">${cvData.location || ''}</p>
          <p class="contact-item">Tel: ${cvData.phone || ''}</p>
          <p class="contact-item">Correo: ${cvData.email || ''}</p>
          <p class="contact-item">LinkedIn: ${cvData.linkedin || ''}</p>
        </header>
        <div class="divider"></div>
        <section>
          <h2 class="section-title">Perfil profesional</h2>
          <p class="summary">${cvData.summary || ''}</p>
        </section>
        <div class="divider"></div>
        <section>
          <h2 class="section-title">Competencias clave</h2>
          <div>${skills}</div>
        </section>
        <div class="divider"></div>
        <section>
          <h2 class="section-title">Herramientas</h2>
          <div>${tools}</div>
        </section>
      </aside>
      <main class="cv-main">
        ${profileImage ? `<img src="${profileImage}" alt="Foto de perfil" class="profile-image" style="float: right; margin-left: 20px;" />` : ''}
        <section>
          <h2 class="section-title">Experiencia profesional</h2>
          ${experiencesHTML}
        </section>
        ${educationHTML ? `
        <section style="margin-top: var(--space-20);">
          <h2 class="section-title">Educación</h2>
          ${educationHTML}
        </section>` : ''}
      </main>
    </article>
  </div>
</body>
</html>`;
}

async function handleStatic(request, env, ctx, corsHeaders) {
  try {
    const url = new URL(request.url);
    let pathname = url.pathname;
    
    // Default to login.html for root path
    if (pathname === '/' || pathname === '') {
      pathname = '/login.html';
    }

    // Create a new request with the modified pathname for Pages
    const pagesUrl = new URL(pathname, url.origin);
    const assetRequest = new Request(pagesUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'manual'
    });
    
    // Proxy to Cloudflare Pages project (ChispartCV)
    const asset = await env.ASSETS.fetch(assetRequest);
    
    if (asset.status === 404) {
      return new Response('Not Found', { status: 404, headers: corsHeaders });
    }

    // Clone response and add CORS headers
    const response = new Response(asset.body, asset);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (e) {
    console.error('Static asset error:', e);
    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }
}
