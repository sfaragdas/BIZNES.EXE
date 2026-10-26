// BETA safety checks: storage failures, damaged saves, round end, content, PWA files.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('game.js','utf8');
function boot({storage='ok',save,extra={},pre={}}={}){
  const els={},listeners={},data=new Map(Object.entries(pre)),intervals=[];if(save!==undefined)data.set('bx-save',save);
  const el=id=>els[id]||(els[id]=(()=>{const e={textContent:'',dataset:{},handlers:{},attrs:{},addEventListener(n,f){this.handlers[n]=f},setAttribute(k,v){this.attrs[k]=v}};Object.defineProperty(e,'innerHTML',{get(){return e.html},set(v){e.html=v;e.textContent=v.replace(/<input[^>]*>/g,' '.repeat(10)).replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"')}});return e})());
  const ls={getItem:k=>data.get(k)??null,setItem:(k,v)=>{if(storage==='full')throw new Error('QuotaExceededError');data.set(k,String(v))}};
  const ctx={console,Date:{now:()=>123456},setTimeout:()=>0,setInterval:f=>intervals.push(f),document:{body:{dataset:{}},documentElement:{lang:'pl'},querySelector:el,querySelectorAll:()=>[],addEventListener:(n,f)=>listeners[n]=f},location:{protocol:'file:'},...extra};
  if(storage==='blocked')Object.defineProperty(ctx,'localStorage',{get(){throw new Error('SecurityError')}});else ctx.localStorage=ls;
  vm.runInNewContext(src.replace(/\}\)\(\);\s*$/,'globalThis.T_={nextDebtRate,addRecord};})();'),ctx);
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
// 5. Levels: picked on New game (1/2/3, Enter = highlighted 1), each with its own limits.
const recs=g=>JSON.parse(g.data.get('bx-records')||'{}'),H=g=>g.el('#terminal').innerHTML;
g=boot();g.key('N');assert.ok(g.term().includes('NOWA GRA · WYBIERZ POZIOM'));assert.ok(g.term().includes('► 1) Handlarz ◄'));assert.ok(g.term().includes('Cel 50000 $, 40 dni'));rows78(g.term());
g.key('ESC');assert.ok(g.term().includes('Patroni projektu'));g.key('N');g.key('Enter');
let st=g.state();assert.equal(st.level,'handlarz');assert.equal(st.debt,1000);assert.equal(st.start,0);assert.ok(st.debtRate>=1&&st.debtRate<=3);
assert.ok(g.term().includes('Handlarz: 0/3000 $ · zostało 14 dni'));assert.ok(!g.term().includes('Akcje')&&!g.term().includes('Banki'));rows78(g.term());
assert.equal((H(g).match(/data-ui-action="good-/g)||[]).length,4);g.key('A');g.key('B');assert.ok(g.term().includes('Towar:'));
g.key('W');assert.equal((H(g).match(/data-ui-action="city-/g)||[]).length,3);g.key('ESC');assert.ok(g.term().includes('Towar:'));
for(let i=0;i<60;i++)assert.ok(g.ctx.T_.nextDebtRate()<=3);
g.key('Q');g.key('N');g.key('2');st=g.state();assert.equal(st.level,'kupiec');assert.equal(st.debt,5000);assert.ok(st.debtRate<=10);assert.ok(g.term().includes('Banki')&&!g.term().includes('Akcje'));assert.equal((H(g).match(/data-ui-action="good-/g)||[]).length,6);
g.key('W');assert.equal((H(g).match(/data-ui-action="city-/g)||[]).length,5);g.key('ESC');
g.key('Q');g.key('N');g.key('3');st=g.state();assert.equal(st.level,'magnat');assert.equal(st.debt,25000);assert.ok(g.term().includes('Akcje')&&g.term().includes('Banki'));assert.ok(g.term().includes('Magnat: -24000/50000 $ · zostało 40 dni'));
g.key('L');g.key('Q');g.key('N');assert.ok(g.term().includes('NEW GAME · CHOOSE A LEVEL'));rows78(g.term());g.key('L');
// 6. Goal reached ends the round; score = (end - start net worth) / days played; under 18 there is no endless option.
const kup={...old,level:'kupiec',start:-4000,debt:0,cash:9000,cargo:Array(10).fill(0),shares:Array(10).fill(0),day:5,paidDay:3};
const score=s=>Math.round((s.end.worth-s.start)/(s.end.day-1));
g=boot({save:JSON.stringify(kup)});g.key('Enter');g.key('W');g.key('A');st=g.state();
assert.equal(st.alive,false);assert.equal(st.end.kind,'goal');assert.ok(g.term().includes('CEL OSIĄGNIĘTY!'));assert.equal(st.score.p,score(st));assert.equal(st.score.paid,3);assert.ok(g.term().includes(`Wynik: +${st.score.p} $/dzień`));
assert.equal(recs(g).kupiec.length,1);assert.ok(g.term().includes('Najlepsze wyniki · Kupiec'));assert.ok(g.term().includes('◄'));assert.ok(!g.term().includes('bez końca'));g.key('G');assert.equal(g.state().alive,false);rows78(g.term());
g.key('N');assert.ok(g.term().includes('WYBIERZ POZIOM'));
// Debt repayment day is tracked once.
g=boot({save:JSON.stringify({...kup,debt:500,paidDay:null,cash:600})});g.key('Enter');g.key('D');g.key('O');g.amount(500);assert.equal(g.state().paidDay,5);assert.ok(g.term().includes('Dług spłacony!'));assert.equal(g.state().alive,true);
// 7. Days run out: Handlarz ends after day 14.
g=boot({save:JSON.stringify({...old,level:'handlarz',start:0,debt:1000,cash:1000,cargo:Array(10).fill(0),shares:Array(10).fill(0),day:14,city:1})});g.key('Enter');assert.ok(g.term().includes('zostało 1 dni'));g.key('W');g.key('A');st=g.state();
assert.equal(st.end.kind,'time');assert.ok(g.term().includes('KONIEC CZASU.'));assert.equal(st.score.p,score(st));assert.equal(st.score.paid,null);assert.equal(recs(g).handlarz[0].paid,null);rows78(g.term());
// 8. Top 5 per level, tie-break: earlier debt repayment first, never repaid last.
g=boot({save:JSON.stringify(kup)});for(const e of [{p:100,d:9,paid:null,s:1},{p:300,d:9,paid:null,s:2},{p:300,d:9,paid:9,s:3},{p:500,d:9,paid:null,s:4},{p:300,d:9,paid:2,s:5},{p:300,d:9,paid:5,s:6}])g.ctx.T_.addRecord(e);
assert.deepEqual(recs(g).kupiec.map(e=>e.s),[4,5,6,3,2]);assert.equal(recs(g).handlarz,undefined);
g.key('Q');g.key('W');assert.ok(g.term().includes('NAJLEPSZE WYNIKI'));assert.ok(g.term().includes('+500 $/dzień'));assert.ok(g.term().includes('brak wyników'));rows78(g.term());g.key('ESC');assert.ok(g.term().includes('Patroni projektu'));
g=boot({pre:{'bx-records':'{bad'}});g.key('W');assert.equal(g.data.get('bx-records-backup'),'{bad');
// 9. 18+: Kupiec and Magnat may play on endlessly with the score frozen; Handlarz just ends.
g=boot({save:JSON.stringify(kup),pre:{'bx-age':'18'}});g.key('Enter');g.key('W');g.key('A');assert.ok(g.term().includes('Graj dalej bez końca'));const frozen=g.state().score;rows78(g.term());
g.key('G');st=g.state();assert.equal(st.alive,true);assert.equal(st.endless,true);assert.ok(g.term().includes('Kupiec · bez końca · wynik'));
for(let i=0;i<30;i++){g.key('W');g.key(i%2?'A':'B')}st=g.state();assert.equal(st.alive,true);assert.deepEqual(st.score,frozen);assert.equal(recs(g).kupiec.length,1);
 g=boot({save:JSON.stringify({...kup,level:'magnat',start:-24000,cash:60000}),pre:{'bx-age':'18'}});g.key('Enter');g.key('W');g.key('A');assert.ok(g.term().includes('Graj dalej bez końca'));
g=boot({save:JSON.stringify({...kup,level:'handlarz',start:0,cash:4000,city:1}),pre:{'bx-age':'18'}});g.key('Enter');g.key('W');g.key('A');assert.ok(g.term().includes('CEL OSIĄGNIĘTY!'));assert.ok(!g.term().includes('bez końca'));g.key('G');assert.equal(g.state().alive,false);
// 10. Patron links: plain text under 18 (default), links on 18+; the switch persists.
g=boot();assert.ok(!H(g).includes('href="https://'));assert.ok(!H(g).includes('&amp;lt;'));assert.ok(!g.el('#mobile').innerHTML.includes('href="https://'));assert.ok(g.term().includes('Wiek <18'));
g.key('A');assert.equal(g.data.get('bx-age'),'18');assert.ok(H(g).includes('href="https://lcse.pl"'));assert.ok(g.el('#mobile').innerHTML.includes('href="https://'));
g=boot({pre:{'bx-age':'18'}});assert.ok(H(g).includes('href="https://mojedostawy.pl"'));g.key('A');assert.equal(g.data.get('bx-age'),'u18');assert.ok(!H(g).includes('href="https://'));
// 11. Bankruptcy stays a forced end and records nothing.
g=boot({save:JSON.stringify({...old,level:'magnat',cash:0,cargo:Array(10).fill(0),shares:Array(10).fill(0),debt:260000})});g.key('Enter');g.key('W');g.key('A');
assert.equal(g.state().alive,false);assert.equal(g.state().end.kind,'bankrupt');assert.ok(g.term().includes('BANKRUCTWO'));assert.ok(g.term().includes('Bez wyniku'));assert.equal(g.data.get('bx-records'),undefined);rows78(g.term());g.key('Q');assert.ok(g.term().includes('Patroni projektu'));g.key('Enter');assert.ok(g.term().includes('BANKRUCTWO'));
g=boot({save:JSON.stringify({...old,debt:2140000000,cash:2147000000})});g.key('Enter');g.key('W');g.key('A');assert.ok(g.term().includes('BANKRUCTWO'));
g=boot({save:JSON.stringify({...old,debt:200000,cash:0})});g.key('Enter');g.key('W');g.key('A');assert.equal(g.state().alive,true);
// 12. Old saves (no level): free play with Magnat limits, no goal, no records; a 2026.10.25 "debt repaid" end resumes.
g=boot({save:JSON.stringify(old)});g.key('Enter');st=g.state();assert.equal(st.level,'legacy');assert.equal(st.cash,500);assert.ok(g.term().includes('Gra swobodna (stary zapis)'));for(let i=0;i<50;i++){g.key('W');g.key(i%2?'A':'B')}assert.equal(g.state().alive,true);assert.equal(g.data.get('bx-records'),undefined);
g=boot({save:JSON.stringify({...old,debt:0,alive:false,end:{win:true,day:3,worth:5454}})});g.key('Enter');assert.equal(g.state().alive,true);assert.equal(g.state().end,undefined);assert.ok(g.term().includes('Towar:'));
g=boot({save:JSON.stringify({...old,debt:300000,alive:false,end:{win:false,day:3,worth:-1}})});g.key('Enter');assert.ok(g.term().includes('BANKRUCTWO'));
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
console.log('PASS safety: blocked/full storage, save backup, old saves, levels, round end, score, tie-break, records, 18+ links and endless, bankruptcy, patron rotation, lang, content, privacy, manifest, SW.');
