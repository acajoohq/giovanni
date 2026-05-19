import { defineConfig } from "oxlint";

import shared from "../../oxlintrc.shared.ts";

export default defineConfig({
    extends: [shared],
    env: {
        browser: true,
        node: true,
    },
});
