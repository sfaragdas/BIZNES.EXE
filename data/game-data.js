globalThis.BX2_DATA = {
  modes: [
    {
      id: 'child', name: ['Dziecko', 'Child'], available: true,
      days: 14, goal: 4000, cash: 1000,
      goods: ['apples', 'bread', 'books', 'crayons', 'balls', 'bikes', 'kites', 'puzzles', 'scooters'],
      mechanics: [], loanLimit: 0, interestRate: 0, taxRate: 0, shares: [],
      description: ['Handel bez długu i podatku.', 'Trade without debt or tax.']
    },
    {
      id: 'teen', name: ['Nastolatek', 'Teen'], available: true,
      days: 18, cash: 1000, goal: 6000, mechanics: ['loan'],
      loanLimit: 2000, interestRate: 2, taxRate: 0, shares: [],
      description: ['Handel i pożyczka. Planuj spłatę oraz odsetki.', 'Trade and borrow. Plan repayments and interest.']
    },
    {
      id: 'adult', name: ['Dorosły', 'Adult'], available: true,
      days: 21, cash: 1500, goal: 9000, mechanics: ['loan', 'tax'],
      loanLimit: 3000, interestRate: 2, taxRate: 15, shares: [],
      description: ['Pożyczka i podatek od zysku przy sprzedaży.', 'Borrowing and tax on realized sale profits.']
    },
    {
      id: 'advanced', name: ['Zaawansowany', 'Advanced'], available: true,
      days: 24, cash: 2000, goal: 14000, mechanics: ['loan', 'tax', 'shares'],
      loanLimit: 4000, interestRate: 3, taxRate: 20, shares: ['amber', 'river', 'orbit'],
      description: ['Pożyczka, podatek i akcje fikcyjnych firm.', 'Borrowing, tax and shares in fictional companies.']
    }
  ],
  shares: [
    { id: 'amber', name: ['Bursztyn Studio', 'Amber Studio'], base: 75 },
    { id: 'river', name: ['Rzeka Energia', 'River Energy'], base: 120 },
    { id: 'orbit', name: ['Orbita Robotyka', 'Orbit Robotics'], base: 200 }
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
    ['torun', 'Toruń', 'Torun', 0.94, 1000, '🪐', 'W Toruniu urodził się Mikołaj Kopernik.', 'Nicolaus Copernicus was born in Torun.'],
    ['gdansk', 'Gdańsk', 'Gdansk', 1.12, 1500, '⚓', 'Nad Motławą stoi zabytkowy Żuraw.', 'The historic Crane stands by the Motława River.'],
    ['zakopane', 'Zakopane', 'Zakopane', 1.16, 1500, '🏔️', 'Zakopane leży u stóp Tatr.', 'Zakopane lies at the foot of the Tatra Mountains.'],
    ['wroclaw', 'Wrocław', 'Wroclaw', 0.90, 2000, '🧙', 'Na ulicach Wrocławia można spotkać figurki krasnali.', 'You can find dwarf statues in the streets of Wrocław.'],
    ['poznan', 'Poznań', 'Poznan', 1.08, 3000, '🐐', 'Na ratuszu w Poznaniu codziennie pojawiają się koziołki.', 'Mechanical goats appear on Poznań City Hall every day.'],
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
