export interface DocLineItem {
  desc: string;
  qty: string;
  rate: string;
}

export interface DocTimeline {
  phase: string;
  detail: string;
}

export interface DocData {
  client: {
    name: string;
    company: string;
    address: string;
    gstin: string;
    logoDataUrl: string;
  };
  project: {
    title: string;
    overview: string;
    date: string;
    validDays: string;
    dueDate: string;
    refProposal?: string;
    refContract?: string;
    refInvoice?: string;
    refSow?: string;
  };
  deliverables: string[];
  inScope: string[];
  outOfScope: string[];
  complianceNote: string;
  timeline: DocTimeline[];
  lineItems: DocLineItem[];
  commercials: {
    currency: string;
    gstEnabled: boolean;
    gstRate: string;
    advancePct: string;
    paymentNote: string;
    showPricing: boolean;
  };
  contract: {
    term: string;
    noticeDays: string;
    latePct: string;
    governingLaw: string;
    jurisdiction: string;
  };
}

export function initials(s: string) {
  if (!s) return "CLT";
  const words = s.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.slice(0, 3).map((w) => w[0]).join("").toUpperCase();
}

export function refCodes(data: DocData) {
  const ini = initials(data.client.company || data.client.name);
  const yr = (data.project.date || "").match(/\d{4}/)?.[0] ?? "2026";
  return {
    refProposal: `HW-PROP-${ini}-${yr}-001`,
    refContract: `HW-CC-${ini}-${yr}-001`,
    refInvoice: `HW-INV-${ini}-${yr}-001`,
    refSow: `HW-SOW-${ini}-${yr}-001`,
  };
}

export function defaultDocData(client?: { name?: string; company?: string; email?: string }): DocData {
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  return {
    client: {
      name: client?.name ?? "",
      company: client?.name ?? "",
      address: "",
      gstin: "",
      logoDataUrl: "",
    },
    project: {
      title: "",
      overview: "",
      date: today,
      validDays: "15",
      dueDate: "",
    },
    deliverables: [""],
    inScope: [""],
    outOfScope: [""],
    complianceNote: "",
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
}

export function docDataFromClient(client: {
  name: string;
  retainer_amount?: number;
  setup_fee?: number;
  offer?: string | null;
}): DocData {
  const base = defaultDocData(client);
  base.project.title = `${OFFER_TITLES[client.offer ?? ""] ?? "AI Automation Project"}`;
  base.project.overview =
    `Hyperwrike will design, build and deploy ${base.project.title} for ${client.name}, delivering measurable automation outcomes with full transparency and ongoing support.`;
  base.lineItems = [
    {
      desc: "Setup & Implementation",
      qty: "1",
      rate: String(client.setup_fee ?? 0),
    },
    {
      desc: "Monthly Retainer",
      qty: "1",
      rate: String(client.retainer_amount ?? 0),
    },
  ];
  return base;
}

const OFFER_TITLES: Record<string, string> = {
  "10x_throughput": "10x Throughput AI System",
  "500_hour_reclaim": "500-Hour Reclaim Automation",
  ai_visibility_engine: "AI Visibility Engine",
};

export function withRefs(data: DocData): DocData {
  return { ...data, project: { ...data.project, ...refCodes(data) } };
}
