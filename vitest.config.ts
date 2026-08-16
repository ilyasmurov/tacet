import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The animation engine works with a real DOM, so the environment is shared.
    environment: "jsdom",
    include: ["packages/*/src/**/*.test.{ts,tsx}"],
  },
});
