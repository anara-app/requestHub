import { defineConfig } from "@lingui/cli";

export default defineConfig({
  sourceLocale: "ru",
  locales: ["ru", "en"],
  catalogs: [
    {
      path: "<rootDir>/locales/{locale}/messages",
      include: ["src"],
    },
  ],
});
