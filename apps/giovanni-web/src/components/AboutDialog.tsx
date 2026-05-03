import * as React from "react";
import { RiCloseLine, RiFilePdfLine } from "@remixicon/react";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "./shadcn-ui/Dialog";

interface AboutDialogProps {
    open: boolean;
    onClose: () => void;
}

const CONTRIBUTORS = [
    { name: "Edward Brunetiere", github: "EdwardBrunetiere", initials: "EB", color: "#4f8ef7" },
    { name: "Mattèo Gauthier", github: "matteogauthier", initials: "MG", color: "#eb5a3f" },
] as const;

function Avatar({ name, github, initials, color }: (typeof CONTRIBUTORS)[number]) {
    const [failed, setFailed] = React.useState(false);

    return (
        <div className="flex flex-col items-center gap-2.5">
            {failed ? (
                <div
                    className="flex size-12 items-center justify-center rounded-full border text-[13px] font-semibold"
                    style={{ backgroundColor: `${color}20`, borderColor: `${color}40`, color }}
                >
                    {initials}
                </div>
            ) : (
                <img
                    alt={name}
                    className="size-12 rounded-full border border-white/10 bg-[#1a1a1a]"
                    src={`https://github.com/${github}.png?size=96`}
                    onError={() => setFailed(true)}
                />
            )}
            <div className="text-center">
                <div className="text-[12px] font-medium leading-tight text-neutral-200">{name}</div>
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
            <DialogContent showCloseButton={false} className="max-w-[400px] gap-0 overflow-hidden p-0">
                <div className="relative px-6 pb-5 pt-7 text-center">
                    <DialogClose className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-md text-neutral-600 outline-none transition-colors hover:bg-white/5 hover:text-neutral-300">
                        <RiCloseLine className="size-4" />
                    </DialogClose>

                    <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl border border-[#eb5a3f]/20 bg-[#eb5a3f]/10">
                        <RiFilePdfLine className="size-5 text-[#eb5a3f]" />
                    </div>
                    <DialogTitle className="text-[15px] font-semibold text-white">Giovanni</DialogTitle>
                    <p className="mt-1 text-[11px] text-neutral-500">PDF tools · offline &amp; private</p>
                </div>

                <div className="border-y border-white/5 bg-white/2 px-6 py-5">
                    <p className="mb-4 text-center text-[10px] font-medium uppercase tracking-widest text-neutral-600">Made by</p>
                    <div className="flex justify-center gap-10">
                        {CONTRIBUTORS.map((c) => (
                            <Avatar key={c.github} {...c} />
                        ))}
                    </div>
                </div>

                <div className="px-6 py-3.5">
                    <p className="text-pretty text-center text-[11px] leading-relaxed text-neutral-600">
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
