# BIZNES.EXE 2.0 — strategia

## Cel i granice

Lekka, darmowa gra offline o kupowaniu i sprzedawaniu towarów. Jeden silnik JavaScript, dane oddzielone od reguł, PL/EN i PWA. Bez kont, serwera, telemetrii, presji czasu, serii dni, powiadomień push i rankingów z obcymi. Classic pozostaje osobno.

## Tryb dziecko

Runda trwa **14 dni**. Gracz zaczyna z **1000 monet**, 3 towarami i 2 miastami. Cel wynosi **4000 monet majątku**. Majątek = gotówka + bieżąca wartość posiadanych towarów. Dłuższa runda daje więcej podróży i okazji do handlu niż poprzednie 7 dni; cel na poziomie 400% kapitału startowego łączy wygraną z odkryciem całej zawartości. To propozycja do kalibracji w testach gry, nie gwarancja, że każdy gracz osiągnie próg.

| Majątek | Nowe towary | Nowe miasta |
| --- | --- | --- |
| 1000 (start) | jabłka, chleb, książki | Kraków, Toruń |
| 1500 (150%) | kredki | Gdańsk, Zakopane |
| 2000 (200%) | piłki, rowery | Wrocław |
| 3000 (300%) | latawce, puzzle | Poznań, Warszawa |
| 4000 (400%) | hulajnogi | Malbork |

Odblokowania są trwałe w obrębie zapisu rundy. Ceny zmieniają się przy podróży; strzałki porównują bieżącą cenę z poprzednim dniem. Handel nie tworzy długu. Fakty o miastach są krótkie i dwujęzyczne.

## Interfejs i dostępność

Morska bryza jest domyślna. Retro DOS jest opcją w ustawieniach, a wysoki kontrast działa osobno. Wszystkie przyciski i pola mają co najmniej 44 px wysokości. Link do prywatności znajduje się w menu/startowym ekranie. Partnerzy są tekstem bez linków i bez zewnętrznych skryptów. Zmiana języka i motywu nie resetuje rundy. Animacji przyciągających uwagę nie ma; pasek partnerów zmienia podpis co 15 s, a przy `prefers-reduced-motion` pozostaje stały.

Sprawdzenie kontrastu palety: biały na #0E6E6E 6,04:1, biały na #C2501F 4,71:1, tekst #1F2A30 na #FFF9EE 13,99:1, turkus na #E7F4F2 5,36:1. Zielona strzałka #2E7D4F ma białe tło, aby osiągnąć wymagany kontrast. Ręczne testy z czytnikiem ekranu i na urządzeniach są nadal potrzebne.

## Prywatność i technika

Zapis pod `bx2-save`, rekord pod `bx2-record`; ustawienia pod prefiksem `bx2-`. Brak identyfikatorów, kont i transmisji danych gracza. `data/game-data.js` zawiera tryby, towary, miasta, wydarzenia i partnerów. `game.js` obsługuje reguły i interfejs. `sw.js` utrzymuje osobny cache 2.0.
