# Plan BIZNES.EXE 2.0

Stan: 2026-10-20. Podgląd eksperymentalny, wymagający dalszych testów balansu.

## Etap 1.1 — tryb dziecko

Zaimplementowane: Morska bryza, Retro DOS, wysoki kontrast, menu, dwujęzyczne zasady, karty handlu, postęp, ceny, fakty o miastach i partnerzy bez linków. Progresja 3 → 9 towarów oraz 2 → 8 miast. Runda 14 dni, start 1000 monet, cel 4000 monet majątku.

## Etap 2 — prototyp pozostałych trybów

- Nastolatek: 18 dni, cel 6000, pożyczka do 2000 i 2% odsetek.
- Dorosły: 21 dni, cel 9000, pożyczka do 3000, 2% odsetek i 15% podatku od dodatniego zysku przy sprzedaży.
- Zaawansowany: 24 dni, cel 14000, pożyczka do 4000, 3% odsetek, 20% podatku i fikcyjne akcje.
- Wspólne zasady: majątek netto pomniejszony o dług, koszt zakupu przy obliczeniu zysku, rekordy oddzielone według trybów, migracja zapisu dziecka.
- Testy: zakupy i sprzedaż, limity pożyczek, spłaty i odsetki, podatki od zysku, akcje, zakończenie rund, zapis i izolacja trybów.

## Offline i publikacja

Osobny test sprawdza oczekiwanie na aktywację właściwego Service Worker, błędy instalacji i komunikaty gotowości. Workflow gałęzi `v2` uruchamia testy bez publikowania pod adresem głównym. Workflow `main` sprawdza podgląd i publikuje go wyłącznie w `/v2/`.

## Etap 3 — do wykonania

- Rozegrać pełne rundy w każdym trybie z różnymi strategiami; ocenić cele i parametry.
- Sprawdzić czytelność i tempo odblokowań z dziećmi i opiekunami.
- Ręcznie sprawdzić telefony, tablety, desktop, klawiaturę i czytniki ekranu.
- Zainstalować PWA na fizycznych urządzeniach, odłączyć internet i sprawdzić aktualizację oraz zapis.
- Sprawdzić palety na rzeczywistych ekranach i przy powiększeniu.
- Przed dystrybucją sklepową osobno ocenić wymagania platform, prywatności i partnerstw.
