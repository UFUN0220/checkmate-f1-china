import { DEMO_SNAPSHOT } from "./data/demo-snapshot";
import { CHECKEE_STATIC_SNAPSHOT } from "./data/static-snapshot";
import type { DatasetMetadata, PublicSnapshot } from "./data/models";

export type DatasetMode = "checkee-static" | "demo-fixture";

export function getDatasetMode(value = process.env.NEXT_PUBLIC_DATASET_MODE): DatasetMode {
  return value === "demo-fixture" ? "demo-fixture" : "checkee-static";
}

export const activeDatasetMode = getDatasetMode();
export const activeSnapshot: PublicSnapshot =
  activeDatasetMode === "demo-fixture" ? DEMO_SNAPSHOT : CHECKEE_STATIC_SNAPSHOT;
export const activeDatasetMetadata: DatasetMetadata = {
  source: "public",
  isMock: activeSnapshot.manifest.demoData,
  snapshotDate: activeSnapshot.manifest.snapshotDate,
  sampleSize: activeSnapshot.manifest.recordCount,
};
export const demoSnapshot = DEMO_SNAPSHOT;
