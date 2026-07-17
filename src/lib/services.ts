import { getDb } from "./db";
import { currentMonth, isInCurrentMonth, isDateToday, calcGst } from "./utils";

export function getCeoDashboard(userId: string) {
  const db = getDb();
  const month = currentMonth();

  const salesTarget = db
    .prepare(
      `SELECT * FROM sales_targets WHERE (user_id = ? OR user_id IS NULL) AND month = ? ORDER BY user_id DESC LIMIT 1`
    )
    .get(userId, month) as { target_amount: number; achieved_amount: number } | undefined;

  const closedWon = db
    .prepare(
      `SELECT COALESCE(SUM(value), 0) as total FROM leads WHERE stage = 'closed_won' AND updated_at LIKE ?`
    )
    .get(`${month}%`) as { total: number };

  const paymentsIn = db
    .prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE paid_at LIKE ?`)
    .get(`${month}%`) as { total: number };

  const expensesOut = db
    .prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE paid_at LIKE ?`)
    .get(`${month}%`) as { total: number };

  const gstTotal = db
    .prepare(`SELECT COALESCE(SUM(gst_amount), 0) as total FROM payments WHERE paid_at LIKE ?`)
    .get(`${month}%`) as { total: number };

  const gstBreakdown = db
    .prepare(
      `SELECT p.id, p.amount, p.gst_amount, p.paid_at, c.name as client_name
       FROM payments p JOIN clients c ON c.id = p.client_id
       WHERE p.paid_at LIKE ? ORDER BY p.paid_at DESC`
    )
    .all(`${month}%`) as Array<{
    id: string;
    amount: number;
    gst_amount: number;
    paid_at: string;
    client_name: string;
  }>;

  const clients = db
    .prepare(
      `SELECT id, name, retainer_amount, last_payment_date, payment_status FROM clients WHERE stage = 'active'`
    )
    .all() as Array<{
    id: string;
    name: string;
    retainer_amount: number;
    last_payment_date: string | null;
    payment_status: string;
  }>;

  const meetingsToday = db
    .prepare(`SELECT m.*, l.name as lead_name FROM meetings m LEFT JOIN leads l ON l.id = m.lead_id WHERE date(m.scheduled_at) = date('now')`)
    .all();

  const callsToday = db
    .prepare(`SELECT COUNT(*) as c FROM call_logs WHERE date(logged_at) = date('now')`)
    .get() as { c: number };

  const callOutcomes = db
    .prepare(
      `SELECT outcome, COUNT(*) as c FROM call_logs WHERE date(logged_at) = date('now') GROUP BY outcome`
    )
    .all() as Array<{ outcome: string; c: number }>;

  const emailsToday = db
    .prepare(
      `SELECT COALESCE(SUM(sent_count), 0) as sent, COALESCE(SUM(reply_count), 0) as replies FROM email_logs WHERE date(logged_at) = date('now')`
    )
    .get() as { sent: number; replies: number };

  const funnel = db
    .prepare(`SELECT stage, COUNT(*) as c FROM leads GROUP BY stage`)
    .all() as Array<{ stage: string; c: number }>;

  const contentWeek = db
    .prepare(
      `SELECT * FROM content_items WHERE due_date >= date('now') AND due_date <= date('now', '+7 days') ORDER BY due_date`
    )
    .all();

  const clientStats = db
    .prepare(
      `SELECT stage, COUNT(*) as c FROM clients GROUP BY stage`
    )
    .all() as Array<{ stage: string; c: number }>;

  const activeClients = db
    .prepare(`SELECT COUNT(*) as c FROM clients WHERE stage = 'active'`)
    .get() as { c: number };

  const recurringNew = db
    .prepare(
      `SELECT COALESCE(SUM(value), 0) as total FROM leads WHERE stage = 'closed_won' AND updated_at LIKE ?`
    )
    .get(`${month}%`) as { total: number };

  return {
    sales: {
      target: salesTarget?.target_amount ?? 500000,
      achieved: closedWon.total || salesTarget?.achieved_amount || 0,
      newMrr: recurringNew.total,
      recurringMrr: paymentsIn.total,
    },
    cashFlow: {
      moneyIn: paymentsIn.total,
      moneyOut: expensesOut.total,
      net: paymentsIn.total - expensesOut.total,
    },
    gst: { total: gstTotal.total, breakdown: gstBreakdown },
    recurringClients: clients.map((c) => {
      let status = c.payment_status;
      if (c.last_payment_date) {
        const daysSince = Math.floor(
          (Date.now() - new Date(c.last_payment_date).getTime()) / 86400000
        );
        if (daysSince > 35) status = "overdue";
        else if (daysSince > 30) status = "due";
      }
      return { ...c, status };
    }),
    meetingsToday,
    callsToday: callsToday.c,
    callOutcomes,
    emailsToday,
    funnel,
    contentWeek,
    clientStats,
    activeClients: activeClients.c,
  };
}

