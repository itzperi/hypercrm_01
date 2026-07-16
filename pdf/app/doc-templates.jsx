/* ============================================================
   HYPERWRIKE — Document Templates
   Proposal · Contract · Invoice  (shared brand system)
   Exposes window.HWDocs = { ProposalDoc, ContractDoc, InvoiceDoc, compute }
   ============================================================ */

/* ---------- money + compute helpers ---------- */
function fmtMoney(n, cur) {
  const v = Math.round((Number(n) || 0) * 100) / 100;
  const hasDec = Math.abs(v % 1) > 0.0001;
  let s;
  if (cur === "₹") {
    // Indian grouping
    const parts = v.toFixed(hasDec ? 2 : 0).split(".");
    let x = parts[0];
    let last3 = x.slice(-3);
    let rest = x.slice(0, -3);
    if (rest) last3 = "," + last3;
    rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    s = rest + last3 + (parts[1] ? "." + parts[1] : "");
  } else {
    s = v.toLocaleString("en-US", {
      minimumFractionDigits: hasDec ? 2 : 0,
      maximumFractionDigits: 2,
    });
  }
  return cur + s;
}

function compute(data) {
  const items = (data.lineItems || []).filter((i) => i.desc);
  const subtotal = items.reduce(
    (s, i) => s + (Number(i.qty) || 0) * (Number(i.rate) || 0),
    0
  );
  const c = data.commercials || {};
  const gstRate = c.gstEnabled ? Number(c.gstRate) || 0 : 0;
  const gst = subtotal * (gstRate / 100);
  const total = subtotal + gst;
  const advancePct = Number(c.advancePct);
  const adv = isNaN(advancePct) ? 50 : advancePct;
  const advance = total * (adv / 100);
  const balance = total - advance;
  return {
    items,
    subtotal,
    gstRate,
    gst,
    cgst: gst / 2,
    sgst: gst / 2,
    total,
    advancePct: adv,
    advance,
    balance,
    cur: c.currency || "₹",
    isIndia: (c.currency || "₹") === "₹",
  };
}

/* ---------- shared sub-components ---------- */
function HWLogo({ size = 46 }) {
  return (
    <a
      href="https://www.hyperwrike.com"
      target="_blank"
      rel="noopener noreferrer"
      className="hw-logo-link"
      style={{ display: "inline-flex", textDecoration: "none" }}
    >
      <svg
        className="logo"
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect className="bar" x="3" y="30" width="7" height="14" rx="2" />
        <rect className="bar" x="13" y="24" width="7" height="20" rx="2" />
        <rect className="bar" x="23" y="16" width="7" height="28" rx="2" />
        <path className="trend" d="M4 35 L41 10" strokeWidth="2.6" strokeLinecap="round" />
        <circle className="node" cx="41.5" cy="9.5" r="4" />
      </svg>
    </a>
  );
}

function ClientLogo({ src, name }) {
  if (src) {
    return (
      <div className="client-logo-wrap">
        <div className="cl-label">Prepared For</div>
        <img className="client-logo-img" src={src} alt={name || "Client logo"} />
      </div>
    );
  }
  return (
    <div className="client-logo-wrap">
      <div className="cl-label">Prepared For</div>
      <div className="client-logo-ph">{name || "Client"}</div>
    </div>
  );
}

function Letterhead({ data }) {
  return (
    <header className="letterhead">
      <div className="brand">
        <HWLogo size={46} />
        <div>
          <div className="brand-name">Hyperwrike</div>
          <div className="brand-tag">AI Voice &amp; Automation Solutions</div>
        </div>
      </div>
      <ClientLogo src={data.client.logoDataUrl} name={data.client.company || data.client.name} />
    </header>
  );
}

