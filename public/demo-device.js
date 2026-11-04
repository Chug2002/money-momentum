(()=>{
  const tools=document.createElement('div');tools.className='deviceTools';tools.innerHTML='<span id="saveState" role="status">Fictional data · demo session only</span><button id="demoReset" type="button">Reset demo</button><a class="privateAccountLink" href="https://github.com/Chug2002/money-momentum" target="_blank" rel="noopener">View source ↗</a>';
  document.querySelector('header').append(tools);
  document.getElementById('demoReset').onclick=()=>window.MomentumDemo.reset();
  const badge=document.querySelector('header .demo');if(badge)badge.textContent='INTERACTIVE DEMO';
  window.MomentumBanks={snapshot:()=>({items:[],transactions:[],configured:false,environment:null}),connect:()=>{},refresh:async()=>{}};
})();
