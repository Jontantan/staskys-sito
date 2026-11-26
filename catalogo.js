/* Staskys — Catalogo (fase 3): Anime (AniList), Giochi (RAWG), Film e Serie (TMDB)
   voti 0–10 con un decimale (slider), stato Visto / In corso / Droppato / Voglio, episodi visti, import da AniList */
(function(){
const A=window.STASKYS,E=A.E,q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
let kind='anime',view='scopri',stFilter='',term='',mine={},seq=0,lastItems=[];
const PH={anime:'Cerca un anime…',game:'Cerca un gioco…',movie:'Cerca un film…',tv:'Cerca una serie…'};
const ST=['visto','in_corso','droppato','voglio'];
const key=(k,id)=>k+':'+id;
const CFG=window.GIOCHI_CONFIG||{};
const HDR=A.LOCAL?{}:{apikey:CFG.SUPABASE_ANON_KEY,Authorization:'Bearer '+CFG.SUPABASE_ANON_KEY};

/* ---------- dati: Supabase (o demo nel browser) ---------- */
const COLS='kind,media_id,title,cover,year,rating,status,updated_at';
const DB={
 v3:true, /* false se il database non ha ancora fase3-catalogo-profili.sql */
 async load(){mine={};
  if(A.DEMO){try{mine=JSON.parse(localStorage.demo_ratings||'{}')}catch(e){}return}
  await A.ready;if(!A.user||!A.sb)return;
  let r=await A.sb.from('media_ratings').select(COLS+',episodes,total_episodes').eq('user_id',A.user.id);
  if(r.error){DB.v3=false;r=await A.sb.from('media_ratings').select(COLS).eq('user_id',A.user.id)}
  if(r.error){DB.err=r.error;return}(r.data||[]).forEach(x=>mine[key(x.kind,x.media_id)]={...x,rating:x.rating==null?null:+x.rating})},
 row(it,rating,status,episodes,total){return{kind:it.type,media_id:it.id,title:it.title,cover:it.cover||null,year:it.year||null,rating:rating==null?null:Math.round(rating*10)/10,status:status||null,episodes:episodes||null,total_episodes:total||null,updated_at:new Date().toISOString()}},
 async upsert(rows){
  if(A.DEMO){rows.forEach(r=>mine[key(r.kind,r.media_id)]=r);localStorage.demo_ratings=JSON.stringify(mine);return null}
  if(!A.user)return{message:'login'};
  const p=A.profile(A.user),full=rows.map(r=>({...r,username:p.name,avatar_url:p.avatar}));
  let {error}=await A.sb.from('media_ratings').upsert(full,{onConflict:'user_id,kind,media_id'});
  if(error&&/episodes|total_episodes|column/i.test(error.message||'')){DB.v3=false;/* database vecchio: salva senza episodi */
   ({error}=await A.sb.from('media_ratings').upsert(full.map(({episodes,total_episodes,...r})=>r),{onConflict:'user_id,kind,media_id'}))}
  if(!error)rows.forEach(r=>mine[key(r.kind,r.media_id)]=r);return error},
 async remove(it){if(A.DEMO){delete mine[key(it.type,it.id)];localStorage.demo_ratings=JSON.stringify(mine);return null}
  const {error}=await A.sb.from('media_ratings').delete().eq('user_id',A.user.id).eq('kind',it.type).eq('media_id',it.id);if(!error)delete mine[key(it.type,it.id)];return error}
};
const errText=e=>/media_ratings|schema|relation/.test(e.message||'')&&!/check|integer/.test(e.message||'')?'Il catalogo si attiva appena il database è pronto.'
 :/check|integer|invalid input/i.test(e.message||'')?'Voti con la virgola, “Droppato” e Serie si attivano appena il database è aggiornato (fase 3).':e.message==='login'?'Accedi con Discord per salvare.':'Non sono riuscito a salvare. Riprova.';

/* ---------- ricerca ---------- */
async function anilistDirect(t){/* riserva se la funzione Supabase non è ancora attiva: AniList non chiede chiavi */
 const query=`query${t?'($q:String)':''}{Page(perPage:20){media(${t?'search:$q,':''}type:ANIME,isAdult:false,sort:${t?'SEARCH_MATCH':'TRENDING_DESC'}){id title{romaji english} seasonYear episodes format coverImage{extraLarge large}}}}`;
 const j=await (await fetch('https://graphql.anilist.co',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({query,variables:t?{q:t}:{}})})).json();
 return (j?.data?.Page?.media||[]).map(m=>({id:'al'+m.id,type:'anime',title:m.title.english||m.title.romaji,year:m.seasonYear||null,cover:m.coverImage?.extraLarge||m.coverImage?.large||null,sub:[m.format,m.episodes?m.episodes+' ep':''].filter(Boolean).join(' · '),eps:m.episodes||null}))}
async function search(k,t){
 const u=A.SEARCH_URL+'?type='+k+'&q='+encodeURIComponent(t);
 try{const r=await fetch(u,{headers:HDR});const j=await r.json();if(!r.ok)throw new Error(j.error||r.status);return j.items||[]}
 catch(e){if(k==='anime')return anilistDirect(t);throw e}}
/* numero totale di episodi (serie TMDB: chiede i dettagli alla funzione; anime: AniList) */
const epsCache={};
async function totalEps(it){const ck=key(it.type,it.id);if(ck in epsCache)return epsCache[ck];let n=null;
 try{if(it.type==='tv'){const r=await fetch(A.SEARCH_URL+'?type=tv&id='+encodeURIComponent(it.id),{headers:HDR});const j=await r.json();n=j.items&&j.items[0]&&j.items[0].eps||null}
  else if(it.type==='anime'){const j=await (await fetch('https://graphql.anilist.co',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({query:'query($id:Int){Media(id:$id){episodes nextAiringEpisode{episode}}}',variables:{id:+String(it.id).replace(/^al/,'')}})})).json();const m=j?.data?.Media;n=m?.episodes||null}}catch(e){}
 return epsCache[ck]=n}

