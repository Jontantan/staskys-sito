/* Staskys — STASKYS AWARDS: pagina con le 4 fasi (presto → nomination → finale → risultati).
   La fase arriva da award_settings (la cambia Jonathan su Supabase). In DEMO: awards.html?demo=1&fase=nomination|finale|risultati */
(function(){
const A=window.STASKYS,S=window.STASKYS_SOCIAL,W=window.STASKYS_AWARDS,E=A.E,q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const root=q('#aw'),P=new URLSearchParams(location.search);
const CATS=Object.keys(W.CATS);
let cat=CATS.includes(P.get('cat'))?P.get('cat'):'game',set,votes,all=[],mine=[],fin={},res={},auto={},me='';
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const fmtDate=d=>d?new Date(d).toLocaleDateString('it-IT',{day:'numeric',month:'long'}):'';
const prof=did=>`profilo.html?${A.DEMO?'demo=1&':''}u=${encodeURIComponent(did)}`;

/* ---------- DEMO: finalisti e risultati finti ---------- */
const DEMO_DET={g_char:['Arthur Morgan','Hornet','Melinoë','Kratos','Link'],g_boss:['Malenia','Radahn','Lace','Hades','Ganon'],a_op:['IRIS OUT','Bling-Bang-Bang-Born','Kick Back','SPECIALZ','Yuusha'],a_ed:['Anytime Anywhere','Mixed Nuts','Chainsaw Blood','Hikaru','Ai no Utsuwa'],
 a_fight:['Gojo vs Sukuna','Denji vs Reze','Fern vs Übel','Jinwoo vs Igris','Tanjiro vs Akaza'],a_char:['Frieren','Gojo Satoru','Makima','Anya Forger','Denji'],a_vill:['Sukuna','Makima','Aura','Muzan','Igris'],a_moment:['Il ritorno di Himmel','Gojo libero','La scelta di Reze','Il volo di Fern','Il sacrificio di Rengoku'],
 f_char:['Paul Atreides','Oppenheimer','Cooper','Chihiro','Kim Ki-taek'],s_char:['Walter White','Jinx','Eleven','Joel','Carmy']};
function demoFinal(){const out={};
 W.AWARDS.forEach(a=>{if(a.modo==='auto')return;let L=[];
  if(a.modo==='titolo'){let R=S.ranking(all,a.cat,1);if(a.id.endsWith('flop'))R=R.slice(-5).reverse();else{const k=W.AWARDS.filter(x=>x.cat===a.cat).indexOf(a)%Math.max(1,Math.min(R.length,8));R=[...R.slice(k),...R.slice(0,k)]}
   L=R.slice(0,5).map(r=>({choice_key:r.kind+':'+r.media_id,title:r.title,cover:r.cover}))}
  else if(a.modo==='dettaglio'){const R=S.ranking(all,a.cat,1);L=(DEMO_DET[a.id]||[]).map((n,i)=>({choice_key:'d:'+norm(n),title:R[i]?R[i].title:'',detail:n,cover:R[i]?R[i].cover:null}))}
  else if(a.modo==='membro'){L=['aki','rin','kai','yuki','sora'].map((x,i)=>({choice_key:'m:demo-'+x,title:'Demo '+x[0].toUpperCase()+x.slice(1),cover:`https://cdn.discordapp.com/embed/avatars/${[1,3,4,5,0][i]}.png`}))}
  out[a.id]=L.map((x,i)=>({...x,noms:12-i*2}))});return out}
const demoRes=f=>Object.fromEntries(Object.entries(f).map(([k,L])=>[k,L.map((x,i)=>({...x,votes:[23,17,11,8,5][i]||1}))]));

/* ---------- premi automatici ---------- */
async function computeAuto(){const g=await S.loadGames(),top=g.ranked.filter(u=>u.points>0).slice(0,3);
 const M=S.byUser(all),ids=[...M.keys()],pairs=[];
 for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const c=S.compare(M.get(ids[i]),M.get(ids[j]));if(c.n>=8)pairs.push({a:ids[i],b:ids[j],an:M.get(ids[i])[0].username,bn:M.get(ids[j])[0].username,aa:M.get(ids[i])[0].avatar_url,ba:M.get(ids[j])[0].avatar_url,pct:c.pct,n:c.n})}
 pairs.sort((x,y)=>y.pct-x.pct||y.n-x.n);
 auto={sp_champ:top.map(u=>({title:A.clean(u.name||'Membro'),cover:u.avatar,detail:u.points+' punti',did:u.did})),sp_couple:pairs.slice(0,3).map(p=>({title:A.clean(p.an)+' & '+A.clean(p.bn),cover:p.aa,cover2:p.ba,detail:p.pct+'% · '+p.n+' titoli in comune'}))}}

/* ---------- vista ---------- */
const STEPS=[['nomination','Nomination','Ognuno sceglie i suoi preferiti del 2026, partendo dal proprio catalogo.'],['finale','Finale','Per ogni premio passano i 5 più nominati: una settimana per votare il vincitore.'],['risultati','Premiazione','Si scoprono i vincitori, con podio e coriandoli.']];
function hero(){const ph=set.phase,idx=STEPS.findIndex(s=>s[0]===ph);
 const when={nomination:set.nom_start?`${fmtDate(set.nom_start)}${set.nom_end?' – '+fmtDate(set.nom_end):''}`:'Data da annunciare',finale:set.final_start?`${fmtDate(set.final_start)}${set.final_end?' – '+fmtDate(set.final_end):''}`:'Data da annunciare',risultati:set.ceremony?fmtDate(set.ceremony):'Data da annunciare'};
 return`${A.DEMO?`<div class="demo-ribbon">DEMO · fase “${E(W.FASI[ph])}” con dati finti · prova <a href="?demo=1">presto</a> · <a href="?demo=1&fase=nomination">nomination</a> · <a href="?demo=1&fase=finale">finale</a> · <a href="?demo=1&fase=risultati">risultati</a></div>`:''}
 <section class="aw-hero"><div class="aw-glow" aria-hidden="true"></div><p class="label">La community sceglie</p><h1>Staskys<br><span class="aw-gold">Awards ${set.year||W.YEAR}</span></h1>
 <p class="lead">${ph==='presto'?'Gli Oscar di Staskys stanno arrivando. Vota e completa il tuo catalogo: le nomination partono dai titoli che hai vissuto nel '+(set.year||W.YEAR)+'.':ph==='nomination'?'Le nomination sono aperte! Scegli i tuoi preferiti per ogni premio.':ph==='finale'?'La finale è aperta: per ogni premio scegli il vincitore tra i 5 finalisti.':'I vincitori sono stati annunciati. Grazie a tutti per aver votato!'}</p>
 <ol class="aw-steps">${STEPS.map(([k,t,d],i)=>`<li class="${i<idx?'done':i===idx?'now':''}"><span class="aw-dot">${i<idx?'✓':i+1}</span><b>${t}</b><small>${E(when[k])}</small><p>${d}</p></li>`).join('')}</ol>
 ${!A.DEMO&&!A.user&&(ph==='nomination'||ph==='finale')&&A.READY?'<button class="btn" id="awlogin">Accedi con Discord per votare</button>':''}</section>`}
function tabs(){return`<div class="seg aw-tabs" id="awtabs">${CATS.map(c=>`<button data-c="${c}" class="${c===cat?'active':''}">${W.CATS[c][0]} ${W.CATS[c][1]}</button>`).join('')}</div>`}
const cv=(x,cls='')=>x&&x.cover?`<img class="${cls}" src="${E(x.cover)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">`:`<i class="${cls} ph">★</i>`;
function card(a){const ph=set.phase,L=a.modo==='auto'?(auto[a.id]||[]):[];
 const head=`<header><h3>${E(a.nome)}</h3>${a.top?'<span class="aw-top">Premio principale</span>':''}</header>`;
 if(a.modo==='auto')return`<article class="aw-card auto${a.top?' big':''}">${head}<p class="muted small">${E(a.info)}</p>${L.length?`<ul class="aw-fin">${L.map((x,i)=>`<li class="${ph==='risultati'&&!i?'win':''}">${cv(x)}${x.cover2?cv({cover:x.cover2}):''}<span><b>${E(x.title)}</b><small>${E(x.detail)}</small></span>${ph==='risultati'?`<em>${['🥇','🥈','🥉'][i]}</em>`:i?'':'<em class="lead-now">in testa</em>'}</li>`).join('')}</ul>`:'<p class="muted small">Ancora nessun dato.</p>'}<span class="aw-auto">Automatico</span></article>`;
 if(ph==='presto')return`<article class="aw-card locked${a.top?' big':''}">${head}<p class="muted small">${a.modo==='titolo'?'Scegli un titolo dal tuo catalogo':a.modo==='membro'?'Scegli un membro del server':'Scrivi un nome e collega il titolo'}</p><span class="aw-lock">🔒 Presto</span></article>`;
 if(ph==='nomination'){const v=votes.nom[a.id];
  return`<article class="aw-card${v?' picked':''}${a.top?' big':''}" data-a="${a.id}">${head}${v?`<div class="aw-pick">${cv(v)}<span><small>La tua nomination</small><b>${E(v.detail||v.title)}</b>${v.detail&&v.title?`<small>${E(v.title)}</small>`:''}</span></div>`:'<p class="muted small">Non hai ancora scelto.</p>'}<button class="btn sm${v?' ghost':''}" data-pick="${a.id}">${v?'Cambia':'Scegli'}</button></article>`}
 const F=(ph==='finale'?fin:res)[a.id]||[];const v=votes.final[a.id];
 if(ph==='finale')return`<article class="aw-card${v?' picked':''}${a.top?' big':''}">${head}${F.length?`<ul class="aw-fin vote">${F.map(x=>`<li><button data-vote="${a.id}" data-k="${E(x.choice_key)}" class="${v&&v.choice_key===x.choice_key?'on':''}">${cv(x)}<span><b>${E(x.detail||x.title)}</b>${x.detail&&x.title?`<small>${E(x.title)}</small>`:''}</span><em>${v&&v.choice_key===x.choice_key?'✓':''}</em></button></li>`).join('')}</ul>`:'<p class="muted small">Nessun finalista: nessuno ha nominato in questo premio.</p>'}</article>`;
 const R=F.slice().sort((x,y)=>y.votes-x.votes),tot=R.reduce((s,x)=>s+x.votes,0)||1;
 return`<article class="aw-card res${a.top?' big':''}">${head}${R.length?`${R[0]?`<div class="aw-win">${cv(R[0],'wcv')}<span><small>Vincitore</small><b>${E(R[0].detail||R[0].title)}</b>${R[0].detail&&R[0].title?`<small>${E(R[0].title)}</small>`:''}<em>${Math.round(R[0].votes/tot*100)}% dei voti</em></span></div>`:''}<ol class="aw-podium">${R.slice(1,3).map((x,i)=>`<li><span>${['🥈','🥉'][i]}</span><b>${E(x.detail||x.title)}</b><em>${Math.round(x.votes/tot*100)}%</em></li>`).join('')}</ol>`:'<p class="muted small">Nessun voto in questo premio.</p>'}</article>`}
function grid(){const L=W.AWARDS.filter(a=>a.cat===cat);const ph=set.phase;
 const n=W.AWARDS.filter(a=>a.modo!=='auto'&&(ph==='nomination'?votes.nom[a.id]:votes.final[a.id])).length,tot=W.AWARDS.filter(a=>a.modo!=='auto').length;
 return`${ph==='nomination'||ph==='finale'?`<div class="aw-prog"><div><b>${n}</b>/${tot} premi ${ph==='nomination'?'nominati':'votati'}</div><div class="myaw-bar"><i style="width:${n/tot*100}%"></i></div></div>`:''}
 <div class="aw-grid">${L.map(card).join('')}</div>`}
function how(){return`<section class="wrap tight aw-how"><p class="label">Come funziona</p><div class="aw-how-g">
 <div class="card"><b>1 · Vota nel catalogo</b><p class="muted small">Per nominare un titolo devi averlo nel tuo <a href="catalogo.html${A.DEMO?'?demo=1':''}">catalogo</a> come Visto, In corso o Droppato nel ${set.year||W.YEAR}. Così si nomina solo quello che si è vissuto davvero.</p></div>
 <div class="card"><b>2 · Nomination e finale</b><p class="muted small">Nella fase nomination ognuno sceglie un preferito per ogni premio. I 5 più nominati vanno in finale, e lì hai una settimana per scegliere il vincitore. I voti sono segreti.</p></div>
 <div class="card"><b>3 · Premiazione</b><p class="muted small">Alla fine si scoprono i vincitori di tutti i ${W.AWARDS.length} premi. “Campione dei minigiochi” e “Coppia più compatibile” sono calcolati in automatico dal sito.</p></div></div></section>`}
function draw(){root.innerHTML=`${hero()}<section class="wrap tight">${tabs()}<div id="awg">${grid()}</div></section>${how()}`;bind()}
function redraw(){q('#awg').innerHTML=grid();bindGrid()}
function bind(){qa('#awtabs button').forEach(b=>b.onclick=()=>{cat=b.dataset.c;qa('#awtabs button').forEach(x=>x.classList.toggle('active',x===b));redraw()});
 const l=q('#awlogin');l&&(l.onclick=()=>A.login());bindGrid()}
function needLogin(){if(A.DEMO||A.user)return false;A.READY&&A.login();return true}
function bindGrid(){qa('[data-pick]').forEach(b=>b.onclick=()=>{if(!needLogin())picker(W.byId[b.dataset.pick])});
 qa('[data-vote]').forEach(b=>b.onclick=async()=>{if(needLogin())return;const a=b.dataset.vote,k=b.dataset.k,x=(fin[a]||[]).find(f=>f.choice_key===k);if(!x)return;
  const cur=votes.final[a];const err=cur&&cur.choice_key===k?await W.removeVote('final',a):await W.saveVote('final',a,x);if(err){toast(errText(err));return}
  if(cur&&cur.choice_key===k)delete votes.final[a];else votes.final[a]={...x};redraw()})}
const errText=e=>/award_|schema|relation|policy|row-level/.test(e.message||'')?'Gli Awards si attivano appena il database è pronto e la fase è aperta.':e.message==='login'?'Accedi con Discord per votare.':'Non sono riuscito a salvare. Riprova.';
function toast(t){let el=q('#awtoast');if(!el){document.body.insertAdjacentHTML('beforeend','<div class="aw-toast" id="awtoast" role="status"></div>');el=q('#awtoast')}el.textContent=t;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),3200)}

