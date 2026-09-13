import { createServer, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import { buildFixtureApp } from "../tests/support/fixture-app";

// Separate development entry point: production never selects fixtures via an environment flag.
const api = buildFixtureApp();
let ui: ViteDevServer | undefined;
async function stop() {
  await ui?.close();
  await api.close();
}
process.once("SIGINT", () => { void stop(); });
process.once("SIGTERM", () => { void stop(); });

try {
  await api.listen({ host: "127.0.0.1", port: 3001 });
  ui = await createServer({
    configFile: false,
    plugins: [react()],
    // Override local .env files and inherited values so the demo cannot target a live API.
    define: { "import.meta.env.VITE_API_BASE_URL": JSON.stringify("") },
    server: {
      host: "127.0.0.1",
      port: 5174,
      strictPort: true,
      proxy: { "/api": { target: "http://127.0.0.1:3001", changeOrigin: true } },
    },
  });
  await ui.listen();
  console.log("Offline fixture demo: http://127.0.0.1:5174 (no Bedrock calls). Company FAIL_GENERATION simulates failure.");
} catch {
  console.error("Fixture demo could not start. Ensure loopback ports 3001 and 5174 are free.");
  await stop();
  process.exitCode = 1;
}
