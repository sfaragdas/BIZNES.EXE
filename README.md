BIZNES.EXE — Tiny economic game in an 80x25 DOS-style terminal. The welcome screen introduces an independent game inspired by Biznesman (1988), by M. Cwynar / Studio SAMBA, and its lightweight retro approach. It identifies this version as an independent adaptation. Choose Standard, DOS or Matrix style on the welcome screen. DOS retains Polish glyphs; Matrix uses a green palette and the same bundled font without additional downloads. The bundled PxPlus IBM VGA8 font by VileR includes Polish glyphs and is licensed under CC BY-SA 4.0; attribution is in NOTICE. The standard font uses the original system monospace stack (Consolas on Windows). Sponsor links appear in the welcome panel.

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

Keyboard and mouse both work. There are two screens: welcome and one common table view. Switch the table with T (goods), A (shares), or B (banks). K buys and S sells goods/shares; P deposits and O withdraws in the bank table. W travels, D opens debt operations below the current table, and Q saves and returns to welcome. L changes the language. English labels show the actual shortcut, adding a letter prefix where needed. Use the highlighted letter in each row (some are inside the name to avoid collisions) or click it.

All operations run below the table. Type a quantity/amount, confirm with Enter or the clickable confirmation, and cancel with Esc. Result messages do not need acknowledgment: the next key selects the next operation. Travel and random events also stay inline; travel costs zero. Action choices are separated by dashed lines and hide during an operation. The welcome screen has Continue and New game on the left, with the font selection on the right. Saving is automatic; there is no redundant manual-save action.

Trade across nine cities, use six separate bank accounts, and trade ten share positions. The first six historical positions retain their saved indexes; PKO BP, ORLEN, HiPromine and Excellence occupy the new four. Share prices are fictional game values. Sources and selection rationale are in [SOURCES.md](SOURCES.md). Older six-position saves are extended without losing holdings.

The game autosaves to browser localStorage. The common table includes quantity, value and total; financial summaries stay in place for every table. Medicines replace weapons and gold replaces narcotics. The 80×25-style viewport has 23 content rows of 78 columns and one continuous CSS border. The small engine/autosave status appears only on the welcome screen. The former 100-unit cargo limit has been removed; purchases depend on cash, with a technical storage bound of 65,535 units per item.

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

See [POROWNANIE-I-PLAN.md](POROWNANIE-I-PLAN.md) for the comparison with the supplied DOS screenshots, remaining limitations, and the prioritized improvement plan. Interaction checks do not establish pixel-level visual equivalence. A deterministic sequence also compares the JS and WASM state after 21 trips; this is not exhaustive engine validation.

## Touch controls

Desktop keeps the DOS table. Phones up to 900px and touch tablets up to 1200px use a dedicated card list, three market tabs and a bottom operation panel. Only the list scrolls; action buttons stay available. Choose buy/sell or deposit/withdraw in the bottom dock first, then select an item row and enter an amount. Touch targets stay at least 44px tall. Header, market totals and dock stay pinned; only the middle content scrolls, including on welcome. The two layouts share the same state and autosave.

Left/right-handed mode is saved locally and mirrors the primary action rows, confirmation and quantity controls. Welcome places New game left and Continue right by default, font centrally above them and the hand-mode switch above that. The compact header rotates one sponsor link every seven seconds. Both sponsors appear in the welcome description, LCSE.pl first. The city is yellow below the standard-font brand, above cash and right-aligned debt. Goods, shares and bank tabs contain their respective totals without repeated labels.

Quantity and money entry use a native numeric-keyboard input with minus, plus and Max buttons. Enter or Z (Polish) / C (English) confirms; Esc cancels. Travel uses aligned city choices and excludes the current city. Sponsor rotation does not replace a focused amount input. Desktop font width is measured to fit 78 columns; the welcome background spans full rows.

Node interaction checks cover both JS and WASM, including touch transactions and confirmation shortcuts. Actual Safari/iPad rendering and the on-screen keyboard still require device validation.

## Public version

The game is published at https://sfaragdas.github.io/BIZNES.EXE/ using GitHub Pages.
The `Publish game` workflow builds and checks the WASM core and publishes only the
runtime files and licenses after pushes to main. The public address has its own
browser-local save, separate from saves created by opening index.html directly.
The first HTTPS visit downloads an offline app shell (HTML, scripts, stylesheet, DOS font, icons and WASM). Wait for “Offline ready” before disconnecting. Service-worker caches are versioned by deployment; navigation checks the network first and falls back to the cached shell. Browser storage can still be cleared or evicted.

The mobile welcome screen offers Install opposite the font control. Supporting browsers show the native install prompt; iOS shows Share → Add to Home Screen instructions. Saving stays browser-local; Safari and an installed app may have separate storage. Physical iOS installation and airplane-mode reopening still need device validation.

Travel has a 35% event chance, shared by JS and WASM. Sixteen event types cover gifts, cash finds, rewards, refunds, fines, customs, taxes, damage, theft, delay, sale prices and tea/tobacco pests. Inapplicable stock losses are replaced with a positive event; money losses never exceed held cash. Events open a dismissible popup with the impact and remain in the last-journey report. Ordinary trips do not open popups.

The mobile container follows both visual viewport height and offset during resize and scroll, keeping its bottom controls within the visible area above the on-screen keyboard. Physical Safari verification is still required; implementation reference: https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport

Mobile refinements: patron wording, compact three-column item details (price / owned / value), 14px city, and installation guidance pinned above the bottom controls. Ordinary result notices are yellow and expire after seven seconds. Travel selection permits switching market tabs, cancelling the selection. A small DOM reconciler updates mobile nodes in place to retain the amount input and focus; no animation library is used. Physical Safari keyboard transitions remain a device-validation item.

Style settings migrate from the old font preference and persist locally. The welcome footer shows ALFA · 2026.09.28. Mobile prices/holdings/values use one compact header instead of repeated labels. Patron and city text is 15px; the city sits in a separate strip between the brand and cash/debt. Welcome controls use equal-width columns. Keyboard handling now offsets the bottom dock rather than translating/resizing the whole mobile frame; this still requires physical iOS confirmation.
