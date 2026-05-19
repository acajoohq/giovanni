import { NitroModules } from "react-native-nitro-modules";

import type { DocumentRectifier } from "./DocumentRectifier.nitro";

let documentRectifier: DocumentRectifier | null = null;

export function getDocumentRectifier(): DocumentRectifier {
    documentRectifier ??= NitroModules.createHybridObject<DocumentRectifier>("DocumentRectifier");

    return documentRectifier;
}

export type { DocumentRectifier, RectifyResult, TensorPrepResult } from "./DocumentRectifier.nitro";
