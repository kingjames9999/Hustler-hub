// Browse page: search, category filter, sort, apply.
SH.init().then(async({cfg,me})=>{
  const $=SH.$,esc=SH.esc;let all=[],cat='All';
  const cats=['All'].concat(cfg.categories);
  $('#chips').innerHTML=cats.map(c=>'<button class="chip'+(c===cat?' on':'')+'" data-c="'+esc(c)+'">'+esc(c)+'</button>').join('');
  function draw(){
    const q=$('#q').value.toLowerCase(),s=$('#sort').value;
    let l=all.filter(h=>(cat==='All'||h.category===cat)&&(h.title+' '+h.description).toLowerCase().includes(q));
    if(s==='hi')l.sort((a,b)=>b.payout-a.payout);if(s==='lo')l.sort((a,b)=>a.payout-b.payout);
    $('#count').textContent=l.length+' side hustle'+(l.length===1?'':'s')+' found';
    $('#list').innerHTML=l.length?l.map(h=>SH.card(h,!me||(me.role!=='poster'&&h.posterId!==me.id))).join(''):'<p class="empty glass card" style="grid-column:1/-1">Nothing matches. Try another category or search.</p>';
    SH.fx();
  }
  $('#chips').onclick=e=>{const b=e.target.closest('.chip');if(!b)return;cat=b.dataset.c;SH.$$('.chip').forEach(x=>x.classList.toggle('on',x===b));draw()};
  $('#q').oninput=draw;$('#sort').onchange=draw;
  try{all=await SH.api('hustles');draw()}catch(e){$('#list').innerHTML='<p class="empty glass card" style="grid-column:1/-1">'+esc(e.message)+'</p>'}
});
