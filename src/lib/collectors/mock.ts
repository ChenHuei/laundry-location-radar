import { ListingCollector } from "./base";
import { ListingCandidate } from "@/types/listing";

export class MockCollector implements ListingCollector {
  async collect(): Promise<ListingCandidate[]> {
    return [
      { sourceId:"demo-001", source:"mock", title:"三重住宅區一樓店面", url:"https://example.com/demo-001", address:"新北市三重區仁政街示意地址", district:"三重區", rent:26000, areaPing:17, firstFloorPing:17 },
      { sourceId:"demo-002", source:"mock", title:"三重主幹道店面", url:"https://example.com/demo-002", address:"新北市三重區自強路四段示意地址", district:"三重區", rent:39000, areaPing:37, firstFloorPing:25 }
    ];
  }
}
