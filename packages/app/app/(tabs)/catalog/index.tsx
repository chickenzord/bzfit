import { useEffect, useState } from "react";
import { View, Text, TextInput, ActivityIndicator, FlatList, Pressable } from "react-native";
import { Link } from "expo-router";
import { useDebounce } from "@uidotdev/usehooks";

import { ApiError, apiFetch } from "../../../lib/api";

interface Food {
  id: string;
  name: string;
  brand: string | null;
  calories: number;
  proteins: number;
  carbohydrates: number;
  fat: number;
}

export default function CatalogScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  useEffect(() => {
    const fetchFoods = async () => {
      if (!debouncedSearchQuery) {
        setFoods([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<Food[]>(
          `/catalog/foods/search?q=${debouncedSearchQuery}`,
        );
        setFoods(data);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("An unexpected error occurred.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFoods();
  }, [debouncedSearchQuery]);

  return (
    <View className="flex-1 bg-slate-950 px-4 py-6">
      {/* Search bar */}
      <View className="bg-slate-900 rounded-xl border border-slate-800 px-4 py-3 mb-6">
        <TextInput
          placeholder="Search foods..."
          placeholderTextColor="#64748b"
          className="text-white text-base"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading && <ActivityIndicator className="my-4" size="large" color="#e2e8f0" />}

      {error && (
        <View className="flex-1 items-center justify-center pb-20">
          <Text className="text-red-500 text-lg mb-2">Error: {error}</Text>
        </View>
      )}

      {!loading && !error && foods && foods.length === 0 && debouncedSearchQuery.length > 0 && (
        <View className="flex-1 items-center justify-center pb-20">
          <Text className="text-slate-500 text-lg mb-2">No results found</Text>
          <Text className="text-slate-600 text-sm text-center px-8">
            Try a different search query.
          </Text>
        </View>
      )}

      {!loading && !error && foods && foods.length === 0 && debouncedSearchQuery.length === 0 && (
        <View className="flex-1 items-center justify-center pb-20">
          <Text className="text-slate-500 text-lg mb-2">No foods yet</Text>
          <Text className="text-slate-600 text-sm text-center px-8">
            Search for a food or quick-add a new one to get started
          </Text>
        </View>
      )}

      {!loading && !error && foods && foods.length > 0 && (
        <FlatList
          data={foods}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Link href={`/catalog/foods/${item.id}`} asChild>
              <Pressable className="bg-slate-800 p-4 rounded-xl mb-3">
                <Text className="text-white text-lg font-semibold">{item.name}</Text>
                {item.brand && <Text className="text-slate-400 text-sm">{item.brand}</Text>}
                <View className="flex-row justify-between mt-2">
                  <Text className="text-slate-300">Calories: {item.calories}</Text>
                  <Text className="text-slate-300">Protein: {item.proteins}g</Text>
                </View>
              </Pressable>
            </Link>
          )}
        />
      )}
    </View>
  );
}
