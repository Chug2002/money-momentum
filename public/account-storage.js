(()=>{
 const identity=document.querySelector('meta[name="momentum-account"]')?.content;
 if(!identity)return;
 const prefix='momentumAccount:'+identity+':';
 const scoped=storage=>Object.freeze({getItem:key=>storage.getItem(prefix+key),setItem:(key,value)=>storage.setItem(prefix+key,value),removeItem:key=>storage.removeItem(prefix+key)});
 window.MomentumStorage=scoped(localStorage);
 window.MomentumSessionStorage=scoped(sessionStorage);
 const originalFetch=window.fetch.bind(window);
 window.fetch=(input,options)=>{
  const request=new Request(input,options),url=new URL(request.url);
  if(url.origin===location.origin&&url.pathname.startsWith('/api/')&&!url.pathname.startsWith('/api/auth/')){
   const headers=new Headers(request.headers);headers.set('X-Momentum-Account',decodeURIComponent(identity));
   return originalFetch(new Request(request,{headers}));
  }
  return originalFetch(request);
 };
})();
