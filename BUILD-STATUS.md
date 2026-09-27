# Build and verification status

## Rust/WASM build

- Toolchain: Rust 1.98.1, host `aarch64-pc-windows-msvc`, target `wasm32-unknown-unknown`.
- Toolchain installation: `work/rust-home` and `work/cargo-home` in the parent workspace. No machine-wide PATH or Rust configuration was changed.
- Build: `cargo build --release --target wasm32-unknown-unknown` — passed.
- Artifact: `target/wasm32-unknown-unknown/release/biznes_exe_core.wasm` — **1,958 bytes**, measured from the generated release artifact. This is well below the 250 KB core limit. Build output is ignored by Git and can be reproduced with the command above.
- Rust exports a dependency-free C ABI for state access, buy/sell, bank/debt, stock trading, travel, price changes, and event rolls. The frontend uses those exports when the module loads successfully.

## Runtime and full-loop checks

- `node --check game.js` and `node --check test-game.cjs` — passed.
- `node test-game.cjs` — passed using the direct `file://` JavaScript fallback.
- `node test-game.cjs --wasm` — passed with the compiled Rust module instantiated in the browser-like harness.
- Previous revision: with the local static server running, `node test-game.cjs --wasm-http` — passed through the frontend's real HTTP fetch path; HTML, JavaScript, and the WASM artifact all returned HTTP 200. WASM was served as `application/wasm`.
- Current loop: welcome/fonts → inline goods trades/errors → bank deposits/withdrawals → debt while keeping the bank or stock table → trades in all ten share positions → 21 journeys/events → PL/EN → autosave/Q → new game → migration/reload of a six-position save and a ten-position save. Both engine paths pass. Result messages never consume the next command.
- The JS and WASM saved states match after the same deterministic sequence of trades, bank/debt operations and 21 trips (RNG compared as unsigned 32-bit). Market formulas, event count and signed RNG hydration now agree. This is a scenario check, not exhaustive parity proof.
- Text checks assert 23 rows × 78 characters. The downloaded DOS font cmap contains all 18 Polish letters. Visual browser rendering, zoom and focus behavior are not verified by this harness; the browser tool blocked access to the local file tab in the prior attempt, and no workaround was used.
- `supporters.json` parses as an empty list; no external runtime packages are used.

## Native Rust unit-test limitation

`cargo test` was attempted but cannot link host tests on this machine because the Windows ARM64 Visual C++ linker `link.exe` is absent. This does not affect the successful WASM release build or the full-loop checks against the compiled WASM module. The Rust unit tests remain in `src/lib.rs` for environments with the host linker installed.

The JavaScript fallback is selected automatically under `file://`, where browsers block fetching local WASM files. Serve this directory over localhost to use the compiled Rust core; see `START.md`.

## Touch-input update

JS and WASM interaction checks passed again after removing manual save and introducing the grouped action bar. Checks now cover welcome spacing, absence of the save button, native input events and Enter submission, and −/+/Max adjustment. Input occupies ten columns in the text harness; CSS layout and the actual iOS keyboard remain unverified on a physical device.
