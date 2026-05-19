import { defineConfig } from "oxlint";
import native from "oxlint-config-universe/native";

import shared from "../../oxlintrc.shared.ts";

/**
 * Oxlint port of eslint-config-expo:
 * - `oxlint-config-universe/native` ↔ eslint-config-universe/native
 *   https://github.com/expo/expo/tree/main/packages/eslint-config-universe
 * - `eslint-plugin-expo` via jsPlugins ↔ eslint-config-expo expo rules
 *
 * @see https://oxc.rs/docs/guide/usage/linter/config#typescript-config-file-oxlint-configts
 */
export default defineConfig({
    extends: [native, shared],
    ignorePatterns: ["android/**", "ios/**", ".expo/**"],
    jsPlugins: ["eslint-plugin-expo"],
    rules: {
        "expo/use-dom-exports": "error",
        "expo/no-env-var-destructuring": "error",
        "expo/no-dynamic-env-var": "error",
    },
});
