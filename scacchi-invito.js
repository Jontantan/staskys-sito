/* Staskys — POP-UP "TI HANNO SFIDATO A SCACCHI" (patch 5.1.3), su tutte le pagine del sito.
   Leggero: niente librerie. Usa la sessione già salvata dal sito (la stessa che usa il login) e chiede al
   database solo le sfide ricevute ancora in attesa, ogni 6 s sulla pagina scacchi e ogni 15 s altrove,
   e mai quando la scheda è nascosta. Accetta → si apre la partita; Rifiuta → la sfida viene rifiutata. */
(function(){
if(window.__staskysInvito)return;window.__staskysInvito=1;
const KEY='sb-otxtpwojvuyxksrsfpdl-auth-token',ON_CHESS=/scacchi\.html$/.test(location.pathname)||/scacchi/.test(location.pathname);
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let names=null,shown='',busy=false;
const seenKey='staskys_inv_later';
const later=()=>{try{return JSON.parse(sessionStorage[seenKey]||'[]')}catch(e){return[]}};
function cfg(){return window.GIOCHI_CONFIG&&window.GIOCHI_CONFIG.SUPABASE_URL?window.GIOCHI_CONFIG:null}
function loadCfg(){return cfg()?Promise.resolve(cfg()):new Promise(r=>{const s=document.createElement('script');s.src='giochi-config.js?v=3';s.onload=()=>r(cfg());s.onerror=()=>r(null);document.head.appendChild(s)})}
async function session(){
 const A=window.STASKYS;if(A&&A.sb){try{const {data}=await A.sb.auth.getSession();if(data&&data.session)return data.session}catch(e){}}
 try{const s=JSON.parse(localStorage[KEY]||'null');if(s&&s.access_token&&s.user&&(!s.expires_at||s.expires_at*1000>Date.now()+5000))return s}catch(e){}
 return null}
async function nameOf(did){
 const A=window.STASKYS;if(A&&A.nameOf){const n=A.nameOf(did);if(n)return n}
 if(!names)names=fetch('members.json',{cache:'force-cache'}).then(r=>r.ok?r.json():{}).then(j=>(j&&j.members)||{}).catch(()=>({}));
 const m=(await names)[did];return(m&&m.nick)||'Un membro'}
async function api(c,s,path,opt){const r=await fetch(c.SUPABASE_URL+'/rest/v1/'+path,{...opt,headers:{apikey:c.SUPABASE_ANON_KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json',...(opt&&opt.headers||{})}});
 const t=await r.text();let j=null;try{j=t?JSON.parse(t):null}catch(e){}if(!r.ok)throw new Error((j&&j.message)||('Errore '+r.status));return j}
function close(){const m=document.getElementById('cinvm');if(m)m.remove();shown=''}
function style(){if(document.getElementById('cinvs'))return;const s=document.createElement('style');s.id='cinvs';s.textContent=`
#cinvm{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(5,3,10,.55);padding:1rem;animation:cinvf .18s ease-out}
#cinvm .ci{width:min(380px,100%);background:#141019;color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:1.4rem 1.4rem 1.2rem;box-shadow:0 30px 80px -20px rgba(0,0,0,.8);text-align:center;font-family:inherit;position:relative}
#cinvm .ci::before{content:"";position:absolute;inset:0 0 auto;height:4px;border-radius:20px 20px 0 0;background:linear-gradient(90deg,#ff5fa2,#c86cf5,#5fd3ea)}
#cinvm .ck{font-size:2.4rem;line-height:1}#cinvm h3{margin:.5rem 0 .25rem;font-size:1.2rem}#cinvm p{margin:0 0 1rem;color:#bbb;font-size:.9rem}
#cinvm .cb{display:flex;gap:.6rem;justify-content:center}#cinvm button{font:inherit;font-weight:700;font-size:1rem;border-radius:999px;padding:.75rem 1.4rem;cursor:pointer;border:1px solid transparent}
#cinvm .ok{background:#22c55e;color:#06210f}#cinvm .ok:hover{background:#2fdc6c}#cinvm .no{background:transparent;color:#fff;border-color:rgba(255,255,255,.25)}
#cinvm .x{position:absolute;top:.5rem;right:.7rem;background:none;border:0;color:#999;font-size:1.3rem;padding:.2rem .4rem}
#cinvm .er{color:#fca5a5;font-size:.85rem;margin:.7rem 0 0;min-height:1em}
@keyframes cinvf{from{opacity:0}to{opacity:1}}`;document.head.appendChild(s)}
async function show(c,s,g){
 if(shown===g.id)return;close();style();shown=g.id;const n=await nameOf(g.challenger_did);
 const d=document.createElement('div');d.id='cinvm';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');
 d.innerHTML=`<div class="ci"><button class="x" aria-label="Più tardi" title="Più tardi">×</button><div class="ck">♟️</div><h3>${E(n)} ti sfida a scacchi!</h3>
  <p>${g.mode==='live'?'⏱️ Dal vivo':'✉️ Per corrispondenza'} · ${g.ranked?'🏆 Ranked':'🤝 Amichevole'}</p>
  <div class="cb"><button class="ok">Accetta</button><button class="no">Rifiuta</button></div><p class="er" role="alert"></p></div>`;
 document.body.appendChild(d);try{window.STASKYS_CSND&&window.STASKYS_CSND.notify()}catch(e){}
 const er=d.querySelector('.er'),btns=[...d.querySelectorAll('.ok,.no')];
 const answer=async ok=>{if(busy)return;busy=true;btns.forEach(b=>b.disabled=true);er.textContent='';
  try{const s2=await session()||s;const r=await api(c,s2,'rpc/chess_respond',{method:'POST',body:JSON.stringify({p_id:g.id,p_accept:ok})});close();
   if(ok)location.href='scacchi.html?g='+encodeURIComponent((r&&r.id)||g.id);else if(ON_CHESS)document.dispatchEvent(new CustomEvent('staskys-chess-refresh'))}
  catch(e){er.textContent='⚠️ '+(e.message||'Errore');btns.forEach(b=>b.disabled=false)}busy=false};
 d.querySelector('.ok').onclick=()=>answer(true);d.querySelector('.no').onclick=()=>answer(false);
 d.querySelector('.x').onclick=()=>{try{sessionStorage[seenKey]=JSON.stringify([...later(),g.id].slice(-30))}catch(e){}close()};
 d.querySelector('.ok').focus()}
async function tick(){
 if(document.hidden||busy)return;try{if(window.STASKYS_CHESS_BUSY&&window.STASKYS_CHESS_BUSY())return}catch(e){}const c=await loadCfg();if(!c)return;const s=await session();if(!s){close();return}
 let L;try{L=await api(c,s,'chess_games?select=id,mode,ranked,challenger_did,created_at&status=eq.invite&opponent=eq.'+encodeURIComponent(s.user.id)+'&order=created_at.desc&limit=5')}catch(e){return}
 const skip=later(),g=(L||[]).find(x=>!skip.includes(x.id)&&(x.mode!=='live'||Date.now()-Date.parse(x.created_at)<180000));
 if(!g){if(shown&&!busy)close();return}show(c,s,g)}
let t=null;function start(){clearInterval(t);tick();t=setInterval(tick,ON_CHESS?6000:15000)}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick()});
window.STASKYS_INVITO={check:tick};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(start,1200));else setTimeout(start,1200);
})();
