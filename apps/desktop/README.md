# Desktop

Tauri-based desktop wrapper for the Giovanni web app.

## Prerequisites

### Rust

Tauri requires Rust to compile the native binary. Install it via [rustup](https://rustup.rs):

**macOS / Linux**

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

**Windows**

```powershell
winget install Rustlang.Rustup
```

Or download `rustup-init.exe` directly from https://rustup.rs.

After installing, restart your terminal so `cargo` is available on your PATH.

> **Windows only:** Tauri also requires the MSVC C++ build tools. Install the **"Desktop development with C++"** workload from the [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) installer.

### Node.js & pnpm

See the [root README](../../README.md#requirements) for Node and pnpm requirements.

## Development

```bash
pnpm --filter desktop dev
# or from the repo root:
pnpm -F desktop dev
```

### Developer Tools

In dev (`tauri dev`), open Web Inspector via:

- **View → Toggle Developer Tools** (added to Tauri's default menu)
- **⌘⌥I**

Right-click → Inspect Element also works when the web app does not intercept the context menu.

Fallback on macOS: enable **Safari → Settings → Advanced → Show features for web developers**, then **Develop → Giovanni →** pick the webview.

Devtools are dev-only: the menu item and `devtools` Cargo feature are enabled by `pnpm dev` (`tauri dev --features devtools`). Release builds omit both.

## Build

```bash
pnpm --filter desktop build
# or from the repo root:
pnpm build
```

The build runs `pnpm --filter web build` first (via `beforeBuildCommand`) to produce the frontend, then compiles the Tauri binary for the current platform.

## PDF preview in WKWebView

PDF preview uses pdf.js's [legacy build](https://github.com/mozilla/pdf.js/wiki/Frequently-Asked-Questions#which-browsersenvironments-are-supported) so rendering works in Tauri's WKWebView (same WebKit engine as Safari). See [`packages/pdfly-pdf-render/README.md`](../../packages/pdfly-pdf-render/README.md).
