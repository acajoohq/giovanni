import * as React from "react";
import type { ToolStatus } from "../utils/toolStatus";

interface RunToolJobOptions<TResult> {
    execute: () => Promise<TResult>;
    successStatus?: (result: TResult, elapsedMs: number) => ToolStatus;
    errorMessage: string;
    onSuccess?: (result: TResult, elapsedMs: number) => void;
    onError?: (error: unknown) => void;
}

export function useAsyncToolJob<TResult>() {
    const jobIdRef = React.useRef(0);
    const [result, setResult] = React.useState<TResult | null>(null);
    const [elapsedMs, setElapsedMs] = React.useState<number | null>(null);
    const [status, setStatus] = React.useState<ToolStatus>(null);
    const [isWorking, setIsWorking] = React.useState(false);

    const reset = React.useCallback(() => {
        jobIdRef.current += 1;
        setResult(null);
        setElapsedMs(null);
        setStatus(null);
        setIsWorking(false);
    }, []);

    const clearResult = React.useCallback(() => {
        setResult(null);
        setElapsedMs(null);
    }, []);

    const runJob = React.useCallback(async ({ execute, successStatus, errorMessage, onSuccess, onError }: RunToolJobOptions<TResult>) => {
        const jobId = jobIdRef.current + 1;
        jobIdRef.current = jobId;

        setIsWorking(true);
        setResult(null);
        setElapsedMs(null);

        try {
            const start = performance.now();
            const nextResult = await execute();
            const nextElapsedMs = performance.now() - start;

            if (jobIdRef.current !== jobId) {
                return null;
            }

            setResult(nextResult);
            setElapsedMs(nextElapsedMs);
            setStatus(successStatus?.(nextResult, nextElapsedMs) ?? null);
            onSuccess?.(nextResult, nextElapsedMs);

            return nextResult;
        } catch (error) {
            if (jobIdRef.current === jobId) {
                setStatus({ tone: "error", message: error instanceof Error ? error.message : errorMessage });
                onError?.(error);
            }

            return null;
        } finally {
            if (jobIdRef.current === jobId) {
                setIsWorking(false);
            }
        }
    }, []);

    return {
        result,
        elapsedMs,
        status,
        isWorking,
        setStatus,
        setResult,
        reset,
        clearResult,
        runJob,
    };
}
