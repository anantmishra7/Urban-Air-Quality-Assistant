# 🚀 Deployment Guide – BreatheCity AI

This guide walks through deploying the **BreatheCity AI** stack (FastAPI backend + React frontend) on free-tier cloud platforms.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Backend Deployment](#backend-deployment)
  - [Option A – Railway](#option-a--railway)
  - [Option B – Render](#option-b--render)
- [Frontend Deployment](#frontend-deployment)
  - [Option A – Vercel](#option-a--vercel)
  - [Option B – Netlify](#option-b--netlify)
- [Environment Variables Reference](#environment-variables-reference)
- [Database Considerations](#database-considerations)
- [Post-Deployment Checklist](#post-deployment-checklist)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌───────────────────────┐         ┌───────────────────────┐
│   Vercel / Netlify    │  HTTPS  │   Railway / Render    │
│   (Static Frontend)   │ ◄─────► │   (FastAPI Backend)   │
│   React + Vite        │         │   Uvicorn + SQLite    │
└───────────────────────┘         └───────────────────────┘
                                           │
                                           ▼
                                  Open-Meteo APIs (free)
```

---

## Prerequisites

| Tool | Purpose |
|------|---------|
| Git | Version control & pushing to GitHub |
| Node.js ≥ 18 | Building the frontend |
| Python 3.11+ | Local backend testing |
| GitHub account | Required by all deployment platforms |

---

## Backend Deployment

### Option A – Railway

[Railway](https://railway.app) offers a generous free tier that auto-detects Dockerfiles.

1. **Push your repository to GitHub.**

2. **Create a Railway project:**
   - Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
   - Select the `breathecity-ai` repository.
   - Railway detects `backend/Dockerfile` automatically.

3. **Set the root directory:**
   - In **Settings → General**, set **Root Directory** to `backend`.

4. **Configure environment variables:**
   - Go to **Variables** and add:
     ```
     DATABASE_URL=sqlite:///./breathecity.db
     PORT=8000
     ```

5. **Deploy:**
   - Railway builds and deploys automatically on push.
   - Copy the generated public URL (e.g., `https://breathecity-backend-production.up.railway.app`).

6. **Verify:**
   ```bash
   curl https://<your-railway-url>/health
   # → {"status":"ok"}
   ```

### Option B – Render

[Render](https://render.com) offers a free Web Service tier.

1. **Push your repository to GitHub.**

2. **Create a new Web Service:**
   - Go to [render.com](https://render.com) → **New** → **Web Service**.
   - Connect your GitHub repository.

3. **Configure the service:**
   | Setting | Value |
   |---------|-------|
   | **Name** | `breathecity-backend` |
   | **Root Directory** | `backend` |
   | **Runtime** | Docker |
   | **Instance Type** | Free |

4. **Add environment variables:**
   ```
   DATABASE_URL=sqlite:///./breathecity.db
   ```

5. **Deploy:**
   - Click **Create Web Service**. Render builds the Docker image and starts the service.
   - Note: Free-tier services spin down after 15 min of inactivity (cold start ~30s).

6. **Verify:**
   ```bash
   curl https://breathecity-backend.onrender.com/health
   ```

---

## Frontend Deployment

Before deploying, update the API base URL in the frontend build so it points to your deployed backend.

Create or update `frontend/.env.production`:
```
VITE_API_BASE_URL=https://<your-backend-url>
```

### Option A – Vercel

1. **Go to [vercel.com](https://vercel.com) → Import Git Repository.**

2. **Configure:**
   | Setting | Value |
   |---------|-------|
   | **Framework Preset** | Vite |
   | **Root Directory** | `frontend` |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `dist` |

3. **Add environment variable:**
   ```
   VITE_API_BASE_URL=https://<your-backend-url>
   ```

4. **Add `vercel.json` for SPA routing** (create in `frontend/`):
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```

5. **Deploy** – Vercel auto-builds on push.

### Option B – Netlify

1. **Go to [netlify.com](https://netlify.com) → Add New Site → Import from Git.**

2. **Configure:**
   | Setting | Value |
   |---------|-------|
   | **Base Directory** | `frontend` |
   | **Build Command** | `npm run build` |
   | **Publish Directory** | `frontend/dist` |

3. **Add environment variable:**
   ```
   VITE_API_BASE_URL=https://<your-backend-url>
   ```

4. **Create `frontend/netlify.toml`:**
   ```toml
   [build]
     base = "frontend"
     command = "npm run build"
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

5. **Deploy** – Netlify auto-builds on push.

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | No | `sqlite:///./breathecity.db` | Database connection string |
| `PORT` | No | `8000` | Backend server port |
| `HOST` | No | `0.0.0.0` | Backend bind address |
| `CORS_ORIGINS` | No | `localhost` | Comma-separated allowed origins |
| `CACHE_TTL` | No | `300` | API cache TTL in seconds |
| `MAX_UPLOAD_SIZE` | No | `5242880` | Max upload size in bytes |
| `LOG_LEVEL` | No | `INFO` | Logging level |
| `RATE_LIMIT` | No | `60/minute` | Rate limiting threshold |
| `VITE_API_BASE_URL` | Yes (frontend) | `/api` | Backend API URL for frontend |

---

## Database Considerations

### Development (SQLite)
- Default. Zero configuration. File-based at `breathecity.db`.
- **Limitation:** On Railway/Render free tier, the filesystem is ephemeral — data is lost on redeploy.

### Production (PostgreSQL)
For persistent data, switch to PostgreSQL:

1. **Add a PostgreSQL database** in Railway or Render (both offer free-tier Postgres).
2. **Update `DATABASE_URL`:**
   ```
   DATABASE_URL=postgresql://user:password@host:5432/breathecity
   ```
3. **Add `psycopg2-binary`** to `requirements.txt`:
   ```
   psycopg2-binary==2.9.9
   ```
4. The SQLModel ORM handles schema creation automatically on startup.

### Data Persistence Notes
- User-submitted reports are stored in the database.
- Uploaded photos are stored on disk (`uploads/`). For production, consider an object store (S3, Cloudflare R2).
- AQI/weather data is fetched live from Open-Meteo — no persistence needed.

---

## Post-Deployment Checklist

- [ ] Backend `/health` returns `{"status":"ok"}`
- [ ] Frontend loads and displays the landing page
- [ ] City search returns AQI data
- [ ] Dashboard shows pollutant breakdown and weather
- [ ] Forecast page renders charts
- [ ] AI Assistant responds to questions
- [ ] Map page shows pollution markers
- [ ] Report submission works
- [ ] City comparison returns data
- [ ] CORS allows frontend → backend requests
- [ ] Upload endpoint accepts and stores images

---

## Troubleshooting

### "CORS policy" errors in browser console
- Ensure `CORS_ORIGINS` includes your frontend URL (with protocol, no trailing slash).
- Example: `CORS_ORIGINS=https://breathecity.vercel.app`

### Backend returns 502 / 503 on Render
- Free-tier services sleep after 15 min. First request takes ~30s to cold-start.
- Check **Logs** tab in Render dashboard for startup errors.

### "Module not found" on Railway
- Ensure `Root Directory` is set to `backend`.
- Verify all dependencies are in `requirements.txt`.

### Frontend shows blank page
- Check browser console for errors.
- Ensure `VITE_API_BASE_URL` is set correctly in environment variables.
- Verify the SPA redirect rule is configured (`vercel.json` or `netlify.toml`).

### Database "table not found" errors
- The app auto-creates tables on startup via `SQLModel.metadata.create_all()`.
- If using PostgreSQL, ensure the user has `CREATE TABLE` privileges.

### Uploaded images not loading
- On ephemeral filesystems, images are lost on redeploy. Use S3/R2 for production.
- Check that the `uploads/` directory exists and is writable.

### API rate limiting (429 errors)
- Default limit is 60 requests/minute per IP. Increase `RATE_LIMIT` if needed.
- Consider adding Redis-backed rate limiting for multi-instance deployments.
