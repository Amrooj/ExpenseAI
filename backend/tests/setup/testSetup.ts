// tests/setup/testSetup.ts
// Runs before each test FILE
import { vi, beforeEach } from "vitest";

// Reset all mocks between test files
beforeEach(() => {
  vi.clearAllMocks();
});
