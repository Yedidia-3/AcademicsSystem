# Backend Deploy (cPanel) — Step-Down

**Deploy this FIRST.** The frontend needs the API URL before it can be built.

Target: shared cPanel with **Setup Node.js App** + **PostgreSQL**, no SSH.
You do **not** run migrations or seeds — first boot creates the schema
(`SYNCHRONIZE_DB=true`) and seeds the Super Admin automatically.

---

### Step 1 — Create the database (cPanel → PostgreSQL Databases)
- [ ] Create database `jericho_school` → real name becomes `cpuser_jericho_school`.
- [ ] Create a user `jericho` (strong password) → real name `cpuser_jericho`.
- [ ] Add the user to the database with **ALL PRIVILEGES**.
- [ ] Write down: DB name, user, password. Host is `localhost`, port `5432`.

### Step 2 — Build the API locally
```bash
cd apps/api
npm ci
npm run build          # produces apps/api/dist/main.js
```

### Step 3 — Create the API subdomain
- [ ] cPanel → **Subdomains** → create `api.yourdomain.com`.
- [ ] Note its folder (e.g. `/home/cpuser/api.yourdomain.com`).

### Step 4 — Upload the API (File Manager / FTP)
Into the subdomain folder, upload **only these three**:
- [ ] `package.json`
- [ ] `package-lock.json`
- [ ] `dist/`  (the compiled output from Step 2)

> Do NOT upload `node_modules` or `src` — Passenger installs deps for you.

### Step 5 — Create the Node.js App (cPanel → Setup Node.js App → Create)
- [ ] **Node.js version:** 20.x
- [ ] **Application mode:** Production
- [ ] **Application root:** the subdomain folder from Step 3
- [ ] **Application URL:** `api.yourdomain.com`
- [ ] **Application startup file:** `dist/main.js`

### Step 6 — Set environment variables (same screen)
| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `SYNCHRONIZE_DB` | `true`  *(first boot only — see Step 9)* |
| `JWT_SECRET` | a long random string |
| `JWT_EXPIRES_IN` | `2h` |
| `DB_HOST` | `localhost` |
| `DB_PORT` | `5432` |
| `DB_NAME` | `cpuser_jericho_school` |
| `DB_USERNAME` | `cpuser_jericho` |
| `DB_PASSWORD` | your DB password |
| `FRONTEND_URL` | `https://yourdomain.com` *(set now or after the frontend deploy)* |

> ⚠️ Use these `DB_*` vars. Do **NOT** set `DATABASE_URL` (it forces SSL and
> fails against cPanel's local Postgres). Do **NOT** set `PORT` (Passenger owns it).

### Step 7 — Install dependencies
- [ ] Click **Run NPM Install**. Wait for it to finish.

### Step 8 — Start & verify
- [ ] Click **Start App** (or Restart).
- [ ] Open `https://api.yourdomain.com/api/v1/health`
      → expect `{"success":true,"data":{"status":"ok",...}}`
- [ ] First boot auto-creates tables and seeds:
      **admin@jericho.rw / Admin@Jericho2025!** (forced change on first login).

### Step 9 — Lock the schema (after a successful first boot)
- [ ] Change env var `SYNCHRONIZE_DB` → `false`.
- [ ] **Restart App.** Leave it `false` in production.

### Step 10 — Run AutoSSL
- [ ] cPanel → **SSL/TLS Status** → run **AutoSSL** for `api.yourdomain.com`.

✅ Backend live. Now do `FRONTEND.md`.

---

### Updating the backend later (no SSH)
1. `cd apps/api && npm run build`
2. Re-upload the changed `dist/` files.
3. **Restart App** in Setup Node.js App.

### If it won't boot
- Check the Node app's **stderr log** (path shown in the app panel).
- 90% of the time it's a DB credential typo, `DB_HOST` not `localhost`, or
  `DATABASE_URL` accidentally set (remove it).
