import {
  defaultTheme,
  theme,
  text,
  safeURL,
  escapeHTML,
  documentHTML,
} from "../vendor/professional/shared/model.js";
const list = (v, max, fn) => {
  if (!Array.isArray(v) || v.length > max)
    throw new Error("Invalid or oversized list.");
  return v.map(fn);
};
const finite = (v, min, max) => {
  if (!Number.isFinite(v) || v < min || v > max)
    throw new Error("Invalid amount or duration.");
  return v;
};
const decimal = (value, min, max) => {
  const n = finite(Number(value), min, max);
  scaled(n);
  return n;
};
export function seed(name = "Untitled engagement") {
  return {
    name,
    theme: structuredClone(defaultTheme),
    client: "Northstar Studio",
    currency: "USD",
    brief: {
      goals: "Create a clear, confident product experience.",
      audience: "A small team doing substantial work.",
      deliverables:
        "Responsive interface, tested states, and implementation notes.",
      exclusions: "Hosting and ongoing support.",
      assumptions: "Client supplies final content.",
      dependencies: "Access to approved brand materials.",
    },
    estimate: [
      { name: "Discovery & scope", quantity: 1, rate: 60000, unit: "fixed" },
      {
        name: "Design & implementation",
        quantity: 16,
        rate: 10000,
        unit: "hours",
      },
    ],
    contingency: 10,
    tax: 0,
    terms:
      "Payment: 50% at project start, 50% after agreed delivery. Changes to scope receive a separate review.",
    schedule: "Two weeks from acceptance and receipt of materials.",
    internalNotes: "",
    milestones: [
      { name: "Discovery", status: "planned", due: "", assignee: "" },
      { name: "Interface review", status: "planned", due: "", assignee: "" },
      { name: "Handoff", status: "planned", due: "", assignee: "" },
    ],
    tasks: [],
    time: [],
    changes: [],
    handoff: [],
    paymentStages: [
      { name: "Project start", percentage: 50 },
      { name: "Final delivery", percentage: 50 },
    ],
  };
}
export function normalize(v) {
  const x = { ...seed(), ...v };
  const brief = { ...seed().brief, ...x.brief };
  for (const k of Object.keys(seed().brief)) brief[k] = text(brief[k], 10000);
  return {
    name: text(x.name, 120),
    theme: theme(x.theme),
    client: text(x.client, 200),
    currency: ["USD", "CAD", "EUR", "GBP", "AUD", "JPY"].includes(x.currency)
      ? x.currency
      : (() => {
          throw new Error("Invalid ISO currency.");
        })(),
    brief,
    estimate: list(x.estimate, 100, (row) => ({
      name: text(row.name, 200),
      quantity: decimal(row.quantity, 0, 10000),
      rate: Math.round(finite(Number(row.rate), 0, 1e10)),
      unit: ["hours", "fixed"].includes(row.unit) ? row.unit : "fixed",
    })),
    contingency: decimal(x.contingency, 0, 100),
    tax: decimal(x.tax, 0, 100),
    terms: text(x.terms, 20000),
    schedule: text(x.schedule, 3000),
    internalNotes: text(x.internalNotes || "", 20000),
    milestones: list(x.milestones, 100, (m) => ({
      name: text(m.name, 200),
      status: ["planned", "active", "in_review", "completed"].includes(m.status)
        ? m.status
        : "planned",
      due: text(m.due || "", 40),
      assignee: text(m.assignee || "", 254),
    })),
    tasks: list(x.tasks || [], 300, (t) => ({
      name: text(t.name, 200),
      status: ["planned", "active", "in_review", "completed"].includes(t.status)
        ? t.status
        : "planned",
      due: text(t.due || "", 40),
      assignee: text(t.assignee || "", 254),
    })),
    time: list(x.time || [], 1000, (t) => ({
      name: text(t.name, 200),
      minutes: finite(Number(t.minutes), 0, 1440),
      date: text(t.date, 40),
    })),
    changes: list(x.changes || [], 100, (c) => ({
      name: text(c.name, 200),
      impact: text(c.impact, 5000),
      amount: Math.round(finite(Number(c.amount), -1e10, 1e10)),
    })),
    handoff: list(x.handoff || [], 100, (h) => ({
      name: text(h.name, 200),
      url: safeURL(h.url),
      done: h.done === true,
    })),
    paymentStages: list(x.paymentStages || [], 20, (p) => ({
      name: text(p.name, 200),
      percentage: finite(Number(p.percentage), 0, 100),
    })),
  };
}
// Amounts use integer minor units. Quantities and percentages are decimal strings,
// multiplied as integers to avoid cumulative binary floating-point money errors.
function scaled(value) {
  const s = String(value);
  if (!/^\d+(?:\.\d{1,4})?$/.test(s))
    throw new Error("Use at most four decimal places.");
  const [a, b = ""] = s.split(".");
  return BigInt(a) * 10000n + BigInt(b.padEnd(4, "0"));
}
const round = (numerator, divisor) =>
  Number((numerator + divisor / 2n) / divisor);
