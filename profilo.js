/* Staskys — Profilo "passaporto" (fase 2): Top 10 ordinabile, compatibilità, membri simili */
(function(){
const A=window.STASKYS,S=window.STASKYS_SOCIAL,E=A.E,q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const root=q('#pf'),P=new URLSearchParams(location.search);
const GAME_NAMES={snake:'Snake',reaction:'Tempo di reazione',clicker:'Clicker veloce',flappy:'Flappy',tetris:'Tetris',dino:'Dino runner',quiz:'Quiz anime',wordle:'Wordle',2048:'2048',breakout:'Breakout',stack:'Stack',suika:'Suika',mines:'Prato fiorito',typing:'Battitura'};
const ASC=new Set(['reaction','mines','wordle']);
const fmt=n=>Number(n).toLocaleString('it-IT');
const KINDS=Object.keys(A.KINDS);
/* PUNTI (provvisorio): 10 per ogni minigioco giocato, +50/+30/+20 per 1°/2°/3° posto, +5 se sei in top 10, +5 per ogni giorno di streak */
function points(rec,streak){return rec.reduce((s,r)=>s+10+(r.rank===1?50:r.rank===2?30:r.rank===3?20:r.rank<=10?5:0),0)+streak*5}
const prof=(did)=>`profilo.html?${A.DEMO?'demo=1&':''}u=${encodeURIComponent(did)}`;

/* ---------- dati ---------- */
async function loadUser(did,all){
 if(A.DEMO){const L=all.filter(r=>r.discord_id===did),me=did===S.DEMO_ME;
  return{did,nick:L[0]?.username||'Membro demo',username:me?'demo_staskys':'',avatar:L[0]?.avatar_url||'',joined:me?'2024-03-12':'',inServer:true,demo:true,isMe:me,ratings:L,streak:me?7:0,
   rec:me?[{game:'snake',score:41,rank:2},{game:'wordle',score:3,rank:1},{game:'tetris',score:2210,rank:4},{game:'flappy',score:27,rank:6},{game:'2048',score:1388,rank:9}]:[]}}
 const [mem,lb]=await Promise.all([A.loadMembers(),A.sb?A.sb.from('leaderboard').select('game,user_id,discord_id,username,avatar_url,score').limit(5000).then(r=>r.data||[]):[]]);
 const ratings=all.filter(r=>String(r.discord_id)===did);
 const m=mem[did]||{},mine=lb.filter(r=>String(r.discord_id)===did);
 const rec=mine.map(r=>{const same=lb.filter(x=>x.game===r.game).sort((a,b)=>ASC.has(r.game)?a.score-b.score:b.score-a.score);return{game:r.game,score:r.score,rank:same.findIndex(x=>x.user_id===r.user_id)+1}}).sort((a,b)=>a.rank-b.rank);
 const uid=mine[0]?.user_id||ratings[0]?.user_id;let streak=0;
 if(uid&&A.sb){const s=await A.sb.from('streaks').select('streak,last_day').eq('user_id',uid).limit(1);const row=s.data&&s.data[0];if(row){const d=(Date.now()-new Date(row.last_day+'T00:00:00'))/864e5;streak=d<2?row.streak:0}}
 const me=A.user&&A.profile(A.user).discord===did?A.profile(A.user):null;
 return{did,nick:A.clean(m.nick||me?.name||mine[0]?.username||ratings[0]?.username||'Membro'),username:m.username||'',avatar:m.avatar||me?.avatar||mine[0]?.avatar_url||ratings[0]?.avatar_url||'',
  joined:m.joined||'',inServer:m.in_server!==false,rec,streak,ratings,isMe:!!me}}

/* ---------- pezzi di vista ---------- */
const cover=(r,cls='')=>`<span class="cv ${cls}">${r.cover?`<img src="${E(r.cover)}" alt="" loading="lazy">`:`<i>${A.KINDS[r.kind].icon}</i>`}${r.rating?`<b class="rbadge">${r.rating}</b>`:''}</span>`;
const kindTabs=(cur,id)=>`<div class="seg mini" id="${id}">${KINDS.map(k=>`<button data-k="${k}" class="${k===cur?'active':''}">${A.KINDS[k].icon} ${A.KINDS[k].t}</button>`).join('')}</div>`;
function starsHTML(u,kind){const {list}=S.top10(u.ratings,kind),five=list.slice(0,5);
 if(!five.length)return`<p class="pass-empty">${u.isMe?`Vota i tuoi ${A.KINDS[kind].t.toLowerCase()} preferiti nel <a href="catalogo.html?tipo=${kind}">catalogo</a>: i primi 5 della tua Top 10 finiscono qui.`:'Ancora nessun voto in questa categoria.'}</p>`;
 return`<div class="stars-row">${five.map((r,i)=>`<figure class="${i?'':'big'}">${cover(r)}<figcaption><span class="pos">${i+1}</span>${E(r.title)}</figcaption></figure>`).join('')}${Array.from({length:5-five.length},()=>'<figure class="empty"><span class="cv"></span></figure>').join('')}</div>`}
function topHTML(u,kind){const {list,custom}=S.top10(u.ratings,kind);
 return`<div class="t10-head"><div><h3>Top 10 ${A.KINDS[kind].t}</h3><p class="muted small">${list.length?(custom?'Ordinata a mano':'Automatica: in ordine di voto'+(u.isMe?' · premi Modifica per sceglierla tu':'')):'Ancora vuota'}</p></div>${u.isMe&&u.ratings.some(r=>r.kind===kind)?'<button class="btn ghost sm" id="t10edit">Modifica</button>':''}</div>
 ${list.length?`<ol class="t10">${list.map((r,i)=>`<li class="${i<3?'top':''}"><span class="t10n">${i+1}</span>${cover(r,'xs')}<span class="t10t"><b>${E(r.title)}</b><small>${[r.year,A.statusLabel(kind,r.status)].filter(Boolean).map(E).join(' · ')}</small></span>${r.rating?`<span class="t10r">${r.rating}</span>`:''}</li>`).join('')}</ol>`:''}`}
function compareHTML(u,viewer,c){
 if(!viewer)return`<div class="cmp card"><h3>Compatibilità</h3><p class="muted small">Accedi con Discord e vota qualche titolo per scoprire quanto sei compatibile con ${E(u.nick)}.</p>${A.READY?'<button class="btn sm" id="cmplogin">Accedi con Discord</button>':''}</div>`;
 if(!c.n)return`<div class="cmp card"><h3>Tu e ${E(u.nick)}</h3><p class="muted small">Non avete ancora titoli votati in comune. Vota qualcosa nel <a href="catalogo.html">catalogo</a>!</p></div>`;
 const lab=S.label(c.pct),deg=Math.round(c.pct*3.6);
 const row=(x,cls)=>`<li>${cover({...x,rating:null},'xs')}<span class="cmpt">${E(x.title)}</span><span class="cmpv ${cls}"><b>${x.a}</b><i>${cls==='ok'?'≈':'vs'}</i><b>${x.b}</b></span></li>`;
 return`<div class="cmp card">
  <div class="cmp-top"><div class="ring" style="--deg:${deg}deg"><span>${c.pct}%</span></div>
   <div><p class="label" style="margin:0 0 .3rem">Compatibilità</p><h3>Tu e ${E(u.nick)}</h3><p class="muted small">${c.n} ${c.n===1?'titolo votato':'titoli votati'} da entrambi${c.n<3?' · pochi per un risultato preciso':''}</p>${lab?`<span class="mlab ${lab[0]}">${lab[1]}</span>`:''}</div></div>
  <div class="cmp-cols"><div><p class="label">Andate d'accordo su</p>${c.agree.length?`<ul class="cmpl">${c.agree.map(x=>row(x,'ok')).join('')}</ul>`:'<p class="muted small">Nessun titolo con voti quasi uguali.</p>'}</div>
  <div><p class="label">Qui la pensate diverso</p>${c.differ.length?`<ul class="cmpl">${c.differ.map(x=>row(x,'ko')).join('')}</ul>`:'<p class="muted small">Nessuna grande differenza: siete d\'accordo quasi su tutto!</p>'}</div></div>
  <p class="muted tiny">A sinistra il tuo voto, a destra il suo.</p></div>`}
function similarHTML(list,u){
 return`<div class="card side-card"><h3>Membri simili</h3><p class="muted small">Chi ha gusti più vicini a ${u.isMe?'te':E(u.nick)}</p>
 ${list.length?`<ul class="sim">${list.map(m=>`<li><a href="${prof(m.did)}"><img src="${E(m.avatar||'assets/icon.png')}" alt="" loading="lazy" onerror="this.src='assets/icon.png'"><span class="simn"><b>${m.did===VIEWER?'Tu':E(A.clean(m.name))}</b><small>${m.n} titoli in comune</small></span><span class="simp"><b>${m.pct}%</b><span class="mlab ${m.label[0]}">${m.label[1]}</span></span></a></li>`).join('')}</ul>`
 :`<p class="muted small" style="margin-top:.8rem">Ancora nessuno: servono almeno 3 titoli votati in comune con un altro membro.</p>`}</div>`}

function passport(u,color,ctx){
 const rated=u.ratings.filter(r=>r.rating);
 const now=u.ratings.filter(r=>r.status==='in_corso').sort((a,b)=>String(b.updated_at).localeCompare(a.updated_at))[0];
 const since=u.joined?new Date(u.joined).toLocaleDateString('it-IT',{month:'long',year:'numeric'}):'';
 return`${u.demo?`<div class="demo-ribbon">DEMO · ${u.isMe?'profilo di esempio':'confronto di esempio'} con dati finti</div>`:''}
 <section class="pf-wrap">
 <div class="pf-main">
  <article class="pass" style="--c:${color}">
   <div class="pass-glow" aria-hidden="true"></div>
   <header class="pass-head">
    <img class="pass-av" src="${E(u.avatar||'assets/icon.png')}" alt="" onerror="this.src='assets/icon.png'">
    <div class="pass-id"><p class="pass-label">Passaporto Staskys</p><h1>${E(u.nick)}</h1><p class="pass-sub">${u.username?'@'+E(u.username):''}${since?` · nel server da ${E(since)}`:''}${!u.inServer?' · non è più nel server':''}</p>
    ${now?`<span class="pill"><i class="live"></i>${E(A.KINDS[now.kind].verb)} <b>${E(now.title)}</b></span>`:''}</div>
    ${ctx.cmp&&ctx.cmp.n?`<div class="pass-match"><b>${ctx.cmp.pct}%</b><span>con te</span></div>`:''}
    ${u.isMe&&!u.demo?'<button class="btn ghost sm pass-out" id="logout">Esci</button>':''}
   </header>
   <dl class="pass-stats">
    <div><dt>Punti</dt><dd>${fmt(points(u.rec,u.streak))}</dd></div>
    <div><dt>Streak</dt><dd>🔥 ${u.streak}</dd></div>
    <div><dt>Voti</dt><dd>${rated.length}</dd></div>
    <div><dt>Minigiochi</dt><dd>${u.rec.length}</dd></div>
   </dl>
   <div class="stars"><div class="stars-head"><p class="pass-label">Le mie stelle</p>${kindTabs(ctx.kind,'skind')}</div><div id="stars">${starsHTML(u,ctx.kind)}</div></div>
  </article>
  ${ctx.showCmp?compareHTML(u,ctx.viewer,ctx.cmp):''}
  <section class="card t10card" id="t10">${topHTML(u,ctx.kind)}</section>
  <section class="cats">
   ${KINDS.map(k=>{const L=u.ratings.filter(r=>r.kind===k),c=s=>L.filter(r=>r.status===s).length,top=S.top10(u.ratings,k).list.slice(0,4);
    return`<a class="cat-card" href="catalogo.html?tipo=${k}"><header><span class="cat-ico">${A.KINDS[k].icon}</span><h3>${A.KINDS[k].t}</h3><b class="cat-n">${L.length}</b></header>
    <div class="cat-strip">${top.length?top.map(r=>cover(r,'sm')).join(''):'<span class="muted small">Ancora vuoto</span>'}</div>
    <div class="cat-foot"><span>${c('visto')} ${k==='game'?'giocati':'visti'}</span><span>${c('in_corso')} in corso</span><span>${c('voglio')} da ${k==='game'?'giocare':'vedere'}</span></div></a>`}).join('')}
  </section>
 </div>
 <aside class="pf-side">
  ${similarHTML(ctx.similar,u)}
  <div class="card side-card"><h3>Minigiochi</h3><p class="muted small">Record personali e posizione in classifica</p>
   ${u.rec.length?`<ol class="recs">${u.rec.map(r=>`<li><span class="rk${r.rank<=3?' top':''}">${r.rank===1?'👑':'#'+r.rank}</span><span class="rg">${E(GAME_NAMES[r.game]||r.game)}</span><b>${fmt(r.score)}</b></li>`).join('')}</ol>`:`<p class="muted small">${u.isMe?'Non hai ancora giocato. <a href="giochi.html">Vai ai giochi</a>':'Non ha ancora giocato.'}</p>`}
   <p class="muted tiny">Punti: 10 per gioco, bonus podio e top 10, +5 per giorno di streak.</p></div>
  <a class="card side-card side-link" href="classifica.html${A.DEMO?'?demo=1':''}"><h3>Classifica generale →</h3><p class="muted small">I titoli più votati dalla community, in media.</p></a>
 </aside>
 </section>`}

/* ---------- modifica Top 10 ---------- */
function editTop(u,kind,done){
 let sel=S.top10(u.ratings,kind).list.map(r=>r.media_id);
 const pool=u.ratings.filter(r=>r.kind===kind).sort((a,b)=>(b.rating||0)-(a.rating||0)||a.title.localeCompare(b.title));
 const byId=Object.fromEntries(pool.map(r=>[r.media_id,r]));
 let sheet=q('#t10sheet');if(!sheet){document.body.insertAdjacentHTML('beforeend','<div class="csheet" id="t10sheet" hidden><div class="csheet-in t10ed" role="dialog" aria-modal="true"></div></div>');sheet=q('#t10sheet');sheet.onclick=e=>{if(e.target===sheet)close()}}
 const box=q('.csheet-in',sheet);
 const close=()=>{sheet.classList.remove('show');setTimeout(()=>sheet.hidden=true,200)};
 const draw=()=>{const rest=pool.filter(r=>!sel.includes(r.media_id));
  box.innerHTML=`<button class="cx" aria-label="Chiudi">×</button><p class="label">Top 10 ${A.KINDS[kind].t}</p><h3 style="font-size:1.35rem;margin-bottom:.2rem">Scegli l'ordine</h3><p class="muted small">Usa ↑ ↓ per spostare, × per togliere. Massimo 10.</p>
  <ol class="t10e">${sel.map((id,i)=>{const r=byId[id];return`<li><span class="t10n">${i+1}</span>${cover(r,'xs')}<span class="t10t"><b>${E(r.title)}</b></span><span class="t10b"><button data-up="${i}" ${i?'':'disabled'} aria-label="Su">↑</button><button data-dn="${i}" ${i<sel.length-1?'':'disabled'} aria-label="Giù">↓</button><button data-rm="${i}" aria-label="Togli">×</button></span></li>`}).join('')||'<li class="muted small">Vuota: aggiungi titoli qui sotto.</li>'}</ol>
  ${rest.length?`<p class="label">Aggiungi dalla tua lista</p><div class="t10add">${rest.map(r=>`<button data-add="${E(r.media_id)}" ${sel.length>=10?'disabled':''}>${cover(r,'xs')}<span>${E(r.title)}</span><b>+</b></button>`).join('')}</div>`:''}
  <div class="cs-act"><button class="btn" id="t10save">Salva Top 10</button><button class="btn ghost" id="t10auto">Automatica</button></div><p class="muted small" id="t10msg"></p>`;
  q('.cx',box).onclick=close;
  qa('[data-up]',box).forEach(b=>b.onclick=()=>{const i=+b.dataset.up;[sel[i-1],sel[i]]=[sel[i],sel[i-1]];draw()});
  qa('[data-dn]',box).forEach(b=>b.onclick=()=>{const i=+b.dataset.dn;[sel[i+1],sel[i]]=[sel[i],sel[i+1]];draw()});
  qa('[data-rm]',box).forEach(b=>b.onclick=()=>{sel.splice(+b.dataset.rm,1);draw()});
  qa('[data-add]',box).forEach(b=>b.onclick=()=>{if(sel.length<10){sel.push(b.dataset.add);draw()}});
  const save=async ids=>{q('#t10msg',box).textContent='Salvataggio…';const err=await S.saveTop10(kind,ids);
   if(err){q('#t10msg',box).textContent=/set_top10|function|schema/.test(err.message||'')?'La Top 10 si attiva appena il database è aggiornato.':'Non sono riuscito a salvare. Riprova.';return}close();done()};
  q('#t10save',box).onclick=()=>save(sel);q('#t10auto',box).onclick=()=>save([])};
 draw();sheet.hidden=false;requestAnimationFrame(()=>sheet.classList.add('show'))}

/* ---------- pagina ---------- */
function landing(members){const list=Object.entries(members).filter(([,m])=>m.in_server!==false&&m.nick).slice(0,24);
 return`<section class="page-hero"><p class="label">Profilo</p><h1>Il tuo passaporto.</h1><p class="lead">Accedi con Discord: nickname e avatar arrivano dal server Staskys, punti e streak dai minigiochi, e i voti dal catalogo.</p>
 <div class="cta" style="justify-content:flex-start">${A.READY?'<button class="btn magnetic" id="login">Accedi con Discord</button>':''}<a class="btn ghost" href="profilo.html?demo=1">Guarda un profilo demo</a></div></section>
 ${list.length?`<section class="wrap tight"><p class="label">Profili dei membri</p><div class="mgrid">${list.map(([id,m])=>`<a class="mchip" href="profilo.html?u=${E(id)}"><img src="${E(m.avatar)}" alt="" loading="lazy" onerror="this.src='assets/icon.png'"><span>${E(A.clean(m.nick))}</span></a>`).join('')}</div></section>`:''}`}

let VIEWER='';
async function show(){
 await A.ready;
 const viewerDid=VIEWER=A.DEMO?S.DEMO_ME:(A.user?A.profile(A.user).discord:'');
 const did=P.get('u')||viewerDid;
 if(!did){const mem=await A.loadMembers();root.innerHTML=landing(mem);const b=q('#login');b&&(b.onclick=()=>A.login());return}
 const all=await S.loadAll();
 const u=await loadUser(did,all);
 const M=S.byUser(all),viewerRows=viewerDid?M.get(viewerDid)||[]:[];
 const showCmp=!u.isMe,cmp=showCmp&&viewerDid?S.compare(viewerRows,u.ratings):null;
 const firstKind=KINDS.slice().sort((a,b)=>u.ratings.filter(r=>r.kind===b).length-u.ratings.filter(r=>r.kind===a).length)[0];
 const ctx={kind:KINDS.includes(P.get('tipo'))?P.get('tipo'):firstKind,viewer:viewerDid,cmp,showCmp,similar:S.similar(all,did)};
 root.innerHTML=passport(u,'#555',ctx);
 const setKind=k=>{ctx.kind=k;q('#stars').innerHTML=starsHTML(u,k);q('#t10').innerHTML=topHTML(u,k);qa('#skind button').forEach(b=>b.classList.toggle('active',b.dataset.k===k));bindEdit()};
 const bindEdit=()=>{const e=q('#t10edit');e&&(e.onclick=()=>editTop(u,ctx.kind,async()=>{const all2=await S.loadAll();u.ratings=all2.filter(r=>String(r.discord_id)===did);setKind(ctx.kind)}))};
 qa('#skind button').forEach(b=>b.onclick=()=>setKind(b.dataset.k));bindEdit();
 const cl=q('#cmplogin');cl&&(cl.onclick=()=>A.login());
 const lo=q('#logout');lo&&(lo.onclick=()=>A.logout());
 document.title=u.nick+' · Staskys';
 A.color(u.avatar).then(col=>{const p=q('.pass',root);p&&p.style.setProperty('--c',col)})}
show();document.addEventListener('staskys-auth',()=>{if(!A.DEMO){S.reset();show()}});
})();
