const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync('public/bank-link.js','utf8');
const interval=300000;
const flush=async()=>{for(let i=0;i<12;i++)await new Promise(resolve=>setImmediate(resolve));};
async function app({fresh=false,hidden=false,online=true,configured=true,empty=false,fail=false,hold=false}={}){
  let now=1793808000000,release;
  const windowEvents={},documentEvents={},timers=[],elements=new Map(),calls=[];
  const element=()=>({innerHTML:'',textContent:'',className:'',before(){},click(){},scrollIntoView(){}});
  const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);};
  const document={hidden,getElementById:get,createElement:element,head:{append(){}},addEventListener:(event,callback)=>documentEvents[event]=callback};
  const navigator={onLine:online};
  const window={addEventListener:(event,callback)=>windowEvents[event]=callback,dispatchEvent(){}};
  let data={items:empty?[]:[{id:'bank-one',accounts:[],synced_at:fresh?now/1000:(now-86400000)/1000}],transactions:[]};
  const gate=hold?new Promise(resolve=>release=resolve):null;
  async function fetch(url,options){
    const action=url.split('/').pop();calls.push(action);
    if(action==='sync'){
      if(gate)await gate;
      if(fail)throw Error('Bank temporarily unavailable');
      data={...data,items:data.items.map(item=>({...item,synced_at:now/1000}))};
    }
    return {ok:true,json:async()=>structuredClone(action==='status'?{configured,environment:'sandbox'}:data)};
  }
  class Clock extends Date{static now(){return now;}}
  vm.runInNewContext(code,{document,navigator,window,fetch,Date:Clock,Intl,URLSearchParams,location:{search:''},CustomEvent:class{},setInterval:callback=>timers.push(callback)});
  await flush();
  return {calls,window,document,navigator,elements,advance:ms=>now+=ms,release:()=>release?.(),focus:()=>windowEvents.focus(),online:()=>windowEvents.online(),visible:()=>documentEvents.visibilitychange(),tick:()=>timers[0]()};
}
(async()=>{
  let a=await app();assert.equal(a.calls.filter(x=>x==='sync').length,1,'stale banks refresh on opening');
  a.focus();a.online();a.visible();await flush();assert.equal(a.calls.filter(x=>x==='sync').length,1,'events share cooldown');
  a.advance(interval);a.document.hidden=true;a.tick();await flush();assert.equal(a.calls.filter(x=>x==='sync').length,1,'hidden tabs do not poll');
  a.document.hidden=false;await a.visible();await flush();assert.equal(a.calls.filter(x=>x==='sync').length,2,'returning to foreground refreshes stale data');
  a.advance(interval);await a.tick();assert.equal(a.calls.filter(x=>x==='sync').length,3,'visible open app refreshes periodically');
  a=await app({fresh:true});assert(!a.calls.includes('sync'),'fresh cached data avoids an unnecessary call');await a.window.MomentumBanks.refresh();assert(a.calls.includes('sync'),'manual refresh remains available');
  a=await app({online:false});assert(!a.calls.includes('sync'));a.navigator.onLine=true;await a.online();assert(a.calls.includes('sync'),'reconnecting refreshes stale data');
  a=await app({hidden:true});assert(!a.calls.includes('sync'));a.document.hidden=false;await a.visible();assert(a.calls.includes('sync'));
  for(const options of [{configured:false},{empty:true}]){a=await app(options);a.focus();await flush();assert(!a.calls.includes('sync'),'no configured connection means no sync');}
  a=await app({hold:true});a.focus();a.visible();await flush();assert.equal(a.calls.filter(x=>x==='sync').length,1,'concurrent triggers do not overlap');a.release();await flush();
  a=await app({fail:true});assert.equal(a.window.MomentumBanks.snapshot().items.length,1,'failure retains cached bank data');assert(a.elements.get('bankMessage').textContent.includes('unavailable'));a.focus();await flush();assert.equal(a.calls.filter(x=>x==='sync').length,1,'failed attempts are throttled');a.advance(interval);await a.tick();assert.equal(a.calls.filter(x=>x==='sync').length,2,'failed updates retry later');
  console.log('Passed: automatic opening, foreground, timed and online refresh; freshness and retry cooldown; no hidden/offline polling; no overlap; manual override; cached data on errors.');
})().catch(error=>{console.error(error);process.exitCode=1;});
