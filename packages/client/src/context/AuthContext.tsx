import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthResponseDto } from '@bzfit/shared'; // Adjust path as needed
import { login, register, logout, refreshToken as apiRefreshToken } from '../api/authClient'; // Auth API client

interface AuthContextType {
  user: AuthResponseDto['user'] | null;
  token: string | null;
  isLoading: boolean;
  loginUser: (credentials: any) => Promise<void>;
  registerUser: (userData: any) => Promise<void>;
  logoutUser: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthResponseDto['user'] | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        // In a real app, you might want to validate the token or refresh it here
        // For now, we'll assume a stored token means authenticated
        // You would typically decode the token or call a /me endpoint
        // to get user details if not stored directly with the token.
        // For this basic setup, we'll assume user info comes with login/register response.
        // Or you might fetch user data if token is just present.
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      }
      setIsLoading(false);
    };
    loadUser();
  }, [token]);

  const loginUser = async (credentials: any) => {
    setIsLoading(true);
    try {
      const authResponse = await login(credentials.email, credentials.password);
      setToken(authResponse.accessToken);
      setUser(authResponse.user);
      localStorage.setItem('token', authResponse.accessToken);
      localStorage.setItem('user', JSON.stringify(authResponse.user));
    } finally {
      setIsLoading(false);
    }
  };

  const registerUser = async (userData: any) => {
    setIsLoading(true);
    try {
      const authResponse = await register(userData);
      setToken(authResponse.accessToken);
      setUser(authResponse.user);
      localStorage.setItem('token', authResponse.accessToken);
      localStorage.setItem('user', JSON.stringify(authResponse.user));
    } finally {
      setIsLoading(false);
    }
  };

  const logoutUser = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // In a real app, you'd also call a backend logout endpoint
    logout();
  };

  // Optional: Function to refresh token
  const refreshToken = async () => {
    if (!token) return; // No token to refresh

    try {
      // Assuming apiRefreshToken takes the current token and returns a new one
      const newAuthResponse = await apiRefreshToken(token);
      setToken(newAuthResponse.accessToken);
      localStorage.setItem('token', newAuthResponse.accessToken);
      return newAuthResponse.accessToken;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      logoutUser(); // Log out if refresh fails
      throw error;
    }
  };


  const isAuthenticated = !!token;

  const value = {
    user,
    token,
    isLoading,
    loginUser,
    registerUser,
    logoutUser,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
