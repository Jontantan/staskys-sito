/* Staskys — PATCH 4.2: Higher or Lower tra membri. Domande vere prese dalle liste del catalogo:
   "chi ha visto più film?", "chi ha votato più alto <titolo>?", ecc. Ogni risposta giusta allunga la serie;
   alla prima sbagliata la partita finisce e la serie si salva (con l'anti-cheat della patch 4.2). */
(function(){
/* membri che non compaiono mai nel gioco */
const ESCLUSI=new Set(['1288884213067546701']),ESCL_NOMI=/malva|vanitas/i;
const K={anime:['anime','visto più anime','anime visti'],game:['giochi','giocato più giochi','giochi finiti'],movie:['film','visto più film','film visti'],
 tv:['serie','visto più serie TV','serie viste'],manga:['manga','letto più manga','manga letti'],book:['libri','letto più libri','libri letti']};
const fmtV=v=>Number.isInteger(+v)?String(v):String(Math.round(v*10)/10).replace('.',',');
const rnd=a=>a[Math.random()*a.length|0];
function make(A){
 const {q,qa,E,stage,msg}=A,SP=window.STASKYS_SP;
 stage.innerHTML=`<div class="ghud"><span>Serie <b id="sc">0</b></span><span>Record <b id="rec">${+localStorage.hol_best||0}</b></span><button class="mute" id="mute" aria-label="Audio"></button></div>
 <div class="hol" id="hol"><div class="qbox"><p class="big" style="font-size:1.6rem">Higher or Lower</p><p class="muted">Chi ha visto più film? Chi ha votato più alto un titolo? Scegli tra due membri di Staskys: ogni risposta giusta allunga la serie, alla prima sbagliata è finita.</p></div></div>
 <button class="btn sm" id="go">Gioca</button><p class="gmsg"></p>`;
 A.muteBtn(q('#mute'));const z=q('#hol');
 let data=null,st='idle',score=0,used=new Set(),cur=null,nextT=0,alive=true;
 async function loadData(){if(data)return data;const sb=A.sb;if(!sb)return null;
  const rows=[];for(let from=0;from<20000;from+=1000){const {data:d,error}=await sb.from('media_ratings').select('discord_id,kind,media_id,title,cover,rating,status').order('id').range(from,from+999);
   if(error)break;rows.push(...(d||[]));if(!d||d.length<1000)break}
  const mem=SP?await SP.load(sb).catch(()=>({})):{};
  const users=new Map();
  rows.forEach(r=>{const did=String(r.discord_id||'');const m=mem[did];if(!did||ESCLUSI.has(did)||!m||m.in_server===false||!m.nick)return;
   if(ESCL_NOMI.test(m.nick+' '+(m.username||'')))return;
   let u=users.get(did);if(!u){u={did,name:SP.clean(m.nick),av:m.avatar||SP.defAv(did),done:{},rated:new Map(),sum:0,n:0,all:0};users.set(did,u)}
   u.all++;if(r.status==='visto')u.done[r.kind]=(u.done[r.kind]||0)+1;
   if(r.rating!=null&&r.rating!==''){u.rated.set(r.kind+':'+r.media_id,{v:+r.rating,t:r.title,c:r.cover});u.sum+=+r.rating;u.n++}});
  const U=[...users.values()].filter(u=>u.all>=3);
  const byTitle=new Map();U.forEach(u=>u.rated.forEach((x,k)=>{if(!byTitle.has(k))byTitle.set(k,[]);byTitle.get(k).push({u,...x})}));
  return data={U,shared:[...byTitle.entries()].filter(([,L])=>L.length>=2)}}
 /* una domanda: due membri con valori DIVERSI (niente pareggi) */
 function question(){const {U,shared}=data;
  for(let tries=0;tries<200;tries++){const type=rnd(['done','done','title','title','title','all','avg']);let Q=null;
   if(type==='done'){const k=rnd(Object.keys(K)),L=U.filter(u=>(u.done[k]||0)>0);if(L.length<2)continue;const a=rnd(L),b=rnd(L);if(a===b||a.done[k]===b.done[k])continue;
    Q={key:'d'+k+[a.did,b.did].sort(),txt:`Chi ha ${K[k][1]}?`,a,b,va:a.done[k],vb:b.done[k],unit:K[k][2]}}
   else if(type==='title'&&shared.length){const [k,L]=rnd(shared);const a=rnd(L),b=rnd(L);if(a===b||a.v===b.v)continue;
    Q={key:'t'+k+[a.u.did,b.u.did].sort(),txt:`Chi ha votato più alto <b>${E(a.t)}</b>?`,cover:a.c||b.c,a:a.u,b:b.u,va:a.v,vb:b.v,unit:'voto'}}
   else if(type==='all'){const a=rnd(U),b=rnd(U);if(a===b||a.all===b.all)continue;Q={key:'a'+[a.did,b.did].sort(),txt:'Chi ha più titoli nella sua lista?',a,b,va:a.all,vb:b.all,unit:'titoli'}}
   else if(type==='avg'){const L=U.filter(u=>u.n>=5);if(L.length<2)continue;const a=rnd(L),b=rnd(L);if(a===b)continue;const va=Math.round(a.sum/a.n*10)/10,vb=Math.round(b.sum/b.n*10)/10;if(va===vb)continue;
    Q={key:'m'+[a.did,b.did].sort(),txt:'Chi dà voti più alti, in media?',a,b,va,vb,unit:'media'}}
   if(Q&&!used.has(Q.key)){used.add(Q.key);return Q}}
  return null}
 const card=(u,v,i,unit)=>`<button class="holc" data-i="${i}"><img src="${E(u.av)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='assets/icon.png'"><b>${E(u.name)}</b><span class="holv" aria-live="polite">${st==='reveal'?`${fmtV(v)} <small>${E(unit)}</small>`:'?'}</span><kbd>${i+1}</kbd></button>`;
 function show(){cur=question();if(!cur){end(true);return}st='ask';
  z.innerHTML=`<div class="qbox holq"><p class="qq">${cur.txt}</p>${cur.cover?`<img src="${E(cur.cover)}" alt="" class="holcover">`:''}<div class="holrow">${card(cur.a,cur.va,0,cur.unit)}<span class="holvs">VS</span>${card(cur.b,cur.vb,1,cur.unit)}</div></div>`;
  qa('.holc',z).forEach(b=>b.onclick=()=>answer(+b.dataset.i))}
 function answer(i){if(st!=='ask')return;st='reveal';const win=cur.va>cur.vb?0:1,ok=i===win;
  const cards=qa('.holc',z);[cur.va,cur.vb].forEach((v,j)=>{const c=cards[j];c.disabled=true;c.querySelector('.holv').innerHTML=`${fmtV(v)} <small>${E(cur.unit)}</small>`;c.classList.add(j===win?'ok':'no');if(j===i)c.classList.add('picked')});
  if(ok){score++;const s=q('#sc');s.textContent=score;A.pop(s);A.tone('triangle',660*Math.pow(2,Math.min(score,12)/12),.12,0,.045);msg(score>1?'Serie di '+score+' 🔥':'Giusto!');clearTimeout(nextT);nextT=setTimeout(()=>alive&&st==='reveal'&&show(),1100)}
  else{A.beep(200,.25,0,.06,140);clearTimeout(nextT);nextT=setTimeout(()=>alive&&end(false),1300)}}
 function end(out){st='done';const best=+localStorage.hol_best||0;if(score>best){localStorage.hol_best=score;q('#rec').textContent=score}
  z.innerHTML=`<div class="qbox"><p class="big">${score}</p><p class="muted">${out?'Hai finito le domande disponibili, complimenti!':'risposte giuste di fila'}</p></div>`;
  const g=q('#go');g.textContent='Rigioca';g.hidden=false;msg(score>best?`Nuovo record! Serie di ${score}.`:`Fine! Serie di ${score}.`);
  if(score>0)A.save('hol',score)}
 async function start(){if(!A.user||st==='load')return;A.audio();st='load';q('#go').hidden=true;msg('');
  z.innerHTML='<div class="qbox"><p class="muted">Preparo le domande dalle liste dei membri…</p><div class="qload"></div></div>';
  const d=await loadData().catch(()=>null);if(!alive)return;
  if(!d||d.U.length<2){z.innerHTML='<div class="qbox"><p class="muted">Servono più liste nel catalogo per giocare. Riprova più tardi!</p></div>';st='idle';q('#go').hidden=false;return}
  score=0;used=new Set();q('#sc').textContent=0;show()}
 const kd=e=>{if(A.cur!=='hol')return;if(st==='ask'&&(e.key==='1'||e.key==='ArrowLeft')){e.preventDefault();answer(0)}else if(st==='ask'&&(e.key==='2'||e.key==='ArrowRight')){e.preventDefault();answer(1)}};
 addEventListener('keydown',kd);
 q('#go').onclick=e=>{e.currentTarget.blur();start()};
 return()=>{alive=false;clearTimeout(nextT);removeEventListener('keydown',kd);st='idle'}}
(window.GIOCHI_EXTRA=window.GIOCHI_EXTRA||{}).hol={t:'Higher or Lower',d:'Due membri di Staskys, una domanda vera presa dalle loro liste: chi ha visto più film? Chi ha votato più alto quel titolo? Tocca il membro giusto (o premi 1 / 2) e allunga la serie.',unit:'di fila',asc:false,make};
})();