/* ---------- vista ---------- */
const grid=q('#cgrid'),hint=q('#chint');
function card(it){const m=mine[key(it.type,it.id)];const ep=m&&(m.status==='in_corso'||m.status==='droppato')&&m.episodes?` · ep ${m.episodes}${m.total_episodes?'/'+m.total_episodes:''}`:'';
 return`<button class="citem${m?' saved':''}" data-id="${E(it.id)}"><span class="ccover">${it.cover?`<img src="${E(it.cover)}" alt="" loading="lazy">`:`<i>${A.KINDS[it.type].icon}</i>`}${m&&A.hasR(m)?`<b class="rbadge">${A.fmtR(m.rating)}</b>`:''}${m&&m.status?`<span class="sdot s-${m.status}">${E(A.statusLabel(it.type,m.status))}${E(ep)}</span>`:''}</span><span class="ct">${E(it.title)}</span><span class="cm">${[it.year,it.sub].filter(Boolean).map(E).join(' · ')}</span></button>`}
function skeleton(){grid.innerHTML=Array.from({length:10},()=>'<div class="citem sk"><span class="ccover"></span><span class="ct"></span><span class="cm"></span></div>').join('')}
function paint(items){lastItems=items;grid.innerHTML=items.length?items.map(card).join(''):`<div class="cempty"><p>${view==='mia'?'La tua lista è vuota qui. Cerca qualcosa in <b>Scopri</b> e dagli un voto.':'Nessun risultato. Prova con un altro titolo.'}</p></div>`;
 qa('.citem',grid).forEach(b=>b.onclick=()=>openSheet(lastItems.find(x=>x.id===b.dataset.id)))}
