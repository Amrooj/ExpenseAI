import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Use Node.js environment (not jsdom — that's for frontend)
    environment: "node",
    // Run tests in these folders
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    // Run each test file in isolation (fresh module state)
    isolate: true,
    // Show detailed output
    reporter: "verbose",
    // Code coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/server.ts",      // Entry point — not unit testable
        "src/config/**",      // Config files — tested via integration
        "**/*.d.ts",
      ],
      // Minimum coverage thresholds (fail CI if below these)
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
    // Global setup (runs once before all tests)
    globalSetup: "./tests/setup/globalSetup.ts",
    // Setup that runs before each test file
    setupFiles: ["./tests/setup/testSetup.ts"],
  },
});
