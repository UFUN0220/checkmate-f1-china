/** @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EvidenceAtlas } from "./evidence-atlas";

describe("EvidenceAtlas", () => {
  it("fails closed when no Checkee snapshot is available", () => {
    window.history.replaceState({}, "", "/");
    render(<EvidenceAtlas />);

    expect(screen.getByRole("heading", { name: "证据图谱" })).toBeTruthy();
    expect(screen.getByText("来源访问受限")).toBeTruthy();
    expect(screen.getByRole("button", { name: /查看标准化案例/ }).hasAttribute("disabled")).toBe(
      true,
    );
    expect(screen.getByRole("button", { name: /进入地点指标/ }).hasAttribute("disabled")).toBe(
      true,
    );
    expect(screen.getByText("暂无可用 Checkee 月份快照")).toBeTruthy();
  });
});
