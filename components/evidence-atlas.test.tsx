/** @vitest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EvidenceAtlas } from "./evidence-atlas";

describe("EvidenceAtlas", () => {
  it("renders the snapshot and drills into a city case list", () => {
    window.history.replaceState({}, "", "/");
    render(<EvidenceAtlas />);

    expect(screen.getByRole("heading", { name: "不同领区，通常等多久？" })).toBeTruthy();
    expect(screen.getAllByText("STATIC SNAPSHOT").length).toBeGreaterThan(0);
    expect(screen.getByText("REAL PUBLIC DATA")).toBeTruthy();
    expect(screen.getByText("475 个公开 F-1 案例")).toBeTruthy();
    expect(screen.getByText("中位等待 · 统计 n=177")).toBeTruthy();
    expect(screen.getAllByText("DEMO DATA").length).toBeGreaterThan(1);
    expect(screen.getByRole("heading", { name: "身边同学现在等多久？" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Check 名人堂" })).toBeTruthy();
    expect(document.body.textContent).not.toContain("CHECKEE_ACCESS_BLOCKED");

    fireEvent.click(screen.getByRole("button", { name: /广州 158/ }));
    expect(screen.getByRole("heading", { name: "广州的公开案例" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /查看案例列表/ }));
    expect(window.location.hash).toBe("#public-cases");
    expect(screen.getByRole("heading", { name: "数字背后，是一条条时间线。" })).toBeTruthy();
  });
});
