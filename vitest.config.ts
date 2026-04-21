import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./setupTests.ts"],
    globals: true,
    exclude: ["**/node_modules/**", "**/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html"],
      exclude: ["node_modules/", "e2e/", "**/*.test.*", "**/*.spec.*", "setupTests.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
