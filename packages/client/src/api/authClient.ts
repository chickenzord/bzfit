// src/client/src/api/authClient.ts
import { LoginDto, RegisterDto, AuthResponseDto } from '@bzfit/shared'; // Adjust path as needed
import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = '/api/v1/auth'; // Base URL for authentication endpoints

// Helper to handle Axios responses
const handleResponse = <T>(response: AxiosResponse<T>): T => {
  if (response.status >= 200 && response.status < 300) {
    return response.data;
  }
  throw new Error(response.statusText || 'API request failed');
};

export const login = async (email: string, password: string): Promise<AuthResponseDto> => {
  const payload: LoginDto = { email, password };
  const response = await axios.post<AuthResponseDto>(`${API_BASE_URL}/login`, payload);
  return handleResponse(response);
};

export const register = async (userData: RegisterDto): Promise<AuthResponseDto> => {
  const response = await axios.post<AuthResponseDto>(`${API_BASE_URL}/register`, userData);
  return handleResponse(response);
};

export const logout = async (): Promise<void> => {
  // For a client-side only logout, we just clear tokens.
  // If backend invalidation is needed, an API call would go here.
  // const response = await axios.post(`${API_BASE_URL}/logout`);
  // return handleResponse(response);
  return Promise.resolve();
};

export const refreshToken = async (currentAccessToken: string): Promise<AuthResponseDto> => {
  // This is a placeholder. A real refresh token flow would involve:
  // 1. Sending a refresh token (usually stored securely, not the access token)
  // 2. Receiving a new access token and possibly a new refresh token.
  // For this basic setup, we'll simulate a refresh or assume the backend uses the access token to get a new one.
  const response = await axios.post<AuthResponseDto>(`${API_BASE_URL}/refresh`, { token: currentAccessToken });
  return handleResponse(response);
};

// Optionally, you might want to create an Axios instance that automatically
// attaches the token to requests.
export const axiosInstance = axios.create();

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
