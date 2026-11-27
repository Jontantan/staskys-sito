/* Staskys — UPDATE 5: SCACCHI
   Partite dal vivo (voto del tempo 10 · 10|4 · 15 · 15|4, testa o croce) e per corrispondenza (3 giorni per mossa).
   Le regole le controlla il SERVER (Supabase, update5.sql): qui chess.js serve solo per mostrare mosse e frecce.
   Ranked = ELO (5 partite di calibrazione), amichevoli = niente ELO, spareggio a minigioco se non siete d'accordo sul tempo. */
import {Chess} from './assets/vendor/chess/chess.mjs';
const A=window.STASKYS,PZ=window.STASKYS_PEZZI,SND=window.STASKYS_CSND,E=A.E,q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const root=q('#chess'),P=new URLSearchParams(location.search);
const TCS=[['10+0','10 min','Classica veloce'],['10+4','10 | 4','10 minuti, +4 s a mossa'],['15+0','15 min','Più calma'],['15+4','15 | 4','15 minuti, +4 s a mossa']];
const TB_GAMES={snake:['Snake','Chi muore per primo perde','🐍'],reaction:['Riflessi','Chi ha i riflessi più lenti perde','⚡'],flappy:['Flappy','Chi muore per primo perde','🐤'],
 quiz:['Quiz anime','5 domande: chi fa meno punti perde','🎌'],stack:['Stack','Chi crolla per primo perde','🧱'],typing:['Battitura','30 secondi: chi è più lento perde','⌨️']};
const REASON={scaccomatto:'per scaccomatto',abbandono:'per abbandono',tempo:'per tempo',accordo:'patta d\'accordo',stallo:'per stallo','materiale insufficiente':'per materiale insufficiente',
 ripetizione:'per triplice ripetizione','50 mosse':'per la regola delle 50 mosse',timeout_insufficiente:'tempo scaduto, ma l\'altro non poteva dare matto',disconnesso:'per abbandono (si è disconnesso)',annullata:'partita annullata'};
const VAL={p:1,n:3,b:3,r:5,q:9,k:0};
const fmtN=n=>Number(n).toLocaleString('it-IT');
let mineChan=null,readySent='',me=null,myDid='',off=0,G=null,view=null,timer=0,chan=null,lobbyChan=null,presence=new Map(),ratingsCache=null;
const nameOf=(did,fb)=>A.nameOf(did,fb)||fb||'Membro';
const av=(did)=>`<img class="cav" ${A.avAttr(did,'')} alt="">`;
const now=()=>Date.now()+off;
const toast=(t,bad)=>{let el=q('#ctoast');if(!el){el=document.createElement('div');el.id='ctoast';document.body.appendChild(el)}el.textContent=t;el.className=bad?'bad on':'on';clearTimeout(toast.t);toast.t=setTimeout(()=>el.className='',bad?Math.max(6000,t.length*70):3800)};
const errMsg=e=>{const m=String(e&&e.message||e||'');return/fetch|network|Failed/i.test(m)?'Connessione assente, riprova.':m.replace(/^.*?ERROR:\s*/,'')||'Qualcosa è andato storto.'};
async function rpc(fn,args){const t0=Date.now();const r=await A.sb.rpc(fn,args);if(r.error)throw r.error;const d=r.data;
 if(d&&d.now){const t1=Date.now();off=Date.parse(d.now)-(t0+t1)/2}return d}

/* ---------- ELO / classifiche ---------- */
async function loadRatings(force){if(ratingsCache&&!force)return ratingsCache;const {data}=await A.sb.from('chess_ratings').select('*').order('elo',{ascending:false});
 const R={live:[],corr:[],by:{}};(data||[]).forEach(r=>{R[r.mode].push(r);R.by[r.mode+':'+r.discord_id]=r});
 ['live','corr'].forEach(m=>{let i=0;R[m].forEach(r=>{if(r.games>=5)r.pos=++i})});return ratingsCache=R}
const isTop=(did,mode)=>{const R=ratingsCache;if(!R)return false;return['live','corr'].some(m=>(!mode||m===mode)&&R[m].find(r=>r.pos===1&&r.discord_id===did))};
const eloOf=(did,mode)=>{const r=ratingsCache&&ratingsCache.by[mode+':'+did];return r?(r.games<5?`${r.elo}? · calibrazione ${r.games}/5`:r.elo):'1200? · nuovo'};
const kingIco=()=>`<span class="sking" title="1° nella classifica scacchi">${PZ.svg('w','k',{staskys:true})}</span>`;

/* ================= LOBBY ================= */
async function lobby(){view='lobby';document.body.classList.remove('cplaying');stopGame();document.title='Scacchi · Staskys';
 root.innerHTML=`<div class="clob">
  <div class="card cbox cnewbig" id="cnew"></div>
  <div class="card cbox" id="cmine"><h3>Le tue partite</h3><p class="muted small">Caricamento…</p></div>
  <div class="card cbox cwide" id="crank"></div>
  <div class="card cbox" id="clive"><h3>👀 Partite in corso</h3><p class="muted small">Caricamento…</p></div>
  <div class="card cbox cwide" id="carch"></div>
  <div class="card cbox cwide" id="cflags" hidden></div></div>`;
 renderNew();renderRank('live');renderArchive(false);renderLive();if(me){loadMine();joinLobby();loadFlags()}
 clearInterval(timer);let ln=0;timer=setInterval(()=>{if(view!=='lobby')return;if(me)loadMine(true);if(++ln%4===0)renderLive(true)},2500);
 if(me&&A.sb&&!mineChan)try{mineChan=A.sb.channel('mie-'+me.id).on('postgres_changes',{event:'*',schema:'public',table:'chess_games',filter:'opponent=eq.'+me.id},()=>view==='lobby'&&loadMine(true)).on('postgres_changes',{event:'*',schema:'public',table:'chess_games',filter:'challenger=eq.'+me.id},()=>view==='lobby'&&loadMine(true)).subscribe()}catch(e){}}
/* staff: segnalazioni anti-cheat (solo un avviso da controllare, nessun ban automatico) */
const FLAG_TXT={troppo_preciso:'Precisione troppo alta',salto_precisione:'Salto di precisione rispetto alla sua media',perde_apposta:'Possibile sconfitta apposta',sconfitte_ripetute:'Tante sconfitte di fila contro la stessa persona',abbandono_rapido:'Abbandono/tempo dopo poche mosse'};
async function loadFlags(){const b=q('#cflags'),SO=window.STASKYS_SOCIAL;if(!b||!SO||!SO.canModerate)return;let ok=false;try{ok=await SO.canModerate()}catch(e){}if(!ok)return;
 const {data,error}=await A.sb.from('chess_flags').select('id,game_id,discord_id,kind,detail,created_at,checked').order('checked').order('created_at',{ascending:false}).limit(40);if(error)return;
 b.hidden=false;const L=data||[],open=L.filter(f=>!f.checked).length;
 b.innerHTML=`<h3>🛡️ Segnalazioni anti-cheat <span class="muted small">(solo staff · ${open} da guardare)</span></h3><p class="muted tiny">Sono solo sospetti: guarda la partita e l'analisi prima di decidere. Nessuno viene bannato in automatico.</p>
 ${L.length?`<ul class="cflag-list">${L.map(f=>`<li class="${f.checked?'seen':''}">${av(f.discord_id)}<div><b>${E(nameOf(f.discord_id))}</b> · ${E(FLAG_TXT[f.kind]||f.kind)}<br><small class="muted">${E(f.detail||'')} · ${new Date(f.created_at).toLocaleString('it-IT',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</small></div><a class="btn sm ghost" href="?g=${f.game_id}">Partita</a>${f.checked?'<small class="muted">visto ✓</small>':`<button class="btn sm" data-seen="${f.id}">Visto</button>`}</li>`).join('')}</ul>`:'<p class="muted small">Nessuna segnalazione. 👍</p>'}`;
 qa('[data-seen]',b).forEach(x=>x.onclick=async()=>{x.disabled=true;try{await rpc('chess_flag_seen',{p_id:+x.dataset.seen});loadFlags()}catch(e){toast(errMsg(e),true);x.disabled=false}})}
function renderNew(){const b=q('#cnew');if(!b)return;
 if(!A.READY){b.innerHTML='<h3>Scacchi in arrivo</h3><p class="muted">Il database non è collegato.</p>';return}
 if(!me){b.innerHTML='<h3>Gioca a scacchi</h3><p class="muted">Accedi con Discord per sfidare gli altri membri.</p><button class="btn sm" id="clog">Accedi con Discord</button>';q('#clog').onclick=()=>A.login();return}
 const pre=P.get('sfida')||'';
 b.innerHTML=`<h3>Nuova sfida</h3>
  <label class="clab">Chi sfidi?</label><div class="cpick"><input id="copp" placeholder="Cerca un membro…" autocomplete="off"><div class="csugg" id="csugg"></div></div>
  <div class="cseg" id="cmode"><button data-v="live" class="on">⏱️ Dal vivo</button><button data-v="corr">✉️ Per corrispondenza</button></div>
  <div class="cseg" id="ctype"><button data-v="0" class="on">🤝 Amichevole</button><button data-v="1">🏆 Ranked</button></div>
  <p class="muted tiny" id="chint"></p>
  <button class="btn sm" id="csend" disabled>Invia la sfida</button><p class="cerr" id="cerr" role="alert" hidden></p>
  <div class="conline"><h4>Online ora <span class="muted" id="cocount"></span></h4><div id="conl" class="conl"><span class="muted small">Nessuno sulla pagina scacchi.</span></div></div>`;
 let opp=pre;const inp=q('#copp'),sug=q('#csugg');
 const hint=()=>{const m=q('#cmode .on').dataset.v,r=q('#ctype .on').dataset.v==='1';q('#chint').textContent=(m==='live'?'Prima di iniziare votate il tempo: 10 min, 10|4, 15 min o 15|4. ':'Niente orologio: hai 3 giorni per ogni mossa. ')+(r?'Conta per la classifica ELO '+(m==='live'?'dal vivo':'per corrispondenza')+'.':'Amichevole: l\'ELO non cambia'+(m==='live'?'; se non siete d\'accordo sul tempo potete fare testa o croce o uno spareggio a un minigioco.':'.'))};
 qa('.cseg button',b).forEach(x=>x.onclick=()=>{qa('button',x.parentNode).forEach(y=>y.classList.toggle('on',y===x));hint()});hint();
 const setOpp=(did,fb)=>{opp=did;inp.value=did?nameOf(did,fb):'';sug.innerHTML='';q('#csend').disabled=!did;const er=q('#cerr');if(er)er.hidden=true};pickOpp=setOpp;
 if(pre)A.loadMembers().then(()=>setOpp(pre));
 inp.oninput=async()=>{opp='';q('#csend').disabled=true;const t=inp.value.trim().toLowerCase();if(t.length<1){sug.innerHTML='';return}
  const M=await A.loadMembers();const L=Object.entries(M||{}).filter(([d,m])=>d!==myDid&&m&&m.in_server!==false&&((m.nick||'')+' '+(m.username||'')).toLowerCase().includes(t)).slice(0,6);
  sug.innerHTML=L.map(([d,m])=>`<button data-did="${E(d)}">${av(d)}<span>${E(A.clean(m.nick)||m.username)}</span>${presence.has(d)?'<i class="cdot"></i>':''}</button>`).join('')||'<span class="muted small">Nessun membro trovato</span>';
  qa('button',sug).forEach(x=>x.onclick=()=>setOpp(x.dataset.did))};
 q('#csend').onclick=async()=>{const btn=q('#csend');btn.disabled=true;
  try{const g=await rpc('chess_challenge',{p_did:opp,p_mode:q('#cmode .on').dataset.v,p_ranked:q('#ctype .on').dataset.v==='1'});toast('Sfida inviata a '+nameOf(opp)+' ✓');
   pingInvite(opp,g.id);setOpp('');if(g.mode==='live'){openGame(g.id);return}loadMine()}catch(e){console.error('chess_challenge',opp,e);const m=errMsg(e);toast(m,true);const er=q('#cerr');if(er){er.textContent='⚠️ '+m;er.hidden=false}btn.disabled=false}};
 renderOnline()}
