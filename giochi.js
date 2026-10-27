/* Staskys — minigiochi (Snake, Reazione, Clicker + Flappy, Dino, Tetris, Quiz anime in giochi-*.js) con classifiche Supabase */
(function(){
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CFG=window.GIOCHI_CONFIG||{};
const READY=!!(CFG.SUPABASE_URL&&CFG.SUPABASE_ANON_KEY&&!/INCOLLA_QUI/.test(CFG.SUPABASE_URL+CFG.SUPABASE_ANON_KEY)&&window.supabase);
const sb=READY?window.supabase.createClient(CFG.SUPABASE_URL,CFG.SUPABASE_ANON_KEY,{auth:{flowType:'pkce',detectSessionInUrl:true,persistSession:true}}):null;
const GAMES={
 snake:{t:'Snake',k:'King Snake',d:'Mangia più mele possibile senza sbattere. Frecce/WASD su PC, scorri o usa i tasti su telefono.',unit:'mele',asc:false},
 reaction:{t:'Tempo di reazione',k:'King Reazione',d:'Tocca appena lo schermo diventa scuro. 3 tentativi: conta la media. Meno è meglio.',unit:'ms',asc:true,lbDesc:'tempo medio più basso',fmt:v=>v+' ms'},
 clicker:{t:'Clicker veloce',k:'King Clicker',d:'Quanti clic riesci a fare in 10 secondi? Il tempo parte al primo clic.',unit:'clic',asc:false}
};
let inited=false,user=null,cur='snake',stop=()=>{};
const stage=q('#gstage'),lock=q('#glock'),msg=t=>{const m=q('.gmsg',stage);if(m)m.textContent=t};

/* ---------- utente ---------- */
function profile(u){const m=u.user_metadata||{};return{name:(m.custom_claims&&m.custom_claims.global_name)||m.full_name||m.name||m.user_name||'Utente',avatar:m.avatar_url||m.picture||''}}
function renderAuth(){const a=q('#gauth');
 if(!READY){a.innerHTML='<span><b>Giochi in arrivo.</b> <span class="muted">Stiamo preparando le classifiche: torna presto!</span></span>';return}
 if(user){const p=profile(user);a.innerHTML=`<span class="who">${p.avatar?`<img src="${E(p.avatar)}" alt="">`:''}${E(p.name)}</span><button class="btn ghost sm" id="logout">Esci</button>`;q('#logout').onclick=()=>sb.auth.signOut()}
 else a.innerHTML='<span class="muted">Accedi con Discord per giocare e salvare i tuoi punteggi.</span><button class="btn sm" data-login>Accedi con Discord</button>';
 bindLogin(a)}
function bindLogin(r){qa('[data-login]',r).forEach(b=>b.onclick=()=>sb.auth.signInWithOAuth({provider:'discord',options:{redirectTo:location.origin+location.pathname}}))}
function renderLock(){
 if(user&&READY){lock.hidden=true;return}
 lock.hidden=false;
 lock.innerHTML=READY?'<h3>Accedi per giocare</h3><p class="muted small">Serve il tuo account Discord: così il punteggio finisce in classifica con il tuo nome.</p><button class="btn magnetic" data-login>Accedi con Discord per giocare</button>'
  :'<h3>Giochi in arrivo</h3><p class="muted small">I minigiochi saranno disponibili a breve. Resta sintonizzato sul server!</p>';
 bindLogin(lock)}

/* ---------- classifica ---------- */
async function board(game){const g=GAMES[game],lb=q('#lb');q('#bdesc').textContent=`Top 10 · ${g.lbDesc||(g.asc?'più basso è meglio':'punteggio migliore')}`;
 if(!READY){lb.innerHTML='<li class="muted">Classifiche in arrivo.</li>';return}
 let qy=sb.from(g.since?'scores':'leaderboard').select('user_id,username,avatar_url,score').eq('game',game);if(g.since)qy=qy.gte('created_at',g.since());
 const {data,error}=await qy.order('score',{ascending:!!g.asc}).order('created_at',{ascending:true}).limit(10);
 if(game!==cur)return;
 if(error){lb.innerHTML='<li class="muted">Classifica non disponibile al momento.</li>';return}
 if(!data.length){lb.innerHTML='<li class="muted">Ancora nessun punteggio. Sii il primo!</li>';return}
 lb.innerHTML=data.map((r,i)=>`<li class="${user&&r.user_id===user.id?'me':''}" style="animation-delay:${i*.04}s">${g.lbAvatar?g.lbAvatar(r,E):r.avatar_url?`<img src="${E(r.avatar_url)}" alt="" loading="lazy">`:'<img alt="">'}<span class="n">${E(r.username)}${i===0?' <span class="crown" title="'+E(g.k||'Primo in classifica')+'">👑</span>':''}</span><span class="s">${g.lbScore?g.lbScore(r.score):Number(r.score).toLocaleString('it-IT')} <small class="muted">${g.unit}</small></span></li>`).join('')}
async function save(game,score){
 if(!READY||!user)return;const p=profile(user),g=GAMES[game];score=Math.round(score);
 const prev=BEST[game],rec=!g.noRecord&&(prev==null||(g.asc?score<prev:score>prev));
 if(rec){BEST[game]=score;const r=q('#rec');if(r&&!g.ownRec&&game===cur){r.textContent=g.fmt?g.fmt(score):score.toLocaleString('it-IT');API.pop(r)}if(prev!=null||score>0)celebrate(game,score,prev==null)}
 const keep=q('.gmsg',stage)?.textContent||'';msg(keep?keep+' · Salvataggio…':'Salvataggio…');
 const {error}=await sb.from('scores').insert({game,score,username:p.name,avatar_url:p.avatar});
 if(!error&&g.onSaved)try{g.onSaved(score)}catch(e){}
 if(!error)loadStreak();
 if(game!==cur)return;msg((keep?keep+' · ':'')+(error?(/Wordle|veloce/.test(error.message||'')?error.message:'Non sono riuscito a salvare il punteggio.'):'Salvato ✓'));if(!error)board(game)}
/* ---------- record personale + festa "NUOVO RECORD!" ---------- */
const BEST={};
async function loadBest(game){if(!READY||!user)return;const b=await myBest(game);const g=GAMES[game];
 const key=game+'_best',loc=localStorage[key]!=null&&localStorage[key]!==''?+localStorage[key]:null;
 let v=b;if(v==null)v=null;BEST[game]=v;
 if(game!==cur||g.ownRec)return;const r=q('#rec');if(!r)return;const show=v!=null?v:loc;if(show!=null){r.textContent=g.fmt?g.fmt(show):Number(show).toLocaleString('it-IT')}}
function celebrate(game,score,first){const g=GAMES[game],card=q('.gcard');if(!card||game!==cur)return;
 q('.grecord',card)?.remove();const el=document.createElement('div');el.className='grecord';
 el.innerHTML=`<b>${first?'PRIMO RECORD!':'NUOVO RECORD!'}</b><span>${E(g.fmt?g.fmt(score):score.toLocaleString('it-IT'))} ${g.fmt?'':E(g.unit)}</span>`;
 card.appendChild(el);setTimeout(()=>el.remove(),2600);
 [523,659,784,1047,1319].forEach((f,i)=>tone('triangle',f,.14,i*.08,.05));tone('sine',1568,.4,.42,.04);
 if(API.RM())return;const cv=document.createElement('canvas'),r=card.getBoundingClientRect();cv.className='gconfetti';cv.width=r.width;cv.height=r.height;card.appendChild(cv);
 const c=cv.getContext('2d'),P=[],cols=['#ff4545','#ffd23f','#3ecf5a','#6cc8ff','#a35cff','#ff9a2e',API.col('--fg')];
 for(let i=0;i<120;i++)P.push({x:r.width/2,y:r.height*.35,vx:(Math.random()-.5)*14,vy:-Math.random()*12-3,s:3+Math.random()*5,a:Math.random()*7,va:(Math.random()-.5)*.4,c:cols[i%cols.length]});
 let n=0;(function f(){c.clearRect(0,0,cv.width,cv.height);P.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.35;p.vx*=.985;p.a+=p.va;c.save();c.translate(p.x,p.y);c.rotate(p.a);c.fillStyle=p.c;c.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);c.restore()});
  if(++n<110)requestAnimationFrame(f);else cv.remove()})()}
