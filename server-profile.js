/* Staskys — PROFILO DEL SERVER (patch 2.3)
   Sul sito ognuno si vede con il profilo che ha NEL SERVER Staskys: avatar del server, nickname del server e banner.
   Se non li ha impostati: avatar/nome/banner normali di Discord, poi l'avatar standard di Discord, poi l'icona Staskys.
   Fonti (uguali per tutti quelli che guardano, così tutti vedono la stessa foto):
   • members.json  — scritto dal bot del server (GitHub Action), con la data "updated";
   • site_profiles.dc — scritto da ognuno al login (il sito chiede a Discord il PROPRIO profilo nel server, permesso
     "guilds.members.read"); contiene solo i codici delle immagini, mai indirizzi liberi.
   Vince la più recente delle due. */
(function(){
const G='1244253666295283713',CDN='https://cdn.discordapp.com',HASH=/^(a_)?[0-9a-f]{32}$/,ID=/^\d{5,25}$/;
const BAD=/[\p{L}\d_]*(?:froc|ricchion|nigg|fag+ot|finocch|ritardat|mongoloid|puttan|zoccol)[\p{L}\d_]*|\bnegr[oiae]\b|\btroi[ae]\b/giu;
const clean=n=>String(n||'').replace(BAD,'***').trim().slice(0,64);
const pic=(path,h,size)=>HASH.test(h||'')?`${CDN}/${path}/${h}.${h.startsWith('a_')?'gif':'png'}?size=${size}`:'';
const defAv=did=>{try{return`${CDN}/embed/avatars/${Number((BigInt(did)>>22n)%6n)}.png`}catch(e){return''}};
const okUrl=u=>typeof u==='string'&&/^https:\/\/cdn\.discordapp\.com\//.test(u)?u:'';
/* da site_profiles.dc (codici) a indirizzi */
function fromDc(did,dc){if(!dc||typeof dc!=='object'||!ID.test(did))return null;
 return{avatar:pic(`guilds/${G}/users/${did}/avatars`,dc.ga,256)||pic(`avatars/${did}`,dc.ua,256),
  avatar2:pic(`avatars/${did}`,dc.ua,256),
  banner:pic(`guilds/${G}/users/${did}/banners`,dc.gb,600)||pic(`banners/${did}`,dc.ub,600),
  nick:clean(dc.nick||dc.gname||dc.uname),in_server:true,at:Date.parse(dc.at)||0,src:'login'}}
/* dal membro restituito da Discord a ciò che salviamo (solo codici) */
function dcFromMember(m){const u=(m&&m.user)||{},h=x=>HASH.test(x||'')?x:null;
 return{ga:h(m.avatar),ua:h(u.avatar),gb:h(m.banner),ub:h(u.banner),nick:m.nick?String(m.nick).slice(0,64):null,gname:u.global_name?String(u.global_name).slice(0,64):null,uname:u.username?String(u.username).slice(0,40):null,at:new Date().toISOString()}}

/* carica e unisce le due fonti: did → {nick, avatar, avatar2, banner, username, joined, in_server, at, src} */
let P=null;
function load(sb){return P||(P=Promise.all([
  fetch('members.json',{cache:'no-store'}).then(r=>r.ok?r.json():{}).catch(()=>({})),
  sb?Promise.resolve(sb.from('site_profiles').select('*').limit(5000)).then(r=>r.error?[]:r.data||[],()=>[]):[]
 ]).then(([mj,sp])=>{const out={},at=Date.parse(mj&&mj.updated)||0;
  Object.entries((mj&&mj.members)||{}).forEach(([id,x])=>{if(!x||!ID.test(id))return;
   out[id]={nick:clean(x.nick),avatar:okUrl(x.avatar),avatar2:okUrl(x.global_avatar),banner:okUrl(x.banner),username:x.username||'',joined:x.joined||'',in_server:x.in_server!==false,at,src:'bot'}});
  sp.forEach(r=>{const id=String(r.discord_id||''),p=fromDc(id,r.dc);if(!p)return;const m=out[id];
   if(!m){out[id]=p;return}
   if(p.at>m.at){out[id]={...m,...p,nick:p.nick||m.nick,username:m.username||'',joined:m.joined,alt:m.avatar}}else m.alt=p.avatar});
  return out}))}
function reset(){P=null}

/* ordine degli avatar per un membro (prima il profilo del server) */
function avatars(did,map,...extra){const m=map&&map[did]||{},L=[];const add=u=>{u=okUrl(u)||(u==='assets/icon.png'?u:'');if(u&&!L.includes(u))L.push(u)};
 add(m.avatar);add(m.alt);add(m.avatar2);extra.forEach(add);if(ID.test(did))add(defAv(did));add('assets/icon.png');return L}

/* il TUO profilo del server, salvato nel browser per la barra in alto e per i punteggi/voti che salvi */
const KEY='staskys_me_sp';
function remember(did,p){try{if(did&&p)localStorage[KEY]=JSON.stringify({did,avatar:p.avatar||'',nick:p.nick||'',at:Date.now()})}catch(e){}}
function cached(did){try{const c=JSON.parse(localStorage[KEY]||'null');return c&&(!did||c.did===did)?c:null}catch(e){return null}}

/* al login con Discord: legge il TUO profilo nel server e lo salva su site_profiles (così lo vedono tutti uguale) */
async function syncSelf(sb){if(!sb)return null;
 const {data}=await sb.auth.getSession();const s=data&&data.session;if(!s||!s.provider_token||!s.user)return null;
 const meta=s.user.user_metadata||{},did=String(meta.provider_id||meta.sub||''),mark=s.user.id+'|'+(s.user.last_sign_in_at||'');
 try{if(localStorage.staskys_sp_done===mark)return null}catch(e){}
 let m=null;try{const r=await fetch(`https://discord.com/api/v10/users/@me/guilds/${G}/member`,{headers:{Authorization:'Bearer '+s.provider_token}});if(r.ok)m=await r.json()}catch(e){}
 try{localStorage.staskys_sp_done=mark}catch(e){}
 if(!m||!ID.test(did))return null;
 const dc=dcFromMember(m),p=fromDc(did,dc);remember(did,p);
 await Promise.resolve(sb.from('site_profiles').upsert({dc},{onConflict:'user_id'})).catch(()=>{});
 /* aggiorna anche nome e foto salvati sui tuoi voti (la data del voto non cambia) */
 if(p.avatar)await Promise.resolve(sb.from('media_ratings').update({avatar_url:p.avatar,username:p.nick||meta.full_name||''}).eq('user_id',s.user.id)).catch(()=>{});
 reset();return{did,dc,p}}

window.STASKYS_SP={GUILD:G,SCOPES:'identify email guilds.members.read',clean,defAv,fromDc,dcFromMember,load,reset,avatars,remember,cached,syncSelf};
})();
