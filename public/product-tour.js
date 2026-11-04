(()=>{
  const $=id=>document.getElementById(id),demo=!!window.MomentumDemo;
  const bar=document.createElement('div');bar.className='productBar';bar.innerHTML='<span>Daily Tracker · all your planning tools</span><div><button id="tourReplay" type="button">? Take a tour</button>'+(demo?'':'<a class="privateAccountLink" href="/demo.html" target="_blank" rel="noopener">Try sample-data demo ↗</a>')+'</div>';
  $('phoneShell').before(bar);
  if(demo){const banner=document.createElement('div');banner.className='demoBanner';banner.innerHTML='<strong>Explore the real Daily Tracker with fictional data.</strong> Try the cards, bills, payoff plans, and calendar. Changes affect only this demo session. No bank connection or financial information is needed.';bar.after(banner)}
  const dialog=document.createElement('dialog');dialog.id='productTour';dialog.setAttribute('aria-labelledby','tourTitle');dialog.innerHTML='<span id="tourProgress" class="tourProgress"></span><h2 id="tourTitle"></h2><p id="tourText"></p><div class="tourActions"><button id="tourSkip" class="tourSkip" type="button">Not now</button><button id="tourBack" type="button">Back</button><button id="tourNext" class="primary" type="button">Yes, show me</button></div>';document.body.append(dialog);
  const steps=[
    ['dashboard','Your money at a glance','The dashboard brings cash, unpaid bills, debt, and cash flow together. Select a summary card to explore its details.'],
    ['cards','Accounts and activity','Cards keeps bank accounts separate from credit cards. Select an institution and account to review transactions. Manual accounts and linked bank data are labeled separately.'],
    ['bills','Keep bills in view','Add recurring bills and due dates, review payment matches, or mark a bill paid. Marking a bill does not send money.'],
    ['debt','Build a payoff plan','Track balances, APR, minimum payments, and goals. Compare a plan with your cushion and upcoming bills before committing extra money.'],
    ['credit','Track your credit entries','Record scores with their bureau, model, and date. Entries are supplied by you; this app does not obtain or change a credit score.'],
    ['trends','Understand your cash flow','Review spending categories, income, and budget progress. Transfers are kept separate so moving money is not counted as new spending.'],
    ['calendar','See the month ahead','The calendar combines recorded daily activity and scheduled bills. Select a day to review details or log activity. Future bills remain forecasts.'],
    ['dashboard',demo?'Try it yourself':'You’re ready','Use the ＋ button to log activity, and return to any section from navigation. '+(demo?'This is fictional data: explore freely and use Reset demo to start over.':'Your private account stays separate from the public demo. Bank data refreshes automatically while the app is open.')+' You can replay this tour at any time.']
  ];
  let index=-1,previous='dashboard',highlight=null;
  const key=()=>demo?'momentumDemoTourV1':'momentumTourV1:'+(localStorage.getItem('momentumLocalOwner')||'account');
  function remember(){try{(demo?window.MomentumDemo.storage:localStorage).setItem(key(),'seen')}catch{}}
  function close(){remember();dialog.close();dialog.dataset.active='false';if(highlight)highlight.classList.remove('tourTarget');highlight=null;window.MomentumUI?.navigate(previous)}
  function paint(){if(highlight)highlight.classList.remove('tourTarget');if(index<0){dialog.dataset.active='false';$('tourProgress').textContent='A quick introduction';$('tourTitle').textContent='Would you like a tour?';$('tourText').textContent='See how Money Momentum turns daily activity into a clearer plan. Take a short tour, or explore at your own pace.';$('tourBack').hidden=true;$('tourSkip').textContent='Not now';$('tourNext').textContent='Yes, show me';return}const [tab,title,text]=steps[index];window.MomentumUI?.navigate(tab);highlight=document.querySelector('.bottomNav [data-phone-tab="'+tab+'"]');highlight?.classList.add('tourTarget');dialog.dataset.active='true';$('tourProgress').textContent=`${index+1} of ${steps.length}`;$('tourTitle').textContent=title;$('tourText').textContent=text;$('tourBack').hidden=index===0;$('tourSkip').textContent='Skip tour';$('tourNext').textContent=index===steps.length-1?'Start exploring':'Next'}
  function start(){previous=window.MomentumUI?.active()||'dashboard';index=-1;paint();if(!dialog.open)dialog.showModal()}
  function offer(){if(document.querySelector('dialog[open]'))return;try{if((demo?window.MomentumDemo.storage:localStorage).getItem(key()))return}catch{}start()}
  $('tourReplay').onclick=start;$('tourSkip').onclick=close;$('tourBack').onclick=()=>{index=Math.max(0,index-1);paint()};$('tourNext').onclick=()=>{if(index===steps.length-1)return close();index++;paint()};dialog.addEventListener('cancel',event=>{event.preventDefault();close()});
  window.MomentumTour={offer,start};
  window.addEventListener('momentum-account-ready',offer);
  for(const id of ['chooseView','syncChoice'])$(id)?.addEventListener('close',offer);
  if(demo)offer();
})();
