# BIZNES.EXE 2.0

**Eksperymentalna gra handlowa offline.** Kupuj towary, odkrywaj polskie miasta i buduj majątek. Cztery tryby stopniowo dodają pożyczki, podatki i fikcyjne akcje.

[Zagraj w podgląd 2.0](https://sfaragdas.github.io/BIZNES.EXE/v2/) · [Wersja BETA](https://sfaragdas.github.io/BIZNES.EXE/) · [Classic FINAL](https://sfaragdas.github.io/BIZNES.EXE/classic/)

## Tryby

| Tryb | Dni | Gotówka na start | Cel majątku netto | Dodatkowe zasady |
|---|---|---|---|---|
| Dziecko | 14 | 1000 | 4000 | Bez długu i podatków |
| Nastolatek | 18 | 1000 | 6000 | Pożyczka do 2000, odsetki 2% dziennie |
| Dorosły | 21 | 1500 | 9000 | Pożyczka do 3000, odsetki 2%, podatek 15% od zysku ze sprzedaży |
| Zaawansowany | 24 | 2000 | 14000 | Pożyczka do 4000, odsetki 3%, podatek 20%, fikcyjne akcje |

Parametry są wstępne i wymagają testów balansu. Nie odwzorowują rzeczywistych podatków ani ofert finansowych.

## Zasady

- Majątek netto to gotówka oraz bieżąca wartość towarów i akcji, pomniejszone o dług.
- Limit pożyczki dotyczy łącznego długu. Odsetki są zaokrąglane w górę do pełnej monety przy zakończeniu dnia. Mogą zwiększyć dług ponad limit; do czasu spłaty nie można dobrać pożyczki.
- Podatek dotyczy dodatniego zysku przy sprzedaży, po odjęciu kosztu zakupu sprzedanej części zasobu. Nie jest naliczany od całej kwoty sprzedaży ani od pożyczki. Strata nie daje zwrotu podatku.
- Wartość majątku odblokowuje kolejne towary i miasta. Odblokowania pozostają do końca rundy.
- Podróż kończy dzień i zmienia ceny. Ostatni dzień kończy rundę bez wyceny z dodatkowego dnia.
- Postęp, ustawienia i rekordy są lokalne. Jest jeden aktywny zapis rundy i osobne rekordy trybów. Wcześniejszy zapis trybu dziecko jest przenoszony do nowego formatu.

## Obsługa i offline

PL/EN, klawiatura i dotyk, styl Morska bryza lub Retro DOS oraz osobny wysoki kontrast. Gra nie wymaga konta ani backendu.

Otwórz podgląd przez HTTPS i poczekaj na **Offline gotowe**. Opcja instalacji dodaje grę do pulpitu lub ekranu początkowego; dostępność zależy od przeglądarki. Pierwsze pobranie i aktualizacja wymagają internetu. Na iOS: Safari → Udostępnij → Dodaj do ekranu początkowego.

Zamknięcie przeglądarki zachowuje lokalny zapis. Usunięcie danych witryny może go usunąć. Tryby nie przesyłają statystyk gracza. [Prywatność](privacy.html).

## Rozwój i sprawdzenie

Czysty HTML/CSS/JavaScript, bez zależności runtime. Lokalnie:

```sh
python -m http.server 8000
node test-game.cjs
node test-classic.cjs
node test-pwa.cjs
```

Testy sprawdzają reguły, zapis, postęp, izolację trybów oraz sygnalizację instalacji offline w symulowanym środowisku. Nie zastępują ręcznego sprawdzenia na telefonie, czytniku ekranu i rzeczywistego działania offline.

Gałąź `v2` ma własną walidację CI. Publikacja odbywa się przez workflow gałęzi `main`, który umieszcza podgląd pod `/v2/`; nie zastępuje BETA ani Classic. Katalog `classic/` na tej gałęzi jest zachowany dla regresji; publiczny Classic pochodzi z `main`.

[Strategia](docs/STRATEGIA-2.0.md) · [Plan](docs/PLAN.md)

Kod: [Apache-2.0](LICENSE). Czcionka: osobna licencja w [NOTICE](NOTICE).
