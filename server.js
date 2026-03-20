import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  let db = null;
  let dbError = null;

  try {
    const require = createRequire(import.meta.url);
    const Database = require("better-sqlite3");
    db = new Database("crm.db");

    db.exec(`
      CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT, phone TEXT, company TEXT, address TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS deals (
        id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER, title TEXT NOT NULL, value INTEGER, status TEXT DEFAULT 'prospect', description TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (client_id) REFERENCES clients(id)
      );
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER, assigned_to INTEGER, title TEXT NOT NULL, due_date DATETIME, completed BOOLEAN DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (client_id) REFERENCES clients(id), FOREIGN KEY (assigned_to) REFERENCES users(id)
      );
      CREATE TABLE IF NOT EXISTS interactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER, type TEXT, content TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (client_id) REFERENCES clients(id)
      );
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, role TEXT DEFAULT 'member', avatar TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS invitations (
        id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL, role TEXT DEFAULT 'member', status TEXT DEFAULT 'pending', created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, date TEXT NOT NULL, clock_in DATETIME, clock_out DATETIME, FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    try { db.exec("ALTER TABLE tasks ADD COLUMN assigned_to INTEGER REFERENCES users(id)"); } catch (e) {}

    const clientCount = db.prepare("SELECT COUNT(*) as count FROM clients").get();
    if (clientCount.count === 0) {
      const ic = db.prepare("INSERT INTO clients (name, email, phone, company, address) VALUES (?, ?, ?, ?, ?)");
      const id2 = db.prepare("INSERT INTO deals (client_id, title, value, status, description) VALUES (?, ?, ?, ?, ?)");
      const it = db.prepare("INSERT INTO tasks (client_id, title, due_date, assigned_to) VALUES (?, ?, ?, ?)");
      const ii = db.prepare("INSERT INTO interactions (client_id, type, content) VALUES (?, ?, ?)");
      const c1 = ic.run("Kov\u00e1cs J\u00e1nos", "janos@kovacsbt.hu", "+36 30 123 4567", "Kov\u00e1cs \u00e9s T\u00e1rsa Bt.", "1051 Budapest, Sas utca 1.").lastInsertRowid;
      const c2 = ic.run("Nagy Erzs\u00e9bet", "erzsi@nagydesign.hu", "+36 20 987 6543", "Nagy Design Kft.", "4024 Debrecen, Piac utca 10.").lastInsertRowid;
      const adminId = db.prepare("INSERT INTO users (name, email, role, avatar) VALUES (?, ?, ?, ?)").run("Admin Felhaszn\u00e1l\u00f3", "admin@minicrm.hu", "admin", "https://picsum.photos/seed/admin/100/100").lastInsertRowid;
      id2.run(c1, "Weboldal fel\u00faj\u00edt\u00e1s", 450000, "offer_sent", "Teljes reszponz\u00edv \u00e1talak\u00edt\u00e1s");
      id2.run(c1, "SEO optimaliz\u00e1l\u00e1s", 120000, "won", "Havi k\u00f6vet\u00e9ssel");
      id2.run(c2, "Arculattervez\u00e9s", 300000, "prospect", "Log\u00f3, n\u00e9vjegyk\u00e1rtya, social media");
      it.run(c1, "Aj\u00e1nlat k\u00f6vet\u00e9se telefonon", new Date(Date.now() + 86400000).toISOString(), adminId);
      it.run(c2, "Els\u0151 konzult\u00e1ci\u00f3 id\u0151pont egyeztet\u00e9s", new Date(Date.now() + 172800000).toISOString(), adminId);
      ii.run(c1, "call", "\u00c9rdekl\u0151d\u00f6tt a weboldal csomagok ir\u00e1nt, k\u00e9rt egy r\u00e9szletes aj\u00e1nlatot.");
      ii.run(c1, "email", "Aj\u00e1nlat elk\u00fcldve a megadott e-mail c\u00edmre.");
    }
    console.log("Database initialized successfully");
  } catch (e) {
    dbError = e.message || String(e);
    console.error("Database initialization failed:", dbError);
  }

  function q(fn, fallback) {
    if (fallback === undefined) fallback = [];
    if (!db) return fallback;
    try { return fn(); } catch (e) { return fallback; }
  }

  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);
  app.use(express.json());

  // Health check - FIRST route
  app.get("/api/health", (req, res) => {
    const dp = path.join(__dirname, "dist");
    res.json({ status: "ok", db: db ? "connected" : "error: " + dbError, distExists: fs.existsSync(dp), distFiles: fs.existsSync(dp) ? fs.readdirSync(dp) : [], nodeVersion: process.version, env: process.env.NODE_ENV || "not set" });
  });

  app.get("/api/me", (req, res) => { res.json(q(() => db.prepare("SELECT * FROM users LIMIT 1").get(), null)); });
  app.get("/api/users", (req, res) => { res.json(q(() => db.prepare("SELECT * FROM users").all())); });
  app.get("/api/invitations", (req, res) => { res.json(q(() => db.prepare("SELECT * FROM invitations ORDER BY created_at DESC").all())); });
  app.post("/api/invitations", (req, res) => { const { email, role } = req.body; const r = q(() => db.prepare("INSERT INTO invitations (email, role) VALUES (?, ?)").run(email, role), null); res.json(r ? { id: r.lastInsertRowid } : { error: "DB unavailable" }); });
  app.get("/api/attendance", (req, res) => { res.json(q(() => db.prepare("SELECT attendance.*, users.name as user_name FROM attendance JOIN users ON attendance.user_id = users.id ORDER BY date DESC, clock_in DESC").all())); });
  app.post("/api/attendance/clock-in", (req, res) => { const { user_id } = req.body; const today = new Date().toISOString().split("T")[0]; const r = q(() => db.prepare("INSERT INTO attendance (user_id, date, clock_in) VALUES (?, ?, ?)").run(user_id, today, new Date().toISOString()), null); res.json(r ? { id: r.lastInsertRowid } : { error: "DB unavailable" }); });
  app.post("/api/attendance/clock-out", (req, res) => { const { id } = req.body; q(() => db.prepare("UPDATE attendance SET clock_out = ? WHERE id = ?").run(new Date().toISOString(), id)); res.json({ success: true }); });
  app.get("/api/clients", (req, res) => { res.json(q(() => db.prepare("SELECT * FROM clients ORDER BY created_at DESC").all())); });
  app.post("/api/clients", (req, res) => { const { name, email, phone, company, address } = req.body; const r = q(() => db.prepare("INSERT INTO clients (name, email, phone, company, address) VALUES (?, ?, ?, ?, ?)").run(name, email, phone, company, address), null); res.json(r ? { id: r.lastInsertRowid } : { error: "DB unavailable" }); });
  app.get("/api/clients/:id", (req, res) => { const client = q(() => db.prepare("SELECT * FROM clients WHERE id = ?").get(req.params.id), {}); const deals = q(() => db.prepare("SELECT * FROM deals WHERE client_id = ?").all(req.params.id)); const tasks = q(() => db.prepare("SELECT * FROM tasks WHERE client_id = ?").all(req.params.id)); const interactions = q(() => db.prepare("SELECT * FROM interactions WHERE client_id = ? ORDER BY created_at DESC").all(req.params.id)); res.json({ ...client, deals, tasks, interactions }); });
  app.get("/api/deals", (req, res) => { res.json(q(() => db.prepare("SELECT deals.*, clients.name as client_name FROM deals JOIN clients ON deals.client_id = clients.id ORDER BY deals.created_at DESC").all())); });
  app.post("/api/deals", (req, res) => { const { client_id, title, value, status, description } = req.body; const r = q(() => db.prepare("INSERT INTO deals (client_id, title, value, status, description) VALUES (?, ?, ?, ?, ?)").run(client_id, title, value, status, description), null); res.json(r ? { id: r.lastInsertRowid } : { error: "DB unavailable" }); });
  app.get("/api/tasks", (req, res) => { res.json(q(() => db.prepare("SELECT tasks.*, clients.name as client_name, users.name as assignee_name FROM tasks JOIN clients ON tasks.client_id = clients.id LEFT JOIN users ON tasks.assigned_to = users.id ORDER BY due_date ASC").all())); });
  app.post("/api/tasks", (req, res) => { const { client_id, title, due_date, assigned_to } = req.body; const r = q(() => db.prepare("INSERT INTO tasks (client_id, title, due_date, assigned_to) VALUES (?, ?, ?, ?)").run(client_id, title, due_date, assigned_to), null); res.json(r ? { id: r.lastInsertRowid } : { error: "DB unavailable" }); });
  app.patch("/api/tasks/:id/complete", (req, res) => { q(() => db.prepare("UPDATE tasks SET completed = 1 WHERE id = ?").run(req.params.id)); res.json({ success: true }); });
  app.post("/api/interactions", (req, res) => { const { client_id, type, content } = req.body; const r = q(() => db.prepare("INSERT INTO interactions (client_id, type, content) VALUES (?, ?, ?)").run(client_id, type, content), null); res.json(r ? { id: r.lastInsertRowid } : { error: "DB unavailable" }); });
  app.post("/api/email/send", (req, res) => { const { client_id, subject, body } = req.body; q(() => db.prepare("INSERT INTO interactions (client_id, type, content) VALUES (?, ?, ?)").run(client_id, "email", "KIKULDOTT EMAIL: " + subject + "\n\n" + body)); res.json({ success: true, message: "Email elkuldve (szimulalt)" }); });
  app.post("/api/invoicing/create-draft", (req, res) => { res.json({ success: true, message: "Draft created (Simulated)" }); });

  // Static files
  const distPath = path.join(__dirname, "dist");
  console.log("dist path:", distPath, "exists:", fs.existsSync(distPath));
  if (fs.existsSync(distPath)) {
    console.log("dist contents:", fs.readdirSync(distPath));
  }

  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    const indexPath = path.join(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(500).send("<html><body><h1>Zenith-CRM</h1><p>dist/index.html not found</p><p>dist exists: " + fs.existsSync(distPath) + "</p><p>__dirname: " + __dirname + "</p><p>files in __dirname: " + (fs.existsSync(__dirname) ? fs.readdirSync(__dirname).join(", ") : "N/A") + "</p><p>DB: " + (db ? "ok" : dbError) + "</p></body></html>");
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on http://localhost:" + PORT);
  });
}

main().catch(async (err) => {
  console.error("FATAL:", err);
  // Even if main() crashes, start a minimal server
  import("express").then((mod) => {
    const app2 = mod.default();
    const PORT = parseInt(process.env.PORT || "3000", 10);
    app2.get("*", (req, res) => {
      res.status(500).send("<html><body><h1>Zenith-CRM - Server Error</h1><pre>" + String(err) + "\n" + (err.stack || "") + "</pre></body></html>");
    });
    app2.listen(PORT, "0.0.0.0", () => {
      console.log("Emergency server running on port " + PORT);
    });
  });
});
