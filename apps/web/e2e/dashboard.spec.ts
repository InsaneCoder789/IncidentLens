import { expect, test } from "@playwright/test";


test.beforeEach(async ({ request }) => {
  const response = await request.post("http://127.0.0.1:8000/api/incidents", {
    headers: { Authorization: `Bearer ${process.env.API_TOKEN}` },
    data: {
      title: "Checkout latency above service objective",
      description: "Checkout requests exceed the latency objective and require evidence-driven investigation.",
      severity: "high",
      status: "investigating",
      affected_service: "checkout-api",
      incident_type: "performance_degradation",
      owner: "checkout-oncall",
    },
  });
  expect(response.ok()).toBeTruthy();
});

test("moves from the public story into an authenticated incident workspace", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "See the failure before the room gets loud." })).toBeVisible();
  await page.getByRole("link", { name: "Enter command" }).click();
  await expect(page).toHaveURL(/\/signup$/);
  await page.getByLabel("Full name").fill("CI Operator");
  await page.getByLabel("Work email").fill(`operator-${testInfo.project.name}-${Date.now()}@incidentlens.dev`);
  await page.getByLabel("Password", { exact: true }).fill("incidentlens-e2e-password");
  await page.getByLabel("Team name").fill("Reliability Engineering");
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Incident command" })).toBeVisible();
  const proxyStatus = await page.evaluate(async () => (await fetch("/api/backend/api/incidents")).status);
  expect(proxyStatus).toBe(200);
  await expect(page.getByText("Checkout latency above service objective").first()).toBeVisible();
  await page.getByRole("link", { name: /Open investigation/i }).click();
  await expect(page.getByText("Checkout latency above service objective").first()).toBeVisible();
  await expect(page.getByText("Incident metadata")).toBeVisible();
});
