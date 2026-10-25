(()=>{
'use strict';
const meta=globalThis.BiznesMeta;if(!meta||typeof document==='undefined')return;
const DB='bx2r-db',REL='2.0 retro · PREVIEW 2026.10.24';
const ui={screen:'menu',sel:0,note:'',pending:null,result:null,recLevel:'handlarz'};
const g=()=>globalThis.BiznesGame,t=(en,pl)=>g()?.lang==='en'?en:pl;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>String(Math.round(n||0)).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
const active=db=>db.profiles.find(p=>p.id===db.active)||db.profiles[0];
const date=()=>new Date().toISOString().slice(0,10);
const label=id=>{const l=meta.level(id);return t(l.en,l.pl)};
const flag=(key,def=false)=>{try{const value=localStorage.getItem('bx2r-'+key);return value===null?def:value==='on'}catch{return def}};
let mem=null;
function saveDb(db){const raw=JSON.stringify(db);try{localStorage.setItem(DB,raw);mem=null;return true}catch{mem=raw;ui.note=t('Storage is full or unavailable. This session may not be saved.','Brak dostępu do zapisu lub miejsca. Ta sesja może się nie zapisać.');return false}}
function loadDb(){let raw;try{raw=mem??localStorage.getItem(DB)}catch{ui.note||=t('Storage is unavailable. Progress lasts only for this session.','Pamięć niedostępna. Postęp zostanie tylko w tej sesji.')}try{if(raw){const db=JSON.parse(raw);if(meta.validDb(db))return meta.migrate(db);throw Error('Invalid database')}}catch{if(raw)try{localStorage.setItem(DB+'-backup',raw)}catch{}ui.note=t('Invalid save. A recovery copy was attempted.','Nieprawidłowy zapis. Podjęto próbę zachowania kopii.')}const db=meta.emptyDb();meta.addProfile(db,{name:'Gracz 1'});return db}
let ageEnabled=flag('adult');
const adult=()=>ageEnabled;
let patronOrder=[],patronOffset=0;
const visiblePatrons=()=>patronOrder.length?Array.from({length:Math.min(2,patronOrder.length)},(_,i)=>patronOrder[(patronOffset+i)%patronOrder.length]):g().sponsors().slice(0,2);
const patrons=(all=false)=>(all?g().sponsors():visiblePatrons()).map(([name,url])=>adult()?`<a class="sponsor-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">${esc(name)}</a>`:esc(name)).join(' · ');
function startPatrons(){
 patronOrder=[...g().sponsors()];
 for(let i=patronOrder.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[patronOrder[i],patronOrder[j]]=[patronOrder[j],patronOrder[i]]}
 setInterval(()=>{
  if(document.hidden||patronOrder.length<3||!flag('anim',true)||document.activeElement?.closest?.('[data-patrons]'))return;
  patronOffset=(patronOffset+1)%patronOrder.length;
  document.querySelectorAll('[data-patrons]').forEach(node=>{node.innerHTML=patrons()});
 },12000);
}
const miniHelp=()=>[
 t('Buy low and sell higher. Prices are fictional.','Kupuj tanio i sprzedawaj drożej. Ceny są fikcyjne.'),
 t('Free trips change prices and may bring gains or losses.','Podróże są bezpłatne: zmieniają ceny i mogą przynieść zysk lub stratę.'),
 t('Debt per trip: 1–3 / 1–10 / 1–30%, depending on difficulty.','Dług za wyjazd: 1–3 / 1–10 / 1–30%, zależnie od poziomu.'),
 t('Loan: max 2,000 $ per operation. Reach the profit goal in time. Autosave.','Pożyczka: do 2 000 $ na operację. Zdobądź zysk w limicie dni. Autozapis.')
];
const helpLinks=()=>[
 {id:'play',key:'1',text:t('Full instructions','Pełna instrukcja')},
 {id:'about',key:'2',text:t('Privacy','Prywatność')},
 {id:'patrons',key:'3',text:t('Patrons','Patroni')},
 {id:'licenses',key:'4',text:t('About and licences','O grze i licencje')}
];
function installGame(){
 open('install');
 // Call directly in the click/keyboard gesture; do not route back through game.select.
 const pwa=globalThis.BiznesPWA;
 if(pwa?.install){Promise.resolve(pwa.install()).catch(()=>{}).finally(()=>{if(ui.screen==='install')paint()})}
}
const desktopHeader=()=>`<span class="header-brand accent">BIZNES.EXE</span><span class="header-patrons" data-patrons>${patrons()}</span><span class="header-language"><button type="button" class="frame-control" data-ui-action="language" data-hotkey="L" aria-label="${esc(t('Switch language','Zmień język'))}">PL/EN</button></span>`;
const act=(id,key,text)=>({id,key,text});
const nameOfScreen=()=>({menu:'BIZNES.EXE',levels:t('New game','Nowa gra'),set:t('Settings','Ustawienia'),rec:t('Records','Rekordy'),help:t('Help and information','Pomoc i informacje'),play:t('How to play','Jak grać'),about:t('Privacy and local saves','Prywatność i zapis lokalny'),patrons:t('Patrons and links','Patroni i linki'),licenses:t('About and licences','O grze i licencje'),install:t('Install / offline','Instalacja / offline'),result:t('Result','Wynik'),confirm:t('Confirm','Potwierdzenie')})[ui.screen]||'';
function actions(){switch(ui.screen){
case 'menu':return [act('new','N',t('New game','Nowa gra')),act('cont',t('C','K'),t('Continue','Kontynuuj')),act('rec','R',t('Records','Rekordy')),act('set',t('S','U'),t('Settings','Ustawienia')),act('age','W',t('Age: ','Wiek: ')+(adult()?'18+':'<18')),act('help',t('H','J'),t('Help','Pomoc')),act('install-app','I',t('Install','Instaluj'))];
case 'levels':return meta.LEVELS.map((l,i)=>act('level-'+l.id,String(i+1),label(l.id)));
case 'set':return [
 act('language','L',t('Language: English','Język: Polski')),
 act('style','F',t('Style: ','Styl: ')+({current:'Standard',retro:'DOS',matrix:'Matrix'}[g().style]||g().style)),
 act('contrast','K',t('High contrast: ','Wysoki kontrast: ')+(flag('contrast')?t('on','wł.'):t('off','wył.'))),
 act('sound','D',t('Sound: ','Dźwięk: ')+(flag('sound')?t('on','wł.'):t('off','wył.'))),
 act('anim','A',t('Motion (patrons, fades): ','Ruch (patroni, przejścia): ')+(flag('anim',true)?t('on','wł.'):t('off','wył.'))),
 act('hand','R',t('Phone hand: ','Ręka na telefonie: ')+(g().hand==='left'?t('left','lewa'):t('right','prawa'))),
 act('wipe','X',t('Delete saved game','Usuń zapis gry'))];
case 'help':return [act('play','1',t('How to play','Jak grać')),act('about','2',t('Privacy and local saves','Prywatność i zapis lokalny')),act('patrons','3',t('Patrons and links','Patroni i linki')),act('licenses','4',t('About and licences','O grze i licencje'))];
case 'rec':return meta.LEVELS.map((l,i)=>act('record-'+l.id,String(i+1),label(l.id)));
case 'confirm':return [act('confirm-yes','T',ui.pending?.kind==='age'?t('I am 18+; enable links','Mam 18+; włącz linki'):t('Yes, continue','Tak, kontynuuj')),act('back','ESC',t('Cancel','Anuluj'))];
case 'result':{const list=[act('again','J',t('Play again','Jeszcze raz')),act('menu','M','Menu')];const next=ui.result?.o.promoted&&meta.nextLevel(ui.result.level);if(next)list.unshift(act('level-'+next,'D',t('Try: ','Spróbuj: ')+label(next)));return list}
case 'about':case 'licenses':return [act('privacy','P',t('Privacy policy (page)','Polityka prywatności (strona)'))];
default:return [];
}}
function lines(){const db=loadDb(),p=active(db);switch(ui.screen){
case 'menu':{const s=p.slots.auto?.state;return [s?(p.slots.auto.beta?t('BETA save','Zapis z BETA'):t('Last game: ','Ostatnia gra: ')+label(s.v2Level||s.v2Rank))+' · '+t('day ','dzień ')+s.day:t('Choose New game to begin.','Wybierz Nowa gra, aby zacząć.'),t('18+ enables external links.','18+ włącza linki zewnętrzne.')]}
case 'levels':return [t('Choose difficulty. Same family content at every level.','Wybierz trudność. Wspólne treści rodzinne na każdym poziomie.'),...meta.LEVELS.map(l=>label(l.id)+': '+l.goods+t(' goods, ',' towary, ')+l.cities+t(' cities, ',' miasta, ')+l.days+t(' days.',' dni.')+' '+t('Goal: profit ','Cel: zysk ')+fmt(l.goal)+' $. '+t('Debt ','Dług ')+fmt(l.debt)+' $. '+t('Interest ','Odsetki ')+ '1–'+l.rate+'%.'),t('Trader: goods. Merchant: also banks. Magnate: also shares.','Handlarz: towary. Kupiec: także banki. Magnat: także akcje.')];
case 'help':return [t('Rules, privacy and information about the game.','Zasady, prywatność i informacje o grze.')];
case 'play':return [t('Buy low, sell high. Prices and shares are fictional.','Kupuj tanio i sprzedawaj drożej. Ceny i akcje są fikcyjne.'),t('Travel is free. A trip takes a day; delays can add another.','Podróż jest bezpłatna. Wyjazd trwa dzień; opóźnienie może dodać kolejny.'),t('Prices mix the previous price, game day, city and chance.','Ceny łączą poprzednią cenę, dzień gry, miasto i losowanie.'),t('Travel can bring gains or losses of money and goods.','Po drodze możesz zyskać lub stracić pieniądze i towary.'),t('Interest per trip: Trader 1–3%, Merchant 1–10%, Magnate 1–30%.','Odsetki za wyjazd: Handlarz 1–3%, Kupiec 1–10%, Magnat 1–30%.'),t('The displayed rate applies to the next trip. Loan: max 2,000 per operation.','Widoczna stawka dotyczy kolejnego wyjazdu. Pożyczka: do 2 000 na operację.'),t('Merchant adds bank deposits; Magnate adds share trading.','Kupiec dodaje wpłaty do banków; Magnat dodaje handel akcjami.'),t('Goal: increase net wealth by the stated profit before the day limit.','Cel: zwiększ majątek netto o podany zysk przed upływem limitu dni.'),t('Net wealth = cash + banks + goods + shares − debt.','Majątek netto = gotówka + banki + towary + akcje − dług.'),t('Enter confirms, Esc cancels. Autosave; Continue resumes your game.','Enter zatwierdza, Esc anuluje. Autozapis; Kontynuuj wznawia grę.')];
case 'about':return [
 t('No account, chat, player analytics or real-money purchases.','Bez konta, czatu, analityki graczy i zakupów za prawdziwe pieniądze.'),
 t('Progress, records, settings and the age declaration stay in this browser.','Postęp, rekordy, ustawienia i deklaracja wieku zostają w tej przeglądarce.'),
 t('Local device storage keeps your game/settings and files needed for offline play.','Pamięć urządzenia przechowuje grę, ustawienia i pliki potrzebne do gry offline.'),
 t('We do not add advertising cookies or tracking pixels.','Nie dodajemy reklamowych cookies ani pikseli śledzących.'),
 t('Clearing browser/site data may delete progress and resets the age choice.','Usunięcie danych przeglądarki lub strony może skasować postęp i wybór wieku.'),
 t('GitHub Pages hosts the game and may keep technical logs including IP addresses.','GitHub Pages udostępnia grę i może zachowywać logi techniczne, w tym adresy IP.'),
 t('External sites have their own privacy policies.','Zewnętrzne strony mają własne polityki prywatności.'),
 t('Old profiles remain in local data; the last selected save is used.','Dawne profile pozostają w danych lokalnych; używany jest ostatnio wybrany zapis.')];
case 'patrons':return [
 t('Project patrons: MojeDostawy.pl, LCSE.pl and SejmPage.pl.','Patroni projektu: MojeDostawy.pl, LCSE.pl i SejmPage.pl.'),
 t('The top bar rotates pairs every 12 seconds (Settings: Motion). The grey panel lists all patrons.','Górna belka zmienia parę co 12 sekund (Ustawienia: Ruch). Szary panel pokazuje wszystkich patronów.'),
 t('Below 18 / no declaration: names without links.','Poniżej 18 lat / brak deklaracji: nazwy bez linków.'),
 t('18+: external links enabled. This is our precautionary setting.','18+: włączone linki zewnętrzne. To nasze ustawienie ostrożnościowe.'),
 t('The declaration is not verified age, identity or parental consent.','Deklaracja nie jest potwierdzeniem wieku, tożsamości ani zgodą rodzica.'),
 t('The choice stays on this device. Below 18 disables the links immediately.','Wybór zostaje na tym urządzeniu. Powrót do <18 od razu wyłącza linki.'),
 t('Age does not change difficulty, progress or the neutral goods and events.','Wiek nie zmienia trudności, postępu ani neutralnych towarów i zdarzeń.')];
case 'licenses':return [
 t('Independent adaptation inspired by Biznesman (1988), M. Cwynar / SAMBA.','Niezależna adaptacja inspirowana Biznesmanem (1988), M. Cwynar / SAMBA.'),
 t('Original implementation; no original game code or assets.','Własna implementacja; bez oryginalnego kodu i zasobów gry.'),
 t('Code: Apache-2.0. Font: PxPlus IBM VGA8 by VileR, CC BY-SA 4.0.','Kod: Apache-2.0. Czcionka: PxPlus IBM VGA8, VileR, CC BY-SA 4.0.'),
 t('Prices and shares are fictional. No official PEGI age rating is claimed.','Ceny i akcje są fikcyjne. Nie deklarujemy oficjalnej oceny wieku PEGI.')];
case 'install':return [
 t('Wait for Offline ready before disconnecting.','Przed odłączeniem internetu poczekaj na Offline gotowe.'),
 globalThis.BiznesPWA?.message?.(g().lang)||t('Browser menu: Install or Add to Home Screen. Safari: Share, Add to Home Screen.','Menu przeglądarki: Zainstaluj lub Dodaj do ekranu głównego. Safari: Udostępnij, Dodaj do ekranu początkowego.'),
 t('The first download and updates require an internet connection.','Pierwsze pobranie i aktualizacje wymagają internetu.')];
case 'set':return [];
case 'confirm':return [ui.pending?.kind==='age'?t('I confirm I am at least 18. Enable external links. The game rules stay the same.','Potwierdzam, że mam ukończone 18 lat. Włącz linki zewnętrzne. Zasady gry pozostają takie same.'):ui.pending?.kind==='wipe'?t('Delete the saved game, including saves from earlier versions? Records and settings remain.','Usunąć zapis gry, także zapisy z wcześniejszych wersji? Rekordy i ustawienia pozostaną.'):(p.slots.auto?.beta?t('Start a new round? It replaces the BETA save copied into 2.0. The BETA original stays untouched.','Rozpocząć nową rundę? Zastąpi ona zapis z BETA skopiowany do 2.0. Oryginał w BETA zostaje nietknięty.'):t('Start a new round? This replaces the active autosave.','Rozpocząć nową rundę? Zastąpi ona bieżący autozapis.'))];
case 'result':{const r=ui.result;return [label(r.level),r.o.promoted?t('Goal reached!','Cel osiągnięty!'):t('Day limit reached.','Koniec limitu dni.'),t('Profit: ','Zysk: ')+fmt(r.score)+' $',t('Net wealth: ','Majątek netto: ')+fmt(r.o.wealth)+' $',t('Last day: ','Ostatni dzień: ')+Math.min(r.o.days,r.o.limit)+' / '+r.o.limit,t('Saved to local records.','Wynik zapisany w lokalnych rekordach.')]}
case 'rec':{const rows=[label(ui.recLevel)];const records=meta.records(p,ui.recLevel);rows.push(...(records.length?records.map((r,i)=>(i+1)+'. '+fmt(r.score)+' $ · '+r.days+'d · '+r.date):[t('No results yet.','Brak wyników.')]));if(Object.keys(p.records).some(k=>k.includes('|')||k==='daily'))rows.push(t('Previous edition records remain in the local data.','Rekordy poprzedniej wersji zachowane w danych lokalnych.'));return rows}
default:return [];
}}
function wrapped(source,width=78){const out=[];for(const line of source){let rest=String(line);while(rest.length>width){let pos=rest.lastIndexOf(' ',width);if(pos<1)pos=width;out.push(rest.slice(0,pos));rest=rest.slice(pos).trimStart()}out.push(rest)}return out}
function paint(){
 if(!g())return;
 const acts=actions(),body=lines(),menu=ui.screen==='menu',hasSave=!!active(loadDb()).slots.auto;ui.sel=Math.max(0,Math.min(ui.sel,acts.length-1));
 const term=document.querySelector('#terminal'),mobile=document.querySelector('#mobile');
 const button=(a,desktop=false)=>`<button type="button" class="${desktop?'terminal-action'+(menu&&a===acts[ui.sel]?' v2-choice-on':''):a.id==='cont'&&hasSave?'mobile-confirm':''}" data-ui-action="${esc(a.id)}" data-hotkey="${esc(a.key)}"${a.id==='age'?` aria-pressed="${adult()}"`:''}>${desktop?'<span class="key">['+esc(a.key)+']</span> '+esc(a.text):esc(a.text)}</button>`;
 let rows;
 if(menu){
  const left=text=>'  '+esc(text);
  const panel=text=>`<span class="welcomepanel${text.startsWith('*')?' panel-edge':''}">${esc(text)}</span>`;
  rows=[desktopHeader(),'','',panel('*'.repeat(76)),panel(t('Small game. Big business.','Mała gra. Wielki biznes.')),panel(t('A lightweight game with an MS-DOS retro feel.','Lekka gra w klimacie retro MS-DOS.')),panel(t('An independent adaptation inspired by:','Niezależna adaptacja inspirowana:')),panel('Biznesman (1988), M. Cwynar / SAMBA.'),panel(t('Project patrons:','Patroni projektu:')),`<span class="welcomepanel" data-static-patrons>${patrons(true)}</span>`,panel('*'.repeat(76)),left(t('How to play','Jak grać')),...miniHelp().map(left),ui.note?left(ui.note):left(body[0])];
  const by=id=>acts.find(a=>a.id===id);
  rows.push(['age','help','install-app'].map(id=>button(by(id),true)).join('    '),left(body[1]),['rec','set'].map(id=>button(by(id),true)).join('    '),['new','cont'].map(id=>button(by(id),true)).join('    '),helpLinks().map(a=>`<button type="button" class="terminal-action v2-text-link" data-ui-action="${a.id}" data-hotkey="${a.key}">${esc(a.text)}</button>`).join(' | '));
 }else{
  rows=[desktopHeader(),esc(nameOfScreen()),...wrapped(body).slice(0,Math.max(1,22-2-1-acts.length-2-(ui.note?1:0))).map(esc)];
  if(ui.note)rows.push(esc(ui.note));rows.push('');acts.forEach((a,i)=>rows.push((ui.sel===i?'&gt; ':'  ')+button(a,true)));rows.push('',button(act('back','ESC',t('Back','Wstecz')),true));
 }
 while(rows.length<22)rows.push('');rows=rows.slice(0,22);rows.push(esc(REL+' · '+g().status()));
 if(term)term.innerHTML=rows.map((r,i)=>`<span class="terminal-row${i===0?' desktop-header':''}${menu&&i>=3&&i<=10?' panel-row':''}${i===22?' footer-status':''}">${r}</span>`).join('\n');
 const header=`<header class="mobile-head"><strong>BIZNES.EXE</strong><nav class="mobile-sponsors" data-patrons aria-label="${esc(t('Patrons','Patroni'))}">${patrons()}</nav>${button(act('language','L',g().lang==='pl'?'EN':'PL'))}</header>`;
 const intro=menu?`<div class="mobile-manifest"><h1>${esc(t('Small game. Big business.','Mała gra. Wielki biznes.'))}</h1><p>${esc(t('A lightweight game with an MS-DOS retro feel.','Lekka gra w klimacie retro MS-DOS.'))}</p><p>${esc(t('An independent adaptation inspired by:','Niezależna adaptacja inspirowana:'))}<br>Biznesman (1988), M. Cwynar / SAMBA.</p><p>${esc(t('Project patrons:','Patroni projektu:'))}<br><span data-static-patrons>${patrons(true)}</span></p></div><section class="v2-mini-help"><h2>${esc(t('How to play','Jak grać'))}</h2>${miniHelp().map(l=>`<p>${esc(l)}</p>`).join('')}</section>`:`<h1>${esc(nameOfScreen())}</h1>`;
 const dockRow=(ids,cls)=>`<div class="v2-row ${cls}">${ids.map(id=>button(acts.find(a=>a.id===id))).join('')}</div>`;
 if(mobile)mobile.innerHTML=header+`<section class="mobile-list${ui.screen==='result'&&flag('anim',true)?' v2-result-motion':''}">${intro}${body.map(l=>`<p>${esc(l)}</p>`).join('')}${ui.screen==='patrons'?`<p>${patrons(true)}</p>`:''}${ui.note?`<p role="status" class="v2-note">${esc(ui.note)}</p>`:''}${menu?'':'<div class="v2-stack">'+acts.map(a=>button(a)).join('')+'</div>'}</section>${menu?`<nav class="v2-help-links" aria-label="${esc(t('Help and information','Pomoc i informacje'))}">${helpLinks().map(a=>`<button type="button" data-ui-action="${a.id}">${esc(a.text)}</button>`).join('')}</nav>`:''}<small class="mobile-status">${esc(REL+' · '+g().status())}</small>`+(menu?`<section class="mobile-dock v2-menu-dock" aria-label="${esc(t('Main menu','Menu główne'))}">${dockRow(['age','help','install-app'],'v2-row-short')}${dockRow(['rec','set'],'v2-row-secondary')}${dockRow(['new','cont'],'v2-row-primary')}</section>`:`<section class="mobile-dock">${button(act('back','ESC',t('Back','Wstecz')))}</section>`);
 const st=document.querySelector('#save-status');if(st&&ui.note&&st.textContent!==ui.note)st.textContent=ui.note;
 const help=document.querySelector('#desktop-install-help');if(help){help.hidden=true;help.textContent=''}g().fit?.();
}
function open(screen,note=''){ui.screen=screen;ui.sel=0;ui.note=note;paint()}
function start(id,confirmed=false){const db=loadDb(),p=active(db);if(!confirmed&&p.slots.auto&&!p.slots.auto.state.v2Finished){ui.pending={kind:'start',id};open('confirm');return}const shell=globalThis.BX2;shell.playing=false;shell.done=false;shell.profileId=p.id;g().newGame();const s=g().getS();meta.arm(s,{level:id});db.roundSeq=(Number.isSafeInteger(db.roundSeq)?db.roundSeq:0)+1;s.v2Round=p.id+':'+Date.now().toString(36)+':'+db.roundSeq;saveDb(db);shell.playing=true;g().render();}
function resume(){const db=loadDb(),p=active(db),data=p.slots.auto;if(!data)return open('menu',t('No saved game yet.','Nie ma jeszcze zapisu gry.'));const s=meta.resumeState(data.state,p);if(!s)return open('menu',t('This save is invalid. Other data was preserved.','Ten zapis jest nieprawidłowy. Pozostałe dane zachowano.'));const shell=globalThis.BX2;shell.playing=false;shell.done=false;shell.profileId=p.id;g().adopt(s);shell.playing=true;g().render();shell.onHome(s)}
function beep(){if(!flag('sound'))return;try{const AC=globalThis.AudioContext||globalThis.webkitAudioContext;if(!AC)return;const c=new AC(),o=c.createOscillator(),v=c.createGain();v.gain.value=.03;o.connect(v);v.connect(c.destination);o.start();o.stop(c.currentTime+.05);o.onended=()=>c.close()}catch{}}
function finish(s,o){const db=loadDb(),p=db.profiles.find(p=>p.id===globalThis.BX2.profileId)||active(db),id=meta.roundId(s,p),l=s.v2Level||meta.level(s.v2Rank).id;p.roundResults??={};if(p.roundResults[id]){const old=p.roundResults[id].result;ui.result={...old,level:old.level||meta.level(old.rank).id};if(!p.roundResults[id].recorded){meta.addRecord(p,ui.result.level,{score:ui.result.score,days:Math.min(o.days,o.limit),date:date()});p.roundResults[id].recorded=true;}}else{ui.result={level:l,score:Math.round(o.gain),o};meta.addRecord(p,l,{score:o.gain,days:Math.min(o.days,o.limit),date:date()});p.roundResults[id]={recorded:true,result:ui.result};beep()}s.v2Round=id;s.v2Finished=true;meta.writeSlot(p,'auto',s,{date:date(),at:Date.now()});saveDb(db);globalThis.BX2.playing=false;globalThis.BX2.done=true;g().closePopup?.();g().setView('welcome');open('result')}
function go(id){
 if(id==='back'){const screen=ui.screen;const next=screen==='confirm'?(ui.pending?.kind==='wipe'?'set':ui.pending?.kind==='age'?'menu':'levels'):['play','about','patrons','licenses'].includes(screen)?'help':'menu';ui.pending=null;return open(next)}
 if(id.startsWith('record-')){ui.recLevel=meta.level(id.slice(7)).id;return open('rec')}
 if(id==='new')return open('levels');
 if(['menu','set','rec','help','play','about','patrons','licenses'].includes(id))return open(id);
 if(id==='cont')return resume();
 if(id==='age'){if(adult()){ageEnabled=false;try{localStorage.setItem('bx2r-adult','off')}catch{ui.note=t('Links disabled for this session. The choice could not be saved.','Linki wyłączone w tej sesji. Nie można zapisać wyboru.')}return paint()}ui.pending={kind:'age'};return open('confirm')}
 if(id.startsWith('level-')&&meta.LEVELS.some(l=>l.id===id.slice(6)))return start(id.slice(6));
 if(id==='again')return start(ui.result?.level||'handlarz');
 if(id==='confirm-yes'&&ui.pending){
  const pending=ui.pending;ui.pending=null;if(pending.kind==='start')return start(pending.id,true);
  if(pending.kind==='age'){try{localStorage.setItem('bx2r-adult','on')}catch{return open('menu',t('Cannot remember the choice. External links remain off.','Nie można zapamiętać wyboru. Linki pozostają wyłączone.'))}ageEnabled=true;return open('menu')}
  const db=loadDb();active(db).slots={auto:null};saveDb(db);return open('set',t('Saved game deleted.','Zapis gry usunięty.'));
 }
 if(id==='wipe'){ui.pending={kind:'wipe'};return open('confirm')}
 if(id==='language')return g().select('language');
 if(id==='style'){g().cycleStyle();return g().render(false)}
 if(id==='hand')return g().setHand(g().hand==='left'?'right':'left');
 if(['contrast','sound','anim'].includes(id)){try{localStorage.setItem('bx2r-'+id,flag(id,id==='anim')?'off':'on')}catch{}return g().render(false)}
 if(id==='install-app')return installGame();
 if(id==='privacy'&&globalThis.location)location.href='privacy.html';
}
function onKey(key){
 if(key==='L')return go('language');if(key==='ESC')return go('back');const acts=actions();
 if(key==='UP'||key==='DOWN'){ui.sel+=key==='DOWN'?1:-1;return paint()}
 if(key==='ENTER')return acts[ui.sel]&&go(acts[ui.sel].id);
 const a=acts.find(a=>a.key===key)||(ui.screen==='menu'?helpLinks().find(a=>a.key===key):null);if(a)return go(a.id);
}
globalThis.BX2={adult,header:desktopHeader,patrons:visiblePatrons,onInstall:installGame,playing:false,done:false,profileId:null,onKey,onAction:go,onWelcome(){paint()},onQuit(){this.playing=false;this.done=false;ui.screen='menu';ui.note=''},onSave(s){const db=loadDb(),p=db.profiles.find(p=>p.id===this.profileId)||active(db);meta.writeSlot(p,'auto',s,{date:date(),at:Date.now()});db.active=p.id;return saveDb(db)},onHome(s){if(this.playing&&!this.done){const o=meta.outcome(s);if(o.ended||s.v2Finished)finish(s,o)}},onReady(){const db=loadDb();if(!db.legacy){let raw;try{raw=localStorage.getItem('bx-save')}catch{}if(raw)meta.importLegacy(db,g().getS());else db.legacy=true;}saveDb(db);startPatrons();paint()}};
})();
