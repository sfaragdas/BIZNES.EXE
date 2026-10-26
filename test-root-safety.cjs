// BETA safety checks: storage failures, damaged saves, round end, content, PWA files.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('game.js','utf8');
function boot({storage='ok',save,extra={},pre={}}={}){
  const els={},listeners={},data=new Map(Object.entries(pre)),intervals=[];if(save!==undefined)data.set('bx-save',save);
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
g.key('N');g.key('1');assert.ok(g.term().includes('Towar:'));g.key('K');g.key('K');g.amount(5);assert.ok(/Kawa\.+\s+\d+\.00 \$\s+5 ton/.test(g.term()));assert.ok(g.term().includes('Nie zapisano'));rows78(g.term());
// 2. Full storage: no freeze, note shown.
g=boot({storage:'full'});assert.ok(g.term().includes('Patroni projektu'));g.key('N');g.key('Enter');assert.ok(g.term().includes('Towar:'));assert.ok(g.term().includes('Nie zapisano'));assert.equal(g.el('#save-status').textContent,'Nie zapisano');
// 3. Damaged saves are backed up, never dropped silently.
for(const bad of ['{oops','{"cash":"x","debt":1}','{"cash":1,"debt":1,"day":1,"city":42,"cargo":[],"prices":[]}']){
  g=boot({save:bad});assert.equal(g.data.get('bx-save-backup'),bad);g.key('Enter');assert.equal(g.state().cash,1000);assert.ok(g.term().includes('bx-save-backup'));
}
// 4. Older save keeps its data: goods index 2 (former tobacco) becomes cocoa, shares keep their indexes.
const old={schema:2,debtRate:6,cash:500,bank:0,debt:25000,city:1,day:3,cargo:[0,0,7,0,0,0,0,0,0,0],shares:[1,0,0,0,0,0,0,0,0,2],banks:[0,0,0,0,0,0],prices:[18,14,22,9,31,75,110,160,350,240],stockPrices:Array(10).fill(100),rng:7,alive:true,seed:1};
g=boot({save:JSON.stringify(old)});g.key('Enter');assert.ok(/Kakao\.+\s+22\.00 \$\s+7 ton/.test(g.term()));g.key('A');assert.ok(/Atlas Hotele\.+\s+100\.00 \$\s+1 szt\./.test(g.term()));assert.ok(/Jutrzenka Tech\.+\s+100\.00 \$\s+2 szt\./.test(g.term()));assert.equal(g.data.get('bx-save-backup'),undefined);
// 5. Goal choice on New game: 1/2/3, Enter = highlighted 1, Esc = menu.
const recs=g=>JSON.parse(g.data.get('bx-records')||'{}');
g=boot();g.key('N');assert.ok(g.term().includes('NOWA GRA · WYBIERZ CEL'));assert.ok(g.term().includes('► 1) Rok handlu ◄'));rows78(g.term());
g.key('ESC');assert.ok(g.term().includes('Patroni projektu'));g.key('N');g.key('Enter');assert.equal(g.state().goal,1);assert.ok(g.term().includes('Rok handlu: zostało 364 dni'));rows78(g.term());
for(const [k,label] of [['2','Cel 1 000 000 $: 0 %'],['3','Bez końca: dzień 1']]){g.key('Q');g.key('N');g.key(k);assert.equal(g.state().goal,Number(k));assert.ok(g.term().includes(label),label)}
g.key('L');g.key('Q');g.key('N');assert.ok(g.term().includes('NEW GAME · CHOOSE YOUR GOAL'));rows78(g.term());g.key('L');
// 6. Repaying the debt is not game over: continue (once per game) or finish with a score.
g=boot({save:JSON.stringify({...old,cash:30000})});g.key('Enter');g.key('D');g.key('O');g.amount(2000);assert.equal(g.state().prompt,undefined);g.key('D');g.key('O');g.amount(23000);
assert.equal(g.state().debt,0);assert.equal(g.state().alive,true);assert.ok(g.term().includes('Dług spłacony!'));assert.ok(g.term().includes('Graj dalej'));rows78(g.term());
const paid=g.data.get('bx-save');g.key('1');assert.ok(g.term().includes('Towar:'));g.key('D');g.key('P');g.amount(100);g.key('D');g.key('O');g.amount(100);assert.ok(g.term().includes('Towar:'));assert.equal(g.state().alive,true);
g=boot({save:paid});g.key('Enter');assert.ok(g.term().includes('Dług spłacony!'));g.key('2');assert.equal(g.state().alive,false);assert.ok(g.term().includes('KONIEC GRY'));assert.ok(g.term().includes('Najlepsze wyniki · Bez końca'));assert.ok(g.term().includes('◄'));assert.equal(recs(g)[3].length,1);rows78(g.term());
g.key('N');assert.ok(g.term().includes('WYBIERZ CEL'));
// 7. Milestones 100 000 $ and 500 000 $ prompt once each per game.
const year={...old,goal:1,ms:[],debt:1000};
g=boot({save:JSON.stringify({...year,cash:150000})});g.key('Enter');g.key('W');g.key('A');assert.ok(g.term().includes('Majątek netto 100 000 $!'));assert.deepEqual(g.state().ms,['k100']);g.key('Enter');g.key('W');g.key('W');assert.ok(g.term().includes('Dokąd'));
g=boot({save:JSON.stringify({...year,cash:700000})});g.key('Enter');g.key('W');g.key('A');assert.ok(g.term().includes('Majątek netto 500 000 $!'));assert.deepEqual(g.state().ms,['k100','k500']);g.key('1');g.key('W');g.key('W');assert.ok(g.term().includes('Dokąd'));
// 8. Trading year: the game ends on day 365, score = net worth.
g=boot({save:JSON.stringify({...year,day:364,ms:['k100','k500']})});g.key('Enter');g.key('W');g.key('A');assert.ok(g.term().includes('KONIEC ROKU HANDLU'));assert.equal(g.state().alive,false);assert.equal(recs(g)[1][0].d,g.state().end.day);assert.ok(g.term().includes('Najlepsze wyniki · Rok handlu'));rows78(g.term());
// 9. 1 000 000 $: a win with the score recorded, then free play and End game from the menu.
g=boot({save:JSON.stringify({...old,goal:2,ms:['debt','k100','k500'],cash:1200000})});g.key('Enter');g.key('W');g.key('A');assert.ok(g.term().includes('CEL! Majątek netto 1 000 000 $!'));assert.equal(recs(g)[2].length,1);
g.key('G');assert.equal(g.state().alive,true);assert.ok(g.term().includes('Cel 1 000 000 $: 100 %'));g.key('W');g.key('B');assert.ok(!g.term().includes('CEL!'));
g.key('Q');assert.ok(g.term().includes('Zakończ grę'));rows78(g.term());g.key('Z');assert.ok(g.term().includes('CEL OSIĄGNIĘTY'));assert.equal(recs(g)[2].length,1);assert.ok(g.term().includes('◄'));
// 10. Bankruptcy stays the only forced end and records nothing.
g=boot({save:JSON.stringify({...old,cash:0,cargo:Array(10).fill(0),shares:Array(10).fill(0),debt:260000})});g.key('Enter');g.key('W');g.key('A');
assert.equal(g.state().alive,false);assert.equal(g.state().end.kind,'bankrupt');assert.ok(g.term().includes('BANKRUCTWO'));assert.equal(g.data.get('bx-records'),undefined);rows78(g.term());g.key('Q');assert.ok(g.term().includes('Patroni projektu'));g.key('Enter');assert.ok(g.term().includes('BANKRUCTWO'));
g=boot({save:JSON.stringify({...old,debt:2140000000,cash:2147000000})});g.key('Enter');g.key('W');g.key('A');assert.ok(g.term().includes('BANKRUCTWO'));
g=boot({save:JSON.stringify({...old,debt:200000,cash:0})});g.key('Enter');g.key('W');g.key('A');assert.equal(g.state().alive,true);
// 11. Old saves: no goal -> Endless, data kept; a 2026.10.25 "debt repaid" end resumes play.
g=boot({save:JSON.stringify(old)});g.key('Enter');assert.equal(g.state().goal,3);assert.equal(g.state().cash,500);assert.ok(g.term().includes('Bez końca: dzień 3'));
g=boot({save:JSON.stringify({...old,debt:0,alive:false,end:{win:true,day:3,worth:5454}})});g.key('Enter');assert.equal(g.state().alive,true);assert.equal(g.state().end,undefined);assert.ok(g.term().includes('Towar:'));
g=boot({save:JSON.stringify({...old,debt:300000,alive:false,end:{win:false,day:3,worth:-1}})});g.key('Enter');assert.ok(g.term().includes('BANKRUCTWO'));
// 12. Records: top 5 per goal, best first; a broken list is backed up; Records screen from the menu.
const five=[9e5,8e5,7e5,6e5,5e5].map((w,i)=>({w,d:10+i,s:1}));
g=boot({save:JSON.stringify({...old,ms:['debt','k100','k500'],cash:750000,seed:2})},);g.data.set('bx-records',JSON.stringify({3:five}));g.key('Z');
assert.deepEqual(recs(g)[3].map(e=>e.w),[9e5,8e5,725454,7e5,6e5]);assert.ok(g.term().includes('◄'));
g.key('Q');g.key('W');assert.ok(g.term().includes('NAJLEPSZE WYNIKI'));assert.ok(g.term().includes('900000.00 $'));assert.ok(g.term().includes('brak wyników'));rows78(g.term());g.key('ESC');assert.ok(g.term().includes('Patroni projektu'));
g=boot({pre:{'bx-records':'{bad'}});g.key('W');assert.equal(g.data.get('bx-records-backup'),'{bad');
// 13. Patron rotation never redraws the terminal; language sets <html lang>.
g=boot();const html=g.el('#terminal').innerHTML;g.intervals.forEach(f=>f());assert.equal(g.el('#terminal').innerHTML,html);
g.key('L');assert.equal(g.ctx.document.documentElement.lang,'en');assert.ok(g.el('.screen').attrs['aria-label'].includes('game terminal'));assert.ok(g.term().includes('Privacy'));rows78(g.term());g.key('L');assert.equal(g.ctx.document.documentElement.lang,'pl');
// 14. Content: no tobacco, lottery or real brands.
assert.doesNotMatch(src,/tyto|tobac|loteri|lotter|hilton|donald|philips|jvc|toyota|pko|orlen|hipromine|excellence/i);
// 15. Page, PWA and service worker.
const index=fs.readFileSync('index.html','utf8');assert.ok(!/id="terminal"[^>]*aria-live/.test(index));assert.ok(index.includes('id="sr-message"'));
const privacy=fs.readFileSync('privacy.html','utf8');assert.ok(!/href="https?:/.test(privacy));assert.ok(privacy.includes('id="en"'));
const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));assert.ok(manifest.icons.some(i=>i.purpose==='maskable'));assert.equal(manifest.screenshots.length,2);
for(const f of [...manifest.icons,...manifest.screenshots].map(i=>i.src))assert.ok(fs.existsSync(f),f);
const sw=fs.readFileSync('sw.js','utf8');assert.ok(sw.includes("'./privacy.html'"));assert.ok(/try\{return await fetch\(request,[^\n]*\n\s*catch\{return await cache\.match\(new URL\('\.\/index\.html'/.test(sw));
console.log('PASS safety: blocked/full storage, save backup, old saves, goals (year/1M/endless), milestones, records, bankruptcy, patron rotation, lang, content, privacy, manifest, SW.');
