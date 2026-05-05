import { useEffect, useMemo, useRef } from "react";

type DebouncedFunction<T extends (...args: never[]) => void> = ((...args: Parameters<T>) => void) & {
    cancel: () => void;
    flush: () => void;
};

export const useDebouncedCallback = <T extends (...args: never[]) => void>(callback: T, delay: number): DebouncedFunction<T> => {
    const callbackRef = useRef(callback);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const lastArgsRef = useRef<Parameters<T> | undefined>(undefined);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    const debouncedCallback = useMemo<DebouncedFunction<T>>(() => {
        const run = (...args: Parameters<T>) => {
            lastArgsRef.current = args;

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                timeoutRef.current = undefined;

                if (!lastArgsRef.current) {
                    return;
                }

                callbackRef.current(...lastArgsRef.current);
                lastArgsRef.current = undefined;
            }, delay);
        };

        run.cancel = () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = undefined;
            }

            lastArgsRef.current = undefined;
        };

        run.flush = () => {
            if (!lastArgsRef.current) {
                return;
            }

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = undefined;
            }

            callbackRef.current(...lastArgsRef.current);
            lastArgsRef.current = undefined;
        };

        return run;
    }, [delay]);

    useEffect(() => {
        return () => {
            debouncedCallback.cancel();
        };
    }, [debouncedCallback]);

    return debouncedCallback;
};
