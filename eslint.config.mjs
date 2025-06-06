import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import minecraftLinting from "eslint-plugin-minecraft-linting";

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  {
    plugins: {
      "minecraft-linting": minecraftLinting,
    },
    rules: {
      "minecraft-linting/avoid-unnecessary-command": "error",
    },
  }
);
