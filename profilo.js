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
/* obiettivo salvato dalla modalità test (update 4): solo id esistenti, per tipo */
function cleanGoal(g){if(!g||typeof g!=='object')return null;const ok=(id,t)=>id&&D.byId[id]&&D.byId[id].tipo===t?id:'';
 const o={frame:ok(g.frame,'frame'),effect:ok(g.effect,'effect'),bg:ok(g.bg,'bg'),badges:(Array.isArray(g.badges)?g.badges:[]).filter(id=>ok(id,'badge')).slice(0,D.MAX_BADGE)};
 return o.frame||o.effect||o.bg||o.badges.length?o:null}
const goalIds=g=>g?[g.frame,g.effect,g.bg,...g.badges].filter(Boolean):[];
/* copertine scelte dal membro (update 3): le vedono tutti sul suo profilo, Top 10 e passaporto; il catalogo resta originale */
function applyCovers(u,rows){u.ratings=rows.map(r=>{const c=u.covers[r.kind+':'+r.media_id];return c?{...r,ocover:r.cover,cover:c,custom:true}:r});return u}
async function loadUser(did,all,games,profiles,X){
 const mine=all.filter(r=>String(r.discord_id)===did);
 const st=S.statsFor(did,games,mine,profiles,X,NO_STATS),pf=profiles.get(did)||{},unl=D.unlocked(st);
 const meta=pf.meta&&typeof pf.meta==='object'?pf.meta:{},likers=X.likes.get(did)||new Set(),vw=VIEWER;
 const base=applyCovers({did,stats:st,rec:st.rec,streak:st.streak,unlocked:unl,bio:String(pf.bio||'').slice(0,160),theme:cleanTheme(pf.theme),equipped:sanitizeEq(pf.equipped,unl),covers:S.cleanCovers(pf.covers),badgePts:D.badgePoints(unl),likes:likers.size,liked:!!vw&&(likers.has(vw)||(A.user&&likers.has(A.user.id))),likesOk:X.ok.likes,firstAt:st.firstAt,goal:cleanGoal(meta.goal)},mine);
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
const epTxt=r=>A.progTxt(r);
function topHTML(u,kind){const {list,custom}=S.top10(u.ratings,kind),dnd=u.isMe&&list.length>1;
 return`<div class="t10-head"><div><h3>Top 10 ${A.KINDS[kind].t}</h3><p class="muted small">${list.length?(custom?'Ordinata a mano':'Automatica: in ordine di voto')+(dnd?' · trascina ⋮⋮ per riordinare':''):'Ancora vuota'}</p></div>${u.isMe&&u.ratings.some(r=>r.kind===kind)?'<button class="btn ghost sm" id="t10edit">Modifica</button>':''}</div>
 ${list.length?`<ol class="t10${dnd?' dnd':''}" id="t10list">${t10Items(list,kind,dnd)}</ol><p class="t10msg muted small" id="t10msg" aria-live="polite"></p>`:''}`}
const t10Items=(list,kind,dnd)=>list.map((r,i)=>`<li class="${i<3?'top':''}" data-id="${E(r.media_id)}">${dnd?'<span class="grip" aria-label="Trascina per spostare" title="Trascina per spostare">⋮⋮</span>':''}<span class="t10n">${i+1}</span>${cover(r,'xs')}<span class="t10t"><b>${E(r.title)}</b><small>${[r.year,A.statusLabel(kind,r.status)+epTxt(r)].filter(Boolean).map(E).join(' · ')}</small></span>${A.hasR(r)?`<span class="t10r">${A.fmtR(r.rating)}</span>`:''}${STAFF&&!dnd&&r.custom?`<button class="cvstaff" data-cvk="${E(kind+':'+r.media_id)}" title="Staff: rimuovi questa copertina personalizzata" aria-label="Rimuovi copertina (staff)">🛡</button>`:''}</li>`).join('');
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
const badgeHTML=id=>{const d=D.byId[id];return d?`<span class="dbadge ${D.badgeCls(d)}" title="${E(d.nome)} · ${E(D.RARITA[d.rarita])}">${d.icona||'★'}</span>`:''};
function avatarHTML(u){const t=u.theme,eq=u.equipped;
 return`<span class="avwrap shape-${t.frame}${eq.frame?' fr fr-'+eq.frame:''}"><img class="pass-av" ${A.avAttr(u.did,u.avatar)} alt="">${eq.frame?D.frameHTML(eq.frame):''}</span>`}
/* banner: 'auto' (mai scelto) = banner del profilo Discord/server se c'è; 'discord' solo se c'è davvero (patch 2.3) */
const banOf=u=>{const b=u.theme.banner;if(b==='auto'||b==='discord')return u.banner?'discord':'none';return b};
const banHTML=(u,k)=>k==='discord'?`<div class="pass-ban ban-discord" aria-hidden="true" style="background-image:url('${E(u.banner)}')"></div>`:`<div class="pass-ban ban-${k}" aria-hidden="true"></div>`;
/* like al passaporto (update 4): uno per persona, si può togliere; sul tuo vedi solo quanti sono */
const HEART='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C1 8.6 3 5 6.6 5c2.1 0 3.6 1.2 4.4 2.6h2C13.8 6.2 15.3 5 17.4 5 21 5 23 8.6 21.6 11.8 19.5 16.4 12 21 12 21z"/></svg>';
function likeHTML(u){if(!u.likesOk&&!u.likes)return'';const n=`<b class="plike-n">${fmt(u.likes)}</b>`;
 if(u.isMe)return`<button class="plike" disabled title="Like ricevuti sul tuo passaporto">${HEART}${n} <span>like</span></button>`;
 return`<button class="plike${u.liked?' on':''}" id="plike" aria-pressed="${u.liked?'true':'false'}" title="${u.liked?'Togli il like':'Metti like a questo passaporto'}">${HEART}${n} <span>${u.liked?'Ti piace':'Mi piace'}</span></button>`}
function passHTML(u,ctx){
 const t=u.theme,eq=u.equipped,rated=u.ratings.filter(A.hasR);
 const now=u.ratings.filter(r=>r.status==='in_corso').sort((a,b)=>String(b.updated_at).localeCompare(a.updated_at))[0];
 const since=u.joined?new Date(u.joined).toLocaleDateString('it-IT',{month:'long',year:'numeric'}):'';
 const site=u.firstAt?Math.max(0,Math.floor((Date.now()-new Date(u.firstAt))/864e5)):null;
 return`<article class="pass bg-${t.bg} font-${t.font}${eq.bg?' dbg dbg-'+eq.bg:''}${banOf(u)!=='none'?' has-ban':''}" style="--c:${t.accent||ctx.avColor||'#555'}">
   ${banOf(u)!=='none'?banHTML(u,banOf(u)):''}
   ${eq.bg?D.bgHTML(eq.bg):''}
   ${ctx.testing?'<span class="test-ribbon">🧪 Modalità test · anteprima</span>':''}
   <div class="pass-glow" aria-hidden="true"></div>
   <header class="pass-head">
    ${avatarHTML(u)}
    <div class="pass-id"><p class="pass-label">Passaporto Staskys</p><h1><span class="pname${eq.effect?' fx '+eq.effect:''}" data-text="${E(u.nick)}">${E(u.nick)}</span>${eq.badges.length?`<span class="dbadges">${eq.badges.map(badgeHTML).join('')}</span>`:''}</h1>
    <p class="pass-sub">${[u.username?'@'+E(u.username):'',since?`nel server da ${E(since)}`:'',site!=null?`sul sito da ${site===0?'oggi':site===1?'1 giorno':fmt(site)+' giorni'}`:'',!u.inServer?'non è più nel server':''].filter(Boolean).join(' · ')}</p>
    ${u.bio?`<p class="pass-bio">${E(u.bio)}</p>`:u.isMe?'<button class="pass-bio add" id="addbio">+ Aggiungi una bio</button>':''}
    ${likeHTML(u)}${now?`<span class="pill"><i class="live"></i>${E(A.KINDS[now.kind].verb)} <b>${E(now.title)}</b>${E(epTxt(now))}</span>`:''}</div>
    ${ctx.cmp&&ctx.cmp.n?`<div class="pass-match"><b>${ctx.cmp.pct}%</b><span>con te</span></div>`:''}
    ${u.isMe&&!u.demo?'<button class="btn ghost sm pass-out" id="logout">Esci</button>':''}
    <button class="btn ghost sm pass-share" id="share" aria-label="Condividi il profilo come immagine" title="Condividi il profilo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5"/><path d="M8 10H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-2"/></svg><span>Condividi</span></button>
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
    <div class="cat-foot"><span>${c('visto')} ${A.doneWord(k)[0]}</span><span>${c('in_corso')} in corso</span>${c('droppato')?`<span>${c('droppato')} droppati</span>`:''}<span>${c('voglio')} da ${A.doneWord(k)[1]}</span></div></a>`}).join('')}
  </section>`}
const awardsCard=()=>`<section class="card myaw sec" data-sec="awards" id="myaw"><p class="muted small">Carico gli Awards…</p></section>`;
function pageHTML(u,ctx){
 const secs={t10:`<section class="card t10card sec" data-sec="t10" id="t10">${topHTML(u,ctx.kind)}</section>`,cats:catsHTML(u),awards:u.isMe&&W?awardsCard():''};
 return`${u.demo?`<div class="demo-ribbon">DEMO · ${u.isMe?'profilo di esempio':'confronto di esempio'} con dati finti</div>`:''}
 <section class="pf-wrap">
 <div class="pf-main">
  ${passHTML(u,ctx)}
  ${questMHTML(u)}
  ${ctx.showCmp?compareHTML(u,ctx.viewer,ctx.cmp):''}
  ${u.theme.order.map(k=>secs[k]||'').join('')}
 </div>
 <aside class="pf-side">
  ${questHTML(u)}
  ${similarHTML(ctx.similar,u)}
  ${searchHTML()}
  <div class="card side-card"><h3>Minigiochi</h3><p class="muted small">Record personali e posizione in classifica</p>
   ${u.rec.length?`<ol class="recs">${u.rec.map(r=>`<li><span class="rk${r.rank<=3?' top':''}">${r.rank===1?'👑':'#'+r.rank}</span><span class="rg">${E(S.GAME_NAMES[r.game]||r.game)}</span><b>${fmt(r.score)}</b></li>`).join('')}</ol>`:`<p class="muted small">${u.isMe?'Non hai ancora giocato. <a href="giochi.html">Vai ai giochi</a>':'Non ha ancora giocato.'}</p>`}
   <p class="muted tiny">Punti: 10 per gioco, bonus podio e top 10, +5 per giorno di streak. Wordle e Clicker veloce non danno punti.</p></div>
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
function openCustomize(u,rerender,openCovers){
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
   <p class="label">Decorazioni</p><button class="czbtn" id="cztest"><span>🧪</span><span><b>Modalità test</b><small>Prova cornici, effetti, sfondi e badge (anche bloccati) e salva il look come obiettivo</small></span><i>→</i></button>
   <p class="label">Copertine</p><button class="czcov" id="czcov"><span class="czcov-st">${(()=>{const L=u.ratings.filter(r=>r.cover).slice(0,3);return L.map(r=>`<img src="${E(r.cover)}" alt="" loading="lazy">`).join('')})()}</span><span><b>Cambia le copertine dei tuoi titoli</b><small>Scegli tra quelle ufficiali o caricane una dal PC: la vedranno tutti sul tuo profilo${Object.keys(u.covers||{}).length?` · ${Object.keys(u.covers).length} cambiate`:''}</small></span><i>→</i></button>
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
  const cc=q('#czcov',box);cc&&(cc.onclick=()=>openCovers&&openCovers());
  const ct=q('#cztest',box);ct&&(ct.onclick=()=>{close();setTimeout(()=>openDecos(u,rerender,{test:true}),220)});
  qa('[data-ou]',box).forEach(b=>b.onclick=()=>{const i=+b.dataset.ou;[t.order[i-1],t.order[i]]=[t.order[i],t.order[i-1]];live();draw()});
  qa('[data-od]',box).forEach(b=>b.onclick=()=>{const i=+b.dataset.od;[t.order[i+1],t.order[i]]=[t.order[i],t.order[i+1]];live();draw()});
  q('#czreset',box).onclick=()=>{t=cleanTheme({});live();draw()};
  q('#czsave',box).onclick=async()=>{q('#czmsg',box).textContent='Salvataggio…';const err=await S.saveProfile({bio,theme:t});
   if(err){q('#czmsg',box).textContent=/site_profiles|schema|relation/.test(err.message||'')?'La personalizzazione si salva appena il database è aggiornato (fase 3).':'Non sono riuscito a salvare. Riprova.';return}saved=true;close()}};
 draw()}

