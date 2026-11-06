const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
(async()=>{
 const nodes=new Map(),element=id=>{if(!nodes.has(id))nodes.set(id,{value:'',checked:false,hidden:false,disabled:false,textContent:'',children:[],focus(){},append(x){this.children.push(x);this.value||=x.value},replaceChildren(){this.children=[];this.value=''},getContext(){return {clearRect(){}}}});return nodes.get(id)};
 let challenged=true,codeValid=false,enrolled=false,enrollCalls=0,resolveCalls=0,qrCalls=0,signedOut=0,destination='',requests=[];
 const user={email:'learner@example.test',emailVerified:true,getIdToken:async()=> 'synthetic-signed-token'};
 const factor={factorId:'totp',uid:'authenticator-1',displayName:'My authenticator'};
 const resolver={hints:[factor],resolveSignIn:async assertion=>{resolveCalls++;assert.equal(assertion.id,factor.uid);if(!codeValid)throw {code:'auth/invalid-verification-code'};return {user}}};
 const multifactor={get enrolledFactors(){return enrolled?[factor]:[]},getSession:async()=> 'synthetic-enrollment-session',enroll:async assertion=>{enrollCalls++;assert.equal(assertion.secret.secretKey,'SYNTHETIC-NOT-A-REAL-KEY');if(!codeValid)throw {code:'auth/invalid-verification-code'};enrolled=true}};
 const context={document:{getElementById:element,querySelectorAll:()=>[...nodes.values()],createElement:()=>({value:'',textContent:''})},location:{origin:'https://money.test',pathname:'/login',search:'',assign:path=>destination=path},
  initializeApp:x=>x,getAuth:()=>({}),setPersistence:async()=>{},inMemoryPersistence:{},GoogleAuthProvider:class {setCustomParameters(){}},
  signInWithEmailAndPassword:async()=>{if(challenged)throw {code:'auth/multi-factor-auth-required'};return {user}},signInWithPopup:async()=>{if(challenged)throw {code:'auth/multi-factor-auth-required'};return {user}},
  createUserWithEmailAndPassword:async()=>({user}),sendEmailVerification:async()=>{},sendPasswordResetEmail:async()=>{},signOut:async()=>{signedOut++},multiFactor:()=>multifactor,getMultiFactorResolver:()=>resolver,
  TotpMultiFactorGenerator:{FACTOR_ID:'totp',assertionForSignIn:(id,code)=>({id,code}),assertionForEnrollment:(secret,code)=>({secret,code}),generateSecret:async()=>({secretKey:'SYNTHETIC-NOT-A-REAL-KEY',generateQrCodeUrl:()=> 'otpauth://synthetic-only'})},QRCode:{toCanvas:async()=>{qrCalls++}},
  fetch:async(path,options)=>{if(path.endsWith('/config'))return {ok:true,json:async()=>({configured:true,config:{},totpEnabled:true})};requests.push({path,body:JSON.parse(options.body)});return {ok:true,json:async()=>({ok:true})}}};
 vm.runInNewContext(fs.readFileSync('public/firebase-login.js','utf8').replace(/^import .*;\r?\n/gm,''),context);await new Promise(setImmediate);
 assert.equal(element('setupMfaLabel').hidden,false);
 const primary=()=>element('emailForm').onsubmit({preventDefault(){}}),submit=()=>element('mfaForm').onsubmit({preventDefault(){}});
 await primary();assert.equal(element('mfaPanel').hidden,false);assert.equal(requests.length,0,'no session before second factor');
 element('mfaCode').value='123';await submit();assert.equal(resolveCalls,0,'malformed code stays local');
 element('mfaCode').value='123456';await submit();assert.match(element('loginStatus').textContent,/did not match/);assert.equal(requests.length,0);assert.equal(element('mfaPanel').hidden,false,'wrong code can retry');
 codeValid=true;element('mfaCode').value='234567';await submit();assert.equal(destination,'/account');assert.equal(requests[0].path,'/api/auth/session');assert.equal(element('mfaCode').value,'');
 destination='';await element('googleLogin').onclick();assert.equal(element('mfaPanel').hidden,false,'Google sign-in also handles the MFA challenge');await element('mfaCancel').onclick();assert.equal(destination,'');assert.equal(element('mfaPanel').hidden,true);
 challenged=false;enrolled=false;element('setupMfa').checked=true;requests=[];await primary();assert.equal(qrCalls,1);assert.equal(element('mfaSecret').textContent,'SYNTHETIC-NOT-A-REAL-KEY');assert.equal(requests.length,0);assert.equal(enrollCalls,0,'displaying a setup key does not enable MFA');
 codeValid=false;element('mfaCode').value='123456';await submit();assert.equal(enrolled,false);assert.equal(requests.length,0);
 codeValid=true;element('mfaCode').value='345678';await submit();assert.equal(enrolled,true);assert.equal(requests[0].path,'/api/auth/revoke-sessions');assert.equal(destination,'','enrollment requires a fresh MFA login');assert.equal(element('mfaSecret').textContent,'');assert.equal(element('mfaPanel').hidden,true);assert.match(element('loginStatus').textContent,/enabled.*Sign in again/);assert(signedOut>=3);assert(!JSON.stringify(requests).includes('SYNTHETIC-NOT-A-REAL-KEY'),'setup secret never goes to app APIs');
 enrolled=false;await primary();assert.equal(destination,'/account','accounts without enrollment still sign in normally');
 console.log('Passed: email and Google MFA challenges, no early session, code validation and retry, enrollment confirmation, session revocation, secret cleanup, cancellation, and optional enrollment.');
})().catch(error=>{console.error(error);process.exitCode=1});
