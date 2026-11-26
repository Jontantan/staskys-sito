/* Staskys — Classifica: titoli con la media voti più alta (media_avg) per categoria + classifica PUNTI dei minigiochi */
(function(){
const A=window.STASKYS,S=window.STASKYS_SOCIAL,D=window.STASKYS_DECO,E=A.E,q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const P=new URLSearchParams(location.search);let kind=P.get('tab')==='punti'?'punti':A.KINDS[P.get('tipo')]?P.get('tipo'):'anime',seq=0;
const fmt=n=>Number(n).toLocaleString('it-IT');
const prof=did=>`profilo.html?${A.DEMO?'demo=1&':''}u=${encodeURIComponent(did)}`;
q('#minv').textContent=S.MIN_VOTES;
if(A.DEMO){q('main').insertAdjacentHTML('afterbegin','<div class="demo-ribbon">DEMO · classifica di esempio con dati finti</div>');q('#tocat').href='catalogo.html?demo=1'}
const LEAD={titoli:q('#lead').innerHTML,punti:'Chi ha più punti nei minigiochi di Staskys. Accanto ai nomi, i badge sbloccati giocando.'};
const skel=()=>'<div class="rk-list">'+Array.from({length:6},()=>'<div class="rk-row sk"></div>').join('')+'</div>';

/* ---------- titoli ---------- */
async function titles(box,my){
 const L=await S.loadRanking(kind);if(my!==seq)return;
 if(!L.length){box.innerHTML=`<div class="cempty"><p><b>Ancora nessun titolo in classifica.</b><br><span class="muted">Appena almeno ${S.MIN_VOTES} membri votano lo stesso titolo nel <a href="catalogo.html?${A.DEMO?'demo=1&':''}tipo=${kind}">catalogo</a>, compare qui.</span></p></div>`;return}
 const [a,b,c]=L,podium=[b,a,c].filter(Boolean);
 box.innerHTML=`<div class="podium">${podium.map(r=>{const n=L.indexOf(r)+1;return`<div class="pod p${n}"><span class="cv">${r.cover?`<img src="${E(r.cover)}" alt="" loading="lazy">`:''}<b class="pod-n">${n}</b></span><b class="pod-t">${E(r.title)}</b><span class="pod-a">${A.fmtR(r.avg_rating.toFixed(1))}<small>/10</small></span><small class="muted">${r.votes} voti</small></div>`}).join('')}</div>
 ${L.length>3?`<ol class="rk-list" start="4">${L.slice(3).map((r,i)=>`<li class="rk-row"><span class="rk-n">${i+4}</span><span class="cv xs">${r.cover?`<img src="${E(r.cover)}" alt="" loading="lazy">`:''}</span><span class="rk-t"><b>${E(r.title)}</b><small>${[r.year,r.votes+' voti'].filter(Boolean).join(' · ')}</small></span><span class="rk-bar"><i style="width:${r.avg_rating*10}%"></i></span><span class="rk-a">${A.fmtR(r.avg_rating.toFixed(1))}</span></li>`).join('')}</ol>`:''}`}

/* ---------- punti ---------- */
function badges(u,profiles){const pf=profiles.get(u.did)||{},unl=D.unlocked(u),eq=(pf.equipped&&Array.isArray(pf.equipped.badges)?pf.equipped.badges:[]).filter(id=>unl.includes(id)&&D.byId[id]&&D.byId[id].tipo==='badge').slice(0,D.MAX_BADGE);
 return eq.map(id=>{const d=D.byId[id];return`<span class="dbadge sm r-${d.rarita}" title="${E(d.nome)}">${d.icona}</span>`}).join('')}
async function points(box,my){
 await A.ready;const [g,profiles]=await Promise.all([S.loadGames(),S.loadProfiles()]);if(my!==seq)return;
 const me=A.DEMO?S.DEMO_ME:(A.user?A.profile(A.user).discord:''),L=g.ranked.filter(u=>u.points>0),mine=L.find(u=>u.did===me);
 const name=u=>u.did===me?'Tu':E(A.clean(u.name||'Membro'));
 if(!L.length){box.innerHTML=`<div class="cempty"><p><b>Ancora nessun punto.</b><br><span class="muted">Gioca ai <a href="giochi.html">minigiochi</a> per entrare in classifica.</span></p></div>`;return}
 const [a,b,c]=L,podium=[b,a,c].filter(Boolean);
 box.innerHTML=`${mine?`<a class="mypos" href="${prof(me)}"><span class="mypos-n">#${mine.pos}</span><img src="${E(mine.avatar||'assets/icon.png')}" alt="" onerror="this.src='assets/icon.png'"><span class="rk-t"><b>La tua posizione</b><small>${mine.pos===1?'Sei in testa! 👑':`${fmt(L[mine.pos-2].points-mine.points)} punti per superare ${E(A.clean(L[mine.pos-2].name||''))}`}</small></span><span class="rk-a">${fmt(mine.points)}<small> pt</small></span></a>`
  :me?'':`<p class="muted small" style="text-align:center">Accedi e gioca per vedere la tua posizione.</p>`}
 <div class="podium ppod">${podium.map(u=>`<a class="pod p${u.pos}" href="${prof(u.did)}"><span class="pav"><img src="${E(u.avatar||'assets/icon.png')}" alt="" loading="lazy" onerror="this.src='assets/icon.png'"><b class="pod-n">${u.pos}</b>${u.pos===1?'<i class="pcrown" aria-hidden="true"></i>':''}</span><b class="pod-t">${name(u)}</b><span class="pbad">${badges(u,profiles)}</span><span class="pod-a">${fmt(u.points)}<small> pt</small></span><small class="muted">${u.firsts} ${u.firsts===1?'primo posto':'primi posti'} · 🔥 ${u.streak}</small></a>`).join('')}</div>
 ${L.length>3?`<ol class="rk-list" start="4">${L.slice(3,100).map(u=>`<li><a class="rk-row${u.did===me?' me':''}" href="${prof(u.did)}"><span class="rk-n">${u.pos}</span><img class="rk-av" src="${E(u.avatar||'assets/icon.png')}" alt="" loading="lazy" onerror="this.src='assets/icon.png'"><span class="rk-t"><b>${name(u)} ${badges(u,profiles)}</b><small>${u.rec.length} minigiochi · ${u.podiums} podi · 🔥 ${u.streak}</small></span><span class="rk-a">${fmt(u.points)}<small> pt</small></span></a></li>`).join('')}</ol>`:''}
 <p class="muted tiny" style="text-align:center;margin-top:1.4rem">Punti provvisori: 10 per ogni minigioco giocato, +50 / +30 / +20 per 1°, 2° e 3° posto, +5 se sei in top 10, +5 per ogni giorno di streak.</p>`}

async function render(){const my=++seq,box=q('#rank');box.innerHTML=skel();
 const pt=kind==='punti';q('#lead').innerHTML=pt?LEAD.punti:LEAD.titoli;q('#rtitle').textContent=pt?'I campioni.':'I più amati.';q('#tocat').hidden=pt;q('#togames').hidden=!pt;
 return pt?points(box,my):titles(box,my)}
qa('#rtabs button').forEach(b=>{b.classList.toggle('active',b.dataset.kind===kind);b.onclick=()=>{kind=b.dataset.kind;qa('#rtabs button').forEach(x=>x.classList.toggle('active',x===b));q('#tocat').href='catalogo.html?'+(A.DEMO?'demo=1&':'')+'tipo='+kind;
 history.replaceState(null,'','?'+(A.DEMO?'demo=1&':'')+(kind==='punti'?'tab=punti':'tipo='+kind));render()}});
A.ready.then(render);
})();
