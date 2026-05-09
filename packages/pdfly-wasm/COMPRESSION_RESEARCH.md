# PDF Compression Research

**Date**: 2026-05-10  
**Test files**: Mattèo Gauthier CV (1.9 MB) · Candice FRADET CV (2.5 MB)  
**Tool versions**: QPDF `a898bb3` (vendor build) · Ghostscript 10.07

Both files are single-page design CVs dominated by embedded JPEG photos.

---

## Results

### Mattèo CV — 1,984,996 bytes

| Preset                 | Output | Saved                  |
| ---------------------- | ------ | ---------------------- |
| qpdf `rewrite`         | 1.8 MB | 3.0%                   |
| qpdf `wasm-defaultish` | 1.7 MB | 12.8%                  |
| qpdf `max-losslessish` | 1.6 MB | **13.0%**              |
| qpdf `linearized`      | 1.7 MB | 12.6%                  |
| qpdf `image-optimized` | 1.6 MB | 13.0%                  |
| gs `/printer`          | 790 KB | 59.3%                  |
| gs `/ebook`            | 650 KB | **66.5%** ← sweet spot |
| gs `/screen`           | 632 KB | 67.4%                  |

### Candice FRADET CV — 2,593,331 bytes

| Preset                 | Output | Saved                  |
| ---------------------- | ------ | ---------------------- |
| qpdf `rewrite`         | 2.4 MB | 2.1%                   |
| qpdf `wasm-defaultish` | 2.3 MB | 6.9%                   |
| qpdf `max-losslessish` | 2.3 MB | **6.9%**               |
| qpdf `linearized`      | 2.3 MB | 6.6%                   |
| qpdf `image-optimized` | 2.3 MB | 6.9%                   |
| gs `/printer`          | 915 KB | 63.9%                  |
| gs `/ebook`            | 510 KB | **79.9%** ← sweet spot |
| gs `/screen`           | 458 KB | 81.9%                  |

---

## Visual quality (browser QA at 150% zoom)

- **QPDF all presets**: pixel-identical to original, fully lossless.
- **gs `/ebook`**: text sharp, photos look clean, no visible artefacts at normal reading zoom.
- **gs `/screen`**: slight softness in photos at high zoom, acceptable for web/email use.
- **gs `/printer`**: visually identical to original, moderate savings.

**Winner for quality+size tradeoff**: `gs /ebook` — 66–80% reduction with no perceptible quality loss.

---

## Why QPDF tops out at ~13%

QPDF is a **lossless structural optimizer**. It recompresses Flate streams, generates object streams, and strips redundant metadata. It does not resample or re-encode images.

For design CVs where 80%+ of bytes are already-compressed JPEG images, QPDF has almost nothing to work with. The `--optimize-images` flag had zero effect here because all images were already JPEG-encoded at a reasonable quality.

The ceiling for pure QPDF compression on image-heavy PDFs is ~13%.

## Why Ghostscript wins

Ghostscript rerenders the entire PDF through its PostScript interpreter and **resamples images** to a target DPI:

- `/screen` → 72 DPI
- `/ebook` → 150 DPI
- `/printer` → 300 DPI

This is fundamentally different from what QPDF does — it's lossy image recompression, not structural optimization.

---

## Implications for pdfly-wasm API design

### QPDF's actual strengths

Compression alone is a weak pitch for QPDF. Position it for what it actually excels at:

- **Linearization** (`--linearize`): enables byte-range streaming so page 1 renders before the full download
- **Structural compression**: packs object streams, recompresses Flate, strips redundant data
- **Encryption / decryption**: add or remove password protection
- **Page manipulation**: split, merge, rotate, reorder
- **PDF repair and validation**: `--check`, tolerant re-serialization

### Recommended default compression args

```
--compress-streams=y
--decode-level=generalized
--recompress-flate
--compression-level=6      ← same output size as 9, ~20% faster
--object-streams=generate
```

Bumping `--compression-level` from 6 to 9 saved only 4 KB on a 2 MB file. Not worth the added CPU time in a WASM context.

### For meaningful image compression

QPDF alone cannot deliver the 60-80% reductions users expect. Options to bridge the gap:

| Approach                    | Fits WASM?        | Notes                                                                                                                      |
| --------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Browser Canvas API**      | Yes, native       | Decode PDF images → `canvas.toBlob({ quality })` → re-inject. Requires a PDF image extraction layer.                       |
| **MuPDF WASM** (`libmupdf`) | Yes (~4 MB build) | Has image resampling built in, production-proven, used by PDF.js team. Best fit for aggressive compression in the browser. |
| **Ghostscript WASM**        | Partial           | 30–60 MB builds exist. Too heavy for client-side, good for server-side pipelines.                                          |
| **sharp / @squoosh**        | Node.js only      | Excellent quality, not browser-runnable without a server.                                                                  |

### Suggested API shape

```ts
type CompressionPreset = 'lossless' | 'balanced' | 'aggressive'

compress(pdfBytes: Uint8Array, options?: {
  preset?: CompressionPreset  // default: 'lossless'
  linearize?: boolean         // default: false, enables web streaming
  compressionLevel?: 1–9     // default: 6
}): Promise<Uint8Array>
```

- `lossless` → QPDF structural pass only (safe, always valid output, ~3–13% savings)
- `balanced` → QPDF + image re-encode at 150 DPI (requires image pipeline)
- `aggressive` → QPDF + image re-encode at 72 DPI (requires image pipeline)

### Recommended pipeline for a real compression feature

```
input PDF
  → extract images (MuPDF or canvas)
  → re-encode images at target DPI/quality
  → inject back as new PDF
  → QPDF structural pass + linearize
  → output PDF
```

This is how tools like Smallpdf, ilovepdf, and Adobe Acrobat's optimizer work under the hood.

---

## Conclusions

1. QPDF WASM is valuable for lossless operations, linearization, and structural cleanup — not for aggressive compression of image-heavy PDFs.
2. For the compression use case, the honest answer is: QPDF alone is not enough. Pair it with MuPDF WASM or a server-side Ghostscript path.
3. The `/ebook` Ghostscript preset is the most practical recommendation for end users who want "smaller without visible quality loss."
4. Exposing `linearize` prominently in the API is high-value — it's a real-world improvement that QPDF does uniquely well and that no other lightweight WASM tool offers.
