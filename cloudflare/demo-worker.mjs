const PRIVATE_APP='https://money-momentum.chelseahughes4057.chatgpt.site/';
const security={
  'Cache-Control':'no-store',
  'X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'strict-origin-when-cross-origin',
  'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'"
};
export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname==='/account'||url.pathname==='/account/')return new Response(null,{status:302,headers:{...security,Location:PRIVATE_APP}});
    // No private API, identity headers, secrets, or database bindings exist in the public demo.
    if(url.pathname.startsWith('/api/')||url.pathname.startsWith('/signin')||url.pathname.startsWith('/signout'))return new Response(JSON.stringify({error:'This public demo uses fictional session data. Open Private account for your saved finances.'}),{status:403,headers:{...security,'Content-Type':'application/json'}});
    if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{...security,Allow:'GET, HEAD'}});
    if(url.pathname==='/')url.pathname='/welcome.html';
    if(url.pathname==='/demo'||url.pathname==='/demo/')url.pathname='/demo.html';
    const response=await env.ASSETS.fetch(new Request(url,request));
    const headers=new Headers(response.headers);for(const [key,value] of Object.entries(security))headers.set(key,value);
    return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
  }
};