/* tasto R = Rigioca (quando il pulsante è visibile e non stai scrivendo) */
addEventListener('keydown',e=>{if((e.key!=='r'&&e.key!=='R')||e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA/.test(e.target.tagName))return;
 const b=q('#go',stage);if(b&&!b.hidden&&b.offsetParent&&!GAMES[cur].noR){e.preventDefault();b.click()}});
/* ---------- streak giornaliera ---------- */
async function loadStreak(){const box=q('#streak');if(!box)return;
 if(!READY){box.innerHTML='<h3>Streak 🔥</h3><p class="muted small">In arrivo.</p>';return}
 const {data,error}=await sb.from('streaks').select('user_id,username,avatar_url,streak').order('streak',{ascending:false}).order('last_day',{ascending:false}).limit(5);
 let mine=null;if(user){const m=await sb.from('streaks').select('streak').eq('user_id',user.id).limit(1);if(!m.error)mine=m.data[0]?.streak||0}
 if(error){box.innerHTML='<h3>Streak 🔥</h3><p class="muted small">Streak non disponibili al momento.</p>';return}
 box.innerHTML=`<div class="ghead"><h3>Streak 🔥</h3><p class="muted small">Giorni di fila con almeno una partita</p></div>
 <ol class="lb sk">${data.length?data.map((r,i)=>`<li class="${user&&r.user_id===user.id?'me':''}" style="animation-delay:${i*.04}s">${r.avatar_url?`<img src="${E(r.avatar_url)}" alt="" loading="lazy">`:'<img alt="">'}<span class="n">${E(r.username)}</span><span class="s">🔥 ${r.streak} <small class="muted">${r.streak===1?'giorno':'giorni'}</small></span></li>`).join(''):'<li class="muted">Nessuna streak attiva. Inizia oggi!</li>'}</ol>
 ${user?`<p class="skme">La tua streak: <b>🔥 ${mine||0}</b> ${mine?'':'<span class="muted small">— gioca una partita oggi per iniziarla</span>'}</p>`:''}`}
