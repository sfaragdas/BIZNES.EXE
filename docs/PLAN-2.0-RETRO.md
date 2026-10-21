# BIZNES.EXE 2.0 retro — uproszczony podgląd 2026.10.22

Aktywna gałąź: `v2-retro`. Podgląd: https://sfaragdas.github.io/BIZNES.EXE/v2/.
Główna BETA i Classic FINAL zachowują swoje zasady. Starszy prototyp `v2` pozostaje archiwum.

## Menu i początek gry

Menu: Nowa gra, Kontynuuj, Rekordy, Ustawienia. Pomoc i Prywatność są poniżej.
Nowa gra otwiera wyłącznie wybór trzech poziomów. Domyślny lokalny profil to Gracz 1;
do czterech profili można opcjonalnie wybrać lub dodać w Ustawieniach.
Nie pytamy o wiek, rok urodzenia, PIN ani dane osobowe. Poziomy oznaczają trudność,
nie ocenę PEGI. Nie deklarujemy oficjalnej klasyfikacji wieku.

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
bez alkoholu, broni i loterii. Patroni są stałym tekstem bez linków w grze.
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
