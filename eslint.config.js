import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),

  // Configuration for backend Node.js files (CommonJS)
  {
    files: ["ServiceNestBackEnd/**/*.js"],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z_]" }],
    },
  },

  // Configuration for frontend files (React/Vite) and root config files
  {
    files: ["**/*.{js,jsx}"],
    ignores: ["ServiceNestBackEnd/**/*.js"], // Exclude backend files from this config
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      "no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z_]" }],
    },
  },
]);