/* ---------- le mie decorazioni (update 4: ordine per rarità, scritta per sbloccare, modalità test e obiettivo) ---------- */
function decoPreview(d,u){
 if(d.tipo==='frame')return`<span class="avwrap shape-round fr fr-${d.id} mini"><img class="pass-av" ${A.avAttr(u.did,u.avatar)} alt="">${D.frameHTML(d.id)}</span>`;
 if(d.tipo==='effect')return`<span class="pname fx ${d.id}" data-text="Aa">Aa</span>`;
 if(d.tipo==='bg')return`<span class="dbg bgmini">${D.bgHTML(d.id)}</span>`;
 return`<span class="dbadge big ${D.badgeCls(d)}">${d.icona||'★'}</span>`}
/* progresso verso una decorazione: [testo, percentuale] (null se è sì/no) */
function progOf(d,st){const p=D.prog(d,st);if(!p)return null;
 if(p.asc){if(p.cur==null)return[d.req.tipo==='posizione'?'non in classifica':'nessun record',0];const ok=p.cur<=p.max;return[(d.req.tipo==='posizione'?'#'+p.cur:fmt(p.cur)+(d.req.gioco==='reaction'?' ms':d.req.gioco==='mines'?' s':''))+' / '+(d.req.tipo==='posizione'?'#'+p.max:fmt(p.max)),ok?100:Math.max(5,Math.min(95,Math.round(p.max/p.cur*100)))]}
 const c=p.cur==null?0:p.cur;return[`${fmt(Math.min(c,p.max))} / ${fmt(p.max)}`,Math.min(100,Math.round(c/p.max*100))]}
