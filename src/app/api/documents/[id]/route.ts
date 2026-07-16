import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session-server";
import { getDb, logActivity } from "@/lib/db";
import { canManageDocuments } from "@/lib/admin";
import { generateInvoiceData } from "@/lib/services";
import { v4 as uuidv4 } from "uuid";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!canManageDocuments(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const db = getDb();
  const doc = db
    .prepare(
      `SELECT d.*, c.name as client_name FROM documents d JOIN clients c ON c.id = d.client_id WHERE d.id = ?`
    )
    .get(id);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ document: doc });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!canManageDocuments(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await request.json();
  const db = getDb();
  const existing = db.prepare(`SELECT * FROM documents WHERE id = ?`).get(id) as {
    client_id: string;
    type: string;
  } | undefined;
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  db.prepare(
    `UPDATE documents SET title = ?, content_json = ?, signed = ? WHERE id = ?`
  ).run(
    body.title,
    JSON.stringify(body.docData ? { docData: body.docData } : body.content_json ?? {}),
    body.signed ?? 0,
    id
  );

  if (existing.type === "invoice" && body.docData?.lineItems) {
    const { subtotal, gst_amount, total } = generateInvoiceData(
      existing.client_id,
      body.docData.lineItems.map((i: { desc: string; rate: string; qty: string }) => ({
        description: i.desc,
        amount: (Number(i.qty) || 0) * (Number(i.rate) || 0),
      }))
    );
    db.prepare(
      `UPDATE invoices SET line_items_json = ?, subtotal = ?, gst_amount = ?, total = ? WHERE document_id = ?`
    ).run(JSON.stringify(body.docData.lineItems), subtotal, gst_amount, total, id);
  }

  logActivity("document", id, user!.id, "updated", body.title);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!canManageDocuments(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const db = getDb();
  db.prepare(`DELETE FROM invoices WHERE document_id = ?`).run(id);
  db.prepare(`DELETE FROM documents WHERE id = ?`).run(id);
  logActivity("document", id, user!.id, "deleted", id);
  return NextResponse.json({ ok: true });
}
