import { MockCollector } from "./mock";
import { Source591Collector } from "./source591";

export function getCollector() {
  return process.env.LISTING_SOURCE === "591" ? new Source591Collector() : new MockCollector();
}
