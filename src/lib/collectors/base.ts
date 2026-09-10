import { ListingCandidate } from "@/types/listing";
export interface ListingCollector { collect(): Promise<ListingCandidate[]>; }
