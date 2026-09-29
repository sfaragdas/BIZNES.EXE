# BIZNES.EXE Classic

Lekka gra handlowa w klimacie MS-DOS. Polska i angielska wersja językowa, obsługa klawiatury i dotyku, style Standard, DOS i Matrix.

[Uruchom grę](https://sfaragdas.github.io/BIZNES.EXE/classic/)

## Jak grać

- Kupuj taniej i sprzedawaj drożej. Masz do wyboru 10 towarów i 6 akcji; ceny są fikcyjne.
- Podróżuj między 9 miastami. Przejazd zmienia ceny i może przynieść korzyść lub stratę.
- Pilnuj długu: podróż dolicza widoczne 1–30%. Stawka zmienia się najwyżej o 3 punkty procentowe, czasem pozostaje bez zmian. Przy stawkach od 15% dominuje kierunek spadkowy, więc wyższe wartości są rzadsze. Nowa gra zaczyna się z długiem 10 000 $.
- W bankach wpłacaj i odbieraj gotówkę. Pożyczka do 1000 $ jest dostępna raz na pobyt; kolejny przejazd odblokowuje następną.
- Wybierz działanie, pozycję oraz ilość. Enter zatwierdza, Esc anuluje. Postęp zapisuje się automatycznie.

## Uruchomienie i offline

Otwórz powyższy adres. Instalacja na ekranie początkowym jest dostępna przez „Zainstaluj”; na iOS przez menu Safari. Poczekaj na „Offline gotowe”, zanim odłączysz internet.

Lokalnie można otworzyć `index.html` albo udostępnić katalog przez serwer HTTP. Gra korzysta wyłącznie z JavaScript, bez kompilacji, konta i backendu.

Classic ma własną pamięć offline i zapis. Przy pierwszym uruchomieniu przejmuje dostępny wcześniejszy zapis z tej samej przeglądarki. Wyczyszczenie danych przeglądarki usuwa lokalny postęp. Usunięte dodatkowe akcje są rozliczane według ich bieżących cen.

## Autorstwo i licencje

Niezależna adaptacja inspirowana Biznesmanem (1988), M. Cwynar / SAMBA. Nie zawiera kodu ani zasobów oryginalnej gry.

Kod: Apache-2.0 — zobacz LICENSE. Czcionka PxPlus IBM VGA8: CC BY-SA 4.0 — zobacz NOTICE oraz assets/PxPlus-LICENSE.txt. Nazwy firm w grze nie oznaczają współpracy ani poparcia tych firm.

Patroni projektu: [LCSE.pl](https://lcse.pl) · [MojeDostawy.pl](https://mojedostawy.pl).

## Przedziały cen ($)

Nowa gra losuje ceny. Towary i akcje są ustawione według dolnej granicy ceny, a nie według chwilowego kursu.

| Towar | Zakres |
|---|---:|
| Zboże | 3–27 |
| Herbata | 4–26 |
| Kawa | 6–36 |
| Tytoń | 7–66 |
| Ropa | 10–93 |
| Leki | 26–89 |
| Broń | 38–128 |
| Wideo | 56–166 |
| Drukarki | 85–244 |
| Samochody | 500–1450 |

| Akcje | Zakres |
|---|---:|
| JVC | 20–50 |
| Philips | 40–100 |
| MacDonald's | 60–150 |
| International | 80–200 |
| Hilton | 100–250 |
| Toyota | 120–300 |

Każdy przejazd zmienia każdą cenę. W 1/3 losowań wybór obejmuje cały przedział, w pozostałych najbliższe 25% szerokości przedziału w każdą stronę. Poprzednia cena jest wykluczona. Wyprzedaż również respektuje granice. Ceny akcji są zapisywane i nie zależą już od stałego cyklu dnia. Są to fikcyjne ceny na potrzeby gry.
