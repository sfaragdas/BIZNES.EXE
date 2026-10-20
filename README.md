# BIZNES.EXE

**Lekka gra ekonomiczna w klimacie retro MS-DOS.** Kupuj tanio, sprzedawaj drożej, podróżuj i pilnuj długu.

## Wydania

| Wersja | Status i data | Uruchomienie |
|---|---|---|
| BIZNES.EXE | **BETA · 2026.10.20** — wersja rozwijana | [Zagraj](https://sfaragdas.github.io/BIZNES.EXE/) |
| BIZNES.EXE Classic | **FINAL · 2026.10.20** — wersja bliższa Biznesmanowi (1988) | [Zagraj](https://sfaragdas.github.io/BIZNES.EXE/classic/) |

Obie wersje: PL / EN · Standard / DOS / Matrix · komputer / tablet / telefon · PWA offline.

| Zasada | BETA | Classic FINAL |
|---|---|---|
| Gotówka / dług na start | 1000 $ / 25 000 $ | 1000 $ / 25 000 $ |
| Odsetki za podróż | Zmienna stawka 1–30%; start 5–10% | Zmienna stawka 1–30%; start 5–10% |
| Pożyczka | Do 2000 $ na operację | Do 2000 $ raz na pobyt w mieście |
| Towary / akcje | 10 / 10 | 10 / 6 |
| Ceny | Poprzednia cena, trend dnia gry, losowanie; dla towarów także miasto | Losowanie w osobnych zakresach dla każdej pozycji |
| Zapis | Własny zapis BETA | Własny zapis Classic; przy pierwszym uruchomieniu możliwy import wcześniejszego zapisu |

Zmiana długu początkowego dotyczy nowych gier. Aktualizacja zachowuje saldo istniejącej rozgrywki. Szczegóły Classic: [classic/README.md](classic/README.md). Historia wydań: [CHANGELOG.md](CHANGELOG.md).

Osobno rozwijany jest **BIZNES.EXE 2.0** ([podgląd eksperymentalny · 2026.10.20](https://sfaragdas.github.io/BIZNES.EXE/v2/), gałąź `v2`). Dostępne są cztery prototypowe tryby: dziecko (handel), nastolatek (pożyczka), dorosły (podatek od zysku) i zaawansowany (fikcyjne akcje). Własny zapis i rekordy, PL/EN, obsługa dotyku i PWA offline. Balans i działanie na fizycznych urządzeniach wymagają dalszych testów.

Niezależna adaptacja inspirowana **Biznesman (1988), M. Cwynar / SAMBA**. Własna implementacja, bez oryginalnego kodu i zasobów. Patroni projektu: [LCSE.pl](https://lcse.pl) · [MojeDostawy.pl](https://mojedostawy.pl).

## Jak grać

1. Wybierz **Towary**, **Akcje** lub **Banki**, a następnie działanie. Handluj po fikcyjnych cenach; banki służą do wpłat i odbioru gotówki.
2. Wskaż pozycję, wpisz ilość albo użyj **− / + / Maks**, a następnie zatwierdź. Błędną wartość poprawisz w tym samym formularzu. Udana transakcja wraca do widoku ogólnego wybranego rynku.
3. **Wyjazd** jest bezpłatny. Zmienia ceny, zwiększa dług o widoczną stawkę 1–30% i może przynieść korzyść lub wpadkę. Bieżącego miasta nie ma na liście celów.
4. W **Długu** pożyczasz lub spłacasz pieniądze. Limit 2000 $ dotyczy jednej pożyczki, nie całego zadłużenia.
5. Postęp zapisuje się automatycznie w tej przeglądarce. **Menu** otwiera powitanie, **Kontynuuj** wznawia grę, **Nowa gra** rozpoczyna ją od początku.

Zmiana zakładki podczas zakupu lub sprzedaży zachowuje kierunek operacji: kupno ↔ wpłata, sprzedaż ↔ odbiór. Podczas wyjazdu lub obsługi długu przełączenie zakładki wraca do tego rynku. Zdarzenia podróży zamykają się po 15 sekundach lub wcześniej przez „Dalej”; zwykłe komunikaty wygasają po 7 sekundach.

Ceny zmieniają się przy podróży: mieszają 60% poprzedniej ceny i 40% nowej wyceny, opartej na dniu gry, losowaniu oraz — dla towarów — mieście. Akcje śledzą wspólny rynek. Standardowa wycena jest ograniczona do 40–180% wartości bazowej; zdarzenie wyprzedaży może dodatkowo obniżyć cenę towaru. Dług startuje od 25 000 $; początkowa stawka to 5–10%, potem zmienia się o maksymalnie 3 punkty procentowe na podróż w zakresie 1–30%. Stawka widoczna przed podróżą określa jej koszt odsetek.

## Dwa układy, te same zasady

- **Desktop i szeroki tablet (ponad 900 px CSS):** tabela inspirowana DOS, 23 wiersze × 78 kolumn, tekstowe opcje z wyróżnioną literą. Działania odbywają się pod tabelą. Bez zamiany napisów w duże kafelki.
- **Telefon i wąski tablet:** lista pozycji pomiędzy przypiętym nagłówkiem a dolnym panelem. Tryb lewej/prawej ręki odwraca kolejność głównych działań. Na bardzo niskim ekranie dolny panel też może się przewijać.
- W obu układach: ten sam zapis, nazwy, instrukcja, style i operacje. Matrix zmienia kolor akcentu na **#008F39**, zachowując czarne tło i szary tekst.

### Klawiatura

| Skrót | Działanie |
|---|---|
| T / A / B | Towary / Akcje / Banki |
| K / S | Kupno / Sprzedaż |
| P / O w bankach | Wpłata / Odbiór |
| D / W / Q | Dług / Wyjazd / Menu |
| L | PL / EN |
| Enter lub Z (PL), C (EN) | Zatwierdź ilość |
| Esc | Anuluj |
| F / I na powitaniu | Styl / Zainstaluj |

Pozycję wybierzesz kliknięciem lub wyróżnioną literą, czasem wewnątrz nazwy. Wersja angielska pokazuje rzeczywiste skróty, nawet jeśli nie odpowiadają pierwszej literze angielskiej nazwy.

## Offline i instalacja

Po pierwszym otwarciu publicznego adresu poczekaj na **„Offline gotowe”**. Przycisk/napis **Zainstaluj** uruchamia dostępny mechanizm przeglądarki. Na iOS pokazuje instrukcję: Safari → Udostępnij → Dodaj do ekranu początkowego.

Gra nie wymaga konta, nie ma backendu ani analityki graczy. Postęp jest lokalny; wyczyszczenie danych przeglądarki może go usunąć. Safari, aplikacja PWA i plik lokalny mogą mieć osobne zapisy. Pierwsze pobranie i aktualizacja wymagają internetu; dalsza gra korzysta z zapisanych plików. Linki patronów prowadzą do zewnętrznych stron.

## Stan projektu i ograniczenia

To **beta**, nie symulator prawdziwych inwestycji. Jest 10 towarów, 10 akcji, 6 rachunków bankowych i 9 miast. Kursy są fikcyjne. Banki obecnie nie mają oprocentowania ani różnych zasad. Nie ma jeszcze ustalonego końca rozgrywki, rankingu, kont graczy, ETF-ów ani wspólnego rynku online.

Znane tematy do dopracowania: odporność lokalnego zapisu, granice dużych liczb, balans zdarzeń i pożyczek oraz sprawdzenie Safari/klawiatury/PWA na fizycznych urządzeniach. Techniczny limit jednej pozycji wynosi 65 535 jednostek; dawnego limitu 100 jednostek ładowni już nie ma.

## Uruchomienie i rozwój

Czysty HTML/CSS/JavaScript, bez frameworka, kroku budowania i zewnętrznych bibliotek uruchomieniowych. Grę można otworzyć bezpośrednio z `index.html` albo przez lokalny serwer:

```sh
python3 -m http.server 8000
```

Otwórz `http://localhost:8000` (Classic: `http://localhost:8000/classic/`).

Kontrole przebiegu (Node, symulowany DOM):

```sh
node test-game.cjs
node test-classic.cjs
```

Testy obejmują transakcje, przełączanie rynków, komunikaty, zdarzenia, języki, style, zapis oraz siatkę terminala. Nie potwierdzają wyglądu ani zachowania klawiatury na fizycznym iPhonie. Workflow GitHub Pages uruchamia testy i publikuje grę oraz wersję Classic po pushu do `main`. Każde wdrożenie wersjonuje pliki i pamięć PWA.

## Licencje

Kod: [Apache-2.0](LICENSE). Czcionka PxPlus IBM VGA8 autorstwa VileR: osobna licencja **CC BY-SA 4.0**, szczegóły w [NOTICE](NOTICE) i `assets/PxPlus-LICENSE.txt`. Nazwy firm i historyczna inspiracja nie oznaczają współpracy ani poparcia ze strony tych podmiotów. Obecność nazwy w fikcyjnym rynku nie jest płatnym lokowaniem; przyszłe partnerstwa będą oznaczane osobno.

---

**English:** A lightweight retro economic game inspired by MS-DOS. Trade goods and fictional shares, travel between cities and manage debt. Polish/English, desktop text controls, touch layout, three styles and offline PWA. No account or player analytics. This is an independent beta implementation; see the sections above for local storage and validation limits.
