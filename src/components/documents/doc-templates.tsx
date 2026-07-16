"use client";

import type { DocData } from "@/lib/doc-data";
import { withRefs } from "@/lib/doc-data";
import { compute, fmtMoney } from "@/lib/doc-compute";

function HWLogo({ size = 46 }: { size?: number }) {
  return (
    <svg className="logo" width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect className="bar" x="3" y="30" width="7" height="14" rx="2" />
      <rect className="bar" x="13" y="24" width="7" height="20" rx="2" />
      <rect className="bar" x="23" y="16" width="7" height="28" rx="2" />
      <path className="trend" d="M4 35 L41 10" strokeWidth="2.6" strokeLinecap="round" />
      <circle className="node" cx="41.5" cy="9.5" r="4" />
    </svg>
  );
}

function Letterhead({ data }: { data: DocData }) {
  const clientName = data.client.company || data.client.name || "Client";
  return (
    <header className="letterhead">
      <div className="brand">
        <HWLogo />
        <div>
          <div className="brand-name">Hyperwrike</div>
          <div className="brand-tag">AI Voice &amp; Automation Solutions</div>
        </div>
      </div>
      <div className="client-logo-wrap">
        <div className="cl-label">Prepared For</div>
        {data.client.logoDataUrl ? (
          <img className="client-logo-img" src={data.client.logoDataUrl} alt={clientName} />
        ) : (
          <div className="client-logo-ph">{clientName}</div>
        )}
      </div>
    </header>
  );
}

