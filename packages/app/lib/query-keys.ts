export const queryKeys = {
  // Catalog
  foods: () => ["foods"] as const,
  needsReview: () => ["foods", "needs-review"] as const,
  food: (id: string) => ["foods", id] as const,
  foodSearch: (q: string) => ["foods", "search", q] as const,
  serving: (id: string) => ["servings", id] as const,
  servingUsage: (id: string) => ["serving-usage", id] as const,

  // Nutrition
  dailySummary: (date: string) => ["meals", "daily-summary", date] as const,
  mealDates: (from: string, to: string) => ["meals", "dates", from, to] as const,

  // Goals
  currentGoal: () => ["goals", "current"] as const,
  allGoals: () => ["goals", "all"] as const,

  // Auth
  apiKeys: () => ["api-keys"] as const,
};
