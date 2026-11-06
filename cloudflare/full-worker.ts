import {sessionUser,authRoute,cleanupAuth} from './auth.mjs';
import {GET as getLog,PUT as putLog} from '../app/api/log/route';
import {bankRoute} from '../app/plaid-server';
import {notificationsRoute} from '../app/notifications-server';
import {html} from '../app/ui';

const security={
 'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Cross-Origin-Opener-Policy':'same-origin-allow-popups',
 'Content-Security-Policy':"default-src 'self'; script-src 'self' https://cdn.plaid.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://*.plaid.com; frame-src https://*.plaid.com https://*.firebaseapp.com https://accounts.google.com; connect-src 'self' https://*.plaid.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.firebaseapp.com;  frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'"
};
const json=(message:string,status:number)=>Response.json({error:message},{status});
async function handle(request:Request,env:any){
 const url=new URL(request.url);
 if(url.origin!==env.APP_ORIGIN)return json('Open the configured Money Momentum address.',403);
 const auth=url.pathname.match(/^\/api\/auth\/([a-z-]+)$/);if(auth)return authRoute(request,env,auth[1]);
 if(url.pathname.startsWith('/api/')||['/account','/account/'].includes(url.pathname)){
  const user=await sessionUser(request,env);
  if(!user)return url.pathname.startsWith('/api/')?json('Sign in to your private account.',401):Response.redirect(url.origin+'/login',302);
  if(url.pathname.startsWith('/api/')&&request.headers.get('X-Momentum-Account')!==user.userId)return json('Your signed-in account changed. Reopen your planner before continuing.',409);
  if(!['GET','HEAD'].includes(request.method)&&request.headers.get('Origin')!==env.APP_ORIGIN)return json('Open this request from Money Momentum.',403);
  const headers=new Headers(request.headers);for(const key of [...headers.keys()])if(key.startsWith('oai-authenticated-')||key.startsWith('x-momentum-'))headers.delete(key);
  // These compatibility headers are generated only from our server-verified session.
  headers.set('oai-authenticated-user-id',user.userId);headers.set('oai-authenticated-user-email',user.email);
  const trusted=new Request(request,{headers});
  if(url.pathname==='/api/log'){if(request.method==='GET')return getLog(trusted);if(request.method==='PUT')return putLog(trusted);return json('Method not allowed.',405)}
  const bank=url.pathname.match(/^\/api\/plaid\/([a-z-]+)$/);if(bank)return bankRoute(trusted,bank[1]);
  const notification=url.pathname.match(/^\/api\/notifications\/([a-z-]+)$/);if(notification)return notificationsRoute(trusted,notification[1]);
  if(url.pathname.startsWith('/api/'))return json('Not found.',404);
  if(!['GET','HEAD'].includes(request.method))return json('Method not allowed.',405);
  const privateHtml=html.replace('<head>','<head><base href="/"><meta name="momentum-account" content="'+encodeURIComponent(user.userId)+'"><script src="/account-storage.js"></script>').replaceAll('/signin-with-chatgpt?return_to=/','/login').replaceAll('/signout-with-chatgpt?return_to=/','/logout');
  return new Response(request.method==='HEAD'?null:privateHtml,{headers:{'Content-Type':'text/html;charset=utf-8'}});
 }
 if(!['GET','HEAD'].includes(request.method))return json('Method not allowed.',405);
 if(url.pathname==='/signin-with-chatgpt')return Response.redirect(url.origin+'/login',302);
 if(url.pathname==='/logout'||url.pathname==='/signout-with-chatgpt')return new Response('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Sign out</title><link rel="stylesheet" href="/welcome.css"></head><body><main><h1>Sign out?</h1><form method="post" action="/api/auth/logout"><button class="button">Sign out of this device</button></form><p><a href="/account">Back to my account</a></p></main></body></html>',{headers:{'Content-Type':'text/html;charset=utf-8'}});
 if(url.pathname==='/')url.pathname='/welcome.html';
 if(['/login','/signup','/setup'].includes(url.pathname))url.pathname='/cloudflare-login.html';
 if(['/demo','/demo/'].includes(url.pathname))url.pathname='/demo.html';
 return env.ASSETS.fetch(new Request(url,request));
}
export default {
 async fetch(request:Request,env:any){let response;try{response=await handle(request,env)}catch{response=json('Account services are temporarily unavailable. Please try again.',503)}const headers=new Headers(response.headers);for(const [key,value] of Object.entries(security))headers.set(key,value);return new Response(response.body,{status:response.status,statusText:response.statusText,headers})},
 async scheduled(_event:any,env:any){await cleanupAuth(env);await notificationsRoute(new Request(env.APP_ORIGIN+'/api/notifications/job-init',{method:'POST'}),'job-init');const row=await env.DB.prepare('SELECT token FROM notification_job_auth WHERE id=?').bind('primary').first();if(row)await notificationsRoute(new Request(env.APP_ORIGIN+'/api/notifications/job',{method:'POST',headers:{'X-Notification-Job-Key':row.token}}),'job')}
};
