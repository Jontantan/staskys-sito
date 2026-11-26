/* Staskys — account condiviso (login Discord con Supabase) per Profilo e Catalogo.
   Usa la stessa sessione dei Giochi: se sei collegato lì, lo sei anche qui. */
(function(){
const CFG=window.GIOCHI_CONFIG||{};
const READY=!!(CFG.SUPABASE_URL&&CFG.SUPABASE_ANON_KEY&&window.supabase);
const sb=READY?window.supabase.createClient(CFG.SUPABASE_URL,CFG.SUPABASE_ANON_KEY,{auth:{flowType:'pkce',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true,storage:window.localStorage,storageKey:'sb-otxtpwojvuyxksrsfpdl-auth-token'}}):null;
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SP=window.STASKYS_SP||null;
const LOCAL=/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const A={sb,READY,E,LOCAL,user:null,
 /* ricerca catalogo: Edge Function su Supabase (le chiavi RAWG/TMDB restano lì); in locale usa il server di prova */
 SEARCH_URL:LOCAL?'/api/catalog-search':(CFG.SUPABASE_URL||'')+'/functions/v1/super-endpoint',
 profile(u){const m=(u||{}).user_metadata||{};return{name:(m.custom_claims&&m.custom_claims.global_name)||m.full_name||m.name||m.user_name||'Utente',avatar:m.avatar_url||m.picture||'',discord:String(m.provider_id||m.sub||'')}},
 login(){if(!sb)return;sb.auth.signInWithOAuth({provider:'discord',options:{redirectTo:location.origin+location.pathname+location.search,scopes:SP?SP.SCOPES:undefined}})},
 logout(){sb&&sb.auth.signOut().then(()=>location.reload())},
 ready:null,
 /* membri del server (members.json, aggiornato ogni 10 min dal bot) */
 members:null,
 /* PROFILI DEL SERVER (patch 2.3, vedi server-profile.js): members.json del bot + quello che ognuno salva al login,
    vince il più recente. Ognuno, anche TU sul tuo profilo, si vede con lo stesso avatar/nickname/banner del server Staskys. */
 loadMembers(){return this.members||(this.members=(SP?SP.load(sb):Promise.resolve({})).then(m=>{A.mem=m;
  const me=A.user&&A.profile(A.user).discord;if(SP&&me&&m[me])SP.remember(me,m[me]);return m}))},
 mem:{},
 /* nome da mostrare: nickname nel server se c'è, altrimenti quello salvato */
 nameOf(did,fb){const m=A.mem[String(did||'')];return A.clean((m&&m.in_server!==false&&m.nick)||fb||'')},
 /* banner del profilo Discord (prima quello del server) */
 bannerOf(did){const m=A.mem[String(did||'')];return(m&&m.banner)||''},
 /* tu, come ti vedono gli altri (profilo del server); se non ancora caricato, l'ultimo salvato nel browser, poi il login */
 me(){const p=A.profile(A.user),m=A.mem[p.discord]||(SP&&SP.cached(p.discord))||{};return{...p,name:A.clean(m.nick)||p.name,avatar:m.avatar||p.avatar}},
 /* AVATAR: più indirizzi in ordine, se uno non carica si passa al successivo:
    profilo del server (il più recente tra bot e login) → l'altra fonte → avatar normale di Discord
    → copie salvate (2 = ultimo voto, 3 = streak, 4 = punteggi) → il tuo avatar del login (solo per te)
    → avatar standard di Discord → icona Staskys. Uguale per chiunque guardi. */
 avReg:{},
 addAv(did,url,prio){did=String(did||'');if(!did||!/^https?:\/\//.test(url||''))return;const L=A.avReg[did]||(A.avReg[did]=[]);if(!L.some(x=>x.u===url))L.push({u:url,p:prio,i:L.length})},
 defAv(did){return SP?SP.defAv(did):''},
 avList(did,...extra){did=String(did||'');const out=[],add=u=>{if(u&&!out.includes(u))out.push(u)};
  const m=A.mem[did]||{};add(m.avatar);add(m.alt);add(m.avatar2);
  (A.avReg[did]||[]).slice().sort((a,b)=>a.p-b.p||a.i-b.i).forEach(x=>add(x.u));
  extra.forEach(u=>/^https?:\/\//.test(u||'')&&add(u));
  const me=A.user&&A.profile(A.user);if(me&&did&&me.discord===did)add(me.avatar);
  if(/^\d+$/.test(did))add(A.defAv(did));add('assets/icon.png');return out},
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
/* subito dopo il login con Discord: salva il tuo profilo del server (avatar, nickname, banner) per tutti; max 4 secondi */
A.ready=sb?sb.auth.getSession().then(async({data})=>{A.user=data.session?.user||null;
 if(A.user&&SP&&!A.DEMO&&data.session.provider_token)await Promise.race([SP.syncSelf(sb).catch(()=>null),new Promise(r=>setTimeout(r,4000))]);
 return A.user}).catch(()=>null):Promise.resolve(null);
/* carica subito i profili del server se sei collegato (serve per la barra in alto, i voti e i punteggi che salvi) */
A.ready.then(u=>{if(u&&!A.DEMO)A.loadMembers()});
if(sb)sb.auth.onAuthStateChange((_e,s)=>{const was=A.user?.id;A.user=s?.user||null;if(was!==A.user?.id)document.dispatchEvent(new CustomEvent('staskys-auth'))});
window.STASKYS=A;
})();
