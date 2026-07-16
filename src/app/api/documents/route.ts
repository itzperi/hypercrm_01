import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session-server";
import { getDb, logActivity } from "@/lib/db";
import { generateInvoiceData } from "@/lib/services";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role === "client" || user.role === "tech_employee") {
    if (user?.role !== "sales_employee" && user?.role !== "ceo_admin" && user?.role !== "cto_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  const db = getDb();
  const clientId = request.nextUrl.searchParams.get("client_id");
  if (clientId) {
    const docs = db
      .prepare(`SELECT * FROM documents WHERE client_id = ? ORDER BY type, version DESC`)
      .all(clientId);
    return NextResponse.json({ documents: docs });
  }
  const docs = db
    .prepare(
      `SELECT d.*, c.name as client_name FROM documents d JOIN clients c ON c.id = d.client_id ORDER BY d.created_at DESC`
    )
    .all();
  return NextResponse.json({ documents: docs });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ceo_admin" && user.role !== "cto_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json();
  const db = getDb();
  const client = db.prepare(`SELECT * FROM clients WHERE id = ?`).get(body.client_id) as {
    name: string;
    offer: string;
    retainer_amount: number;
    setup_fee: number;
  } | undefined;
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const content = body.docData
    ? { docData: body.docData }
    : {
        client_name: client.name,
        offer: body.offer || client.offer,
        problem_statement: body.problem_statement || "",
        deliverables: body.deliverables || [],
        timeline: body.timeline || "",
        success_metrics: body.success_metrics || "",
        setup_fee: body.setup_fee ?? client.setup_fee,
        monthly_retainer: body.monthly_retainer ?? client.retainer_amount,
        roi_projection: body.roi_projection || "",
        term_length: body.term_length || "12 months",
        payment_terms: body.payment_terms || "Net 15",
        cancellation_notice: body.cancellation_notice || "30 days",
        line_items: body.line_items || [
          { description: "Monthly Retainer", amount: client.retainer_amount },
        ],
      };

  const lineItemsForInvoice = body.docData?.lineItems
    ? body.docData.lineItems.map((i: { desc: string; qty: string; rate: string }) => ({
        description: i.desc,
        amount: (Number(i.qty) || 0) * (Number(i.rate) || 0),
      }))
    : content.line_items;

  const existing = db
    .prepare(`SELECT MAX(version) as v FROM documents WHERE client_id = ? AND type = ?`)
    .get(body.client_id, body.type) as { v: number | null };
  const version = (existing?.v ?? 0) + 1;

  const id = uuidv4();
  db.prepare(
    `INSERT INTO documents (id, client_id, type, title, content_json, version, signed)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    body.client_id,
    body.type,
    body.title || `${body.type.toUpperCase()} - ${client.name} v${version}`,
    JSON.stringify(content),
    version,
    0
  );

  if (body.type === "invoice") {
    const { subtotal, gst_amount, total } = generateInvoiceData(
      body.client_id,
      lineItemsForInvoice
    );
    const invoiceId = uuidv4();
    const dueDate = body.due_date || new Date(Date.now() + 15 * 86400000).toISOString();
    db.prepare(
      `INSERT INTO invoices (id, client_id, document_id, line_items_json, subtotal, gst_amount, total, due_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      invoiceId,
      body.client_id,
      id,
      JSON.stringify(lineItemsForInvoice),
      subtotal,
      gst_amount,
      total,
      dueDate,
      "unpaid"
    );
    logActivity("invoice", invoiceId, user.id, "created", String(total));
    return NextResponse.json({ id, invoiceId, subtotal, gst_amount, total });
  }

  logActivity("document", id, user.id, "created", body.type);
  return NextResponse.json({ id, version });
}
