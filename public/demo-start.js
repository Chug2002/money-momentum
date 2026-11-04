(()=>{
  const memory=new Map(),prefix='momentumPublicDemoV2:';
  const storage={getItem(key){try{return sessionStorage.getItem(prefix+key)}catch{return memory.get(key)||null}},setItem(key,value){memory.set(key,String(value));try{sessionStorage.setItem(prefix+key,String(value))}catch{}},removeItem(key){memory.delete(key);try{sessionStorage.removeItem(prefix+key)}catch{}}};
  const seed=()=>{const bundle=window.MomentumSample.sample();storage.setItem('moneyDailyV1',JSON.stringify(bundle.log));storage.setItem('moneyPhoneV1',JSON.stringify(bundle.phone));storage.setItem('moneyCheckinsV1',JSON.stringify(bundle.checkins));};
  if(!storage.getItem('moneyDailyV1'))seed();
  window.MomentumDemo={storage,reset(){seed();location.reload()}};
  document.documentElement.dataset.demo='true';
})();