function openDecos(u,rerender,opts){opts=opts||{};let eq=JSON.parse(JSON.stringify(u.equipped)),tab=opts.tab||'frame',test=!!opts.test;const st=u.stats;
 const real=JSON.parse(JSON.stringify(u.equipped));let teq=JSON.parse(JSON.stringify(u.goal||u.equipped));teq.badges=teq.badges||[];
 const applyTest=()=>{if(test){u.equipped=JSON.parse(JSON.stringify(teq));CTX.testing=true}else{u.equipped=sanitizeEq(eq,u.unlocked);CTX.testing=false}rerender()};
 const {box,close}=sheetOpen('decosheet','deco-sheet','',()=>{if(test||CTX.testing){CTX.testing=false;u.equipped=sanitizeEq(real,u.unlocked);rerender()}});
 const draw=()=>{const L=D.sortR(D.DECO.filter(d=>d.tipo===tab)),cur=test?teq:eq,miss=goalIds(teq).filter(id=>!u.unlocked.includes(id));
  box.innerHTML=`<button class="cx" aria-label="Chiudi">×</button><p class="label">Sbloccale con minigiochi, catalogo e passaporto</p><h3 class="cz-h">Le mie decorazioni</h3>
  <p class="muted small">${fmt(st.points)} punti${st.pos?' · #'+st.pos+' in classifica':''} · streak ${st.streak} · ${u.likes} like · <b>${u.unlocked.length}/${D.DECO.length}</b> sbloccate</p>
  <div class="dtest${test?' on':''}"><button class="tswitch${test?' on':''}" id="dtest" role="switch" aria-checked="${test}" aria-label="Modalità test"></button><b>🧪 Modalità test${test?': prova tutto, anche quello bloccato. Non si salva sul profilo.':' · prova come verrebbe il tuo passaporto con qualsiasi decorazione'}</b>
   ${test?`<button class="btn sm" id="dgoal" ${miss.length?'':'disabled'}>🎯 Salva come obiettivo</button>`:''}</div>
  ${test&&!miss.length?'<p class="muted tiny" style="margin:-.4rem 0 .6rem">Scegli almeno una cosa bloccata per creare un obiettivo.</p>':''}
  <div class="seg dtabs">${Object.entries(D.TIPI).map(([k,v])=>`<button data-t="${k}" class="${k===tab?'active':''}">${E(v)}</button>`).join('')}</div>
  <div class="dgrid">${L.map(d=>{const has=u.unlocked.includes(d.id),on=d.tipo==='badge'?cur.badges.includes(d.id):cur[d.tipo]===d.id,pr=has?null:progOf(d,st);
   return`<div class="ditem ${D.badgeCls(d)}${has?'':' locked'}${test?' testable':''}${on?(test?' tested on':' on'):''}" ${test?`data-tt="${d.id}" role="button" tabindex="0"`:''}><div class="dprev">${decoPreview(d,u)}${has||test?'':'<span class="dlock" aria-hidden="true">🔒</span>'}</div>
    <b>${E(d.nome)}</b><span class="drar">${E(D.RARITA[d.rarita])}</span>
    ${has?'':`<small class="dlockcap">${E(D.reqText(d.req,d))}</small>${pr?`<span class="dprog" title="${E(pr[0])}"><i style="width:${pr[1]}%"></i></span><small class="muted tiny">${E(pr[0])}</small>`:''}`}
    ${test?`<span class="btn sm ${on?'':'ghost'}">${on?'In prova ✓':'Prova'}</span>`:has?`<button class="btn sm ${on?'':'ghost'}" data-eq="${d.id}">${on?'Indossata ✓':'Indossa'}</button>`:''}</div>`}).join('')}</div>
  ${tab==='badge'?`<p class="muted tiny">Puoi mostrare fino a ${D.MAX_BADGE} badge accanto al nome.</p>`:''}
  <div class="cs-act">${test?'<button class="btn ghost" id="dexit">Esci dal test</button>':'<button class="btn" id="dsave">Salva</button>'}</div><p class="muted small" id="dmsg" aria-live="polite"></p>`;
  q('.cx',box).onclick=close;
  qa('[data-t]',box).forEach(b=>b.onclick=()=>{tab=b.dataset.t;draw()});
  q('#dtest',box).onclick=()=>{test=!test;if(test){teq=JSON.parse(JSON.stringify(u.goal||eq));teq.badges=teq.badges||[]}applyTest();draw()};
  const pick=(id,o)=>{const d=D.byId[id];if(d.tipo==='badge'){const i=o.badges.indexOf(id);if(i>=0)o.badges.splice(i,1);else{if(o.badges.length>=D.MAX_BADGE)o.badges.shift();o.badges.push(id)}}else o[d.tipo]=o[d.tipo]===id?'':id};
  qa('[data-tt]',box).forEach(b=>{const go=()=>{pick(b.dataset.tt,teq);applyTest();draw()};b.onclick=go;b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}}});
  qa('[data-eq]',box).forEach(b=>b.onclick=()=>{pick(b.dataset.eq,eq);u.equipped=sanitizeEq(eq,u.unlocked);rerender();draw()});
  const gl=q('#dgoal',box);gl&&(gl.onclick=async()=>{const g=cleanGoal(teq);q('#dmsg',box).textContent='Salvo l\'obiettivo…';const err=await S.saveMeta({goal:g});
   if(err){q('#dmsg',box).textContent=/meta|schema|column/.test(err.message||'')?'L\'obiettivo si salva appena il database è aggiornato (update 4).':'Non sono riuscito a salvare. Riprova.';return}
   u.goal=g;q('#dmsg',box).textContent='🎯 Obiettivo salvato! Trovi la Quest '+(matchMedia('(max-width:900px)').matches?'sotto il passaporto.':'a destra, sopra “Membri simili”.');refreshQuest(u)});
  const ex=q('#dexit',box);ex&&(ex.onclick=()=>{test=false;applyTest();draw()});
  const sv=q('#dsave',box);sv&&(sv.onclick=async()=>{q('#dmsg',box).textContent='Salvataggio…';const err=await S.saveProfile({equipped:u.equipped});
   if(err){q('#dmsg',box).textContent=/site_profiles|schema|relation/.test(err.message||'')?'Le decorazioni si salvano appena il database è aggiornato (fase 3).':'Non sono riuscito a salvare. Riprova.';return}real.frame=u.equipped.frame;Object.assign(real,JSON.parse(JSON.stringify(u.equipped)));close()})};
 if(test)applyTest();
 draw()}

