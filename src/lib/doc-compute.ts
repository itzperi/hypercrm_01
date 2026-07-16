import type { DocData } from "./doc-data";

export function fmtMoney(n: number | string, cur: string) {
  const v = Math.round((Number(n) || 0) * 100) / 100;
  const hasDec = Math.abs(v % 1) > 0.0001;
  let s: string;
  if (cur === "₹") {
    const parts = v.toFixed(hasDec ? 2 : 0).split(".");
    let x = parts[0];
    let last3 = x.slice(-3);
    const rest = x.slice(0, -3);
    if (rest) last3 = "," + last3;
    s = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + last3 + (parts[1] ? "." + parts[1] : "");
  } else {
    s = v.toLocaleString("en-US", {
      minimumFractionDigits: hasDec ? 2 : 0,
      maximumFractionDigits: 2,
    });
  }
  return cur + s;
}

export function compute(data: DocData) {
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
