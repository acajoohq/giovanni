import { useEffect } from "react";
import { usePendingFile } from "@/providers/PendingFileProvider";

/**
 * On mount, consumes any pending file staged by `PendingFileProvider` and
 * passes it to `handleFiles`.
 */
export function usePendingFileHandler(handleFiles: (files: File[]) => void): void {
    const { consumePendingFile } = usePendingFile();

    useEffect(() => {
        const pending = consumePendingFile();
        if (pending) handleFiles([pending]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [consumePendingFile]);
}
