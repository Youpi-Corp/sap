import typescriptEslint from "typescript-eslint";

export default [
  {
    ignores: ["node_modules/", "dist/", "bun.lockb"],
  },
  ...typescriptEslint.configs.recommended,
  {
    rules: {
      // Add any project-specific rules here
      // For example:
      // "@typescript-eslint/no-explicit-any": "warn"
    },
  },
];
