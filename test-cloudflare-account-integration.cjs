const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),{DatabaseSync}=require('node:sqlite');
(async()=>{
 const auth=await import('./cloudflare/auth.mjs'),sql=new DatabaseSync(':memory:');
 for(const file of fs.readdirSync('drizzle').filter(name=>name.endsWith('.sql')))sql.exec(fs.readFileSync('drizzle/'+file,'utf8'));
 sql.exec(fs.readFileSync('cloudflare/auth-schema.sql','utf8'));
 const DB={prepare(query){return {values:[],bind(...values){this.values=values;return this},async first(){return sql.prepare(query).get(...this.values)||null},async run(){return {meta:{changes:Number(sql.prepare(query).run(...this.values).changes)}}}}}};
 const origin='https://money.test',env={DB,APP_ORIGIN:origin,ASSETS:{fetch:async()=>new Response('asset')}};
 const load=(file,modules={})=>{const scope={exports:{},require:name=>{if(name in modules)return modules[name];throw Error('Unexpected import '+name)},Request,Response,Headers,URL,Date,JSON,Number};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,scope);return scope.exports};
 const log=load('app/api/log/route.ts',{'cloudflare:workers':{env},'../../log-validation':load('app/log-validation.ts'),'../../phone-validation':load('app/phone-validation.ts')});
 const worker=load('cloudflare/full-worker.ts',{'./auth.mjs':auth,'../app/api/log/route':log,'../app/plaid-server':{bankRoute:async()=>Response.json({ok:true})},'../app/notifications-server':{notificationsRoute:async()=>Response.json({ok:true})},'../app/ui':{html:'<!doctype html><html><head></head><body>Account</body></html>'}}).default;
 const tokens={alice:'a'.repeat(64),bob:'b'.repeat(64)};
 for(const [name,token] of Object.entries(tokens)){
  sql.prepare('INSERT INTO auth_users(id,email) VALUES(?,?)').run('firebase:'+name,name+'@example.test');
  sql.prepare('INSERT INTO auth_sessions(hash,user_id,expires) VALUES(?,?,?)').run(await auth.hash(token),'firebase:'+name,Date.now()+60000);
 }
 const call=(path,user,method='GET',body,extra={})=>worker.fetch(new Request(origin+path,{method,headers:{...(user?{Cookie:'__Host-momentum-session='+tokens[user],'X-Momentum-Account':'firebase:'+user}:{}),...(method!=='GET'?{Origin:origin,'Content-Type':'application/json'}:{}),...extra},body:body?JSON.stringify(body):undefined}),env);
 const bundle={log:{start:'2026-11-01',opening:{checking:12345,savings:0,spending:0,capital:0,amex:0,gas:0},limits:{capital:0,amex:0,gas:0},entries:[]},phone:null,checkins:[]};
 assert.equal((await call('/api/log',null)).status,401);
 assert.equal((await call('/api/log','alice','PUT',{bundle,version:0})).status,200);
 assert.equal((await (await call('/api/log','alice')).json()).bundle.log.opening.checking,12345);
 assert.equal((await (await call('/api/log','bob')).json()).bundle,null,'another signed-in account cannot read Alice’s records');
 assert.equal((await call('/api/log','bob','PUT',{bundle,version:0},{'X-Momentum-Account':'firebase:alice'})).status,409,'old tabs cannot save into the newly signed-in account');
 const forged=await (await call('/api/log','bob','GET',null,{'oai-authenticated-user-id':'firebase:alice'})).json();assert.equal(forged.user_id,'firebase:bob');assert.equal(forged.bundle,null);
 assert.equal((await call('/api/log','alice','PUT',{bundle,version:0})).status,409,'stale version cannot overwrite an existing save');
 assert.equal((await call('/api/log','alice','PUT',{bundle,version:1},{Origin:'https://other.test'})).status,403);
 assert.equal((await call('/api/log','alice','PUT',{bundle:{log:{}},version:1})).status,400);
 const logout=await call('/api/auth/logout','alice','POST',{}, {Accept:'text/html'});assert.equal(logout.status,303);assert(logout.headers.get('Set-Cookie').includes('Max-Age=0'));
 assert.equal((await call('/api/log','alice')).status,401);assert.equal((await call('/account','alice')).headers.get('Location'),origin+'/login');
 assert.equal((await call('/api/log','bob')).status,200,'logging out Alice leaves Bob’s session valid');
 console.log('Passed: real session-to-Worker-to-validator-to-SQLite save/read path, two-account isolation, spoof rejection, stale-tab and version conflicts, CSRF, validation, session revocation, and independent sessions. Synthetic local records only.');
})().catch(error=>{console.error(error);process.exitCode=1});