/* miglior punteggio dell'utente (dalla classifica Supabase, segue l'account Discord) */
async function myBest(game){if(!READY||!user)return null;const {data,error}=await sb.from('leaderboard').select('score').eq('game',game).eq('user_id',user.id).limit(1);return error||!data.length?null:data[0].score}

/* ---------- Snake (stile Nokia: suoni sintetizzati + animazioni) ---------- */
let AC=null;const muted=()=>localStorage.snake_mute==='1';
function audio(){if(!AC){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;try{AC=new A()}catch(e){return null}}if(AC.state==='suspended')AC.resume();return AC}
function beep(f,d=.08,w=0,v=.06,f2){if(muted()||!AC)return;const t=AC.currentTime+w,o=AC.createOscillator(),g=AC.createGain();o.type='square';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);
 g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(AC.destination);o.start(t);o.stop(t+d+.02)}
const SFX={start:()=>{beep(660,.07);beep(990,.09,.08)},eat:()=>beep(1320,.05,0,.05),tick:()=>beep(180,.012,0,.008),
 over:()=>{[523,415,330,247].forEach((f,i)=>beep(f,.16,i*.15,.06))},best:()=>{[659,784,988,1319].forEach((f,i)=>beep(f,.09,.7+i*.1,.05))}};
/* suoni generici per i giochi extra: tone(onda,freq,durata,ritardo,volume,freqFinale) e noise(durata,ritardo,volume,filtroHz,filtroHzFinale) */
function tone(type,f,d=.1,w=0,v=.06,f2){if(muted()||!AC)return;const t=AC.currentTime+w,o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);
 g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(AC.destination);o.start(t);o.stop(t+d+.02)}
