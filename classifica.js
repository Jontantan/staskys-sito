/* Staskys — Classifica: titoli per media voti PONDERATA (media_avg, vedi social.js weigh) per categoria + classifica PUNTI dei minigiochi */
(function(){
const A=window.STASKYS,S=window.STASKYS_SOCIAL,D=window.STASKYS_DECO,E=A.E,q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const P=new URLSearchParams(location.search);let kind=P.get('tab')==='punti'?'punti':P.get('tab')==='badge'?'badge':A.KINDS[P.get('tipo')]?P.get('tipo'):'anime',seq=0;
const fmt=n=>Number(n).toLocaleString('it-IT');
const prof=did=>`profilo.html?${A.DEMO?'demo=1&':''}u=${encodeURIComponent(did)}`;
q('#minv').textContent=S.MIN_VOTES;
if(A.DEMO){q('main').insertAdjacentHTML('afterbegin','<div class="demo-ribbon">DEMO · classifica di esempio con dati finti</div>');q('#tocat').href='catalogo.html?demo=1'}
const LEAD={titoli:q('#lead').innerHTML,punti:'Chi ha più punti nei minigiochi di Staskys. Accanto ai nomi, i badge scelti per il passaporto.',badge:'Chi ha sbloccato più badge, giocando ai minigiochi e usando il catalogo. Ogni badge vale dei punti badge.'};
/* corona del primo (update 3): oro, bagliore e un filo di animazione (ferma se il sistema chiede meno movimento) */
const CROWN='<i class="pcrown" aria-hidden="true"><svg viewBox="0 0 64 44"><defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff7c2"/><stop offset=".45" stop-color="#fbbf24"/><stop offset="1" stop-color="#b45309"/></linearGradient></defs><path d="M4 40V14l14 12L32 3l14 23 14-12v26z" fill="url(#cg)" stroke="#fde68a" stroke-width="1.5" stroke-linejoin="round"/><rect x="4" y="36" width="56" height="5" rx="2" fill="#92400e" opacity=".55"/><circle cx="32" cy="27" r="4" fill="#ef4444"/><circle cx="17" cy="31" r="3" fill="#38bdf8"/><circle cx="47" cy="31" r="3" fill="#38bdf8"/><circle cx="4" cy="14" r="3" fill="#fde68a"/><circle cx="32" cy="3" r="3" fill="#fde68a"/><circle cx="60" cy="14" r="3" fill="#fde68a"/></svg><b class="pspark s1"></b><b class="pspark s2"></b><b class="pspark s3"></b><b class="pspark s4"></b><b class="pspark s5"></b></i>';
/* update 4: medaglie d'argento e di bronzo (disegni originali) per 2° e 3° */
const MEDAL=(n,a,b,c)=>`<i class="pmedal" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M9 1h6l3 9h-6zM23 1h-6l-3 9h6z" fill="#334155"/><circle cx="16" cy="20" r="10" fill="${a}" stroke="${b}" stroke-width="2"/><circle cx="16" cy="20" r="6.5" fill="none" stroke="${c}" stroke-width="1.2" opacity=".8"/><text x="16" y="24" text-anchor="middle" font-size="10" font-weight="800" font-family="Inter,sans-serif" fill="${c}">${n}</text></svg></i>`;
const DECOR={1:()=>CROWN,2:()=>MEDAL(2,'#e2e8f0','#94a3b8','#475569'),3:()=>MEDAL(3,'#fdba74','#b45309','#7c2d12')};
const skel=()=>'<div class="rk-list">'+Array.from({length:6},()=>'<div class="rk-row sk"></div>').join('')+'</div>';

/* ---------- titoli ---------- */
const tip=r=>`Media vera ${A.fmtR(r.avg_rating.toFixed(1))} su ${r.votes} voti · punteggio ponderato ${r.score.toLocaleString("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2})} (classifica ponderata)`;
async function titles(box,my){
 const L=await S.loadRanking(kind);if(my!==seq)return;
 if(!L.length){box.innerHTML=`<div class="cempty"><p><b>Ancora nessun titolo in classifica.</b><br><span class="muted">Appena almeno ${S.MIN_VOTES} membri votano lo stesso titolo nel <a href="catalogo.html?${A.DEMO?'demo=1&':''}tipo=${kind}">catalogo</a>, compare qui.</span></p></div>`;return}
 const [a,b,c]=L,podium=[b,a,c].filter(Boolean);
 box.innerHTML=`<div class="podium">${podium.map(r=>{const n=L.indexOf(r)+1;return`<div class="pod p${n}"><span class="cv">${r.cover?`<img src="${E(r.cover)}" alt="" loading="lazy">`:''}<b class="pod-n">${n}</b></span><b class="pod-t">${E(r.title)}</b><span class="pod-a" title="${tip(r)}">${A.fmtR(r.avg_rating.toFixed(1))}<small>/10</small></span><small class="muted">${r.votes} voti</small></div>`}).join('')}</div>
 ${L.length>3?`<ol class="rk-list" start="4">${L.slice(3,50).map((r,i)=>`<li class="rk-row"><span class="rk-n">${i+4}</span><span class="cv xs">${r.cover?`<img src="${E(r.cover)}" alt="" loading="lazy">`:''}</span><span class="rk-t"><b>${E(r.title)}</b><small>${[r.year,r.votes+' voti'].filter(Boolean).join(' · ')}</small></span><span class="rk-bar"><i style="width:${r.avg_rating*10}%"></i></span><span class="rk-a" title="${tip(r)}">${A.fmtR(r.avg_rating.toFixed(1))}</span></li>`).join('')}</ol>`:''}`}

/* ---------- punti ---------- */
const NO_ST={rec:[],points:0,firsts:0,podiums:0,streak:0,bestStreak:0,best:{},pos:null};
/* update 4: stesse statistiche del profilo (like, primo accesso, streak migliore, notte…) */
const unlOf=(u,M,c)=>D.unlocked(S.statsFor(u.did,c.g,M.get(u.did)||[],c.profiles,c.X,u));
function badges(u,profiles,M,c){const pf=profiles.get(u.did)||{},unl=unlOf(u,M,c),eq=(pf.equipped&&Array.isArray(pf.equipped.badges)?pf.equipped.badges:[]).filter(id=>unl.includes(id)&&D.byId[id]&&D.byId[id].tipo==='badge').slice(0,D.MAX_BADGE);
 return eq.map(id=>{const d=D.byId[id];return`<span class="dbadge sm ${D.badgeCls(d)}" title="${E(d.nome)}">${d.icona}</span>`}).join('')}
async function points(box,my){
 await A.ready;const [g,profiles,all,X]=await Promise.all([S.loadGames(),S.loadProfiles(),S.loadAll(),S.loadExtra()]);if(my!==seq)return;const M=S.byUser(all),C={g,profiles,X};
 const me=A.DEMO?S.DEMO_ME:(A.user?A.profile(A.user).discord:''),L=g.ranked.filter(u=>u.points>0),mine=L.find(u=>u.did===me);
 const name=u=>u.did===me?'Tu':E(A.nameOf(u.did,u.name)||'Membro');
 if(!L.length){box.innerHTML=`<div class="cempty"><p><b>Ancora nessun punto.</b><br><span class="muted">Gioca ai <a href="giochi.html">minigiochi</a> per entrare in classifica.</span></p></div>`;return}
 const [a,b,c]=L,podium=[b,a,c].filter(Boolean);
 box.innerHTML=`${mine?`<a class="mypos" href="${prof(me)}"><span class="mypos-n">#${mine.pos}</span><img ${A.avAttr(mine.did,mine.avatar)} alt=""><span class="rk-t"><b>La tua posizione</b><small>${mine.pos===1?'Sei in testa! 👑':`${fmt(L[mine.pos-2].points-mine.points)} punti per superare ${E(A.nameOf(L[mine.pos-2].did,L[mine.pos-2].name)||'Membro')}`}</small></span><span class="rk-a">${fmt(mine.points)}<small> pt</small></span></a>`
  :me?'':`<p class="muted small" style="text-align:center">Accedi e gioca per vedere la tua posizione.</p>`}
 <div class="podium ppod">${podium.map(u=>`<a class="pod p${u.pos}" href="${prof(u.did)}"><span class="pav"><img ${A.avAttr(u.did,u.avatar)} alt="" loading="lazy"><b class="pod-n">${u.pos}</b><i class="pod-glint"></i>${DECOR[u.pos]?DECOR[u.pos]():''}</span><b class="pod-t">${name(u)}</b><span class="pbad">${badges(u,profiles,M,C)}</span><span class="pod-a">${fmt(u.points)}<small> pt</small></span><small class="muted">${u.firsts} ${u.firsts===1?'primo posto':'primi posti'} · 🔥 ${u.streak}</small></a>`).join('')}</div>
 ${L.length>3?`<ol class="rk-list" start="4">${L.slice(3,100).map(u=>`<li><a class="rk-row${u.did===me?' me':''}" href="${prof(u.did)}"><span class="rk-n">${u.pos}</span><img class="rk-av" ${A.avAttr(u.did,u.avatar)} alt="" loading="lazy"><span class="rk-t"><b>${name(u)} ${badges(u,profiles,M,C)}</b><small>${u.rec.length} minigiochi · ${u.podiums} podi · 🔥 ${u.streak}</small></span><span class="rk-a">${fmt(u.points)}<small> pt</small></span></a></li>`).join('')}</ol>`:''}
 <p class="muted tiny" style="text-align:center;margin-top:1.4rem">Punti: 10 per ogni minigioco giocato, +50 / +30 / +20 per 1°, 2° e 3° posto, +5 se sei in top 10, +5 per ogni giorno di streak. Wordle, Clicker veloce e Higher or Lower non danno punti.</p>`}

/* ---------- badge (update 3, badge-config.js) ---------- */
async function badgeTab(box,my){
 await A.ready;const [g,profiles,all,X]=await Promise.all([S.loadGames(),S.loadProfiles(),S.loadAll(),S.loadExtra()]);if(my!==seq)return;const M=S.byUser(all),C={g,profiles,X};
 const me=A.DEMO?S.DEMO_ME:(A.user?A.profile(A.user).discord:''),B=D.sortR(D.DECO.filter(d=>d.tipo==='badge')),ids=new Set([...g.users.keys(),...M.keys()]);
 const L=[...ids].map(did=>{const st=g.users.get(did)||{...NO_ST,did,name:''},unl=D.sortR(unlOf({...st,did},M,C).filter(id=>D.byId[id].tipo==='badge').map(id=>D.byId[id])).reverse().map(d=>d.id);
  const rows=M.get(did)||[];return{did,name:A.nameOf(did,st.name||(rows[0]&&rows[0].username)||''),avatar:A.avList(did,st.avatar,rows[0]&&rows[0].avatar_url)[0],unl,pts:D.badgePoints(unl)}})
  .filter(u=>u.unl.length).sort((a,b)=>b.pts-a.pts||b.unl.length-a.unl.length);L.forEach((u,i)=>u.pos=i+1);
 const own=id=>L.filter(u=>u.unl.includes(id)).length,ico=id=>{const d=D.byId[id];return`<span class="dbadge sm ${D.badgeCls(d)}" title="${E(d.nome)}">${d.icona}</span>`},mine=L.find(u=>u.did===me);
 const name=u=>u.did===me?'Tu':E(u.name||'Membro');
 box.innerHTML=`${D.PROVV_B?'':''}${mine?`<a class="mypos" href="${prof(me)}"><span class="mypos-n">#${mine.pos}</span><img ${A.avAttr(mine.did,mine.avatar)} alt=""><span class="rk-t"><b>I tuoi badge</b><small>${mine.unl.length} su ${B.length} sbloccati</small></span><span class="rk-a">${fmt(mine.pts)}<small> pt badge</small></span></a>`:''}
 ${L.length?`<ol class="rk-list bk-list">${L.slice(0,100).map(u=>`<li><a class="rk-row${u.did===me?' me':''}" href="${prof(u.did)}"><span class="rk-n">${u.pos===1?CROWN.replace('pcrown','pcrown mini'):u.pos}</span><img class="rk-av" ${A.avAttr(u.did,u.avatar)} alt="" loading="lazy"><span class="rk-t"><b>${name(u)}</b><small class="bk-icons">${u.unl.map(ico).join('')}</small></span><span class="rk-a">${fmt(u.pts)}<small> pt</small></span></a></li>`).join('')}</ol>`
 :`<div class="cempty"><p><b>Ancora nessun badge sbloccato.</b><br><span class="muted">Gioca ai <a href="giochi.html">minigiochi</a> e vota nel <a href="catalogo.html">catalogo</a> per sbloccarli.</span></p></div>`}
 <h2 class="bk-h">Tutti i badge</h2><p class="muted small" style="text-align:center">Dal più comune al più raro: Comune · Rara · Epica · Leggendaria · <b style="color:var(--r-mit)">Mitico</b></p>
 <div class="bk-grid">${B.map(d=>`<div class="bk-card r-${d.rarita}${mine&&mine.unl.includes(d.id)?' got':''}"><span class="dbadge big ${D.badgeCls(d)}">${d.icona}</span><b>${E(d.nome)}</b><small class="drar">${E(D.RARITA[d.rarita])} · ${d.punti||0} pt</small><small>${E(D.reqText(d.req,d))}</small><small class="muted">${own(d.id)} ${own(d.id)===1?'membro':'membri'}</small></div>`).join('')}</div>`}

async function render(){const my=++seq,box=q('#rank');box.innerHTML=skel();
 const pt=kind==='punti',bd=kind==='badge',other=pt||bd;q('#lead').innerHTML=pt?LEAD.punti:bd?LEAD.badge:LEAD.titoli;q('#rtitle').textContent=pt?'I campioni.':bd?'I collezionisti.':'I più amati.';q('#tocat').hidden=other;q('#wnote').hidden=other;q('#togames').hidden=!other;
 return pt?points(box,my):bd?badgeTab(box,my):titles(box,my)}
qa('#rtabs button').forEach(b=>{b.classList.toggle('active',b.dataset.kind===kind);b.onclick=()=>{kind=b.dataset.kind;qa('#rtabs button').forEach(x=>x.classList.toggle('active',x===b));q('#tocat').href='catalogo.html?'+(A.DEMO?'demo=1&':'')+'tipo='+kind;
 history.replaceState(null,'','?'+(A.DEMO?'demo=1&':'')+(kind==='punti'||kind==='badge'?'tab='+kind:'tipo='+kind));render()}});
A.ready.then(render);
})();
