import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://cms.purplemusicgroup.com",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
