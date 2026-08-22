/** @vitest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EvidenceAtlas } from "./evidence-atlas";

describe("EvidenceAtlas", () => {
  it("renders the static snapshot and drills into a location", () => {
    window.history.replaceState({}, "", "/");
    render(<EvidenceAtlas />);

    expect(screen.getByRole("heading", { name: "证据图谱" })).toBeTruthy();
    expect(screen.getAllByText("STATIC SNAPSHOT").length).toBeGreaterThan(0);
    expect(screen.getAllByText("475", { selector: "strong" })).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: /广州 158/ }));
    expect(screen.getByRole("heading", { name: "广州 的公开样本" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /查看标准化案例/ }));
    expect(screen.getByRole("heading", { name: "Checkee F-1 标准化案例" })).toBeTruthy();

    fireEvent.change(screen.getByLabelText("状态"), { target: { value: "pending" } });
    expect(window.location.search).toContain("status=pending");
    expect(screen.getAllByText("Pending", { selector: "span" }).length).toBeGreaterThan(0);
  });
});
