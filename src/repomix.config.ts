import type { RepomixConfig } from "repomix";

const config: RepomixConfig = {
  include: [
    "src/**/*.ts",
    "src/**/*.tsx",
    "src/**/*.mjs",
    "src/**/*.cjs",
    "prisma/**/*.prisma",
    "public/**/*.json",
    "package.json",
    "next.config.js",
    "tailwind.config.ts",
    "postcss.config.mjs",
    "tsconfig.json",
  ],
  exclude: [
    "node_modules",
    ".next",
    "build",
    "dist",
    "out",
    "coverage",
    "tmp",
    "cache",
    "public/fonts",
    "public/images",
    "public/videos",
  ],
  maxFileSize: 8000,
  output: "codebase.md",
  format: "markdown",
};

export default config;
