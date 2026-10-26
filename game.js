(()=>{'use strict';
const C=['Amsterdam','Bangkok','Gdynia','Hongkong','Londyn','Monachium','Nowy Jork','Rzym','Tokio'];
const CEN=['Amsterdam','Bangkok','Gdynia','Hong Kong','London','Munich','New York','Rome','Tokyo'];
const GOODS=['Kawa','Herbata','Kakao','Zboże','Ropa naftowa','Leki','Złoto','Wideo','Drukarki','Samochody'];
const GEN=['Coffee','Tea','Cocoa','Grain','Oil','Medicine','Gold','Video','Printers','Cars'];
const UNITS=['ton','ton','ton','ton','ton','szt.','kg','szt.','szt.','szt.'];
const BASE=[18,14,22,9,31,75,110,160,350,240];
const BANKS=['Szwajcarski','Francuski','Angielski','Polski','USA','Kanadyjski'];
const BANKSEN=['Swiss','French','English','Polish','US','Canadian'];
// Fictional companies only (indexes match older saves).
const STOCKS=['Atlas Hotele','Bajka Bistro','Cyfra Elektronika','Delta Audio','Echo Wideo','Fala Motors','Granit Bank','Horyzont Energia','Iskra Górnictwo','Jutrzenka Tech'];
const STOCKSEN=['Atlas Hotels','Bajka Bistro','Cyfra Electronics','Delta Audio','Echo Video','Fala Motors','Granit Bank','Horyzont Energy','Iskra Mining','Jutrzenka Tech'];
const EVENTS=[
['WIN','Wyróżnienie w konkursie kupców!','A traders\' contest award!'],['THEFT','Złodziej zabrał część gotówki.','A thief took some cash.'],
['CARGO','Prezent od zaprzyjaźnionego kupca.','A gift from a fellow trader.'],['LOSS','Uszkodzono część towaru w drodze.','Some goods were damaged in transit.'],
['FINE','Mandat podczas podróży.','A fine during the trip.'],['CUSTOMS','Opłata celna na granicy.','Customs duty at the border.'],
['DELAY','Opóźnienie podróży o dzień.','Trip delayed by one day.'],['REFUND','Zwrot nadpłaconego podatku.','An overpaid tax was refunded.'],
['PRIZE','Nagroda od partnera handlowego.','A reward from a trading partner.'],['BREAK','Koszt naprawy pojazdu.','Vehicle repair costs.'],
['GIFT','Ktoś przekazał Ci darowiznę.','Someone sent you a donation.'],['BARGAIN','Wyprzedaż obniżyła cenę towaru.','A sale reduced a market price.'],
['TEA','Szkodniki zniszczyły liście herbaty.','Pests damaged your tea leaves.'],['COCOA','Wilgoć zniszczyła część kakao.','Damp spoiled some of your cocoa.'],
['TAX','Podatek od przewożonych towarów.','A tax on transported goods.'],['FIND','Znalazłeś pieniądze w drodze.','You found money along the way.']];
const T=document.querySelector('#terminal'),D=document.querySelector('#journey-dialog');
const SPONSORS=[['MojeDostawy.pl','https://mojedostawy.pl'],['LCSE.pl','https://lcse.pl']];
let eventPopup=false;
// Storage may be blocked or full: keep playing from memory and say so.
const memory={};let storageOk=true;
const store={get(k){try{const v=localStorage.getItem(k);return v??memory[k]??null}catch{storageOk=false;return memory[k]??null}},set(k,v){memory[k]=String(v);try{localStorage.setItem(k,v);return true}catch{storageOk=false;return false}}};
let handedness=store.get('bx-hand')==='left'?'left':'right';
const STYLES=[{id:'current',name:'Standard'},{id:'retro',name:'DOS'},{id:'matrix',name:'Matrix'}];
let sponsorIndex=0,fontStyle=store.get('bx-style')||store.get('bx-font')||'current';
if(!STYLES.some(style=>style.id===fontStyle))fontStyle='current';
const styleName=()=>STYLES.find(style=>style.id===fontStyle).name;
const RELEASE='BETA · 2026.10.26',LIM={k100:1e5,k500:5e5,m1:1e6};
let goalPick=1,lang=store.get('bx-lang')==='en'?'en':'pl',view='welcome',notice='',selected=0,input='',step='',mode='',table='goods';
const t=(en,pl)=>lang==='pl'?pl:en, goods=()=>lang==='pl'?GOODS:GEN, cities=()=>lang==='pl'?C:CEN, banks=()=>lang==='pl'?BANKS:BANKSEN;
const fresh=()=>({schema:2,debtRate:5+(Date.now()>>>0)%6,cash:1000,bank:0,debt:25000,city:0,day:1,cargo:Array(10).fill(0),shares:Array(10).fill(0),banks:Array(6).fill(0),prices:[...BASE],stockPrices:Array.from({length:10},(_,i)=>80+((17+i*31)%90)),rng:(Date.now()>>>0)||42,alive:true,seed:Date.now()>>>0,goal:1,ms:[]});
// A damaged save is copied to bx-save-backup before a new game replaces it.
const int=(n,min=0)=>Number.isSafeInteger(n)&&n>=min,nums=(a,min)=>Array.isArray(a)&&a.length<=10&&a.every(n=>Number.isFinite(n)&&n>=min);
const validSave=s=>!!s&&typeof s==='object'&&[s.cash,s.debt].every(n=>Number.isFinite(n)&&n>=0)&&int(s.day,1)&&int(s.city)&&s.city<9&&nums(s.cargo,0)&&nums(s.prices,1)&&(s.bank===undefined||Number.isFinite(s.bank))&&(s.shares===undefined||nums(s.shares,0))&&(s.banks===undefined||nums(s.banks,0))&&(s.stockPrices===undefined||nums(s.stockPrices,1));
let S,rawSave=store.get('bx-save');try{S=rawSave?JSON.parse(rawSave):null}catch{S=undefined}
if(rawSave&&!validSave(S)){store.set('bx-save-backup',rawSave);S=null;notice=t('Damaged save copied to bx-save-backup. New game started.','Uszkodzony zapis skopiowano do bx-save-backup. Nowa gra.')}
if(!S)S=fresh();
while(S.cargo.length<10)S.cargo.push(0);while(S.prices.length<10)S.prices.push(BASE[S.prices.length]);
if(!Number.isFinite(S.rng))S.rng=42;
delete S.capacity;
if(!Number.isInteger(S.debtRate)||S.debtRate<1||S.debtRate>30)S.debtRate=5+(S.rng>>>0)%6;
const legacySave=!S.schema;
if(!Array.isArray(S.shares))S.shares=Array(10).fill(0);while(S.shares.length<10)S.shares.push(0);
if(!Array.isArray(S.banks)){S.banks=Array(6).fill(0);S.banks[0]=S.bank||0}while(S.banks.length<6)S.banks.push(0);
if(S.bank!==S.banks.reduce((a,b)=>a+b,0)){S.banks[0]+=S.bank-S.banks.reduce((a,b)=>a+b,0)}
let migratedCargo=false;if(legacySave){let recovered=0;for(let i=5;i<10;i++){recovered+=S.cargo[i]*S.prices[i];S.cargo[i]=0}for(let i=0;i<Math.min(3,S.shares.length);i++)recovered+=S.shares[i]*(80+((S.day*17+i*31)%90));if(recovered>0){S.cash+=recovered;migratedCargo=true}S.shares.fill(0);S.city=[2,2,5,0,4,6,3,8][Math.min(7,S.city)]||0;S.schema=2;if(migratedCargo)notice=t('Older goods and shares were converted to cash.','Stare towary i akcje zamieniono na gotówkę.')}
if(S.alive!==false)S.alive=true;
if(!Array.isArray(S.stockPrices)||S.stockPrices.length!==10)S.stockPrices=Array.from({length:10},(_,i)=>80+((S.day*17+i*31)%90));
// Saves from before goals continue as Endless; a repaid-debt "win" is no longer an end.
if(![1,2,3].includes(S.goal)){S.goal=3;if(S.end?.win){S.alive=true;delete S.end}S.ms=['k100','k500'].filter(m=>netWorth()>=LIM[m])}
if(!Array.isArray(S.ms))S.ms=[];
const money=n=>`${Number(n).toFixed(2)} $`, esc=s=>String(s).replace(/[&<>"]+/g,c=>c.split('').map(ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch])).join(''));
const actionToken=(id,key,label,hot=0)=>`[[${id}|${key}|${label}|${hot}]]`;
function save(){S.bank=S.banks.reduce((a,b)=>a+b,0);const ok=store.set('bx-save',JSON.stringify(S));document.querySelector('#save-status').textContent=ok?t('Saved locally','Zapisano lokalnie'):t('Not saved','Nie zapisano')}
const saveNote=()=>storageOk?'':t('Not saved','Nie zapisano');
function used(){return S.cargo.reduce((a,b)=>a+b,0)}
function rand(n){S.rng^=S.rng<<13;S.rng^=S.rng>>>17;S.rng^=S.rng<<5;return(S.rng>>>0)%n}
const ROTW=Math.max(...SPONSORS.map(([n])=>n.length));
function visibleText(s){return s.replace(/\{(?:LEFT|MID|RIGHT|END|CITYROW|CITYEND)\}/g,'').replace(/\{AMOUNT\}/g,' '.repeat(10)).replace(/\{SPONSOR_LINKS\}/g,'LCSE.pl    MojeDostawy.pl').replace(/\{LANG\}/g,lang==='pl'?'L/EN':'L/PL').replace(/\{SPONSOR\}/g,' '.repeat(ROTW)).replace(/\{([A-Z])\}/g,'$1').replace(/\[\[([^|]+)\|([^|]+)\|([^|]+)(?:\|([^\]]+))?\]\]/g,'$3')}
function frame(rows){
  const content=rows.slice(0,22);while(content.length<22)content.push('');
  content.push((view==='welcome'?footerText():saveNote()).padStart(78));
  return content.map((raw,i)=>{
    const width=78+(raw.length-visibleText(raw).length);
    const r=raw.slice(0,width).padEnd(width);
    let html=esc(r);
    const panel=view==='welcome'&&i>=2&&i<=10;
    if(panel){
      const edge=i===2||i===10;
      const trimmed=r.trim(),text=edge?'*'.repeat(76):'* '+trimmed+' '.repeat(Math.max(0,72-visibleText(trimmed).length))+' *';
      html=` <span class="welcomepanel${edge?' panel-edge':''}">${esc(text)}</span> `;
    }
    html=html.replace(/\[\[([^|]+)\|([^|]+)\|([^|]+)(?:\|([^\]]+))?\]\]/g,(_,id,key,label,hot='0')=>{const n=Math.max(0,Math.min(label.length-1,Number(hot)||0));return `<button class="terminal-action" data-ui-action="${esc(id)}" data-hotkey="${esc(key)}">${esc(label.slice(0,n))}<span class="key">${esc(label.slice(n,n+1))}</span>${esc(label.slice(n+1))}</button>`});
    html=html.replace(/\{LANG\}/g,`<button class="frame-control" data-frame-action="language">L/${lang==='pl'?'EN':'PL'}</button>`).replace(/\{SPONSOR\}/g,`<span data-rot-pad>${' '.repeat(ROTW-SPONSORS[sponsorIndex][0].length)}</span><a class="sponsor-link" data-rot href="${SPONSORS[sponsorIndex][1]}" target="_blank" rel="noopener noreferrer">${SPONSORS[sponsorIndex][0]}</a>`).replace(/BIZNES\.EXE/g,'<span class="accent">BIZNES.EXE</span>').replace(/\{([A-Z])\}/g,'<span class="key">$1</span>').replace(/(\$\s*)([\d,]+(?:\.\d{2})?)/g,'$1<span class="accent">$2</span>').replace(/([\d,]+(?:\.\d{2})?)(\s*\$)/g,'<span class="accent">$1</span>$2');
    if(view==='home'&&i===16){const city=cities()[S.city];html=html.replace(esc(city),`<span class="accent">${esc(city)}</span>`)}

    const cls=panel?'panel-row':raw.includes('{CITYROW}')?'city-row':raw.includes('{LEFT}')?'action-bar':raw.includes('{AMOUNT}')?'amount-row':i===22?'footer-status':i===0?'statusline':view==='welcome'&&i===12?'welcome-instructions':view==='welcome'&&i>=13&&i<=17?'welcome-copy':view==='home'&&((notice&&i===20)||(mode&&i===18))?'promptline':view==='home'&&i===1?'tablehead':view==='home'&&i===17?'market-navigation':'';
    html=html.replace(/\{LEFT\}/g,'<span class="action-group group-left">').replace(/\{MID\}/g,'</span><span class="action-group group-middle">').replace(/\{RIGHT\}/g,'</span><span class="action-group group-right">').replace(/\{END\}/g,'</span>').replace(/\{CITYROW\}/g,'<span class="city-row-inner">').replace(/\{CITYEND\}/g,'</span>').replace(/\{SPONSOR_LINKS\}/g,[...SPONSORS].reverse().map(([name,url])=>`<a class="sponsor-link" href="${url}" target="_blank" rel="noopener noreferrer">${name}</a>`).join('    ')).replace(/\{AMOUNT\}/g,`<input id="amount-input" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="10" autocomplete="off" enterkeyhint="done" aria-label="${t('Quantity or amount','Ilość lub kwota')}" value="${esc(input)}">`);
    if(view==='welcome'&&i===22){const priv=t('Privacy','Prywatność'),left=RELEASE+' · ';html=`<span>${left}<a class="sponsor-link" href="privacy.html">${priv}</a>${' '.repeat(Math.max(1,78-left.length-priv.length-footerText().length))}</span><span>${esc(footerText())}</span>`}
    return `<span class="terminal-row ${cls}">${html}</span>`;
  }).join('\n');
}
const center=s=>{const length=visibleText(s).length,left=Math.max(0,Math.floor((78-length)/2));return ' '.repeat(left)+s+' '.repeat(Math.max(0,78-length-left))};
function pwaMessage(){return typeof window!=='undefined'?window.BiznesPWA?.message(lang)||'':''}
function statusText(){return typeof window!=='undefined'&&window.BiznesPWA?window.BiznesPWA.status(lang):'Offline'}
const footerText=()=>(storageOk?'':saveNote()+' · ')+statusText();

function topbar(){const tail='  {SPONSOR}  {LANG}',brand='BIZNES.EXE  ·  '+(['home','prompt'].includes(view)?goalText():t('Tiny economic game','Mała gra ekonomiczna'));return `${brand.padEnd(78-visibleText(tail).length)}${tail}`}
const instructions=()=>[
  [t('Buy goods and shares cheaply, then sell them for more. Share prices are fictional.','Kupuj towary i akcje tanio, a sprzedawaj drożej. Kursy akcji są fikcyjne.'),t('Buy goods and shares low; sell high. Share prices are fictional.','Kupuj towary i akcje tanio, sprzedawaj drożej. Kursy akcji są fikcyjne.')],
  [t('Travel is free: each trip changes market prices, increases your debt at a variable rate (1–30%) and may bring a reward or setback.','Podróż jest bezpłatna: każdy wyjazd zmienia ceny, zwiększa dług o zmienne 1–30% i może przynieść korzyść lub wpadkę.'),t('Free trips: new prices, debt +1–30%, possible rewards or setbacks.','Wyjazd: bez opłat, nowe ceny, dług +1–30%, możliwe korzyści lub wpadki.')],
  [t('Use Banks to deposit or withdraw cash, and Debt to borrow or repay it.','W Bankach wpłacaj i odbieraj gotówkę, a w Długu pożyczaj lub spłacaj pieniądze.'),t('Banks: deposit/withdraw. Debt: borrow/repay.','Banki: wpłać/odbierz gotówkę. Dług: pożycz/spłać pieniądze.')],
  [t('Choose an action, then an item. Enter the amount or use +, − and Max, then confirm. Correct errors in the same form; a successful transaction or Cancel returns to the main view.','Wybierz działanie, potem pozycję. Wpisz ilość lub użyj +, − i Maks, następnie zatwierdź. Błąd poprawisz w tym samym formularzu; udana transakcja lub Anuluj wraca do widoku głównego.'),t('Action → item → amount. Enter confirms; Esc cancels. Correct errors in place.','Działanie → pozycja → ilość. Enter zatwierdza, Esc anuluje. Błąd poprawisz.')],
  [t('Progress saves automatically. Menu returns to the welcome screen; Continue resumes your game.','Postęp zapisuje się automatycznie. Menu otwiera ekran powitalny, a Kontynuuj wznawia grę.'),t('Progress saves automatically. Menu → welcome; Continue → resume.','Postęp zapisuje się sam. Menu → powitanie; Kontynuuj → wznowienie.')]
];
function welcome(){
  const start=[button('new-game','N','Nowa gra','New game'),button('welcome-continue',lang==='pl'?'K':'C','Kontynuuj','Continue'),button('records',lang==='pl'?'W':'R','Wyniki','Records'),...canFinish()?[button('finish-game',lang==='pl'?'Z':'E','Zakończ grę','End game')]:[]];
  const settings=[button('install-app','I','Zainstaluj','Install'),button('font-toggle','F','F: Styl: '+styleName(),'F: Style: '+styleName())];
  return frame([
    topbar(),'','',
    center(t('BIZNES.EXE · Small game. Big business.','BIZNES.EXE · Mała gra. Wielki biznes.')),
    center(t('A lightweight game with an MS-DOS retro feel.','Lekka gra w klimacie retro MS-DOS.')),
    center(t('An independent adaptation inspired by:','Niezależna adaptacja inspirowana:')),
    center('Biznesman (1988), M. Cwynar / SAMBA.'),'',
    center(t('Project patrons:','Patroni projektu:')),center('{SPONSOR_LINKS}'),
    '','',center(t('How to play','Jak grać')),
    ...instructions().map(([,compact])=>center(compact)),
    center(t('Click a choice or press its highlighted letter.','Kliknij wybór albo naciśnij wyróżnioną literę.')),
    '-'.repeat(78),'{LEFT}'+start.join('   ')+'{MID}{RIGHT}'+settings.join('   ')+'{END}','-'.repeat(78)
  ]);
}
const operationLabel=()=>({buy:t('Buy','Kupno'),sell:t('Sell','Sprzedaż'),deposit:t('Deposit','Wpłata'),withdraw:t('Withdraw','Odbiór'),borrow:t('Borrow','Pożyczka'),repay:t('Repay','Spłata')}[mode]||'');
const chooseAction=()=>t('Choose an action:','Wybierz akcję:');
function marketTabs(){return [button('goods','T','Towary','Goods'),button('shares','A','Akcje','Shares'),button('bank','B','Banki','Banks')].join('   ')}
// Two screens; the active table is independent of the inline operation.
const GOODS_HOT=()=>lang==='pl'?[0,0,1,0,0,0,2,0,0,0]:[0,0,4,0,0,0,2,0,0,3];
const STOCK_LABELS=()=>lang==='pl'?STOCKS:STOCKSEN;
const STOCK_HOT=Array(10).fill(0);
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
  const headings=bank?[t('Bank','Bank'),t('Deposit up to','Możesz wpłacić'),t('Withdraw up to','Możesz odebrać'),t('Balance','Saldo')]:[table==='stocks'?t('Shares','Akcje'):t('Goods','Towar'),t('Price','Cena'),t('Owned','Masz'),t('Value','Wartość')];
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
    pair(t('Debt balance','Stan twojego długu'),money(S.debt),t('Debt growth per trip','Procent wzrostu długu'),`${S.debtRate} %`),
    pair(t('Account balance','Stan twojego konta'),money(S.cash),t('Debt coverage','Pokrycie długu'),`${coverage} %`),
    pair(t('Held in banks','W bankach posiadasz'),money(S.bank),'','─'.repeat(39)),
    pair(t('Held in shares','W akcjach posiadasz'),money(shareValue),t('Currently in','Przebywasz w'),cities()[S.city]),
    marketTabs(),...controls]);
}
function inlineControls(){
  const cancel=button('cancel','ESC','ESC anuluj','ESC cancel');
  if(!mode){
    const ops=table==='banks'?[button('deposit','P','Wpłać','Deposit',1),button('withdraw','O','Odbierz','Withdraw')]:[button('buy','K','Kupno','Buy'),button('sell','S','Sprzedaż','Sell')];
    const actions=[...ops,button('travel','W','Wyjazd','Travel'),button('debt','D','Dług','Debt')];
    return [chooseAction(),'{LEFT}{MID}'+actions.join('   ')+'{RIGHT}{END}',notice,button('quit','Q','Q - Wyjście','Q - Exit')];
  }
  if(mode==='travel'){
    const opts=cities().map((c,i)=>i===S.city?null:actionToken(`city-${i}`,c[0].toUpperCase(),c)).filter(Boolean);
    return [t('Where to?','Dokąd jedziemy?'),'{CITYROW}'+opts.slice(0,4).join('   ')+'{CITYEND}','{CITYROW}'+opts.slice(4).join('   ')+'{CITYEND}',' '+cancel];
  }
  if(mode==='debt'&&step==='choice')return [chooseAction(),
    ' '+button('borrow','P','Pożyczasz','Borrow')+'   '+button('repay','O','Oddajesz','Repay'),t('Loan limit per operation: 2000 $.','Limit pożyczki na operację: 2000 $.'),' '+cancel];
  if(step==='row'){
    return [' '+operationLabel()+': '+t('Select an item from the list.','Zaznacz pozycję na liście.'),'',notice,' '+cancel];
  }
  const max=maximum(),isMoney=['deposit','withdraw','borrow','repay'].includes(mode),item=entries()[selected]||{label:'',unit:''};
  const hint=isMoney?`${t('available','dostępne')}: ${money(max)}`:mode==='buy'?t(`you can buy ${max} ${item.unit}`,`możesz kupić ${max} ${item.unit}`):t(`you own ${max} ${item.unit}`,`posiadasz ${max} ${item.unit}`);
  const genitive=['kawy','herbaty','kakao','zboża','ropy naftowej','leków','złota','wideo','drukarek','samochodów'];
  const tradeTitle=t(`How many ${item.label} do you ${mode}?`,table==='goods'?`Ile ${genitive[selected]} ${mode==='buy'?'kupujesz':'sprzedajesz'}?`:`Ile akcji ${item.label} ${mode==='buy'?'kupujesz':'sprzedajesz'}?`);
  const title=mode==='borrow'?t('How much do you borrow?','Ile pożyczasz?'):mode==='repay'?t('How much do you repay?','Ile oddajesz?'):mode==='deposit'?t('How much do you deposit?','Ile wpłacasz?'):mode==='withdraw'?t('How much do you withdraw?','Ile odbierasz?'):tradeTitle;
  return [' '+title,' < '+hint+' >',notice,'{LEFT}'+cancel+'{MID}'+button('amount-minus','−','−','−')+' {AMOUNT} '+button('amount-plus','+','+','+')+' '+button('amount-max','MAX','Maks','Max')+'{RIGHT}'+button('submit',lang==='pl'?'Z':'C','Zatwierdź','Confirm')+'{END}'];
}
const M=document.querySelector('#mobile');
const mobileButton=(id,label,extra='')=>`<button type="button" data-ui-action="${esc(id)}" ${extra}>${esc(label)}</button>`;
const mobileCancel=()=>mobileButton('cancel',t('Esc · Cancel','Esc · Anuluj'));
function mobileView(){
  const links=[...SPONSORS].reverse().map(([name,url])=>`<a href="${url}" target="_blank" rel="noopener noreferrer">${name}</a>`).join('    ');
  const [sponsorName,sponsorUrl]=SPONSORS[sponsorIndex];
  const head=`<header class="mobile-head"><div class="mobile-brand"><strong>BIZNES.EXE</strong>${view==='home'?`<span class="mobile-city">${esc(cities()[S.city])}</span>`:''}</div><nav class="mobile-sponsors" aria-label="${t('Patrons','Patroni')}"><a data-rot href="${sponsorUrl}" target="_blank" rel="noopener noreferrer">${sponsorName}</a></nav>${mobileButton('language',lang==='pl'?'EN':'PL',`aria-label="${t('Switch language','Zmień język')}"`)}</header>`;
  if(view==='welcome')return head+`<section class="mobile-list mobile-welcome"><div class="mobile-manifest"><h1>${t('Small game. Big business.','Mała gra. Wielki biznes.')}</h1><p>${t('A lightweight game with an MS-DOS retro feel.','Lekka gra w klimacie retro MS-DOS.')}</p><p>${t('An independent adaptation inspired by:','Niezależna adaptacja inspirowana:')}<br>Biznesman (1988), M. Cwynar / SAMBA.</p><p>${t('Project patrons','Patroni projektu')}:<br>${links}</p></div><h2>${t('How to play','Jak grać')}</h2>${instructions().map(([text])=>`<p>${text}</p>`).join('')}</section>${pwaMessage()?`<p class="install-help" role="status">${esc(pwaMessage())}</p>`:''}<small class="mobile-status"><span>${RELEASE} · <a href="privacy.html">${t('Privacy','Prywatność')}</a></span><span>${esc(footerText())}</span></small><section class="mobile-dock mobile-welcome-dock"><div class="mobile-hand-row">${mobileButton('hand-toggle',handedness==='right'?t('Left-handed','Leworęczny'):t('Right-handed','Praworęczny'))}<span>${handedness==='right'?t('Right-handed ✓','Praworęczny ✓'):t('Left-handed ✓','Leworęczny ✓')}</span></div><div class="mobile-font-row">${mobileButton('install-app',t('Install app','Zainstaluj'))}${mobileButton('font-toggle',t('Style: ','Styl: ')+styleName())}</div><div class="mobile-primary-row">${mobileButton('records',t('Records','Wyniki'))}${canFinish()?mobileButton('finish-game',t('End game','Zakończ grę')):''}</div><div class="mobile-primary-row">${mobileButton('new-game',t('New game','Nowa gra'))}${mobileButton('welcome-continue',t('Continue','Kontynuuj'),'class="mobile-confirm"')}</div></section>`;
  const ps=l=>l.map(x=>`<p>${esc(x)}</p>`).join(''),page=(h,body,dock)=>head+`<section class="mobile-list mobile-welcome"><h1>${esc(h)}</h1>${body}</section><section class="mobile-dock"><div class="mobile-primary-row">${dock}</div></section>`,menu=mobileButton('quit','Menu');
  const recList=(g,rec)=>`<h2>${esc(recTitle(g))}</h2><ol class="mobile-records">${recordLines(g,rec).map(l=>`<li>${esc(l.replace(/^\d+\. /,''))}</li>`).join('')}</ol>`,G=GOALS();
  if(view==='end')return page(endTitle(),ps(endLines())+recList(S.goal,S.end?.rec),menu+mobileButton('new-game',t('New game','Nowa gra'),'class="mobile-confirm"'));
  if(view==='records')return page(t('Best results','Najlepsze wyniki'),[1,2,3].map(g=>recList(g)).join(''),menu);
  if(view==='goal')return page(t('New game · choose your goal','Nowa gra · wybierz cel'),[1,2,3].map(i=>`<button type="button" class="mobile-goal" data-ui-action="goal-${i}" aria-pressed="${i===goalPick}"><b>${i}) ${esc(G[i][0])}</b><span>${esc(G[i][1])}</span></button>`).join(''),menu+mobileButton('goal-'+goalPick,'Start · '+G[goalPick][0],'class="mobile-confirm"'));
  if(view==='prompt')return page(promptTitle(),ps(promptLines()),mobileButton('finish',t('Finish with score','Zakończ z wynikiem'))+mobileButton('play-on',t('Play on','Graj dalej'),'class="mobile-confirm"'));
  const bank=table==='banks',totals={goods:S.cargo.reduce((n,q,i)=>n+q*S.prices[i],0),shares:S.shares.reduce((n,q,i)=>n+q*stockPrice(i),0),bank:S.bank};
  const tabs=(handedness==='left'?[['goods',t('Goods','Towary')],['shares',t('Shares','Akcje')],['bank',t('Banks','Banki')]]:[['bank',t('Banks','Banki')],['shares',t('Shares','Akcje')],['goods',t('Goods','Towary')]]).map(([id,label])=>`<button type="button" data-ui-action="${id}" aria-pressed="${({goods:'goods',shares:'stocks',bank:'banks'}[id]===table&&mode!=='travel')}"><span>${label}</span><b>${money(totals[id])}</b></button>`).join('');
  const cards=entries().map((e,i)=>{
    const details=bank?`<span><b>${money(e.balance)}</b></span>`:`<span><b>${money(e.price)}</b></span><span>${e.qty} ${e.unit}</span><span>${money(e.qty*e.price)}</span>`;
    return `<button type="button" class="mobile-card" data-ui-action="pick-${i}" ${step==='row'?'':'disabled'}><span class="mobile-card-name">${esc(e.label)}</span><span class="mobile-card-details">${details}</span></button>`;
  }).join('');
  const operation=mobileOperation();
  return head+`<section class="mobile-summary"><span>${t('Cash','Gotówka')} <b>${money(S.cash)}</b></span><span class="mobile-debt">${t('Debt','Dług')} <b>${money(S.debt)}</b></span><small class="mobile-goal-status">${esc(goalText())}</small>${storageOk?'':`<small>${saveNote()}</small>`}</section>${!mode||step==='row'?`<div class="mobile-columns ${bank?'bank-columns':''}">${bank?`<span>${t('Balance','Saldo')}</span>`:`<span>${t('Price','Cena')}</span><span>${t('Owned','Masz')}</span><span>${t('Value','Wartość')}</span>`}</div>`:''}<section class="mobile-list">${!mode&&S.lastJourney?`<aside class="journey-report ${S.lastJourney.kind}" role="status"><strong>${t('Last journey','Ostatnia podróż')}</strong><p>${esc(S.lastJourney[lang])}</p></aside>`:''}${operation.content??cards}</section><section class="mobile-bottom"><nav class="mobile-tabs" aria-label="${t('Market totals','Łączna wartość')}">${tabs}</nav><section class="mobile-dock">${operation.footer}</section></section>`;
}
function mobileOperation(){
  const cancel=mobileCancel(),bank=table==='banks';
  const label=operationLabel();
  const message=notice?`<p class="mobile-notice has-message" role="status">${esc(notice)}</p>`:'';
  if(!mode)return {content:null,footer:`<p class="mobile-notice ${notice&&notice!==S.lastJourney?.[lang]?'has-message':''}" role="status">${esc((S.lastJourney?.[lang]===notice?'':notice)||chooseAction())}</p><nav class="mobile-main-actions">${mobileButton('debt',t('Debt','Dług'))}${mobileButton('quit','Menu')}${mobileButton('travel',t('Travel','Wyjazd'))}</nav><div class="mobile-primary-row">${mobileButton('mobile-sell',bank?t('Withdraw','Odbierz'):t('Sell','Sprzedaj'))}${mobileButton('mobile-buy',bank?t('Deposit','Wpłać'):t('Buy','Kup'),'class="mobile-confirm"')}</div>`};
  if(mode==='travel')return {content:'',footer:`<h2>${t('Where to?','Dokąd jedziemy?')}</h2><div class="mobile-cities">${cities().map((c,i)=>i===S.city?'':mobileButton(`city-${i}`,c)).join('')}</div><div class="mobile-operation-footer">${cancel}</div>`};
  if(mode==='debt')return {content:`<h2>${t('Manage debt','Obsługa długu')}</h2><p>${t('Current debt','Obecny dług')}: ${money(S.debt)}</p><p>${t('Debt growth on the next trip','Wzrost długu przy następnym wyjeździe')}: ${S.debtRate}%</p><p>${t('Loan limit per operation: 2000 $.','Limit pożyczki na operację: 2000 $.')}</p>`,footer:`<p>${chooseAction()}</p><div class="mobile-primary-row">${mobileButton('borrow',t('Borrow','Pożyczasz'))}${mobileButton('repay',t('Repay','Oddajesz'),'class="mobile-confirm"')}</div><div class="mobile-operation-footer">${cancel}</div>`};
  if(step==='row')return {content:null,footer:`${message}<p><span class="transaction-label">${label}:</span> ${t('Select an item from the list.','Zaznacz pozycję na liście.')}</p><div class="mobile-operation-footer">${cancel}</div>`};

  return {content:`<h2 class="transaction-label">${label}</h2>${['borrow','repay'].includes(mode)?'':`<p>${esc(entries()[selected].label)}</p>`}<p>${t('Maximum available','Maksymalnie dostępne')}: ${maximum()}</p>`,footer:`${message}<label for="mobile-amount-input">${t('Quantity / amount','Ilość / kwota')}</label><div class="mobile-quantity">${mobileButton('amount-minus','−',`aria-label="${t('Decrease','Zmniejsz')}"`)}<input id="mobile-amount-input" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="10" autocomplete="off" enterkeyhint="done" value="${esc(input)}">${mobileButton('amount-plus','+',`aria-label="${t('Increase','Zwiększ')}"`)}${mobileButton('amount-max',t('Max','Maks'))}</div><div class="mobile-operation-footer">${cancel}${mobileButton('submit',t('Confirm','Zatwierdź'),'class="mobile-confirm"')}</div>`};
}
function fitTerminal(){
  if(!T.getBoundingClientRect||typeof getComputedStyle!=='function')return;
  const style=getComputedStyle(T),width=T.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  if(!ctx)return;
  ctx.font=`100px ${style.fontFamily}`;
  const unit=ctx.measureText('0'.repeat(78)).width/100;
  if(width>0&&unit>0)T.style.setProperty('--terminal-font',`${width/unit}px`);
}