function counts(){const n=Object.values(mine).filter(r=>r.kind===kind).length;q('#mycount').textContent=n||''}
async function render(){counts();const my=++seq;q('#imp').hidden=kind!=='anime';
 if(view==='mia'){const items=Object.values(mine).filter(r=>r.kind===kind&&(!stFilter||r.status===stFilter)).sort((a,b)=>(A.hasR(b)?+b.rating:-1)-(A.hasR(a)?+a.rating:-1)||String(b.updated_at).localeCompare(a.updated_at)).map(r=>({id:r.media_id,type:r.kind,title:r.title,year:r.year,cover:r.cover,sub:'',eps:r.total_episodes||null}));
  hint.textContent=A.DEMO||A.user?'':'Accedi con Discord per salvare la tua lista.';paint(items.filter(it=>!term||it.title.toLowerCase().includes(term.toLowerCase())));return}
 hint.textContent=term?`Risultati per “${term}”`:'Di tendenza adesso';skeleton();
 try{const items=await search(kind,term);if(my!==seq)return;paint(items)}
 catch(e){if(my!==seq)return;grid.innerHTML=`<div class="cempty"><p><b>Ricerca ${({game:'giochi',movie:'film',tv:'serie'})[kind]||''} non ancora attiva.</b><br><span class="muted">Si accende appena la funzione di ricerca aggiornata è pubblicata su Supabase.</span></p></div>`}}

/* ---------- foglio a comparsa (riusato da voto e import) ---------- */
const sheet=q('#csheet'),box=q('.csheet-in',sheet);
function openBox(){sheet.hidden=false;requestAnimationFrame(()=>sheet.classList.add('show'))}
function close(){sheet.classList.remove('show');setTimeout(()=>sheet.hidden=true,200)}
sheet.onclick=e=>{if(e.target===sheet)close()};addEventListener('keydown',e=>{if(e.key==='Escape'&&!sheet.hidden)close()});

