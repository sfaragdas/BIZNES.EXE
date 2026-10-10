globalThis.BX2_DATA = {
  modes: [
    {
      id: 'child', name: ['Dziecko', 'Child'], available: true,
      days: 14, goal: 4000, cash: 1000,
      goods: ['apples', 'bread', 'books', 'crayons', 'balls', 'bikes', 'kites', 'puzzles', 'scooters'],
      mechanics: []
    },
    { id: 'teen', name: ['Nastolatek', 'Teen'], available: false, mechanics: ['loan'] },
    { id: 'adult', name: ['Dorosły', 'Adult'], available: false, mechanics: ['loan', 'tax'] },
    { id: 'advanced', name: ['Zaawansowany', 'Advanced'], available: false, mechanics: ['loan', 'tax', 'shares'] }
  ],
  goods: [
    ['apples', 'Jabłka', 'Apples', 12, 1000],
    ['bread', 'Chleb', 'Bread', 18, 1000],
    ['books', 'Książki', 'Books', 35, 1000],
    ['crayons', 'Kredki', 'Crayons', 24, 1500],
    ['balls', 'Piłki', 'Balls', 50, 2000],
    ['bikes', 'Rowery', 'Bicycles', 180, 2000],
    ['kites', 'Latawce', 'Kites', 45, 3000],
    ['puzzles', 'Puzzle', 'Puzzles', 65, 3000],
    ['scooters', 'Hulajnogi', 'Scooters', 140, 4000]
  ].map(([id, pl, en, base, unlockWorth]) => ({ id, name: [pl, en], base, unlockWorth })),
  cities: [
    ['krakow', 'Kraków', 'Krakow', 1.04, 1000, '🐉', 'Na Wawelu stoi pomnik Smoka Wawelskiego.', 'A statue of the Wawel Dragon stands by Wawel Castle.'],
    ['torun', 'Toruń', 'Toruń', 0.94, 1000, '🪐', 'W Toruniu urodził się Mikołaj Kopernik.', 'Nicolaus Copernicus was born in Toruń.'],
    ['gdansk', 'Gdańsk', 'Gdańsk', 1.12, 1500, '⚓', 'Nad Motławą stoi zabytkowy Żuraw.', 'The historic Crane stands by the Motława River.'],
    ['zakopane', 'Zakopane', 'Zakopane', 1.16, 1500, '🏔️', 'Zakopane leży u stóp Tatr.', 'Zakopane lies at the foot of the Tatra Mountains.'],
    ['wroclaw', 'Wrocław', 'Wrocław', 0.90, 2000, '🧙', 'Na ulicach Wrocławia można spotkać figurki krasnali.', 'You can find dwarf statues in the streets of Wrocław.'],
    ['poznan', 'Poznań', 'Poznań', 1.08, 3000, '🐐', 'Na ratuszu w Poznaniu codziennie pojawiają się koziołki.', 'Mechanical goats appear on Poznań City Hall every day.'],
    ['warszawa', 'Warszawa', 'Warsaw', 1.20, 3000, '🧜', 'Syrenka jest symbolem Warszawy i widnieje w jej herbie.', 'The mermaid is a symbol of Warsaw and appears on its coat of arms.'],
    ['malbork', 'Malbork', 'Malbork', 0.86, 4000, '🏰', 'W Malborku stoi średniowieczny zamek krzyżacki.', 'Malbork has a medieval Teutonic castle.']
  ].map(([id, pl, en, factor, unlockWorth, icon, factPl, factEn]) => ({
    id, name: [pl, en], factor, unlockWorth, icon, fact: [factPl, factEn]
  })),
  events: [
    ['fair', 'Targ przyciągnął klientów.', 'The fair brought customers.', 1.12],
    ['delivery', 'Nowa dostawa obniżyła ceny.', 'A new delivery lowered prices.', 0.88],
    ['quiet', 'Spokojny dzień na rynku.', 'A quiet day at the market.', 1]
  ].map(([id, pl, en, factor]) => ({ id, name: [pl, en], factor })),
  sponsors: [
    { id: 'lcse', name: 'LCSE.pl', logoText: 'LCSE.pl', approvedForChild: true }
  ]
};
