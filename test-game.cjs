const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = file => fs.readFileSync(path.join(__dirname, file), 'utf8');
const classicKeys = {
  'bx-save': 'legacy classic save', 'bx-record': '99999',
  'bx-classic-save': 'current classic save', 'bx-classic-lang': 'pl'
};

function game(initial = {}) {
  const store = new Map(Object.entries({ ...classicKeys, ...initial }));
  const elements = new Map();
  const events = new Map();
  function element(selector) {
    if (!elements.has(selector)) {
      const classes = new Set();
      elements.set(selector, {
        _html: '', htmlWrites: 0, textContent: '', value: '1', checked: false,
        get innerHTML() { return this._html; },
        set innerHTML(value) { this._html = value; this.htmlWrites++; },
        classList: {
          contains: name => classes.has(name), add: name => classes.add(name),
          toggle(name, force) {
            if (force === undefined ? !classes.has(name) : force) classes.add(name);
            else classes.delete(name);
          }
        },
        addEventListener(name, callback) { this[name] = callback; }
      });
    }
    return elements.get(selector);
  }
  const document = {
    documentElement: { lang: 'pl' }, body: element('body'),
    querySelector: element, addEventListener() {}
  };
  const deterministicMath = Object.create(Math);
  deterministicMath.random = () => 0;
  const context = {
    document, Math: deterministicMath, Number, String, Object, JSON, setInterval() {},
    addEventListener(name, callback) { events.set(name, callback); },
    localStorage: {
      getItem: key => store.has(key) ? store.get(key) : null,
      setItem: (key, value) => store.set(key, String(value))
    }
  };
  context.globalThis = context;
  vm.runInNewContext(source('data/game-data.js'), context);
  const reload = () => vm.runInNewContext(source('game.js'), context);
  reload();
  const click = action => element('#app').click({ target: { closest: () => ({ dataset: { action } }) } });
  const html = () => element('#app').innerHTML;
  const state = () => JSON.parse(store.get('bx2-save'));
  return {
    store, context, element, click, html, state, reload,
    dispatch(name) { assert.ok(events.has(name), 'Registered event: ' + name); events.get(name)(); },
    start(id) { click('new'); click('start:' + id); },
    change(id, value) {
      element('#' + id).value = value;
      element('#app').change({ target: { id, value, checked: value === '1' } });
    },
    restore(saved) { store.set('bx2-save', JSON.stringify(saved)); reload(); click('continue'); },
    travel() {
      element('#destination').value = state().city === 'krakow' ? 'torun' : 'krakow';
      click('travel');
    },
    trade(action, id, quantity) {
      element('#' + (action.startsWith('share-') ? 'share-qty-' : 'qty-') + id).value = String(quantity);
      click(action + ':' + id);
    },
    loan(action, amount) { element('#loan-amount').value = String(amount); click(action); },
    price(id, shares = false) {
      const input = html().indexOf(`id="${shares ? 'share-qty-' : 'qty-'}${id}"`);
      assert.ok(input >= 0, 'The traded item must have a visible quantity input');
      const card = html().slice(html().lastIndexOf('class="trade-card', input), input);
      const match = card.match(/class="price">\s*(\d+)/);
      assert.ok(match, 'The card must display its current price');
      return Number(match[1]);
    },
    classicIntact() {
      for (const [key, value] of Object.entries(classicKeys)) assert.equal(store.get(key), value, key);
    }
  };
}

