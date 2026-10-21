# BIZNES.EXE 2.0 — plan „RETRO” (gałąź `v2-retro`)

Status: **Etap A wdrożony** na gałęzi `v2-retro-stage-a` (21.10.2026). Etap B zostaje wyłącznie w tej dokumentacji — bez kodu, konta i rankingu online. Wersja 2.0 powstaje **na retro UI z `main`** (BETA 2026.10.20: ramka 80×25 na komputerze, widok mobilny z doku pod kciukiem).
Gałąź `v2` (nowoczesny UI „Morska bryza”) zostaje jako archiwum — można z niej brać pomysły i dane (`data/game-data.js`, `privacy.html`, progresja trybu dziecięcego), ale nie jej wygląd.

## Zasady nienaruszalne

- `classic/`, gałąź `classic` i tag `classic-v1` (Classic FINAL) — **nie dotykamy**.
- Istniejące plansze gry (rynek, podróż, bank, akcje, długi) i ekonomia zostają jak są; zmieniamy start, menu i to, co wokół rundy.
- Jeden silnik JS, czysty HTML/JS PWA, działa offline, bez serwera. Kod czytelny, bez minifikacji.
- Bez serii (streaków), bez powiadomień push, bez nagród za codzienne logowanie, bez rankingów z obcymi, bez reklam profilowanych.
- Bez tytoniu, alkoholu, broni i loterii w trybach dla nieletnich. Sponsorzy tylko zdrowi i etyczni (bez produktów z dużą ilością cukru).
- WCAG AA, strona prywatności, `prefers-reduced-motion`.

---

## ETAP A — do wdrożenia teraz (wszystko lokalnie, offline)

### A1. Menu startowe — komputer (ramka 80×25, klawisze literowe)

```
 BIZNES.EXE · Mała gra. Wielki biznes.
 Niezależna adaptacja inspirowana: Biznesman (1988), M. Cwynar / SAMBA.
 Patron: <rotujący, ok. 15 s>

   [N] Nowa gra          → wybór profilu / progu wieku, potem start
   [K] Kontynuuj         → wybór zapisu (3 sloty + autozapis)
   [R] Rekordy           → lokalne top 5
   [U] Ustawienia
   [J] Jak grać          → instrukcja (przeniesiona z ekranu startowego)
   [O] O grze i prywatność

 Ostatnia gra: Dziecko · Handlarz · dzień 5/14 · rekord 3 850   (jeśli jest zapis)
```

- EN: [N] New game, [C] Continue, [R] Records, [S] Settings, [H] How to play, [A] About & privacy.
- Strzałki + Enter działają jak w reszcie gry; kliknięcie też.

### A2. Menu startowe — mobilka

- Nagłówek bez zmian: marka BIZNES.EXE, rotujący patron, przycisk PL/EN (dostępny zawsze).
- Środek ekranu krótszy: hasło, linijka „inspirowane Biznesmanem”, karta ostatniej gry (jeśli jest zapis). Instrukcja wychodzi do „Jak grać”.
- Dok pod kciukiem, dwa rzędy:
  - rząd 1: duże **Nowa gra** i **Kontynuuj**,
  - rząd 2: mniejsze **Rekordy**, **Ustawienia**, **Jak grać**.
- Układ odwraca się dla leworęcznych (ustawienie w Ustawieniach).
- „Prywatność · O grze” jako jedna mała linijka nad statusem wersji. Bez duplikatów.

### A3. Ustawienia

| Pozycja | Wartości | Uwagi |
|---|---|---|
| Język | PL / EN | zmiana w każdej chwili, także w trakcie gry |
| Styl | Standard / DOS / Matrix | jak obecny przełącznik stylu |
| Wysoki kontrast | wł./wył. | WCAG AA w każdym stylu |
| Dźwięk | wł./wył. | krótkie piski „PC-speaker” (Web Audio), domyślnie wył. dla dziecka? — do decyzji, start: wył. |
| Animacje | wł./wył. | dodatkowo respektujemy `prefers-reduced-motion` |
| Ręka | prawa / lewa | dotyczy telefonu (dopisek na komputerze) |
| Zainstaluj aplikację | przycisk | gdy przeglądarka pozwala (PWA) |
| Usuń zapis | przycisk | z potwierdzeniem; usuwa zapisy aktywnego profilu |

