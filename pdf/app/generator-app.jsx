/* ============================================================
   HYPERWRIKE — Document Generator App
   ============================================================ */
const { useState, useEffect, useRef, useCallback } = React;
const { ProposalDoc, ContractDoc, InvoiceDoc, compute, fmtMoney } = window.HWDocs;

const STORE_KEY = "hw_docgen_v1";

/* ---------- defaults ---------- */
function initials(s) {
  if (!s) return "CLT";
  const words = s.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function refCodes(data) {
  const ini = initials(data.client.company || data.client.name);
  const yr = (data.project.date || "").match(/\d{4}/)
    ? (data.project.date || "").match(/\d{4}/)[0]
    : "2026";
  return {
    refProposal: `HW-PROP-${ini}-${yr}-001`,
    refContract: `HW-CC-${ini}-${yr}-001`,
    refInvoice: `HW-INV-${ini}-${yr}-001`,
  };
}

const DEFAULT_DATA = {
  client: {
    name: "",
    company: "",
    address: "",
    gstin: "",
    logoDataUrl: "",
  },
  project: {
    title: "",
    overview: "",
    date: new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    validDays: "15",
    dueDate: "",
  },
  deliverables: [""],
  timeline: [{ phase: "", detail: "" }],
  lineItems: [{ desc: "", qty: "1", rate: "" }],
  commercials: {
    currency: "₹",
    gstEnabled: true,
    gstRate: "18",
    advancePct: "50",
    paymentNote: "",
    showPricing: true,
  },
  contract: {
    term: "12 months",
    noticeDays: "30",
    latePct: "1.5",
    governingLaw: "India",
    jurisdiction: "Chittoor, Andhra Pradesh",
  },
};

/* deep-ish clone */
const clone = (o) => JSON.parse(JSON.stringify(o));

/* ---------- sample data for quick demo ---------- */
const SAMPLE = {
  client: {
    name: "Dr. R. Subramanian",
    company: "VS Hospitals",
    address: "Chetpet, Chennai, Tamil Nadu — 600031",
    gstin: "33AABCV1234K1Z9",
    logoDataUrl: "",
  },
  project: {
    title: "AI Voice Agent & Patient CRM System",
    overview:
      "Hyperwrike will design, build and deploy an AI Voice Agent and integrated patient CRM for VS Hospitals. The system handles inbound appointment booking, outbound follow-ups, pre-appointment reminders and campaign communication across the hospital's branches, with English and Tanglish language support.",
    date: "13 June 2026",
    validDays: "15",
    dueDate: "20 June 2026",
  },
  deliverables: [
    "AI Voice Agent — inbound appointment booking & routing",
    "Outbound CRM-triggered follow-up & lead revival",
    "Pre-appointment reminder calls (1 hour before slot)",
    "FAQ handling — visiting hours, insurance, directions",
    "Zoho CRM integration — leads, notes, triggers",
    "Knowledge base — 30+ specialties, doctors, 5 campaigns",
    "English + Tanglish language support",
    "GPU-enabled server setup & telephony onboarding",
  ],
  timeline: [
    { phase: "Day 1–2", detail: "Server procurement, telephony & CRM account setup" },
    { phase: "Day 3–5", detail: "Knowledge base build + language model configuration" },
    { phase: "Day 6–9", detail: "Inbound, outbound & reminder flow development" },
    { phase: "Day 10–12", detail: "Campaign flows, chat system & CRM integration" },
    { phase: "Day 13", detail: "UAT, staff walkthrough & go-live" },
  ],
  lineItems: [
    { desc: "AI Voice Agent development (3 branches)", qty: "1", rate: "160000" },
  ],
  commercials: {
    currency: "₹",
    gstEnabled: true,
    gstRate: "18",
    advancePct: "50",
    paymentNote:
      "Telephony usage billed separately at actuals (no GST on per-minute charges). Balance due on go-live sign-off.",
    showPricing: true,
  },
  contract: {
    term: "12 months",
    noticeDays: "30",
    latePct: "1.5",
    governingLaw: "India",
    jurisdiction: "Chennai, Tamil Nadu",
  },
};

/* ---------- small UI atoms ---------- */
function Field({ label, hint, children, required, error }) {
  return (
    <label className={"fld" + (error ? " fld-err" : "")}>
      <span className="fld-label">
        {label} {required ? <span className="req">*</span> : null}
        {hint ? <span className="fld-hint">{hint}</span> : null}
      </span>
      {children}
      {error ? <span className="fld-error">{error}</span> : null}
    </label>
  );
}

function Section({ title, n, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={"fsec" + (open ? " open" : "")}>
      <button type="button" className="fsec-head" onClick={() => setOpen((o) => !o)}>
        <span className="fsec-n">{n}</span>
        <span className="fsec-title">{title}</span>
        <span className="fsec-chev">{open ? "−" : "+"}</span>
      </button>
      {open ? <div className="fsec-body">{children}</div> : null}
    </div>
  );
}

/* ---------- the app ---------- */
function App() {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return clone(DEFAULT_DATA);
  });
  const [tab, setTab] = useState("proposal");
  const [busy, setBusy] = useState(null); // null | docKey | 'all'
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  /* persist */
  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
      setSaved(true);
      const t = setTimeout(() => setSaved(false), 1200);
      return () => clearTimeout(t);
    } catch (e) {}
  }, [data]);

  /* derive refs */
  const refs = refCodes(data);
  const fullData = {
    ...data,
    project: { ...data.project, ...refs },
  };
  const m = compute(fullData);

  /* mutate helpers */
  const setPath = (group, key, value) =>
    setData((d) => ({ ...d, [group]: { ...d[group], [key]: value } }));

  const setList = (key, idx, field, value) =>
    setData((d) => {
      const arr = clone(d[key]);
      if (field == null) arr[idx] = value;
      else arr[idx] = { ...arr[idx], [field]: value };
      return { ...d, [key]: arr };
    });
  const addRow = (key, blank) =>
    setData((d) => ({ ...d, [key]: [...d[key], clone(blank)] }));
  const delRow = (key, idx) =>
    setData((d) => ({ ...d, [key]: d[key].filter((_, i) => i !== idx) }));

  /* logo upload */
  const onLogo = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      flash("Please choose an image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setPath("client", "logoDataUrl", e.target.result);
    reader.readAsDataURL(file);
  };

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  /* validation */
  const validate = () => {
    const e = {};
    if (!data.client.company && !data.client.name)
      e.client = "Client name or company is required";
    if (!data.project.title) e.title = "Project title is required";
    if (data.commercials.showPricing) {
      const hasItem = data.lineItems.some((i) => i.desc && Number(i.rate) > 0);
      if (!hasItem) e.items = "Add at least one priced line item";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* PDF export */
  const exportDoc = async (docKey) => {
    if (!validate()) {
      flash("Please complete the required fields");
      // open the relevant sections by scrolling form to top
      document.querySelector(".form-pane").scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setBusy(docKey);
    await new Promise((r) => setTimeout(r, 60));
    try {
      const node = document.querySelector(
        `#pdf-stage [data-stage="${docKey}"] .doc-sheet`
      );
      const cn = (data.client.company || data.client.name || "Client").replace(
        /[^a-z0-9]+/gi,
        "-"
      );
      const labelMap = {
        proposal: "Proposal",
        contract: "Contract",
        invoice: "Invoice",
      };
      const filename = `Hyperwrike-${labelMap[docKey]}-${cn}.pdf`;
      await window
        .html2pdf()
        .set({
          margin: [12, 0, 12, 0],
          filename,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"], avoid: ["tr", ".signatures", ".headline-figure"] },
        })
        .from(node)
        .save();
      flash(labelMap[docKey] + " downloaded");
    } catch (err) {
      console.error(err);
      flash("Export failed — try again");
    }
    setBusy(null);
  };

  const exportAll = async () => {
    if (!validate()) {
      flash("Please complete the required fields");
      document.querySelector(".form-pane").scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setBusy("all");
    const keys = ["proposal", "contract", "invoice"];
    const labelMap = { proposal: "Proposal", contract: "Contract", invoice: "Invoice" };
    const cn = (data.client.company || data.client.name || "Client").replace(
      /[^a-z0-9]+/gi,
      "-"
    );
    for (const k of keys) {
      try {
        const node = document.querySelector(`#pdf-stage [data-stage="${k}"] .doc-sheet`);
        await window
          .html2pdf()
          .set({
            margin: [12, 0, 12, 0],
            filename: `Hyperwrike-${labelMap[k]}-${cn}.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
            pagebreak: { mode: ["css", "legacy"], avoid: ["tr", ".signatures", ".headline-figure"] },
          })
          .from(node)
          .save();
        await new Promise((r) => setTimeout(r, 700));
      } catch (err) {
        console.error(err);
      }
    }
    setBusy(null);
    flash("All 3 documents downloaded");
  };

  const loadSample = () => {
    setData(clone(SAMPLE));
    setErrors({});
    flash("Sample data loaded");
  };
  const resetAll = () => {
    if (confirm("Clear all fields and start over?")) {
      setData(clone(DEFAULT_DATA));
      setErrors({});
      flash("Form cleared");
    }
  };

  const DocComp = { proposal: ProposalDoc, contract: ContractDoc, invoice: InvoiceDoc }[
    tab
  ];

  /* preview scaling */
  const previewRef = useRef(null);
  const [scale, setScale] = useState(0.62);
  useEffect(() => {
    const fit = () => {
      if (!previewRef.current) return;
      const w = previewRef.current.clientWidth - 48;
      const sheetPx = (210 * 96) / 25.4; // 210mm in px
      setScale(Math.min(0.92, Math.max(0.3, w / sheetPx)));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <div className="app">
      {/* ---- top bar ---- */}
      <header className="topbar">
        <a
          className="tb-brand"
          href="https://www.hyperwrike.com"
          target="_blank"
          rel="noopener noreferrer"
          title="Visit hyperwrike.com"
        >
          <svg width="30" height="30" viewBox="0 0 48 48" fill="none">
            <rect fill="#15203A" x="3" y="30" width="7" height="14" rx="2" />
            <rect fill="#15203A" x="13" y="24" width="7" height="20" rx="2" />
            <rect fill="#15203A" x="23" y="16" width="7" height="28" rx="2" />
            <path d="M4 35 L41 10" stroke="#A6E635" strokeWidth="2.6" strokeLinecap="round" />
            <circle cx="41.5" cy="9.5" r="4" fill="#A6E635" />
          </svg>
          <div>
            <div className="tb-name">Hyperwrike</div>
            <div className="tb-sub">Document Generator</div>
          </div>
        </a>
        <div className="tb-actions">
          <span className={"save-pill" + (saved ? " on" : "")}>
            {saved ? "✓ Saved" : "Auto-saves"}
          </span>
          <button className="btn ghost" onClick={loadSample}>
            Load sample
          </button>
          <button className="btn ghost" onClick={resetAll}>
            Clear
          </button>
        </div>
      </header>

      <div className="main">
        {/* ============ FORM PANE ============ */}
        <div className="form-pane">
          <div className="form-inner">
            <Section n="01" title="Client Details">
              <div className="row-2">
                <Field label="Client / Contact Name" required error={errors.client}>
                  <input
                    type="text"
                    placeholder="e.g. Dr. R. Subramanian"
                    value={data.client.name}
                    onChange={(e) => setPath("client", "name", e.target.value)}
                  />
                </Field>
                <Field label="Company / Organisation">
                  <input
                    type="text"
                    placeholder="e.g. VS Hospitals"
                    value={data.client.company}
                    onChange={(e) => setPath("client", "company", e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Client Address" hint="appears on all documents">
                <textarea
                  rows="2"
                  placeholder="Street, City, State — PIN"
                  value={data.client.address}
                  onChange={(e) => setPath("client", "address", e.target.value)}
                />
              </Field>
              <div className="row-2">
                <Field label="Client GSTIN / Tax ID">
                  <input
                    type="text"
                    placeholder="optional"
                    value={data.client.gstin}
                    onChange={(e) => setPath("client", "gstin", e.target.value)}
                  />
                </Field>
                <Field label="Client Logo" hint="shown top-right of each doc">
                  <div className="logo-field">
                    {data.client.logoDataUrl ? (
                      <div className="logo-prev">
                        <img src={data.client.logoDataUrl} alt="logo" />
                        <button
                          type="button"
                          className="logo-x"
                          onClick={() => setPath("client", "logoDataUrl", "")}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="logo-drop">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => onLogo(e.target.files[0])}
                        />
                        <span>＋ Upload logo</span>
                      </label>
                    )}
                  </div>
                </Field>
              </div>
            </Section>

            <Section n="02" title="Project">
              <Field label="Project Title" required error={errors.title}>
                <input
                  type="text"
                  placeholder="e.g. AI Voice Agent & Patient CRM System"
                  value={data.project.title}
                  onChange={(e) => setPath("project", "title", e.target.value)}
                />
              </Field>
              <Field label="Overview / Description" hint="one or two short paragraphs">
                <textarea
                  rows="4"
                  placeholder="Describe what Hyperwrike will deliver and the outcome for the client…"
                  value={data.project.overview}
                  onChange={(e) => setPath("project", "overview", e.target.value)}
                />
              </Field>
              <div className="row-3">
                <Field label="Document Date">
                  <input
                    type="text"
                    value={data.project.date}
                    onChange={(e) => setPath("project", "date", e.target.value)}
                  />
                </Field>
                <Field label="Valid For (days)">
                  <input
                    type="number"
                    value={data.project.validDays}
                    onChange={(e) => setPath("project", "validDays", e.target.value)}
                  />
                </Field>
                <Field label="Invoice Due Date">
                  <input
                    type="text"
                    placeholder="e.g. 20 June 2026"
                    value={data.project.dueDate}
                    onChange={(e) => setPath("project", "dueDate", e.target.value)}
                  />
                </Field>
              </div>
            </Section>

            <Section n="03" title="Deliverables">
              <p className="sec-note">
                Listed under Scope on the Proposal &amp; Contract.
              </p>
              {data.deliverables.map((d, i) => (
                <div className="list-row" key={i}>
                  <span className="list-bul">{i + 1}</span>
                  <input
                    type="text"
                    placeholder="Deliverable item"
                    value={d}
                    onChange={(e) => setList("deliverables", i, null, e.target.value)}
                  />
                  <button
                    type="button"
                    className="row-del"
                    onClick={() => delRow("deliverables", i)}
                    disabled={data.deliverables.length === 1}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button type="button" className="add-row" onClick={() => addRow("deliverables", "")}>
                ＋ Add deliverable
              </button>
            </Section>

            <Section n="04" title="Timeline" defaultOpen={false}>
              {data.timeline.map((t, i) => (
                <div className="list-row" key={i}>
                  <input
                    type="text"
                    className="tl-phase"
                    placeholder="Day 1–2 / Week 1"
                    value={t.phase}
                    onChange={(e) => setList("timeline", i, "phase", e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Activity for this phase"
                    value={t.detail}
                    onChange={(e) => setList("timeline", i, "detail", e.target.value)}
                  />
                  <button
                    type="button"
                    className="row-del"
                    onClick={() => delRow("timeline", i)}
                    disabled={data.timeline.length === 1}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="add-row"
                onClick={() => addRow("timeline", { phase: "", detail: "" })}
              >
                ＋ Add timeline row
              </button>
            </Section>

            <Section n="05" title="Commercials & Pricing">
              <div className="row-3">
                <Field label="Currency">
                  <div className="seg">
                    {["₹", "$"].map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={data.commercials.currency === c ? "on" : ""}
                        onClick={() => setPath("commercials", "currency", c)}
                      >
                        {c === "₹" ? "₹ INR" : "$ USD"}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Tax / GST">
                  <div className="seg">
                    <button
                      type="button"
                      className={data.commercials.gstEnabled ? "on" : ""}
                      onClick={() => setPath("commercials", "gstEnabled", true)}
                    >
                      On
                    </button>
                    <button
                      type="button"
                      className={!data.commercials.gstEnabled ? "on" : ""}
                      onClick={() => setPath("commercials", "gstEnabled", false)}
                    >
                      Off
                    </button>
                  </div>
                </Field>
                <Field label="Tax Rate (%)">
                  <input
                    type="number"
                    disabled={!data.commercials.gstEnabled}
                    value={data.commercials.gstRate}
                    onChange={(e) => setPath("commercials", "gstRate", e.target.value)}
                  />
                </Field>
              </div>

              <div className="items-head">
                <span>Line Items</span>
                {errors.items ? <span className="items-err">{errors.items}</span> : null}
              </div>
              <div className="item-grid item-grid-head">
                <span>Description</span>
                <span>Qty</span>
                <span>Rate</span>
                <span>Amount</span>
                <span></span>
              </div>
              {data.lineItems.map((it, i) => (
                <div className="item-grid" key={i}>
                  <input
                    type="text"
                    placeholder="Service / item"
                    value={it.desc}
                    onChange={(e) => setList("lineItems", i, "desc", e.target.value)}
                  />
                  <input
                    type="number"
                    value={it.qty}
                    onChange={(e) => setList("lineItems", i, "qty", e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="0"
                    value={it.rate}
                    onChange={(e) => setList("lineItems", i, "rate", e.target.value)}
                  />
                  <span className="item-amt">
                    {fmtMoney(
                      (Number(it.qty) || 0) * (Number(it.rate) || 0),
                      data.commercials.currency
                    )}
                  </span>
                  <button
                    type="button"
                    className="row-del"
                    onClick={() => delRow("lineItems", i)}
                    disabled={data.lineItems.length === 1}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="add-row"
                onClick={() => addRow("lineItems", { desc: "", qty: "1", rate: "" })}
              >
                ＋ Add line item
              </button>

              <div className="totals-mini">
                <div>
                  <span>Subtotal</span>
                  <b>{fmtMoney(m.subtotal, m.cur)}</b>
                </div>
                {m.gstRate > 0 ? (
                  <div>
                    <span>Tax @ {m.gstRate}%</span>
                    <b>{fmtMoney(m.gst, m.cur)}</b>
                  </div>
                ) : null}
                <div className="tm-total">
                  <span>Total</span>
                  <b>{fmtMoney(m.total, m.cur)}</b>
                </div>
              </div>

              <div className="row-2" style={{ marginTop: "14px" }}>
                <Field label="Advance %" hint="advance vs balance split">
                  <input
                    type="number"
                    value={data.commercials.advancePct}
                    onChange={(e) => setPath("commercials", "advancePct", e.target.value)}
                  />
                </Field>
                <Field label="Show pricing on Proposal?">
                  <div className="seg">
                    <button
                      type="button"
                      className={data.commercials.showPricing ? "on" : ""}
                      onClick={() => setPath("commercials", "showPricing", true)}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      className={!data.commercials.showPricing ? "on" : ""}
                      onClick={() => setPath("commercials", "showPricing", false)}
                    >
                      Hide
                    </button>
                  </div>
                </Field>
              </div>
              <Field label="Payment Note" hint="optional — appears on proposal & invoice">
                <textarea
                  rows="2"
                  placeholder="e.g. 50% advance on signing, balance on go-live…"
                  value={data.commercials.paymentNote}
                  onChange={(e) => setPath("commercials", "paymentNote", e.target.value)}
                />
              </Field>
            </Section>

            <Section n="06" title="Contract Terms" defaultOpen={false}>
              <div className="row-2">
                <Field label="Term">
                  <input
                    type="text"
                    value={data.contract.term}
                    onChange={(e) => setPath("contract", "term", e.target.value)}
                  />
                </Field>
                <Field label="Notice Period (days)">
                  <input
                    type="number"
                    value={data.contract.noticeDays}
                    onChange={(e) => setPath("contract", "noticeDays", e.target.value)}
                  />
                </Field>
              </div>
              <div className="row-3">
                <Field label="Late Payment (%/mo)">
                  <input
                    type="number"
                    step="0.1"
                    value={data.contract.latePct}
                    onChange={(e) => setPath("contract", "latePct", e.target.value)}
                  />
                </Field>
                <Field label="Governing Law">
                  <input
                    type="text"
                    value={data.contract.governingLaw}
                    onChange={(e) => setPath("contract", "governingLaw", e.target.value)}
                  />
                </Field>
                <Field label="Jurisdiction">
                  <input
                    type="text"
                    value={data.contract.jurisdiction}
                    onChange={(e) => setPath("contract", "jurisdiction", e.target.value)}
                  />
                </Field>
              </div>
            </Section>
          </div>
        </div>

        {/* ============ PREVIEW PANE ============ */}
        <div className="preview-pane" ref={previewRef}>
          <div className="preview-bar">
            <div className="tabs">
              {[
                ["proposal", "Proposal"],
                ["contract", "Contract"],
                ["invoice", "Invoice"],
              ].map(([k, lbl]) => (
                <button
                  key={k}
                  className={"tab" + (tab === k ? " on" : "")}
                  onClick={() => setTab(k)}
                >
                  {lbl}
                </button>
              ))}
            </div>
            <div className="dl-actions">
              <button
                className="btn dl"
                disabled={busy}
                onClick={() => exportDoc(tab)}
              >
                {busy === tab ? (
                  <span className="spin" />
                ) : (
                  <span>↓ Download {tab[0].toUpperCase() + tab.slice(1)}</span>
                )}
              </button>
              <button className="btn dl-all" disabled={busy} onClick={exportAll}>
                {busy === "all" ? <span className="spin" /> : <span>↓ Download All (3)</span>}
              </button>
            </div>
          </div>

          <div className="preview-scroll">
            <div
              className="sheet-scaler"
              style={{
                transform: `scale(${scale})`,
                width: "210mm",
                height: `calc(var(--sheet-h) * ${scale})`,
              }}
            >
              <div className="live-sheet" ref={(el) => (window.__liveSheet = el)}>
                <DocComp data={fullData} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---- hidden full-size stage for crisp PDF capture ---- */}
      <div id="pdf-stage" aria-hidden="true">
        <div data-stage="proposal">
          <ProposalDoc data={fullData} />
        </div>
        <div data-stage="contract">
          <ContractDoc data={fullData} />
        </div>
        <div data-stage="invoice">
          <InvoiceDoc data={fullData} />
        </div>
      </div>

      {busy ? (
        <div className="busy-overlay">
          <div className="busy-card">
            <span className="spin big" />
            <div>
              {busy === "all"
                ? "Generating all three PDFs…"
                : "Generating PDF…"}
            </div>
          </div>
        </div>
      ) : null}

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
