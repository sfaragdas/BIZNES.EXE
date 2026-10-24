// PWA installation behavior without depending on a browser's availability of native prompts.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const pwaSource=fs.readFileSync(require('node:path').join(__dirname,'pwa.js'),'utf8');
function boot(options={}){
 const handlers={},events=[];
 const context={matchMedia:()=>({matches:!!options.standalone}),navigator:{userAgent:options.ua||'Chrome',platform:options.platform||'',maxTouchPoints:options.touch||0},location:{protocol:options.protocol||'https:'},Event:class{constructor(type){this.type=type}}};
 context.window={addEventListener:(name,fn)=>handlers[name]=fn,dispatchEvent:e=>events.push(e.type)};
 vm.runInNewContext(pwaSource,context);
 return {api:context.window.BiznesPWA,handlers,events};
}
(async()=>{
 const chrome=boot();await chrome.api.install();assert.match(chrome.api.message('pl'),/menu przeglądarki/);
 const ios=boot({ua:'iPhone'});await ios.api.install();assert.match(ios.api.message('pl'),/Safari/);
 const ipad=boot({platform:'MacIntel',touch:5});await ipad.api.install();assert.match(ipad.api.message('en'),/Safari/);
 const local=boot({protocol:'file:'});await local.api.install();assert.match(local.api.message('pl'),/HTTPS/);
 const standalone=boot({standalone:true});await standalone.api.install();assert.match(standalone.api.message('pl'),/już uruchomiona/);
 for(const outcome of ['accepted','dismissed']){
  const native=boot();let prevented=false,prompts=0;
  native.handlers.beforeinstallprompt({preventDefault(){prevented=true},prompt(){prompts++},userChoice:Promise.resolve({outcome})});
  await native.api.install();assert.equal(prevented,true);assert.equal(prompts,1);
  assert.match(native.api.message('pl'),outcome==='accepted'?/została dodana/:/menu przeglądarki/);
  assert.ok(native.events.includes('pwa-state'));
 }
 const broken=boot();broken.handlers.beforeinstallprompt({preventDefault(){},prompt(){throw Error('not allowed')}});
 await broken.api.install();assert.match(broken.api.message('en'),/browser menu/);
 const added=boot();added.handlers.appinstalled();assert.match(added.api.message('pl'),/została dodana/);
 const busy=boot();let prompts=0,resolveChoice;
 busy.handlers.beforeinstallprompt({preventDefault(){},prompt(){prompts++},userChoice:new Promise(resolve=>resolveChoice=resolve)});
 const first=busy.api.install();await busy.api.install();assert.equal(prompts,1);resolveChoice({outcome:'dismissed'});await first;
 console.log('PASS PWA: native prompt, fallback, Safari/iPad, installed, cancellation, errors and repeated clicks.');
})().catch(error=>{console.error(error);process.exitCode=1});
