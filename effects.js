// Visual effects: scroll reveal, card tilt, button ripple + magnet, number counters, cursor glow, progress bar.
(function(){
const SH=window.SH,calm=matchMedia('(prefers-reduced-motion:reduce)').matches,fine=matchMedia('(hover:hover)').matches;
let io;
function counters(el){
  const to=+el.dataset.count,pre=el.dataset.pre||'',t0=performance.now();
  (function f(t){const k=Math.min(1,(t-t0)/1400),e=1-Math.pow(1-k,3);el.textContent=pre+(to%1?(to*e).toFixed(2):Math.round(to*e));if(k<1)requestAnimationFrame(f)})(t0);
}
// Call SH.fx() again after adding new content so it animates too.
SH.fx=function(){
  const els=SH.$$('[data-rv]:not(.seen),[data-count]:not(.seen),.stagger>*:not(.seen)');
  if(calm||!('IntersectionObserver' in window)){els.forEach(e=>{e.classList.add('seen');e.classList.remove('rv');if(e.dataset.count)counters(e)});return}
  io=io||new IntersectionObserver(es=>es.forEach(x=>{
    if(!x.isIntersecting)return;const e=x.target;io.unobserve(e);
    if(e.dataset.count)return counters(e);
    e.classList.add('in');setTimeout(()=>e.classList.remove('rv','in'),1100);
  }),{threshold:.12});
  els.forEach((e,i)=>{e.classList.add('seen');if(e.dataset.count){io.observe(e);return}
    e.classList.add('rv');if(e.parentElement.classList.contains('stagger'))e.style.setProperty('--d',(Array.prototype.indexOf.call(e.parentElement.children,e)*.09)+'s');io.observe(e)});
};
if(calm)return;
// scroll progress bar + header shadow
const bar=document.createElement('div');bar.className='prog';document.body.appendChild(bar);
addEventListener('scroll',()=>{const h=document.documentElement,p=h.scrollTop/((h.scrollHeight-h.clientHeight)||1);bar.style.transform='scaleX('+p+')';const t=SH.$('.top');if(t)t.classList.toggle('scrolled',h.scrollTop>20)},{passive:true});
// button ripple
document.addEventListener('pointerdown',e=>{
  const b=e.target.closest('.btn');if(!b)return;const r=b.getBoundingClientRect(),s=document.createElement('span'),d=Math.max(r.width,r.height);
  s.className='rip';s.style.cssText='width:'+d+'px;height:'+d+'px;left:'+(e.clientX-r.left-d/2)+'px;top:'+(e.clientY-r.top-d/2)+'px';b.appendChild(s);setTimeout(()=>s.remove(),650);
});
if(!fine)return;
// soft light that follows the mouse
const g=document.createElement('div');g.className='glow';document.body.appendChild(g);
addEventListener('pointermove',e=>{g.style.opacity=1;g.style.transform='translate('+e.clientX+'px,'+e.clientY+'px)'});
// card tilt + magnetic buttons
document.addEventListener('pointermove',e=>{
  const t=e.target.closest('.tilt');
  SH.$$('.tilt').forEach(x=>{if(x!==t)x.style.transform=''});
  if(t){const r=t.getBoundingClientRect(),px=(e.clientX-r.left)/r.width-.5,py=(e.clientY-r.top)/r.height-.5;t.style.transform='perspective(800px) rotateY('+px*10+'deg) rotateX('+-py*10+'deg)'}
  const b=e.target.closest('.btn:not(.sm)');
  SH.$$('.btn.mag').forEach(x=>{if(x!==b){x.classList.remove('mag');x.style.translate=''}});
  if(b){const r=b.getBoundingClientRect();b.classList.add('mag');b.style.translate=((e.clientX-r.left-r.width/2)*.12)+'px '+((e.clientY-r.top-r.height/2)*.2)+'px'}
});
})();
