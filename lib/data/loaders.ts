import { PAGE2_STATIC_SNAPSHOT } from "./page2-static-snapshot";
import type { Page2Snapshot, PublicSnapshot } from "./models";
import { CHECKEE_STATIC_SNAPSHOT } from "./static-snapshot";

/**
 * Runtime data boundary for the Checkmate feature modules.
 *
 * Presentation components consume these safe, generated snapshots instead of
 * knowing where the source data was prepared or which file path produced it.
 */
export function loadCheckeeSnapshot(): PublicSnapshot {
  return CHECKEE_STATIC_SNAPSHOT;
}

export function loadPage2Snapshot(): Page2Snapshot {
  return PAGE2_STATIC_SNAPSHOT;
}
