import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useColorScheme } from "nativewind";
import { getThemePreference, setThemePreference, ThemePreference } from "./storage";

type ThemeContextType = {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>("system");
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    getThemePreference().then((stored) => {
      const pref = stored ?? "system";
      setThemeState(pref);
      setColorScheme(pref);
    });
  }, []);

  async function setTheme(newTheme: ThemePreference) {
    setThemeState(newTheme);
    setColorScheme(newTheme);
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
