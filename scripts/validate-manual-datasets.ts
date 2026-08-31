import hallInput from "../data/manual/hall-of-fame.json";
import peerInput from "../data/manual/peer-sample.json";
import { loadHallOfFameDataset, loadPeerDataset } from "../lib/data/manual-datasets";
import { DATA_SNAPSHOT } from "../lib/data/snapshot-config";

export function main() {
  const peer = loadPeerDataset();
  const hall = loadHallOfFameDataset();
  const result = {
    snapshotDate: DATA_SNAPSHOT.cutoffDate,
    peer: {
      inputRecords: peerInput.length,
      outputRecords: peer.cases.length,
      isMock: peer.metadata.isMock,
      valid: peer.validation.valid,
      errors: peer.validation.errors,
    },
    hall: {
      inputRecords: hallInput.length,
      outputRecords: hall.cases.length,
      isMock: hall.metadata.isMock,
      valid: hall.validation.valid,
      errors: hall.validation.errors,
    },
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}
