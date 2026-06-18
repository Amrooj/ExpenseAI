// ============================================================
// tests/unit/auth.service.test.ts — Auth Service Unit Tests
// ============================================================
//
// 🎓 TEACHING: Unit Tests
//
// A UNIT test tests a single unit of code (a function/class)
// in ISOLATION from its dependencies.
//
// "Isolation" means we MOCK (fake) the dependencies.
// For auth.service.ts, dependencies are:
//   - authRepo (database) → we mock it
//   - bcrypt (hashing)    → we mock it
//   - jwt utils           → we mock them
//
// WHY MOCK?
//   - Tests run in milliseconds (no real DB queries)
//   - Tests don't need a running PostgreSQL server
//   - Tests are deterministic (bcrypt.hash always returns the same mock value)
//   - Tests can simulate error conditions easily
//
// Vitest's `vi.mock()` replaces a module with a fake version.
// `vi.fn()` creates a fake function you can control.
//
// 🎓 INTERVIEW QUESTION:
//   "What is the difference between a mock, stub, and spy?"
//   - Mock: Replaces a dependency entirely with a fake
//   - Stub: Returns pre-defined values without real logic
//   - Spy: Wraps real function to track calls without replacing it
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as authService from "../../src/services/auth.service";

// ── Mock all external dependencies ───────────────────────────
// These replace the real implementations during tests

// Mock the repository (database layer)
vi.mock("../../src/repositories/auth.repository", () => ({
  emailExists:              vi.fn(),
  createUser:               vi.fn(),
  findUserByEmail:          vi.fn(),
  createRefreshToken:       vi.fn(),
  findRefreshToken:         vi.fn(),
  deleteRefreshToken:       vi.fn(),
  deleteAllUserRefreshTokens: vi.fn(),
}));

// Mock bcrypt (password hashing — would be too slow and non-deterministic in tests)
vi.mock("bcryptjs", () => ({
  default: {
    hash:    vi.fn(),
    compare: vi.fn(),
  },
}));

// Mock JWT utilities
vi.mock("../../src/utils/jwt", () => ({
  generateAccessToken:  vi.fn(),
  generateRefreshToken: vi.fn(),
  verifyRefreshToken:   vi.fn(),
  hashToken:            vi.fn(),
  getRefreshTokenExpiry: vi.fn(),
}));

// Import mocked modules (after vi.mock calls)
import * as authRepo from "../../src/repositories/auth.repository";
import bcrypt from "bcryptjs";
import * as jwtUtils from "../../src/utils/jwt";

// ── Test Data ─────────────────────────────────────────────────
const mockUser = {
  id:              "user_123",
  email:           "test@example.com",
  name:            "Test User",
  defaultCurrency: "USD",
  timezone:        "UTC",
  createdAt:       new Date(),
};

const mockUserWithHash = {
  ...mockUser,
  passwordHash: "$2b$12$hashedpassword",
  isActive: true,
  updatedAt: new Date(),
};

// ============================================================
// TEST SUITES
// ============================================================

describe("AuthService.register", () => {
  // Reset all mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(authRepo.emailExists).mockResolvedValue(false);
    vi.mocked(authRepo.createUser).mockResolvedValue(mockUser);
    vi.mocked(authRepo.createRefreshToken).mockResolvedValue({} as never);
    vi.mocked(bcrypt.hash).mockResolvedValue("$2b$12$hashedpassword" as never);
    vi.mocked(jwtUtils.generateAccessToken).mockReturnValue("mock_access_token");
    vi.mocked(jwtUtils.generateRefreshToken).mockReturnValue("mock_refresh_token");
    vi.mocked(jwtUtils.hashToken).mockReturnValue("hashed_refresh_token");
    vi.mocked(jwtUtils.getRefreshTokenExpiry).mockReturnValue(new Date());
  });

  it("should register a new user successfully", async () => {
    const dto = {
      name:            "Test User",
      email:           "test@example.com",
      password:        "password123",
      confirmPassword: "password123",
      defaultCurrency: "USD",
      timezone:        "UTC",
    };

    const result = await authService.register(dto);

    // ✅ Assertions — verify the expected behavior
    expect(result.user.email).toBe("test@example.com");
    expect(result.tokens.accessToken).toBe("mock_access_token");
    expect(result.tokens.refreshToken).toBe("mock_refresh_token");

    // Verify bcrypt was called with the correct cost factor (12)
    expect(bcrypt.hash).toHaveBeenCalledWith("password123", 12);

    // Verify email uniqueness was checked
    expect(authRepo.emailExists).toHaveBeenCalledWith("test@example.com");

    // Verify the plain password was NEVER stored (only the hash)
    expect(authRepo.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        passwordHash: "$2b$12$hashedpassword",
        // password should NOT be in the call args
      })
    );
    expect(authRepo.createUser).not.toHaveBeenCalledWith(
      expect.objectContaining({ password: "password123" })
    );
  });

  it("should throw a conflict error if email already exists", async () => {
    vi.mocked(authRepo.emailExists).mockResolvedValue(true);

    const dto = {
      name:            "Test User",
      email:           "existing@example.com",
      password:        "password123",
      confirmPassword: "password123",
      defaultCurrency: "USD",
      timezone:        "UTC",
    };

    // Expect the service to throw an AppError with status 409
    await expect(authService.register(dto)).rejects.toMatchObject({
      statusCode: 409,
      message:    expect.stringContaining("already exists"),
    });

    // User should NOT have been created
    expect(authRepo.createUser).not.toHaveBeenCalled();
  });
});

describe("AuthService.login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authRepo.findUserByEmail).mockResolvedValue(mockUserWithHash);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(authRepo.createRefreshToken).mockResolvedValue({} as never);
    vi.mocked(jwtUtils.generateAccessToken).mockReturnValue("mock_access_token");
    vi.mocked(jwtUtils.generateRefreshToken).mockReturnValue("mock_refresh_token");
    vi.mocked(jwtUtils.hashToken).mockReturnValue("hashed_token");
    vi.mocked(jwtUtils.getRefreshTokenExpiry).mockReturnValue(new Date());
  });

  it("should login successfully with correct credentials", async () => {
    const result = await authService.login({
      email:    "test@example.com",
      password: "password123",
    });

    expect(result.user.email).toBe("test@example.com");
    expect(result.tokens.accessToken).toBeDefined();
    expect(bcrypt.compare).toHaveBeenCalledWith("password123", mockUserWithHash.passwordHash);
  });

  it("should throw 401 if user does not exist", async () => {
    vi.mocked(authRepo.findUserByEmail).mockResolvedValue(null);

    await expect(
      authService.login({ email: "nobody@example.com", password: "pass123" })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("should throw 401 if password is wrong", async () => {
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await expect(
      authService.login({ email: "test@example.com", password: "wrongpassword" })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("should use the SAME error message for wrong user and wrong password", async () => {
    // SECURITY: User enumeration prevention
    vi.mocked(authRepo.findUserByEmail).mockResolvedValue(null);
    const errorWhenNoUser = await authService.login({
      email: "nobody@example.com", password: "pass"
    }).catch((e) => e);

    vi.mocked(authRepo.findUserByEmail).mockResolvedValue(mockUserWithHash);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    const errorWhenWrongPass = await authService.login({
      email: "test@example.com", password: "wrongpass"
    }).catch((e) => e);

    // Both errors should have the same message
    expect(errorWhenNoUser.message).toBe(errorWhenWrongPass.message);
  });
});
