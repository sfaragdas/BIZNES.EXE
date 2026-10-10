(() => {
  'use strict';

  const data = globalThis.BX2_DATA;
  const app = document.querySelector('#app');
  const SAVE = 'bx2-save';
  const RECORD = 'bx2-record';
  let lang = localStorage.getItem('bx2-lang') === 'en' ? 1 : 0;
  let screen = 'menu';
  let state = null;
  let message = '';
  let partnerIndex = 0;

  const tr = (pl, en) => lang ? en : pl;
  const name = item => item.name[lang];
  const city = id => data.cities.find(item => item.id === id);
  const good = id => data.goods.find(item => item.id === id);
  const mode = id => data.modes.find(item => item.id === id);
  const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));

  function fresh(id) {
    const selected = mode(id);
    return {
      schema: 2, mode: id, day: 1, cash: selected.cash,
      city: 'krakow', market: 1, cargo: {},
      seed: Math.floor(Math.random() * 1000000), trades: 0,
      finished: false, unlockedGoods: data.goods.filter(item => item.unlockWorth <= selected.cash).map(item => item.id),
      unlockedCities: data.cities.filter(item => item.unlockWorth <= selected.cash).map(item => item.id),
      previousPrices: {}
    };
  }

  function valid(saved) {
    return saved && saved.schema === 2 && saved.mode === 'child' &&
      Number.isInteger(saved.day) && saved.day >= 1 && saved.day <= mode('child').days + 1 &&
      Number.isSafeInteger(saved.cash) && saved.cash >= 0 && city(saved.city) &&
      Number.isFinite(saved.market) && saved.market > 0 && saved.market < 2 &&
      saved.cargo && typeof saved.cargo === 'object' &&
      Object.entries(saved.cargo).every(([id, quantity]) => good(id) && Number.isSafeInteger(quantity) && quantity >= 0) &&
      Number.isSafeInteger(saved.seed) && Number.isSafeInteger(saved.trades) &&
      typeof saved.finished === 'boolean' &&
      Array.isArray(saved.unlockedGoods) && saved.unlockedGoods.every(id => good(id)) &&
      Array.isArray(saved.unlockedCities) && saved.unlockedCities.every(id => city(id)) &&
      saved.previousPrices && typeof saved.previousPrices === 'object';
  }

  try {
    let saved = JSON.parse(localStorage.getItem(SAVE));
    if (saved?.schema === 1 && saved.mode === 'child') {
      // Keep a round from Etap 1 playable with the new cities and unlock rules.
      const startingGoods = data.goods.filter(item => item.unlockWorth <= 1000).map(item => item.id);
      saved = {
        ...saved,
        schema: 2,
        city: city(saved.city) ? saved.city : 'krakow',
        unlockedGoods: [...new Set([...startingGoods, ...Object.keys(saved.cargo || {})])],
        unlockedCities: ['krakow', 'torun'],
        previousPrices: {}
      };
      if (valid(saved)) localStorage.setItem(SAVE, JSON.stringify(saved));
    }
    if (valid(saved)) state = saved;
  } catch { /* A damaged local save starts a new game. */ }

  function save() {
    try {
      localStorage.setItem(SAVE, JSON.stringify(state));
    } catch {
      message = tr('Nie udało się zapisać gry.', 'Could not save the game.');
    }
  }

  function record() {
    const value = Number(localStorage.getItem(RECORD));
    return Number.isSafeInteger(value) && value >= 0 ? value : 0;
  }

  function price(id) {
    const item = good(id);
    return Math.max(1, Math.round(item.base * city(state.city).factor * state.market *
      (((state.seed + state.day * 17 + item.base * 13) % 9 + 6) / 10)));
  }

  function worth() {
    return state.cash + Object.entries(state.cargo).reduce((sum, [id, quantity]) => sum + quantity * price(id), 0);
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
        <a class="menu-link" href="privacy.html">${tr('Prywatność', 'Privacy')}</a>
      </div>
      <p class="small"><a href="privacy.html">${tr('Prywatność', 'Privacy')}</a></p>
    </section>`;
  }

  function renderNew() {
    app.innerHTML = `<section class="panel"><h1>${tr('Nowa gra', 'New game')}</h1>
      <p>${tr('Poziom wybierasz na całą rundę.', 'Choose the level for the whole round.')}</p>
      <div class="mode-grid">${data.modes.map(item => `<article class="mode-card">
        <h2>${escapeHtml(name(item))}</h2>
        <p>${item.available ? tr('14 dni · cel 4000 monet · bez długu', '14 days · goal 4000 coins · no debt') : tr('Wkrótce', 'Coming soon')}</p>
        ${item.available ? button(tr('Graj', 'Play'), 'start:' + item.id) : ''}
      </article>`).join('')}</div>${button(tr('Wróć', 'Back'), 'menu', 'secondary')}</section>`;
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
      </div>${button(tr('Wróć', 'Back'), 'menu', 'secondary')}</section>`;
  }

  function renderHelp() {
    app.innerHTML = `<section class="panel"><h1>${tr('Jak grać', 'How to play')}</h1>
      <p>${tr('Kup towar w jednym mieście i sprzedaj go drożej w innym. Podróż kończy dzień i zmienia ceny.', 'Buy goods in one city and sell them for more in another. Travel ends the day and changes prices.')}</p>
      <p>${tr('Majątek to gotówka plus aktualna wartość posiadanych towarów. Gdy rośnie, odblokowujesz nowe towary i miasta.', 'Your assets are cash plus the current value of owned goods. Growing assets unlock new goods and cities.')}</p>
      <p>${tr('Masz 14 dni, by osiągnąć 4000 monet. Nie ma licznika czasu na ruch.', 'You have 14 days to reach 4000 coins. There is no move timer.')}</p>
      ${button(tr('Wróć', 'Back'), 'menu', 'secondary')}</section>`;
  }

  function renderPartners() {
    const partners = data.sponsors.filter(item => item.approvedForChild);
    app.innerHTML = `<section class="panel"><h1>${tr('Partnerzy', 'Partners')}</h1>
      <ul>${partners.map(item => `<li>${escapeHtml(item.name)}</li>`).join('')}</ul>
      ${button(tr('Wróć', 'Back'), 'menu', 'secondary')}</section>`;
  }

  function renderGame() {
    const selected = mode(state.mode);
    const total = worth();
    if (state.finished) {
      app.innerHTML = `<section class="panel"><h1>${tr('Koniec rundy', 'Round complete')}</h1>
        <p>${tr('Majątek', 'Assets')}: <strong>${total}</strong> · ${tr('Cel', 'Goal')}: ${selected.goal}</p>
        <p>${total >= selected.goal ? tr('Cel osiągnięty!', 'Goal reached!') : tr('Spróbuj ponownie.', 'Try again.')}</p>
        <p>${tr('Rekord lokalny', 'Local best')}: ${record()}</p>
        ${button(tr('Nowa gra', 'New game'), 'new')} ${button(tr('Menu', 'Menu'), 'menu', 'secondary')}</section>`;
      return;
    }

    const rows = data.goods.filter(item => state.unlockedGoods.includes(item.id)).map(item => {
      const current = price(item.id);
      const previous = state.previousPrices[item.id];
      const direction = previous == null || previous === current ? '' :
        current > previous ? `<span class="rise" aria-label="${tr('wzrost', 'increase')}">▲</span>` :
          `<span class="fall" aria-label="${tr('spadek', 'decrease')}">▼</span>`;
      return `<div class="trade-card"><div><strong>${escapeHtml(name(item))}</strong>
        <span class="price">${current} ${direction}</span>
        <small>${tr('Masz', 'Owned')}: ${state.cargo[item.id] || 0}</small></div>
        <div class="trade-controls"><label for="qty-${item.id}">${tr('Ilość', 'Quantity')}</label>
          <input id="qty-${item.id}" type="number" inputmode="numeric" min="1" max="9999" step="1" value="1">
          ${button(tr('Sprzedaj', 'Sell'), 'sell:' + item.id, 'secondary')}
          ${button(tr('Kup', 'Buy'), 'buy:' + item.id, 'buy')}</div></div>`;
    }).join('');

    app.innerHTML = `<section class="panel"><h1>${escapeHtml(name(city(state.city)))}</h1>
      <p class="city-fact">${city(state.city).icon} ${escapeHtml(city(state.city).fact[lang])}</p>
      <p>${tr('Gotówka', 'Cash')}: <strong>${state.cash}</strong></p>
      <label for="progress">${tr('Cel', 'Goal')}: ${selected.goal} ${tr('monet', 'coins')} · ${tr('masz', 'you have')} ${total}</label>
      <progress id="progress" max="${selected.goal}" value="${Math.min(total, selected.goal)}"></progress>
      <p class="notice" role="status">${escapeHtml(message)}</p>
      <div class="goods-grid">${rows}</div>
      <div class="travel"><label for="destination">${tr('Dokąd jedziesz?', 'Where next?')}</label>
        <select id="destination">${data.cities.filter(item => item.id !== state.city && state.unlockedCities.includes(item.id))
          .map(item => `<option value="${item.id}">${escapeHtml(name(item))}</option>`).join('')}</select>
        ${button(tr('Jedź dalej', 'Travel on'), 'travel', 'travel-button')}</div>
    </section>`;
  }

  function renderPartner() {
    const partners = data.sponsors.filter(item => item.approvedForChild);
    const strip = document.querySelector('#partner-strip');
    strip.textContent = partners.length ? `${tr('Partner', 'Partner')}: ${partners[partnerIndex % partners.length].logoText}` : '';
  }

  function render() {
    document.documentElement.lang = lang ? 'en' : 'pl';
    document.querySelector('#menu-button').textContent = tr('☰ Menu', '☰ Menu');
    document.querySelector('#location').textContent = state && screen === 'game' ?
      `${name(city(state.city))} · ${tr('dzień', 'day')} ${Math.min(state.day, mode(state.mode).days)}/${mode(state.mode).days}` : 'BIZNES.EXE 2.0';
    document.querySelector('#offline').textContent = globalThis.BiznesPWA?.status(lang ? 'en' : 'pl') || tr('Gra lokalna', 'Local game');
    ({ menu: renderMenu, new: renderNew, settings: renderSettings, help: renderHelp,
      partners: renderPartners, game: renderGame })[screen]();
    renderPartner();
  }

  function trade(kind, id) {
    if (!state.unlockedGoods.includes(id)) return;
    const quantity = Number(document.querySelector(`#qty-${id}`)?.value);
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 9999) {
      message = tr('Wpisz poprawną ilość.', 'Enter a valid quantity.');
      render();
      return;
    }
    const cost = price(id) * quantity;
    const owned = state.cargo[id] || 0;
    if (kind === 'buy' && cost > state.cash || kind === 'sell' && quantity > owned) {
      message = kind === 'buy' ? tr('Za mało gotówki.', 'Not enough cash.') : tr('Za mało towaru.', 'Not enough goods.');
      render();
      return;
    }
    state.cash += kind === 'buy' ? -cost : cost;
    state.cargo[id] = owned + (kind === 'buy' ? quantity : -quantity);
    state.trades++;
    message = [kind === 'buy' ? tr('Kupiono.', 'Bought.') : tr('Sprzedano.', 'Sold.'), ...unlock()].join(' ');
    save();
    render();
  }

  function travel() {
    if (screen !== 'game' || state.finished) return;
    const destination = document.querySelector('#destination')?.value;
    if (!state.unlockedCities.includes(destination) || destination === state.city) return;
    const previousPrices = Object.fromEntries(data.goods.map(item => [item.id, price(item.id)]));
    state.city = destination;
    state.day++;
    state.market = data.events[(state.seed + state.day) % data.events.length].factor;
    state.previousPrices = previousPrices;
    message = [name(data.events[(state.seed + state.day) % data.events.length]), ...unlock()].join(' ');
    if (state.day > mode(state.mode).days) {
      state.finished = true;
      const score = worth();
      if (score > record()) {
        try { localStorage.setItem(RECORD, String(score)); } catch { /* The game still ends. */ }
      }
    }
    save();
    render();
  }

  function action(value) {
    if (!value) return;
    if (value.startsWith('start:')) {
      const selected = mode(value.slice(6));
      if (!selected?.available) return;
      state = fresh(selected.id);
      screen = 'game';
      message = '';
      save();
      render();
      return;
    }
    if (value === 'continue' && state) screen = 'game';
    else if (['menu', 'new', 'settings', 'help', 'partners'].includes(value)) screen = value;
    else if (value === 'travel') return travel();
    else if (screen === 'game' && !state.finished) {
      const [kind, id] = value.split(':');
      if (kind === 'buy' || kind === 'sell') return trade(kind, id);
    }
    render();
  }

  document.querySelector('#menu-button').addEventListener('click', () => action('menu'));
  app.addEventListener('click', event => action(event.target.closest('[data-action]')?.dataset.action));
  app.addEventListener('change', event => {
    if (event.target.id === 'language') {
      lang = event.target.value === 'en' ? 1 : 0;
      localStorage.setItem('bx2-lang', lang ? 'en' : 'pl');
    } else if (event.target.id === 'contrast') {
      document.body.classList.toggle('high-contrast', event.target.checked);
      localStorage.setItem('bx2-contrast', event.target.checked ? '1' : '0');
    } else if (event.target.id === 'theme') {
      document.body.classList.toggle('retro', event.target.value === 'retro');
      localStorage.setItem('bx2-theme', event.target.value);
    } else return;
    render();
  });
  document.addEventListener('keydown', event => {
    if (event.altKey && event.key.toLowerCase() === 'm') {
      event.preventDefault();
      action('menu');
    }
  });
  if (localStorage.getItem('bx2-contrast') === '1') document.body.classList.add('high-contrast');
  if (localStorage.getItem('bx2-theme') === 'retro') document.body.classList.add('retro');
  if (!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches && data.sponsors.length > 1) {
    setInterval(() => {
      partnerIndex++;
      renderPartner();
    }, 15000);
  }
  render();
})();
