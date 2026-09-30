import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";
test("public repertoire is responsive, branded, and keyboard usable", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  await expect(page.locator(".hero-copy > div > h1")).toBeVisible();
  await expect(page.locator(".studio-header .pf-brand-signature")).toHaveText(
    "by YRP",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Explore", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Try the materials" }),
  ).toBeVisible();
  await page.keyboard.press("Tab");
  expect(await page.locator(":focus").count()).toBe(1);
  await page.screenshot({
    path: "test-results/public-" + test.info().project.name + ".png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("account workflow saves, publishes, comments, exports and invites safely", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("app");
  await page
    .getByRole("button", { name: "New workspace", exact: true })
    .click();
  await page.getByLabel("Workspace name").fill("QA " + Date.now());
  await page
    .getByRole("button", { name: "Create workspace", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Create a project", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Project name", exact: true })
    .fill("A coherent engagement");
  await page
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await expect(
    page
      .locator(".project-heading")
      .getByRole("heading", { level: 1, name: "A coherent engagement" }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: /^(Project|Publication) name$/ })
    .fill("A considered revision");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByText("Saved · Revision 2")).toBeVisible();
  await page
    .getByRole("button", { name: "Publish for review", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Review & evidence", exact: true })
    .click();
  await page
    .getByLabel("Add a comment")
    .fill("The revised materials are ready for a closer look.");
  await page.getByRole("button", { name: "Add comment", exact: true }).click();
  await expect(
    page.getByText("The revised materials are ready for a closer look."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const downloaded = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Portable project kit", exact: true })
    .click();
  const download = await downloaded;
  const file = await download.path();
  const kit = unzipSync(await readFile(file!));
  expect(JSON.parse(strFromU8(kit["project.json"])).name).toBe(
    "A considered revision",
  );
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Team & client access", exact: true })
    .click();
  await page
    .getByLabel("Invite by Google email")
    .fill("fixture-reviewer@invalid.test");
  await page
    .getByRole("combobox", { name: "Access", exact: true })
    .selectOption("reviewer");
  await page
    .getByRole("button", { name: "Create invitation", exact: true })
    .click();
  await expect(page.getByLabel("Invitation link")).toHaveValue(/invite=/);
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    await expect
      .poll(() =>
        page
          .getByRole("dialog")
          .evaluate((el) => el.contains(document.activeElement)),
      )
      .toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.screenshot({
    path: "test-results/workspace-" + test.info().project.name + ".png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("an account reviews exact email and attachments before one recorded send", async ({
  page,
}) => {
  await page.goto("app");
  await page
    .getByRole("button", { name: "New workspace", exact: true })
    .click();
  await page.getByLabel("Workspace name").fill("Mailbox workflow");
  await page
    .getByRole("button", { name: "Create workspace", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Create a project", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Project name", exact: true })
    .fill("Mail review");
  await page
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Mail connections", exact: true })
    .click();
  await page.getByLabel("Public SMTP hostname").fill("smtp.invalid.test");
  await page.getByLabel("SMTP username").fill("fixture");
  await page.getByLabel("SMTP password").fill("synthetic-only");
  await page.getByLabel("Sender email").fill("yorphos@gmail.com");
  await page
    .getByRole("button", { name: "Save encrypted connection", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await page
    .locator('.project-footer input[type="file"]')
    .setInputFiles({
      name: "evidence.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Checked source evidence"),
    });
  await expect(
    page.getByRole("link", { name: "evidence.txt", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Compose project email", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Your sender connection" })
    .selectOption({ label: "My mailbox" });
  await page
    .getByLabel("Recipients · comma separated")
    .fill("fixture-reviewer@invalid.test");
  await page.getByRole("checkbox", { name: "evidence.txt" }).check();
  await page.getByRole("button", { name: "Review exact email" }).click();
  await expect(
    page.getByText(
      "From: yorphos@gmail.com · To: fixture-reviewer@invalid.test",
    ),
  ).toBeVisible();
  await expect(page.getByTitle("Exact email preview")).toBeVisible();
  await page.getByRole("button", { name: "Confirm and send" }).click();
  await expect(page.getByRole("status")).toContainText("accepted by server");
  await page.getByRole("button", { name: "Review & evidence" }).click();
  await expect(page.locator(".review-panel")).toContainText(
    "accepted by server",
  );
});

test("named client acceptance records verified identity and consent on a published proposal", async ({
  page,
  browser,
}) => {
  const origin = new URL(test.info().project.use.baseURL as string).origin;
  const mutate = async (url: string, data: any) => {
    const r = await page.request.post(url, {
      headers: { Origin: origin, "X-Studio-Request": "1" },
      data,
    });
    expect(r.ok()).toBe(true);
    return r.json();
  };
  const w = await mutate("api/workspaces", { name: "Client acceptance" }),
    p = await mutate("api/workspaces/" + w.id + "/projects", {
      name: "A proposal for review",
    });
  await mutate("api/projects/" + p.id + "/publish", { revision: 1 });
  const i = await mutate("api/workspaces/" + w.id + "/invitations", {
    email: "fixture-client@invalid.test",
    role: "reviewer",
    project: p.id,
    canAccept: true,
  });
  const context = await browser.newContext({
    baseURL: test.info().project.use.baseURL,
    extraHTTPHeaders: {
      "X-Portfolio-Secret": "synthetic-browser-fixture-credential-".repeat(2),
      "X-Portfolio-User": "synthetic-client",
      "X-Portfolio-Email": "fixture-client@invalid.test",
      "X-Portfolio-Role": "member",
    },
  });
  try {
    const client = await context.newPage();
    await client.goto("app?invite=" + i.id);
    await client
      .getByRole("button", { name: "Accept invitation", exact: true })
      .click();
    await client
      .getByRole("button", { name: "A proposal for review", exact: true })
      .click();
    await client.getByRole("button", { name: "Review & evidence" }).click();
    await client.getByRole("button", { name: "Review this revision" }).click();
    await client.getByLabel("Your full name").fill("Synthetic Client");
    await client.getByRole("checkbox", { name: /I accept the scope/ }).check();
    await client
      .getByLabel("Review or explicit acceptance")
      .fill("I accept this published proposal.");
    await client
      .getByRole("button", { name: "Accept proposal", exact: true })
      .click();
    await expect(client.getByRole("status")).toContainText("exact revision");
    await expect(client.locator(".review-panel")).toContainText(
      "Synthetic Client",
    );
    await expect(
      client.getByRole("button", { name: "Save changes" }),
    ).toHaveCount(0);
  } finally {
    await context.close();
  }
});