### A4. Profile graczy (lokalne)

- Do 4 profili na urządzeniu. Nazwa dowolna albo „Gracz 1…4”. **Żadnych danych osobowych.**
- Każdy profil ma: próg wieku, 3 sloty zapisu + autozapis, swoje rekordy, swoją rangę.
- Próg wieku ustalany przy zakładaniu profilu **neutralnym pytaniem o rok urodzenia** (bez podpowiedzi i bez domyślnej wartości). Do czasu odpowiedzi obowiązuje tryb **dziecko**.
- **Obniżenie progu — zawsze wolne. Podwyższenie — tylko przez bramkę rodzica**: zadanie matematyczne (np. „ile to 7×8?”, losowe, dwucyfrowe) albo PIN rodzica ustawiany raz (przechowywany jako skrót, nie jawnie).

Progi:

| Próg | Wiek | Treści |
|---|---|---|
| dziecko | ≤ 12 | bez tytoniu/alkoholu/broni/loterii; logo sponsorów bez linków; każde wyjście z gry (link, share) za bramką rodzica |
| nastolatek | 13–15 | jak wyżej (bez linków sponsorów); share tylko jako tekst/grafika bez danych |
| dorosły | 16+ | linki sponsorów dozwolone |
| zaawansowany | opcja dla dorosłego | więcej towarów/akcji; dopisek „fikcyjne akcje, to nie porada inwestycyjna”, żadnych prawdziwych pieniędzy |

Próg zmienia **tylko treści i zakres**, nie samą ekonomię.

### A5. Zapisy

- Per profil: 3 sloty + autozapis. „Kontynuuj” pokazuje listę: slot, próg, ranga, dzień, majątek, data.
- Migracja: istniejący `bx-save` z BETA trafia do autozapisu „Gracz 1”.

### A6. Rangi (automatyczne w obrębie progu)

- Przykład: **Handlarz → Kupiec → Hurtownik → Magnat**.
- Każda ranga ma: cel (majątek = gotówka + banki + towary + akcje − długi), limit dni, większą liczbę towarów i miast.
- Runda kończy się ekranem wyniku: wynik, dni, ile brakowało do rekordu („jeszcze raz” bez presji), awans rangi jeśli cel osiągnięty.
- Dorosły po randze Magnat dostaje propozycję przejścia do trybu **Zaawansowany**.
- Próg wieku nigdy nie zmienia się sam.

### A7. Rekordy lokalne

- Top 5 na kombinację **próg + ranga** (+ osobna tabela „Rynek dnia” dla każdego progu): wynik, dni, data, 3 litery inicjałów.
- **Nowy rekord → konfetti DOS**: znaki `* + . ░ ▒ ★` w kolorach aktywnego stylu, 2–3 s, duża ramka ASCII „NOWY REKORD!”, opcjonalny pisk. Przy wyłączonych animacjach / `prefers-reduced-motion` — statyczna ramka.

### A8. Udostępnianie

- Tekst ASCII, np. `BIZNES.EXE #142 · Magnat · 14 dni · 8 450 $ ▓▓▓▓▓░`.
- Grafika PNG w stylu DOS (canvas) przez Web Share API; zapasowo „Kopiuj tekst” / „Pobierz obraz”.
- Dziecko: udostępnianie za bramką rodzica. Żadnych danych w treści poza wynikiem.

### A9. Rynek dnia i wyzwanie

- Deterministyczne ziarno z daty (ten sam rynek w obrębie progu), zawsze 14 dni niezależnie od rangi, jedna punktowana runda dziennie, **bez licznika serii**.
- **Wyzwanie dla znajomego**: kod rynku (np. `BX-7F3K`), który ustawia to samo ziarno. Gra kodem jest nieoficjalna (bez wpływu na rynek dnia).
- Wszystko offline, bez serwera.

### A10. Testy

- `test-game.cjs` oraz `test-v2-stage-a.cjs` (Node, bez zależności) — testy: profile (limit 4, domyślny próg), sloty i migracja zapisu, rangi i koniec rundy, rekordy top 5, ziarno rynku dnia i kod wyzwania (deterministyczne), bramka rodzica (podwyższenie wymaga bramki, obniżenie nie).
- `test-classic.cjs` bez zmian i ma przechodzić.

