# Expo / React Native Guidelines

Development guidelines for the `@bzfit/app` Expo package.

---

## Stack

| Concern | Library |
|---|---|
| Styling | NativeWind v4 (TailwindCSS for React Native) |
| Navigation | Expo Router (file-based, built on React Navigation) |
| Icons | `@expo/vector-icons` — Ionicons, via `@/lib/icons` wrapper |
| Token storage | `expo-secure-store` (native) / `localStorage` (web) |
| Data fetching | TanStack Query v5 |
| Animations | React Native Reanimated v4 |

---

## Design Principles

- **Dark mode from day 1** — every component must support dark mode; no light-only assumptions.
- **Minimalist** — clean layouts, generous whitespace, no visual clutter.
- **Vibrant accents** — bold accent colors used sparingly for CTAs and highlights.
- **Mobile-native** — design for touch first; avoid patterns that only make sense on the web.

---

## Color Palette

The app uses Tailwind's `slate` scale for backgrounds/surfaces and single-hue accents:

| Role | Class | Hex |
|---|---|---|
| Page background | `bg-slate-950` | `#020617` |
| Card / surface | `bg-slate-900` | `#0f172a` |
| Border | `border-slate-800` | `#1e293b` |
| Muted text | `text-slate-500` | `#64748b` |
| Secondary text | `text-slate-400` | `#94a3b8` |
| Primary text | `text-white` | `#ffffff` |
| Primary action | `bg-blue-500` / `text-blue-400` | `#3b82f6` |
| Warning | `text-amber-500` / `bg-amber-500/10` | `#f59e0b` |
| Protein macro | `text-blue-400` | `#60a5fa` |
| Carbs macro | `text-amber-400` | `#fbbf24` |
| Fat macro | `text-rose-400` | `#fb7185` |
| Danger / destructive | `text-red-400` / `bg-red-950` | `#f87171` |

---

## Icons

Icons are accessed through the `@/lib/icons` wrapper — **never import `@expo/vector-icons` directly** in components.

```tsx
import { Icon } from "@/lib/icons";

<Icon name="search" size={16} color="#64748b" />
<Icon name="plus-circle" size={24} color="#3b82f6" />
<Icon name="alert-circle" size={13} color="#f59e0b" />
```

Use raw hex color strings (not Tailwind classes) since `Icon` is a native component.

---

## Component Patterns

### Cards / List Items

```tsx
<Pressable className="bg-slate-900 p-4 rounded-xl mb-3 border border-slate-800 active:opacity-70">
  <Text className="text-white text-base font-semibold">{title}</Text>
  <Text className="text-slate-500 text-xs mt-0.5">{subtitle}</Text>
</Pressable>
```

### Section Headers

```tsx
<Text className="text-slate-400 text-xs uppercase tracking-wide mb-3">Section Title</Text>
```

### Form Fields

```tsx
<Text className="text-slate-500 text-xs mb-1">
  Label <Text className="text-rose-500">*</Text>
</Text>
<View className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 mb-4">
  <TextInput
    placeholder="..."
    placeholderTextColor="#475569"
    style={{ color: "white" }}
  />
</View>
```

### Error Banner

```tsx
<View className="bg-red-950 border border-red-800 rounded-xl px-4 py-3 mb-4">
  <Text className="text-red-400 text-sm">{error}</Text>
</View>
```

### Primary Button

```tsx
<TouchableOpacity
  onPress={handleSave}
  disabled={!isValid || saving}
  className={`py-4 rounded-xl items-center ${!isValid || saving ? "bg-blue-500/30" : "bg-blue-500"}`}
>
  {saving
    ? <ActivityIndicator size="small" color="white" />
    : <Text className={`font-semibold text-base ${!isValid ? "text-slate-500" : "text-white"}`}>Save</Text>
  }
</TouchableOpacity>
```

### Status Badge (NEEDS_REVIEW)

```tsx
<View className="flex-row items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
  <Icon name="alert-circle" size={11} color="#f59e0b" />
  <Text className="text-amber-500 text-xs">Review</Text>
</View>
```

---

## Keyboard Avoidance

Different contexts require different approaches. **Always** handle keyboard avoidance for any screen or component with text inputs.

### Regular screens (pages)

Combine `KeyboardAvoidingView` (resizes the container) with `automaticallyAdjustKeyboardInsets` on `ScrollView` (scrolls to the focused input). `KeyboardAvoidingView` alone does not scroll to the focused field.

```tsx
<KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
  <ScrollView
    automaticallyAdjustKeyboardInsets
    keyboardShouldPersistTaps="handled"
    contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
  >
    {/* inputs */}
  </ScrollView>
</KeyboardAvoidingView>
```

- Use `behavior="padding"` with no platform conditional — it works on both iOS and Android.
- `automaticallyAdjustKeyboardInsets` is the key prop that scrolls to the focused input.
- `keyboardShouldPersistTaps="handled"` prevents tap-to-dismiss from eating button taps.

### Modals

`KeyboardAvoidingView` is unreliable inside modals (especially on Android) because the modal renders in a separate window layer, causing incorrect offset calculations. Use `automaticallyAdjustKeyboardInsets` on the `ScrollView` only.

```tsx
<ScrollView
  automaticallyAdjustKeyboardInsets
  keyboardShouldPersistTaps="handled"
>
  {/* inputs */}
</ScrollView>
```

---

## File Conventions

- **Pages**: `app/(tabs)/<namespace>/...` following Expo Router file-based routing.
- **Shared components**: `components/<domain>/ComponentName.tsx`
- **Hooks / utilities**: `lib/<concern>.ts`
- **Tab bar visibility**: use `useTabBarHidden()` from `app/(tabs)/_layout.tsx` to hide the tab bar on detail/form screens via `useFocusEffect`.

```tsx
import { useTabBarHidden } from "../../_layout"; // adjust relative path

useFocusEffect(
  useCallback(() => {
    setHidden(true);
    return () => setHidden(false);
  }, [setHidden]),
);
```
