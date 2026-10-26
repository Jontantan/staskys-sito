/* Staskys — Breakout rilassante: tanti mattoncini piccoli, bonus "+3" e "x3" che moltiplicano le palline (fino a 300). */
(function(){
const W=400,H=560,COLS=20,ROWS=16,BW=W/COLS,BH=10,TOP=56,R=3.2,CAP=300,SPD=5.2;
function make(A){
 const {q,stage,msg}=A;
 stage.innerHTML=`<div class="ghud"><span>Mattoncini <b id="sc">0</b></span><span>Livello <b id="lv">1</b></span><span>Palline <b id="nb">1</b></span><span>Record <b id="rec">${+localStorage.breakout_best||0}</b></span><button class="mute" id="mute" aria-label="Audio"></button></div>
 <canvas id="cv" width="${W}" height="${H}" class="tall2" aria-label="Breakout"></canvas>
 <button class="btn sm" id="go">Gioca</button><p class="gmsg">Muovi la racchetta col mouse o il dito. Prendi i bonus +3 e x3!</p>`;
 A.muteBtn(q('#mute'));const cv=q('#cv'),c=cv.getContext('2d'),still=A.RM();
 let br,balls,pw,parts,px=W/2,pwid=78,lives,score,level,st='idle',raf=0,last=0,acc=0,stuck=true,sndT=0,shake=0,left,keyL=0,keyR=0,combo=0,comboT=0;
 const hue=(r,cc)=>`hsl(${(r*18+cc*3+level*47)%360} 75% ${62+((r+cc)%2)*6}%)`;
 function build(){br=[];left=0;const pat=(level-1)%4;
  for(let r=0;r<ROWS;r++){br[r]=[];for(let cc=0;cc<COLS;cc++){let on=true;
   if(pat===1)on=(r+cc)%3!==0;else if(pat===2)on=Math.abs(cc-9.5)<r*.75+2;else if(pat===3)on=!((r%4===3)||(cc%5===2&&r>3));
   br[r][cc]=on?1:0;if(on)left++}}}
 function reset(){level=1;score=0;lives=3;parts=[];pw=[];build();newBall();hud()}
 function newBall(){balls=[{x:px,y:H-40-R,vx:0,vy:0}];stuck=true}
 function hud(){q('#sc').textContent=score.toLocaleString('it-IT');q('#lv').textContent=level;q('#nb').textContent=balls.length}
 function launch(){if(!stuck)return;stuck=false;const a=-Math.PI/2+(Math.random()-.5)*.6;balls[0].vx=Math.cos(a)*SPD;balls[0].vy=Math.sin(a)*SPD;A.tone('sine',660,.08,0,.04,880)}
 function snd(f){const now=performance.now();if(now-sndT<28)return;sndT=now;A.tone('sine',f,.09,0,.03);A.tone('triangle',f*2,.05,0,.012)}
 function hit(r,cc){br[r][cc]=0;left--;score++;combo++;comboT=performance.now();
  snd(330*Math.pow(2,((ROWS-r)+Math.min(combo,24))/24));
  if(!still&&parts.length<700){const x=cc*BW+BW/2,y=TOP+r*BH+BH/2,col=hue(r,cc);for(let i=0;i<6;i++){const a=Math.random()*7,v=1+Math.random()*3;parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1,l:30+Math.random()*20,c:col,s:2+Math.random()*2.5,a:Math.random()*7})}}
  if(Math.random()<.045&&pw.length<6)pw.push({x:cc*BW+BW/2,y:TOP+r*BH,t:Math.random()<.55?'+3':'x3'})}
 function spawn(n,from){for(let i=0;i<n&&balls.length<CAP;i++){const a=-Math.PI/2+(Math.random()-.5)*1.2;balls.push({x:from.x,y:from.y,vx:Math.cos(a)*SPD,vy:Math.sin(a)*SPD})}}
 function triple(){const add=[];for(const b of balls){if(balls.length+add.length>=CAP)break;for(const d of [-.35,.35]){if(balls.length+add.length>=CAP)break;const cs=Math.cos(d),sn=Math.sin(d);add.push({x:b.x,y:b.y,vx:b.vx*cs-b.vy*sn,vy:b.vx*sn+b.vy*cs})}}balls.push(...add)}
 function stepBall(b,f){b.x+=b.vx*f;b.y+=b.vy*f;
  if(b.x<R){b.x=R;b.vx=Math.abs(b.vx)}else if(b.x>W-R){b.x=W-R;b.vx=-Math.abs(b.vx)}if(b.y<R){b.y=R;b.vy=Math.abs(b.vy)}
  const r0=Math.floor((b.y-R-TOP)/BH),r1=Math.floor((b.y+R-TOP)/BH),c0=Math.floor((b.x-R)/BW),c1=Math.floor((b.x+R)/BW);
  for(let r=Math.max(0,r0);r<=Math.min(ROWS-1,r1);r++)for(let cc=Math.max(0,c0);cc<=Math.min(COLS-1,c1);cc++)if(br[r][cc]){
   const bx=cc*BW,by=TOP+r*BH,ox=Math.min(b.x+R-bx,bx+BW-(b.x-R)),oy=Math.min(b.y+R-by,by+BH-(b.y-R));
   if(ox<oy){b.vx=b.x<bx+BW/2?-Math.abs(b.vx):Math.abs(b.vx)}else{b.vy=b.y<by+BH/2?-Math.abs(b.vy):Math.abs(b.vy)}
   hit(r,cc);return true}
  const py=H-36;if(b.vy>0&&b.y+R>=py&&b.y+R<=py+10&&Math.abs(b.x-px)<=pwid/2+R){const k=(b.x-px)/(pwid/2),a=-Math.PI/2+k*1.05;b.vx=Math.cos(a)*SPD;b.vy=Math.sin(a)*SPD;b.y=py-R;
   const now=performance.now();if(now-sndT>40){sndT=now;A.tone('sine',220,.06,0,.025)}}
  return false}
 function tick(){if(st!=='run')return;
  if(keyL||keyR)px=Math.max(pwid/2,Math.min(W-pwid/2,px+(keyR-keyL)*8));
  if(stuck){balls[0].x=px;balls[0].y=H-36-R}
  else{for(let s=0;s<2;s++)for(const b of balls)stepBall(b,.5)
   balls=balls.filter(b=>b.y<H+10)}
  pw.forEach(p=>p.y+=2.2);
  pw=pw.filter(p=>{if(p.y>H-46&&p.y<H-26&&Math.abs(p.x-px)<pwid/2+10){
    if(p.t==='+3')spawn(3,{x:px,y:H-40});else triple();A.tone('triangle',784,.1,0,.04);A.tone('triangle',1175,.14,.08,.04);shake=6;return false}return p.y<H});
  if(performance.now()-comboT>700)combo=0;
  if(!balls.length){lives--;A.tone('sine',300,.3,0,.05,150);shake=10;if(lives<=0)return over();newBall();msg('Pallina persa! Vite: '+'●'.repeat(lives))}
  if(left<=0){level++;score+=50;A.tone('triangle',523,.12,0,.05);A.tone('triangle',659,.12,.1,.05);A.tone('triangle',784,.2,.2,.05);build();pw=[];newBall();msg('Livello '+level+'! +50');
   A.pop(q('#lv'))}
  q('#nb').textContent=stuck?1:balls.length;q('#sc').textContent=score.toLocaleString('it-IT')}
 function over(){st='over';[392,330,262,196].forEach((f,i)=>A.tone('sine',f,.25,i*.14,.05));const g=q('#go');g.textContent='Rigioca';g.hidden=false;
  if(score>(+localStorage.breakout_best||0)){localStorage.breakout_best=score;q('#rec').textContent=score}
  msg(`Fine! ${score} mattoncini, livello ${level}.`);if(score>0)A.save('breakout',score)}
 function draw(now){const fg=A.col('--fg'),mu=A.col('--mut');c.save();c.clearRect(0,0,W,H);
  if(shake>0&&!still){c.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);shake*=.85;if(shake<.4)shake=0}
  for(let r=0;r<ROWS;r++)for(let cc=0;cc<COLS;cc++)if(br[r][cc]){c.fillStyle=hue(r,cc);c.fillRect(cc*BW+1,TOP+r*BH+1,BW-2,BH-2)}
  parts=parts.filter(p=>(p.l-=1)>0);parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.12;p.a+=.2;c.globalAlpha=Math.min(1,p.l/25);c.fillStyle=p.c;c.save();c.translate(p.x,p.y);c.rotate(p.a);c.fillRect(-p.s/2,-p.s/2,p.s,p.s);c.restore()});c.globalAlpha=1;
  pw.forEach(p=>{c.fillStyle=p.t==='x3'?'#a35cff':'#3ecf5a';c.beginPath();c.roundRect(p.x-15,p.y-9,30,18,9);c.fill();c.fillStyle='#fff';c.font='700 11px Inter,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(p.t,p.x,p.y+1)});
  c.fillStyle=fg;c.beginPath();c.roundRect(px-pwid/2,H-36,pwid,8,4);c.fill();
  c.fillStyle=fg;c.beginPath();for(const b of balls){c.moveTo(b.x+R,b.y);c.arc(b.x,b.y,R,0,7)}c.fill();
  c.fillStyle=mu;c.font='500 12px Inter,sans-serif';c.textAlign='left';c.textBaseline='alphabetic';c.fillText('●'.repeat(Math.max(0,lives)),8,20);
  if(combo>4){c.textAlign='right';c.fillStyle=fg;c.font='700 14px Inter,sans-serif';c.fillText('Combo '+combo,W-8,22)}
  c.textAlign='center';if(st==='run'&&stuck){c.fillStyle=mu;c.font='500 13px Inter,sans-serif';c.fillText('Tocca o premi spazio per lanciare',W/2,H/2+80)}
  if(st==='idle'){c.fillStyle=fg;c.font='600 15px Inter,sans-serif';c.fillText('Premi Gioca',W/2,H/2+80)}c.restore()}
 function loop(now){const dt=Math.min(100,now-(last||now));last=now;acc+=dt;while(acc>=1000/60){tick();acc-=1000/60}draw(now);raf=requestAnimationFrame(loop)}
 const toX=e=>{const r=cv.getBoundingClientRect();return(e.clientX-r.left)/r.width*W};
 cv.addEventListener('pointermove',e=>{if(st==='run')px=Math.max(pwid/2,Math.min(W-pwid/2,toX(e)))});
 cv.addEventListener('pointerdown',e=>{e.preventDefault();if(st!=='run')return;px=Math.max(pwid/2,Math.min(W-pwid/2,toX(e)));launch()});
 cv.addEventListener('touchmove',e=>{if(st==='run')e.preventDefault()},{passive:false});
 const kd=e=>{if(A.cur!=='breakout'||st!=='run')return;if(e.key==='ArrowLeft'||e.key==='a'){keyL=1;e.preventDefault()}else if(e.key==='ArrowRight'||e.key==='d'){keyR=1;e.preventDefault()}else if(e.key===' '){e.preventDefault();launch()}};
 const ku=e=>{if(e.key==='ArrowLeft'||e.key==='a')keyL=0;if(e.key==='ArrowRight'||e.key==='d')keyR=0};
 addEventListener('keydown',kd);addEventListener('keyup',ku);
 q('#go').onclick=e=>{e.currentTarget.blur();if(!A.user)return;A.audio();reset();st='run';e.currentTarget.hidden=true;msg('')};
 reset();raf=requestAnimationFrame(loop);
 return()=>{cancelAnimationFrame(raf);removeEventListener('keydown',kd);removeEventListener('keyup',ku);st='idle'}}
(window.GIOCHI_EXTRA=window.GIOCHI_EXTRA||{}).breakout={t:'Breakout',d:'Rompi tutti i mattoncini. I bonus +3 aggiungono palline, x3 le triplica tutte (fino a 300!). Mouse/dito o frecce per muovere.',unit:'mattoncini',asc:false,make};
})();
