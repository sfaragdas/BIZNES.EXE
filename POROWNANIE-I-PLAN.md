# BIZNES.EXE — zgodność z kierunkiem retro i plan

Aktualizacja: 28.09.2026. Podstawa porównania z oryginałem: zrzuty dostarczone przez użytkownika. Nie ustalają one wszystkich reguł ani algorytmów Biznesmana.

## Co zachowujemy

- Czarny ekran, jasnoszary tekst, kolor akcentu, szare nagłówki, tabela i kropkowane wyrównania.
- Desktop i szeroki tablet: klikalne napisy, wyróżnione litery, operacje pod tabelą, a nie osobne ekrany.
- Powitanie z własnym tekstem w polu z gwiazdkami i jawną inspiracją: Biznesman (1988), M. Cwynar / SAMBA.
- Dziesięć towarów, dziewięć miast, handel, akcje, banki i dług.

## Świadome różnice

| Obszar | Obecna adaptacja |
|---|---|
| Układy | Wspólny stan i instrukcja; tabela desktop/szeroki tablet, lista na wąskim ekranie |
| Asortyment | Leki i złoto zamiast broni i narkotyków; tytoń wciąż obecny |
| Akcje | 10 pozycji; fikcyjne kursy, wspólna tabela z towarami i bankami |
| Banki | 6 rachunków, obecnie takie same zasady |
| Dług | 1% na podróż, pożyczka do 5000 $ na operację |
| Wyjazd | Bez opłaty; wybór miasta pod tabelą, bieżące miasto pominięte |
| Zdarzenia | 35% szansy na zdarzenie; własne skutki, okno i relacja wygasają po 15 s |
| Wynik transakcji | Sukces wraca do ogólnego widoku rynku, błąd ilości pozostawia formularz |
| Zakładki | Dostępne także podczas operacji; kierunek transakcji przechodzi między rynkami |
| Zapis | Automatyczny, lokalny; instalowalna PWA po pierwszym pobraniu |
| Ładownia | Brak dawnego limitu 100; techniczna granica 65 535 na pozycję |
| Style | Standard, DOS i Matrix; nie deklarujemy identyczności fontu z oryginałem |

## Ujednolicenie desktop/mobile

Nazwy operacji i instrukcja pochodzą ze wspólnych funkcji. Desktop skraca akapity do jednego wiersza, zachowując ich kolejność i sens. Zakładki pozostają widoczne; „Wybierz akcję:” jest wspólnym promptem. Opis projektu, rozdzielona lista patronów, instalacja, wersja alfa i krótki status offline są na powitaniu. „Pokrycie długu” zastępuje mylące „Szansa na spłatę”: to wyliczony stosunek gotówki i banków do długu, a nie prawdopodobieństwo.

## Kolejność dalszych prac

1. **Pilne techniczne:** walidacja i odporność zapisu, ochrona przed przepełnieniem liczb, realne testy Safari i PWA.
2. **Decyzje o zasadach:** pomoc graczowi w losowaniu zdarzeń, kredyt, różnice między bankami, koniec rozgrywki i wynik.
3. **Warunek oferty dla patrona:** jasne oznaczenie płatnej współpracy, zgody na marki, znana grupa odbiorców i uczciwie opisany pomiar efektów.
4. **Później:** edukacyjny tryb rozgrywki, lokalne wyzwania, eksport zapisu. ETF-y, konta i rynek online są pomysłami, nie wdrożonymi funkcjami.

Ograniczenie dowodów: testy Node sprawdzają przebieg i treść siatki 23×78, nie czytelność na fizycznym urządzeniu. Oryginalne zrzuty są odniesieniem wizualnym, nie specyfikacją algorytmów. Historyczne szczegóły buildów pozostają w BUILD-STATUS.md; bieżący opis funkcji jest w README.md.
