/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { EvidenceAtlas } from "./evidence-atlas";

describe("EvidenceAtlas", () => {
  afterEach(() => cleanup());

  it("renders the snapshot and drills into a city case list", () => {
    window.history.replaceState({}, "", "/");
    render(<EvidenceAtlas />);

    expect(screen.getByRole("heading", { name: "2026年度白宫严选中国F1硕博" })).toBeTruthy();
    expect(screen.getAllByText("STATIC SNAPSHOT").length).toBeGreaterThan(0);
    expect(screen.getByText("REAL PUBLIC DATA")).toBeTruthy();
    expect(screen.getByText("截至 2026-09-01 00:00")).toBeTruthy();
    expect(screen.getAllByText("Median").length).toBe(5);
    expect(screen.queryByText("DEMO DATA")).toBeNull();
    expect(screen.queryByRole("heading", { name: "身边同学现在等多久？" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "最长等待 Top 10" })).toBeNull();
    expect(document.body.textContent).not.toContain("CHECKEE_ACCESS_BLOCKED");

    fireEvent.click(screen.getByRole("button", { name: /广州 170/ }));
    expect(screen.getByRole("heading", { name: "广州 · 最新案例" })).toBeTruthy();
    expect(screen.getByText("当前查看：广州")).toBeTruthy();
    const caseList = screen.getByLabelText("案例列表");
    expect(within(caseList).getAllByRole("article")).toHaveLength(10);
    expect(screen.getByRole("navigation", { name: "案例分页" }).textContent).toContain("1 / 17");

    const firstPageText = caseList.textContent;
    fireEvent.click(screen.getByRole("button", { name: "下一页" }));
    expect(screen.getByRole("navigation", { name: "案例分页" }).textContent).toContain("2 / 17");
    expect(caseList.textContent).not.toBe(firstPageText);

    expect(screen.queryByRole("link", { name: "趋势分析" })).toBeNull();
    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.getByText("2026 Jan–Aug Total")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "月度趋势" })).toBeTruthy();

    fireEvent.click(screen.getByRole("link", { name: "同学样本" }));
    expect(window.location.search).toContain("view=peers");
    expect(screen.getByRole("heading", { name: "身边同学" })).toBeTruthy();
    expect(screen.getAllByText("DEMO DATA").length).toBeGreaterThan(1);
    expect(screen.queryByRole("heading", { name: "2026年度白宫严选中国F1硕博" })).toBeNull();

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
    expect(screen.queryByRole("heading", { name: "2026年度白宫严选中国F1硕博" })).toBeNull();
    expect(
      screen
        .getAllByRole("link", { name: "同学样本" })
        .some((link) => link.getAttribute("aria-current") === "page"),
    ).toBe(true);
  });

  it("folds the trend route back into the cities view", () => {
    window.history.replaceState({}, "", "/?view=trend");
    render(<EvidenceAtlas />);

    expect(screen.getByRole("heading", { name: "2026年度白宫严选中国F1硕博" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "月度趋势" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "城市等待" }).getAttribute("aria-current")).toBe(
      "page",
    );
    expect(screen.queryByRole("link", { name: "趋势分析" })).toBeNull();
  });
});
