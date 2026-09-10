import { z } from "zod";
import type { ScoreInput } from "../types/listing";
import { businessConfig } from "./config";

export const statuses = { new: "新物件", shortlisted: "已收藏", pending_visit: "待現勘", visited: "已現勘", rejected: "已淘汰" } as const;
const nullableBoolean = z.boolean().nullable();
export const reviewSchema = z.object({
  status: z.enum(["new", "shortlisted", "pending_visit", "visited", "rejected"]).default("new"),
  notes: z.string().max(10000).default(""),
  firstFloorPing: z.number().positive().max(1000).nullable().default(null),
  frontage: z.enum(["good", "average", "poor", "unknown"]).default("unknown"),
  parking: z.enum(["good", "average", "poor", "unknown"]).default("unknown"),
  utilitiesReady: nullableBoolean.default(null),
  allow24h: nullableBoolean.default(null),
  laundryAllowed: nullableBoolean.default(null),
  franchiseConflict: nullableBoolean.default(null),
  households500m: z.number().int().nonnegative().max(100000).nullable().default(null),
  households800m: z.number().int().nonnegative().max(100000).nullable().default(null),
  demandSource: z.string().max(2000).default(""),
  competitors: z.record(z.string().min(1).max(300), z.object({
    strength: z.enum(["strong", "normal", "weak", "unknown"]),
    isOday: z.boolean(), excluded: z.boolean(), notes: z.string().max(2000),
  }).strict()).default({}),
}).strict().refine(r => (r.households500m == null && r.households800m == null) || r.demandSource.trim().length > 0, { message: "填寫戶數時請註明資料來源、日期與估算方法", path: ["demandSource"] })
.refine(r => r.households500m == null || r.households800m == null || r.households500m <= r.households800m, { message: "800m 戶數不可小於 500m 戶數", path: ["households800m"] });
export type ManualReview = z.infer<typeof reviewSchema>;

export function summarizeCompetition(input: ScoreInput): ScoreInput {
  const analysis = input.competitionAnalysis;
  const available = analysis && analysis.status !== "unavailable";
  const active = analysis?.competitors.filter(p => !p.excluded) ?? [];
  const ordinary = active.filter(p => !p.isOday);
  const primary = ordinary.filter(p => p.distanceMeters <= businessConfig.competition.primaryRadius);
  const oday = active.filter(p => p.isOday);
  return { ...input,
    strongCompetitors500m: available ? primary.filter(p => p.strength === "strong").length : undefined,
    normalCompetitors500m: available ? primary.filter(p => p.strength === "normal").length : undefined,
    weakCompetitors500m: available ? primary.filter(p => p.strength === "weak").length : undefined,
    unknownCompetitors500m: available ? primary.filter(p => p.strength === "unknown").length : undefined,
    competitors800m: available ? ordinary.filter(p => p.distanceMeters <= businessConfig.competition.secondaryRadius).length : undefined,
    nearestOdayMeters: oday.length ? Math.min(...oday.map(p => p.distanceMeters)) : null,
  };
}

export function applyReview(input: ScoreInput, review?: ManualReview | null): ScoreInput {
  if (!review) return input;
  const { competitors, firstFloorPing, ...fields } = review;
  return summarizeCompetition({ ...input, ...fields, firstFloorPing: firstFloorPing ?? input.firstFloorPing,
    competitionAnalysis: input.competitionAnalysis ? { ...input.competitionAnalysis,
      competitors: input.competitionAnalysis.competitors.map(p => ({ ...p, ...competitors[p.placeId] })),
    } : undefined,
  });
}
