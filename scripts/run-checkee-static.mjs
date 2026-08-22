/* global process */

import { build } from "esbuild";
import { rm } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const outputFile = path.resolve(".checkee-static-entry.mjs");

try {
  await build({
    absWorkingDir: process.cwd(),
    entryPoints: ["scripts/checkee-import-static.ts"],
    bundle: true,
    format: "esm",
    platform: "node",
    outfile: outputFile,
    sourcemap: false,
    external: ["node:*", "jsdom"],
  });
  const module = await import(
    `${pathToFileURL(outputFile).href}?mode=${process.argv[2] ?? "inspect"}`
  );
  await module.main(process.argv[2] ?? "inspect");
} finally {
  await rm(outputFile, { force: true });
}
