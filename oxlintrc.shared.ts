import { defineConfig } from "oxlint";

export default defineConfig({
    plugins: ["oxc", "typescript", "unicorn", "import", "vitest", "promise", "react", "react_perf"],
    rules: {
        eqeqeq: "error",
        "no-debugger": "error",
        "no-var": "error",
        "prefer-const": "error",
        "import/no-cycle": "error",
        "promise/no-return-wrap": "error",
        "react/rules-of-hooks": "error",
        "react/exhaustive-deps": "warn",
        "typescript/no-explicit-any": "error",
        "typescript/no-non-null-assertion": "error",
    },
    overrides: [
        {
            files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
            plugins: ["vitest"],
            env: {
                vitest: true,
            },
        },
    ],
});
