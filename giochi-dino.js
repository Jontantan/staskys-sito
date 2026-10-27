/* Staskys — Dino runner (stile Chrome): salta con spazio/↑/tocco, abbassati con ↓/scorri giù. */
(function(){
function make(A){
 const {q,stage,msg}=A;
 stage.innerHTML=`<div class="ghud"><span>Punti <b id="sc">0</b></span><span>Record <b id="rec">${+localStorage.dino_best||0}</b></span><button class="mute" id="mute" aria-label="Audio"></button></div>
 <canvas id="cv" width="600" height="220" class="wide" aria-label="Dino runner"></canvas>
 <div class="pad2"><button class="btn ghost sm" id="duck">↓ Abbassati</button><button class="btn ghost sm" id="jump">↑ Salta</button></div>
 <button class="btn sm" id="go">Gioca</button><p class="gmsg"></p>`;
 const cv=q('#cv'),c=cv.getContext('2d'),W=600,H=220,GY=180,still=A.RM();A.muteBtn(q('#mute'));
 const SFX={jump:()=>A.beep(520,.07,0,.05,980),point:()=>{A.beep(988,.06,0,.04);A.beep(1319,.12,.06,.04)},over:()=>{A.beep(392,.12,0,.06);A.beep(196,.25,.1,.06)}};
 /* --- fisica e difficoltà: la velocità cresce sempre col tempo (fino a VMAX); la distanza minima tra ostacoli
     è calcolata dal tempo di volo del salto, quindi c'è SEMPRE lo spazio fisico per schivare. --- */
 const V0=6,VMAX=25,JV=12.5,G=.75,AIR=Math.ceil(2*JV/G)+1; // AIR = tic in aria per un salto completo (~35)
 const spd=t=>{const s=t/60;return Math.min(VMAX,V0+Math.min(s,45)*.13+Math.max(0,s-45)*.05)}; // +0,13/s per 45 s, poi +0,05/s (max dopo ~5 min)
 const lvl=()=>Math.min(1,(speed-V0)/(VMAX-V0)); // 0 = facile → 1 = estremo
 let T=0,near=0,st='idle',dy,vy,duck=false,obs,speed,dist,score,raf=0,acc=0,last=0,next,deadT=0,clouds=[],ground=0,milestone=0;
 function reset(){dy=0;vy=0;duck=false;obs=[];speed=V0;dist=0;near=0;score=0;next=420;T=0;milestone=100;q('#sc').textContent=0;clouds=[{x:120,y:40},{x:380,y:60},{x:540,y:30}]}
 function start(){A.audio();reset();st='run';q('#go').hidden=true;msg('')}
 function jump(){if(!A.user)return;if(st==='dead'){if(performance.now()-deadT>500)start();return}if(st==='idle'){start()}if(dy===0){vy=JV;SFX.jump()}}
 function die(){st='dead';deadT=performance.now();SFX.over();if(!still){cv.classList.remove('shake');void cv.offsetWidth;cv.classList.add('shake')}
  const g=q('#go');g.textContent='Rigioca';g.hidden=false;
  if(score>(+localStorage.dino_best||0)){localStorage.dino_best=score;q('#rec').textContent=score;A.pop(q('#rec'));msg(`Nuovo record! ${score} punti.`)}else msg(`Fine! ${score} punti.`);
  if(score>0)A.save('dino',score)}
 function box(){return duck&&dy===0?{x:40,y:GY-26,w:52,h:26}:{x:44,y:GY-48-dy,w:38,h:48}}
 function tick(){if(st!=='run')return;
  T++;speed=spd(T);dist+=speed;score=Math.floor(dist/10);
  if(dy>0||vy>0){dy+=vy;vy-=duck?1.6:G;if(dy<=0){dy=0;vy=0}}
  ground=(ground+speed)%40;clouds.forEach(k=>{k.x-=speed*.2;if(k.x<-60){k.x=W+Math.random()*100;k.y=20+Math.random()*50}});
  if((next-=speed)<=0)spawn();
  obs.forEach(o=>o.x-=o.b?speed*BIRD:speed);obs=obs.filter(o=>o.x>-90);
  const b=box();for(const o of obs){if(b.x+6<o.x+o.w&&b.x+b.w-6>o.x&&b.y+6<o.y+o.h&&b.y+b.h>o.y+4){die();break}}
  const s=q('#sc');s.textContent=score;if(score>=milestone){milestone+=100;A.tone('square',988*Math.pow(2,Math.min(24,milestone/100-2)/24),.06,0,.04);A.tone('square',1319*Math.pow(2,Math.min(24,milestone/100-2)/24),.12,.06,.04);if(!still)A.pop(s)}}
 /* Nuovo ostacolo + distanza (in px) prima del successivo.
    Distanza minima = quanto corri durante un salto intero + un margine di reazione (che si accorcia con la difficoltà
    ma non scende mai sotto ~8 tic ≈ 130 ms) + la larghezza dell'ostacolo. Il 12% in più copre l'aumento di velocità
    mentre l'ostacolo si avvicina e il 10% in più degli uccelli. */
 const BIRD=1.1;
 function spawn(){const L=lvl();let o;
  const bird=score>300&&Math.random()<Math.min(.4,.15+L*.3);
  if(bird)o={x:W,y:GY-[24,52,76][Math.random()*3|0],w:40,h:24,b:1};
  else{const max=L>.55?4:L>.3?3:score>250?2:1,n=1+(Math.random()*max|0),h=30+Math.random()*(14+L*8);o={x:W,y:GY-h,w:16*n+6*(n-1),h,n}}
  obs.push(o);
  const react=Math.round(26-18*L),             // margine di reazione: 26 tic all'inizio → 8 tic al massimo
        minGap=speed*1.12*BIRD*(AIR+react)+o.w,
        extra=speed*Math.random()*(70-56*L);    // spazio casuale in più: tanto all'inizio, poco alla fine
  next=minGap+extra;
  /* a volte, dopo un po', due ostacoli ravvicinati da saltare insieme (sempre superabili con un solo salto) */
  if(!o.b&&L>.25&&Math.random()<.18+L*.2){const n=1+(Math.random()*2|0),w=16*n+6*(n-1),h=30+Math.random()*14,gapIn=8+Math.random()*10,
    clear=jumpSpan(o.h>h?o.h:h)-30; // px percorsi stando abbastanza in alto
    if(o.w+gapIn+w<clear){obs.push({x:W+o.w+gapIn,y:GY-h,w,h,n});next+=gapIn+w}}}
 /* px orizzontali percorsi mentre il dino è sopra l'altezza h (con il salto pieno) */
 function jumpSpan(h){const need=h-4;let y=0,v=JV,t=0,up=0;while(true){y+=v;v-=G;t++;if(y<=0)break;if(y>need)up++}return up*speed}
 function draw(now){const fg=A.col('--fg'),ln=A.col('--line'),mu=A.col('--mut'),bg=A.col('--soft');c.clearRect(0,0,W,H);
  c.fillStyle=ln;clouds.forEach(k=>{c.beginPath();c.roundRect(k.x,k.y,46,12,6);c.fill()});
  c.strokeStyle=fg;c.lineWidth=2;c.beginPath();c.moveTo(0,GY);c.lineTo(W,GY);c.stroke();
  c.fillStyle=mu;for(let x=-ground;x<W;x+=40){c.fillRect(x+7,GY+8,6,2);c.fillRect(x+27,GY+15,3,2)}
  c.fillStyle=fg;obs.forEach(o=>{if(o.b){const up=still?0:Math.floor(now/160)%2;c.fillRect(o.x+8,o.y+8,26,8);c.fillRect(o.x,o.y+10,10,4);c.beginPath();c.moveTo(o.x+14,o.y+10);c.lineTo(o.x+24,up?o.y-6:o.y+24);c.lineTo(o.x+28,o.y+10);c.fill()}
   else for(let i=0;i<o.n;i++){const x=o.x+i*22;c.fillRect(x+5,o.y,6,o.h);c.fillRect(x,o.y+o.h*.3,4,o.h*.25);c.fillRect(x+12,o.y+o.h*.2,4,o.h*.25);c.fillRect(x,o.y+o.h*.5,6,3);c.fillRect(x+10,o.y+o.h*.4,6,3)}});
  const b=box(),leg=st==='run'&&dy===0&&!still?Math.floor(now/90)%2:0;c.fillStyle=fg;
  if(duck&&dy===0&&st==='run'){c.fillRect(b.x,b.y+4,40,16);c.fillRect(b.x+32,b.y,22,14);c.fillStyle=bg;c.fillRect(b.x+44,b.y+3,3,3);c.fillStyle=fg;c.fillRect(b.x+8,b.y+20,5,leg?6:3);c.fillRect(b.x+24,b.y+20,5,leg?3:6)}
  else{c.fillRect(b.x+16,b.y,24,16);c.fillRect(b.x,b.y+14,30,22);c.fillRect(b.x+26,b.y+20,8,3);c.fillRect(b.x-6,b.y+16,8,8);c.fillStyle=bg;c.fillRect(b.x+20,b.y+4,4,4);c.fillStyle=fg;
   if(st==='dead'){c.fillStyle=bg;c.fillRect(b.x+19,b.y+3,6,6);c.fillStyle=fg;c.fillRect(b.x+21,b.y+5,2,2)}
   c.fillRect(b.x+6,b.y+36,6,leg?12:8);c.fillRect(b.x+18,b.y+36,6,leg?8:12)}
  if(st==='idle'){c.fillStyle=fg;c.font='600 15px Inter,sans-serif';c.textAlign='center';c.fillText('Spazio, ↑ o tocca per saltare',W/2,90)}}
 function loop(now){const dt=Math.min(100,now-(last||now));last=now;acc+=dt;while(acc>=1000/60){tick();acc-=1000/60}draw(now);raf=requestAnimationFrame(loop)}
 const kd=e=>{if(A.cur!=='dino')return;if(e.key===' '||e.key==='ArrowUp'||e.key==='w'){if(A.user)e.preventDefault();if(!e.repeat)jump()}else if(e.key==='ArrowDown'||e.key==='s'){if(st==='run'){e.preventDefault();duck=true}}};
 const ku=e=>{if(e.key==='ArrowDown'||e.key==='s')duck=false};
 addEventListener('keydown',kd);addEventListener('keyup',ku);
 let t0=null;cv.addEventListener('pointerdown',e=>{e.preventDefault();t0={y:e.clientY,t:performance.now()}});
 cv.addEventListener('pointermove',e=>{if(t0&&e.clientY-t0.y>25&&st==='run'){duck=true;t0.d=1}});
 const up=()=>{if(!t0)return;if(!t0.d)jump();duck=false;t0=null};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
 const jb=q('#jump'),db=q('#duck');jb.addEventListener('pointerdown',e=>{e.preventDefault();jump()});
 db.addEventListener('pointerdown',e=>{e.preventDefault();if(st==='run')duck=true});['pointerup','pointerleave','pointercancel'].forEach(v=>db.addEventListener(v,()=>duck=false));
 q('#go').onclick=e=>{e.currentTarget.blur();if(!A.user)return;start()};
 reset();raf=requestAnimationFrame(loop);
 return()=>{cancelAnimationFrame(raf);removeEventListener('keydown',kd);removeEventListener('keyup',ku);st='idle'}}
(window.GIOCHI_EXTRA=window.GIOCHI_EXTRA||{}).dino={t:'Dino runner',d:'Corri ed evita cactus e uccelli: la velocità aumenta di continuo e diventa estrema, ma c\'è sempre lo spazio per saltare. Spazio/↑ per saltare, ↓ per abbassarti; su telefono tocca o scorri giù.',unit:'punti',asc:false,make};
})();
