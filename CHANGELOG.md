# Historia wydań

## 2026.10.26 — BIZNES.EXE BETA

- Oznaczenie wydania: BETA · 2026.10.26.
- Poziomy wybierane przy nowej grze (1/2/3 lub dotyk): Handlarz (cel 3000 $ w 14 dni, 4 towary, 4 miasta, dług 1000 $, odsetki do 3%), Kupiec (8000 $ w 21 dni, 6 towarów, 6 miast, banki, dług 5000 $, do 10%), Magnat (50 000 $ w 40 dni, wszystkie towary, miasta, akcje i banki, dług 25 000 $, do 30%). Cel to majątek netto: gotówka + banki + towary + akcje − dług.
- Runda kończy się po osiągnięciu celu albo po ostatnim dniu. Bankructwo nadal kończy grę bez wyniku. Spłata długu nie kończy już gry.
- Wynik: (majątek netto na końcu − na starcie) / liczba rozegranych dni, w $ na dzień. Przy remisie wygrywa wcześniejsza spłata długu. Lokalna tabela top 5 dla każdego poziomu (`bx-records`, kopia `bx-records-backup`) na ekranie końca i w menu (Wyniki).
- Przełącznik wieku <18 / 18+ w menu (domyślnie <18, zapis `bx-age`). Poniżej 18 lat nazwy patronów są zwykłym tekstem; 18+ włącza linki.
- 18+: po rundzie na poziomie Kupiec lub Magnat można grać dalej bez końca; wynik zostaje zamrożony.
- Zapisy sprzed poziomów wczytują się jako gra swobodna (limity Magnata, bez celu, bez wpisu do wyników). Zapis z dawną „wygraną” po spłacie długu wraca do gry.

## 2026.10.25 — BIZNES.EXE BETA

- Oznaczenie wydania: BETA · 2026.10.25.
- Koniec rundy: spłata całego długu to wygrana (dzień i majątek netto); majątek netto poniżej −250 000 $ po podróży albo granica liczb to bankructwo. Ekran końca oferuje nową grę.
- Gra działa przy zablokowanej lub pełnej pamięci przeglądarki (zapis w pamięci, komunikat „Nie zapisano”). Uszkodzony zapis trafia do kopii `bx-save-backup`.
- Treści przyjazne dzieciom: Kakao zamiast tytoniu, konkurs kupców zamiast loterii, fikcyjne spółki zamiast prawdziwych marek. Stare zapisy zachowują ilości.
- Dostępność: rotacja patronów bez przerysowania ekranu i utraty fokusu, komunikaty w jednym regionie aria-live, atrybut lang zgodny z językiem, większe czcionki i przyciski na telefonie.
- Strona prywatności (PL/EN), ikona maskable, kategorie i zrzuty w manifeście.
- Service worker podaje kopię offline tylko bez sieci; błędne adresy zwracają 404. Dawny podgląd /v2/ przekierowuje do gry i usuwa swój service worker.

## 2026.10.20 — BIZNES.EXE BETA

- Oznaczenie wydania: BETA · 2026.10.20.
- Zmienny wzrost długu: 1–30% za podróż; początkowo 5–10%. Zmiana stawki najwyżej o 3 punkty procentowe. Widoczna stawka obowiązuje przy następnym wyjeździe.
- Limit jednej pożyczki: 2000 $.
- Ceny odświeżane przy podróży: 60% poprzedniej ceny i 40% nowej wyceny. Wycena uwzględnia trend dnia gry, losowość oraz miasto dla towarów.
- Kursy akcji przechowywane w zapisie zamiast wyliczania ich wyłącznie z dnia gry.
- Nowa gra: 1000 $ gotówki i 25 000 $ długu.
- Zachowanie istniejących sald; uzupełnienie wcześniejszych zapisów o stawkę długu i kursy akcji.
- Testy gospodarki: limity pożyczek, odsetki, zmienne stawki i ceny przez 1000 podróży.

## 2026.10.20 — BIZNES.EXE Classic FINAL

- Oznaczenie wydania: Classic FINAL · 2026.10.20.
- Dług początkowy nowej gry: 25 000 $ zamiast 15 000 $.
- Limit pożyczki: 2000 $ zamiast 1000 $, nadal raz na pobyt w mieście.
- Dotychczasowe zasady cen i zmiennego oprocentowania pozostają zachowane.
- Istniejąca rozgrywka zachowuje bieżące saldo.

## Wcześniejsze zmiany

Historia sprzed tego zestawienia jest dostępna w [commitach repozytorium](https://github.com/sfaragdas/BIZNES.EXE/commits/main/).
