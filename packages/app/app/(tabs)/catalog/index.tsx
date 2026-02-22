import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  FlatList,
  Pressable,
} from "react-native";
import { Link, useFocusEffect } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Icon } from "@/lib/icons";
import { useDebounce } from "@uidotdev/usehooks";
import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

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
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterReview, setFilterReview] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 400);
  const isSearching = debouncedQuery.trim().length > 0;

  const allFoodsQuery = useQuery({
    queryKey: queryKeys.foods(),
    queryFn: () =>
      apiFetch<{ data: Food[] }>("/catalog/foods").then((r) => r.data),
  });

  const needsReviewQuery = useQuery({
    queryKey: queryKeys.needsReview(),
    queryFn: () => apiFetch<Food[]>("/catalog/foods/needs-review"),
  });

  const searchQuery_ = useQuery({
    queryKey: queryKeys.foodSearch(debouncedQuery.trim()),
    queryFn: () =>
      apiFetch<Food[]>(
        `/catalog/foods/search?q=${encodeURIComponent(debouncedQuery.trim())}`,
      ),
    enabled: isSearching,
  });

  // Refresh on screen focus so edits made elsewhere are reflected
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.foods() });
    }, [queryClient]),
  );

  const allFoods = allFoodsQuery.data ?? [];
  const needsReviewFoods = needsReviewQuery.data ?? [];
  const needsReviewCount = needsReviewFoods.length;
  const searchResults = searchQuery_.data ?? [];

  // Clear filter when count drops to 0
  useEffect(() => {
    if (needsReviewCount === 0) setFilterReview(false);
  }, [needsReviewCount]);

  const foods = isSearching ? searchResults : filterReview ? needsReviewFoods : allFoods;
  const loading = isSearching ? searchQuery_.isLoading : allFoodsQuery.isLoading;
  const error = isSearching
    ? (searchQuery_.error instanceof Error ? searchQuery_.error.message : null)
    : (allFoodsQuery.error instanceof Error ? allFoodsQuery.error.message : null);

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
          <Pressable
            onPress={() => queryClient.invalidateQueries({ queryKey: queryKeys.foods() })}
            className="mt-2"
          >
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