function noise(d=.1,w=0,v=.05,fq=1200,fq2){if(muted()||!AC)return;const t=AC.currentTime+w,n=Math.ceil(AC.sampleRate*d),b=AC.createBuffer(1,n,AC.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=Math.random()*2-1;
 const s=AC.createBufferSource(),fl=AC.createBiquadFilter(),g=AC.createGain();s.buffer=b;fl.type='bandpass';fl.Q.value=1.2;fl.frequency.setValueAtTime(fq,t);if(fq2)fl.frequency.exponentialRampToValueAtTime(fq2,t+d);
 g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(fl).connect(g).connect(AC.destination);s.start(t)}
const TICK=false; // passo udibile: metti true per il "tic" ad ogni movimento (molto leggero)
/* ===== SKIN SNAKE: soglia (record di mele, preso dalla classifica = segue l'account Discord) → aspetto. Modifica qui. ===== */
const SKINS=[
 {min:0,  id:'classico',  n:'Classico',   c:''},           // nero/bianco come il vecchio Nokia (colore del tema)
 {min:0,  id:'verde',     n:'Verde',      c:'#3ecf5a'},
 {min:10, id:'azzurro',   n:'Azzurro',    c:'#6cc8ff'},
 {min:25, id:'giallo',    n:'Giallo',     c:'#ffd23f'},
 {min:50, id:'arancione', n:'Arancione',  c:'#ff9a2e'},
 {min:100,id:'viola',     n:'Viola',      c:'#a35cff'},
 {min:150,id:'arcobaleno',n:'Arcobaleno', c:'#ff4545',fx:'rainbow'},
 {min:200,id:'oro',       n:'Oro',        c:'#ffcc33',fx:'gold'},
 {min:300,id:'neon',      n:'Neon',       c:'#39ff14',fx:'neon'}
];
const skinOf=s=>{let t=SKINS[1];for(const k of SKINS)if(s>=k.min&&k.min>0)t=k;return t};
(()=>{const st=document.createElement('style');st.textContent=`
.sav{position:relative;display:inline-flex;flex:none;width:32px;height:32px;border-radius:50%;padding:2px;box-sizing:content-box;background:var(--wc)}
.sav img{position:relative;z-index:1;width:32px;height:32px}
.sav.w-neon{box-shadow:0 0 8px 1px var(--wc)}
.sav.w-classico{background:var(--fg)}
.ssw{width:44px;height:14px;border-radius:7px;border:1px solid var(--fg);background:var(--wc)}
.ssw.w-classico{background:var(--fg)}
.ssw.w-neon{box-shadow:0 0 8px var(--wc)}`;document.head.appendChild(st)})();
GAMES.snake.lbAvatar=(r,E)=>{const k=skinOf(Number(r.score)||0);return `<span class="sav w-${k.fx||'solid'}" style="--wc:${k.c}" title="Skin ${E(k.n)}">${r.avatar_url?`<img src="${E(r.avatar_url)}" alt="" loading="lazy">`:'<img alt="">'}</span>`};
function snake(){
 stage.innerHTML='<div class="ghud"><span>Mele <b id="sc">0</b></span><span>Record <b id="rec">'+(+localStorage.snake_best||0)+'</b></span><button class="mute" id="mute" aria-label="Audio"></button></div><canvas id="cv" width="400" height="400" aria-label="Snake"></canvas><div class="pad"><button class="u" data-d="0,-1">↑</button><button class="l" data-d="-1,0">←</button><button class="d" data-d="0,1">↓</button><button class="r" data-d="1,0">→</button></div><button class="btn sm" id="go">Gioca</button><p class="gmsg"></p>'
  +'<div class="wpick"><div class="wpick-h"><b>Personalizza</b><span class="muted small" id="wnote">Skin sbloccate col tuo record di mele</span></div><div class="wlist" id="wlist"></div></div>';
 const cv=q('#cv'),c=cv.getContext('2d'),N=20,S=20,RMo=matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.classList.contains('still');
 let sn,old,dir,nd,ap,score,timer=null,run=false,last=0,iv=130,raf=0,parts=[],flashT=-1e9,dead=0,eatT=-1e9,apT=-1e9,trail=[];
 let best=0,bestKnown=false,equipped=localStorage.snake_skin||'verde',crossed=new Set();
 const mb=q('#mute'),setM=()=>{mb.textContent=muted()?'🔇':'🔊';mb.title=muted()?'Audio disattivato':'Audio attivo'};setM();
 mb.onclick=()=>{localStorage.snake_mute=muted()?'0':'1';setM();if(!muted()){audio();beep(990,.05)}};
 const col=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
 function skin(){const k=SKINS.find(k=>k.id===equipped);return k&&best>=k.min?k:SKINS[1]}
 function renderPicker(){const L=q('#wlist');if(!L)return;const on=skin().id;
  L.innerHTML=SKINS.map(k=>{const ok=best>=k.min;return `<button class="wopt ${ok?'':'locked'} ${on===k.id?'on':''}" data-s="${k.id}" ${ok?'':'disabled'} title="${ok?k.n:'Serve un record di '+k.min+' mele'}"><span class="ssw w-${k.fx||(k.c?'solid':'classico')}" style="--wc:${k.c||'var(--fg)'}"></span><span>${k.n}</span><small>${ok?(on===k.id?'In uso':'Sbloccata'):'🔒 '+k.min}</small></button>`}).join('');
  qa('.wopt',L).forEach(b=>b.onclick=()=>{equipped=b.dataset.s;localStorage.snake_skin=equipped;renderPicker();audio();beep(990,.05)});
  const nx=SKINS.find(k=>k.min>best);
  q('#wnote').textContent=user?(bestKnown?`Il tuo record: ${best} mele. Prossima skin: `+(nx?`${nx.n} a ${nx.min}`:'tutte sbloccate!'):'Carico i tuoi sblocchi…'):'Accedi per sbloccare le skin'}
 async function loadSkins(){if(!user){best=0;bestKnown=false;renderPicker();return}const b=await myBest('snake');best=Math.max(best,b||0);bestKnown=true;renderPicker()}
 function toastMsg(t){const el=document.getElementById('toast');if(!el){msg(t);return}el.textContent=t;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),2200)}
 function place(){do{ap={x:Math.random()*N|0,y:Math.random()*N|0}}while(sn.some(p=>p.x===ap.x&&p.y===ap.y));apT=performance.now()}
 /* colore del segmento i (0 = testa) per la skin attiva */
 function segCol(k,i,n,now,fg){if(!k.c)return fg;
  if(k.fx==='rainbow')return `hsl(${((i*22-(RMo?0:now/6))%360+360)%360} 85% 58%)`;
  if(k.fx==='gold'){const sh=RMo?0:Math.sin(now/260-i*.45);return `hsl(44 ${88}% ${Math.round(52+sh*14)}%)`}
  return k.c}
 function apple(now,mu){const cx=ap.x*S+S/2,cy=ap.y*S+S/2,age=(now-apT)/260,grow=RMo||age>=1?1:Math.max(.05,1-Math.pow(1-age,3)), // entra con un piccolo "pop"
  pulse=RMo?1:1+.08*Math.sin(now/170),r=S/2.6*pulse*grow;
  c.fillStyle='#ff4545';c.beginPath();c.arc(cx,cy+1,r,0,7);c.fill();
  c.fillStyle='rgba(255,255,255,.55)';c.beginPath();c.arc(cx-r*.35,cy-r*.25,r*.28,0,7);c.fill();
  c.strokeStyle=mu;c.lineWidth=1.6;c.beginPath();c.moveTo(cx,cy-r+1);c.lineTo(cx+1.5,cy-r-3.5*grow);c.stroke();
  c.fillStyle='#3ecf5a';c.beginPath();c.ellipse(cx+4*grow,cy-r-2*grow,3.2*grow,1.7*grow,-.5,0,7);c.fill()}
 function draw(now){const fg=col('--fg'),mu=col('--mut'),ln=col('--line'),bg=col('--soft'),k=skin();c.clearRect(0,0,400,400);
  c.fillStyle=ln;for(let x=0;x<N;x++)for(let y=0;y<N;y++)c.fillRect(x*S+S/2-1,y*S+S/2-1,2,2); // griglia LCD
  apple(now,mu); // la mela è sempre visibile (prima lampeggiava e a volte "spariva")
  const kk=run&&!RMo?Math.max(0,Math.min(1,(now-last)/iv)):1,hide=dead&&Math.floor((now-dead)/150)%2===1;
  const pos=sn.map((p,i)=>{const f=i<old.length?old[i]:p;return{x:(f.x+(p.x-f.x)*kk)*S,y:(f.y+(p.y-f.y)*kk)*S}});
  if(k.fx==='neon'&&!RMo){ // scia luminosa
   if(run&&pos[0]){const h=pos[0];if(!trail.length||Math.hypot(trail[trail.length-1].x-h.x,trail[trail.length-1].y-h.y)>3)trail.push({x:h.x,y:h.y,t:now})}
   trail=trail.filter(t=>now-t.t<450);c.fillStyle=k.c;trail.forEach(t=>{const a=1-(now-t.t)/450;c.globalAlpha=a*.35;c.beginPath();c.arc(t.x+S/2,t.y+S/2,S/2.4*a+1,0,7);c.fill()});c.globalAlpha=1}
  if(!hide){if(k.fx==='neon'){c.shadowColor=k.c;c.shadowBlur=RMo?6:12}
   for(let i=pos.length-1;i>=0;i--){const {x,y}=pos[i],pad=i?2:1;
    const wave=(now-flashT)/28-i;c.fillStyle=wave>0&&wave<2.5?(k.c?'#ffffff':mu):segCol(k,i,pos.length,now,fg);c.globalAlpha=i?Math.max(.55,1-i/40):1;
    c.beginPath();c.roundRect(x+pad,y+pad,S-2*pad,S-2*pad,i?5:7);c.fill()}
   c.globalAlpha=1;c.shadowBlur=0;
   const h=pos[0],d=run||!dead?nd:dir,cx=h.x+S/2+d.x*4,cy=h.y+S/2+d.y*4,ox=d.y*4,oy=d.x*4;c.fillStyle=k.c?'#111':bg;
   [1,-1].forEach(s=>{c.beginPath();c.arc(cx+ox*s,cy+oy*s,dead?1.2:2,0,7);c.fill()})}
  parts=parts.filter(p=>(p.l-=1)>0);parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vx*=.92;p.vy*=.92;c.globalAlpha=p.l/24;c.fillStyle=p.c||fg;c.fillRect(p.x-1.5,p.y-1.5,3,3)});c.globalAlpha=1;
  const er=(now-eatT)/300;if(!RMo&&er<1&&sn[0]){c.strokeStyle=k.c||mu;c.globalAlpha=1-er;c.lineWidth=2;c.beginPath();c.arc(sn[0].x*S+S/2,sn[0].y*S+S/2,S/2+er*16,0,7);c.stroke();c.globalAlpha=1}}
 function loop(now){draw(now);raf=requestAnimationFrame(loop)}
 function reset(){sn=[{x:9,y:10},{x:8,y:10},{x:7,y:10}];old=sn.map(p=>({...p}));dir={x:1,y:0};nd=dir;score=0;dead=0;parts=[];trail=[];crossed=new Set();q('#sc').textContent=0;place()}
 function step(){dir=nd;const h={x:sn[0].x+dir.x,y:sn[0].y+dir.y};
  if(h.x<0||h.y<0||h.x>=N||h.y>=N||sn.some(p=>p.x===h.x&&p.y===h.y))return end();
  old=sn.map(p=>({...p}));sn.unshift(h);last=performance.now();
  if(h.x===ap.x&&h.y===ap.y){score++;SFX.eat();flashT=last;eatT=last;
   if(!RMo)for(let i=0;i<10;i++){const a=Math.random()*7,v=1.5+Math.random()*2.5;parts.push({x:ap.x*S+S/2,y:ap.y*S+S/2,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:24,c:'#ff4545'})}
   const t=SKINS.find(k=>k.min===score);if(t&&t.min>0&&bestKnown&&t.min>best&&!crossed.has(t.id)){crossed.add(t.id);toastMsg(`Skin sbloccata! ${t.n} 🐍`);[784,988,1175,1568].forEach((f,i)=>beep(f,.08,i*.08,.04))}
   const s=q('#sc');s.textContent=score;s.classList.remove('pop');void s.offsetWidth;s.classList.add('pop');if(sn.length>=N*N)return end();place()}else{sn.pop();if(TICK)SFX.tick()}
  iv=Math.max(70,130-score*2);timer=setTimeout(step,iv)}
 function end(){run=false;clearTimeout(timer);old=sn.map(p=>({...p}));SFX.over();
  if(!RMo){dead=performance.now();cv.classList.remove('shake');void cv.offsetWidth;cv.classList.add('shake')}
  setTimeout(()=>{dead=0},RMo?0:900);
  const g=q('#go');g.textContent='Rigioca';setTimeout(()=>{g.hidden=false},RMo?0:700);
  if(score>(+localStorage.snake_best||0)){localStorage.snake_best=score;const r=q('#rec');r.textContent=score;SFX.best();r.classList.remove('pop');void r.offsetWidth;r.classList.add('pop');msg(`Nuovo record! ${score} mele.`)}
  else msg(`Fine! Hai mangiato ${score} mele.`);if(score>0)save('snake',score)}
 function turn(x,y){if(!run)return;if(x===-dir.x&&y===-dir.y)return;nd={x,y}}
 q('#go').onclick=()=>{if(!user)return;audio();reset();run=true;last=performance.now()+170;iv=130;q('#go').hidden=true;msg('');SFX.start();timer=setTimeout(step,300)};
 qa('.pad button').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();const [x,y]=b.dataset.d.split(',').map(Number);turn(x,y)}));
 const K={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};
 const key=e=>{const k=K[e.key.length===1?e.key.toLowerCase():e.key];if(k&&run){e.preventDefault();turn(...k)}};addEventListener('keydown',key);
 let t0=null;cv.addEventListener('touchstart',e=>{t0=e.touches[0]},{passive:true});
 cv.addEventListener('touchmove',e=>{if(run)e.preventDefault()},{passive:false});
 cv.addEventListener('touchend',e=>{if(!t0)return;const t=e.changedTouches[0],dx=t.clientX-t0.clientX,dy=t.clientY-t0.clientY;t0=null;if(Math.max(Math.abs(dx),Math.abs(dy))<20)return;Math.abs(dx)>Math.abs(dy)?turn(Math.sign(dx),0):turn(0,Math.sign(dy))});
 GAMES.snake.onSaved=s=>{if(s>best){best=s;renderPicker()}};
 GAMES.snake.onUser=()=>{best=0;bestKnown=false;loadSkins()};
 reset();renderPicker();loadSkins();raf=requestAnimationFrame(loop);return()=>{clearTimeout(timer);cancelAnimationFrame(raf);run=false;removeEventListener('keydown',key)}}

