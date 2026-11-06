const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
(async()=>{
 const nodes=new Map(),element=id=>{if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',disabled:false,focus(){}});return nodes.get(id)};
 const user={emailVerified:false,getIdToken:async()=> 'identity-token'};
 let verificationFails=false,verificationSent=0,providerError=null,signedOut=0,created=0,sessionStatus=200,destination='';
 const context={document:{getElementById:element,querySelectorAll:()=>[...nodes.values()]},location:{origin:'https://money.test',pathname:'/signup',assign:path=>destination=path},
  initializeApp:x=>x,getAuth:()=>({}),setPersistence:async()=>{},inMemoryPersistence:{},GoogleAuthProvider:class{},signInWithPopup:async()=>({user}),
  createUserWithEmailAndPassword:async()=>{if(providerError)throw providerError;created++;return {user}},signInWithEmailAndPassword:async()=>({user}),
  sendEmailVerification:async()=>{verificationSent++;if(verificationFails)throw {code:'auth/too-many-requests'}},sendPasswordResetEmail:async()=>{},signOut:async()=>{signedOut++},
  fetch:async path=>path.endsWith('/config')?{ok:true,json:async()=>({configured:true,config:{}})}:{ok:sessionStatus===200,json:async()=>({error:'Please wait a minute before trying again.'})}};
 vm.runInNewContext(fs.readFileSync('public/firebase-login.js','utf8').replace(/^import .*;\r?\n/gm,''),context);
 await new Promise(setImmediate);
 assert.equal(element('loginTitle').textContent,'Create your account.');assert.equal(element('passwordHint').hidden,false);assert.equal(element('password').minLength,15);
 element('email').value='test@example.test';element('password').value='short';const submit=()=>element('emailForm').onsubmit({preventDefault(){}});
 await submit();assert.equal(created,0);assert.match(element('loginStatus').textContent,/at least 15/);
 element('password').value='long-enough-test-password';element('confirmPassword').value='different-password';await submit();assert.equal(created,0);assert.match(element('loginStatus').textContent,/passwords do not match/);element('confirmPassword').value='long-enough-test-password';verificationFails=true;await submit();assert.equal(created,1);assert.match(element('loginStatus').textContent,/account exists.*verification email could not be sent/);assert.equal(signedOut,1);assert.equal(destination,'');
 verificationFails=false;await submit();assert.match(element('loginStatus').textContent,/Check your inbox and spam/);
 providerError={code:'auth/email-already-in-use'};await submit();assert.match(element('loginStatus').textContent,/already uses this email/);element('switchMode').onclick();await submit();assert.match(element('loginStatus').textContent,/still needs verification/);assert.equal(verificationSent,2);element('switchMode').onclick();element('confirmPassword').value='long-enough-test-password';
 providerError=null;user.emailVerified=true;sessionStatus=429;await submit();assert.equal(element('loginStatus').textContent,'Please wait a minute before trying again.');assert.equal(signedOut,4);
 sessionStatus=200;await submit();assert.equal(destination,'/account');assert.equal(element('emailSubmit').disabled,false);
 console.log('Passed: direct signup, visible password requirements, failed verification delivery after account creation, duplicate email guidance, server errors, provider sign-out, successful account redirect.');
})().catch(e=>{console.error(e);process.exitCode=1});
