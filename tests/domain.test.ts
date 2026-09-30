import { test } from "node:test";
import assert from "node:assert/strict";
import {
  seed,
  normalize,
  totals,
  publicView,
  proposalHTML,
} from "../shared/domain.js";
test("money calculations use minor units and decimal quantities without accumulated rounding", () => {
  const d = normalize({
    ...seed(),
    estimate: [{ name: "Work", quantity: 1.25, rate: 1999, unit: "hours" }],
    contingency: 10,
    tax: 13,
    changes: [],
  });
  assert.deepEqual(totals(d), {
    subtotal: 2499,
    contingency: 250,
    tax: 357,
    changes: 0,
    total: 3106,
    minutes: 0,
  });
  assert.throws(() => normalize({ ...d, tax: 0.12345 }), /decimal/);
});
test("clients receive the published engagement without internal notes or time entries", () => {
  const d = {
    ...seed(),
    internalNotes: "private strategy",
    time: [{ name: "private log", minutes: 60, date: "2026-09-29" }],
  };
  const view = publicView(d);
  assert.equal(view.internalNotes, "");
  assert.deepEqual(view.time, []);
  assert.equal(JSON.stringify(view).includes("private strategy"), false);
  assert.equal(proposalHTML(d).includes("private strategy"), false);
});
