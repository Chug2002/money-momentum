const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={Response,Request,Headers,URL};vm.createContext(context);vm.runInContext(fs.readFileSync('cloudflare/demo-worker.mjs','utf8').replace('export default','worker='),context);
(async()=>{
 const requests=[],env={ASSETS:{async fetch(request){requests.push(request.url);return new Response('SAMPLE',{headers:{'Content-Type':'text/html'}})}}};
 let response=await context.worker.fetch(new Request('https://demo.test/'),env);assert.equal(await response.text(),'SAMPLE');assert.equal(requests[0],'https://demo.test/welcome.html');assert(response.headers.get('Content-Security-Policy').includes("frame-ancestors 'none'"));
 response=await context.worker.fetch(new Request('https://demo.test/demo'),env);assert.equal(requests[1],'https://demo.test/demo.html');
 for(const path of ['/api/log','/api/plaid/data','/api/notifications/settings']){response=await context.worker.fetch(new Request('https://demo.test'+path,{headers:{'oai-authenticated-user-id':'fake'}}),env);assert.equal(response.status,403);}
 response=await context.worker.fetch(new Request('https://demo.test/account'),env);assert.equal(response.status,302);assert(response.headers.get('Location').startsWith('https://money-momentum.'));
 response=await context.worker.fetch(new Request('https://demo.test/',{method:'POST'}),env);assert.equal(response.status,405);assert.equal(requests.length,2);
 console.log('Passed: public sample route, denied private APIs and spoofed identity, private-account redirect, no public writes, security headers.');
})().catch(error=>{console.error(error);process.exitCode=1;});
