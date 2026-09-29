# BIZNES.EXE 2.0 — strategia

## Cel i granice

Lekka, darmowa gra offline: kup tanio, sprzedaj drożej. Jeden silnik JavaScript, dane oddzielone od reguł, PL/EN, retro DOS, PWA. Docelowy budżet pobrania: setki KB; mierzyć po każdej zmianie. Bez kont, serwera, zależności runtime, przymusu powrotu i presji czasu. Wersja Classic pozostaje osobna.

## Tryby i asortyment

| Tryb | Towary dostępne na końcu poziomu | Nowa trudność | Status |
| --- | --- | --- | --- |
| Dziecko | jabłka, chleb, książki, kredki, piłki, rowery | ceny i ograniczona gotówka; 7 dni, cel 1300 monet | Etap 1: grywalny |
| Nastolatek | powyższe + plecaki, lampki | prosta pożyczka | wkrótce |
| Dorosły | powyższe + ekspresy, komputery | podatki | wkrótce |
| Zaawansowany | powyższe + panele słoneczne, aparaty | akcje fikcyjnych firm, psucie się towaru | wkrótce |

Wspólny rdzeń liczy sześć towarów. Towary pojawiają się w trakcie rundy; przyszłe trudności także powinny wchodzić stopniowo. Różnice trybów i definicje towarów, miast, zdarzeń oraz sponsorów znajdują się w pliku danych. Ceny i zdarzenia są fikcyjne. Brak tytoniu, alkoholu, broni i loterii.

## Rywalizacja i etyka

Lokalny rekord i odznaki za umiejętności. „Rynek dnia” może być kiedyś deterministycznym, lokalnie obliczanym układem cen, bez nagrody za codzienne wejście. Bez serii dni, push, rankingu obcych, loot boxów, odliczania i ukrytych zachęt do zakupów.

Sponsorów wybiera redakcja: zdrowe i etyczne marki, bez produktów wysokocukrowych. W trybie dziecko wyłącznie statyczny podpis/logo bez linku i wezwania do kupna. W przyszłych trybach dla dorosłych link wymaga osobnej oceny. Sponsor to jawne dane lokalne, bez skryptów, pikseli i zdalnych obrazów. Kryteria EU Pledge i każde nowe partnerstwo wymagają przeglądu przed publikacją.

## Prywatność i dostępność

Zapis i statystyki pozostają w localStorage pod `bx2-save` i `bx2-record`; bez identyfikatorów, telemetrii i wysyłki. Interfejs silnika może w przyszłości podawać **zbiorcze liczniki**, lecz transport nie istnieje. Wybór trybu nie pyta o datę urodzenia. Strona prywatności wyjaśnia zapis, cache i sposoby usuwania. Obsługa klawiatury, dotyku, czytelne etykiety, widoczny fokus, motyw wysokiego kontrastu; kontrast i czytniki ekranu sprawdzić ręcznie na urządzeniach.

## Sklepy i UE — do weryfikacji przed dystrybucją

- Google Play: deklaracja odbiorców, klasyfikacja treści, polityka rodzin, prywatność i sposób oznaczania sponsorowania. [Oficjalne zasady Google Play](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en-GB).
- Apple App Store: klasyfikacja wieku, Kids Category, zasady reklam i prywatności; zgodność opakowania PWA jako aplikacji natywnej. [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/).
- UE: GDPR/RODO, ochrona małoletnich, potencjalne zastosowanie DSA, dostępność oraz standard EU Pledge dla marek. Zakres obowiązków zależy od rzeczywistej dystrybucji i finansowania; wymaga analizy prawnej i ponownego sprawdzenia aktualnych tekstów. [Wytyczne EDPB](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en).

Nie zakładamy, że sam brak SDK reklamowego rozstrzyga ocenę logo sponsora. Przed zgłoszeniem do sklepów potrzebny jest przegląd praktyk marketingowych i formularzy sklepowych.

## Architektura

`data/game-data.js`: konfiguracja trybów, towarów, miast, zdarzeń, sponsorów. `game.js`: wspólny silnik, zapis, renderowanie i sterowanie. `index.html`/`style.css`: dostępny interfejs; `sw.js`: osobny cache 2.0. Dane są ładowane lokalnym skryptem, więc gra działa także przez `file://`. Nowy tryb lub sponsor opisuje się w danych. Mechanika nowego rodzaju wymaga implementacji w silniku i testów.
