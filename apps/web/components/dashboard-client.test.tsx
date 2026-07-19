import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { expect, test } from "vitest";
import { DashboardClient } from "@/components/dashboard-client";


test("renders persisted dashboard metrics and an empty incident state", () => {
  render(createElement(DashboardClient, { dashboard: {
    incidents: [],
    metrics: [{ label: "Active incidents", value: "0", detail: "Open operational investigations", tone: "success" }],
    recent_events: [],
    pending_approvals: 0,
  } }));

  expect(screen.getByText("Incident command")).toBeInTheDocument();
  expect(screen.getAllByText("Active incidents")).toHaveLength(2);
  expect(screen.getByText("No incidents have been created.")).toBeInTheDocument();
});
