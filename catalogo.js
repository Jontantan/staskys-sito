/* Staskys — Catalogo: ricerca Anime (AniList), Giochi (RAWG), Film (TMDB) + voti 1–10 e stato */
(function(){
const A=window.STASKYS,E=A.E,q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
let kind='anime',view='scopri',stFilter='',term='',mine={},seq=0,lastItems=[];
const PH={anime:'Cerca un anime…',game:'Cerca un gioco…',movie:'Cerca un film…'};
const key=(k,id)=>k+':'+id;

/* ---------- dati: Supabase (o demo nel browser) ---------- */
const DB={
 async load(){mine={};
  if(A.DEMO){try{mine=JSON.parse(localStorage.demo_ratings||'{}')}catch(e){}return}
  await A.ready;if(!A.user||!A.sb)return;
  const {data,error}=await A.sb.from('media_ratings').select('kind,media_id,title,cover,year,rating,status,updated_at').eq('user_id',A.user.id);
  if(error){DB.err=error;return}(data||[]).forEach(r=>mine[key(r.kind,r.media_id)]=r)},
 async save(it,rating,status){const row={kind:it.type,media_id:it.id,title:it.title,cover:it.cover,year:it.year,rating:rating||null,status:status||null,updated_at:new Date().toISOString()};
  if(A.DEMO){mine[key(row.kind,row.media_id)]=row;localStorage.demo_ratings=JSON.stringify(mine);return null}
  const p=A.profile(A.user);
  const {error}=await A.sb.from('media_ratings').upsert({...row,username:p.name,avatar_url:p.avatar},{onConflict:'user_id,kind,media_id'});
  if(!error)mine[key(row.kind,row.media_id)]=row;return error},
 async remove(it){if(A.DEMO){delete mine[key(it.type,it.id)];localStorage.demo_ratings=JSON.stringify(mine);return null}
  const {error}=await A.sb.from('media_ratings').delete().eq('user_id',A.user.id).eq('kind',it.type).eq('media_id',it.id);if(!error)delete mine[key(it.type,it.id)];return error}
};

/* ---------- ricerca ---------- */
async function anilistDirect(t){/* riserva se la funzione Supabase non è ancora attiva: AniList non chiede chiavi */
 const query=`query${t?'($q:String)':''}{Page(perPage:20){media(${t?'search:$q,':''}type:ANIME,isAdult:false,sort:${t?'SEARCH_MATCH':'TRENDING_DESC'}){id title{romaji english} seasonYear episodes format coverImage{extraLarge large}}}}`;
 const j=await (await fetch('https://graphql.anilist.co',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({query,variables:t?{q:t}:{}})})).json();
 return (j?.data?.Page?.media||[]).map(m=>({id:'al'+m.id,type:'anime',title:m.title.english||m.title.romaji,year:m.seasonYear||null,cover:m.coverImage?.extraLarge||m.coverImage?.large||null,sub:[m.format,m.episodes?m.episodes+' ep':''].filter(Boolean).join(' · ')}))}
async function search(k,t){
 const u=A.SEARCH_URL+'?type='+k+'&q='+encodeURIComponent(t);const h=A.LOCAL?{}:{apikey:(window.GIOCHI_CONFIG||{}).SUPABASE_ANON_KEY,Authorization:'Bearer '+(window.GIOCHI_CONFIG||{}).SUPABASE_ANON_KEY};
 try{const r=await fetch(u,{headers:h});const j=await r.json();if(!r.ok)throw new Error(j.error||r.status);return j.items||[]}
 catch(e){if(k==='anime')return anilistDirect(t);throw e}}

/* ---------- vista ---------- */
const grid=q('#cgrid'),hint=q('#chint');
function card(it){const m=mine[key(it.type,it.id)];
 return`<button class="citem${m?' saved':''}" data-id="${E(it.id)}"><span class="ccover">${it.cover?`<img src="${E(it.cover)}" alt="" loading="lazy">`:`<i>${A.KINDS[it.type].icon}</i>`}${m&&m.rating?`<b class="rbadge">${m.rating}</b>`:''}${m&&m.status?`<span class="sdot s-${m.status}">${E(A.statusLabel(it.type,m.status))}</span>`:''}</span><span class="ct">${E(it.title)}</span><span class="cm">${[it.year,it.sub].filter(Boolean).map(E).join(' · ')}</span></button>`}
function skeleton(){grid.innerHTML=Array.from({length:10},()=>'<div class="citem sk"><span class="ccover"></span><span class="ct"></span><span class="cm"></span></div>').join('')}
function paint(items){lastItems=items;grid.innerHTML=items.length?items.map(card).join(''):`<div class="cempty"><p>${view==='mia'?'La tua lista è vuota qui. Cerca qualcosa in <b>Scopri</b> e dagli un voto.':'Nessun risultato. Prova con un altro titolo.'}</p></div>`;
 qa('.citem',grid).forEach(b=>b.onclick=()=>openSheet(lastItems.find(x=>x.id===b.dataset.id)))}
function counts(){const n=Object.values(mine).filter(r=>r.kind===kind).length;q('#mycount').textContent=n||''}
async function render(){counts();const my=++seq;
 if(view==='mia'){const items=Object.values(mine).filter(r=>r.kind===kind&&(!stFilter||r.status===stFilter)).sort((a,b)=>(b.rating||0)-(a.rating||0)||String(b.updated_at).localeCompare(a.updated_at)).map(r=>({id:r.media_id,type:r.kind,title:r.title,year:r.year,cover:r.cover,sub:''}));
  hint.textContent=A.DEMO||A.user?'':'Accedi con Discord per salvare la tua lista.';paint(items.filter(it=>!term||it.title.toLowerCase().includes(term.toLowerCase())));return}
 hint.textContent=term?`Risultati per “${term}”`:'Di tendenza adesso';skeleton();
 try{const items=await search(kind,term);if(my!==seq)return;paint(items)}
 catch(e){if(my!==seq)return;grid.innerHTML=`<div class="cempty"><p><b>Ricerca ${kind==='game'?'giochi':'film'} non ancora attiva.</b><br><span class="muted">Si accende appena la funzione di ricerca è pubblicata su Supabase.</span></p></div>`}}

/* ---------- scheda voto ---------- */
const sheet=q('#csheet'),box=q('.csheet-in',sheet);
function openSheet(it){if(!it)return;const m=mine[key(it.type,it.id)]||{};let rating=m.rating||0,status=m.status||'';
 const canSave=A.DEMO||A.user,st=['visto','in_corso','voglio'];
 box.innerHTML=`<button class="cx" aria-label="Chiudi">×</button><div class="cs-top">${it.cover?`<img src="${E(it.cover)}" alt="">`:''}<div><p class="label">${A.KINDS[it.type].t}</p><h3 id="cs-title">${E(it.title)}</h3><p class="muted small">${[it.year,it.sub].filter(Boolean).map(E).join(' · ')}</p></div></div>
 ${canSave?`<p class="label">Il tuo voto</p><div class="rate" id="rate">${Array.from({length:10},(_,i)=>`<button data-v="${i+1}">${i+1}</button>`).join('')}</div>
 <p class="label">Stato</p><div class="seg st" id="st">${st.map(s=>`<button data-s="${s}">${E(A.statusLabel(it.type,s))}</button>`).join('')}</div>
 <div class="cs-act"><button class="btn" id="cs-save">Salva</button>${m.kind?'<button class="btn ghost" id="cs-del">Rimuovi</button>':''}</div><p class="muted small" id="cs-msg"></p>`
 :`<div class="cs-login"><p>Accedi con Discord per votare e salvare questo titolo nel tuo profilo.</p><button class="btn" id="cs-login">Accedi con Discord</button></div>`}`;
 const sync=()=>{qa('#rate button',box).forEach(b=>b.classList.toggle('on',+b.dataset.v<=rating));qa('#st button',box).forEach(b=>b.classList.toggle('active',b.dataset.s===status))};
 qa('#rate button',box).forEach(b=>b.onclick=()=>{rating=+b.dataset.v===rating?0:+b.dataset.v;if(!status)status='visto';sync()});
 qa('#st button',box).forEach(b=>b.onclick=()=>{status=b.dataset.s===status?'':b.dataset.s;sync()});sync();
 q('.cx',box).onclick=close;q('#cs-login',box)&&(q('#cs-login',box).onclick=()=>A.login());
 q('#cs-save',box)&&(q('#cs-save',box).onclick=async()=>{if(!rating&&!status){q('#cs-msg',box).textContent='Scegli un voto o uno stato.';return}q('#cs-msg',box).textContent='Salvataggio…';
  const err=await DB.save(it,rating,status);if(err){q('#cs-msg',box).textContent=/media_ratings|schema|relation/.test(err.message||'')?'Il catalogo si attiva appena il database è pronto.':'Non sono riuscito a salvare. Riprova.';return}close();render()});
 q('#cs-del',box)&&(q('#cs-del',box).onclick=async()=>{const err=await DB.remove(it);if(!err){close();render()}});
 sheet.hidden=false;requestAnimationFrame(()=>sheet.classList.add('show'))}
function close(){sheet.classList.remove('show');setTimeout(()=>sheet.hidden=true,200)}
sheet.onclick=e=>{if(e.target===sheet)close()};addEventListener('keydown',e=>{if(e.key==='Escape'&&!sheet.hidden)close()});

/* ---------- controlli ---------- */
qa('#ctabs button').forEach(b=>b.onclick=()=>{kind=b.dataset.kind;qa('#ctabs button').forEach(x=>x.classList.toggle('active',x===b));q('#q').placeholder=PH[kind];render()});
qa('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;qa('[data-view]').forEach(x=>x.classList.toggle('active',x===b));q('#cstat').hidden=view!=='mia';render()});
qa('[data-st]').forEach(b=>b.onclick=()=>{stFilter=b.dataset.st;qa('[data-st]').forEach(x=>x.classList.toggle('active',x===b));render()});
let t;q('#q').addEventListener('input',e=>{clearTimeout(t);t=setTimeout(()=>{term=e.target.value.trim();render()},350)});
const P=new URLSearchParams(location.search);if(P.get('tipo')&&A.KINDS[P.get('tipo')])kind=P.get('tipo');if(P.get('q')){term=P.get('q');q('#q').value=term}
qa('#ctabs button').forEach(x=>x.classList.toggle('active',x.dataset.kind===kind));q('#q').placeholder=PH[kind];
if(A.DEMO){q('main').insertAdjacentHTML('afterbegin','<div class="demo-ribbon">DEMO · anteprima con dati finti salvati solo in questo browser</div>');
 if(!localStorage.demo_ratings)localStorage.demo_ratings=JSON.stringify({'anime:al154587':{kind:'anime',media_id:'al154587',title:"Frieren: Beyond Journey's End",cover:'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-qQTzQnEJJ3oB.jpg',year:2023,rating:10,status:'visto',updated_at:'2026-11-20'}})}
DB.load().then(render);document.addEventListener('staskys-auth',()=>DB.load().then(render));
})();
