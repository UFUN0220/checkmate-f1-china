import hallOfFameJson from "../../data/generated/mock-hall-of-fame.json";
import peerJson from "../../data/generated/mock-peer-cases.json";
import publicJson from "../../data/generated/mock-public-cases.json";
import type { MockCheckCase } from "./models";

export const MOCK_PUBLIC_CASES = publicJson as MockCheckCase[];
export const MOCK_PEER_CASES = peerJson as MockCheckCase[];
export const MOCK_HALL_OF_FAME = hallOfFameJson as MockCheckCase[];
