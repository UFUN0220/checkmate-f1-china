/* global process */

import { build } from "esbuild";
import { rm } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const outputFile = path.resolve(".manual-validation-entry.mjs");

try {
  await build({
    absWorkingDir: process.cwd(),
    entryPoints: ["scripts/validate-manual-datasets.ts"],
    bundle: true,
    format: "esm",
    platform: "node",
    outfile: outputFile,
    sourcemap: false,
  });
  const module = await import(`${pathToFileURL(outputFile).href}?run=validate`);
  module.main();
} finally {
  await rm(outputFile, { force: true });
}
