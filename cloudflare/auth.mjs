import {createRemoteJWKSet,jwtVerify} from 'jose';
const googleKeys=createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));
const name='__Host-momentum-session';
export const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),x=>x.toString(16).padStart(2,'0')).join('');
const random=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
const cookie=r=>r.headers.get('Cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1)||'';
const sessionCookie=(value,seconds)=>`${name}=${value}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${seconds}`;
const json=(value,status=200,headers={})=>Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
export function webConfig(env){try{const c=JSON.parse(env.FIREBASE_WEB_CONFIG||'{}');if(typeof c.apiKey!=='string'||!c.apiKey||typeof c.projectId!=='string'||!/^[a-z0-9-]+$/.test(c.projectId)||c.authDomain!==c.projectId+'.firebaseapp.com'||typeof c.appId!=='string')return null;return {apiKey:c.apiKey,projectId:c.projectId,authDomain:c.authDomain,appId:c.appId}}catch{return null}}
export async function verifyFirebaseIdToken(token,config,keys=googleKeys){
 const {payload}=await jwtVerify(token,keys,{algorithms:['RS256'],issuer:'https://securetoken.google.com/'+config.projectId,audience:config.projectId,requiredClaims:['sub','iat','exp','auth_time','email','email_verified']});
 const now=Math.floor(Date.now()/1000);
 if(typeof payload.sub!=='string'||!payload.sub||payload.sub.length>128||typeof payload.email!=='string'||payload.email.length>254||payload.email_verified!==true||!Number.isFinite(payload.auth_time)||payload.auth_time>now+30||payload.auth_time<now-300||payload.iat>now+30)throw Error('Invalid sign-in');
 return payload;
}
export async function sessionUser(request,env){const token=cookie(request);if(!/^[a-f0-9]{64}$/.test(token))return null;return env.DB.prepare('SELECT u.id AS userId,u.email FROM auth_sessions s JOIN auth_users u ON u.id=s.user_id WHERE s.hash=? AND s.expires>?').bind(await hash(token),Date.now()).first()}
export async function authRoute(request,env,action,dependencies={}){
 if(action==='config'&&request.method==='GET'){const config=webConfig(env);return json(config?{configured:true,config}:{configured:false})}
 if(request.method!=='POST')return json({error:'Method not allowed.'},405);
 if(new URL(request.url).origin!==env.APP_ORIGIN||request.headers.get('Origin')!==env.APP_ORIGIN)return json({error:'Open this request from Money Momentum.'},403);
 if(action==='logout'){const token=cookie(request);if(token)await env.DB.prepare('DELETE FROM auth_sessions WHERE hash=?').bind(await hash(token)).run();if(request.headers.get('Accept')?.includes('text/html'))return new Response(null,{status:303,headers:{Location:env.APP_ORIGIN+'/login','Set-Cookie':sessionCookie('',0)}});return json({ok:true},200,{'Set-Cookie':sessionCookie('',0)})}
 if(action!=='session')return json({error:'Not found.'},404);
 const config=webConfig(env);if(!config)return json({error:'Sign-in setup is not finished yet.'},503);
 try{
  const bucket=await hash((request.headers.get('CF-Connecting-IP')||'unknown')+':'+Math.floor(Date.now()/60000));
  const rate=await env.DB.prepare('INSERT INTO auth_rates(bucket,hits,expires) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET hits=hits+1 RETURNING hits').bind(bucket,Date.now()+120000).first();if(rate.hits>10)return json({error:'Please wait a minute before trying again.'},429);
  const text=await request.text();if(text.length>24000)return json({error:'Request too large.'},413);const body=JSON.parse(text);if(typeof body.idToken!=='string'||body.idToken.length>20000)return json({error:'Sign-in could not be verified.'},401);
  const payload=await verifyFirebaseIdToken(body.idToken,config,dependencies.keys||googleKeys);
  // Check the provider's current user state before issuing our own session.
  const lookup=await (dependencies.fetcher||fetch)('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='+encodeURIComponent(config.apiKey),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:body.idToken}),signal:AbortSignal.timeout(15000)});
  if(!lookup.ok)return json({error:'Sign in again to continue.'},401);const provider=await lookup.json(),user=provider.users?.[0];
  if(!user||user.localId!==payload.sub||user.disabled||user.emailVerified!==true||user.email?.toLowerCase()!==payload.email.toLowerCase()||Number(user.validSince||0)>payload.auth_time)return json({error:'Verify your email and sign in again.'},401);
  const id='firebase:'+payload.sub;await env.DB.prepare('INSERT INTO auth_users(id,email) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET email=excluded.email').bind(id,payload.email.toLowerCase()).run();
  const token=random(),seconds=Math.max(1,Math.min(3600,Math.floor(payload.exp-Date.now()/1000)));
  await env.DB.prepare('INSERT INTO auth_sessions(hash,user_id,expires) VALUES(?,?,?)').bind(await hash(token),id,Date.now()+seconds*1000).run();
  return json({ok:true},200,{'Set-Cookie':sessionCookie(token,seconds)});
 }catch{return json({error:'Sign-in could not be verified. Verify your email, then sign in again.'},401)}
}
export async function cleanupAuth(env){await env.DB.batch(['auth_sessions','auth_rates'].map(table=>env.DB.prepare('DELETE FROM '+table+' WHERE expires<?').bind(Date.now())))}
