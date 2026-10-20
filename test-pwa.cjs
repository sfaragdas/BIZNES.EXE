const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('pwa.js','utf8');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function boot(registration){
  const events=[],listeners={};
  const ctx={location:{protocol:'https:'},matchMedia:()=>({matches:false}),Event:class{constructor(type){this.type=type}},
    navigator:{userAgent:'test',serviceWorker:{register:()=>Promise.resolve(registration),ready:Promise.resolve({active:{state:'activated'}})}},
    dispatchEvent:e=>events.push(e.type),addEventListener:(name,handler)=>listeners[name]=handler};
  ctx.window=ctx;vm.runInNewContext(source,ctx);return {ctx,events};
}
(async()=>{
  let changed;const worker={state:'installing',addEventListener:(name,handler)=>changed=handler,removeEventListener(){}};
  const {ctx,events}=boot({installing:worker});await flush();
  assert.equal(ctx.BiznesPWA.status('en'),'Preparing offline…');
  worker.state='activated';changed();await flush();
  assert.equal(ctx.BiznesPWA.status('pl'),'Offline gotowe');assert.ok(events.includes('pwa-state'));
  const active=boot({active:{state:'activated',addEventListener(){},removeEventListener(){}}});await flush();
  assert.equal(active.ctx.BiznesPWA.status('en'),'Offline ready');
  let failedState;const failedWorker={state:'installing',addEventListener:(name,handler)=>failedState=handler,removeEventListener(){}};
  const failed=boot({installing:failedWorker});await flush();failedWorker.state='redundant';failedState();await flush();
  assert.equal(failed.ctx.BiznesPWA.status('en'),'Offline unavailable');
  const absent=boot({});await flush();assert.equal(absent.ctx.BiznesPWA.status('en'),'Offline unavailable');
  await ctx.BiznesPWA.install();assert.match(ctx.BiznesPWA.message('en'),/browser menu/);
  console.log('PASS PWA: own worker readiness, activation, failed install, status events and install help.');
})().catch(error=>{console.error(error);process.exitCode=1});
