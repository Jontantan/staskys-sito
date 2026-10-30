/* Staskys — Breakout "virale": mappe grandi piene di mattoncini, blocchi d'acciaio indistruttibili che formano celle e
   tasche dove le palline restano intrappolate a rimbalzare, bonus "+3" e "x3" (fino a 300 palline), a tempo.
   Aggiornamento 4: più bonus e meno fortuna. Un bonus garantito ogni DROP_EVERY mattoncini, pescato da un "sacchetto"
   mescolato (così escono tutti i tipi a turno), più nuovi bonus: racchetta larga, palline lente, fuoco, rete e multi. */
(function(){
const W=400,H=560,COLS=25,ROWS=36,BW=W/COLS,BH=10,TOP=40,R=3.2,CAP=300,SPD=5.2,PY=H-36;
const DROP_EVERY=8,DROP_RND=.04,PW_MAX=8,FALL=2.2; // bonus: uno garantito ogni 8 mattoncini + piccola probabilità extra
/* tipi di bonus: etichetta, colore, durata in secondi (0 = istantaneo) */
const PWT={'+3':{c:'#3ecf5a',d:0},'x3':{c:'#a35cff',d:0},'MULTI':{c:'#ff4fa3',d:0},'LARGA':{c:'#3b9cff',d:12},'LENTA':{c:'#19b8c3',d:10},'FUOCO':{c:'#ff6a2b',d:8},'RETE':{c:'#e8a512',d:12}};
const BAG=['+3','x3','MULTI','LARGA','LENTA','FUOCO','RETE','+3','x3','LARGA'];
const TIME=90,BONUS_T=20; // secondi iniziali e secondi regalati per la prima mappa completata (poi 15, 10, 10, 5…)
/* ===== MAPPE: celle 25×36. 0 vuoto, 1 mattoncino, 2 mattoncino duro (2 colpi), 9 acciaio (indistruttibile) ===== */
function grid(f){const g=new Int8Array(ROWS*COLS);for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)g[r*COLS+c]=f(r,c)|0;return g}
const MAPS=[
 {n:'Le celle',f:(r,c)=>{ // 3×3 gabbie d'acciaio con un'apertura in basso, piene di mattoncini
   if(r<2)return 1;const cr=(r-2)%11,cc=(c-1)%8;if(c<1||c>23||r>34)return 0;
   if(cc===7||cr===10)return 1; // corridoi tra le gabbie
   const wall=cc===0||cc===6||cr===0||cr===9;if(wall)return cr===9&&cc>=2&&cc<=4?0:9;
   return cr>=3&&cr<=6&&cc>=2&&cc<=4?2:1}},
 {n:'La fortezza',f:(r,c)=>{ // un'unica grande scatola d'acciaio aperta sotto: dentro si scatena il caos
   if(r<1||r>33)return 0;
   if(r===1||c===1||c===23)return c>=1&&c<=23?9:0;
   if(r===33)return c>=1&&c<=23&&(c<10||c>14)?9:0;
   if(c<1||c>23)return 0;
   if(r>=10&&r<=22&&c>=7&&c<=17)return(r===10||r===22||c===7||c===17)&&!(r===22&&c>=11&&c<=13)?2:1;
   return r>=2&&r<=30?1:0}},
 {n:"L'alveare",f:(r,c)=>{ // labirinto di stanze collegate da porticine
   if(r>33)return 0;const rr=r%8,cc=c%6;
   if(rr===0&&r>0)return cc>=2&&cc<=3?0:9;
   if(cc===0)return rr>=3&&rr<=5?0:9;
   return (rr+cc)%5===0?2:1}},
 {n:'La spirale',f:(r,c)=>{ // una spirale d'acciaio: le palline girano e girano
   if(r>33)return 0;const x=c-12,y=r-16.5,d=Math.max(Math.abs(x),Math.abs(y*0.72));
   const rd=Math.round(d),ring=rd%4===0&&d>1.5&&d<15,gap=rd===12?(Math.abs(x)<2.6&&y>0||Math.abs(x)<1.6&&y<0):(rd/4)%2===0?(y>0&&Math.abs(x)<1.6):(y<0&&Math.abs(x)<1.6);
   return ring&&!gap?9:(d<14.5?((r+c)%7===0?2:1):0)}},
 {n:'La clessidra',f:(r,c)=>{ // due bulbi pieni di mattoncini con il collo stretto
   if(r>33)return 0;const half=Math.abs(r-16.5),w=2+half*.62,edge=Math.abs(c-12);
   if(Math.abs(edge-w)<.7&&half>2)return r===33||r===0?9:9;
   if(edge<w-.6)return half<4?2:1;
   return r<3||r>30?1:0}},
 {n:'Le colonne',f:(r,c)=>{ // pilastri d'acciaio e mensole: rimbalzi infiniti tra i pilastri
   if(r>33)return 0;
   if(c%6===3&&r>=6&&r<=30&&r%10!==8)return 9;
   if((r===12||r===24)&&c%6!==0&&c%6!==3&&(c%12<6))return 9;
   return r%10===4?2:1}},
 {n:'Il cuore',f:(r,c)=>{ // un grande cuore dentro una cornice con le feritoie
   if(r>33)return 0;const x=(c-12)/11.2,y=(13-r)/12.5,v=Math.pow(x*x+y*y-1,3)-x*x*y*y*y;
   if(r===0||c===0||c===24)return (r===0?c%4!==2:r%5!==2)?9:0;
   if(v<=0)return v>-0.05?2:1;return r>28?0:(r+c)%2?1:0}}
];
function make(A){
 const {q,stage,msg}=A;
 stage.innerHTML=`<div class="ghud"><span>Tempo <b id="tm">${TIME}</b>s</span><span>Mattoncini <b id="sc">0</b></span><span>Mappa <b id="lv">1</b></span><span>Palline <b id="nb">1</b></span><span>Record <b id="rec">${+localStorage.breakout_best||0}</b></span><button class="mute" id="mute" aria-label="Audio"></button></div>
 <canvas id="cv" width="${W}" height="${H}" class="tall2" aria-label="Breakout"></canvas>
 <button class="btn sm" id="go">Gioca</button><p class="gmsg">Hai ${TIME} secondi: rompi più mattoncini che puoi. I blocchi grigi sono d'acciaio. Ogni 8 mattoncini cade un bonus: prendilo con la racchetta!</p>`;
 A.muteBtn(q('#mute'));const cv=q('#cv'),c=cv.getContext('2d'),still=A.RM();
 let dry=0,bag=[],eff={LARGA:0,LENTA:0,FUOCO:0,RETE:0},br,hp,balls,pw,parts,px=W/2,pwid=80,score,level,st='idle',raf=0,last=0,acc=0,stuck=true,sndT=0,shake=0,left,keyL=0,keyR=0,combo=0,comboT=0,timeLeft=TIME,stuckT=0,banner=null,lastSec=-1;
 const hueN=()=>(level*67+195)%360,hue=()=>`hsl(${hueN()} 72% 62%)`,hueD=()=>`hsl(${hueN()} 62% 42%)`; // un solo colore per mappa
 const ST=window.__breakoutStats={drop:0,caught:0,types:{},eff:()=>eff,spawnPw:(t,x,y)=>pw.push({x,y,t,ph:0}),pw:()=>pw,balls:()=>balls,cv:()=>cv,get left(){return left},get time(){return timeLeft},set time(v){timeLeft=v},get score(){return score},get level(){return level},set px(v){px=v},launch:()=>launch(),nextMap:()=>{for(let i=0;i<br.length;i++)if(br[i]&&br[i]<9){br[i]=0}left=0}};
 const bonusT2=()=>Math.max(5,BONUS_T-5*Math.max(0,level-2)-(level>4?5:0));
 function build(){const m=MAPS[(level-1)%MAPS.length];br=grid(m.f);hp=new Int8Array(br.length);left=0;
  for(let i=0;i<br.length;i++){if(br[i]===2)hp[i]=2;if(br[i]&&br[i]<9)left++}
  // la zona sotto le mappe resta libera per la racchetta
  banner={t:m.n,at:performance.now()}}
 function nextType(){if(!bag.length){bag=BAG.slice();for(let i=bag.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[bag[i],bag[j]]=[bag[j],bag[i]]}}return bag.pop()}
 function reset(){level=1;score=0;timeLeft=TIME;parts=[];pw=[];dry=0;bag=[];for(const k in eff)eff[k]=0;pwid=80;build();newBall();hud()}
 function newBall(){balls=[{x:px,y:PY-R,vx:0,vy:0}];stuck=true;stuckT=performance.now()}
 function hud(){q('#sc').textContent=score.toLocaleString('it-IT');q('#lv').textContent=level;q('#nb').textContent=balls.length;q('#tm').textContent=Math.ceil(timeLeft)}
 function launch(){if(!stuck)return;stuck=false;const a=-Math.PI/2+(Math.random()-.5)*.6;balls[0].vx=Math.cos(a)*SPD;balls[0].vy=Math.sin(a)*SPD;A.tone('sine',660,.08,0,.04,880)}
 function snd(f){const now=performance.now();if(now-sndT<30)return;sndT=now;A.tone('sine',f,.09,0,.028);A.tone('triangle',f*2,.05,0,.011)}
 function clink(){const now=performance.now();if(now-sndT<45)return;sndT=now;A.tone('triangle',1760,.03,0,.008)}
 function hit(i){const r=i/COLS|0,cc=i%COLS,t=br[i];
  if(t===9){clink();return}
  if(t===2&&--hp[i]>0){snd(260);return}
  br[i]=0;left--;score++;combo++;comboT=performance.now();
  snd(330*Math.pow(2,((ROWS-r)/2+Math.min(combo,24))/24));
  if(!still&&parts.length<600){const x=cc*BW+BW/2,y=TOP+r*BH+BH/2,col=hue();for(let k=0;k<(balls.length>60?2:5);k++){const a=Math.random()*7,v=1+Math.random()*3;parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1,l:26+Math.random()*18,c:col,s:2+Math.random()*2.5,a:Math.random()*7})}}
  dry++;if((dry>=DROP_EVERY||Math.random()<DROP_RND)&&pw.length<PW_MAX){dry=0;const t=nextType();pw.push({x:Math.max(26,Math.min(W-26,cc*BW+BW/2)),y:TOP+r*BH,t,ph:Math.random()*6});ST.drop++;A.tone('sine',1200,.05,0,.015)}}
 function multi(){const n=Math.min(8,CAP-balls.length);for(let i=0;i<n;i++){const a=-Math.PI/2+(i-(n-1)/2)*.22;balls.push({x:px,y:PY-6,vx:Math.cos(a)*SPD,vy:Math.sin(a)*SPD})}}
 function spawn(n,from){for(let i=0;i<n&&balls.length<CAP;i++){const a=-Math.PI/2+(Math.random()-.5)*1.2;balls.push({x:from.x,y:from.y,vx:Math.cos(a)*SPD,vy:Math.sin(a)*SPD})}}
 function triple(){const add=[];for(const b of balls){if(balls.length+add.length>=CAP)break;for(const d of [-.35,.35]){if(balls.length+add.length>=CAP)break;const cs=Math.cos(d),sn=Math.sin(d);add.push({x:b.x,y:b.y,vx:b.vx*cs-b.vy*sn,vy:b.vx*sn+b.vy*cs})}}balls.push(...add)}
 function fixAngle(b){ // niente rimbalzi quasi orizzontali/verticali infiniti
  const m=Math.hypot(b.vx,b.vy)||1;let vx=b.vx/m,vy=b.vy/m;
  if(Math.abs(vy)<.22){vy=Math.sign(vy||1)*.22;vx=Math.sign(vx||1)*Math.sqrt(1-vy*vy)}
  if(Math.abs(vx)<.08){vx=Math.sign(vx||(Math.random()-.5))*.08;vy=Math.sign(vy)*Math.sqrt(1-vx*vx)}
  b.vx=vx*SPD;b.vy=vy*SPD}
 function stepBall(b,f){const ox0=b.x,oy0=b.y;f*=eff.LENTA>0?.6:1;b.x+=b.vx*f;b.y+=b.vy*f;
  if(b.x<R){b.x=R;b.vx=Math.abs(b.vx)}else if(b.x>W-R){b.x=W-R;b.vx=-Math.abs(b.vx)}if(b.y<R){b.y=R;b.vy=Math.abs(b.vy)}
  const r0=Math.floor((b.y-R-TOP)/BH),r1=Math.floor((b.y+R-TOP)/BH),c0=Math.floor((b.x-R)/BW),c1=Math.floor((b.x+R)/BW);
  if(r1>=0&&r0<ROWS){let best=-1,bd=1e9;
   for(let r=Math.max(0,r0);r<=Math.min(ROWS-1,r1);r++)for(let cc=Math.max(0,c0);cc<=Math.min(COLS-1,c1);cc++){const i=r*COLS+cc;if(!br[i])continue;
    const d=Math.abs(cc*BW+BW/2-b.x)/BW+Math.abs(TOP+r*BH+BH/2-b.y)/BH;if(d<bd){bd=d;best=i}}
   if(best>=0&&eff.FUOCO>0&&br[best]!==9){hp[best]=1;hit(best);return} // fuoco: attraversa e distrugge (non l'acciaio)
   if(best>=0){const r=best/COLS|0,cc=best%COLS,bx=cc*BW,by=TOP+r*BH;
    const wasX=ox0+R<=bx+.01||ox0-R>=bx+BW-.01,wasY=oy0+R<=by+.01||oy0-R>=by+BH-.01;
    if(wasY||!wasX){b.vy=oy0<by+BH/2?-Math.abs(b.vy):Math.abs(b.vy);b.y=oy0<by+BH/2?by-R:by+BH+R}
    if(wasX&&!wasY||!wasX&&!wasY){b.vx=ox0<bx+BW/2?-Math.abs(b.vx):Math.abs(b.vx);if(wasX)b.x=ox0<bx+BW/2?bx-R:bx+BW+R}
    if(br[best]===9){const a=(Math.random()-.5)*.06,cs=Math.cos(a),sn=Math.sin(a),vx=b.vx;b.vx=vx*cs-b.vy*sn;b.vy=vx*sn+b.vy*cs}
    fixAngle(b);hit(best);return}}
  if(b.vy>0&&b.y+R>=PY&&b.y+R<=PY+12&&Math.abs(b.x-px)<=pwid/2+R){const k=(b.x-px)/(pwid/2),a=-Math.PI/2+k*1.05;b.vx=Math.cos(a)*SPD;b.vy=Math.sin(a)*SPD;b.y=PY-R;
   const now=performance.now();if(now-sndT>40){sndT=now;A.tone('sine',220,.06,0,.022)}}
  if(eff.RETE>0&&b.vy>0&&b.y+R>=H-6){b.y=H-6-R;b.vy=-Math.abs(b.vy);fixAngle(b)}}
 function tick(){if(st!=='run')return;
  timeLeft-=1/60;const sec=Math.ceil(timeLeft);if(sec!==lastSec){lastSec=sec;q('#tm').textContent=Math.max(0,sec);if(sec<=5&&sec>0)A.tone('square',sec===1?1320:880,.05,0,.025)}
  if(timeLeft<=0)return over();
  for(const k in eff)if(eff[k]>0){eff[k]-=1/60;if(eff[k]<=0){eff[k]=0;if(k==='LARGA')pwid=80}}
  if(keyL||keyR)px=Math.max(pwid/2,Math.min(W-pwid/2,px+(keyR-keyL)*8));
  if(stuck){balls[0].x=px;balls[0].y=PY-R;if(performance.now()-stuckT>1800)launch()}
  else{for(let s=0;s<2;s++)for(const b of balls)stepBall(b,.5);
   balls=balls.filter(b=>b.y<H+10)}
  pw.forEach(p=>p.y+=FALL);
  pw=pw.filter(p=>{if(p.y>PY-10&&p.y<PY+10&&Math.abs(p.x-px)<pwid/2+12){
    ST.caught++;ST.types[p.t]=(ST.types[p.t]||0)+1;if(stuck)launch();apply(p.t);A.tone('triangle',784,.1,0,.04);A.tone('triangle',1175,.14,.08,.04);shake=5;return false}return p.y<H});
  if(performance.now()-comboT>700)combo=0;
  if(!balls.length){A.tone('sine',300,.3,0,.04,150);shake=8;newBall();msg('Palline finite: eccone una nuova (il tempo scorre!)')}
  if(left<=0){level++;const bt=bonusT2();timeLeft+=bt;q('#lv').textContent=level;[523,659,784,1047].forEach((f,i)=>A.tone('triangle',f,.14,i*.1,.05));build();pw=[];newBall();msg(`Mappa completata! +${bt} secondi`);A.pop(q('#lv'));A.pop(q('#tm'))}
  q('#nb').textContent=balls.length;q('#sc').textContent=score.toLocaleString('it-IT')}
 function apply(t){const d=PWT[t].d;
  if(t==='+3'){spawn(3,{x:px,y:PY-6});msg('+3 palline!')}
  else if(t==='x3'){triple();msg('Palline triplicate! ×3')}
  else if(t==='MULTI'){multi();msg('Multi: un ventaglio di palline!')}
  else{eff[t]=d;if(t==='LARGA'){pwid=130;px=Math.max(pwid/2,Math.min(W-pwid/2,px))}
   msg({LARGA:'Racchetta larga per '+d+' secondi!',LENTA:'Palline lente per '+d+' secondi!',FUOCO:'Palline di fuoco per '+d+' secondi: attraversano i mattoncini!',RETE:'Rete di sicurezza per '+d+' secondi!'}[t])}}
 function over(){st='over';timeLeft=0;q('#tm').textContent=0;[392,330,262,196].forEach((f,i)=>A.tone('sine',f,.25,i*.14,.05));const g=q('#go');g.textContent='Rigioca';g.hidden=false;
  if(score>(+localStorage.breakout_best||0)){localStorage.breakout_best=score;q('#rec').textContent=score}
  msg(`Tempo scaduto! ${score.toLocaleString('it-IT')} mattoncini, mappa ${level}.`);if(score>0)A.save('breakout',score)}
 function draw(now){const fg=A.col('--fg'),mu=A.col('--mut'),ln=A.col('--line');c.save();c.clearRect(0,0,W,H);
  if(shake>0&&!still){c.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);shake*=.85;if(shake<.4)shake=0}
  // mattoncini disegnati a gruppi (un fill per tipo): veloce anche con 900 blocchi e 300 palline
  const P1=new Path2D(),P2=new Path2D(),P9=new Path2D();
  for(let r=0;r<ROWS;r++)for(let cc=0;cc<COLS;cc++){const t=br[r*COLS+cc];if(!t)continue;const x=cc*BW+1,y=TOP+r*BH+1;(t===1?P1:t===2?P2:P9).rect(x,y,BW-2,BH-2)}
  c.fillStyle=mu;c.globalAlpha=.55;c.fill(P9);c.globalAlpha=1;c.strokeStyle=fg;c.globalAlpha=.25;c.lineWidth=1;c.stroke(P9);c.globalAlpha=1;
  c.fillStyle=hue();c.fill(P1);c.fillStyle=hueD();c.fill(P2);
  c.strokeStyle='rgba(255,255,255,.45)';c.lineWidth=1;c.beginPath();for(let i=0;i<br.length;i++)if(br[i]===2&&hp[i]===1){const x=(i%COLS)*BW,y=TOP+(i/COLS|0)*BH;c.moveTo(x+4,y+2);c.lineTo(x+8,y+6);c.lineTo(x+12,y+3)}c.stroke();
  parts=parts.filter(p=>(p.l-=1)>0);parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.12;p.a+=.2;c.globalAlpha=Math.min(1,p.l/25);c.fillStyle=p.c;c.save();c.translate(p.x,p.y);c.rotate(p.a);c.fillRect(-p.s/2,-p.s/2,p.s,p.s);c.restore()});c.globalAlpha=1;
  pw.forEach(p=>{const k=still?1:1+.08*Math.sin(now/120+p.ph),hw=p.t.length>2?25:18;c.shadowColor=PWT[p.t].c;c.shadowBlur=14;c.fillStyle=c.shadowColor;c.beginPath();c.roundRect(p.x-hw*k,p.y-11*k,2*hw*k,22*k,11*k);c.fill();c.shadowBlur=0;c.fillStyle='#fff';c.font=(p.t.length>2?'800 10px':'800 13px')+' Inter,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(p.t,p.x,p.y+1)});
  if(eff.RETE>0){c.fillStyle=PWT.RETE.c;c.globalAlpha=eff.RETE<2&&!still?(Math.sin(now/60)>0?.9:.3):.9;c.fillRect(0,H-5,W,3);c.globalAlpha=1}
  c.fillStyle=eff.LARGA>0?PWT.LARGA.c:fg;c.beginPath();c.roundRect(px-pwid/2,PY,pwid,8,4);c.fill();
  {let ex=8;c.font='700 11px Inter,sans-serif';c.textAlign='left';c.textBaseline='middle';for(const k in eff)if(eff[k]>0){const t=k+' '+Math.ceil(eff[k]),w=c.measureText(t).width+12;c.fillStyle=PWT[k].c;c.beginPath();c.roundRect(ex,H-24,w,16,8);c.fill();c.fillStyle='#fff';c.fillText(t,ex+6,H-16);ex+=w+4}}
  c.textBaseline='alphabetic';
  c.fillStyle=eff.FUOCO>0?PWT.FUOCO.c:fg;c.beginPath();for(const b of balls){c.moveTo(b.x+R,b.y);c.arc(b.x,b.y,R,0,7)}c.fill();
  c.textBaseline='alphabetic';
  if(timeLeft<=10&&st==='run'){c.textAlign='left';c.fillStyle=timeLeft<=5?'#ff4545':fg;c.font='700 14px Inter,sans-serif';c.fillText('⏱ '+Math.ceil(timeLeft)+' s',8,24)}
  if(combo>4){c.textAlign='right';c.fillStyle=fg;c.font='700 14px Inter,sans-serif';c.fillText('Combo '+combo,W-8,24)}
  c.textAlign='center';
  if(banner&&st==='run'){const a=(now-banner.at)/1800;if(a<1){c.globalAlpha=Math.min(1,(1-a)*2.5);c.fillStyle=fg;c.font='800 24px Inter,sans-serif';c.fillText(`Mappa ${level}: ${banner.t}`,W/2,H-90);c.globalAlpha=1}}
  if(st==='run'&&stuck){c.fillStyle=mu;c.font='500 13px Inter,sans-serif';c.fillText('Tocca o premi spazio per lanciare',W/2,H-60)}
  if(st==='idle'){c.fillStyle=fg;c.font='600 15px Inter,sans-serif';c.fillText('Premi Gioca',W/2,H-60)}c.restore()}
 function loop(now){const dt=Math.min(100,now-(last||now));last=now;acc+=dt;let n=0;while(acc>=1000/60&&n<4){tick();acc-=1000/60;n++}if(n>=4)acc=0;draw(now);raf=requestAnimationFrame(loop)}
 const toX=e=>{const r=cv.getBoundingClientRect();return(e.clientX-r.left)/r.width*W};
 cv.addEventListener('pointermove',e=>{if(st==='run')px=Math.max(pwid/2,Math.min(W-pwid/2,toX(e)))});
 cv.addEventListener('pointerdown',e=>{e.preventDefault();if(st!=='run')return;px=Math.max(pwid/2,Math.min(W-pwid/2,toX(e)));launch()});
 cv.addEventListener('touchmove',e=>{if(st==='run')e.preventDefault()},{passive:false});
 const kd=e=>{if(A.cur!=='breakout'||st!=='run')return;if(e.key==='ArrowLeft'||e.key==='a'){keyL=1;e.preventDefault()}else if(e.key==='ArrowRight'||e.key==='d'){keyR=1;e.preventDefault()}else if(e.key===' '){e.preventDefault();launch()}};
 const ku=e=>{if(e.key==='ArrowLeft'||e.key==='a')keyL=0;if(e.key==='ArrowRight'||e.key==='d')keyR=0};
 addEventListener('keydown',kd);addEventListener('keyup',ku);
 q('#go').onclick=e=>{e.currentTarget.blur();if(!A.user)return;A.audio();reset();st='run';lastSec=-1;e.currentTarget.hidden=true;msg('')};
 reset();raf=requestAnimationFrame(loop);
 return()=>{cancelAnimationFrame(raf);removeEventListener('keydown',kd);removeEventListener('keyup',ku);st='idle'}}
window.__breakoutMaps=MAPS.map(m=>{const g=grid(m.f);let b=0,s=0;g.forEach(v=>{if(v&&v<9)b++;if(v===9)s++});return{n:m.n,b,s}});
(window.GIOCHI_EXTRA=window.GIOCHI_EXTRA||{}).breakout={t:'Breakout',d:`${MAPS.length} mappe enormi, ${TIME} secondi: rompi più mattoncini che puoi. L'acciaio non si rompe e intrappola le palline; ogni 8 mattoncini cade un bonus: +3 e MULTI aggiungono palline, x3 le triplica (fino a 300!), LARGA allarga la racchetta, LENTA rallenta le palline, FUOCO le fa passare attraverso i mattoncini, RETE le salva in fondo. Ogni mappa finita regala secondi extra. Mouse/dito o frecce per muovere.`,unit:'mattoncini',asc:false,make};
})();
