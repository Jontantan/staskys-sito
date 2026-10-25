/* Staskys — minigiochi (Snake, Tempo di reazione, Clicker veloce) con classifiche Supabase */
(function(){
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CFG=window.GIOCHI_CONFIG||{};
const READY=!!(CFG.SUPABASE_URL&&CFG.SUPABASE_ANON_KEY&&!/INCOLLA_QUI/.test(CFG.SUPABASE_URL+CFG.SUPABASE_ANON_KEY)&&window.supabase);
const sb=READY?window.supabase.createClient(CFG.SUPABASE_URL,CFG.SUPABASE_ANON_KEY,{auth:{flowType:'pkce',detectSessionInUrl:true,persistSession:true}}):null;
const GAMES={
 snake:{t:'Snake',d:'Mangia più mele possibile senza sbattere. Frecce/WASD su PC, scorri o usa i tasti su telefono.',unit:'mele',asc:false},
 reaction:{t:'Tempo di reazione',d:'Tocca appena lo schermo diventa scuro. 3 tentativi: conta la media. Meno è meglio.',unit:'ms',asc:true},
 clicker:{t:'Clicker veloce',d:'Quanti clic riesci a fare in 10 secondi? Il tempo parte al primo clic.',unit:'clic',asc:false}
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
async function board(game){const g=GAMES[game],lb=q('#lb');q('#bdesc').textContent=`Top 10 · ${g.asc?'tempo medio più basso':'punteggio migliore'}`;
 if(!READY){lb.innerHTML='<li class="muted">Classifiche in arrivo.</li>';return}
 const {data,error}=await sb.from('leaderboard').select('user_id,username,avatar_url,score').eq('game',game).order('score',{ascending:g.asc}).order('created_at',{ascending:true}).limit(10);
 if(game!==cur)return;
 if(error){lb.innerHTML='<li class="muted">Classifica non disponibile al momento.</li>';return}
 if(!data.length){lb.innerHTML='<li class="muted">Ancora nessun punteggio. Sii il primo!</li>';return}
 lb.innerHTML=data.map((r,i)=>`<li class="${user&&r.user_id===user.id?'me':''}" style="animation-delay:${i*.04}s">${r.avatar_url?`<img src="${E(r.avatar_url)}" alt="" loading="lazy">`:'<img alt="">'}<span class="n">${E(r.username)}</span><span class="s">${Number(r.score).toLocaleString('it-IT')} <small class="muted">${g.unit}</small></span></li>`).join('')}
async function save(game,score){
 if(!READY||!user)return;const p=profile(user);msg('Salvataggio…');
 const {error}=await sb.from('scores').insert({game,score:Math.round(score),username:p.name,avatar_url:p.avatar});
 if(game!==cur)return;msg(error?'Non sono riuscito a salvare il punteggio.':'Punteggio salvato ✓');if(!error)board(game)}

/* ---------- Snake ---------- */
function snake(){
 stage.innerHTML='<div class="ghud"><span>Mele <b id="sc">0</b></span><span>Record <b id="rec">'+(+localStorage.snake_best||0)+'</b></span></div><canvas id="cv" width="400" height="400" aria-label="Snake"></canvas><div class="pad"><button class="u" data-d="0,-1">↑</button><button class="l" data-d="-1,0">←</button><button class="d" data-d="0,1">↓</button><button class="r" data-d="1,0">→</button></div><button class="btn sm" id="go">Gioca</button><p class="gmsg"></p>';
 const cv=q('#cv'),c=cv.getContext('2d'),N=20,S=20;let sn,dir,nd,ap,score,timer=null,run=false;
 const col=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
 function place(){do{ap={x:Math.random()*N|0,y:Math.random()*N|0}}while(sn.some(p=>p.x===ap.x&&p.y===ap.y))}
 function draw(){c.clearRect(0,0,400,400);c.fillStyle=col('--mut');c.beginPath();c.arc(ap.x*S+S/2,ap.y*S+S/2,S/2.6,0,7);c.fill();
  c.fillStyle=col('--fg');sn.forEach((p,i)=>{const k=i?2:1;c.globalAlpha=i?Math.max(.45,1-i/40):1;c.beginPath();c.roundRect(p.x*S+k,p.y*S+k,S-2*k,S-2*k,5);c.fill()});c.globalAlpha=1}
 function reset(){sn=[{x:9,y:10},{x:8,y:10},{x:7,y:10}];dir={x:1,y:0};nd=dir;score=0;q('#sc').textContent=0;place();draw()}
 function step(){dir=nd;const h={x:sn[0].x+dir.x,y:sn[0].y+dir.y};
  if(h.x<0||h.y<0||h.x>=N||h.y>=N||sn.some(p=>p.x===h.x&&p.y===h.y))return end();
  sn.unshift(h);if(h.x===ap.x&&h.y===ap.y){score++;const s=q('#sc');s.textContent=score;s.classList.remove('pop');void s.offsetWidth;s.classList.add('pop');if(sn.length>=N*N)return end();place()}else sn.pop();draw();
  timer=setTimeout(step,Math.max(70,130-score*2))}
 function end(){run=false;clearTimeout(timer);q('#go').hidden=false;q('#go').textContent='Rigioca';
  if(score>(+localStorage.snake_best||0)){localStorage.snake_best=score;q('#rec').textContent=score}
  msg(`Fine! Hai mangiato ${score} mele.`);if(score>0)save('snake',score)}
 function turn(x,y){if(!run)return;if(x===-dir.x&&y===-dir.y)return;nd={x,y}}
 q('#go').onclick=()=>{if(!user)return;reset();run=true;q('#go').hidden=true;msg('');timer=setTimeout(step,300)};
 qa('.pad button').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();const [x,y]=b.dataset.d.split(',').map(Number);turn(x,y)}));
 const K={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};
 const key=e=>{const k=K[e.key.length===1?e.key.toLowerCase():e.key];if(k&&run){e.preventDefault();turn(...k)}};addEventListener('keydown',key);
 let t0=null;cv.addEventListener('touchstart',e=>{t0=e.touches[0]},{passive:true});
 cv.addEventListener('touchmove',e=>{if(run)e.preventDefault()},{passive:false});
 cv.addEventListener('touchend',e=>{if(!t0)return;const t=e.changedTouches[0],dx=t.clientX-t0.clientX,dy=t.clientY-t0.clientY;t0=null;if(Math.max(Math.abs(dx),Math.abs(dy))<20)return;Math.abs(dx)>Math.abs(dy)?turn(Math.sign(dx),0):turn(0,Math.sign(dy))});
 reset();return()=>{clearTimeout(timer);run=false;removeEventListener('keydown',key)}}

