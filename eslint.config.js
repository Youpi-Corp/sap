import typescriptEslint from "typescript-eslint";

export default [
  {
    ignores: ["node_modules/", "dist/", "bun.lockb"],
  },
  ...typescriptEslint.configs.recommended,
  {
    rules: {
      // Configure no-unused-vars with ignoreRestSiblings option
      "@typescript-eslint/no-unused-vars": [
        "error",
        { ignoreRestSiblings: true },
      ],
    },
  },
];
