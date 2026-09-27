# BIZNES.EXE: porównanie z Biznesmanem i plan poprawek

Stan przeglądu: 27.09.2026. Podstawa: kod JS i Rust oraz dostarczone przez użytkownika zrzuty oryginalnego programu, obejmujące powitanie, rynek, kupno/sprzedaż, wyjazd, akcje, dług, banki i zdarzenia. Zrzuty dokumentują wygląd oraz konkretne stany gry; nie ujawniają pełnych algorytmów, prawdopodobieństw ani wszystkich reguł oryginału.

## Ocena

Obecna wersja oddaje podstawowy układ rynku i sposób wybierania działań. To działający prototyp inspirowany DOS. Zgodność ekonomii z oryginałem jest znacznie mniejsza niż podobieństwo wizualne. Testy interakcji nie dowodzą identycznej rozgrywki ani poprawności układu w rzeczywistej przeglądarce.

## Co poprawiono w tej zmianie

- Ramka jest jednym obramowaniem CSS. Nie zawiera znaków pionowych skalowanych razem z instrukcją i stopką. Powiększenie tekstu nie może przesunąć jej boków.
- Wnętrze ma 23 stałe wiersze po 78 kolumn, z miejscem na obramowanie odpowiadającym ekranowi 80×25. Dobór rozmiaru uwzględnia różne szerokości komórek obu czcionek.
- Szary panel ma gwiazdki, czarny tytuł oraz wiersz „Sponsorzy projektu: MojeDostawy.pl oraz LCSE.pl.”.
- Wybór nazywa się „Czcionka”. Litery skrótów w instrukcji są żółte. Wyśrodkowanie przycisków liczy widoczny tekst zamiast długości znaczników HTML.
- Stopka ma własny wiersz, mały tekst i wyrównanie do prawej; nie przesuwa obramowania.

## Porównanie obszarów

| Obszar | Co widać w oryginale | Obecny stan i różnice |
|---|---|---|
| Powitanie | Szare pole z gwiazdkami, tytułem i autorstwem, pod nim dłuższy opis gry | Zachowany kierunek wizualny; własny manifest, sponsorzy, skrócona instrukcja i jasna informacja o inspiracji |
| Czcionka | Bitmapowe znaki DOS | Modern DOS 8×16 przybliża wygląd, ale nie jest potwierdzoną czcionką tej kopii gry. Nie zawiera m.in. ą, ć, ę, ł, ń, ś, ź, ż. Uzupełnia je czcionka zastępcza o dopasowanej szerokości komórki; wygląd liter nie jest jednolity |
| Towary | Kawa, herbata, tytoń, zboże, ropa, broń, narkotyki, wideo, drukarki, samochody | Zachowano kolejność podstawowych pozycji; zgodnie z decyzją użytkownika leki i złoto zastępują broń i narkotyki |
| Jednostki | Tony, sztuki i kg przy narkotykach; stare komunikaty czasem używają „szt.” niezależnie od towaru | Tony dla pierwszych pięciu towarów, sztuki dla wyrobów, kg dla złota; celowo spójne jednostki w komunikatach |
| Rynek | Szary nagłówek, czarne etykiety, kropki, żółte liczby i inicjały, szare dolary | Podstawy odwzorowane. Kolumna ilości jest szersza niż na oryginalnych ekranach. „Razem” przesunięto zgodnie z późniejszą preferencją użytkownika |
| Stan finansów | Dług, konto, banki, akcje po lewej; odsetki, szansa spłaty i miasto po prawej | Podział zachowany. Obecna „szansa spłaty” to stosunek gotówki i banków do długu; wzór oryginału nie jest ustalony |
| Kupno/sprzedaż | Pytanie i ilość bez opuszczania tabeli, komunikat błędu zatwierdzany Enterem | Podobny przebieg, obsługa myszy i Esc. Czasem brak pieniędzy zgłaszany jest już przy wyborze towaru; oryginał pokazuje też możliwość kupna 0 i dopiero potem błąd |
| Wyjazd | Lista dziewięciu miast w trzech kolumnach pod rynkiem | Jest na ekranie rynku i kosztuje 0. Obecnie lista zajmuje dwa wiersze; pozostały puste wiersze po schowanych opcjach |
| Banki | Sześć banków i salda, na dole Wpłata/Odbiór/Powrót | Są sześć kont i operacje, lecz obecna kolejność ekranów i opisy wymagają dopasowania |
| Akcje | Szary nagłówek, kurs, ilość, wartość, suma, wybór zakupu/sprzedaży/powrotu | Handel działa; brakuje wiernej tabeli wartości i sum. Cena zależy od dnia prostym wzorem |
| Dług | „Pożyczasz, Oddajesz, czy Wracasz?”; na zrzutach wysokie salda | Osobny ekran, ale odmienne nazwy i limit pożyczki 5000. Zrzuty nie wystarczają do ustalenia pełnych limitów pierwowzoru |
| Gospodarka | Ceny zwykle w tysiącach; pokazane odsetki m.in. 2%, 17%, 23%, 28% | Startowe ceny 9–350 i stały wzrost długu 1% na podróż. Start 1000 na koncie i 25000 długu odpowiada zrzutom |
| Ładownia | Na dostarczonych głównych ekranach nie widać limitu | Wprowadzono limit 100 jednostek; to reguła tej wersji, nie potwierdzony element DOS |
| Zdarzenia | M.in. spadek 100000 oraz utrata wszystkich towarów żywnościowych; tabela pozostaje widoczna | Własne zdarzenia przeważnie 50–199, strata pojedynczej sztuki; osobny ekran. Skala ryzyka i nagród wyraźnie inna |
| Zapis i sterowanie | Klawiatura; mechanizmu zapisu nie potwierdzono zrzutami | Dodano kliknięcia, autosave, ręczny zapis i kontynuację. Q prowadzi do powitania |

