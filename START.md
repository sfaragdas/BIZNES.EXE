# Start here

1. For a quick offline start, open `index.html`. This runs with the built-in JavaScript fallback.
2. For the Rust/WASM core, build once with `cargo build --release --target wasm32-unknown-unknown`, then serve this folder (`python -m http.server 8000`) and visit `http://localhost:8000`.
3. Check the footer: it reports `Rust/WASM` when the compiled core loaded, otherwise `JS fallback`.

The welcome screen has a DOS-style asterisk panel, larger instructions, and clickable Save, Continue, New game, and font choices (S/K/N/F on the keyboard). The font switch selects a locally bundled DOS 8×16 pixel font. The game saves automatically as state changes; Q returns to the welcome menu, where a manual save option remains available. Keyboard input works while the game has focus; main choices and table rows are also clickable. Buy/sell and travel stay under the market table; the main choices disappear while an action is underway, and quantities are typed there. The game has no account, cloud, tracking, required Internet, or runtime dependencies. Saved games stay in browser localStorage.