const child = game();
assert.match(child.html(), /Nowa gra/);
assert.doesNotMatch(child.element('#partner-strip').textContent, /href=/);
assert.equal(child.context.BX2_DATA.modes.length, 4);
assert.equal(child.context.BX2_DATA.goods.length, 9);
assert.equal(child.context.BX2_DATA.cities.length, 8);
for (const term of ['tobacco', 'tyton', 'weapon', 'bron', 'lottery', 'loteria', 'alcohol', 'alkohol']) {
  assert.doesNotMatch(JSON.stringify(child.context.BX2_DATA).toLowerCase(), new RegExp(term));
}
child.click('partners');
assert.match(child.html(), /LCSE.pl/);
assert.doesNotMatch(child.html(), /href=/);
child.click('new');
assert.doesNotMatch(child.html(), /Coming soon|Wkrótce/);
for (const id of ['child', 'teen', 'adult', 'advanced']) assert.match(child.html(), new RegExp('start:' + id));
child.start('child');
assert.equal(child.state().schema, 3);
assert.equal(child.state().cash, 1000);
assert.equal(child.state().day, 1);
assert.equal(child.state().unlockedGoods.length, 3);
assert.equal(child.state().unlockedCities.length, 2);
assert.doesNotMatch(child.html(), /Kredki|id="loan-amount"|share-qty-/);
const childStart = child.store.get('bx2-save');
child.loan('borrow', 100);
child.trade('share-buy', 'amber', 1);
child.trade('buy', 'scooters', 1);
assert.equal(child.store.get('bx2-save'), childStart, 'Unavailable mechanics and locked goods cannot be invoked');
child.trade('buy', 'apples', 2);
assert.equal(child.state().cargo.apples, 2);
for (const invalid of [0, -1, 1.5, 'NaN', 'Infinity', 10000, 9999]) {
  const before = child.store.get('bx2-save');
  child.trade('buy', 'apples', invalid);
  assert.equal(child.store.get('bx2-save'), before, 'Invalid or unaffordable goods trade');
}
child.trade('sell', 'apples', 1);
assert.equal(child.state().cargo.apples, 1);
assert.equal(child.state().taxPaid, 0);
child.click('menu');
child.click('settings');
const beforeLanguage = child.store.get('bx2-save');
child.change('language', 'en');
assert.equal(child.store.get('bx2-save'), beforeLanguage);
assert.match(child.html(), /Settings/);
child.change('theme', 'retro');
child.change('contrast', '1');
child.reload();
assert.equal(child.context.document.documentElement.lang, 'en');
assert.ok(child.element('body').classList.contains('retro'));
assert.ok(child.element('body').classList.contains('high-contrast'));
child.click('continue');
assert.match(child.html(), /Goal: 4000 coins/);

// Financial milestones unlock content permanently, even after wealth falls again.
for (const [cash, goods, cities] of [[1500, 4, 4], [2000, 6, 5], [3000, 8, 7], [4000, 9, 8]]) {
  child.restore({ ...child.state(), cash, cargo: {}, cargoCosts: {} });
  child.travel();
  assert.equal(child.state().unlockedGoods.length, goods);
  assert.equal(child.state().unlockedCities.length, cities);
}
child.restore({ ...child.state(), cash: 100, cargo: {}, cargoCosts: {} });
child.travel();
assert.equal(child.state().unlockedGoods.length, 9);
assert.equal(child.state().unlockedCities.length, 8);
child.classicIntact();

// Replacing an unfinished save requires the explicit confirmation for the chosen mode.
const reset = game({ 'bx2-record-teen': '4321' });
reset.start('teen');
reset.trade('buy', 'apples', 2);
const unfinished = reset.store.get('bx2-save');
reset.start('advanced');
assert.match(reset.html(), /data-action="confirm-start:advanced"/);
assert.equal(reset.store.get('bx2-save'), unfinished);
reset.click('confirm-start:adult');
assert.equal(reset.store.get('bx2-save'), unfinished, 'Confirmation cannot start a different mode');
reset.click('cancel-start');
assert.match(reset.html(), /data-action="start:advanced"/);
reset.click('continue');
assert.equal(reset.store.get('bx2-save'), unfinished);
reset.click('confirm-start:advanced');
assert.equal(reset.store.get('bx2-save'), unfinished, 'A stale confirmation cannot discard a round');
reset.start('advanced');
reset.click('confirm-start:advanced');
assert.equal(reset.state().mode, 'advanced');
assert.equal(reset.state().day, 1);
assert.equal(reset.state().cash, 2000);
assert.deepEqual(reset.state().cargo, {});
assert.equal(reset.store.get('bx2-record-teen'), '4321');
reset.classicIntact();

// An asynchronous offline/install status change must leave the active form in place.
const pwa = game();
pwa.start('teen');
pwa.element('#qty-apples').value = '17';
pwa.element('#loan-amount').value = '123';
pwa.element('#destination').value = 'torun';
const htmlWrites = pwa.element('#app').htmlWrites;
const pwaSave = pwa.store.get('bx2-save');
pwa.context.BiznesPWA = { status: () => 'Offline ready' };
pwa.dispatch('pwa-state');
assert.equal(pwa.element('#offline').textContent, 'Offline ready');
assert.equal(pwa.element('#app').htmlWrites, htmlWrites, 'Status updates cannot replace the active form DOM');
assert.equal(pwa.element('#qty-apples').value, '17');
assert.equal(pwa.element('#loan-amount').value, '123');
assert.equal(pwa.element('#destination').value, 'torun');
assert.equal(pwa.store.get('bx2-save'), pwaSave);