function renderOnline(){const b=q('#conl');if(!b)return;const L=[...presence.values()].filter(p=>p.did!==myDid);q('#cocount').textContent=L.length?'· '+L.length:'';
 b.innerHTML=L.length?L.map(p=>`<button class="conp" data-did="${E(p.did)}" title="Sfida ${E(nameOf(p.did,p.name))}">${av(p.did)}<span>${E(nameOf(p.did,p.name))}</span>${p.playing?'<small class="cplay">sta giocando</small>':'<small>sfida →</small>'}</button>${typeof p.playing==='string'?`<a class="chip cwatchb" href="?g=${E(p.playing)}" data-watch="${E(p.playing)}">👀 Guarda</a>`:''}`).join(''):'<span class="muted small">Nessun altro sulla pagina scacchi in questo momento.</span>';
 qa('[data-watch]',b).forEach(x=>x.onclick=e=>{e.preventDefault();openGame(x.dataset.watch)});
 qa('.conp',b).forEach(x=>x.onclick=()=>{const d=x.dataset.did,p=presence.get(d)||{};if(pickOpp){pickOpp(d,p.name);const s=q('#csend');if(s){s.scrollIntoView({block:'nearest',behavior:'smooth'});s.focus({preventScroll:true})}}})}
async function joinLobby(){if(lobbyChan||!A.sb)return;try{lobbyChan=A.sb.channel('scacchi-lobby',{config:{presence:{key:myDid}}});
 lobbyChan.on('presence',{event:'sync'},()=>{presence.clear();Object.entries(lobbyChan.presenceState()).forEach(([k,v])=>presence.set(k,v[0]||{did:k}));renderOnline()})
 .on('broadcast',{event:'invite'},({payload})=>{if(payload&&payload.to===myDid){SND.notify();toast('♟️ '+nameOf(payload.from)+' ti ha sfidato!');loadMine()}})
 .subscribe(s=>{if(s==='SUBSCRIBED')lobbyChan.track({did:myDid,name:A.me().name,playing:view==='game'&&G?G.id:false})})}catch(e){}}
function pingInvite(to,id){try{lobbyChan&&lobbyChan.send({type:'broadcast',event:'invite',payload:{to,from:myDid,id}})}catch(e){}}
/* PATCH 5.1: partite in corso da guardare */
let lastLive='',pickOpp=null;
async function renderLive(quiet){const b=q('#clive');if(!b||!A.sb)return;
 const {data,error}=await A.sb.from('chess_games').select('id,mode,ranked,white_did,black_did,fen,moves,tc_base,tc_inc,started_at,updated_at').eq('status','active').order('updated_at',{ascending:false}).limit(30);
 if(error){if(!quiet)b.innerHTML='<h3>👀 Partite in corso</h3><p class="muted small">Non riesco a caricarle.</p>';return}
 const L=(data||[]).filter(g=>g.mode==='live'||Date.now()-Date.parse(g.updated_at)<3*864e5).sort((a,b)=>(a.mode==='live'?0:1)-(b.mode==='live'?0:1));
 const sig=JSON.stringify(L.map(g=>[g.id,(g.moves||[]).length]));if(quiet&&sig===lastLive)return;lastLive=sig;
 b.innerHTML=`<h3>👀 Partite in corso ${L.length?`<span class="muted small">· ${L.length}</span>`:''}</h3>${L.length?`<div class="clivel">${L.map(g=>`<a class="crow" href="?g=${g.id}" data-watch="${g.id}"><span class="cvs">${av(g.white_did)}${av(g.black_did)}</span><span><b>${E(nameOf(g.white_did))} – ${E(nameOf(g.black_did))}</b><small>${g.mode==='live'?'⏱️ Dal vivo'+(g.tc_base?` · ${g.tc_base/60}${g.tc_inc?' | '+g.tc_inc:' min'}`:''):'✉️ Corrispondenza'} · ${g.ranked?'Ranked':'Amichevole'} · mossa ${Math.floor((g.moves||[]).length/2)+1}</small></span><span class="chip">${(g.white_did===myDid||g.black_did===myDid)?'Gioca':'👀 Guarda'}</span></a>`).join('')}</div>`:'<p class="muted small">Nessuna partita in corso adesso.</p>'}`;
 qa('[data-watch]',b).forEach(x=>x.onclick=e=>{e.preventDefault();openGame(x.dataset.watch)})}
let lastMine='';
async function loadMine(quiet){const b=q('#cmine');if(!b||!me)return;
 const {data,error}=await A.sb.from('chess_games').select('id,mode,ranked,status,challenger,opponent,challenger_did,opponent_did,white_did,black_did,fen,turn_since,created_at,updated_at,tc_base,tc_inc')
  .or(`challenger.eq.${me.id},opponent.eq.${me.id}`).in('status',['invite','voting','coin','tiebreak','active']).order('updated_at',{ascending:false}).limit(40);
 if(error){if(!quiet)b.innerHTML='<h3>Le tue partite</h3><p class="muted small">Non riesco a caricare le partite.</p>';return}
 const sig=JSON.stringify(data);if(quiet&&sig===lastMine)return;
 const had=lastMine?JSON.parse(lastMine).filter(g=>g.status==='invite'&&g.opponent===me.id).map(g=>g.id):[];lastMine=sig;
 const inc=data.filter(g=>g.status==='invite'&&g.opponent===me.id),out=data.filter(g=>g.status==='invite'&&g.challenger===me.id),act=data.filter(g=>g.status!=='invite');
 if(quiet&&inc.some(g=>!had.includes(g.id)))SND.notify();
 /* sfida accettata dall'altro mentre aspetti: entra subito nella partita dal vivo */
 const live=act.find(g=>g.mode==='live'&&['voting','coin','tiebreak'].includes(g.status));if(live&&quiet){openGame(live.id);return}
 const other=g=>g.challenger===me.id?g.opponent_did:g.challenger_did,kind=g=>`${g.mode==='live'?'⏱️ Dal vivo':'✉️ Corrispondenza'} · ${g.ranked?'Ranked':'Amichevole'}`;
 const myTurn=g=>g.status==='active'&&((g.fen.split(' ')[1]==='w')===(g.white_did===myDid));
 b.innerHTML=`<h3>Le tue partite</h3>
  ${inc.length?`<p class="clab">Sfide ricevute</p>${inc.map(g=>`<div class="crow">${av(other(g))}<span><b>${E(nameOf(other(g)))}</b><small>${kind(g)}</small></span><button class="btn sm" data-acc="${g.id}">Accetta</button><button class="btn ghost sm" data-dec="${g.id}">No</button></div>`).join('')}`:''}
  ${act.length?`<p class="clab">In corso</p>${act.map(g=>`<a class="crow" href="?g=${g.id}" data-open="${g.id}">${av(other(g))}<span><b>${E(nameOf(other(g)))}</b><small>${kind(g)}${g.status==='active'?(myTurn(g)?' · <em class="cturn">tocca a te</em>':' · tocca all\'altro'):' · si sceglie il tempo'}</small></span><span class="chip">Apri →</span></a>`).join('')}`:''}
  ${out.length?`<p class="clab">Sfide inviate</p>${out.map(g=>`<div class="crow">${av(other(g))}<span><b>${E(nameOf(other(g)))}</b><small>${kind(g)} · in attesa</small></span><button class="btn ghost sm" data-can="${g.id}">Annulla</button></div>`).join('')}`:''}
  ${!data.length?'<p class="muted small">Nessuna partita in corso. Sfida qualcuno qui accanto!</p>':''}`;
 qa('[data-acc]',b).forEach(x=>x.onclick=async()=>{x.disabled=true;try{const g=await rpc('chess_respond',{p_id:x.dataset.acc,p_accept:true});openGame(g.id)}catch(e){toast(errMsg(e),true);loadMine()}});
 qa('[data-dec]',b).forEach(x=>x.onclick=async()=>{try{await rpc('chess_respond',{p_id:x.dataset.dec,p_accept:false})}catch(e){toast(errMsg(e),true)}loadMine()});
 qa('[data-can]',b).forEach(x=>x.onclick=async()=>{try{await rpc('chess_cancel',{p_id:x.dataset.can})}catch(e){toast(errMsg(e),true)}loadMine()});
 qa('[data-open]',b).forEach(x=>x.onclick=e=>{e.preventDefault();openGame(x.dataset.open)})}
async function renderRank(mode){const b=q('#crank');if(!b)return;const R=await loadRatings(true);const L=R[mode],placed=L.filter(r=>r.games>=5),cal=L.filter(r=>r.games<5);
 const row=r=>`<li class="rk-row${r.discord_id===myDid?' me':''}"><span class="rk-n">${r.pos===1?kingIco():r.pos||'–'}</span>${av(r.discord_id)}<span class="rk-t"><b>${E(nameOf(r.discord_id))}${r.streak>=2?` <span class="cstreak" title="${r.streak} vittorie di fila">🔥 ${r.streak}</span>`:''}</b><small>${r.wins} V · ${r.losses} S · ${r.draws} P${r.games<5?` · calibrazione ${r.games}/5`:''}</small></span><span class="rk-a">${r.games<5?'<small class="muted">?</small>':fmtN(r.elo)}<small> ELO</small></span></li>`;
 b.innerHTML=`<div class="chead"><h3>Classifica ELO</h3><div class="cseg sm" id="crm"><button data-v="live" class="${mode==='live'?'on':''}">Dal vivo</button><button data-v="corr" class="${mode==='corr'?'on':''}">Per corrispondenza</button></div></div>
  ${placed.length?`<ol class="rk-list crk">${placed.slice(0,50).map(row).join('')}</ol>`:'<p class="muted small">Ancora nessuno in classifica: servono 5 partite ranked per avere un ELO.</p>'}
  ${cal.length?`<p class="clab">In calibrazione</p><ol class="rk-list crk cal">${cal.map(row).join('')}</ol>`:''}
  <p class="muted tiny">Si parte da 1200. Le prime 5 partite ranked servono a trovare il tuo ELO (si sale e si scende di più). Poi conta chi batti: battere uno più forte vale di più.
  Vincere di fila contro la stessa persona vale sempre meno (metà, un quarto, quasi niente) e la streak 🔥 con lei si allunga solo dopo 3 ore. Il 1° di ogni classifica ha il re con i colori di Staskys.
  In classifica generale ogni classifica scacchi conta come un minigioco: 10 punti se sei calibrato, +50/+30/+20 per il podio, +5 in top 10.</p>`;
 qa('#crm button',b).forEach(x=>x.onclick=()=>renderRank(x.dataset.v))}
async function renderArchive(mine){const b=q('#carch');if(!b)return;
 let qy=A.sb.from('chess_games').select('id,mode,ranked,white_did,black_did,result,reason,ended_at,moves,elo').eq('status','over').order('ended_at',{ascending:false}).limit(30);
 if(mine&&me)qy=qy.or(`white.eq.${me.id},black.eq.${me.id}`);const {data}=await qy;
 b.innerHTML=`<div class="chead"><h3>Archivio partite</h3>${me?`<div class="cseg sm" id="cam"><button data-v="0" class="${mine?'':'on'}">Tutte</button><button data-v="1" class="${mine?'on':''}">Le mie</button></div>`:''}</div>
 ${(data||[]).length?`<div class="carl">${data.map(g=>`<a class="carow" href="?g=${g.id}" data-open="${g.id}"><span class="carp"><b class="${g.result==='1-0'?'win':''}">${E(nameOf(g.white_did))}</b><i>${g.result==='1-0'?'1–0':g.result==='0-1'?'0–1':'½–½'}</i><b class="${g.result==='0-1'?'win':''}">${E(nameOf(g.black_did))}</b></span><small>${g.mode==='live'?'⏱️':'✉️'} ${g.ranked?'Ranked':'Amichevole'} · ${Math.ceil((g.moves||[]).length/2)} mosse · ${E(REASON[g.reason]||g.reason||'')} · ${new Date(g.ended_at).toLocaleDateString('it-IT',{day:'numeric',month:'short'})}</small><span class="chip">Rivedi →</span></a>`).join('')}</div>`:'<p class="muted small">Ancora nessuna partita finita.</p>'}`;
 qa('#cam button',b).forEach(x=>x.onclick=()=>renderArchive(x.dataset.v==='1'));qa('[data-open]',b).forEach(x=>x.onclick=e=>{e.preventDefault();openGame(x.dataset.open)})}