/* ---------- Tempo di reazione ---------- */
function reaction(){
 stage.innerHTML='<div class="ghud"><span>Tentativo <b id="tr">0</b>/3</span><span>Record <b id="rec">'+(localStorage.reaction_best?localStorage.reaction_best+' ms':'–')+'</b></span></div><div class="rzone" id="z" tabindex="0"><span class="big">Inizia</span><span>Tocca per cominciare</span></div><p class="gmsg"></p>';
 const z=q('#z');let st='idle',times=[],t0=0,to=null;
 const show=(cls,a,b)=>{z.className='rzone '+cls;z.innerHTML=`<span class="big">${a}</span><span>${b}</span>`};
 function arm(){audio();st='wait';show('wait','Aspetta…','Tocca quando diventa scuro');to=setTimeout(()=>{st='go';t0=performance.now();show('go','ORA!','');tone('square',1320,.06,0,.04)},1200+Math.random()*2500)}
 function hit(e){e.preventDefault();if(!user)return;
  if(st==='idle'||st==='done'){times=[];q('#tr').textContent=0;msg('');arm()}
  else if(st==='wait'){clearTimeout(to);st='early';show('','Troppo presto!','Tocca per riprovare questo tentativo')}
  else if(st==='early')arm();
  else if(st==='go'){const ms=Math.round(performance.now()-t0);times.push(ms);q('#tr').textContent=times.length;
   if(times.length<3){st='between';show('',ms+' ms','Tocca per il prossimo tentativo')}
   else{st='done';const avg=Math.round(times.reduce((a,b)=>a+b)/3);show('',avg+' ms','Media di '+times.join(' · ')+' ms — tocca per rigiocare');
    if(!localStorage.reaction_best||avg<+localStorage.reaction_best){localStorage.reaction_best=avg;q('#rec').textContent=avg+' ms'}
    if(avg>=100)save('reaction',avg);else msg('Troppo veloce per essere vero: punteggio non salvato.')}}
  else if(st==='between')arm()}
 z.addEventListener('pointerdown',hit);z.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter')hit(e)});
 return()=>clearTimeout(to)}

