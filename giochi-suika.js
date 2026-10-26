/* Staskys — Suika (gioco dell'anguria): lascia cadere i frutti, due uguali si fondono nel frutto più grande. Non superare la linea! */
(function(){
const W=360,H=540,LINE=88,G=.32;
const F=[ // raggio, colore, nome
 [11,'#e5413b','Ciliegia'],[15,'#ff6b81','Fragola'],[20,'#a35cff','Uva'],[25,'#ffb23f','Mandarino'],[31,'#ff8a1e','Arancia'],[38,'#e53e3e','Mela'],
 [45,'#f6e05e','Pera'],[53,'#ffa7c4','Pesca'],[61,'#ffd23f','Ananas'],[70,'#9ae66e','Melone'],[82,'#2f9e44','Anguria']];
const PTS=F.map((_,i)=>(i+1)*(i+2)/2);
function make(A){
 const {q,stage,msg}=A;
 stage.innerHTML=`<div class="ghud"><span>Punti <b id="sc">0</b></span><span>Prossimo <b id="nx">–</b></span><span>Record <b id="rec">${+localStorage.suika_best||0}</b></span><button class="mute" id="mute" aria-label="Audio"></button></div>
 <canvas id="cv" width="${W}" height="${H}" class="tall2" aria-label="Suika"></canvas>
 <button class="btn sm" id="go">Gioca</button><p class="gmsg">Muovi e tocca/clicca per far cadere il frutto.</p>`;
 A.muteBtn(q('#mute'));const cv=q('#cv'),c=cv.getContext('2d'),still=A.RM();
 let B,pops,st='idle',score,cur,nxt,aim=W/2,cool=0,raf=0,last=0,acc=0,id=1,danger=0,shake=0,chain=0,chainT=0;
 const rnd=()=>Math.random()*5|0;
 function reset(){B=[];pops=[];score=0;cur=rnd();nxt=rnd();cool=0;danger=0;q('#sc').textContent=0;q('#nx').textContent=F[nxt][2]}
 function drop(){if(st!=='run'||cool>0)return;const r=F[cur][0];B.push({id:id++,t:cur,x:Math.max(r,Math.min(W-r,aim)),y:LINE-r-6,vx:0,vy:0,r,born:performance.now(),s:1});
  A.tone('sine',300-cur*20,.08,0,.03,200);cur=nxt;nxt=rnd();q('#nx').textContent=F[nxt][2];cool=32}
 function merge(a,b){const t=a.t+1;B=B.filter(o=>o!==a&&o!==b);const now=performance.now();if(now-chainT<600)chain++;else chain=0;chainT=now;
  if(t>=F.length){score+=PTS[F.length-1]*2;pops.push({x:(a.x+b.x)/2,y:(a.y+b.y)/2,r:90,c:F[10][1],t:0});A.tone('triangle',1047,.4,0,.05);shake=12}
  else{const r=F[t][0];B.push({id:id++,t,x:(a.x+b.x)/2,y:(a.y+b.y)/2,vx:(a.vx+b.vx)/2,vy:(a.vy+b.vy)/2-1,r,born:0,s:still?1:.55});score+=PTS[t];
   pops.push({x:(a.x+b.x)/2,y:(a.y+b.y)/2,r,c:F[t][1],t:0});if(t>=7)shake=6}
  const f=220*Math.pow(2,(t+Math.min(chain,8))/9);A.tone('triangle',f,.14,0,.045);A.tone('sine',f*1.5,.1,.04,.025);
  const s=q('#sc');s.textContent=score.toLocaleString('it-IT');A.pop(s)}
 function phys(){
  for(const o of B){o.vy+=G;o.x+=o.vx;o.y+=o.vy;o.vx*=.995;if(o.s<1)o.s=Math.min(1,o.s+.06);
   if(o.x<o.r){o.x=o.r;o.vx*=-.3}if(o.x>W-o.r){o.x=W-o.r;o.vx*=-.3}if(o.y>H-o.r){o.y=H-o.r;o.vy*=-.2;o.vx*=.9}}
  for(let it=0;it<4;it++)for(let i=0;i<B.length;i++)for(let j=i+1;j<B.length;j++){const a=B[i],b=B[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||.01,m=a.r+b.r;
   if(d<m){if(a.t===b.t&&it===0){merge(a,b);return}
    const nx=dx/d,ny=dy/d,ov=(m-d),wa=b.r*b.r/(a.r*a.r+b.r*b.r),wb=1-wa;a.x-=nx*ov*wa;a.y-=ny*ov*wa;b.x+=nx*ov*wb;b.y+=ny*ov*wb;
    const rv=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(rv<0){const imp=-1.2*rv;a.vx-=imp*nx*wa;a.vy-=imp*ny*wa;b.vx+=imp*nx*wb;b.vy+=imp*ny*wb}}}
  for(const o of B){if(o.y>H-o.r)o.y=H-o.r;if(o.x<o.r)o.x=o.r;if(o.x>W-o.r)o.x=W-o.r}}
 function tick(){if(st!=='run')return;if(cool>0)cool--;phys();
  const now=performance.now(),over=B.some(o=>o.born&&now-o.born>1200&&o.y-o.r<LINE&&Math.abs(o.vy)<1.2||(!o.born&&o.y-o.r<LINE-10&&Math.abs(o.vy)<1.2));
  danger=over?danger+1:Math.max(0,danger-2);if(danger>120)end()}
 function end(){st='over';A.tone('sine',330,.3,0,.05,110);A.tone('sine',220,.5,.25,.05,80);shake=10;const g=q('#go');g.textContent='Rigioca';g.hidden=false;
  if(score>(+localStorage.suika_best||0)){localStorage.suika_best=score;q('#rec').textContent=score.toLocaleString('it-IT')}
  msg(`Fine! ${score.toLocaleString('it-IT')} punti.`);if(score>0)A.save('suika',score)}
 function fruit(t,x,y,s=1,a=1){const [r,cl]=F[t];c.globalAlpha=a;c.fillStyle=cl;c.beginPath();c.arc(x,y,r*s,0,7);c.fill();
  c.fillStyle='rgba(255,255,255,.35)';c.beginPath();c.arc(x-r*.35*s,y-r*.35*s,r*.28*s,0,7);c.fill();
  if(t===10){c.strokeStyle='#1b6b2c';c.lineWidth=3;for(let k=-2;k<=2;k++){c.beginPath();c.ellipse(x,y,Math.abs(k)*r*.3*s+1,r*s,0,0,7);c.stroke()}}
  c.fillStyle='rgba(0,0,0,.55)';const e=Math.max(1.5,r*.09*s);c.beginPath();c.arc(x-r*.25*s,y,e,0,7);c.arc(x+r*.25*s,y,e,0,7);c.fill();
  c.strokeStyle='rgba(0,0,0,.55)';c.lineWidth=Math.max(1,r*.05);c.beginPath();c.arc(x,y+r*.12*s,r*.15*s,.2,Math.PI-.2);c.stroke();c.globalAlpha=1}
 function draw(now){const fg=A.col('--fg'),mu=A.col('--mut');c.save();c.clearRect(0,0,W,H);if(shake>0&&!still){c.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);shake*=.86;if(shake<.4)shake=0}
  c.strokeStyle=danger>0?'#e5413b':mu;c.globalAlpha=danger>0?.5+.5*Math.sin(now/80):.5;c.setLineDash([6,6]);c.lineWidth=2;c.beginPath();c.moveTo(0,LINE);c.lineTo(W,LINE);c.stroke();c.setLineDash([]);c.globalAlpha=1;
  if(st==='run'){const r=F[cur][0],x=Math.max(r,Math.min(W-r,aim));c.strokeStyle=mu;c.globalAlpha=.25;c.beginPath();c.moveTo(x,LINE);c.lineTo(x,H);c.stroke();c.globalAlpha=1;fruit(cur,x,LINE-r-6,1,cool>0?.4:1)}
  B.forEach(o=>fruit(o.t,o.x,o.y,o.s));
  pops=pops.filter(p=>(p.t+=1)<22);pops.forEach(p=>{c.strokeStyle=p.c;c.globalAlpha=1-p.t/22;c.lineWidth=3;c.beginPath();c.arc(p.x,p.y,p.r+p.t*2.2,0,7);c.stroke();
   for(let k=0;k<8;k++){const a=k/8*6.28;c.fillStyle=p.c;c.beginPath();c.arc(p.x+Math.cos(a)*(p.r+p.t*3),p.y+Math.sin(a)*(p.r+p.t*3),2.5,0,7);c.fill()}});c.globalAlpha=1;
  if(st==='idle'){c.fillStyle=fg;c.font='600 15px Inter,sans-serif';c.textAlign='center';c.fillText('Premi Gioca',W/2,H/2)}c.restore()}
 function loop(now){const dt=Math.min(100,now-(last||now));last=now;acc+=dt;while(acc>=1000/60){tick();acc-=1000/60}draw(now);raf=requestAnimationFrame(loop)}
 const toX=e=>{const r=cv.getBoundingClientRect();return(e.clientX-r.left)/r.width*W};
 cv.addEventListener('pointermove',e=>{aim=toX(e)});
 cv.addEventListener('pointerdown',e=>{e.preventDefault();aim=toX(e)});
 cv.addEventListener('pointerup',e=>{if(!A.user)return;aim=toX(e);drop()});
 cv.addEventListener('touchmove',e=>{if(st==='run')e.preventDefault()},{passive:false});
 const kd=e=>{if(A.cur!=='suika'||st!=='run')return;if(e.key==='ArrowLeft'||e.key==='a'){aim=Math.max(0,aim-14);e.preventDefault()}else if(e.key==='ArrowRight'||e.key==='d'){aim=Math.min(W,aim+14);e.preventDefault()}else if(e.key===' '||e.key==='ArrowDown'){e.preventDefault();drop()}};
 addEventListener('keydown',kd);
 q('#go').onclick=e=>{e.currentTarget.blur();if(!A.user)return;A.audio();reset();st='run';q('#go').hidden=true;msg('')};
 reset();raf=requestAnimationFrame(loop);
 return()=>{cancelAnimationFrame(raf);removeEventListener('keydown',kd);st='idle'}}
(window.GIOCHI_EXTRA=window.GIOCHI_EXTRA||{}).suika={t:'Suika',d:'Fai cadere i frutti: due uguali si fondono in uno più grande, fino all\'anguria. Se i frutti restano sopra la linea tratteggiata, hai perso. Mouse/dito o frecce + spazio.',unit:'punti',asc:false,make};
})();
