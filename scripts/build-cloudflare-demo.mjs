import {mkdirSync,copyFileSync} from 'node:fs';
const destination='dist/cloudflare-demo';mkdirSync(destination,{recursive:true});
const files=['welcome.html','welcome.css','demo.html','demo-fixture.js','demo-start.js','demo-device.js','product.css','product-tour.js','style.css','themes.css','app.js','tracker.js','phone-core.js','phone-app.js','favicon.svg','icon-180.png','icon-192.png','icon-512.png','navy-cashrewards.png'];
for(const file of files)copyFileSync('public/'+file,destination+'/'+file);
// A public demo installs to its own root and never claims the private app's identity.
const {writeFileSync}=await import('node:fs');
writeFileSync(destination+'/manifest.webmanifest',JSON.stringify({name:'Money Momentum Demo',short_name:'Momentum Demo',start_url:'/demo',scope:'/',display:'standalone',background_color:'#101222',theme_color:'#101222',icons:[{src:'/icon-192.png',sizes:'192x192',type:'image/png'},{src:'/icon-512.png',sizes:'512x512',type:'image/png'}]},null,2));
console.log(`Prepared ${files.length+1} public demo assets. No bank credentials or database exports included.`);
