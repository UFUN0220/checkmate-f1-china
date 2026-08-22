import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const fixtureDir = resolve(process.cwd(), "scripts/fixtures/checkee");

describe("Checkee access-blocked fixtures", () => {
  it.each(["2026-01-access-blocked.html", "2026-08-access-blocked.html"])(
    "fail-closes %s without source content",
    (fixtureName) => {
      const html = readFileSync(resolve(fixtureDir, fixtureName), "utf8");

      expect(html).toContain("403 Forbidden");
      expect(html).toContain("No source page content captured.");
      expect(html).not.toMatch(/CaseNum|password|email|comment|details|personal/i);
    },
  );
});
