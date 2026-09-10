import { ManualCollector } from "./manual";
import { MockCollector } from "./mock";
import { Source591Collector } from "./source591";

export function getCollector() {
  if (process.env.LISTING_SOURCE === "manual") return new ManualCollector();
  return process.env.LISTING_SOURCE === "591" ? new Source591Collector() : new MockCollector();
}
