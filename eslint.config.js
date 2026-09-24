import js from "@eslint/js";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";

export default [
  { ignores: ["node_modules/**", "data/**", "dist/**"] },
  js.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: { parser: tsParser, globals: { ...globals.node, process: "readonly", console: "readonly", fetch: "readonly" } },
    rules: { "no-unused-vars": "off" }
  }
];
