// Etap A — profile, sloty, rangi, rekordy, rynek dnia, bramka. Node, bez zależności.
const fs=require('node:fs');const vm=require('node:vm');const assert=require('node:assert/strict');
const meta=require('./assets/v2meta.js');

const db=meta.emptyDb();
assert.equal(meta.addProfile(db).tier,'child');
assert.equal(db.profiles[0].birthYear,null);
assert.equal(db.profiles[0].rank,'handlarz');
assert.equal(meta.addProfile(db,{name:'Gracz 2'}).name,'Gracz 2');
meta.addProfile(db);meta.addProfile(db);
assert.equal(db.profiles.length,4);
assert.equal(meta.addProfile(db),null);

const slots=meta.emptyDb();
const p=meta.addProfile(slots);
assert.equal(meta.writeSlot(p,'4',{day:1}),false);
assert.equal(meta.writeSlot(p,'auto',{day:2,cash:5,debt:1,cargo:[],prices:[]},{date:'2026-10-21',at:1}),true);
assert.equal(meta.writeSlot(p,'1',{day:3,cash:9,debt:0,cargo:[],prices:[]},{date:'2026-10-21',at:2}),true);
assert.equal(meta.writeSlot(p,'2',{day:4,cash:1,debt:0,cargo:[],prices:[]},{date:'2026-10-20',at:3}),true);
assert.equal(meta.writeSlot(p,'3',{day:8,cash:1,debt:0,cargo:[],prices:[]},{date:'2026-10-19',at:4}),true);
assert.equal(p.slots.auto.state.day,2);
assert.equal(p.slots['1'].state.cash,9);
const legacyStore=new Map();
legacyStore.set('bx-save',JSON.stringify({cash:42,debt:0,day:6,cargo:[],prices:[]}));
const parsed=JSON.parse(legacyStore.get('bx-save'));
const imported=meta.importLegacy(meta.emptyDb(),parsed);
assert.equal(legacyStore.get('bx-save'),JSON.stringify({cash:42,debt:0,day:6,cargo:[],prices:[]}));
assert.equal(imported.db.profiles[0].name,'Gracz 1');
assert.equal(imported.db.profiles[0].tier,'child');
assert.equal(imported.db.profiles[0].slots.auto.state.cash,42);
assert.equal(meta.importLegacy(imported.db,parsed).imported,false);
meta.clearSlots(imported.db.profiles[0]);
assert.equal(imported.db.profiles[0].slots.auto,null);
assert.equal(legacyStore.get('bx-save').includes('42'),true);

assert.equal(meta.tierFromBirthYear(2014,2026),'child');
assert.equal(meta.tierFromBirthYear(2013,2026),'teen');
assert.equal(meta.tierFromBirthYear(2011,2026),'teen');
assert.equal(meta.tierFromBirthYear(2010,2026),'adult');
assert.equal(meta.tierFromBirthYear(2026,2026),'child');
assert.equal(meta.tierFromBirthYear(1800,2026),null);
assert.equal(meta.canApply('child','teen',false),false);
assert.equal(meta.canApply('child','adult',false),false);
assert.equal(meta.canApply('child','teen',true),true);
assert.equal(meta.canApply('adult','advanced',false),false);
assert.equal(meta.canApply('adult','advanced',true),true);
assert.equal(meta.canApply('child','advanced',true),false);
assert.equal(meta.canApply('adult','child',false),true);
assert.equal(meta.canApply('adult','teen',false),true);
assert.equal(meta.canApply('teen','child',false),true);
assert.equal(meta.canApply('advanced','adult',false),true);
const gateP=meta.addProfile(meta.emptyDb());
assert.equal(meta.applyBirthYear(gateP,2010,2026,false).ok,false);
assert.equal(gateP.tier,'child');
assert.equal(meta.applyBirthYear(gateP,2010,2026,true).ok,true);
assert.equal(gateP.tier,'adult');
assert.equal(meta.applyBirthYear(gateP,2014,2026,false).tier,'child');
const pin=meta.hashPin('4821','salt');
assert.notEqual(pin,'4821');
assert.equal(pin.includes('4821'),false);
assert.equal(meta.checkPin('4821','salt',pin),true);
assert.equal(meta.checkPin('0000','salt',pin),false);
const quiz=meta.mathChallenge(()=>0);
assert.equal(quiz.answer,quiz.a*quiz.b);
assert.ok(quiz.answer>=10&&quiz.answer<=81);
assert.equal(meta.checkMath(quiz,String(quiz.answer)),true);
assert.equal(meta.checkMath(quiz,'0'),false);

