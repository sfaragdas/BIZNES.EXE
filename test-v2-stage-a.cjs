// Simplified retro shell: levels, autosave, local profiles and automatic records.
// Run with Node; no browser or dependencies required.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const meta = require('./assets/v2meta.js');
const source = file => fs.readFileSync(path.join(__dirname, file), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
const date = '2026-10-22';
const base = () => ({
  schema: 2, cash: 1000, debt: 25000, day: 1, city: 0, debtRate: 5,
  rng: 123, seed: 123, alive: true, bank: 0,
  banks: Array(6).fill(0), cargo: Array(10).fill(0), shares: Array(10).fill(0),
  prices: [18, 14, 22, 9, 31, 75, 110, 160, 350, 240], stockPrices: Array(10).fill(100)
});

const profiles = meta.emptyDb();
const first = meta.addProfile(profiles);
assert.equal(first.name, 'Gracz 1');
assert.equal(profiles.active, first.id);
assert.deepEqual(first.slots, { auto: null });
for (const key of ['tier', 'birthYear', 'rank', 'pinHash', 'pinSalt']) assert.equal(Object.hasOwn(first, key), false);
for (let i = 2; i <= 4; i++) assert.equal(meta.addProfile(profiles).name, 'Gracz ' + i);
assert.equal(meta.addProfile(profiles), null);
assert.equal(profiles.profiles.length, 4);
assert.equal(meta.validDb(profiles), true);

const levels = [
  ['handlarz', 3000, 14, 4, 4, 0, false, 1000, 3],
  ['kupiec', 8000, 21, 6, 6, 0, true, 5000, 10],
  ['magnat', 50000, 40, 10, 9, 10, true, 25000, 30]
];
assert.deepEqual(meta.LEVELS.map(l => [l.id, l.goal, l.days, l.goods, l.cities, l.stocks, l.banks, l.debt, l.rate]), levels);
assert.equal(meta.nextLevel('handlarz'), 'kupiec');
assert.equal(meta.nextLevel('kupiec'), 'magnat');
assert.equal(meta.nextLevel('magnat'), null);
for (const [id, goal, days, goods, cities, stocks, banks, debt, rate] of levels) {
  const s = meta.arm(base(), { level: id });
  assert.equal(s.v2Level, id);
  assert.equal(s.debt, debt);
  assert.equal(s.v2Start, 1000 - debt);
  assert.equal(s.v2Goal, goal);
  assert.equal(s.v2Days, days);
  assert.equal(s.v2Goods, goods);
  assert.equal(s.v2Cities, cities);
  assert.equal(s.v2Stocks, stocks);
  assert.equal(s.v2Banks, banks);
  assert.ok(s.debtRate >= 1 && s.debtRate <= rate);
  assert.equal(meta.outcome(s).ended, false);
  s.cash += goal - 1;
  assert.equal(meta.outcome(s).ended, false, 'Goal measures profit, not gross cash');
  s.cash++;
  assert.equal(meta.outcome(s).promoted, true);
  assert.equal(meta.outcome(s).ended, true);
  const expired = meta.arm(base(), { level: id });
  expired.day = expired.v2Days + 1;
  assert.equal(meta.outcome(expired).expired, true);
  assert.equal(meta.outcome(expired).promoted, false);
  assert.deepEqual(meta.goodIndexes(undefined, goods), Array.from({ length: goods }, (_, i) => i));
  assert.ok(meta.goodIndexes(undefined, goods).includes(2), 'Cocoa remains available at every difficulty');
}

const assetState = base();
assetState.cash = 100; assetState.debt = 200; assetState.banks[0] = 300;
assetState.cargo[0] = 2; assetState.shares[0] = 10;
assert.equal(meta.wealth(assetState), 1236, 'Net wealth includes goods, shares, deposits and debt');
assert.equal(meta.wealth({ cash: 0, debt: 0, cargo: [], prices: [], banks: [], shares: [10], stockPrices: [100] }), 1000);
assert.equal(meta.validState(base()), true);
for (const patch of [{ cash: -1 }, { day: 0 }, { city: 9 }, { shares: [] }, { cargo: null }, { prices: [1] }, { banks: [] }, { rng: 1.5 }]) {
  assert.equal(meta.validState({ ...base(), ...patch }), false);
}

const recordProfile = meta.addProfile(meta.emptyDb());
for (let score = 0; score < 8; score++) meta.addRecord(recordProfile, 'handlarz', { score: score * 10, days: 14, date });
assert.deepEqual(meta.records(recordProfile, 'handlarz').map(r => r.score), [70, 60, 50, 40, 30]);
assert.equal(meta.addRecord(recordProfile, 'handlarz', { score: 20, days: 1, date }), false);
assert.equal(meta.addRecord(recordProfile, 'magnat', { score: 3000000000, days: 40, date, initials: 'ABC' }), true);
assert.equal(meta.records(recordProfile, 'magnat')[0].score, 3000000000);
assert.equal(Object.hasOwn(meta.records(recordProfile, 'magnat')[0], 'initials'), false);
assert.deepEqual(meta.records(recordProfile, 'kupiec'), []);
assert.equal(meta.addRecord(recordProfile, 'magnat', { score: Infinity, days: 40, date }), false);

function oldDatabase() {
  const db = meta.emptyDb(), p = meta.addProfile(db);
  db.v = 1; db.pinSalt = 'salt'; db.pinHash = 'hashed';
  Object.assign(p, { tier: 'adult', birthYear: 1990, rank: 'hurtownik', asked: true, dailyDone: { [date]: true } });
  p.slots = {
    auto: null,
    1: { state: { ...base(), cash: 111, day: 2 }, at: 1, date },
    2: { state: { ...base(), cash: 222, day: 3 }, at: 2, date },
    3: { state: { ...base(), cash: -1 }, at: 99, date }
  };
  p.records = { 'adult|hurtownik': [{ score: 9876, days: 20, date, initials: 'OLD' }] };
  p.roundResults = { previous: { recorded: true, result: { score: 9876, rank: 'hurtownik' } } };
  return db;
}
const old = oldDatabase(), original = clone(old), migrated = meta.migrate(old);
assert.deepEqual(old, original, 'Migration does not mutate the source recovery data');
assert.equal(migrated.v, 2);
assert.equal(meta.validDb(migrated), true);
for (const key of ['pinSalt', 'pinHash']) assert.equal(Object.hasOwn(migrated, key), false);
for (const key of ['tier', 'birthYear', 'rank', 'asked', 'dailyDone']) assert.equal(Object.hasOwn(migrated.profiles[0], key), false);
for (const slot of ['1', '2', '3']) assert.deepEqual(migrated.profiles[0].slots[slot], original.profiles[0].slots[slot]);
assert.equal(migrated.profiles[0].slots.auto.state.cash, 222, 'Only valid manual saves compete for missing autosave');
assert.deepEqual(migrated.profiles[0].records, original.profiles[0].records);
assert.deepEqual(migrated.profiles[0].roundResults, original.profiles[0].roundResults);
const hasAuto = oldDatabase();
hasAuto.profiles[0].slots.auto = { state: { ...base(), cash: 333 }, at: 0 };
assert.equal(meta.migrate(hasAuto).profiles[0].slots.auto.state.cash, 333, 'An existing autosave wins over newer manual slots');
assert.equal(meta.writeSlot(migrated.profiles[0], '1', base()), false, 'New UI writes only autosave');

const restricted = meta.arm(base(), { level: 'handlarz' });
restricted.cargo[8] = 3; restricted.shares[8] = 4; restricted.banks[0] = 50; restricted.city = 8;
const restored = meta.resumeState(restricted, first);
assert.equal(restored.cargo[8], 0);
assert.equal(restored.shares[8], 0);
assert.equal(restored.banks[0], 0);
assert.equal(restored.city, 0);
assert.equal(meta.wealth(restored), meta.wealth(restricted), 'Unavailable holdings convert at saved prices without losing assets');
assert.equal(meta.resumeState({ ...restricted, cargo: null }, first), null);

function bootShell(store = new Map()) {
  const elements = {}, zeroTimers = [], legacyWrites = [];
  function el(id) {
    if (!elements[id]) {
      const e = {
        textContent: '', dataset: {}, handlers: {}, style: { setProperty() {} },
        classList: { contains() { return false; } },
        addEventListener(name, callback) { this.handlers[name] = callback; }, close() {}
      };
      Object.defineProperty(e, 'innerHTML', {
        get() { return e.html || ''; },
        set(value) { e.html = String(value); e.textContent = e.html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&'); }
      });
      elements[id] = e;
    }
    return elements[id];
  }
  const context = {
    setTimeout(fn, delay) { if (!delay) zeroTimers.push(fn); return 0; }, setInterval: () => 0, clearInterval() {},
    console, Date, matchMedia: () => ({ matches: false }),
    document: { body: { dataset: {} }, hidden: false, activeElement: null, querySelector: el, querySelectorAll: () => [], addEventListener() {} },
    localStorage: {
      getItem: key => store.has(key) ? store.get(key) : null,
      setItem(key, value) {
        if (!String(key).startsWith('bx2r-')) legacyWrites.push(key);
        store.set(key, String(value));
      },
      removeItem() { throw Error('The shell must preserve unrelated browser data'); }
    },
    location: { protocol: 'file:' }, navigator: {}
  };
  vm.runInNewContext(['assets/v2meta.js', 'assets/v2ui.js', 'game.js'].map(source).join('\n'), context);
  return {
    store, context, el, legacyWrites, ui: context.BX2, engine: context.BiznesGame,
    db: () => JSON.parse(store.get('bx2r-db')),
    text: () => el('#terminal').textContent,
    flush() {
      let count = 0;
      while (zeroTimers.length) { assert.ok(count++ < 100, 'Result callbacks must settle'); zeroTimers.shift()(); }
    },
    start(level = 'handlarz') { context.BX2.onAction('new'); context.BX2.onAction('level-' + level); },
    exit() { context.BiznesGame.select('quit'); },
    finish(profit) {
      const s = context.BiznesGame.getS();
      s.cash += profit == null ? s.v2Goal : profit;
      context.BiznesGame.render();
      this.flush();
    }
  };
}
const menuHas = (shell, action) => assert.ok(shell.el('#terminal').innerHTML.includes(`data-ui-action="${action}"`), action);
const desktopRows = shell => assert.equal(shell.text().split('\n').length, 23, 'Desktop shell fits 23 terminal rows');
const shell = bootShell();
desktopRows(shell);
assert.equal(shell.db().profiles.length, 1);
assert.equal(shell.db().profiles[0].name, 'Gracz 1');
for (const action of ['new', 'cont', 'rec', 'set', 'help', 'about']) menuHas(shell, action);
assert.ok(shell.el('#mobile').innerHTML.includes('v2-row2'));
shell.ui.onAction('new');
for (const [id] of levels) menuHas(shell, 'level-' + id);
assert.doesNotMatch(shell.text(), /Rok urodzenia|PIN|inicjał|Rynek dnia|birth year|initials/i);
shell.ui.onAction('level-handlarz');
shell.flush();
assert.equal(shell.ui.playing, true);
assert.equal(shell.engine.getS().v2Level, 'handlarz');
assert.equal(shell.engine.getS().debt, 1000);
assert.match(shell.text(), /Kakao/);
assert.doesNotMatch(shell.text(), /Tyto[nń]|Tobacco|Tyton/i);
assert.doesNotMatch(shell.el('#terminal').innerHTML + shell.el('#mobile').innerHTML, /href=/);
let initialAuto = shell.db().profiles[0].slots.auto.state;
shell.exit();
shell.ui.onAction('cont');
shell.flush();
assert.equal(shell.ui.playing, true, 'Continue immediately resumes the active autosave');
assert.equal(shell.engine.getS().v2Round, initialAuto.v2Round);
assert.equal(shell.engine.getS().cash, initialAuto.cash);
initialAuto = shell.db().profiles[0].slots.auto.state;
shell.exit();
shell.start('magnat');
menuHas(shell, 'confirm-yes');
assert.deepEqual(shell.db().profiles[0].slots.auto.state, initialAuto, 'Level selection cannot silently replace an unfinished game');
shell.ui.onAction('back');
menuHas(shell, 'level-magnat');
assert.deepEqual(shell.db().profiles[0].slots.auto.state, initialAuto);
shell.ui.onAction('level-magnat');
shell.ui.onAction('confirm-yes');
shell.flush();
assert.equal(shell.engine.getS().v2Level, 'magnat');
assert.equal(shell.engine.getS().debt, 25000);
assert.notEqual(shell.engine.getS().v2Round, initialAuto.v2Round);

// A finish records itself before any initials or confirmation input.
const resultCase = bootShell();
resultCase.start(); resultCase.flush();
const prefinish = clone(resultCase.engine.getS());
prefinish.cash += prefinish.v2Goal;
resultCase.engine.getS().cash = prefinish.cash;
resultCase.engine.render(); resultCase.flush();
let resultProfile = resultCase.db().profiles[0];
assert.equal(resultCase.ui.playing, false);
assert.equal(resultProfile.records.handlarz.length, 1);
assert.equal(resultProfile.records.handlarz[0].score, 3000);
assert.equal(Object.hasOwn(resultProfile.records.handlarz[0], 'initials'), false);
assert.equal(resultProfile.slots.auto.state.v2Finished, true);
assert.equal(Object.keys(resultProfile.roundResults).length, 1);
desktopRows(resultCase);
assert.match(resultCase.text(), /3000|3 000/);
assert.doesNotMatch(resultCase.text(), /Trzy litery|initials|Rok urodzenia/i);
menuHas(resultCase, 'level-kupiec');
for (let reload = 0; reload < 3; reload++) {
  const db = resultCase.db();
  // This is the old manual snapshot being restored directly into the current autosave.
  db.profiles[0].slots.auto = { state: clone(prefinish), at: reload, date };
  resultCase.store.set('bx2r-db', JSON.stringify(db));
  const resumed = bootShell(resultCase.store);
  resumed.ui.onAction('cont'); resumed.flush();
  assert.equal(resumed.db().profiles[0].records.handlarz.length, 1, 'A pre-finish snapshot cannot enter records twice');
  assert.equal(Object.keys(resumed.db().profiles[0].roundResults).length, 1);
}
resultCase.ui.onAction('level-kupiec'); resultCase.flush();
assert.equal(resultCase.engine.getS().v2Level, 'kupiec');
assert.equal(resultCase.db().profiles[0].records.handlarz.length, 1);

// Old manual slots, personal fields, records and round ledgers survive the version change.
const oldRound = meta.arm(base(), { level: 'handlarz' });
oldRound.cash += oldRound.v2Goal;
oldRound.v2Rank = oldRound.v2Level; oldRound.v2Tier = 'child'; delete oldRound.v2Level;
const ledgerDb = oldDatabase(), ledgerProfile = ledgerDb.profiles[0];
const oldRoundId = meta.roundId(oldRound, ledgerProfile);
ledgerProfile.slots = { auto: null, 1: { state: clone(oldRound), at: 10, date } };
ledgerProfile.records = { 'child|handlarz': [{ score: 3000, days: 1, date, initials: 'OLD' }] };
ledgerProfile.roundResults = { [oldRoundId]: { recorded: true, result: { rank: 'handlarz', score: 3000, o: meta.outcome(oldRound) } } };
const legacyShell = bootShell(new Map([['bx2r-db', JSON.stringify(ledgerDb)]]));
assert.equal(legacyShell.db().v, 2);
assert.deepEqual(legacyShell.db().profiles[0].slots['1'], ledgerProfile.slots['1']);
legacyShell.ui.onAction('cont'); legacyShell.flush();
const afterLegacy = legacyShell.db().profiles[0];
assert.equal(afterLegacy.records['child|handlarz'].length, 1);
assert.equal(afterLegacy.records.handlarz, undefined, 'The old recorded round cannot be added to a new table again');
assert.equal(Object.keys(afterLegacy.roundResults).length, 1);
assert.equal(afterLegacy.slots.auto.state.v2Finished, true);
assert.equal(afterLegacy.slots.auto.state.v2Round, oldRoundId);
const pendingLedger = clone(ledgerDb);
pendingLedger.profiles[0].records = {};
pendingLedger.profiles[0].roundResults[oldRoundId].recorded = false;
const pendingResult = bootShell(new Map([['bx2r-db', JSON.stringify(pendingLedger)]]));
pendingResult.ui.onAction('cont'); pendingResult.flush();
assert.equal(pendingResult.db().profiles[0].records.handlarz.length, 1, 'An old result awaiting entry is recorded automatically');
assert.equal(pendingResult.db().profiles[0].roundResults[oldRoundId].recorded, true);
pendingResult.ui.onAction('cont'); pendingResult.flush();
assert.equal(pendingResult.db().profiles[0].records.handlarz.length, 1);

// Optional profiles keep their own saves, selected difficulty, records and completion ledger.
const family = bootShell(); family.start('handlarz'); family.flush();
family.engine.getS().cash = 432;
family.engine.render(); family.flush(); family.exit();
const firstFamily = clone(family.db().profiles[0]);
family.ui.onAction('set'); menuHas(family, 'profiles');
family.ui.onAction('profiles'); family.ui.onAction('create');
assert.equal(family.db().profiles.length, 2);
assert.equal(family.db().active, 'p2');
family.ui.onAction('menu'); family.ui.onAction('cont');
assert.equal(family.ui.playing, false, 'A new profile cannot resume another profile');
family.start('kupiec'); family.flush();
assert.equal(family.engine.getS().v2Level, 'kupiec');
family.finish();
assert.equal(family.db().profiles[1].records.kupiec.length, 1);
assert.deepEqual(family.db().profiles[0], firstFamily);
family.ui.onAction('set'); family.ui.onAction('profiles'); family.ui.onAction('use-p1');
family.ui.onAction('cont'); family.flush();
assert.equal(family.engine.getS().cash, 432);
assert.equal(family.engine.getS().v2Level, 'handlarz');
assert.deepEqual(family.db().profiles[0].records, {});

// Invalid data keeps a recovery copy and never blocks a fresh game.
for (const raw of ['{}', 'null', '{broken', '{"profiles":null}', '{"v":2,"seq":0,"profiles":[null]}']) {
  const recovered = bootShell(new Map([['bx2r-db', raw]]));
  assert.equal(recovered.store.get('bx2r-db-backup'), raw);
  assert.equal(recovered.db().profiles[0].name, 'Gracz 1');
  recovered.start(); recovered.flush();
  assert.equal(recovered.engine.getS().cash, 1000);
}
const badSlotDb = meta.emptyDb(), badSlotProfile = meta.addProfile(badSlotDb);
badSlotProfile.slots.auto = { state: { ...base(), cargo: null } };
badSlotProfile.records.handlarz = [{ score: 10, days: 14, date }];
const badSlot = bootShell(new Map([['bx2r-db', JSON.stringify(badSlotDb)]]));
badSlot.ui.onAction('cont');
assert.equal(badSlot.ui.playing, false);
assert.equal(badSlot.db().profiles[0].records.handlarz[0].score, 10);

// Legacy beta import is read-only; all new writes use the separate retro prefix.
const betaRaw = JSON.stringify(base());
const betaStore = new Map([['bx-save', betaRaw], ['bx-lang', 'en'], ['bx-style', 'matrix'], ['bx-hand', 'left']]);
const beta = bootShell(betaStore);
assert.equal(beta.db().profiles[0].slots.auto.state.cash, 1000);
beta.ui.onAction('cont'); beta.flush();
assert.equal(beta.engine.getS().v2Level, 'handlarz');
assert.equal(beta.engine.getS().v2Goods, 4);
assert.match(beta.text(), /Kakao|Cocoa/);
assert.doesNotMatch(beta.el('#terminal').innerHTML + beta.el('#mobile').innerHTML, /href=/);
beta.exit(); beta.ui.onAction('set'); beta.ui.onAction('language');
assert.equal(betaStore.get('bx-save'), betaRaw);
assert.equal(betaStore.get('bx-lang'), 'en');
assert.equal(betaStore.get('bx-style'), 'matrix');
assert.equal(betaStore.get('bx-hand'), 'left');
assert.deepEqual(beta.legacyWrites, [], 'Import and settings write exclusively to the retro prefix');

const help = bootShell();
help.context.window = help.context;
let installMessage = '';
help.context.BiznesPWA = {
  status: () => 'Offline ready', message: () => installMessage,
  install() { installMessage = 'INSTALL_HELP_SENTINEL'; help.engine.render(false); }
};
help.ui.onAction('set'); help.ui.onAction('install-app');
assert.ok(help.text().includes('INSTALL_HELP_SENTINEL'));
assert.ok(help.el('#mobile').innerHTML.includes('INSTALL_HELP_SENTINEL'));

// Full record tables and long instructions must not push actions beyond the terminal.
const layout = bootShell(), layoutDb = layout.db();
for (const [id] of levels) {
  for (let i = 1; i <= 5; i++) meta.addRecord(layoutDb.profiles[0], id, { score: 100000 + i, days: 40, date });
}
layout.store.set('bx2r-db', JSON.stringify(layoutDb));
for (const lang of ['pl', 'en']) {
  layout.engine.setLang(lang);
  for (const screen of ['menu', 'new', 'set', 'help', 'about', 'rec']) {
    layout.ui.onAction(screen); desktopRows(layout);
  }
  for (const [id] of levels) {
    layout.ui.onAction('record-' + id); desktopRows(layout);
    for (let i = 1; i <= 5; i++) assert.ok(layout.text().includes('100 00' + i), 'Every top-five record is visible');
  }
  layout.ui.onAction('set');
  const beforeStyle = layout.context.document.body.dataset.font;
  layout.ui.onAction('style');
  assert.notEqual(layout.context.document.body.dataset.font, beforeStyle, 'Changing style repaints immediately');
  layout.ui.onAction('wipe'); desktopRows(layout);
  layout.ui.onAction('back'); menuHas(layout, 'install-app');
  assert.deepEqual(layout.db().profiles[0].records, layoutDb.profiles[0].records, 'Cancelling deletion preserves records');
}

for (const [id] of levels) {
  const content = bootShell(); content.start(id); content.flush();
  assert.match(content.text(), /Kakao/);
  assert.doesNotMatch(content.text(), /Tyto[nń]|Tobacco|Tyton/i);
  assert.doesNotMatch(content.el('#terminal').innerHTML + content.el('#mobile').innerHTML, /href=/);
  const s = content.engine.getS();
  s.day = s.v2Days + 1;
  content.engine.render(); content.flush();
  assert.equal(content.db().profiles[0].records[id].length, 1, 'Day-limit losses are recorded automatically too');
  assert.equal(content.db().profiles[0].records[id][0].score, 0);
}

const sw = source('sw.js');
assert.match(sw, /biznes-2-retro-/);
assert.ok(sw.includes('assets/v2meta.js') && sw.includes('assets/v2ui.js'));
assert.equal(source('classic/game.js').includes('bx2r-'), false);
console.log('PASS simplified retro: three levels, autosave, confirmation, profiles, records, migration, dedupe, recovery, family content and install help.');
