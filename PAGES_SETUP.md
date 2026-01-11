# Cloudflare Pages Setup for ChispartCV

## Overview
The Worker now proxies static assets to a Cloudflare Pages project named **ChispartCV**.

## Configuration

### 1. Create Cloudflare Pages Project

#### Option A: Via Cloudflare Dashboard
1. Go to Cloudflare Dashboard → Pages
2. Create a new project named `ChispartCV`
3. Connect your Git repository or upload files
4. Build settings:
   - **Build command**: (empty if static HTML)
   - **Build output directory**: `public`
5. Deploy the project

#### Option B: Via Wrangler CLI
```bash
# Deploy the public directory to Pages
npx wrangler pages deploy public --project-name=ChispartCV
```

### 2. Service Binding in Worker

The `wrangler.toml` has been updated with a service binding:

```toml
[[services]]
binding = "ASSETS"
service = "ChispartCV"
```

This creates a binding named `ASSETS` that points to the Pages project `ChispartCV`.

### 3. Worker Proxy Logic

The Worker now:
1. Receives requests for static files
2. Proxies them to the Pages project via service binding
3. Returns the response with CORS headers

**Code in `src/index.js`:**
```javascript
async function handleStatic(request, env, ctx, corsHeaders) {
  // ... pathname handling ...
  
  // Proxy to Cloudflare Pages project (ChispartCV)
  const asset = await env.ASSETS.fetch(assetRequest);
  
  // Add CORS headers and return
  return response;
}
```

## Deployment Steps

### Step 1: Deploy Pages Project
```bash
# From project root
npx wrangler pages deploy public --project-name=ChispartCV
```

This uploads all files from the `public/` directory to Pages.

### Step 2: Deploy Worker
```bash
npm run deploy
```

The Worker will now proxy to the Pages project.

## Directory Structure

```
CVRafael/
├── public/              # Static files for Pages
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── editor.html
│   ├── preview.html
│   └── Rafael_Mora.jpeg
├── src/
│   └── index.js         # Worker with proxy logic
└── wrangler.toml        # Worker config with service binding
```

## Benefits of Pages Proxy

1. **Separation of Concerns**: Static assets on Pages, API on Workers
2. **Better Performance**: Pages optimized for static content delivery
3. **Easier Updates**: Deploy static files independently
4. **CDN Benefits**: Pages automatically distributed globally
5. **Version Control**: Pages supports Git-based deployments

## Local Development

For local development, you have two options:

### Option A: Continue Using Local Assets Binding
For development, you can temporarily switch back to local assets:

```toml
# wrangler.toml (dev only)
assets = { directory = "./public", binding = "ASSETS" }
```

Then run:
```bash
npm run dev
```

### Option B: Run Both Locally
1. Run Pages dev server:
```bash
npx wrangler pages dev public --port=8788
```

2. Run Worker dev server (in another terminal):
```bash
npm run dev
```

The Worker will proxy to the local Pages server.

## Production URLs

After deployment:
- **Worker**: `https://cv-rafael.your-subdomain.workers.dev`
- **Pages**: `https://chispartcv.pages.dev` (auto-generated)

All traffic should go through the Worker URL, which proxies to Pages.

## Updating Static Files

To update the frontend:

```bash
# Deploy updated files to Pages
npx wrangler pages deploy public --project-name=ChispartCV

# No need to redeploy Worker unless API changes
```

## Environment-Specific Config

### Development (`wrangler.toml` for dev)
```toml
[env.dev]
assets = { directory = "./public", binding = "ASSETS" }
```

### Production (`wrangler.toml` for prod)
```toml
[[services]]
binding = "ASSETS"
service = "ChispartCV"
```

## Troubleshooting

### Issue: "Service not found: ChispartCV"
**Solution**: Deploy the Pages project first:
```bash
npx wrangler pages deploy public --project-name=ChispartCV
```

### Issue: 404 errors on static files
**Solution**: Verify Pages project name matches exactly:
```bash
npx wrangler pages list
```

### Issue: CORS errors
**Solution**: Ensure `handleStatic()` adds CORS headers to proxied responses.

## Custom Domain (Optional)

1. Add custom domain to Pages project in Dashboard
2. Update Worker routes to match your domain
3. Both Worker and Pages can share the same domain with different paths

## Monitoring

- **Worker logs**: `wrangler tail`
- **Pages deployment**: Cloudflare Dashboard → Pages → ChispartCV
- **Analytics**: Available in Dashboard for both Worker and Pages

## Rollback

If you need to rollback to local assets:

1. Edit `wrangler.toml`:
```toml
# Remove service binding
# [[services]]
# binding = "ASSETS"
# service = "ChispartCV"

# Add back local assets
assets = { directory = "./public", binding = "ASSETS" }
```

2. Redeploy Worker:
```bash
npm run deploy
```
