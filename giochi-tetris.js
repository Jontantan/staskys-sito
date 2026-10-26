/* Staskys — Tetris 10x20 con pezzo fantasma, anteprima, riserva e musica chiptune (Korobeiniki, melodia popolare di pubblico dominio, sintetizzata). */
(function(){
const COL={I:'#22c7d8',O:'#f2cf1d',T:'#9b4dca',S:'#3fbf4a',Z:'#e5413b',J:'#2f5fd6',L:'#f08c1e'};
const SH={I:[[0,1],[1,1],[2,1],[3,1]],O:[[1,0],[2,0],[1,1],[2,1]],T:[[1,0],[0,1],[1,1],[2,1]],S:[[1,0],[2,0],[0,1],[1,1]],Z:[[0,0],[1,0],[1,1],[2,1]],J:[[0,0],[0,1],[1,1],[2,1]],L:[[2,0],[0,1],[1,1],[2,1]]};
/* Korobeiniki: [nota, durata in battiti] (0 = pausa) */
const N=n=>{if(!n)return 0;const m={C:-9,D:-7,E:-5,F:-4,G:-2,A:0,B:2}[n[0]]+(n[1]==='#'?1:0),o=+n.slice(-1);return 440*Math.pow(2,(m+(o-4)*12)/12)};
const MEL=[['E5',1],['B4',.5],['C5',.5],['D5',1],['C5',.5],['B4',.5],['A4',1],['A4',.5],['C5',.5],['E5',1],['D5',.5],['C5',.5],['B4',1.5],['C5',.5],['D5',1],['E5',1],['C5',1],['A4',1],['A4',2],
 [0,.5],['D5',1],['F5',.5],['A5',1],['G5',.5],['F5',.5],['E5',1.5],['C5',.5],['E5',1],['D5',.5],['C5',.5],['B4',1],['B4',.5],['C5',.5],['D5',1],['E5',1],['C5',1],['A4',1],['A4',1],[0,1]];
const BASS=['E2','A2','G#2','A2','D2','C2','E2','A2'];
function make(A){
 const {q,qa,stage,msg}=A;
 stage.innerHTML=`<div class="ghud"><span>Punti <b id="sc">0</b></span><span>Righe <b id="ln">0</b></span><span>Livello <b id="lv">1</b></span><button class="mute" id="mute" aria-label="Audio"></button><button class="mute" id="mus" aria-label="Musica"></button></div>
 <div class="trow"><div class="tside"><small class="muted">Riserva</small><canvas id="hold" width="80" height="60"></canvas><small class="muted">Record</small><b id="rec">${+localStorage.tetris_best||0}</b></div>
 <canvas id="cv" width="240" height="480" class="tetris" aria-label="Tetris"></canvas>
 <div class="tside"><small class="muted">Prossimo</small><canvas id="next" width="80" height="60"></canvas></div></div>
 <div class="tpad"><button data-a="hold">⇄</button><button data-a="left">←</button><button data-a="rot">⟳</button><button data-a="right">→</button><button data-a="soft">↓</button><button data-a="hard">⤓</button></div>
 <button class="btn sm" id="go">Gioca</button><p class="gmsg"></p>`;
 const cv=q('#cv'),c=cv.getContext('2d'),S=24,still=A.RM(),setMute=A.muteBtn(q('#mute'));
 const mus=q('#mus'),musOn=()=>localStorage.tetris_music!=='0',setMus=()=>{mus.textContent=musOn()?'🎵':'🎵̸';mus.style.opacity=musOn()?1:.45;mus.title=musOn()?'Musica attiva':'Musica disattivata'};setMus();
 mus.onclick=()=>{localStorage.tetris_music=musOn()?'0':'1';setMus();mus.blur()};
 const SFX={move:()=>A.beep(220,.02,0,.02),rot:()=>A.beep(660,.035,0,.03,880),drop:()=>A.beep(140,.08,0,.06,70),lock:()=>A.beep(110,.04,0,.03),
  clear:n=>{[523,659,784,1047].slice(0,n).forEach((f,i)=>A.beep(f,.07,i*.05,.045));if(n===4)A.beep(1568,.2,.22,.05)},level:()=>[784,988,1175].forEach((f,i)=>A.beep(f,.08,i*.08,.04)),over:()=>[440,349,294,220].forEach((f,i)=>A.beep(f,.18,i*.16,.06))};
 let B,cur,nxt,hold,canHold,bag=[],score,lines,level,st='idle',dropT=0,raf=0,last=0,flash=[],flashT=0,lockT=0;
 const mk=t=>({t,b:SH[t].map(p=>[...p]),x:3,y:t==='I'?-1:0});
 const draw7=()=>{if(!bag.length){bag='IOTSZJL'.split('');for(let i=6;i>0;i--){const j=Math.random()*(i+1)|0;[bag[i],bag[j]]=[bag[j],bag[i]]}}return mk(bag.pop())};
 const fits=(p,dx=0,dy=0,b=p.b)=>b.every(([x,y])=>{x+=p.x+dx;y+=p.y+dy;return x>=0&&x<10&&y<20&&(y<0||!B[y][x])});
 function rotate(dir){if(cur.t==='O')return;const n=cur.t==='I'?3:2;const nb=cur.b.map(([x,y])=>dir>0?[n-y,x]:[y,n-x]);
  for(const [kx,ky] of [[0,0],[-1,0],[1,0],[-2,0],[2,0],[0,-1]])if(fits(cur,kx,ky,nb)){cur.b=nb;cur.x+=kx;cur.y+=ky;SFX.rot();lockT=0;return}}
 const speed=()=>Math.max(70,800*Math.pow(.85,level-1));
 function reset(){B=Array.from({length:20},()=>Array(10).fill(0));bag=[];cur=draw7();nxt=draw7();hold=null;canHold=true;score=0;lines=0;level=1;flash=[];hud()}
 function hud(){q('#sc').textContent=score;q('#ln').textContent=lines;q('#lv').textContent=level;side()}
 function mini(cvs,p){const x=cvs.getContext('2d');x.clearRect(0,0,80,60);if(!p)return;const s=15,xs=p.b.map(b=>b[0]),ys=p.b.map(b=>b[1]),w=Math.max(...xs)-Math.min(...xs)+1,h=Math.max(...ys)-Math.min(...ys)+1;
  p.b.forEach(([bx,by])=>cell(x,(bx-Math.min(...xs))*s+(80-w*s)/2,(by-Math.min(...ys))*s+(60-h*s)/2,s,COL[p.t]))}
 function side(){mini(q('#next'),nxt);mini(q('#hold'),hold)}
 function cell(x,px,py,s,col,ghost){if(ghost){x.strokeStyle=col;x.globalAlpha=.6;x.lineWidth=2;x.strokeRect(px+2,py+2,s-4,s-4);x.globalAlpha=1;return}
  x.fillStyle=col;x.fillRect(px+1,py+1,s-2,s-2);x.fillStyle='rgba(255,255,255,.28)';x.fillRect(px+1,py+1,s-2,4);x.fillStyle='rgba(0,0,0,.18)';x.fillRect(px+1,py+s-5,s-2,4)}
 function spawn(){cur=nxt;nxt=draw7();canHold=true;side();if(!fits(cur))over()}
 function lock(){let top=false;cur.b.forEach(([x,y])=>{y+=cur.y;x+=cur.x;if(y<0)top=true;else B[y][x]=cur.t});if(top)return over();SFX.lock();
  const full=[];B.forEach((r,i)=>{if(r.every(Boolean))full.push(i)});
  if(full.length){score+=[0,100,300,500,800][full.length]*level;lines+=full.length;SFX.clear(full.length);flash=full;flashT=performance.now();
   full.forEach(i=>{B.splice(i,1);B.unshift(Array(10).fill(0))});const nl=1+Math.floor(lines/10);if(nl>level){level=nl;SFX.level();A.pop(q('#lv'))}A.pop(q('#sc'))}
  hud();spawn()}
 function move(dx){if(st!=='run')return;if(fits(cur,dx,0)){cur.x+=dx;SFX.move();lockT=0}}
 function soft(){if(st!=='run')return;if(fits(cur,0,1)){cur.y++;score+=1;dropT=0;hud()}else lock()}
 function hard(){if(st!=='run')return;let n=0;while(fits(cur,0,1)){cur.y++;n++}score+=n*2;SFX.drop();if(!still){cv.classList.remove('thud');void cv.offsetWidth;cv.classList.add('thud')}lock()}
 function doHold(){if(st!=='run'||!canHold)return;const t=cur.t;if(hold){cur=mk(hold.t)}else{cur=nxt;nxt=draw7()}hold=mk(t);canHold=false;SFX.rot();side()}
 function start(){if(!A.user)return;A.audio();reset();st='run';dropT=0;q('#go').hidden=true;msg('');music.start()}
 function over(){st='over';music.stop();SFX.over();if(!still){cv.classList.remove('shake');void cv.offsetWidth;cv.classList.add('shake')}
  const g=q('#go');g.textContent='Rigioca';g.hidden=false;
  if(score>(+localStorage.tetris_best||0)){localStorage.tetris_best=score;q('#rec').textContent=score;msg(`Nuovo record! ${score} punti.`)}else msg(`Fine! ${score} punti, ${lines} righe.`);
  if(score>0)A.save('tetris',score)}
 /* --- musica: schedulatore Web Audio --- */
 const music=(()=>{let on=false,idx=0,t=0,bi=0,bt=0,timer=0,gain=null;
  function note(type,f,t0,d,v){const ac=A.AC;const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(v,t0+.01);g.gain.setValueAtTime(v,t0+d*.75);g.gain.linearRampToValueAtTime(0,t0+d*.95);o.connect(g).connect(gain);o.start(t0);o.stop(t0+d)}
  function sched(){const ac=A.AC;if(!on||!ac)return;const play=musOn()&&!A.muted()&&st==='run';gain.gain.value=play?1:0;
   const beat=60/Math.min(200,138+(level-1)*6);
   while(t<ac.currentTime+.25){const [n,d]=MEL[idx];if(n&&play)note('square',N(n),t,d*beat,.035);t+=d*beat;idx=(idx+1)%MEL.length}
   while(bt<ac.currentTime+.25){const r=N(BASS[Math.floor(bi/8)%8]);if(play)note('triangle',bi%2?r*2:r,bt,beat*.5,.09);bt+=beat*.5;bi=(bi+1)%64}
   timer=setTimeout(sched,60)}
  return{start(){const ac=A.audio();if(!ac)return;this.stop();gain=ac.createGain();gain.connect(ac.destination);on=true;idx=0;bi=0;t=bt=ac.currentTime+.1;sched()},
   stop(){on=false;clearTimeout(timer);if(gain){try{gain.gain.value=0;gain.disconnect()}catch(e){}gain=null}}}})();
 function render(now){const fg=A.col('--fg'),ln=A.col('--line');c.clearRect(0,0,240,480);
  c.strokeStyle=ln;c.lineWidth=1;for(let x=1;x<10;x++){c.beginPath();c.moveTo(x*S+.5,0);c.lineTo(x*S+.5,480);c.stroke()}for(let y=1;y<20;y++){c.beginPath();c.moveTo(0,y*S+.5);c.lineTo(240,y*S+.5);c.stroke()}
  B.forEach((r,y)=>r.forEach((t,x)=>{if(t)cell(c,x*S,y*S,S,COL[t])}));
  const fl=(now-flashT)/250;if(fl<1&&!still){c.globalAlpha=(1-fl)*.35;c.fillStyle=fg;c.fillRect(0,0,240,480);c.globalAlpha=1}
  if(st==='run'){let g=0;while(fits(cur,0,g+1))g++;cur.b.forEach(([x,y])=>{if(y+cur.y+g>=0)cell(c,(x+cur.x)*S,(y+cur.y+g)*S,S,COL[cur.t],1)});
   cur.b.forEach(([x,y])=>{if(y+cur.y>=0)cell(c,(x+cur.x)*S,(y+cur.y)*S,S,COL[cur.t])})}
  if(st==='idle'){c.fillStyle=fg;c.font='600 14px Inter,sans-serif';c.textAlign='center';c.fillText('Premi Gioca',120,240)}}
 function loop(now){const dt=Math.min(100,now-(last||now));last=now;
  if(st==='run'){dropT+=dt;if(dropT>=speed()){dropT=0;if(fits(cur,0,1))cur.y++;else{lockT+=speed();if(lockT>=Math.min(500,speed())){lockT=0;lock()}}}}
  render(now);raf=requestAnimationFrame(loop)}
 const K={ArrowLeft:()=>move(-1),ArrowRight:()=>move(1),ArrowDown:soft,ArrowUp:()=>rotate(1),x:()=>rotate(1),z:()=>rotate(-1),' ':hard,c:doHold,Shift:doHold,a:()=>move(-1),d:()=>move(1),s:soft,w:()=>rotate(1)};
 const kd=e=>{if(A.cur!=='tetris'||st!=='run')return;const f=K[e.key.length===1?e.key.toLowerCase():e.key];if(f){e.preventDefault();if(e.repeat&&/ |c|Shift|x|z|w|ArrowUp/.test(e.key))return;f()}};
 addEventListener('keydown',kd);
 const ACT={left:()=>move(-1),right:()=>move(1),rot:()=>rotate(1),soft,hard,hold:doHold};
 qa('.tpad button').forEach(b=>{let rep=0;const stop=()=>clearInterval(rep);b.addEventListener('pointerdown',e=>{e.preventDefault();const a=b.dataset.a;ACT[a]();if(/left|right|soft/.test(a)){stop();let n=0;rep=setInterval(()=>{if(++n>3)ACT[a]()},60)}});['pointerup','pointerleave','pointercancel'].forEach(v=>b.addEventListener(v,stop))});
 let t0=null;cv.addEventListener('pointerdown',e=>{e.preventDefault();t0={x:e.clientX,y:e.clientY,t:performance.now(),mx:0,my:0}});
 cv.addEventListener('pointermove',e=>{if(!t0||st!=='run')return;const cs=cv.getBoundingClientRect().width/10,dx=e.clientX-t0.x,dy=e.clientY-t0.y;
  while(dx-t0.mx*cs>cs){t0.mx++;move(1)}while(dx-t0.mx*cs<-cs){t0.mx--;move(-1)}while(dy-t0.my*cs>cs&&Math.abs(dx)<cs){t0.my++;soft()}});
 cv.addEventListener('pointerup',e=>{if(!t0)return;const dx=e.clientX-t0.x,dy=e.clientY-t0.y,dt=performance.now()-t0.t;
  if(Math.abs(dx)<10&&Math.abs(dy)<10&&dt<300)rotate(1);else if(dy>60&&dt<250&&Math.abs(dx)<40&&!t0.my)hard();t0=null});
 q('#go').onclick=e=>{e.currentTarget.blur();start()};
 reset();raf=requestAnimationFrame(loop);
 return()=>{cancelAnimationFrame(raf);removeEventListener('keydown',kd);music.stop();st='idle'}}
(window.GIOCHI_EXTRA=window.GIOCHI_EXTRA||{}).tetris={t:'Tetris',d:'Completa le righe. ←→ muovi, ↑/X ruota, ↓ scendi, spazio caduta, C riserva. Su telefono usa i tasti o scorri sul campo (tocco = ruota).',unit:'punti',asc:false,make};
})();