const ranks=['handlarz','kupiec','hurtownik','magnat'];
assert.deepEqual(meta.RANKS.map(r=>r.id),ranks);
for(const id of ranks){
  const r=meta.rank(id);
  assert.ok(r.goal>0&&r.days>0&&r.goods>=4&&r.cities>=4);
}
assert.equal(meta.nextRank('handlarz'),'kupiec');
assert.equal(meta.nextRank('magnat'),null);
assert.ok(meta.rank('kupiec').goods>meta.rank('handlarz').goods);
assert.ok(meta.rank('magnat').days>meta.rank('hurtownik').days);
const base={day:1,cash:1000,debt:25000,banks:[0,0,0,0,0,0],cargo:Array(10).fill(0),prices:Array(10).fill(10),city:0};
const armed=meta.arm(structuredClone(base),{mode:'career',rank:'handlarz',tier:'child'});
assert.equal(armed.v2Career,true);
assert.equal(meta.outcome(armed).ended,false);
armed.day=armed.v2Days+1;
assert.equal(meta.outcome(armed).ended,true);
assert.equal(meta.outcome(armed).promoted,false);
const win=meta.arm(structuredClone(base),{mode:'career',rank:'handlarz',tier:'adult'});
win.cash=win.cash+win.v2Goal+1;
assert.equal(meta.outcome(win).promoted,true);
assert.equal(meta.outcome(win).ended,true);
const daily=meta.arm(structuredClone(base),{mode:'daily',rank:'handlarz',tier:'adult',seed:99});
assert.equal(daily.v2Career,false);
assert.equal(daily.v2Daily,true);
daily.cash+=999999;
assert.equal(meta.outcome(daily).promoted,false);
assert.deepEqual(meta.goodIndexes('child',4),[0,1,3,4]);
assert.equal(meta.goodIndexes('child',10).includes(2),false);
assert.deepEqual(meta.goodIndexes('adult',4),[0,1,2,3]);
assert.equal(meta.limits('handlarz','advanced').goods,10);
assert.ok(meta.limits('handlarz','advanced').goal>meta.rank('handlarz').goal);

const rec=meta.addProfile(meta.emptyDb());
const key='child|handlarz';
for(let i=0;i<8;i++)meta.addRecord(rec,key,{score:i*10,days:20-i,date:'2026-10-21',initials:'abc'});
const top=meta.records(rec,key);
assert.equal(top.length,5);
assert.equal(top[0].score,70);
assert.equal(top[4].score,30);
assert.equal(top[0].initials,'ABC');
assert.equal(meta.addRecord(rec,key,{score:30,days:1,date:'2026-10-22',initials:'ZZZ'}),false);
assert.equal(meta.records(rec,key).length,5);
assert.equal(meta.addRecord(rec,key,{score:100,days:9,date:'2026-10-22',initials:'QM'}),true);
assert.equal(meta.records(rec,key)[0].score,100);
assert.equal(meta.records(rec,'daily').length,0);
meta.addRecord(rec,'daily',{score:15,days:14,date:'2026-10-21',initials:'DAY'});
assert.equal(meta.records(rec,'daily').length,1);
assert.equal(meta.best(rec,key),100);
assert.equal(meta.best(rec,'missing'),null);

