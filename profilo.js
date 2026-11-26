/* Staskys — Profilo "passaporto" (fase 3): passaporto personalizzabile, bio, decorazioni sbloccabili,
   Top 10 trascinabile, cerca membri, I miei Awards. Funziona anche in DEMO (?demo=1) senza database. */
(function(){
const A=window.STASKYS,S=window.STASKYS_SOCIAL,D=window.STASKYS_DECO,W=window.STASKYS_AWARDS,E=A.E,q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const root=q('#pf'),P=new URLSearchParams(location.search);
const fmt=n=>Number(n).toLocaleString('it-IT');
const KINDS=Object.keys(A.KINDS);
const prof=(did)=>`profilo.html?${A.DEMO?'demo=1&':''}u=${encodeURIComponent(did)}`;
const dq=A.DEMO?'?demo=1':'';
const ORDER=Object.keys(D.SEZIONI);
const NO_STATS={rec:[],points:0,firsts:0,podiums:0,streak:0,bestStreak:0,best:{},pos:null};

/* ---------- dati ---------- */
function sanitizeEq(eq,unl){eq=eq||{};const ok=id=>id&&unl.includes(id)&&D.byId[id];
 return{frame:ok(eq.frame)&&D.byId[eq.frame].tipo==='frame'?eq.frame:'',effect:ok(eq.effect)&&D.byId[eq.effect].tipo==='effect'?eq.effect:'',bg:ok(eq.bg)&&D.byId[eq.bg].tipo==='bg'?eq.bg:'',
  badges:(Array.isArray(eq.badges)?eq.badges:[]).filter(id=>ok(id)&&D.byId[id].tipo==='badge').slice(0,D.MAX_BADGE)}}
function cleanTheme(t){t=t&&typeof t==='object'?t:{};return{accent:/^#[0-9a-f]{6}$/i.test(t.accent||'')?t.accent:'',bg:D.SFONDI[t.bg]?t.bg:'grad',banner:t.banner==='none'&&!t.bp?'auto':t.banner==='discord'||D.BANNER[t.banner]?t.banner:'auto',bp:t.bp?1:0,frame:D.CORNICI[t.frame]?t.frame:'round',
 font:D.FONT[t.font]?t.font:'inter',order:Array.isArray(t.order)?[...new Set(t.order.filter(k=>ORDER.includes(k))),...ORDER].filter((k,i,a)=>a.indexOf(k)===i):ORDER.slice(),stars:t.stars!==false}}
async function loadUser(did,all,games,profiles){
 const st=games.users.get(did)||{...NO_STATS},pf=profiles.get(did)||{},unl=D.unlocked(st);
 const base={did,stats:st,rec:st.rec,streak:st.streak,unlocked:unl,bio:String(pf.bio||'').slice(0,160),theme:cleanTheme(pf.theme),equipped:sanitizeEq(pf.equipped,unl),ratings:all.filter(r=>String(r.discord_id)===did)};
 if(A.DEMO){const L=base.ratings,me=did===S.DEMO_ME;
  return{...base,nick:L[0]?.username||st.name||'Membro demo',username:me?'demo_staskys':'',avatar:L[0]?.avatar_url||st.avatar||'',joined:me?'2024-03-12':'',inServer:true,demo:true,isMe:me}}
 const mem=await A.loadMembers(),m=mem[did]||{};
 const me=A.user&&A.profile(A.user).discord===did?A.profile(A.user):null,r0=base.ratings[0]||{};
 return{...base,nick:A.clean(m.nick||me?.name||st.name||r0.username||'Membro'),username:m.username||'',avatar:A.avList(did,m.avatar,st.avatar,r0.avatar_url)[0],joined:m.joined||'',banner:A.bannerOf(did),inServer:m.in_server!==false,isMe:!!me}}

/* ---------- pezzi di vista ---------- */
const cover=(r,cls='')=>`<span class="cv ${cls}">${r.cover?`<img src="${E(r.cover)}" alt="" loading="lazy">`:`<i>${A.KINDS[r.kind]?.icon||''}</i>`}${A.hasR(r)?`<b class="rbadge">${A.fmtR(r.rating)}</b>`:''}</span>`;
const kindTabs=(cur,id)=>`<div class="seg mini" id="${id}">${KINDS.map(k=>`<button data-k="${k}" class="${k===cur?'active':''}">${A.KINDS[k].icon} ${A.KINDS[k].t}</button>`).join('')}</div>`;
function starsHTML(u,kind){const {list}=S.top10(u.ratings,kind),five=list.slice(0,5);
 if(!five.length)return`<p class="pass-empty">${u.isMe?`Vota i tuoi ${A.KINDS[kind].t.toLowerCase()} preferiti nel <a href="catalogo.html?${A.DEMO?'demo=1&':''}tipo=${kind}">catalogo</a>: i primi 5 della tua Top 10 finiscono qui.`:'Ancora nessun voto in questa categoria.'}</p>`;
 return`<div class="stars-row">${five.map((r,i)=>`<figure class="${i?'':'big'}">${cover(r)}<figcaption><span class="pos">${i+1}</span>${E(r.title)}</figcaption></figure>`).join('')}${Array.from({length:5-five.length},()=>'<figure class="empty"><span class="cv"></span></figure>').join('')}</div>`}
const epTxt=r=>(r.status==='in_corso'||r.status==='droppato')&&r.episodes?` · ep ${r.episodes}${r.total_episodes?'/'+r.total_episodes:''}`:'';
function topHTML(u,kind){const {list,custom}=S.top10(u.ratings,kind),dnd=u.isMe&&list.length>1;
 return`<div class="t10-head"><div><h3>Top 10 ${A.KINDS[kind].t}</h3><p class="muted small">${list.length?(custom?'Ordinata a mano':'Automatica: in ordine di voto')+(dnd?' · trascina ⋮⋮ per riordinare':''):'Ancora vuota'}</p></div>${u.isMe&&u.ratings.some(r=>r.kind===kind)?'<button class="btn ghost sm" id="t10edit">Modifica</button>':''}</div>
 ${list.length?`<ol class="t10${dnd?' dnd':''}" id="t10list">${t10Items(list,kind,dnd)}</ol><p class="t10msg muted small" id="t10msg" aria-live="polite"></p>`:''}`}
const t10Items=(list,kind,dnd)=>list.map((r,i)=>`<li class="${i<3?'top':''}" data-id="${E(r.media_id)}">${dnd?'<span class="grip" aria-label="Trascina per spostare" title="Trascina per spostare">⋮⋮</span>':''}<span class="t10n">${i+1}</span>${cover(r,'xs')}<span class="t10t"><b>${E(r.title)}</b><small>${[r.year,A.statusLabel(kind,r.status)+epTxt(r)].filter(Boolean).map(E).join(' · ')}</small></span>${A.hasR(r)?`<span class="t10r">${A.fmtR(r.rating)}</span>`:''}</li>`).join('');
function compareHTML(u,viewer,c){
 if(!viewer)return`<div class="cmp card"><h3>Compatibilità</h3><p class="muted small">Accedi con Discord e vota qualche titolo per scoprire quanto sei compatibile con ${E(u.nick)}.</p>${A.READY?'<button class="btn sm" id="cmplogin">Accedi con Discord</button>':''}</div>`;
 if(!c.n)return`<div class="cmp card"><h3>Tu e ${E(u.nick)}</h3><p class="muted small">Non avete ancora titoli votati in comune. Vota qualcosa nel <a href="catalogo.html${dq}">catalogo</a>!</p></div>`;
 const lab=S.label(c.pct),deg=Math.round(c.pct*3.6);
 const row=(x,cls)=>`<li>${cover({...x,rating:null},'xs')}<span class="cmpt">${E(x.title)}</span><span class="cmpv ${cls}"><b>${A.fmtR(x.a)}</b><i>${cls==='ok'?'≈':'vs'}</i><b>${A.fmtR(x.b)}</b></span></li>`;
 return`<div class="cmp card">
  <div class="cmp-top"><div class="ring" style="--deg:${deg}deg"><span>${c.pct}%</span></div>
   <div><p class="label" style="margin:0 0 .3rem">Compatibilità</p><h3>Tu e ${E(u.nick)}</h3><p class="muted small">${c.n} ${c.n===1?'titolo votato':'titoli votati'} da entrambi${c.n<3?' · pochi per un risultato preciso':''}</p>${lab?`<span class="mlab ${lab[0]}">${lab[1]}</span>`:''}</div></div>
  <div class="cmp-cols"><div><p class="label">Andate d'accordo su</p>${c.agree.length?`<ul class="cmpl">${c.agree.map(x=>row(x,'ok')).join('')}</ul>`:'<p class="muted small">Nessun titolo con voti quasi uguali.</p>'}</div>
  <div><p class="label">Qui la pensate diverso</p>${c.differ.length?`<ul class="cmpl">${c.differ.map(x=>row(x,'ko')).join('')}</ul>`:'<p class="muted small">Nessuna grande differenza: siete d\'accordo quasi su tutto!</p>'}</div></div>
  <p class="muted tiny">A sinistra il tuo voto, a destra il suo.</p></div>`}
function similarHTML(list,u){
 return`<div class="card side-card"><h3>Membri simili</h3><p class="muted small">Chi ha gusti più vicini a ${u.isMe?'te':E(u.nick)}</p>
 ${list.length?`<ul class="sim">${list.map(m=>`<li><a href="${prof(m.did)}"><img ${A.avAttr(m.did,m.avatar)} alt="" loading="lazy"><span class="simn"><b>${m.did===VIEWER?'Tu':E(A.nameOf(m.did,m.name)||'Membro')}</b><small>${m.n} titoli in comune</small></span><span class="simp"><b>${m.pct}%</b>${m.label?`<span class="mlab ${m.label[0]}">${m.label[1]}</span>`:''}</span></a></li>`).join('')}</ul>`
 :`<p class="muted small" style="margin-top:.8rem">Ancora nessuno: servono almeno 3 titoli votati in comune con un altro membro.</p>`}</div>`}
const searchHTML=()=>`<div class="card side-card msearch"><h3>Cerca membri</h3><p class="muted small">Apri il passaporto di chiunque e scopri quanto siete simili</p>
 <label class="msq"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="msq" type="search" placeholder="Scrivi un nickname…" autocomplete="off" enterkeyhint="search" aria-label="Cerca membri"></label>
 <ul class="sim mres" id="mres"></ul></div>`;
const badgeHTML=id=>{const d=D.byId[id];return d?`<span class="dbadge r-${d.rarita}" title="${E(d.nome)} · ${E(D.RARITA[d.rarita])}">${d.icona||'★'}</span>`:''};
function avatarHTML(u){const t=u.theme,eq=u.equipped;
 return`<span class="avwrap shape-${t.frame}${eq.frame?' fr fr-'+eq.frame:''}"><img class="pass-av" ${A.avAttr(u.did,u.avatar)} alt="">${eq.frame==='fr_crown'?'<i class="crown" aria-hidden="true"></i>':''}${eq.frame==='fr_orbit'?'<i class="orb" aria-hidden="true"></i>':''}</span>`}
/* banner: 'auto' (mai scelto) = banner del profilo Discord/server se c'è; 'discord' solo se c'è davvero (patch 2.3) */
const banOf=u=>{const b=u.theme.banner;if(b==='auto'||b==='discord')return u.banner?'discord':'none';return b};
const banHTML=(u,k)=>k==='discord'?`<div class="pass-ban ban-discord" aria-hidden="true" style="background-image:url('${E(u.banner)}')"></div>`:`<div class="pass-ban ban-${k}" aria-hidden="true"></div>`;
function passHTML(u,ctx){
 const t=u.theme,eq=u.equipped,rated=u.ratings.filter(A.hasR);
 const now=u.ratings.filter(r=>r.status==='in_corso').sort((a,b)=>String(b.updated_at).localeCompare(a.updated_at))[0];
 const since=u.joined?new Date(u.joined).toLocaleDateString('it-IT',{month:'long',year:'numeric'}):'';
 return`<article class="pass bg-${t.bg} font-${t.font}${eq.bg?' dbg dbg-'+eq.bg:''}${banOf(u)!=='none'?' has-ban':''}" style="--c:${t.accent||ctx.avColor||'#555'}">
   ${banOf(u)!=='none'?banHTML(u,banOf(u)):''}
   ${eq.bg?`<div class="dbg-layer" aria-hidden="true"></div>`:''}
   <div class="pass-glow" aria-hidden="true"></div>
   <header class="pass-head">
    ${avatarHTML(u)}
    <div class="pass-id"><p class="pass-label">Passaporto Staskys</p><h1><span class="pname${eq.effect?' fx '+eq.effect:''}" data-text="${E(u.nick)}">${E(u.nick)}</span>${eq.badges.length?`<span class="dbadges">${eq.badges.map(badgeHTML).join('')}</span>`:''}</h1>
    <p class="pass-sub">${u.username?'@'+E(u.username):''}${since?` · nel server da ${E(since)}`:''}${!u.inServer?' · non è più nel server':''}</p>
    ${u.bio?`<p class="pass-bio">${E(u.bio)}</p>`:u.isMe?'<button class="pass-bio add" id="addbio">+ Aggiungi una bio</button>':''}
    ${now?`<span class="pill"><i class="live"></i>${E(A.KINDS[now.kind].verb)} <b>${E(now.title)}</b>${E(epTxt(now))}</span>`:''}</div>
    ${ctx.cmp&&ctx.cmp.n?`<div class="pass-match"><b>${ctx.cmp.pct}%</b><span>con te</span></div>`:''}
    ${u.isMe&&!u.demo?'<button class="btn ghost sm pass-out" id="logout">Esci</button>':''}
   </header>
   ${u.isMe?`<div class="pass-tools"><button class="ptool" id="customize">🎨 Personalizza</button><button class="ptool" id="decos">✨ Le mie decorazioni <b>${u.unlocked.length}/${D.DECO.length}</b></button></div>`:''}
   <dl class="pass-stats">
    <div><dt>Punti</dt><dd>${fmt(u.stats.points)}${u.stats.pos?`<small>#${u.stats.pos}</small>`:''}</dd></div>
    <div><dt>Streak</dt><dd>🔥 ${u.streak}</dd></div>
    <div><dt>Voti</dt><dd>${rated.length}</dd></div>
    <div><dt>Minigiochi</dt><dd>${u.rec.length}</dd></div>
   </dl>
   ${t.stars?`<div class="stars"><div class="stars-head"><p class="pass-label">Le mie stelle</p>${kindTabs(ctx.kind,'skind')}</div><div id="stars">${starsHTML(u,ctx.kind)}</div></div>`:`<div class="stars-head solo">${kindTabs(ctx.kind,'skind')}</div>`}
  </article>`}
function catsHTML(u){return`<section class="cats sec" data-sec="cats">
   ${KINDS.map(k=>{const L=u.ratings.filter(r=>r.kind===k),c=s=>L.filter(r=>r.status===s).length,top=S.top10(u.ratings,k).list.slice(0,4);
    return`<a class="cat-card" href="catalogo.html?${A.DEMO?'demo=1&':''}tipo=${k}"><header><span class="cat-ico">${A.KINDS[k].icon}</span><h3>${A.KINDS[k].t}</h3><b class="cat-n">${L.length}</b></header>
    <div class="cat-strip">${top.length?top.map(r=>cover(r,'sm')).join(''):'<span class="muted small">Ancora vuoto</span>'}</div>
    <div class="cat-foot"><span>${c('visto')} ${k==='game'?'giocati':'visti'}</span><span>${c('in_corso')} in corso</span>${c('droppato')?`<span>${c('droppato')} droppati</span>`:''}<span>${c('voglio')} da ${k==='game'?'giocare':'vedere'}</span></div></a>`}).join('')}
  </section>`}
const awardsCard=()=>`<section class="card myaw sec" data-sec="awards" id="myaw"><p class="muted small">Carico gli Awards…</p></section>`;
function pageHTML(u,ctx){
 const secs={t10:`<section class="card t10card sec" data-sec="t10" id="t10">${topHTML(u,ctx.kind)}</section>`,cats:catsHTML(u),awards:u.isMe&&W?awardsCard():''};
 return`${u.demo?`<div class="demo-ribbon">DEMO · ${u.isMe?'profilo di esempio':'confronto di esempio'} con dati finti</div>`:''}
 <section class="pf-wrap">
 <div class="pf-main">
  ${passHTML(u,ctx)}
  ${ctx.showCmp?compareHTML(u,ctx.viewer,ctx.cmp):''}
  ${u.theme.order.map(k=>secs[k]||'').join('')}
 </div>
 <aside class="pf-side">
  ${similarHTML(ctx.similar,u)}
  ${searchHTML()}
  <div class="card side-card"><h3>Minigiochi</h3><p class="muted small">Record personali e posizione in classifica</p>
   ${u.rec.length?`<ol class="recs">${u.rec.map(r=>`<li><span class="rk${r.rank<=3?' top':''}">${r.rank===1?'👑':'#'+r.rank}</span><span class="rg">${E(S.GAME_NAMES[r.game]||r.game)}</span><b>${fmt(r.score)}</b></li>`).join('')}</ol>`:`<p class="muted small">${u.isMe?'Non hai ancora giocato. <a href="giochi.html">Vai ai giochi</a>':'Non ha ancora giocato.'}</p>`}
   <p class="muted tiny">Punti (provvisori): 10 per gioco, bonus podio e top 10, +5 per giorno di streak.</p></div>
  <a class="card side-card side-link" href="classifica.html?${A.DEMO?'demo=1&':''}tab=punti"><h3>Classifica punti →</h3><p class="muted small">Chi ha più punti nei minigiochi, con podio e badge.</p></a>
  <a class="card side-card side-link" href="classifica.html${dq}"><h3>Classifica titoli →</h3><p class="muted small">I titoli più votati dalla community, in media.</p></a>
 </aside>
 </section>`}

/* ---------- font su richiesta ---------- */
function ensureFont(k){const f=D.FONT[k];if(!f||!f[2]||q('#font-'+k))return;document.head.insertAdjacentHTML('beforeend',`<link id="font-${k}" rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${f[2]}&display=swap">`)}

/* ---------- foglio a comparsa generico ---------- */
function sheetOpen(id,cls,html,onClose){let sh=q('#'+id);if(!sh){document.body.insertAdjacentHTML('beforeend',`<div class="csheet ${cls}" id="${id}" hidden><div class="csheet-in" role="dialog" aria-modal="true"></div></div>`);sh=q('#'+id)}
 const box=q('.csheet-in',sh);box.innerHTML=html;
 const close=()=>{sh.classList.remove('show');setTimeout(()=>sh.hidden=true,200);document.removeEventListener('keydown',esc);onClose&&onClose()};
 const esc=e=>{if(e.key==='Escape')close()};document.addEventListener('keydown',esc);
 sh.onclick=e=>{if(e.target===sh)close()};sh.hidden=false;requestAnimationFrame(()=>sh.classList.add('show'));return{box,close}}

/* ---------- modifica Top 10 (frecce) ---------- */
function editTop(u,kind,done){
 let sel=S.top10(u.ratings,kind).list.map(r=>r.media_id);
 const pool=u.ratings.filter(r=>r.kind===kind).sort((a,b)=>(A.hasR(b)?+b.rating:-1)-(A.hasR(a)?+a.rating:-1)||a.title.localeCompare(b.title));
 const byId=Object.fromEntries(pool.map(r=>[r.media_id,r]));
 const {box,close}=sheetOpen('t10sheet','','');box.classList.add('t10ed');
 const draw=()=>{const rest=pool.filter(r=>!sel.includes(r.media_id));
  box.innerHTML=`<button class="cx" aria-label="Chiudi">×</button><p class="label">Top 10 ${A.KINDS[kind].t}</p><h3 style="font-size:1.35rem;margin-bottom:.2rem">Scegli l'ordine</h3><p class="muted small">Usa ↑ ↓ per spostare, × per togliere. Massimo 10. Puoi anche trascinare direttamente nella pagina.</p>
  <ol class="t10e">${sel.map((id,i)=>{const r=byId[id];return`<li><span class="t10n">${i+1}</span>${cover(r,'xs')}<span class="t10t"><b>${E(r.title)}</b></span><span class="t10b"><button data-up="${i}" ${i?'':'disabled'} aria-label="Su">↑</button><button data-dn="${i}" ${i<sel.length-1?'':'disabled'} aria-label="Giù">↓</button><button data-rm="${i}" aria-label="Togli">×</button></span></li>`}).join('')||'<li class="muted small">Vuota: aggiungi titoli qui sotto.</li>'}</ol>
  ${rest.length?`<p class="label">Aggiungi dalla tua lista</p><div class="t10add">${rest.map(r=>`<button data-add="${E(r.media_id)}" ${sel.length>=10?'disabled':''}>${cover(r,'xs')}<span>${E(r.title)}</span><b>+</b></button>`).join('')}</div>`:''}
  <div class="cs-act"><button class="btn" id="t10save">Salva Top 10</button><button class="btn ghost" id="t10auto">Automatica</button></div><p class="muted small" id="t10emsg"></p>`;
  q('.cx',box).onclick=close;
  qa('[data-up]',box).forEach(b=>b.onclick=()=>{const i=+b.dataset.up;[sel[i-1],sel[i]]=[sel[i],sel[i-1]];draw()});
  qa('[data-dn]',box).forEach(b=>b.onclick=()=>{const i=+b.dataset.dn;[sel[i+1],sel[i]]=[sel[i],sel[i+1]];draw()});
  qa('[data-rm]',box).forEach(b=>b.onclick=()=>{sel.splice(+b.dataset.rm,1);draw()});
  qa('[data-add]',box).forEach(b=>b.onclick=()=>{if(sel.length<10){sel.push(b.dataset.add);draw()}});
  const save=async ids=>{q('#t10emsg',box).textContent='Salvataggio…';const err=await S.saveTop10(kind,ids);
   if(err){q('#t10emsg',box).textContent=/set_top10|function|schema/.test(err.message||'')?'La Top 10 si attiva appena il database è aggiornato.':'Non sono riuscito a salvare. Riprova.';return}close();done()};
  q('#t10save',box).onclick=()=>save(sel);q('#t10auto',box).onclick=()=>save([])};
 draw()}

/* ---------- Top 10 trascinabile (mouse e touch, con Pointer Events) ---------- */
function bindDrag(u,kind,done){const ol=q('#t10list');if(!ol||!ol.classList.contains('dnd'))return;
 ol.onpointerdown=e=>{const grip=e.target.closest('.grip');if(!grip||e.button>0)return;e.preventDefault();
  const li=grip.closest('li'),rect=li.getBoundingClientRect(),ids=qa('li',ol).map(x=>x.dataset.id),start=ids.join(),dragId=li.dataset.id;
  const ghost=li.cloneNode(true);ghost.classList.add('t10ghost');ghost.style.cssText=`width:${rect.width}px;left:${rect.left}px;top:${rect.top}px`;document.body.appendChild(ghost);
  const dx=e.clientX-rect.left,dy=e.clientY-rect.top;li.classList.add('dragging');ol.classList.add('sorting');
  const move=ev=>{ev.preventDefault();ghost.style.left=(ev.clientX-dx)+'px';ghost.style.top=(ev.clientY-dy)+'px';
   const over=document.elementsFromPoint(ev.clientX,ev.clientY).find(el=>el.closest&&el.closest('#t10list li')&&!el.closest('.t10ghost'));
   const tli=over&&over.closest('#t10list li');if(!tli||tli.dataset.id===dragId)return;
   const from=ids.indexOf(dragId),to=ids.indexOf(tli.dataset.id);ids.splice(from,1);ids.splice(to,0,dragId);
   const byId=Object.fromEntries(qa('li',ol).map(x=>[x.dataset.id,x]));ids.forEach((id,i)=>{const x=byId[id];ol.appendChild(x);x.querySelector('.t10n').textContent=i+1;x.classList.toggle('top',i<3)})};
  const up=async()=>{removeEventListener('pointermove',move);removeEventListener('pointerup',up);removeEventListener('pointercancel',up);ghost.remove();li.classList.remove('dragging');ol.classList.remove('sorting');
   if(ids.join()===start)return;const msg=q('#t10msg');msg.textContent='Salvo il nuovo ordine…';
   const err=await S.saveTop10(kind,ids);msg.textContent=err?(/set_top10|function|schema/.test(err.message||'')?'La Top 10 si attiva appena il database è aggiornato.':'Non sono riuscito a salvare. Riprova.'):'Top 10 salvata ✓';if(!err){await done();const m=q('#t10msg');m&&(m.textContent='Top 10 salvata ✓')}};
  addEventListener('pointermove',move,{passive:false});addEventListener('pointerup',up);addEventListener('pointercancel',up)}}

/* ---------- personalizza il passaporto ---------- */
function openCustomize(u,rerender){
 const orig={theme:JSON.parse(JSON.stringify(u.theme)),bio:u.bio};let t=JSON.parse(JSON.stringify(u.theme)),bio=u.bio,saved=false;
 const live=()=>{u.theme=t;u.bio=bio;ensureFont(t.font);rerender()};
 const sw=(group,map,cur,extra='')=>Object.entries(map).map(([k,v])=>`<button class="czo ${group}-${k}${cur===k?' on':''}" data-g="${group}" data-v="${k}" ${extra}><i${group==='ban'&&k!=='none'?` class="ban-${k}"`:''}></i><span>${E(Array.isArray(v)?v[0]:v)}</span></button>`).join('');
 const {box,close}=sheetOpen('czsheet','cz-drawer','',()=>{if(!saved){u.theme=orig.theme;u.bio=orig.bio;rerender()}});
 const draw=()=>{box.innerHTML=`<button class="cx" aria-label="Chiudi">×</button><p class="label">Il tuo passaporto</p><h3 class="cz-h">Personalizza</h3>
  <div class="cz">
   <p class="label">Bio <span class="muted" id="bioc">${bio.length}/160</span></p><textarea class="bio-in" id="bio" maxlength="160" rows="2" placeholder="Due parole su di te, i tuoi anime o giochi preferiti…">${E(bio)}</textarea>
   <p class="label">Colore</p><div class="czpal">${D.PALETTE.map(c=>`<button class="czc${t.accent===c?' on':''}" data-c="${c}" style="--sw:${c}" aria-label="${c}"></button>`).join('')}
    <label class="czc custom${t.accent&&!D.PALETTE.includes(t.accent)?' on':''}" title="Colore personalizzato" style="--sw:${t.accent||'#888'}"><input type="color" id="czpick" value="${t.accent||'#8b5cf6'}" aria-label="Colore personalizzato"></label>
    <button class="czauto${t.accent?'':' on'}" data-c="">Auto (avatar)</button></div>
   <p class="label">Sfondo</p><div class="czrow">${sw('bg',D.SFONDI,t.bg)}</div>
   <p class="label">Banner</p><div class="czgrid">${u.banner?`<button class="czo ban-discord${banOf({...u,theme:t})==='discord'?' on':''}" data-g="ban" data-v="discord"><i class="ban-discord" style="background-image:url('${E(u.banner)}')"></i><span>Discord</span></button>`:''}${sw('ban',D.BANNER,banOf({...u,theme:t}))}</div>
   <p class="label">Forma avatar</p><div class="czrow">${sw('shape',D.CORNICI,t.frame)}</div>
   <p class="label">Font del nome</p><div class="czrow fonts">${Object.entries(D.FONT).map(([k,v])=>`<button class="czo font-${k}${t.font===k?' on':''}" data-g="font" data-v="${k}"><b style="font-family:'${v[1]}',Inter,sans-serif">Aa</b><span>${E(v[0])}</span></button>`).join('')}</div>
   <p class="label">Sezioni</p><label class="cztog"><input type="checkbox" id="czstars" ${t.stars?'checked':''}> Mostra “Le mie stelle” nel passaporto</label>
   <ol class="czord">${t.order.map((k,i)=>`<li><span>${E(D.SEZIONI[k])}</span><button data-ou="${i}" ${i?'':'disabled'} aria-label="Su">↑</button><button data-od="${i}" ${i<t.order.length-1?'':'disabled'} aria-label="Giù">↓</button></li>`).join('')}</ol>
  </div>
  <div class="cs-act cz-act"><button class="btn" id="czsave">Salva</button><button class="btn ghost" id="czreset">Ripristina</button></div><p class="muted small" id="czmsg"></p>`;
  Object.keys(D.FONT).forEach(ensureFont);
  q('.cx',box).onclick=close;
  const bi=q('#bio',box);bi.oninput=()=>{bio=bi.value.replace(/\s+/g,' ').slice(0,160);q('#bioc',box).textContent=bio.length+'/160';live()};
  qa('[data-c]',box).forEach(b=>b.onclick=()=>{t.accent=b.dataset.c;live();draw()});
  const pk=q('#czpick',box);pk.oninput=()=>{t.accent=pk.value;live();pk.parentElement.style.setProperty('--sw',pk.value)};pk.onchange=()=>draw();
  qa('.czo',box).forEach(b=>b.onclick=()=>{const g=b.dataset.g,v=b.dataset.v;if(g==='bg')t.bg=v;if(g==='ban'){t.banner=v;t.bp=1}if(g==='shape')t.frame=v;if(g==='font')t.font=v;live();draw()});
  q('#czstars',box).onchange=e=>{t.stars=e.target.checked;live()};
  qa('[data-ou]',box).forEach(b=>b.onclick=()=>{const i=+b.dataset.ou;[t.order[i-1],t.order[i]]=[t.order[i],t.order[i-1]];live();draw()});
  qa('[data-od]',box).forEach(b=>b.onclick=()=>{const i=+b.dataset.od;[t.order[i+1],t.order[i]]=[t.order[i],t.order[i+1]];live();draw()});
  q('#czreset',box).onclick=()=>{t=cleanTheme({});live();draw()};
  q('#czsave',box).onclick=async()=>{q('#czmsg',box).textContent='Salvataggio…';const err=await S.saveProfile({bio,theme:t});
   if(err){q('#czmsg',box).textContent=/site_profiles|schema|relation/.test(err.message||'')?'La personalizzazione si salva appena il database è aggiornato (fase 3).':'Non sono riuscito a salvare. Riprova.';return}saved=true;close()}};
 draw()}

/* ---------- le mie decorazioni ---------- */
function decoPreview(d,u){
 if(d.tipo==='frame')return`<span class="avwrap shape-round fr fr-${d.id} mini"><img class="pass-av" ${A.avAttr(u.did,u.avatar)} alt="">${d.id==='fr_crown'?'<i class="crown"></i>':''}${d.id==='fr_orbit'?'<i class="orb"></i>':''}</span>`;
 if(d.tipo==='effect')return`<span class="pname fx ${d.id}" data-text="Aa">Aa</span>`;
 if(d.tipo==='bg')return`<span class="dbg dbg-${d.id} bgmini"><span class="dbg-layer"></span></span>`;
 return`<span class="dbadge big r-${d.rarita}">${d.icona||'★'}</span>`}
function openDecos(u,rerender){let eq=JSON.parse(JSON.stringify(u.equipped)),tab='frame';const st=u.stats;
 const {box,close}=sheetOpen('decosheet','deco-sheet','');
 const draw=()=>{const L=D.DECO.filter(d=>d.tipo===tab);
  box.innerHTML=`<button class="cx" aria-label="Chiudi">×</button><p class="label">Sbloccale con i minigiochi</p><h3 class="cz-h">Le mie decorazioni</h3>
  <p class="muted small">${fmt(st.points)} punti${st.pos?' · #'+st.pos+' in classifica':''} · ${st.firsts} primi posti · streak ${st.streak} · <b>${u.unlocked.length}/${D.DECO.length}</b> sbloccate</p>
  <div class="seg dtabs">${Object.entries(D.TIPI).map(([k,v])=>`<button data-t="${k}" class="${k===tab?'active':''}">${E(v)}</button>`).join('')}</div>
  <div class="dgrid">${L.map(d=>{const has=u.unlocked.includes(d.id),on=d.tipo==='badge'?eq.badges.includes(d.id):eq[d.tipo]===d.id;
   return`<div class="ditem r-${d.rarita}${has?'':' locked'}${on?' on':''}"><div class="dprev">${decoPreview(d,u)}${has?'':'<span class="dlock" aria-hidden="true">🔒</span>'}</div>
    <b>${E(d.nome)}</b><span class="drar">${E(D.RARITA[d.rarita])}</span>
    ${has?`<button class="btn sm ${on?'':'ghost'}" data-eq="${d.id}">${on?'Indossata ✓':'Indossa'}</button>`:`<small class="dreq">${E(D.reqText(d.req))}${d.provvisorio?' <i>(provvisorio)</i>':''}</small>`}</div>`}).join('')}</div>
  ${tab==='badge'?`<p class="muted tiny">Puoi mostrare fino a ${D.MAX_BADGE} badge accanto al nome.</p>`:''}
  <div class="cs-act"><button class="btn" id="dsave">Salva</button></div><p class="muted small" id="dmsg"></p>`;
  q('.cx',box).onclick=close;
  qa('[data-t]',box).forEach(b=>b.onclick=()=>{tab=b.dataset.t;draw()});
  qa('[data-eq]',box).forEach(b=>b.onclick=()=>{const d=D.byId[b.dataset.eq];
   if(d.tipo==='badge'){const i=eq.badges.indexOf(d.id);if(i>=0)eq.badges.splice(i,1);else{if(eq.badges.length>=D.MAX_BADGE)eq.badges.shift();eq.badges.push(d.id)}}
   else eq[d.tipo]=eq[d.tipo]===d.id?'':d.id;u.equipped=sanitizeEq(eq,u.unlocked);rerender();draw()});
  q('#dsave',box).onclick=async()=>{q('#dmsg',box).textContent='Salvataggio…';const err=await S.saveProfile({equipped:u.equipped});
   if(err){q('#dmsg',box).textContent=/site_profiles|schema|relation/.test(err.message||'')?'Le decorazioni si salvano appena il database è aggiornato (fase 3).':'Non sono riuscito a salvare. Riprova.';return}close()}};
 draw()}

/* ---------- I miei Awards ---------- */
async function fillAwards(u){const el=q('#myaw');if(!el||!W)return;
 const [set,votes]=await Promise.all([W.loadSettings(),W.myVotes()]);const ph=set.phase,y=set.year||W.YEAR;
 const n=Object.keys(votes.nom).length,f=Object.keys(votes.final).length,tot=W.AWARDS.filter(a=>a.modo!=='auto').length;
 const link=`awards.html${A.DEMO?'?demo=1'+(ph!=='presto'?'&fase='+ph:''):''}`;
 const chosen=Object.entries(ph==='finale'||ph==='risultati'?votes.final:votes.nom).slice(0,6);
 el.innerHTML=`<div class="myaw-head"><div><p class="label" style="margin:0 0 .3rem">🏆 Staskys Awards ${y}</p><h3>I miei Awards ${y}</h3></div><span class="aphase ph-${ph}">${E(W.FASI[ph])}</span></div>
 ${ph==='presto'?`<p class="muted small">Le nomination apriranno presto: potrai scegliere i tuoi preferiti del ${y} tra ${tot} premi in 5 categorie, partendo dal tuo catalogo. Intanto vota e completa la tua lista!</p>`
 :ph==='nomination'?`<div class="myaw-bar"><i style="width:${Math.round(n/tot*100)}%"></i></div><p class="muted small">Hai nominato in <b>${n}</b> premi su ${tot}.</p>`
 :ph==='finale'?`<p class="muted small">Finale aperta: hai votato in <b>${f}</b> premi su ${tot}.</p>`
 :`<p class="muted small">I vincitori sono stati annunciati!</p>`}
 ${chosen.length?`<ul class="myaw-list">${chosen.map(([id,v])=>`<li>${v.cover?`<img src="${E(v.cover)}" alt="" loading="lazy">`:'<i>★</i>'}<span><small>${E(W.byId[id]?.nome||id)}</small><b>${E(v.detail||v.title)}</b>${v.detail?`<small>${E(v.title)}</small>`:''}</span></li>`).join('')}</ul>`:''}
 <a class="btn sm" href="${link}">${ph==='presto'?'Scopri i premi':ph==='nomination'?(n?'Continua le nomination':'Inizia le nomination'):ph==='finale'?'Vota la finale':'Guarda i risultati'} →</a>`}

/* ---------- cerca membri ---------- */
function bindSearch(all,viewer){const inp=q('#msq'),out=q('#mres');if(!inp)return;let list=null,t;
 const go=async()=>{const term=inp.value.trim();if(!term){out.innerHTML='';return}list=list||await S.members(all);
  const R=S.searchMembers(list,all,viewer,term);
  out.innerHTML=R.length?R.map(m=>`<li><a href="${prof(m.did)}"><img ${A.avAttr(m.did,m.avatar)} alt="" loading="lazy"><span class="simn"><b>${E(m.name)}</b><small>${m.n?`${m.n} ${m.n===1?'titolo':'titoli'} in comune`:'nessun titolo in comune'}</small></span>${viewer&&m.n?`<span class="simp"><b>${m.pct}%</b>${S.label(m.pct)?`<span class="mlab ${S.label(m.pct)[0]}">${S.label(m.pct)[1]}</span>`:''}</span>`:''}</a></li>`).join('')
   :`<li class="muted small mnone">Nessun membro trovato.</li>`};
 inp.oninput=()=>{clearTimeout(t);t=setTimeout(go,140)};inp.onfocus=()=>{if(!list)S.members(all).then(l=>list=l)}}

/* ---------- pagina ---------- */
function landing(members){const list=Object.entries(members).filter(([,m])=>m.in_server!==false&&m.nick).slice(0,24);
 return`<section class="page-hero"><p class="label">Profilo</p><h1>Il tuo passaporto.</h1><p class="lead">Accedi con Discord: nickname e avatar arrivano dal server Staskys, punti e streak dai minigiochi, e i voti dal catalogo.</p>
 <div class="cta" style="justify-content:flex-start">${A.READY?'<button class="btn magnetic" id="login">Accedi con Discord</button>':''}<a class="btn ghost" href="profilo.html?demo=1">Guarda un profilo demo</a></div></section>
 ${list.length?`<section class="wrap tight"><p class="label">Profili dei membri</p><div class="mgrid">${list.map(([id,m])=>`<a class="mchip" href="profilo.html?u=${E(id)}"><img ${A.avAttr(id,m.avatar)} alt="" loading="lazy"><span>${E(A.clean(m.nick))}</span></a>`).join('')}</div></section>`:''}`}

let VIEWER='';
async function show(){
 await A.ready;
 const viewerDid=VIEWER=A.DEMO?S.DEMO_ME:(A.user?A.profile(A.user).discord:'');
 const did=P.get('u')||viewerDid;
 if(!did){const mem=await A.loadMembers();root.innerHTML=landing(mem);const b=q('#login');b&&(b.onclick=()=>A.login());return}
 const [all,games,profiles]=await Promise.all([S.loadAll(),S.loadGames(),S.loadProfiles()]);
 const u=await loadUser(did,all,games,profiles);
 const M=S.byUser(all),viewerRows=viewerDid?M.get(viewerDid)||[]:[];
 const showCmp=!u.isMe,cmp=showCmp&&viewerDid?S.compare(viewerRows,u.ratings):null;
 const firstKind=KINDS.slice().sort((a,b)=>u.ratings.filter(r=>r.kind===b).length-u.ratings.filter(r=>r.kind===a).length)[0];
 const ctx={kind:KINDS.includes(P.get('tipo'))?P.get('tipo'):firstKind,viewer:viewerDid,cmp,showCmp,similar:S.similar(all,did),avColor:''};
 ensureFont(u.theme.font);
 root.innerHTML=pageHTML(u,ctx);
 const reload=async()=>{const all2=await S.loadAll();u.ratings=all2.filter(r=>String(r.discord_id)===did);setKind(ctx.kind)};
 const setKind=k=>{ctx.kind=k;const s=q('#stars');s&&(s.innerHTML=starsHTML(u,k));const t=q('#t10');t&&(t.innerHTML=topHTML(u,k));qa('#skind button').forEach(b=>b.classList.toggle('active',b.dataset.k===k));bindT10()};
 const bindT10=()=>{const e=q('#t10edit');e&&(e.onclick=()=>editTop(u,ctx.kind,reload));bindDrag(u,ctx.kind,reload)};
 const bindPass=()=>{qa('#skind button').forEach(b=>b.onclick=()=>setKind(b.dataset.k));
  const lo=q('#logout');lo&&(lo.onclick=()=>A.logout());
  const cz=q('#customize');cz&&(cz.onclick=()=>openCustomize(u,rerenderPass));
  const ab=q('#addbio');ab&&(ab.onclick=()=>{openCustomize(u,rerenderPass);setTimeout(()=>{const b=q('#bio');b&&b.focus()},260)});
  const dc=q('#decos');dc&&(dc.onclick=()=>openDecos(u,rerenderPass))};
 /* ridisegna solo il passaporto + l'ordine delle sezioni (anteprima dal vivo) */
 const rerenderPass=()=>{const old=q('.pass',root);old.outerHTML=passHTML(u,ctx);const main=q('.pf-main',root);u.theme.order.forEach(k=>{const s=q(`.sec[data-sec="${k}"]`,main);s&&main.appendChild(s)});bindPass()};
 bindPass();bindT10();
 const cl=q('#cmplogin');cl&&(cl.onclick=()=>A.login());
 bindSearch(all,viewerDid);
 if(u.isMe)fillAwards(u);
 document.title=u.nick+' · Staskys';
 A.color(u.avatar).then(col=>{ctx.avColor=col;if(!u.theme.accent){const p=q('.pass',root);p&&p.style.setProperty('--c',col)}})}
show();document.addEventListener('staskys-auth',()=>{if(!A.DEMO){S.reset();show()}});
})();
