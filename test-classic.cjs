const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('classic/game.js','utf8').replace(/\}\)\(\);\s*$/,`globalThis.test={fresh,select,travelTo,entries,save,get:()=>S,set:s=>S=s,amount:n=>{input=String(n);submit()},goods:GOODS_RANGES,stocks:SHARE_RANGES};})();`);
function boot(saved,seed=123456){const store=new Map(saved?[['bx-classic-save',JSON.stringify(saved)]]:[]),els={},panes={'.mobile-list':{scrollTop:800},'.mobile-bottom':{scrollTop:60}};
const el=id=>els[id]??={textContent:'',dataset:{},addEventListener(){},querySelector:s=>panes[s]};
const ctx={console,Date:{now:()=>seed},location:{protocol:'file:'},document:{querySelector:el,querySelectorAll:()=>[],addEventListener(){},body:{dataset:{}}},localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)},setTimeout:()=>0,setInterval:()=>0};vm.runInNewContext(source,ctx);return{p:ctx.test,panes,store}}
const {p,panes,store}=boot();
p.select('welcome-continue');assert.deepEqual(Array.from(p.entries(),e=>e.index),[3,1,0,2,4,5,6,7,8,9]);
p.select('buy');p.select('good-0');const price=p.get().prices[0];p.amount(1);assert.equal(p.get().cargo[0],1);assert.equal(p.get().cash,1000-price);
p.select('shares');assert.equal(panes['.mobile-list'].scrollTop,0);assert.equal(panes['.mobile-bottom'].scrollTop,0);assert.deepEqual(Array.from(p.entries(),e=>e.index),[4,3,2,1,0,5]);
p.select('buy');p.select('stock-4');p.amount(1);assert.equal(p.get().shares[4],1);
const before=JSON.stringify(p.get());const reload=boot(JSON.parse(before));assert.equal(JSON.stringify(reload.p.get()),before);
const coverage=p.goods.map(()=>new Set()),stockCoverage=p.stocks.map(()=>new Set());p.get().debt=0;
for(let trip=0;trip<10000;trip++){
 const prev=[...p.get().prices],stocks=[...p.get().stockPrices];p.travelTo((p.get().city+1)%9);
 for(const [prices,old,ranges,seen] of [[p.get().prices,prev,p.goods,coverage],[p.get().stockPrices,stocks,p.stocks,stockCoverage]])prices.forEach((price,i)=>{assert.ok(Number.isInteger(price)&&price>=ranges[i][0]&&price<=ranges[i][1]);assert.notEqual(price,old[i]);seen[i].add(price)});
}
p.goods.forEach(([lo,hi],i)=>{assert.ok(coverage[i].has(lo));assert.ok(coverage[i].has(hi))});
p.stocks.forEach(([lo,hi],i)=>{assert.equal(hi/lo,2.5);assert.ok(stockCoverage[i].has(lo));assert.ok(stockCoverage[i].has(hi))});
// Legacy inventory identities are retained, out-of-range prices are migrated.
const legacy=JSON.parse(before);delete legacy.stockPrices;legacy.prices[9]=240;const migrated=boot(legacy).p.get();assert.equal(migrated.cargo[0],1);assert.equal(migrated.shares[4],1);assert.ok(migrated.prices[9]>=500);
const samples=new Set();for(let i=1;i<=100;i++){const state=boot(undefined,i).p.get();samples.add(state.prices.join(','))}assert.ok(samples.size>1);
console.log('PASS Classic: sorted asset identity, trades, tab scroll reset, save migration, 10000 trips, bounds/endpoints and changed prices for goods/shares.');
