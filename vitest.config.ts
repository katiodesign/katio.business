import { defineConfig } from "vitest/config";
import { resolve } from "node:path";
export default defineConfig({ resolve: { alias: { "@": resolve(__dirname, "src") } }, test: { exclude: ["e2e/**", "node_modules/**", ".next/**", ".next-integration/**"] } });
