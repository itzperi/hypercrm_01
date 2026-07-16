import { getDb } from "../src/lib/db";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

async function seed() {
  const db = getDb();

  const existing = db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number };
  if (existing.c > 0) {
    console.log("Database already seeded. Skipping.");
    return;
  }

  const periHash = await bcrypt.hash("Peri@007", 12);
  const mouneshHash = await bcrypt.hash("Mounesh@007", 12);

  const periId = uuidv4();
  const mouneshId = uuidv4();

  db.prepare(
    `INSERT INTO users (id, username, password_hash, name, role) VALUES (?, ?, ?, ?, ?)`
  ).run(periId, "Peri", periHash, "Peri", "ceo_admin");

  db.prepare(
    `INSERT INTO users (id, username, password_hash, name, role) VALUES (?, ?, ?, ?, ?)`
  ).run(mouneshId, "Mounesh", mouneshHash, "Mounesh", "cto_admin");

  const month = new Date().toISOString().slice(0, 7);
  db.prepare(
    `INSERT INTO sales_targets (id, user_id, month, target_amount, achieved_amount) VALUES (?, ?, ?, ?, ?)`
  ).run(uuidv4(), periId, month, 500000, 0);

  const offers = ["10x_throughput", "500_hour_reclaim", "ai_visibility_engine"];
  for (const offer of offers) {
    db.prepare(`INSERT INTO sales_strategy (id, offer, notes) VALUES (?, ?, ?)`).run(
      uuidv4(),
      offer,
      `Strategy notes for ${offer}`
    );
  }

  // Sample leads
  const leadStages = ["lead", "contacted", "meeting_booked", "proposal_sent", "negotiation"];
  const companies = ["TechFlow Inc", "DataPulse", "GrowthLabs", "AutoScale Co", "Nexus Digital"];
  for (let i = 0; i < 5; i++) {
    db.prepare(
      `INSERT INTO leads (id, name, company, email, stage, offer, value, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      uuidv4(),
      `Lead Contact ${i + 1}`,
      companies[i],
      `contact${i + 1}@example.com`,
      leadStages[i % leadStages.length],
      offers[i % 3],
      (i + 1) * 50000,
      periId
    );
  }

  // Sample client
  const clientId = uuidv4();
  db.prepare(
    `INSERT INTO clients (id, name, email, offer, retainer_amount, setup_fee, stage, contract_start, renewal_date, payment_status, last_payment_date, account_owner_id, project_lead_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    clientId,
    "Acme Automation",
    "ceo@acme.com",
    "10x_throughput",
    75000,
    150000,
    "active",
    new Date(Date.now() - 60 * 86400000).toISOString(),
    new Date(Date.now() + 305 * 86400000).toISOString(),
    "paid",
    new Date(Date.now() - 5 * 86400000).toISOString(),
    periId,
    mouneshId
  );

  const projectId = uuidv4();
  db.prepare(
    `INSERT INTO projects (id, client_id, name, scope_summary, percent_complete, health, start_date, deadline, lead_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    projectId,
    clientId,
    "Acme AI Automation Build",
    "Implement 10x Throughput automation pipeline",
    45,
    "on_track",
    new Date(Date.now() - 30 * 86400000).toISOString(),
    new Date(Date.now() + 30 * 86400000).toISOString(),
    mouneshId
  );

  const tasks = [
    { title: "Discovery & requirements", status: "done", pct: 0 },
    { title: "Workflow mapping", status: "done", pct: 0 },
    { title: "API integrations", status: "in_progress", pct: 0 },
    { title: "Testing & QA", status: "todo", pct: 0 },
    { title: "Go-live & handoff", status: "todo", pct: 0 },
  ];
  for (const t of tasks) {
    db.prepare(
      `INSERT INTO tasks (id, project_id, title, status, assignee_id, priority) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(uuidv4(), projectId, t.title, t.status, mouneshId, "high");
  }

  // Sample content
  const platforms = ["LinkedIn", "Blog", "Email", "SEO/AEO"];
  const statuses = ["idea", "draft", "review", "scheduled"];
  for (let i = 0; i < 4; i++) {
    db.prepare(
      `INSERT INTO content_items (id, title, platform, status, owner_id, due_date, keyword)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      uuidv4(),
      `Content piece ${i + 1}`,
      platforms[i],
      statuses[i],
      periId,
      new Date(Date.now() + (i + 1) * 2 * 86400000).toISOString(),
      `keyword-${i + 1}`
    );
  }

  // Sample payments & expenses
  db.prepare(
    `INSERT INTO payments (id, client_id, amount, gst_amount, description) VALUES (?, ?, ?, ?, ?)`
  ).run(uuidv4(), clientId, 75000, 13500, "Monthly retainer - Acme");

  db.prepare(
    `INSERT INTO expenses (id, category, amount, description) VALUES (?, ?, ?, ?)`
  ).run(uuidv4(), "Tools", 15000, "SaaS subscriptions");
  db.prepare(
    `INSERT INTO expenses (id, category, amount, description) VALUES (?, ?, ?, ?)`
  ).run(uuidv4(), "Salaries", 120000, "Team payroll");

  console.log("✓ Database seeded successfully");
  console.log("  CEO: Peri / Peri@007");
  console.log("  CTO: Mounesh / Mounesh@007");
}

seed().catch(console.error);
