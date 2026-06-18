// ============================================================
// src/api/client.ts — Axios HTTP Client
// ============================================================
//
// 🎓 TEACHING: What is Axios?
//
// Axios is an HTTP client for making API requests from the browser.
// You could use `fetch()` (built-in), but Axios provides:
//   - Automatic JSON parsing
//   - Request/response INTERCEPTORS (middleware for HTTP requests)
//   - Automatic error handling
//   - Token refresh — the killer feature
//
// 🎓 TEACHING: Interceptors — The Axios Middleware Pattern
//
// Interceptors are like Express middleware, but for CLIENT requests.
// Request interceptor:  runs BEFORE every request → attach JWT token
// Response interceptor: runs AFTER every response → handle 401 errors
//
// The interceptor pattern here implements:
//   AUTOMATIC TOKEN REFRESH with ZERO user intervention
//
//   1. User's accessToken expires (15 minutes)
//   2. API returns 401
//   3. Response interceptor catches it
//   4. Calls /api/auth/refresh with the refreshToken
//   5. Gets new accessToken
//   6. RETRIES the original failed request with the new token
//   7. User never knows the token expired
//
// This is how Netflix, Spotify, and every major app works.
// ============================================================

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// ── Create Axios Instance ─────────────────────────────────────
const api = axios.create({
  baseURL:  API_URL,
  timeout:  15000,  // 15 second timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Token Storage ─────────────────────────────────────────────
// localStorage persists across browser sessions (closing/reopening)
// sessionStorage would clear on tab close
const TOKEN_KEY         = "expense_access_token";
const REFRESH_TOKEN_KEY = "expense_refresh_token";

export function getAccessToken():  string | null { return localStorage.getItem(TOKEN_KEY); }
export function getRefreshToken(): string | null { return localStorage.getItem(REFRESH_TOKEN_KEY); }

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// ── Request Interceptor — Attach JWT to every request ────────
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor — Auto-refresh on 401 ───────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject:  (error: unknown) => void;
}> = [];

// Process queued requests after token refresh
function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) { reject(error); }
    else       { resolve(token!); }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response, // Success → pass through
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401 errors (not 403, 404, etc.)
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Don't try to refresh the /refresh endpoint itself
    if (originalRequest.url?.includes("/auth/refresh")) {
      clearTokens();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    // Mark as refreshing and attempt token refresh
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new Error("No refresh token");
      }

      const { data } = await axios.post(`${API_URL}/api/auth/refresh`, {
        refreshToken,
      });

      const newAccessToken  = data.data.accessToken;
      const newRefreshToken = data.data.refreshToken;

      setTokens(newAccessToken, newRefreshToken);
      processQueue(null, newAccessToken);

      // Retry the original request with new token
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearTokens();
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
