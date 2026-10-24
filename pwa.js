(()=>{'use strict';
  let prompt=null,busy=false,ready=false,failed=false,help='',installed=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const emit=()=>window.dispatchEvent(new Event('pwa-state'));
  window.BiznesPWA={
    status:lang=>location.protocol==='file:'?'Offline':ready?(lang==='pl'?'Offline gotowe':'Offline ready'):failed?(lang==='pl'?'Offline niedostępne':'Offline unavailable'):(lang==='pl'?'Pobieranie offline…':'Preparing offline…'),
    message:lang=>help==='added'?(lang==='pl'?'Gra została dodana. Uruchom ją z ikony na pulpicie lub ekranie głównym.':'The game was added. Launch it from your desktop or home screen.'):help==='installed'?(lang==='pl'?'Gra jest już uruchomiona jako aplikacja.':'Already running as an app.'):help==='ios'?(lang==='pl'?'W Safari wybierz Udostępnij → Dodaj do ekranu początkowego → Dodaj. Poczekaj na „Offline gotowe”, zanim wyłączysz internet.':'In Safari choose Share → Add to Home Screen → Add. Wait for “Offline ready” before disconnecting.'):help==='manual'?(lang==='pl'?'W menu przeglądarki wybierz Zainstaluj aplikację lub Dodaj do ekranu początkowego. Jeśli brak opcji, otwórz grę w Safari, Chrome lub Edge.':'Choose Install app or Add to Home Screen in the browser menu. If unavailable, open the game in Safari, Chrome or Edge.'):help==='local'?(lang==='pl'?'Instalacja wymaga publicznego adresu HTTPS gry.':'Installation requires the HTTPS game address.'):'',
    async install(){
      if(busy)return;
      busy=true;
      try{
        if(installed)help='installed';
        else if(location.protocol==='file:')help='local';
        else if(prompt){
          const request=prompt;prompt=null;
          // Keep prompt() inside the original user gesture.
          await request.prompt();
          const choice=await request.userChoice;
          help=choice?.outcome==='accepted'?'added':'manual';
        }else help=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)?'ios':'manual';
      }catch{help='manual'}
      finally{busy=false;emit()}
    }
  };
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();prompt=e;emit()});
  window.addEventListener('appinstalled',()=>{installed=true;help='added';emit()});
  if('serviceWorker' in navigator&&location.protocol!=='file:'){
    navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(()=>navigator.serviceWorker.ready).then(()=>{ready=true;emit()}).catch(()=>{failed=true;emit()});
  }else{failed=true;}
})();
