const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const store = new Map();
const elements = new Map();

function element(selector) {
  if (!elements.has(selector)) {
    const classes = new Set();
    elements.set(selector, {
      innerHTML: '', textContent: '', value: '1', checked: false,
      classList: {
        contains: name => classes.has(name),
        add: name => classes.add(name),
        toggle: (name, force) => {
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
  documentElement: { lang: 'pl' },
  body: element('body'),
  querySelector: element,
  addEventListener() {}
};
const context = {
  globalThis: null, document, Math, Number, String, Object, JSON,
  localStorage: {
    getItem: key => store.get(key) || null,
    setItem: (key, value) => store.set(key, value)
  }
};
context.globalThis = context;
vm.runInNewContext(fs.readFileSync('data/game-data.js', 'utf8'), context);
vm.runInNewContext(fs.readFileSync('game.js', 'utf8'), context);

const click = action => element('#app').click({ target: { closest: () => ({ dataset: { action } }) } });
const change = (id, value) => {
  element('#' + id).value = value;
  element('#app').change({ target: { id, value, checked: value === '1' } });
};
const state = () => JSON.parse(store.get('bx2-save'));
const html = () => element('#app').innerHTML;

assert.match(html(), /Nowa gra/);
assert.doesNotMatch(element('#partner-strip').textContent, /href=/);
assert.equal(context.BX2_DATA.modes.length, 4);
assert.equal(context.BX2_DATA.goods.length, 9);
assert.equal(context.BX2_DATA.cities.length, 8);

for (const term of ['tobacco', 'tytoń', 'weapon', 'broń', 'lottery', 'loteria', 'alcohol', 'alkohol']) {
  assert.doesNotMatch(JSON.stringify(context.BX2_DATA).toLowerCase(), new RegExp(term));
}

click('partners');
assert.match(html(), /LCSE.pl/);
assert.doesNotMatch(html(), /href=/);
click('new');
assert.match(html(), /Wkrótce/);
click('start:teen');
assert.equal(store.has('bx2-save'), false);
click('start:child');
assert.equal(state().cash, 1000);
assert.equal(state().day, 1);
assert.equal(state().unlockedGoods.length, 3);
assert.equal(state().unlockedCities.length, 2);
assert.doesNotMatch(html(), /Kredki/);
assert.match(html(), /Cel: 4000 monet · masz 1000/);

element('#qty-apples').value = '2';
click('buy:apples');
assert.equal(state().cargo.apples, 2);
element('#qty-apples').value = '9999';
click('buy:apples');
assert.equal(state().cargo.apples, 2);
element('#qty-apples').value = '1';
click('sell:apples');
assert.equal(state().cargo.apples, 1);

click('menu');
click('settings');
const beforeLanguage = store.get('bx2-save');
change('language', 'en');
assert.equal(store.get('bx2-save'), beforeLanguage);
assert.match(html(), /Settings/);
change('theme', 'retro');
assert.equal(store.get('bx2-theme'), 'retro');
change('contrast', '1');
assert.equal(store.get('bx2-contrast'), '1');
click('continue');
assert.match(html(), /Goal: 4000 coins/);

// Force each financial threshold through a market repricing, then verify persistent unlocks.
for (const [threshold, goods, cities] of [[1500, 4, 4], [2000, 6, 5], [3000, 8, 7], [4000, 9, 8]]) {
  const saved = state();
  saved.cash = threshold;
  store.set('bx2-save', JSON.stringify(saved));
  vm.runInNewContext(fs.readFileSync('game.js', 'utf8'), {
    ...context,
    document,
    localStorage: context.localStorage
  });
  click('continue');
  element('#destination').value = saved.city === 'krakow' ? 'torun' : 'krakow';
  click('travel');
  assert.equal(state().unlockedGoods.length, goods);
  assert.equal(state().unlockedCities.length, cities);
  assert.ok(state().unlockedGoods.length <= 9);
  assert.ok(state().unlockedCities.length <= 8);
}

while (!state().finished) {
  element('#destination').value = state().city === 'krakow' ? 'torun' : 'krakow';
  click('travel');
}
assert.equal(state().day, 15);
assert.match(html(), /Round complete/);
assert.ok(Number(store.get('bx2-record')) >= 0);
assert.equal(store.has('bx-save'), false);

assert.match(fs.readFileSync('sw.js', 'utf8'), /biznes-2-offline-/);
assert.match(fs.readFileSync('privacy.html', 'utf8'), /localStorage/);
console.log('BIZNES.EXE 2.0: tests passed');
