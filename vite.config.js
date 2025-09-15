import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig(() => ({
    plugins: [react()],
    base: "/dokimotes",
    server: {
        port: 5173,
        open: false,
    },
    build: {
        emptyOutDir: true,
        manifest: false,
        target: "esnext",
        outDir: "dokimotes", // should be the same as base
    },
}));
