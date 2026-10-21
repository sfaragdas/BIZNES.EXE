// Powłoka Etapu A: menu, profile, ustawienia, rekordy, wynik, udostępnianie.
// Web Share API with copy and download fallback. Bramka dziecka przy udostępnianiu.
(()=>{
'use strict';
const meta=globalThis.BiznesMeta;
if(!meta||typeof document==='undefined'||!document.querySelector)return;
const DB='bx2r-db';
const t=(en,pl)=>globalThis.BiznesGame&&globalThis.BiznesGame.lang==='en'?en:pl;
const ui={screen:'menu',sel:0,buf:'',note:'',pending:null,quiz:null,gateMode:'math',gateFrom:'menu',pin1:'',result:null,fx:0,timer:0,spin:0,rot:0,mode:'career'};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=n=>String(Math.round(Number(n)||0)).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
const vis=s=>String(s).replace(/\[\[([^|]+)\|([^|]+)\|(.*?)\]\]/g,(_,id,key,label)=>label);
const padLine=s=>{s=String(s);const n=vis(s).length;return n>=78?s:s+' '.repeat(78-n)};
function loadDb(){try{const raw=localStorage.getItem(DB);if(raw)return JSON.parse(raw)}catch{}return meta.emptyDb()}
function saveDb(db){try{localStorage.setItem(DB,JSON.stringify(db))}catch{}}
function active(db){return db.profiles.find(p=>p.id===db.active)||db.profiles[0]||null}
function today(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function tierLabel(id){const n=meta.TIER_NAME[id]||meta.TIER_NAME.child;return t(n.en,n.pl)}
function rankLabel(id){const r=meta.rank(id)||meta.rank('handlarz');return t(r.en,r.pl)}
function minorOf(tier){return tier==='child'||tier==='teen'}
function motion(){if(localStorage.getItem('bx2r-anim')==='off')return false;try{return !matchMedia('(prefers-reduced-motion: reduce)').matches}catch{return true}}
function beep(){
  if(localStorage.getItem('bx2r-sound')!=='on')return;
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  const ctx=new AC(),osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.type='square';osc.frequency.value=880;gain.gain.value=.04;osc.connect(gain);gain.connect(ctx.destination);
  osc.start();osc.stop(ctx.currentTime+.05);osc.onended=()=>ctx.close();
}
function patrons(){return BiznesGame.sponsors()}
function patronName(){return patrons()[ui.spin%patrons().length][0]}
function patronHtml(){
  const [name,url]=patrons()[ui.spin%patrons().length];
  const p=active(loadDb());
  if(!p||minorOf(p.tier))return esc(name);
  return `<a class="sponsor-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(name)}</a>`;
}
function keys(){return BiznesGame.lang==='en'?{new:'N',cont:'C',rec:'R',set:'S',help:'H',about:'A'}:{new:'N',cont:'K',rec:'R',set:'U',help:'J',about:'O'}}
function typeMax(){return {year:4,gate:6,pin:4,pin2:4,initials:3,code:7,name:12}[ui.screen]||0}
function clampSel(n){if(n<=0){ui.sel=0;return 0}if(ui.sel<0)ui.sel=0;if(ui.sel>=n)ui.sel=n-1;return ui.sel}
function latest(p){return meta.SLOTS.map(k=>p.slots[k]).filter(Boolean).sort((a,b)=>(b.at||0)-(a.at||0))[0]||null}
function open(screen,note){stopFx();ui.screen=screen;ui.sel=0;ui.buf='';ui.note=note||'';paint()}
function title(){
  return {menu:'',profiles:t('Profiles','Profile'),year:t('Year of birth','Rok urodzenia'),modes:t('New game','Nowa gra'),code:t('Challenge code','Kod wyzwania'),who:t('Who continues?','Kto kontynuuje?'),slots:t('Continue','Kontynuuj'),rec:t('Records','Rekordy'),set:t('Settings','Ustawienia'),help:t('How to play','Jak grać'),about:t('About & privacy','O grze i prywatność'),result:t('Result','Wynik'),initials:t('Three letters','Trzy litery'),confirm:t('Delete saves?','Usunąć zapisy?'),pin:t('Parent PIN','PIN rodzica'),pin2:t('Repeat PIN','Powtórz PIN'),tier:t('Age band','Próg wieku'),name:t('Profile name','Nazwa profilu'),gate:t('Parent gate','Bramka rodzica')}[ui.screen]||'';
}
function flag(key,fallback){const v=localStorage.getItem(key);return v==null?fallback:v==='on'}
function styleLabel(){return {current:'Standard',retro:'DOS',matrix:'Matrix'}[BiznesGame.style]||'Standard'}
function actions(){
  const k=keys(),db=loadDb(),p=active(db);
  if(ui.screen==='menu')return [
    {id:'new',key:k.new,label:t('New game','Nowa gra')},{id:'cont',key:k.cont,label:t('Continue','Kontynuuj')},
    {id:'rec',key:k.rec,label:t('Records','Rekordy')},{id:'set',key:k.set,label:t('Settings','Ustawienia')},
    {id:'help',key:k.help,label:t('How to play','Jak grać')},{id:'about',key:k.about,label:t('About & privacy','O grze i prywatność')}
  ];
  if(ui.screen==='profiles'||ui.screen==='who'){
    const list=db.profiles.map((item,i)=>({id:(ui.screen==='who'?'who-':'use-')+item.id,key:String(i+1),label:item.name+' · '+tierLabel(item.tier)+' · '+rankLabel(item.rank)}));
    if(ui.screen==='profiles'&&db.profiles.length<4)list.push({id:'create',key:'N',label:t('New profile','Nowy profil')});
    if(ui.screen==='profiles'&&p)list.push({id:'rename',key:'Z',label:t('Rename','Zmień nazwę')},{id:'band',key:'P',label:t('Age band','Próg wieku')},{id:'drop',key:'X',label:t('Remove profile','Usuń profil')});
    return list;
  }
  if(ui.screen==='modes')return [
    {id:'career',key:'K',label:t('Career','Kariera')},{id:'daily',key:'D',label:t('Daily market','Rynek dnia')},{id:'code',key:'W',label:t('Challenge code','Kod wyzwania')}
  ];
  if(ui.screen==='slots')return meta.SLOTS.map(slot=>{
    const data=p&&p.slots[slot];
    const name=slot==='auto'?t('Autosave','Autozapis'):t('Slot ','Slot ')+slot;
    const label=(data?name+' · '+tierLabel(data.tier||p.tier)+' · '+rankLabel(data.rank||p.rank)+' · '+t('day ','dzień ')+(data.day||1)+' · '+fmt(data.wealth)+' $':name+' · '+t('empty','pusty')).slice(0,64);
    return {id:'slot-'+slot,key:slot==='auto'?'A':slot,label};
  });
  if(ui.screen==='set')return [
    {id:'style',key:'F',label:t('Style: ','Styl: ')+styleLabel()},
    {id:'contrast',key:'K',label:t('High contrast: ','Wysoki kontrast: ')+(flag('bx2r-contrast',false)?t('on','wł.'):t('off','wył.'))},
    {id:'sound',key:'D',label:t('PC speaker: ','Dźwięk PC: ')+(flag('bx2r-sound',false)?t('on','wł.'):t('off','wył.'))},
    {id:'anim',key:'A',label:t('Animation: ','Animacje: ')+(flag('bx2r-anim',true)?t('on','wł.'):t('off','wył.'))},
    {id:'hand',key:'R',label:t('Hand: ','Ręka: ')+(BiznesGame.hand==='left'?t('left','lewa'):t('right','prawa'))+' ('+t('phone','telefon')+')'},
    {id:'install-app',key:'I',label:t('Install app','Zainstaluj')},
    {id:'wipe',key:'X',label:t('Delete saves','Usuń zapis')},
    {id:'pin',key:'P',label:db.pinHash?t('Change parent PIN','Zmień PIN rodzica'):t('Set parent PIN','Ustaw PIN rodzica')}
  ];
  if(ui.screen==='tier'){
    const list=['child','teen','adult'].map((id,i)=>({id:'tier-'+id,key:String(i+1),label:tierLabel(id)+(p&&p.tier===id?' *':'')}));
    if(p&&(p.tier==='adult'||p.tier==='advanced'))list.push({id:'tier-advanced',key:'4',label:tierLabel('advanced')+(p.tier==='advanced'?' *':'')});
    return list;
  }
  if(ui.screen==='confirm')return [{id:'wipe-yes',key:'T',label:t('Yes, delete saves','Tak, usuń zapisy')},{id:'back',key:'N',label:t('No','Nie')}];
  if(ui.screen==='result'){
    const list=[
      {id:'again',key:'J',label:t('Play again','Jeszcze raz')},{id:'menu',key:'M',label:t('Menu','Menu')},
      {id:'share',key:'U',label:t('Share','Udostępnij')},{id:'copy',key:'C',label:t('Copy text','Kopiuj tekst')},{id:'png',key:'P',label:t('Download picture','Pobierz obraz')}
    ];
    if(ui.result&&ui.result.offerAdv)list.push({id:'adv',key:'Z',label:t('Try Advanced','Tryb Zaawansowany')});
    ['1','2','3'].forEach(slot=>list.push({id:'keep-'+slot,key:slot,label:t('Save slot ','Zapisz slot ')+slot}));
    return list;
  }
  if(ui.screen==='gate'){
    const list=[{id:'ok',key:'ENTER',label:t('Confirm','Potwierdź')}];
    if(db.pinHash)list.push({id:ui.gateMode==='pin'?'usemath':'usepin',key:'P',label:ui.gateMode==='pin'?t('Math question','Zadanie'):t('I have a PIN','Mam PIN')});
    return list;
  }
  if(ui.screen==='year')return [{id:'ok',key:'ENTER',label:t('Confirm','Dalej')},{id:'skip-year',key:'S',label:t('Stay on Child','Zostań przy Dziecku')}];
  if(typeMax())return [{id:'ok',key:'ENTER',label:t('Confirm','Dalej')}];
  return [];
}
function wrap(text){
  const words=String(text).split(/\s+/),lines=[];let line='';
  for(const word of words){const next=(line?line+' ':'')+word;if(next.length>78){if(line)lines.push(line);line=word.slice(0,78)}else line=next}
  if(line)lines.push(line);return lines;
}
function gapText(){
  const r=ui.result,p=active(loadDb());
  if(!r)return '';
  if(r.practice)return t('This round is not scored.','Ta runda nie jest punktowana.');
  if(r.challenge)return t('A challenge is not scored.','Wyzwanie nie liczy się do rekordu.');
  const best=p?meta.best(p,r.key):null;
  if(best==null)return t('First local score.','Pierwszy lokalny wynik.');
  if(r.score>=best)return t('Best local score in this table.','Najlepszy lokalny wynik w tej tabeli.');
  return t('Short of the record by '+fmt(best-r.score)+' $.','Do rekordu brakuje '+fmt(best-r.score)+' $.');
}
function extraLines(){
  const db=loadDb(),p=active(db);
  if(ui.screen==='year')return [t('Four digits. Until you answer, the band stays Child.','Cztery cyfry. Do odpowiedzi obowiązuje Dziecko.'),(ui.buf||'').padEnd(4,'_')];
  if(ui.screen==='name')return [t('Nick up to 12 characters. Not a real name.','Nick do 12 znaków. Nie imię i nazwisko.'),ui.buf||(p?p.name:'')];
  if(ui.screen==='code')return [t('Example BX-7F3K. This is not the daily market.','Przykład BX-7F3K. To nie jest rynek dnia.'),ui.buf||'BX-'];
  if(ui.screen==='gate')return [ui.gateMode==='pin'?t('Parent PIN','PIN rodzica'):(ui.quiz?(BiznesGame.lang==='pl'?ui.quiz.pl:ui.quiz.en):''),ui.buf];
  if(ui.screen==='pin'||ui.screen==='pin2')return [t('Four digits. Stored only as a hash.','Cztery cyfry. Zapisujemy tylko skrót.'),ui.buf.replace(/./g,'*')];
  if(ui.screen==='initials')return [t('Initials for the local table.','Inicjały do lokalnej tabeli.'),ui.buf.padEnd(3,'_')];
  if(ui.screen==='modes'){
    const lines=[t('Ranks: Trader, Merchant, Wholesaler, Magnate.','Rangi: Handlarz, Kupiec, Hurtownik, Magnat.')];
    if(p&&p.dailyDone===today())lines.push(t('Today is already scored. Another round is practice.','Dziś już było punktowane. Kolejna runda jest treningiem.'));
    lines.push(t('Band: ','Próg: ')+tierLabel(p?p.tier:'child')+' · '+rankLabel(p?p.rank:'handlarz'));
    return lines;
  }
  if(ui.screen==='set')return [t('Language: ','Język: ')+(BiznesGame.lang==='pl'?'PL':'EN')+'  (L)'];
  if(ui.screen==='help')return BiznesGame.help().flatMap(pair=>wrap(pair[1])).slice(0,16);
  if(ui.screen==='about')return wrap(t('Everything stays in this browser. No account, no push alerts, no ranking with strangers. The birth year and parent PIN hash never leave the device. A shared card contains only the score. Fictional prices, no real money.','Wszystko zostaje w tej przeglądarce. Bez konta, bez alertów, bez rankingu z obcymi. Rok urodzenia i skrót PIN rodzica nie opuszczają urządzenia. Udostępniana kartka ma tylko wynik. Ceny są fikcyjne, bez prawdziwych pieniędzy.')).slice(0,12);
  if(ui.screen==='rec'){
    if(!p)return [t('No profile yet.','Nie ma jeszcze profilu.')];
    const lines=[];
    [[p.tier+'|'+p.rank,tierLabel(p.tier)+' · '+rankLabel(p.rank)],['daily',t('Daily market','Rynek dnia')]].forEach(([key,heading])=>{
      lines.push(heading);
      const list=meta.records(p,key);
      if(!list.length)lines.push(t('  empty','  pusto'));
      list.forEach((row,i)=>lines.push('  '+(i+1)+' '+row.initials+'  '+fmt(row.score)+' $  '+row.days+'d  '+row.date));
    });
    return lines.slice(0,16);
  }
  if(ui.screen==='result'&&ui.result){
    const r=ui.result,lines=[];
    if(r.fresh)lines.push('+-- '+t('NEW RECORD!','NOWY REKORD!')+' --+');
    lines.push(tierLabel(r.tier)+' · '+rankLabel(r.rank));
    lines.push(t('Score ','Wynik ')+fmt(r.score)+' $   '+t('Days ','Dni ')+(r.o.days|0)+'/'+(r.o.limit||'—'));
    lines.push(gapText());
    if(r.promotedTo)lines.push(t('Next rank: ','Awans: ')+rankLabel(r.promotedTo));
    else if(r.promoted)lines.push(t('Goal reached.','Cel osiągnięty.'));
    else if(r.o.expired)lines.push(t('Day limit reached.','Koniec limitu dni.'));
    if(r.offerAdv)lines.push(t('Magnate can move to Advanced.','Magnat może przejść do Zaawansowanego.'));
    return lines;
  }
  if(ui.screen==='confirm')return [t('This removes the active profile saves only.','To kasuje tylko zapisy aktywnego profilu.')];
  return [];
}
function lastLine(){
  const p=active(loadDb());if(!p)return '';
  const slot=latest(p);if(!slot)return '';
  const day=slot.day||1,lim=slot.state&&slot.state.v2Days;
  const rec=meta.best(p,(slot.tier||p.tier)+'|'+(slot.rank||p.rank));
  let text=t('Last game: ','Ostatnia gra: ')+tierLabel(slot.tier||p.tier)+' · '+rankLabel(slot.rank||p.rank)+' · '+t('day ','dzień ')+day+(lim?'/'+lim:'');
  if(rec!=null)text+=' · '+t('record ','rekord ')+fmt(rec);
  return text.slice(0,78);
}
function center(s){s=String(s);if(s.length>78)s=s.slice(0,78);const left=Math.floor((78-s.length)/2);return ' '.repeat(left)+s+' '.repeat(78-s.length-left)}
function tok(a){return '[['+a.id+'|'+a.key+'|['+a.key+'] '+a.label+']]'}
function topBar(){
  const token='[[language|L|'+(BiznesGame.lang==='pl'?'L/EN':'L/PL')+']]';
  const left='BIZNES.EXE  ·  '+t('Small game. Big business.','Mała gra. Wielki biznes.');
  const room=78-vis(token).length,cut=left.slice(0,room);
  return cut+' '.repeat(Math.max(0,room-cut.length))+token;
}
function footer(){const text=BiznesGame.release+'  '+BiznesGame.status();return text.slice(0,78)}
function buildRows(){
  const rows=[topBar()];
  if(ui.screen==='menu'){
    rows.push('',center(t('Inspired by Biznesman (1988), M. Cwynar / SAMBA.','Inspirowane: Biznesman (1988), M. Cwynar / SAMBA.')),center(t('Patron: ','Patron: ')+patronName()),'');
    const acts=actions();acts.forEach((a,i)=>rows.push((i===clampSel(acts.length)?'> ':'  ')+tok(a)));
    rows.push('',lastLine());
  }else{
    rows.push(center(title()));
    if(ui.note)rows.push(String(ui.note).slice(0,78));
    extraLines().forEach(line=>rows.push(String(line).slice(0,78)));
    const acts=actions();acts.forEach((a,i)=>rows.push((i===clampSel(acts.length)?'> ':'  ')+tok(a)));
    rows.push('  [[back|ESC|[Esc] '+t('Back','Wstecz')+']]');
  }
  const body=rows.slice(0,22);while(body.length<22)body.push('');body.push(footer());return body.map(padLine);
}
function header(){
  return `<header class="mobile-head"><div class="mobile-brand"><strong>BIZNES.EXE</strong></div><nav class="mobile-sponsors" aria-label="${esc(t('Patrons','Patroni'))}">${patronHtml()}</nav><button type="button" data-ui-action="language" aria-label="${esc(t('Switch language','Zmień język'))}">${BiznesGame.lang==='pl'?'EN':'PL'}</button></header>`;
}
function mobileHtml(){
  if(ui.screen==='menu'){
    const p=active(loadDb()),slot=p&&latest(p);
    const card=slot?`<article class="v2-card"><b>${esc(t('Last game','Ostatnia gra'))}</b><br>${esc(lastLine().replace(/^.*?:\s*/,''))}</article>`:'';
    return header()+`<section class="mobile-list v2-mid"><h1>${esc(t('Small game. Big business.','Mała gra. Wielki biznes.'))}</h1><p>${esc(t('Inspired by Biznesman (1988), M. Cwynar / SAMBA.','Inspirowane: Biznesman (1988), M. Cwynar / SAMBA.'))}</p>${card}</section><p class="v2-legal"><button type="button" data-ui-action="about">${esc(t('Privacy · About','Prywatność · O grze'))}</button></p><small class="mobile-status"><span>${esc(BiznesGame.release)}</span><span>${esc(BiznesGame.status())}</span></small><section class="mobile-dock v2-dock"><div class="v2-row v2-row1"><button type="button" data-ui-action="new">${esc(t('New game','Nowa gra'))}</button><button type="button" class="mobile-confirm" data-ui-action="cont">${esc(t('Continue','Kontynuuj'))}</button></div><div class="v2-row v2-row2"><button type="button" data-ui-action="rec">${esc(t('Records','Rekordy'))}</button><button type="button" data-ui-action="set">${esc(t('Settings','Ustawienia'))}</button><button type="button" data-ui-action="help">${esc(t('How to play','Jak grać'))}</button></div></section>`;
  }
  const acts=actions().map(a=>`<button type="button" data-ui-action="${esc(a.id)}">${esc('['+a.key+'] '+a.label)}</button>`).join('');
  const max=typeMax();
  const field=max?`<input class="v2-field" maxlength="${max}" value="${esc(ui.buf)}" aria-label="${esc(title())}" ${ui.screen==='year'||ui.screen==='gate'||ui.screen==='pin'||ui.screen==='pin2'?'inputmode="numeric"':''}>`:'';
  const blocks=extraLines().map(line=>`<p>${esc(line)}</p>`).join('');
  const long=ui.screen==='help'?BiznesGame.help().map(pair=>`<p>${esc(pair[0])}</p>`).join(''):'';
  return header()+`<section class="mobile-list v2-mid"><h1>${esc(title())}</h1>${ui.note?`<p class="v2-note">${esc(ui.note)}</p>`:''}${blocks}${long}${field}<div class="v2-stack">${acts}</div></section><section class="mobile-dock v2-dock"><button type="button" data-ui-action="back">${esc(t('Esc · Back','Esc · Wstecz'))}</button></section>`;
}
function paint(){
  if(ui.fx||!globalThis.BiznesGame)return;
  const rows=buildRows();
  const term=document.querySelector('#terminal');
  if(term)term.innerHTML=rows.map(raw=>`<span class="terminal-row${raw.startsWith('>')?' menu-on':''}">${raw.replace(/\[\[([^|]+)\|([^|]+)\|(.*?)\]\]/g,(_,id,key,label)=>`<button type="button" class="terminal-action" data-ui-action="${esc(id)}" data-hotkey="${esc(key)}">${esc(label)}</button>`)}</span>`).join('\n');
  const mobile=document.querySelector('#mobile');if(mobile)mobile.innerHTML=mobileHtml();
  const help=document.querySelector('#desktop-install-help');if(help){help.hidden=true;help.textContent=''}
  BiznesGame.fit?.();
}
function paintFx(n){
  const chars='*+.░▒★',title=t('NEW RECORD!','NOWY REKORD!'),rows=[];
  for(let i=0;i<23;i++){
    if(i===10)rows.push(center('+-- '+title+' --+'));
    else if(i===11)rows.push(center(title));
    else{let line='';for(let c=0;c<78;c++)line+=chars[(n*3+i*5+c)%chars.length];rows.push(line)}
  }
  const term=document.querySelector('#terminal');
  if(term)term.innerHTML=rows.map(raw=>`<span class="terminal-row">${esc(raw)}</span>`).join('\n');
  const mobile=document.querySelector('#mobile');
  if(mobile)mobile.innerHTML=`<pre class="v2-fx" role="status">${esc(title)}\n${esc(chars)}</pre>`;
}
function stopFx(){if(ui.timer)clearInterval(ui.timer);ui.timer=0;ui.fx=0}
function celebrate(){
  beep();
  if(!motion()){ui.fx=0;paint();return}
  stopFx();ui.fx=1;let n=1;paintFx(n);
  ui.timer=setInterval(()=>{n+=1;paintFx(n);if(n>=15){stopFx();paint()}},200);
}
function askGate(next,from){
  ui.pending=next;ui.gateFrom=from||ui.screen;ui.screen='gate';ui.sel=0;ui.buf='';ui.gateMode='math';ui.quiz=meta.mathChallenge();ui.note='';paint();
}
function submitGate(){
  const db=loadDb();
  const ok=ui.gateMode==='pin'?meta.checkPin(ui.buf,db.pinSalt,db.pinHash):meta.checkMath(ui.quiz,ui.buf);
  if(!ok){ui.note=t('That answer does not open the gate.','Ta odpowiedź nie otwiera bramki.');ui.buf='';ui.quiz=meta.mathChallenge();paint();return}
  const fn=ui.pending;ui.pending=null;ui.note='';ui.screen=ui.gateFrom||'menu';fn&&fn();
}
function submitYear(){
  const year=Number(ui.buf),db=loadDb(),p=active(db);
  if(!p)return;
  const implied=meta.tierFromBirthYear(year,new Date().getFullYear());
  if(!implied){ui.note=t('Enter the year of birth.','Podaj rok urodzenia.');paint();return}
  if(meta.canApply(p.tier,implied,false)){meta.applyBirthYear(p,year,new Date().getFullYear(),false);saveDb(db);open('modes');return}
  ui.bufYear=year;
  askGate(()=>{const next=loadDb(),who=active(next);meta.applyBirthYear(who,ui.bufYear,new Date().getFullYear(),true);saveDb(next);open('modes')},'year');
}
function submitName(){
  const db=loadDb(),p=active(db);if(!p)return;
  const name=ui.buf.replace(/[^\p{L}\p{N} ]/gu,'').replace(/\s+/g,' ').trim().slice(0,12);
  if(name)p.name=name;saveDb(db);open('profiles');
}
function submitCode(){
  const text=ui.buf.toUpperCase().startsWith('BX-')?ui.buf:('BX-'+ui.buf);
  const seed=meta.seedFromCode(text);
  if(seed==null){ui.note=t('Use a code like BX-7F3K.','Użyj kodu jak BX-7F3K.');paint();return}
  startGame('challenge',seed);
}
function submitPin(){
  if(ui.screen==='pin'){if(!/^\d{4}$/.test(ui.buf)){ui.note=t('PIN is 4 digits.','PIN ma 4 cyfry.');paint();return}ui.pin1=ui.buf;ui.buf='';ui.screen='pin2';paint();return}
  if(ui.buf!==ui.pin1){ui.note=t('The numbers differ.','Numery się różnią.');ui.screen='pin';ui.buf='';paint();return}
  const db=loadDb();db.pinSalt=Math.random().toString(16).slice(2,8);db.pinHash=meta.hashPin(ui.pin1,db.pinSalt);ui.pin1='';saveDb(db);open('set',t('Parent PIN stored as a hash.','PIN rodzica zapisany jako skrót.'));
}
function freshRecord(p,key,score){const list=meta.records(p,key);return list.length<5||score>list[list.length-1].score}
function submitInitials(){
  const db=loadDb(),p=active(db);if(!p||!ui.result)return;
  const letters=(ui.buf.toUpperCase().replace(/[^A-Z]/g,'')+'???').slice(0,3);
  ui.result.fresh=meta.addRecord(p,ui.result.key,{score:ui.result.score,days:ui.result.o.days|0,date:today(),initials:letters});
  saveDb(db);ui.screen='result';ui.buf='';
  if(ui.result.fresh)celebrate();else paint();
}
function confirmBuf(){
  if(ui.screen==='year')return submitYear();
  if(ui.screen==='name')return submitName();
  if(ui.screen==='code')return submitCode();
  if(ui.screen==='gate')return submitGate();
  if(ui.screen==='pin'||ui.screen==='pin2')return submitPin();
  if(ui.screen==='initials')return submitInitials();
}
function startGame(mode,seed){
  const db=loadDb();let p=active(db);
  if(!p){p=meta.addProfile(db);db.active=p.id;saveDb(db);open('year');return}
  if(p.birthYear==null&&!p.asked){open('year');return}
  let use=mode;
  if(mode==='daily'&&p.dailyDone===today())use='practice';
  if(mode==='daily'&&use==='daily'){p.dailyDone=today();saveDb(db)}
  ui.mode=use==='practice'?'daily':mode;ui.seed=seed;
  const shell=globalThis.BX2,g=BiznesGame;
  shell.playing=false;shell.done=false;shell.profileId=p.id;
  g.newGame();
  meta.arm(g.getS(),{mode:use,rank:p.rank,tier:p.tier,seed});
  shell.playing=true;
  const notes=[];
  if(use==='practice')notes.push(t('Today is already scored. This round is practice.','Dziś już było punktowane. Ta runda jest treningiem.'));
  if(p.tier==='advanced')notes.push(t('Fictional shares. This is not investment advice.','Fikcyjne akcje. To nie jest porada inwestycyjna.'));
  if(notes.length)g.flash(notes.join(' '));else g.render();
}
function resume(slot){
  const db=loadDb(),p=active(db),data=p&&p.slots[slot];
  if(!data){ui.note=t('This slot is empty.','Ten slot jest pusty.');paint();return}
  const shell=globalThis.BX2,g=BiznesGame;
  shell.playing=false;shell.done=false;shell.profileId=p.id;
  g.adopt(data.state);shell.playing=true;g.render();
}
function finish(state,outcome){
  const db=loadDb(),p=db.profiles.find(item=>item.id===BX2.profileId)||active(db);
  const rank=state.v2Rank||(p&&p.rank)||'handlarz';
  const tier=state.v2Tier||(p&&p.tier)||'child';
  const scored=!!(state.v2Daily||state.v2Career);
  ui.result={o:outcome,tier,rank,score:outcome.gain|0,daily:!!state.v2Daily,challenge:!!state.v2Challenge,practice:!!state.v2Practice,promoted:outcome.promoted,fresh:false,offerAdv:false,seed:state.seed};
  ui.result.key=state.v2Daily?'daily':tier+'|'+rank;
  ui.mode=state.v2Daily?'daily':state.v2Challenge?'challenge':'career';
  if(p&&outcome.promoted&&state.v2Career){
    const next=meta.nextRank(p.rank);
    if(next){p.rank=next;ui.result.promotedTo=next}
    else if(p.tier==='adult')ui.result.offerAdv=true;
  }
  if(p)saveDb(db);
  ui.sel=0;ui.buf='';ui.note='';
  BX2.playing=false;BX2.done=true;
  BiznesGame.setView('welcome');
  if(scored&&p&&freshRecord(p,ui.result.key,ui.result.score))open('initials');
  else {ui.screen='result';paint()}
}
function shareText(){
  const r=ui.result;if(!r)return 'BIZNES.EXE';
  const goal=r.o.goal||Math.max(r.score,1);
  const blocks=Math.max(0,Math.min(6,Math.round((r.score>0?r.score:0)/goal*6)));
  const num=(Math.abs(r.score*13+(r.o.days|0))%900)+100;
  return 'BIZNES.EXE #'+num+' · '+rankLabel(r.rank)+' · '+(r.o.days|0)+' '+t('days','dni')+' · '+fmt(r.score)+' $ '+'▓'.repeat(blocks)+'░'.repeat(6-blocks);
}
function pngBlob(text){
  const canvas=document.createElement('canvas');canvas.width=640;canvas.height=160;
  const pen=canvas.getContext('2d');pen.fillStyle='#000';pen.fillRect(0,0,640,160);pen.strokeStyle='#c0c0c0';pen.strokeRect(8,8,624,144);pen.fillStyle='#ffff55';pen.font='20px monospace';pen.fillText(text,24,88);
  return new Promise(ok=>canvas.toBlob(blob=>{canvas.width=0;canvas.height=0;ok(blob)},'image/png'));
}
function guard(fn){const p=active(loadDb());if(p&&p.tier==='child')askGate(()=>{ui.screen='result';fn()},'result');else fn()}
async function shareNow(){
  const text=shareText(),blob=await pngBlob(text),file=new File([blob],'biznes.png',{type:'image/png'});
  if(navigator.share){
    try{const data={text,files:[file]};if(!navigator.canShare||navigator.canShare(data)){await navigator.share(data);return}await navigator.share({text});return}
    catch(err){if(err&&err.name==='AbortError')return}
  }
  ui.note=t('Sharing is unavailable. Copy the text or download the picture.','Udostępnianie niedostępne. Skopiuj tekst albo pobierz obraz.');paint();
}
function copyNow(){const text=shareText();const done=()=>{ui.note=t('Copied.','Skopiowano.');paint()};if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).then(done).catch(()=>{ui.note=text;paint()});else {ui.note=text;paint()}}
function downloadNow(){pngBlob(shareText()).then(blob=>{const link=document.createElement('a'),url=URL.createObjectURL(blob);link.href=url;link.download='biznes.png';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);ui.note=t('Picture downloaded.','Obraz pobrany.');paint()})}
function keep(slot){
  const db=loadDb(),p=active(db);if(!p||!ui.result)return;
  if(p.slots[slot]&&ui.confirmSlot!==slot){ui.confirmSlot=slot;ui.note=t('Press the slot again to overwrite.','Naciśnij slot jeszcze raz, aby nadpisać.');paint();return}
  meta.writeSlot(p,slot,BiznesGame.getS(),{tier:p.tier,rank:ui.result.rank,wealth:meta.wealth(BiznesGame.getS()),date:today(),at:Date.now()});
  ui.confirmSlot='';saveDb(db);ui.note=t('Saved in slot ','Zapisano w slocie ')+slot+'.';paint();
}
function go(id){
  if(id==='back')return back();
  if(id==='ok')return confirmBuf();
  if(id==='menu')return open('menu');
  if(id==='new')return open('profiles');
  if(id==='create'){const db=loadDb(),p=meta.addProfile(db);if(!p){ui.note=t('Four profiles already.','Są już 4 profile.');paint();return}db.active=p.id;saveDb(db);open('year');return}
  if(id.startsWith('use-')){const db=loadDb();db.active=id.slice(4);saveDb(db);const p=active(db);open(p&&p.birthYear==null&&!p.asked?'year':'modes');return}
  if(id==='skip-year'){const db=loadDb(),p=active(db);if(p)p.asked=1;saveDb(db);open('modes');return}
  if(id.startsWith('who-')){const db=loadDb();db.active=id.slice(4);saveDb(db);open('slots');return}
  if(id==='cont'){const db=loadDb();if(!db.profiles.length||!db.profiles.some(p=>meta.SLOTS.some(slot=>p.slots[slot]))){ui.note=t('No save yet.','Nie ma jeszcze zapisu.');paint();return}open(db.profiles.length>1?'who':'slots');return}
  if(id==='rec')return open('rec');
  if(id==='set')return open('set');
  if(id==='help')return open('help');
  if(id==='about')return open('about');
  if(id==='career')return startGame('career');
  if(id==='daily')return startGame('daily',meta.dailySeed(today()));
  if(id==='code')return open('code');
  if(id.startsWith('slot-'))return resume(id.slice(5));
  if(id==='style'){BiznesGame.cycleStyle();BiznesGame.render();return}
  if(id==='contrast'){localStorage.setItem('bx2r-contrast',flag('bx2r-contrast',false)?'off':'on');BiznesGame.render();return}
  if(id==='sound'){localStorage.setItem('bx2r-sound',flag('bx2r-sound',false)?'off':'on');paint();return}
  if(id==='anim'){localStorage.setItem('bx2r-anim',flag('bx2r-anim',true)?'off':'on');paint();return}
  if(id==='hand'){BiznesGame.setHand(BiznesGame.hand==='left'?'right':'left');return}
  if(id==='install-app'){BiznesGame.select('install-app');return}
  if(id==='wipe')return open('confirm');
  if(id==='wipe-yes'){const db=loadDb(),p=active(db);if(p)meta.clearSlots(p);saveDb(db);open('set',t('Saves for this profile were removed.','Zapisy tego profilu usunięte.'));return}
  if(id==='pin'){const next=()=>open('pin');if(loadDb().pinHash)askGate(next,'set');else next();return}
  if(id==='rename')return open('name');
  if(id==='band')return open('tier');
  if(id==='drop'){const db=loadDb();if(ui.confirmDrop!==db.active){ui.confirmDrop=db.active;ui.note=t('Press remove again to delete this profile.','Naciśnij usuwanie jeszcze raz, aby skasować profil.');paint();return}db.profiles=db.profiles.filter(p=>p.id!==db.active);db.active=db.profiles[0]?db.profiles[0].id:null;ui.confirmDrop='';saveDb(db);open('profiles',t('Profile removed from this browser.','Profil usunięty z tej przeglądarki.'));return}
  if(id.startsWith('tier-')){
    const to=id.slice(5),db=loadDb(),p=active(db);if(!p)return;
    const apply=()=>{const next=loadDb(),who=active(next);if(who&&meta.canApply(who.tier,to,true)){who.tier=to;if(to!=='advanced')who.rank=who.rank||'handlarz';saveDb(next)}open('profiles')};
    if(meta.canApply(p.tier,to,false)){p.tier=to;saveDb(db);open('profiles');return}
    askGate(apply,'tier');return;
  }
  if(id==='again'){const seed=ui.mode==='daily'?meta.dailySeed(today()):ui.mode==='challenge'?ui.result&&ui.result.seed:undefined;startGame(ui.mode==='challenge'?'challenge':ui.mode==='daily'?'daily':'career',seed);return}
  if(id==='share')return guard(shareNow);
  if(id==='copy')return guard(copyNow);
  if(id==='png')return guard(downloadNow);
  if(id==='adv')return askGate(()=>{const db=loadDb(),p=active(db);if(p&&meta.canApply(p.tier,'advanced',true)){p.tier='advanced';p.rank='handlarz';saveDb(db)}open('menu',t('Advanced is on. Ranks start again at Trader.','Zaawansowany włączony. Rangi od Handlarza.'))},'result');
  if(id.startsWith('keep-'))return keep(id.slice(5));
  if(id==='usepin'){ui.gateMode='pin';ui.buf='';paint();return}
  if(id==='usemath'){ui.gateMode='math';ui.quiz=meta.mathChallenge();ui.buf='';paint();return}
}
function back(){
  if(ui.screen==='initials'){submitInitials();return}
  stopFx();ui.note='';ui.buf='';
  if(ui.screen==='gate'){ui.pending=null;ui.screen=ui.gateFrom||'menu';ui.sel=0;paint();return}
  const parent={profiles:'menu',year:'profiles',modes:'profiles',code:'modes',who:'menu',slots:'menu',rec:'menu',set:'menu',help:'menu',about:'menu',result:'menu',initials:'result',confirm:'set',pin:'set',pin2:'set',tier:'profiles',name:'profiles'};
  ui.screen=parent[ui.screen]||'menu';ui.sel=0;paint();
}
function onKey(k){
  if(k==='L'){BiznesGame.select('language');return}
  if(k==='ESC'){back();return}
  if(ui.fx){stopFx();paint();return}
  const max=typeMax();
  if(max){
    if(k==='ENTER'){confirmBuf();return}
    if(k==='BACKSPACE'){ui.buf=ui.buf.slice(0,-1);paint();return}
    const hit=actions().find(a=>a.key===k&&a.id!=='ok');if(hit){go(hit.id);return}
    const digit='year,gate,pin,pin2'.split(',').includes(ui.screen);
    if(k.length===1&&(!digit||/\d/.test(k))&&(ui.screen!=='initials'||/[A-Z]/.test(k))){ui.buf=(ui.buf+k).slice(0,max);paint()}
    return;
  }
  const acts=actions();
  if(k==='UP'){ui.sel-=1;paint();return}
  if(k==='DOWN'){ui.sel+=1;paint();return}
  if(k==='ENTER'){const act=acts[clampSel(acts.length)];if(act)go(act.id);return}
  const hit=acts.find(a=>a.key===k);if(hit)go(hit.id);
}
document.addEventListener('input',e=>{if(e.target&&e.target.classList&&e.target.classList.contains('v2-field'))ui.buf=String(e.target.value).slice(0,typeMax()||12)},true);
document.addEventListener('keydown',e=>{if(!(e.target&&e.target.classList&&e.target.classList.contains('v2-field')))return;if(e.key==='Enter'){e.preventDefault();e.stopPropagation();ui.buf=String(e.target.value).slice(0,typeMax()||12);confirmBuf()}},true);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopFx()});
globalThis.BX2={
  playing:false,done:false,profileId:null,
  onKey,onAction:go,
  onWelcome(){if(ui.fx)return;const field=document.activeElement;if(field&&field.classList&&field.classList.contains('v2-field'))return;paint()},
  onQuit(){this.playing=false;this.done=false;ui.screen='menu';ui.sel=0;ui.note=''},
  onSave(state){
    const db=loadDb(),p=db.profiles.find(item=>item.id===this.profileId)||active(db);if(!p)return;
    meta.writeSlot(p,'auto',state,{tier:p.tier,rank:state.v2Rank||p.rank,wealth:meta.wealth(state),date:today(),at:Date.now()});
    db.active=p.id;saveDb(db);
  },
  onHome(state){if(this.done||!this.playing)return;const outcome=meta.outcome(state);if(outcome.ended)finish(state,outcome)},
  onReady(){
    const db=loadDb();
    if(!db.legacy){
      const raw=localStorage.getItem('bx-save');
      if(raw){try{meta.importLegacy(db,BiznesGame.getS());saveDb(db)}catch{}}
      else {db.legacy=true;saveDb(db)}
    }
    if(!ui.rot)ui.rot=setInterval(()=>{ui.spin=(ui.spin+1)%patrons().length;if(!globalThis.BX2.playing&&!ui.fx)paint()},15000);
    paint();
  }
};
})();
