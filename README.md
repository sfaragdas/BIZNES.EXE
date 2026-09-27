BIZNES.EXE — Tiny economic game in an 80x25 DOS-style terminal. The welcome screen introduces an independent game inspired by Biznesman (1988), by M. Cwynar / Studio SAMBA, and its lightweight retro approach. It clearly states that this version was not made by the original authors. Choose the standard or DOS 8×16 font on the welcome screen. The bundled Modern DOS font is based on IBM VGA and Verite OEM fonts and is CC0; attribution is in NOTICE. Sponsor links rotate in the top line.

No account, cloud, tracking, required Internet, or runtime dependencies.
Start. Play. Quit.

## Start

Open `index.html` in a modern browser for the JS fallback. To use the Rust/WASM core, first build it and serve this directory over localhost:

```sh
cargo build --release --target wasm32-unknown-unknown
python -m http.server 8000
```

Then open `http://localhost:8000`. WASM is loaded locally from `target/`; there are no network calls or runtime dependencies. Browsers block `fetch()` of local WASM under `file://`, so that launch mode automatically uses the complete JS fallback. Saved games use that browser's localStorage.

Run the deterministic full-loop checks with `node test-game.cjs` for the `file://` JS fallback and `node test-game.cjs --wasm` for the compiled Rust/WASM path (the latter requires the build above). To check the HTTP fetch path too, start `python -m http.server 8765` in this folder and run `node test-game.cjs --wasm-http` in another terminal. Node.js is only needed for these optional checks; the game itself needs no runtime installation.

## Play

Keyboard and mouse both work when the game has focus. The main DOS menu is clickable; shortcuts are K buy, S sell, W travel, A shares, D debt, B banks, Q return to welcome, H help, and L language. The game saves automatically as state changes; the welcome menu also offers explicit save, continue, and new game options. Buy/sell and travel prompts stay below the persistent market table; the main options menu hides while an action is underway. Choose goods by clicking or their first letter, then type a quantity and press Enter. Destination, bank, and company choices use letters. Travel costs nothing. The market keeps fixed DOS-style columns, left-aligned labels, right-aligned values, dotted leaders, gray inverse headings, and translated units. Medicines replace weapons and gold replaces narcotics; gold is measured in kg. The 80×25-style viewport contains 23 content rows with 78 columns and one continuous CSS border. The footer status stays inside the frame, and `favicon.svg` uses the DOS-inspired palette.

Trade across Amsterdam, Bangkok, Gdynia, Hong Kong, London, Munich, New York, Rome, and Tokyo. Visit six banks, trade shares in six companies, manage debt and cargo capacity, and survive random trip events.

## Build the Rust/WASM core

The checked-in Rust source is dependency-free and targets `wasm32-unknown-unknown`. Rust 1.98.1 was installed under the workspace `work/` directory for this build; no global Rust settings were changed. From this directory run:

```sh
cargo build --release --target wasm32-unknown-unknown
```

The output is `target/wasm32-unknown-unknown/release/biznes_exe_core.wasm`. When served over localhost, the frontend loads that module and calls Rust for buy/sell, bank/debt, stock trades, market updates, travel, and event selection. `file://` uses the JavaScript fallback because browsers disallow fetching the WASM file there. Build measurement and verification results are recorded in `BUILD-STATUS.md`.

## Attribution and publication

Inspired by the simplicity of Polish DOS economic games from the late 1980s and early 1990s, including Biznesman (1988). This is a new implementation. No original source code or assets are included.

The name and related designations require separate verification before commercial publication. This is not legal advice.

## Comparison and next steps

See [POROWNANIE-I-PLAN.md](POROWNANIE-I-PLAN.md) for the comparison with the supplied DOS screenshots, known differences between the two engines, and the prioritized improvement plan. Current interaction checks do not establish visual equivalence or engine parity.
