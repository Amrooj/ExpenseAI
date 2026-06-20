import { create } from "zustand";
import type { User } from "../api/auth.api";
import {
  getMe,
  loginUser,
  registerUser,
  logoutUser,
  logoutAllDevices,
  updateProfile as updateProfileApi,
  changePassword as changePasswordApi,
} from "../api/auth.api";
import { getAccessToken, getRefreshToken, clearTokens } from "../api/client";
import { toast } from "sonner";
import { extractErrorMessage } from "../lib/utils";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    confirmPassword: string,
    defaultCurrency?: string,
    timezone?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  initialize: () => Promise<void>;
  updateProfile: (data: { name?: string; defaultCurrency?: string; timezone?: string }) => Promise<void>;
  changePassword: (data: { currentPassword: string; newPassword: string }) => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,

  setUser: (user) => set({ user }),

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

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { user } = await loginUser({ email, password });
      set({ user, isLoading: false });
      toast.success(`Welcome back, ${user.name}!`);
    } catch (error: unknown) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (name, email, password, confirmPassword, defaultCurrency, timezone) => {
    set({ isLoading: true });
    try {
      await registerUser({ name, email, password, confirmPassword, defaultCurrency, timezone });
      clearTokens();
      set({ user: null, isLoading: false });
    } catch (error: unknown) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await logoutUser(refreshToken);
      }
    } catch {
      // silent
    } finally {
      clearTokens();
      set({ user: null });
      toast.success("Logged out successfully");
    }
  },

  logoutAll: async () => {
    try {
      await logoutAllDevices();
    } catch {
      // silent
    } finally {
      clearTokens();
      set({ user: null });
      toast.success("Logged out from all devices");
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true });
    try {
      const user = await updateProfileApi(data);
      set({ user, isLoading: false });
      toast.success("Profile updated successfully");
    } catch (error: unknown) {
      set({ isLoading: false });
      const message = extractErrorMessage(error);
      toast.error(message);
      throw error;
    }
  },

  changePassword: async (data) => {
    set({ isLoading: true });
    try {
      await changePasswordApi(data);
      set({ isLoading: false });
      toast.success("Password changed successfully");
    } catch (error: unknown) {
      set({ isLoading: false });
      const message = extractErrorMessage(error);
      toast.error(message);
      throw error;
    }
  },
}));
