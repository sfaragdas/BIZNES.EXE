# Uruchomienie

Otwórz `index.html`, aby grać offline. W tym trybie działa silnik JavaScript.
Opcjonalnie zbuduj Rust/WASM: `cargo build --release --target wasm32-unknown-unknown`,
uruchom lokalny serwer w tym folderze i otwórz jego adres. Stopka pokaże wybrany silnik.

## Sterowanie

- Powitanie: K/Enter — kontynuuj, N — nowa gra, F — czcionka.
- T — towary, A — akcje, B — banki: zmieniają tabelę na tym samym ekranie.
- K — kupno, S — sprzedaż. W bankach: P — wpłata, O — odbiór.
- W — wyjazd bez opłaty, D — dług pod aktualną tabelą, Q — zapis i powrót do menu.
- Przy długu: P — pożyczasz, O — oddajesz.
- W tabeli wybieraj wyróżnioną literę lub klikaj nazwę. Złoto ma skrót O, zboże Z.
- Wpisaną ilość lub kwotę zatwierdź Enterem; Esc anuluje. Obie opcje są klikalne.
- Po wyniku operacji od razu wybierasz kolejną czynność — bez dodatkowego Entera.
- L — polski/angielski. W wersji EN kieruj się wyróżnionymi literami.

Zapis jest lokalny dla przeglądarki. Q zapisuje automatycznie; ręczny przycisk zapisu został usunięty. Nowa gra zastępuje bieżący zapis. Czcionka standardowa korzysta z
systemowego kroju monospace; DOS PL zawiera polskie litery w stylu VGA.

Na telefonie/iPadzie dotykaj nazw i przycisków — nie musisz wpisywać liter.
Pole ilości lub kwoty ma klawiaturę numeryczną oraz −, + i Maks.
Na wąskim ekranie tabela i pasek przycisków mogą być przewijane poziomo.
