import { i18nReady } from "@/lib/i18n";
import { StartClient } from "@tanstack/react-start/client";
import { hydrateRoot } from "react-dom/client";

i18nReady.then(() => {
    hydrateRoot(document, <StartClient />);
});
