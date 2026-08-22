/* global console, process */

console.error(
  "CHECKEE_ACCESS_MODE=disabled: real Checkee fetching is unavailable until explicit source authorization.",
);
console.error("Use the DemoFixtureAdapter or provide an authorized CSV/JSON export instead.");
process.exit(1);