/* ---------- Quest: cosa manca per l'obiettivo (update 4) ---------- */
function questInner(u){const g=u.goal;if(!g)return'';const ids=goalIds(g),st=u.stats,done=ids.filter(id=>u.unlocked.includes(id)).length;
 return`<h3><span>🎯</span> Quest</h3><p class="qtot">Il tuo obiettivo · ${done}/${ids.length} completati</p>
 <ul class="qlist">${D.sortR(ids.map(id=>D.byId[id])).map(d=>{const ok=u.unlocked.includes(d.id),pr=ok?null:progOf(d,st);
  return`<li class="${ok?'ok':''}"><span class="qi">${d.tipo==='badge'?d.icona:d.tipo==='frame'?'🖼️':d.tipo==='effect'?'✨':'🌌'}</span><span class="qt"><b>${E(d.nome)}</b><small>${ok?'Sbloccato!':E(D.reqText(d.req,d))}</small></span><span class="qv">${ok?'✓':pr?E(pr[0]):'—'}</span>${!ok&&pr?`<span class="qbar"><i style="width:${pr[1]}%"></i></span>`:''}</li>`}).join('')}</ul>
 <div class="qact"><button class="btn sm ghost" data-qtest>Prova il look</button><button class="btn sm ghost" data-qdel>Togli obiettivo</button></div>`}
