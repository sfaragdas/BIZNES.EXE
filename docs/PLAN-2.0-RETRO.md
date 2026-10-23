# BIZNES.EXE 2.0 retro — uproszczony podgląd 2026.10.22

Aktywna gałąź: `v2-retro`. Podgląd: https://sfaragdas.github.io/BIZNES.EXE/v2/.
Główna BETA i Classic FINAL zachowują swoje zasady. Starszy prototyp `v2` pozostaje archiwum.

## Menu i początek gry

Interfejs nie wymaga profilu ani jego zakładania. Kontynuuj od razu wznawia zapis gry.
Dawne profile pozostają w danych; używany jest ostatni aktywny zapis.

Na telefonie panel jest stale u dołu. Rzędy od góry:
- Wiek: <18 / 18+, Pomoc, Instaluj (3 przyciski).
- Rekordy, Ustawienia (2 przyciski).
- Nowa gra, Kontynuuj (2 większe przyciski, ostatni rząd).

Na komputerze zostaje oryginalny panel retro DOS, nagłówek, tekstowe skróty i 23 wiersze.
Styl Matrix ma jasny akcent `#00FF41`; kolor przyjęty roboczo, bez potwierdzenia próbnikiem z załącznika.
Pomoc i informacje grupuje zasady, prywatność/zapis lokalny, patronów/linki oraz licencje.
Ustawienia zawierają język, styl, kontrast, dźwięk, animacje, rękę i usuwanie zapisu gry.
Nowa gra otwiera wyłącznie wybór poziomu. Poziom jest niezależny od deklaracji wieku.

### Deklaracja wieku

Domyślnie <18; brak odpowiedzi oznacza ten sam wariant.
Przejście na 18+ wymaga krótkiego potwierdzenia; wyłączenie jest natychmiastowe.
Zapamiętujemy tylko deklarację lokalnie, bez daty urodzenia, dokumentów lub zewnętrznej weryfikacji.
Restart odtwarza wybór, a usunięcie danych strony go resetuje.
18+ włącza zwykłe linki patronów; poniżej 18 są same nazwy.
Linki otwierają osobną kartę i nie przekazują referrera.
To własne ustawienie ostrożnościowe, nie deklaracja prawnego obowiązku blokowania tych linków.
Nie jest to zweryfikowany wiek ani zgoda rodzica. Treści i zasady gry pozostają neutralne dla wszystkich.

## Poziomy

| Poziom | Towary / miasta | Banki / akcje | Dług początkowy | Odsetki za wyjazd | Cel zysku / limit dni |
|---|---|---|---|---|---|
| Handlarz | 4 / 4 | nie / nie | 1000 $ | 1–3% | 3000 $ / 14 |
| Kupiec | 6 / 6 | tak / nie | 5000 $ | 1–10% | 8000 $ / 21 |
| Magnat | 10 / 9 | tak / tak, 10 akcji | 25 000 $ | 1–30% | 50 000 $ / 40 |

Gotówka początkowa: 1000 $. Pożyczka: do 2000 $ na operację na każdym poziomie.
Wyjazdy są bezpłatne. Odsetki naliczane są od długu według stawki widocznej przed wyjazdem.
Banki przechowują pieniądze bez oprocentowania. Ceny są fikcyjne i zmieniają się przy podróży:
łączą poprzednią cenę, dzień gry, miasto i losowanie.

Cel dotyczy wzrostu majątku netto względem początku rundy.
Majątek netto = gotówka + banki + wartość towarów + wartość akcji − dług.
Runda kończy się po osiągnięciu celu albo przekroczeniu limitu dni.
Po sukcesie można wybrać kolejny poziom; nie ma osobnej automatycznej rangi.

## Treści i prywatność

Wszystkie poziomy mają ten sam rodzinny zestaw treści: kakao zamiast tytoniu,
bez alkoholu, broni i loterii. Patroni są stali; ich linki działają wyłącznie po lokalnej deklaracji 18+.
Nie ma kont, czatu, analityki graczy, płatności, profilowanych reklam, powiadomień,
serii codziennych logowań ani kar za nieobecność. Hosting może rejestrować techniczne połączenia.

Rynek dnia, kody wyzwań, inicjały, generowanie PNG i systemowe udostępnianie usunięto.
Zostały lokalne rekordy top 5 dla każdego poziomu, zapisywane automatycznie po rundzie.
Dźwięk jest domyślnie wyłączony; ustawienia obejmują PL/EN, styl, kontrast, ruch i rękę na telefonie.
Gra działa offline po zapisaniu plików PWA na urządzeniu. Pierwsze pobranie wymaga internetu.

## Zapisy i migracja

- Kontynuuj wznawia autozapis aktywnego profilu. Nowa runda wymaga potwierdzenia, gdy zastępuje trwającą grę.
- Baza `bx2r-db` przechodzi z v1 do v2. Stare profile, autozapisy, ręczne sloty, rekordy i rejestr zakończonych rund pozostają w danych.
- Ręczne sloty nie mają nowego interfejsu. Jeśli brak autozapisu, najnowszy poprawny ręczny zapis staje się autozapisem.
- Dawne pola wieku i skrót PIN są usuwane. Hurtownik jest mapowany na Magnata. Stare wyniki pozostają oddzielone od nowych poziomów.
- Towary, akcje i środki w bankach niedostępne na wybranym poziomie są przy wznowieniu zamieniane na gotówkę według cen zapisu.
- Identyfikator rundy pozostaje stabilny. Wczytanie starszej kopii zakończonej rundy nie dopisuje drugiego rekordu.
- Import `bx-save` jest tylko odczytem. Nie nadpisujemy zapisów BETA ani Classic.
- Wadliwa baza nie blokuje startu; aplikacja próbuje zachować kopię pod `bx2r-db-backup`. Wadliwego stanu nie uruchamiamy.

## Weryfikacja i publikacja

`node test-game.cjs`, `node test-classic.cjs`, `node test-v2-stage-a.cjs`.
Testy obejmują silnik, poziomy, migrację, izolację profili, potwierdzenie nadpisania,
jednokrotny zapis wyniku, wycenę akcji, odzyskiwanie bazy i instrukcję instalacji.
Workflow `validate-retro.yml` sprawdza gałąź. Workflow Pages z `main` publikuje ją pod `/v2/`.
Balans i zachowanie PWA na fizycznych urządzeniach nadal wymagają testów graczy.

Zmiana menu zachowuje rejestr zakończonych rund i rekordy. Testy obejmują także kolejność rzędów, deklarację wieku, restart i brak linków w wariancie <18.
