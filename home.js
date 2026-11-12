// Home page: rotating words, live numbers, calculator, latest listings, FAQ and testimonials.
SH.init().then(async({cfg})=>{
  const $=SH.$,esc=SH.esc;
  // rotating headline word
  const w=cfg.heroWords||[],el=$('#rot');let i=0;
  if(w.length>1)setInterval(()=>{el.classList.add('out');setTimeout(()=>{i=(i+1)%w.length;el.textContent=w[i];el.classList.remove('out')},350)},2600);
  // scrolling category strip
  $('#marq').innerHTML=cfg.categories.concat(cfg.categories).map(c=>'<span>'+esc(c)+'</span>').join('');
  // contact list
  $('#contactList').innerHTML='<li><a href="https://wa.me/'+cfg.whatsapp+'">WhatsApp '+esc(cfg.phones[0])+'</a></li>'+
    '<li><a href="tel:'+cfg.phones[1].replace(/\s/g,'')+'">Call '+esc(cfg.phones[1])+'</a></li><li><a href="mailto:'+cfg.email+'">'+esc(cfg.email)+'</a></li><li>Hours: '+esc(cfg.hours)+'</li>';
  // fee calculator
  const amt=$('#amt'),f=cfg.feePercent/100;
  const calc=()=>{const v=parseFloat(amt.value)||0;$('#fee').textContent=SH.money(v*f);$('#net').textContent=SH.money(v*(1-f))};
  amt.addEventListener('input',calc);
  // FAQ + testimonials from JSON files
  const faq=await SH.json('faq.json')||[];
  $('#faqList').innerHTML=faq.map(x=>'<details class="glass"><summary>'+esc(x.q)+'</summary><p>'+esc(x.a)+'</p></details>').join('');
  const t=await SH.json('testimonials.json')||[];
  $('#testi').innerHTML=t.map(x=>'<div class="glass card"><p>“'+esc(x.text)+'”</p><h3 style="margin-top:12px">'+esc(x.name)+'</h3><p class="note">'+esc(x.role)+'</p></div>').join('');
  // live numbers and listings (need the server)
  try{
    const s=await SH.api('stats');
    [['s1',s.members],['s2',s.open],['s3',s.paid]].forEach(([id,v])=>{const n=$('#'+id);n.dataset.count=v;n.classList.remove('seen')});
    const l=await SH.api('hustles');
    $('#latestList').innerHTML=l.length?l.slice(0,3).map(h=>SH.card(h,true)).join(''):'<p class="empty glass card" style="grid-column:1/-1">No side hustles yet. Be the first to post one.</p>';
  }catch(e){$('#latestList').innerHTML='<p class="empty glass card" style="grid-column:1/-1">'+esc(e.message)+'</p>'}
  SH.fx();
});