/* ---------- Tempo di reazione ---------- */
function reaction(){
 stage.innerHTML='<div class="ghud"><span>Tentativo <b id="tr">0</b>/3</span><span>Record <b id="rec">'+(localStorage.reaction_best?localStorage.reaction_best+' ms':'–')+'</b></span></div><div class="rzone" id="z" tabindex="0"><span class="big">Inizia</span><span>Tocca per cominciare</span></div><p class="gmsg"></p>';
 const z=q('#z');let st='idle',times=[],t0=0,to=null;
 const show=(cls,a,b)=>{z.className='rzone '+cls;z.innerHTML=`<span class="big">${a}</span><span>${b}</span>`};
 function arm(){st='wait';show('wait','Aspetta…','Tocca quando diventa scuro');to=setTimeout(()=>{st='go';t0=performance.now();show('go','ORA!','')},1200+Math.random()*2500)}
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

/* ---------- Clicker veloce ---------- */
function clicker(){
 stage.innerHTML='<div class="ghud"><span>Tempo <b id="tm">10.0</b>s</span><span>Record <b id="rec">'+(+localStorage.clicker_best||0)+'</b></span></div><div class="czone" id="z"><span class="big" id="n">0</span><span id="h">Clicca qui per iniziare</span></div><p class="gmsg"></p>';
 const z=q('#z');let n=0,st='idle',end=0,raf=0,cool=0;
 function tick(){const left=Math.max(0,end-performance.now());q('#tm').textContent=(left/1000).toFixed(1);if(left>0){raf=requestAnimationFrame(tick);return}
  st='done';z.classList.remove('on');cool=performance.now()+1200;q('#h').textContent=`Fine! ${n} clic — tocca per rigiocare`;
  if(n>(+localStorage.clicker_best||0)){localStorage.clicker_best=n;q('#rec').textContent=n}
  if(n<=200&&n>0)save('clicker',n);else if(n>200)msg('Più di 200 clic? Sospetto: punteggio non salvato.')}
 z.addEventListener('pointerdown',e=>{e.preventDefault();if(!user)return;
  if(st!=='run'){if(performance.now()<cool)return;n=0;st='run';end=performance.now()+10000;z.classList.add('on');q('#h').textContent='Vai, vai, vai!';msg('');raf=requestAnimationFrame(tick)}
  n++;const el=q('#n');el.textContent=n;el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop')});
 return()=>cancelAnimationFrame(raf)}

/* ---------- avvio ---------- */
const MAKE={snake,reaction,clicker};
function open(game){stop();cur=game;qa('.gtab').forEach(b=>b.classList.toggle('active',b.dataset.game===game));
 q('#gtitle').textContent=GAMES[game].t;q('#gdesc').textContent=GAMES[game].d;stop=MAKE[game]();renderLock();board(game);
 if(inited)try{history.replaceState(null,'',location.pathname+'#'+game)}catch(e){}}
qa('.gtab').forEach(b=>b.onclick=()=>open(b.dataset.game));
const start=GAMES[location.hash.slice(1)]?location.hash.slice(1):'snake';
if(sb){sb.auth.getSession().then(({data})=>{user=data.session?.user||null;inited=true;renderAuth();open(cur)});
 sb.auth.onAuthStateChange((_e,s)=>{const was=user?.id;user=s?.user||null;if(was!==user?.id){renderAuth();renderLock();board(cur)}})}
if(!sb)inited=true;cur=start;renderAuth();open(start);
})();
