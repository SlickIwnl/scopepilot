import { expect, test, type Page } from "@playwright/test";
import { syntheticInquiry } from "../../src/eval/fixtures";
import { WorkflowResultSchema } from "../../src/shared/contracts";

async function fillInquiry(page: Page, company = syntheticInquiry.company, challenge = syntheticInquiry.challenge) {
  await expect(page.getByRole("radio", { name: /Cedar Finch/ })).toBeChecked();
  await page.getByLabel("Client name", { exact: true }).fill(syntheticInquiry.clientName);
  await page.getByLabel("Company", { exact: true }).fill(company);
  await page.getByLabel("What challenge are you trying to solve?").fill(challenge);
  await page.getByLabel("What outcome would make this useful?").fill(syntheticInquiry.desiredOutcome);
}

async function submit(page: Page, status = 201) {
  const responsePromise = page.waitForResponse((response) => response.url().endsWith("/api/workflows") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Build workflow", exact: true }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(status);
  return response;
}

test("real fixture API renders every section and checklist state remains local", async ({ page }, testInfo) => {
  const apiRequests: string[] = [];
  const pageErrors: string[] = [];
  page.on("request", (request) => { if (request.url().includes("/api/")) apiRequests.push(`${request.method()} ${request.url()}`); });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/");
  await fillInquiry(page);
  const result = WorkflowResultSchema.parse(await (await submit(page)).json());
  expect(result.inquiry).toEqual(syntheticInquiry);
  const brief = page.getByRole("region", { name: "Discovery brief", exact: true });
  const proposal = page.getByRole("region", { name: "Proposal", exact: true });
  const tasks = page.getByRole("region", { name: "Follow-up tasks", exact: true });
  await expect(brief).toBeVisible();
  await expect(proposal).toBeVisible();
  await expect(tasks).toBeVisible();
  for (const title of ["Goals", "Constraints", "Open questions"]) await expect(brief.getByRole("heading", { name: title, exact: true })).toBeVisible();
  for (const text of [result.draft.discoveryBrief.summary, ...result.draft.discoveryBrief.goals, ...result.draft.discoveryBrief.constraints, ...result.draft.discoveryBrief.openQuestions]) {
    await expect(brief.getByText(text, { exact: true })).toBeVisible();
  }
  for (const text of [result.draft.proposal.title, result.draft.proposal.summary, result.draft.proposal.scope, result.draft.proposal.timeline, ...result.draft.proposal.deliverables]) {
    await expect(proposal.getByText(text, { exact: true })).toBeVisible();
  }
  await expect(tasks.getByRole("checkbox")).toHaveCount(result.draft.followUpTasks.length);
  for (const task of result.draft.followUpTasks) {
    await expect(tasks.getByText(task.title, { exact: true })).toBeVisible();
    await expect(tasks.getByText(task.rationale, { exact: true })).toBeVisible();
  }
  for (const text of ["Client / Tomorrow", "Consultant / Today", "Client / In 3 days"]) await expect(tasks.getByText(text, { exact: true })).toBeVisible();

  const intakeBox = await page.getByRole("region", { name: "Set the brief in motion." }).boundingBox();
  const outputBox = await page.getByRole("region", { name: "Your working draft." }).boundingBox();
  expect(intakeBox).not.toBeNull();
  expect(outputBox).not.toBeNull();
  if (testInfo.project.name === "mobile-chromium") {
    expect(outputBox!.y).toBeGreaterThanOrEqual(intakeBox!.y + intakeBox!.height - 1);
  } else {
    expect(outputBox!.x).toBeGreaterThan(intakeBox!.x);
    expect(Math.abs(outputBox!.y - intakeBox!.y)).toBeLessThan(2);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("workflow.png"), fullPage: true });

  const checkbox = tasks.getByRole("checkbox").first();
  const requestsBefore = [...apiRequests];
  await checkbox.check();
  await expect(checkbox).toBeChecked();
  await checkbox.uncheck();
  await expect(checkbox).not.toBeChecked();
  await checkbox.check();
  expect(apiRequests).toEqual(requestsBefore);

  await submit(page);
  await expect(tasks.getByRole("checkbox").first()).not.toBeChecked();
  await tasks.getByRole("checkbox").first().check();
  await page.reload();
  await expect(page.getByText("Your generated work will land here.")).toBeVisible();
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await fillInquiry(page);
  await submit(page);
  await expect(tasks.getByRole("checkbox").first()).not.toBeChecked();
  expect(pageErrors).toEqual([]);
});

test("generation failure clears stale output and permits recovery", async ({ page }) => {
  await page.goto("/");
  await fillInquiry(page);
  await submit(page);
  await expect(page.getByRole("heading", { name: "Discovery brief", exact: true })).toBeVisible();
  await page.getByLabel("Company", { exact: true }).fill("FAIL_GENERATION");
  const response = await submit(page, 502);
  expect(await response.json()).toEqual({ error: "Workflow generation failed." });
  await expect(page.getByRole("alert")).toHaveText("We couldn't build that workflow. Check the details and try again.");
  await expect(page.getByRole("heading", { name: "Discovery brief", exact: true })).toHaveCount(0);
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Build workflow", exact: true })).toBeEnabled();
  await expect(page.getByLabel("Company", { exact: true })).toHaveValue("FAIL_GENERATION");
  await page.getByLabel("Company", { exact: true }).fill(syntheticInquiry.company);
  await submit(page);
  await expect(page.getByRole("heading", { name: "Discovery brief", exact: true })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("user-supplied markup is rendered as text, never executable HTML", async ({ page }) => {
  const challenge = '<img src=x onerror="window.__scopepilotXss=true"> Clarify synthetic discovery work.';
  await page.goto("/");
  await fillInquiry(page, syntheticInquiry.company, challenge);
  await submit(page);
  const brief = page.getByRole("region", { name: "Discovery brief", exact: true });
  await expect(brief).toContainText(challenge);
  await expect(brief.locator("img, script")).toHaveCount(0);
  expect(await page.evaluate(() => "__scopepilotXss" in window)).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
