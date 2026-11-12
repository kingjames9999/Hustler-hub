// Sign up and log in. Shrinks the ID photo so it uploads fast on slow data.
SH.init().then(({cfg,me})=>{
  const $=SH.$;
  if(me){location.href='dashboard.html';return}
  $('#agetxt').textContent='I am '+cfg.minAge+' or older and the photo is mine.';
  function show(login){
    $('#sf').hidden=login;$('#lf').hidden=!login;
    $('#t1').className='btn'+(login?' ghost':'');$('#t2').className='btn'+(login?'':' ghost');
  }
  $('#t1').onclick=()=>{history.replaceState(0,'','#');show(false)};
  $('#t2').onclick=()=>{history.replaceState(0,'','#login');show(true)};
  show(location.hash==='#login');
  const shrink=f=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>{const s=Math.min(1,1000/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=i.width*s;c.height=i.height*s;c.getContext('2d').drawImage(i,0,0,c.width,c.height);ok(c.toDataURL('image/jpeg',.7))};i.onerror=()=>no(new Error('That file is not a photo.'));i.src=URL.createObjectURL(f)});
  const go=r=>{localStorage.setItem('tok',r.token);location.href='dashboard.html'};
  $('#lf').onsubmit=e=>{e.preventDefault();SH.run(async()=>{
    try{go(await SH.api('login','POST',{email:$('#le').value,password:$('#lp').value}))}catch(x){$('#lerr').textContent=x.message}
  },e.submitter)};
  $('#sf').onsubmit=e=>{e.preventDefault();const err=$('#err');err.textContent='';SH.run(async()=>{
    if(!$('#age').checked)return err.textContent='Please confirm your age.';
    const file=$('#proof').files[0];if(!file)return err.textContent='Attach a photo of your proof of age.';
    const proof=await shrink(file).catch(x=>{err.textContent=x.message});if(!proof)return;
    try{go(await SH.api('register','POST',{role:document.querySelector('input[name=role]:checked').value,name:$('#nm').value,phone:$('#ph').value,ecocash:$('#eco').value,email:$('#em').value,password:$('#pw').value,dob:$('#dob').value,proof}))}
    catch(x){err.textContent=x.message}
  },e.submitter)};
});
