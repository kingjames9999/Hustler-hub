// Shared tools used by every page: server calls, login state, menu, pop-ups, listing cards.
(function(){
const SH=window.SH={};
SH.$=(s,r)=>(r||document).querySelector(s);
SH.$$=(s,r)=>[...(r||document).querySelectorAll(s)];
SH.esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
SH.money=n=>'$'+Number(n||0).toFixed(2);
SH.tok=()=>localStorage.getItem('tok');
SH.me=null;SH.cfg=null;

// Talks to server.js
SH.api=async(p,method,body)=>{
  let r;
  try{r=await fetch('/api/'+p,{method:method||'GET',headers:{'Content-Type':'application/json','x-token':SH.tok()||''},body:body?JSON.stringify(body):undefined})}
  catch(e){throw new Error('Cannot reach the server. Start it with start.bat (or "node server.js") and open http://localhost:3000')}
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(d.error||'Something went wrong.');
  return d;
};
SH.json=async f=>{try{return await (await fetch(f)).json()}catch(e){return null}};
SH.toast=(m,bad)=>{
  let t=SH.$('#toast');if(!t){t=document.createElement('div');t.id='toast';t.setAttribute('role','status');document.body.appendChild(t)}
  t.textContent=m;t.className='show'+(bad?' bad':'');clearTimeout(t._t);t._t=setTimeout(()=>t.className='',4500);
};
SH.run=async(f,btn)=>{
  if(btn)btn.disabled=true;
  try{return await f()}catch(e){SH.toast(e.message,true)}finally{if(btn)btn.disabled=false}
};

// Pop-up box. Returns the typed text (or true) when OK is pressed, null when cancelled.
SH.dialog=o=>new Promise(res=>{
  const d=document.createElement('dialog');d.className='glass';
  d.innerHTML='<form method="dialog"><h3>'+SH.esc(o.title)+'</h3>'+(o.text?'<p class="note">'+SH.esc(o.text)+'</p>':'')+
    (o.input?'<label class="sr" for="dv">'+SH.esc(o.label||'')+'</label><input id="dv" placeholder="'+SH.esc(o.placeholder||'')+'">':'')+
    '<div class="dact"><button class="btn" value="ok">'+SH.esc(o.ok||'OK')+'</button><button class="btn ghost" value="no" formnovalidate>Cancel</button></div></form>';
  document.body.appendChild(d);d.showModal();
  d.addEventListener('close',()=>{const ok=d.returnValue==='ok',v=o.input?SH.$('#dv',d).value:true;d.remove();res(ok?v:null)});
});

// A side hustle card
SH.card=(h,showApply)=>'<article class="glass card" data-rv><span class="tag">'+SH.esc(h.duration)+'</span> <span class="tag blue">'+SH.esc(h.category||'Other')+'</span>'+
  '<h3>'+SH.esc(h.title)+'</h3><p>'+SH.esc(h.description)+'</p>'+
  '<div class="split"><div><span>Payout</span><span>'+SH.money(h.payout)+'</span></div><div class="you"><span>Worker receives</span><span>'+SH.money(h.net)+'</span></div></div>'+
  '<p class="note">Posted by '+SH.esc(h.posterName)+'</p>'+(showApply?'<button class="btn sm" data-apply="'+h.id+'">Apply</button>':'')+'</article>';

// Apply button on any page
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-apply]');if(!b)return;
  if(!SH.me){location.href='join.html#login';return}
  SH.run(async()=>{
    const m=await SH.dialog({title:'Apply for this side hustle',text:'Add a short message to the poster (optional).',input:1,label:'Message',placeholder:'Why you are a good fit',ok:'Send application'});
    if(m===null)return;
    await SH.api('hustles/'+b.dataset.apply+'/apply','POST',{message:m});
    SH.toast('Application sent. The poster will review it.');
    b.textContent='Applied ✔';b.disabled=true;
  });
});

// Builds the top menu, footer and WhatsApp button on every page
function chrome(){
  const c=SH.cfg,me=SH.me,here=location.pathname.split('/').pop()||'index.html';
  document.body.insertAdjacentHTML('afterbegin','<div class="aurora"><i></i><i></i><i></i></div>'+
  '<header class="top glass"><a class="logo" href="index.html"><svg viewBox="0 0 32 32"><defs><linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5468"/><stop offset=".5" stop-color="#a07bff"/><stop offset="1" stop-color="#5b8cff"/></linearGradient></defs><path d="M16 2l12 14-12 14L4 16z" fill="url(#lg1)"/><path d="M16 9l6 7-6 7-6-7z" fill="#060b1f"/></svg><span>'+SH.esc(c.brand)+'</span></a>'+
  '<nav>'+c.nav.map(n=>'<a href="'+n.href+'"'+(n.href===here?' class="on"':'')+'>'+SH.esc(n.label)+'</a>').join('')+'</nav>'+
  '<div class="auth">'+(me?'<a class="btn sm ghost" href="dashboard.html">Dashboard</a>'+(me.isAdmin?'<a class="btn sm ghost" href="admin.html">Admin</a>':'')+'<button class="btn sm" id="out">Log out</button>'
    :'<a class="btn sm ghost" href="join.html#login">Log in</a><a class="btn sm" href="join.html">Sign up free</a>')+'<button class="burger" aria-label="Menu">☰</button></div></header>');
  document.body.insertAdjacentHTML('beforeend','<footer><div class="wrap"><nav>'+c.nav.map(n=>'<a href="'+n.href+'">'+SH.esc(n.label)+'</a>').join('')+'</nav>&copy; '+new Date().getFullYear()+' '+SH.esc(c.brand)+' by '+SH.esc(c.owner)+'. Members must be '+c.minAge+' or older.</div></footer>'+
  '<a class="wa" href="https://wa.me/'+c.whatsapp+'?text=Hi%2C%20I%27d%20like%20to%20know%20more%20about%20'+encodeURIComponent(c.brand)+'" aria-label="Chat on WhatsApp">💬 Chat on WhatsApp</a>');
  SH.$('.burger').onclick=()=>SH.$('.top').classList.toggle('open');
  SH.$$('.top nav a').forEach(a=>a.onclick=()=>SH.$('.top').classList.remove('open'));
  const o=SH.$('#out');if(o)o.onclick=async()=>{await SH.api('logout','POST').catch(()=>{});localStorage.removeItem('tok');location.href='index.html'};
}

// Every page calls this first. opts.need = 'login' or 'admin'
SH.init=async opts=>{
  opts=opts||{};
  SH.cfg=await SH.json('config.json')||{brand:'Side Hustle Hub',owner:'',whatsapp:'',nav:[],categories:[],minAge:16,feePercent:20,heroWords:[],phones:[]};
  if(SH.tok()){try{SH.me=await SH.api('me')}catch(e){if(!/reach/.test(e.message))localStorage.removeItem('tok')}}
  if((opts.need==='login'&&!SH.me)||(opts.need==='admin'&&!(SH.me&&SH.me.isAdmin))){location.href='join.html#login';return new Promise(()=>{})}
  chrome();
  if(SH.fx)SH.fx();
  return {cfg:SH.cfg,me:SH.me};
};
})();
