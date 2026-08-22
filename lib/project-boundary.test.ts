import { describe, expect, it } from "vitest";
import { projectBoundary } from "./project-boundary";

describe("project boundary", () => {
  it("keeps the initial product boundary explicit", () => {
    expect(projectBoundary.name).toContain("F-1 Visa Check");
    expect(projectBoundary.description).toContain("不承诺出签日期");
  });
});
