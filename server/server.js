const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3002;

const PROJECT_ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const PACKAGES_FILE = path.join(DATA_DIR, 'packages.json');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'sbinfra2024';
const expectedSecret = (typeof ADMIN_SECRET === 'string' ? ADMIN_SECRET.trim() : '') || 'sbinfra2024';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (index.html, style.css, script.js, logo.png)
app.use(express.static(PROJECT_ROOT));

// Create uploads directory
const UPLOADS_DIR = path.join(PROJECT_ROOT, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded images
app.use('/uploads', express.static(UPLOADS_DIR));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'project-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(LEADS_FILE)) {
    fs.writeFileSync(LEADS_FILE, JSON.stringify([], null, 2));
  }
}

function readLeads() {
  ensureDataDir();
  try {
    const data = fs.readFileSync(LEADS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeLeads(leads) {
  ensureDataDir();
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf8');
}

function ensureProjectsFile() {
  ensureDataDir();
  if (!fs.existsSync(PROJECTS_FILE)) {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify([], null, 2));
  }
}

function readProjects() {
  ensureProjectsFile();
  try {
    return JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeProjects(projects) {
  ensureProjectsFile();
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf8');
}

function requireAdmin(req, res, next) {
  const secret = (req.headers['x-admin-secret'] || '').trim();
  if (secret !== expectedSecret) {
    return res.status(401).json({ success: false, error: 'Unauthorized.' });
  }
  next();
}

// POST /api/leads — submit contact/lead (modal or footer form)
app.post('/api/leads', (req, res) => {
  try {
    const { fullName, mobile, location, source, message } = req.body;
    if (!fullName || !mobile || !location) {
      return res.status(400).json({
        success: false,
        error: 'Full name, mobile number and location are required.',
      });
    }
    const leads = readLeads();
    const lead = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      fullName: String(fullName).trim(),
      mobile: String(mobile).trim(),
      location: String(location).trim(),
      source: source || 'website',
      message: message ? String(message).trim() : '',
      createdAt: new Date().toISOString(),
    };
    leads.push(lead);
    writeLeads(leads);
    res.status(201).json({ success: true, message: 'Thank you! We will contact you shortly.', id: lead.id });
  } catch (err) {
    console.error('Error saving lead:', err);
    res.status(500).json({ success: false, error: 'Failed to submit. Please try again.' });
  }
});

// GET /api/packages?city=bengaluru — get package pricing for city
app.get('/api/packages', (req, res) => {
  try {
    const city = (req.query.city || 'bengaluru').toLowerCase().replace(/\s+/g, '');
    let packages;
    try {
      packages = JSON.parse(fs.readFileSync(PACKAGES_FILE, 'utf8'));
    } catch {
      return res.status(500).json({ success: false, error: 'Packages data not available.' });
    }
    const cityData = packages[city] || packages.bengaluru;
    return res.json({ success: true, city, packages: cityData });
  } catch (err) {
    console.error('Error fetching packages:', err);
    res.status(500).json({ success: false, error: 'Failed to load packages.' });
  }
});

// GET /api/leads — admin only, get all leads
app.get('/api/leads', requireAdmin, (req, res) => {
  try {
    const leads = readLeads();
    res.json({ success: true, leads });
  } catch (err) {
    console.error('Error fetching leads:', err);
    res.status(500).json({ success: false, error: 'Failed to load leads.' });
  }
});

// GET /api/projects — public list of projects
app.get('/api/projects', (req, res) => {
  try {
    const projects = readProjects();
    res.json({ success: true, projects });
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ success: false, error: 'Failed to load projects.' });
  }
});

// GET /api/projects/:id — single project (public)
app.get('/api/projects/:id', (req, res) => {
  try {
    const projects = readProjects();
    const project = projects.find(p => p.id === req.params.id);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found.' });
    res.json({ success: true, project });
  } catch (err) {
    console.error('Error fetching project:', err);
    res.status(500).json({ success: false, error: 'Failed to load project.' });
  }
});

// Admin: POST /api/projects — add project
app.post('/api/projects', requireAdmin, upload.single('image'), (req, res) => {
  try {
    const { title, description, imageUrl, location, year, category } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, error: 'Title and description are required.' });
    }
    const projects = readProjects();
    const id = 'proj' + Date.now();
    const now = new Date().toISOString();

    // Determine image URL: uploaded file or provided URL
    let finalImageUrl = '';
    if (req.file) {
      finalImageUrl = '/uploads/' + req.file.filename;
    } else if (imageUrl) {
      finalImageUrl = String(imageUrl).trim();
    }

    const project = {
      id,
      title: String(title).trim(),
      description: String(description).trim(),
      imageUrl: finalImageUrl,
      location: location ? String(location).trim() : '',
      year: year ? String(year).trim() : '',
      category: category ? String(category).trim() : 'Residential',
      createdAt: now,
      updatedAt: now,
    };
    projects.push(project);
    writeProjects(projects);
    res.status(201).json({ success: true, project });
  } catch (err) {
    console.error('Error adding project:', err);
    res.status(500).json({ success: false, error: 'Failed to add project.' });
  }
});

