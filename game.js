(()=>{'use strict';
const C=['Amsterdam','Bangkok','Gdynia','Hongkong','Londyn','Monachium','Nowy Jork','Rzym','Tokio'];
const CEN=['Amsterdam','Bangkok','Gdynia','Hong Kong','London','Munich','New York','Rome','Tokyo'];
const GOODS=['Kawa','Herbata','Tytoń','Zboże','Ropa naftowa','Leki','Złoto','Wideo','Drukarki','Samochody'];
const GEN=['Coffee','Tea','Tobacco','Grain','Oil','Medicine','Gold','Video','Printers','Cars'];
const UNITS=['ton','ton','ton','ton','ton','szt.','kg','szt.','szt.','szt.'];
const BASE=[18,14,22,9,31,75,110,160,350,240];
const BANKS=['Szwajcarski','Francuski','Angielski','Polski','USA','Kanadyjski'];
const BANKSEN=['Swiss','French','English','Polish','US','Canadian'];
const STOCKS=["Hotel 'Hilton' w Nowym Jorku","Hotel 'International' w Paryżu","Restauracje 'MacDonalda'","Akcje 'Philipsa'","Akcje 'JVC'","Akcje 'Toyoty'","PKO BP (GPW)","ORLEN (GPW)","HiPromine (NC)","Excellence (NC)"];
const STOCKSEN=["Hilton Hotel, New York","International Hotel, Paris","McDonald's Restaurants","Philips shares","JVC shares","Toyota shares","PKO BP (GPW)","ORLEN (GPW)","HiPromine (NC)","Excellence (NC)"];
const EVENTS=[['WIN','Wygrałeś na loterii!','You won the lottery!'],['THEFT','Okradziono cię!','You were robbed!'],['CARGO','Dostałeś darmowy towar.','You received free cargo.'],['LOSS','Straciłeś towar w drodze.','You lost cargo in transit.'],['FINE','Dostałeś mandat.','You got a fine.'],['CUSTOMS','Opłata celna.','Customs duty.'],['DELAY','Podróż się opóźniła.','Your trip was delayed.'],['FUEL','Tańsze paliwo na następną podróż.','Fuel is cheaper next trip.'],['PRIZE','Nagroda za podróż!','Travel prize!'],['BREAK','Awaria pojazdu.','Vehicle breakdown.'],['GIFT','Dostałeś prezent.','You received a gift.'],['BARGAIN','Okazja zmieniła ceny.','A bargain changed prices.']];
const T=document.querySelector('#terminal');
const SPONSORS=[['MojeDostawy.pl','https://mojedostawy.pl'],['LCSE.pl','https://lcse.pl']];
let sponsorIndex=0,lastProductKey='',lastProductIndex=-1,fontStyle=localStorage.getItem('bx-font')||'current';
let lang=localStorage.getItem('bx-lang')||'pl',view='welcome',notice='',event=null,selected=0,CORE=null,input='',step='',mode='',table='goods',hasExistingSave=!!localStorage.getItem('bx-save');
const t=(en,pl)=>lang==='pl'?pl:en, goods=()=>lang==='pl'?GOODS:GEN, cities=()=>lang==='pl'?C:CEN, banks=()=>lang==='pl'?BANKS:BANKSEN, stocks=()=>lang==='pl'?STOCKS:STOCKSEN;
const fresh=()=>({schema:2,cash:1000,bank:0,debt:25000,city:0,day:1,cargo:Array(10).fill(0),shares:Array(10).fill(0),banks:Array(6).fill(0),prices:[...BASE],rng:(Date.now()>>>0)||42,capacity:100,alive:true,seed:Date.now()>>>0});
let S;try{S=JSON.parse(localStorage.getItem('bx-save'))||fresh()}catch{S=fresh()}
const legacySave=!S.schema;
if(!Array.isArray(S.shares))S.shares=Array(10).fill(0);while(S.shares.length<10)S.shares.push(0);
if(!Array.isArray(S.banks)){S.banks=Array(6).fill(0);S.banks[0]=S.bank||0}while(S.banks.length<6)S.banks.push(0);
if(S.bank!==S.banks.reduce((a,b)=>a+b,0)){S.banks[0]+=S.bank-S.banks.reduce((a,b)=>a+b,0)}
let migratedCargo=false;if(legacySave){let recovered=0;for(let i=5;i<10;i++){recovered+=S.cargo[i]*S.prices[i];S.cargo[i]=0}for(let i=0;i<Math.min(3,S.shares.length);i++)recovered+=S.shares[i]*(80+((S.day*17+i*31)%90));if(recovered>0){S.cash+=recovered;migratedCargo=true}S.shares.fill(0);S.city=[2,2,5,0,4,6,3,8][Math.min(7,S.city)]||0;S.schema=2;if(migratedCargo)notice=t('Older goods and shares were converted to cash.','Stare towary i akcje zamieniono na gotówkę.')}
const fmt=n=>String(Math.max(0,Math.floor(n))).padStart(7), money=n=>`${Number(n).toFixed(2)} $`, esc=s=>String(s).replace(/[&<>"]+/g,c=>c.split('').map(ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch])).join(''));
const actionToken=(id,key,label,hot=0)=>`[[${id}|${key}|${label}|${hot}]]`;
function coreHydrate(){for(const [f,v] of [[0,S.cash],[1,S.bank],[2,S.debt],[3,S.city],[4,S.day],[9,S.rng|0]])CORE.core_set(f,0,v);S.prices.forEach((v,i)=>CORE.core_set(6,i,v));S.cargo.forEach((v,i)=>CORE.core_set(7,i,v));S.shares.forEach((v,i)=>CORE.core_set(8,i,v))}
function coreSync(){S.cash=CORE.core_get(0,0);S.bank=CORE.core_get(1,0);S.debt=CORE.core_get(2,0);S.city=CORE.core_get(3,0);S.day=CORE.core_get(4,0);S.rng=CORE.core_get(9,0)>>>0;S.prices=S.prices.map((_,i)=>CORE.core_get(6,i));S.cargo=S.cargo.map((_,i)=>CORE.core_get(7,i));S.shares=S.shares.map((_,i)=>CORE.core_get(8,i));}
if(location.protocol!=='file:'&&typeof WebAssembly!=='undefined'){fetch('target/wasm32-unknown-unknown/release/biznes_exe_core.wasm?v=3').then(r=>{if(!r.ok)throw Error('WASM missing');return r.arrayBuffer()}).then(b=>WebAssembly.instantiate(b,{})).then(({instance})=>{if(instance.exports.core_version?.()!==3)throw Error('Outdated core');CORE=instance.exports;CORE.core_init(S.rng);coreHydrate();document.querySelector('#engine-status').textContent='Rust/WASM';render()}).catch(()=>{document.querySelector('#engine-status').textContent='JS fallback'})}
function save(){S.bank=S.banks.reduce((a,b)=>a+b,0);localStorage.setItem('bx-save',JSON.stringify(S));hasExistingSave=true;document.querySelector('#save-status').textContent=t('Saved locally','Zapisano lokalnie')}
function used(){return S.cargo.reduce((a,b)=>a+b,0)}
function rand(n){S.rng^=S.rng<<13;S.rng^=S.rng>>>17;S.rng^=S.rng<<5;return(S.rng>>>0)%n}
function visibleText(s){return s.replace(/\{(?:LEFT|MID|RIGHT|END)\}/g,'').replace(/\{AMOUNT\}/g,' '.repeat(10)).replace(/\{LANG\}/g,lang==='pl'?'L/EN':'L/PL').replace(/\{SPONSOR\}/g,SPONSORS[sponsorIndex][0]).replace(/\{([A-Z])\}/g,'$1').replace(/\[\[([^|]+)\|([^|]+)\|([^|]+)(?:\|([^\]]+))?\]\]/g,'$3')}
function frame(rows){
  const content=rows.slice(0,22);while(content.length<22)content.push('');
  content.push(statusText().padStart(78));
  return content.map((raw,i)=>{
    const width=78+(raw.length-visibleText(raw).length);
    const r=raw.slice(0,width).padEnd(width);
    let html=esc(r);
    const panel=view==='welcome'&&i>=2&&i<=9;
    if(panel){
      const edge=i===2||i===9;
      const text=edge?'*'.repeat(76):'* '+r.trim().padEnd(72)+' *';
      html=` <span class="welcomepanel${edge?' panel-edge':''}">${esc(text)}</span> `;
    }
    html=html.replace(/\[\[([^|]+)\|([^|]+)\|([^|]+)(?:\|([^\]]+))?\]\]/g,(_,id,key,label,hot='0')=>{const n=Math.max(0,Math.min(label.length-1,Number(hot)||0));return `<button class="terminal-action" data-ui-action="${esc(id)}" data-hotkey="${esc(key)}">${esc(label.slice(0,n))}<span class="key">${esc(label.slice(n,n+1))}</span>${esc(label.slice(n+1))}</button>`});
    html=html.replace(/\{LANG\}/g,`<button class="frame-control" data-frame-action="language">L/${lang==='pl'?'EN':'PL'}</button>`).replace(/\{SPONSOR\}/g,`<a class="sponsor-link" href="${SPONSORS[sponsorIndex][1]}" target="_blank" rel="noopener noreferrer">${SPONSORS[sponsorIndex][0]}</a>`).replace(/BIZNES\.EXE/g,'<span class="accent">BIZNES.EXE</span>').replace(/\{([A-Z])\}/g,'<span class="key">$1</span>').replace(/(\$\s*)([\d,]+(?:\.\d{2})?)/g,'$1<span class="accent">$2</span>').replace(/([\d,]+(?:\.\d{2})?)(\s*\$)/g,'<span class="accent">$1</span>$2');
    for(const city of [...C,...CEN])html=html.replace(new RegExp(esc(city),'g'),`<span class="accent">${esc(city)}</span>`);

    const cls=raw.includes('{LEFT}')?'action-bar':raw.includes('{AMOUNT}')?'amount-row':i===22?'footer-status':i===0?'statusline':view==='welcome'&&i===10?'welcome-instructions':view==='welcome'&&i>=12&&i<=17?'welcome-copy':view==='home'&&((notice&&i===20)||(mode&&i===18))?'promptline':view==='home'&&i===1?'tablehead':view==='home'&&i===17?'section-divider':'';
    html=html.replace(/\{LEFT\}/g,'<span class="action-group group-left">').replace(/\{MID\}/g,'</span><span class="action-group group-middle">').replace(/\{RIGHT\}/g,'</span><span class="action-group group-right">').replace(/\{END\}/g,'</span>').replace(/\{AMOUNT\}/g,`<input id="amount-input" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="10" autocomplete="off" enterkeyhint="done" aria-label="${t('Quantity or amount','Ilość lub kwota')}" value="${esc(input)}">`);
    return `<span class="terminal-row ${cls}">${html}</span>`;
  }).join('\n');
}
const center=s=>{const length=visibleText(s).length,left=Math.max(0,Math.floor((78-length)/2));return ' '.repeat(left)+s+' '.repeat(Math.max(0,78-length-left))};
function statusText(){const engine=document.querySelector('#engine-status').textContent,saveText=lang==='pl'?'Zapisano lokalnie':'Saved locally';return `100% offline · ${engine} · ${saveText}`}
function topbar(){const tail='  {SPONSOR}  {LANG}',brand='BIZNES.EXE  ·  '+t('Tiny economic game','Mała gra ekonomiczna');return `${brand.padEnd(78-visibleText(tail).length)}${tail}`}
function header(){return [topbar(),` ${t('Cash','Gotówka')} $${fmt(S.cash)}  ${t('Bank','Bank')} $${fmt(S.bank)}  ${t('Debt','Dług')} $${fmt(S.debt)}     ${t('Cargo','Ładunek')}: ${used()}/${S.capacity}`,` ${t('Net worth','Majątek')}: $${fmt(S.cash+S.bank-S.debt+S.cargo.reduce((n,q,i)=>n+q*S.prices[i],0))}`, '─'.repeat(78)]}
function welcome(){
  const opts=[actionToken('welcome-continue','K',t('Continue','Kontynuuj')),actionToken('new-game','N',t('New game','Nowa gra')),actionToken('font-toggle','F',`F: ${t('Font','Czcionka')}: ${fontStyle==='retro'?'DOS PL':t('standard','standardowa')}`)];
  return frame([
    topbar(),'','',
    center(t('BIZNES.EXE · A tiny economic game','BIZNES.EXE · Mała gra ekonomiczna')),
    center(t('Lightweight by design. A retro game for a new generation.','Manifest lekkiego oprogramowania w klimacie retro dla młodego pokolenia.')),
    center(t('Inspired by Biznesman (1988), by M. Cwynar / Studio SAMBA.','Inspiracja: Biznesman (1988), M. Cwynar / Studio SAMBA.')),
    center(t('An independent game inspired by the original, not made by its authors.','Niezależna gra inspirowana oryginałem, nie jest dziełem jego autorów.')),
    '',
    center(t('Project sponsors: MojeDostawy.pl and LCSE.pl.','Sponsorzy projektu: MojeDostawy.pl oraz LCSE.pl.')),
    '',center(t('HOW TO PLAY','INSTRUKCJA')),'',
    center(t('Buy low, sell high; prices change between cities.','Kupuj tanio, sprzedawaj drożej — ceny różnią się między miastami.')),
    center(t('Travel is free. Random events may help or hurt.','Podróż jest bezpłatna. Zdarzenia mogą pomóc albo zaszkodzić.')),
    center(t('Watch your debt and cargo capacity. Your game saves automatically.','Pilnuj długu i ładowni. Gra zapisuje się automatycznie.')),
    center(t('{K} buy · {S} sell · {W} travel · {A} shares · {D} debt · {B} banks · {Q} menu','{K} kupno · {S} sprzedaż · {W} wyjazd · {A} akcje · {D} długi · {B} banki · {Q} menu')),
    '',
    center(t('Click a choice or press its highlighted letter.','Kliknij wybór albo naciśnij wyróżnioną literę.')),
    '-'.repeat(78),'{LEFT}'+opts.slice(0,2).join('   ')+'{MID}{RIGHT}'+opts[2]+'{END}','-'.repeat(78),''
  ]);
}
// Two screens; the active table is independent of the inline operation.
const GOODS_HOT=()=>lang==='pl'?[0,0,0,0,0,0,2,0,0,0]:[0,0,2,0,0,0,2,0,0,1];
const STOCK_LABELS=()=>lang==='pl'?["Hilton (Nowy Jork)","International (Paryż)","MacDonald's","Philips","JVC","Toyota",...STOCKS.slice(6)]:["Hilton (New York)","International (Paris)","McDonald's","Philips","JVC","Toyota",...STOCKSEN.slice(6)];
const STOCK_HOT=[0,0,0,0,0,0,1,0,3,0];
function entries(){
  if(table==='stocks')return STOCK_LABELS().map((label,i)=>({label,hot:STOCK_HOT[i],id:`stock-${i}`,price:stockPrice(i),qty:S.shares[i],unit:t('pcs.','szt.')}));
  if(table==='banks')return banks().map((name,i)=>({label:`Bank ${name}`,hot:5,id:`bank-${i}`,balance:S.banks[i]}));
  return goods().map((label,i)=>({label,hot:GOODS_HOT()[i],id:`good-${i}`,price:S.prices[i],qty:S.cargo[i],unit:lang==='pl'?UNITS[i]:(UNITS[i]==='ton'?'tons':UNITS[i]==='szt.'?'pcs.':'kg')}));
}
function button(id,key,pl,en,hot=0){
  let label=t(en,pl);
  if(key.length===1&&label[hot]?.toUpperCase()!==key){
    hot=label.toUpperCase().indexOf(key);
    if(hot<0){label=key+' '+label;hot=0}
  }
  return actionToken(id,key,label,hot);
}
function home(){
  const leader=(label,value,width)=>label.padEnd(Math.max(label.length,width-String(value).length),'.')+value;
  const pair=(l,lv,r,rv)=>leader(l,lv,38)+' '+leader(r,rv,39);
  const list=entries(),bank=table==='banks';
  const headings=bank?[t('Bank','Bank'),t('Deposit up to','Możesz wpłacić'),t('Withdraw up to','Możesz odebrać'),t('Balance','Stan konta')]:[table==='stocks'?t('Shares','Akcje'):t('Goods','Towar'),t('Price','Cena'),t('Owned quantity','Posiadana ilość'),t('Current value','Aktualna wartość')];
  const rows=list.map(e=>{
    const name=actionToken(e.id,e.label[e.hot].toUpperCase(),e.label.padEnd(30,'.'),e.hot);
    return name+(bank?money(S.cash):money(e.price)).padStart(14)+(bank?money(e.balance):`${e.qty} ${e.unit}`).padStart(16)+money(bank?e.balance:e.qty*e.price).padStart(18);
  });
  while(rows.length<10)rows.push('');
  const total=bank?S.bank:list.reduce((sum,e)=>sum+e.qty*e.price,0);
  const shareValue=S.shares.reduce((sum,q,i)=>sum+q*stockPrice(i),0);
  const coverage=S.debt?Math.min(999,Math.floor((S.cash+S.bank)/S.debt*100)):999;
  const controls=inlineControls();
  return frame([topbar(),headings.map((h,i)=>(h+':').padEnd([30,14,16,18][i])).join(''),...rows,
    '─'.repeat(59)+' '+leader(t('TOTAL:','RAZEM:'),money(total),18),
    pair(t('Debt balance','Stan twojego długu'),money(S.debt),t('Debt growth per trip','Procent wzrostu długu'),'1 %'),
    pair(t('Account balance','Stan twojego konta'),money(S.cash),t('Chance of repayment','Szansa na spłatę'),`${coverage} %`),
    pair(t('Held in banks','W bankach posiadasz'),money(S.bank),'','─'.repeat(39)),
    pair(t('Held in shares','W akcjach posiadasz'),money(shareValue),t('Currently in','Przebywasz w'),cities()[S.city]),
    '-'.repeat(78),...controls]);
}
function inlineControls(){
  const cancel=button('cancel','ESC','ESC anuluj','ESC cancel');
  if(!mode){
    const tabs=[button('goods','T','Towary','Goods'),button('shares','A','Akcje','Shares'),button('bank','B','Banki','Banks')];
    const ops=table==='banks'?[button('deposit','P','Wpłata','Deposit',1),button('withdraw','O','Odbiór','Withdraw')]:[button('buy','K','Kupno','Buy'),button('sell','S','Sprzedaż','Sell')];
    const middle=[button('quit','Q','Q Menu','Q Menu'),button('debt','D','Długi','Debt'),button('travel','W','Wyjazd','Travel')];
    return ['{LEFT}'+tabs.join(' ')+'{MID}'+middle.join(' ')+'{RIGHT}'+ops.join(' ')+'{END}','',notice,table==='stocks'?t('Game prices are fictional. Select a highlighted letter or click.','Kursy są fikcyjne. Wybierz wyróżnioną literę albo kliknij.'):t('Choose a highlighted letter or click.','Wybierz wyróżnioną literę albo kliknij.')];
  }
  if(mode==='travel'){
    const opts=cities().map((c,i)=>actionToken(`city-${i}`,c[0].toUpperCase(),c));
    return [t('Cities you can travel to:','Miasta, do których możesz się wybrać:'),' '+opts.slice(0,5).join('   '),' '+opts.slice(5).join('   '),' '+cancel];
  }
  if(mode==='debt'&&step==='choice')return [t('Borrow, repay, or return?','Pożyczasz, oddajesz, czy wracasz?'),
    '',' '+button('borrow','P','Pożyczasz','Borrow')+'   '+button('repay','O','Oddajesz','Repay')+'   '+cancel,t('Loan limit per operation: 5000 $.','Limit pożyczki na operację: 5000 $.')];
  if(step==='row'){
    const question=table==='banks'?t('Which bank?','Który bank?'):table==='stocks'?(mode==='buy'?t('Which shares do you buy?','Jakie akcje kupujesz?'):t('Which shares do you sell?','Jakie akcje sprzedajesz?')):(mode==='buy'?t('Which good do you buy?','Jaki towar kupujesz?'):t('Which good do you sell?','Jaki towar sprzedajesz?'));
    return [' '+question+' < '+t('choose a highlighted letter','wybierz wyróżnioną literę')+' >',' '+cancel,'',''];
  }
  const max=maximum(),isMoney=['deposit','withdraw','borrow','repay'].includes(mode),item=entries()[selected]||{label:'',unit:''};
  const hint=isMoney?`${t('available','dostępne')}: ${money(max)}`:mode==='buy'?t(`you can buy ${max} ${item.unit}`,`możesz kupić ${max} ${item.unit}`):t(`you own ${max} ${item.unit}`,`posiadasz ${max} ${item.unit}`);
  const genitive=['kawy','herbaty','tytoniu','zboża','ropy naftowej','leków','złota','wideo','drukarek','samochodów'];
  const tradeTitle=t(`How many ${item.label} do you ${mode}?`,table==='goods'?`Ile ${genitive[selected]} ${mode==='buy'?'kupujesz':'sprzedajesz'}?`:`Ile akcji ${item.label} ${mode==='buy'?'kupujesz':'sprzedajesz'}?`);
  const title=mode==='borrow'?t('How much do you borrow?','Ile pożyczasz?'):mode==='repay'?t('How much do you repay?','Ile oddajesz?'):mode==='deposit'?t('How much do you deposit?','Ile wpłacasz?'):mode==='withdraw'?t('How much do you withdraw?','Ile odbierasz?'):tradeTitle;
  return [' '+title,' < '+hint+' >',' '+button('amount-minus','−','−','−')+'  {AMOUNT}  '+button('amount-plus','+','+','+')+'   '+button('amount-max','MAX','Maks','Max'),' '+button('submit','ENTER','ENTER zatwierdź','ENTER confirm')+'   '+cancel];
}
function screen(){return view==='welcome'?welcome():home()}
function render(persist=true){const focused=document.activeElement?.id==='amount-input';if(persist)save();document.body.dataset.font=fontStyle;T.innerHTML=screen();if(focused)document.querySelector('#amount-input')?.focus?.({preventScroll:true})}
function homeNotice(msg){view='home';step='';mode='';input='';notice=msg;render()}
function stockPrice(i){return 80+((S.day*17+i*31)%90)}
function maximum(){
  if(mode==='borrow')return Math.min(5000,2147483647-S.cash,2147483647-S.debt);
  if(mode==='repay')return Math.min(S.cash,S.debt);
  if(mode==='deposit')return Math.min(S.cash,2147483647-S.bank);
  if(mode==='withdraw')return Math.min(S.banks[selected],2147483647-S.cash);
  const e=entries()[selected];
  return mode==='sell'?Math.min(e.qty,Math.floor((2147483647-S.cash)/e.price)):Math.max(0,Math.min(Math.floor(S.cash/e.price),table==='goods'?S.capacity-used():65535-e.qty));
}
function chooseRow(i){
  if(step!=='row'||i<0||i>=entries().length)return;
  selected=i;input='';step='quantity';
  if(maximum()<1)return homeNotice(mode==='sell'?t(`You do not own: ${entries()[i].label}.`,`Nie posiadasz: ${entries()[i].label}.`):mode==='withdraw'?t('This bank account is empty.','To konto bankowe jest puste.'):mode==='buy'&&table==='goods'&&used()>=S.capacity?t('Your cargo is full.','Ładownia jest pełna.'):t('Not enough funds for this operation.','Nie masz pieniędzy na tę operację.'));
  render();
}
function submit(){
  if(step!=='quantity')return;
  const n=Number(input);
  if(!Number.isSafeInteger(n)||n<1||n>maximum())return homeNotice(t('Invalid quantity or insufficient funds.','Nieprawidłowa ilość albo za mało środków.'));
  let ok=true;
  if(mode==='buy'||mode==='sell'){
    const buying=mode==='buy',e=entries()[selected];
    if(CORE){ok=table==='goods'?CORE[buying?'core_buy':'core_sell'](selected,n)===1:CORE.core_stock(selected,n,buying?1:0)===1;if(ok)coreSync()}
    else{S.cash+=n*e.price*(buying?-1:1);(table==='goods'?S.cargo:S.shares)[selected]+=n*(buying?1:-1)}
  }else{
    const op={deposit:0,withdraw:1,repay:2,borrow:3}[mode];
    if(CORE){ok=CORE.core_bank(op,n)===1;if(ok)coreSync()}
    else{S.cash+=n*([1,3].includes(op)?1:-1);if(op<2)S.bank+=n*(op===0?1:-1);else S.debt+=n*(op===3?1:-1)}
    if(ok&&op<2)S.banks[selected]+=n*(op===0?1:-1);
  }
  homeNotice(ok?t('Transaction completed.','Transakcja zakończona.'):t('Operation failed.','Operacja nie powiodła się.'));
}
function updateMarkets(){S.day++;S.debt+=Math.floor(S.debt/100);S.prices=S.prices.map(p=>Math.max(1,Math.floor(p*(85+rand(31))/100)))}
function trigger(id){
  const cash=rand(150)+50,g=rand(10);let detail='';
  switch(id){
    case 0:case 7:case 8:case 10:S.cash+=cash;detail=`+${cash} $`;break;
    case 1:case 4:case 5:case 9:{const n=Math.min(S.cash,cash);S.cash-=n;detail=`-${n} $`;break}
    case 2:if(used()<S.capacity){S.cargo[g]++;detail=`+1 ${goods()[g]}`}else{S.cash+=cash;detail=`+${cash} $`}break;
    case 3:if(used()){const i=S.cargo.findIndex(x=>x);S.cargo[i]--;detail=`-1 ${goods()[i]}`}break;
    case 6:S.day++;detail=t('+1 day','+1 dzień');break;
    case 11:S.prices[g]=Math.max(1,Math.floor(S.prices[g]*.65));detail=`${goods()[g]}: ${money(S.prices[g])}`;break;
  }
  if(CORE)coreHydrate();
  homeNotice(t(EVENTS[id][2],EVENTS[id][1])+' '+detail);
}
function travelTo(city){
  if(city<0||city>=C.length)return;
  if(city===S.city)return homeNotice(t('You are already here.','Już tu jesteś.'));
  let result=-1;
  if(CORE){result=CORE.core_travel(city);coreSync()}
  else{const fee=0;S.cash-=fee;S.city=city;updateMarkets();if(rand(100)<25)result=rand(EVENTS.length)}
  if(result>=0)return trigger(result);
  homeNotice(t('Trip complete. Prices changed.','Podróż zakończona. Ceny uległy zmianie.'));
}
function newGame(){S=fresh();if(CORE){CORE.core_init(S.rng);coreHydrate()}table='goods';homeNotice(t('New game started.','Rozpoczęto nową grę.'))}
function select(id){
  if(id==='language'){lang=lang==='pl'?'en':'pl';notice='';localStorage.setItem('bx-lang',lang);render();return}
  if(view==='welcome'){
    if(id==='font-toggle'){fontStyle=fontStyle==='retro'?'current':'retro';localStorage.setItem('bx-font',fontStyle)}
    else if(id==='welcome-continue'){homeNotice('');return}
    else if(id==='new-game'){newGame();return}

    render();return;
  }
  if(id==='quit'){view='welcome';mode='';step='';notice='';render();return}
  if(id==='cancel'){homeNotice('');return}
  if(id==='submit'){submit();return}
  if(step==='quantity'&&['amount-minus','amount-plus','amount-max'].includes(id)){
    input=String(id==='amount-max'?maximum():Math.max(0,Math.min(maximum(),(Number(input)||0)+(id==='amount-plus'?1:-1))));render(false);return;
  }
  if(id.startsWith('city-')){if(mode==='travel')travelTo(Number(id.slice(5)));return}
  const row=/^(good|stock|bank)-(\d+)$/.exec(id);
  if(row){if(row[1]==={goods:'good',stocks:'stock',banks:'bank'}[table])chooseRow(Number(row[2]));return}
  if(mode==='debt'&&step==='choice'&&['repay','borrow'].includes(id)){mode=id;step='quantity';input='';render();return}
  if(mode)return;
  notice='';input='';
  if(['goods','shares','bank'].includes(id)){table={goods:'goods',shares:'stocks',bank:'banks'}[id]}
  else if(id==='debt'){mode='debt';step='choice'}
  else if(id==='travel'){mode='travel';step='city'}
  else if((table==='banks'?['deposit','withdraw']:['buy','sell']).includes(id)){mode=id;step='row'}
  render();
}
function action(k){
  if(view==='welcome'){const id={N:'new-game',K:'welcome-continue',C:'welcome-continue',ENTER:'welcome-continue',F:'font-toggle',L:'language'}[k];if(id)select(id);return}
  if(k==='ESC'){select('cancel');return}
  if(mode){
    if(mode==='travel'){const i=cities().findIndex(c=>c[0].toUpperCase()===k);if(i>=0)travelTo(i);return}
    if(mode==='debt'&&step==='choice'){if(k==='P')select('borrow');else if(k==='O')select('repay');return}
    if(step==='row'){const i=entries().findIndex(e=>e.label[e.hot].toUpperCase()===k);if(i>=0)chooseRow(i);return}
    if(step==='quantity'){if(/^\d$/.test(k)&&input.length<10)input+=k;else if(k==='BACKSPACE')input=input.slice(0,-1);else if(k==='ENTER'){submit();return}render()}
    return;
  }
  // A notice never intercepts the next command.
  const common={T:'goods',A:'shares',B:'bank',W:'travel',D:'debt',Q:'quit',L:'language'};
  const id=common[k]||(table==='banks'?{P:'deposit',O:'withdraw'}:{K:'buy',S:'sell'})[k];
  if(id)select(id);
}
T.addEventListener('input',e=>{
  if(e.target.id!=='amount-input')return;
  input=e.target.value.replace(/[^0-9]/g,'').slice(0,10);e.target.value=input;
});
T.addEventListener('click',e=>{const f=e.target.closest?.('[data-frame-action]');if(f){select('language');return}const a=e.target.closest?.('[data-ui-action]');if(a)select(a.dataset.uiAction)});
document.addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.target?.id==='amount-input'){
    if(e.key==='Enter'){e.preventDefault();submit()}
    else if(e.key==='Escape'){e.preventDefault();select('cancel')}
    return;
  }
  // Let a focused native button handle Enter/Space once through its click event.
  if((e.key==='Enter'||e.key===' ')&&e.target?.closest?.('button,a'))return;
  let k=e.key.toUpperCase();if(k==='ESCAPE')k='ESC';
  if(k==='BACKSPACE'||k==='ENTER'||k==='ESC'||k.length===1){e.preventDefault();action(k)}
});
document.querySelector('#engine-status').textContent=location.protocol==='file:'?'JS fallback':'Loading WASM';render();
if(typeof setInterval==='function')setInterval(()=>{sponsorIndex=(sponsorIndex+1)%SPONSORS.length;if(document.activeElement?.id!=='amount-input')render(false)},7000);
})();
