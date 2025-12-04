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
};

async function handleAPI(request, env, corsHeaders) {
  const url = new URL(request.url);
  const path = url.pathname;

  try {
    // AI Assistant endpoint
    if (path === '/api/ai/optimize' && request.method === 'POST') {
      const authHeader = request.headers.get('Authorization');
      if (!isAuthenticated(authHeader)) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { prompt, cvData } = await request.json();
      
      try {
        const aiResponse = await fetch('https://api.blackbox.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.BLACKBOX_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'blackboxai/openai/gpt-4o',
            messages: [
              {
                role: 'system',
                content: 'Eres un experto en recursos humanos y redacción de CVs profesionales. Ayudas a optimizar CVs para que sean más efectivos y atractivos para reclutadores. Responde en español de forma clara y concisa.'
              },
              {
                role: 'user',
                content: `${prompt}\n\nDatos del CV actual:\n${JSON.stringify(cvData, null, 2)}`
              }
            ],
            temperature: 0.7,
            max_tokens: 2000,
            stream: false
          }),
        });

        if (!aiResponse.ok) {
          throw new Error(`Error de Blackbox AI: ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        return new Response(JSON.stringify({ 
          success: true, 
          suggestion: aiData.choices[0].message.content 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (aiError) {
        console.error('Error calling Blackbox AI:', aiError);
        return new Response(JSON.stringify({ 
          error: 'Error al procesar la solicitud con IA',
          details: aiError.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Register endpoint
    if (path === '/api/register' && request.method === 'POST') {
      const { username, password, email } = await request.json();
      
      // Validations
      if (!username || !password) {
        return new Response(JSON.stringify({ success: false, message: 'Usuario y contraseña son requeridos' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (username.length < 3) {
        return new Response(JSON.stringify({ success: false, message: 'El usuario debe tener al menos 3 caracteres' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (password.length < 6) {
        return new Response(JSON.stringify({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      try {
        // Check if username already exists
        const { results: existingUsers } = await env.DB.prepare(
          'SELECT id FROM users WHERE username = ?'
        ).bind(username).all();

        if (existingUsers.length > 0) {
          return new Response(JSON.stringify({ success: false, message: 'El usuario ya existe' }), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Create new user
        const userId = 'user_' + Date.now();
        const now = new Date().toISOString();
        const emailVerificationToken = email ? generateSlug() : null;
        
        // Simple password storage (in production, use proper hashing)
        await env.DB.prepare(
          'INSERT INTO users (id, username, password_hash, email, email_verified, email_verification_token, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(userId, username, password, email || null, 0, emailVerificationToken, now).run();

        // Send verification email if email provided
        if (email && env.SMTP_HOST) {
          try {
            await sendVerificationEmail(env, email, emailVerificationToken, username);
          } catch (emailError) {
            console.error('Error sending verification email:', emailError);
            // Continue registration even if email fails
          }
        }

        // Generate session token
        const token = btoa(`${userId}:${username}:${Date.now()}`);
        
        return new Response(JSON.stringify({ 
          success: true, 
          token,
          userId: userId,
          username: username,
          emailSent: email && env.SMTP_HOST ? true : false,
          message: 'Usuario creado exitosamente'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Register error:', error);
        return new Response(JSON.stringify({ success: false, message: 'Error al crear usuario' }), {
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

    // Create a new request with the modified pathname
    const assetRequest = new Request(new URL(pathname, url.origin), request);
    
    // Try to get the asset using the ASSETS binding
    const asset = await env.ASSETS.fetch(assetRequest);
    
    if (asset.status === 404) {
      return new Response('Not Found', { status: 404, headers: corsHeaders });
    }

    return asset;
  } catch (e) {
    console.error('Static asset error:', e);
    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }
}
