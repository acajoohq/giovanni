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
pnpm -F desktop run tauri dev
```

## Build

```bash
pnpm --filter desktop build
# or from the repo root:
pnpm build
```

The build runs `pnpm --filter web build` first (via `beforeBuildCommand`) to produce the frontend, then compiles the Tauri binary for the current platform.
