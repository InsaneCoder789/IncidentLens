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

test("renders live incident data and opens the investigation workspace", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Incident command" })).toBeVisible();
  const proxyResponse = await page.request.get("/api/backend/api/incidents");
  expect(proxyResponse.ok()).toBeTruthy();
  await expect(page.getByText("Checkout latency above service objective").first()).toBeVisible();
  await page.getByRole("link", { name: /Open investigation/i }).click();
  await expect(page.getByText("Checkout latency above service objective").first()).toBeVisible();
  await expect(page.getByText("Incident metadata")).toBeVisible();
});