/* ================= PARTITA ================= */
let pre=null,anim=null,fast=localStorage.chess_fast==='1',chatRoom='p',lastRole='',ping=0;
let ch=null,ply=0,flip=false,sel=null,marks=new Set(),arrows=[],rdown=null,drag=null,lastSig='',chat=[],chatMuted=localStorage.chess_chat_muted==='1',combo={w:0,b:0},lowWarned=false,startPlayed='',analysis=null,pvMode=null;
const myColor=()=>!G||!me?null:G.white===me.id?'w':G.black===me.id?'b':null;
const isPlayer=()=>!!(G&&me&&(G.challenger===me.id||G.opponent===me.id));
const roleKey=()=>!G?'':(isPlayer()?'p'+myColor():'s')+(G.white||'');
const specTalk=()=>!!G&&!G.ranked&&!Object.values(G.spec_talk_off||{}).some(v=>v===true);
function rebuild(){ch=new Chess(G.start_fen);const H=[];for(const u of G.moves||[]){try{H.push(ch.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]}))}catch(e){break}}return H}
let HIST=[];
async function openGame(id){stopGame();view='game';document.body.classList.add('cplaying');scrollTo(0,0);history.replaceState(null,'','?g='+id);G=null;analysis=null;pvMode=null;combo={w:0,b:0};
 root.innerHTML='<p class="muted">Carico la partita…</p>';
 try{G=await rpc('chess_get',{p_id:id})}catch(e){root.innerHTML=`<p class="muted">${E(errMsg(e))}</p><a class="btn sm" href="scacchi.html">← Scacchi</a>`;return}
 await loadRatings();HIST=rebuild();ply=HIST.length;flip=myColor()==='b';buildGame();apply(G,true);
 lastRole=roleKey();if(me)loadChat();SND.simple=fast;document.body.classList.toggle('cfast',fast);
 try{chan=A.sb.channel('partita-'+id).on('postgres_changes',{event:'UPDATE',schema:'public',table:'chess_games',filter:'id=eq.'+id},p=>apply(p.new))
  .on('postgres_changes',{event:'INSERT',schema:'public',table:'chess_chat',filter:'game_id=eq.'+id},p=>addChat(p.new)).subscribe()}catch(e){}
 if(lobbyChan)try{lobbyChan.track({did:myDid,name:A.me().name,playing:id})}catch(e){}
 clearInterval(timer);let n=0;timer=setInterval(()=>{n++;tickClock();const st=G&&G.status;
  const rt=chan&&chan.state==='joined',mine=G.fen&&myColor()===G.fen.split(' ')[1];
  const quick=['voting','coin','tiebreak','invite'].includes(st)||(st==='active'&&G.mode==='live'&&now()<Date.parse(G.turn_since)+1500);
  /* PATCH 5.1: ogni 5 secondi al massimo (serve anche a dire al server "ci sono": chi sparisce per 75 s perde) */
  const every=quick?3:st==='active'?(G.mode==='live'?(rt?20:mine?10:4):40):0;
  if(every&&n%every===0)poll()},250)}
function stopGame(){clearInterval(timer);if(chan){try{A.sb.removeChannel(chan)}catch(e){}chan=null}hideLofi(true)}
let polling=false,pollN=0;async function poll(){if(polling||!G)return;polling=true;try{apply(await rpc('chess_get',{p_id:G.id}));if(me&&!(chan&&chan.state==='joined')&&++pollN%2===0)loadChat(true)}catch(e){}polling=false}
function buildGame(){const pl=isPlayer();
 root.innerHTML=`<div class="cgame" id="cgame">
  <div class="cboard-col">
   <div class="cbar top" id="pbTop"></div>
   <div class="cbwrap"><div class="cevalbar" id="ceval" hidden><i></i><b></b></div><div class="cboard" id="cb"></div><svg class="carrows" id="carr" viewBox="0 0 8 8" preserveAspectRatio="none"></svg><div class="cover" id="cover" hidden></div></div>
   <div class="cbar bot" id="pbBot"></div>
   <div class="cnav"><button data-nav="first" title="Inizio">⏮</button><button data-nav="prev" title="Indietro">◀</button><button data-nav="next" title="Avanti">▶</button><button data-nav="last" title="Ultima mossa">⏭</button><button data-nav="flip" title="Gira la scacchiera">⇅</button><button data-nav="full" id="cfull" title="Schermo intero (F)">⛶</button></div>
  </div>
  <aside class="cside">
   <div class="card cpanel"><div class="cstatus" id="cstat"></div><div class="cmoves" id="cmv"></div><div class="cverd" id="cverd" hidden></div><div class="cacts" id="cact"></div></div>
   <div class="card cpanel" id="canal" hidden></div>
   <div class="card cpanel cwatch" id="cwatch" hidden></div>
   <div class="card cpanel cchat" id="cchat" ${me?'':'hidden'}><div class="chead"><h4 id="cchath">Chat della partita</h4><button class="chip" id="cmute"></button></div><div class="ctabs" id="ctabs" hidden></div><div class="cmsgs" id="cmsgs"></div><form id="cform"><input id="cin" maxlength="300" placeholder="${pl?'Scrivi all\'avversario…':'Scrivi…'}" autocomplete="off"><button class="btn sm">Invia</button></form><div id="ctalk"></div></div>
   <div class="ctools">
    <div class="cvolw"><button class="cvico" id="csnd" title="Suoni"></button><input type="range" class="crange" id="cvol" min="0" max="1" step=".05" value="${SND.vol}" aria-label="Volume suoni"></div>
    <select class="chip csel" id="cpack" title="Tipo di suoni">${Object.entries(SND.PACKS).map(([k,n])=>`<option value="${k}" ${SND.pack===k?'selected':''}>🔊 ${n}</option>`).join('')}</select>
    <button class="chip" id="clofi">🎧 Lofi</button><button class="chip${fast?' on':''}" id="cfast" title="Toglie animazioni, effetti, sfocature, lofi e combo">⚡ Modalità veloce</button><a class="chip" href="scacchi.html" id="cback">← Lobby</a></div>
  </aside></div>`;
 q('#cback').onclick=e=>{e.preventDefault();exitFull();history.replaceState(null,'','scacchi.html');lobby()};
 qa('.cnav button').forEach(b=>b.onclick=()=>nav(b.dataset.nav));
 const sndL=()=>{const v=SND.muted?0:SND.vol;q('#csnd').textContent=SND.muted?'🔇':v<.34?'🔈':v<.67?'🔉':'🔊';paintRange(q('#cvol'),SND.muted?0:SND.vol)};sndL();
 q('#csnd').onclick=()=>{SND.muted=!SND.muted;sndL();SND.unlock()};q('#cvol').oninput=e=>{SND.vol=e.target.value;if(SND.muted&&+e.target.value>0)SND.muted=false;sndL();SND.unlock()};
 q('#cvol').onchange=()=>SND.move();
 q('#cpack').onchange=e=>{SND.pack=e.target.value;SND.unlock();SND.capture(3)};
 q('#clofi').onclick=toggleLofi;if(!fast&&localStorage.chess_lofi==='1')showLofi(false);
 q('#cfast').onclick=()=>{fast=!fast;localStorage.chess_fast=fast?'1':'0';SND.simple=fast;document.body.classList.toggle('cfast',fast);q('#cfast').classList.toggle('on',fast);if(fast)hideLofi(true);toast(fast?'⚡ Modalità veloce: niente animazioni, effetti, lofi e combo':'Modalità veloce spenta')};
 const muteL=()=>{q('#cmute').textContent=chatMuted?'🔕 Chat silenziata':'🔔 Silenzia';q('#cchat').classList.toggle('muted-chat',chatMuted)};muteL();
 q('#cmute').onclick=()=>{chatMuted=!chatMuted;localStorage.chess_chat_muted=chatMuted?'1':'0';muteL();renderChat()};
 q('#cform').onsubmit=async e=>{e.preventDefault();const i=q('#cin'),t=i.value.trim();if(!t)return;i.value='';try{await rpc('chess_chat_send',{p_id:G.id,p_body:t,p_room:isPlayer()?'p':chatRoom});loadChat()}catch(er){toast(errMsg(er),true)}};
 boardEvents();
 document.onfullscreenchange=()=>{const g=q('#cgame');if(g)g.classList.toggle('cfs',!!document.fullscreenElement||g.classList.contains('cfs-fb'))};
 if(!buildGame.k){buildGame.k=1;addEventListener('keydown',navKey)}}
/* PATCH 5.1: barre del volume colorate */
function paintRange(el,v){if(el)el.style.setProperty('--v',Math.round((+v)*100)+'%')}
/* PATCH 5.1: schermo intero (tasto ⛶ o F, Esc per uscire) */
function toggleFull(){const g=q('#cgame');if(!g)return;if(document.fullscreenElement||g.classList.contains('cfs-fb')){exitFull();return}
 if(g.requestFullscreen)g.requestFullscreen().catch(()=>{g.classList.add('cfs','cfs-fb')});else g.classList.add('cfs','cfs-fb')}
function exitFull(){const g=q('#cgame');if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});if(g)g.classList.remove('cfs','cfs-fb')}
function navKey(e){if(view!=='game'||/INPUT|TEXTAREA|SELECT/.test(document.activeElement&&document.activeElement.tagName||''))return;
 if(e.key==='Escape'){if(pre){pre=null;sel=null;drawBoard()}const g=q('#cgame');if(g&&g.classList.contains('cfs-fb'))exitFull()}
 if((e.key==='f'||e.key==='F')&&!e.ctrlKey&&!e.metaKey&&!e.altKey){toggleFull();e.preventDefault();return}if(e.key==='ArrowLeft'){nav('prev');e.preventDefault()}if(e.key==='ArrowRight'){nav('next');e.preventDefault()}}
function nav(k){if(k==='full'){toggleFull();return}if(k==='flip'){flip=!flip;drawBoard();drawBars();return}pvMode=null;const n=HIST.length;const was=ply;ply=k==='first'?0:k==='prev'?Math.max(0,ply-1):k==='next'?Math.min(n,ply+1):n;sel=null;if(k==='next'&&ply===was+1&&HIST[ply-1])anim=HIST[ply-1];drawBoard();drawMoves();drawAnal();
 if(k==='next'&&ply>0){const m=HIST[ply-1];m.captured?SND.capture(1):SND.move()}}

/* applica lo stato del server */
function apply(g,first){if(!g||!G||g.id!==G.id)return;
 if(g.status==='voting'&&g.vote&&!g.vote.dl&&isPlayer()&&!(g.vote.ready||{})[me.id]&&readySent!==g.id){readySent=g.id;rpc('chess_ready',{p_id:g.id}).then(apply,()=>{readySent=''})}const prevMoves=(G.moves||[]).length,prevStatus=G.status;
 if(!first&&Date.parse(g.updated_at)<Date.parse(G.updated_at))return;
 const hadColors=!!G.white_did;G={...G,...g};const n=(G.moves||[]).length;if(!hadColors&&G.white_did&&myColor())flip=myColor()==='b';
 if(n!==HIST.length||first){const atEnd=ply>=HIST.length;HIST=rebuild();if(atEnd||first)ply=HIST.length;
  if(!first&&n>prevMoves)afterMoveFx(HIST[n-1],n-1)}
 if(!first&&prevStatus!=='over'&&G.status==='over'){const mc=myColor(),win=G.result==='1/2-1/2'?null:(G.result==='1-0')===(mc==='w');SND.end(mc?win:null);loadRatings(true).then(drawBars)}
 if(G.status==='active'&&startPlayed!==G.id&&now()>=Date.parse(G.turn_since)-200&&prevStatus!=='active'&&!first){startPlayed=G.id;SND.start()}
 /* PATCH 5.1: sostituzione giocatore ⇄ spettatore: se il mio ruolo cambia ricostruisco la pagina */
 const rk=roleKey();if(!first&&rk!==lastRole){const was=lastRole;lastRole=rk;sel=null;pre=null;if(myColor())flip=myColor()==='b';buildGame();if(me)loadChat();
  if(was.startsWith('s')&&isPlayer()){SND.notify();toast('🔄 Ora giochi tu!')}else if(was.startsWith('p')&&!isPlayer())toast('🔄 Ora guardi la partita da spettatore')}
 if(G.status!=='active')pre=null;
 drawAll();
 /* PATCH 5.1: pre-mossa: parte appena tocca a te, se è ancora valida */
 if(pre&&G.status==='active'&&myColor()===G.fen.split(' ')[1]&&ply===HIST.length&&now()>=Date.parse(G.turn_since)){const pm=pre;pre=null;
  const c=posAt(HIST.length),ok=c.moves({square:pm.from,verbose:true}).find(m=>m.to===pm.to);if(ok)send(pm.from+pm.to+(ok.promotion?(pm.promo||'q'):''));else drawBoard()}}