// Loans increase cash and liabilities together; interest runs only when a day ends.
for (const [id, limit, rate] of [['teen', 2000, 2], ['adult', 3000, 2], ['advanced', 4000, 3]]) {
  const g = game();
  g.start(id);
  assert.match(g.html(), /id="loan-amount"/);
  const startingCash = g.state().cash;
  for (const invalid of [0, -1, 1.5, 'NaN', 'Infinity', limit + 1]) {
    const before = g.store.get('bx2-save');
    g.loan('borrow', invalid);
    assert.equal(g.store.get('bx2-save'), before, id + ' invalid loan');
  }
  g.loan('borrow', limit);
  assert.equal(g.state().cash, startingCash + limit);
  assert.equal(g.state().debt, limit);
  assert.equal(g.state().taxPaid, 0, 'Borrowed principal is not taxable income');
  assert.equal(g.state().unlockedGoods.length, g.context.BX2_DATA.goods.filter(item => item.unlockWorth <= startingCash).length,
    'Borrowing does not unlock content by inflating net worth');
  const atCap = g.store.get('bx2-save');
  g.loan('borrow', 1);
  g.loan('repay', limit + 1);
  assert.equal(g.store.get('bx2-save'), atCap, 'Reject borrowing above cap and repayment above debt');
  g.loan('repay', limit - 101);
  assert.equal(g.state().debt, 101);
  assert.equal(g.state().cash, startingCash + 101);
  const beforeTravel = g.state();
  g.element('#destination').value = beforeTravel.city;
  g.click('travel');
  assert.deepEqual(g.state(), beforeTravel, 'An invalid destination cannot charge interest');
  g.travel();
  assert.equal(g.state().debt, 101 + Math.ceil(101 * rate / 100), 'Interest rounds up per day');
  assert.equal(g.state().cash, beforeTravel.cash, 'Interest adds debt instead of silently spending cash');
  const persisted = g.state();
  g.reload();
  g.click('continue');
  assert.deepEqual(g.state(), persisted, 'Reload preserves the whole financial position');
  g.loan('repay', g.state().debt);
  assert.equal(g.state().debt, 0);
  g.restore({ ...g.state(), cash: 0, debt: 101 });
  const broke = g.store.get('bx2-save');
  g.loan('repay', 1);
  assert.equal(g.store.get('bx2-save'), broke, 'Cannot repay with unavailable cash');
  g.classicIntact();
}

// Tax applies to realized gains, never gross sales, borrowing or unrealized appreciation.
for (const [id, taxRate] of [['teen', 0], ['adult', 15], ['advanced', 20]]) {
  const g = game();
  g.start(id);
  g.restore({ ...g.state(), market: 0.5 });
  const startingCash = g.state().cash;
  const buyPrice = g.price('apples');
  g.trade('buy', 'apples', 3);
  assert.equal(g.state().cash, startingCash - buyPrice * 3);
  assert.equal(g.state().cargoCosts.apples, buyPrice * 3);
  assert.equal(g.state().taxPaid, 0);
  g.restore({ ...g.state(), market: 1.5 });
  assert.equal(g.state().taxPaid, 0, 'Unrealized gains are untaxed');
  const sellPrice = g.price('apples');
  assert.ok(sellPrice > buyPrice);
  const tax = Math.floor((sellPrice - buyPrice) * 2 * taxRate / 100);
  const cashBeforeSale = g.state().cash;
  g.trade('sell', 'apples', 2);
  assert.equal(g.state().taxPaid, tax);
  assert.equal(g.state().cash, cashBeforeSale + sellPrice * 2 - tax);
  assert.equal(g.state().cargoCosts.apples, buyPrice);
  g.restore({ ...g.state(), market: 0.1 });
  const beforeLoss = g.state();
  const lossPrice = g.price('apples');
  assert.ok(lossPrice < buyPrice);
  g.trade('sell', 'apples', 1);
  assert.equal(g.state().taxPaid, beforeLoss.taxPaid, 'A losing sale neither charges tax nor creates a refund');
  assert.equal(g.state().cash, beforeLoss.cash + lossPrice);
  assert.equal(g.state().cargoCosts.apples || 0, 0);
  assert.equal(g.state().cargo.apples || 0, 0);
  if (!taxRate) continue;

  // A non-divisible basis must conserve all principal across partial and final sales.
  g.restore({ ...g.state(), market: 1 });
  const price = g.price('apples');
  g.restore({ ...g.state(), cargo: { apples: 3 }, cargoCosts: { apples: price * 3 - 11 }, taxPaid: 0 });
  g.trade('sell', 'apples', 1);
  assert.equal(g.state().cargoCosts.apples, price * 2 - 7);
  assert.equal(g.state().taxPaid, 0, 'Four coins of profit round down to zero tax');
  g.trade('sell', 'apples', 2);
  assert.equal(g.state().cargoCosts.apples || 0, 0);
  assert.equal(g.state().taxPaid, 1, 'The final sale consumes the complete remaining basis');
}

