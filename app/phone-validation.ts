export function validPhone(t:any){
 if(t===null||t===undefined)return true;
 const integer=(n:any,min=0,max=1e12)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
 const text=(s:any,max=200)=>typeof s==='string'&&s.length<=max;
 const id=(s:any)=>text(s,128)&&s.length>0;
 const date=(s:any)=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s);
 const list=(a:any,max:number,fn:(x:any)=>boolean)=>Array.isArray(a)&&a.length<=max&&a.every(fn);
 const allowedCategories=["Eating out","Groceries","General shopping","Online shopping","Subscriptions","Housing","Utilities","Transport","Healthcare","Entertainment","Travel","Education","Personal care","Gifts & donations","Investments","Savings","Fees","Bills","Debt payments","Other","Money in","Transfers"];
 const bureaus=['Equifax','Experian','TransUnion'];
 if(t.version!==1||!t.prefs||!t.categories||typeof t.categories!=='object'||Array.isArray(t.categories))return false;
 const p=t.prefs;if(!integer(p.cushion)||!integer(p.reserved)||!integer(p.eatingBudget)||!(p.nextPayday===''||date(p.nextPayday))||!['priority','apr','balance'].includes(p.strategy)||!['auto','manual','bank'].includes(p.source))return false;
 if(p.categoryBudgets!==undefined&&(!p.categoryBudgets||typeof p.categoryBudgets!=='object'||Array.isArray(p.categoryBudgets)||Object.keys(p.categoryBudgets).length>30||!Object.entries(p.categoryBudgets).every(([k,v])=>text(k,50)&&integer(v))))return false;
 if(Object.keys(t.categories).length>5000||!Object.entries(t.categories).every(([k,v])=>text(k,200)&&allowedCategories.includes(v as string)))return false;
 const accountTypes=['checking','savings','spending','credit'];
 const legacy=['checking','savings','spending','capital','amex','gas'];
 if(t.accounts!==undefined&&!list(t.accounts,500,a=>a&&id(a.id)&&(legacy.includes(a.id)||/^acct:[a-zA-Z0-9-]+$/.test(a.id))&&text(a.bank,80)&&a.bank.trim().length>0&&text(a.name,100)&&a.name.trim().length>0&&accountTypes.includes(a.type)&&integer(a.opening)&&integer(a.limit)&&( !legacy.includes(a.id)||a.type===(['capital','amex','gas'].includes(a.id)?'credit':a.id))))return false;
 const accounts=t.accounts||[];if(new Set(accounts.map((a:any)=>a.id)).size!==accounts.length)return false;
 const cashId=(v:any)=>['checking','savings','spending'].includes(v)||accounts.some((a:any)=>a.id===v&&a.type!=='credit');
 const creditId=(v:any)=>['capital','amex','gas'].includes(v)||accounts.some((a:any)=>a.id===v&&a.type==='credit');
 if(t.accountEntries!==undefined&&!list(t.accountEntries,10000,e=>e&&id(e.id)&&date(e.date)&&text(e.description,200)&&integer(e.amount,1)&&(['charge','refund'].includes(e.type)?creditId(e.account):cashId(e.account))&&['expense','income','transfer','payment','charge','refund'].includes(e.type)&&text(e.to,128)&&(e.type==='transfer'?cashId(e.to)&&e.to!==e.account:e.type==='payment'?creditId(e.to):e.to==='')))return false;
 if(t.accountEntries&&new Set(t.accountEntries.map((e:any)=>e.id)).size!==t.accountEntries.length)return false;
 return list(t.bills,1000,b=>b&&id(b.id)&&text(b.name)&&integer(b.amount)&&integer(b.day,1,31)&&text(b.keyword)&&typeof b.auto==='boolean'&&text(b.account,200)&&text(b.debt,128)&&b.payments&&typeof b.payments==='object'&&Object.entries(b.payments).length<=1200&&Object.entries(b.payments).every(([m,r]:[string,any])=>/^\d{4}-\d{2}$/.test(m)&&r&&typeof r.paid==='boolean'&&date(r.date)))
 &&list(t.debts,1000,d=>d&&id(d.id)&&text(d.name)&&integer(d.balance)&&integer(d.start)&&Number.isFinite(d.apr)&&d.apr>=0&&d.apr<=100&&integer(d.minimum)&&integer(d.goal)&&integer(d.priority,1,100)&&(d.link===''||creditId(d.link)||typeof d.link==='string'&&/^bank:[a-zA-Z0-9_-]{1,120}$/.test(d.link)))
 &&list(t.scores,5000,s=>s&&id(s.id)&&bureaus.includes(s.bureau)&&text(s.model,60)&&integer(s.value,300,850)&&date(s.date)&&text(s.source,100))
 &&list(t.reports,5000,r=>r&&id(r.id)&&bureaus.includes(r.bureau)&&text(r.name)&&['Current','Late','Collection','Closed','Disputed'].includes(r.status)&&integer(r.balance)&&integer(r.limit)&&date(r.date))
 &&list(t.payments,10000,p=>p&&id(p.id)&&id(p.debt)&&date(p.date)&&integer(p.amount));
}
