const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
(async()=>{
 const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
 const source=fs.readFileSync('public/account-storage.js','utf8'),origin='https://money.test';
 function open(user){
  let sent;const window={fetch:async r=>{sent=r;return Response.json({ok:true})}};
  class BrowserRequest extends Request{constructor(input,options){super(typeof input==='string'?new URL(input,origin):input,options)}}
  vm.runInNewContext(source,{window,document:{querySelector:()=>({content:encodeURIComponent(user)})},localStorage:storage,sessionStorage:storage,Request:BrowserRequest,Headers,URL,location:{origin}});
  return {window,sent:()=>sent};
 }
 const a=open('firebase:alice'),b=open('firebase:bob');
 a.window.MomentumStorage.setItem('moneyDailyV1','alice-private');a.window.MomentumSessionStorage.setItem('moneyPlaidLink','alice-oauth');
 assert.equal(b.window.MomentumStorage.getItem('moneyDailyV1'),null);assert.equal(b.window.MomentumSessionStorage.getItem('moneyPlaidLink'),null);
 b.window.MomentumStorage.setItem('moneyDailyV1','bob-private');assert.equal(a.window.MomentumStorage.getItem('moneyDailyV1'),'alice-private');
 await a.window.fetch('/api/log',{method:'PUT',body:'draft'});assert.equal(a.sent().headers.get('X-Momentum-Account'),'firebase:alice');assert.equal(await a.sent().text(),'draft');
 await b.window.fetch('/api/plaid/data');assert.equal(b.sent().headers.get('X-Momentum-Account'),'firebase:bob');
 await a.window.fetch('/api/auth/config');assert.equal(a.sent().headers.has('X-Momentum-Account'),false);
 console.log('Passed: two users on one device retain separate drafts and bank OAuth state; account API calls identify their originating account.');
})().catch(e=>{console.error(e);process.exitCode=1});