function afterMoveFx(m,i,noAnim){if(!m)return;const side=m.color;if(!noAnim)anim=m;
 if(m.captured){combo[side]=(combo[side]||0)+1;SND.capture(combo[side]);if(combo[side]>=2)comboFx(combo[side],m.to)}else{combo[side]=0;m.flags.includes('k')||m.flags.includes('q')?SND.castle():SND.move()}
 if(m.san.includes('+'))setTimeout(SND.check,120)}
function comboFx(n,sq){const b=q('#cb');if(!b||fast)return;const el=document.createElement('div');el.className='ccombo l'+Math.min(n,5);el.textContent=['','','DOPPIA!','TRIPLA!','QUADRUPLA!','MASSACRO!'][Math.min(n,5)]+(n>5?' ×'+n:'');
 const [x,y]=sqXY(sq);el.style.left=(x+.5)*12.5+'%';el.style.top=(y+.5)*12.5+'%';b.appendChild(el);setTimeout(()=>el.remove(),1400)}
function drawAll(){drawBars();drawBoard();drawMoves();drawStatus();drawActs();drawOverlay();drawAnal();drawWatch();if(me&&G){const t=JSON.stringify([G.spec_talk_off||{},G.status,G.white]);if(t!==drawAll.t){drawAll.t=t;renderChat()}}}

/* ---------- scacchiera ---------- */
const FILES='abcdefgh';
const sqXY=sq=>{let x=FILES.indexOf(sq[0]),y=8-+sq[1];if(flip){x=7-x;y=7-y}return[x,y]};
const xySq=(x,y)=>{if(flip){x=7-x;y=7-y}return FILES[x]+(8-y)};
function posAt(n){const c=new Chess(G.start_fen);for(let i=0;i<n&&i<HIST.length;i++)c.move(HIST[i].san);return c}
/* PATCH 5.1: pre-mosse (solo dal vivo, quando tocca all'altro) */
const preOn=c=>!pvMode&&G.mode==='live'&&G.status==='active'&&ply===HIST.length&&!!myColor()&&myColor()!==c.turn();
function preLegal(sq){const mc=myColor(),f=G.fen.split(' ');f[1]=mc;f[3]='-';let L=[];
 try{const c=new Chess(f.join(' '));L=c.moves({square:sq,verbose:true}).map(m=>({from:m.from,to:m.to,promotion:m.promotion}));
  const p=c.get(sq);if(p&&p.type==='p'){const dir=mc==='w'?1:-1,r=+sq[1]+dir,fi=FILES.indexOf(sq[0]);[fi-1,fi+1].forEach(x=>{if(x<0||x>7||r<1||r>8)return;const t=FILES[x]+r,o=c.get(t);if(!o&&!L.some(m=>m.to===t))L.push({from:sq,to:t,promotion:(r===8||r===1)?'q':undefined})})}}catch(e){}
 return L}
let animDone='';
function playAnim(b,m){if(fast||!m)return;const k=m.from+m.to+'@'+ply;if(animDone===k)return;animDone=k;
 const mv=(from,to)=>{const el=q(`[data-sq="${to}"] svg`,b);if(!el||!el.animate)return;const [fx,fy]=sqXY(from),[tx,ty]=sqXY(to);
  const W=b.clientWidth/8;el.animate([{transform:`translate(${(fx-tx)*W}px,${(fy-ty)*W}px)`},{transform:'translate(0,0)'}],{duration:110,easing:'cubic-bezier(.2,.7,.3,1)'})};
 mv(m.from,m.to);
 if(m.flags&&(m.flags.includes('k')||m.flags.includes('q'))){const r=m.from[1];m.flags.includes('k')?mv('h'+r,'f'+r):mv('a'+r,'d'+r)}
 if(m.captured){const sqEl=q(`[data-sq="${m.to}"]`,b);if(sqEl){const fx=document.createElement('i');fx.className='cburst';fx.innerHTML='<b></b><b></b><b></b><b></b><b></b><b></b>';sqEl.appendChild(fx);setTimeout(()=>fx.remove(),520)}}}
function drawBoard(){const b=q('#cb');if(!b)return;const c=pvMode?pvMode.c:posAt(ply),last=pvMode?pvMode.last:HIST[ply-1],inCheck=c.inCheck(),turn=c.turn();
 const live=!pvMode&&ply===HIST.length&&G.status==='active'&&myColor()===turn&&now()>=Date.parse(G.turn_since);
 const pm=preOn(c);if(!pm&&!live&&pre&&G.status!=='active')pre=null;
 const legal=sel&&live?c.moves({square:sel,verbose:true}):sel&&pm?preLegal(sel):[];
 const topDid=isTop(G.white_did,G.mode)?'w':isTop(G.black_did,G.mode)?'b':'';
 let h='';for(let y=0;y<8;y++)for(let x=0;x<8;x++){const sq=xySq(x,y),p=c.get(sq),dark=(x+y)%2===1;
  const cls=['csq',dark?'d':'l'];if(last&&(sq===last.from||sq===last.to))cls.push('last');if(sel===sq)cls.push('sel');if(marks.has(sq))cls.push('mark');if(pre&&(sq===pre.from||sq===pre.to))cls.push('pre');
  if(inCheck&&p&&p.type==='k'&&p.color===turn)cls.push('chk');const mv=legal.find(m=>m.to===sq);if(mv)cls.push(p?'mvcap':'mvdot');
  h+=`<div class="${cls.join(' ')}" data-sq="${sq}">${y===7?`<i class="cf">${sq[0]}</i>`:''}${x===0?`<i class="cr">${sq[1]}</i>`:''}${p?PZ.svg(p.color,p.type,{staskys:p.type==='k'&&p.color===topDid}):''}</div>`}
 b.innerHTML=h;b.classList.toggle('mine',live||pm);if(q('#cstat')&&G.status==='active')drawStatus();b.classList.toggle('premode',pm);
 if(anim&&!pvMode){const a=anim;anim=null;if(last&&a.from===last.from&&a.to===last.to)playAnim(b,a)}
 drawArrows()}
function drawArrows(){const s=q('#carr');if(!s)return;let h='<defs><marker id="ah" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="rgba(255,120,40,.85)"/></marker><marker id="ahg" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="rgba(34,197,94,.9)"/></marker></defs>';
 const line=(a,b,g)=>{const [x1,y1]=sqXY(a),[x2,y2]=sqXY(b),dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy),ex=x2+.5-dx/L*.38,ey=y2+.5-dy/L*.38;
  return`<line x1="${x1+.5}" y1="${y1+.5}" x2="${ex}" y2="${ey}" stroke="${g?'rgba(34,197,94,.85)':'rgba(255,120,40,.8)'}" stroke-width=".17" stroke-linecap="round" marker-end="url(#${g?'ahg':'ah'})"/>`};
 arrows.forEach(([a,b])=>h+=line(a,b));
 const an=bestArrow();if(an)h+=line(an[0],an[1],true);
 s.innerHTML=h}
function sqFromEvent(e){const b=q('#cb').getBoundingClientRect(),x=Math.floor((e.clientX-b.left)/b.width*8),y=Math.floor((e.clientY-b.top)/b.height*8);return x<0||y<0||x>7||y>7?null:xySq(x,y)}
function boardEvents(){const b=q('#cb'),w=q('.cbwrap');w.addEventListener('contextmenu',e=>e.preventDefault());
 b.addEventListener('pointerdown',e=>{const sq=sqFromEvent(e);if(!sq)return;SND.unlock();
  if(e.button===2){if(pre||(sel&&preOn(posAt(ply)))){pre=null;sel=null;drawBoard();rdown=null;return}rdown=sq;return}
  if(e.button!==0)return;if(marks.size||arrows.length){marks.clear();arrows=[];drawArrows();qa('.csq.mark',b).forEach(x=>x.classList.remove('mark'))}
  const c=posAt(ply),p=c.get(sq),mc=myColor(),live=ply===HIST.length&&G.status==='active'&&mc===c.turn()&&!pvMode;
  if(!live&&preOn(c)){/* pre-mossa */
   if(sel&&sel!==sq){const t=preLegal(sel).find(m=>m.to===sq);if(t){pre={from:sel,to:sq,promo:t.promotion?'q':''};sel=null;drawBoard();return}}
   if(p&&p.color===mc){pre=null;sel=sq;drawBoard();const el=q(`[data-sq="${sq}"] svg`,b);if(el){drag={sq,el,x0:e.clientX,y0:e.clientY,moved:false,pre:true};b.setPointerCapture&&b.setPointerCapture(e.pointerId)}}
   else{sel=null;drawBoard()}return}
  if(!live)return;
  if(sel&&sel!==sq&&tryMove(sel,sq))return;
  if(p&&p.color===mc){sel=sq;drawBoard();const el=q(`[data-sq="${sq}"] svg`,b);if(el){drag={sq,el,x0:e.clientX,y0:e.clientY,moved:false};el.setPointerCapture&&b.setPointerCapture(e.pointerId)}}
  else{sel=null;drawBoard()}});
 b.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x0,dy=e.clientY-drag.y0;if(Math.abs(dx)+Math.abs(dy)>4)drag.moved=true;
  const el=q(`[data-sq="${drag.sq}"] svg`,b);if(el){el.style.transform=`translate(${dx}px,${dy}px) scale(1.12)`;el.style.zIndex=9}});
 b.addEventListener('pointerup',e=>{if(e.button===2&&rdown){const sq=sqFromEvent(e);if(sq){if(sq===rdown){marks.has(sq)?marks.delete(sq):marks.add(sq);q(`[data-sq="${sq}"]`,b).classList.toggle('mark')}
   else{const i=arrows.findIndex(a=>a[0]===rdown&&a[1]===sq);i>=0?arrows.splice(i,1):arrows.push([rdown,sq]);drawArrows()}}rdown=null;return}
  if(!drag)return;const d=drag;drag=null;const sq=sqFromEvent(e);
  if(d.pre){if(d.moved&&sq&&sq!==d.sq){const t=preLegal(d.sq).find(m=>m.to===sq);if(t)pre={from:d.sq,to:sq,promo:t.promotion?'q':''};sel=null}drawBoard();return}
  if(d.moved&&sq&&sq!==d.sq){dragDrop=true;const ok=tryMove(d.sq,sq);dragDrop=false;if(!ok)drawBoard()}else{const el=q(`[data-sq="${d.sq}"] svg`,b);if(el)el.style.transform=''}})}
function tryMove(from,to){const c=posAt(ply);const L=c.moves({square:from,verbose:true}).filter(m=>m.to===to);if(!L.length)return false;
 if(L.length>1||L[0].promotion){promo(from,to);return true}send(from+to);return true}
function promo(from,to){const o=q('#cover'),mc=myColor();o.hidden=false;o.innerHTML=`<div class="cpromo"><p>Promuovi a</p>${['q','r','b','n'].map(t=>`<button data-p="${t}">${PZ.svg(mc,t)}</button>`).join('')}<button class="chip" data-p="">Annulla</button></div>`;
 qa('[data-p]',o).forEach(b=>b.onclick=()=>{o.hidden=true;o.innerHTML='';if(b.dataset.p)send(from+to+b.dataset.p);else{sel=null;drawBoard()}})}
