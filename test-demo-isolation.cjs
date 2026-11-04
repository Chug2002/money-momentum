const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const fixtureScope={module:{exports:{}}};vm.runInNewContext(fs.readFileSync('public/demo-fixture.js','utf8'),fixtureScope);
const {sample}=fixtureScope.module.exports;
const validation={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/phone-validation.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,validation);
for(const date of ['2026-11-01T12:00:00','2026-11-04T12:00:00','2028-02-29T12:00:00']){
 const data=sample(new Date(date));assert(validation.exports.validPhone(data.phone),'sample passes real account validation');assert(data.phone.accounts.length===3);assert(data.phone.accountEntries.every(entry=>entry.date<=date.slice(0,10)));
 assert(!JSON.stringify(data).includes('access-production'));
}
const privateStorage=new Map([['moneyDailyV1','PRIVATE-DATA']]),session=new Map();
const document={documentElement:{dataset:{}}},window={MomentumSample:{sample}},sessionStorage={getItem:key=>session.get(key)||null,setItem:(key,value)=>session.set(key,value),removeItem:key=>session.delete(key)};
vm.runInNewContext(fs.readFileSync('public/demo-start.js','utf8'),{window,document,sessionStorage,localStorage:privateStorage,Map,JSON,location:{reload(){}}});
assert.equal(privateStorage.get('moneyDailyV1'),'PRIVATE-DATA');assert(window.MomentumDemo.storage.getItem('moneyDailyV1'));assert([...session.keys()].every(key=>key.startsWith('momentumPublicDemoV2:')));
window.MomentumDemo.storage.setItem('moneyDailyV1','DEMO-EDIT');window.MomentumDemo.reset();assert.equal(privateStorage.get('moneyDailyV1'),'PRIVATE-DATA');assert.notEqual(window.MomentumDemo.storage.getItem('moneyDailyV1'),'DEMO-EDIT');
const demo=fs.readFileSync('public/demo.html','utf8');for(const script of ['bank-link.js','device-settings.js','notifications.js'])assert(!demo.includes('src="'+script),'public demo must not load private API clients');assert(demo.includes('demo-start.js'));assert(demo.includes('phone-app.js'));
console.log('Passed: valid current-month fictional fixture, isolated demo session storage and reset, no private bank/save/notification clients.');
