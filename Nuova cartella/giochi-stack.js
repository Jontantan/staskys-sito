/* Staskys — Stack: i blocchi scorrono avanti e indietro, tocca per farli cadere. La parte che sporge viene tagliata.
   Caduta perfetta = combo con suono che sale. Vista isometrica. */
(function(){
const W=360,H=560,LH=18,BASE=130,TOL=4;
function make(A){
 const {q,stage,msg}=A;
 stage.innerHTML=`<div class="ghud"><span>Blocchi <b id="sc">0</b></span><span>Combo <b id="cb">0</b></span><span>Record <b id="rec">${+localStorage.stack_best||0}</b></span><button class="mute" id="mute" aria-label="Audio"></button></div>
 <canvas id="cv" width="${W}" height="${H}" class="tall2" aria-label="Stack"></canvas>
 <button class="btn sm" id="go">Gioca</button><p class="gmsg">Tocca, clicca o premi spazio per far cadere il blocco.</p>`;
 A.muteBtn(q('#mute'));const cv=q('#cv'),c=cv.getContext('2d'),still=A.RM();
 let L,mv,deb,st='idle',score,combo,cam,camT,raf=0,last=0,hue0,flash=[],shake=0,perfects=0;
 const col=(i,l=0)=>`hsl(${(hue0+i*6)%360} 55% ${58+l}%)`;
 function reset(){hue0=Math.random()*360|0;L=[{x:0,z:0,w:BASE,d:BASE,i:0}];deb=[];flash=[];score=0;combo=0;perfects=0;cam=0;camT=0;spawn();q('#sc').textContent=0;q('#cb').textContent=0}
 function spawn(){const p=L[L.length-1],ax=L.length%2?'x':'z',sp=Math.min(4.2,1.6+L.length*.045);
  mv={x:p.x,z:p.z,w:p.w,d:p.d,i:L.length,ax,dir:1,sp,t:0};mv[ax]=-160}
 function drop(){if(st!=='run')return;const p=L[L.length-1],ax=mv.ax,sz=ax==='x'?'w':'d';let dl=mv[ax]-p[ax];
  if(Math.abs(dl)>=p[sz]){deb.push({...mv,vy:0,y:mv.i*LH,rot:0});st='over';return over()}
  if(Math.abs(dl)<=TOL){mv[ax]=p[ax];combo++;perfects++;
   const n=Math.min(combo,20),f=261.63*Math.pow(2,n/12);A.tone('triangle',f,.25,0,.05);A.tone('sine',f*2,.18,0,.02);
   if(combo>=5&&mv[sz]<BASE){mv[sz]=Math.min(BASE,mv[sz]+6);mv[ax]-=3} // dopo 5 perfetti di fila il blocco ricresce un po'
   flash.push({...mv,t:0});q('#cb').textContent=combo;A.pop(q('#cb'));score+=1}
  else{combo=0;q('#cb').textContent=0;const keep=p[sz]-Math.abs(dl),cut={...mv,vy:0,y:mv.i*LH,rot:0};
   // pezzo tagliato: centro e dimensione
   const s=Math.sign(dl);cut[sz]=Math.abs(dl);cut[ax]=mv[ax]+s*(keep/2);
   mv[sz]=keep;mv[ax]=p[ax]+dl/2;deb.push(cut);A.noise(.12,0,.05,1400,500);A.tone('sine',180+Math.min(L.length,40)*6,.1,0,.03)}
  L.push({x:mv.x,z:mv.z,w:mv.w,d:mv.d,i:mv.i});score+=1;q('#sc').textContent=score;A.pop(q('#sc'));camT=Math.max(0,(L.length-6)*LH);spawn()}
 function over(){A.tone('sine',300,.4,0,.05,90);shake=10;const g=q('#go');g.textContent='Rigioca';g.hidden=false;
  if(score>(+localStorage.stack_best||0)){localStorage.stack_best=score;q('#rec').textContent=score}
  msg(`Fine! ${score} punti, ${perfects} cadute perfette.`);if(score>0)A.save('stack',score)}
 const P=(x,y,z)=>[W/2+(x-z)*.866,H*.66+(x+z)*.5-y+cam];
 function box(b,y,h,l=0,a=1){const x0=b.x-b.w/2,x1=b.x+b.w/2,z0=b.z-b.d/2,z1=b.z+b.d/2;c.globalAlpha=a;
  const f=(pts,cl)=>{c.fillStyle=cl;c.beginPath();pts.forEach((p,i)=>{const [X,Y]=P(...p);i?c.lineTo(X,Y):c.moveTo(X,Y)});c.closePath();c.fill()};
  f([[x0,y+h,z0],[x1,y+h,z0],[x1,y+h,z1],[x0,y+h,z1]],col(b.i,8+l));
  f([[x0,y+h,z1],[x1,y+h,z1],[x1,y,z1],[x0,y,z1]],col(b.i,-8+l));
  f([[x1,y+h,z0],[x1,y+h,z1],[x1,y,z1],[x1,y,z0]],col(b.i,-20+l));c.globalAlpha=1}
 function tick(dt){cam+=(camT-cam)*.1;
  if(st==='run'){mv.t+=dt;const k=dt/16.67;mv[mv.ax]+=mv.dir*mv.sp*k;if(mv[mv.ax]>160){mv[mv.ax]=160;mv.dir=-1}if(mv[mv.ax]<-160){mv[mv.ax]=-160;mv.dir=1}}
  deb.forEach(d=>{d.vy+=.5;d.y-=d.vy});deb=deb.filter(d=>d.y>-600);flash.forEach(f=>f.t+=dt);flash=flash.filter(f=>f.t<400)}
 function draw(){c.save();c.clearRect(0,0,W,H);if(shake>0&&!still){c.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);shake*=.88;if(shake<.4)shake=0}
  const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,`hsla(${(hue0+L.length*6)%360},40%,50%,.10)`);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(0,0,W,H);
  box({x:0,z:0,w:BASE,d:BASE,i:0},-200,200,-6);
  L.forEach((b,i)=>{if(i)box(b,(i-1)*LH,LH)});
  flash.forEach(f=>{const s=1+f.t/400*.25;box({...f,w:f.w*s,d:f.d*s},(f.i-1)*LH,LH,30,1-f.t/400)});
  if(st==='run')box(mv,(mv.i-1)*LH,LH,4);
  deb.forEach(d=>box(d,d.y-LH,LH,0,.9));
  c.restore();
  if(st!=='run'){c.fillStyle=A.col('--fg');c.font='700 46px Inter,sans-serif';c.textAlign='center';c.fillText(score||'',W/2,90);
   if(st==='idle'){c.font='600 15px Inter,sans-serif';c.fillText('Premi Gioca',W/2,130)}}
  else{c.fillStyle=A.col('--fg');c.font='700 46px Inter,sans-serif';c.textAlign='center';c.globalAlpha=.85;c.fillText(score,W/2,90);c.globalAlpha=1;
   if(combo>1){c.font='600 14px Inter,sans-serif';c.fillText('Perfetto ×'+combo,W/2,116)}}}
 function loop(now){const dt=Math.min(50,now-(last||now));last=now;tick(dt);draw();raf=requestAnimationFrame(loop)}
 const tap=e=>{if(e)e.preventDefault();if(!A.user)return;if(st==='run')drop()};
 cv.addEventListener('pointerdown',tap);
 const kd=e=>{if(A.cur!=='stack')return;if(e.key===' '||e.key==='Enter'){e.preventDefault();if(st==='run')drop();else if(st!=='run'&&!e.repeat&&A.user)q('#go').click()}};
 addEventListener('keydown',kd);
 q('#go').onclick=e=>{e.currentTarget.blur();if(!A.user)return;A.audio();reset();st='run';q('#go').hidden=true;msg('')};
 reset();raf=requestAnimationFrame(loop);
 return()=>{cancelAnimationFrame(raf);removeEventListener('keydown',kd);st='idle'}}
(window.GIOCHI_EXTRA=window.GIOCHI_EXTRA||{}).stack={t:'Stack',d:'Impila i blocchi più in alto che puoi: tocca/spazio per farli cadere. Quello che sporge viene tagliato. Cadute perfette di fila = combo, bonus e il blocco ricresce.',unit:'punti',asc:false,make};
})();
