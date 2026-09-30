import {
  seed,
  normalize,
  publicView,
  proposalHTML,
  totals,
  money,
} from "../shared/domain.js";
import { defaultTheme } from "../vendor/professional/shared/model.js";
export const config = {
  id: "fieldwork",
  name: "Fieldwork",
  port: 8180,
  seed,
  normalize,
  publicView,
  importKit: (kit) =>
    normalize({
      ...seed(kit.data.name || kit.manifest.projectName),
      theme: kit.data.theme || defaultTheme,
      ...(kit.manifest.app === "fieldwork"
        ? kit.data
        : {
            brief: {
              ...seed().brief,
              deliverables: kit.data.notes || seed().brief.deliverables,
            },
          }),
    }),
  export(p, format) {
    if (format === "html" || format === "pdf")
      return {
        body: proposalHTML(p.data),
        mime: "text/html",
        name: "proposal." + format,
      };
    if (format === "markdown")
      return {
        body: `# ${p.data.name}\n\n${Object.entries(p.data.brief)
          .map(([k, v]) => `## ${k}\n\n${v}`)
          .join(
            "\n\n",
          )}\n\n## Investment\n\n${money(totals(p.data).total, p.data.currency)}\n\n## Terms\n\n${p.data.terms}`,
        mime: "text/markdown",
        name: "proposal.md",
      };
    return null;
  },
  email(d, url) {
    return {
      subject: "Project update: " + d.name,
      html: proposalHTML(d),
      text:
        d.name +
        "\n" +
        d.brief.goals +
        "\nInvestment: " +
        money(totals(d).total, d.currency) +
        "\nOpen your project: " +
        url,
    };
  },
};
