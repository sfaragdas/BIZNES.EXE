(()=>{'use strict';
const C=['Amsterdam','Bangkok','Gdynia','Hongkong','Londyn','Monachium','Nowy Jork','Rzym','Tokio'];
const CEN=['Amsterdam','Bangkok','Gdynia','Hong Kong','London','Munich','New York','Rome','Tokyo'];
const GOODS=['Kawa','Herbata','Tytoń','Zboże','Ropa naftowa','Leki','Broń','Wideo','Drukarki','Samochody'];
const GEN=['Coffee','Tea','Tobacco','Grain','Oil','Medicine','Weapons','Video','Printers','Cars'];
const UNITS=['ton','ton','ton','ton','ton','szt.','szt.','szt.','szt.','szt.'];
// Stable asset indices keep existing inventories intact; display order is separate.
const GOODS_RANGES=[[6,36],[4,26],[7,66],[3,27],[10,93],[26,89],[38,128],[56,166],[85,244],[500,1450]];
const SHARE_RANGES=[[100,250],[80,200],[60,150],[40,100],[20,50],[120,300]];
const rangeOrder=(ranges)=>(a,b)=>ranges[a.index][0]-ranges[b.index][0];
function randomInt(state,n){state.rng^=state.rng<<13;state.rng^=state.rng>>>17;state.rng^=state.rng<<5;return(state.rng>>>0)%n}
function randomPrice(state,[low,high],previous){
  // One third of trips can explore the entire band; otherwise a local move.
  let from=low,to=high;
  if(previous!==undefined&&randomInt(state,3)!==0){const step=Math.ceil((high-low)/4);from=Math.max(low,previous-step);to=Math.min(high,previous+step)}
  const skip=previous!==undefined&&previous>=from&&previous<=to;
  let price=from+randomInt(state,to-from+1-(skip?1:0));
  if(skip&&price>=previous)price++;
  return price;
}
const BANKS=['Szwajcarski','Francuski','Angielski','Polski','USA','Kanadyjski'];
const BANKSEN=['Swiss','French','English','Polish','US','Canadian'];
const EVENTS=[
['WIN','Wygrana na loterii!','Lottery win!'],['THEFT','Złodziej zabrał część gotówki.','A thief took some cash.'],
['CARGO','Prezent od zaprzyjaźnionego kupca.','A gift from a fellow trader.'],['LOSS','Uszkodzono część towaru w drodze.','Some goods were damaged in transit.'],
['FINE','Mandat podczas podróży.','A fine during the trip.'],['CUSTOMS','Opłata celna na granicy.','Customs duty at the border.'],
['DELAY','Opóźnienie podróży o dzień.','Trip delayed by one day.'],['REFUND','Zwrot nadpłaconego podatku.','An overpaid tax was refunded.'],
['PRIZE','Nagroda od partnera handlowego.','A reward from a trading partner.'],['BREAK','Koszt naprawy pojazdu.','Vehicle repair costs.'],
['GIFT','Ktoś przekazał Ci darowiznę.','Someone sent you a donation.'],['BARGAIN','Wyprzedaż obniżyła cenę towaru.','A sale reduced a market price.'],
['TEA','Szkodniki zniszczyły liście herbaty.','Pests damaged your tea leaves.'],['TOBACCO','Plaga uszkodziła liście tytoniu.','A blight damaged your tobacco leaves.'],
['TAX','Podatek od przewożonych towarów.','A tax on transported goods.'],['FIND','Znalazłeś pieniądze w drodze.','You found money along the way.']];
const T=document.querySelector('#terminal'),D=document.querySelector('#journey-dialog');
const SPONSORS=[['MojeDostawy.pl','https://mojedostawy.pl'],['LCSE.pl','https://lcse.pl']];
let eventPopup=false;
const MAX_NUMBER=2147483647;
let storageFailed=false,saveBlocked=false,invalidSave=false,backupSaved=false;
function readLocal(key){try{return localStorage.getItem(key)??localStorage.getItem(key.replace('bx-classic-','bx-'))}catch{storageFailed=true;if(key==='bx-classic-save')saveBlocked=true;return null}}
function writeLocal(key,value){try{localStorage.setItem(key,value);return true}catch{storageFailed=true;return false}}
function storageMessage(){return invalidSave?t(backupSaved?'Damaged save backed up. Choose New game to start again.':'Damaged save preserved; backup failed. Autosave disabled.','Zapis uszkodzony. '+(backupSaved?'Kopia zachowana. Wybierz Nowa gra.':'Brak kopii. Autozapis wyłączony.')):saveBlocked||storageFailed?t('Autosave unavailable. Progress is only in memory.','Autozapis nie działa. Postęp jest tylko w pamięci.'):''}
const integer=(n,max=MAX_NUMBER,min=0)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
function validSave(s){
  if(s?.stockPrices!==undefined&&(!Array.isArray(s.stockPrices)||s.stockPrices.length!==6||!s.stockPrices.every(n=>integer(n,MAX_NUMBER,1))))return false;
  if(s?.debtRate!==undefined&&!integer(s.debtRate,35,1))return false;
  if(s?.borrowedThisStay!==undefined&&typeof s.borrowedThisStay!=='boolean')return false;
  if(!s||typeof s!=='object'||Array.isArray(s)||![undefined,2].includes(s.schema))return false;
  if(!['cash','bank','debt'].every(k=>integer(s[k]))||!integer(s.city,s.schema?8:7)||!integer(s.day,MAX_NUMBER,1)||!integer(s.rng,4294967295,-2147483648)||!integer(s.seed,4294967295)||typeof s.alive!=='boolean')return false;
  const array=(a,length,max,min=0)=>Array.isArray(a)&&a.length===length&&a.every(n=>integer(n,max,min));
  if(!array(s.cargo,10,65535)||!array(s.prices,10,MAX_NUMBER,1))return false;
  if(!(array(s.shares,10,65535)||array(s.shares,6,65535)||(!s.schema&&array(s.shares,3,65535))||(!s.schema&&s.shares===undefined)))return false;
  if(s.banks!==undefined?(!array(s.banks,6,MAX_NUMBER)||s.banks.reduce((a,b)=>a+b,0)!==s.bank):!!s.schema)return false;
  const r=s.lastJourney;
  if(r!=null){
    if(typeof r!=='object'||!['good','bad'].includes(r.kind)||!integer(r.expiresAt,Number.MAX_SAFE_INTEGER))return false;
    if(r.id===undefined){if(typeof r.pl!=='string'||typeof r.en!=='string'||r.pl.length>1000||r.en.length>1000)return false}
    else {
      if(!integer(r.id,15)||!integer(r.amount,MAX_NUMBER,-MAX_NUMBER)||!integer(r.good,9))return false;
      const type=[2,3,12,13].includes(r.id)?'goods':r.id===11?'price':r.id===6?'day':'cash';
      if(r.type!==type||type==='day'&&r.amount!==1||type==='goods'&&Math.abs(r.amount)>65535||type==='price'&&r.amount<1)return false;
    }
  }
  return true;
}
function preserveInvalid(raw){
  invalidSave=true;saveBlocked=true;
  try{let key='bx-classic-save-corrupt-'+Date.now(),i=0;while(localStorage.getItem(key)!==null)key='bx-classic-save-corrupt-'+Date.now()+'-'+(++i);localStorage.setItem(key,raw);backupSaved=localStorage.getItem(key)===raw}catch{storageFailed=true}
}
function loadSave(){
  const raw=readLocal('bx-classic-save');if(raw===null)return fresh();
  try{const state=JSON.parse(raw);if(!validSave(state))throw Error('Invalid save');return state}catch{preserveInvalid(raw);return fresh()}
}
let handedness=readLocal('bx-classic-hand')==='left'?'left':'right';
const STYLES=[{id:'current',name:'Standard'},{id:'retro',name:'DOS'},{id:'matrix',name:'Matrix'}];
let sponsorIndex=0,fontStyle=readLocal('bx-classic-style')||readLocal('bx-classic-font')||'current';
if(!STYLES.some(style=>style.id===fontStyle))fontStyle='current';
const styleName=()=>STYLES.find(style=>style.id===fontStyle).name;
const RELEASE='2026.09.29';
let lang=(readLocal('bx-classic-lang')==='en'?'en':'pl'),view='welcome',notice='',selected=0,input='',step='',mode='',table='goods';
const t=(en,pl)=>lang==='pl'?pl:en, goods=()=>lang==='pl'?GOODS:GEN, cities=()=>lang==='pl'?C:CEN, banks=()=>lang==='pl'?BANKS:BANKSEN;
const fresh=()=>{
  const state={schema:2,debtRate:5+(Date.now()>>>0)%6,borrowedThisStay:false,cash:1000,bank:0,debt:10000,city:0,day:1,cargo:Array(10).fill(0),shares:Array(6).fill(0),banks:Array(6).fill(0),rng:(Date.now()>>>0)||42,alive:true,seed:Date.now()>>>0};
  state.prices=GOODS_RANGES.map(range=>randomPrice(state,range));
  state.stockPrices=SHARE_RANGES.map(range=>randomPrice(state,range));
  return state;
};
let S=loadSave();
S.borrowedThisStay??=false;
S.debtRate=Math.min(30,S.debtRate??(5+(S.rng>>>0)%6));
delete S.capacity;
const legacySave=!S.schema;
if(!Array.isArray(S.shares))S.shares=Array(6).fill(0);while(S.shares.length<6)S.shares.push(0);
if(!Array.isArray(S.banks)){S.banks=Array(6).fill(0);S.banks[0]=S.bank||0}while(S.banks.length<6)S.banks.push(0);
if(S.bank!==S.banks.reduce((a,b)=>a+b,0)){S.banks[0]+=S.bank-S.banks.reduce((a,b)=>a+b,0)}
let migratedCargo=false;if(legacySave){let recovered=0;for(let i=5;i<10;i++){recovered+=S.cargo[i]*S.prices[i];S.cargo[i]=0}for(let i=0;i<Math.min(3,S.shares.length);i++)recovered+=S.shares[i]*(80+((S.day*17+i*31)%90));if(recovered>0){S.cash+=recovered;migratedCargo=true}S.shares.fill(0);S.city=[2,2,5,0,4,6,3,8][Math.min(7,S.city)]||0;S.schema=2;if(migratedCargo)notice=t('Older goods and shares were converted to cash.','Stare towary i akcje zamieniono na gotówkę.')}
// Redeem removed positions once; keep the original save if funds cannot fit.
if(S.shares.length>6){
  const proceeds=S.shares.slice(6).reduce((sum,q,i)=>sum+q*stockPrice(i+6),0);
  const cashCredit=Math.min(proceeds,MAX_NUMBER-S.cash),bankCredit=proceeds-cashCredit;
  if(bankCredit<=MAX_NUMBER-S.bank){S.cash+=cashCredit;S.bank+=bankCredit;S.banks[0]+=bankCredit;S.shares=S.shares.slice(0,6)}
  else{preserveInvalid(readLocal('bx-classic-save'));S=fresh()}
}
if(!validSave(S)){preserveInvalid(readLocal('bx-classic-save'));S=fresh()}
S.prices=S.prices.map((price,i)=>price<GOODS_RANGES[i][0]||price>GOODS_RANGES[i][1]?randomPrice(S,GOODS_RANGES[i]):price);
S.stockPrices=SHARE_RANGES.map((range,i)=>{const price=S.stockPrices?.[i];return price>=range[0]&&price<=range[1]?price:randomPrice(S,range)});
const money=n=>`${Number(n).toFixed(2)} $`, esc=s=>String(s).replace(/[&<>"]+/g,c=>c.split('').map(ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch])).join(''));
const actionToken=(id,key,label,hot=0)=>`[[${id}|${key}|${label}|${hot}]]`;
function save(){
  S.bank=S.banks.reduce((a,b)=>a+b,0);
  if(!saveBlocked){const ok=writeLocal('bx-classic-save',JSON.stringify(S));storageFailed=!ok}
  document.querySelector('#save-status').textContent=storageMessage()||t('Saved locally','Zapisano lokalnie');
}

function used(){return S.cargo.reduce((a,b)=>a+b,0)}
function rand(n){return randomInt(S,n)}
function visibleText(s){return s.replace(/\{(?:LEFT|MID|RIGHT|END|CITYROW|CITYEND)\}/g,'').replace(/\{AMOUNT\}/g,' '.repeat(10)).replace(/\{SPONSOR_LINKS\}/g,'LCSE.pl    MojeDostawy.pl').replace(/\{LANG\}/g,lang==='pl'?'L/EN':'L/PL').replace(/\{SPONSOR\}/g,SPONSORS[sponsorIndex][0]).replace(/\{([A-Z])\}/g,'$1').replace(/\[\[([^|]+)\|([^|]+)\|([^|]+)(?:\|([^\]]+))?\]\]/g,'$3')}
function frame(rows){
  const content=rows.slice(0,22);while(content.length<22)content.push('');
  content.push((view==='welcome'?statusText():'').padStart(78));
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
    html=html.replace(/\{LANG\}/g,`<button class="frame-control" data-frame-action="language">L/${lang==='pl'?'EN':'PL'}</button>`).replace(/\{SPONSOR\}/g,`<a class="sponsor-link" href="${SPONSORS[sponsorIndex][1]}" target="_blank" rel="noopener noreferrer">${SPONSORS[sponsorIndex][0]}</a>`).replace(/BIZNES\.EXE/g,'<span class="accent">BIZNES.EXE</span>').replace(/\{([A-Z])\}/g,'<span class="key">$1</span>').replace(/(\$\s*)([\d,]+(?:\.\d{2})?)/g,'$1<span class="accent">$2</span>').replace(/([\d,]+(?:\.\d{2})?)(\s*\$)/g,'<span class="accent">$1</span>$2');
    if(view==='home'&&i===16){const city=cities()[S.city];html=html.replace(esc(city),`<span class="accent">${esc(city)}</span>`)}

    const cls=panel?'panel-row':raw.includes('{CITYROW}')?'city-row':raw.includes('{LEFT}')?'action-bar':raw.includes('{AMOUNT}')?'amount-row':i===22?'footer-status':i===0?'statusline':view==='welcome'&&i===12?'welcome-instructions':view==='welcome'&&i>=13&&i<=17?'welcome-copy':view==='home'&&((notice&&i===20)||(mode&&i===18))?'promptline':view==='home'&&i===1?'tablehead':view==='home'&&i===17?'market-navigation':'';
    html=html.replace(/\{LEFT\}/g,'<span class="action-group group-left">').replace(/\{MID\}/g,'</span><span class="action-group group-middle">').replace(/\{RIGHT\}/g,'</span><span class="action-group group-right">').replace(/\{END\}/g,'</span>').replace(/\{CITYROW\}/g,'<span class="city-row-inner">').replace(/\{CITYEND\}/g,'</span>').replace(/\{SPONSOR_LINKS\}/g,[...SPONSORS].reverse().map(([name,url])=>`<a class="sponsor-link" href="${url}" target="_blank" rel="noopener noreferrer">${name}</a>`).join('    ')).replace(/\{AMOUNT\}/g,`<input id="amount-input" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="10" autocomplete="off" enterkeyhint="done" aria-label="${t('Quantity or amount','Ilość lub kwota')}" value="${esc(input)}">`);
    if(view==='welcome'&&i===22)html=`<span>${RELEASE.padEnd(78-statusText().length)}</span><span>${esc(statusText())}</span>`;
    return `<span class="terminal-row ${cls}">${html}</span>`;
  }).join('\n');
}
const center=s=>{const length=visibleText(s).length,left=Math.max(0,Math.floor((78-length)/2));return ' '.repeat(left)+s+' '.repeat(Math.max(0,78-length-left))};
function pwaMessage(){return typeof window!=='undefined'?window.BiznesPWA?.message(lang)||'':''}
function statusText(){const engine='JS';const offline=typeof window!=='undefined'&&window.BiznesPWA?window.BiznesPWA.status(lang):'Offline';return `${offline} · ${engine}`}

function topbar(){const tail='  {SPONSOR}  {LANG}',brand='BIZNES.EXE  ·  '+t('Tiny economic game','Mała gra ekonomiczna');return `${brand.padEnd(78-visibleText(tail).length)}${tail}`}
const instructions=()=>[
  [t('Buy low, sell high. Goods and shares have changing, fictional prices.','Kupuj tanio i sprzedawaj drożej. Ceny towarów i akcji są zmienne i fikcyjne.')],
  [t('Travel for free. You may gain or lose goods or cash along the way.','Podróżuj bez opłat. Po drodze możesz zyskać lub stracić towar i pieniądze.')],
  [t('Deposit cash in banks. Borrow and repay through Debt.','Wpłacaj i odbieraj pieniądze w bankach. W Długu pożyczaj i spłacaj.')],
  [t('Watch your debt: each trip adds 1–30%. The displayed rate applies next.','Pilnuj długu: wyjazd dolicza 1–30%. Widoczna stawka dotyczy kolejnej podróży.')],
  [t('Choose an action, item and amount. Enter confirms, Esc cancels. Autosave.','Wybierz działanie, pozycję i ilość. Enter zatwierdza, Esc anuluje. Autozapis.')]
].map(([text])=>[text,text]);

function welcome(){
  const start=[button('new-game','N','Nowa gra','New game'),button('welcome-continue',lang==='pl'?'K':'C','Kontynuuj','Continue')];
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
const GOODS_HOT=()=>lang==='pl'?[0,0,0,0,0,0,0,0,0,0]:[0,0,2,0,0,0,0,0,0,1];
const STOCK_LABELS=()=>lang==='pl'?["Hilton (Nowy Jork)","International (Paryż)","MacDonald's","Philips","JVC","Toyota"]:["Hilton (New York)","International (Paris)","McDonald's","Philips","JVC","Toyota"];
const STOCK_HOT=[0,0,0,0,0,0];
function entries(){
  if(table==='stocks')return STOCK_LABELS().map((label,i)=>({index:i,label,hot:STOCK_HOT[i],id:`stock-${i}`,price:stockPrice(i),qty:S.shares[i],unit:t('pcs.','szt.')})).sort(rangeOrder(SHARE_RANGES));
  if(table==='banks')return banks().map((name,i)=>({label:`Bank ${name}`,hot:5,id:`bank-${i}`,balance:S.banks[i]}));
  return goods().map((label,i)=>({index:i,label,hot:GOODS_HOT()[i],id:`good-${i}`,price:S.prices[i],qty:S.cargo[i],unit:lang==='pl'?UNITS[i]:(UNITS[i]==='ton'?'tons':UNITS[i]==='szt.'?'pcs.':'kg')})).sort(rangeOrder(GOODS_RANGES));
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
    '{LEFT}{MID}'+button('borrow','P','Pożyczasz','Borrow')+'   '+button('repay','O','Oddajesz','Repay')+'{RIGHT}{END}',loanHint(),' '+cancel];
  if(step==='row'){
    return [' '+operationLabel()+': '+t('Select an item from the list.','Zaznacz pozycję na liście.'),'',notice,' '+cancel];
  }
  const max=maximum(),isMoney=['deposit','withdraw','borrow','repay'].includes(mode),item=entries()[selected]||{label:'',unit:''};
  const hint=mode==='borrow'?loanHint():isMoney?`${t('available','dostępne')}: ${money(max)}`:mode==='buy'?t(`you can buy ${max} ${item.unit}`,`możesz kupić ${max} ${item.unit}`):t(`you own ${max} ${item.unit}`,`posiadasz ${max} ${item.unit}`);
  const genitive=['kawy','herbaty','tytoniu','zboża','ropy naftowej','leków','broni','wideo','drukarek','samochodów'];
  const tradeTitle=t(`How many ${item.label} do you ${mode}?`,table==='goods'?`Ile ${genitive[item.index]} ${mode==='buy'?'kupujesz':'sprzedajesz'}?`:`Ile akcji ${item.label} ${mode==='buy'?'kupujesz':'sprzedajesz'}?`);
  const title=mode==='borrow'?t('How much do you borrow?','Ile pożyczasz?'):mode==='repay'?t('How much do you repay?','Ile oddajesz?'):mode==='deposit'?t('How much do you deposit?','Ile wpłacasz?'):mode==='withdraw'?t('How much do you withdraw?','Ile odbierasz?'):tradeTitle;
  return [' '+title,' < '+hint+' >',notice,'{LEFT}'+cancel+'{MID}'+button('amount-minus','−','−','−')+' {AMOUNT} '+button('amount-plus','+','+','+')+' '+button('amount-max','MAX','Maks','Max')+'{RIGHT}'+button('submit',lang==='pl'?'Z':'C','Zatwierdź','Confirm')+'{END}'];
}
const M=document.querySelector('#mobile');
const mobileButton=(id,label,extra='')=>`<button type="button" data-ui-action="${esc(id)}" ${extra}>${esc(label)}</button>`;
const mobileCancel=()=>mobileButton('cancel',t('Esc · Cancel','Esc · Anuluj'));
function mobileView(){
  const links=[...SPONSORS].reverse().map(([name,url])=>`<a href="${url}" target="_blank" rel="noopener noreferrer">${name}</a>`).join('    ');
  const [sponsorName,sponsorUrl]=SPONSORS[sponsorIndex];
  const head=`<header class="mobile-head"><div class="mobile-brand"><strong>BIZNES.EXE</strong>${view==='home'?`<span class="mobile-city">${esc(cities()[S.city])}</span>`:''}</div><nav class="mobile-sponsors" aria-label="${t('Patrons','Patroni')}"><a href="${sponsorUrl}" target="_blank" rel="noopener noreferrer">${sponsorName}</a></nav>${mobileButton('language',lang==='pl'?'EN':'PL',`aria-label="${t('Switch language','Zmień język')}"`)}</header>`;
  if(view==='welcome')return head+`<section class="mobile-list mobile-welcome"><div class="mobile-manifest"><h1>${t('Small game. Big business.','Mała gra. Wielki biznes.')}</h1><p>${t('A lightweight game with an MS-DOS retro feel.','Lekka gra w klimacie retro MS-DOS.')}</p><p>${t('An independent adaptation inspired by:','Niezależna adaptacja inspirowana:')}<br>Biznesman (1988), M. Cwynar / SAMBA.</p><p>${t('Project patrons','Patroni projektu')}:<br>${links}</p></div><h2>${t('How to play','Jak grać')}</h2>${instructions().map(([text])=>`<p>${text}</p>`).join('')}</section>${pwaMessage()?`<p class="install-help" role="status">${esc(pwaMessage())}</p>`:''}<small class="mobile-status"><span>${RELEASE}</span><span>${esc(statusText())}</span></small><section class="mobile-dock mobile-welcome-dock"><div class="mobile-hand-row">${mobileButton('hand-toggle',handedness==='right'?t('Left-handed','Leworęczny'):t('Right-handed','Praworęczny'))}<span>${handedness==='right'?t('Right-handed ✓','Praworęczny ✓'):t('Left-handed ✓','Leworęczny ✓')}</span></div><div class="mobile-font-row">${mobileButton('install-app',t('Install app','Zainstaluj'))}${mobileButton('font-toggle',t('Style: ','Styl: ')+styleName())}</div><div class="mobile-primary-row">${mobileButton('new-game',t('New game','Nowa gra'))}${mobileButton('welcome-continue',t('Continue','Kontynuuj'),'class="mobile-confirm"')}</div></section>`;
  const bank=table==='banks',totals={goods:S.cargo.reduce((n,q,i)=>n+q*S.prices[i],0),shares:S.shares.reduce((n,q,i)=>n+q*stockPrice(i),0),bank:S.bank};
  const tabs=(handedness==='left'?[['goods',t('Goods','Towary')],['shares',t('Shares','Akcje')],['bank',t('Banks','Banki')]]:[['bank',t('Banks','Banki')],['shares',t('Shares','Akcje')],['goods',t('Goods','Towary')]]).map(([id,label])=>`<button type="button" data-ui-action="${id}" aria-pressed="${({goods:'goods',shares:'stocks',bank:'banks'}[id]===table&&mode!=='travel')}"><span>${label}</span><b>${money(totals[id])}</b></button>`).join('');
  const cards=entries().map((e,i)=>{
    const details=bank?`<span><b>${money(e.balance)}</b></span>`:`<span><b>${money(e.price)}</b></span><span>${e.qty} ${e.unit}</span><span>${money(e.qty*e.price)}</span>`;
    return `<button type="button" class="mobile-card" data-ui-action="pick-${i}" ${step==='row'?'':'disabled'}><span class="mobile-card-name">${esc(e.label)}</span><span class="mobile-card-details">${details}</span></button>`;
  }).join('');
  const operation=mobileOperation();
  return head+`<section class="mobile-summary"><span>${t('Cash','Gotówka')} <b>${money(S.cash)}</b></span><span class="mobile-debt">${t('Debt','Dług')} <b>${money(S.debt)}</b></span></section>${!mode||step==='row'?`<div class="mobile-columns ${bank?'bank-columns':''}">${bank?`<span>${t('Balance','Saldo')}</span>`:`<span>${t('Price','Cena')}</span><span>${t('Owned','Masz')}</span><span>${t('Value','Wartość')}</span>`}</div>`:''}<section class="mobile-list">${!mode&&S.lastJourney?`<aside class="journey-report ${S.lastJourney.kind}" role="status"><strong>${t('Last journey','Ostatnia podróż')}</strong><p>${esc(journeyText())}</p></aside>`:''}${operation.content??cards}</section><section class="mobile-bottom"><nav class="mobile-tabs" aria-label="${t('Market totals','Łączna wartość')}">${tabs}</nav><section class="mobile-dock">${operation.footer}</section></section>`;
}
function mobileOperation(){
  const cancel=mobileCancel(),bank=table==='banks';
  const label=operationLabel();
  const message=notice?`<p class="mobile-notice has-message" role="status">${esc(notice)}</p>`:'';
  if(!mode)return {content:null,footer:`<p class="mobile-notice ${notice&&notice!==journeyText()?'has-message':''}" role="status">${esc((journeyText()===notice?'':notice)||chooseAction())}</p><nav class="mobile-main-actions">${mobileButton('debt',t('Debt','Dług'))}${mobileButton('quit','Menu')}${mobileButton('travel',t('Travel','Wyjazd'))}</nav><div class="mobile-primary-row">${mobileButton('mobile-sell',bank?t('Withdraw','Odbierz'):t('Sell','Sprzedaj'))}${mobileButton('mobile-buy',bank?t('Deposit','Wpłać'):t('Buy','Kup'),'class="mobile-confirm"')}</div>`};
  if(mode==='travel')return {content:'',footer:`<h2>${t('Where to?','Dokąd jedziemy?')}</h2><div class="mobile-cities">${cities().map((c,i)=>i===S.city?'':mobileButton(`city-${i}`,c)).join('')}</div><div class="mobile-operation-footer">${cancel}</div>`};
  if(mode==='debt')return {content:`<h2>${t('Manage debt','Obsługa długu')}</h2><p>${t('Current debt','Obecny dług')}: ${money(S.debt)}</p><p>${t('Debt growth on the next trip','Wzrost długu przy następnym wyjeździe')}: ${S.debtRate}%</p><p>${loanHint()}</p>`,footer:`<p>${chooseAction()}</p><div class="mobile-primary-row">${mobileButton('borrow',t('Borrow','Pożyczasz'))}${mobileButton('repay',t('Repay','Oddajesz'),'class="mobile-confirm"')}</div><div class="mobile-operation-footer">${cancel}</div>`};
  if(step==='row')return {content:null,footer:`${message}<p><span class="transaction-label">${label}:</span> ${t('Select an item from the list.','Zaznacz pozycję na liście.')}</p><div class="mobile-operation-footer">${cancel}</div>`};

  return {content:`<h2 class="transaction-label">${label}</h2>${['borrow','repay'].includes(mode)?'':`<p>${esc(entries()[selected].label)}</p>`}${mode==='borrow'?`<p>${loanHint()}</p>`:''}<p>${t('Maximum available','Maksymalnie dostępne')}: ${maximum()}</p>`,footer:`${message}<label for="mobile-amount-input">${t('Quantity / amount','Ilość / kwota')}</label><div class="mobile-quantity">${mobileButton('amount-minus','−',`aria-label="${t('Decrease','Zmniejsz')}"`)}<input id="mobile-amount-input" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="10" autocomplete="off" enterkeyhint="done" value="${esc(input)}">${mobileButton('amount-plus','+',`aria-label="${t('Increase','Zwiększ')}"`)}${mobileButton('amount-max',t('Max','Maks'))}</div><div class="mobile-operation-footer">${cancel}${mobileButton('submit',t('Confirm','Zatwierdź'),'class="mobile-confirm"')}</div>`};
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

function screen(){return view==='welcome'?welcome():home()}
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
  const id=document.activeElement?.id,focused=['amount-input','mobile-amount-input'].includes(id);
  if(persist)save();
  const warning=document.querySelector('#storage-warning');if(warning){warning.textContent=storageMessage();warning.hidden=!warning.textContent}
  document.body.dataset.font=fontStyle;document.body.dataset.hand=handedness;
  T.innerHTML=screen();updateMobile(mobileView());fitTerminal();renderJourneyPopup();
  const help=document.querySelector('#desktop-install-help');
  if(help){help.textContent=view==='welcome'?pwaMessage():'';help.hidden=!help.textContent}
  if(focused&&document.activeElement?.id!==id)document.querySelector('#'+id)?.focus?.({preventScroll:true});
}
let noticeSerial=0;
function renderJourneyPopup(){
  if(!D)return;
  if(!eventPopup){D.close?.();return}
  if(D.open)return;
  D.innerHTML=`<h2 id="journey-title">${t('Travel event','Zdarzenie w podróży')}</h2><p>${esc(journeyText())}</p>${mobileButton('close-event',t('Continue','Dalej'))}`;
  D.oncancel=e=>{e.preventDefault();select('close-event')};
  D.showModal?.();
}
function expireJourneyAfterDelay(){
  const report=S.lastJourney;
  if(!report)return;
  const remaining=(report.expiresAt||0)-Date.now();
  const expire=()=>{
    if(S.lastJourney!==report)return;
    if(notice===journeyText(report,'pl')||notice===journeyText(report,'en'))notice='';
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
function stockPrice(i){return S.stockPrices?.[i]??(80+((S.day*17+i*31)%90))}
const loanHint=()=>S.borrowedThisStay?t('Already borrowed. Travel to borrow again.','Już pożyczono. Kolejna pożyczka po wyjeździe.'):t('Up to 1000 $, once per stay.','Do 1000 $, raz na pobyt.');
function maximum(){
  if(mode==='borrow')return S.borrowedThisStay?0:Math.min(1000,2147483647-S.cash,2147483647-S.debt);
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
    {S.cash+=n*e.price*(buying?-1:1);(table==='goods'?S.cargo:S.shares)[e.index]+=n*(buying?1:-1)}
  }else{
    const op={deposit:0,withdraw:1,repay:2,borrow:3}[mode];
    {S.cash+=n*([1,3].includes(op)?1:-1);if(op<2)S.bank+=n*(op===0?1:-1);else S.debt+=n*(op===3?1:-1)}
    if(ok&&op===3)S.borrowedThisStay=true;
    if(ok&&op<2)S.banks[selected]+=n*(op===0?1:-1);
  }
  if(!ok)return showNotice(t('Operation failed.','Operacja nie powiodła się.'));
  homeNotice(t('Transaction completed.','Transakcja zakończona.'));
}
function differentPrice(price,previous,i){
  const [low,high]=GOODS_RANGES[i];
  price=Math.max(low,Math.min(high,price));
  return price===previous?(price<high?price+1:price-1):price;
}
function nextDebtRate(){
  if(rand(5)===0)return S.debtRate;
  const down=S.debtRate>=15?rand(100)<85:rand(2)===0;
  return Math.max(1,Math.min(30,S.debtRate+(down?-1:1)*(1+rand(3))));
}
function updateMarkets(){
  S.borrowedThisStay=false;S.day++;S.debt+=Math.floor(S.debt*S.debtRate/100);S.debtRate=nextDebtRate();
  S.prices=S.prices.map((previous,i)=>randomPrice(S,GOODS_RANGES[i],previous));
  S.stockPrices=S.stockPrices.map((previous,i)=>randomPrice(S,SHARE_RANGES[i],previous));
}

function journeyText(report=S.lastJourney,language=lang){
  if(!report)return '';
  if(report.id===undefined){
    // Translate commodity names in reports saved before parameterized events.
    const names=language==='pl'?GOODS:GEN,other=language==='pl'?GEN:GOODS;
    let text=report[language];other.forEach((name,i)=>{text=text.split(name).join(names[i])});
    return text.replace(language==='pl'?'+1 day':'+1 dzień',language==='pl'?'+1 dzień':'+1 day');
  }
  const names=language==='pl'?GOODS:GEN;
  let detail=report.type==='goods'?`${report.amount>0?'+':''}${report.amount} ${names[report.good]}`:report.type==='price'?`${names[report.good]}: ${money(report.amount)}`:report.type==='day'?(language==='pl'?'+1 dzień':'+1 day'):`${report.amount>=0?'+':''}${report.amount} $`;
  return EVENTS[report.id][language==='pl'?1:2]+' '+detail;
}
function trigger(id,previousPrices){
  const cash=rand(150)+50,g=rand(10);let type='cash',amount=0,good=g,kind='good';
  const calm=()=>{S.lastJourney=null;eventPopup=false;homeNotice(t('A quiet trip. Prices changed.','Spokojna podróż. Ceny uległy zmianie.'))};
  if(id===12&&!S.cargo[1]||id===13&&!S.cargo[2]||[3,14].includes(id)&&!used()||[1,4,5,9,14].includes(id)&&!S.cash||id===6&&S.day===MAX_NUMBER)return calm();
  switch(id){
    case 0:case 7:case 8:case 10:case 15:amount=Math.min(cash,MAX_NUMBER-S.cash);S.cash+=amount;break;
    case 1:case 4:case 5:case 9:case 14:amount=-Math.min(S.cash,cash);S.cash+=amount;kind='bad';break;
    case 2:{amount=Math.min(1+rand(3),65535-S.cargo[g]);if(!amount)return calm();type='goods';S.cargo[g]+=amount;break}
    case 3:case 12:case 13:{const held=S.cargo.map((q,i)=>q?i:-1).filter(i=>i>=0);good=id===12?1:id===13?2:held[rand(held.length)];amount=-Math.max(1,Math.ceil(S.cargo[good]*(10+rand(21))/100));S.cargo[good]+=amount;type='goods';kind='bad';break}
    case 6:S.day++;amount=1;type='day';kind='bad';break;
    case 11:S.prices[g]=Math.max(1,Math.floor(S.prices[g]*.65));amount=S.prices[g];type='price';break;
  }
  if(type==='price'&&previousPrices){amount=differentPrice(amount,previousPrices[good],good);S.prices[good]=amount}
  S.lastJourney={id,type,amount,good,kind,expiresAt:Date.now()+15000};
  eventPopup=true;homeNotice(journeyText());expireJourneyAfterDelay();
}

function travelTo(city){
  if(city<0||city>=C.length)return;
  if(city===S.city)return homeNotice(t('You are already here.','Już tu jesteś.'));
  if(S.day>=MAX_NUMBER||S.debt+Math.floor(S.debt*S.debtRate/100)>MAX_NUMBER)return homeNotice(t('Numeric limit reached. Trip cancelled; progress preserved.','Granica liczb. Podróż anulowana; postęp zachowany.'));
  const previousPrices=[...S.prices];
  let result=-1;
  {const fee=0;S.cash-=fee;S.city=city;updateMarkets();if(rand(100)<35)result=rand(EVENTS.length)}
  S.lastJourney=null;
  if(result>=0)return trigger(result,previousPrices);
  homeNotice(t('Trip complete. Prices changed.','Podróż zakończona. Ceny uległy zmianie.'));
}
function newGame(){if(invalidSave&&backupSaved){saveBlocked=false;invalidSave=false}S=fresh();table='goods';homeNotice(t('New game started.','Rozpoczęto nową grę.'))}
function select(id){
  if(invalidSave&&!['new-game','language','font-toggle','hand-toggle','install-app'].includes(id))return;
  if(eventPopup){eventPopup=false;D?.close?.();if(id==='close-event'){render(false);return}}
  if(id==='install-app'){if(typeof window!=='undefined')window.BiznesPWA?.install();return}
  if(id==='language'){lang=lang==='pl'?'en':'pl';notice='';writeLocal('bx-classic-lang',lang);render();return}
  if(view==='welcome'){
    if(id==='hand-toggle'){handedness=handedness==='right'?'left':'right';writeLocal('bx-classic-hand',handedness)}
    else if(id==='font-toggle'){fontStyle=STYLES[(STYLES.findIndex(style=>style.id===fontStyle)+1)%STYLES.length].id;writeLocal('bx-classic-style',fontStyle);writeLocal('bx-classic-font',fontStyle)}
    else if(id==='welcome-continue'){homeNotice('');return}
    else if(id==='new-game'){newGame();return}

    render();return;
  }
  if(['goods','shares','bank'].includes(id)){
    const buying=['buy','deposit'].includes(mode),selling=['sell','withdraw'].includes(mode);
    table={goods:'goods',shares:'stocks',bank:'banks'}[id];
    mode=buying?(table==='banks'?'deposit':'buy'):selling?(table==='banks'?'withdraw':'sell'):'';
    step=mode?'row':'';input='';notice='';selected=0;
    render();
    for(const selector of ['.mobile-list','.mobile-bottom']){const pane=M?.querySelector?.(selector);if(pane){pane.scrollTop=0;pane.scrollLeft=0}}
    return;
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
  if(row){if(row[1]==={goods:'good',stocks:'stock',banks:'bank'}[table])chooseRow(entries().findIndex(e=>e.id===id));return}
  if(mode==='debt'&&step==='choice'&&['repay','borrow'].includes(id)){if(id==='borrow'&&S.borrowedThisStay)return showNotice(loanHint());mode=id;step='quantity';input='';render();return}
  if(mode)return;
  notice='';input='';
  if(id==='debt'){mode='debt';step='choice'}
  else if(id==='travel'){mode='travel';step='city'}
  else if((table==='banks'?['deposit','withdraw']:['buy','sell']).includes(id)){mode=id;step='row'}
  render();
}
function action(k){
  if(view==='welcome'){const id={N:'new-game',K:'welcome-continue',C:'welcome-continue',ENTER:'welcome-continue',F:'font-toggle',I:'install-app',L:'language'}[k];if(id)select(id);return}
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
document.querySelector('#engine-status').textContent='JS';render();
if(typeof setInterval==='function')setInterval(()=>{sponsorIndex=(sponsorIndex+1)%SPONSORS.length;if(!eventPopup&&!['amount-input','mobile-amount-input'].includes(document.activeElement?.id))render(false)},7000);
})();
