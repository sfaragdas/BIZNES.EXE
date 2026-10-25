// BETA safety checks: storage failures, damaged saves, round end, content, PWA files.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('game.js','utf8');
function boot({storage='ok',save,extra={}}={}){
  const els={},listeners={},data=new Map(),intervals=[];if(save!==undefined)data.set('bx-save',save);
  const el=id=>els[id]||(els[id]=(()=>{const e={textContent:'',dataset:{},handlers:{},attrs:{},addEventListener(n,f){this.handlers[n]=f},setAttribute(k,v){this.attrs[k]=v}};Object.defineProperty(e,'innerHTML',{get(){return e.html},set(v){e.html=v;e.textContent=v.replace(/<input[^>]*>/g,' '.repeat(10)).replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"')}});return e})());
  const ls={getItem:k=>data.get(k)??null,setItem:(k,v)=>{if(storage==='full')throw new Error('QuotaExceededError');data.set(k,String(v))}};
  const ctx={console,Date:{now:()=>123456},setTimeout:()=>0,setInterval:f=>intervals.push(f),document:{body:{dataset:{}},documentElement:{lang:'pl'},querySelector:el,querySelectorAll:()=>[],addEventListener:(n,f)=>listeners[n]=f},location:{protocol:'file:'},...extra};
  if(storage==='blocked')Object.defineProperty(ctx,'localStorage',{get(){throw new Error('SecurityError')}});else ctx.localStorage=ls;
  vm.runInNewContext(src,ctx);
  const key=k=>listeners.keydown({key:k,preventDefault(){},target:{}});
  const amount=n=>{for(const c of String(n))key(c);key('Enter')};
  return {ctx,data,el,key,amount,intervals,term:()=>el('#terminal').textContent,state:()=>JSON.parse(data.get('bx-save'))};
}
const rows78=t=>{const r=t.split('\n');assert.equal(r.length,23);assert.equal(r.find(x=>x.length!==78),undefined,r.map(x=>x.length).join(','))};
// 1. Blocked storage: the game starts and plays from memory.
let g=boot({storage:'blocked'});assert.ok(g.term().includes('Patroni projektu'));assert.ok(g.term().includes('Nie zapisano'));rows78(g.term());
g.key('N');assert.ok(g.term().includes('Towar:'));g.key('K');g.key('K');g.amount(5);assert.ok(/Kawa\.+\s+\d+\.00 \$\s+5 ton/.test(g.term()));assert.ok(g.term().includes('Nie zapisano'));rows78(g.term());
// 2. Full storage: no freeze, note shown.
g=boot({storage:'full'});assert.ok(g.term().includes('Patroni projektu'));g.key('N');assert.ok(g.term().includes('Towar:'));assert.ok(g.term().includes('Nie zapisano'));assert.equal(g.el('#save-status').textContent,'Nie zapisano');
// 3. Damaged saves are backed up, never dropped silently.
for(const bad of ['{oops','{"cash":"x","debt":1}','{"cash":1,"debt":1,"day":1,"city":42,"cargo":[],"prices":[]}']){
  g=boot({save:bad});assert.equal(g.data.get('bx-save-backup'),bad);g.key('Enter');assert.equal(g.state().cash,1000);assert.ok(g.term().includes('bx-save-backup'));
}
// 4. Older save keeps its data: goods index 2 (former tobacco) becomes cocoa, shares keep their indexes.
const old={schema:2,debtRate:6,cash:500,bank:0,debt:25000,city:1,day:3,cargo:[0,0,7,0,0,0,0,0,0,0],shares:[1,0,0,0,0,0,0,0,0,2],banks:[0,0,0,0,0,0],prices:[18,14,22,9,31,75,110,160,350,240],stockPrices:Array(10).fill(100),rng:7,alive:true,seed:1};
g=boot({save:JSON.stringify(old)});g.key('Enter');assert.ok(/Kakao\.+\s+22\.00 \$\s+7 ton/.test(g.term()));g.key('A');assert.ok(/Atlas Hotele\.+\s+100\.00 \$\s+1 szt\./.test(g.term()));assert.ok(/Jutrzenka Tech\.+\s+100\.00 \$\s+2 szt\./.test(g.term()));assert.equal(g.data.get('bx-save-backup'),undefined);
// 5. Win: repaying all debt ends the round; the end screen survives reload.
g=boot({save:JSON.stringify({...old,cash:30000})});g.key('Enter');g.key('D');g.key('O');g.amount(2000);assert.equal(g.state().alive,true);g.key('D');g.key('O');g.amount(23000);
assert.equal(g.state().debt,0);assert.equal(g.state().alive,false);assert.equal(g.state().end.win,true);assert.ok(g.term().includes('WYGRANA'));assert.ok(g.term().includes('Majątek netto: 5454.00 $'));rows78(g.term());
const won=g.data.get('bx-save');g=boot({save:won});g.key('Enter');assert.ok(g.term().includes('WYGRANA'));g.key('W');assert.ok(g.term().includes('WYGRANA'));g.key('N');assert.equal(g.state().alive,true);assert.equal(g.state().debt,25000);assert.ok(g.term().includes('Towar:'));
// 6. Bankruptcy: net worth below -250 000 $ after a trip, and the number limit.
g=boot({save:JSON.stringify({...old,cash:0,cargo:Array(10).fill(0),shares:Array(10).fill(0),debt:260000})});g.key('Enter');g.key('W');g.key('A');
assert.equal(g.state().alive,false);assert.equal(g.state().end.win,false);assert.ok(g.term().includes('BANKRUCTWO'));rows78(g.term());g.key('Q');assert.ok(g.term().includes('Patroni projektu'));g.key('Enter');assert.ok(g.term().includes('BANKRUCTWO'));
g=boot({save:JSON.stringify({...old,debt:2140000000,cash:2147000000})});g.key('Enter');g.key('W');g.key('A');assert.ok(g.term().includes('BANKRUCTWO'));
g=boot({save:JSON.stringify({...old,debt:200000,cash:0})});g.key('Enter');g.key('W');g.key('A');assert.equal(g.state().alive,true);
// 7. Patron rotation never redraws the terminal; language sets <html lang>.
g=boot();const html=g.el('#terminal').innerHTML;g.intervals.forEach(f=>f());assert.equal(g.el('#terminal').innerHTML,html);
g.key('L');assert.equal(g.ctx.document.documentElement.lang,'en');assert.ok(g.el('.screen').attrs['aria-label'].includes('game terminal'));assert.ok(g.term().includes('Privacy'));rows78(g.term());g.key('L');assert.equal(g.ctx.document.documentElement.lang,'pl');
// 8. Content: no tobacco, lottery or real brands.
assert.doesNotMatch(src,/tyto|tobac|loteri|lotter|hilton|donald|philips|jvc|toyota|pko|orlen|hipromine|excellence/i);
// 9. Page, PWA and service worker.
const index=fs.readFileSync('index.html','utf8');assert.ok(!/id="terminal"[^>]*aria-live/.test(index));assert.ok(index.includes('id="sr-message"'));
const privacy=fs.readFileSync('privacy.html','utf8');assert.ok(!/href="https?:/.test(privacy));assert.ok(privacy.includes('id="en"'));
const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));assert.ok(manifest.icons.some(i=>i.purpose==='maskable'));assert.equal(manifest.screenshots.length,2);
for(const f of [...manifest.icons,...manifest.screenshots].map(i=>i.src))assert.ok(fs.existsSync(f),f);
const sw=fs.readFileSync('sw.js','utf8');assert.ok(sw.includes("'./privacy.html'"));assert.ok(/try\{return await fetch\(request,[^\n]*\n\s*catch\{return await cache\.match\(new URL\('\.\/index\.html'/.test(sw));
console.log('PASS safety: blocked/full storage, save backup, old saves, win/bankruptcy, patron rotation, lang, content, privacy, manifest, SW.');
