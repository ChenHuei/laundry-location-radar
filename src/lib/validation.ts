import { businessConfig } from "./config";
import { z } from "zod";
export const safeUrl = z.string().url().max(2000).refine(value => ["https:", "http:"].includes(new URL(value).protocol), "只接受 http/https 連結");
export const listingSchema = z.object({
  source: z.enum(["manual", "591"]), sourceId: z.string().min(1).max(200).regex(/^[\w.-]+$/, "物件 ID 只能使用英數字、底線、點或連字號"),
  title: z.string().trim().min(1).max(300), address: z.string().trim().min(1).max(500),
  district: z.literal("三重區"), url: safeUrl,
  rent: z.number().int().positive().max(10000000), areaPing: z.number().positive().max(10000),
  firstFloorPing: z.number().positive().max(10000).nullable().optional(),
  lat: z.number().min(-90).max(90).nullable().optional(), lng: z.number().min(-180).max(180).nullable().optional(),
}).strict().refine(x => (x.lat == null) === (x.lng == null), { message: "緯度與經度必須一起填寫", path: ["lat"] })
.refine(x => x.firstFloorPing == null || x.firstFloorPing <= x.areaPing, { message: "一樓面積不可大於總面積", path: ["firstFloorPing"] });
export const importSchema = z.array(listingSchema).min(1).max(businessConfig.scanBatchSize).refine(rows => new Set(rows.map(r => `${r.source}:${r.sourceId}`)).size === rows.length, "同批資料有重複物件 ID");
