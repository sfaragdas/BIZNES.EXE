(function(root,factory){
const api=factory();
if(typeof module==='object'&&module.exports)module.exports=api;
root.BiznesMeta=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const ORDER=['child','teen','adult','advanced'];
const RANKS=[
{id:'handlarz',pl:'Handlarz',en:'Trader',goal:3000,days:14,goods:4,cities:4,stocks:4},
{id:'kupiec',pl:'Kupiec',en:'Merchant',goal:8000,days:21,goods:6,cities:6,stocks:6},
{id:'hurtownik',pl:'Hurtownik',en:'Wholesaler',goal:20000,days:28,goods:8,cities:8,stocks:8},
{id:'magnat',pl:'Magnat',en:'Magnate',goal:50000,days:40,goods:10,cities:9,stocks:10}
];
const SLOTS=['auto','1','2','3'];
const DAILY_DAYS=14;
const ALPH='23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const TIER_NAME={
child:{pl:'Dziecko',en:'Child'},teen:{pl:'Nastolatek',en:'Teen'},
adult:{pl:'Dorosły',en:'Adult'},advanced:{pl:'Zaawansowany',en:'Advanced'}
};
const clone=o=>JSON.parse(JSON.stringify(o));
const emptySlots=()=>({auto:null,'1':null,'2':null,'3':null});
function emptyDb(){return {v:1,active:null,profiles:[],legacy:false,seq:0,pinSalt:null,pinHash:null}}
function addProfile(db,opts){if(db.profiles.length>=4)return null;const n=db.profiles.length+1;let name=opts&&opts.name?String(opts.name):'Gracz '+n;name=name.replace(/[^\p{L}\p{N} ]/gu,'').replace(/\s+/g,' ').trim().slice(0,12);if(!name)name='Gracz '+n;db.seq=(db.seq||0)+1;const profile={id:'p'+db.seq,name,tier:'child',birthYear:null,rank:'handlarz',slots:emptySlots(),records:{},dailyDone:''};db.profiles.push(profile);if(!db.active)db.active=profile.id;return profile;}
function writeSlot(profile,slot,state,info){const key=String(slot);if(!SLOTS.includes(key))return false;const extra=info||{};profile.slots[key]={state:clone(state),tier:extra.tier||profile.tier,rank:extra.rank||profile.rank,day:state.day|0,wealth:extra.wealth!=null?extra.wealth:wealth(state),date:extra.date||'',at:extra.at||0};return true;}
function clearSlots(profile){profile.slots=emptySlots()}
function importLegacy(db,state){if(db.legacy)return {db,imported:false};let profile=db.profiles.find(item=>item.name==='Gracz 1');if(!profile)profile=addProfile(db,{name:'Gracz 1'});if(!profile)return {db,imported:false};if(!profile.slots.auto)writeSlot(profile,'auto',state,{tier:'child',rank:'handlarz',date:state.date||'',at:0});db.legacy=true;if(!db.active)db.active=profile.id;return {db,imported:true};}
function tierFromBirthYear(year,nowYear){year=Number(year);nowYear=Number(nowYear);if(!Number.isInteger(year)||!Number.isInteger(nowYear)||year<nowYear-110||year>nowYear)return null;const age=nowYear-year;if(age<=12)return 'child';if(age<=15)return 'teen';return 'adult';}
function canApply(from,to,gate){const a=ORDER.indexOf(from),b=ORDER.indexOf(to);if(a<0||b<0)return false;if(to==='advanced'&&from!=='adult'&&from!=='advanced')return false;return b<=a||!!gate;}
function applyBirthYear(profile,year,nowYear,gateOk){const implied=tierFromBirthYear(year,nowYear);if(!implied)return {ok:false,reason:'year',tier:profile.tier};if(!canApply(profile.tier,implied,gateOk))return {ok:false,reason:'gate',tier:profile.tier,implied};profile.birthYear=year|0;profile.tier=implied;return {ok:true,tier:implied};}
function hashPin(pin,salt){let h=2166136261;const text=String(salt)+'\n'+String(pin)+'\n'+String(pin).length;for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619);h=Math.imul(h^h>>>13,127);return (h>>>0).toString(16).padStart(8,'0');}
function checkPin(pin,salt,hash){return !!hash&&hashPin(pin,salt)===hash}
function mathChallenge(rng){const roll=typeof rng==='function'?rng:Math.random;let a=2+Math.floor(roll()*8),b=2+Math.floor(roll()*8);if(a*b<10){a=4;b=3}return {a,b,answer:a*b,pl:'Ile to '+a+'×'+b+'?',en:'What is '+a+'×'+b+'?'};}
function checkMath(quiz,answer){return Number(answer)===quiz.answer}
function rank(id){const found=RANKS.find(item=>item.id===id);return found?{...found}:null}
function nextRank(id){const i=RANKS.findIndex(item=>item.id===id);return i>=0&&i<RANKS.length-1?RANKS[i+1].id:null}
function limits(id,tier){const base=rank(id)||rank('handlarz');if(tier!=='advanced')return base;return {...base,goods:10,cities:9,stocks:10,goal:Math.round(base.goal*1.5)};}
function goodIndexes(tier,count){const skip=tier==='child'||tier==='teen'?2:-1,idx=[];const cap=count||10;for(let i=0;i<10&&idx.length<cap;i++)if(i!==skip)idx.push(i);return idx;}
function wealth(state){state=state||{};const goods=(state.cargo||[]).reduce((sum,qty,i)=>sum+(qty||0)*((state.prices||[])[i]||0),0);const shares=(state.shares||[]).reduce((sum,qty,i)=>sum+(qty||0)*((state.stockPrices||[])[i]||0),0);const bank=Array.isArray(state.banks)?state.banks.reduce((sum,n)=>sum+(n||0),0):(state.bank||0);return (state.cash||0)+bank+goods+shares-(state.debt||0);}
function arm(state,opts){opts=opts||{};const mode=opts.mode||'career';const tier=opts.tier||'child';const lim=limits(opts.rank||'handlarz',tier);const career=mode==='career';state.v2Tier=tier;state.v2Rank=lim.id;state.v2Start=wealth(state);state.v2Goal=career?lim.goal:null;state.v2Days=(state.day||1)+(career?lim.days:DAILY_DAYS)-1;state.v2Goods=career?lim.goods:(tier==='child'||tier==='teen'?9:10);state.v2Cities=career?lim.cities:9;state.v2Stocks=career?lim.stocks:10;state.v2Career=career;state.v2Daily=mode==='daily';state.v2Challenge=mode==='challenge';state.v2Practice=mode==='practice';if(opts.seed!=null){const seed=opts.seed>>>0;state.seed=seed;state.rng=seed||42;state.debtRate=5+(seed%6);}if((state.city||0)>=state.v2Cities)state.city=0;return state;}
function outcome(state){const worth=wealth(state);const base=Number.isFinite(state.v2Start)?state.v2Start:worth;const gain=worth-base;const limit=state.v2Days||0;const expired=limit>0&&state.day>limit;const promoted=!!(state.v2Career&&state.v2Goal!=null&&gain>=state.v2Goal);const live=!!(state.v2Career||state.v2Daily||state.v2Challenge||state.v2Practice);return {ended:live&&(expired||promoted),promoted,expired,gain,wealth:worth,goal:state.v2Goal,days:state.day,limit};}
function addRecord(profile,key,rec){const initials=String(rec.initials||'???').toUpperCase().replace(/[^A-Z]/g,'').slice(0,3).padEnd(3,'?');const row={score:Math.round(rec.score),days:Math.round(rec.days),date:rec.date,initials};const list=(profile.records[key]||[]).slice();if(list.length>=5&&row.score<=list[list.length-1].score)return false;list.push(row);list.sort((a,b)=>b.score-a.score||a.days-b.days);profile.records[key]=list.slice(0,5);return profile.records[key].some(item=>item.score===row.score&&item.initials===row.initials&&item.date===row.date);}
function records(profile,key){return (profile.records&&profile.records[key]||[]).slice()}
function best(profile,key){const list=records(profile,key);return list.length?list[0].score:null}
function dailySeed(dateStr){let h=2166136261;const text='BXDAY:'+dateStr;for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619);return (h>>>0)%1048576;}
function challengeCode(seed){let x=seed>>>0,text='';for(let i=0;i<4;i++){text=ALPH[x%32]+text;x=Math.floor(x/32)}return 'BX-'+text;}
function seedFromCode(code){const match=String(code||'').trim().toUpperCase().match(/^BX-([23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4})$/);if(!match)return null;let x=0;for(const ch of match[1])x=x*32+ALPH.indexOf(ch);return x;}

