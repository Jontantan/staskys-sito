/* Staskys — Profilo "passaporto": card colorata dall'avatar, stelle, categorie, punti e streak */
(function(){
const A=window.STASKYS,E=A.E,q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const root=q('#pf'),P=new URLSearchParams(location.search);
const GAME_NAMES={snake:'Snake',reaction:'Tempo di reazione',clicker:'Clicker veloce',flappy:'Flappy',tetris:'Tetris',dino:'Dino runner',quiz:'Quiz anime',wordle:'Wordle',2048:'2048',breakout:'Breakout',stack:'Stack',suika:'Suika',mines:'Prato fiorito',typing:'Battitura'};
const ASC=new Set(['reaction','mines','wordle']);
const fmt=n=>Number(n).toLocaleString('it-IT');
/* PUNTI (provvisorio, da confermare): 10 per ogni minigioco giocato, +50/+30/+20 per 1°/2°/3° posto, +5 se sei in top 10, +5 per ogni giorno di streak */
function points(rec,streak){return rec.reduce((s,r)=>s+10+(r.rank===1?50:r.rank===2?30:r.rank===3?20:r.rank<=10?5:0),0)+streak*5}

/* ---------- dati ---------- */
async function loadUser(did){
 const [mem,lb,ratings]=await Promise.all([
  A.loadMembers(),
  A.sb?A.sb.from('leaderboard').select('game,user_id,discord_id,username,avatar_url,score').limit(5000).then(r=>r.data||[]):[],
  A.sb?A.sb.from('media_ratings').select('kind,media_id,title,cover,year,rating,status,updated_at,user_id,username,avatar_url').eq('discord_id',did).limit(2000).then(r=>r.error?null:r.data||[]):[]]);
 const m=mem[did]||{},mine=lb.filter(r=>String(r.discord_id)===did);
 const rec=mine.map(r=>{const same=lb.filter(x=>x.game===r.game).sort((a,b)=>ASC.has(r.game)?a.score-b.score:b.score-a.score);return{game:r.game,score:r.score,rank:same.findIndex(x=>x.user_id===r.user_id)+1,of:same.length}}).sort((a,b)=>a.rank-b.rank);
 const uid=mine[0]?.user_id||(ratings&&ratings[0]?.user_id);let streak=0;
 if(uid&&A.sb){const s=await A.sb.from('streaks').select('streak,last_day').eq('user_id',uid).limit(1);const row=s.data&&s.data[0];if(row){const d=(Date.now()-new Date(row.last_day+'T00:00:00'))/864e5;streak=d<2?row.streak:0}}
 const me=A.user&&A.profile(A.user).discord===did?A.profile(A.user):null;
 return{did,nick:A.clean(m.nick||me?.name||mine[0]?.username||(ratings&&ratings[0]?.username)||'Membro'),username:m.username||'',avatar:m.avatar||me?.avatar||mine[0]?.avatar_url||(ratings&&ratings[0]?.avatar_url)||'',
  joined:m.joined||'',inServer:m.in_server!==false,rec,streak,ratings:ratings||[],dbMissing:ratings===null,isMe:!!me}}

/* dati DEMO (finti, chiaramente segnati) */
const C={fr:'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-qQTzQnEJJ3oB.jpg',jjk:'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-LHBAeoZDIsnF.jpg',csm:'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx127230-DdP4vAdssLoz.png',spy:'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx140960-Kb6R5nYQfjmP.jpg',op:'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-ELSYx3yMPcKM.jpg',
 mc:'https://media.rawg.io/media/crop/600/400/games/b4e/b4e4c73d5aa4ec66bbf75375c4847a2b.jpg',er:'https://media.rawg.io/media/crop/600/400/games/b29/b294fdd866dcdb643e7bab370a552855.jpg',rl:'https://media.rawg.io/media/crop/600/400/games/8cc/8cce7c0e99dcc43d66c8efd42f9d03e3.jpg',hk:'https://media.rawg.io/media/crop/600/400/games/27c/27cd8b7dead05a870f8a514a9a1915ad.jpg',
 dune:'https://image.tmdb.org/t/p/w342/nhdQxDCI64rMgypYZpsF7UvbdJA.jpg',inter:'https://image.tmdb.org/t/p/w342/bMKiLh0mES4Uiococ240lbbTGXQ.jpg',yn:'https://image.tmdb.org/t/p/w342/uyOd5E0dNTp2AJAJWv0V3asf31u.jpg',opp:'https://image.tmdb.org/t/p/w342/fRtaxfyynWMJI6DhejyA6JOzVTB.jpg'};
const R=(kind,id,title,cover,rating,status,year)=>({kind,media_id:id,title,cover:C[cover],rating,status,year,updated_at:'2026-11-2'+(id.length%9)});
const DEMO_USER={did:'demo',nick:'Membro demo',username:'demo_staskys',avatar:'https://cdn.discordapp.com/embed/avatars/2.png',joined:'2024-03-12',inServer:true,streak:7,isMe:false,demo:true,
 rec:[{game:'snake',score:41,rank:2,of:23},{game:'wordle',score:3,rank:1,of:12},{game:'tetris',score:2210,rank:4,of:15},{game:'flappy',score:27,rank:6,of:19},{game:'2048',score:1388,rank:9,of:14}],
 ratings:[R('anime','al154587',"Frieren: Beyond Journey's End",'fr',10,'visto',2023),R('anime','al113415','JUJUTSU KAISEN','jjk',9,'visto',2020),R('anime','al127230','Chainsaw Man','csm',8,'visto',2022),R('anime','al140960','SPY x FAMILY','spy',7,'in_corso',2022),R('anime','al21','ONE PIECE','op',null,'voglio',1999),
  R('game','rg22509','Minecraft','mc',9,'in_corso',2009),R('game','rg326243','Elden Ring','er',10,'visto',2022),R('game','rg3272','Rocket League','rl',8,'visto',2015),R('game','rg292844','Hollow Knight: Silksong','hk',null,'voglio',2025),
  R('movie','tm693134','Dune - Parte due','dune',9,'visto',2024),R('movie','tm157336','Interstellar','inter',10,'visto',2014),R('movie','tm372058','Your Name.','yn',9,'visto',2016),R('movie','tm872585','Oppenheimer','opp',null,'voglio',2023)]};
DEMO_USER.ratings.find(r=>r.media_id==='al140960').updated_at='2026-11-26';

/* ---------- vista ---------- */
const cover=(r,cls='')=>`<span class="cv ${cls}${r.kind==='game'?' wide':''}">${r.cover?`<img src="${E(r.cover)}" alt="" loading="lazy">`:`<i>${A.KINDS[r.kind].icon}</i>`}${r.rating?`<b class="rbadge">${r.rating}</b>`:''}</span>`;
function passport(u,color){
 const rated=u.ratings.filter(r=>r.rating).sort((a,b)=>b.rating-a.rating||String(b.updated_at).localeCompare(a.updated_at));
 const stars=rated.slice(0,5);
 const now=u.ratings.filter(r=>r.status==='in_corso').sort((a,b)=>String(b.updated_at).localeCompare(a.updated_at))[0];
 const pts=points(u.rec,u.streak);
 const since=u.joined?new Date(u.joined).toLocaleDateString('it-IT',{month:'long',year:'numeric'}):'';
 const kinds=Object.keys(A.KINDS);
 return`${u.demo?'<div class="demo-ribbon">DEMO · profilo di esempio con dati finti</div>':''}
 <section class="pf-wrap">
 <div class="pf-main">
  <article class="pass" style="--c:${color}">
   <div class="pass-glow" aria-hidden="true"></div>
   <header class="pass-head">
    <img class="pass-av" src="${E(u.avatar||'assets/icon.png')}" alt="" onerror="this.src='assets/icon.png'">
    <div class="pass-id"><p class="pass-label">Passaporto Staskys</p><h1>${E(u.nick)}</h1><p class="pass-sub">${u.username?'@'+E(u.username):''}${since?` · nel server da ${E(since)}`:''}${!u.inServer?' · non è più nel server':''}</p>
    ${now?`<span class="pill"><i class="live"></i>${E(A.KINDS[now.kind].verb)} <b>${E(now.title)}</b></span>`:''}</div>
    ${u.isMe?'<button class="btn ghost sm pass-out" id="logout">Esci</button>':''}
   </header>
   <dl class="pass-stats">
    <div><dt>Punti</dt><dd>${fmt(pts)}</dd></div>
    <div><dt>Streak</dt><dd>🔥 ${u.streak}</dd></div>
    <div><dt>Voti</dt><dd>${rated.length}</dd></div>
    <div><dt>Minigiochi</dt><dd>${u.rec.length}</dd></div>
   </dl>
   <div class="stars"><p class="pass-label">Le mie stelle</p>
    ${stars.length?`<div class="stars-row">${stars.map((r,i)=>`<figure class="${i?'':'big'}">${cover(r)}<figcaption>${E(r.title)}</figcaption></figure>`).join('')}${Array.from({length:Math.max(0,5-stars.length)},()=>'<figure class="empty"><span class="cv"></span></figure>').join('')}</div>`
    :`<p class="pass-empty">${u.isMe?'Vota i tuoi titoli preferiti nel <a href="catalogo.html">catalogo</a>: i 5 voti più alti finiscono qui.':'Ancora nessun voto.'}</p>`}
   </div>
  </article>

  <section class="cats">
   ${kinds.map(k=>{const L=u.ratings.filter(r=>r.kind===k),c=s=>L.filter(r=>r.status===s).length,top=L.slice().sort((a,b)=>(b.rating||0)-(a.rating||0)).slice(0,4);
    return`<a class="cat-card" href="catalogo.html?tipo=${k}"><header><span class="cat-ico">${A.KINDS[k].icon}</span><h3>${A.KINDS[k].t}</h3><b class="cat-n">${L.length}</b></header>
    <div class="cat-strip">${top.length?top.map(r=>cover(r,'sm')).join(''):'<span class="muted small">Ancora vuoto</span>'}</div>
    <div class="cat-foot"><span>${c('visto')} ${k==='game'?'giocati':'visti'}</span><span>${c('in_corso')} in corso</span><span>${c('voglio')} da ${k==='game'?'giocare':'vedere'}</span></div></a>`}).join('')}
  </section>
 </div>

 <aside class="pf-side">
  <div class="card side-card"><h3>Minigiochi</h3><p class="muted small">Record personali e posizione in classifica</p>
   ${u.rec.length?`<ol class="recs">${u.rec.map(r=>`<li><span class="rk${r.rank<=3?' top':''}">${r.rank===1?'👑':'#'+r.rank}</span><span class="rg">${E(GAME_NAMES[r.game]||r.game)}</span><b>${fmt(r.score)}</b></li>`).join('')}</ol>`:`<p class="muted small">${u.isMe?'Non hai ancora giocato. <a href="giochi.html">Vai ai giochi</a>':'Non ha ancora giocato.'}</p>`}
   <p class="muted tiny">Punti: 10 per gioco, bonus podio e top 10, +5 per giorno di streak.</p></div>
  <div class="card side-card soon"><h3>Membri simili</h3><p class="muted small">Compatibilità, gusti in comune e differenze: arrivano nella fase 2.</p>
   <div class="soon-rows"><i></i><i></i><i></i></div></div>
 </aside>
 </section>`}

function landing(members){const list=Object.entries(members).filter(([,m])=>m.in_server!==false&&m.nick).slice(0,24);
 return`<section class="page-hero"><p class="label">Profilo</p><h1>Il tuo passaporto.</h1><p class="lead">Accedi con Discord: nickname e avatar arrivano dal server Staskys, punti e streak dai minigiochi, e i voti dal catalogo.</p>
 <div class="cta" style="justify-content:flex-start">${A.READY?'<button class="btn magnetic" id="login">Accedi con Discord</button>':''}<a class="btn ghost" href="profilo.html?demo=1">Guarda un profilo demo</a></div></section>
 ${list.length?`<section class="wrap tight"><p class="label">Profili dei membri</p><div class="mgrid">${list.map(([id,m])=>`<a class="mchip" href="profilo.html?u=${E(id)}"><img src="${E(m.avatar)}" alt="" loading="lazy" onerror="this.src='assets/icon.png'"><span>${E(A.clean(m.nick))}</span></a>`).join('')}</div></section>`:''}`}

async function show(){
 let u=null;
 if(A.DEMO)u=DEMO_USER;
 else{await A.ready;const did=P.get('u')||(A.user?A.profile(A.user).discord:'');
  if(!did){const mem=await A.loadMembers();root.innerHTML=landing(mem);const b=q('#login');b&&(b.onclick=()=>A.login());return}
  u=await loadUser(did)}
 root.innerHTML=passport(u,'#555');
 const col=await A.color(u.avatar);q('.pass',root).style.setProperty('--c',col);
 const lo=q('#logout');lo&&(lo.onclick=()=>A.logout());
 document.title=u.nick+' · Staskys'}
show();document.addEventListener('staskys-auth',()=>{if(!P.get('u')&&!A.DEMO)show()});
})();
