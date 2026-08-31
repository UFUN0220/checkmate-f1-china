import { describe, expect, it } from "vitest";
import { formatDays } from "./presentation";

describe("presentation formatters", () => {
  it("keeps integer and decimal day display consistent", () => {
    expect(formatDays(63)).toBe("63");
    expect(formatDays(66.5)).toBe("66.5");
    expect(formatDays(49.8)).toBe("49.8");
    expect(formatDays(63.04)).toBe("63");
    expect(formatDays(null)).toBe("—");
  });
});