/* ---------- scegli la nomination ---------- */
function sheetOpen(html){let sh=q('#awsheet');if(!sh){document.body.insertAdjacentHTML('beforeend','<div class="csheet" id="awsheet" hidden><div class="csheet-in" role="dialog" aria-modal="true"></div></div>');sh=q('#awsheet')}
 const box=q('.csheet-in',sh);box.innerHTML=html;const close=()=>{sh.classList.remove('show');setTimeout(()=>sh.hidden=true,200)};sh.onclick=e=>{if(e.target===sh)close()};
 sh.hidden=false;requestAnimationFrame(()=>sh.classList.add('show'));q('.cx',box).onclick=close;return{box,close}}
async function picker(a){const cur=votes.nom[a.id];let sel=null,term='',detail=cur&&cur.detail||'';
 const pool=a.modo==='membro'?(await S.members(all)).filter(m=>m.did!==me).map(m=>({choice_key:'m:'+m.did,title:m.name,cover:m.avatar||null}))
  :W.eligible(mine,a.cat).map(r=>({choice_key:r.kind+':'+r.media_id,title:r.title,cover:r.cover,rating:r.rating})).sort((x,y)=>(A.hasR(y)?+y.rating:-1)-(A.hasR(x)?+x.rating:-1));
 if(cur&&a.modo!=='dettaglio')sel=pool.find(p=>p.choice_key===cur.choice_key)||null;
 if(cur&&a.modo==='dettaglio'&&cur.title)sel=pool.find(p=>p.title===cur.title)||null;
 const {box,close}=sheetOpen(`<button class="cx" aria-label="Chiudi">×</button><p class="label">${W.CATS[a.cat][0]} ${W.CATS[a.cat][1]} · Nomination</p><h3 class="cz-h">${E(a.nome)}</h3>
  ${a.modo==='dettaglio'?`<p class="label">${E(a.ph||'Il tuo preferito')}</p><input class="bio-in" id="awdet" maxlength="120" placeholder="${E(a.ph||'')}" value="${E(detail)}"><p class="label">Da quale titolo? <span class="muted">(facoltativo)</span></p>`:''}
  ${pool.length>6?`<label class="msq"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="awq" type="search" placeholder="Filtra…" autocomplete="off"></label>`:''}
  <div class="aw-pool" id="awpool"></div>
  <div class="cs-act"><button class="btn" id="awsave">Salva nomination</button>${cur?'<button class="btn ghost" id="awdel">Togli</button>':''}</div><p class="muted small" id="awmsg"></p>`);
 const drawPool=()=>{const L=pool.filter(p=>!term||norm(p.title).includes(norm(term)));
  q('#awpool',box).innerHTML=L.length?L.slice(0,80).map(p=>`<button class="aw-opt${sel&&sel.choice_key===p.choice_key?' on':''}" data-k="${E(p.choice_key)}">${cv(p)}<span>${E(p.title)}</span>${A.hasR(p)?`<em>${A.fmtR(p.rating)}</em>`:''}</button>`).join('')
   :`<p class="muted small aw-empty">${a.modo==='membro'?'Nessun membro trovato.':`Nel tuo catalogo non ci sono ${W.CATS[a.cat][1].toLowerCase()} vissuti nel ${set.year||W.YEAR}. <a href="catalogo.html?${A.DEMO?'demo=1&':''}tipo=${a.cat}">Aggiungili dal catalogo</a> (Visto, In corso o Droppato).`}</p>`;
  qa('.aw-opt',box).forEach(b=>b.onclick=()=>{const p=pool.find(x=>x.choice_key===b.dataset.k);sel=sel&&sel.choice_key===p.choice_key&&a.modo==='dettaglio'?null:p;drawPool()})};
 drawPool();const fq=q('#awq',box);fq&&(fq.oninput=()=>{term=fq.value;drawPool()});
 const d=q('#awdet',box);d&&(d.oninput=()=>detail=d.value.replace(/\s+/g,' ').slice(0,120));
 q('#awsave',box).onclick=async()=>{const msg=q('#awmsg',box);let c;
  if(a.modo==='dettaglio'){if(norm(detail).length<2){msg.textContent='Scrivi un nome.';return}c={choice_key:'d:'+norm(detail).slice(0,150),detail:detail.trim(),title:sel?sel.title:'',cover:sel?sel.cover:null}}
  else{if(!sel){msg.textContent='Scegli una delle opzioni.';return}c=sel}
  msg.textContent='Salvataggio…';const err=await W.saveVote('nom',a.id,c);if(err){msg.textContent=errText(err);return}votes.nom[a.id]={...c};close();redraw();toast('Nomination salvata ✓')};
 const del=q('#awdel',box);del&&(del.onclick=async()=>{const err=await W.removeVote('nom',a.id);if(err){q('#awmsg',box).textContent=errText(err);return}delete votes.nom[a.id];close();redraw()})}