function PartiesRow({ data }: { data: DocData }) {
  const clientName = data.client.company || data.client.name || "Client Name";
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
        <div className="pname">{clientName}</div>
        <div className="pdetail">
          {data.client.name && data.client.company && (
            <>
              Attn: {data.client.name}
              <br />
            </>
          )}
          {(data.client.address || "[Client Address]").split("\n").map((l, i) => (
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

function Footer({ refCode, client }: { refCode: string; client: string }) {
  return (
    <footer className="page-footer">
      <div className="left">{refCode}</div>
      <div className="center">Page 1 of 1</div>
      <div className="right">
        Confidential — <span className="lime">{client}</span>
      </div>
    </footer>
  );
}

function Signatures({ clientName }: { clientName: string }) {
  return (
    <div className="signatures">
      <div className="sig">
        <div className="sig-for">
          For <span className="co">Hyperwrike</span>
        </div>
        <div className="sig-field">
          <div className="sig-line" />
          <div className="fl">Authorised Signatory</div>
        </div>
        <div className="sig-field">
          <div className="sig-line" />
          <div className="fl">Date</div>
        </div>
      </div>
      <div className="sig">
        <div className="sig-for">
          For <span className="co">{clientName}</span>
        </div>
        <div className="sig-field">
          <div className="sig-line" />
          <div className="fl">Authorised Signatory</div>
        </div>
        <div className="sig-field">
          <div className="sig-line" />
          <div className="fl">Date</div>
        </div>
      </div>
    </div>
  );
}

function DocMeta({ cells }: { cells: Array<{ k: string; v: string; accent?: boolean }> }) {
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

export function ProposalDoc({ data }: { data: DocData }) {
  const d = withRefs(data);
  const m = compute(d);
  const ref = d.project.refProposal!;
  const clientName = d.client.company || d.client.name || "Client";
  const deliverables = d.deliverables.filter(Boolean);
  const timeline = d.timeline.filter((t) => t.phase || t.detail);

  return (
    <div className="page doc-sheet" data-doc-sheet="proposal">
      <Letterhead data={d} />
      <div className="doc-head">
        <div className="doc-type">Commercial Proposal</div>
        <h1 className="doc-title">{d.project.title || "Project Proposal"}</h1>
        <DocMeta
          cells={[
            { k: "Ref No.", v: ref, accent: true },
            { k: "Date", v: d.project.date || "—" },
            { k: "Valid For", v: `${d.project.validDays || "15"} days` },
            { k: "Prepared For", v: clientName },
          ]}
        />
      </div>
      <PartiesRow data={d} />
      <div className="content">
        {d.project.overview && (
          <section className="block">
            <div className="section-heading"><span className="num">01</span> Overview</div>
            {d.project.overview.split("\n").map((p, i) =>
              p.trim() ? <p className="lead" key={i}>{p}</p> : null
            )}
          </section>
        )}
        {deliverables.length > 0 && (
          <section className="block">
            <div className="section-heading"><span className="num">02</span> Scope &amp; Deliverables</div>
            <div className="grid-2">
              <ul className="ticks">
                {deliverables.slice(0, Math.ceil(deliverables.length / 2)).map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
              <ul className="ticks">
                {deliverables.slice(Math.ceil(deliverables.length / 2)).map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          </section>
        )}
        {timeline.length > 0 && (
          <section className="block">
            <div className="section-heading"><span className="num">03</span> Timeline</div>
            <table className="tbl">
              <thead>
                <tr><th style={{ width: "130px" }}>Phase</th><th>Activity</th></tr>
              </thead>
              <tbody>
                {timeline.map((t, i) => (
                  <tr key={i}><td className="mono">{t.phase}</td><td>{t.detail}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
        {d.commercials.showPricing && m.items.length > 0 && (
          <section className="block">
            <div className="section-heading"><span className="num">04</span> Commercials</div>
            <div className="headline-figure">
              <div className="big">{fmtMoney(m.total, m.cur)}</div>
              <div className="cap">
                <strong>Total Project Value</strong>
                {m.gstRate > 0 ? ` Inclusive of ${m.gstRate}% GST` : " Taxes as applicable"}
              </div>
            </div>
            <table className="tbl">
              <thead>
                <tr><th>Item</th><th className="num">Qty</th><th className="num">Rate</th><th className="num">Amount</th></tr>
              </thead>
              <tbody>
                {m.items.map((it, i) => (
                  <tr key={i}>
                    <td>{it.desc}</td>
                    <td className="num">{it.qty}</td>
                    <td className="num">{fmtMoney(it.rate, m.cur)}</td>
                    <td className="num">{fmtMoney((Number(it.qty) || 0) * (Number(it.rate) || 0), m.cur)}</td>
                  </tr>
                ))}
                <tr className="subtotal">
                  <td colSpan={3} style={{ textAlign: "right" }}>Subtotal</td>
                  <td className="num">{fmtMoney(m.subtotal, m.cur)}</td>
                </tr>
                {m.gstRate > 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "right" }}>GST @ {m.gstRate}%</td>
                    <td className="num">{fmtMoney(m.gst, m.cur)}</td>
                  </tr>
                )}
                <tr className="total">
                  <td colSpan={3} style={{ textAlign: "right" }}>Grand Total</td>
                  <td className="num">{fmtMoney(m.total, m.cur)}</td>
                </tr>
              </tbody>
            </table>
          </section>
        )}
        <Signatures clientName={clientName} />
      </div>
      <Footer refCode={ref} client={clientName} />
    </div>
  );
}

export function ContractDoc({ data }: { data: DocData }) {
  const d = withRefs(data);
  const m = compute(d);
  const ref = d.project.refContract!;
  const clientName = d.client.company || d.client.name || "Client";
  const ct = d.contract;
  const deliverables = d.deliverables.filter(Boolean);

  return (
    <div className="page doc-sheet" data-doc-sheet="contract">
      <Letterhead data={d} />
      <div className="doc-head">
        <div className="doc-type">Client Service Agreement</div>
        <h1 className="doc-title">{d.project.title || "Service Agreement"}</h1>
        <DocMeta cells={[
          { k: "Ref No.", v: ref, accent: true },
          { k: "Date", v: d.project.date || "—" },
          { k: "Client", v: clientName },
        ]} />
      </div>
      <PartiesRow data={d} />
      <div className="content">
        <section className="block">
          <div className="section-heading"><span className="num">01</span> Engagement</div>
          <p className="lead">
            This Agreement is entered into between <strong>Hyperwrike</strong> and{" "}
            <strong>{clientName}</strong> for the delivery of{" "}
            <strong>{d.project.title || "the agreed services"}</strong>.
          </p>
        </section>
        {deliverables.length > 0 && (
          <section className="block">
            <div className="section-heading"><span className="num">02</span> Scope of Services</div>
            <ul className="ticks">
              {deliverables.map((x, i) => <li key={i}>{x}</li>)}
            </ul>
          </section>
        )}
        {d.commercials.showPricing && m.items.length > 0 && (
          <section className="block">
            <div className="section-heading"><span className="num">03</span> Fees &amp; Commercials</div>
            <table className="tbl">
              <tbody>
                <tr><td>Total Contract Value</td><td className="num">{fmtMoney(m.total, m.cur)}</td></tr>
                <tr><td>Advance on signing ({m.advancePct}%)</td><td className="num">{fmtMoney(m.advance, m.cur)}</td></tr>
                <tr className="total"><td>Balance on delivery</td><td className="num">{fmtMoney(m.balance, m.cur)}</td></tr>
              </tbody>
            </table>
          </section>
        )}
        <section className="block">
          <div className="section-heading"><span className="num">04</span> Terms &amp; Conditions</div>
          <ol className="steps">
            <li><strong>Term.</strong> {ct.term} from the effective date.</li>
            <li><strong>Termination.</strong> Either party may terminate on {ct.noticeDays} days&apos; written notice.</li>
            <li><strong>Late Payment.</strong> Overdue invoices attract {ct.latePct}% per month interest.</li>
            <li><strong>IP.</strong> Deliverables transfer upon full payment.</li>
            <li><strong>Governing Law.</strong> Laws of {ct.governingLaw}, jurisdiction of {ct.jurisdiction}.</li>
          </ol>
        </section>
        <Signatures clientName={clientName} />
      </div>
      <Footer refCode={ref} client={clientName} />
    </div>
  );
}

export function InvoiceDoc({ data }: { data: DocData }) {
  const d = withRefs(data);
  const m = compute(d);
  const ref = d.project.refInvoice!;
  const clientName = d.client.company || d.client.name || "Client";

  return (
    <div className="page doc-sheet" data-doc-sheet="invoice">
      <Letterhead data={d} />
      <div className="doc-head">
        <div className="doc-type">Tax Invoice</div>
        <h1 className="doc-title">Invoice — {d.project.title || "Services"}</h1>
        <DocMeta cells={[
          { k: "Invoice No.", v: ref, accent: true },
          { k: "Invoice Date", v: d.project.date || "—" },
          { k: "Due Date", v: d.project.dueDate || "On Receipt" },
          { k: "Client", v: clientName },
        ]} />
      </div>
      <PartiesRow data={d} />
      <div className="content gold-edge">
        <section className="block">
          <table className="tbl">
            <thead>
              <tr><th>#</th><th>Description</th><th className="num">Qty</th><th className="num">Rate</th><th className="num">Amount</th></tr>
            </thead>
            <tbody>
              {m.items.map((it, i) => (
                <tr key={i}>
                  <td className="mono">{String(i + 1).padStart(2, "0")}</td>
                  <td>{it.desc}</td>
                  <td className="num">{it.qty}</td>
                  <td className="num">{fmtMoney(it.rate, m.cur)}</td>
                  <td className="num">{fmtMoney((Number(it.qty) || 0) * (Number(it.rate) || 0), m.cur)}</td>
                </tr>
              ))}
              <tr className="subtotal">
                <td colSpan={4} style={{ textAlign: "right" }}>Subtotal</td>
                <td className="num">{fmtMoney(m.subtotal, m.cur)}</td>
              </tr>
              {m.gstRate > 0 && m.isIndia && (
                <>
                  <tr><td colSpan={4} style={{ textAlign: "right" }}>CGST @ {m.gstRate / 2}%</td><td className="num">{fmtMoney(m.cgst, m.cur)}</td></tr>
                  <tr><td colSpan={4} style={{ textAlign: "right" }}>SGST @ {m.gstRate / 2}%</td><td className="num">{fmtMoney(m.sgst, m.cur)}</td></tr>
                </>
              )}
              <tr className="total">
                <td colSpan={4} style={{ textAlign: "right" }}>Total Amount Due</td>
                <td className="num">{fmtMoney(m.total, m.cur)}</td>
              </tr>
            </tbody>
          </table>
        </section>
        <Signatures clientName={clientName} />
      </div>
      <Footer refCode={ref} client={clientName} />
    </div>
  );
}

export function SowDoc({ data }: { data: DocData }) {
  const d = withRefs(data);
  const ref = d.project.refSow!;
  const clientName = d.client.company || d.client.name || "Client";
  const inScope = d.inScope.filter(Boolean);
  const outOfScope = d.outOfScope.filter(Boolean);

  return (
    <div className="page doc-sheet" data-doc-sheet="sow">
      <Letterhead data={d} />
      <div className="doc-head">
        <div className="doc-type">Scope of Work</div>
        <h1 className="doc-title">{d.project.title || "Project Scope"}</h1>
        <DocMeta cells={[
          { k: "Reference", v: ref, accent: true },
          { k: "Date", v: d.project.date || "—" },
          { k: "Companion To", v: d.project.refProposal || "—" },
          { k: "Client", v: clientName },
        ]} />
      </div>
      <div className="content">
        {inScope.length > 0 && (
          <section className="block">
            <div className="section-heading"><span className="num">01</span> In-Scope Summary</div>
            <ul className="ticks two-col">
              {inScope.map((x, i) => <li key={i}>{x}</li>)}
            </ul>
          </section>
        )}
        {outOfScope.length > 0 && (
          <section className="block">
            <div className="section-heading gold"><span className="num">02</span> Out of Scope</div>
            <ul className="ticks">
              {outOfScope.map((x, i) => <li key={i}>{x}</li>)}
            </ul>
          </section>
        )}
        {d.complianceNote && (
          <section className="block">
            <div className="section-heading"><span className="num">03</span> Compliance Note</div>
            <div className="callout">{d.complianceNote}</div>
          </section>
        )}
        {d.deliverables.filter(Boolean).length > 0 && (
          <section className="block">
            <div className="section-heading"><span className="num">04</span> Deliverables</div>
            <ul className="ticks">
              {d.deliverables.filter(Boolean).map((x, i) => <li key={i}>{x}</li>)}
            </ul>
          </section>
        )}
        <Signatures clientName={clientName} />
      </div>
      <Footer refCode={ref} client={clientName} />
    </div>
  );
}

export function DocRenderer({ type, data }: { type: string; data: DocData }) {
  switch (type) {
    case "proposal": return <ProposalDoc data={data} />;
    case "contract": return <ContractDoc data={data} />;
    case "invoice": return <InvoiceDoc data={data} />;
    case "sow": return <SowDoc data={data} />;
    default: return <ProposalDoc data={data} />;
  }
}
