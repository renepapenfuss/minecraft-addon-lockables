import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";
import minecraftLinting from "eslint-plugin-minecraft-linting";

export default defineConfig([
  {
    files: [
      "scripts/**/*.{js,mjs,cjs,ts,mts,cts}",
    ],
    plugins: {
      js,
      "minecraft-linting": minecraftLinting,
    },
    extends: [
      "js/recommended",
    ],
    rules: {
      "minecraft-linting/avoid-unnecessary-command": "error",
    },
  },
  { files: ["scripts/**/*.{js,mjs,cjs,ts,mts,cts}"], languageOptions: { globals: globals.node } },
  tseslint.configs.recommended,
]);
