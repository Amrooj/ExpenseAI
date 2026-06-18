// ============================================================
// src/store/authStore.ts — Zustand Auth State Management
// ============================================================
//
// 🎓 TEACHING: What is Zustand?
//
// Zustand (German for "state") is a lightweight state manager.
// Unlike Redux (verbose, boilerplate-heavy), Zustand is:
//   - 1 file per store (not actions/ + reducers/ + types/)
//   - No providers needed (no wrapping your app)
//   - Direct state access: useAuthStore(s => s.user)
//   - Built-in TypeScript support
//
// WHY NOT Redux or Context API?
//   Context API:  Re-renders EVERY consumer when ANY value changes
//   Redux:        100+ lines of boilerplate for a simple counter
//   Zustand:      10 lines. Selective re-renders. Zero boilerplate.
//
// 🎓 INTERVIEW QUESTION:
//   "What causes unnecessary re-renders in React?"
//   Answer: Context changes re-render ALL consumers.
//   Zustand uses selector functions — components only re-render
//   when their SELECTED slice of state changes.
//   useAuthStore(s => s.user) only re-renders when `user` changes,
//   NOT when `isLoading` changes.
// ============================================================

import { create } from "zustand";
import { User } from "../types";
import { getMe, loginUser, registerUser, logoutUser, updateProfile as updateProfileApi } from "../api/auth.api";
import { getAccessToken, getRefreshToken, clearTokens } from "../api/client";
import toast from "react-hot-toast";

// ── Store Type Definition ─────────────────────────────────────
interface AuthState {
  // State
  user:          User | null;
  isLoading:     boolean;
  isInitialized: boolean; // Has the app checked localStorage for existing tokens?

  // Actions
  login:         (email: string, password: string) => Promise<void>;
  register:      (name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout:        () => Promise<void>;
  initialize:    () => Promise<void>;
  updateProfile: (data: { name?: string; defaultCurrency?: string; timezone?: string }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  // ── Initial State ────────────────────────────────────────────
  user:          null,
  isLoading:     false,
  isInitialized: false,

  // ── Initialize (called once on app start) ────────────────────
  // Checks if an existing token is in localStorage
  // If yes → fetches user profile → sets user state
  // If no  → marks as initialized (show login page)
  initialize: async () => {
    const token = getAccessToken();
    if (!token) {
      set({ isInitialized: true });
      return;
    }

    try {
      set({ isLoading: true });
      const user = await getMe();
      set({ user, isInitialized: true, isLoading: false });
    } catch {
      clearTokens();
      set({ user: null, isInitialized: true, isLoading: false });
    }
  },

  // ── Login ─────────────────────────────────────────────────────
  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { user } = await loginUser({ email, password });
      set({ user, isLoading: false });
      toast.success(`Welcome back, ${user.name}!`);
    } catch (error: unknown) {
      set({ isLoading: false });
      const message = extractErrorMessage(error);
      toast.error(message);
      throw error;
    }
  },

  // ── Register ──────────────────────────────────────────────────
  register: async (name, email, password, confirmPassword) => {
    set({ isLoading: true });
    try {
      await registerUser({ name, email, password, confirmPassword });
      // Clear auto-login tokens/session since we are redirecting to login page
      clearTokens();
      set({ user: null, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      
      const status = error.response?.status;
      const errorType = error.response?.data?.error?.type;
      
      // Do not toast for field validation errors (400 validation error) or duplicate email conflict (409)
      if (status !== 409 && errorType !== "VALIDATION_ERROR") {
        const message = extractErrorMessage(error);
        toast.error(message);
      }
      throw error;
    }
  },

  // ── Logout ────────────────────────────────────────────────────
  logout: async () => {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await logoutUser(refreshToken);
      }
    } catch {
      // Silent failure — we'll clear tokens regardless
    } finally {
      clearTokens();
      set({ user: null });
      toast.success("Logged out");
    }
  },

  // ── Update Profile ─────────────────────────────────────────
  updateProfile: async (data) => {
    set({ isLoading: true });
    try {
      const user = await updateProfileApi(data);
      set({ user, isLoading: false });
      toast.success("Settings saved!");
    } catch (error: unknown) {
      set({ isLoading: false });
      const message = extractErrorMessage(error);
      toast.error(message);
      throw error;
    }
  },
}));

// ── Helper: Extract error message from API errors ────────────
function extractErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response: { data?: { error?: { message?: string } } } }).response;
    return response?.data?.error?.message ?? "Something went wrong. Please try again.";
  }
  return "Network error. Please check your connection.";
}
