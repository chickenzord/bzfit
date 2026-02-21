import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  FlatList,
  Pressable,
} from "react-native";
import { Link } from "expo-router";
import { Icon } from "@/lib/icons";
import { useDebounce } from "@uidotdev/usehooks";
import { ApiError, apiFetch } from "@/lib/api";

interface Serving {
  id: string;
  status: "VERIFIED" | "NEEDS_REVIEW" | "USER_CREATED";
}

interface Food {
  id: string;
  name: string;
  variant: string | null;
  brand: string | null;
  servings: Serving[];
  createdAt: string;
  updatedAt: string;
}

function needsReview(food: Food): boolean {
  return food.servings.some((s) => s.status === "NEEDS_REVIEW");
}

export default function CatalogScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [allFoods, setAllFoods] = useState<Food[]>([]);
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [needsReviewFoods, setNeedsReviewFoods] = useState<Food[]>([]);
  const [needsReviewCount, setNeedsReviewCount] = useState(0);
  const [filterReview, setFilterReview] = useState(false);
  const [loadingAll, setLoadingAll] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(searchQuery, 400);
  const isSearching = debouncedQuery.trim().length > 0;

  // Load all foods and needs-review count on mount
  const loadAll = useCallback(async () => {
    setLoadingAll(true);
    setError(null);
    try {
      const [res, reviewRes, countRes] = await Promise.all([
        apiFetch<{ data: Food[] }>("/catalog/foods"),
        apiFetch<Food[]>("/catalog/foods/needs-review"),
        apiFetch<{ count: number }>("/catalog/foods/needs-review/count"),
      ]);
      setAllFoods(res.data);
      setNeedsReviewFoods(reviewRes);
      setNeedsReviewCount(countRes.count);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load foods.");
    } finally {
      setLoadingAll(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Clear filter when count drops to 0
  useEffect(() => {
    if (needsReviewCount === 0) setFilterReview(false);
  }, [needsReviewCount]);

  // Search when query changes
  useEffect(() => {
    if (!isSearching) {
      setSearchResults([]);
      return;
    }
    setLoadingSearch(true);
    apiFetch<Food[]>(`/catalog/foods/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then(setSearchResults)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Search failed.")
      )
      .finally(() => setLoadingSearch(false));
  }, [debouncedQuery, isSearching]);

  const foods = isSearching ? searchResults : filterReview ? needsReviewFoods : allFoods;
  const loading = isSearching ? loadingSearch : loadingAll;

  function renderItem({ item }: { item: Food }) {
    const displayName = [item.name, item.variant].filter(Boolean).join(" · ");
    const review = needsReview(item);

    return (
      <Link href={`/catalog/foods/${item.id}`} asChild>
        <Pressable className="bg-slate-900 p-4 rounded-xl mb-3 border border-slate-800 active:opacity-70">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 mr-2">
              <Text className="text-white text-base font-semibold" numberOfLines={1}>
                {displayName}
              </Text>
              {item.brand && (
                <Text className="text-slate-500 text-xs mt-0.5" numberOfLines={1}>
                  {item.brand}
                </Text>
              )}
            </View>
            {review && (
              <View className="flex-row items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                <Icon name="alert-circle" size={11} color="#f59e0b" />
                <Text className="text-amber-500 text-xs">Review</Text>
              </View>
            )}
          </View>
        </Pressable>
      </Link>
    );
  }

  return (
    <View className="flex-1 bg-slate-950 px-4 pt-4">
      {/* Search bar */}
      <View className="bg-slate-900 rounded-xl border border-slate-800 px-4 py-3 mb-4 flex-row items-center gap-2">
        <Icon name="search" size={16} color="#64748b" />
        <TextInput
          placeholder="Search foods..."
          placeholderTextColor="#64748b"
          className="flex-1 text-white text-base"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")}>
            <Icon name="close-circle" size={16} color="#64748b" />
          </Pressable>
        )}
      </View>

      {needsReviewCount > 0 && !isSearching && (
        <Pressable
          onPress={() => setFilterReview((v) => !v)}
          className={`self-start flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border mb-4 ${
            filterReview
              ? "bg-amber-500/20 border-amber-500/50"
              : "bg-slate-900 border-slate-700"
          }`}
        >
          <Icon name="alert-circle" size={12} color={filterReview ? "#f59e0b" : "#64748b"} />
          <Text className={`text-xs font-medium ${filterReview ? "text-amber-400" : "text-slate-400"}`}>
            Needs Review
          </Text>
          <View className={`rounded-full px-1.5 py-0.5 ${filterReview ? "bg-amber-500/30" : "bg-slate-700"}`}>
            <Text className={`text-xs font-semibold ${filterReview ? "text-amber-300" : "text-slate-400"}`}>
              {needsReviewCount}
            </Text>
          </View>
        </Pressable>
      )}

      {loading && (
        <ActivityIndicator className="my-8" size="large" color="#3b82f6" />
      )}

      {!loading && error && (
        <View className="flex-1 items-center justify-center pb-20">
          <Text className="text-red-400 text-base mb-2">{error}</Text>
          <Pressable onPress={loadAll} className="mt-2">
            <Text className="text-blue-400 text-sm">Retry</Text>
          </Pressable>
        </View>
      )}

      {!loading && !error && foods.length === 0 && (
        <View className="flex-1 items-center justify-center pb-20">
          {isSearching ? (
            <>
              <Text className="text-slate-500 text-base">No results for "{debouncedQuery}"</Text>
              <Text className="text-slate-600 text-sm mt-1">Try a different search term.</Text>
            </>
          ) : filterReview ? (
            <>
              <Text className="text-slate-500 text-base">All caught up</Text>
              <Text className="text-slate-600 text-sm mt-1">No servings need review.</Text>
            </>
          ) : (
            <>
              <Text className="text-slate-500 text-base">No foods yet</Text>
              <Text className="text-slate-600 text-sm mt-1 text-center px-8">
                Search for a food or quick-add a new one to get started.
              </Text>
            </>
          )}
        </View>
      )}

      {!loading && !error && foods.length > 0 && (
        <FlatList
          data={foods}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
