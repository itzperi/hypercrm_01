"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { AppShell } from "@/components/layout";
import { Card, Badge } from "@/components/ui";
import { Modal } from "@/components/admin/modal";
import { AddButton, Btn, Field, Input, Select, Textarea, RowActions } from "@/components/admin/actions";
import { DocRenderer } from "@/components/documents/doc-templates";
import { defaultDocData, docDataFromClient, type DocData } from "@/lib/doc-data";
import { downloadDocumentPdf } from "@/lib/pdf-download";
import { formatDate } from "@/lib/utils";
import { SessionUser } from "@/lib/types";
import { isExecutive } from "@/lib/admin";
import { FileText, Eye, Save } from "lucide-react";

const DOC_TYPES = [
  { id: "proposal", label: "Proposal" },
  { id: "sow", label: "Scope of Work" },
  { id: "contract", label: "Contract" },
  { id: "invoice", label: "Invoice" },
] as const;

type SavedDoc = {
  id: string;
  type: string;
  title: string;
  client_name: string;
  version: number;
  content_json: string;
  created_at: string;
  signed: number;
};

function parseDocData(raw: string): DocData | null {
  try {
    const parsed = JSON.parse(raw);
    return parsed.docData ?? parsed;
  } catch {
    return null;
  }
}

export default function DocumentsPage({ user }: { user: SessionUser }) {
  const [documents, setDocuments] = useState<SavedDoc[]>([]);
  const [clients, setClients] = useState<Array<{ id: string; name: string; retainer_amount?: number; setup_fee?: number; offer?: string }>>([]);
  const [mode, setMode] = useState<"list" | "editor">("list");
  const [docType, setDocType] = useState("proposal");
  const [clientId, setClientId] = useState("");
  const [docData, setDocData] = useState<DocData>(defaultDocData());
  const [editId, setEditId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const canManage = isExecutive(user);

  const load = useCallback(() => {
    fetch("/api/documents").then((r) => r.json()).then((d) => setDocuments(d.documents || []));
    fetch("/api/clients").then((r) => r.json()).then((d) => setClients(d.clients || []));
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew(type: string) {
    const client = clients.find((c) => c.id === clientId);
    setDocType(type);
    setDocData(client ? docDataFromClient(client) : defaultDocData());
    setEditId(null);
    setMode("editor");
  }

  function openEdit(doc: SavedDoc) {
    const data = parseDocData(doc.content_json);
    if (!data) return;
    setDocType(doc.type);
    setDocData(data);
    setEditId(doc.id);
    setClientId((JSON.parse(doc.content_json).client_id as string) || "");
    setMode("editor");
  }

  async function saveDocument() {
    if (!clientId) { alert("Select a client first"); return; }
    setSaving(true);
    const title = `${docType.toUpperCase()} — ${docData.client.company || docData.client.name}`;
    if (editId) {
      await fetch(`/api/documents/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, docData }),
      });
    } else {
      await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, type: docType, title, docData }),
      });
    }
    setSaving(false);
    setMode("list");
    load();
  }

  async function deleteDoc(id: string) {
    if (!confirm("Delete this document?")) return;
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    load();
  }

  async function downloadPdf(type: string, data: DocData, filename: string) {
    setDownloading(true);
    setDocType(type);
    setDocData(data);
    setPreviewOpen(true);
    await new Promise((r) => setTimeout(r, 400));
    if (previewRef.current) {
      const sheet = previewRef.current.querySelector(".doc-sheet") as HTMLElement;
      if (sheet) await downloadDocumentPdf(sheet, filename);
    }
    setDownloading(false);
    setPreviewOpen(false);
  }

  function updateList(key: keyof DocData, idx: number, value: string, subKey?: string) {
    setDocData((d) => {
      const copy = { ...d };
      const arr = [...(copy[key] as unknown[])] as Array<Record<string, string> | string>;
      if (subKey && typeof arr[idx] === "object") {
        arr[idx] = { ...(arr[idx] as Record<string, string>), [subKey]: value };
      } else {
        arr[idx] = value;
      }
      return { ...copy, [key]: arr };
    });
  }

  if (mode === "editor") {
    return (
      <AppShell user={user} title="Document Editor">
        <div className="flex items-center justify-between mb-6">
          <Btn variant="ghost" onClick={() => setMode("list")}>← Back to Documents</Btn>
          <div className="flex gap-2">
            <Btn variant="secondary" onClick={() => setPreviewOpen(true)}>
              <Eye className="w-3.5 h-3.5" /> Preview
            </Btn>
            <Btn onClick={saveDocument} disabled={saving}>
              <Save className="w-3.5 h-3.5" /> {saving ? "Saving…" : "Save Document"}
            </Btn>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card title="Document Setup">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Client">
                  <Select value={clientId} onChange={(e) => {
                    setClientId(e.target.value);
                    const c = clients.find((x) => x.id === e.target.value);
                    if (c) setDocData(docDataFromClient(c));
                  }}>
                    <option value="">Select client</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                </Field>
                <Field label="Document Type">
                  <Select value={docType} onChange={(e) => setDocType(e.target.value)}>
                    {DOC_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </Select>
                </Field>
              </div>
            </Card>

            <Card title="Client Details">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Contact Name"><Input value={docData.client.name} onChange={(e) => setDocData({ ...docData, client: { ...docData.client, name: e.target.value } })} /></Field>
                <Field label="Company"><Input value={docData.client.company} onChange={(e) => setDocData({ ...docData, client: { ...docData.client, company: e.target.value } })} /></Field>
                <Field label="GSTIN" className="col-span-2"><Input value={docData.client.gstin} onChange={(e) => setDocData({ ...docData, client: { ...docData.client, gstin: e.target.value } })} /></Field>
                <Field label="Address" className="col-span-2"><Textarea value={docData.client.address} onChange={(e) => setDocData({ ...docData, client: { ...docData.client, address: e.target.value } })} /></Field>
              </div>
            </Card>

            <Card title="Project">
              <div className="space-y-3">
                <Field label="Title"><Input value={docData.project.title} onChange={(e) => setDocData({ ...docData, project: { ...docData.project, title: e.target.value } })} /></Field>
                <Field label="Overview"><Textarea value={docData.project.overview} onChange={(e) => setDocData({ ...docData, project: { ...docData.project, overview: e.target.value } })} rows={4} /></Field>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Date"><Input value={docData.project.date} onChange={(e) => setDocData({ ...docData, project: { ...docData.project, date: e.target.value } })} /></Field>
                  <Field label="Valid Days"><Input value={docData.project.validDays} onChange={(e) => setDocData({ ...docData, project: { ...docData.project, validDays: e.target.value } })} /></Field>
                  <Field label="Due Date"><Input value={docData.project.dueDate} onChange={(e) => setDocData({ ...docData, project: { ...docData.project, dueDate: e.target.value } })} /></Field>
                </div>
              </div>
            </Card>

            <Card title="Deliverables">
              {docData.deliverables.map((d, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <Input value={d} onChange={(e) => updateList("deliverables", i, e.target.value)} />
                  <Btn variant="danger" onClick={() => setDocData({ ...docData, deliverables: docData.deliverables.filter((_, j) => j !== i) })}>×</Btn>
                </div>
              ))}
              <Btn variant="secondary" onClick={() => setDocData({ ...docData, deliverables: [...docData.deliverables, ""] })}>+ Add</Btn>
            </Card>

            {(docType === "sow") && (
              <>
                <Card title="In Scope">
                  {docData.inScope.map((d, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <Input value={d} onChange={(e) => updateList("inScope", i, e.target.value)} />
                    </div>
                  ))}
                  <Btn variant="secondary" onClick={() => setDocData({ ...docData, inScope: [...docData.inScope, ""] })}>+ Add</Btn>
                </Card>
                <Card title="Out of Scope">
                  {docData.outOfScope.map((d, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <Input value={d} onChange={(e) => updateList("outOfScope", i, e.target.value)} />
                    </div>
                  ))}
                  <Btn variant="secondary" onClick={() => setDocData({ ...docData, outOfScope: [...docData.outOfScope, ""] })}>+ Add</Btn>
                </Card>
                <Field label="Compliance Note"><Textarea value={docData.complianceNote} onChange={(e) => setDocData({ ...docData, complianceNote: e.target.value })} /></Field>
              </>
            )}

            <Card title="Line Items & Pricing">
              {docData.lineItems.map((item, i) => (
                <div key={i} className="grid grid-cols-4 gap-2 mb-2">
                  <Input className="col-span-2" placeholder="Description" value={item.desc} onChange={(e) => updateList("lineItems", i, e.target.value, "desc")} />
                  <Input placeholder="Qty" value={item.qty} onChange={(e) => updateList("lineItems", i, e.target.value, "qty")} />
                  <Input placeholder="Rate" value={item.rate} onChange={(e) => updateList("lineItems", i, e.target.value, "rate")} />
                </div>
              ))}
              <Btn variant="secondary" onClick={() => setDocData({ ...docData, lineItems: [...docData.lineItems, { desc: "", qty: "1", rate: "" }] })}>+ Line Item</Btn>
            </Card>
          </div>

          <div className="sticky top-24">
            <Card title="Live Preview">
              <div className="overflow-auto max-h-[calc(100vh-200px)] bg-[#E8ECF1] rounded-lg p-4">
                <div className="origin-top scale-[0.45] w-[210mm] mx-auto">
                  <DocRenderer type={docType} data={docData} />
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Modal open={previewOpen} onOpenChange={setPreviewOpen} title="Document Preview" wide>
          <div ref={previewRef} className="bg-[#E8ECF1] p-4 rounded-lg overflow-auto max-h-[70vh]">
            <DocRenderer type={docType} data={docData} />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Btn variant="secondary" onClick={() => setPreviewOpen(false)}>Close</Btn>
            <Btn disabled={downloading} onClick={() => downloadPdf(docType, docData, `${docType}-${docData.client.company || "doc"}.pdf`)}>
              {downloading ? "Generating…" : "Download PDF"}
            </Btn>
          </div>
        </Modal>
      </AppShell>
    );
  }

  return (
    <AppShell user={user} title="Documents">
      <div className="flex flex-wrap gap-3 mb-6">
        {canManage && DOC_TYPES.map((t) => (
          <AddButton key={t.id} label={`New ${t.label}`} onClick={() => { setClientId(""); openNew(t.id); }} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {DOC_TYPES.map((t) => (
          <div key={t.id} className="card p-5 border-l-4 border-l-brand-500">
            <FileText className="w-5 h-5 text-brand-600 mb-2" />
            <p className="font-display font-semibold text-sm">{t.label}</p>
            <p className="text-xs text-muted mt-1">{documents.filter((d) => d.type === t.id).length} saved</p>
          </div>
        ))}
      </div>

      <Card title="All Documents">
        <div className="space-y-3">
          {documents.map((d) => {
            const data = parseDocData(d.content_json);
            return (
              <div key={d.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-brand-200 transition-colors">
                <div>
                  <p className="font-medium text-sm">{d.title}</p>
                  <p className="text-xs text-muted">{d.client_name} · v{d.version} · {formatDate(d.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={d.signed ? "success" : "default"}>{d.type.toUpperCase()}</Badge>
                  {canManage && (
                    <RowActions
                      onEdit={() => openEdit(d)}
                      onDelete={() => deleteDoc(d.id)}
                      onDownload={data ? () => downloadPdf(d.type, data, `${d.type}-${d.client_name}.pdf`) : undefined}
                    />
                  )}
                </div>
              </div>
            );
          })}
          {documents.length === 0 && <p className="text-sm text-muted py-8 text-center">No documents yet. Create one using the brand templates above.</p>}
        </div>
      </Card>
    </AppShell>
  );
}
