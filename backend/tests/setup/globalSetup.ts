// tests/setup/globalSetup.ts
// Runs ONCE before all test suites
export async function setup() {
  process.env["NODE_ENV"] = "test";
  process.env["DATABASE_URL"] = process.env["TEST_DATABASE_URL"] ?? "postgresql://expense_user:expense_pass@localhost:5432/expense_tracker_test";
  process.env["JWT_ACCESS_SECRET"] = "test_access_secret_32_chars_minimum";
  process.env["JWT_REFRESH_SECRET"] = "test_refresh_secret_32_chars_minimum";
  process.env["AI_PROVIDER"] = "rule-based";
  process.env["STORAGE_PROVIDER"] = "local";
}

export async function teardown() {
  // Global cleanup after all tests
}
