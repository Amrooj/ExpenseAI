import api, { setTokens, clearTokens } from "./client";
import type { ApiResponse } from "../types";

export interface User {
  id: string;
  email: string;
  name: string;
  defaultCurrency: string;
  timezone: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  defaultCurrency?: string;
  timezone?: string;
}): Promise<LoginResponse> {
  const { data: res } = await api.post<ApiResponse<LoginResponse>>("/api/auth/register", data);
  const { user, tokens } = res.data!;
  setTokens(tokens.accessToken, tokens.refreshToken);
  return { user, tokens };
}

export async function loginUser(data: { email: string; password: string }): Promise<LoginResponse> {
  const { data: res } = await api.post<ApiResponse<LoginResponse>>("/api/auth/login", data);
  const { user, tokens } = res.data!;
  setTokens(tokens.accessToken, tokens.refreshToken);
  return { user, tokens };
}

export async function getMe(): Promise<User> {
  const { data: res } = await api.get<ApiResponse<{ user: User }>>("/api/auth/me");
  return res.data!.user;
}

export async function logoutUser(refreshToken: string): Promise<void> {
  try {
    await api.post("/api/auth/logout", { refreshToken });
  } finally {
    clearTokens();
  }
}

export async function logoutAllDevices(): Promise<void> {
  try {
    await api.post("/api/auth/logout-all");
  } finally {
    clearTokens();
  }
}

export async function updateProfile(data: {
  name?: string;
  defaultCurrency?: string;
  timezone?: string;
}): Promise<User> {
  const { data: res } = await api.patch<ApiResponse<{ user: User }>>("/api/auth/me", data);
  return res.data!.user;
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await api.post("/api/auth/change-password", data);
}

export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  const { data: res } = await api.post<ApiResponse<AuthTokens>>("/api/auth/refresh", { refreshToken });
  const tokens = res.data!;
  setTokens(tokens.accessToken, tokens.refreshToken);
  return tokens;
}
