// Side Hustle Hub prototype server. No installs needed: only Node.js (v18 or newer).
// Start it with:  node server.js   then open http://localhost:3000
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const DIR=__dirname, DBF=path.join(DIR,'database.json');
const S=JSON.parse(fs.readFileSync(path.join(DIR,'settings.json'),'utf8')); // private settings: see settings.json
const PORT=process.env.PORT||S.port||3000;
const ADMIN=(process.env.ADMIN_EMAIL||S.adminEmail).toLowerCase();
const FEE=S.feePercent/100, MINAGE=S.minAge||16;

// ---- Database: one plain file, database.json, created automatically ----
let db={users:[],hustles:[],applications:[],payments:[],sessions:{}};
if(fs.existsSync(DBF)) db=JSON.parse(fs.readFileSync(DBF,'utf8'));
const save=()=>fs.writeFileSync(DBF,JSON.stringify(db,null,1));
const uid=()=>crypto.randomBytes(6).toString('hex');
const hash=(p,s)=>crypto.scryptSync(p,s,32).toString('hex');
const clean=u=>({id:u.id,name:u.name,phone:u.phone,ecocash:u.ecocash,email:u.email,role:u.role,status:u.status,isAdmin:u.isAdmin,created:u.created});
const money=n=>Math.round(n*100)/100;

const send=(res,code,obj)=>{res.writeHead(code,{'Content-Type':'application/json'});res.end(JSON.stringify(obj))};
const fail=(res,code,msg)=>send(res,code,{error:msg});
const body=req=>new Promise((ok,no)=>{let b='';req.on('data',c=>{b+=c;if(b.length>3e6){no(new Error('Upload too large'));req.destroy()}});req.on('end',()=>{try{ok(b?JSON.parse(b):{})}catch(e){no(new Error('Bad request'))}})});
const str=(v,min,max)=>typeof v==='string'&&v.trim().length>=min&&v.trim().length<=max?v.trim():null;

