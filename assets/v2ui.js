// Web Share API.
(()=>{
'use strict';
const meta=globalThis.BiznesMeta;
if(!meta||typeof document==='undefined'||!document.querySelector)return;
const DB='bx2r-db',REL='2.0 retro · 2026.10.21';
const t=(en,pl)=>globalThis.BiznesGame&&globalThis.BiznesGame.lang==='en'?en:pl;
const ui={screen:'menu',sel:0,buf:'',note:'',pending:null,quiz:null,gateMode:'math',gateFrom:'menu',pin1:'',result:null,fx:0,timer:0,spin:0,rot:0,mode:'career'};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=n=>String(Math.round(Number(n)||0)).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
const vis=s=>String(s).replace(/\[\[([^|]+)\|([^|]+)\|(.*?)\]\]/g,(_,id,key,label)=>label);
const padLine=s=>{s=String(s);const n=vis(s).length;return n>=78?s:s+' '.repeat(78-n)};
const g=()=>globalThis.BiznesGame;
const loadDb=()=>{try{const raw=localStorage.getItem(DB);if(raw)return JSON.parse(raw)}catch{}return meta.emptyDb()};
const saveDb=db=>{try{localStorage.setItem(DB,JSON.stringify(db))}catch{}};
const active=db=>db.profiles.find(p=>p.id===db.active)||db.profiles[0]||null;
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const tierLabel=id=>{const n=meta.TIER_NAME[id]||meta.TIER_NAME.child;return t(n.en,n.pl)};
const rankLabel=id=>{const r=meta.rank(id)||meta.rank('handlarz');return t(r.en,r.pl)};
const yearNow=()=>new Date().getFullYear();
const motion=()=>{if(localStorage.getItem('bx2r-anim')==='off')return false;try{return !matchMedia('(prefers-reduced-motion: reduce)').matches}catch{return true}};
const beep=()=>{
  if(localStorage.getItem('bx2r-sound')!=='on')return;
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  const ctx=new AC(),osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.type='square';osc.frequency.value=880;gain.gain.value=.04;osc.connect(gain);gain.connect(ctx.destination);
  osc.start();osc.stop(ctx.currentTime+.05);osc.onended=()=>ctx.close();
};
const patrons=()=>g().sponsors();
const patronName=()=>patrons()[ui.spin%patrons().length][0];
const patronHtml=()=>{
  const [name,url]=patrons()[ui.spin%patrons().length],p=active(loadDb());
  if(!p||p.tier==='child'||p.tier==='teen')return esc(name);
  return `<a class="sponsor-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(name)}</a>`;
};
const keys=()=>g().lang==='en'?{new:'N',cont:'C',rec:'R',set:'S',help:'H',about:'A'}:{new:'N',cont:'K',rec:'R',set:'U',help:'J',about:'O'};
const typeMax=()=>({year:4,gate:6,pin:4,pin2:4,initials:3,code:7,name:12}[ui.screen]||0);
const clampSel=n=>{if(n<=0){ui.sel=0;return 0}if(ui.sel<0)ui.sel=0;if(ui.sel>=n)ui.sel=n-1;return ui.sel};
const latest=p=>p&&p.slots?meta.SLOTS.map(k=>p.slots[k]).filter(Boolean).sort((a,b)=>(b.at||0)-(a.at||0))[0]||null:null;
const act=(id,key,label)=>({id,key,label});
const flag=(key,fallback)=>{const v=localStorage.getItem(key);return v==null?fallback:v==='on'};
const onOff=v=>v?t('on','wł.'):t('off','wył.');
const titles={profiles:['Profiles','Profile'],year:['Birth year','Rok urodzenia'],modes:['New game','Nowa gra'],code:['Code','Kod wyzwania'],who:['Who?','Kto?'],slots:['Continue','Kontynuuj'],rec:['Records','Rekordy'],set:['Settings','Ustawienia'],help:['How to play','Jak grać'],about:['Privacy','O grze i prywatność'],result:['Result','Wynik'],initials:['Initials','Trzy litery'],confirm:['Delete?','Usunąć zapisy?'],pin:['PIN','PIN rodzica'],pin2:['Repeat','Powtórz PIN'],tier:['Band','Próg wieku'],name:['Name','Nazwa'],gate:['Gate','Bramka']};
const phrase=id=>t(titles[id][0],titles[id][1]);
const title=()=>titles[ui.screen]?phrase(ui.screen):'';
const motto=()=>t('Small game. Big business.','Mała gra. Wielki biznes.');
const inspired=()=>t('Inspired by Biznesman (1988), M. Cwynar / SAMBA.','Inspirowane: Biznesman (1988), M. Cwynar / SAMBA.');
function actions(){
  const k=keys(),db=loadDb(),p=active(db),screen=ui.screen;
  if(screen==='menu')return [['new',k.new,'modes'],['cont',k.cont,'slots'],['rec',k.rec,'rec'],['set',k.set,'set'],['help',k.help,'help'],['about',k.about,'about']].map(([id,key,src])=>act(id,key,phrase(src)));
  if(screen==='profiles'||screen==='who'){
    const list=db.profiles.map((item,i)=>act((screen==='who'?'who-':'use-')+item.id,String(i+1),item.name+' · '+tierLabel(item.tier)+' · '+rankLabel(item.rank)));
    if(screen==='profiles'&&db.profiles.length<4)list.push(act('create','N',t('New profile','Nowy profil')));
    if(screen==='profiles'&&p)list.push(act('rename','Z',t('Rename','Zmień nazwę')),act('band','P',phrase('tier')),act('drop','X',t('Remove','Usuń profil')));
    return list;
  }
  if(screen==='modes')return [act('career','K',t('Career','Kariera')),act('daily','D',t('Daily market','Rynek dnia')),act('code','W',phrase('code'))];
  if(screen==='slots')return meta.SLOTS.map(slot=>{
    const data=p&&p.slots[slot],name=slot==='auto'?t('Autosave','Autozapis'):t('Slot ','Slot ')+slot;
    const label=(data?name+' · '+tierLabel(data.tier||p.tier)+' · '+rankLabel(data.rank||p.rank)+' · '+t('day ','dzień ')+(data.day||1)+' · '+fmt(data.wealth)+' $':name+' · '+t('empty','pusty')).slice(0,64);
    return act('slot-'+slot,slot==='auto'?'A':slot,label);
  });
  if(screen==='set')return [
    act('style','F',t('Style: ','Styl: ')+({current:'Standard',retro:'DOS',matrix:'Matrix'}[g().style]||'Standard')),
    act('contrast','K',t('Contrast: ','Kontrast: ')+onOff(flag('bx2r-contrast',false))),
    act('sound','D',t('Sound: ','Dźwięk: ')+onOff(flag('bx2r-sound',false))),
    act('anim','A',t('Motion: ','Ruch: ')+onOff(flag('bx2r-anim',true))),
    act('hand','R',t('Hand: ','Ręka: ')+(g().hand==='left'?t('left','lewa'):t('right','prawa'))+t(' (phone only)',' (dotyczy telefonu)')),
    act('install-app','I',t('Install','Zainstaluj')),act('wipe','X',t('Delete saves','Usuń zapis')),
    act('pin','P',db.pinHash?t('Change PIN','Zmień PIN'):t('Set PIN','Ustaw PIN'))
  ];
  if(screen==='tier'){
    const list=['child','teen','adult'].map((id,i)=>act('tier-'+id,String(i+1),tierLabel(id)+(p&&p.tier===id?' *':'')));
    if(p&&(p.tier==='adult'||p.tier==='advanced'))list.push(act('tier-advanced','4',tierLabel('advanced')+(p.tier==='advanced'?' *':'')));
    return list;
  }
  if(screen==='confirm')return [act('wipe-yes','T',t('Yes, delete saves','Tak, usuń zapisy')),act('back','N',t('No','Nie'))];
  if(screen==='result'){
    const list=[act('again','J',t('Play again','Jeszcze raz')),act('menu','M','Menu'),act('share','U',t('Share','Udostępnij')),act('copy','C',t('Copy text','Kopiuj tekst')),act('png','P',t('Download picture','Pobierz obraz'))];
    if(ui.result&&ui.result.offerAdv)list.push(act('adv','Z',t('Try Advanced','Tryb Zaawansowany')));
    ['1','2','3'].forEach(slot=>list.push(act('keep-'+slot,slot,t('Save slot ','Zapisz slot ')+slot)));
    return list;
  }
  if(screen==='gate'){
    const list=[act('ok','ENTER',t('Confirm','Potwierdź'))];
    if(db.pinHash)list.push(act(ui.gateMode==='pin'?'usemath':'usepin','P',ui.gateMode==='pin'?t('Math question','Zadanie'):t('I have a PIN','Mam PIN')));
    return list;
  }
  if(screen==='year')return [act('ok','ENTER',t('Confirm','Dalej')),act('skip-year','S',t('Stay on Child','Zostań przy Dziecku'))];
  if(typeMax())return [act('ok','ENTER',t('Confirm','Dalej'))];
  return [];
}
const chunks=text=>{const out=[],s=String(text);for(let i=0;i<s.length&&out.length<16;i+=78)out.push(s.slice(i,i+78));return out};
function gapText(){
  const r=ui.result,p=active(loadDb());if(!r)return '';
  if(r.practice)return t('Not scored.','Bez punktów.');
  if(r.challenge)return t('Challenge is not scored.','Wyzwanie bez rekordu.');
  const best=p?meta.best(p,r.key):null;
  if(best==null)return t('First score.','Pierwszy wynik.');
  if(r.score>=best)return t('Local best.','Lokalny rekord.');
  return t('Short by '+fmt(best-r.score)+' $.','Brakuje '+fmt(best-r.score)+' $.');
}
function extraLines(){
  const p=active(loadDb()),screen=ui.screen;
  if(screen==='year')return [t('4 digits. Child until answered.','4 cyfry. Do odpowiedzi: Dziecko.'),(ui.buf||'').padEnd(4,'_')];
  if(screen==='name')return [t('Nick, 12 chars, not a real name.','Nick, 12 znaków, nie nazwisko.'),ui.buf||(p?p.name:'')];
  if(screen==='code')return [t('Like BX-7F3K. Not the daily market.','Jak BX-7F3K. To nie rynek dnia.'),ui.buf||'BX-'];
  if(screen==='gate')return [ui.gateMode==='pin'?t('Parent PIN','PIN rodzica'):(ui.quiz?(g().lang==='pl'?ui.quiz.pl:ui.quiz.en):''),ui.buf];
  if(screen==='pin'||screen==='pin2')return [t('4 digits, stored as a hash.','4 cyfry, zapis jako skrót.'),ui.buf.replace(/./g,'*')];
  if(screen==='initials')return [t('Initials for the local table.','Inicjały do lokalnej tabeli.'),ui.buf.padEnd(3,'_')];
  if(screen==='modes'){
    const lines=[t('Ranks: Trader, Merchant, Wholesaler, Magnate.','Rangi: Handlarz, Kupiec, Hurtownik, Magnat.')];
    if(p&&p.dailyDone===today())lines.push(t('Scored today. Next is practice.','Dziś punktowane. Dalej trening.'));
    lines.push(t('Band: ','Próg: ')+tierLabel(p?p.tier:'child')+' · '+rankLabel(p?p.rank:'handlarz'));
    return lines;
  }
  if(screen==='set')return [t('Language: ','Język: ')+(g().lang==='pl'?'PL':'EN')+' (L)'];
  if(screen==='help')return chunks(g().help().map(pair=>pair[1]).join(' '));
  if(screen==='about')return chunks(t('Local: profile, year, PIN hash. No account, alerts, or stranger ranks. Share card is the score.','Lokalnie: profil, rok, skrót PIN. Bez konta, alertów i rankingu z obcymi. Kartka to wynik.'));
  if(screen==='rec'){
    if(!p)return [t('No profile yet.','Nie ma jeszcze profilu.')];
    const lines=[];
    [[p.tier+'|'+p.rank,tierLabel(p.tier)+' · '+rankLabel(p.rank)],['daily',t('Daily market','Rynek dnia')]].forEach(([key,heading])=>{
      lines.push(heading);const list=meta.records(p,key);
      lines.push(...(list.length?list.map((row,i)=>' '+(i+1)+' '+row.initials+' '+fmt(row.score)+' $ '+row.days+'d '+row.date):[t(' empty',' pusto')]));
    });
    return lines.slice(0,16);
  }
  if(screen==='result'&&ui.result){
    const r=ui.result,lines=[];
    if(r.fresh)lines.push('+-- '+t('NEW RECORD!','NOWY REKORD!')+' --+');
    lines.push(tierLabel(r.tier)+' · '+rankLabel(r.rank),t('Score ','Wynik ')+fmt(r.score)+' $  '+t('Days ','Dni ')+(r.o.days|0)+'/'+(r.o.limit||'—'),gapText());
    if(r.promotedTo)lines.push(t('Next: ','Awans: ')+rankLabel(r.promotedTo));
    else if(r.promoted)lines.push(t('Goal met.','Cel osiągnięty.'));
    else if(r.o.expired)lines.push(t('Day limit.','Koniec dni.'));
    if(r.offerAdv)lines.push(t('Magnate may try Advanced.','Magnat może iść w Zaawansowany.'));
    return lines;
  }
  if(screen==='confirm')return [t('Active profile saves only.','Tylko zapisy tego profilu.')];
  return [];
}
function lastLine(){
  const p=active(loadDb());if(!p)return '';
  const slot=latest(p);if(!slot)return '';
  const day=slot.day||1,lim=slot.state&&slot.state.v2Days,rec=meta.best(p,(slot.tier||p.tier)+'|'+(slot.rank||p.rank));
  let text=t('Last game: ','Ostatnia gra: ')+tierLabel(slot.tier||p.tier)+' · '+rankLabel(slot.rank||p.rank)+' · '+t('day ','dzień ')+day+(lim?'/'+lim:'');
  if(rec!=null)text+=' · '+t('record ','rekord ')+fmt(rec);
  return text.slice(0,78);
}
const center=s=>{s=String(s);if(s.length>78)s=s.slice(0,78);const left=Math.floor((78-s.length)/2);return ' '.repeat(left)+s+' '.repeat(78-s.length-left)};
const tok=a=>'[['+a.id+'|'+a.key+'|['+a.key+'] '+a.label+']]';
function topBar(){
  const token='[[language|L|PL/EN]]',left='BIZNES.EXE  ·  '+motto(),room=78-vis(token).length,cut=left.slice(0,room);
  return cut+' '.repeat(Math.max(0,room-cut.length))+token;
}
function buildRows(){
  const rows=[topBar()],acts=actions();
  if(ui.screen==='menu'){
    rows.push('',center(inspired()),center(t('Patron: ','Patron: ')+patronName()),'');
    acts.forEach((a,i)=>rows.push((i===clampSel(acts.length)?'> ':'  ')+tok(a)));
    rows.push('',lastLine());
  }else{
    rows.push(center(title()));
    if(ui.note)rows.push(String(ui.note).slice(0,78));
    extraLines().forEach(line=>rows.push(String(line).slice(0,78)));
    acts.forEach((a,i)=>rows.push((i===clampSel(acts.length)?'> ':'  ')+tok(a)));
    rows.push('  [[back|ESC|[Esc] '+t('Back','Wstecz')+']]');
  }
  const body=rows.slice(0,22);while(body.length<22)body.push('');body.push((REL+'  '+g().status()).slice(0,78));
  return body.map(padLine);
}
function header(){
  return `<header class="mobile-head"><div class="mobile-brand"><strong>BIZNES.EXE</strong></div><nav class="mobile-sponsors" aria-label="${esc(t('Patrons','Patroni'))}">${patronHtml()}</nav><button type="button" data-ui-action="language" aria-label="${esc(t('Language','Język'))}">${g().lang==='pl'?'EN':'PL'}</button></header>`;
}
function buttons(list){return list.map(a=>`<button type="button"${a.id==='cont'?' class="mobile-confirm"':''} data-ui-action="${esc(a.id)}">${esc(a.label)}</button>`).join('')}
function mobileHtml(){
  if(ui.screen==='menu'){
    const acts=actions(),by=id=>acts.find(a=>a.id===id),card=latest(active(loadDb()))?`<article class="v2-card"><b>${esc(t('Last game','Ostatnia gra'))}</b><br>${esc(lastLine().replace(/^.*?:\s*/,''))}</article>`:'';
    return header()+`<section class="mobile-list"><h1>${esc(motto())}</h1><p>${esc(inspired())}</p>${card}</section><p class="v2-legal"><button type="button" data-ui-action="about">${esc(t('Privacy · About','Prywatność · O grze'))}</button></p><small class="mobile-status"><span>${esc(REL)}</span><span>${esc(g().status())}</span></small><section class="mobile-dock"><div class="v2-row v2-row1">${buttons([by('new'),by('cont')])}</div><div class="v2-row v2-row2">${buttons([by('rec'),by('set'),by('help')])}</div></section>`;
  }
  const max=typeMax(),field=max?`<input class="v2-field" maxlength="${max}" value="${esc(ui.buf)}" aria-label="${esc(title())}" ${'year,gate,pin,pin2'.includes(ui.screen)?'inputmode="numeric"':''}>`:'';
  const blocks=extraLines().map(line=>`<p>${esc(line)}</p>`).join('');
  return header()+`<section class="mobile-list"><h1>${esc(title())}</h1>${ui.note?`<p class="v2-note">${esc(ui.note)}</p>`:''}${blocks}${field}<div class="v2-stack">${buttons(actions())}</div></section><section class="mobile-dock"><button type="button" data-ui-action="back">${esc(t('Back','Wstecz'))}</button></section>`;
}
const paint=()=>{
  if(ui.fx||!g())return;
  const term=document.querySelector('#terminal'),mobile=document.querySelector('#mobile'),help=document.querySelector('#desktop-install-help');
  if(term)term.innerHTML=buildRows().map(raw=>`<span class="terminal-row${raw.startsWith('>')?' menu-on':''}">${raw.replace(/\[\[([^|]+)\|([^|]+)\|(.*?)\]\]/g,(_,id,key,label)=>`<button type="button" class="terminal-action" data-ui-action="${esc(id)}" data-hotkey="${esc(key)}">${esc(label)}</button>`)}</span>`).join('\n');
  if(mobile)mobile.innerHTML=mobileHtml();
  if(help){help.hidden=true;help.textContent=''}
  g().fit?.();
};
function paintFx(n){
  const chars='*+.░▒★',title=t('NEW RECORD!','NOWY REKORD!'),rows=[];
  for(let i=0;i<23;i++){
    if(i===11)rows.push(center('+-- '+title+' --+'));
    else{let line='';for(let c=0;c<78;c++)line+=chars[(n*3+i*5+c)%chars.length];rows.push(line)}
  }
  const term=document.querySelector('#terminal'),mobile=document.querySelector('#mobile');
  if(term)term.innerHTML=rows.map(raw=>`<span class="terminal-row">${esc(raw)}</span>`).join('\n');
  if(mobile)mobile.innerHTML=`<pre class="v2-fx" role="status">${esc(title)}\n${esc(chars)}</pre>`;
}
const stopFx=()=>{if(ui.timer)clearInterval(ui.timer);ui.timer=0;ui.fx=0};
function open(screen,note){stopFx();ui.screen=screen;ui.sel=0;ui.buf='';ui.note=note||'';paint()}
function celebrate(){
  beep();if(!motion()){ui.fx=0;paint();return}
  stopFx();ui.fx=1;let n=1;paintFx(n);
  ui.timer=setInterval(()=>{n+=1;paintFx(n);if(n>=15){stopFx();paint()}},200);
}
function askGate(next,from){ui.pending=next;ui.gateFrom=from||ui.screen;ui.screen='gate';ui.sel=0;ui.buf='';ui.gateMode='math';ui.quiz=meta.mathChallenge();ui.note='';paint()}
function submitGate(){
  const db=loadDb(),ok=ui.gateMode==='pin'?meta.checkPin(ui.buf,db.pinSalt,db.pinHash):meta.checkMath(ui.quiz,ui.buf);
  if(!ok){ui.note=t('Wrong answer.','Zła odpowiedź.');ui.buf='';ui.quiz=meta.mathChallenge();paint();return}
  const fn=ui.pending;ui.pending=null;ui.note='';ui.screen=ui.gateFrom||'menu';fn&&fn();
}
function submitYear(){
  const year=Number(ui.buf),db=loadDb(),p=active(db);if(!p)return;
  const implied=meta.tierFromBirthYear(year,yearNow());
  if(!implied){ui.note=t('Enter the year of birth.','Podaj rok urodzenia.');paint();return}
  if(meta.canApply(p.tier,implied,false)){meta.applyBirthYear(p,year,yearNow(),false);saveDb(db);open('modes');return}
  ui.bufYear=year;
  askGate(()=>{const next=loadDb(),who=active(next);meta.applyBirthYear(who,ui.bufYear,yearNow(),true);saveDb(next);open('modes')},'year');
}
function submitName(){
  const db=loadDb(),p=active(db);if(!p)return;
  const name=ui.buf.replace(/[^\p{L}\p{N} ]/gu,'').replace(/\s+/g,' ').trim().slice(0,12);
  if(name)p.name=name;saveDb(db);open('profiles');
}
function submitCode(){
  const text=ui.buf.toUpperCase().startsWith('BX-')?ui.buf:'BX-'+ui.buf,seed=meta.seedFromCode(text);
  if(seed==null){ui.note=t('Code like BX-7F3K.','Kod jak BX-7F3K.');paint();return}
  startGame('challenge',seed);
}
function submitPin(){
  if(ui.screen==='pin'){if(!/^\d{4}$/.test(ui.buf)){ui.note=t('PIN is 4 digits.','PIN ma 4 cyfry.');paint();return}ui.pin1=ui.buf;ui.buf='';ui.screen='pin2';paint();return}
  if(ui.buf!==ui.pin1){ui.note=t('Numbers differ.','Numery się różnią.');ui.screen='pin';ui.buf='';paint();return}
  const db=loadDb();db.pinSalt=Math.random().toString(16).slice(2,8);db.pinHash=meta.hashPin(ui.pin1,db.pinSalt);ui.pin1='';saveDb(db);
  open('set',t('PIN stored as a hash.','PIN zapisany jako skrót.'));
}
const freshRecord=(p,key,score)=>{const list=meta.records(p,key);return list.length<5||score>list[list.length-1].score};
function submitInitials(){
  const db=loadDb(),p=active(db);if(!p||!ui.result)return;
  ui.result.fresh=meta.addRecord(p,ui.result.key,{score:ui.result.score,days:ui.result.o.days|0,date:today(),initials:(ui.buf.toUpperCase().replace(/[^A-Z]/g,'')+'???').slice(0,3)});
  saveDb(db);ui.screen='result';ui.buf='';if(ui.result.fresh)celebrate();else paint();
}
function confirmBuf(){
  ({year:submitYear,name:submitName,code:submitCode,gate:submitGate,pin:submitPin,pin2:submitPin,initials:submitInitials}[ui.screen]||(()=>{}))();
}
function startGame(mode,seed){
  const db=loadDb();let p=active(db);
  if(!p){p=meta.addProfile(db);if(!p){open('profiles');return}db.active=p.id;saveDb(db);open('year');return}
  if(p.birthYear==null&&!p.asked){open('year');return}
  let use=mode;
  if(mode==='daily'&&p.dailyDone===today())use='practice';
  if(use==='daily'){p.dailyDone=today();saveDb(db)}
  ui.mode=use==='practice'?'daily':mode;ui.seed=seed;
  const shell=globalThis.BX2;
  shell.playing=false;shell.done=false;shell.profileId=p.id;g().newGame();
  meta.arm(g().getS(),{mode:use,rank:p.rank,tier:p.tier,seed});
  shell.playing=true;
  const notes=[];
  if(use==='practice')notes.push(t('Scored today. This is practice.','Dziś punktowane. To trening.'));
  if(p.tier==='advanced')notes.push(t('Fictional shares, not advice.','Fikcyjne akcje, nie porada.'));
  if(notes.length)g().flash(notes.join(' '));else g().render();
}
function resume(slot){
  const db=loadDb(),p=active(db),data=p&&p.slots[slot];
  if(!data){ui.note=t('Empty slot.','Pusty slot.');paint();return}
  const shell=globalThis.BX2;shell.playing=false;shell.done=false;shell.profileId=p.id;g().adopt(data.state);shell.playing=true;g().render();
}
function finish(state,outcome){
  const shell=globalThis.BX2,db=loadDb(),p=db.profiles.find(item=>item.id===shell.profileId)||active(db);
  const rank=state.v2Rank||(p&&p.rank)||'handlarz',tier=state.v2Tier||(p&&p.tier)||'child';
  ui.result={o:outcome,tier,rank,score:outcome.gain|0,daily:!!state.v2Daily,challenge:!!state.v2Challenge,practice:!!state.v2Practice,promoted:outcome.promoted,fresh:false,offerAdv:false,seed:state.seed,key:state.v2Daily?'daily':tier+'|'+rank};
  ui.mode=state.v2Daily?'daily':state.v2Challenge?'challenge':'career';
  if(p&&outcome.promoted&&state.v2Career){const next=meta.nextRank(p.rank);if(next){p.rank=next;ui.result.promotedTo=next}else if(p.tier==='adult')ui.result.offerAdv=true}
  if(p)saveDb(db);
  ui.sel=0;ui.buf='';ui.note='';shell.playing=false;shell.done=true;g().setView('welcome');
  if((state.v2Daily||state.v2Career)&&p&&freshRecord(p,ui.result.key,ui.result.score))open('initials');
  else {ui.screen='result';paint()}
}
function shareText(){
  const r=ui.result;if(!r)return 'BIZNES.EXE';
  const goal=r.o.goal||Math.max(r.score,1),blocks=Math.max(0,Math.min(6,Math.round((r.score>0?r.score:0)/goal*6)));
  return 'BIZNES.EXE #'+((Math.abs(r.score*13+(r.o.days|0))%900)+100)+' · '+rankLabel(r.rank)+' · '+(r.o.days|0)+' '+t('days','dni')+' · '+fmt(r.score)+' $ '+'▓'.repeat(blocks)+'░'.repeat(6-blocks);
}
function pngBlob(text){
  const c=document.createElement('canvas');c.width=640;c.height=120;const p=c.getContext('2d');
  p.fillStyle='#000';p.fillRect(0,0,640,120);p.fillStyle='#ff5';p.font='20px monospace';p.fillText(text,16,68);
  return new Promise(ok=>c.toBlob(b=>{c.width=c.height=0;ok(b)},'image/png'));
}
const guard=fn=>{const p=active(loadDb());if(p&&p.tier==='child')askGate(()=>{ui.screen='result';fn()},'result');else fn()};
async function shareNow(){
  const text=shareText(),blob=await pngBlob(text),file=new File([blob],'biznes.png',{type:'image/png'});
  if(navigator.share){try{const data={text,files:[file]};if(!navigator.canShare||navigator.canShare(data)){await navigator.share(data);return}await navigator.share({text});return}catch(err){if(err&&err.name==='AbortError')return}}
  ui.note=t('Share failed. Copy or save the picture.','Nie wyszło. Kopiuj albo pobierz.');paint();
}
const copyNow=()=>{const text=shareText(),done=()=>{ui.note=t('Copied.','Skopiowano.');paint()};if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).then(done).catch(()=>{ui.note=text;paint()});else {ui.note=text;paint()}};
const downloadNow=()=>pngBlob(shareText()).then(blob=>{const link=document.createElement('a'),url=URL.createObjectURL(blob);link.href=url;link.download='biznes.png';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);ui.note=t('Picture downloaded.','Obraz pobrany.');paint()});
function keep(slot){
  const db=loadDb(),p=active(db);if(!p||!ui.result)return;
  if(p.slots[slot]&&ui.confirmSlot!==slot){ui.confirmSlot=slot;ui.note=t('Press again to overwrite.','Jeszcze raz, by nadpisać.');paint();return}
  meta.writeSlot(p,slot,g().getS(),{tier:p.tier,rank:ui.result.rank,wealth:meta.wealth(g().getS()),date:today(),at:Date.now()});
  ui.confirmSlot='';saveDb(db);ui.note=t('Saved in slot ','Zapisano w slocie ')+slot+'.';paint();
}
function withDb(fn){const db=loadDb();fn(db,active(db));saveDb(db)}
function go(id){
  const jump={rec:'rec',set:'set',help:'help',about:'about',new:'profiles',menu:'menu',rename:'name',band:'tier',wipe:'confirm',code:'code'}[id];
  if(id==='back')return back();
  if(id==='ok')return confirmBuf();
  if(jump)return open(jump);
  if(id==='create')return withDb((db,p)=>{p=meta.addProfile(db);if(!p){ui.note=t('4 profiles already.','Są już 4 profile.');paint();return}db.active=p.id;saveDb(db);open('year')});
  if(id.startsWith('use-'))return withDb(db=>{db.active=id.slice(4);const p=active(db);saveDb(db);open(p&&p.birthYear==null&&!p.asked?'year':'modes')});
  if(id==='skip-year')return withDb(db=>{const p=active(db);if(p)p.asked=1;saveDb(db);open('modes')});
  if(id.startsWith('who-'))return withDb(db=>{db.active=id.slice(4);saveDb(db);open('slots')});
  if(id==='cont'){const db=loadDb();if(!db.profiles.some(p=>meta.SLOTS.some(slot=>p.slots[slot]))){ui.note=t('No save yet.','Nie ma jeszcze zapisu.');paint();return}open(db.profiles.length>1?'who':'slots');return}
  if(id==='career')return startGame('career');
  if(id==='daily')return startGame('daily',meta.dailySeed(today()));
  if(id.startsWith('slot-'))return resume(id.slice(5));
  if(id==='style'){g().cycleStyle();g().render();return}
  if(id==='contrast'){localStorage.setItem('bx2r-contrast',flag('bx2r-contrast',false)?'off':'on');g().render();return}
  if(id==='sound'||id==='anim'){const key=id==='sound'?'bx2r-sound':'bx2r-anim',def=id==='anim';localStorage.setItem(key,flag(key,def)?'off':'on');paint();return}
  if(id==='hand'){g().setHand(g().hand==='left'?'right':'left');return}
  if(id==='install-app'){g().select('install-app');return}
  if(id==='wipe-yes')return withDb(db=>{const p=active(db);if(p)meta.clearSlots(p);saveDb(db);open('set',t('Saves removed.','Zapisy usunięte.'))});
  if(id==='pin'){const next=()=>open('pin');if(loadDb().pinHash)askGate(next,'set');else next();return}
  if(id==='drop'){const db=loadDb();if(ui.confirmDrop!==db.active){ui.confirmDrop=db.active;ui.note=t('Press remove again.','Usuń jeszcze raz.');paint();return}db.profiles=db.profiles.filter(p=>p.id!==db.active);db.active=db.profiles[0]?db.profiles[0].id:null;ui.confirmDrop='';saveDb(db);open('profiles',t('Profile removed.','Profil usunięty.'));return}
  if(id.startsWith('tier-')){
    const to=id.slice(5),db=loadDb(),p=active(db);if(!p)return;
    const apply=()=>{const next=loadDb(),who=active(next);if(who&&meta.canApply(who.tier,to,true)){who.tier=to;saveDb(next)}open('profiles')};
    if(meta.canApply(p.tier,to,false)){p.tier=to;saveDb(db);open('profiles');return}
    askGate(apply,'tier');return;
  }
  if(id==='again')return startGame(ui.mode==='challenge'?'challenge':ui.mode==='daily'?'daily':'career',ui.mode==='daily'?meta.dailySeed(today()):ui.mode==='challenge'?ui.result&&ui.result.seed:undefined);
  if(id==='share')return guard(shareNow);
  if(id==='copy')return guard(copyNow);
  if(id==='png')return guard(downloadNow);
  if(id==='adv')return askGate(()=>{const db=loadDb(),p=active(db);if(p&&meta.canApply(p.tier,'advanced',true)){p.tier='advanced';p.rank='handlarz';saveDb(db)}open('menu',t('Advanced on, from Trader.','Zaawansowany od Handlarza.'))},'result');
  if(id.startsWith('keep-'))return keep(id.slice(5));
  if(id==='usepin'||id==='usemath'){ui.gateMode=id==='usepin'?'pin':'math';if(id==='usemath')ui.quiz=meta.mathChallenge();ui.buf='';paint()}
}
function back(){
  if(ui.screen==='initials')return submitInitials();
  stopFx();ui.note='';ui.buf='';
  if(ui.screen==='gate'){ui.pending=null;ui.screen=ui.gateFrom||'menu';ui.sel=0;paint();return}
  ui.screen=({profiles:'menu',year:'profiles',modes:'profiles',code:'modes',who:'menu',slots:'menu',rec:'menu',set:'menu',help:'menu',about:'menu',result:'menu',initials:'result',confirm:'set',pin:'set',pin2:'set',tier:'profiles',name:'profiles'}[ui.screen]||'menu');
  ui.sel=0;paint();
}
function onKey(k){
  if(k==='L'){g().select('language');return}
  if(k==='ESC'){back();return}
  if(ui.fx){stopFx();paint();return}
  const max=typeMax();
  if(max){
    if(k==='ENTER')return confirmBuf();
    if(k==='BACKSPACE'){ui.buf=ui.buf.slice(0,-1);paint();return}
    const hit=actions().find(a=>a.key===k&&a.id!=='ok');if(hit)return go(hit.id);
    const digit='year,gate,pin,pin2'.split(',').includes(ui.screen);
    if(k.length===1&&(!digit||/\d/.test(k))&&(ui.screen!=='initials'||/[A-Z]/.test(k))){ui.buf=(ui.buf+k).slice(0,max);paint()}
    return;
  }
  const acts=actions();
  if(k==='UP'||k==='DOWN'){ui.sel+=k==='DOWN'?1:-1;paint();return}
  if(k==='ENTER'){const item=acts[clampSel(acts.length)];if(item)go(item.id);return}
  const hit=acts.find(a=>a.key===k);if(hit)go(hit.id);
}
document.addEventListener('input',e=>{if(e.target&&e.target.classList&&e.target.classList.contains('v2-field'))ui.buf=String(e.target.value).slice(0,typeMax()||12)},true);
document.addEventListener('keydown',e=>{if(!(e.target&&e.target.classList&&e.target.classList.contains('v2-field'))||e.key!=='Enter')return;e.preventDefault();e.stopPropagation();ui.buf=String(e.target.value).slice(0,typeMax()||12);confirmBuf()},true);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopFx()});
globalThis.BX2={
  playing:false,done:false,profileId:null,onKey,onAction:go,
  onWelcome(){if(ui.fx)return;const field=document.activeElement;if(field&&field.classList&&field.classList.contains('v2-field'))return;paint()},
  onQuit(){this.playing=false;this.done=false;ui.screen='menu';ui.sel=0;ui.note=''},
  onSave(state){const db=loadDb(),p=db.profiles.find(item=>item.id===this.profileId)||active(db);if(!p)return;meta.writeSlot(p,'auto',state,{tier:p.tier,rank:state.v2Rank||p.rank,wealth:meta.wealth(state),date:today(),at:Date.now()});db.active=p.id;saveDb(db)},
  onHome(state){if(this.done||!this.playing)return;const outcome=meta.outcome(state);if(outcome.ended)finish(state,outcome)},
  onReady(){
    const db=loadDb();
    if(!db.legacy){if(localStorage.getItem('bx-save')){try{meta.importLegacy(db,g().getS());saveDb(db)}catch{}}else{db.legacy=true;saveDb(db)}}
    if(!ui.rot)ui.rot=setInterval(()=>{ui.spin=(ui.spin+1)%patrons().length;if(!globalThis.BX2.playing&&!ui.fx)paint()},15000);
    paint();
  }
};
})();
