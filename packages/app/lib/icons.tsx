import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";

const ICON_MAP = {
  // Navigation
  "chevron-left": "chevron-left",
  "chevron-right": "chevron-right",
  "chevron-up": "chevron-up",
  "chevron-down": "chevron-down",
  "arrow-left": "arrow-left",
  // Actions
  "close": "x",
  "close-circle": "x-circle",
  "plus": "plus",
  "plus-circle": "plus-circle",
  "check": "check",
  "check-circle": "check-circle",
  "edit": "edit-2",
  "trash": "trash-2",
  "more-vertical": "more-vertical",
  // Status / Info
  "search": "search",
  "alert-circle": "alert-circle",
  "info": "info",
  "flag": "flag",
  // Branding
  "flame": "zap",
  // Tabs
  "calendar": "calendar",
  "grid": "grid",
  "settings": "settings",
  // Meal types
  "meal-breakfast": "sunrise",
  "meal-lunch": "sun",
  "meal-dinner": "moon",
  "meal-snack": "coffee",
} satisfies Record<string, ComponentProps<typeof Feather>["name"]>;

export type IconName = keyof typeof ICON_MAP;

type Props = {
  name: IconName;
  size?: number;
  color?: string;
};

export function Icon({ name, size, color }: Props) {
  return <Feather name={ICON_MAP[name]} size={size} color={color} />;
}