/* ---------- coriandoli ---------- */
function confetti(){if(matchMedia('(prefers-reduced-motion: reduce)').matches||/[?&]still\b/.test(location.search))return;
 const c=document.createElement('canvas');c.className='aw-confetti';document.body.appendChild(c);const x=c.getContext('2d');const dpr=Math.min(2,devicePixelRatio||1);
 const rs=()=>{c.width=innerWidth*dpr;c.height=innerHeight*dpr};rs();addEventListener('resize',rs);
 const col=['#ffc53d','#ff4d8d','#22d3ee','#a3e635','#ffffff','#8b5cf6'];const P=Array.from({length:160},()=>({x:Math.random()*c.width,y:-Math.random()*c.height*.6,vx:(Math.random()-.5)*2*dpr,vy:(2+Math.random()*3)*dpr,r:Math.random()*6.28,vr:(Math.random()-.5)*.25,s:(5+Math.random()*6)*dpr,c:col[Math.random()*col.length|0]}));
 const t0=performance.now();(function f(t){x.clearRect(0,0,c.width,c.height);P.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;x.save();x.translate(p.x,p.y);x.rotate(p.r);x.fillStyle=p.c;x.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);x.restore()});
  if(t-t0<4500)requestAnimationFrame(f);else{c.remove();removeEventListener('resize',rs)}})(t0)}

/* ---------- avvio ---------- */
async function start(){await A.ready;me=A.DEMO?S.DEMO_ME:(A.user?A.profile(A.user).discord:'');
 [set,votes,all]=await Promise.all([W.loadSettings(),W.myVotes(),S.loadAll()]);mine=all.filter(r=>String(r.discord_id)===me);
 if(A.DEMO&&mine.length===0)mine=all.filter(r=>r.discord_id===S.DEMO_ME);
 await computeAuto();
 if(set.phase==='finale'||set.phase==='risultati'){
  if(A.DEMO){fin=demoFinal();res=demoRes(fin)}
  else{const g=(rows,key)=>{const o={};(rows||[]).forEach(r=>(o[r.award_id]=o[r.award_id]||[]).push({...r,[key]:+r[key]}));return o};
   const f=await A.sb.rpc('award_finalists');fin=g(f.data,'noms');if(set.phase==='risultati'){const r=await A.sb.rpc('award_results');res=g(r.data,'votes')}}}
 draw();if(set.phase==='risultati')setTimeout(confetti,400)}
start();document.addEventListener('staskys-auth',()=>{if(!A.DEMO){S.reset();start()}});
})();