const d1=meta.dailySeed('2026-10-21'),d2=meta.dailySeed('2026-10-22');
assert.equal(d1,meta.dailySeed('2026-10-21'));
assert.notEqual(d1,d2);
const code=meta.challengeCode(d1);
assert.match(code,/^BX-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/);
assert.equal(meta.seedFromCode(code),d1);
assert.equal(meta.seedFromCode(code.toLowerCase()),d1);
assert.equal(meta.seedFromCode('BX-0000'),null);
assert.equal(meta.seedFromCode('nope'),null);
const marketA=meta.arm(structuredClone(base),{mode:'daily',tier:'adult',rank:'handlarz',seed:d1});
const marketB=meta.arm(structuredClone(base),{mode:'challenge',tier:'adult',rank:'handlarz',seed:meta.seedFromCode(code)});
assert.equal(marketA.rng,marketB.rng);
assert.equal(marketA.debtRate,marketB.debtRate);
assert.equal(marketA.seed,marketB.seed);
for(let n=0;n<40;n++){
  const day=`2026-01-${String(n+1).padStart(2,'0')}`;
  const seed=meta.dailySeed(day);
  assert.equal(meta.seedFromCode(meta.challengeCode(seed)),seed);
}

const ui=fs.readFileSync('assets/v2ui.js','utf8');
const game=fs.readFileSync('game.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');
for(const needle of ['NOWY REKORD','NEW RECORD','prefers-reduced-motion','bx2r-','Web Share','BX-','Handlarz','Magnat'])assert.ok(ui.includes(needle),needle);
assert.equal(ui.includes('removeItem'),false);
assert.equal(ui.includes('streak'),false);
assert.equal(ui.includes('Notification'),false);
assert.ok(game.includes('bx2r-'));
assert.equal(game.includes("removeItem('bx-save')"),false);
assert.equal(game.includes('removeItem("bx-save")'),false);
assert.ok(sw.includes('biznes-2-retro-'));
assert.ok(sw.includes('assets/v2meta.js')&&sw.includes('assets/v2ui.js'));
assert.equal(fs.readFileSync('classic/game.js','utf8').includes('bx2r-'),false);

function boot(store,extra){
  const elements={};
  function el(id){
    if(!elements[id]){
      const e={textContent:'',dataset:{},style:{setProperty(){}},handlers:{},addEventListener(n,f){e.handlers[n]=f},close(){}};
      Object.defineProperty(e,'innerHTML',{get(){return e.html||''},set(v){e.html=v}});
      elements[id]=e;
    }
    return elements[id];
  }
  const context={
    setTimeout:()=>0,setInterval:()=>0,console,Date:{now:()=>123456},
    document:{body:{dataset:{}},querySelector:el,querySelectorAll:()=>[],addEventListener(){}},
    localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem(k,v){if(String(k).startsWith('bx-')&&!String(k).startsWith('bx2r-'))throw new Error('wrote '+k);store.set(k,v)},removeItem(){throw new Error('remove')}},
    location:{protocol:'file:'},...extra
  };
  vm.runInNewContext(fs.readFileSync('game.js','utf8')+'\nglobalThis.__meta=typeof BiznesGame==="undefined"?null:BiznesGame;',context);
  return context;
}
const mem=new Map();
mem.set('bx-save','{"schema":2,"cash":77,"debt":1,"day":3,"city":0,"cargo":[0,0,0,0,0,0,0,0,0,0],"shares":[0,0,0,0,0,0,0,0,0,0],"banks":[0,0,0,0,0,0],"prices":[18,14,22,9,31,75,110,160,350,240],"stockPrices":[80,81,82,83,84,85,86,87,88,89],"debtRate":5,"rng":4,"alive":true,"seed":4}');
const raw=mem.get('bx-save');
const saved=[];
boot(mem,{BX2:{playing:false,onSave(){saved.push(1)}}});
assert.equal(mem.get('bx-save'),raw);
assert.equal(saved.length,0);
const mem2=new Map();
const seen=[];
const ctx=boot(mem2,{BX2:{playing:true,onSave(s){seen.push(s.cash)}}});
assert.equal(mem2.has('bx-save'),false);
assert.ok(seen.length>=1);
assert.equal(ctx.BiznesGame.lang,'pl');

