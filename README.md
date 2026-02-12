# SB INFRA PROJECTS – Construction Consulting

Static site with a **Node.js backend** for leads and city-based package pricing.

## How to run the project

**You need Node.js installed.** Download from [nodejs.org](https://nodejs.org) if needed.

### Option A – Double-click (Windows)

1. Double-click **`run.bat`** in the project folder.
2. Wait for “Installing…” and “Starting…” to finish.
3. Open your browser and go to **http://localhost:3002**.

### Option B – Command line

1. Open a terminal in the project folder (`construct`).
2. Run:
   ```bash
   npm start
   ```
   Or step by step:
   ```bash
   cd server
   npm install
   node server.js
   ```
3. Open **http://localhost:3002** in your browser.

To stop the server, press **Ctrl+C** in the terminal (or close the window that opened for `run.bat`).

## What works

- **Backend (Express)**  
  - Serves the site and static files.  
  - **POST /api/leads** – Saves leads (modal + footer form).  
  - **GET /api/packages?city=** – Returns package pricing for the selected city.  
  - **GET /api/projects** – List projects; **GET /api/projects/:id** – Single project.  
  - **POST/PUT/DELETE /api/projects** – Add, update, delete projects (require `X-Admin-Secret` header).  
  - Data: `data/leads.json`, `data/projects.json`.

- **Frontend**  
  - Modal “Start Your Construction” form submits to `/api/leads` and shows a success/error toast.  
  - Footer “Get a Quote” form submits to `/api/leads` and shows a toast.  
  - City selector loads and displays package prices from the API.  
  - Mobile menu, smooth scroll, and scroll-reveal animations.

- **Website owner – manage projects**  
  - Open **http://localhost:3002/admin.html**. Log in with admin password (default: `sbinfra2024`; set env `ADMIN_SECRET` to change).  
  - Add, edit, or delete projects; they appear on the public Projects page.

## Optional: run server only (if dependencies are already installed)

```bash
npm run server
```

Or from the `server` folder:

```bash
cd server && npm install && node server.js
```

Then open **http://localhost:3002**.
