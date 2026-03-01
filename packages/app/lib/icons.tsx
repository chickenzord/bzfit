import { Feather, Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

// ---------------------------------------------------------------------------
// Registry — each entry declares which library it comes from
// ---------------------------------------------------------------------------

type FeatherEntry = { lib: "feather"; name: ComponentProps<typeof Feather>["name"] };
type IonEntry = { lib: "ionicons"; name: ComponentProps<typeof Ionicons>["name"] };
type IconEntry = FeatherEntry | IonEntry;

const ICON_MAP = {
  // Navigation
  "chevron-left":    { lib: "feather", name: "chevron-left" },
  "chevron-right":   { lib: "feather", name: "chevron-right" },
  "chevron-up":      { lib: "feather", name: "chevron-up" },
  "chevron-down":    { lib: "feather", name: "chevron-down" },
  "arrow-left":      { lib: "feather", name: "arrow-left" },
  // Actions
  "close":           { lib: "feather", name: "x" },
  "close-circle":    { lib: "feather", name: "x-circle" },
  "plus":            { lib: "feather", name: "plus" },
  "plus-circle":     { lib: "feather", name: "plus-circle" },
  "check":           { lib: "feather", name: "check" },
  "check-circle":    { lib: "feather", name: "check-circle" },
  "edit":            { lib: "feather", name: "edit" },
  "trash":           { lib: "feather", name: "trash-2" },
  "more-vertical":   { lib: "feather", name: "more-vertical" },
  "download":        { lib: "feather", name: "download" },
  // Status / Info
  "search":          { lib: "feather", name: "search" },
  "alert-circle":    { lib: "feather", name: "alert-circle" },
  "info":            { lib: "feather", name: "info" },
  "flag":            { lib: "feather", name: "flag" },
  // Branding
  "flame":           { lib: "feather", name: "zap" },
  // Utilities
  "key":             { lib: "feather", name: "key" },
  "copy":            { lib: "feather", name: "copy" },
  "external-link":   { lib: "feather", name: "external-link" },
  "eye":             { lib: "feather", name: "eye" },
  "eye-off":         { lib: "feather", name: "eye-off" },
  "cpu":             { lib: "feather", name: "cpu" },
  // Tabs
  "calendar":        { lib: "feather", name: "calendar" },
  "grid":            { lib: "feather", name: "grid" },
  "settings":        { lib: "feather", name: "settings" },
  // Meal types
  "meal-breakfast":  { lib: "feather", name: "sunrise" },
  "meal-lunch":      { lib: "feather", name: "sun" },
  "meal-dinner":     { lib: "feather", name: "moon" },
  "meal-snack":      { lib: "feather", name: "coffee" },
  // AI / special
  "sparkles":        { lib: "ionicons", name: "sparkles" },
  "sparkles-outline":{ lib: "ionicons", name: "sparkles-outline" },
} as const satisfies Record<string, IconEntry>;

export type IconName = keyof typeof ICON_MAP;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Props = {
  name: IconName;
  size?: number;
  color?: string;
};

export function Icon({ name, size, color }: Props) {
  const entry = ICON_MAP[name];

  if (entry.lib === "ionicons") {
    return <Ionicons name={entry.name} size={size} color={color} />;
  }

  return <Feather name={entry.name} size={size} color={color} />;
}
