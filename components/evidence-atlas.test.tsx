/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { EvidenceAtlas } from "./evidence-atlas";

describe("EvidenceAtlas", () => {
  afterEach(() => cleanup());

  it("renders the snapshot and drills into a city case list", () => {
    window.history.replaceState({}, "", "/");
    render(<EvidenceAtlas />);

    expect(screen.getByRole("heading", { name: "城市等待" })).toBeTruthy();
    expect(screen.getAllByText("STATIC SNAPSHOT").length).toBeGreaterThan(0);
    expect(screen.getByText("REAL PUBLIC DATA")).toBeTruthy();
    expect(screen.getByText(/475 个公开 F-1 案例/)).toBeTruthy();
    expect(screen.getByText("中位等待 · 统计 n=177")).toBeTruthy();
    expect(screen.queryByText("DEMO DATA")).toBeNull();
    expect(screen.queryByRole("heading", { name: "身边同学现在等多久？" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "最长等待 Top 10" })).toBeNull();
    expect(document.body.textContent).not.toContain("CHECKEE_ACCESS_BLOCKED");

    fireEvent.click(screen.getByRole("button", { name: /广州 158/ }));
    expect(screen.getByRole("heading", { name: "广州的公开案例" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /查看案例列表/ }));
    expect(window.location.hash).toBe("#public-cases");

    fireEvent.click(screen.getByRole("link", { name: "同学样本" }));
    expect(window.location.search).toContain("view=peers");
    expect(screen.getByRole("heading", { name: "身边同学" })).toBeTruthy();
    expect(screen.getAllByText("DEMO DATA").length).toBeGreaterThan(1);
    expect(screen.queryByRole("heading", { name: "城市等待" })).toBeNull();

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
    expect(screen.queryByRole("heading", { name: "城市等待" })).toBeNull();
    expect(
      screen
        .getAllByRole("link", { name: "同学样本" })
        .some((link) => link.getAttribute("aria-current") === "page"),
    ).toBe(true);
  });
});
