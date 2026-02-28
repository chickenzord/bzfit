import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Appearance } from "react-native";
import { useColorScheme } from "nativewind";
import { getThemePreference, setThemePreference, ThemePreference } from "./storage";

type ThemeContextType = {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

/**
 * Resolve a ThemePreference to a concrete "light" | "dark" value for nativewind.
 *
 * Nativewind (via react-native-css-interop) maps "system" → Appearance.setColorScheme(null),
 * but Android's native AppearanceModule rejects null (@NonNull), causing a crash.
 * We therefore never pass "system" to setColorScheme — we resolve it ourselves.
 */
function resolveColorScheme(pref: ThemePreference): "light" | "dark" {
  if (pref !== "system") return pref;
  return Appearance.getColorScheme() ?? "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>("system");
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    getThemePreference().then((stored) => {
      const pref = stored ?? "system";
      setThemeState(pref);
      setColorScheme(resolveColorScheme(pref));
    });
  }, []);

  // When the user has chosen "system", reactively follow OS theme changes.
  useEffect(() => {
    if (theme !== "system") return;
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setColorScheme(colorScheme ?? "light");
    });
    return () => sub.remove();
  }, [theme]);

  async function setTheme(newTheme: ThemePreference) {
    setThemeState(newTheme);
    setColorScheme(resolveColorScheme(newTheme));
    await setThemePreference(newTheme);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