function bootShell(store){
  const elements={};
  function el(id){
    if(!elements[id]){
      const e={textContent:'',dataset:{},style:{setProperty(){}},classList:{contains(){return false}},addEventListener(){},close(){}};
      Object.defineProperty(e,'innerHTML',{get(){return e.html||''},set(v){e.html=String(v);e.textContent=e.html.replace(/<[^>]*>/g,'')}});
      elements[id]=e;
    }
    return elements[id];
  }
  const context={
    setTimeout:()=>0,setInterval:()=>0,clearInterval(){},console,Date,matchMedia:()=>({matches:false}),
    document:{body:{dataset:{}},hidden:false,activeElement:null,querySelector:el,querySelectorAll:()=>[],addEventListener(){}},
    localStorage:{
      getItem:k=>store.has(k)?store.get(k):null,
      setItem(k,v){if(/^(bx-save|bx-lang|bx-style|bx-font|bx-hand)$/.test(k))throw new Error('legacy write '+k);store.set(k,v)},
      removeItem(){throw new Error('remove')}
    },
    location:{protocol:'file:'},navigator:{}
  };
  const code=[fs.readFileSync('assets/v2meta.js','utf8'),fs.readFileSync('assets/v2ui.js','utf8'),fs.readFileSync('game.js','utf8')].join('\n');
  vm.runInNewContext(code,context);
  return {context,el};
}
const shellStore=new Map();
shellStore.set('bx-save','{"schema":2,"cash":77,"debt":1,"day":4,"city":0,"cargo":[0,0,0,0,0,0,0,0,0,0],"shares":[0,0,0,0,0,0,0,0,0,0],"banks":[0,0,0,0,0,0],"prices":[18,14,22,9,31,75,110,160,350,240],"stockPrices":[80,81,82,83,84,85,86,87,88,89],"debtRate":5,"rng":4,"alive":true,"seed":4}');
const shellRaw=shellStore.get('bx-save');
const shell=bootShell(shellStore);
const screenText=()=>shell.el('#terminal').textContent;
assert.ok(screenText().includes('Nowa gra')&&screenText().includes('Kontynuuj')&&screenText().includes('Rekordy'));
assert.ok(screenText().includes('Ustawienia')&&screenText().includes('Jak grać')&&screenText().includes('prywatność'));
assert.ok(shell.el('#terminal').innerHTML.includes('data-ui-action="new"')&&shell.el('#mobile').innerHTML.includes('v2-row2'));
assert.equal(shellStore.get('bx-save'),shellRaw);
assert.ok(shellStore.get('bx2r-db').includes('Gracz 1'));
shell.context.BX2.onKey('N');
assert.ok(screenText().includes('Nowy profil')||screenText().includes('Gracz 1'));
shell.context.BX2.onKey('N');
assert.ok(screenText().includes('Rok urodzenia'));
for(const digit of '2014')shell.context.BX2.onKey(digit);
shell.context.BX2.onKey('ENTER');
assert.ok(screenText().includes('Rynek dnia')&&screenText().includes('Handlarz'));
shell.context.BX2.onKey('K');
assert.ok(screenText().includes('Towar'));
const played=shell.context.BiznesGame.getS();
assert.equal(played.v2Tier,'child');
assert.equal(played.v2Goods,4);
assert.equal(meta.goodIndexes(played.v2Tier,played.v2Goods).includes(2),false);
played.day=played.v2Days+1;
shell.context.BX2.onHome(played);
assert.ok(screenText().includes('Trzy litery')||screenText().includes('Wynik'));
assert.equal(shellStore.get('bx-save'),shellRaw);

console.log('PASS stage A: profiles, slots, migration, ranks, records, daily seed, parental gate, bx-save untouched.');