/* ---------- scheda voto: slider 0–10 con decimali ---------- */
const hue=v=>Math.round(Math.max(0,Math.min(10,v))*12); /* 0 rosso → 10 verde */
function openSheet(it){if(!it)return;const m=mine[key(it.type,it.id)]||{};
 let rating=A.hasR(m)?+m.rating:null,status=m.status||'',episodes=m.episodes||null,total=m.total_episodes||it.eps||null;
 const canSave=A.DEMO||A.user,K=A.KINDS[it.type];
 box.innerHTML=`<button class="cx" aria-label="Chiudi">×</button><div class="cs-top">${it.cover?`<img src="${E(it.cover)}" alt="">`:''}<div><p class="label">${K.t}</p><h3 id="cs-title">${E(it.title)}</h3><p class="muted small">${[it.year,it.sub].filter(Boolean).map(E).join(' · ')}</p></div></div>
 ${canSave?`<div class="vote">
   <div class="vote-head"><p class="label">Il tuo voto</p><button class="linkbtn" id="novote">Senza voto</button></div>
   <div class="vote-big" id="vbig"><b id="vnum">–</b><small>/10</small></div>
   <div class="vote-row"><button class="vstep" data-d="-0.1" aria-label="Meno 0,1">−</button>
    <input type="range" id="vr" min="0" max="10" step="0.1" value="${rating??7}" aria-label="Voto da 0 a 10">
    <button class="vstep" data-d="0.1" aria-label="Più 0,1">+</button></div>
   <p class="vote-hint">Trascina o usa − / + per votare (anche con la virgola)</p><div class="vote-scale" aria-hidden="true">${[0,2,4,6,8,10].map(n=>`<span>${n}</span>`).join('')}</div>
  </div>
  <p class="label">Stato</p><div class="seg st st4" id="st">${ST.map(s=>`<button data-s="${s}">${E(A.statusLabel(it.type,s))}</button>`).join('')}</div>
  <div class="eps" id="eps" hidden></div>
  <div class="cs-act"><button class="btn" id="cs-save">Salva</button>${m.kind?'<button class="btn ghost" id="cs-del">Rimuovi</button>':''}</div><p class="muted small" id="cs-msg"></p>`
 :`<div class="cs-login"><p>Accedi con Discord per votare e salvare questo titolo nel tuo profilo.</p><button class="btn" id="cs-login">Accedi con Discord</button></div>`}`;
 const vr=q('#vr',box);
 const syncVote=()=>{if(!vr)return;const v=rating??+vr.value;vr.value=v;vr.style.setProperty('--p',(v*10)+'%');vr.style.setProperty('--h',hue(v));
  q('.vote',box).classList.toggle('off',rating==null);q('#vbig',box).classList.toggle('off',rating==null);q('#vbig',box).style.setProperty('--h',hue(v));q('#vnum',box).textContent=rating==null?'–':A.fmtR(rating);q('#novote',box).hidden=rating==null};
 const drawEps=async()=>{const el=q('#eps',box);if(!el)return;const show=K.eps&&(status==='in_corso'||status==='droppato');el.hidden=!show;if(!show)return;
  if(!total&&!el.dataset.tried){el.dataset.tried=1;el.innerHTML='<p class="label">Episodi visti</p><p class="muted small">Cerco il numero di episodi…</p>';total=await totalEps(it)}
  if(episodes&&total&&episodes>total)episodes=total;
  el.innerHTML=`<p class="label">Episodi visti${total?` <span class="muted">su ${total}</span>`:''}</p>`+(total
   ?`<select id="epsel" class="epsel"><option value="">Scegli l'episodio…</option>${Array.from({length:total},(_,i)=>`<option value="${i+1}"${episodes===i+1?' selected':''}>Episodio ${i+1}${i+1===total?' (ultimo)':''}</option>`).join('')}</select>`
   :`<div class="epman"><input id="epin" type="number" inputmode="numeric" min="1" max="5000" placeholder="Es. 12" value="${episodes||''}"><span class="muted small">Numero di episodi non disponibile: scrivilo tu.</span></div>`);
  const s=q('#epsel',el),n=q('#epin',el);s&&(s.onchange=()=>episodes=+s.value||null);n&&(n.oninput=()=>{const v=Math.floor(+n.value);episodes=v>0?Math.min(v,5000):null})};
 const syncSt=()=>{qa('#st button',box).forEach(b=>b.classList.toggle('active',b.dataset.s===status));drawEps()};
 if(vr){vr.oninput=()=>{rating=Math.round(+vr.value*10)/10;if(!status)status='visto',syncSt();syncVote()};
  qa('.vstep',box).forEach(b=>b.onclick=()=>{rating=Math.round(Math.max(0,Math.min(10,(rating??+vr.value)+ +b.dataset.d))*10)/10;if(!status)status='visto',syncSt();syncVote()});
  q('#novote',box).onclick=()=>{rating=null;syncVote()};
  qa('#st button',box).forEach(b=>b.onclick=()=>{status=b.dataset.s===status?'':b.dataset.s;syncSt()});syncVote();syncSt()}
 q('.cx',box).onclick=close;q('#cs-login',box)&&(q('#cs-login',box).onclick=()=>A.login());
 q('#cs-save',box)&&(q('#cs-save',box).onclick=async()=>{const msg=q('#cs-msg',box);if(rating==null&&!status){msg.textContent='Scegli un voto o uno stato.';return}msg.textContent='Salvataggio…';
  const keepEps=K.eps&&(status==='in_corso'||status==='droppato');
  const err=await DB.upsert([DB.row(it,rating,status,keepEps?episodes:(status==='visto'&&total?total:null),total)]);if(err){msg.textContent=errText(err);return}close();render()});
 q('#cs-del',box)&&(q('#cs-del',box).onclick=async()=>{const err=await DB.remove(it);if(!err){close();render()}});
 openBox()}

