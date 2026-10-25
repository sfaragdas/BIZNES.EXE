// Retro shell: single-player menu, remembered age declaration and legacy-save preservation.
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
  const elements = {}, zeroTimers = [], legacyWrites = [], intervals = [];
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
    setTimeout(fn, delay) { if (!delay) zeroTimers.push(fn); return 0; }, setInterval(fn, delay) { intervals.push({fn,delay}); return intervals.length; }, clearInterval() {},
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
    store, context, el, legacyWrites, intervals, ui: context.BX2, engine: context.BiznesGame,
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
for (const action of ['new', 'cont', 'rec', 'set', 'help', 'age', 'install-app']) menuHas(shell, action);
assert.ok(shell.el('#mobile').innerHTML.includes('v2-row-primary'));
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

// Old profiles remain intact, but there is no profile creation or selection UI.
const familyDb=meta.emptyDb(),oldFirst=meta.addProfile(familyDb),oldSecond=meta.addProfile(familyDb);
oldFirst.slots.auto={state:meta.arm({...base(),cash:432},{level:'handlarz'}),date,at:1};
oldSecond.slots.auto={state:meta.arm({...base(),cash:876},{level:'kupiec'}),date,at:2};
oldFirst.records.handlarz=[{score:123,days:10,date}];familyDb.active=oldSecond.id;familyDb.legacy=true;
const family=bootShell(new Map([['bx2r-db',JSON.stringify(familyDb)]]));
assert.equal(family.db().profiles.length,2);
assert.equal(family.db().active,oldSecond.id);
family.ui.onAction('set');
assert.doesNotMatch(family.el('#terminal').innerHTML,/data-ui-action="(?:profiles|create|rename|use-)/);
family.ui.onAction('create');family.ui.onAction('use-'+oldFirst.id);
assert.equal(family.db().profiles.length,2);
assert.equal(family.db().active,oldSecond.id,'Removed actions cannot switch hidden legacy profiles');
family.ui.onAction('cont');family.flush();
assert.equal(family.engine.getS().cash,876,'Continue keeps the last active legacy game');
assert.equal(family.engine.getS().v2Level,'kupiec');
assert.deepEqual(family.db().profiles[0],familyDb.profiles[0],'Other legacy saves and records stay intact');

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
const betaRaw = JSON.stringify({ ...base(), day: 3 });
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

// A fresh day-1 BETA save is not imported; a played one is labelled as a BETA copy.
const trivial = bootShell(new Map([['bx-save', JSON.stringify(base())]]));
assert.equal(trivial.db().profiles[0].slots.auto, null, 'Untouched BETA saves are not imported');
assert.doesNotMatch(trivial.el('#mobile').innerHTML, /mobile-confirm/, 'Continue is not highlighted without a save');
const labelled = bootShell(new Map([['bx-save', JSON.stringify({ ...base(), day: 3 })]]));
assert.equal(labelled.db().profiles[0].slots.auto.beta, true);
assert.match(labelled.text(), /Zapis z BETA/);
assert.match(labelled.el('#mobile').innerHTML, /mobile-confirm/);
labelled.ui.onAction('new'); labelled.ui.onAction('level-handlarz');
assert.match(labelled.text(), /Oryginał w\s+BETA zostaje nietknięty/);

// Blocked storage keeps the game usable in memory and explains it.
const blockedStore = new Map();
const blocked = bootShell(blockedStore);
blocked.context.localStorage.setItem = () => { throw Error('QuotaExceededError'); };
blocked.ui.onAction('new'); blocked.ui.onAction('level-handlarz'); blocked.flush();
assert.equal(blocked.engine.getS().v2Level, 'handlarz');
assert.match(blocked.text(), /Nie można zapisać/);
blocked.ui.onAction('quit'); blocked.flush();

// Privacy page is reachable from Help; the wipe prompt says what it deletes.
const priv = bootShell();
priv.ui.onAction('about');
assert.match(priv.text(), /Polityka prywatności/);
priv.ui.onAction('privacy');
assert.equal(priv.context.location.href, 'privacy.html');
priv.ui.onAction('wipe');
assert.match(priv.text(), /także\s+zapisy\s+z\s+wcześniejszych\s+wersji/);
assert.ok(source('privacy.html').includes('Privacy policy') && !/https?:/.test(source('privacy.html')));
const manifest = JSON.parse(source('manifest.webmanifest'));
assert.ok(manifest.icons.some(i => i.purpose === 'maskable') && manifest.screenshots.length >= 2);
assert.ok(source('sw.js').includes('./privacy.html'));

const help = bootShell();
help.context.window = help.context;
let installMessage = '';
help.context.BiznesPWA = {
  status: () => 'Offline ready', message: () => installMessage,
  install() { installMessage = 'INSTALL_HELP_SENTINEL'; help.engine.render(false); }
};
help.ui.onAction('menu'); help.ui.onAction('install-app');
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
  for (const screen of ['menu', 'new', 'set', 'help', 'play', 'about', 'patrons', 'licenses', 'rec']) {
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
  layout.ui.onAction('back'); menuHas(layout, 'wipe');
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

// The three dock rows end with New game / Continue, including left-hand mode.
const dock=bootShell();
for(const hand of ['right','left']){
 dock.engine.setHand(hand);dock.ui.onAction('menu');
 const html=dock.el('#mobile').innerHTML;
 const rows=[...html.matchAll(/<div class="v2-row ([^"]+)">([\s\S]*?)<\/div>/g)];
 assert.equal(rows.length,3);
 const ids=rows.map(r=>[...r[2].matchAll(/data-ui-action="([^"]+)"/g)].map(m=>m[1]));
 assert.deepEqual(ids,[['age','help','install-app'],['rec','set'],['new','cont']]);
 assert.match(html,/mobile-manifest/);
 desktopRows(dock);
}
dock.ui.onAction('help');
for(const action of ['play','about','patrons','licenses'])menuHas(dock,action);
dock.ui.onAction('about');dock.ui.onAction('back');menuHas(dock,'play');
dock.ui.onAction('set');
assert.doesNotMatch(dock.el('#terminal').innerHTML,/data-ui-action="(?:profiles|play|about|patrons|licenses)"/);

// Age is a local declaration, never a game difficulty or a verified identity.
const age=bootShell(),ageApi=age.ui;
assert.equal(ageApi.adult(),false);
assert.doesNotMatch(age.el('#mobile').innerHTML,/href=/);
ageApi.onAction('age');desktopRows(age);
assert.equal(ageApi.adult(),false);
ageApi.onAction('back');
assert.equal(ageApi.adult(),false);
ageApi.onAction('age');ageApi.onAction('confirm-yes');
assert.equal(ageApi.adult(),true);
assert.equal(age.store.get('bx2r-adult'),'on');
assert.match(age.el('#mobile').innerHTML,/referrerpolicy="no-referrer"/);
assert.match(age.el('#terminal').innerHTML,/href="https:\/\/(?:lcse|mojedostawy|sejmpage).pl"/);
const restart=bootShell(age.store);
assert.equal(restart.ui.adult(),true);
restart.start('magnat');restart.flush();
const beforeAgeChange=clone(restart.engine.getS());
assert.match(restart.el('#mobile').innerHTML,/href=/);
restart.exit();restart.ui.onAction('age');
assert.equal(restart.ui.adult(),false);
assert.doesNotMatch(restart.el('#mobile').innerHTML,/href=/);
assert.deepEqual(restart.db().profiles[0].slots.auto.state,beforeAgeChange);
restart.ui.onAction('cont');restart.flush();
assert.doesNotMatch(restart.el('#mobile').innerHTML,/href=/);
assert.deepEqual(clone(restart.engine.getS()),meta.resumeState(beforeAgeChange,restart.db().profiles[0]),'Age does not change resumed game state');
assert.equal(bootShell(restart.store).ui.adult(),false);
assert.equal(source('style.css').includes("body[data-font='matrix']{--yellow:#00ff41}"),true);
console.log('PASS retro menu: dock rows, legacy saves, age confirmation/persistence, links, Help, levels, records and recovery.');


// Actual engine click routing must open install help, not silently leave the menu.
const installClicks=bootShell();let installationCalls=0,installationText='';
installClicks.context.BiznesPWA={
 status:()=> 'Offline ready',message:()=>installationText,
 install(){installationCalls++;installationText='INSTALL_FROM_CLICK';installClicks.engine.render(false);}
};
for(const root of ['#terminal','#mobile']){
 installClicks.ui.onAction('menu');
 installClicks.el(root).handlers.click({target:{closest(selector){return selector==='[data-ui-action]'?{dataset:{uiAction:'install-app'}}:null}}});
 assert.match(installClicks.text(),/INSTALL_FROM_CLICK/);
 assert.match(installClicks.el('#mobile').innerHTML,/INSTALL_FROM_CLICK/);
}
assert.equal(installationCalls,2,'Each actual click reaches installation exactly once');
installClicks.ui.onAction('menu');installClicks.ui.onKey('I');
assert.equal(installationCalls,3,'Keyboard uses the same path');

// Rotation covers all three patrons using distinct pairs and never changes game state.
const rotation=bootShell();
assert.deepEqual(Array.from(rotation.engine.sponsors(),p=>p[0]).sort(),['LCSE.pl','MojeDostawy.pl','SejmPage.pl']);
const seenPatrons=new Set(),pairs=new Set(),rotationTick=rotation.intervals.find(i=>i.delay===12000);
assert.ok(rotationTick,'A patron rotation timer is registered');
for(let i=0;i<3;i++){
 const names=Array.from(rotation.ui.patrons(),p=>p[0]);
 assert.equal(names.length,2);assert.equal(new Set(names).size,2);
 names.forEach(n=>seenPatrons.add(n));pairs.add(names.slice().sort().join('|'));
 rotationTick.fn();
}
assert.equal(seenPatrons.size,3);assert.equal(pairs.size,3);
const beforeHidden=JSON.stringify(rotation.ui.patrons());
rotation.context.document.hidden=true;rotationTick.fn();
assert.equal(JSON.stringify(rotation.ui.patrons()),beforeHidden);
rotation.context.document.hidden=false;rotation.start('magnat');rotation.flush();
const beforeRotation=clone(rotation.engine.getS());rotationTick.fn();
assert.deepEqual(clone(rotation.engine.getS()),beforeRotation,'UI rotation cannot change prices, inventory, seed or cash');
rotation.exit();rotation.ui.onAction('menu');
assert.match(rotation.text(),/Kupuj tanio/);
assert.match(rotation.text(),/Pożyczka/);
assert.match(rotation.el('#mobile').innerHTML,/v2-help-links/);
for(const action of ['play','about','patrons','licenses'])menuHas(rotation,action);
desktopRows(rotation);

// The grey panel is static; only the dedicated middle header slot rotates.
const fixedHeader=bootShell();
const staticPanel=html=>{
 const match=html.match(/data-static-patrons>([\s\S]*?)<\/span>/);
 assert.ok(match,'The welcome panel has a dedicated static patron list');
 return match[1];
};
const checkHeader=html=>{
 const first=html.split('\n')[0];
 assert.match(first,/class="terminal-row[^"]*desktop-header/);
 const brand=first.indexOf('class="header-brand');
 const middle=first.indexOf('class="header-patrons" data-patrons');
 const language=first.indexOf('class="header-language"');
 assert.ok(brand>=0&&middle>brand&&language>middle);
 assert.match(first,/>PL\/EN<\/button>/);
 assert.doesNotMatch(first,/Tiny economic game|Mała gra ekonomiczna|Small game\. Big business|Mała gra\. Wielki biznes/);
 return first;
};
for(const lang of ['pl','en']){
 fixedHeader.engine.setLang(lang);
 for(const style of ['current','retro','matrix']){
  fixedHeader.engine.setStyle(style);fixedHeader.ui.onAction('menu');
  const desktopStatic=staticPanel(fixedHeader.el('#terminal').innerHTML);
  const mobileStatic=staticPanel(fixedHeader.el('#mobile').innerHTML);
  for(const name of ['MojeDostawy.pl','LCSE.pl','SejmPage.pl']){
   assert.ok(desktopStatic.includes(name));assert.ok(mobileStatic.includes(name));
  }
  let liveHeader=checkHeader(fixedHeader.el('#terminal').innerHTML);
  const languageSlot=liveHeader.slice(liveHeader.indexOf('<span class="header-language"'));
  fixedHeader.context.document.querySelectorAll=selector=>selector==='[data-patrons]'?[{
   set innerHTML(value){liveHeader=liveHeader.replace(/(<span class="header-patrons" data-patrons>)[\s\S]*?(<\/span>)/,(_,open,close)=>open+value+close)}
  }]:[];
  fixedHeader.intervals.find(i=>i.delay===12000).fn();
  assert.equal(liveHeader.slice(liveHeader.indexOf('<span class="header-language"')),languageSlot,'Rotation cannot rewrite the language slot');
  fixedHeader.engine.render(false);
  assert.equal(staticPanel(fixedHeader.el('#terminal').innerHTML),desktopStatic);
  assert.equal(staticPanel(fixedHeader.el('#mobile').innerHTML),mobileStatic);
  checkHeader(fixedHeader.el('#terminal').innerHTML);desktopRows(fixedHeader);
 }
}
fixedHeader.start('magnat');fixedHeader.flush();
for(let i=0;i<6;i++){
 fixedHeader.intervals.find(i=>i.delay===12000).fn();
 fixedHeader.engine.render(false);
 checkHeader(fixedHeader.el('#terminal').innerHTML);desktopRows(fixedHeader);
}
assert.match(source('style.css'),/grid-template-columns:minmax\(0,1fr\) minmax\(0,2fr\) minmax\(0,1fr\)/);
console.log('PASS header: static grey-panel patrons, rotating middle slot and fixed language control in PL/EN and all styles.');