function validState(s){
  const numbers=a=>Array.isArray(a)&&a.length===10&&a.every(n=>Number.isSafeInteger(n)&&n>=0);
  return !!s&&typeof s==='object'&&s.schema===2&&
    ['cash','debt','day','city','rng','seed'].every(k=>Number.isSafeInteger(s[k]))&&
    s.cash>=0&&s.debt>=0&&s.day>=1&&s.city>=0&&s.city<9&&
    numbers(s.cargo)&&numbers(s.prices)&&numbers(s.shares)&&
    (s.stockPrices===undefined||numbers(s.stockPrices))&&
    Array.isArray(s.banks)&&s.banks.length===6&&s.banks.every(n=>Number.isSafeInteger(n)&&n>=0);
}
function validDb(db){
  if(!db||db.v!==1||!Number.isSafeInteger(db.seq)||db.seq<0||!Array.isArray(db.profiles)||db.profiles.length>4)return false;
  const ids=new Set();
  for(const p of db.profiles){
    if(!p||typeof p.id!=='string'||ids.has(p.id)||typeof p.name!=='string'||
       !ORDER.includes(p.tier)||!rank(p.rank)||!p.slots||typeof p.slots!=='object'||
       !p.records||typeof p.records!=='object'||Array.isArray(p.records)||
       Object.values(p.records).some(rows=>!Array.isArray(rows)||rows.some(row=>!row||!Number.isSafeInteger(row.score)||!Number.isSafeInteger(row.days)||typeof row.initials!=='string'||typeof row.date!=='string')))return false;
    if(SLOTS.some(slot=>p.slots[slot]!=null&&(!p.slots[slot].state||typeof p.slots[slot].state!=='object')))return false;
    if(p.roundResults!=null&&(typeof p.roundResults!=='object'||Array.isArray(p.roundResults)||Object.values(p.roundResults).some(r=>!r||typeof r.recorded!=='boolean'||!r.result||!r.result.o||!Number.isSafeInteger(r.result.score))))return false;
    ids.add(p.id);
  }
  return db.active==null||ids.has(db.active);
}
function resumeState(saved,profile){
  if(!validState(saved))return null;
  const s=clone(saved),stored=ORDER.includes(s.v2Tier)?s.v2Tier:profile.tier;
  const tier=ORDER[Math.min(ORDER.indexOf(stored),ORDER.indexOf(profile.tier))];
  const lim=limits(s.v2Rank||profile.rank,tier);
  s.v2Tier=tier;s.v2Goods=s.v2Career?lim.goods:(tier==='child'||tier==='teen'?9:10);
  s.v2Cities=s.v2Career?lim.cities:9;s.v2Stocks=s.v2Career?lim.stocks:10;
  const allowed=goodIndexes(tier,s.v2Goods);
  s.cargo.forEach((qty,i)=>{if(!allowed.includes(i)){s.cash+=qty*s.prices[i];s.cargo[i]=0}});
  if(s.stockPrices)s.shares.forEach((qty,i)=>{if(i>=s.v2Stocks){s.cash+=qty*s.stockPrices[i];s.shares[i]=0}});
  if(s.city>=s.v2Cities)s.city=0;
  if((tier==='child'||tier==='teen')&&/tytoń|tobacco|loterii|lottery|broń|weapons/i.test(JSON.stringify(s.lastJourney||'')))s.lastJourney=null;
  if(s.v2Daily||s.v2Challenge||s.v2Practice)s.v2Days=DAILY_DAYS;
  return s;
}
function roundId(state,profile){
  return state.v2Round||['legacy',profile.id,state.seed,state.v2Rank||profile.rank,state.v2Start,state.v2Days].join(':');
}

return {ORDER,RANKS,TIER_NAME,SLOTS,DAILY_DAYS,validDb,validState,resumeState,roundId,emptyDb,addProfile,writeSlot,clearSlots,importLegacy,tierFromBirthYear,canApply,applyBirthYear,hashPin,checkPin,mathChallenge,checkMath,rank,nextRank,limits,goodIndexes,wealth,arm,outcome,addRecord,records,best,dailySeed,challengeCode,seedFromCode};
});
