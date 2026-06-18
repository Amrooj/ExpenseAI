// ============================================================
// src/api/auth.api.ts — Auth API Functions
// ============================================================

import api, { setTokens, clearTokens } from "./client";
import { ApiResponse, LoginResponse, User } from "../types";

export async function registerUser(data: {
  name:            string;
  email:           string;
  password:        string;
  confirmPassword: string;
}): Promise<LoginResponse> {
  const { data: res } = await api.post<ApiResponse<LoginResponse>>("/api/auth/register", data);
  const { user, tokens } = res.data!;
  setTokens(tokens.accessToken, tokens.refreshToken);
  return { user, tokens };
}

export async function loginUser(data: {
  email:    string;
  password: string;
}): Promise<LoginResponse> {
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

export async function updateProfile(data: {
  name?: string;
  defaultCurrency?: string;
  timezone?: string;
}): Promise<User> {
  const { data: res } = await api.patch<ApiResponse<{ user: User }>>("/api/auth/me", data);
  return res.data!.user;
}
