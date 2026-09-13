import { describe, expect, it } from "vitest";
import viteConfig from "../vite.config";

describe("Vite development proxy", () => {
  it("routes API requests to the Fastify server on port 3000", () => {
    expect(viteConfig.server?.proxy).toEqual({
      "/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
      },
    });
  });
});
