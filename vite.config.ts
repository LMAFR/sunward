import { defineConfig } from "vite";

// DEPLOY_BASE is set by the Pages workflow (project pages serve from a
// subpath); local dev and the VPS server use "/".
export default defineConfig({
  base: process.env.DEPLOY_BASE ?? "/",
});