function PartiesRow({ data }) {
  return (
    <div className="parties">
      <div className="party">
        <div className="role">From — Service Provider</div>
        <div className="pname">Hyperwrike</div>
        <div className="pdetail">
          AI Voice &amp; Automation Solutions
          <br />
          Madina Complex, Palamaner Road,
          <br />
          Chittoor, Andhra Pradesh — 517001
          <br />
          GSTIN <span className="mono">37ABCDH1234M1Z5</span>
          <br />
          <span className="mono">team@hyperwrike.com</span>
        </div>
      </div>
      <div className="party client">
        <div className="role">To — Client</div>
        <div className="pname">{data.client.company || data.client.name || "Client Name"}</div>
        <div className="pdetail">
          {data.client.name && data.client.company ? (
            <span>
              Attn: {data.client.name}
              <br />
            </span>
          ) : null}
          {(data.client.address || "[Client Address]")
            .split("\n")
            .map((l, i) => (
              <span key={i}>
                {l}
                <br />
              </span>
            ))}
          GSTIN <span className="mono">{data.client.gstin || "—"}</span>
        </div>
      </div>
    </div>
  );
}

function Footer({ refCode, page, pages, client }) {
  return (
    <footer className="page-footer">
      <div className="left">{refCode}</div>
      <div className="center">
        Page {page} of {pages}
      </div>
      <div className="right">
        Confidential — <span className="lime">{client || "Client"}</span>
      </div>
    </footer>
  );
}

function Signatures({ clientName }) {
  return (
    <div className="signatures">
      <div className="sig">
        <div className="sig-for">
          For <span className="co">Hyperwrike</span>
        </div>
        <div className="sig-field">
          <div className="sig-line"></div>
          <div className="fl">Authorised Signatory</div>
        </div>
        <div className="sig-field">
          <div className="sig-line"></div>
          <div className="fl">Date</div>
        </div>
      </div>
      <div className="sig">
        <div className="sig-for">
          For <span className="co">{clientName || "Client"}</span>
        </div>
        <div className="sig-field">
          <div className="sig-line"></div>
          <div className="fl">Authorised Signatory</div>
        </div>
        <div className="sig-field">
          <div className="sig-line"></div>
          <div className="fl">Date</div>
        </div>
      </div>
    </div>
  );
}

function DocMeta({ cells }) {
  return (
    <div className="doc-meta">
      {cells.map((c, i) => (
        <div className="cell" key={i}>
          <div className="k">{c.k}</div>
          <div className={"v" + (c.accent ? " accent" : "")}>{c.v}</div>
        </div>
      ))}
    </div>
  );
}

/* ===========================================================
   PROPOSAL
   =========================================================== */
