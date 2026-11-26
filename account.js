/* Staskys — account condiviso (login Discord con Supabase) per Profilo e Catalogo.
   Usa la stessa sessione dei Giochi: se sei collegato lì, lo sei anche qui. */
(function(){
const CFG=window.GIOCHI_CONFIG||{};
const READY=!!(CFG.SUPABASE_URL&&CFG.SUPABASE_ANON_KEY&&window.supabase);
const sb=READY?window.supabase.createClient(CFG.SUPABASE_URL,CFG.SUPABASE_ANON_KEY,{auth:{flowType:'pkce',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true,storage:window.localStorage,storageKey:'sb-otxtpwojvuyxksrsfpdl-auth-token'}}):null;
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LOCAL=/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const A={sb,READY,E,LOCAL,user:null,
 /* ricerca catalogo: Edge Function su Supabase (le chiavi RAWG/TMDB restano lì); in locale usa il server di prova */
 SEARCH_URL:LOCAL?'/api/catalog-search':(CFG.SUPABASE_URL||'')+'/functions/v1/super-endpoint',
 profile(u){const m=(u||{}).user_metadata||{};return{name:(m.custom_claims&&m.custom_claims.global_name)||m.full_name||m.name||m.user_name||'Utente',avatar:m.avatar_url||m.picture||'',discord:String(m.provider_id||m.sub||'')}},
 login(){if(!sb)return;sb.auth.signInWithOAuth({provider:'discord',options:{redirectTo:location.origin+location.pathname+location.search}})},
 logout(){sb&&sb.auth.signOut().then(()=>location.reload())},
 ready:null,
 /* membri del server (members.json, aggiornato ogni 10 min dal bot) */
 members:null,
 loadMembers(){return this.members||(this.members=fetch('members.json',{cache:'no-store'}).then(r=>r.ok?r.json():{members:{}}).catch(()=>({members:{}})).then(d=>{const m=d.members||{};A.mem=m;Object.entries(m).forEach(([id,x])=>x&&A.addAv(id,x.avatar,1));return m}))},
 /* AVATAR (patch 2.2): l'URL salvato coi punteggi scade quando uno cambia avatar su Discord (cambia il codice nell'indirizzo).
    Per ogni membro teniamo più indirizzi in ordine di affidabilità e, se uno non carica, si passa al successivo:
    0 = il tuo avatar attuale (dal login) · 1 = members.json (server, aggiornato dal bot) · 2 = ultimo voto nel catalogo
    3 = streak dei minigiochi · 4 = punteggi in classifica · poi l'avatar standard di Discord e infine l'icona Staskys. */
 mem:{},
 /* nome da mostrare: nickname nel server (members.json) se c'è, altrimenti quello salvato */
 nameOf(did,fb){const m=A.mem[String(did||'')];return A.clean((m&&m.in_server!==false&&m.nick)||fb||'')},
 avReg:{},
 addAv(did,url,prio){did=String(did||'');if(!did||!/^https?:\/\//.test(url||''))return;const L=A.avReg[did]||(A.avReg[did]=[]);if(!L.some(x=>x.u===url))L.push({u:url,p:prio,i:L.length})},
 defAv(did){try{return`https://cdn.discordapp.com/embed/avatars/${Number((BigInt(did)>>22n)%6n)}.png`}catch(e){return''}},
 avList(did,...extra){did=String(did||'');const out=[],add=u=>{if(u&&!out.includes(u))out.push(u)};
  const me=A.user&&A.profile(A.user);if(me&&did&&me.discord===did)add(me.avatar);
  (A.avReg[did]||[]).slice().sort((a,b)=>a.p-b.p||a.i-b.i).forEach(x=>add(x.u));
  extra.forEach(u=>/^https?:\/\//.test(u||'')&&add(u));if(/^\d+$/.test(did))add(A.defAv(did));add('assets/icon.png');return out},
 /* attributi per <img>: src = miglior avatar, gli altri in data-av come riserva */
 avAttr(did,...extra){const L=A.avList(did,...extra);return`src="${E(L[0])}" data-av="${E(L.slice(1).join(' '))}" onerror="STASKYS.avNext(this)"`},
 avNext(img){const L=(img.dataset.av||'').split(' ').filter(Boolean);if(!L.length){img.onerror=null;return}img.dataset.av=L.slice(1).join(' ');img.src=L[0]},
 KINDS:{anime:{t:'Anime',one:'anime',verb:'sta guardando',icon:'🎌',eps:true},game:{t:'Giochi',one:'gioco',verb:'sta giocando',icon:'🎮'},movie:{t:'Film',one:'film',verb:'sta guardando',icon:'🎬'},tv:{t:'Serie',one:'serie',verb:'sta guardando',icon:'📺',eps:true}},
 STATUS:{visto:'Visto',in_corso:'In corso',droppato:'Droppato',voglio:'Voglio vederlo'},
 statusLabel(kind,s){if(kind==='game')return{visto:'Giocato',in_corso:'Sto giocando',droppato:'Droppato',voglio:'Voglio giocarci'}[s]||s;return this.STATUS[s]||s},
 /* voti 0–10 con un decimale: 0 è un voto valido, null = nessun voto */
 hasR:r=>r&&r.rating!=null&&r.rating!==''&&!isNaN(+r.rating),
 fmtR:v=>v==null||v===''?'':(Math.round(+v*10)/10).toLocaleString('it-IT',{minimumFractionDigits:+v%1?1:0,maximumFractionDigits:1}),
 /* colore dominante dell'avatar (per colorare la card) */
 color(src){return new Promise(res=>{const fb=()=>{let h=0;for(const c of String(src))h=(h*31+c.charCodeAt(0))%360;res(`hsl(${h} 70% 55%)`)};if(!src)return fb();
  const i=new Image();i.crossOrigin='anonymous';i.onload=()=>{try{const c=document.createElement('canvas');c.width=c.height=24;const x=c.getContext('2d');x.drawImage(i,0,0,24,24);const d=x.getImageData(0,0,24,24).data;
   let best=null,bs=-1;const bins={};for(let k=0;k<d.length;k+=4){if(d[k+3]<128)continue;const r=d[k],g=d[k+1],b=d[k+2],mx=Math.max(r,g,b),mn=Math.min(r,g,b),s=mx?(mx-mn)/mx:0,v=mx/255;if(v<.18)continue;const key=(r>>5)+','+(g>>5)+','+(b>>5);const o=bins[key]||(bins[key]={n:0,r:0,g:0,b:0,s:0});o.n++;o.r+=r;o.g+=g;o.b+=b;o.s+=s}
   for(const k in bins){const o=bins[k],sc=o.n*(.35+o.s/o.n);if(sc>bs){bs=sc;best=o}}
   if(!best)return fb();res(`rgb(${best.r/best.n|0},${best.g/best.n|0},${best.b/best.n|0})`)}catch(e){fb()}};i.onerror=fb;i.src=src})},
 /* demo: dati finti salvati solo nel browser, per l'anteprima */
 DEMO:/[?&]demo\b/.test(location.search),
 /* copre parole offensive nei nickname (stessa lista di _scripts/members_sync.py) */
 clean:n=>String(n||'').replace(/[\p{L}\d_]*(?:froc|ricchion|nigg|fag+ot|finocch|ritardat|mongoloid|puttan|zoccol)[\p{L}\d_]*|\bnegr[oiae]\b|\btroi[ae]\b/giu,'***').trim()
};
A.ready=sb?sb.auth.getSession().then(({data})=>{A.user=data.session?.user||null;return A.user}).catch(()=>null):Promise.resolve(null);
/* al login: se hai cambiato avatar/nome su Discord, aggiorna quelli salvati sui TUOI voti del catalogo
   (permesso già dato dalla regola "ognuno modifica i propri voti"; la data del voto non cambia). Al massimo una volta al giorno. */
A.ready.then(u=>{if(!u||!sb||A.DEMO)return;const p=A.profile(u),k='staskys_avsync';if(!p.avatar)return;
 const day=new Date().toISOString().slice(0,10),sig=day+'|'+p.avatar+'|'+p.name;try{if(localStorage[k]===sig)return}catch(e){}
 sb.from('media_ratings').update({avatar_url:p.avatar,username:p.name}).eq('user_id',u.id)
  .then(({error})=>{if(!error)try{localStorage[k]=sig}catch(e){}},()=>{})});
if(sb)sb.auth.onAuthStateChange((_e,s)=>{const was=A.user?.id;A.user=s?.user||null;if(was!==A.user?.id)document.dispatchEvent(new CustomEvent('staskys-auth'))});
window.STASKYS=A;
})();
