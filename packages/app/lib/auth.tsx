import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { apiFetch, ApiError } from "./api";
import { getToken, setToken, removeToken } from "./storage";

type User = {
  id: string;
  email: string;
  name?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

type LoginResponse = { user: User; access_token: string };
type RegisterResponse = { user: User; access_token: string };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getToken().then((token) => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      apiFetch<{ user: User }>("/auth/me")
        .then((res) => setUser(res.user))
        .catch((err) => {
          if (err instanceof ApiError && err.status === 401) {
            removeToken();
          }
        })
        .finally(() => setIsLoading(false));
    });
  }, []);

  async function login(email: string, password: string) {
    const res = await apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    await setToken(res.access_token);
    setUser(res.user);
  }

  async function register(email: string, password: string, name?: string) {
    const res = await apiFetch<RegisterResponse>("/auth/register", {
      method: "POST",
      body: { email, password, ...(name ? { name } : {}) },
    });
    await setToken(res.access_token);
    setUser(res.user);
  }

  async function logout() {
    await removeToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