export function totals(data) {
  const subtotal = data.estimate.reduce(
      (s, l) => s + round(BigInt(l.rate) * scaled(l.quantity), 10000n),
      0,
    ),
    contingency = round(BigInt(subtotal) * scaled(data.contingency), 1000000n),
    tax = round(BigInt(subtotal + contingency) * scaled(data.tax), 1000000n),
    changes = data.changes.reduce((s, c) => s + c.amount, 0);
  if (!Number.isSafeInteger(subtotal + contingency + tax + changes))
    throw new Error("Invalid total: exceeds safe money limits.");
  return {
    subtotal,
    contingency,
    tax,
    changes,
    total: subtotal + contingency + tax + changes,
    minutes: (data.time || []).reduce((s, t) => s + t.minutes, 0),
  };
}
export const money = (amount, currency) =>
  new Intl.NumberFormat("en", { style: "currency", currency }).format(
    amount /
      10 **
        new Intl.NumberFormat("en", {
          style: "currency",
          currency,
        }).resolvedOptions().maximumFractionDigits,
  );
export function publicView(data) {
  const d = normalize(data);
  return { ...d, internalNotes: "", time: [] };
}
export function proposalHTML(data) {
  const d = publicView(data),
    t = totals(d);
  return documentHTML(
    d.name,
    `<p>${escapeHTML(d.client)} · Proposal</p><h1>${escapeHTML(d.name)}</h1>${Object.entries(
      d.brief,
    )
      .map(
        ([k, v]) =>
          `<h2>${escapeHTML(k[0].toUpperCase() + k.slice(1))}</h2><p>${escapeHTML(v)}</p>`,
      )
      .join(
        "",
      )}<h2>Investment</h2><table><thead><tr><th>Deliverable</th><th>Quantity</th><th>Price</th></tr></thead><tbody>${d.estimate.map((l) => `<tr><td>${escapeHTML(l.name)}</td><td>${l.quantity} ${l.unit}</td><td>${money(round(BigInt(l.rate) * scaled(l.quantity), 10000n), d.currency)}</td></tr>`).join("")}</tbody></table><p>Contingency: ${money(t.contingency, d.currency)} · Tax: ${money(t.tax, d.currency)}</p><h2>Total: ${money(t.total, d.currency)}</h2><h2>Schedule</h2><p>${escapeHTML(d.schedule)}</p><h2>Payment stages</h2>${d.paymentStages.map((p) => `<p>${escapeHTML(p.name)}: ${p.percentage}%</p>`).join("")}<h2>Terms</h2><p>${escapeHTML(d.terms)}</p>${d.changes.length ? "<h2>Scope changes</h2>" + d.changes.map((c) => `<h3>${escapeHTML(c.name)}</h3><p>${escapeHTML(c.impact)} · ${money(c.amount, d.currency)}</p>`).join("") : ""}<h2>Delivery</h2>${d.milestones.map((m) => `<p>${escapeHTML(m.name)} · ${escapeHTML(m.status)} ${escapeHTML(m.due)}</p>`).join("")}<h2>Handoff</h2>${d.handoff.map((h) => `<p>${h.done ? "Complete" : "Pending"} · <a href="${escapeHTML(h.url)}">${escapeHTML(h.name)}</a></p>`).join("")}`,
    d.theme,
  );
}