---

## ETAP B — później (tylko dokumentacja, NIE wdrażamy w Etapie A)

- Supabase **anonimowe logowanie** (`signInAnonymously`) + **kod gracza** do odzyskania konta (np. `BX-7F3K-Q9M2`, także QR). W bazie tylko skrót (hash) kodu. **Bez maila i telefonu.**
- Opcjonalny ranking online **tylko 16+** i tylko dla Rynku dnia: nick z 3 liter + kod gracza; albo prywatne ligi na kod (klasa, firma).
- Cloudflare Turnstile przeciw botom przy zakładaniu kont.
- Usuwanie konta w aplikacji (wymóg Apple przy kontach).
- RLS w Supabase z rozróżnieniem `is_anonymous`.

---

## Zgodność — tabela per próg (**do weryfikacji prawnej**)

| Wymóg | Dziecko ≤12 | Nastolatek 13–15 | Dorosły 16+ / Zaaw. | Gdzie |
|---|---|---|---|---|
| RODO art. 8 (PL: zgoda od 16 lat) | brak przetwarzania danych | brak przetwarzania danych (zgoda rodzica byłaby wymagana) | zgoda własna, jeśli kiedyś dodamy analitykę/konto | Prywatność |
| DSA art. 28 + wytyczne KE dot. małoletnich (2025) | prywatność domyślnie maks., bez profilowanych reklam, bez ciemnych wzorców | jw. | bez ciemnych wzorców | cała gra |
| PEGI / IARC | ankieta IARC w Google Play | | | sklep |
| Apple Kids / Google Families | bez SDK analityki/reklam, linki za bramką rodzica | | | sklep, bramka |
| Usuwanie konta w aplikacji | n/d (brak kont w Etapie A) | n/d | wymagane od Etapu B | Ustawienia/Konto |
| Neutralne pytanie o wiek | tak | tak | tak | tworzenie profilu |
| Hazard, lootboxy | zakaz | zakaz | zakaz | — |
| WCAG AA | tak | tak | tak | — |
| COPPA (USA), UK AADC | uwaga: przy „dzieci bez danych” spełniane praktycznie domyślnie; sprawdzić przed publikacją w US/UK | | | — |
| Treści | bez tytoniu/alkoholu/broni/loterii | jw. | dorosły: dopuszczalne wg oceny PEGI, ale nadal nie planujemy | dane gry |
| Sponsorzy | logo bez linków | logo bez linków | linki dozwolone | pasek patronów |

> Uwaga: tabela przygotowana na podstawie ogólnej wiedzy, **wymaga weryfikacji prawnej** przed publikacją w sklepach (m.in. aktualne wytyczne KE do DSA, projekt Digital Fairness Act).

## Wdrożenie i podgląd

- Praca na gałęzi `v2-retro` (z `main`). Podgląd: https://sfaragdas.github.io/BIZNES.EXE/v2/ (workflow `pages.yml` na `main` buduje `/v2/` z `origin/v2-retro`).
- Implementacja Etapu A: Codex (PiXPS), małe commity, testy zielone.

## Poprawki po review — 22.10.2026

- Jeden wynik i najwyżej jeden awans na rundę, również po ponownym wczytaniu autozapisu lub slotu sprzed zakończenia.
- Majątek uwzględnia banki, towary i akcje; rekordy nie są zawężane do liczb 32-bitowych.
- Przy wczytaniu obowiązuje niższy z progów: aktualnego profilu i zapisu. Niedostępne zasoby są zamieniane na gotówkę po cenie zapisu. Import BETA otrzymuje ograniczenia bieżącego profilu.
- Rynek dnia: wspólny limit 14 dni i osobne rekordy dla progów. Starsza tabela `daily` jest zachowana w danych, ale nie miesza się z nowymi tabelami.
- Nieprawidłowa baza profili nie blokuje startu; aplikacja podejmuje próbę kopii do `bx2r-db-backup`. Wadliwy slot nie jest uruchamiany.
- Instrukcje instalacji ręcznej i Safari są widoczne w Ustawieniach.
- Walidacja gałęzi retro i publikacja podglądu uruchamiają także `test-v2-stage-a.cjs`.

Uproszczenie menu i pytań o próg wieku pozostaje osobnym etapem.
