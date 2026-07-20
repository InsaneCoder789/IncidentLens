import { describe, expect, test } from "vitest";

import { getApiErrorMessage } from "@/lib/api-error";

describe("getApiErrorMessage", () => {
  test("returns a plain API detail", () => {
    expect(getApiErrorMessage({ detail: "An account already exists for this email" }, "Fallback"))
      .toBe("An account already exists for this email");
  });

  test("formats FastAPI validation issues with readable field names", () => {
    const payload = {
      detail: [
        { loc: ["body", "password"], msg: "String should have at least 10 characters" },
        { loc: ["body", "team_name"], msg: "Field required" },
      ],
    };

    expect(getApiErrorMessage(payload, "Fallback"))
      .toBe("Password: String should have at least 10 characters Team name: Field required");
  });

  test("never renders an unknown object as object Object", () => {
    expect(getApiErrorMessage({ detail: { unexpected: true } }, "Request failed"))
      .toBe("Request failed");
  });
});
