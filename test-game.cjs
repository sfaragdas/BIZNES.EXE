// Browser-like interaction test using Node's built-in VM.
const fs=require('node:fs');const vm=require('node:vm');const assert=require('node:assert/strict');
const elements={},listeners={},store=new Map();
function el(id){if(!elements[id]){const e={textContent:'',dataset:{},handlers:{},addEventListener(n,f){this.handlers[n]=f}};Object.defineProperty(e,'innerHTML',{get(){return e.html},set(v){e.html=v;e.textContent=v.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'")}});elements[id]=e}return elements[id]}
const document={body:{dataset:{}},querySelector:el,querySelectorAll:()=>[],addEventListener:(n,f)=>listeners[n]=f};
const useHttp=process.argv.includes('--wasm-http'),useWasm=useHttp||process.argv.includes('--wasm');const context={setInterval:()=>0,document,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},Date:{now:()=>123456},console,location:{protocol:useWasm?'http:':'file:'},WebAssembly,fetch:useHttp?url=>fetch(new URL(url,'http://127.0.0.1:8765')):async url=>({ok:true,arrayBuffer:async()=>fs.readFileSync('target/wasm32-unknown-unknown/release/biznes_exe_core.wasm')})};
vm.runInNewContext(fs.readFileSync('game.js','utf8'),context);
const key=k=>listeners.keydown({key:k,preventDefault(){},ctrlKey:false,metaKey:false,altKey:false});
function click(id){el('#terminal').handlers.click({target:{closest(selector){if(selector==='[data-frame-action]')return id==='language'?{dataset:{frameAction:id}}:null;if(selector==='[data-ui-action]')return{dataset:{uiAction:id}};return null}}})}
const state=()=>JSON.parse(store.get('bx-save'));
const checkScreen=(text)=>{const e=el('#terminal');assert.ok(e.textContent.includes(text),`screen should contain: ${text}; got ${e.textContent}`);const rows=e.textContent.split('\n');assert.equal(rows.length,23);assert.equal(rows.find(r=>r.length!==78),undefined)};
const pressAmount=s=>{for(const c of String(s))key(c);key('Enter')};
(async()=>{
  if(useWasm){for(let i=0;i<40&&el('#engine-status').textContent!=='Rust/WASM';i++)await new Promise(r=>setTimeout(r,25));}
  checkScreen('Biznesman (1988)');checkScreen('M. Cwynar');checkScreen('Manifest');checkScreen('MojeDostawy.pl');checkScreen('Zapisz stan');checkScreen('100% offline');
  checkScreen('Sponsorzy projektu: MojeDostawy.pl oraz LCSE.pl.');checkScreen('Czcionka');assert.ok(el('#terminal').innerHTML.includes('<span class="key">K</span> kupno'));assert.ok(!el('#terminal').textContent.includes('│'));
  assert.ok(el('#terminal').innerHTML.includes('welcomepanel'),'welcome info should share one gray panel');assert.ok(el('#terminal').innerHTML.includes('panel-edge">*****'),'welcome panel should use the DOS-style asterisk border');assert.equal(document.body.dataset.font,'current');click('font-toggle');assert.equal(document.body.dataset.font,'retro');click('font-toggle');assert.equal(document.body.dataset.font,'current');
  key('Enter');checkScreen('Masz do wyboru');assert.ok(el('#terminal').innerHTML.includes('href="https://mojedostawy.pl"'));
  click('buy');checkScreen('Jaki towar kupujesz? < wybierz towar w tabeli');assert.ok(!el('#terminal').innerHTML.includes('data-ui-action="debt"'),'main options should hide during trade');key('K');checkScreen('Ile Kawy kupujesz');checkScreen('możesz kupić 55 ton');assert.ok(el('#terminal').innerHTML.includes('promptline'));pressAmount('10');checkScreen('Transakcja zakończona');assert.equal(state().cargo[0],10);
  click('sell');click('good-0');pressAmount('3');checkScreen('Transakcja zakończona');assert.equal(state().cargo[0],7);
  click('buy');click('good-0');pressAmount('48');assert.equal(state().cash,10);click('buy');click('good-9');checkScreen('Nie masz pieniędzy na ten towar.');key('Enter');click('sell');click('good-9');checkScreen('Przecież nie posiadasz: Samochody.');key('Enter');click('sell');click('good-0');pressAmount('45');assert.equal(state().cargo[0],10);
  click('bank');checkScreen('Możesz złożyć swoje pieniądze');assert.ok(el('#terminal').innerHTML.includes('Bank <span class="key">S</span>zwajcarski'));click('bank-0');click('deposit');pressAmount('50');assert.equal(state().banks[0],50);assert.equal(state().bank,50);
  click('bank');click('bank-0');click('withdraw');pressAmount('20');assert.equal(state().banks[0],30);assert.equal(state().bank,30);
  click('debt');click('repay');pressAmount('25');assert.equal(state().debt,24975);
  key('Enter');const cashBeforeTravel=state().cash;key('W');checkScreen('Bangkok');checkScreen('Tokio');assert.ok(!el('#terminal').innerHTML.includes('data-ui-action="buy"'),'main options should hide during travel');assert.ok(el('#terminal').innerHTML.includes('data-ui-action="city-1"'));key('B');checkScreen('Bangkok');assert.equal(state().city,1);assert.equal(state().cash,cashBeforeTravel);click('continue');
  click('shares');checkScreen("Hotel 'Hilton'");click('stock-4');click('stock-buy');pressAmount('1');assert.equal(state().shares[4],1);
  click('language');assert.ok(el('#terminal').textContent.includes('Towar:')||el('#terminal').textContent.includes('Goods:'));assert.equal(el('#terminal').textContent.includes('Warszawa'),false);click('language');assert.ok(el('#terminal').textContent.includes('Towar:')||el('#terminal').textContent.includes('Goods:'));
  click('quit');checkScreen('Kontynuuj');assert.ok(store.has('bx-save'),'Q should preserve the current saved state');click('welcome-continue');checkScreen('Masz do wyboru');click('new-game');assert.equal(state().cash,1000);assert.ok(el('#terminal').textContent.includes('Rozpoczęto nową grę'));
  click('quit');click('welcome-save');assert.ok(store.has('bx-save'));
  const html=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('style.css','utf8');assert.ok(!html.includes('class="controls"'));assert.ok(html.includes('favicon.svg'));assert.ok(css.includes("body[data-font='retro']"));assert.ok(css.includes('ModernDOS8x16.ttf'));assert.ok(css.includes('pre .footer-status'));assert.ok(css.includes('border:0'));assert.ok(css.includes('overflow:hidden'));
  if(useWasm){await new Promise(r=>setTimeout(r,40));assert.equal(el('#engine-status').textContent,'Rust/WASM')}
  console.log(`PASS (${useHttp?'HTTP Rust/WASM':useWasm?'Rust/WASM':'JS fallback'}): welcome, sponsor links, inline trade, keyboard input, bank, debt, travel, shares, localization and 80x25 frame.`)
})().catch(e=>{console.error(e);process.exitCode=1});
