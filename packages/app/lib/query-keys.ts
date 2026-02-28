export const queryKeys = {
  catalog: {
    root: () => ["catalog"] as const,
    foods: () => [...queryKeys.catalog.root(), "foods"] as const,
    needsReview: () => [...queryKeys.catalog.root(), "foods", "needs-review"] as const,
    food: (id: string) => [...queryKeys.catalog.root(), "foods", id] as const,
    foodSearch: (q: string) => [...queryKeys.catalog.root(), "foods", "search", q] as const,
    serving: (id: string) => [...queryKeys.catalog.root(), "servings", id] as const,
    servingUsage: (id: string) => [...queryKeys.catalog.root(), "serving-usage", id] as const,
  },
  nutrition: {
    root: () => ["nutrition"] as const,
    dailySummary: (date: string) => [...queryKeys.nutrition.root(), "meals", "daily-summary", date] as const,
    mealDates: (from: string, to: string) => [...queryKeys.nutrition.root(), "meals", "dates", from, to] as const,
  },
  goals: {
    root: () => ["goals"] as const,
    currentGoal: () => [...queryKeys.goals.root(), "current"] as const,
    allGoals: () => [...queryKeys.goals.root(), "all"] as const,
  },
  auth: {
    root: () => ["auth"] as const,
    apiKeys: () => [...queryKeys.auth.root(), "api-keys"] as const,
  },
};
