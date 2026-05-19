import "i18next";
import type { en } from "@/lib/features/locales/en";

declare module "i18next" {
    interface CustomTypeOptions {
        defaultNS: "translation";
        resources: {
            translation: typeof en;
        };
    }
}