let dragDrop=false;
async function send(uci){sel=null;const nd=dragDrop;const c=posAt(HIST.length);let m;try{m=c.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]})}catch(e){return}
 /* subito sulla scacchiera, poi conferma del server */
 const keep=G;G={...G,moves:[...G.moves,uci],fen:c.fen(),turn_since:new Date(now()).toISOString()};HIST.push(m);ply=HIST.length;afterMoveFx(m,0,nd);if(nd)animDone=m.from+m.to+'@'+ply;drawAll();
 try{const r=await rpc('chess_move',{p_id:keep.id,p_uci:uci});G=keep;apply(r,false);HIST=rebuild();ply=HIST.length;drawAll()}
 catch(e){toast(errMsg(e),true);G=keep;HIST=rebuild();ply=HIST.length;drawAll();poll()}}

/* ---------- barre giocatori, orologi, materiale ---------- */
function material(c){const cnt={w:{},b:{}};let s=0;c.board().flat().forEach(p=>{if(!p)return;cnt[p.color][p.type]=(cnt[p.color][p.type]||0)+1;s+=(p.color==='w'?1:-1)*VAL[p.type]});
 const START={p:8,n:2,b:2,r:2,q:1};const lost=col=>Object.entries(START).flatMap(([t,n])=>Array(Math.max(0,n-(cnt[col][t]||0))).fill(t));return{diff:s,lostW:lost('w'),lostB:lost('b')}}
function clockMs(side){if(G.mode!=='live'||G.wms==null)return null;let ms=side==='w'?G.wms:G.bms;const turn=G.fen.split(' ')[1];
 if(G.status==='active'&&turn===side&&(G.moves||[]).length>=2)ms-=Math.max(0,now()-Date.parse(G.turn_since));return Math.max(0,ms)}
/* PATCH 5.1: tempo per la prima mossa (30 s, poi la partita si annulla) e avversario disconnesso (perde dopo 75 s senza segnale) */
const firstLeft=()=>G&&G.mode==='live'&&G.status==='active'&&(G.moves||[]).length<2?Date.parse(G.turn_since)+30000-now():null;
function discLeft(side){if(!G||G.mode!=='live'||G.status!=='active'||(G.moves||[]).length<2)return null;const uid=side==='w'?G.white:G.black;if(!uid||(me&&uid===me.id))return null;
 const st=Date.parse(G.started_at||G.turn_since),seen=Math.max(Date.parse((G.seen||{})[uid]||0)||0,st);if(now()-seen<15000)return null;return Math.max(0,seen+75000-now())}
const fmtMs=ms=>{if(ms==null)return'';const s=ms/1000;if(s<60)return s.toFixed(1).replace('.',',')+' s';const m=Math.floor(s/60);return m+':'+String(Math.floor(s%60)).padStart(2,'0')};
const fmtClock=ms=>{if(ms==null)return'';const s=ms/1000;if(s<10)return s.toFixed(1);const m=Math.floor(s/60),r=Math.floor(s%60);return m+':'+String(r).padStart(2,'0')};
function corrLeft(){const left=Date.parse(G.turn_since)+3*864e5-now();if(left<=0)return'scaduto';const d=Math.floor(left/864e5),h=Math.floor(left%864e5/36e5),m=Math.floor(left%36e5/6e4);return d?`${d}g ${h}h`:h?`${h}h ${m}m`:`${m}m`}
function drawBars(){if(!q('#pbTop'))return;const bottom=flip?'b':'w',top=bottom==='w'?'b':'w',c=posAt(ply),mat=material(c);
 const bar=(side,el)=>{let did=side==='w'?G.white_did:G.black_did;if(!G.white_did){did=side===top?(G.challenger===(me&&me.id)?G.opponent_did:G.challenger_did):(me&&isPlayer()?myDid:G.opponent_did)}if(!did){el.innerHTML='';return}const turn=G.status==='active'&&G.fen.split(' ')[1]===side;
  const lost=side==='w'?mat.lostB:mat.lostW,adv=side==='w'?mat.diff:-mat.diff,d=G.elo&&G.elo[side];
  el.innerHTML=`${av(did)}<span class="cpn"><b>${E(nameOf(did))}${isTop(did,G.mode)?' '+kingIco():''}</b><small>${G.ranked?E(String(eloOf(did,G.mode))):'Amichevole'}${d&&d.delta!=null?` <em class="${d.delta>=0?'up':'down'}">${d.delta>=0?'+':''}${d.delta}</em>`:''}</small>
   <span class="ccap">${lost.map(t=>`<i>${PZ.svg(side==='w'?'b':'w',t)}</i>`).join('')}${adv>0?`<em>+${adv}</em>`:''}</span></span>
   <span class="cdisc" data-disc="${side}" hidden></span><span class="cclock${turn?' on':''}" data-side="${side}">${G.mode==='live'?fmtClock(clockMs(side)):turn?'⏳ '+corrLeft():''}</span>`;
  el.classList.toggle('turn',turn)};
 bar(top,q('#pbTop'));bar(bottom,q('#pbBot'));tickExtra()}
function tickExtra(){qa('[data-disc]').forEach(el=>{const l=discLeft(el.dataset.disc);el.hidden=l==null;if(l!=null)el.textContent=`⚠️ Disconnesso · perde tra ${Math.ceil(l/1000)}s`});
 const f=q('#cfirst');if(f){const l=firstLeft();if(l==null)f.remove();else f.textContent=Math.max(0,Math.ceil(l/1000))+'s'}}
function tickClock(){if(!G||view!=='game')return;if(++ping%4===0){tickExtra();const fl=firstLeft();if(fl!=null&&fl<-1500&&ping%8===0)poll();const dl=[discLeft('w'),discLeft('b')].filter(x=>x!=null);if(dl.some(x=>x===0)&&ping%8===0)poll()}qa('.cclock').forEach(el=>{const s=el.dataset.side;if(G.mode==='live'){const ms=clockMs(s);el.textContent=fmtClock(ms);el.classList.toggle('low',ms!=null&&ms<20000);
  if(G.status==='active'&&ms===0)poll();if(s===myColor()&&ms!=null&&ms<20000&&!lowWarned&&G.status==='active'&&G.fen.split(' ')[1]===s){lowWarned=true;SND.low()}}});
 const ov=q('#cover');if(ov&&!ov.hidden){const bar=q('.cdl i',ov);if(bar){const dl=+bar.dataset.dl,tot=+bar.dataset.tot;const left=Math.max(0,dl-now());bar.style.width=(left/tot*100)+'%';const t=q('.cdl b',ov);if(t)t.textContent=Math.ceil(left/1000)+'s'}
  if(G.coin&&G.coin.res&&ovSig==='coinres'+G.coin.res&&now()>=Date.parse(G.coin.at)+3800)drawOverlay();const cd=q('[data-start]',ov);if(cd){const left=Date.parse(G.turn_since)-now();if(left<=0)drawOverlay();else cd.textContent=Math.ceil(left/1000)}}}

/* ---------- mosse, stato, pulsanti ---------- */
function drawMoves(){const b=q('#cmv');if(!b)return;let h='';for(let i=0;i<HIST.length;i+=2){h+=`<span class="mn">${i/2+1}.</span>${[i,i+1].map(j=>HIST[j]?`<button class="mv${ply===j+1?' cur':''}" data-ply="${j+1}">${clsIco(j)}${E(HIST[j].san)}${G.move_ms&&G.move_ms[j]!=null?`<small class="mt">${fmtMs(G.move_ms[j])}</small>`:''}</button>`:'<span></span>').join('')}`}
 b.innerHTML=h||'<span class="muted small">Ancora nessuna mossa.</span>';qa('[data-ply]',b).forEach(x=>x.onclick=()=>{pvMode=null;ply=+x.dataset.ply;drawBoard();drawMoves();drawAnal()});const c=q('.mv.cur',b);if(c){const t=c.offsetTop-b.offsetTop;if(t<b.scrollTop||t>b.scrollTop+b.clientHeight-30)b.scrollTop=t-b.clientHeight/2}}
function drawStatus(){const b=q('#cstat');if(!b)return;const mc=myColor(),turn=G.fen.split(' ')[1],W=nameOf(G.white_did),B=nameOf(G.black_did);let t='';
 const kind=`${G.mode==='live'?'⏱️ Dal vivo'+(G.tc_base?` · ${G.tc_base/60}${G.tc_inc?' | '+G.tc_inc:' min'}`:''):'✉️ Per corrispondenza · 3 giorni a mossa'} · ${G.ranked?'🏆 Ranked':'🤝 Amichevole'}`;
 if(G.status==='over'||G.status==='aborted'){const r=G.result;t=G.status==='aborted'?(G.reason==='prima mossa'?'Partita annullata · nessuna prima mossa in 30 secondi':'Partita annullata'):r==='1/2-1/2'?`Patta ${E(REASON[G.reason]||'')}`:`Vince <b>${E(r==='1-0'?W:B)}</b> ${E(REASON[G.reason]||'')}`}
 else if(G.status==='active')t=mc?(turn===mc?'<b>Tocca a te</b>':`Tocca a ${E(turn==='w'?W:B)}`):`Tocca al ${turn==='w'?'bianco':'nero'}`;
 else if(G.status==='invite')t='In attesa che la sfida venga accettata';else if(['voting','coin','tiebreak'].includes(G.status))t='Si sceglie il tempo…';else t=E(G.status);
 if(G.status==='active'&&posAt(HIST.length).inCheck())t+=' · <em class="cchk">Scacco!</em>';
 const fl=firstLeft();if(fl!=null&&now()>=Date.parse(G.turn_since))t+=` <span class="cfirstw">${turn===mc?'Fai la prima mossa':'Prima mossa'} entro <b id="cfirst">${Math.max(0,Math.ceil(fl/1000))}s</b> · il tempo parte dopo</span>`;
 if(pre)t+=` <span class="cprew">Pre-mossa pronta ${pre.from}→${pre.to} <small>(Esc o tasto destro per annullare)</small></span>`;
 b.innerHTML=`<small class="muted">${kind}</small><p>${t}</p>${G.status==='over'&&G.ranked&&G.elo&&G.elo.w?`<small class="muted">ELO: ${E(W)} ${G.elo.w.delta>=0?'+':''}${G.elo.w.delta} · ${E(B)} ${G.elo.b.delta>=0?'+':''}${G.elo.b.delta}${G.elo.repeat?` · vittoria n° ${G.elo.repeat+1} di fila contro la stessa persona (×${G.elo.factor})`:''}</small>`:''}`}
