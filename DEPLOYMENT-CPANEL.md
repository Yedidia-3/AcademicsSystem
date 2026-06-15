# Jericho School Management System — cPanel Deployment Runbook

This targets a **shared cPanel** host with:
- ✅ **Setup Node.js App** (Phusion Passenger) available
- ✅ **PostgreSQL Databases** available
- ⚠️ **No SSH** — File Manager / FTP only

> Because there is no SSH, we **build locally** and upload artifacts. We do **not**
> run migrations or seeds by hand: the API auto-creates the schema
> (`SYNCHRONIZE_DB=true`) and auto-seeds the Super Admin on an empty DB at first boot.

Two deployables:
- **Frontend** (static React) → a normal docroot, e.g. `public_html/`
- **API** (NestJS) → a Node.js App on a subdomain, e.g. `api.yourdomain.com`

Deploy the **API first** — you need its URL to build the frontend.

---

## Part A — Database (cPanel → PostgreSQL Databases)

1. **Create database:** name it `jericho_school`. cPanel prefixes it → real name like
   `cpuser_jericho_school`.
2. **Create user** with a strong password. Real name like `cpuser_jericho`.
3. **Add user to database** with **ALL PRIVILEGES**.
4. Note the three values — you'll paste them as env vars:
   - `DB_NAME` = `cpuser_jericho_school`
   - `DB_USERNAME` = `cpuser_jericho`
   - `DB_PASSWORD` = the password you set
   - `DB_HOST` = `localhost`  ·  `DB_PORT` = `5432`

> ⚠️ **Use the discrete `DB_*` vars below — NOT `DATABASE_URL`.** The code's
> `DATABASE_URL` path forces SSL, which fails against cPanel's local (non-SSL)
> Postgres. The `DB_*` path connects without SSL — correct for localhost.

---

## Part B — API (cPanel → Setup Node.js App)

### 1. Build locally
```bash
cd apps/api
npm ci
npm run build        # → apps/api/dist/main.js
```

### 2. Create the subdomain
cPanel → **Domains / Subdomains** → create `api.yourdomain.com`
(note its document root, e.g. `/home/cpuser/api.yourdomain.com`).

### 3. Upload the API (File Manager / FTP)
Into the subdomain's folder, upload **only**:
```
package.json
package-lock.json
dist/            ← the compiled output from step 1
```
Do **not** upload `node_modules` or `src` (Passenger installs deps for you).

### 4. Create the Node.js App
cPanel → **Setup Node.js App** → **Create Application**:
- **Node.js version:** 20.x (18+ required by NestJS 10)
- **Application mode:** Production
- **Application root:** the subdomain folder from step 2
- **Application URL:** `api.yourdomain.com`
- **Application startup file:** `dist/main.js`

### 5. Environment variables (in the same screen → "Environment variables")
| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `SYNCHRONIZE_DB` | `true`  ← first boot only, see step 8 |
| `JWT_SECRET` | a long random string (generate one) |
| `JWT_EXPIRES_IN` | `2h` |
| `DB_HOST` | `localhost` |
| `DB_PORT` | `5432` |
| `DB_NAME` | `cpuser_jericho_school` |
| `DB_USERNAME` | `cpuser_jericho` |
| `DB_PASSWORD` | your DB password |
| `FRONTEND_URL` | `https://yourdomain.com` (set after Part C; enables CORS) |

> Do **not** set `PORT` — Passenger assigns the port itself and intercepts
> `app.listen()`. Setting it does nothing useful.

### 6. Install dependencies
Click **Run NPM Install** (uses `package.json`). Wait for it to finish.

### 7. Start & verify
Click **Start App** (or Restart). Then check health in a browser:
```
https://api.yourdomain.com/api/v1/health   →   {"success":true,"data":{"status":"ok",...}}
```
First boot will create all tables and seed:
- **admin@jericho.rw** / **Admin@Jericho2025!** (forced password change on first login)

### 8. Lock down the schema (after first successful boot)
Edit the env var **`SYNCHRONIZE_DB` → `false`**, then **Restart App**.
Leave it `false` in production. (If you later add entity columns: flip to `true`
for one restart, then back to `false`.)

---

## Part C — Frontend (static)

### 1. Build locally with the API URL baked in
`VITE_API_URL` is inlined at **build time**, so it must be set before building
(there is no server-side env for the static site):
```bash
# from apps/frontend
# PowerShell:
cd apps/frontend; $env:VITE_API_URL = "https://api.yourdomain.com"; npm run build
# bash:
cd apps/frontend && VITE_API_URL="https://api.yourdomain.com" npm run build
```
Output → `apps/frontend/dist/`.

### 2. Upload
- Upload the **contents** of `apps/frontend/dist/` into your frontend docroot (e.g. the `mis.` subdomain folder).
- Also upload **`deploy/cpanel/.htaccess`** into the same folder (rename to `.htaccess`
  if your FTP client hid it). This gives react-router its SPA fallback — without it,
  refreshing any route 404s.

### 3. Close the CORS loop
Back in **Setup Node.js App → your API → Environment variables**, set
`FRONTEND_URL=https://yourdomain.com`, then **Restart App**.

### 4. SSL
cPanel → **SSL/TLS Status** → run **AutoSSL** for both `yourdomain.com` and
`api.yourdomain.com`. The `.htaccess` already forces HTTPS once the cert exists.

---

## Done
Open `https://yourdomain.com`, log in as `admin@jericho.rw / Admin@Jericho2025!`,
set a real password, then create your other users.

---

## Updating later (no SSH)
1. Rebuild locally (`apps/api` and/or `apps/frontend`).
2. Re-upload changed `dist/` files (`apps/api/dist` or `apps/frontend/dist`).
3. API change → **Restart App** in Setup Node.js App. Frontend change → just the files.

---

## 2 a.m. troubleshooting
| Symptom | Cause / fix |
|---|---|
| Health URL 500s, app won't stay up | Check the Node app's **stderr log** (path shown in the app panel). Usually a DB credential typo or `DB_HOST` not `localhost`. |
| `no pg_hba.conf entry ... SSL off` or SSL errors | You set `DATABASE_URL`. Remove it; use the `DB_*` vars (no SSL on localhost). |
| Refreshing `/dean/...` gives 404 | `.htaccess` missing or in the wrong folder. It must sit next to `index.html`. |
| API calls blocked by CORS in browser console | `FRONTEND_URL` not set / wrong / app not restarted after setting it. |
| Real-time/notifications flaky | socket.io over Passenger can fall back to long-polling — functional but not instant. Acceptable on shared hosting; needs a VPS for true websockets if it matters. |
| `npm install` fails or OOMs in cPanel | Retry; if persistent, the plan's memory limit is too low — ask the host to raise it, or upload a locally-built `node_modules` (prod-only: `npm ci --omit=dev`). |
| Login works but every request 401s after a while | JWT expiry (`JWT_EXPIRES_IN=2h`) — expected; user re-logs in. |
