(() => {
  'use strict';

  const data = globalThis.BX2_DATA;
  const app = document.querySelector('#app');
  const SAVE = 'bx2-save';
  const RECORD = 'bx2-record';
  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const write = (key, value) => { try { localStorage.setItem(key, value); return true; } catch { return false; } };
  let lang = read('bx2-lang') === 'en' ? 1 : 0;
  let screen = 'menu';
  let renderedScreen = '';
  let state = null;
  let message = '';
  let partnerIndex = 0;
  let pendingMode = null;

  const tr = (pl, en) => lang ? en : pl;
  const name = item => item.name[lang];
  const city = id => data.cities.find(item => item.id === id);
  const good = id => data.goods.find(item => item.id === id);
  const share = id => data.shares.find(item => item.id === id);
  const mode = id => data.modes.find(item => item.id === id);
  const has = mechanic => mode(state.mode).mechanics.includes(mechanic);
  const natural = value => Number.isSafeInteger(value) && value >= 0;
  const object = value => value && typeof value === 'object' && !Array.isArray(value);
  const ratio = (value, numerator, denominator, ceil = false) => Number(
    (BigInt(value) * BigInt(numerator) + (ceil ? BigInt(denominator - 1) : 0n)) / BigInt(denominator));
  const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));

  function fresh(id) {
    const selected = mode(id);
    return {
      schema: 3, mode: id, day: 1, cash: selected.cash,
      city: 'krakow', market: 1, cargo: {}, cargoCosts: {},
      debt: 0, taxPaid: 0, shares: {}, shareCosts: {}, previousSharePrices: {},
      seed: Math.floor(Math.random() * 1000000), trades: 0,
      finished: false,
      unlockedGoods: data.goods.filter(item => item.unlockWorth <= selected.cash).map(item => item.id),
      unlockedCities: data.cities.filter(item => item.unlockWorth <= selected.cash).map(item => item.id),
      previousPrices: {}
    };
  }

  function price(id, saved = state) {
    const item = good(id);
    const day = Math.min(saved.day, mode(saved.mode).days);
    return Math.max(1, Math.round(item.base * city(saved.city).factor * saved.market *
      (((saved.seed % 9 + day * 17 + item.base * 13) % 9 + 6) / 10)));
  }

  function sharePrice(id, saved = state) {
    const item = share(id);
    const day = Math.min(saved.day, mode(saved.mode).days);
    return Math.max(1, Math.round(item.base * saved.market *
      (((saved.seed % 17 + day * 7 + item.base * 3) % 17 + 4) / 10)));
  }

  function gross(saved = state) {
    return saved.cash + Object.entries(saved.cargo).reduce((sum, [id, quantity]) => sum + quantity * price(id, saved), 0) +
      Object.entries(saved.shares).reduce((sum, [id, quantity]) => sum + quantity * sharePrice(id, saved), 0);
  }

  function worth() { return gross() - state.debt; }

  function valid(saved) {
    const selected = saved && mode(saved.mode);
    if (!selected?.available || saved.schema !== 3 ||
      !Number.isInteger(saved.day) || saved.day < 1 || saved.day > selected.days + 1 ||
      typeof saved.finished !== 'boolean' || saved.finished !== (saved.day === selected.days + 1) ||
      !natural(saved.cash) || !city(saved.city) || !natural(saved.seed) || !natural(saved.trades) ||
      !Number.isFinite(saved.market) || saved.market <= 0 || saved.market >= 2 ||
      !natural(saved.debt) || !natural(saved.taxPaid) ||
      (!selected.mechanics.includes('loan') && saved.debt !== 0) ||
      (!selected.mechanics.includes('tax') && saved.taxPaid !== 0)) return false;
    const ids = (list, lookup) => Array.isArray(list) && list.length > 0 &&
      new Set(list).size === list.length && list.every(id => lookup(id));
    const quantities = (values, lookup) => object(values) && Object.entries(values).every(([id, quantity]) => lookup(id) && natural(quantity));
    const prices = (values, lookup) => object(values) && Object.entries(values).every(([id, value]) => lookup(id) && natural(value) && value > 0);
    const costs = (values, quantities) => object(values) &&
      Object.entries(values).every(([id, value]) => Object.hasOwn(quantities, id) && natural(value) && (quantities[id] > 0 || value === 0)) &&
      Object.keys(quantities).every(id => Object.hasOwn(values, id));
    if (!ids(saved.unlockedGoods, good) || !ids(saved.unlockedCities, city) || !saved.unlockedCities.includes(saved.city) ||
      !quantities(saved.cargo, good) || !quantities(saved.shares, id => selected.shares.includes(id) && share(id)) ||
      !Object.keys(saved.cargo).every(id => saved.unlockedGoods.includes(id)) ||
      !costs(saved.cargoCosts, saved.cargo) || !costs(saved.shareCosts, saved.shares) ||
      !prices(saved.previousPrices, good) || !prices(saved.previousSharePrices, id => selected.shares.includes(id))) return false;
    return natural(gross(saved));
  }

  try {
    let saved = JSON.parse(read(SAVE));
    if ((saved?.schema === 1 || saved?.schema === 2) && saved.mode === 'child') {
      const originalSchema = saved.schema;
      saved = {
        ...saved, schema: 3, debt: 0, taxPaid: 0, shares: {}, shareCosts: {}, previousSharePrices: {},
        cargoCosts: Object.fromEntries(Object.keys(saved.cargo || {}).map(id => [id, 0]))
      };
      if (originalSchema === 1) {
        saved.city = city(saved.city) ? saved.city : 'krakow';
        saved.unlockedGoods = [...new Set([...data.goods.filter(item => item.unlockWorth <= 1000).map(item => item.id), ...Object.keys(saved.cargo || {})])];
        saved.unlockedCities = [...new Set(['krakow', 'torun', saved.city])];
        saved.previousPrices = {};
      }
      if (valid(saved)) write(SAVE, JSON.stringify(saved));
    }
    if (valid(saved)) state = saved;
  } catch { /* A damaged local save starts a new game. */ }

  function save() {
    if (!write(SAVE, JSON.stringify(state))) message = tr('Nie udało się zapisać gry.', 'Could not save the game.');
  }

  function record(id = state.mode) {
    const parse = key => { const value = Number(read(key)); return natural(value) ? value : 0; };
    return Math.max(parse(`${RECORD}-${id}`), id === 'child' ? parse(RECORD) : 0);
  }

  function unlock() {
    const currentWorth = worth();
    const announcements = [];
    for (const item of data.goods) {
      if (currentWorth >= item.unlockWorth && !state.unlockedGoods.includes(item.id)) {
        state.unlockedGoods.push(item.id);
        announcements.push(tr('Nowy towar w sprzedaży: ', 'New good for sale: ') + name(item) + '!');
      }
    }
    for (const item of data.cities) {
      if (currentWorth >= item.unlockWorth && !state.unlockedCities.includes(item.id)) {
        state.unlockedCities.push(item.id);
        announcements.push(tr('Możesz teraz pojechać do ', 'You can now travel to ') + name(item) + '!');
      }
    }
    return announcements;
  }

  function button(label, action, className = '') {
    return `<button type="button" class="${className}" data-action="${action}">${escapeHtml(label)}</button>`;
  }

  function rules(selected) {
    return `<p>${selected.days} ${tr('dni', 'days')} · ${tr('Start', 'Start')}: ${selected.cash} · ${tr('Cel', 'Goal')}: ${selected.goal}</p>
      <p>${escapeHtml(selected.description[lang])}</p>
      ${selected.loanLimit ? `<p>${tr('Limit pożyczki', 'Loan limit')}: ${selected.loanLimit}. ${tr('Odsetki za każdy zakończony dzień', 'Interest per completed day')}: ${selected.interestRate}% ${tr('(zaokrąglone w górę, doliczane do długu).', '(rounded up, added to debt).')}</p>` : ''}
      ${selected.taxRate ? `<p>${tr('Podatek', 'Tax')}: ${selected.taxRate}% ${tr('dodatniego zysku każdej sprzedaży, zaokrąglony w dół. Koszt zakupu rozliczamy proporcjonalnie; straty nie pomniejszają podatku.', 'of each positive realized sale profit, rounded down. Purchase cost is allocated proportionally; losses do not offset tax.')}</p>` : ''}
      ${selected.shares.length ? `<p>${tr('Akcje są fikcyjne; ich ceny mogą rosnąć i spadać. Brak dywidend i opłat. Podatek obejmuje też zysk z akcji.', 'Shares are fictional; prices can rise or fall. No dividends or fees. Share profits are also taxed.')}</p>` : ''}`;
  }

  function renderMenu() {
    app.innerHTML = `<section class="panel menu-panel">
      <h1>BIZNES.EXE 2.0</h1>
      <p>${tr('Kupuj, sprzedawaj i odkrywaj polskie miasta.', 'Buy, sell and discover Polish cities.')}</p>
      <div class="menu-list">
        ${button(tr('Nowa gra', 'New game'), 'new')}
        ${state ? button(tr('Kontynuuj', 'Continue'), 'continue') : ''}
        ${button(tr('Ustawienia', 'Settings'), 'settings')}
        ${button(tr('Jak grać', 'How to play'), 'help')}
        ${button(tr('Partnerzy', 'Partners'), 'partners')}
        ${globalThis.BiznesPWA?.install ? button(tr('Zainstaluj grę', 'Install game'), 'install') : ''}
        <a class="menu-link" href="privacy.html">${tr('Prywatność', 'Privacy')}</a>
      </div>
      <p class="notice" role="status">${escapeHtml(globalThis.BiznesPWA?.message?.(lang ? 'en' : 'pl') || message)}</p>
    </section>`;
  }

  function renderNew() {
    app.innerHTML = `<section class="panel"><h1>${tr('Nowa gra', 'New game')}</h1>
      <p>${tr('Poziom wybierasz na całą rundę.', 'Choose the level for the whole round.')}</p>
      <div class="mode-grid">${data.modes.map(item => `<article class="mode-card">
        <h2>${escapeHtml(name(item))}</h2><div class="mode-rules">${rules(item)}</div>
        <p>${tr('Rekord lokalny', 'Local best')}: ${record(item.id)}</p>
        ${item.available ? button(tr('Graj', 'Play'), 'start:' + item.id) : ''}
      </article>`).join('')}</div>${button(tr('Wróć', 'Back'), 'menu', 'secondary')}</section>`;
  }

  function renderConfirm() {
    app.innerHTML = `<section class="panel"><h1>${tr('Zastąpić trwającą rundę?', 'Replace the current round?')}</h1>
      <p>${tr('Rozpoczęcie nowej gry usunie zapis trwającej rundy. Rekordy pozostaną.', 'Starting a new game replaces the unfinished round. Your records stay.')}</p>
      ${button(tr('Rozpocznij nową rundę', 'Start new round'), 'confirm-start:' + pendingMode)}
      ${button(tr('Zachowaj trwającą rundę', 'Keep current round'), 'cancel-start', 'secondary')}</section>`;
  }

  function renderSettings() {
    app.innerHTML = `<section class="panel"><h1>${tr('Ustawienia', 'Settings')}</h1>
      <div class="settings-list">
        <label for="language">${tr('Język', 'Language')}</label>
        <select id="language"><option value="pl" ${lang ? '' : 'selected'}>Polski</option><option value="en" ${lang ? 'selected' : ''}>English</option></select>
        <label for="contrast">${tr('Wysoki kontrast', 'High contrast')}</label>
        <input id="contrast" type="checkbox" ${document.body.classList.contains('high-contrast') ? 'checked' : ''}>
        <label for="theme">${tr('Styl', 'Style')}</label>
        <select id="theme"><option value="breeze" ${document.body.classList.contains('retro') ? '' : 'selected'}>${tr('Morska bryza', 'Sea breeze')}</option>
          <option value="retro" ${document.body.classList.contains('retro') ? 'selected' : ''}>Retro DOS</option></select>
      </div><p class="notice" role="status">${escapeHtml(message)}</p>${button(tr('Wróć', 'Back'), 'menu', 'secondary')}</section>`;
  }

  function renderHelp() {
    app.innerHTML = `<section class="panel"><h1>${tr('Jak grać', 'How to play')}</h1>
      <p>${tr('Kup towar w jednym mieście i sprzedaj go drożej w innym. Podróż kończy dzień i zmienia ceny. Ostatniego dnia kończysz rundę bez kolejnej zmiany cen.', 'Buy goods in one city and sell them for more in another. Travel ends the day and changes prices. On the last day you finish the round without another price change.')}</p>
      <p>${tr('Majątek = gotówka + wartość towarów i akcji - dług. Rosnący majątek trwale odblokowuje towary i miasta. Sama pożyczka nie zwiększa majątku.', 'Net worth = cash + current goods and share value - debt. Growing net worth permanently unlocks goods and cities. Borrowing alone does not increase net worth.')}</p>
      <p>${tr('Cel sprawdzamy po ostatnim dniu, po doliczeniu odsetek. Nie trzeba sprzedawać całego zapasu. Nie ma licznika czasu na ruch.', 'The goal is checked after the last day, after interest. You do not have to sell all holdings. There is no move timer.')}</p>
      ${data.modes.map(item => `<article class="mode-rules"><h2>${escapeHtml(name(item))}</h2>${rules(item)}</article>`).join('')}
      ${button(tr('Wróć', 'Back'), 'menu', 'secondary')}</section>`;
  }

  function renderPartners() {
    const partners = data.sponsors.filter(item => item.approvedForChild);
    app.innerHTML = `<section class="panel"><h1>${tr('Partnerzy', 'Partners')}</h1>
      <ul>${partners.map(item => `<li>${escapeHtml(item.name)}</li>`).join('')}</ul>
      ${button(tr('Wróć', 'Back'), 'menu', 'secondary')}</section>`;
  }

  function direction(current, previous) {
    if (previous == null || previous === current) return '';
    return current > previous ? `<span class="rise" aria-label="${tr('wzrost', 'increase')}">↑</span>` :
      `<span class="fall" aria-label="${tr('spadek', 'decrease')}">↓</span>`;
  }

  function renderFinance() {
    if (!has('loan')) return '';
    const selected = mode(state.mode);
    return `<section class="finance-panel" aria-labelledby="finance-title"><h2 id="finance-title">${tr('Finanse', 'Finances')}</h2>
      <p class="finance-stats">${tr('Dług', 'Debt')}: <strong>${state.debt}</strong> · ${tr('Limit pożyczki', 'Loan limit')}: ${selected.loanLimit} · ${tr('Odsetki za dzień', 'Daily interest')}: ${selected.interestRate}%</p>
      <p>${tr('Odsetki zaokrąglamy w górę i doliczamy do długu po każdym dniu, także ostatnim. Spłacaj przed podróżą, aby ich uniknąć.', 'Interest is rounded up and added to debt after every day, including the last. Repay before traveling to avoid it.')}</p>
      <div class="finance-controls"><label for="loan-amount">${tr('Kwota', 'Amount')}</label>
        <input id="loan-amount" type="number" inputmode="numeric" min="1" max="9999" step="1" value="1">
        ${button(tr('Pożycz', 'Borrow'), 'borrow')}${button(tr('Spłać', 'Repay'), 'repay', 'secondary')}</div>
      ${has('tax') ? `<p>${tr('Zapłacony podatek', 'Tax paid')}: <strong>${state.taxPaid}</strong> · ${selected.taxRate}% ${tr('zysku przy sprzedaży. Podatek nie obejmuje zwrotu kosztu zakupu ani pożyczki.', 'of realized sale profit. Purchase principal and loans are not taxed.')}</p>` : ''}
    </section>`;
  }

  function renderShares() {
    if (!has('shares')) return '';
    return `<section class="finance-panel" aria-labelledby="shares-title"><h2 id="shares-title">${tr('Akcje fikcyjnych firm', 'Fictional company shares')}</h2>
      <p>${tr('Ceny zmieniają się tylko po podróży. Wartość akcji może spaść. Zysk przy sprzedaży podlega podatkowi.', 'Prices change only after travel. Shares can lose value. Realized sale profits are taxed.')}</p>
      <div class="stocks-grid">${data.shares.filter(item => mode(state.mode).shares.includes(item.id)).map(item => `<div class="trade-card stock-card"><div><strong>${escapeHtml(name(item))}</strong>
        <span class="price">${sharePrice(item.id)} ${direction(sharePrice(item.id), state.previousSharePrices[item.id])}</span>
        <small>${tr('Masz', 'Owned')}: ${state.shares[item.id] || 0}</small></div>
        <div class="trade-controls"><label for="share-qty-${item.id}">${tr('Ilość', 'Quantity')}</label>
          <input id="share-qty-${item.id}" type="number" inputmode="numeric" min="1" max="9999" step="1" value="1">
          ${button(tr('Sprzedaj', 'Sell'), 'share-sell:' + item.id, 'secondary')}${button(tr('Kup', 'Buy'), 'share-buy:' + item.id, 'buy')}</div></div>`).join('')}</div></section>`;
  }

  function renderGame() {
    const selected = mode(state.mode);
    const total = worth();
    if (state.finished) {
      app.innerHTML = `<section class="panel"><h1>${tr('Koniec rundy', 'Round complete')}</h1>
        <p>${escapeHtml(name(selected))} · ${selected.days} ${tr('dni', 'days')}</p>
        <p>${tr('Majątek', 'Net worth')}: <strong>${total}</strong> · ${tr('Cel', 'Goal')}: ${selected.goal}</p>
        ${has('loan') ? `<p>${tr('Dług uwzględniony w wyniku', 'Debt included in score')}: ${state.debt}</p>` : ''}
        ${has('tax') ? `<p>${tr('Zapłacony podatek', 'Tax paid')}: ${state.taxPaid}</p>` : ''}
        <p>${total >= selected.goal ? tr('Cel osiągnięty!', 'Goal reached!') : tr('Spróbuj ponownie.', 'Try again.')}</p>
        <p>${tr('Rekord lokalny', 'Local best')}: ${record()}</p>
        <p class="notice" role="status">${escapeHtml(message)}</p>
        ${button(tr('Nowa gra', 'New game'), 'new')} ${button(tr('Menu', 'Menu'), 'menu', 'secondary')}</section>`;
      return;
    }
    const rows = data.goods.filter(item => state.unlockedGoods.includes(item.id)).map(item => {
      const current = price(item.id);
      return `<div class="trade-card"><div><strong>${escapeHtml(name(item))}</strong>
        <span class="price">${current} ${direction(current, state.previousPrices[item.id])}</span>
        <small>${tr('Masz', 'Owned')}: ${state.cargo[item.id] || 0}</small></div>
        <div class="trade-controls"><label for="qty-${item.id}">${tr('Ilość', 'Quantity')}</label>
          <input id="qty-${item.id}" type="number" inputmode="numeric" min="1" max="9999" step="1" value="1">
          ${button(tr('Sprzedaj', 'Sell'), 'sell:' + item.id, 'secondary')}
          ${button(tr('Kup', 'Buy'), 'buy:' + item.id, 'buy')}</div></div>`;
    }).join('');
    app.innerHTML = `<section class="panel"><h1>${escapeHtml(name(city(state.city)))}</h1>
      <p>${escapeHtml(name(selected))} · ${tr('Dzień', 'Day')} ${state.day}/${selected.days}</p>
      <p class="city-fact">${city(state.city).icon} ${escapeHtml(city(state.city).fact[lang])}</p>
      <p>${tr('Gotówka', 'Cash')}: <strong>${state.cash}</strong></p>
      <label for="progress">${tr('Cel', 'Goal')}: ${selected.goal} ${tr('monet', 'coins')} · ${tr('masz', 'you have')} ${total}</label>
      <progress id="progress" max="${selected.goal}" value="${Math.max(0, Math.min(total, selected.goal))}"></progress>
      <p class="notice" role="status">${escapeHtml(message)}</p>
      <div class="goods-grid">${rows}</div>${renderFinance()}${renderShares()}
      <div class="travel"><label for="destination">${tr('Dokąd jedziesz?', 'Where next?')}</label>
        <select id="destination">${data.cities.filter(item => item.id !== state.city && state.unlockedCities.includes(item.id))
          .map(item => `<option value="${item.id}">${escapeHtml(name(item))}</option>`).join('')}</select>
        ${button(state.day === selected.days ? tr('Zakończ rundę', 'Finish round') : tr('Jedz dalej', 'Travel on'), 'travel', 'travel-button')}</div>
    </section>`;
  }

  function renderPartner() {
    const partners = data.sponsors.filter(item => item.approvedForChild);
    const strip = document.querySelector('#partner-strip');
    strip.textContent = partners.length ? `${tr('Partner', 'Partner')}: ${partners[partnerIndex % partners.length].logoText}` : '';
  }

  function render() {
    const active = document.activeElement;
    const focusId = active?.id;
    const focusAction = active?.dataset?.action;
    const changedScreen = renderedScreen !== screen;
    document.documentElement.lang = lang ? 'en' : 'pl';
    document.querySelector('#menu-button').textContent = tr('? Menu', '? Menu');
    document.querySelector('#location').textContent = state && screen === 'game' ?
      `${name(city(state.city))} · ${tr('dzień', 'day')} ${Math.min(state.day, mode(state.mode).days)}/${mode(state.mode).days}` : 'BIZNES.EXE 2.0';
    document.querySelector('#offline').textContent = globalThis.BiznesPWA?.status(lang ? 'en' : 'pl') || tr('Gra lokalna', 'Local game');
    ({ menu: renderMenu, new: renderNew, settings: renderSettings, help: renderHelp,
      partners: renderPartners, game: renderGame, confirm: renderConfirm })[screen]();
    renderPartner();
    if (changedScreen) {
      const heading = app.querySelector?.('h1');
      heading?.setAttribute('tabindex', '-1');
      heading?.focus();
    } else if (focusId) document.getElementById?.(focusId)?.focus();
    else if (focusAction) app.querySelector?.(`[data-action="${focusAction}"]`)?.focus();
    renderedScreen = screen;
  }

  function reject(text) { message = text; render(); }

  function trade(kind, id, shares = false) {
    if (shares ? !has('shares') || !mode(state.mode).shares.includes(id) : !state.unlockedGoods.includes(id)) return;
    const quantity = Number(document.querySelector(shares ? `#share-qty-${id}` : `#qty-${id}`)?.value);
    if (!natural(quantity) || quantity < 1 || quantity > 9999) return reject(tr('Wpisz poprawną ilość.', 'Enter a valid quantity.'));
    const holdings = shares ? state.shares : state.cargo;
    const costs = shares ? state.shareCosts : state.cargoCosts;
    const cost = (shares ? sharePrice(id) : price(id)) * quantity;
    const owned = holdings[id] || 0;
    const basis = costs[id] || 0;
    if (kind === 'buy' && cost > state.cash || kind === 'sell' && quantity > owned) {
      return reject(kind === 'buy' ? tr('Za mało gotówki.', 'Not enough cash.') : tr('Za mało towaru lub akcji.', 'Not enough goods or shares.'));
    }
    const allocated = kind === 'sell' ? ratio(basis, quantity, owned) : 0;
    const tax = kind === 'sell' && has('tax') ? ratio(Math.max(0, cost - allocated), mode(state.mode).taxRate, 100) : 0;
    const nextCash = state.cash + (kind === 'buy' ? -cost : cost - tax);
    const nextOwned = owned + (kind === 'buy' ? quantity : -quantity);
    const nextBasis = kind === 'buy' ? basis + cost : basis - allocated;
    if (![cost, nextCash, nextOwned, nextBasis, state.taxPaid + tax, state.trades + 1].every(natural)) {
      return reject(tr('Ta operacja przekracza bezpieczny limit liczb.', 'This action exceeds the safe number limit.'));
    }
    state.cash = nextCash;
    holdings[id] = nextOwned;
    costs[id] = nextBasis;
    state.taxPaid += tax;
    state.trades++;
    message = [kind === 'buy' ? tr('Kupiono.', 'Bought.') : tr('Sprzedano.', 'Sold.'),
      ...(tax ? [tr('Podatek: ', 'Tax: ') + tax + '.'] : []), ...unlock()].join(' ');
    save();
    render();
  }

  function loan(kind) {
    if (!has('loan')) return;
    const amount = Number(document.querySelector('#loan-amount')?.value);
    if (!natural(amount) || amount < 1 || amount > 9999) return reject(tr('Wpisz poprawną kwotę.', 'Enter a valid amount.'));
    if (kind === 'borrow' && state.debt + amount > mode(state.mode).loanLimit) return reject(tr('Przekroczony limit pożyczki.', 'Loan limit exceeded.'));
    if (kind === 'repay' && (amount > state.cash || amount > state.debt)) return reject(tr('Spłać najwyżej tyle, ile masz gotówki i długu.', 'Repay no more than your cash and debt.'));
    const nextCash = state.cash + (kind === 'borrow' ? amount : -amount);
    if (!natural(nextCash) || !natural(gross() + (kind === 'borrow' ? amount : -amount))) return reject(tr('Przekroczony limit liczb.', 'Number limit exceeded.'));
    state.cash = nextCash;
    state.debt += kind === 'borrow' ? amount : -amount;
    message = kind === 'borrow' ? tr('Pożyczka otrzymana. Dług zmniejsza majątek.', 'Loan received. Debt reduces net worth.') : tr('Spłacono część długu.', 'Debt repaid.');
    save();
    render();
  }

  function travel() {
    if (screen !== 'game' || !state || state.finished) return;
    const selected = mode(state.mode);
    const finalDay = state.day === selected.days;
    const destination = document.querySelector('#destination')?.value;
    if (!finalDay && (!state.unlockedCities.includes(destination) || destination === state.city)) return;
    const interest = ratio(state.debt, selected.interestRate, 100, true);
    if (!natural(state.debt + interest)) return reject(tr('Przekroczony limit długu. Spłać część pożyczki.', 'Debt limit exceeded. Repay part of the loan.'));
    const next = { ...state, day: state.day + 1, debt: state.debt + interest, finished: finalDay };
    if (!finalDay) {
      next.previousPrices = Object.fromEntries(data.goods.map(item => [item.id, price(item.id)]));
      next.previousSharePrices = Object.fromEntries(selected.shares.map(id => [id, sharePrice(id)]));
      next.city = destination;
      next.market = data.events[(state.seed % data.events.length + next.day) % data.events.length].factor;
    }
    if (!natural(gross(next))) return reject(tr('Przekroczony limit wartości. Sprzedaj część zapasu.', 'Value limit exceeded. Sell some holdings.'));
    state = next;
    message = [finalDay ? tr('Runda zakończona.', 'Round complete.') : name(data.events[(state.seed % data.events.length + state.day) % data.events.length]),
      ...(interest ? [tr('Odsetki: ', 'Interest: ') + interest + '.'] : []), ...unlock()].join(' ');
    if (state.finished) {
      const score = worth();
      if (score >= 0 && score >= record()) {
        if (!write(`${RECORD}-${state.mode}`, String(score))) message += ' ' + tr('Nie udało się zapisać rekordu.', 'Could not save the record.');
        if (state.mode === 'child') write(RECORD, String(score));
      }
    }
    save();
    render();
    if (finalDay) { const heading = app.querySelector?.('h1'); heading?.setAttribute('tabindex', '-1'); heading?.focus(); }
  }

  function action(value) {
    if (!value) return;
    if (value === 'cancel-start') {
      pendingMode = null;
      screen = 'new';
      render();
      return;
    }
    if (value.startsWith('start:') || value.startsWith('confirm-start:')) {
      const confirming = value.startsWith('confirm-start:');
      const selected = mode(value.slice(confirming ? 14 : 6));
      if (!selected?.available) return;
      if (confirming && (screen !== 'confirm' || pendingMode !== selected.id)) return;
      if (!confirming && state && !state.finished) {
        pendingMode = selected.id;
        screen = 'confirm';
        render();
        return;
      }
      pendingMode = null;
      state = fresh(selected.id);
      screen = 'game';
      message = '';
      save();
      render();
      return;
    }
    if (value === 'continue' && state) screen = 'game';
    else if (['menu', 'new', 'settings', 'help', 'partners'].includes(value)) screen = value;
    else if (value === 'install' && globalThis.BiznesPWA?.install) {
      Promise.resolve(globalThis.BiznesPWA.install()).then(refreshPwa, refreshPwa);
      return;
    } else if (value === 'travel') return travel();
    else if (screen === 'game' && state && !state.finished) {
      const [kind, id] = value.split(':');
      if (kind === 'buy' || kind === 'sell') return trade(kind, id);
      if (kind === 'share-buy' || kind === 'share-sell') return trade(kind.slice(6), id, true);
      if (kind === 'borrow' || kind === 'repay') return loan(kind);
    }
    render();
  }

  document.querySelector('#menu-button').addEventListener('click', () => action('menu'));
  app.addEventListener('click', event => action(event.target.closest('[data-action]')?.dataset.action));
  app.addEventListener('change', event => {
    let saved = true;
    if (event.target.id === 'language') {
      lang = event.target.value === 'en' ? 1 : 0;
      saved = write('bx2-lang', lang ? 'en' : 'pl');
    } else if (event.target.id === 'contrast') {
      document.body.classList.toggle('high-contrast', event.target.checked);
      saved = write('bx2-contrast', event.target.checked ? '1' : '0');
    } else if (event.target.id === 'theme') {
      document.body.classList.toggle('retro', event.target.value === 'retro');
      saved = write('bx2-theme', event.target.value);
    } else return;
    message = saved ? '' : tr('Nie udało się zapisać ustawień.', 'Could not save settings.');
    render();
  });
  document.addEventListener('keydown', event => {
    if (event.altKey && event.key.toLowerCase() === 'm') {
      event.preventDefault();
      action('menu');
    }
  });
  function refreshPwa() {
    document.querySelector('#offline').textContent = globalThis.BiznesPWA?.status(lang ? 'en' : 'pl') || tr('Gra lokalna', 'Local game');
    if (screen === 'menu') render();
  }
  globalThis.addEventListener?.('pwa-state', refreshPwa);
  if (read('bx2-contrast') === '1') document.body.classList.add('high-contrast');
  if (read('bx2-theme') === 'retro') document.body.classList.add('retro');
  if (!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches && data.sponsors.length > 1) {
    setInterval(() => { partnerIndex++; renderPartner(); }, 15000);
  }
  render();
})();