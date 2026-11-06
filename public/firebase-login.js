import {initializeApp} from 'firebase/app';
import {getAuth,setPersistence,inMemoryPersistence,GoogleAuthProvider,signInWithPopup,signInWithEmailAndPassword,createUserWithEmailAndPassword,sendEmailVerification,sendPasswordResetEmail,signOut} from 'firebase/auth';
const $=id=>document.getElementById(id);let auth,mode='login';
const status=message=>$('loginStatus').textContent=message;
const busy=value=>document.querySelectorAll('button,input').forEach(x=>x.disabled=value);
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
  'auth/network-request-failed':'The sign-in service could not be reached. Check your connection and try again.',
  'auth/user-disabled':'This account has been disabled. Contact the app owner.',
  'auth/unauthorized-domain':'This website’s address still needs to be approved in the sign-in settings.',
  'auth/operation-not-allowed':'This sign-in method has not been enabled yet.',
  'auth/configuration-not-found':'The app’s sign-in provider setup needs to be checked.',
  'auth/invalid-api-key':'The app’s sign-in connection settings need to be checked.',
  'auth/account-exists-with-different-credential':'This email already uses another sign-in method. Try Continue with Google.'
 })[error.code]||('Sign-in could not be completed. Please try again.'+(typeof error.code==='string'&&/^auth\/[a-z-]+$/.test(error.code)?' ('+error.code+')':''));
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
 catch(error){status(errorMessage(error))}finally{busy(false)}
};
$('emailForm').onsubmit=async event=>{
 event.preventDefault();busy(true);status(mode==='signup'?'Creating your account…':'Signing in…');
 try{
  const email=$('email').value.trim(),password=$('password').value;
  if(mode==='signup'&&password.length<15)throw new LoginError('Use a password with at least 15 characters.');
  if(mode==='signup'&&password!==$('confirmPassword').value)throw new LoginError('The passwords do not match. Enter the same password in both fields.');
  const result=mode==='signup'?await createUserWithEmailAndPassword(auth,email,password):await signInWithEmailAndPassword(auth,email,password);
  await finish(result.user,mode==='signup');
 }catch(error){status(errorMessage(error))}finally{busy(false)}
};
$('resendVerification').onclick=async()=>{
 const email=$('email').value.trim(),password=$('password').value;
 if(!email||!password){status('Enter your email and password above, then choose Resend verification email.');return}
 busy(true);status('Requesting a verification email…');
 try{const result=await signInWithEmailAndPassword(auth,email,password);if(result.user.emailVerified){await finish(result.user);return}await finish(result.user,true)}
 catch(error){status(errorMessage(error))}finally{busy(false)}
};
$('switchMode').onclick=()=>setMode(mode==='login'?'signup':'login');
$('resetPassword').onclick=async()=>{
 const email=$('email').value.trim();if(!email){status('Enter your email address above first.');$('email').focus();return}
 busy(true);try{await sendPasswordResetEmail(auth,email,{url:location.origin+'/login'});status('If an account exists, check its email for password-reset instructions.')}
 catch(error){status(error.code==='auth/user-not-found'?'If an account exists, check its email for password-reset instructions.':errorMessage(error))}finally{busy(false)}
};
if(location.pathname==='/signup')setMode('signup');
(async()=>{
 busy(true);
 try{const response=await fetch('/api/auth/config',{cache:'no-store'}),data=await response.json();if(!response.ok||!data.configured){status('Google and email sign-in are being connected. The demo is available now.');return}auth=getAuth(initializeApp(data.config));await setPersistence(auth,inMemoryPersistence);busy(false);status('')}
 catch{status('Sign-in is temporarily unavailable. Please try again later.')}
})();
