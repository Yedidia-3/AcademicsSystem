# Frontend Deploy (cPanel) — Step-Down

**Deploy this AFTER the backend** (`BACKEND.md`). You need the live API URL,
because `VITE_API_URL` is baked into the build — it is **not** a server setting.

Target: static files in your domain's docroot (e.g. `public_html/`).

---

### Step 1 — Build locally with the API URL baked in
Run from **`apps/frontend`**. Set `VITE_API_URL` to your live API:

```powershell
# Windows PowerShell
cd apps/frontend
$env:VITE_API_URL = "https://api.yourdomain.com"; npm run build
```
```bash
# macOS / Linux
cd apps/frontend
VITE_API_URL="https://api.yourdomain.com" npm run build
```
- [ ] Output appears in `apps/frontend/dist/`.

> If you skip `VITE_API_URL`, the site silently calls `http://localhost:3001`
> and every request fails in production.

### Step 2 — (Optional) confirm the URL was baked in
```bash
# bash — should print your domain, NOT localhost
grep -o "https://api.yourdomain.com" apps/frontend/dist/assets/*.js | head -1
```

### Step 3 — Upload the site (File Manager / FTP)
- [ ] Upload the **contents** of `apps/frontend/dist/` into your frontend docroot
      (e.g. `mis.jerichoschool.ac.rw/`) — files go directly in the docroot, not inside a `dist/` subfolder.

### Step 4 — Upload the SPA `.htaccess`
- [ ] Upload `deploy/cpanel/.htaccess` into `public_html/`, next to `index.html`.
- [ ] If your FTP client hides dotfiles, enable "show hidden files" or rename on upload.

> This gives react-router its fallback. Without it, refreshing any route
> (e.g. `/dean/import`) returns a 404.

### Step 5 — Point CORS back at the frontend
- [ ] cPanel → **Setup Node.js App** → your API → **Environment variables**.
- [ ] Set `FRONTEND_URL = https://yourdomain.com`.
- [ ] **Restart App.**

### Step 6 — Run AutoSSL
- [ ] cPanel → **SSL/TLS Status** → run **AutoSSL** for `yourdomain.com`.
      (The `.htaccess` force-HTTPS rule activates once the cert exists.)

### Step 7 — Smoke test
- [ ] Open `https://yourdomain.com`.
- [ ] Log in: `admin@jericho.rw / Admin@Jericho2025!` → set a real password.
- [ ] Refresh a deep page (proves `.htaccess`).
- [ ] Open browser DevTools → Network → confirm API calls hit
      `https://api.yourdomain.com` with no CORS errors.

✅ Frontend live.

---

### Updating the frontend later
1. Rebuild with the same `VITE_API_URL` (Step 1).
2. Re-upload the new `apps/frontend/dist/` contents to your frontend docroot (keep `.htaccess`).
   No app restart needed — it's static files.

### If something's off
| Symptom | Fix |
|---|---|
| Blank page / API calls go to `localhost` | Rebuilt without `VITE_API_URL`. Redo Step 1. |
| Refresh gives 404 | `.htaccess` missing or not next to `index.html` (Step 4). |
| CORS error in console | `FRONTEND_URL` wrong or app not restarted (Step 5). |
