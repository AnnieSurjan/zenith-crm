import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('crm.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS deals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    title TEXT NOT NULL,
    value INTEGER,
    status TEXT DEFAULT 'prospect', -- prospect, offer_sent, won, lost
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    assigned_to INTEGER,
    title TEXT NOT NULL,
    due_date DATETIME,
    completed BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    type TEXT, -- call, email, meeting, note
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'member', -- admin, member
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS invitations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'member',
    status TEXT DEFAULT 'pending', -- pending, accepted
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    date TEXT NOT NULL,
    clock_in DATETIME,
    clock_out DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Handle schema update for existing databases
try {
  db.exec('ALTER TABLE tasks ADD COLUMN assigned_to INTEGER REFERENCES users(id)');
} catch (e) {
  // Column already exists or other error
}

// Seed Data
const clientCount = db.prepare('SELECT COUNT(*) as count FROM clients').get() as { count: number };
if (clientCount.count === 0) {
  // ... (existing client seed data)
  const insertClient = db.prepare('INSERT INTO clients (name, email, phone, company, address) VALUES (?, ?, ?, ?, ?)');
  const insertDeal = db.prepare('INSERT INTO deals (client_id, title, value, status, description) VALUES (?, ?, ?, ?, ?)');
  const insertTask = db.prepare('INSERT INTO tasks (client_id, title, due_date, assigned_to) VALUES (?, ?, ?, ?)');
  const insertInteraction = db.prepare('INSERT INTO interactions (client_id, type, content) VALUES (?, ?, ?)');

  const c1 = insertClient.run('Kovács János', 'janos@kovacsbt.hu', '+36 30 123 4567', 'Kovács és Társa Bt.', '1051 Budapest, Sas utca 1.').lastInsertRowid;
  const c2 = insertClient.run('Nagy Erzsébet', 'erzsi@nagydesign.hu', '+36 20 987 6543', 'Nagy Design Kft.', '4024 Debrecen, Piac utca 10.').lastInsertRowid;
  
  // Seed Users first so we can assign tasks
  const adminId = db.prepare('INSERT INTO users (name, email, role, avatar) VALUES (?, ?, ?, ?)').run(
    'Admin Felhasználó', 
    'admin@minicrm.hu', 
    'admin', 
    'https://picsum.photos/seed/admin/100/100'
  ).lastInsertRowid;

  insertDeal.run(c1, 'Weboldal felújítás', 450000, 'offer_sent', 'Teljes reszponzív átalakítás');
  insertDeal.run(c1, 'SEO optimalizálás', 120000, 'won', 'Havi követéssel');
  insertDeal.run(c2, 'Arculattervezés', 300000, 'prospect', 'Logó, névjegykártya, social media');

  insertTask.run(c1, 'Ajánlat követése telefonon', new Date(Date.now() + 86400000).toISOString(), adminId);
  insertTask.run(c2, 'Első konzultáció időpont egyeztetés', new Date(Date.now() + 172800000).toISOString(), adminId);

  insertInteraction.run(c1, 'call', 'Érdeklődött a weboldal csomagok iránt, kért egy részletes ajánlatot.');
  insertInteraction.run(c1, 'email', 'Ajánlat elküldve a megadott e-mail címre.');
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  // User & Profile API
  app.get('/api/me', (req, res) => {
    const user = db.prepare('SELECT * FROM users LIMIT 1').get(); // Simulate logged in user
    res.json(user);
  });

  app.get('/api/users', (req, res) => {
    const users = db.prepare('SELECT * FROM users').all();
    res.json(users);
  });

  // Team Invitations
  app.get('/api/invitations', (req, res) => {
    const invs = db.prepare('SELECT * FROM invitations ORDER BY created_at DESC').all();
    res.json(invs);
  });

  app.post('/api/invitations', (req, res) => {
    const { email, role } = req.body;
    const result = db.prepare('INSERT INTO invitations (email, role) VALUES (?, ?)').run(email, role);
    res.json({ id: result.lastInsertRowid });
  });

  // Attendance API
  app.get('/api/attendance', (req, res) => {
    const records = db.prepare(`
      SELECT attendance.*, users.name as user_name 
      FROM attendance 
      JOIN users ON attendance.user_id = users.id 
      ORDER BY date DESC, clock_in DESC
    `).all();
    res.json(records);
  });

  app.post('/api/attendance/clock-in', (req, res) => {
    const { user_id } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const result = db.prepare('INSERT INTO attendance (user_id, date, clock_in) VALUES (?, ?, ?)').run(user_id, today, new Date().toISOString());
    res.json({ id: result.lastInsertRowid });
  });

  app.post('/api/attendance/clock-out', (req, res) => {
    const { id } = req.body;
    db.prepare('UPDATE attendance SET clock_out = ? WHERE id = ?').run(new Date().toISOString(), id);
    res.json({ success: true });
  });

  // Existing APIs...

  // API Routes
  app.get('/api/clients', (req, res) => {
    const clients = db.prepare('SELECT * FROM clients ORDER BY created_at DESC').all();
    res.json(clients);
  });

  app.post('/api/clients', (req, res) => {
    const { name, email, phone, company, address } = req.body;
    const result = db.prepare('INSERT INTO clients (name, email, phone, company, address) VALUES (?, ?, ?, ?, ?)').run(name, email, phone, company, address);
    res.json({ id: result.lastInsertRowid });
  });

  app.get('/api/clients/:id', (req, res) => {
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
    const deals = db.prepare('SELECT * FROM deals WHERE client_id = ?').all(req.params.id);
    const tasks = db.prepare('SELECT * FROM tasks WHERE client_id = ?').all(req.params.id);
    const interactions = db.prepare('SELECT * FROM interactions WHERE client_id = ? ORDER BY created_at DESC').all(req.params.id);
    res.json({ ...client, deals, tasks, interactions });
  });

  app.get('/api/deals', (req, res) => {
    const deals = db.prepare(`
      SELECT deals.*, clients.name as client_name 
      FROM deals 
      JOIN clients ON deals.client_id = clients.id 
      ORDER BY deals.created_at DESC
    `).all();
    res.json(deals);
  });

  app.post('/api/deals', (req, res) => {
    const { client_id, title, value, status, description } = req.body;
    const result = db.prepare('INSERT INTO deals (client_id, title, value, status, description) VALUES (?, ?, ?, ?, ?)').run(client_id, title, value, status, description);
    res.json({ id: result.lastInsertRowid });
  });

  app.get('/api/tasks', (req, res) => {
    const tasks = db.prepare(`
      SELECT tasks.*, clients.name as client_name, users.name as assignee_name 
      FROM tasks 
      JOIN clients ON tasks.client_id = clients.id 
      LEFT JOIN users ON tasks.assigned_to = users.id
      ORDER BY due_date ASC
    `).all();
    res.json(tasks);
  });

  app.post('/api/tasks', (req, res) => {
    const { client_id, title, due_date, assigned_to } = req.body;
    const result = db.prepare('INSERT INTO tasks (client_id, title, due_date, assigned_to) VALUES (?, ?, ?, ?)').run(client_id, title, due_date, assigned_to);
    res.json({ id: result.lastInsertRowid });
  });

  app.patch('/api/tasks/:id/complete', (req, res) => {
    db.prepare('UPDATE tasks SET completed = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.post('/api/interactions', (req, res) => {
    const { client_id, type, content } = req.body;
    const result = db.prepare('INSERT INTO interactions (client_id, type, content) VALUES (?, ?, ?)').run(client_id, type, content);
    res.json({ id: result.lastInsertRowid });
  });

  // Emailing API
  app.post('/api/email/send', (req, res) => {
    const { client_id, subject, body } = req.body;
    // In a real app, use nodemailer or a service like SendGrid/Mailgun
    console.log(`Sending email to client ${client_id}: [${subject}]`);
    
    // Log the interaction
    db.prepare('INSERT INTO interactions (client_id, type, content) VALUES (?, ?, ?)').run(
      client_id, 
      'email', 
      `KIKÜLDÖTT EMAIL: ${subject}\n\n${body}`
    );
    
    res.json({ success: true, message: 'Email elküldve (szimulált)' });
  });

  // Invoicing Placeholders (Számlázz.hu / Billingo)
  app.post('/api/invoicing/create-draft', (req, res) => {
    // In a real app, this would call Számlázz.hu or Billingo API
    // For now, we simulate success
    const { deal_id, provider } = req.body;
    console.log(`Creating draft invoice for deal ${deal_id} via ${provider}`);
    res.json({ success: true, message: `Draft created in ${provider} (Simulated)` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
