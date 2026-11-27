/* Staskys — UPDATE 3: copertine personalizzate (Personalizza → Copertine).
   • Consigliate: copertine ufficiali alternative (AniList per anime/manga, Open Library per i libri,
     TMDB/RAWG per film, serie e giochi tramite super-endpoint v3: finché non è pubblicata "In arrivo tra poco ⏳").
   • Dal PC: immagine ridimensionata nel browser (max 600×900, webp) e caricata su Supabase Storage "covers"
     nella TUA cartella; il bucket accetta solo immagini fino a 2 MB.
   • La vedono tutti sul tuo profilo, Top 10 e passaporto. Il catalogo resta con l'originale.
   • Lo staff (tabella site_staff) può rimuovere una copertina inappropriata. */
(function(){
const A=window.STASKYS,S=window.STASKYS_SOCIAL,E=A.E,q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const CFG=window.GIOCHI_CONFIG||{},HDR=A.LOCAL?{}:{apikey:CFG.SUPABASE_ANON_KEY,Authorization:'Bearer '+CFG.SUPABASE_ANON_KEY};
const PUB='/storage/v1/object/public/covers/';
const AL=(query,variables)=>fetch('https://graphql.anilist.co',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({query,variables})}).then(r=>r.json());
const altCache={};
async function alternatives(r){const k=r.kind+':'+r.media_id;if(altCache[k])return altCache[k];let L=[];
 if(r.kind==='anime'||r.kind==='manga'){const id=+String(r.media_id).replace(/^al/,'');if(!id)return[];
  const j=await AL('query($id:Int){Media(id:$id){type coverImage{extraLarge} relations{edges{relationType node{type isAdult coverImage{extraLarge}}}}}}',{id});const m=j&&j.data&&j.data.Media;
  if(m){L.push(m.coverImage&&m.coverImage.extraLarge);(m.relations&&m.relations.edges||[]).forEach(e=>{const n=e.node;if(n&&!n.isAdult&&n.type===m.type&&/SEQUEL|PREQUEL|PARENT|SIDE_STORY|ALTERNATIVE|SPIN_OFF|SUMMARY/.test(e.relationType))L.push(n.coverImage&&n.coverImage.extraLarge)})}}
 else if(r.kind==='book'){const w=String(r.media_id).match(/^ol(OL\d+W)$/);if(w){const j=await (await fetch(`https://openlibrary.org/works/${w[1]}/editions.json?limit=60`)).json();
  (j.entries||[]).forEach(e=>(e.covers||[]).slice(0,1).forEach(c=>c>0&&L.push(`https://covers.openlibrary.org/b/id/${c}-L.jpg`)))}}
 else{const c=await A.caps();if(!(c.v>=3))return'soon';
  const j=await (await fetch(A.SEARCH_URL+'?type=images&id='+encodeURIComponent(r.media_id),{headers:HDR})).json();L=j.items||[]}
 return altCache[k]=[...new Set(L.filter(u=>S.COVER_OK.test(u||'')))].slice(0,30)}
/* PATCH 4.1 — editor di ritaglio (come la foto profilo di Discord): sposti, ingrandisci e ritagli
   dentro una cornice 2:3 (la forma delle copertine). Esce un webp 600×900 al massimo, come prima.
   Le GIF diventano ferme già da prima (canvas → webp): qui si ritaglia il primo fotogramma e lo diciamo. */
const OUT_W=600,OUT_H=900,RATIO=OUT_W/OUT_H,ZMAX=5;
function loadImg(src){return new Promise((ok,ko)=>{const img=new Image();img.decoding='async';img.onload=()=>ok(img);img.onerror=()=>ko(new Error('Questo file non è un\'immagine valida.'));img.src=src})}
function crop(box,src,{gif=false,title='Sistema la copertina'}={}){return new Promise(async(done)=>{
 let img;try{img=await loadImg(src)}catch(e){done({error:e});return}
 const W=img.naturalWidth,H=img.naturalHeight;if(!W||!H){done({error:new Error('Questo file non è un\'immagine valida.')});return}
 box.innerHTML=`<div class="cvcrop" role="group" aria-label="${E(title)}"><p class="label">Ritaglia</p><h3 class="cz-h" style="font-size:1.25rem">${E(title)}</h3>
  <p class="muted small">Trascina per spostare l'immagine, usa la rotellina o due dita per ingrandire. Quello che è dentro la cornice diventa la copertina.</p>
  <div class="cvc-stage" tabindex="0" aria-label="Area di ritaglio: frecce per spostare, + e − per lo zoom"><img class="cvc-img" alt="" draggable="false"><div class="cvc-frame" aria-hidden="true"><i></i><i></i></div></div>
  <div class="cvc-zoom"><span aria-hidden="true">−</span><input type="range" min="1" max="${ZMAX}" step="0.01" value="1" aria-label="Zoom"><span aria-hidden="true">+</span></div>
  ${gif?'<p class="muted tiny cvc-note">GIF: le copertine sono immagini ferme, quindi uso il primo fotogramma.</p>':''}
  <div class="cvc-btns"><button class="btn ghost sm" data-a="reset">Ripristina</button><span></span><button class="btn ghost sm" data-a="cancel">Annulla</button><button class="btn sm cvc-ok" data-a="ok">Applica</button></div></div>`;
 const st=q('.cvc-stage',box),im=q('.cvc-img',box),fr=q('.cvc-frame',box),zr=q('.cvc-zoom input',box);im.src=src;
 let fw=0,fh=0,base=1,z=1,ox=0,oy=0;
 const measure=()=>{const R=st.getBoundingClientRect();const pad=Math.min(24,R.width*.06);let h=R.height-pad*2,w=h*RATIO;if(w>R.width-pad*2){w=R.width-pad*2;h=w/RATIO}
  const k=fw?w/fw:1;fw=w;fh=h;ox*=k;oy*=k;fr.style.width=w+'px';fr.style.height=h+'px';base=Math.max(fw/W,fh/H);apply()};
 const clamp=()=>{const s=base*z,mx=Math.max(0,(W*s-fw)/2),my=Math.max(0,(H*s-fh)/2);ox=Math.min(mx,Math.max(-mx,ox));oy=Math.min(my,Math.max(-my,oy))};
 const apply=()=>{clamp();const s=base*z;im.style.width=W+'px';im.style.height=H+'px';im.style.transform=`translate(-50%,-50%) translate(${ox}px,${oy}px) scale(${s})`;zr.value=z};
 /* zoom tenendo fermo il punto (px,py) relativo al centro della cornice */
 const zoomTo=(nz,px=0,py=0)=>{nz=Math.min(ZMAX,Math.max(1,nz));const k=nz/z;ox=px-(px-ox)*k;oy=py-(py-oy)*k;z=nz;apply()};
 const rel=e=>{const R=st.getBoundingClientRect();return[e.clientX-R.left-R.width/2,e.clientY-R.top-R.height/2]};
 const P=new Map();let last=null;
 st.addEventListener('pointerdown',e=>{st.setPointerCapture&&st.setPointerCapture(e.pointerId);P.set(e.pointerId,[e.clientX,e.clientY]);last=null;st.classList.add('drag');e.preventDefault()});
 st.addEventListener('pointermove',e=>{if(!P.has(e.pointerId))return;const prev=P.get(e.pointerId);P.set(e.pointerId,[e.clientX,e.clientY]);
  if(P.size===1){ox+=e.clientX-prev[0];oy+=e.clientY-prev[1];apply()}
  else{const [a,b]=[...P.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]),R=st.getBoundingClientRect(),m=[(a[0]+b[0])/2-R.left-R.width/2,(a[1]+b[1])/2-R.top-R.height/2];
   if(last){ox+=m[0]-last.m[0];oy+=m[1]-last.m[1];zoomTo(z*d/last.d,m[0],m[1])}last={d,m}}});
 const up=e=>{P.delete(e.pointerId);last=null;if(!P.size)st.classList.remove('drag')};st.addEventListener('pointerup',up);st.addEventListener('pointercancel',up);
 st.addEventListener('wheel',e=>{e.preventDefault();const [x,y]=rel(e);zoomTo(z*Math.exp(-e.deltaY*(e.deltaMode?0.05:0.0015)),x,y)},{passive:false});
 st.addEventListener('keydown',e=>{const k=e.key,n=e.shiftKey?40:10;
  if(k==='ArrowLeft')ox+=n;else if(k==='ArrowRight')ox-=n;else if(k==='ArrowUp')oy+=n;else if(k==='ArrowDown')oy-=n;else if(k==='+'||k==='=')return zoomTo(z*1.1),e.preventDefault();else if(k==='-'||k==='_')return zoomTo(z/1.1),e.preventDefault();else return;e.preventDefault();apply()});
 zr.oninput=()=>zoomTo(+zr.value);
 const ro=window.ResizeObserver?new ResizeObserver(measure):null;ro?ro.observe(st):addEventListener('resize',measure);
 const end=v=>{qa('.cvc-btns button',box).forEach(b=>b.disabled=true);zr.disabled=true;ro?ro.disconnect():removeEventListener('resize',measure);done(v)};
 q('[data-a=reset]',box).onclick=()=>{z=1;ox=oy=0;apply()};q('[data-a=cancel]',box).onclick=()=>end(null);
 q('[data-a=ok]',box).onclick=()=>{const s=base*z,sw=fw/s,sh=fh/s,sx=W/2-(fw/2+ox)/s,sy=H/2-(fh/2+oy)/s;
  const ow=Math.max(1,Math.round(Math.min(OUT_W,sw))),oh=Math.round(ow/RATIO),c=document.createElement('canvas');c.width=ow;c.height=oh;
  const g=c.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(img,sx,sy,sw,sh,0,0,ow,oh);
  try{c.toBlob(b=>end(b?{blob:b,rect:{sx,sy,sw,sh},w:ow,h:oh}:{error:new Error('Immagine non valida')}),'image/webp',.86)}catch(e){end({error:new Error('Non riesco a ritagliare questa immagine.')})}};
 requestAnimationFrame(()=>{measure();st.focus({preventScroll:true})})})}
