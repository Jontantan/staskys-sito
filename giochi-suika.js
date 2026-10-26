/* Staskys — Suika (gioco dell'anguria): lascia cadere i frutti, due uguali si fondono nel frutto più grande. Non superare la linea!
   Frutti con facce espressive (felici, sorpresi in caduta, entusiasti alla fusione, spaventati vicino alla linea), squash & stretch, particelle e suoni per frutto. */
(function(){
const W=360,H=540,LINE=88,G=.32;
const F=[ // raggio, colore base, colore chiaro, nome
 [11,'#e5263b','#ff7a86','Ciliegia'],[15,'#f0364f','#ff8f9c','Fragola'],[20,'#8e44d6','#c79bff','Uva'],[25,'#ffa41b','#ffd27a','Mandarino'],[31,'#ff7f11','#ffb35c','Arancia'],[38,'#e0302f','#ff7b6b','Mela'],
 [45,'#c9d93a','#f1f78a','Pera'],[53,'#ff9eb5','#ffd9e2','Pesca'],[61,'#f7c531','#fff09a','Ananas'],[70,'#8fd66b','#d6f7b8','Melone'],[82,'#2f9e44','#76d38a','Anguria']];
const PTS=F.map((_,i)=>(i+1)*(i+2)/2);
function make(A){
 const {q,stage,msg}=A;
 stage.innerHTML=`<div class="ghud"><span>Punti <b id="sc">0</b></span><span>Prossimo <b id="nx">–</b></span><span>Record <b id="rec">${+localStorage.suika_best||0}</b></span><button class="mute" id="mute" aria-label="Audio"></button></div>
 <canvas id="cv" width="${W}" height="${H}" class="tall2" aria-label="Suika"></canvas>
 <button class="btn sm" id="go">Gioca</button><p class="gmsg">Muovi e tocca/clicca per far cadere il frutto.</p>`;
 A.muteBtn(q('#mute'));const cv=q('#cv'),c=cv.getContext('2d'),still=A.RM();
 let B,parts,texts,st='idle',score,cur,nxt,aim=W/2,cool=0,raf=0,last=0,acc=0,id=1,danger=0,shake=0,chain=0,chainT=0,bumpT=0,idleT=0;
 const rnd=()=>Math.random()*5|0;
 const voice=t=>880*Math.pow(2,-t/6); // frutti piccoli = voce acuta, grandi = voce bassa
 function reset(){B=[];parts=[];texts=[];score=0;cur=rnd();nxt=rnd();cool=0;danger=0;q('#sc').textContent=0;q('#nx').textContent=F[nxt][3]}
 const mk=(t,x,y,o={})=>({id:id++,t,x,y,vx:0,vy:0,r:F[t][0],born:performance.now(),s:1,sq:0,exc:0,blink:Math.random()*4000,ph:Math.random()*6,...o});
 function drop(){if(st!=='run'||cool>0)return;const r=F[cur][0];B.push(mk(cur,Math.max(r,Math.min(W-r,aim)),LINE-r-6));
  const f=voice(cur);A.tone('sine',f,.12,0,.04,f*1.6);A.tone('triangle',f*2,.05,.02,.012);cur=nxt;nxt=rnd();q('#nx').textContent=F[nxt][3];cool=32}
 function burst(x,y,t,n){const [r,cl,lt]=F[t];if(still)return;for(let i=0;i<n;i++){const a=Math.random()*6.28,v=1.5+Math.random()*4.5;
  parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1.5,l:30+Math.random()*25,L:55,c:Math.random()<.7?cl:lt,s:2+Math.random()*3.5,k:Math.random()<.2?'star':'drop'})}}
 function merge(a,b){const t=a.t+1,x=(a.x+b.x)/2,y=(a.y+b.y)/2,now=performance.now();B=B.filter(o=>o!==a&&o!==b);if(now-chainT<700)chain++;else chain=0;chainT=now;
  let pts;if(t>=F.length){pts=PTS[F.length-1]*2;burst(x,y,10,60);shake=14;[523,659,784,1047,1319].forEach((f,i)=>A.tone('triangle',f,.18,i*.07,.045))}
  else{const n=mk(t,x,y,{vx:(a.vx+b.vx)/2,vy:(a.vy+b.vy)/2-1.2,s:still?1:.5,exc:now+1100,sq:-.25});B.push(n);pts=PTS[t];burst(x,y,t,14+t*3);if(t>=7)shake=7}
  B.forEach(o=>{if(Math.hypot(o.x-x,o.y-y)<o.r+F[Math.min(t,10)][0]*2.2)o.exc=Math.max(o.exc,now+700)}); // i vicini esultano
  pts*=1+Math.min(chain,5)*.2;pts=Math.round(pts);score+=pts;texts.push({x,y:y-10,t:'+'+pts+(chain>0?' ×'+(chain+1):''),l:50});
  const f=voice(Math.min(t,10))*Math.pow(2,Math.min(chain,7)/12);A.tone('sine',f,.09,0,.05,f*1.5);A.tone('sine',f*1.5,.12,.07,.045,f*2);A.tone('triangle',f*3,.05,.14,.015);
  const s=q('#sc');s.textContent=score.toLocaleString('it-IT');A.pop(s)}
 function bump(o,imp){if(imp<1.6)return;o.sq=Math.min(.32,Math.max(o.sq,imp*.055));const now=performance.now();if(now-bumpT>70&&imp>2.4){bumpT=now;const f=voice(o.t)*.75;A.tone('sine',f,.06,0,Math.min(.03,imp*.006),f*.8)}}
 function phys(){
  for(const o of B){o.vy+=G;o.x+=o.vx;o.y+=o.vy;o.vx*=.995;if(o.s<1)o.s=Math.min(1,o.s+.06);
   if(o.x<o.r){o.x=o.r;o.vx*=-.3}if(o.x>W-o.r){o.x=W-o.r;o.vx*=-.3}if(o.y>H-o.r){bump(o,o.vy);o.y=H-o.r;o.vy*=-.2;o.vx*=.9}}
  for(let it=0;it<4;it++)for(let i=0;i<B.length;i++)for(let j=i+1;j<B.length;j++){const a=B[i],b=B[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||.01,m=a.r+b.r;
   if(d<m){if(a.t===b.t&&it===0){merge(a,b);return}
    const nx=dx/d,ny=dy/d,ov=(m-d),wa=b.r*b.r/(a.r*a.r+b.r*b.r),wb=1-wa;a.x-=nx*ov*wa;a.y-=ny*ov*wa;b.x+=nx*ov*wb;b.y+=ny*ov*wb;
    const rv=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(rv<0){if(it===0){bump(a,-rv);bump(b,-rv)}const imp=-1.2*rv;a.vx-=imp*nx*wa;a.vy-=imp*ny*wa;b.vx+=imp*nx*wb;b.vy+=imp*ny*wb}}}
  for(const o of B){if(o.y>H-o.r)o.y=H-o.r;if(o.x<o.r)o.x=o.r;if(o.x>W-o.r)o.x=W-o.r}}
 function tick(){parts=parts.filter(p=>(p.l-=1)>0);parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.18;p.vx*=.98});texts=texts.filter(t=>(t.l-=1)>0);texts.forEach(t=>t.y-=.8);
  B&&B.forEach(o=>{o.sq*=.84;if(Math.abs(o.sq)<.005)o.sq=0});
  if(st!=='run')return;if(cool>0)cool--;phys();
  const now=performance.now(),over=B.some(o=>o.born&&now-o.born>1200&&o.y-o.r<LINE&&Math.abs(o.vy)<1.2);
  danger=over?danger+1:Math.max(0,danger-2);if(danger>120)end()}
 function end(){st='over';A.tone('sine',330,.3,0,.05,110);A.tone('sine',220,.5,.25,.05,80);shake=10;const g=q('#go');g.textContent='Rigioca';g.hidden=false;
  if(score>(+localStorage.suika_best||0)){localStorage.suika_best=score;q('#rec').textContent=score.toLocaleString('it-IT')}
  msg(`Fine! ${score.toLocaleString('it-IT')} punti.`);if(score>0)A.save('suika',score)}
 /* ---------- disegno frutti ---------- */
 function body(t,r){const [,cl,lt]=F[t],g=c.createRadialGradient(-r*.35,-r*.4,r*.1,0,0,r*1.05);g.addColorStop(0,lt);g.addColorStop(.55,cl);g.addColorStop(1,shade(cl,-.25));c.fillStyle=g;c.beginPath();c.arc(0,0,r,0,7);c.fill();
  c.save();c.beginPath();c.arc(0,0,r,0,7);c.clip();
  if(t===1){c.fillStyle='#ffe28a';for(let k=0;k<14;k++){const a=k*2.4,d=r*(.3+.6*((k*37)%10)/10);c.beginPath();c.ellipse(Math.cos(a)*d,Math.sin(a)*d+r*.1,1.2,1.8,a,0,7);c.fill()}}
  if(t===2){c.fillStyle='rgba(255,255,255,.18)';for(const [x,y] of [[-.4,-.1],[.35,-.2],[0,.35],[-.25,.45],[.45,.3],[0,-.45]]){c.beginPath();c.arc(x*r,y*r,r*.28,0,7);c.fill()}}
  if(t===3||t===4){c.fillStyle='rgba(0,0,0,.08)';for(let k=0;k<22;k++){const a=k*2.4,d=r*((k*53)%10)/10;c.beginPath();c.arc(Math.cos(a)*d,Math.sin(a)*d,1.1,0,7);c.fill()}}
  if(t===7){c.strokeStyle='rgba(200,60,90,.35)';c.lineWidth=2;c.beginPath();c.moveTo(r*.15,-r);c.quadraticCurveTo(-r*.2,0,r*.15,r);c.stroke();c.fillStyle='rgba(255,90,120,.18)';c.beginPath();c.arc(r*.45,r*.2,r*.5,0,7);c.fill()}
  if(t===8){c.strokeStyle='rgba(150,90,0,.35)';c.lineWidth=1.5;for(let k=-4;k<=4;k++){c.beginPath();c.moveTo(k*r*.35-r,-r);c.lineTo(k*r*.35+r,r);c.stroke();c.beginPath();c.moveTo(k*r*.35+r,-r);c.lineTo(k*r*.35-r,r);c.stroke()}}
  if(t===9){c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=1.2;for(let k=0;k<26;k++){const a=k*.9,b=k*1.7;c.beginPath();c.moveTo(Math.cos(a)*r,Math.sin(a)*r);c.lineTo(Math.cos(b)*r*.2,Math.sin(b)*r*.2);c.stroke()}}
  if(t===10){c.fillStyle='#1b6b2c';for(let k=-3;k<=3;k++){c.beginPath();c.ellipse(k*r*.3,0,r*.07,r*1.1,k*.08,0,7);c.fill()}}
  c.restore();
  c.fillStyle='rgba(255,255,255,.45)';c.beginPath();c.ellipse(-r*.38,-r*.45,r*.22,r*.13,-.6,0,7);c.fill();
  // picciolo, foglie, corone
  const leaf=(x,y,s,a)=>{c.save();c.translate(x,y);c.rotate(a);c.fillStyle='#3fae4a';c.beginPath();c.ellipse(s*.6,0,s*.6,s*.28,0,0,7);c.fill();c.restore()};
  const stem=(h)=>{c.strokeStyle='#6b4226';c.lineWidth=Math.max(1.5,r*.08);c.lineCap='round';c.beginPath();c.moveTo(0,-r*.9);c.quadraticCurveTo(r*.1,-r-h*.6,r*.25,-r-h);c.stroke()};
  if(t===0){stem(r*.9);leaf(r*.25,-r*1.8,r*.7,-.4)}
  else if(t===1){c.fillStyle='#3fae4a';for(let k=-2;k<=2;k++){c.save();c.translate(0,-r*.85);c.rotate(k*.5);c.beginPath();c.ellipse(0,-r*.18,r*.12,r*.3,0,0,7);c.fill();c.restore()}}
  else if(t===2){stem(r*.35);leaf(r*.2,-r*1.15,r*.5,-.2)}
  else if(t===3||t===4){leaf(0,-r*.92,r*.45,-.5)}
  else if(t===5){stem(r*.4);leaf(r*.15,-r*1.15,r*.5,-.5)}
  else if(t===6){stem(r*.45)}
  else if(t===7){leaf(-r*.05,-r*.95,r*.5,-2.6)}
  else if(t===8){c.fillStyle='#3fae4a';for(let k=-2;k<=2;k++){c.save();c.translate(0,-r*.85);c.rotate(k*.32);c.beginPath();c.moveTo(-r*.09,0);c.lineTo(0,-r*.6+Math.abs(k)*r*.12);c.lineTo(r*.09,0);c.fill();c.restore()}}}
 function shade(hex,k){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;const f=v=>Math.max(0,Math.min(255,Math.round(v*(1+k))));return`rgb(${f(r)},${f(g)},${f(b)})`}
 function face(o,r,now,mood){const ex=Math.max(1.4,r*.11),ey=-r*.05,sp=r*.3,dark='#2a1a1a';c.lineCap='round';c.lineJoin='round';
  const look=Math.max(-1,Math.min(1,o.vx*.3))*r*.04;
  // guance
  if(mood!=='scared'){c.fillStyle='rgba(255,90,110,.35)';c.beginPath();c.ellipse(-sp*1.35,ey+r*.22,r*.13,r*.08,0,0,7);c.ellipse(sp*1.35,ey+r*.22,r*.13,r*.08,0,0,7);c.fill()}
  c.fillStyle=dark;c.strokeStyle=dark;c.lineWidth=Math.max(1.3,r*.07);
  if(mood==='excited'){ // occhi ^ ^ e bocca spalancata
   for(const s of [-1,1]){c.beginPath();c.moveTo(s*sp-ex*1.1,ey+ex*.5);c.lineTo(s*sp,ey-ex*.7);c.lineTo(s*sp+ex*1.1,ey+ex*.5);c.stroke()}
   c.beginPath();c.moveTo(-r*.22,ey+r*.2);c.quadraticCurveTo(0,ey+r*.62,r*.22,ey+r*.2);c.closePath();c.fill();c.fillStyle='#ff6b81';c.beginPath();c.ellipse(0,ey+r*.36,r*.1,r*.06,0,0,7);c.fill()}
  else if(mood==='surprised'){ // occhi tondi e bocca a O
   for(const s of [-1,1]){c.fillStyle='#fff';c.beginPath();c.arc(s*sp,ey,ex*1.5,0,7);c.fill();c.fillStyle=dark;c.beginPath();c.arc(s*sp+look,ey+ex*.2,ex*.85,0,7);c.fill()}
   c.beginPath();c.ellipse(0,ey+r*.32,r*.09,r*.12,0,0,7);c.fill()}
  else if(mood==='scared'){ // occhi tremanti, bocca ondulata, goccia di sudore
   const j=still?0:Math.sin(now/30+o.ph)*r*.02;
   for(const s of [-1,1]){c.fillStyle='#fff';c.beginPath();c.arc(s*sp+j,ey,ex*1.4,0,7);c.fill();c.fillStyle=dark;c.beginPath();c.arc(s*sp+j,ey-ex*.3,ex*.5,0,7);c.fill()}
   c.beginPath();for(let k=0;k<=6;k++){const x=-r*.2+k*r*.4/6,y=ey+r*.33+(k%2?-1:1)*r*.04;k?c.lineTo(x,y):c.moveTo(x,y)}c.stroke();
   c.fillStyle='rgba(120,190,255,.9)';c.beginPath();const sx=r*.62,sy=-r*.35+(still?0:((now/12+o.ph*40)%(r*.4)));c.moveTo(sx,sy-r*.14);c.quadraticCurveTo(sx+r*.1,sy,sx,sy+r*.06);c.quadraticCurveTo(sx-r*.1,sy,sx,sy-r*.14);c.fill()}
  else{ // felice, con battito di ciglia
   const bl=((now+o.blink)%3600)<120;
   for(const s of [-1,1]){if(bl){c.beginPath();c.moveTo(s*sp-ex,ey);c.lineTo(s*sp+ex,ey);c.stroke()}else{c.beginPath();c.arc(s*sp+look,ey,ex,0,7);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(s*sp+look+ex*.35,ey-ex*.35,ex*.38,0,7);c.fill();c.fillStyle=dark}}
   c.beginPath();c.arc(0,ey+r*.16,r*.16,.25,Math.PI-.25);c.stroke()}}
 function fruit(o,now,ghost){const t=o.t,r=F[t][0];let sx=1+o.sq,sy=1-o.sq;
  if(!still&&o.vy>3.5){const k=Math.min(.12,(o.vy-3.5)*.02);sx-=k;sy+=k}
  const wob=still?0:Math.sin(now/260+o.ph)*.015;
  c.save();c.translate(o.x,o.y+r*(1-sy));c.scale(o.s*(sx+wob),o.s*(sy-wob));if(ghost)c.globalAlpha=.45;
  body(t,r);
  let mood='happy';if(now<o.exc)mood='excited';else if(st==='run'&&(danger>0||(o.born&&now-o.born>900&&o.y-o.r<LINE+28)))mood='scared';else if(o.vy>2.5)mood='surprised';
  if(ghost)mood=cool>0?'surprised':'happy';
  face(o,r,now,mood);c.restore()}
 function draw(now){const fg=A.col('--fg'),mu=A.col('--mut');c.save();c.clearRect(0,0,W,H);if(shake>0&&!still){c.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);shake*=.86;if(shake<.4)shake=0}
  const bgG=c.createLinearGradient(0,0,0,H);bgG.addColorStop(0,'rgba(255,200,120,.05)');bgG.addColorStop(1,'rgba(255,120,160,.10)');c.fillStyle=bgG;c.fillRect(0,0,W,H);
  c.strokeStyle=danger>0?'#e5413b':mu;c.globalAlpha=danger>0?.5+.5*Math.sin(now/80):.5;c.setLineDash([6,6]);c.lineWidth=2;c.beginPath();c.moveTo(0,LINE);c.lineTo(W,LINE);c.stroke();c.setLineDash([]);c.globalAlpha=1;
  if(st==='run'){const r=F[cur][0],x=Math.max(r,Math.min(W-r,aim));c.strokeStyle=mu;c.globalAlpha=.25;c.beginPath();c.moveTo(x,LINE);c.lineTo(x,H);c.stroke();c.globalAlpha=1;
   fruit({t:cur,x,y:LINE-r-6+(still?0:Math.sin(now/300)*2),vx:0,vy:0,s:1,sq:0,exc:0,blink:0,ph:0,born:0},now,cool>0)}
  B.forEach(o=>fruit(o,now));
  parts.forEach(p=>{c.globalAlpha=Math.min(1,p.l/20);c.fillStyle=p.c;if(p.k==='star'){c.fillStyle='#fff8d0';c.save();c.translate(p.x,p.y);c.rotate(p.l*.2);c.beginPath();for(let k=0;k<10;k++){const a=k*Math.PI/5,rr=k%2?p.s*.45:p.s*1.2;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}c.fill();c.restore()}
   else{c.beginPath();c.ellipse(p.x,p.y,p.s*.8,p.s*1.15,Math.atan2(p.vy,p.vx)+Math.PI/2,0,7);c.fill()}});c.globalAlpha=1;
  texts.forEach(t=>{c.globalAlpha=Math.min(1,t.l/25);c.fillStyle=fg;c.font='800 16px Inter,sans-serif';c.textAlign='center';c.fillText(t.t,t.x,t.y)});c.globalAlpha=1;
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
 reset();
 // vetrina iniziale: tutti i frutti in fila che salutano
 B=F.slice(0,7).map((f,i)=>mk(i,30+i*48,H-90-f[0]));B.forEach(o=>{o.born=0});
 raf=requestAnimationFrame(loop);
 return()=>{cancelAnimationFrame(raf);removeEventListener('keydown',kd);st='idle'}}
(window.GIOCHI_EXTRA=window.GIOCHI_EXTRA||{}).suika={t:'Suika',d:'Fai cadere i frutti: due uguali si fondono in uno più grande, fino all\'anguria. Se i frutti restano sopra la linea tratteggiata, hai perso. Mouse/dito o frecce + spazio.',unit:'punti',asc:false,make};
})();