/* ---------- import da AniList ---------- */
const MAP={COMPLETED:'visto',REPEATING:'visto',CURRENT:'in_corso',PAUSED:'in_corso',DROPPED:'droppato',PLANNING:'voglio'};
async function fetchAniList(user){
 const query='query($u:String){MediaListCollection(userName:$u,type:ANIME){user{name avatar{medium}} lists{entries{status score(format:POINT_10_DECIMAL) progress updatedAt media{id title{romaji english} seasonYear episodes format isAdult coverImage{large}}}}}}';
 const r=await fetch('https://graphql.anilist.co',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({query,variables:{u:user}})});const j=await r.json();
 if(j.errors&&j.errors.length){const m=j.errors[0].message||'';throw new Error(/not found|private/i.test(m)?'Utente non trovato o lista privata.':m)}
 const C=j.data&&j.data.MediaListCollection;if(!C)throw new Error('Utente non trovato.');
 const seen=new Set(),rows=[];
 C.lists.forEach(l=>l.entries.forEach(e=>{const m=e.media;if(!m||m.isAdult||seen.has(m.id))return;seen.add(m.id);const st=MAP[e.status];if(!st)return;
  const sc=e.score>0?Math.round(Math.min(10,e.score)*10)/10:null;
  rows.push({kind:'anime',media_id:'al'+m.id,title:m.title.english||m.title.romaji,cover:m.coverImage&&m.coverImage.large||null,year:m.seasonYear||null,rating:sc,status:st,
   episodes:(st==='in_corso'||st==='droppato')&&e.progress?e.progress:(st==='visto'&&m.episodes?m.episodes:null),total_episodes:m.episodes||null,updated_at:new Date((e.updatedAt||Date.now()/1000)*1000).toISOString()})}));
 return{user:C.user,rows}}
function openImport(){const canSave=A.DEMO||A.user;
 box.innerHTML=`<button class="cx" aria-label="Chiudi">×</button><p class="label">Importa</p><h3 id="cs-title" style="font-size:1.35rem">La tua lista AniList</h3>
 <p class="muted small">Scrivi il tuo nome utente AniList: vedi un'anteprima e poi decidi se importare. Voti, stato ed episodi arrivano così come sono (voti convertiti da 0 a 10).</p>
 ${canSave?`<form class="impf" id="impf"><input id="impu" placeholder="Nome utente AniList" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="40" required><button class="btn" type="submit">Anteprima</button></form><div id="impv"></div>`
 :`<div class="cs-login"><p>Accedi con Discord per importare la tua lista.</p><button class="btn" id="cs-login">Accedi con Discord</button></div>`}`;
 q('.cx',box).onclick=close;q('#cs-login',box)&&(q('#cs-login',box).onclick=()=>A.login());openBox();setTimeout(()=>{const i=q('#impu',box);i&&i.focus()},250);
 const f=q('#impf',box);f&&(f.onsubmit=async ev=>{ev.preventDefault();const u=q('#impu',box).value.trim(),out=q('#impv',box);if(!/^[\w-]{2,40}$/.test(u)){out.innerHTML='<p class="muted small">Nome utente non valido.</p>';return}
  out.innerHTML='<p class="muted small">Carico la lista di '+E(u)+'…</p>';
  let data;try{data=await fetchAniList(u)}catch(e){out.innerHTML=`<p class="imperr">${E(e.message||'Errore')}</p>`;return}
  const {rows}=data;if(!rows.length){out.innerHTML='<p class="muted small">La lista è vuota.</p>';return}
  const c=s=>rows.filter(r=>r.status===s).length,voted=rows.filter(r=>r.rating!=null),already=rows.filter(r=>mine[key(r.kind,r.media_id)]).length;
  const prev=rows.slice().sort((a,b)=>(b.rating??-1)-(a.rating??-1)).slice(0,12);
  out.innerHTML=`<div class="impuser">${data.user.avatar?`<img src="${E(data.user.avatar.medium)}" alt="">`:''}<div><b>${E(data.user.name)}</b><small>${rows.length} anime · ${voted.length} con voto${voted.length?' · media '+A.fmtR(voted.reduce((s,r)=>s+r.rating,0)/voted.length):''}</small></div></div>
  <div class="impstats">${ST.map(s=>`<span class="sdot s-${s}">${E(A.statusLabel('anime',s))} <b>${c(s)}</b></span>`).join('')}</div>
  <ul class="implist">${prev.map(r=>`<li>${r.cover?`<img src="${E(r.cover)}" alt="" loading="lazy">`:'<i></i>'}<span><b>${E(r.title)}</b><small>${E(A.statusLabel('anime',r.status))}${r.episodes&&r.status!=='visto'?' · ep '+r.episodes+(r.total_episodes?'/'+r.total_episodes:''):''}</small></span><em>${r.rating!=null?A.fmtR(r.rating):'–'}</em></li>`).join('')}</ul>
  ${rows.length>12?`<p class="muted tiny">…e altri ${rows.length-12}.</p>`:''}
  ${already?`<label class="impover"><input type="checkbox" id="impo"> Sovrascrivi i ${already} anime che hai già nel catalogo</label>`:''}
  <div class="cs-act"><button class="btn" id="impgo">Importa ${rows.length} anime</button><button class="btn ghost" id="impno">Annulla</button></div><p class="muted small" id="impmsg"></p>`;
  q('#impno',out).onclick=close;
  q('#impgo',out).onclick=async()=>{const over=q('#impo',out)&&q('#impo',out).checked;const todo=rows.filter(r=>over||!mine[key(r.kind,r.media_id)]);const msg=q('#impmsg',out);
   if(!todo.length){msg.textContent='Niente da importare: hai già tutti questi anime.';return}
   q('#impgo',out).disabled=true;
   for(let i=0;i<todo.length;i+=200){msg.textContent=`Importo… ${Math.min(i+200,todo.length)}/${todo.length}`;const err=await DB.upsert(todo.slice(i,i+200));if(err){msg.textContent=errText(err);q('#impgo',out).disabled=false;return}}
   msg.textContent=`Fatto! ${todo.length} anime importati.`;setTimeout(()=>{close();view='mia';qa('[data-view]').forEach(x=>x.classList.toggle('active',x.dataset.view==='mia'));q('#cstat').hidden=false;render()},700)}})}