## Usterki i braki znalezione w kodzie

1. **JS i WASM nie liczą tej samej podróży.** Różne wzory cen, zakresy losowania i zaokrąglanie odsetek. Rust losuje 11 zdarzeń, JS ma 12. Przekazanie ujemnej reprezentacji ziarna `rng | 0` do `core_set` jest odrzucane. Wynik może zależeć od sposobu uruchomienia.
2. **Skróty nie zawsze odpowiadają podświetleniu.** Zboże i Złoto mają wspólne Z; obecne „cykliczne” wybieranie nie rozwiązuje wygodnie wyboru w jednym kroku. W akcjach podświetla się początek całego opisu, choć skrót oznacza nazwę spółki. Tłumaczenia zmieniają widoczne inicjały, a część klawiszy pozostaje polska.
3. **Pozostały nieużywane ekrany i mieszane tłumaczenia.** Dawne osobne widoki kupna i sprzedaży wciąż są w kodzie. Część komunikatów Esc ma zamienione argumenty językowe. Detale zdarzeń używają polskich nazw także w trybie EN.
4. **Zapis wymaga odporności.** Brak obsługi niedostępnego/zapełnionego localStorage i pełnej walidacji wczytanych pól. Nowa gra od razu nadpisuje zapis. Funkcja rankingu istnieje, lecz nie jest włączona do obecnego przebiegu zakończenia; nie należy reklamować kompletnego TOP 10.
5. **Koniec rozgrywki nie jest dopracowany.** Nie ma pełnego, dostępnego przebiegu bankructwa/wygranej i podsumowania. Flaga `alive` nie realizuje tych reguł.
6. **Bezpieczeństwo obliczeń i testy Rust wymagają przeglądu.** Publiczne operacje na ilościach i saldach potrzebują sprawdzenia zakresów oraz przepełnień. Testy natywne nadal oczekują starego długu 500/505 zamiast obecnego startu 25000. Dotychczasowy brak linkera uniemożliwiał ich uruchomienie; przejście testów WASM tego nie naprawia.

## Plan kolejnych prac

| Priorytet / etap | Zakres | Warunek ukończenia |
|---|---|---|
| P0 — spójne reguły | Uzgodnić model cen, odsetek, losowości i liczby zdarzeń; usunąć różnice JS/Rust; dodać kontrolę zakresów | Ta sama sekwencja działań i to samo ziarno dają te same salda, ceny, towary i zdarzenia w obu silnikach; testy obejmują wartości graniczne |
| P1 — pełne sterowanie | Jedna definicja skrótu, etykiety, wyróżnienia i akcji; rozstrzygnięcie kolizji towarów; obsługa Enter/Esc/Tab; komplet PL/EN | Każdą operację da się przejść klawiaturą i myszą w obu językach, bez błędnych wyróżnień |
| P1 — ekrany DOS | Wyjazd 3×3; pytanie bez pustej przestrzeni po menu; nagłówki, wartości i suma akcji; banki i dług według zrzutów; zdarzenia pod tabelą | Porównanie każdego widoku ze zrzutem referencyjnym i sprawdzenie braku uciętych tekstów |
| P1 — typografia i rozmiary | Jednolita bitmapowa czcionka z pełnym PL; weryfikacja obu czcionek przy małym, średnim i szerokim oknie oraz zoomie | Polskie litery nie zmieniają siatki kolumn; ramka ciągła; nagłówki, menu i stopka pozostają czytelne |
| P2 — ekonomia | Opracować własny spójny balans z podobną skalą cen, zmianą odsetek i wyrazistymi zdarzeniami; ustalić rolę ładowni i limity kredytu | Opisane reguły, scenariusze startu/ryzyka/odbudowy; brak twierdzeń o identyczności z nieustalonym algorytmem oryginału |
| P2 — zapis i zakończenie | Walidacja i wersjonowanie zapisu; obsługa błędów; zabezpieczenie poprzedniej gry przed nadpisaniem; podsumowanie i dostępny ranking | Wznowienie po zamknięciu działa; uszkodzony zapis nie blokuje startu; da się ukończyć grę i zobaczyć wynik |
| P3 — wydanie rodzinne | Rozważyć zamianę tytoniu na kakao dla planowanej młodszej publiczności; krótki samouczek; przegląd nazw spółek, dostępności i paczki offline | Jasne opisy dla dzieci, czytelne sterowanie dotykowe, komplet plików i licencji, brak zależności od internetu podczas gry |

Kolejność zalecana: P0 → sterowanie → ekrany/typografia → ekonomia → zapis/zakończenie → wydanie rodzinne. Docelowe zmiany zasad trzeba opisać jako reguły naszej wersji; ze zdjęć nie da się wiarygodnie odtworzyć wszystkich reguł oryginału.

## Granice weryfikacji tej zmiany

Testy JS i skompilowanego WASM sprawdzają przebieg operacji oraz liczbę wierszy i kolumn treści. Obramowanie jest teraz niezależne od tekstu. Nie wykonano świeżego porównania pikselowego w otwartej lokalnej karcie: narzędzie przeglądarki blokuje adresy `file://`. Należy jeszcze obejrzeć oba kroje, PL/EN i rozmiary okna w działającej przeglądarce. Nie traktujemy samych testów tekstu jako dowodu takiej zgodności.
