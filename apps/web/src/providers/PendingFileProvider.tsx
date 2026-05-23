import { createContext, useCallback, useContext, useRef, type ReactNode } from "react";

interface PendingFileContextValue {
    setPendingFile: (file: File) => void;
    consumePendingFile: () => File | null;
}

const PendingFileContext = createContext<PendingFileContextValue | null>(null);

/**
 * Holds a single "pending" File in a ref so it survives a route navigation
 * without triggering re-renders. The file is consumed (cleared) once read.
 *
 * Used by `useTauriStartup` to pass a file opened via the OS context menu
 * to whichever tool the user was routed to.
 */
export function PendingFileProvider({ children }: { children: ReactNode }) {
    const pendingFileRef = useRef<File | null>(null);

    const setPendingFile = useCallback((file: File) => {
        pendingFileRef.current = file;
    }, []);

    const consumePendingFile = useCallback((): File | null => {
        const file = pendingFileRef.current;
        pendingFileRef.current = null;
        return file;
    }, []);

    return <PendingFileContext value={{ setPendingFile, consumePendingFile }}>{children}</PendingFileContext>;
}

export function usePendingFile() {
    const ctx = useContext(PendingFileContext);
    if (!ctx) throw new Error("usePendingFile must be used within a PendingFileProvider");
    return ctx;
}
