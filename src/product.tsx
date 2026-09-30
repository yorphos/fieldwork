import { Field, Studio } from "../vendor/professional/react/studio";
import type { Product, EditorProps } from "../vendor/professional/react/studio";
import { themeVars } from "../vendor/professional/react/theme";
import { seed, totals, money } from "../shared/domain.js";
function Editor({ data, onChange, module, readonly }: EditorProps) {
  const set = (key: string, value: any) => onChange({ ...data, [key]: value });
  const update = (key: string, index: number, row: any) =>
    set(
      key,
      data[key].map((r: any, i: number) => (i === index ? row : r)),
    );
  const total = totals(data);
  const digits =
    new Intl.NumberFormat("en", {
      style: "currency",
      currency: data.currency,
    }).resolvedOptions().maximumFractionDigits ?? 2;
  return (
    <fieldset disabled={readonly}>
      <Field label="Project name">
        <input
          value={data.name}
          onChange={(e) => set("name", e.target.value)}
        />
      </Field>
      <Field label="Client">
        <input
          value={data.client}
          onChange={(e) => set("client", e.target.value)}
        />
      </Field>
      {module === "brief" &&
        Object.entries(data.brief).map(([key, value]) => (
          <Field key={key} label={key[0].toUpperCase() + key.slice(1)}>
            <textarea
              value={String(value)}
              onChange={(e) =>
                set("brief", { ...data.brief, [key]: e.target.value })
              }
            />
          </Field>
        ))}
      {module === "estimate" && (
        <>
          <Field label="Project currency">
            <select
              value={data.currency}
              onChange={(e) => set("currency", e.target.value)}
            >
              {["USD", "CAD", "EUR", "GBP", "JPY", "AUD"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          {data.estimate.map((row: any, i: number) => (
            <div className="list-item" key={i}>
              <Field label="Line item">
                <input
                  value={row.name}
                  onChange={(e) =>
                    update("estimate", i, { ...row, name: e.target.value })
                  }
                />
              </Field>
              <div className="inline-fields">
                <Field label="Quantity">
                  <input
                    type="number"
                    min="0"
                    step=".25"
                    value={row.quantity}
                    onChange={(e) =>
                      update("estimate", i, {
                        ...row,
                        quantity: Number(e.target.value),
                      })
                    }
                  />
                </Field>
                <Field label={"Rate · " + data.currency}>
                  <input
                    type="number"
                    min="0"
                    step={1 / 10 ** digits}
                    value={row.rate / 10 ** digits}
                    onChange={(e) =>
                      update("estimate", i, {
                        ...row,
                        rate: Math.round(Number(e.target.value) * 10 ** digits),
                      })
                    }
                  />
                </Field>
              </div>
              <Field label="Unit">
                <select
                  value={row.unit}
                  onChange={(e) =>
                    update("estimate", i, { ...row, unit: e.target.value })
                  }
                >
                  <option value="fixed">Fixed</option>
                  <option value="hours">Hours</option>
                </select>
              </Field>
              <button
                onClick={() =>
                  set(
                    "estimate",
                    data.estimate.filter((_: any, j: number) => j !== i),
                  )
                }
              >
                Remove line
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              set("estimate", [
                ...data.estimate,
                {
                  name: "New deliverable",
                  quantity: 1,
                  rate: 0,
                  unit: "fixed",
                },
              ])
            }
          >
            Add line item
          </button>
          <div className="inline-fields">
            {["contingency", "tax"].map((key) => (
              <Field
                key={key}
                label={key === "tax" ? "Manual tax %" : "Contingency %"}
              >
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={data[key]}
                  onChange={(e) => set(key, Number(e.target.value))}
                />
              </Field>
            ))}
          </div>
          <div className="estimate-stats">
            <div>
              <strong>{money(total.total, data.currency)}</strong>
              <small>Proposed investment</small>
            </div>
            <div>
              <strong>{(total.minutes / 60).toFixed(1)} h</strong>
              <small>Recorded time</small>
            </div>
          </div>
        </>
      )}
      {module === "proposal" && (
        <>
          <Field label="Schedule">
            <textarea
              value={data.schedule}
              onChange={(e) => set("schedule", e.target.value)}
            />
          </Field>
          <Field label="Terms">
            <textarea
              value={data.terms}
              onChange={(e) => set("terms", e.target.value)}
            />
          </Field>
          {data.paymentStages.map((p: any, i: number) => (
            <div className="inline-fields" key={i}>
              <Field label="Payment stage">
                <input
                  value={p.name}
                  onChange={(e) =>
                    update("paymentStages", i, { ...p, name: e.target.value })
                  }
                />
              </Field>
              <Field label="Percentage">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={p.percentage}
                  onChange={(e) =>
                    update("paymentStages", i, {
                      ...p,
                      percentage: Number(e.target.value),
                    })
                  }
                />
              </Field>
            </div>
          ))}
          <p className="handoff-note">
            Publish a fixed revision, then invite the named client with proposal
            acceptance enabled. Their decision records the exact revision and
            digest.
          </p>
        </>
      )}
      {module === "delivery" && (
        <>
          {data.milestones.map((m: any, i: number) => (
            <div className="list-item" key={i}>
              <Field label="Milestone">
                <input
                  value={m.name}
                  onChange={(e) =>
                    update("milestones", i, { ...m, name: e.target.value })
                  }
                />
              </Field>
              <div className="inline-fields">
                <Field label="Status">
                  <select
                    value={m.status}
                    onChange={(e) =>
                      update("milestones", i, { ...m, status: e.target.value })
                    }
                  >
                    {["planned", "active", "in_review", "completed"].map(
                      (s) => (
                        <option key={s}>{s}</option>
                      ),
                    )}
                  </select>
                </Field>
                <Field label="Due date">
                  <input
                    type="date"
                    value={m.due}
                    onChange={(e) =>
                      update("milestones", i, { ...m, due: e.target.value })
                    }
                  />
                </Field>
              </div>
              <Field label="Assigned team member">
                <input
                  value={m.assignee}
                  onChange={(e) =>
                    update("milestones", i, { ...m, assignee: e.target.value })
                  }
                />
              </Field>
            </div>
          ))}
          <button
            onClick={() =>
              set("milestones", [
                ...data.milestones,
                {
                  name: "New milestone",
                  status: "planned",
                  due: "",
                  assignee: "",
                },
              ])
            }
          >
            Add milestone
          </button>
          {!readonly && (
            <>
              <h3>Assigned tasks</h3>
              {data.tasks.map((t: any, i: number) => (
                <div className="list-item" key={i}>
                  <Field label="Task">
                    <input
                      value={t.name}
                      onChange={(e) =>
                        update("tasks", i, { ...t, name: e.target.value })
                      }
                    />
                  </Field>
                  <div className="inline-fields">
                    <Field label="Task status">
                      <select
                        value={t.status}
                        onChange={(e) =>
                          update("tasks", i, { ...t, status: e.target.value })
                        }
                      >
                        {["planned", "active", "in_review", "completed"].map(
                          (s) => (
                            <option key={s}>{s}</option>
                          ),
                        )}
                      </select>
                    </Field>
                    <Field label="Task due date">
                      <input
                        type="date"
                        value={t.due}
                        onChange={(e) =>
                          update("tasks", i, { ...t, due: e.target.value })
                        }
                      />
                    </Field>
                  </div>
                  <Field label="Task assignee">
                    <input
                      value={t.assignee}
                      onChange={(e) =>
                        update("tasks", i, { ...t, assignee: e.target.value })
                      }
                    />
                  </Field>
                </div>
              ))}
              <button
                onClick={() =>
                  set("tasks", [
                    ...data.tasks,
                    {
                      name: "New task",
                      status: "planned",
                      due: "",
                      assignee: "",
                    },
                  ])
                }
              >
                Add task
              </button>
              <h3>Internal time entries</h3>
              {data.time.map((t: any, i: number) => (
                <div className="inline-fields" key={i}>
                  <Field label="Work">
                    <input
                      value={t.name}
                      onChange={(e) =>
                        update("time", i, { ...t, name: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Minutes">
                    <input
                      type="number"
                      value={t.minutes}
                      min="0"
                      max="1440"
                      onChange={(e) =>
                        update("time", i, {
                          ...t,
                          minutes: Number(e.target.value),
                        })
                      }
                    />
                  </Field>
                </div>
              ))}
              <button
                onClick={() =>
                  set("time", [
                    ...data.time,
                    {
                      name: "Project work",
                      minutes: 60,
                      date: new Date().toISOString().slice(0, 10),
                    },
                  ])
                }
              >
                Log time
              </button>
              <Field label="Private internal notes">
                <textarea
                  value={data.internalNotes}
                  onChange={(e) => set("internalNotes", e.target.value)}
                />
              </Field>
            </>
          )}
          <h3>Scope changes</h3>
          {data.changes.map((c: any, i: number) => (
            <div className="list-item" key={i}>
              <Field label="Change">
                <input
                  value={c.name}
                  onChange={(e) =>
                    update("changes", i, { ...c, name: e.target.value })
                  }
                />
              </Field>
              <Field label="Impact on scope and schedule">
                <textarea
                  value={c.impact}
                  onChange={(e) =>
                    update("changes", i, { ...c, impact: e.target.value })
                  }
                />
              </Field>
              <Field label={"Price change · " + data.currency}>
                <input
                  type="number"
                  value={c.amount / 10 ** digits}
                  onChange={(e) =>
                    update("changes", i, {
                      ...c,
                      amount: Math.round(Number(e.target.value) * 10 ** digits),
                    })
                  }
                />
              </Field>
            </div>
          ))}
          <button
            onClick={() =>
              set("changes", [
                ...data.changes,
                {
                  name: "Additional scope",
                  impact: "Describe the proposed change.",
                  amount: 0,
                },
              ])
            }
          >
            Propose scope change
          </button>
          <p className="handoff-note">
            Save and publish the revised proposal for a new client decision.
            Earlier acceptance receipts stay intact.
          </p>
        </>
      )}
      {module === "handoff" && (
        <>
          {data.handoff.map((h: any, i: number) => (
            <div className="list-item" key={i}>
              <Field label="Deliverable">
                <input
                  value={h.name}
                  onChange={(e) =>
                    update("handoff", i, { ...h, name: e.target.value })
                  }
                />
              </Field>
              <Field label="Deliverable URL">
                <input
                  type="url"
                  value={h.url}
                  onChange={(e) =>
                    update("handoff", i, { ...h, url: e.target.value })
                  }
                />
              </Field>
              <label>
                <input
                  type="checkbox"
                  checked={h.done}
                  onChange={(e) =>
                    update("handoff", i, { ...h, done: e.target.checked })
                  }
                />{" "}
                Complete
              </label>
            </div>
          ))}
          <button
            onClick={() =>
              set("handoff", [
                ...data.handoff,
                {
                  name: "Implementation repository",
                  url: "https://example.com",
                  done: false,
                },
              ])
            }
          >
            Add deliverable
          </button>
          <p className="handoff-note">
            Attach final files, export the project kit, and retain the exact
            client acceptance receipts in Review & evidence.
          </p>
        </>
      )}
    </fieldset>
  );
}
export function Preview({ data, module }: { data: any; module: string }) {
  const t = totals(data);
  return (
    <div className="preview-document" style={themeVars(data.theme)}>
      <p className="preview-label">
        {data.client} /{" "}
        {module === "delivery" ? "Project delivery" : "A project proposal"}
      </p>
      <h1>{data.name}</h1>
      <p>{data.brief.goals}</p>
      <h2>A clear scope</h2>
      <p>{data.brief.deliverables}</p>
      {module === "delivery" ? (
        <>
          <h2>The work ahead</h2>
          {data.milestones.map((m: any, i: number) => (
            <div className="revision-card" key={i}>
              <strong>{m.name}</strong>
              <span>
                {m.status.replaceAll("_", " ")}
                {m.due ? " · " + m.due : ""}
              </span>
            </div>
          ))}
          {data.changes.length > 0 && (
            <>
              <h2>Proposed scope changes</h2>
              {data.changes.map((c: any, i: number) => (
                <p key={i}>
                  {c.name}: {c.impact} · {money(c.amount, data.currency)}
                </p>
              ))}
            </>
          )}
        </>
      ) : module === "handoff" ? (
        <>
          <h2>Your deliverables</h2>
          {data.handoff.length ? (
            data.handoff.map((h: any, i: number) => (
              <p key={i}>
                {h.done ? "✓" : "○"}{" "}
                <a href={h.url} target="_blank" rel="noreferrer">
                  {h.name}
                </a>
              </p>
            ))
          ) : (
            <p>Add your finished materials and any remaining next steps.</p>
          )}
        </>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Deliverable</th>
                <th>Investment</th>
              </tr>
            </thead>
            <tbody>
              {data.estimate.map((row: any, i: number) => (
                <tr key={i}>
                  <td>{row.name}</td>
                  <td>
                    {money(Math.round(row.rate * row.quantity), data.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="total">
            <span>Total investment</span>
            <span>{money(t.total, data.currency)}</span>
          </div>
          <h2>Schedule & next steps</h2>
          <p>{data.schedule}</p>
          <p>{data.terms}</p>
        </>
      )}
      <p className="preview-label" style={{ marginTop: 35, marginBottom: 0 }}>
        Prepared with care. A revision for review.
      </p>
    </div>
  );
}
const product: Product = {
  id: "fieldwork",
  name: "Fieldwork",
  kicker: "FROM FIRST CONVERSATION TO FINAL HANDOFF.",
  tagline: "A clearer way to work together.",
  description:
    "Give your professional projects a thoughtful home. Shape the brief, agree on the work, and keep every decision and deliverable connected.",
  modules: [
    {
      id: "brief",
      name: "Brief",
      description: "Goals, constraints, and the work worth doing.",
    },
    {
      id: "estimate",
      name: "Estimate",
      description: "A clear investment, with room for uncertainty.",
    },
    {
      id: "proposal",
      name: "Proposal",
      description: "Scope and terms that everyone can review.",
    },
    {
      id: "delivery",
      name: "Delivery",
      description: "Milestones, change requests, and useful progress.",
    },
    {
      id: "handoff",
      name: "Handoff",
      description: "The finished work and the evidence behind it.",
    },
  ],
  seed,
  Editor,
  Preview,
  exports: [
    { id: "pdf", name: "Proposal · PDF" },
    { id: "html", name: "Proposal · HTML" },
    { id: "markdown", name: "Proposal · Markdown" },
  ],
};
export default function App() {
  return <Studio product={product} />;
}
