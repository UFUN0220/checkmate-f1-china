/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { EvidenceAtlas } from "./evidence-atlas";

describe("EvidenceAtlas", () => {
  afterEach(() => cleanup());

  it("renders the snapshot and drills into a city case list", () => {
    window.history.replaceState({}, "", "/");
    render(<EvidenceAtlas />);

    expect(screen.getByRole("heading", { name: "中国 F-1 Check 等待情况" })).toBeTruthy();
    expect(screen.getAllByText("STATIC SNAPSHOT").length).toBeGreaterThan(0);
    expect(screen.getByText("REAL PUBLIC DATA")).toBeTruthy();
    expect(screen.getByText("截至 2026-09-01 00:00")).toBeTruthy();
    expect(screen.getAllByText("Median").length).toBe(5);
    expect(screen.queryByText("DEMO DATA")).toBeNull();
    expect(screen.queryByRole("heading", { name: "身边同学现在等多久？" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "最长等待 Top 10" })).toBeNull();
    expect(document.body.textContent).not.toContain("CHECKEE_ACCESS_BLOCKED");

    fireEvent.click(screen.getByRole("button", { name: /广州 170/ }));
    expect(screen.getByRole("heading", { name: "广州的公开案例" })).toBeTruthy();
    expect(screen.getByText("当前查看：广州")).toBeTruthy();

    fireEvent.click(screen.getByRole("link", { name: "趋势分析" }));
    expect(window.location.search).toContain("view=trend");
    expect(screen.getByRole("heading", { name: "趋势分析" })).toBeTruthy();
    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.getByText("2026 Jan–Aug Total")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "广州的公开案例" })).toBeNull();

    fireEvent.click(screen.getByRole("link", { name: "同学样本" }));
    expect(window.location.search).toContain("view=peers");
    expect(screen.getByRole("heading", { name: "身边同学" })).toBeTruthy();
    expect(screen.getAllByText("DEMO DATA").length).toBeGreaterThan(1);
    expect(screen.queryByRole("heading", { name: "中国 F-1 Check 等待情况" })).toBeNull();

    fireEvent.click(screen.getByRole("link", { name: "Check 名人堂" }));
    expect(window.location.search).toContain("view=hall");
    expect(screen.getByRole("heading", { name: "Check 名人堂" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "最长等待 Top 10" })).toBeTruthy();
    expect(screen.getByLabelText("Check 名人堂 Top 3")).toBeTruthy();
  });

  it("restores the independent view from the URL", () => {
    window.history.replaceState({}, "", "/?view=peers");
    render(<EvidenceAtlas />);

    expect(screen.getByRole("heading", { name: "身边同学" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "中国 F-1 Check 等待情况" })).toBeNull();
    expect(
      screen
        .getAllByRole("link", { name: "同学样本" })
        .some((link) => link.getAttribute("aria-current") === "page"),
    ).toBe(true);
  });
});
