# Build and verification status

## Rust/WASM build

- Toolchain: Rust 1.98.1, host `aarch64-pc-windows-msvc`, target `wasm32-unknown-unknown`.
- Toolchain installation: `work/rust-home` and `work/cargo-home` in the parent workspace. No machine-wide PATH or Rust configuration was changed.
- Build: `cargo build --release --target wasm32-unknown-unknown` — passed.
- Artifact: `target/wasm32-unknown-unknown/release/biznes_exe_core.wasm` — **1,945 bytes** (1.90 KiB), measured from the generated release artifact. This is well below the 250 KB core limit. Build output is ignored by Git and can be reproduced with the command above.
- Rust exports a dependency-free C ABI for state access, buy/sell, bank/debt, stock trading, travel, price changes, and event rolls. The frontend uses those exports when the module loads successfully.

## Runtime and full-loop checks

- `node --check game.js` and `node --check test-game.cjs` — passed.
- `node test-game.cjs` — passed using the direct `file://` JavaScript fallback.
- `node test-game.cjs --wasm` — passed with the compiled Rust module instantiated in the browser-like harness.
- With the local static server running, `node test-game.cjs --wasm-http` — passed through the frontend's real HTTP fetch path; HTML, JavaScript, and the WASM artifact all returned HTTP 200. WASM was served as `application/wasm`.
- Each loop exercises: welcome → clickable or keyboard-driven buy/sell with in-screen quantity entry → bank selection and deposit/withdrawal → debt repayment/borrowing → city travel → six-company stock trade → localization → new game and quit. The harness checks the 23 content rows each contain 78 visible characters; a continuous CSS border provides the surrounding frame. This does not verify pixel layout or equivalence between the two engines. See POROWNANIE-I-PLAN.md for known differences.
- `supporters.json` parses as an empty list; no external runtime packages are used.

## Native Rust unit-test limitation

`cargo test` was attempted but cannot link host tests on this machine because the Windows ARM64 Visual C++ linker `link.exe` is absent. This does not affect the successful WASM release build or the full-loop checks against the compiled WASM module. The Rust unit tests remain in `src/lib.rs` for environments with the host linker installed.

The JavaScript fallback is selected automatically under `file://`, where browsers block fetching local WASM files. Serve this directory over localhost to use the compiled Rust core; see `START.md`.