// Round end: repaying all debt wins; net worth below -250 000 $ or the number limit is bankruptcy.
const BANKRUPT=-250000;
function netWorth(){return S.cash+S.bank+S.cargo.reduce((n,q,i)=>n+q*S.prices[i],0)+S.shares.reduce((n,q,i)=>n+q*stockPrice(i),0)-S.debt}
const GOALS=()=>[,[t('Trading year','Rok handlu'),t('365 days, then score = net worth.','365 dni, potem wynik = majątek netto.')],[t('Goal 1 000 000 $','Cel 1 000 000 $'),t('Win at 1 000 000 $ net worth.','Wygrana przy majątku netto 1 000 000 $.')],[t('Endless','Bez końca'),t('No forced end; finish from the menu.','Bez końca; zakończysz z menu.')]];
const progress=()=>S.goal===1?t(`${Math.max(0,365-S.day)} days left`,`zostało ${Math.max(0,365-S.day)} dni`):S.goal===2?Math.max(0,Math.min(100,Math.floor(netWorth()/1e4)))+' %':t(`day ${S.day}`,`dzień ${S.day}`);
const goalText=()=>GOALS()[S.goal][0]+': '+progress();
// Local top-5 per goal (bx-records); a broken list is backed up, never dropped silently.
function records(){const raw=store.get('bx-records');try{const r=JSON.parse(raw||'{}');if(r&&typeof r==='object')return r}catch{}store.set('bx-records-backup',raw);return{}}
const top=g=>{const l=records()[g];return Array.isArray(l)?l.filter(e=>Number.isFinite(e?.w)&&int(e.d,1)).slice(0,5):[]};
function addRecord(){const r=records(),e={w:netWorth(),d:S.day,s:S.seed};r[S.goal]=[...top(S.goal),e].sort((a,b)=>b.w-a.w||a.d-b.d).slice(0,5);store.set('bx-records',JSON.stringify(r));return e}
const recordLines=(g,rec)=>{const l=top(g);return l.length?l.map((e,i)=>`${i+1}. ${money(e.w).padStart(16)}  ${t('day','dzień')} ${String(e.d).padEnd(5)}${rec&&e.w===rec.w&&e.d===rec.d&&e.s===S.seed?' ◄':'  '}`):[t('no results yet','brak wyników')]};
const canFinish=()=>S.alive&&(S.goal===3||S.ms.includes('m1'));
function endRound(kind){const rec=kind==='bankrupt'?null:kind==='win'?S.winRec:addRecord();S.alive=false;S.end={kind,day:S.day,worth:netWorth(),rec};delete S.prompt;S.lastJourney=null;eventPopup=false;view='end';mode='';step='';input='';notice='';render()}
// Milestones ask once per game; only bankruptcy (and the end of the trading year) force an end.
function checkGoals(repaid){
  if(!S.alive||view!=='home')return;
  if(S.goal===1&&S.day>=365)return endRound('year');
  const w=netWorth(),hit=[...(repaid?['debt']:[]),...['k100','k500','m1'].filter(m=>w>=LIM[m]&&(m!=='m1'||S.goal===2))].filter(m=>!S.ms.includes(m));
  if(!hit.length)return;
  S.ms.push(...hit);S.prompt=hit.at(-1);if(S.prompt==='m1')S.winRec=addRecord();
  eventPopup=false;view='prompt';mode='';step='';input='';notice='';render();
}
const promptTitle=()=>({debt:t('Debt repaid!','Dług spłacony!'),k100:t('Net worth 100 000 $!','Majątek netto 100 000 $!'),k500:t('Net worth 500 000 $!','Majątek netto 500 000 $!'),m1:t('GOAL! 1 000 000 $ net worth!','CEL! Majątek netto 1 000 000 $!')}[S.prompt]);
const promptLines=()=>[t(`Day: ${S.day}`,`Dzień: ${S.day}`),t(`Net worth: ${money(netWorth())}`,`Majątek netto: ${money(netWorth())}`),S.prompt==='m1'?t('Score recorded. Free play continues if you like.','Wynik zapisany. Możesz grać dalej bez limitu.'):t('Keep playing or finish and record your score.','Graj dalej albo zakończ i zapisz wynik.')];
const promptButtons=()=>[button('play-on',lang==='pl'?'G':'P','1 Graj dalej','1 Play on',2),button('finish',lang==='pl'?'Z':'F','2 Zakończ z wynikiem','2 Finish with score',2)];
const endKind=()=>S.end?.kind||(S.end?.win?'win':'bankrupt');
const endTitle=()=>({win:t('GOAL REACHED! 1 000 000 $','CEL OSIĄGNIĘTY! 1 000 000 $'),year:t('THE TRADING YEAR IS OVER.','KONIEC ROKU HANDLU.'),finish:t('GAME FINISHED. Score recorded.','KONIEC GRY. Wynik zapisany.'),bankrupt:t('BANKRUPTCY. Game over.','BANKRUCTWO. Koniec gry.')}[endKind()]);
const endLines=()=>[t(`Day: ${S.end?.day??S.day}`,`Dzień: ${S.end?.day??S.day}`),t(`Net worth: ${money(S.end?.worth??0)}`,`Majątek netto: ${money(S.end?.worth??0)}`),endKind()==='bankrupt'?t(`The limit is ${money(BANKRUPT)} or the number limit.`,`Granica: ${money(BANKRUPT)} lub limit liczb.`):t('Goal: ','Cel: ')+GOALS()[S.goal][0]];
const STARS=()=>center('*'.repeat(40)),recTitle=g=>t('Best results · ','Najlepsze wyniki · ')+GOALS()[g][0];
function endScreen(){return frame([topbar(),'',STARS(),center(endTitle()),STARS(),'',...endLines().map(center),'',center(recTitle(S.goal)),...recordLines(S.goal,S.end?.rec).map(center),'',center(button('new-game','N','Nowa gra','New game')+'   '+button('quit','Q','Q - Menu','Q - Menu'))])}
function goalScreen(){const g=GOALS();return frame([topbar(),'','',center(t('NEW GAME · CHOOSE YOUR GOAL','NOWA GRA · WYBIERZ CEL')),STARS(),'',...[1,2,3].flatMap(i=>[center((i===goalPick?'► ':'  ')+button('goal-'+i,String(i),`${i}) ${g[i][0]}`,`${i}) ${g[i][0]}`)+(i===goalPick?' ◄':'  ')),center(g[i][1]),'']),'',center(t('1/2/3 choose · Enter = highlighted · Esc = menu','1/2/3 wybór · Enter = podświetlony · Esc = menu'))])}
function promptScreen(){return frame([topbar(),'','','','',STARS(),center(promptTitle()),STARS(),'',...promptLines().map(center),'','','',center(promptButtons().join('   '))])}
function recordsScreen(){return frame([topbar(),center(t('BEST RESULTS (this device)','NAJLEPSZE WYNIKI (to urządzenie)')),...[1,2,3].flatMap(g=>[recTitle(g),...recordLines(g).map(l=>'   '+l)]),center(button('quit','Q','Q - Menu','Q - Menu'))])}
function screen(){return view==='welcome'?welcome():view==='end'?endScreen():view==='goal'?goalScreen():view==='prompt'?promptScreen():view==='records'?recordsScreen():home()}
function updateMobile(html){
  if(!M)return;
  if(!document.createElement){M.innerHTML=html;return}
  const template=document.createElement('template');template.innerHTML=html;
  function patch(parent,next){
    for(let i=0;i<next.childNodes.length;i++){
      const fresh=next.childNodes[i],old=parent.childNodes[i];
      if(!old){parent.appendChild(fresh.cloneNode(true));continue}
      // A different action is a new control; never carry focus to an unrelated button.
      if(old.nodeType!==fresh.nodeType||old.nodeName!==fresh.nodeName||old.nodeType===1&&(old.id!==fresh.id||old.getAttribute('data-ui-action')!==fresh.getAttribute('data-ui-action'))){old.replaceWith(fresh.cloneNode(true));continue}
      if(old.nodeType===3){if(old.nodeValue!==fresh.nodeValue)old.nodeValue=fresh.nodeValue;continue}
      if(old.nodeType!==1)continue;
      for(const attr of [...old.attributes])if(!fresh.hasAttribute(attr.name))old.removeAttribute(attr.name);
      for(const attr of fresh.attributes)if(old.getAttribute(attr.name)!==attr.value)old.setAttribute(attr.name,attr.value);
      if(old.tagName==='INPUT'){if(old.value!==fresh.value)old.value=fresh.value;}
      else patch(old,fresh);
    }
    while(parent.childNodes.length>next.childNodes.length)parent.lastChild.remove();
  }
  patch(M,template.content);
}
function render(persist=true){
  const id=document.activeElement?.id,focused=['amount-input','mobile-amount-input'].includes(id),kept=T.contains?.(document.activeElement)&&document.activeElement.dataset?.uiAction;
  if(persist)save();
  document.body.dataset.font=fontStyle;document.body.dataset.hand=handedness;
  if(document.documentElement)document.documentElement.lang=lang;
  document.querySelector('.screen')?.setAttribute?.('aria-label',t('BIZNES.EXE game terminal, 80 by 25','Terminal gry BIZNES.EXE, 80 na 25'));
  const live=document.querySelector('#sr-message');if(live&&live.textContent!==notice)live.textContent=notice;
  T.innerHTML=screen();updateMobile(mobileView());fitTerminal();renderJourneyPopup();
  const help=document.querySelector('#desktop-install-help');
  if(help){help.textContent=view==='welcome'?pwaMessage():'';help.hidden=!help.textContent}
  if(focused&&document.activeElement?.id!==id)document.querySelector('#'+id)?.focus?.({preventScroll:true});
  // Redrawing the terminal must not drop keyboard focus.
  else if(kept&&!T.contains(document.activeElement))T.querySelector(`[data-ui-action="${kept}"]`)?.focus({preventScroll:true});
}
let noticeSerial=0;
function renderJourneyPopup(){
  if(!D)return;
  if(!eventPopup){D.close?.();return}
  if(D.open)return;
  D.innerHTML=`<h2 id="journey-title">${t('Travel event','Zdarzenie w podróży')}</h2><p>${esc(S.lastJourney[lang])}</p>${mobileButton('close-event',t('Continue','Dalej'))}`;
  D.oncancel=e=>{e.preventDefault();select('close-event')};
  D.showModal?.();
}
function expireJourneyAfterDelay(){
  const report=S.lastJourney;
  if(!report)return;
  const remaining=(report.expiresAt||0)-Date.now();
  const expire=()=>{
    if(S.lastJourney!==report)return;
    if(notice===report.pl||notice===report.en)notice='';
    S.lastJourney=null;eventPopup=false;render();
  };
  if(remaining<=0)expire();
  else if(typeof setTimeout==='function')setTimeout(expire,remaining);
}
function homeNotice(msg){
  view='home';step='';mode='';input='';showNotice(msg);
}
function showNotice(msg){
  notice=msg;render();
  const serial=++noticeSerial;
  if(msg&&typeof setTimeout==='function')setTimeout(()=>{if(serial===noticeSerial&&notice===msg){notice='';render(false)}},7000);
}
function stockPrice(i){return S.stockPrices[i]}
function maximum(){
  if(mode==='borrow')return Math.min(2000,2147483647-S.cash,2147483647-S.debt);
  if(mode==='repay')return Math.min(S.cash,S.debt);
  if(mode==='deposit')return Math.min(S.cash,2147483647-S.bank);
  if(mode==='withdraw')return Math.min(S.banks[selected],2147483647-S.cash);
  const e=entries()[selected];
  return mode==='sell'?Math.min(e.qty,Math.floor((2147483647-S.cash)/e.price)):Math.max(0,Math.min(Math.floor(S.cash/e.price),65535-e.qty));
}
function chooseRow(i){
  if(step!=='row'||i<0||i>=entries().length)return;
  selected=i;input='';notice='';step='quantity';
  if(maximum()<1){step='row';return showNotice(mode==='sell'?t(`You do not own: ${entries()[i].label}.`,`Nie posiadasz: ${entries()[i].label}.`):mode==='withdraw'?t('This bank account is empty.','To konto bankowe jest puste.'):t('Not enough funds for this operation.','Nie masz pieniędzy na tę operację.'));}
  render();
}
function submit(){
  if(step!=='quantity')return;
  const n=Number(input);
  if(!Number.isSafeInteger(n)||n<1||n>maximum())return showNotice(t('Invalid quantity or insufficient funds.','Nieprawidłowa ilość albo za mało środków.'));
  let ok=true;
  if(mode==='buy'||mode==='sell'){
    const buying=mode==='buy',e=entries()[selected];
    S.cash+=n*e.price*(buying?-1:1);(table==='goods'?S.cargo:S.shares)[selected]+=n*(buying?1:-1);
  }else{
    const op={deposit:0,withdraw:1,repay:2,borrow:3}[mode];
    S.cash+=n*([1,3].includes(op)?1:-1);if(op<2)S.bank+=n*(op===0?1:-1);else S.debt+=n*(op===3?1:-1);
    if(ok&&op<2)S.banks[selected]+=n*(op===0?1:-1);
  }
  if(!ok)return showNotice(t('Operation failed.','Operacja nie powiodła się.'));
  const repaid=mode==='repay'&&S.debt===0;
  homeNotice(repaid?t('Debt repaid!','Dług spłacony!'):t('Transaction completed.','Transakcja zakończona.'));checkGoals(repaid);
}
function nextDebtRate(){
  if(rand(5)===0)return S.debtRate;
  const down=S.debtRate>=15?rand(100)<85:rand(2)===0;
  return Math.max(1,Math.min(30,S.debtRate+(down?-1:1)*(1+rand(3))));
}
// Each journey mixes the previous price, an in-game day trend and fresh market noise.
// Goods also reflect the destination city; shares follow the global market.
function marketPrice(base,previous,i,local){
  const trend=Math.sin((S.day+i*3)/6)*.15;
  const city=local?((S.city*17+i*11)%41-20)/100:0;
  const noise=(rand(51)-25)/100;
  const target=base*(1+trend+city+noise);
  return Math.max(1,Math.round(Math.max(base*.4,Math.min(base*1.8,previous*.6+target*.4))));
}
function updateMarkets(){
  S.day++;S.debt+=Math.floor(S.debt*S.debtRate/100);S.debtRate=nextDebtRate();
  S.prices=BASE.map((base,i)=>marketPrice(base,S.prices[i],i,true));
  S.stockPrices=S.stockPrices.map((previous,i)=>marketPrice(120+i*4,previous,i,false));
}
function trigger(id){
  const cash=rand(150)+50,g=rand(10);let detail='',kind='good';
  const gain=()=>{const n=Math.min(cash,2147483647-S.cash);S.cash+=n;detail=`+${n} $`};
  const loss=()=>{const n=Math.min(S.cash,cash);S.cash-=n;detail=`-${n} $`;kind='bad'};
  // Select only applicable events: a plague cannot destroy goods you do not own.
  if(id===12&&!S.cargo[1]||id===13&&!S.cargo[2]||id===3&&!used()||id===14&&!used())id=15;
  if([1,4,5,9,14].includes(id)&&!S.cash)id=2;
  switch(id){
    case 0:case 7:case 8:case 10:case 15:gain();break;
    case 1:case 4:case 5:case 9:case 14:loss();break;
    case 2:{const n=Math.min(1+rand(3),65535-S.cargo[g]);if(n){S.cargo[g]+=n;detail=`+${n} ${goods()[g]}`}else gain();break}
    case 3:case 12:case 13:{const held=S.cargo.map((q,i)=>q?i:-1).filter(i=>i>=0),i=id===12?1:id===13?2:held[rand(held.length)];const n=Math.max(1,Math.ceil(S.cargo[i]*(10+rand(21))/100));S.cargo[i]-=n;detail=`-${n} ${goods()[i]}`;kind='bad';break}
    case 6:S.day++;detail=t('+1 day','+1 dzień');kind='bad';break;
    case 11:S.prices[g]=Math.max(1,Math.floor(S.prices[g]*.65));detail=`${goods()[g]}: ${money(S.prices[g])}`;break;
  }
  S.lastJourney={pl:EVENTS[id][1]+' '+detail,en:EVENTS[id][2]+' '+detail,kind,expiresAt:Date.now()+15000};
  eventPopup=true;homeNotice(S.lastJourney[lang]);expireJourneyAfterDelay();
}
function travelTo(city){
  if(city<0||city>=C.length)return;
  if(city===S.city)return homeNotice(t('You are already here.','Już tu jesteś.'));
  if(S.debt+Math.floor(S.debt*S.debtRate/100)>2147483647)return endRound('bankrupt');
  let result=-1;
  const fee=0;S.cash-=fee;S.city=city;updateMarkets();if(rand(100)<35)result=rand(EVENTS.length);
  S.lastJourney=null;
  if(result>=0)trigger(result);
  else homeNotice(t('Trip complete. Prices changed.','Podróż zakończona. Ceny uległy zmianie.'));
  if(netWorth()<BANKRUPT)return endRound('bankrupt');
  checkGoals();
}
function newGame(goal){S=fresh();S.goal=goal;table='goods';homeNotice(t('New game: ','Nowa gra: ')+GOALS()[goal][0])}
const chooseGoal=()=>{goalPick=1;view='goal';notice='';render(false)};
function select(id){
  if(eventPopup){eventPopup=false;D?.close?.();if(id==='close-event'){render(false);return}}
  if(id==='install-app'){if(typeof window!=='undefined')window.BiznesPWA?.install();return}
  if(id==='language'){lang=lang==='pl'?'en':'pl';notice='';store.set('bx-lang',lang);render();return}
  if(view==='end'){if(id==='new-game')chooseGoal();else if(id==='quit'){view='welcome';render(false)}return}
  if(view==='goal'||view==='records'){const g=/^goal-([123])$/.exec(id);if(g&&view==='goal')newGame(Number(g[1]));else if(id==='quit'){view='welcome';render(false)}return}
  if(view==='prompt'){if(id==='play-on'){delete S.prompt;homeNotice(t('Playing on.','Grasz dalej.'))}else if(id==='finish')endRound(S.prompt==='m1'?'win':'finish');return}
  if(view==='welcome'){
    if(id==='hand-toggle'){handedness=handedness==='right'?'left':'right';store.set('bx-hand',handedness)}
    else if(id==='font-toggle'){fontStyle=STYLES[(STYLES.findIndex(style=>style.id===fontStyle)+1)%STYLES.length].id;store.set('bx-style',fontStyle);store.set('bx-font',fontStyle)}
    else if(id==='welcome-continue'){if(S.alive===false||S.prompt){view=S.prompt&&S.alive?'prompt':'end';render(false);return}homeNotice(notice);return}
    else if(id==='new-game'){chooseGoal();return}
    else if(id==='records'){view='records';render(false);return}
    else if(id==='finish-game'){if(canFinish())endRound(S.goal===3?'finish':'win');return}

    render();return;
  }
  if(['goods','shares','bank'].includes(id)){
    const buying=['buy','deposit'].includes(mode),selling=['sell','withdraw'].includes(mode);
    table={goods:'goods',shares:'stocks',bank:'banks'}[id];
    mode=buying?(table==='banks'?'deposit':'buy'):selling?(table==='banks'?'withdraw':'sell'):'';
    step=mode?'row':'';input='';notice='';selected=0;
    render();return;
  }
  const pick=/^pick-(\d+)$/.exec(id);
  if(pick&&step==='row'&&Number(pick[1])<entries().length){notice='';chooseRow(Number(pick[1]));return}
  if(!mode&&['mobile-buy','mobile-sell'].includes(id)){mode=table==='banks'?(id==='mobile-buy'?'deposit':'withdraw'):(id==='mobile-buy'?'buy':'sell');step='row';notice='';input='';render();return}
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
  if(id==='debt'){mode='debt';step='choice'}
  else if(id==='travel'){mode='travel';step='city'}
  else if((table==='banks'?['deposit','withdraw']:['buy','sell']).includes(id)){mode=id;step='row'}
  render();
}
function action(k){
  const pl=lang==='pl',menu={Q:'quit',ESC:'quit',L:'language'};
  const keys={end:{N:'new-game',...menu},records:menu,goal:{1:'goal-1',2:'goal-2',3:'goal-3',ENTER:'goal-'+goalPick,...menu},prompt:{1:'play-on',ENTER:'play-on',2:'finish',[pl?'G':'P']:'play-on',[pl?'Z':'F']:'finish',L:'language'},welcome:{N:'new-game',K:'welcome-continue',C:'welcome-continue',ENTER:'welcome-continue',F:'font-toggle',I:'install-app',L:'language',[pl?'W':'R']:'records',[pl?'Z':'E']:'finish-game'}}[view];
  if(keys){if(keys[k])select(keys[k]);return}
  if(k==='ESC'){select('cancel');return}
  if(mode){
    if(mode==='travel'){const i=cities().findIndex((c,i)=>i!==S.city&&c[0].toUpperCase()===k);if(i>=0)travelTo(i);return}
    if(mode==='debt'&&step==='choice'){if(k==='P')select('borrow');else if(k==='O')select('repay');return}
    if(step==='row'){const i=entries().findIndex(e=>e.label[e.hot].toUpperCase()===k);if(i>=0)chooseRow(i);return}
    if(step==='quantity'){if(/^\d$/.test(k)&&input.length<10)input+=k;else if(k==='BACKSPACE')input=input.slice(0,-1);else if(k==='ENTER'||k===(lang==='pl'?'Z':'C')){submit();return}render()}
    return;
  }
  // A notice never intercepts the next command.
  const common={T:'goods',A:'shares',B:'bank',W:'travel',D:'debt',Q:'quit',L:'language'};
  const id=common[k]||(table==='banks'?{P:'deposit',O:'withdraw'}:{K:'buy',S:'sell'})[k];
  if(id)select(id);
}
for(const root of [T,M,D].filter(Boolean)){root.addEventListener('input',e=>{
  if(!['amount-input','mobile-amount-input'].includes(e.target.id))return;
  input=e.target.value.replace(/[^0-9]/g,'').slice(0,10);e.target.value=input;
});
root.addEventListener('click',e=>{const f=e.target.closest?.('[data-frame-action]');if(f){select('language');return}const a=e.target.closest?.('[data-ui-action]');if(a)select(a.dataset.uiAction)});}
document.addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  if(eventPopup&&(e.key==='Escape'||e.key==='Enter')){e.preventDefault();select('close-event');return}
  if(['amount-input','mobile-amount-input'].includes(e.target?.id)){
    if(e.key==='Enter'||e.key.toUpperCase()===(lang==='pl'?'Z':'C')){e.preventDefault();submit()}
    else if(e.key==='Escape'){e.preventDefault();select('cancel')}
    return;
  }
  // Let a focused native button handle Enter/Space once through its click event.
  if((e.key==='Enter'||e.key===' ')&&e.target?.closest?.('button,a'))return;
  let k=e.key.toUpperCase();if(k==='ESCAPE')k='ESC';
  if(k==='BACKSPACE'||k==='ENTER'||k==='ESC'||k.length===1){e.preventDefault();action(k)}
});
// Keep the bottom dock above the on-screen keyboard on mobile browsers.
if(typeof window!=='undefined')window.addEventListener('pwa-state',()=>{if(view==='welcome')render(false)});
if(typeof window!=='undefined'&&window.visualViewport){
  const viewport=window.visualViewport;let queued=false;
  const reposition=()=>{
    if(queued)return;queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      // Anchor BOTH edges to Safari's visible viewport. Flex only shrinks the middle.
      M?.style.setProperty('--visible-top',`${viewport.offsetTop}px`);
      M?.style.setProperty('--visible-height',`${viewport.height}px`);
    });
  };
  viewport.addEventListener('resize',reposition);
  viewport.addEventListener('scroll',reposition);
  window.addEventListener('resize',reposition);
  window.addEventListener('scroll',reposition);
  reposition();
}
if(typeof ResizeObserver!=='undefined')new ResizeObserver(fitTerminal).observe(T);
if(document.fonts){document.fonts.ready.then(fitTerminal);document.fonts.addEventListener?.('loadingdone',fitTerminal)}
expireJourneyAfterDelay();
render();
// Rotate the patron in place: no redraw, so focus and screen readers stay put.
function rotatePatron(){sponsorIndex=(sponsorIndex+1)%SPONSORS.length;const [name,url]=SPONSORS[sponsorIndex];for(const a of document.querySelectorAll('[data-rot]')){a.href=url;a.textContent=name}for(const pad of document.querySelectorAll('[data-rot-pad]'))pad.textContent=' '.repeat(ROTW-name.length)}
if(typeof setInterval==='function')setInterval(rotatePatron,7000);
})();
