/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { EvidenceAtlas } from "./evidence-atlas";

describe("EvidenceAtlas", () => {
  afterEach(() => cleanup());

  it("keeps White House Selection and opens the Hall of Fame case list", () => {
    window.history.replaceState({}, "", "/");
    render(<EvidenceAtlas />);

    expect(screen.getByRole("heading", { name: "2026年度白宫严选中国F1硕博" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "白宫严选" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "名人堂" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "城市等待" })).toBeNull();
    expect(screen.queryByRole("link", { name: "同学样本" })).toBeNull();
    expect(screen.getAllByText("公开数据").length).toBeGreaterThan(0);
    expect(screen.getByText("截至 2026-09-01 00:00")).toBeTruthy();
    expect(screen.getAllByText("Median").length).toBe(5);
    expect(screen.queryByText("Average Waiting Days")).toBeNull();
    expect(screen.queryByText("DEMO DATA")).toBeNull();
    expect(screen.queryByRole("link", { name: "趋势分析" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Check 名人堂" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /广州 170/ }));
    expect(screen.getByRole("heading", { name: "广州 · 最新案例" })).toBeTruthy();
    const caseList = screen.getByLabelText("案例列表");
    expect(within(caseList).getAllByRole("article")).toHaveLength(10);
    expect(screen.getByRole("navigation", { name: "案例分页" }).textContent).toContain("1 / 17");

    fireEvent.click(screen.getByRole("button", { name: "下一页" }));
    expect(screen.getByRole("navigation", { name: "案例分页" }).textContent).toContain("2 / 17");
    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "月度趋势" })).toBeTruthy();

    fireEvent.click(screen.getByRole("link", { name: "名人堂" }));
    expect(window.location.search).toContain("view=peers");
    expect(screen.getByRole("heading", { name: "名人堂" })).toBeTruthy();
    expect(screen.getAllByText("匿名样本").length).toBeGreaterThan(0);
    expect(screen.getByText("97 个匿名案例 · 截至 2026-09-01")).toBeTruthy();
    expect(screen.queryByText("73.2")).toBeNull();
    expect(screen.queryByText("Average Waiting Days")).toBeNull();
    expect(screen.queryByRole("heading", { name: "同学样本" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Check 名人堂" })).toBeNull();
    expect(screen.getByRole("heading", { name: "核心统计" })).toBeTruthy();
    expect(screen.getByText("Q1")).toBeTruthy();
    expect(screen.getByText("Median")).toBeTruthy();
    expect(screen.getByText("Q3")).toBeTruthy();
    expect(screen.getByText("54")).toBeTruthy();
    expect(screen.getByText("75")).toBeTruthy();
    expect(screen.getByText("89")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "案例" })).toBeTruthy();
    expect(screen.queryByLabelText("名人堂案例列表")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "展开案例" }));
    const hallList = screen.getByLabelText("名人堂案例列表");
    expect(within(hallList).getAllByRole("article")).toHaveLength(10);
    expect(screen.getByRole("navigation", { name: "名人堂案例分页" }).textContent).toContain(
      "1 / 10",
    );

    fireEvent.click(screen.getByRole("button", { name: "下一页" }));
    expect(screen.getByRole("navigation", { name: "名人堂案例分页" }).textContent).toContain(
      "2 / 10",
    );
    fireEvent.click(screen.getByRole("button", { name: "收起" }));
    expect(screen.queryByLabelText("名人堂案例列表")).toBeNull();
  });

  it("restores the named views from stable URL values", () => {
    window.history.replaceState({}, "", "/?view=peers");
    render(<EvidenceAtlas />);
    expect(screen.getByRole("heading", { name: "名人堂" })).toBeTruthy();

    cleanup();
    window.history.replaceState({}, "", "/?view=hall");
    render(<EvidenceAtlas />);
    expect(window.location.search).toContain("view=peers");
    expect(screen.getByRole("heading", { name: "名人堂" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "同学样本" })).toBeNull();

    cleanup();
    window.history.replaceState({}, "", "/?view=trend");
    render(<EvidenceAtlas />);
    expect(screen.getByRole("heading", { name: "2026年度白宫严选中国F1硕博" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "月度趋势" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "白宫严选" }).getAttribute("aria-current")).toBe(
      "page",
    );
  });
});