const shares = game();
shares.start('advanced');
assert.match(shares.html(), /share-qty-amber/);
const sharePrice = shares.price('amber', true);
const sharesCash = shares.state().cash;
shares.trade('share-buy', 'amber', 2);
assert.equal(shares.state().shares.amber, 2);
assert.equal(shares.state().shareCosts.amber, sharePrice * 2);
assert.equal(shares.state().cash, sharesCash - sharePrice * 2);
const sharesSaved = shares.state();
shares.reload();
shares.click('continue');
assert.deepEqual(shares.state(), sharesSaved);
for (const [action, id, amount] of [
  ['share-buy', 'unknown', 1], ['share-buy', 'amber', 0], ['share-buy', 'amber', -1],
  ['share-buy', 'amber', 1.5], ['share-buy', 'amber', 9999], ['share-sell', 'amber', 3]
]) {
  const before = shares.store.get('bx2-save');
  shares.trade(action, id, amount);
  assert.equal(shares.store.get('bx2-save'), before, 'Invalid share trades cannot change state');
}
shares.trade('share-sell', 'amber', 1);
assert.equal(shares.state().taxPaid, 0, 'Returning principal at an unchanged price is untaxed');
assert.equal(shares.state().shareCosts.amber, sharePrice);
assert.equal(shares.state().cash, sharesCash - sharePrice);
shares.travel();
assert.equal(shares.state().previousSharePrices.amber, sharePrice);
const repriced = shares.price('amber', true);
const beforeShareSale = shares.state();
const shareTax = Math.floor(Math.max(0, repriced - sharePrice) * 20 / 100);
shares.trade('share-sell', 'amber', 1);
assert.equal(shares.state().cash, beforeShareSale.cash + repriced - shareTax);
assert.equal(shares.state().taxPaid, shareTax);
assert.equal(shares.state().shareCosts.amber || 0, 0);
shares.restore({ ...shares.state(), market: 0.4 });
const riverPrice = shares.price('river', true);
shares.trade('share-buy', 'river', 2);
const taxBeforeAppreciation = shares.state().taxPaid;
shares.restore({ ...shares.state(), market: 1.5 });
assert.equal(shares.state().taxPaid, taxBeforeAppreciation);
const riverSalePrice = shares.price('river', true);
assert.ok(riverSalePrice > riverPrice);
const profitableSaleCash = shares.state().cash;
const riverTax = Math.floor((riverSalePrice - riverPrice) * 20 / 100);
assert.ok(riverTax > 0, 'The share scenario must exercise a taxable gain');
shares.trade('share-sell', 'river', 1);
assert.equal(shares.state().cash, profitableSaleCash + riverSalePrice - riverTax);
assert.equal(shares.state().taxPaid, taxBeforeAppreciation + riverTax);
assert.equal(shares.state().shareCosts.river, riverPrice);
shares.classicIntact();

// Every mode ends on its own final day, uses net assets and keeps an isolated record.
const rounds = game({ 'bx2-lang': 'en', 'bx2-record': '7777' });
for (const [id, days, goal, initialCash, rate] of [
  ['child', 14, 4000, 1000, 0], ['teen', 18, 6000, 1000, 2],
  ['adult', 21, 9000, 1500, 2], ['advanced', 24, 14000, 2000, 3]
]) {
  rounds.start(id);
  assert.equal(rounds.state().cash, initialCash);
  assert.match(rounds.html(), new RegExp('Goal: ' + goal + ' coins'));
  if (id !== 'child') rounds.loan('borrow', 100);
  while (rounds.state().day < days) rounds.travel();
  rounds.restore({ ...rounds.state(), cash: goal + 100 });
  const lastDay = rounds.state();
  const finalDebt = lastDay.debt + Math.ceil(lastDay.debt * rate / 100);
  rounds.travel();
  assert.equal(rounds.state().day, days + 1);
  assert.equal(rounds.state().finished, true);
  assert.equal(rounds.state().city, lastDay.city, 'Closing a round does not create a phantom trip');
  assert.equal(rounds.state().market, lastDay.market);
  assert.equal(rounds.state().debt, finalDebt);
  const score = goal + 100 - finalDebt;
  assert.match(rounds.html(), /Round complete/);
  assert.match(rounds.html(), new RegExp('Net worth: <strong>' + score + '</strong>'));
  assert.match(rounds.html(), score >= goal ? /Goal reached!/ : /Try again/);
  if (id === 'child') assert.match(rounds.html(), /Local best: 7777/, 'Old child record remains visible');
  else assert.equal(Number(rounds.store.get('bx2-record-' + id)), score);
  const endSave = rounds.store.get('bx2-save');
  rounds.trade('buy', 'apples', 1);
  rounds.loan('borrow', 1);
  rounds.trade('share-buy', 'amber', 1);
  rounds.travel();
  assert.equal(rounds.store.get('bx2-save'), endSave, 'Finished rounds reject financial actions');
  rounds.reload();
  rounds.click('continue');
  assert.match(rounds.html(), /Round complete/);
}
assert.equal(rounds.store.get('bx2-record'), '7777', 'Legacy child record is preserved');
assert.notEqual(rounds.store.get('bx2-record-teen'), rounds.store.get('bx2-record-adult'));
const teenRecord = rounds.store.get('bx2-record-teen');
rounds.start('child');
rounds.restore({ ...rounds.state(), day: 14, cash: 8000 });
rounds.travel();
assert.equal(rounds.store.get('bx2-record-child'), '8000');
assert.equal(rounds.store.get('bx2-record-teen'), teenRecord);
rounds.classicIntact();

