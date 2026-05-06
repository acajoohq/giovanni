import { useEffect, useState } from "react";

export function useObjectUrls<TItem>(items: TItem[], getBlob: (item: TItem) => Blob | null): Array<string | null> {
    const [urls, setUrls] = useState<Array<string | null>>([]);

    useEffect(() => {
        if (items.length === 0) {
            setUrls((currentUrls) => (currentUrls.length === 0 ? currentUrls : []));
            return;
        }

        const nextUrls = items.map((item) => {
            const blob = getBlob(item);

            return blob ? URL.createObjectURL(blob) : null;
        });

        setUrls(nextUrls);

        return () => {
            for (const url of nextUrls) {
                if (url) {
                    URL.revokeObjectURL(url);
                }
            }
        };
    }, [items, getBlob]);

    return urls;
}
