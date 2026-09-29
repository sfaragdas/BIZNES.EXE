const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const store=new Map(),elements=new Map(),listeners={};
function el(selector){if(!elements.has(selector))elements.set(selector,{innerHTML:'',textContent:'',value:'1',classList:{value:false,contains(){return this.value},toggle(){this.value=!this.value},add(){this.value=true}},attrs:{},setAttribute(k,v){this.attrs[k]=v},addEventListener(k,fn){this[k]=fn}});return elements.get(selector)}
const document={documentElement:{lang:'pl'},body:el('body'),querySelector:el,addEventListener:(k,fn)=>listeners[k]=fn};
const context={globalThis:null,document,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},Math,Number,String,Object,JSON};context.globalThis=context;
vm.runInNewContext(fs.readFileSync('data/game-data.js','utf8'),context);vm.runInNewContext(fs.readFileSync('game.js','utf8'),context);
const click=action=>el('#app').click({target:{closest:()=>({dataset:{action}})}});
const state=()=>JSON.parse(store.get('bx2-save'));
assert.match(el('#app').innerHTML,/Dziecko/);assert.match(el('#app').innerHTML,/Wkrótce/);assert.doesNotMatch(el('#sponsor').innerHTML,/href=/);
assert.equal(context.BX2_DATA.modes.length,4);assert.equal(context.BX2_DATA.modes[0].goods.length,6);
for(const term of ['tobacco','tytoń','weapon','broń','lottery','loteria','alcohol','alkohol'])assert.doesNotMatch(JSON.stringify(context.BX2_DATA).toLowerCase(),new RegExp(term));
click('start:teen');assert.equal(store.has('bx2-save'),false);click('start:child');assert.equal(state().cash,1000);assert.equal(state().day,1);assert.doesNotMatch(el('#app').innerHTML,/Kredki/);
el('#qty-apples').value='2';click('buy:apples');assert.equal(state().cargo.apples,2);assert.ok(state().cash<1000);
el('#qty-apples').value='9999';click('buy:apples');assert.equal(state().cargo.apples,2);
el('#qty-apples').value='1';click('sell:apples');assert.equal(state().cargo.apples,1);
el('#destination').value='krakow';click('travel');assert.equal(state().day,2);el('#destination').value='poznan';click('travel');assert.match(el('#app').innerHTML,/Kredki/);
for(let day=3;day<=7;day++){el('#destination').value=state().city==='gdynia'?'krakow':'gdynia';click('travel')}
assert.equal(state().finished,true);assert.match(el('#app').innerHTML,/Koniec rundy/);assert.ok(Number(store.get('bx2-record'))>=0);assert.equal(store.has('bx-save'),false);
click('modes');click('continue');assert.match(el('#app').innerHTML,/Koniec rundy/);
el('#language').click();assert.match(el('#app').innerHTML,/Round complete/);el('#contrast').click();assert.equal(store.get('bx2-contrast'),'1');
assert.match(fs.readFileSync('sw.js','utf8'),/biznes-2-offline-/);assert.match(fs.readFileSync('privacy.html','utf8'),/localStorage/);
console.log('BIZNES.EXE 2.0: tests passed');