/* ---------- Clicker veloce (anti-autoclicker) ----------
   Contano solo i clic veri (event.isTrusted). Gli intervalli tra i clic (ms, performance.now) vengono analizzati
   su una finestra mobile: se il ritmo è troppo regolare (coefficiente di variazione bassissimo, tipico dei programmi
   autoclicker) la partita viene annullata. Soglie larghe: il drag-click umano (25-30+ CPS, a raffiche) passa. */
const CLK={MAX:400,WIN:24,CV:.045,FAST:125,HITS:6};
function clickCheck(iv){ // iv = intervalli in ms; ritorna true se la finestra finale è "da robot"
 if(iv.length<CLK.WIN)return false;const w=iv.slice(-CLK.WIN),m=w.reduce((a,b)=>a+b,0)/w.length;if(m>CLK.FAST)return false;
 const sd=Math.sqrt(w.reduce((a,b)=>a+(b-m)*(b-m),0)/w.length),cv=sd/m;
 const med=[...w].sort((a,b)=>a-b)[w.length>>1],near=w.filter(x=>Math.abs(x-med)<=1.5).length/w.length;
 return cv<CLK.CV||near>=.85}
function clicker(){
 stage.innerHTML='<div class="ghud"><span>Tempo <b id="tm">10.0</b>s</span><span>Record <b id="rec">'+(+localStorage.clicker_best||0)+'</b></span></div><div class="czone" id="z"><span class="big" id="n">0</span><span id="h">Clicca qui per iniziare</span></div><p class="gmsg"></p>';
 const z=q('#z');let n=0,st='idle',end=0,raf=0,cool=0,lastT=0,iv=[],hits=0,bad='';
 function finish(){st='done';cancelAnimationFrame(raf);z.classList.remove('on');cool=performance.now()+1200;
  if(bad){q('#h').textContent=`Partita non valida — tocca per rigiocare`;msg(bad);return}
  q('#h').textContent=`Fine! ${n} clic — tocca per rigiocare`;
  if(n>CLK.MAX){msg(`Più di ${CLK.MAX} clic in 10 secondi? Sospetto: punteggio non salvato.`);return}
  if(n>(+localStorage.clicker_best||0)){localStorage.clicker_best=n;q('#rec').textContent=n}
  if(n>0)save('clicker',n)}
 function tick(){const left=Math.max(0,end-performance.now());q('#tm').textContent=(left/1000).toFixed(1);if(left>0){raf=requestAnimationFrame(tick);return}finish()}
 function invalid(t){bad=t;SFX.over();finish()}
 z.addEventListener('pointerdown',e=>{e.preventDefault();if(!user)return;
  if(!e.isTrusted){if(st==='run')invalid('Clic non validi rilevati (generati da uno script): partita annullata, punteggio non salvato.');return}
  const now=performance.now();
  if(st!=='run'){if(now<cool)return;n=0;iv=[];hits=0;bad='';lastT=now;st='run';end=now+10000;z.classList.add('on');q('#h').textContent='Vai, vai, vai!';msg('');raf=requestAnimationFrame(tick)}
  else{iv.push(now-lastT);lastT=now;if(clickCheck(iv)&&++hits>=CLK.HITS)return invalid('Ritmo troppo regolare, sembra un autoclicker: partita annullata, punteggio non salvato.')}
  n++;audio();tone('triangle',300+Math.min(n,120)*9,.04,0,.025);const el=q('#n');el.textContent=n;el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop')});
 return()=>cancelAnimationFrame(raf)}
window.__clickCheck=clickCheck;

/* ---------- giochi extra (giochi-*.js, caricati prima di questo file) ---------- */
const MAKE={snake,reaction,clicker};
const RM=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.classList.contains('still');
const API={q,qa,E,stage,msg,save,audio,beep,tone,noise,muted,RM,myBest,profile,get AC(){return AC},celebrate,best:g=>BEST[g],sb,get user(){return user},get cur(){return cur},
 muteBtn(el){const set=()=>{el.textContent=muted()?'🔇':'🔊';el.title=muted()?'Audio disattivato':'Audio attivo'};set();
  el.onclick=()=>{localStorage.snake_mute=muted()?'0':'1';set();if(!muted()){audio();beep(990,.05)}el.blur()};return set},
 pop(el){el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop')},
 col:v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim()};
Object.entries(window.GIOCHI_EXTRA||{}).forEach(([id,g])=>{GAMES[id]=g;MAKE[id]=()=>g.make(API)});

/* ---------- avvio ---------- */
function open(game){stop();cur=game;qa('.gtab').forEach(b=>b.classList.toggle('active',b.dataset.game===game));
 q('#gtitle').textContent=GAMES[game].t;q('#gdesc').textContent=GAMES[game].d;q('#kingnote').textContent=GAMES[game].k?`Il primo in classifica riceve il ruolo ${GAMES[game].k} sul server Discord.`:'';stop=MAKE[game]();renderLock();board(game);loadBest(game);
 if(inited)try{history.replaceState(null,'',location.pathname+'#'+game)}catch(e){}}
qa('.gtab').forEach(b=>b.onclick=()=>open(b.dataset.game));
const start=GAMES[location.hash.slice(1)]?location.hash.slice(1):'snake';
if(sb){sb.auth.getSession().then(({data})=>{user=data.session?.user||null;inited=true;renderAuth();open(cur);loadStreak()});
 sb.auth.onAuthStateChange((_e,s)=>{const was=user?.id;user=s?.user||null;if(was!==user?.id){renderAuth();renderLock();board(cur);loadStreak();for(const k in BEST)delete BEST[k];loadBest(cur);if(GAMES[cur].onUser)try{GAMES[cur].onUser(user)}catch(e){}}})}
if(!sb)inited=true;cur=start;renderAuth();open(start);loadStreak();
})();