/* copertina già online → blob (no-store: l'<img> in cache non ha gli header CORS e "sporcherebbe" il canvas) */
async function getBlob(u){const go=async x=>{const r=await fetch(x,{mode:'cors',cache:'no-store',credentials:'omit'});if(!r.ok)throw 0;const b=await r.blob();if(!/^image\//.test(b.type))throw 0;return b};
 try{return await go(u)}catch(e){return go(u+(u.includes('?')?'&':'?')+'crop=1')}}
function checkFile(file){if(!/^image\/(jpeg|png|webp|gif)$/.test(file.type))throw new Error('Puoi caricare solo immagini JPG, PNG, WEBP o GIF.');
 if(file.size>8e6)throw new Error('Immagine troppo grande (massimo 8 MB prima del ridimensionamento).')}
function canUpload(){if(A.DEMO)throw new Error('Nella demo il caricamento dal PC non è disponibile.');if(!A.user||!A.sb)throw new Error('Accedi con Discord per caricare.')}
const pathOf=url=>{const i=String(url||'').indexOf(PUB);return i>=0?decodeURIComponent(url.slice(i+PUB.length).split('?')[0]):''};
async function upload(r,blob){canUpload();
 if(blob.size>2e6)throw new Error('Immagine troppo pesante anche dopo il ridimensionamento (max 2 MB).');
 const path=`${A.user.id}/${r.kind}-${String(r.media_id).replace(/[^\w-]/g,'')}-${Date.now()}.webp`;
 const {error}=await A.sb.storage.from('covers').upload(path,blob,{contentType:'image/webp',upsert:false,cacheControl:'31536000'});
 if(error)throw new Error(/bucket/i.test(error.message||'')?A.SOON:'Caricamento non riuscito: '+(error.message||'riprova'));
 return A.sb.storage.from('covers').getPublicUrl(path).data.publicUrl}
async function removeOld(url){const p=pathOf(url);if(p&&A.sb&&A.user&&p.startsWith(A.user.id+'/'))try{await A.sb.storage.from('covers').remove([p])}catch(e){}}
/* lo staff toglie una copertina dal profilo di un membro */
async function staffRemove(u,key){const url=u.covers[key],p=pathOf(url);
 if(p)try{await A.sb.storage.from('covers').remove([p])}catch(e){}
 const {error}=await A.sb.rpc('staff_clear_cover',{p_discord:u.did,p_key:key});S.reset();return error}

function open(u,kind0,changed){
 const kinds=Object.keys(A.KINDS).filter(k=>u.ratings.some(r=>r.kind===k));if(!kinds.length){alert('Vota prima qualche titolo nel catalogo: poi potrai cambiarne la copertina.');return}
 let kind=kinds.includes(kind0)?kind0:kinds[0],sel=null,term='';
 let sh=q('#cvsheet');if(!sh){document.body.insertAdjacentHTML('beforeend','<div class="csheet cv-sheet" id="cvsheet" hidden><div class="csheet-in" role="dialog" aria-modal="true" aria-label="Copertine"></div></div>');sh=q('#cvsheet')}
 const box=q('.csheet-in',sh),close=()=>{sh.classList.remove('show');setTimeout(()=>sh.hidden=true,200);removeEventListener('keydown',esc)},esc=e=>{if(e.key==='Escape')close()};
 addEventListener('keydown',esc);sh.onclick=e=>{if(e.target===sh)close()};
 const orig=r=>r.ocover||r.cover;
 const list=()=>{const top=S.top10(u.ratings,kind).list.map(r=>r.media_id);const L=u.ratings.filter(r=>r.kind===kind&&(!term||r.title.toLowerCase().includes(term)));
  return L.sort((a,b)=>((top.indexOf(a.media_id)+1)||99)-((top.indexOf(b.media_id)+1)||99)||(A.hasR(b)?+b.rating:-1)-(A.hasR(a)?+a.rating:-1)).slice(0,80)};
 const drawList=()=>{box.innerHTML=`<button class="cx" aria-label="Chiudi">×</button><p class="label">Personalizza</p><h3 class="cz-h">Copertine</h3>
  <p class="muted small">Tocca un titolo per cambiarne la copertina. La vedranno tutti sul tuo profilo, nella Top 10 e nel passaporto; nel catalogo resta quella originale.</p>
  <div class="seg mini cvk">${kinds.map(k=>`<button data-k="${k}" class="${k===kind?'active':''}">${A.KINDS[k].icon} ${A.KINDS[k].t}</button>`).join('')}</div>
  <input class="cvq" id="cvq" type="search" placeholder="Cerca tra i tuoi titoli…" value="${E(term)}">
  <div class="cvgrid">${list().map(r=>`<button class="cvi${r.custom?' on':''}" data-id="${E(r.media_id)}">${r.cover?`<img src="${E(r.cover)}" alt="" loading="lazy">`:`<i>${A.KINDS[r.kind].icon}</i>`}${r.custom?'<em>cambiata</em>':''}<span>${E(r.title)}</span></button>`).join('')||'<p class="muted small">Nessun titolo.</p>'}</div>`;
  q('.cx',box).onclick=close;qa('.cvk button',box).forEach(b=>b.onclick=()=>{kind=b.dataset.k;drawList()});
  const qi=q('#cvq',box);qi.oninput=()=>{term=qi.value.trim().toLowerCase();const p=qi.selectionStart;drawList();const n=q('#cvq',box);n.focus();n.setSelectionRange(p,p)};
  qa('.cvi',box).forEach(b=>b.onclick=()=>{sel=u.ratings.find(r=>r.kind===kind&&r.media_id===b.dataset.id);drawOne()})};
 const save=async(url,msg)=>{const k=sel.kind+':'+sel.media_id,map={...u.covers},old=map[k];if(url&&url!==orig(sel))map[k]=url;else delete map[k];
  msg.textContent='Salvataggio…';const err=await S.saveCovers(map);if(err){msg.textContent=/covers|column|schema/.test(err.message||'')?A.SOON:err.message==='login'?'Accedi con Discord per salvare.':'Non sono riuscito a salvare. Riprova.';return false}
  if(old&&old!==map[k])removeOld(old);u.covers=S.cleanCovers(map);changed();sel=u.ratings.find(r=>r.kind===sel.kind&&r.media_id===sel.media_id);msg.textContent='Salvata ✓';return true};
 const drawOne=async(note='')=>{const r=sel,cur=r.cover;
  box.innerHTML=`<button class="cx" aria-label="Chiudi">×</button><button class="linkbtn impback" id="cvback">← Tutti i titoli</button><p class="label">${E(A.KINDS[r.kind].t)}</p><h3 class="cz-h" style="font-size:1.25rem">${E(r.title)}</h3>
  <div class="cvone"><div class="cvcur">${cur?`<img src="${E(cur)}" alt="Copertina attuale">`:''}<small>Attuale${r.custom?' (personalizzata)':''}</small>${cur?'<button class="btn ghost sm cvc-fix" id="cvfix" title="Sposta e ritaglia la copertina attuale">✂️ Ritaglia</button>':''}</div>
   <div class="cvopts"><p class="label">Consigliate</p><div class="cvalts" id="cvalts"><p class="muted small">Cerco le copertine ufficiali…</p></div>
   <p class="label">Dal tuo PC</p><label class="impfile"><input type="file" id="cvfile" accept="image/jpeg,image/png,image/webp,image/gif"><span>📁 Carica un'immagine</span><small>JPG, PNG, WEBP o GIF · poi la sposti e la ritagli tu</small></label>
   <p class="muted tiny">Le immagini caricate le vedono tutti: niente contenuti offensivi o inappropriati, lo staff può rimuoverle.</p>
   ${r.custom?'<button class="btn ghost sm" id="cvreset">Torna all\'originale</button>':''}<p class="muted small" id="cvmsg" aria-live="polite">${E(note)}</p></div></div>`;
  q('.cx',box).onclick=close;q('#cvback',box).onclick=drawList;const msg=q('#cvmsg',box);
  const rs=q('#cvreset',box);rs&&(rs.onclick=async()=>{if(await save(null,msg))drawOne('Tornata all\'originale ✓')});
  /* PATCH 4.1: prima di caricare si apre l'editor di ritaglio */
  const cropAndUpload=async(src,opts,cleanup)=>{const res=await crop(box,src,opts);cleanup&&cleanup();
   if(!res){drawOne();return}if(res.error){drawOne(res.error.message);return}
   box.insertAdjacentHTML('beforeend','<p class="muted small cvc-busy" aria-live="polite">Carico l\'immagine…</p>');const busy=q('.cvc-busy',box);
   try{const url=await upload(r,res.blob);if(await save(url,busy))drawOne('Caricata e salvata ✓ La vedono tutti sul tuo profilo.')}catch(err){drawOne(err.message)}};
  q('#cvfile',box).onchange=e=>{const f=e.target.files[0];if(!f)return;try{checkFile(f);canUpload()}catch(err){msg.textContent=err.message;e.target.value='';return}
   const url=URL.createObjectURL(f);cropAndUpload(url,{gif:f.type==='image/gif',title:r.title},()=>URL.revokeObjectURL(url))};
  const fx=q('#cvfix',box);fx&&(fx.onclick=async()=>{try{canUpload()}catch(err){msg.textContent=err.message;return}msg.textContent='Apro l\'immagine…';
   let url;try{const b=await getBlob(cur);url=URL.createObjectURL(b)}catch(e){msg.textContent='Non riesco ad aprire questa copertina per ritagliarla: prova a caricarla dal PC.';return}
   if(sel!==r){URL.revokeObjectURL(url);return}cropAndUpload(url,{gif:/gif/.test(cur),title:r.title},()=>URL.revokeObjectURL(url))});
  let alts=[];try{alts=await alternatives(r)}catch(e){alts=[]}if(sel!==r)return;const el=q('#cvalts',box);if(!el)return;
  if(alts==='soon'){el.innerHTML=`<p class="muted small cvsoon">${E(A.SOON)} Le copertine consigliate per ${E(A.KINDS[r.kind].t.toLowerCase())} arrivano a breve: intanto puoi caricarne una dal PC.</p>`;return}
  const all=[...new Set([orig(r),...alts].filter(Boolean))];
  el.innerHTML=all.length>1||alts.length?all.map((x,i)=>`<button class="cvalt${x===cur?' on':''}" data-u="${E(x)}"><img src="${E(x)}" alt="" loading="lazy">${i===0?'<small>Originale</small>':''}</button>`).join(''):'<p class="muted small">Nessuna copertina alternativa ufficiale per questo titolo: puoi caricarne una dal PC.</p>';
  qa('.cvalt',el).forEach(b=>b.onclick=async()=>{if(await save(b.dataset.u,msg))drawOne('Salvata ✓ La vedono tutti sul tuo profilo.')})};
 drawList();sh.hidden=false;requestAnimationFrame(()=>sh.classList.add('show'))}
window.STASKYS_COVERS={open,staffRemove,alternatives,crop};
})();
