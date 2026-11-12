// Admin control room: approve members, view proof of age, send and record EcoCash payouts.
SH.init({need:'admin'}).then(async()=>{
  const $=SH.$,esc=SH.esc,m$=SH.money;let tab='users',filt='pending',D;
  const tag=s=>'<span class="tag '+({approved:'',pending:'red',rejected:'red',paid:'',awaiting_payout:'red'}[s]||'')+'">'+s.replace('_',' ')+'</span>';
  async function load(){D=await SH.api('admin');
    $('#kpis').innerHTML='<div class="glass card"><b class="gt" style="font-size:2rem" data-count="'+D.earned+'" data-pre="$">0</b><p>Your 20% earned</p></div><div class="glass card"><b class="gt" style="font-size:2rem" data-count="'+D.owed+'" data-pre="$">0</b><p>Still to send by EcoCash</p></div><div class="glass card"><b class="gt" style="font-size:2rem" data-count="'+D.users.filter(u=>u.status==='pending').length+'">0</b><p>Members waiting for approval</p></div>';
    draw()}
  function draw(){
    $('#tabs').innerHTML=[['users','Members'],['pay','Payouts']].map(t=>'<button class="btn sm'+(t[0]===tab?'':' ghost')+'" data-t="'+t[0]+'">'+t[1]+'</button>').join('');
    let h='';
    if(tab==='users'){
      h='<div class="chips" style="grid-column:1/-1">'+['pending','approved','rejected','all'].map(f=>'<button class="chip'+(f===filt?' on':'')+'" data-f="'+f+'">'+f+'</button>').join('')+'</div>';
      const l=D.users.filter(u=>filt==='all'||u.status===filt);
      h+=l.length?l.map(u=>'<div class="glass card"><h3>'+esc(u.name)+' '+tag(u.status)+'</h3><p>'+esc(u.email)+'<br>'+esc(u.phone)+' &middot; '+u.role+'</p><div class="acts" style="margin-top:12px"><button class="btn sm ghost" data-a="proof" data-id="'+u.id+'">View proof of age</button><button class="btn sm" data-a="approve" data-id="'+u.id+'">Approve</button><button class="btn sm ghost danger" data-a="reject" data-id="'+u.id+'">Reject</button></div></div>').join(''):'<p class="empty glass card" style="grid-column:1/-1">No members in this list.</p>';
    }else{
      h=D.payments.length?D.payments.slice().reverse().map(x=>'<div class="glass card"><h3>'+esc(x.title)+' '+tag(x.status)+'</h3><p>Send <b>'+m$(x.net)+'</b> by EcoCash to '+esc(x.worker)+' on <b>'+esc(x.ecocash)+'</b>.<br>Your fee: '+m$(x.fee)+'</p>'+(x.status!=='paid'?'<br><button class="btn sm" data-a="paid" data-id="'+x.id+'">Mark as paid</button>':'<p class="note">EcoCash ref: '+esc(x.ref)+'</p>')+'</div>').join(''):'<p class="empty glass card" style="grid-column:1/-1">No payouts yet.</p>';
    }
    $('#pane').className='grid '+(tab==='users'?'g2':'');$('#pane').innerHTML=h;SH.fx();
  }
  document.addEventListener('click',e=>{
    const t=e.target.closest('[data-t]');if(t){tab=t.dataset.t;return draw()}
    const f=e.target.closest('[data-f]');if(f){filt=f.dataset.f;return draw()}
    const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,id=b.dataset.id;
    SH.run(async()=>{
      if(a==='proof'){const r=await fetch('/api/proof/'+id,{headers:{'x-token':SH.tok()}});if(!r.ok)throw new Error('Could not load proof.');return window.open(URL.createObjectURL(await r.blob()))}
      if(a==='approve'||a==='reject'){await SH.api('admin/users/'+id+'/'+a,'POST');SH.toast('Member '+a+'d.')}
      if(a==='paid'){const ref=await SH.dialog({title:'Record EcoCash payout',text:'Enter the EcoCash reference after you have sent the money.',input:1,label:'Reference',placeholder:'EcoCash reference',ok:'Mark as paid'});if(ref===null)return;await SH.api('admin/payments/'+id,'POST',{ref});SH.toast('Marked as paid.')}
      await load();
    },b);
  });
  SH.run(load);
});
