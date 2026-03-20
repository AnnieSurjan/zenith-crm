import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let db = null;
let dbError = null;
try {
  const Database = (await import("better-sqlite3")).default;
  db = new Database("crm.db");
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
      status TEXT DEFAULT 'prospect',
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
      type TEXT,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT DEFAULT 'member',
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invitations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      role TEXT DEFAULT 'member',
      status TEXT DEFAULT 'pending',
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
  try {
    db.exec("ALTER TABLE tasks ADD COLUMN assigned_to INTEGER REFERENCES users(id)");
  } catch (e) {
  }
  const clientCount = db.prepare("SELECT COUNT(*) as count FROM clients").get();
  if (clientCount.count === 0) {
    const insertClient = db.prepare("INSERT INTO clients (name, email, phone, company, address) VALUES (?, ?, ?, ?, ?)");
    const insertDeal = db.prepare("INSERT INTO deals (client_id, title, value, status, description) VALUES (?, ?, ?, ?, ?)");
    const insertTask = db.prepare("INSERT INTO tasks (client_id, title, due_date, assigned_to) VALUES (?, ?, ?, ?)");
    const insertInteraction = db.prepare("INSERT INTO interactions (client_id, type, content) VALUES (?, ?, ?)");
    const c1 = insertClient.run("Kov\xE1cs J\xE1nos", "janos@kovacsbt.hu", "+36 30 123 4567", "Kov\xE1cs \xE9s T\xE1rsa Bt.", "1051 Budapest, Sas utca 1.").lastInsertRowid;
    const c2 = insertClient.run("Nagy Erzs\xE9bet", "erzsi@nagydesign.hu", "+36 20 987 6543", "Nagy Design Kft.", "4024 Debrecen, Piac utca 10.").lastInsertRowid;
    const adminId = db.prepare("INSERT INTO users (name, email, role, avatar) VALUES (?, ?, ?, ?)").run(
      "Admin Felhaszn\xE1l\xF3",
      "admin@minicrm.hu",
      "admin",
      "https://picsum.photos/seed/admin/100/100"
    ).lastInsertRowid;
    insertDeal.run(c1, "Weboldal fel\xFAj\xEDt\xE1s", 45e4, "offer_sent", "Teljes reszponz\xEDv \xE1talak\xEDt\xE1s");
    insertDeal.run(c1, "SEO optimaliz\xE1l\xE1s", 12e4, "won", "Havi k\xF6vet\xE9ssel");
    insertDeal.run(c2, "Arculattervez\xE9s", 3e5, "prospect", "Log\xF3, n\xE9vjegyk\xE1rtya, social media");
    insertTask.run(c1, "Aj\xE1nlat k\xF6vet\xE9se telefonon", new Date(Date.now() + 864e5).toISOString(), adminId);
    insertTask.run(c2, "Els\u0151 konzult\xE1ci\xF3 id\u0151pont egyeztet\xE9s", new Date(Date.now() + 1728e5).toISOString(), adminId);
    insertInteraction.run(c1, "call", "\xC9rdekl\u0151d\xF6tt a weboldal csomagok ir\xE1nt, k\xE9rt egy r\xE9szletes aj\xE1nlatot.");
    insertInteraction.run(c1, "email", "Aj\xE1nlat elk\xFCldve a megadott e-mail c\xEDmre.");
  }
  console.log("Database initialized successfully");
} catch (e) {
  dbError = e.message || String(e);
  console.error("Database initialization failed:", dbError);
  console.error("The server will start without database support.");
}
function dbQuery(fn, fallback = []) {
  if (!db) return fallback;
  try {
    return fn();
  } catch (e) {
    return fallback;
  }
}
const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
app.use(express.json());
app.get("/api/health", (req, res) => {
  const distPath2 = path.join(__dirname, "dist");
  res.json({
    status: "ok",
    db: db ? "connected" : `error: ${dbError}`,
    distExists: fs.existsSync(distPath2),
    distFiles: fs.existsSync(distPath2) ? fs.readdirSync(distPath2) : [],
    nodeVersion: process.version,
    env: process.env.NODE_ENV || "not set"
  });
});
app.get("/api/me", (req, res) => {
  res.json(dbQuery(() => db.prepare("SELECT * FROM users LIMIT 1").get(), null));
});
app.get("/api/users", (req, res) => {
  res.json(dbQuery(() => db.prepare("SELECT * FROM users").all()));
});
app.get("/api/invitations", (req, res) => {
  res.json(dbQuery(() => db.prepare("SELECT * FROM invitations ORDER BY created_at DESC").all()));
});
app.post("/api/invitations", (req, res) => {
  const { email, role } = req.body;
  const result = dbQuery(() => db.prepare("INSERT INTO invitations (email, role) VALUES (?, ?)").run(email, role), null);
  res.json(result ? { id: result.lastInsertRowid } : { error: "DB unavailable" });
});
app.get("/api/attendance", (req, res) => {
  res.json(dbQuery(() => db.prepare(`
    SELECT attendance.*, users.name as user_name
    FROM attendance
    JOIN users ON attendance.user_id = users.id
    ORDER BY date DESC, clock_in DESC
  `).all()));
});
app.post("/api/attendance/clock-in", (req, res) => {
  const { user_id } = req.body;
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const result = dbQuery(() => db.prepare("INSERT INTO attendance (user_id, date, clock_in) VALUES (?, ?, ?)").run(user_id, today, (/* @__PURE__ */ new Date()).toISOString()), null);
  res.json(result ? { id: result.lastInsertRowid } : { error: "DB unavailable" });
});
app.post("/api/attendance/clock-out", (req, res) => {
  const { id } = req.body;
  dbQuery(() => db.prepare("UPDATE attendance SET clock_out = ? WHERE id = ?").run((/* @__PURE__ */ new Date()).toISOString(), id));
  res.json({ success: true });
});
app.get("/api/clients", (req, res) => {
  res.json(dbQuery(() => db.prepare("SELECT * FROM clients ORDER BY created_at DESC").all()));
});
app.post("/api/clients", (req, res) => {
  const { name, email, phone, company, address } = req.body;
  const result = dbQuery(() => db.prepare("INSERT INTO clients (name, email, phone, company, address) VALUES (?, ?, ?, ?, ?)").run(name, email, phone, company, address), null);
  res.json(result ? { id: result.lastInsertRowid } : { error: "DB unavailable" });
});
app.get("/api/clients/:id", (req, res) => {
  const client = dbQuery(() => db.prepare("SELECT * FROM clients WHERE id = ?").get(req.params.id), {});
  const deals = dbQuery(() => db.prepare("SELECT * FROM deals WHERE client_id = ?").all(req.params.id));
  const tasks = dbQuery(() => db.prepare("SELECT * FROM tasks WHERE client_id = ?").all(req.params.id));
  const interactions = dbQuery(() => db.prepare("SELECT * FROM interactions WHERE client_id = ? ORDER BY created_at DESC").all(req.params.id));
  res.json({ ...client, deals, tasks, interactions });
});
app.get("/api/deals", (req, res) => {
  res.json(dbQuery(() => db.prepare(`
    SELECT deals.*, clients.name as client_name
    FROM deals
    JOIN clients ON deals.client_id = clients.id
    ORDER BY deals.created_at DESC
  `).all()));
});
app.post("/api/deals", (req, res) => {
  const { client_id, title, value, status, description } = req.body;
  const result = dbQuery(() => db.prepare("INSERT INTO deals (client_id, title, value, status, description) VALUES (?, ?, ?, ?, ?)").run(client_id, title, value, status, description), null);
  res.json(result ? { id: result.lastInsertRowid } : { error: "DB unavailable" });
});
app.get("/api/tasks", (req, res) => {
  res.json(dbQuery(() => db.prepare(`
    SELECT tasks.*, clients.name as client_name, users.name as assignee_name
    FROM tasks
    JOIN clients ON tasks.client_id = clients.id
    LEFT JOIN users ON tasks.assigned_to = users.id
    ORDER BY due_date ASC
  `).all()));
});
app.post("/api/tasks", (req, res) => {
  const { client_id, title, due_date, assigned_to } = req.body;
  const result = dbQuery(() => db.prepare("INSERT INTO tasks (client_id, title, due_date, assigned_to) VALUES (?, ?, ?, ?)").run(client_id, title, due_date, assigned_to), null);
  res.json(result ? { id: result.lastInsertRowid } : { error: "DB unavailable" });
});
app.patch("/api/tasks/:id/complete", (req, res) => {
  dbQuery(() => db.prepare("UPDATE tasks SET completed = 1 WHERE id = ?").run(req.params.id));
  res.json({ success: true });
});
app.post("/api/interactions", (req, res) => {
  const { client_id, type, content } = req.body;
  const result = dbQuery(() => db.prepare("INSERT INTO interactions (client_id, type, content) VALUES (?, ?, ?)").run(client_id, type, content), null);
  res.json(result ? { id: result.lastInsertRowid } : { error: "DB unavailable" });
});
app.post("/api/email/send", (req, res) => {
  const { client_id, subject, body } = req.body;
  console.log(`Sending email to client ${client_id}: [${subject}]`);
  dbQuery(() => db.prepare("INSERT INTO interactions (client_id, type, content) VALUES (?, ?, ?)").run(
    client_id,
    "email",
    `KIK\xDCLD\xD6TT EMAIL: ${subject}

${body}`
  ));
  res.json({ success: true, message: "Email elk\xFCldve (szimul\xE1lt)" });
});
app.post("/api/invoicing/create-draft", (req, res) => {
  const { deal_id, provider } = req.body;
  console.log(`Creating draft invoice for deal ${deal_id} via ${provider}`);
  res.json({ success: true, message: `Draft created in ${provider} (Simulated)` });
});
const distPath = path.join(__dirname, "dist");
const distExists = fs.existsSync(distPath);
console.log(`Mode: production, dist exists: ${distExists}, NODE_ENV: ${process.env.NODE_ENV}, DB: ${db ? "ok" : "failed"}`);
app.use(express.static(distPath));
app.get("*", (req, res) => {
  const indexPath = path.join(distPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send(`
      <html><body style="font-family:sans-serif;padding:40px">
        <h1>Zenith-CRM</h1>
        <p>dist/ folder not found. Check build.</p>
        <p>DB: ${db ? "connected" : dbError}</p>
        <p>dist exists: ${distExists}</p>
        <p>__dirname: ${__dirname}</p>
        <p>files: ${fs.existsSync(__dirname) ? fs.readdirSync(__dirname).join(", ") : "N/A"}</p>
      </body></html>
    `);
  }
});
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