async function api(req,res,parts){
  const m=req.method, d=m==='POST'?await body(req):{};
  const me=db.users.find(u=>u.id===db.sessions[req.headers['x-token']]);
  const need=(cond,msg)=>{if(!cond)throw Object.assign(new Error(msg),{code:403})};
  const view=h=>({...h,posterName:(db.users.find(u=>u.id===h.posterId)||{}).name,net:money(h.payout*(1-FEE))});

  if(m==='POST'&&parts[0]==='register'){
    const name=str(d.name,2,60),email=str(d.email,5,80),pass=str(d.password,6,100);
    const phone=String(d.phone||'').replace(/[^\d+]/g,''),eco=String(d.ecocash||d.phone||'').replace(/[^\d+]/g,'');
    if(!name||!email||!/^\S+@\S+\.\S+$/.test(email)||!pass||phone.replace(/\D/g,'').length<9) return fail(res,400,'Please fill in name, valid email, phone and a password of 6+ characters.');
    if(!['seeker','poster','both'].includes(d.role)) return fail(res,400,'Choose what you are looking for.');
    const dob=new Date(d.dob); if(isNaN(dob)) return fail(res,400,'Enter your date of birth.');
    const age=(Date.now()-dob)/31557600000; if(age<MINAGE) return fail(res,400,'You must be '+MINAGE+' or older to join.');
    if(db.users.some(u=>u.email===email.toLowerCase()||u.phone===phone)) return fail(res,409,'That email or phone is already registered. Try logging in.');
    const mt=/^data:image\/(png|jpeg|webp);base64,(.+)$/.exec(d.proof||'');
    if(!mt) return fail(res,400,'Attach a photo of your proof of age (ID, birth certificate or school ID).');
    const salt=crypto.randomBytes(8).toString('hex'),isAdmin=email.toLowerCase()===ADMIN,id=uid();
    const file='proof_'+id+'.'+(mt[1]==='jpeg'?'jpg':mt[1]);
    fs.writeFileSync(path.join(DIR,file),Buffer.from(mt[2],'base64'));
    const u={id,name,phone,ecocash:eco,email:email.toLowerCase(),role:d.role,salt,pass:hash(pass,salt),proof:file,dob:d.dob,status:isAdmin?'approved':'pending',isAdmin,created:new Date().toISOString()};
    db.users.push(u);const t=crypto.randomBytes(24).toString('hex');db.sessions[t]=id;save();
    return send(res,200,{token:t,user:clean(u)});
  }
  if(m==='POST'&&parts[0]==='login'){
    const u=db.users.find(u=>u.email===String(d.email||'').toLowerCase());
    if(!u||hash(String(d.password||''),u.salt)!==u.pass) return fail(res,401,'Wrong email or password.');
    const t=crypto.randomBytes(24).toString('hex');db.sessions[t]=u.id;save();
    return send(res,200,{token:t,user:clean(u)});
  }
  if(m==='GET'&&parts[0]==='hustles') return send(res,200,db.hustles.filter(h=>h.status==='open').reverse().map(view));
  if(m==='GET'&&parts[0]==='stats') return send(res,200,{members:db.users.length,open:db.hustles.filter(h=>h.status==='open').length,paid:money(db.payments.filter(p=>p.status==='paid').reduce((s,p)=>s+p.net,0))});
  if(!me) return fail(res,401,'Please log in first.');
  if(m==='POST'&&parts[0]==='profile'){const e=String(d.ecocash||'').replace(/[^\d+]/g,'');if(e.replace(/\D/g,'').length<9)return fail(res,400,'Enter a valid EcoCash number.');me.ecocash=e;save();return send(res,200,clean(me))}
  if(m==='POST'&&parts[0]==='hustles'&&parts[2]==='cancel'){const h=db.hustles.find(h=>h.id===parts[1]);need(h&&h.posterId===me.id&&h.status==='open','Only your open side hustles can be cancelled.');h.status='cancelled';db.applications.filter(a=>a.hustleId===h.id).forEach(a=>a.status='declined');save();return send(res,200,{ok:1})}

  if(m==='GET'&&parts[0]==='me') return send(res,200,clean(me));
  if(m==='POST'&&parts[0]==='logout'){delete db.sessions[req.headers['x-token']];save();return send(res,200,{ok:1})}

  if(m==='POST'&&parts[0]==='hustles'&&!parts[1]){
    need(me.status==='approved','Your proof of age must be approved before you can post.');
    need(me.role!=='seeker','Your account is set up to find side hustles, not post them.');
    const cat=str(d.category,2,40)||'Other',title=str(d.title,3,80),desc=str(d.description,10,1000),dur=str(d.duration,1,60),pay=Number(d.payout);
    if(!title||!desc||!dur||!(pay>=1&&pay<=10000)) return fail(res,400,'Add a title, a description (10+ characters), the duration and a payout of $1 or more.');
    const h={id:uid(),posterId:me.id,title,category:cat,description:desc,duration:dur,payout:money(pay),status:'open',workerId:null,created:new Date().toISOString()};
    db.hustles.push(h);save();return send(res,200,view(h));
  }
  if(m==='POST'&&parts[0]==='hustles'&&parts[2]==='apply'){
    need(me.status==='approved','Your proof of age must be approved before you can apply.');
    need(me.role!=='poster','Your account is set up to post side hustles, not apply.');
    const h=db.hustles.find(h=>h.id===parts[1]);
    if(!h||h.status!=='open') return fail(res,404,'This side hustle is no longer open.');
    if(h.posterId===me.id) return fail(res,400,'You cannot apply to your own side hustle.');
    if(db.applications.some(a=>a.hustleId===h.id&&a.workerId===me.id)) return fail(res,409,'You already applied.');
    db.applications.push({id:uid(),hustleId:h.id,workerId:me.id,message:String(d.message||'').slice(0,300),status:'pending',created:new Date().toISOString()});
    save();return send(res,200,{ok:1});
  }
  if(m==='POST'&&parts[0]==='applications'&&parts[2]==='accept'){
    const a=db.applications.find(a=>a.id===parts[1]),h=a&&db.hustles.find(h=>h.id===a.hustleId);
    need(h&&h.posterId===me.id&&h.status==='open','Not allowed.');
    db.applications.filter(x=>x.hustleId===h.id).forEach(x=>x.status=x.id===a.id?'accepted':'declined');
    h.status='assigned';h.workerId=a.workerId;save();return send(res,200,{ok:1});
  }
  if(m==='POST'&&parts[0]==='hustles'&&parts[2]==='complete'){
    const h=db.hustles.find(h=>h.id===parts[1]);
    need(h&&h.posterId===me.id&&h.status==='assigned','Not allowed.');
    const w=db.users.find(u=>u.id===h.workerId),fee=money(h.payout*FEE);
    h.status='completed';
    db.payments.push({id:uid(),hustleId:h.id,title:h.title,posterId:me.id,workerId:w.id,gross:h.payout,fee,net:money(h.payout-fee),ecocash:w.ecocash,status:'awaiting_payout',ref:null,created:new Date().toISOString()});
    save();return send(res,200,{ok:1});
  }
  if(m==='GET'&&parts[0]==='mine'){
    const nm=i=>(db.users.find(u=>u.id===i)||{}).name;
    const posted=db.hustles.filter(h=>h.posterId===me.id).map(h=>({...view(h),workerName:nm(h.workerId),applicants:db.applications.filter(a=>a.hustleId===h.id).map(a=>({...a,name:nm(a.workerId)}))}));
    const applied=db.applications.filter(a=>a.workerId===me.id).map(a=>({...a,hustle:view(db.hustles.find(h=>h.id===a.hustleId)||{})}));
    const payments=db.payments.filter(p=>p.posterId===me.id||p.workerId===me.id).map(p=>({...p,youAre:p.workerId===me.id?'worker':'poster'}));
    return send(res,200,{posted,applied,payments});
  }
  // ---- Admin only ----
  if(parts[0]==='admin'){
    need(me.isAdmin,'Admins only.');
    if(m==='GET') return send(res,200,{users:db.users.filter(u=>!u.isAdmin).map(clean),payments:db.payments.map(p=>({...p,worker:(db.users.find(u=>u.id===p.workerId)||{}).name})),
      earned:money(db.payments.filter(p=>p.status==='paid').reduce((s,p)=>s+p.fee,0)),owed:money(db.payments.filter(p=>p.status!=='paid').reduce((s,p)=>s+p.net,0))});
    if(m==='POST'&&parts[1]==='users'){const u=db.users.find(u=>u.id===parts[2]);need(u,'No such user.');u.status=parts[3]==='approve'?'approved':'rejected';save();return send(res,200,{ok:1})}
    if(m==='POST'&&parts[1]==='payments'){const p=db.payments.find(p=>p.id===parts[2]);need(p,'No such payment.');p.status='paid';p.ref=String(d.ref||'').slice(0,60);p.paidAt=new Date().toISOString();save();return send(res,200,{ok:1})}
  }
  if(m==='GET'&&parts[0]==='proof'){
    need(me.isAdmin,'Admins only.');const u=db.users.find(u=>u.id===parts[1]);need(u,'No such user.');
    const f=path.join(DIR,path.basename(u.proof));res.writeHead(200,{'Content-Type':'image/'+(f.endsWith('jpg')?'jpeg':f.split('.').pop())});return res.end(fs.readFileSync(f));
  }
  fail(res,404,'Not found');
}

const MIME={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon'};
const PRIVATE=['server.js','database.json','settings.json'];   // never sent to visitors
http.createServer(async(req,res)=>{
  try{
    const url=decodeURIComponent(req.url.split('?')[0]);
    if(url.startsWith('/api/')) return await api(req,res,url.slice(5).split('/').filter(Boolean));
    const f=path.basename(url)||'index.html',fp=path.join(DIR,f);
    if(!MIME[path.extname(f)]||PRIVATE.includes(f)||f.startsWith('proof_')||!fs.existsSync(fp)){res.writeHead(404,{'Content-Type':'text/plain'});return res.end('Not found')}
    res.writeHead(200,{'Content-Type':MIME[path.extname(f)]});res.end(fs.readFileSync(fp));
  }catch(e){fail(res,e.code||400,e.message||'Error')}
}).listen(PORT,()=>console.log('Side Hustle Hub running: http://localhost:'+PORT+'\nAdmin email: '+ADMIN+' (register with it to become admin)'));
