import * as React from "react";
import { RiFilePdf2Line } from "@remixicon/react";

interface PdfPreviewProps {
    data?: Uint8Array | null;
    file?: File | null;
    placeholder?: React.ReactNode;
}

export function PdfPreview({ data, file, placeholder }: PdfPreviewProps) {
    const [url, setUrl] = React.useState<string | null>(null);

    React.useEffect(() => {
        let objectUrl: string | null = null;

        if (data) {
            objectUrl = URL.createObjectURL(new Blob([data.buffer as ArrayBuffer], { type: "application/pdf" }));
        } else if (file) {
            objectUrl = URL.createObjectURL(file);
        }

        setUrl(objectUrl);

        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [data, file]);

    if (!url) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-neutral-600">
                {placeholder ?? (
                    <>
                        <RiFilePdf2Line className="size-12 opacity-20" />
                        <span className="text-[12px]">No preview</span>
                    </>
                )}
            </div>
        );
    }

    return <iframe allow="fullscreen" className="h-full w-full border-0" referrerPolicy="no-referrer" src={url} title="PDF preview" />;
}
