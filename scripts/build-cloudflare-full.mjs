import {build} from 'esbuild';
import {mkdirSync,copyFileSync,readdirSync,readFileSync,writeFileSync,unlinkSync} from 'node:fs';
const out='dist/cloudflare-full';mkdirSync(out,{recursive:true});
for(const entry of readdirSync(out,{withFileTypes:true}))if(entry.isFile())unlinkSync(out+'/'+entry.name);
for(const e of readdirSync('public',{withFileTypes:true})){if(e.isFile())copyFileSync('public/'+e.name,out+'/'+e.name)}
// Scope device drafts and OAuth state before the account's scripts read them.
for(const file of ['app.js','tracker.js','phone-app.js','device-settings.js','bank-link.js']){
 const source=readFileSync(out+'/'+file,'utf8').replaceAll('localStorage','(window.MomentumStorage||localStorage)').replaceAll('sessionStorage','(window.MomentumSessionStorage||sessionStorage)');
 writeFileSync(out+'/'+file,source);
}
await build({entryPoints:['public/firebase-login.js'],bundle:true,minify:true,platform:'browser',target:'es2020',outfile:out+'/cloudflare-login.js'});
let settings=readFileSync(out+'/device-settings.js','utf8').replaceAll('/signin-with-chatgpt?return_to=/','/login').replaceAll('/signout-with-chatgpt?return_to=/','/logout');settings=settings.replace('Sign in again if needed</a>','Sign in again if needed</a><p><a href="/logout">Sign out of this device</a></p>');writeFileSync(out+'/device-settings.js',settings);
writeFileSync(out+'/notification-worker.js',readFileSync(out+'/notification-worker.js','utf8').replaceAll('/?view=app&alerts=1','/account?view=app&alerts=1'));
const manifest=JSON.parse(readFileSync('public/manifest.webmanifest','utf8'));manifest.start_url='/account';writeFileSync(out+'/manifest.webmanifest',JSON.stringify(manifest));
console.log('Prepared the full Cloudflare app, demo, bank-linking client, and Google/email login.');
