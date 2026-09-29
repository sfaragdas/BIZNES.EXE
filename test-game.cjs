// Browser-like interaction test using Node's built-in VM.
const fs=require('node:fs');const vm=require('node:vm');const assert=require('node:assert/strict');
const elements={},listeners={},store=new Map(),timers=[];
function el(id){if(!elements[id]){const e={textContent:'',dataset:{},handlers:{},addEventListener(n,f){this.handlers[n]=f}};Object.defineProperty(e,'innerHTML',{get(){return e.html},set(v){e.html=v;e.textContent=v.replace(/<input[^>]*>/g,' '.repeat(10)).replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'")}});elements[id]=e}return elements[id]}
const document={body:{dataset:{}},querySelector:el,querySelectorAll:()=>[],addEventListener:(n,f)=>listeners[n]=f};
const context={setTimeout:(fn,delay)=>timers.push({fn,delay}),setInterval:()=>0,document,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},Date:{now:()=>123456},console,location:{protocol:'file:'}};
vm.runInNewContext(fs.readFileSync('game.js','utf8'),context);
const key=k=>listeners.keydown({key:k,preventDefault(){},ctrlKey:false,metaKey:false,altKey:false});
function click(id,root='#terminal'){el(root).handlers.click({target:{closest(selector){if(selector==='[data-frame-action]')return id==='language'?{dataset:{frameAction:id}}:null;if(selector==='[data-ui-action]')return{dataset:{uiAction:id}};return null}}})}
const state=()=>JSON.parse(store.get('bx-save'));
const checkScreen=(text)=>{const e=el('#terminal');assert.ok(e.textContent.includes(text),`screen should contain: ${text}; got ${e.textContent}`);const rows=e.textContent.split('\n');assert.equal(rows.length,23);assert.equal(rows.find(r=>r.length!==78),undefined,rows.map(r=>r.length).join(','))};
const pressAmount=s=>{for(const c of String(s))key(c);key('Enter')};
(async()=>{
  checkScreen('Patroni projektu');checkScreen('Styl');checkScreen('-'.repeat(78));assert.ok(el('#terminal').innerHTML.includes('href=\"https://mojedostawy.pl\"'));assert.ok(el('#terminal').innerHTML.includes('href=\"https://lcse.pl\"'));checkScreen('Offline');assert.ok(!el('#terminal').textContent.includes('WASM'));
  assert.ok(!el('#terminal').innerHTML.includes('welcome-save'));
  const welcomeRows=el('#terminal').textContent.split('\n');assert.equal(welcomeRows[7].trim(),'*                                                                          *'.trim());assert.equal(welcomeRows[11].trim(),'');
  click('font-toggle');assert.equal(document.body.dataset.font,'retro');click('font-toggle');assert.equal(document.body.dataset.font,'matrix');click('font-toggle');assert.equal(document.body.dataset.font,'current');
  key('Enter');checkScreen('Towar:');checkScreen('Towary');
  key('K');assert.ok(!el('#terminal').innerHTML.includes('data-ui-action="debt"'));checkScreen('Kupno: Zaznacz pozycję na liście.');key('K');checkScreen('możesz kupić 55 ton');click('amount-max');assert.ok(el('#terminal').innerHTML.includes('value="55"'));click('amount-minus');assert.ok(el('#terminal').innerHTML.includes('value="54"'));click('amount-plus');assert.ok(el('#terminal').innerHTML.includes('value="55"'));
  const field={id:'amount-input',value:'10'};el('#terminal').handlers.input({target:field});
  listeners.keydown({key:'z',target:field,preventDefault(){}});assert.equal(state().cargo[0],10);key('Escape');
  key('S');checkScreen('Sprzedaż: Zaznacz pozycję na liście.');key('S');checkScreen('Nie posiadasz: Samochody.');key('Escape');
  key('K');checkScreen('Kupno: Zaznacz pozycję na liście.');key('Escape');key('S');key('K');pressAmount(3);assert.equal(state().cargo[0],7);key('Escape');
  key('K');key('K');pressAmount(999);checkScreen('Nieprawidłowa ilość');key('Escape');key('B');checkScreen('Saldo:');
  key('P');key('S');pressAmount(100);assert.equal(state().banks[0],100);checkScreen('Saldo:');key('Escape');
  key('O');key('S');pressAmount(40);assert.equal(state().banks[0],60);key('Escape');
  key('D');checkScreen('Saldo:');checkScreen('Pożyczasz');key('P');pressAmount(1000);assert.equal(state().debt,26000);checkScreen('Saldo:');
  key('A');checkScreen('Akcje:');checkScreen('Excellence (NC)');assert.equal(state().shares.length,10);
  for(let i=0;i<10;i++){click('buy');click('stock-'+i);pressAmount(1);assert.equal(state().shares[i],1);key('Escape')}
  key('S');key('E');pressAmount(1);assert.equal(state().shares[9],0);checkScreen('Akcje:');key('Escape');
  key('B');key('D');key('P');checkScreen('Ile pożyczasz?');key('Escape');key('A');
  key('D');key('O');pressAmount(10);assert.equal(state().debt,25990);checkScreen('Akcje:');
  const before=state().cash;key('W');checkScreen('Akcje:');checkScreen('Tokio');assert.ok(el('#terminal').innerHTML.includes('city-row-inner'));assert.ok(el('#terminal').innerHTML.indexOf('data-ui-action=\"city-1\"')<el('#terminal').innerHTML.indexOf('data-ui-action=\"cancel\"'));key('B');assert.equal(state().city,1);checkScreen('Akcje:');
  assert.ok(!el('#terminal').textContent.includes('Wciśnij ENTER'));key('T');checkScreen('Towar:');
  // Travel results and events all remain inline and accept the next action.
  for(let i=0;i<20;i++){key('W');click('city-'+((state().city+1)%9));checkScreen('Towar:');key('D');checkScreen('Pożyczasz');key('Escape')}
  if(process.argv.includes('--snapshot'))console.log('SNAPSHOT '+JSON.stringify(state()));
  click('language');checkScreen('Goods:');key('K');checkScreen('Buy: Select an item from the list.');key('Escape');key('A');checkScreen('Shares:');key('B');checkScreen('Balance:');
  key('P');key('S');pressAmount(1);checkScreen('Transaction completed.');key('Escape');key('D');checkScreen('Choose an action:');key('Escape');
  click('language');key('Q');checkScreen('Kontynuuj');const saved=state();key('Enter');assert.deepEqual(state(),saved);
  key('Q');key('N');assert.equal(state().cash,1000);assert.equal(state().shares.length,10);
  // Touch cards use the same state and input handlers as the terminal.
  const tap=id=>click(id,'#mobile');
  assert.equal((el('#mobile').innerHTML.match(/class="mobile-card"/g)||[]).length,10);
  tap('mobile-buy');tap('pick-0');
  const mobileField={id:'mobile-amount-input',value:'2'};
  el('#mobile').handlers.input({target:mobileField});tap('submit');assert.equal(state().cargo[0],2);
  tap('cancel');tap('mobile-sell');tap('pick-0');tap('amount-max');tap('submit');assert.equal(state().cargo[0],0);
  tap('cancel');tap('bank');tap('mobile-buy');tap('pick-0');el('#mobile').handlers.input({target:{...mobileField,value:'10'}});tap('submit');assert.equal(state().banks[0],10);
  tap('cancel');tap('mobile-sell');tap('pick-0');tap('amount-max');tap('submit');assert.equal(state().banks[0],0);
  tap('cancel');tap('travel');
  assert.ok(el('#mobile').innerHTML.indexOf('mobile-bottom')<el('#mobile').innerHTML.indexOf('mobile-cities'));
  for(const root of ['#mobile','#terminal']){const html=el(root).innerHTML;assert.ok(!html.includes('data-ui-action="city-0"'));assert.equal((html.match(/data-ui-action="city-/g)||[]).length,8)}
  tap('city-1');assert.equal(state().city,1);tap('travel');assert.ok(!el('#mobile').innerHTML.includes('data-ui-action="city-1"'));tap('cancel');
  tap('debt');tap('borrow');el('#mobile').handlers.input({target:{...mobileField,value:'10'}});tap('submit');
  tap('language');tap('debt');tap('repay');el('#mobile').handlers.input({target:{...mobileField,value:'10'}});listeners.keydown({key:'c',target:mobileField,preventDefault(){}});assert.ok(el('#mobile').textContent.includes('Transaction completed.'));tap('language');
  tap('quit');tap('new-game');tap('mobile-buy');
  assert.ok(el('#mobile').textContent.includes('Kupno: Zaznacz'));
  tap('shares');assert.ok(el('#mobile').textContent.includes('Kupno: Zaznacz'));
  tap('bank');assert.ok(el('#mobile').textContent.includes('Wpłata: Zaznacz'));
  tap('goods');tap('pick-0');
  const enterMobile=value=>el('#mobile').handlers.input({target:{...mobileField,value}});
  for(const value of ['', '0', '999']){
    enterMobile(value);tap('submit');
    assert.ok(el('#mobile').innerHTML.includes('id="mobile-amount-input"'));
    assert.ok(el('#mobile').innerHTML.includes(`value="${value}"`));
    assert.ok(el('#mobile').textContent.includes('Nieprawidłowa ilość'));
    assert.equal(state().cargo[0],0);
  }
  enterMobile('2');tap('submit');assert.equal(state().cargo[0],2);
  assert.ok(el('#mobile').innerHTML.includes('data-ui-action="mobile-buy"'));
  assert.ok(!el('#mobile').textContent.includes('Kupno: Zaznacz'));
  tap('cancel');tap('mobile-sell');tap('pick-9');
  assert.ok(el('#mobile').textContent.includes('Nie posiadasz: Samochody.'));
  assert.ok(el('#mobile').textContent.includes('Sprzedaż: Zaznacz'));
  tap('pick-0');enterMobile('1');tap('submit');assert.equal(state().cargo[0],1);
  assert.ok(el('#mobile').innerHTML.includes('data-ui-action="mobile-sell"'));
  tap('mobile-sell');
  tap('shares');assert.ok(el('#mobile').textContent.includes('Sprzedaż: Zaznacz'));
  tap('bank');assert.ok(el('#mobile').textContent.includes('Odbiór: Zaznacz'));
  tap('cancel');tap('debt');
  const debtHtml=el('#mobile').innerHTML;
  assert.ok(debtHtml.indexOf('mobile-tabs')<debtHtml.indexOf('Wybierz akcję:'));
  assert.ok(debtHtml.indexOf('Wybierz akcję:')<debtHtml.indexOf('data-ui-action="borrow"'));
  tap('cancel');
  // Event report and popup expire without requiring another journey.
  for(let i=0;i<40&&!state().lastJourney;i++){tap('travel');tap('city-'+((state().city+1)%9))}
  assert.ok(state().lastJourney);
  const expiry=timers.filter(timer=>timer.delay===15000).at(-1);
  assert.ok(expiry);expiry.fn();assert.equal(state().lastJourney,null);
  assert.ok(!el('#mobile').innerHTML.includes('journey-report'));
  const css=fs.readFileSync('style.css','utf8');assert.ok(css.includes('PxPlus_IBM_VGA8.ttf'));assert.ok(!css.includes('Courier New'));
  // Load a real previous-format save: the first six positions keep their identity.
  const legacy={...state(),cash:2000,bank:20,banks:[20,0,0,0,0,0],shares:[1,2,3,4,5,6],rng:0xf1234567};
  store.set('bx-save',JSON.stringify(legacy));
  async function reload(){
    vm.runInNewContext(fs.readFileSync('game.js','utf8'),context);
  }
  await reload();key('Enter');key('A');
  assert.deepEqual(state().shares,[1,2,3,4,5,6,0,0,0,0]);
  key('K');key('E');pressAmount(1);assert.equal(state().shares[9],1);key('Escape');
  key('Q');const savedTen=state();await reload();key('Enter');assert.deepEqual(state(),savedTen);
  key('A');key('S');key('E');pressAmount(1);assert.equal(state().shares[9],0);
  console.log(`PASS: two screens, 10 stocks, all inline operations, notices, travel/events, PL/EN, fonts, save and 23x78 rows.`);
})().catch(e=>{console.error(e);process.exitCode=1});
