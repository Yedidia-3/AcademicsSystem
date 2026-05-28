# Jericho School Management System

This repository contains a **Laravel 10** backend (`api/`) and a **Next.js** static‑export frontend (`frontend/`). It implements the full functional specification you provided.

---

## Prerequisites (local development)
- **Windows** (you are on Windows) with:
  - **PHP 8.1+** (including `php.exe` in PATH)
  - **Composer** (`composer.phar` or installed globally)
  - **Node.js 20+** and **npm**
  - **MySQL** database (or MariaDB) reachable from your machine
- **cPanel** deployment steps are also documented further below.

---

## 1️⃣ Backend – Laravel API

### 1.1 Install dependencies
```bat
cd d:\JSW\AcademicsSystem\api
composer install
```

### 1.2 Environment file
```bat
copy .env.example .env
```
Edit `d:\JSW\AcademicsSystem\api\.env` and set the DB credentials, then generate the app key:
```bat
php artisan key:generate
```

### 1.3 Database migration & seeding
```bat
php artisan migrate --seed
```
This creates all tables (users, academic_years, p_levels, classes, students, shuffle_sessions, shuffle_results, enrollments, zones, notifications) and seeds a **Super‑Admin** user:
- Email: `admin@example.com`
- Password: `password`

### 1.4 Run the API server (development)
```bat
php artisan serve --host=0.0.0.0 --port=8000
```
The API will be reachable at `http://localhost:8000/api/v1/...`.

### 1.5 (Optional) Queue & Scheduler
If you want the daily subscription‑expiry cron job, you need the Laravel scheduler running:
```bat
php artisan schedule:work
```
Or set a cPanel cron entry to execute `php artisan schedule:run` each minute.

---

## 2️⃣ Frontend – Next.js UI

### 2.1 Install dependencies
```bat
cd d:\JSW\AcademicsSystem\frontend
npm install
```

### 2.2 Development server (hot‑reload)
```bat
npm run dev
```
Open `http://localhost:3000` – you will be redirected to the login page. Use the Super‑Admin credentials above.

### 2.3 Production build (static export)
```bat
npm run build && npm run export
```
The static files are placed in `frontend/out/`. Copy the contents of this folder to your cPanel `public_html/` directory.

---

## 3️⃣ cPanel Deployment (shared hosting)
1. **Backend**
   - Upload the entire `api/` folder to a directory outside `public_html` (e.g., `~/jsw/api`).
   - Ensure the `api/public` folder is the web‑accessible entry point. In cPanel create a **sub‑domain** or an **Alias** that points to `api/public` and configure `.htaccess` (already provided) so that all `/api/*` routes are routed to `index.php`.
   - Run the Composer install via the cPanel Terminal (`composer install --no-dev`).
   - Set up the `.env` file and run migrations (`php artisan migrate --seed`).
   - Set up the daily cron: `php /home/USERNAME/jsw/api/artisan schedule:run >> /dev/null 2>&1`.

2. **Frontend**
   - After `npm run export`, upload the contents of `frontend/out/` into `public_html/` (or any folder you serve as the website root).
   - No server‑side processing is required for the static site.

---

## 4️⃣ Quick start commands (Windows console)
```bat
:: Backend
cd d:\JSW\AcademicsSystem\api
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve --host=0.0.0.0 --port=8000

:: Frontend (in a second console window)
cd d:\JSW\AcademicsSystem\frontend
npm install
npm run dev   :: for development
:: or
npm run build && npm run export   :: for production static files
```
---

## 5️⃣ Walkthrough
A concise walkthrough of what has been built and how the pieces interact is provided in `walkthrough.md`.

---

**Enjoy the system!** If you run into any issues, check the Laravel logs (`storage/logs/laravel.log`) and the browser console for the frontend.