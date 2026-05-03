import * as React from "react";
import { RiCloseLine, RiFilePdfLine } from "@remixicon/react";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "./shadcn-ui/Dialog";

interface AboutDialogProps {
    open: boolean;
    onClose: () => void;
}

const CONTRIBUTORS = [
    { name: "Mattèo Gauthier", github: "matteogauthier", initials: "MG", color: "#eb5a3f" },
    { name: "Edward Brunetiere", github: "EdwardBrunetiere", initials: "EB", color: "#4f8ef7" },
] as const;

function Avatar({ name, github, initials, color }: (typeof CONTRIBUTORS)[number]) {
    const [failed, setFailed] = React.useState(false);

    return (
        <div className="flex flex-col items-center gap-3">
            {failed ? (
                <div
                    className="flex size-14 items-center justify-center rounded-full border-2 text-[16px] font-semibold"
                    style={{ backgroundColor: `${color}22`, borderColor: `${color}55`, color }}
                >
                    {initials}
                </div>
            ) : (
                <img
                    alt={name}
                    className="size-14 rounded-full border-2 border-[#2a2a2a] bg-[#1a1a1a]"
                    src={`https://github.com/${github}.png?size=80`}
                    onError={() => setFailed(true)}
                />
            )}
            <div className="text-center">
                <div className="text-[12px] font-medium text-white">{name}</div>
                <a
                    className="text-[11px] text-neutral-500 transition-colors hover:text-[#eb5a3f]"
                    href={`https://github.com/${github}`}
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    @{github}
                </a>
            </div>
        </div>
    );
}

export function AboutDialog({ open, onClose }: AboutDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent>
                <DialogClose className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-[#252525] hover:text-white">
                    <RiCloseLine className="size-4" />
                </DialogClose>

                <div className="flex items-center gap-3 border-b border-[#252525] px-5 py-4">
                    <div className="flex size-8 items-center justify-center rounded-lg border border-[#eb5a3f]/30 bg-[#eb5a3f]/15">
                        <RiFilePdfLine className="size-4 text-[#eb5a3f]" />
                    </div>
                    <DialogTitle className="text-[14px] font-semibold text-white">Giovanni</DialogTitle>
                </div>

                <div className="px-5 py-5">
                    <div className="flex justify-around">
                        {CONTRIBUTORS.map((c) => (
                            <Avatar key={c.github} {...c} />
                        ))}
                    </div>

                    <p className="mt-5 text-center text-[11px] leading-relaxed text-neutral-600">
                        Powered by{" "}
                        <a
                            className="text-neutral-400 transition-colors hover:text-[#eb5a3f]"
                            href="https://github.com/qpdf/qpdf"
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            qpdf
                        </a>{" "}
                        compiled to WebAssembly. No files leave your browser.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
