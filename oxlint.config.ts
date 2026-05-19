import { defineConfig } from "oxlint";

import shared from "./oxlintrc.shared.ts";

export default defineConfig({
    extends: [shared],
    ignorePatterns: [
        "node_modules/**",
        "vendor/**",
        "dist/**",
        "build/**",
        "coverage/**",
        ".turbo/**",
        ".pnpm-store/**",
        "apps/*/dist/**",
        "apps/mobile/android/**",
        "apps/mobile/ios/**",
        "apps/mobile/.expo/**",
        "packages/*/dist/**",
        "packages/*/build/**",
    ],
});
