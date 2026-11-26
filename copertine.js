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
/* immagine dal PC → webp ridimensionato */
function shrink(file){return new Promise((ok,ko)=>{const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{const s=Math.min(1,600/img.width,900/img.height),c=document.createElement('canvas');
  c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);
  c.toBlob(b=>b?ok(b):ko(new Error('Immagine non valida')),'image/webp',.86)};img.onerror=()=>{URL.revokeObjectURL(url);ko(new Error('Questo file non è un\'immagine valida.'))};img.src=url})}
const pathOf=url=>{const i=String(url||'').indexOf(PUB);return i>=0?decodeURIComponent(url.slice(i+PUB.length).split('?')[0]):''};
async function upload(r,file){if(!/^image\/(jpeg|png|webp|gif)$/.test(file.type))throw new Error('Puoi caricare solo immagini JPG, PNG, WEBP o GIF.');
 if(file.size>8e6)throw new Error('Immagine troppo grande (massimo 8 MB prima del ridimensionamento).');
 if(A.DEMO)throw new Error('Nella demo il caricamento dal PC non è disponibile.');if(!A.user||!A.sb)throw new Error('Accedi con Discord per caricare.');
 const blob=await shrink(file);if(blob.size>2e6)throw new Error('Immagine troppo pesante anche dopo il ridimensionamento (max 2 MB).');
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
  <div class="cvone"><div class="cvcur">${cur?`<img src="${E(cur)}" alt="Copertina attuale">`:''}<small>Attuale${r.custom?' (personalizzata)':''}</small></div>
   <div class="cvopts"><p class="label">Consigliate</p><div class="cvalts" id="cvalts"><p class="muted small">Cerco le copertine ufficiali…</p></div>
   <p class="label">Dal tuo PC</p><label class="impfile"><input type="file" id="cvfile" accept="image/jpeg,image/png,image/webp,image/gif"><span>📁 Carica un'immagine</span><small>JPG, PNG, WEBP o GIF · la ridimensiono io</small></label>
   <p class="muted tiny">Le immagini caricate le vedono tutti: niente contenuti offensivi o inappropriati, lo staff può rimuoverle.</p>
   ${r.custom?'<button class="btn ghost sm" id="cvreset">Torna all\'originale</button>':''}<p class="muted small" id="cvmsg" aria-live="polite">${E(note)}</p></div></div>`;
  q('.cx',box).onclick=close;q('#cvback',box).onclick=drawList;const msg=q('#cvmsg',box);
  const rs=q('#cvreset',box);rs&&(rs.onclick=async()=>{if(await save(null,msg))drawOne('Tornata all\'originale ✓')});
  q('#cvfile',box).onchange=async e=>{const f=e.target.files[0];if(!f)return;msg.textContent='Carico l\'immagine…';try{const url=await upload(r,f);if(await save(url,msg))drawOne('Caricata e salvata ✓ La vedono tutti sul tuo profilo.')}catch(err){msg.textContent=err.message}};
  let alts=[];try{alts=await alternatives(r)}catch(e){alts=[]}if(sel!==r)return;const el=q('#cvalts',box);if(!el)return;
  if(alts==='soon'){el.innerHTML=`<p class="muted small cvsoon">${E(A.SOON)} Le copertine consigliate per ${E(A.KINDS[r.kind].t.toLowerCase())} arrivano a breve: intanto puoi caricarne una dal PC.</p>`;return}
  const all=[...new Set([orig(r),...alts].filter(Boolean))];
  el.innerHTML=all.length>1||alts.length?all.map((x,i)=>`<button class="cvalt${x===cur?' on':''}" data-u="${E(x)}"><img src="${E(x)}" alt="" loading="lazy">${i===0?'<small>Originale</small>':''}</button>`).join(''):'<p class="muted small">Nessuna copertina alternativa ufficiale per questo titolo: puoi caricarne una dal PC.</p>';
  qa('.cvalt',el).forEach(b=>b.onclick=async()=>{if(await save(b.dataset.u,msg))drawOne('Salvata ✓ La vedono tutti sul tuo profilo.')})};
 drawList();sh.hidden=false;requestAnimationFrame(()=>sh.classList.add('show'))}
window.STASKYS_COVERS={open,staffRemove,alternatives};
})();