function drawActs(){const b=q('#cact');if(!b)return;const mc=myColor();if(!mc){b.innerHTML=G.status==='over'?'<button class="btn sm" id="cana">🔎 Analizza con Stockfish</button>':'';bindAna();return}
 const n=HIST.length,c=posAt(n),mat=material(c).diff*(mc==='w'?1:-1),turn=c.turn();
 if(G.status==='active'||['voting','coin','tiebreak'].includes(G.status)){
  const canAbort=n<2,offer=G.draw_offer&&G.draw_offer!==me.id,mine=G.draw_offer===me.id;
  let drawOk=true,drawWhy='';if(G.ranked&&G.mode==='live'){const w=clockMs('w'),bb=clockMs('b');if(w>=300000||bb>=300000){drawOk=false;drawWhy='Nelle ranked la patta si chiede solo quando a tutti e due restano meno di 5 minuti'}}
  else if(G.ranked&&n<80){drawOk=false;drawWhy='Nelle ranked per corrispondenza la patta si chiede dopo 40 mosse'}
  const resOk=!G.ranked||mat<=-6;
  b.innerHTML=G.status!=='active'?(canAbort?'<button class="btn ghost sm" id="cabort">Annulla partita</button>':''):`${offer?`<div class="coffer">🤝 ${E(nameOf(mc==='w'?G.black_did:G.white_did))} propone la patta <button class="btn sm" id="cdacc">Accetta</button><button class="btn ghost sm" id="cddec">No</button></div>`:''}
   ${canAbort?'<button class="btn ghost sm" id="cabort">Annulla partita</button>':''}
   <button class="btn ghost sm" id="cdraw" ${drawOk&&!mine?'':'disabled'} title="${E(drawWhy)}">${mine?'Patta proposta…':'½ Proponi patta'}</button>
   <button class="btn ghost sm" id="cres" ${resOk?'':'disabled'} title="${resOk?'':'Nelle ranked puoi arrenderti solo quando sei sotto di almeno 6 punti di materiale'}">🏳️ Arrenditi</button>
   ${!resOk||!drawOk?`<p class="muted tiny">${!resOk?`Resa: nelle ranked solo se sei sotto di 6 punti di materiale (ora ${mat>0?'+':''}${mat}). `:''}${!drawOk&&!canAbort?E(drawWhy)+'.':''}</p>`:''}`;
  const act=(id,fn)=>{const x=q('#'+id,b);if(x)x.onclick=fn};
  act('cabort',async()=>{if(!confirm('Annullare la partita? Non conta per l\'ELO.'))return;try{apply(await rpc('chess_abort',{p_id:G.id}))}catch(e){toast(errMsg(e),true)}});
  act('cdraw',async()=>{try{apply(await rpc('chess_draw',{p_id:G.id,p_action:'offer'}));toast('Patta proposta')}catch(e){toast(errMsg(e),true)}});
  act('cdacc',async()=>{try{apply(await rpc('chess_draw',{p_id:G.id,p_action:'accept'}))}catch(e){toast(errMsg(e),true)}});
  act('cddec',async()=>{try{apply(await rpc('chess_draw',{p_id:G.id,p_action:'decline'}))}catch(e){toast(errMsg(e),true)}});
  act('cres',async()=>{if(!confirm('Vuoi davvero arrenderti?'))return;try{apply(await rpc('chess_resign',{p_id:G.id}))}catch(e){toast(errMsg(e),true)}});
 }else if(G.status==='over'||G.status==='aborted'){const opp=G.challenger===me.id?G.opponent_did:G.challenger_did;
  b.innerHTML=`${G.status==='over'?'<button class="btn sm" id="cana">🔎 Analizza con Stockfish</button>':''}<button class="btn ghost sm" id="crev">↻ Rivincita</button>`;
  q('#crev',b).onclick=async()=>{try{const g=await rpc('chess_challenge',{p_did:opp,p_mode:G.mode,p_ranked:G.ranked});pingInvite(opp,g.id);toast('Rivincita inviata a '+nameOf(opp));openGame(g.id)}catch(e){toast(errMsg(e),true)}};bindAna()}
 else b.innerHTML=''}