function ProposalDoc({ data }) {
  const m = compute(data);
  const ref = data.project.refProposal;
  const clientName = data.client.company || data.client.name || "Client";
  const deliverables = (data.deliverables || []).filter(Boolean);
  const timeline = (data.timeline || []).filter((t) => t.phase || t.detail);

  return (
    <div className="doc-sheet" data-doc-sheet="proposal">
      <Letterhead data={data} />

      <div className="doc-head">
        <div className="doc-type">Commercial Proposal</div>
        <h1 className="doc-title">{data.project.title || "Project Proposal"}</h1>
        <DocMeta
          cells={[
            { k: "Ref No.", v: ref, accent: true },
            { k: "Date", v: data.project.date || "—" },
            { k: "Valid For", v: (data.project.validDays || "15") + " days" },
            { k: "Prepared For", v: clientName },
          ]}
        />
      </div>

      <PartiesRow data={data} />

      <div className="content">
        {data.project.overview ? (
          <section className="block">
            <div className="section-heading">
              <span className="num">01</span> Overview
            </div>
            {data.project.overview.split("\n").map((p, i) =>
              p.trim() ? (
                <p className="lead" key={i}>
                  {p}
                </p>
              ) : null
            )}
          </section>
        ) : null}

        {deliverables.length ? (
          <section className="block">
            <div className="section-heading">
              <span className="num">02</span> Scope &amp; Deliverables
            </div>
            <div className="grid-2">
              <ul className="ticks">
                {deliverables
                  .slice(0, Math.ceil(deliverables.length / 2))
                  .map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
              </ul>
              <ul className="ticks">
                {deliverables
                  .slice(Math.ceil(deliverables.length / 2))
                  .map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
              </ul>
            </div>
          </section>
        ) : null}

        {timeline.length ? (
          <section className="block">
            <div className="section-heading">
              <span className="num">03</span> Timeline
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: "130px" }}>Phase</th>
                  <th>Activity</th>
                </tr>
              </thead>
              <tbody>
                {timeline.map((t, i) => (
                  <tr key={i}>
                    <td className="mono">{t.phase}</td>
                    <td>{t.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {data.commercials.showPricing && m.items.length ? (
          <section className="block">
            <div className="section-heading">
              <span className="num">04</span> Commercials
            </div>
            <div className="headline-figure">
              <div className="big">{fmtMoney(m.total, m.cur)}</div>
              <div className="cap">
                <strong>Total Project Value</strong>
                {m.gstRate > 0
                  ? "Inclusive of " + m.gstRate + "% GST"
                  : "Taxes as applicable"}
              </div>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="num">Qty</th>
                  <th className="num">Rate</th>
                  <th className="num">Amount</th>
                </tr>
              </thead>
              <tbody>
                {m.items.map((it, i) => (
                  <tr key={i}>
                    <td>{it.desc}</td>
                    <td className="num">{it.qty}</td>
                    <td className="num">{fmtMoney(it.rate, m.cur)}</td>
                    <td className="num">
                      {fmtMoney((Number(it.qty) || 0) * (Number(it.rate) || 0), m.cur)}
                    </td>
                  </tr>
                ))}
                <tr className="subtotal">
                  <td colSpan="3" style={{ textAlign: "right" }}>
                    Subtotal
                  </td>
                  <td className="num">{fmtMoney(m.subtotal, m.cur)}</td>
                </tr>
                {m.gstRate > 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: "right" }}>
                      GST @ {m.gstRate}%
                    </td>
                    <td className="num">{fmtMoney(m.gst, m.cur)}</td>
                  </tr>
                ) : null}
                <tr className="total">
                  <td colSpan="3" style={{ textAlign: "right" }}>
                    Grand Total
                  </td>
                  <td className="num">{fmtMoney(m.total, m.cur)}</td>
                </tr>
              </tbody>
            </table>
            {data.commercials.paymentNote ? (
              <p className="lead" style={{ marginTop: "9px" }}>
                <strong>Payment:</strong> {data.commercials.paymentNote}
              </p>
            ) : (
              <p className="lead" style={{ marginTop: "9px" }}>
                <strong>Payment:</strong> {m.advancePct}% advance (
                {fmtMoney(m.advance, m.cur)}) on signing — balance{" "}
                {fmtMoney(m.balance, m.cur)} on delivery.
              </p>
            )}
          </section>
        ) : null}

        <Signatures clientName={clientName} />
      </div>

      <Footer refCode={ref} page="1" pages="1" client={clientName} />
    </div>
  );
}

/* ===========================================================
   CONTRACT
   =========================================================== */
function ContractDoc({ data }) {
  const m = compute(data);
  const ref = data.project.refContract;
  const clientName = data.client.company || data.client.name || "Client";
  const ct = data.contract || {};
  const deliverables = (data.deliverables || []).filter(Boolean);

  return (
    <div className="doc-sheet" data-doc-sheet="contract">
      <Letterhead data={data} />

      <div className="doc-head">
        <div className="doc-type">Client Service Agreement</div>
        <h1 className="doc-title">{data.project.title || "Service Agreement"}</h1>
        <DocMeta
          cells={[
            { k: "Ref No.", v: ref, accent: true },
            { k: "Date", v: data.project.date || "—" },
            { k: "Client", v: clientName },
          ]}
        />
      </div>

      <PartiesRow data={data} />

      <div className="content">
        <section className="block">
          <div className="section-heading">
            <span className="num">01</span> Engagement
          </div>
          <p className="lead">
            This Agreement is entered into between <strong>Hyperwrike</strong> ("Service
            Provider") and <strong>{clientName}</strong> ("Client") for the delivery of{" "}
            <strong>{data.project.title || "the agreed services"}</strong>, on the terms
            set out below.
          </p>
          {data.project.overview ? (
            <p className="lead">{data.project.overview.split("\n")[0]}</p>
          ) : null}
        </section>

        {deliverables.length ? (
          <section className="block">
            <div className="section-heading">
              <span className="num">02</span> Scope of Services
            </div>
            <div className="grid-2">
              <ul className="ticks">
                {deliverables
                  .slice(0, Math.ceil(deliverables.length / 2))
                  .map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
              </ul>
              <ul className="ticks">
                {deliverables
                  .slice(Math.ceil(deliverables.length / 2))
                  .map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
              </ul>
            </div>
          </section>
        ) : null}

        {data.commercials.showPricing && m.items.length ? (
          <section className="block">
            <div className="section-heading">
              <span className="num">03</span> Fees &amp; Commercials
            </div>
            <table className="tbl">
              <tbody>
                <tr>
                  <td>Total Contract Value{m.gstRate > 0 ? " (incl. GST)" : ""}</td>
                  <td className="num">{fmtMoney(m.total, m.cur)}</td>
                </tr>
                <tr>
                  <td>Advance on signing ({m.advancePct}%)</td>
                  <td className="num">{fmtMoney(m.advance, m.cur)}</td>
                </tr>
                <tr className="total">
                  <td>Balance on delivery</td>
                  <td className="num">{fmtMoney(m.balance, m.cur)}</td>
                </tr>
              </tbody>
            </table>
          </section>
        ) : null}

        <section className="block">
          <div className="section-heading">
            <span className="num">{data.commercials.showPricing && m.items.length ? "04" : "03"}</span>{" "}
            Terms &amp; Conditions
          </div>
          <ol className="steps">
            <li>
              <strong>Term.</strong> This Agreement remains in force for{" "}
              {ct.term || "12 months"} from the effective date and may be renewed by
              mutual agreement.
            </li>
            <li>
              <strong>Termination.</strong> Either party may terminate on{" "}
              {ct.noticeDays || "30"} days' written notice. Fees for work completed up to
              the termination date remain payable.
            </li>
            <li>
              <strong>Late Payment.</strong> Overdue invoices attract interest at{" "}
              {ct.latePct || "1.5"}% per month on the outstanding balance.
            </li>
            <li>
              <strong>Intellectual Property.</strong> Deliverables transfer to the Client
              upon full payment. Hyperwrike retains ownership of its underlying tools,
              frameworks, and AI model weights.
            </li>
            <li>
              <strong>Confidentiality.</strong> Both parties shall keep confidential all
              non-public information exchanged under this Agreement.
            </li>
            <li>
              <strong>Governing Law.</strong> This Agreement is governed by the laws of{" "}
              {ct.governingLaw || "India"}. Disputes are subject to the jurisdiction of{" "}
              {ct.jurisdiction || "Chittoor, Andhra Pradesh"} and shall first be referred
              to good-faith negotiation, then arbitration where unresolved.
            </li>
          </ol>
        </section>

        <Signatures clientName={clientName} />
      </div>

      <Footer refCode={ref} page="1" pages="1" client={clientName} />
    </div>
  );
}

/* ===========================================================
   INVOICE
   =========================================================== */
function InvoiceDoc({ data }) {
  const m = compute(data);
  const ref = data.project.refInvoice;
  const clientName = data.client.company || data.client.name || "Client";

  return (
    <div className="doc-sheet" data-doc-sheet="invoice">
      <Letterhead data={data} />

      <div className="doc-head">
        <div className="doc-type">Tax Invoice</div>
        <h1 className="doc-title">Invoice — {data.project.title || "Services"}</h1>
        <DocMeta
          cells={[
            { k: "Invoice No.", v: ref, accent: true },
            { k: "Invoice Date", v: data.project.date || "—" },
            { k: "Due Date", v: data.project.dueDate || "On Receipt" },
            { k: "Client", v: clientName },
          ]}
        />
      </div>

      <PartiesRow data={data} />

      <div className="content gold-edge">
        <section className="block">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: "26px" }}>#</th>
                <th>Description</th>
                <th className="num">Qty</th>
                <th className="num">Rate</th>
                <th className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {m.items.length ? (
                m.items.map((it, i) => (
                  <tr key={i}>
                    <td className="mono" style={{ color: "var(--muted)" }}>
                      {String(i + 1).padStart(2, "0")}
                    </td>
                    <td>{it.desc}</td>
                    <td className="num">{it.qty}</td>
                    <td className="num">{fmtMoney(it.rate, m.cur)}</td>
                    <td className="num">
                      {fmtMoney((Number(it.qty) || 0) * (Number(it.rate) || 0), m.cur)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="mono" style={{ color: "var(--muted)" }}>
                    01
                  </td>
                  <td>{data.project.title || "Professional services"}</td>
                  <td className="num">1</td>
                  <td className="num">—</td>
                  <td className="num">—</td>
                </tr>
              )}
              <tr className="subtotal">
                <td colSpan="4" style={{ textAlign: "right" }}>
                  Subtotal
                </td>
                <td className="num">{fmtMoney(m.subtotal, m.cur)}</td>
              </tr>
              {m.gstRate > 0 && m.isIndia ? (
                <React.Fragment>
                  <tr>
                    <td colSpan="4" style={{ textAlign: "right" }}>
                      CGST @ {m.gstRate / 2}%
                    </td>
                    <td className="num">{fmtMoney(m.cgst, m.cur)}</td>
                  </tr>
                  <tr>
                    <td colSpan="4" style={{ textAlign: "right" }}>
                      SGST @ {m.gstRate / 2}%
                    </td>
                    <td className="num">{fmtMoney(m.sgst, m.cur)}</td>
                  </tr>
                </React.Fragment>
              ) : m.gstRate > 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: "right" }}>
                    Tax @ {m.gstRate}%
                  </td>
                  <td className="num">{fmtMoney(m.gst, m.cur)}</td>
                </tr>
              ) : null}
              <tr className="total">
                <td colSpan="4" style={{ textAlign: "right" }}>
                  Total Amount Due
                </td>
                <td className="num">{fmtMoney(m.total, m.cur)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <hr className="gold-rule" />

        <section className="block">
          <div className="grid-2" style={{ gap: "20px" }}>
            <div>
              <div className="section-label">Payment Schedule</div>
              <table className="tbl" style={{ marginTop: "8px" }}>
                <tbody>
                  <tr>
                    <td>Advance ({m.advancePct}%) — Due Now</td>
                    <td className="num">
                      <span className="kbd-amount">{fmtMoney(m.advance, m.cur)}</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Balance — On Delivery</td>
                    <td className="num mono">{fmtMoney(m.balance, m.cur)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <div className="section-label">Payment Details</div>
              <div style={{ marginTop: "8px", fontSize: "10px", lineHeight: "1.9" }}>
                <div>
                  Bank: <span className="blank">______________________</span>
                </div>
                <div>
                  A/C No: <span className="blank">____________________</span>
                </div>
                <div>
                  IFSC: <span className="blank">______________________</span>
                </div>
                <div>
                  UPI / Stripe: <span className="blank">________________</span>
                </div>
              </div>
            </div>
          </div>
          {data.commercials.paymentNote ? (
            <p className="note-line">{data.commercials.paymentNote}</p>
          ) : null}
        </section>

        <Signatures clientName={clientName} />
      </div>

      <Footer refCode={ref} page="1" pages="1" client={clientName} />
    </div>
  );
}

window.HWDocs = { ProposalDoc, ContractDoc, InvoiceDoc, compute, fmtMoney };
