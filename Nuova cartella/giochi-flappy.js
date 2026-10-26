/* Staskys — Flappy: il tuo avatar Discord con le ali. Ali sbloccabili col miglior punteggio salvato su Supabase. */
(function(){
/* ===== CONFIG ALI: soglia (miglior punteggio Flappy) → colore. Modifica qui. ===== */
const WINGS=[
 {min:0,  id:'bianche',  n:'Bianche',   c:'#ffffff'},
 {min:5,  id:'verdi',    n:'Verdi',     c:'#3ecf5a'},
 {min:10, id:'azzurre',  n:'Azzurre',   c:'#6cc8ff'},
 {min:25, id:'gialle',   n:'Gialle',    c:'#ffd23f'},
 {min:50, id:'arancioni',n:'Arancioni', c:'#ff9a2e'},
 {min:75, id:'rosse',    n:'Rosse',     c:'#ff4545'},
 {min:100,id:'viola',    n:'Viola',     c:'#a35cff'},
 {min:150,id:'arcobaleno',n:'Arcobaleno',c:'#ff4545',fx:'rainbow'},
 {min:250,id:'oro',      n:'Oro brillante',c:'#ffcc33',fx:'gold'}
];
const tierOf=s=>{let t=WINGS[0];for(const w of WINGS)if(s>=w.min)t=w;return t};
window.FLAPPY_WINGS=WINGS;

/* --- disegno ali (usato in gioco e anteprime) --- */
function wingFill(c,w,x,y,s,now,still){
 if(w.fx==='rainbow'){const o=still?0:(now/12)%(s*6),g=c.createLinearGradient(x-s*3+o,y,x+s*3+o,y);['#ff4545','#ff9a2e','#ffd23f','#3ecf5a','#6cc8ff','#a35cff','#ff4545'].forEach((k,i)=>g.addColorStop(i/6,k));return g}
 if(w.fx==='gold'){const p=still?.5:((now/900)%1.6)-.3,g=c.createLinearGradient(x-s,y-s,x+s,y+s);g.addColorStop(0,'#b8860b');g.addColorStop(Math.max(0,Math.min(1,p-.12)),'#ffcc33');g.addColorStop(Math.max(0,Math.min(1,p)),'#fffbe0');g.addColorStop(Math.max(0,Math.min(1,p+.12)),'#ffcc33');g.addColorStop(1,'#b8860b');return g}
 return w.c}
function drawWing(c,w,x,y,r,side,flap,now,still,stroke){ // side: -1 sinistra, 1 destra
 c.save();c.translate(x+side*r*.75,y);c.rotate(side*(-.35+flap*.7));c.scale(side,1);
 c.beginPath();c.moveTo(0,0);c.bezierCurveTo(r*.5,-r*.9,r*1.25,-r*.7,r*1.15,-r*.05);c.bezierCurveTo(r*.95,r*.05,r*.85,r*.25,r*.6,r*.18);c.bezierCurveTo(r*.45,r*.4,r*.2,r*.35,0,r*.2);c.closePath();
 c.fillStyle=wingFill(c,w,r*.6,-r*.3,r,now,still);c.fill();c.lineWidth=1.5;c.strokeStyle=stroke;c.stroke();
 c.globalAlpha=.35;c.beginPath();c.moveTo(r*.25,-r*.1);c.lineTo(r*.9,-r*.35);c.moveTo(r*.3,r*.05);c.lineTo(r*.85,-r*.05);c.stroke();c.restore()}
function drawBird(c,img,w,x,y,r,rot,flap,now,still,fg,soft){
 drawWing(c,w,x,y,r,-1,flap,now,still,fg);drawWing(c,w,x,y,r,1,flap,now,still,fg);
 c.save();c.translate(x,y);c.rotate(rot);c.beginPath();c.arc(0,0,r,0,7);c.closePath();c.save();c.clip();
 if(img&&img.complete&&img.naturalWidth)c.drawImage(img,-r,-r,r*2,r*2);else{c.fillStyle=soft;c.fill();c.fillStyle=fg;c.beginPath();c.arc(-r*.3,-r*.15,r*.12,0,7);c.arc(r*.3,-r*.15,r*.12,0,7);c.fill()}
 c.restore();c.lineWidth=2;c.strokeStyle=fg;c.beginPath();c.arc(0,0,r,0,7);c.stroke();c.restore()}

function make(A){
 const {q,qa,E,stage,msg}=A;
 let best=0,bestKnown=false,equipped=localStorage.flappy_wing||'bianche';
 stage.innerHTML=`<div class="ghud"><span>Tubi <b id="sc">0</b></span><span>Record <b id="rec">–</b></span><button class="mute" id="mute" aria-label="Audio"></button></div>
 <canvas id="cv" width="360" height="480" class="tall" aria-label="Flappy"></canvas>
 <button class="btn sm" id="go">Gioca</button><p class="gmsg"></p>
 <div class="wpick"><div class="wpick-h"><b>Personalizza</b><span class="muted small" id="wnote">Ali sbloccate col tuo miglior punteggio</span></div><div class="wlist" id="wlist"></div></div>`;
 const cv=q('#cv'),c=cv.getContext('2d'),W=360,H=480,still=A.RM();
 A.muteBtn(q('#mute'));
 const img=new Image();const p=A.user?A.profile(A.user):null;if(p&&p.avatar){img.src=p.avatar}
 const GRAV=.42,FLAP=-7.2,SPD=2.3,GAP=132,PW=58,DIST=200,R=17,BX=110,GROUND=H-40;
 let st='idle',y,vy,pipes,score,raf=0,acc=0,last=0,flapT=0,deadT=0,parts=[],crossed=new Set(),groundX=0;
 const SFX={
  flap:()=>{A.noise(.09,0,.12,900,2600);A.tone('triangle',380,.06,0,.025,620)},
  point:()=>{A.tone('sine',1046,.09,0,.07);A.tone('sine',1568,.28,.07,.07)},
  hit:()=>{A.tone('triangle',160,.18,0,.16,55);A.noise(.12,0,.12,300,120)},
  fall:()=>{A.tone('sine',900,.5,.12,.05,180);A.noise(.45,.12,.04,2400,300)},
  unlock:()=>{[784,988,1175,1568].forEach((f,i)=>A.tone('square',f,.1,i*.08,.04))}};
 const col=A.col;
 function eqWing(){const w=WINGS.find(w=>w.id===equipped);return w&&best>=w.min?w:tierOf(best)}
 function renderPicker(){const L=q('#wlist');if(!L)return;
  L.innerHTML=WINGS.map(w=>{const ok=best>=w.min;return `<button class="wopt ${ok?'':'locked'} ${eqWing().id===w.id?'on':''}" data-w="${w.id}" ${ok?'':'disabled'} title="${ok?w.n:'Serve un record di '+w.min}"><span class="wsw w-${w.fx||'solid'}" style="--wc:${w.c}"></span><span>${w.n}</span><small>${ok?(eqWing().id===w.id?'In uso':'Sbloccate'):'🔒 '+w.min}</small></button>`}).join('');
  qa('.wopt',L).forEach(b=>b.onclick=()=>{equipped=b.dataset.w;localStorage.flappy_wing=equipped;renderPicker();A.audio();A.beep(990,.05)});
  q('#rec').textContent=bestKnown?best:'–';
  q('#wnote').textContent=A.user?(bestKnown?`Il tuo record: ${best}. Prossime ali: `+((WINGS.find(w=>w.min>best)||{}).min??'tutte sbloccate!'):'Carico i tuoi sblocchi…'):'Accedi per sbloccare le ali'}
 async function loadBest(){if(!A.user){best=0;bestKnown=false;renderPicker();return}
  const b=await A.myBest('flappy');best=Math.max(best,b||0);bestKnown=true;renderPicker()}
 function reset(){y=H/2-30;vy=0;pipes=[];score=0;parts=[];crossed=new Set();q('#sc').textContent=0;acc=0}
 function addPipe(x){const top=60+Math.random()*(GROUND-GAP-120);pipes.push({x,top,done:false})}
 function flap(){if(!A.user)return;if(st==='dead'){if(performance.now()-deadT<600)return;start();return}if(st!=='run')return start();vy=FLAP;flapT=performance.now();SFX.flap()}
 function start(){A.audio();reset();st='run';addPipe(W+40);vy=FLAP;flapT=performance.now();q('#go').hidden=true;msg('');SFX.flap()}
 function die(){st='dead';deadT=performance.now();SFX.hit();SFX.fall();
  if(!still){cv.classList.remove('shake');void cv.offsetWidth;cv.classList.add('shake');for(let i=0;i<14;i++){const a=Math.random()*7,v=1+Math.random()*3;parts.push({x:BX,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:30})}}
  const g=q('#go');g.textContent='Rigioca';setTimeout(()=>{if(st==='dead')g.hidden=false},still?0:600);
  if(score>best&&bestKnown){A.pop(q('#rec'));msg(`Nuovo record! ${score} tubi.`)}else msg(`Fine! Hai superato ${score} tubi.`);
  if(score>0)A.save('flappy',score)}
 function tick(){ // passo fisso 60 Hz
  if(st==='run'||st==='dead'){vy=Math.min(vy+GRAV,10);y+=vy;if(y>GROUND-R){y=GROUND-R;vy=0;if(st==='run')die()}if(y<R){y=R;vy=0}}
  if(st!=='run')return;groundX=(groundX+SPD)%24;
  pipes.forEach(p=>{p.x-=SPD;if(!p.done&&p.x+PW<BX-R){p.done=true;score++;const s=q('#sc');s.textContent=score;A.pop(s);SFX.point();
   const t=WINGS.find(w=>w.min===score);if(t&&t.min>0&&t.min>best&&!crossed.has(t.id)){crossed.add(t.id);toast(`Ali sbloccate! ${t.n} 🪽`);SFX.unlock()}}});
  if(pipes.length&&pipes[0].x<-PW)pipes.shift();
  const lp=pipes[pipes.length-1];if(!lp||lp.x<W-DIST)addPipe(W+10);
  for(const p of pipes){if(BX+R*.8>p.x&&BX-R*.8<p.x+PW&&(y-R*.8<p.top||y+R*.8>p.top+GAP)){die();break}}}
 function toast(t){const el=document.getElementById('toast');if(!el){msg(t);return}el.textContent=t;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),2200)}
 function draw(now){const fg=col('--fg'),soft=col('--soft'),ln=col('--line'),mu=col('--mut');c.clearRect(0,0,W,H);
  c.fillStyle=ln;for(let i=0;i<5;i++){const cx=((i*97+40)-(now/40*(st==='run'&&!still?1:0)))%(W+80);c.globalAlpha=.6;c.beginPath();c.arc((cx+W+80)%(W+80)-40,60+i*37%120,14,0,7);c.arc((cx+W+80)%(W+80)-22,56+i*37%120,18,0,7);c.fill()}c.globalAlpha=1;
  const pc=tierOf(score);
  pipes.forEach(p=>{c.fillStyle=wingFill(c,pc,p.x+PW/2,H/2,PW,now,still);c.strokeStyle=fg;c.lineWidth=2;
   [[0,p.top],[p.top+GAP,GROUND-p.top-GAP]].forEach(([y0,h])=>{c.fillRect(p.x,y0,PW,h);c.strokeRect(p.x,y0,PW,h)});
   c.fillRect(p.x-5,p.top-18,PW+10,18);c.strokeRect(p.x-5,p.top-18,PW+10,18);c.fillRect(p.x-5,p.top+GAP,PW+10,18);c.strokeRect(p.x-5,p.top+GAP,PW+10,18)});
  c.fillStyle=soft;c.fillRect(0,GROUND,W,H-GROUND);c.strokeStyle=fg;c.lineWidth=2;c.beginPath();c.moveTo(0,GROUND);c.lineTo(W,GROUND);c.stroke();
  c.strokeStyle=ln;for(let x=-groundX;x<W;x+=24){c.beginPath();c.moveTo(x,GROUND+8);c.lineTo(x+12,GROUND+20);c.stroke()}
  const bob=st==='idle'&&!still?Math.sin(now/250)*8:0,fl=still?.5:(st==='run'?Math.max(0,1-(now-flapT)/220):st==='idle'?.5+.5*Math.sin(now/90):0);
  const rot=st==='idle'?0:Math.max(-.45,Math.min(1.2,vy/9));
  drawBird(c,img,eqWing(),BX,y+bob,R,rot,fl,now,still,fg,soft);
  parts=parts.filter(p=>(p.l-=1)>0);parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.1;c.globalAlpha=p.l/30;c.fillStyle=mu;c.fillRect(p.x-2,p.y-2,4,4)});c.globalAlpha=1;
  if(st==='idle'){c.fillStyle=fg;c.font='600 16px Inter,sans-serif';c.textAlign='center';c.fillText('Spazio, clic o tocco per volare',W/2,H/2+70)}
  if(st==='run'){c.fillStyle=fg;c.font='700 42px Inter,sans-serif';c.textAlign='center';c.fillText(score,W/2,70)}}
 function loop(now){const dt=Math.min(100,now-(last||now));last=now;acc+=dt;while(acc>=1000/60){tick();acc-=1000/60}draw(now);raf=requestAnimationFrame(loop)}
 reset();
 q('#go').onclick=e=>{e.currentTarget.blur();flap()};
 cv.addEventListener('pointerdown',e=>{e.preventDefault();flap()});
 const key=e=>{if((e.key===' '||e.key==='ArrowUp'||e.key==='w')&&A.cur==='flappy'&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName)){if(st!=='idle'||A.user){e.preventDefault()}if(!e.repeat)flap()}};
 addEventListener('keydown',key);
 renderPicker();loadBest();raf=requestAnimationFrame(loop);
 GAME.onSaved=s=>{if(s>best){best=s;renderPicker()}};
 GAME.onUser=()=>{const p=A.user?A.profile(A.user):null;if(p&&p.avatar)img.src=p.avatar;best=0;bestKnown=false;loadBest()};
 return()=>{cancelAnimationFrame(raf);removeEventListener('keydown',key);st='idle'}}

const GAME={t:'Flappy',d:'Vola tra i tubi con il tuo avatar Discord. Spazio/↑/clic su PC, tocca su telefono. Più tubi superi, più ali sblocchi.',unit:'tubi',asc:false,ownRec:true,make,
 lbAvatar(r,E){const w=tierOf(Number(r.score)||0);return `<span class="wav w-${w.fx||'solid'}" style="--wc:${w.c}" title="Ali ${E(w.n)}">${r.avatar_url?`<img src="${E(r.avatar_url)}" alt="" loading="lazy">`:'<img alt="">'}</span>`}};
(window.GIOCHI_EXTRA=window.GIOCHI_EXTRA||{}).flappy=GAME;
})();