export function getCtoDashboard() {
  const db = getDb();
  const projects = db
    .prepare(
      `SELECT p.*, c.name as client_name FROM projects p JOIN clients c ON c.id = p.client_id WHERE p.status = 'active' ORDER BY p.deadline`
    )
    .all() as Array<{
    id: string;
    name: string;
    client_name: string;
    percent_complete: number;
    health: string;
    deadline: string;
    status: string;
  }>;

  const teamWorkload = db
    .prepare(
      `SELECT u.id, u.name, COUNT(t.id) as task_count,
        SUM(CASE WHEN t.status != 'done' THEN 1 ELSE 0 END) as open_tasks
       FROM users u
       LEFT JOIN tasks t ON t.assignee_id = u.id
       WHERE u.role = 'tech_employee' OR u.role = 'cto_admin'
       GROUP BY u.id`
    )
    .all() as Array<{ name: string; task_count: number; open_tasks: number }>;

  const deadlines = db
    .prepare(
      `SELECT p.name, p.deadline, p.health, c.name as client_name FROM projects p
       JOIN clients c ON c.id = p.client_id
       WHERE p.deadline >= date('now') ORDER BY p.deadline LIMIT 10`
    )
    .all() as Array<{ name: string; deadline: string; health: string; client_name: string }>;

  return { projects, teamWorkload, deadlines };
}

export function getSalesDashboard(userId: string, isAdmin: boolean) {
  const db = getDb();
  const month = currentMonth();

  const leadsQuery = isAdmin
    ? `SELECT * FROM leads ORDER BY updated_at DESC`
    : `SELECT * FROM leads WHERE assigned_to = ? ORDER BY updated_at DESC`;
  const leads = isAdmin
    ? (db.prepare(leadsQuery).all() as unknown[])
    : (db.prepare(leadsQuery).all(userId) as unknown[]);

  const target = db
    .prepare(`SELECT * FROM sales_targets WHERE user_id = ? AND month = ?`)
    .get(userId, month) as { target_amount: number; achieved_amount: number } | undefined;

  const strategy = db.prepare(`SELECT * FROM sales_strategy`).all();

  const callsToday = db
    .prepare(
      isAdmin
        ? `SELECT * FROM call_logs WHERE date(logged_at) = date('now') ORDER BY logged_at DESC`
        : `SELECT * FROM call_logs WHERE user_id = ? AND date(logged_at) = date('now') ORDER BY logged_at DESC`
    )
    .all(...(isAdmin ? [] : [userId]));

  const meetings = db
    .prepare(
      `SELECT m.*, l.name as lead_name FROM meetings m LEFT JOIN leads l ON l.id = m.lead_id
       WHERE date(m.scheduled_at) >= date('now', '-7 days') ORDER BY m.scheduled_at`
    )
    .all();

  return { leads, target, strategy, callsToday, meetings };
}

export function getTechDashboard(userId: string) {
  const db = getDb();
  const projects = db
    .prepare(
      `SELECT DISTINCT p.*, c.name as client_name FROM projects p
       JOIN clients c ON c.id = p.client_id
       JOIN project_members pm ON pm.project_id = p.id
       WHERE pm.user_id = ? OR p.lead_id = ?
       ORDER BY p.deadline`
    )
    .all(userId, userId);

  const tasks = db
    .prepare(
      `SELECT t.*, p.name as project_name FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE t.assignee_id = ? AND t.status != 'done'
       ORDER BY t.due_date`
    )
    .all(userId);

  return { projects, tasks };
}

