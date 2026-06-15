import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Unit/integration tests import the shared core via the "@" alias, which now
// points at the @cueword/core source.
const coreSrc = fileURLToPath(new URL("./packages/core/src", import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": coreSrc.replace(/\/$/, "") },
  },
});
