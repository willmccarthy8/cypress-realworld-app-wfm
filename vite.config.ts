import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import eslint from "vite-plugin-eslint";
import istanbul from "vite-plugin-istanbul";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE");
  return {
    // expose all vite "VITE_*" variables as process.env.VITE_* in the browser
    define: {
      "process.env": env,
    },
    server: {
      port: 3000,
    },
    build: {
      outDir: "build",
      sourcemap: true,
    },
    plugins: [
      react(),
      eslint(),
      istanbul({
        cypress: true,
        requireEnv: true,
        exclude: ["node_modules", "cypress", "dist"],
        forceBuildInstrument: true,
      }),
    ],
    // to get aws amplify to work with vite
    resolve: {
      alias: [
        {
          find: "./runtimeConfig",
          replacement: "./runtimeConfig.browser", // ensures browser compatible version of AWS JS SDK is used
        },
      ],
    },
    test: {
      environment: "jsdom",
      setupFiles: "./src/setup-tests.js",
      // src/aws-exports.js is generated, so unit tests resolve the committed mock instead
      alias: [{ find: /^(.*)\/aws-exports$/, replacement: "/scripts/mock-aws-exports.js" }],
      exclude: ["node_modules", "cypress", "dist"],
      fileParallelism: false, // #1666: Run tests sequentially to avoid race conditions with shared database.json file.
      coverage: {
        provider: "v8",
        reportsDirectory: "coverage-unit",
        reporter: ["text", "html", "json-summary"],
        include: ["src/**/*.{ts,tsx}", "backend/**/*.ts"],
        exclude: [
          "src/models/*.ts",
          "src/**/*.cy.{ts,tsx}",
          "src/**/__tests__/**",
          "src/index*.tsx",
          "src/svgs/**",
          "src/react-app-env.d.ts",
          "src/setup-tests.js",
          "src/setupProxy.js",
          "backend/types.ts",
        ],
      },
    },
  };
});