function questActive(u){const ids=goalIds(u.goal);return u.isMe&&ids.length&&ids.some(id=>!u.unlocked.includes(id))}
function questHTML(u){return questActive(u)?`<div class="card side-card quest" id="questd">${questInner(u)}</div>`:''}
function questMHTML(u){return questActive(u)?`<details class="card quest quest-m" id="questm" open><summary><b>🎯 Quest</b><span class="muted small">${goalIds(u.goal).filter(id=>!u.unlocked.includes(id)).length} da sbloccare</span></summary>${questInner(u).replace(/^<h3>.*?<\/h3>/,'')}</details>`:''}
let CTX={},QB=null;
function refreshQuest(u){const side=q('.pf-side',root),main=q('.pf-main',root);if(!side||!main)return;q('#questd',root)?.remove();q('#questm',root)?.remove();
 if(!questActive(u))return;side.insertAdjacentHTML('afterbegin',questHTML(u));q('.pass',main).insertAdjacentHTML('afterend',questMHTML(u));QB&&QB()}

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

let VIEWER='',STAFF=false;
async function show(){
 await A.ready;
 const viewerDid=VIEWER=A.DEMO?S.DEMO_ME:(A.user?A.profile(A.user).discord:'');STAFF=await S.isStaff();
 const did=P.get('u')||viewerDid;
 if(!did){const mem=await A.loadMembers();root.innerHTML=landing(mem);const b=q('#login');b&&(b.onclick=()=>A.login());return}
 const [all,games,profiles,X]=await Promise.all([S.loadAll(),S.loadGames(),S.loadProfiles(),S.loadExtra()]);
 const u=await loadUser(did,all,games,profiles,X);
 const M=S.byUser(all),viewerRows=viewerDid?M.get(viewerDid)||[]:[];
 const showCmp=!u.isMe,cmp=showCmp&&viewerDid?S.compare(viewerRows,u.ratings):null;
 const firstKind=KINDS.slice().sort((a,b)=>u.ratings.filter(r=>r.kind===b).length-u.ratings.filter(r=>r.kind===a).length)[0];
 const ctx={kind:KINDS.includes(P.get('tipo'))?P.get('tipo'):firstKind,viewer:viewerDid,cmp,showCmp,similar:S.similar(all,did),avColor:'',testing:false};CTX=ctx;
 ensureFont(u.theme.font);
 root.innerHTML=pageHTML(u,ctx);
 const reload=async()=>{const all2=await S.loadAll();applyCovers(u,all2.filter(r=>String(r.discord_id)===did));setKind(ctx.kind)};
 const coversChanged=()=>{applyCovers(u,u.ratings.map(r=>r.custom?{...r,cover:r.ocover,custom:false}:r));rerenderPass();setKind(ctx.kind);const c=q('.cats',root);c&&(c.outerHTML=catsHTML(u))};
 const setKind=k=>{ctx.kind=k;const s=q('#stars');s&&(s.innerHTML=starsHTML(u,k));const t=q('#t10');t&&(t.innerHTML=topHTML(u,k));qa('#skind button').forEach(b=>b.classList.toggle('active',b.dataset.k===k));bindT10()};
 const bindT10=()=>{const e=q('#t10edit');e&&(e.onclick=()=>editTop(u,ctx.kind,reload));bindDrag(u,ctx.kind,reload);
  qa('.cvstaff',root).forEach(b=>b.onclick=async()=>{if(!confirm('Rimuovere questa copertina caricata da '+u.nick+'? Tornerà quella originale.'))return;b.disabled=true;
   const err=await window.STASKYS_COVERS.staffRemove(u,b.dataset.cvk);if(err){alert('Non sono riuscito a rimuoverla: '+(err.message||err));b.disabled=false;return}delete u.covers[b.dataset.cvk];coversChanged()})};
 const bindPass=()=>{qa('#skind button').forEach(b=>b.onclick=()=>setKind(b.dataset.k));
  const lo=q('#logout');lo&&(lo.onclick=()=>A.logout());
  const cz=q('#customize');cz&&(cz.onclick=()=>openCustomize(u,rerenderPass,()=>window.STASKYS_COVERS.open(u,ctx.kind,coversChanged)));
  const sh=q('#share');sh&&(sh.onclick=()=>window.STASKYS_SHARE&&window.STASKYS_SHARE.open(u,ctx));
  const ab=q('#addbio');ab&&(ab.onclick=()=>{openCustomize(u,rerenderPass);setTimeout(()=>{const b=q('#bio');b&&b.focus()},260)});
  const dc=q('#decos');dc&&(dc.onclick=()=>openDecos(u,rerenderPass));
  const lk=q('#plike');lk&&(lk.onclick=async()=>{if(!A.DEMO&&!A.user){A.login();return}const on=!u.liked;lk.disabled=true;const err=await S.toggleLike(u.did,on);lk.disabled=false;
   if(err){const m=String(err.message||'');alert(/passport_likes|schema|relation/.test(m)?'I like si attivano appena il database è aggiornato (update 4).':/Troppi/.test(m)?m:/login/.test(m)?'Accedi con Discord per mettere like.':'Non sono riuscito a salvare il like. Riprova.');return}
   u.liked=on;u.likes=Math.max(0,u.likes+(on?1:-1));rerenderPass();const b=q('#plike');b&&b.classList.add('pop')})};
 /* Quest: pulsanti "Prova il look" e "Togli obiettivo" */
 const bindQuest=QB=()=>{qa('[data-qtest]',root).forEach(b=>b.onclick=()=>openDecos(u,rerenderPass,{test:true}));
  qa('[data-qdel]',root).forEach(b=>b.onclick=async()=>{if(!confirm('Togliere il tuo obiettivo?'))return;const err=await S.saveMeta({goal:null});if(err){alert('Non sono riuscito a toglierlo. Riprova.');return}u.goal=null;refreshQuest(u)})};
 /* ridisegna solo il passaporto + l'ordine delle sezioni (anteprima dal vivo) */
 const rerenderPass=()=>{const old=q('.pass',root);old.outerHTML=passHTML(u,ctx);const main=q('.pf-main',root);u.theme.order.forEach(k=>{const s=q(`.sec[data-sec="${k}"]`,main);s&&main.appendChild(s)});bindPass()};
 bindPass();bindT10();bindQuest();
 /* obiettivo completato: la Quest sparisce (e l'obiettivo si cancella da solo) */
 if(u.isMe&&u.goal&&!questActive(u))S.saveMeta({goal:null}).then(()=>{u.goal=null});
 const cl=q('#cmplogin');cl&&(cl.onclick=()=>A.login());
 bindSearch(all,viewerDid);
 if(u.isMe)fillAwards(u);
 document.title=u.nick+' · Staskys';
 A.color(u.avatar).then(col=>{ctx.avColor=col;if(!u.theme.accent){const p=q('.pass',root);p&&p.style.setProperty('--c',col)}})}
show();document.addEventListener('staskys-auth',()=>{if(!A.DEMO){S.reset();show()}});
})();
