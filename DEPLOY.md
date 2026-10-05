# Deployment Guide - Global Price Comparison Engine

## BEFORE YOU DEPLOY - CRITICAL SECURITY STEPS

### 1. Never Upload .env
The `.env` file contains your real passwords and API keys.
**Delete it before uploading anywhere.**

### 2. Set Environment Variables on Your Hosting Platform
On Railway, Render, Heroku, or any host, set these environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | YES | Your MongoDB Atlas connection string |
| `JWT_SECRET` | YES | Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `SERPAPI_KEY` | YES | Your SerpAPI key from https://serpapi.com |
| `PORT` | NO | Defaults to 3000 |
| `NODE_ENV` | NO | Set to `production` |

### 3. Generate a Secure JWT Secret
Run this in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output and set it as `JWT_SECRET`.

### 4. Deployment Platforms

#### Railway (Recommended - Free)
1. Go to https://railway.app
2. Create new project → Deploy from GitHub
3. Add environment variables in the dashboard
4. Deploy

#### Render (Free)
1. Go to https://render.com
2. New Web Service → Connect your repo
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add environment variables

#### Heroku
1. `heroku create your-app-name`
2. `heroku config:set MONGODB_URI=your_uri JWT_SECRET=your_secret SERPAPI_KEY=your_key`
3. `git push heroku main`

### 5. MongoDB Atlas IP Whitelist
If your database connection fails after deploy:
1. Go to MongoDB Atlas → Network Access
2. Click "Add IP Address"
3. Choose "Allow Access from Anywhere" (0.0.0.0/0) for testing
4. Or add your hosting platform's IP range

### 6. Test Before Going Live
After deploy, visit:
- `https://your-app.com/api/health` → Should show "ok"
- Search for "iphone" → Should return real products

---

## Security Features Already Applied
- Helmet security headers
- Rate limiting (100 requests per 15 min)
- Auth endpoint rate limiting (10 per 15 min)
- Input sanitization (removes < > characters)
- Query length limits (200 chars max)
- XSS protection via CSP
- No sensitive data in code
