# Jericho School Management System — Deployment Guide (v1)

Two pieces:
- **Backend (NestJS API + PostgreSQL)** → **Render**
- **Frontend (React/Vite)** → **Vercel**

Deploy the **backend first** (you need its URL for the frontend).

---

## Part A — Backend on Render

### 1. Push the repo to GitHub
Make sure the latest code is on GitHub (it is, on `main`).

### 2. Create the services from the blueprint
1. Go to **https://render.com** → sign in with GitHub.
2. Click **New +** → **Blueprint**.
3. Select your repo **`AcademicsSystem`**.
4. Render reads `render.yaml` and shows two services:
   - **jericho-api** (Docker web service)
   - **jericho-db** (PostgreSQL)
5. Click **Apply**. Render builds the API image and provisions the database.
   `DATABASE_URL` is wired automatically; `JWT_SECRET` is auto-generated.

### 3. First boot
- On the first successful deploy, the API **auto-creates the Super Admin** (because the DB is empty):
  - **Email:** `admin@jericho.rw`
  - **Password:** `Admin@Jericho2025!`
  - You'll be forced to set a new password on first login.
- `SYNCHRONIZE_DB=true` (in `render.yaml`) lets the API create all tables on first boot.

### 4. After the first deploy — two quick settings
In the **jericho-api** service → **Environment**:
1. **`SYNCHRONIZE_DB`** → change to **`false`** (schema is now created; keeps prod safe).
2. **`FRONTEND_URL`** → set to your Vercel URL once you have it (Part B), e.g.
   `https://jericho-school.vercel.app` — this enables CORS. (You can come back and set this after Part B.)
3. Click **Save** (the service redeploys).

### 5. Grab the API URL
Copy the service URL, e.g. `https://jericho-api.onrender.com`.
Health check: open `https://jericho-api.onrender.com/api/v1/health` → should return `{"status":"ok",...}`.

> **Note (Render free tier):** the API sleeps after ~15 min idle and takes ~30–60s to wake on the next request. That's normal for the free plan.

---

## Part B — Frontend on Vercel

### 1. Import the project
1. Go to **https://vercel.com** → sign in with GitHub.
2. **Add New… → Project** → import **`AcademicsSystem`**.
3. Vercel auto-detects **Vite** (settings come from `vercel.json`):
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### 2. Set the API URL
Before deploying, open **Environment Variables** and add:
- **Name:** `VITE_API_URL`
- **Value:** your Render API URL, e.g. `https://jericho-api.onrender.com`
- Apply to **Production** (and Preview if you want).

### 3. Deploy
Click **Deploy**. When done, you get a URL like `https://jericho-school.vercel.app`.

### 4. Close the loop (CORS)
Go back to **Render → jericho-api → Environment** and set
**`FRONTEND_URL`** to your Vercel URL, then Save (redeploys). Now the browser can call the API.

---

## Done — log in
Open the Vercel URL and sign in:
- `admin@jericho.rw` / `Admin@Jericho2025!` → set your real password → create Dean, Principal, Teachers, Accountant from **Users**.

---

## Updating later
Push to `main` → Render and Vercel auto-redeploy. (Keep `SYNCHRONIZE_DB=false` in production; if you add new entity columns, flip it to `true` for one deploy, then back to `false`.)

## Environment variables reference

**Render (API)**
| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `DATABASE_URL` | auto (from jericho-db) |
| `JWT_SECRET` | auto-generated |
| `JWT_EXPIRES_IN` | `2h` |
| `SYNCHRONIZE_DB` | `true` first deploy → then `false` |
| `FRONTEND_URL` | your Vercel URL |

**Vercel (frontend)**
| Key | Value |
|---|---|
| `VITE_API_URL` | your Render API URL |