export function getClientPortalData(clientId: string) {
  const db = getDb();
  const client = db.prepare(`SELECT * FROM clients WHERE id = ?`).get(clientId);
  const projects = db
    .prepare(`SELECT * FROM projects WHERE client_id = ?`)
    .all(clientId);
  const tasks = db
    .prepare(
      `SELECT t.* FROM tasks t JOIN projects p ON p.id = t.project_id WHERE p.client_id = ? ORDER BY t.status, t.created_at`
    )
    .all(clientId);
  const documents = db
    .prepare(`SELECT * FROM documents WHERE client_id = ? ORDER BY created_at DESC`)
    .all(clientId);
  const invoices = db
    .prepare(`SELECT * FROM invoices WHERE client_id = ? ORDER BY created_at DESC`)
    .all(clientId);
  const payments = db
    .prepare(`SELECT * FROM payments WHERE client_id = ? ORDER BY paid_at DESC`)
    .all(clientId);
  const updates = db
    .prepare(
      `SELECT cu.*, u.name as author_name FROM client_updates cu
       JOIN users u ON u.id = cu.user_id
       WHERE cu.client_id = ? ORDER BY cu.created_at DESC LIMIT 10`
    )
    .all(clientId);

  const totalTasks = tasks.length;
  const doneTasks = (tasks as Array<{ status: string }>).filter((t) => t.status === "done").length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const teamMembers = db
    .prepare(
      `SELECT DISTINCT u.id, u.name, u.role, p.name as project_name
       FROM users u
       JOIN project_members pm ON pm.user_id = u.id
       JOIN projects p ON p.id = pm.project_id
       WHERE p.client_id = ?
       UNION
       SELECT DISTINCT u.id, u.name, u.role, p.name as project_name
       FROM users u
       JOIN projects p ON p.lead_id = u.id
       WHERE p.client_id = ?`
    )
    .all(clientId, clientId) as Array<{ id: string; name: string; role: string; project_name: string }>;

  const portalUser = db
    .prepare(`SELECT username FROM users WHERE client_id = ? AND role = 'client'`)
    .get(clientId) as { username: string } | undefined;

  return { client, projects, tasks, documents, invoices, payments, updates, progress, teamMembers, portalUser };
}

export function getAllClients() {
  const db = getDb();
  return db
    .prepare(
      `SELECT c.*, u1.name as account_owner_name, u2.name as project_lead_name
       FROM clients c
       LEFT JOIN users u1 ON u1.id = c.account_owner_id
       LEFT JOIN users u2 ON u2.id = c.project_lead_id
       ORDER BY c.created_at DESC`
    )
    .all();
}

export function getClientStageCounts() {
  const db = getDb();
  return db.prepare(`SELECT stage, COUNT(*) as count FROM clients GROUP BY stage`).all();
}

export function getProjectWithDetails(projectId: string) {
  const db = getDb();
  const project = db
    .prepare(
      `SELECT p.*, c.name as client_name FROM projects p JOIN clients c ON c.id = p.client_id WHERE p.id = ?`
    )
    .get(projectId);
  const tasks = db
    .prepare(`SELECT t.*, u.name as assignee_name FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id WHERE t.project_id = ? ORDER BY t.status`)
    .all(projectId);
  const messages = db
    .prepare(
      `SELECT m.*, u.name as user_name FROM chat_messages m JOIN users u ON u.id = m.user_id WHERE m.project_id = ? ORDER BY m.created_at`
    )
    .all(projectId);
  const members = db
    .prepare(
      `SELECT u.id, u.name FROM project_members pm JOIN users u ON u.id = pm.user_id WHERE pm.project_id = ?`
    )
    .all(projectId);
  const activity = db
    .prepare(
      `SELECT a.*, u.name as user_name FROM activity_logs a LEFT JOIN users u ON u.id = a.user_id
       WHERE (a.entity_type = 'project' AND a.entity_id = ?) OR (a.entity_type = 'task' AND a.entity_id IN (SELECT id FROM tasks WHERE project_id = ?))
       ORDER BY a.created_at DESC LIMIT 50`
    )
    .all(projectId, projectId);

  return { project, tasks, messages, members, activity };
}

export function getContentItems() {
  const db = getDb();
  return db
    .prepare(
      `SELECT c.*, u.name as owner_name FROM content_items c LEFT JOIN users u ON u.id = c.owner_id ORDER BY c.due_date`
    )
    .all();
}

export function generateInvoiceData(clientId: string, lineItems: Array<{ description: string; amount: number }>) {
  const subtotal = lineItems.reduce((s, i) => s + i.amount, 0);
  const gst = calcGst(subtotal);
  return { subtotal, gst_amount: gst, total: subtotal + gst };
}
