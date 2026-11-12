// Member dashboard: overview, post, my side hustles, applications, payments, profile.
SH.init({need:'login'}).then(async({cfg,me})=>{
  const $=SH.$,esc=SH.esc,m$=SH.money;
  const T=[['overview','Overview'],['post','Post a side hustle'],['mine','My side hustles'],['applied','My applications'],['pay','Payments'],['profile','Profile']];
  let tab=(location.hash||'#overview').slice(1);if(!T.some(t=>t[0]===tab))tab='overview';
  $('#hello').innerHTML='<span class="eyebrow">Dashboard</span><h1 style="font-size:clamp(2rem,7vw,3rem)">Hi <span class="gt">'+esc(me.name.split(' ')[0])+'</span></h1>';
  const msg={pending:['Waiting for approval','We are checking your proof of age. You can browse now. Posting and applying unlock once approved.'],rejected:['Proof of age not accepted','Please WhatsApp us on '+cfg.phones[0]+' to fix this.']}[me.status];
  if(msg)$('#notice').innerHTML='<div class="glass card" style="margin:16px 0"><h3>'+msg[0]+'</h3><p>'+msg[1]+'</p></div>';
  const tag=s=>'<span class="tag '+({open:'blue',assigned:'',completed:'',pending:'red',accepted:'',declined:'red',cancelled:'red',paid:'',awaiting_payout:'red'}[s]||'')+'">'+s.replace('_',' ')+'</span>';
  function tabs(){$('#tabs').innerHTML=T.map(t=>'<button class="btn sm'+(t[0]===tab?'':' ghost')+'" data-t="'+t[0]+'">'+t[1]+'</button>').join('')}

  const views={
    async overview(p){
      const d=await SH.api('mine'),paid=d.payments.filter(x=>x.youAre==='worker'&&x.status==='paid').reduce((s,x)=>s+x.net,0),
        owed=d.payments.filter(x=>x.youAre==='worker'&&x.status!=='paid').reduce((s,x)=>s+x.net,0);
      p.innerHTML='<div class="grid g3 stagger"><div class="glass card"><b class="gt" style="font-size:2.2rem" data-count="'+d.posted.length+'">0</b><p>Side hustles posted</p></div>'+
        '<div class="glass card"><b class="gt" style="font-size:2.2rem" data-count="'+d.applied.length+'">0</b><p>Applications sent</p></div>'+
        '<div class="glass card"><b class="gt" style="font-size:2.2rem" data-count="'+paid+'" data-pre="$">0</b><p>Paid to you ('+m$(owed)+' on the way)</p></div></div>'+
        '<div class="acts" style="margin-top:20px"><a class="btn" href="browse.html">Browse side hustles</a><button class="btn ghost" data-t="post">Post one</button></div>';
    },
    async post(p){
      if(me.role==='seeker'){p.innerHTML='<p class="empty glass card">Your account is set to find side hustles. Create another account as "Finding a side hustler" or "Both" to post.</p>';return}
      p.innerHTML='<form class="glass card" id="pf" style="max-width:620px"><label for="pt">Title</label><input id="pt" maxlength="80" placeholder="e.g. Hand out flyers" required>'+
        '<label for="pc">Category</label><select id="pc">'+cfg.categories.map(c=>'<option>'+esc(c)+'</option>').join('')+'</select>'+
        '<label for="pd">What needs doing?</label><textarea id="pd" rows="4" maxlength="1000" placeholder="Describe the job clearly" required></textarea>'+
        '<div class="row2"><div><label for="pu">Duration</label><input id="pu" maxlength="60" placeholder="e.g. 2 days, 3 hours" required></div><div><label for="pp">Payout (USD)</label><input id="pp" type="number" min="1" step="0.5" required></div></div>'+
        '<p class="note" id="pn">Worker receives '+(100-cfg.feePercent)+'%. We keep '+cfg.feePercent+'%.</p><br><button class="btn" type="submit">Post side hustle</button></form>';
      $('#pp').oninput=()=>{const v=+$('#pp').value||0;$('#pn').textContent='Worker receives '+m$(v*(1-cfg.feePercent/100))+'. We keep '+m$(v*cfg.feePercent/100)+'.'};
      $('#pf').onsubmit=e=>{e.preventDefault();SH.run(async()=>{await SH.api('hustles','POST',{title:$('#pt').value,category:$('#pc').value,description:$('#pd').value,duration:$('#pu').value,payout:$('#pp').value});SH.toast('Side hustle posted. It is live now.');go('mine')},e.submitter)};
    },
    async mine(p){
      const d=await SH.api('mine');
      p.innerHTML=d.posted.length?'<div class="grid stagger">'+d.posted.reverse().map(x=>'<div class="glass card"><h3>'+esc(x.title)+' '+tag(x.status)+'</h3><p>'+m$(x.payout)+' &middot; '+esc(x.duration)+'</p>'+
        x.applicants.map(a=>'<p style="margin-top:8px"><b>'+esc(a.name)+'</b> '+tag(a.status)+(a.message?'<br>'+esc(a.message):'')+(x.status==='open'?'<br><button class="btn sm" data-a="accept" data-id="'+a.id+'">Accept</button>':'')+'</p>').join('')+
        (x.status==='assigned'?'<p style="margin-top:10px">Worker: <b>'+esc(x.workerName)+'</b></p><button class="btn sm" data-a="complete" data-id="'+x.id+'">Mark done and pay</button> ':'')+
        (x.status==='open'?'<br><button class="btn sm ghost danger" data-a="cancel" data-id="'+x.id+'" style="margin-top:10px">Cancel listing</button>':'')+'</div>').join('')+'</div>'
        :'<p class="empty glass card">You have not posted anything yet.</p>';
    },
    async applied(p){
      const d=await SH.api('mine');
      p.innerHTML=d.applied.length?'<div class="grid g2 stagger">'+d.applied.map(a=>'<div class="glass card"><h3>'+esc(a.hustle.title)+' '+tag(a.status)+'</h3><p>'+m$(a.hustle.net)+' to you &middot; '+esc(a.hustle.duration)+'</p></div>').join('')+'</div>'
        :'<p class="empty glass card">No applications yet. <a href="browse.html" style="color:var(--blue)">Browse side hustles</a></p>';
    },
    async pay(p){
      const d=await SH.api('mine');
      p.innerHTML=d.payments.length?'<div class="grid stagger">'+d.payments.map(x=>'<div class="glass card"><h3>'+esc(x.title)+' '+tag(x.status)+'</h3><p>You were the '+x.youAre+'. Payout '+m$(x.gross)+', fee '+m$(x.fee)+', worker gets '+m$(x.net)+(x.ref?'. EcoCash ref: '+esc(x.ref):'')+'</p></div>').join('')+'</div>'
        :'<p class="empty glass card">No payments yet.</p>';
    },
    async profile(p){
      p.innerHTML='<div class="glass card" style="max-width:560px"><h3>'+esc(me.name)+'</h3><p>'+esc(me.email)+' &middot; '+esc(me.phone)+'</p><p style="margin-top:6px">Status: '+tag(me.status)+'</p>'+
        '<form id="ef"><label for="ec">EcoCash number for payouts</label><input id="ec" type="tel" value="'+esc(me.ecocash)+'"><br><br><button class="btn" type="submit">Save EcoCash number</button></form></div>';
      $('#ef').onsubmit=e=>{e.preventDefault();SH.run(async()=>{me=await SH.api('profile','POST',{ecocash:$('#ec').value});SH.toast('EcoCash number saved.')},e.submitter)};
    }
  };
  async function go(t){tab=t;history.replaceState(0,'','#'+t);tabs();const p=$('#pane');p.innerHTML='<div class="skel"></div>';await SH.run(()=>views[t](p));SH.fx()}
  document.addEventListener('click',e=>{
    const t=e.target.closest('[data-t]');if(t)return go(t.dataset.t);
    const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,id=b.dataset.id;
    SH.run(async()=>{
      if(a==='accept')await SH.api('applications/'+id+'/accept','POST'),SH.toast('Worker accepted. Other applicants were declined.');
      if(a==='complete'){if(!await SH.dialog({title:'Mark this job as done?',text:'A payment will be created. We keep '+cfg.feePercent+'% and the worker gets the rest by EcoCash.',ok:'Yes, mark done'}))return;await SH.api('hustles/'+id+'/complete','POST');SH.toast('Done. Payment created.')}
      if(a==='cancel'){if(!await SH.dialog({title:'Cancel this listing?',ok:'Cancel listing'}))return;await SH.api('hustles/'+id+'/cancel','POST');SH.toast('Listing cancelled.')}
      go(tab);
    },b);
  });
  go(tab);
});
