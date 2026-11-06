import {initializeApp} from 'firebase/app';
import {getAuth,setPersistence,inMemoryPersistence,GoogleAuthProvider,signInWithPopup,signInWithEmailAndPassword,createUserWithEmailAndPassword,sendEmailVerification,sendPasswordResetEmail,signOut,multiFactor,getMultiFactorResolver,TotpMultiFactorGenerator} from 'firebase/auth';
import QRCode from 'qrcode';
const $=id=>document.getElementById(id);let auth,mode='login',totpEnabled=false,resolver=null,enrollmentUser=null,totpSecret=null;
const status=message=>$('loginStatus').textContent=message;
const busy=value=>{document.querySelectorAll('button,input,select').forEach(x=>x.disabled=value);if(!value&&!$('mfaPanel').hidden)$('mfaCode').focus()};
class LoginError extends Error {}
function errorMessage(error){
 if(error instanceof LoginError)return error.message;
 return ({
  'auth/popup-closed-by-user':'Google sign-in was closed. You can try again.',
  'auth/popup-blocked':'Allow the sign-in popup, then try again.',
  'auth/invalid-credential':'Check your email and password and try again. If you registered with Google, choose Continue with Google.',
  'auth/email-already-in-use':'An account already uses this email. Choose Already have an account? Sign in below. If it needs verification, sign in to see how to resend the link. If you originally used Google for this email, choose Continue with Google.',
  'auth/invalid-email':'Enter a valid email address.',
  'auth/weak-password':'Use a password with at least 15 characters.',
  'auth/password-does-not-meet-requirements':'Choose a password that meets the displayed requirements.',
  'auth/too-many-requests':'Too many attempts. Please wait before trying again.',
  'auth/invalid-verification-code':'That code did not match. Use the current six-digit code from your authenticator app.',
  'auth/invalid-totp-code':'That code did not match. Use the current six-digit code from your authenticator app.',
  'auth/code-expired':'This sign-in attempt expired. Cancel and sign in again.',
  'auth/invalid-multi-factor-session':'This sign-in attempt expired. Cancel and sign in again.',
  'auth/multi-factor-info-not-found':'This authenticator is no longer registered. Cancel and sign in again.',
  'auth/requires-recent-login':'For your security, cancel and sign in again before setting up an authenticator.',
  'auth/unsupported-first-factor':'This sign-in method cannot set up an authenticator. Try your verified email or Google account.',
  'auth/network-request-failed':'The sign-in service could not be reached. Check your connection and try again.',
  'auth/user-disabled':'This account has been disabled. Contact the app owner.',
  'auth/unauthorized-domain':'This website’s address still needs to be approved in the sign-in settings.',
  'auth/operation-not-allowed':'This sign-in method has not been enabled yet.',
  'auth/configuration-not-found':'The app’s sign-in provider setup needs to be checked.',
  'auth/invalid-api-key':'The app’s sign-in connection settings need to be checked.',
  'auth/account-exists-with-different-credential':'This email already uses another sign-in method. Try Continue with Google.'
 })[error.code]||('Sign-in could not be completed. Please try again.'+(typeof error.code==='string'&&/^auth\/[a-z-]+$/.test(error.code)?' ('+error.code+')':''));
}
function clearMfa(){
 resolver=null;enrollmentUser=null;totpSecret=null;$('mfaCode').value='';$('mfaSecret').textContent='';
 const canvas=$('mfaQr');canvas.getContext?.('2d')?.clearRect(0,0,canvas.width,canvas.height);
 $('mfaPanel').hidden=true;$('primarySignIn').hidden=false;$('mfaEnrollment').hidden=true;
 $('password').value='';$('confirmPassword').value='';
}
async function handleSignInError(error){
 if(error.code!=='auth/multi-factor-auth-required'){status(errorMessage(error));return}
 resolver=getMultiFactorResolver(auth,error);
 const factors=resolver.hints.filter(f=>f.factorId===TotpMultiFactorGenerator.FACTOR_ID);
 if(!factors.length){clearMfa();await signOut(auth);status('This account uses a second factor that this app does not support. Contact the app owner for recovery.');return}
 $('mfaFactor').replaceChildren();for(const factor of factors){const option=document.createElement('option');option.value=factor.uid;option.textContent=factor.displayName||'Authenticator app';$('mfaFactor').append(option)}
 $('mfaFactorLabel').hidden=factors.length<2;$('mfaFactor').hidden=factors.length<2;
 $('password').value='';$('primarySignIn').hidden=true;$('mfaPanel').hidden=false;$('mfaEnrollment').hidden=true;
 $('mfaTitle').textContent='Enter your authenticator code.';$('mfaSubmit').textContent='Verify and sign in';status('Open your authenticator app and enter its current six-digit code.');$('mfaCode').focus();
}
async function startEnrollment(user){
 enrollmentUser=user;$('password').value='';$('confirmPassword').value='';
 const session=await multiFactor(user).getSession();totpSecret=await TotpMultiFactorGenerator.generateSecret(session);
 $('enrollmentEmail').textContent=user.email;$('mfaSecret').textContent=totpSecret.secretKey;
 await QRCode.toCanvas($('mfaQr'),totpSecret.generateQrCodeUrl(user.email,'Money Momentum'),{width:224,margin:2});
 $('primarySignIn').hidden=true;$('mfaPanel').hidden=false;$('mfaEnrollment').hidden=false;
 $('mfaFactorLabel').hidden=true;$('mfaFactor').hidden=true;$('mfaTitle').textContent='Set up your authenticator.';$('mfaSubmit').textContent='Confirm and enable MFA';
 status('Scan the code or add the setup key in your authenticator app. Then enter its six-digit code.');$('mfaCode').focus();
}
async function finish(user,sendVerification=false){
 if(!user.emailVerified){
  $('resendVerification').hidden=false;
  if(!sendVerification){await signOut(auth);status('This email account exists but still needs verification. Open the link in your inbox or spam folder, then sign in. To request another link, enter your email and password and choose Resend verification email.');return}
  try{await sendEmailVerification(user,{url:location.origin+'/login'});status('Your account is ready for email verification. Check your inbox and spam folder for the link, then return here to sign in.')}
  catch(error){status('Your account exists, but its verification email could not be sent. '+errorMessage(error)+' Sign in again to resend the email.')}
  finally{await signOut(auth)}
  return;
 }
 if(totpEnabled&&$('setupMfa').checked&&!multiFactor(user).enrolledFactors.length){
  try{await startEnrollment(user)}catch(error){clearMfa();await signOut(auth);throw error}return;
 }
 try{
  const response=await fetch('/api/auth/session',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:await user.getIdToken(true)})});
  let data;try{data=await response.json()}catch{throw new LoginError('The account service did not respond correctly. Please try again.')}
  if(!response.ok)throw new LoginError(data.error||'The account could not be opened. Please try again.');
  location.assign('/account');
 }finally{await signOut(auth)}
}
function setMode(value){
 mode=value;
 $('loginTitle').textContent=mode==='login'?'Welcome back.':'Create your account.';
 $('emailSubmit').textContent=mode==='login'?'Sign in':'Create account';
 $('password').autocomplete=mode==='login'?'current-password':'new-password';
 $('password').minLength=mode==='login'?1:15;
 $('passwordHint').hidden=mode!=='signup';
 $('confirmPasswordLabel').hidden=mode!=='signup';
 $('confirmPassword').hidden=mode!=='signup';
 $('confirmPassword').required=mode==='signup';
 $('confirmPassword').value='';
 $('switchMode').textContent=mode==='login'?'New here? Create an account':'Already have an account? Sign in';
 status('');
}
$('googleLogin').onclick=async()=>{
 busy(true);status('Opening Google sign-in…');
 try{const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});await finish((await signInWithPopup(auth,provider)).user)}
 catch(error){await handleSignInError(error)}finally{busy(false)}
};
$('emailForm').onsubmit=async event=>{
 event.preventDefault();busy(true);status(mode==='signup'?'Creating your account…':'Signing in…');
 try{
  const email=$('email').value.trim(),password=$('password').value;
  if(mode==='signup'&&password.length<15)throw new LoginError('Use a password with at least 15 characters.');
  if(mode==='signup'&&password!==$('confirmPassword').value)throw new LoginError('The passwords do not match. Enter the same password in both fields.');
  const result=mode==='signup'?await createUserWithEmailAndPassword(auth,email,password):await signInWithEmailAndPassword(auth,email,password);
  await finish(result.user,mode==='signup');
 }catch(error){await handleSignInError(error)}finally{busy(false)}
};
$('resendVerification').onclick=async()=>{
 const email=$('email').value.trim(),password=$('password').value;
 if(!email||!password){status('Enter your email and password above, then choose Resend verification email.');return}
 busy(true);status('Requesting a verification email…');
 try{const result=await signInWithEmailAndPassword(auth,email,password);if(result.user.emailVerified){await finish(result.user);return}await finish(result.user,true)}
 catch(error){await handleSignInError(error)}finally{busy(false)}
};
$('mfaForm').onsubmit=async event=>{
 event.preventDefault();const code=$('mfaCode').value.trim();if(!/^\d{6}$/.test(code)){status('Enter the six-digit code from your authenticator app.');return}
 busy(true);status('Checking your authenticator code…');
 try{
  if(enrollmentUser&&totpSecret){
   const user=enrollmentUser;await multiFactor(user).enroll(TotpMultiFactorGenerator.assertionForEnrollment(totpSecret,code),'Authenticator app');
   let revoked=false;
   try{const response=await fetch('/api/auth/revoke-sessions',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:await user.getIdToken(true)})});revoked=response.ok}catch{}
   clearMfa();$('setupMfa').checked=false;await signOut(auth);
   status(revoked?'Authenticator protection is enabled. Sign in again and enter a fresh code to open your planner.':'Authenticator protection is enabled. Sign in again with a fresh code. Older app sessions could not be cleared and may remain active for up to one hour.');
  }else if(resolver){
   const result=await resolver.resolveSignIn(TotpMultiFactorGenerator.assertionForSignIn($('mfaFactor').value,code));clearMfa();await finish(result.user);
  }else{clearMfa();status('Sign in again to begin a new attempt.')}
 }catch(error){$('mfaCode').value='';status(errorMessage(error))}finally{busy(false)}
};
$('mfaCancel').onclick=async()=>{busy(true);try{clearMfa();await signOut(auth);status('Attempt canceled. Sign in when you are ready.')}finally{busy(false)}};
$('switchMode').onclick=()=>setMode(mode==='login'?'signup':'login');
$('resetPassword').onclick=async()=>{
 const email=$('email').value.trim();if(!email){status('Enter your email address above first.');$('email').focus();return}
 busy(true);try{await sendPasswordResetEmail(auth,email,{url:location.origin+'/login'});status('If an account exists, check its email for password-reset instructions.')}
 catch(error){status(error.code==='auth/user-not-found'?'If an account exists, check its email for password-reset instructions.':errorMessage(error))}finally{busy(false)}
};
if(location.pathname==='/signup')setMode('signup');
(async()=>{
 busy(true);
 try{const response=await fetch('/api/auth/config',{cache:'no-store'}),data=await response.json();if(!response.ok||!data.configured){status('Google and email sign-in are being connected. The demo is available now.');return}auth=getAuth(initializeApp(data.config));await setPersistence(auth,inMemoryPersistence);totpEnabled=data.totpEnabled===true;$('setupMfaLabel').hidden=!totpEnabled;$('setupMfa').checked=totpEnabled&&location.search==='?security=1';busy(false);status('')}
 catch{status('Sign-in is temporarily unavailable. Please try again later.')}
})();
