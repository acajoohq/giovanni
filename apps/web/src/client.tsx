import { StartClient } from "@tanstack/react-start/client";
import { hydrateRoot } from "react-dom/client";
import "@/lib/i18n";

hydrateRoot(document, <StartClient />);
