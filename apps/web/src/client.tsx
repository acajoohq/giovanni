import { i18nReady } from "@/lib/features/locales/i18n";
import { StartClient } from "@tanstack/react-start/client";
import { hydrateRoot } from "react-dom/client";

i18nReady
    .catch((error) => {
        console.error("i18n initialization failed", error);
    })
    .finally(() => {
        hydrateRoot(document, <StartClient />);
    });