/* ---------- finestre sopra la scacchiera: voto, moneta, spareggio, inizio, risultato ---------- */
let ovSig='';
function drawOverlay(){const o=q('#cover');if(!o)return;const st=G.status,mid=me&&me.id,other=G.challenger===mid?G.opponent:G.challenger,oDid=G.challenger===mid?G.opponent_did:G.challenger_did;
 const dl=(t,tot)=>`<div class="cdl"><i data-dl="${Date.parse(t)}" data-tot="${tot}"></i><b></b></div>`;
 let h='',sig=st+JSON.stringify([G.vote,G.coin,G.tiebreak,G.turn_since]);
 if(!isPlayer()&&st!=='invite'){if(['voting','coin','tiebreak'].includes(st))h='<div class="cmodal"><h3>Stanno scegliendo il tempo…</h3></div>'}
 else if(st==='invite')h=`<div class="cmodal"><h3>${G.challenger===mid?'Sfida inviata':'Ti hanno sfidato!'}</h3><p class="muted">${G.challenger===mid?`Aspetto che ${E(nameOf(oDid))} accetti…`:`${E(nameOf(oDid))} vuole giocare.`}</p>${G.challenger===mid?'<button class="btn ghost sm" data-x="cancel">Annulla sfida</button>':'<button class="btn sm" data-x="acc">Accetta</button> <button class="btn ghost sm" data-x="dec">Rifiuta</button>'}</div>`;
 else if(st==='voting'&&!(G.vote||{}).dl)h=`<div class="cmodal"><p class="label">Sfida accettata</p><h3>Aspetto ${E(nameOf(oDid))}…</h3><p class="muted small">Il voto del tempo (5 secondi) parte appena siete qui tutti e due.</p></div>`;
 else if(st==='voting'){const v=G.vote||{},mine=v.v&&v.v[mid],r=+v.r||1,prev=v.prev||{};
  h=`<div class="cmodal cvote"><p class="label">${r===2?'Secondo voto':'Voto del tempo'}</p><h3>${r===2?'Non eravate d\'accordo: rivotate!':'Quanto tempo?'}</h3>
   ${r===2?`<p class="muted small">${prev[mid]||prev[other]?`Tu: <b>${E(tcName(prev[mid]))}</b> · ${E(nameOf(oDid))}: <b>${E(tcName(prev[other]))}</b>.`:'Nessuno ha votato in tempo.'} Se non vi accordate decide ${G.ranked?'testa o croce':'testa o croce o un minigioco'}.</p>`:'<p class="muted small">Avete 5 secondi. Se scegliete uguale si parte subito.</p>'}
   <div class="ctcs">${TCS.map(([k,n,d])=>`<button data-tc="${k}" class="${mine===k?'on':''}" ${mine?'disabled':''}><b>${n}</b><small>${d}</small></button>`).join('')}</div>
   ${mine?`<p class="small">Hai votato <b>${E(tcName(mine))}</b>. Aspetto ${E(nameOf(oDid))}…</p>`:''}${dl(v.dl,5000)}</div>`;sig+=mine}
 else if(st==='coin'){const c=G.coin||{},res=c.res,mine=c.picks&&c.picks[mid];
  if(!res)h=`<div class="cmodal"><p class="label">Testa o croce</p><h3>${c.for==='minigame'?'Avete scelto minigiochi diversi':'Ancora in disaccordo!'}</h3><p class="muted small">Chi sceglie per primo si prende il lato. Chi vince decide ${c.for==='minigame'?'il minigioco':'il tempo'}.</p>
   <div class="ccoinpick"><button data-coin="testa">${coinFace('testa')}<b>Testa</b></button><button data-coin="croce">${coinFace('croce')}<b>Croce</b></button></div>${dl(c.dl,8000)}</div>`;
  else{const wm=c.winner===mid;h=`<div class="cmodal"><p class="label">Testa o croce</p><div class="ccoin flip-${res}" id="ccoin"><div class="f t">${coinFace('testa')}</div><div class="f c">${coinFace('croce')}</div></div>
   <h3 class="cres" style="animation-delay:2.4s">Esce ${res.toUpperCase()}!</h3><p class="cres small" style="animation-delay:2.6s">${mine?`Tu avevi <b>${E(mine)}</b>${c.first===mid?' (hai scelto per primo)':''}. `:''}${wm?'Hai vinto tu':'Vince '+E(nameOf(oDid))}: ${c.for==='minigame'?'si gioca a '+E((TB_GAMES[(G.tiebreak.games||{})[c.winner]]||['?'])[0]):'si gioca '+E(tcName((G.vote.last||{})[c.winner]||'10+0'))}.</p></div>`;
   if(ovSig!==sig)SND.coin()}}
 else if(st==='tiebreak'){const t=G.tiebreak||{};
  if(t.stage==='how'){const mine=t.how&&t.how[mid];h=`<div class="cmodal"><p class="label">Amichevole</p><h3>Come decidete il tempo?</h3><p class="muted small">Se tutti e due scegliete il minigioco, vi sfidate lì. Altrimenti testa o croce.</p>
   <div class="ctcs two"><button data-how="coin" class="${mine==='coin'?'on':''}" ${mine?'disabled':''}><b>🪙 Testa o croce</b></button><button data-how="minigame" class="${mine==='minigame'?'on':''}" ${mine?'disabled':''}><b>🎮 Sfida a un minigioco</b></button></div>${dl(t.dl,8000)}</div>`;sig+=mine}
  else if(t.stage==='pick'){const mine=t.games&&t.games[mid];h=`<div class="cmodal"><p class="label">Spareggio</p><h3>Quale minigioco?</h3><p class="muted small">Se scegliete giochi diversi decide testa o croce. I punteggi valgono anche nelle classifiche dei minigiochi!</p>
   <div class="ctbg">${Object.entries(TB_GAMES).map(([k,[n,d,i]])=>`<button data-tbg="${k}" class="${mine===k?'on':''}" ${mine?'disabled':''}><span>${i}</span><b>${n}</b><small>${d}</small></button>`).join('')}</div>${dl(t.dl,12000)}</div>`;sig+=mine}
  else if(t.stage==='play'){const g=TB_GAMES[t.game]||['?','',''],res=t.res||{},mine=res[mid],his=res[other];
   h=`<div class="cmodal"><p class="label">Spareggio · ${E(g[2])} ${E(g[0])}</p><h3>${E(g[1])}</h3>
    <p class="small">Tu: ${mine?'<b>fatto ✓</b>':'da giocare'} · ${E(nameOf(oDid))}: ${his?'<b>fatto ✓</b>':'sta giocando…'}</p>
    ${mine?'<p class="muted small">Aspetto l\'altro…</p>':`<a class="btn sm" target="_blank" rel="noopener" href="giochi.html?duello=${G.id}&gioco=${t.game}">Gioca ora →</a><p class="muted tiny">Si apre in un'altra scheda: quando finisci torna qui. Hai 10 minuti.</p>`}${dl(t.dl,600000)}</div>`}
  else h='<div class="cmodal"><h3>Spareggio finito</h3></div>'}
 else if(st==='active'&&G.coin&&G.coin.res&&now()<Date.parse(G.coin.at)+3800&&!(G.moves||[]).length){const c=G.coin,res=c.res,mine=c.picks&&c.picks[mid],wm=c.winner===mid;sig='coinres'+res;
  h=`<div class="cmodal"><p class="label">Testa o croce</p><div class="ccoin flip-${res}"><div class="f t">${coinFace('testa')}</div><div class="f c">${coinFace('croce')}</div></div><h3 class="cres" style="animation-delay:2.3s">Esce ${res.toUpperCase()}!</h3><p class="cres small" style="animation-delay:2.5s">${mine?`Tu avevi <b>${E(mine)}</b>${c.first===mid?' (hai scelto per primo)':''}. `:''}${wm?'Hai vinto tu':'Vince '+E(nameOf(oDid))}: si gioca <b>${E(tcName((G.vote.last||{})[c.winner]||'10+0'))}</b>.</p></div>`;if(ovSig!==sig)SND.coin()}
 else if(st==='active'&&now()<Date.parse(G.turn_since)){const tc=G.tc_base?`${G.tc_base/60}${G.tc_inc?' | '+G.tc_inc:' minuti'}`:'';
  h=`<div class="cmodal"><p class="label">Si parte!</p><h3 class="cbig" data-start>${Math.ceil((Date.parse(G.turn_since)-now())/1000)}</h3>${G.tiebreak&&G.tiebreak.winner?`<p class="small">🎮 Spareggio a ${E((TB_GAMES[G.tiebreak.game]||['?'])[0])} vinto da <b>${G.tiebreak.winner===mid?'te':E(nameOf(oDid))}</b>${G.tiebreak.res?` (${Object.entries(G.tiebreak.res).map(([u,r])=>(u===mid?'tu ':E(nameOf(oDid))+' ')+(G.tiebreak.game==='reaction'?r.s+' ms':G.tiebreak.game==='snake'||G.tiebreak.game==='flappy'?Math.round(r.d/100)/10+' s':r.s)).join(' · ')})`:''}</p>`:''}<p class="small">${tc?'Tempo: <b>'+E(tc)+'</b> · ':''}${myColor()?`Hai il <b>${myColor()==='w'?'bianco':'nero'}</b>`:''}</p></div>`}
 else if(G.status==='over'&&isPlayer()&&HIST.length&&ovSig.startsWith('active')){h='';}
 if(sig===ovSig&&!!h===!o.hidden)return;ovSig=sig;
 o.hidden=!h;o.innerHTML=h;
 const on=(sel,fn)=>qa(sel,o).forEach(b=>b.onclick=()=>fn(b));
 on('[data-tc]',async b=>{qa('[data-tc]',o).forEach(x=>x.disabled=true);b.classList.add('on');try{apply(await rpc('chess_vote',{p_id:G.id,p_tc:b.dataset.tc}))}catch(e){toast(errMsg(e),true);poll()}});
 on('[data-coin]',async b=>{qa('[data-coin]',o).forEach(x=>x.disabled=true);try{apply(await rpc('chess_coin_pick',{p_id:G.id,p_side:b.dataset.coin}))}catch(e){toast(errMsg(e),true);poll()}});
 on('[data-how]',async b=>{try{apply(await rpc('chess_tiebreak',{p_id:G.id,p_what:'how',p_value:b.dataset.how}))}catch(e){toast(errMsg(e),true);poll()}});
 on('[data-tbg]',async b=>{try{apply(await rpc('chess_tiebreak',{p_id:G.id,p_what:'game',p_value:b.dataset.tbg}))}catch(e){toast(errMsg(e),true);poll()}});
 on('[data-x]',async b=>{try{const x=b.dataset.x;apply(x==='cancel'?await rpc('chess_cancel',{p_id:G.id}):await rpc('chess_respond',{p_id:G.id,p_accept:x==='acc'}))}catch(e){toast(errMsg(e),true);poll()}})}
const tcName=k=>(TCS.find(t=>t[0]===k)||[0,k||'—'])[1];
function coinFace(s){return s==='testa'?'<span class="cface t"><img src="assets/icon.png" alt=""></span>':`<span class="cface c">${PZ.svg('w','k')}</span>`}

/* ---------- chat ---------- */
async function loadChat(quiet){if(!me||!G)return;const {data}=await A.sb.from('chess_chat').select('*').eq('game_id',G.id).order('id').limit(300);const L=data||[];if(quiet&&L.length===chat.length)return;
 const roomNow=myRoom();if(quiet&&L.length>chat.length&&!chatMuted){const nw=L.slice(chat.length);if(nw.some(m=>m.user_id!==me.id&&(m.room||'p')===roomNow))SND.tick()}chat=L;renderChat()}
function addChat(m){if(chat.some(x=>x.id===m.id))return;chat.push(m);renderChat();if(!chatMuted&&m.user_id!==me.id&&(m.room||'p')===myRoom())SND.tick()}
/* PATCH 5.1: stanze della chat. 'p' = con i giocatori, 's' = solo spettatori */
function myRoom(){if(isPlayer())return'p';if(!specTalk())return's';return chatRoom}
function renderChat(){const b=q('#cmsgs');if(!b||!me||!G)return;const pl=isPlayer(),room=myRoom(),talk=specTalk();
 const h=q('#cchath');if(h)h.textContent=pl?'Chat della partita':room==='s'?'Chat degli spettatori':'Chat con i giocatori';
 const tb=q('#ctabs');if(tb){tb.hidden=pl||!talk;if(!pl&&talk){tb.innerHTML=`<button class="chip${room==='p'?' on':''}" data-room="p">💬 Con i giocatori</button><button class="chip${room==='s'?' on':''}" data-room="s">👀 Spettatori</button>`;qa('[data-room]',tb).forEach(x=>x.onclick=()=>{chatRoom=x.dataset.room;renderChat()})}}
 const tk=q('#ctalk');if(tk){if(pl&&!G.ranked&&['active','voting','coin','tiebreak'].includes(G.status)){const off=!!(G.spec_talk_off||{})[me.id];
   tk.innerHTML=`<button class="chip${off?'':' on'}" id="cstalk" title="Puoi decidere da solo: se lo spegni gli spettatori scrivono solo nella loro chat">${off?'🔇 Gli spettatori non possono scriverci':'👀 Gli spettatori possono scriverci'}</button>${!off&&!talk?'<small class="muted tiny"> (l\'avversario li ha già silenziati)</small>':''}`;
   q('#cstalk').onclick=async()=>{try{apply(await rpc('chess_spec_talk',{p_id:G.id,p_off:!off}))}catch(e){toast(errMsg(e),true)}}}
  else if(pl&&G.ranked)tk.innerHTML='<small class="muted tiny">Ranked: gli spettatori hanno una chat tutta loro.</small>';
  else if(!pl&&G.ranked)tk.innerHTML='<small class="muted tiny">Nelle ranked gli spettatori non scrivono ai giocatori.</small>';else tk.innerHTML=''}
 const inp=q('#cin');if(inp)inp.placeholder=pl?'Scrivi…':room==='s'?'Scrivi agli altri spettatori…':'Scrivi ai giocatori…';
 if(chatMuted){b.innerHTML='<p class="muted small">Chat silenziata: non vedi i messaggi.</p>';return}
 const players=[G.challenger,G.opponent];
 b.innerHTML=chat.filter(m=>(m.room||'p')===room).map(m=>`<p class="${m.user_id===me.id?'mine':''}${players.includes(m.user_id)?'':' spec'}"><b>${players.includes(m.user_id)?'':'👀 '}${E(m.user_id===me.id?'Tu':nameOf(m.discord_id))}</b> ${E(m.body)}</p>`).join('')||`<p class="muted small">${pl?'Scrivi qualcosa al tuo avversario 👋':'Nessun messaggio ancora.'}</p>`;b.scrollTop=b.scrollHeight}

/* ---------- PATCH 5.1: chi sta guardando + sostituzioni (amichevoli) ---------- */
function drawWatch(){const b=q('#cwatch');if(!b)return;const W=(G.watchers||[]).filter(Boolean),pl=isPlayer(),act=G.status==='active';
 const subs=G.subs||[],used=+((G.subs_used||{})[myDid]||0),canSub=act&&!G.ranked&&me;
 const name=d=>E(nameOf(d));let h='';
 /* richieste in sospeso */
 subs.forEach(r=>{if(r.by_spec&&r.player===myDid&&pl)h+=`<div class="coffer csub">🔄 <b>${name(r.spec)}</b> vuole giocare al tuo posto <button class="btn sm" data-sa="${r.id}">Accetta</button><button class="btn ghost sm" data-sd="${r.id}">No</button></div>`;
  else if(!r.by_spec&&r.spec===myDid)h+=`<div class="coffer csub">🔄 <b>${name(r.player)}</b> ti offre il suo posto in partita <button class="btn sm" data-sa="${r.id}">Gioca</button><button class="btn ghost sm" data-sd="${r.id}">No</button></div>`;
  else if((r.by_spec&&r.spec===myDid)||(!r.by_spec&&r.player===myDid))h+=`<p class="muted small">⏳ Richiesta di sostituzione inviata a ${name(r.by_spec?r.player:r.spec)}…</p>`});
 if(!W.length&&!h){b.hidden=true;b.innerHTML='';return}b.hidden=false;
 const pend=d=>subs.some(r=>(r.spec===myDid&&r.player===d)||(r.player===myDid&&r.spec===d));
 b.innerHTML=`<h4>👀 Stanno guardando <span class="cwn">${W.length}</span></h4>${h}<div class="cwl">${W.map(d=>`<div class="cwr">${av(d)}<span>${name(d)}${d===myDid?' <small class="muted">(tu)</small>':''}</span>${canSub&&pl&&d!==myDid&&!pend(d)?`<button class="chip" data-offer="${E(d)}" title="La partita continua dalla stessa posizione con lo stesso tempo">Fai giocare al mio posto</button>`:''}</div>`).join('')||'<p class="muted small">Nessuno</p>'}</div>
  ${canSub&&!pl&&W.includes(myDid)?`<div class="csubq"><small class="muted">Sostituisci un giocatore (te ne restano ${Math.max(0,2-used)} su 2):</small>${[G.white_did,G.black_did].map(d=>`<button class="chip" data-ask="${E(d)}" ${used>=2||subs.some(r=>r.spec===myDid)?'disabled':''}>Chiedi di sostituire ${name(d)}</button>`).join('')}</div>`:''}`;
 const go=(fn)=>async x=>{try{const r=await fn();if(r&&r.id)apply(r);else poll()}catch(e){toast(errMsg(e),true)}};
 qa('[data-offer]',b).forEach(x=>x.onclick=()=>go(()=>rpc('chess_sub_request',{p_id:G.id,p_did:x.dataset.offer}))().then(()=>toast('Proposta inviata')));
 qa('[data-ask]',b).forEach(x=>x.onclick=()=>go(()=>rpc('chess_sub_request',{p_id:G.id,p_did:x.dataset.ask}))().then(()=>toast('Richiesta inviata')));
 qa('[data-sa]',b).forEach(x=>x.onclick=()=>go(()=>rpc('chess_sub_answer',{p_req:+x.dataset.sa,p_accept:true}))());
 qa('[data-sd]',b).forEach(x=>x.onclick=()=>go(()=>rpc('chess_sub_answer',{p_req:+x.dataset.sd,p_accept:false}))())}

/* ---------- PATCH 5.1: musica lofi senza YouTube (brani CC0 nel sito, in ordine casuale, infinita) ---------- */
const LOFI=[['autumn','Autumn','HoliznaCC0'],['clouds','Clouds','HoliznaCC0'],['creature-comforts','Creature Comforts','HoliznaCC0'],['foggy-headed','Foggy Headed','HoliznaCC0'],['glad-to-be-stuck-inside','Glad To Be Stuck Inside','HoliznaCC0'],['morning-coffee','Morning Coffee','HoliznaCC0'],['new-shoes','New Shoes','HoliznaCC0'],['plants','Plants','HoliznaCC0'],['ramen','Ramen','HoliznaCC0'],['vintage','Vintage','HoliznaCC0'],['wifi-trasherino','WiFi Trasherino','Sudocolon']];
let lofiA=null,lofiQ=[],lofiCur=null;
const lofiVol=()=>{const v=parseFloat(localStorage.chess_lofi_vol);return isNaN(v)?.5:v};
function lofiNext(){if(!lofiQ.length){lofiQ=LOFI.map((_,i)=>i).sort(()=>Math.random()-.5);if(lofiCur!=null&&lofiQ[0]===lofiCur)lofiQ.push(lofiQ.shift())}
 lofiCur=lofiQ.shift();const t=LOFI[lofiCur];if(!lofiA){lofiA=new Audio();lofiA.preload='none';lofiA.onended=lofiNext;lofiA.onerror=()=>setTimeout(lofiNext,800)}
 lofiA.src='assets/lofi/'+t[0]+'.mp3';lofiA.volume=lofiVol();lofiA.play().catch(()=>{});lofiUI()}
function lofiUI(){const d=q('#clofip');if(!d)return;const t=lofiCur!=null?LOFI[lofiCur]:null;q('.ltrack',d).innerHTML=t?`<b>${E(t[1])}</b><small>${E(t[2])} · CC0</small>`:'';
 q('[data-l="pp"]',d).textContent=lofiA&&!lofiA.paused?'⏸':'▶';const v=lofiVol();q('.cvico',d).textContent=v===0?'🔇':v<.34?'🔈':v<.67?'🔉':'🔊';paintRange(q('.crange',d),v)}
function showLofi(play){if(fast){toast('Spegni la modalità veloce per la lofi');return}let d=q('#clofip');
 if(!d){d=document.createElement('div');d.id='clofip';d.innerHTML=`<div class="lhead"><span>🎧 Lofi · musica infinita</span><button aria-label="Chiudi" data-l="x">×</button></div>
  <div class="ltrack"></div><div class="lctl"><button data-l="pp" title="Play / pausa">▶</button><button data-l="nx" title="Prossimo brano">⏭</button>
  <div class="cvolw"><button class="cvico" data-l="mu" title="Muto"></button><input type="range" class="crange" min="0" max="1" step=".05" value="${lofiVol()}" aria-label="Volume lofi"></div></div>
  <small class="muted tiny">Brani CC0 (pubblico dominio) · <a href="assets/lofi/LICENZE.md" target="_blank" rel="noopener">licenze</a></small>`;document.body.appendChild(d);
  q('[data-l="x"]',d).onclick=()=>hideLofi();q('[data-l="nx"]',d).onclick=()=>lofiNext();
  q('[data-l="pp"]',d).onclick=()=>{if(!lofiA||lofiCur==null){lofiNext();return}lofiA.paused?lofiA.play().catch(()=>{}):lofiA.pause();setTimeout(lofiUI,50)};
  let lastV=lofiVol()||.5;q('[data-l="mu"]',d).onclick=()=>{const v=lofiVol();if(v>0)lastV=v;const nv=v>0?0:lastV;localStorage.chess_lofi_vol=nv;q('.crange',d).value=nv;if(lofiA)lofiA.volume=nv;lofiUI()};
  q('.crange',d).oninput=e=>{localStorage.chess_lofi_vol=e.target.value;if(lofiA)lofiA.volume=+e.target.value;lofiUI()}}
 const b=q('#clofi');if(b)b.classList.add('on');localStorage.chess_lofi='1';
 if(play!==false&&(!lofiA||lofiA.paused))lofiA&&lofiCur!=null?lofiA.play().catch(()=>{}):lofiNext();lofiUI()}
function toggleLofi(){if(q('#clofip')){hideLofi();return}showLofi(true)}
function hideLofi(keepPref){const d=q('#clofip');if(d)d.remove();if(lofiA)lofiA.pause();const b=q('#clofi');if(b)b.classList.remove('on');if(!keepPref)localStorage.chess_lofi='0'}

/* ---------- ANALISI (Stockfish nel browser) ---------- */
let SF=null;
function bindAna(){const b=q('#cana');if(b)b.onclick=runAnalysis}
const winPct=cp=>50+50*(2/(1+Math.exp(-0.00368208*cp))-1);
const evCp=e=>e==null?0:e.mate!=null?(e.mate>0?10000-e.mate*10:-10000-e.mate*10):e.cp;
const CLS={geniale:['!!','#1baaa6','Geniale'],grande:['!','#5c8bb0','Grande mossa'],migliore:['★','#22c55e','Miglior mossa'],buona:['✓','#77915f','Buona'],
 imprecisione:['?!','#f7c045','Imprecisione'],errore:['?','#e6912c','Errore'],mancata:['✕','#ff7769','Mossa mancata'],blunder:['??','#fa412d','Blunder'],libro:['📖','#a88865','Da manuale']};
function clsIco(j){if(!analysis||!analysis.data[j])return'';const c=CLS[analysis.data[j].c];return c?`<i class="mcls" style="background:${c[1]}" title="${c[2]}">${c[0]}</i>`:''}
function bestArrow(){if(!analysis||pvMode||ply<1)return null;const a=analysis.data[ply-1];if(!a||!a.b||a.c==='migliore'||a.c==='geniale'||a.c==='grande'||a.c==='libro')return null;return[a.b.slice(0,2),a.b.slice(2,4)]}
function engine(){if(SF)return SF;const w=new Worker('assets/vendor/stockfish/stockfish-19-lite-single.js');let cb=null;
 w.onmessage=e=>{const l=String(e.data||'');if(cb)cb(l)};const send=c=>w.postMessage(c);
 SF={w,send,on:f=>cb=f};send('uci');send('setoption name MultiPV value 2');send('isready');return SF}
function evalPos(fen,depth){return new Promise(res=>{const S=engine();let info={},info2={};S.on(l=>{
  if(l.startsWith('info')&&l.includes(' pv ')){const mp=+(l.match(/multipv (\d+)/)||[0,1])[1],sc=l.match(/score (cp|mate) (-?\d+)/),pv=l.split(' pv ')[1];
   if(sc){const o={[sc[1]]:+sc[2],pv};if(mp===1)info=o;else info2=o}}
  else if(l.startsWith('bestmove')){res({best:l.split(' ')[1],e:info,e2:info2})}});
 S.send('position fen '+fen);S.send('go depth '+depth)})}
function isSacrifice(cAfter,m){/* il pezzo appena mosso può essere mangiato perdendo materiale? */
 if(m.piece==='p'||m.piece==='k')return false;const opp=cAfter.moves({verbose:true}).filter(x=>x.to===m.to);if(!opp.length)return false;
 const cheapest=Math.min(...opp.map(x=>VAL[x.piece]||0)),v=VAL[m.piece]+(0);const gained=m.captured?VAL[m.captured]:0;
 const defended=(()=>{const c2=new Chess(cAfter.fen());const t=opp[0];try{c2.move(t)}catch(e){return false}return c2.moves({verbose:true}).some(x=>x.to===m.to)})();
 return v-gained>=2&&(!defended||cheapest<v)}
async function runAnalysis(){const box=q('#canal');box.hidden=false;const b=q('#cana');if(b)b.disabled=true;
 const n=HIST.length,depth=n>90?10:12;box.innerHTML=`<h4>Analisi di Stockfish</h4><div class="cprog"><i style="width:0"></i></div><p class="muted small" id="caprog">Stockfish gira sul tuo computer: ci vuole un po'…</p>`;
 const c=new Chess(G.start_fen),fens=[c.fen()];HIST.forEach(m=>{c.move(m.san);fens.push(c.fen())});
 const ev=[];for(let i=0;i<fens.length;i++){const cc=new Chess(fens[i]);if(cc.isGameOver()){ev.push({best:null,e:cc.isCheckmate()?{mate:0}:{cp:0},e2:{}});continue}
  ev.push(await evalPos(fens[i],depth));const p=Math.round((i+1)/fens.length*100);q('.cprog i',box).style.width=p+'%';q('#caprog',box).textContent=`Mossa ${i}/${n} · ${p}%`}
 /* valutazioni dal punto di vista del bianco */
 const W=i=>{const e=ev[i].e,side=new Chess(fens[i]).turn();if(e.mate===0)return side==='w'?-10000:10000;const v=evCp(e);return side==='w'?v:-v};
 const data=[];let accS={w:[],b:[]};
 for(let i=0;i<n;i++){const m=HIST[i],side=m.color,before=W(i),after=W(i+1),sgn=side==='w'?1:-1,wb=winPct(before*sgn),wa=winPct(after*sgn),loss=Math.max(0,wb-wa);
  const best=ev[i].best,isBest=best&&best===m.from+m.to+(m.promotion||'');let cls;
  const second=ev[i].e2&&(ev[i].e2.cp!=null||ev[i].e2.mate!=null)?winPct(evCp(ev[i].e2)):null,firstW=winPct(evCp(ev[i].e));
  if(i<6&&loss<3)cls='libro';
  else if(isBest||loss<1){const sac=isSacrifice(new Chess(fens[i+1]),m);
   if(sac&&wa>=50&&wb<97)cls='geniale';else if(isBest&&second!=null&&firstW-second>=15&&wa>=40)cls='grande';else cls='migliore'}
  else if(loss<5)cls='buona';
  else{const prev=data[i-1];const missed=prev&&['errore','blunder','mancata'].includes(prev.c)&&wb>=65;
   cls=missed&&loss>=10?'mancata':loss<10?'imprecisione':loss<20?'errore':'blunder'}
  const acc=Math.max(0,Math.min(100,103.1668*Math.exp(-0.04354*loss)-3.1669));accS[side].push(acc);
  data.push({c:cls,b:best||null,e:after,pv:isBest?null:(ev[i].e.pv||'').split(' ').slice(0,8).join(' ')})}
 const avg=L=>L.length?Math.round(L.reduce((a,b)=>a+b,0)/L.length*10)/10:null;
 analysis={data,acc_w:avg(accS.w),acc_b:avg(accS.b),ev:fens.map((f,i)=>W(i))};
 drawMoves();drawBoard();drawAnal();
 if(me&&(isPlayer()||true))A.sb.rpc('chess_save_analysis',{p_id:G.id,p_data:data,p_acc_w:analysis.acc_w,p_acc_b:analysis.acc_b,p_depth:depth}).then(()=>{},()=>{})}
async function loadSavedAnalysis(){if(!G||G.status!=='over')return;const {data}=await A.sb.from('chess_analysis').select('*').eq('game_id',G.id).order('created_at',{ascending:false}).limit(1);
 if(data&&data[0]&&Array.isArray(data[0].data)){const d=data[0].data;analysis={data:d,acc_w:+data[0].acc_w,acc_b:+data[0].acc_b,ev:[0,...d.map(x=>x.e)]};q('#canal').hidden=false;drawMoves();drawBoard();drawAnal()}}
function drawAnal(){const box=q('#canal'),bar=q('#ceval'),vb=q('#cverd');if(!box||!analysis){if(bar)bar.hidden=true;if(vb)vb.hidden=true;return}box.hidden=false;bar.hidden=false;
 const e=pvMode?pvMode.e:(analysis.ev[ply]||0),pct=Math.max(3,Math.min(97,winPct(e)));q('i',bar).style.height=(100-pct)+'%';
 q('b',bar).textContent=Math.abs(e)>=9000?'M':(e>0?'+':'')+(e/100).toFixed(1);bar.classList.toggle('flip',flip);
 const cnt=s=>{const o={};analysis.data.forEach((d,i)=>{if((i%2===0)===(s==='w'))o[d.c]=(o[d.c]||0)+1});return o},cw=cnt('w'),cb=cnt('b');
 const a=ply>0?analysis.data[ply-1]:null,m=HIST[ply-1];
 box.innerHTML=`<h4>Analisi di Stockfish</h4><div class="cacc"><div><b>${analysis.acc_w??'–'}%</b><small>${E(nameOf(G.white_did))}</small></div><span>Precisione</span><div><b>${analysis.acc_b??'–'}%</b><small>${E(nameOf(G.black_did))}</small></div></div>
  <table class="ctab">${Object.entries(CLS).map(([k,[i,c,n]])=>`<tr><td>${cw[k]||0}</td><td><i class="mcls" style="background:${c}">${i}</i> ${n}</td><td>${cb[k]||0}</td></tr>`).join('')}</table>`;
 /* PATCH 5.1: il giudizio della mossa e "meglio era" stanno nel riquadro delle mosse, sotto la lista */
 const vh=`${a&&m?`<div class="cnow"><p><i class="mcls" style="background:${CLS[a.c][1]}">${CLS[a.c][0]}</i> <b>${E(m.san)}</b> è ${E(CLS[a.c][2].toLowerCase())}</p>
   ${a.b&&!['migliore','geniale','grande','libro'].includes(a.c)?`<p class="small">Meglio era <b class="cbest">${E(sanOf(ply-1,a.b))}</b> (freccia verde).</p><button class="chip" id="cpv">${pvMode?'⏹ Torna alla partita':'▶ Guarda perché: continuazione di Stockfish'}</button>${pvMode?`<div class="cpvnav"><button data-pv="-1">◀</button><span>${pvMode.i}/${pvMode.L.length}</span><button data-pv="1">▶</button></div><p class="muted tiny">${E(pvMode.sans.slice(0,pvMode.i).join(' '))}</p>`:''}`:''}</div>`:'<p class="muted small">Scorri le mosse con ◀ ▶ (o le frecce della tastiera) per vedere il giudizio di ogni mossa.</p>'}`;
 if(vb){vb.hidden=false;vb.innerHTML=vh}else box.insertAdjacentHTML('beforeend',vh);const host=vb||box;
 const pv=q('#cpv',host);if(pv)pv.onclick=()=>{if(pvMode){pvMode=null}else{const L=(a.pv||a.b).split(' ').filter(Boolean),c=posAt(ply-1),sans=[];const t=new Chess(c.fen());for(const u of L){try{sans.push(t.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]}).san)}catch(e){break}}
  pvMode={L:L.slice(0,sans.length),sans,i:0,base:ply-1,c,last:null,e:analysis.ev[ply-1]};stepPv(1)}drawBoard();drawAnal()};
 qa('[data-pv]',host).forEach(x=>x.onclick=()=>{stepPv(+x.dataset.pv);drawBoard();drawAnal()})}
function stepPv(d){const p=pvMode;p.i=Math.max(0,Math.min(p.L.length,p.i+d));const c=posAt(p.base);let last=null;for(let i=0;i<p.i;i++){const u=p.L[i];last=c.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]})}p.c=c;p.last=last;if(last)last.captured?SND.capture(1):SND.move()}
function sanOf(i,u){try{return posAt(i).move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]}).san}catch(e){return u}}

/* ---------- avvio ---------- */
A.ready.then(async()=>{me=A.user||null;myDid=me?A.profile(me).discord:'';if(A.sb&&me)A.loadMembers();else if(A.sb)A.loadMembers();
 if(!A.sb){root.innerHTML='<p class="muted">Scacchi in arrivo: il database non è collegato.</p>';return}
 try{if(me)A.sb.rpc('king_tick').then(()=>{},()=>{})}catch(e){}
 const gid=P.get('g');if(gid){await openGame(gid);if(G&&G.status==='over')loadSavedAnalysis()}else lobby()});
