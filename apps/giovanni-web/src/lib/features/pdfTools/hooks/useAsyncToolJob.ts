import { useCallback, useReducer, useRef } from "react";
import type { ToolStatus } from "../utils/toolStatus";

interface RunToolJobOptions<TResult> {
    execute: () => Promise<TResult>;
    successStatus?: (result: TResult, elapsedMs: number) => ToolStatus;
    errorMessage: string;
    onSuccess?: (result: TResult, elapsedMs: number) => void;
    onError?: (error: unknown) => void;
}

interface ToolJobState<TResult> {
    result: TResult | null;
    elapsedMs: number | null;
    status: ToolStatus;
    isWorking: boolean;
}

type ToolJobAction<TResult> =
    | { type: "started" }
    | { type: "succeeded"; result: TResult; elapsedMs: number; status: ToolStatus }
    | { type: "failed"; status: ToolStatus }
    | { type: "reset" }
    | { type: "clearedResult" }
    | { type: "setStatus"; status: ToolStatus }
    | { type: "setResult"; result: TResult | null };

function getInitialToolJobState<TResult>(): ToolJobState<TResult> {
    return {
        result: null,
        elapsedMs: null,
        status: null,
        isWorking: false,
    };
}

function toolJobReducer<TResult>(state: ToolJobState<TResult>, action: ToolJobAction<TResult>): ToolJobState<TResult> {
    switch (action.type) {
        case "started":
            return {
                ...state,
                result: null,
                elapsedMs: null,
                isWorking: true,
            };
        case "succeeded":
            return {
                result: action.result,
                elapsedMs: action.elapsedMs,
                status: action.status,
                isWorking: false,
            };
        case "failed":
            return {
                ...state,
                status: action.status,
                isWorking: false,
            };
        case "reset":
            return getInitialToolJobState();
        case "clearedResult":
            return {
                ...state,
                result: null,
                elapsedMs: null,
            };
        case "setStatus":
            return {
                ...state,
                status: action.status,
            };
        case "setResult":
            return {
                ...state,
                result: action.result,
            };
        default: {
            const exhaustiveAction: never = action;
            return exhaustiveAction;
        }
    }
}

export function useAsyncToolJob<TResult>() {
    const jobIdRef = useRef(0);
    const [state, dispatch] = useReducer(toolJobReducer<TResult>, undefined, getInitialToolJobState);

    const reset = useCallback(() => {
        jobIdRef.current += 1;
        dispatch({ type: "reset" });
    }, []);

    const clearResult = useCallback(() => {
        dispatch({ type: "clearedResult" });
    }, []);

    const setStatus = useCallback((status: ToolStatus) => {
        dispatch({ type: "setStatus", status });
    }, []);

    const setResult = useCallback((result: TResult | null) => {
        dispatch({ type: "setResult", result });
    }, []);

    const runJob = useCallback(async ({ execute, successStatus, errorMessage, onSuccess, onError }: RunToolJobOptions<TResult>) => {
        const jobId = jobIdRef.current + 1;
        jobIdRef.current = jobId;

        dispatch({ type: "started" });

        try {
            const start = performance.now();
            const nextResult = await execute();
            const nextElapsedMs = performance.now() - start;

            if (jobIdRef.current !== jobId) {
                return null;
            }

            dispatch({ type: "succeeded", result: nextResult, elapsedMs: nextElapsedMs, status: successStatus?.(nextResult, nextElapsedMs) ?? null });
            onSuccess?.(nextResult, nextElapsedMs);

            return nextResult;
        } catch (error) {
            if (jobIdRef.current === jobId) {
                dispatch({ type: "failed", status: { tone: "error", message: error instanceof Error ? error.message : errorMessage } });
                onError?.(error);
            }

            return null;
        }
    }, []);

    return {
        ...state,
        setStatus,
        setResult,
        reset,
        clearResult,
        runJob,
    };
}
