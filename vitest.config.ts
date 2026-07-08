import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    // Vitest does not read tsconfig `paths`; mirror the @/* alias here.
    alias: { "@": path.resolve(process.cwd(), "src") },
  },
});
