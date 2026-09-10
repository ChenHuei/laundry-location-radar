export const businessConfig = {
  district: "三重區",
  brand: "Oday",
  budget: 3_500_000,
  idealPing: 20,
  rentCeiling: 40_000,
  notificationThreshold: 80,
  scanIntervalHours: 24,
  scanBatchSize: 25,
  competition: {
    primaryRadius: 500,
    secondaryRadius: 800,
    searchRadius: 1200,
    maxResults: 20,
    timeoutMs: 10_000,
    unknownScoreCap: 12,
    unknownDeduction: 3,
  },
} as const;
