# BIZNES.EXE — porównanie i dalsze poprawki

Aktualizacja: 27.09.2026, po ujednoliceniu ekranów. Podstawa: kod oraz zrzuty Biznesmana dostarczone przez użytkownika. Zdjęcia nie ujawniają wszystkich zasad ekonomii ani algorytmów oryginału.

## Aktualny kierunek

Gra ma dwa ekrany: powitanie oraz wspólny ekran tabeli. Towary, akcje i banki zmieniają zawartość tabeli; handel, wpłaty, wypłaty, dług i wyjazd odbywają się pod nią. Wyniki i zdarzenia nie wymagają dodatkowego Entera. To świadome uproszczenie względem DOS, zgodne z ostatnią decyzją użytkownika.

## Porównanie

| Obszar | Oryginał na zrzutach | Obecna wersja |
|---|---|---|
| Powitanie | Szare pole z gwiazdkami, autorstwo, dłuższa instrukcja | Własny manifest, informacja o inspiracji, sponsorzy i instrukcja. Przyciski oddzielone kreskami |
| Czcionka | Bitmapowy krój DOS | Przywrócony standardowy monospace; DOS PL to PxPlus IBM VGA8 z polskimi literami. Nie potwierdzono identyczności z czcionką oryginału |
| Ramka | Stała siatka terminala | Niezależne obramowanie CSS; wewnątrz 23 wiersze po 78 znaków. Stopka w prawym dolnym rogu |
| Towary | Dziesięć pozycji, w tym broń i narkotyki | Dziesięć pozycji; leki i złoto według wcześniejszej decyzji. Tytoń nadal obecny |
| Akcje | Sześć historycznych pozycji na osobnym ekranie | Wspólna tabela z kursem, ilością, wartością i sumą. Sześć dawnych pozycji + PKO BP, ORLEN, HiPromine, Excellence; kursy fikcyjne |
| Banki | Sześć kont i osobny ekran | Sześć kont we wspólnej tabeli; cztery puste wiersze zachowują położenie finansów. Wpłata i odbiór pod tabelą |
| Dług | Pożyczasz, Oddajesz, czy Wracasz? | Pożyczasz/Oddajesz/Esc pod dowolną tabelą; limit pożyczki 5000 na operację |
| Handel | Wybór literą, ilość pod tabelą, Enter po komunikacie | Litery lub kliknięcie, ilość i limit pod tabelą, Esc; wynik nie przechwytuje następnego działania |
| Podróż | Dziewięć miast w trzech kolumnach, bez opłaty | Dziewięć miast w dwóch wierszach pod bieżącą tabelą, koszt zero |
| Zdarzenia | M.in. spadek 100000 i utrata żywności | Własne mniejsze zdarzenia pod tabelą. Inna skala nagród i ryzyka |
| Gospodarka | Ceny zwykle w tysiącach, zmienne wysokie odsetki | Ceny początkowe 9–350, dług 25000, gotówka 1000, odsetki 1% na podróż |
| Ładownia | Limit niewidoczny na otrzymanych ekranach | Limit 100 jednostek jest własną zasadą tej wersji |
| Zapis | Niepotwierdzony zrzutami | Autosave, Q do powitania, kontynuacja. Migracja sześciu akcji do dziesięciu zachowuje portfel |

## Sprawdzone w tej zmianie

- JavaScript i skompilowany Rust/WASM: handel wszystkimi dziesięcioma akcjami, wpłaty, wypłaty, pożyczka, spłata, podróże i zdarzenia, PL/EN, anulowanie i zapis.
- Wynik operacji nie zużywa następnego klawisza. Menu wraca od razu po wyniku.
- Odczyt starego portfela sześciu akcji i ponowny odczyt nowego portfela dziesięciu.
- Deterministyczna sekwencja z 21 podróżami daje takie same salda, portfel, ceny i stan generatora w JS/WASM. Ujednolicono wzór podróży, liczbę zdarzeń i przekazywanie ziarna z ustawionym najwyższym bitem.
- Wszystkie 18 polskich liter występuje w tablicy cmap czcionki DOS PL.
- Testy treści sprawdzają 23 × 78 znaków. To nie jest test renderowania pikseli.

## Pozostały plan

| Priorytet | Praca | Kryterium ukończenia |
|---|---|---|
| P1 | Wizualny przegląd obu czcionek, PL/EN, powiększenia i rozmiarów okna | Brak obcięć, czytelna instrukcja, ciągła ramka i wyrównane kolumny |
| P1 | Odporność zapisu | Obsługa braku miejsca/uprawnień localStorage, walidacja uszkodzonych pól, kopia poprzedniej gry przed Nową grą |
| P1 | Dalsza walidacja silników | Wiele ziaren i wartości granicznych; przepełnienia finansów i ilości, także przy bezpośrednim wywołaniu ABI |
| P2 | Balans rodzinnej gry | Uzgodnione ceny, ryzyko, odsetki, ładownia i limity kredytu; rozważyć kakao zamiast tytoniu |
| P2 | Koniec rozgrywki | Jasna wygrana/bankructwo i podsumowanie wyniku w obecnym układzie dwóch ekranów |
| P2 | Dostępność | Sprawdzenie Tab/fokusu i telefonu na urządzeniu; pole numeryczne i −/+/Maks już wdrożone |
| P3 | Paczka wydania | Komplet plików i licencji, samouczek, sprawdzenie po rozpakowaniu bez internetu |

W poprzedniej próbie narzędzie przeglądarki zablokowało dostęp do lokalnej karty file://. Nie obchodzono tego ograniczenia. Świeży przegląd wizualny nadal wymaga sprawdzenia w działającej przeglądarce; testy Node nie są jego zamiennikiem. Natywne testy Rust wymagają nieobecnego wcześniej linkera Windows ARM64; testy przebiegu używają faktycznie skompilowanego modułu WASM.

### Najnowsze dopracowanie interfejsu

Usunięto ręczny zapis, dodano puste wiersze przed sponsorami i instrukcją kliknięcia. Powitanie ma Kontynuuj/Nowa gra po lewej i czcionkę po prawej. Gra ma jeden pasek z trzema grupami działań. Przy długu tekst przycisków jest szary, żółte pozostają skróty. Wprowadzono natywne pole ilości/kwoty, −/+/Maks i większe cele dotykowe. Przewijanie na małym ekranie zachowuje czytelność tabeli. Testy interakcji nie zastępują sprawdzenia Safari na fizycznym iPadzie.