/* ---------- controlli ---------- */
qa('#ctabs button').forEach(b=>b.onclick=()=>{kind=b.dataset.kind;qa('#ctabs button').forEach(x=>x.classList.toggle('active',x===b));q('#q').placeholder=PH[kind];render()});
qa('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;qa('[data-view]').forEach(x=>x.classList.toggle('active',x===b));q('#cstat').hidden=view!=='mia';render()});
qa('[data-st]').forEach(b=>b.onclick=()=>{stFilter=b.dataset.st;qa('[data-st]').forEach(x=>x.classList.toggle('active',x===b));render()});
q('#imp').onclick=openImport;
let t;q('#q').addEventListener('input',e=>{clearTimeout(t);t=setTimeout(()=>{term=e.target.value.trim();render()},350)});
const P=new URLSearchParams(location.search);if(P.get('tipo')&&A.KINDS[P.get('tipo')])kind=P.get('tipo');if(P.get('q')){term=P.get('q');q('#q').value=term}
qa('#ctabs button').forEach(x=>x.classList.toggle('active',x.dataset.kind===kind));q('#q').placeholder=PH[kind];
if(A.DEMO){q('#torank').href='classifica.html?demo=1';q('main').insertAdjacentHTML('afterbegin','<div class="demo-ribbon">DEMO · anteprima con dati finti salvati solo in questo browser</div>');
 if(!localStorage.demo_ratings)localStorage.demo_ratings=JSON.stringify({'anime:al154587':{kind:'anime',media_id:'al154587',title:"Frieren: Beyond Journey's End",cover:'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-qQTzQnEJJ3oB.jpg',year:2023,rating:9.8,status:'visto',total_episodes:28,episodes:28,updated_at:'2026-11-20'},
  'anime:al151807':{kind:'anime',media_id:'al151807',title:'Solo Leveling',cover:'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-it355ZgzquUd.png',year:2024,rating:6.5,status:'droppato',episodes:4,total_episodes:12,updated_at:'2026-11-18'}})}
DB.load().then(render);document.addEventListener('staskys-auth',()=>DB.load().then(render));
if(P.get('importa')!=null)openImport();
})();
