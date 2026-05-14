import type { GhostscriptCompressOptions } from "./ghostscript-options.js";
import type { OptimizeOptions } from "./qpdf-options.js";

export type CompressOptions = ({ engine?: "qpdf" } & OptimizeOptions) | ({ engine: "ghostscript" } & GhostscriptCompressOptions);
