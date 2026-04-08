# 🚀 LexAgent Deployment Guide

> Deploy your LexAgent application as a live, publicly accessible website in ~10 minutes.

---

## Architecture Overview

| Part | Platform | URL Type | Cost |
|------|----------|----------|------|
| Frontend (React/Vite) | **Vercel** | `your-app.vercel.app` | Free |
| Backend (FastAPI) | **Render** | `your-api.onrender.com` | Free |

---

## What's Already Prepared For You ✅

These files have already been created/updated in your project:

- `server/requirements.txt` — Python dependencies for Render
- `server/Procfile` — Start command for Render
- `server/startup.py` — Auto-seeds the database on first boot
- `vercel.json` — SPA routing config for Vercel
- `src/api.js` — Updated to read `VITE_API_URL` env var
- `server/main.py` — Updated CORS and auto-seed lifespan event
- `dist/` folder — Production build is already compiled

---

## STEP 1 — Push to GitHub

Both Vercel and Render need your code on GitHub.

Open a terminal and run:

```bash
cd /Users/mdsairinsaidat/Desktop/hackethon
git init
git add .
git commit -m "feat: LexAgent production ready"
```

Then create a repo at github.com/new and run:
```bash
git remote add origin https://github.com/YOUR_USERNAME/lexagent.git
git branch -M main
git push -u origin main
```

---

## STEP 2 — Deploy Backend on Render

1. Go to **render.com** → Sign up/Login
2. Click **New → Web Service**
3. Connect GitHub → Select your `lexagent` repo
4. Fill in settings:

| Setting | Value |
|---------|-------|
| **Name** | `lexagent-api` |
| **Root Directory** | `server` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `python startup.py && uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | `Free` |

5. Under **Environment Variables**, add:

| Key | Value |
|-----|-------|
| `SECRET_KEY` | any random string, e.g. `lexagent-super-secret-2024` |
| `OPENAI_API_KEY` | (optional) adds real AI responses |

6. Click **Create Web Service** — wait ~3 min.

Test: visit `https://lexagent-api.onrender.com/` → should show `{"status":"LexAgent backend running"}`

---

## STEP 3 — Deploy Frontend on Vercel

### Option A: Vercel Dashboard (easiest)

1. Go to **vercel.com** → Sign up/Login
2. Click **Add New Project → Import Git Repository**
3. Select your `lexagent` repo
4. Settings:

| Setting | Value |
|---------|-------|
| **Framework Preset** | `Vite` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

5. Add **Environment Variable** BEFORE deploying:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://lexagent-api.onrender.com` |

6. Click **Deploy** — wait ~1 min.

### Option B: Vercel CLI

```bash
cd /Users/mdsairinsaidat/Desktop/hackethon
npx vercel login    # opens browser for auth
npx vercel --prod   # follow prompts
```

After CLI deploy, go to Vercel Dashboard → Settings → Environment Variables,
add `VITE_API_URL` = `https://lexagent-api.onrender.com`, then **Redeploy**.

---

## STEP 4 — Verify It Works

- Open `https://YOUR-APP.vercel.app`
- Landing page loads with dark theme
- Click "Get Started" → login form appears
- Login: `admin@lexagent.ai` / `admin123`
- Dashboard loads with Sidebar
- Upload a PDF → goes to Approval Queue
- Agent Chat responds with detailed analysis

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Cannot reach server" | Check `VITE_API_URL` is set and matches your Render URL |
| Login fails | Ensure `SECRET_KEY` is set on Render |
| Slow first request | Render free tier sleeps after 15 min — wakes up in ~30s |
| White screen | Open browser console, check for env var issues |

---

## Your Default Credentials

| Resource | Value |
|----------|-------|
| Default email | `admin@lexagent.ai` |
| Default password | `admin123` |
| API Docs | `https://your-api.onrender.com/docs` |