// Admin: PUT /api/projects/:id — update project
app.put('/api/projects/:id', requireAdmin, upload.single('image'), (req, res) => {
  try {
    const { title, description, imageUrl, location, year, category } = req.body;
    const projects = readProjects();
    const index = projects.findIndex(p => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, error: 'Project not found.' });
    const p = projects[index];

    if (title !== undefined) p.title = String(title).trim();
    if (description !== undefined) p.description = String(description).trim();

    // Handle image: new upload, new URL, or keep existing
    if (req.file) {
      // Delete old image if it exists and was uploaded (not external URL)
      if (p.imageUrl && p.imageUrl.startsWith('/uploads/')) {
        const oldPath = path.join(PROJECT_ROOT, p.imageUrl);
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch (e) { console.error('Could not delete old image:', e); }
        }
      }
      p.imageUrl = '/uploads/' + req.file.filename;
    } else if (imageUrl !== undefined) {
      p.imageUrl = String(imageUrl).trim();
    }

    if (location !== undefined) p.location = String(location).trim();
    if (year !== undefined) p.year = String(year).trim();
    if (category !== undefined) p.category = String(category).trim();
    p.updatedAt = new Date().toISOString();
    writeProjects(projects);
    res.json({ success: true, project: p });
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).json({ success: false, error: 'Failed to update project.' });
  }
});

// Admin: DELETE /api/projects/:id
app.delete('/api/projects/:id', requireAdmin, (req, res) => {
  try {
    const all = readProjects();
    const projects = all.filter(p => p.id !== req.params.id);
    if (projects.length === all.length) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }
    writeProjects(projects);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({ success: false, error: 'Failed to delete project.' });
  }
});

// POST /api/admin/verify — check admin password (body or header, for admin UI login)
app.post('/api/admin/verify', (req, res) => {
  const fromBody = req.body && (req.body.password || req.body.secret);
  const fromHeader = req.headers['x-admin-secret'];
  const received = (typeof fromBody === 'string' ? fromBody : fromHeader || '').trim();
  if (received !== expectedSecret) {
    return res.status(401).json({ success: false, error: 'Invalid password.' });
  }
  res.json({ success: true });
});

// GET /api/admin/verify — also support GET with header (for session check)
app.get('/api/admin/verify', (req, res) => {
  const received = (req.headers['x-admin-secret'] || '').trim();
  if (received !== expectedSecret) {
    return res.status(401).json({ success: false, error: 'Unauthorized.' });
  }
  res.json({ success: true });
});

// Health check for deployment
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Explicit routes for HTML pages (so /admin and /projects work without .html)
app.get('/admin', (req, res) => {
  res.sendFile(path.join(PROJECT_ROOT, 'admin.html'));
});
app.get('/projects', (req, res) => {
  res.sendFile(path.join(PROJECT_ROOT, 'projects.html'));
});
app.get('/project-detail', (req, res) => {
  res.sendFile(path.join(PROJECT_ROOT, 'project-detail.html'));
});

// SPA fallback: serve index.html for non-file routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  const file = path.join(PROJECT_ROOT, req.path);
  if (fs.existsSync(file) && fs.statSync(file).isFile()) return next();
  res.sendFile(path.join(PROJECT_ROOT, 'index.html'));
});

const server = app.listen(PORT, () => {
  ensureDataDir();
  console.log(`\n  >> SB Infra backend running at http://localhost:${PORT}\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Try closing other apps or set PORT=3000 and run again.`);
  } else {
    console.error('Server error:', err.message);
  }
  process.exit(1);
});
