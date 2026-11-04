(function(root){
  function sample(now=new Date()){
    const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const date=iso(now),month=date.slice(0,7),day=n=>`${month}-${String(Math.min(n,now.getDate())).padStart(2,'0')}`;
    const zero={checking:0,savings:0,spending:0,capital:0,amex:0,gas:0};
    const entry=(id,type,account,amount,description,n,to='')=>({id,date:day(n),type,account,amount,description,to});
    const phone={version:1,
      accounts:[{id:'acct:demo-checking',bank:'Northstar Demo Bank',name:'Everyday checking',type:'checking',opening:250000,limit:0},{id:'acct:demo-savings',bank:'Northstar Demo Bank',name:'Rainy-day savings',type:'savings',opening:420000,limit:0},{id:'acct:demo-credit',bank:'Summit Demo Credit',name:'Everyday rewards',type:'credit',opening:128000,limit:500000}],
      accountEntries:[entry('sample-pay','income','acct:demo-checking',240000,'Sample paycheck',1),entry('sample-food','expense','acct:demo-checking',9350,'Neighborhood groceries',2),entry('sample-utility','expense','acct:demo-checking',12500,'City utilities',3),entry('sample-save','transfer','acct:demo-checking',30000,'Move to savings',3,'acct:demo-savings'),entry('sample-cafe','expense','acct:demo-checking',1850,'Corner cafe',4),entry('sample-card','charge','acct:demo-credit',6400,'Bookshop purchase',4)],
      bills:[{id:'demo-rent',name:'Apartment rent',amount:115000,day:1,keyword:'rent',auto:false,account:'acct:demo-checking',debt:'',payments:{[month]:{paid:true,date:day(1)}}},{id:'demo-utility',name:'City utilities',amount:12500,day:12,keyword:'utilities',auto:true,account:'acct:demo-checking',debt:'',payments:{}},{id:'demo-internet',name:'Home internet',amount:6500,day:18,keyword:'internet',auto:false,account:'acct:demo-checking',debt:'',payments:{}},{id:'demo-card-bill',name:'Rewards card minimum',amount:4500,day:22,keyword:'rewards',auto:false,account:'acct:demo-checking',debt:'demo-debt',payments:{}}],
      debts:[{id:'demo-debt',name:'Rewards card payoff',balance:134400,start:165000,apr:19.9,minimum:4500,goal:16000,priority:1,link:'acct:demo-credit'}],
      scores:[{id:'demo-score',bureau:'Experian',model:'FICO 8',value:712,date:day(1),source:'Fictional example'}],reports:[{id:'demo-report',bureau:'Experian',name:'Sample rewards card',status:'Current',balance:134400,limit:500000,date:day(1)}],categories:{},payments:[],prefs:{cushion:100000,reserved:25000,nextPayday:iso(new Date(now.getFullYear(),now.getMonth(),now.getDate()+7)),eatingBudget:20000,categoryBudgets:{Groceries:40000,'Eating out':20000},source:'manual',strategy:'priority'}};
    return {log:{start:month+'-01',opening:{...zero},limits:{capital:0,amex:0,gas:0},entries:[]},phone,checkins:[date]};
  }
  if(typeof module!=='undefined')module.exports={sample};else root.MomentumSample={sample};
})(typeof window==='undefined'?this:window);
