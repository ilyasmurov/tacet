import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Движок анимации работает с настоящим DOM, поэтому окружение общее для всех.
    environment: "jsdom",
    include: ["packages/*/src/**/*.test.{ts,tsx}"],
  },
});