// Held goods and shares retain final-day prices when the round closes.
const holdings = game({ 'bx2-lang': 'en' });
holdings.start('advanced');
holdings.restore({ ...holdings.state(), day: 24 });
holdings.trade('buy', 'apples', 2);
holdings.trade('share-buy', 'amber', 2);
holdings.loan('borrow', 101);
const finalHoldings = holdings.state();
const finalAssets = finalHoldings.cash + holdings.price('apples') * 2 + holdings.price('amber', true) * 2 - 105;
holdings.travel();
assert.equal(holdings.state().debt, 105);
assert.match(holdings.html(), new RegExp('Net worth: <strong>' + finalAssets + '</strong>'));
assert.equal(Number(holdings.store.get('bx2-record-advanced')), finalAssets);
assert.deepEqual(holdings.state().previousSharePrices, finalHoldings.previousSharePrices);

// Both published child save formats remain playable and are migrated without financial loss.
const fixture = game();
fixture.start('child');
fixture.trade('buy', 'apples', 2);
const modern = fixture.state();
for (const schema of [1, 2]) {
  const legacy = { ...modern, schema };
  for (const key of ['debt', 'taxPaid', 'cargoCosts', 'shares', 'shareCosts', 'previousSharePrices']) delete legacy[key];
  if (schema === 1) {
    delete legacy.unlockedGoods;
    delete legacy.unlockedCities;
    delete legacy.previousPrices;
    legacy.city = 'old-city';
  }
  const restored = game({ 'bx2-save': JSON.stringify(legacy) });
  assert.match(restored.html(), /data-action="continue"/);
  restored.click('continue');
  assert.equal(restored.state().schema, 3);
  assert.equal(restored.state().cash, modern.cash);
  assert.deepEqual(restored.state().cargo, modern.cargo);
  assert.equal(restored.state().day, modern.day);
  assert.equal(restored.state().debt, 0);
  restored.trade('sell', 'apples', 2);
  assert.equal(restored.state().cargo.apples || 0, 0);
  assert.equal(restored.state().taxPaid, 0);
  restored.classicIntact();
}

const malformed = [
  '{broken', 'null', '[]',
  ...[
    { schema: 99 }, { mode: 'unknown' }, { cash: -1 }, { cash: 1.5 },
    { day: 0 }, { day: 15, finished: false }, { day: 1, finished: true },
    { debt: -1 }, { debt: 1 }, { taxPaid: -1 }, { cargo: { unknown: 1 } },
    { cargo: { apples: -1 } }, { cargoCosts: { apples: -1 } },
    { shares: { amber: 1 } }, { shares: { unknown: 1 } },
    { shareCosts: { amber: -1 } }, { market: null },
    { previousPrices: { apples: -1 } }, { unlockedGoods: ['unknown'] }
  ].map(patch => JSON.stringify({ ...modern, ...patch }))
];
for (const saved of malformed) {
  const broken = game({ 'bx2-save': saved });
  assert.doesNotMatch(broken.html(), /data-action="continue"/, 'Reject malformed save: ' + saved);
  broken.start('child');
  assert.equal(broken.state().cash, 1000);
  broken.classicIntact();
}

assert.match(source('sw.js'), /biznes-2-offline-/);
assert.match(source('privacy.html'), /localStorage/);
console.log('BIZNES.EXE 2.0: child, loans, taxes, shares, rounds and save compatibility passed');
