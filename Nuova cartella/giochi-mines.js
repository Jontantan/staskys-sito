/* Staskys — Prato fiorito 20x20: il primo clic non è mai una mina, rivelazione a cascata, bandierine con tasto destro / pressione lunga.
   In classifica vanno solo le vittorie: vince il tempo più basso. */
(function(){
const N=20,M=60,S=20;
const fmt=s=>{s=Math.round(s);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
/* logica pura */
function gen(safe,rnd=Math.random){const sx=safe%N,sy=safe/N|0,cells=[];for(let i=0;i<N*N;i++){const x=i%N,y=i/N|0;if(Math.abs(x-sx)>1||Math.abs(y-sy)>1)cells.push(i)}
 for(let i=cells.length-1;i>0;i--){const j=rnd()*(i+1)|0;[cells[i],cells[j]]=[cells[j],cells[i]]}const mine=new Uint8Array(N*N);cells.slice(0,M).forEach(i=>mine[i]=1);
 const cnt=new Uint8Array(N*N);for(let i=0;i<N*N;i++)cnt[i]=nb(i).reduce((a,j)=>a+mine[j],0);return{mine,cnt}}
function nb(i){const x=i%N,y=i/N|0,o=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const X=x+dx,Y=y+dy;if(X>=0&&Y>=0&&X<N&&Y<N)o.push(Y*N+X)}return o}
function flood(i,mine,cnt,open){const out=[],seen=new Set([i]);let fr=[i],d=0;while(fr.length){const nx=[];for(const k of fr){if(open[k]||mine[k])continue;out.push([k,d]);if(cnt[k]===0)for(const j of nb(k))if(!seen.has(j)){seen.add(j);nx.push(j)}}fr=nx;d++}return out}
window.__tmines={gen,flood,nb,N,M};
const NUMC=['','#3b82f6','#22a35a','#e5413b','#7c3aed','#b45309','#0891b2','#555','#999'];
function make(A){
 const {q,stage,msg}=A;
 stage.innerHTML=`<div class="ghud"><span>Tempo <b id="tm">0:00</b></span><span>Mine <b id="mn">${M}</b></span><span>Record <b id="rec">${localStorage.mines_best?fmt(+localStorage.mines_best):'–'}</b></span><button class="mute" id="mute" aria-label="Audio"></button><button class="mute" id="fl" aria-label="Modalità bandierina" title="Modalità bandierina">⛏️</button></div>
 <canvas id="cv" width="${N*S}" height="${N*S}" aria-label="Prato fiorito"></canvas>
 <button class="btn sm" id="go" hidden>Rigioca</button><p class="gmsg">Clic per scoprire, tasto destro o pressione lunga per la bandierina 🌸.</p>`;
 A.muteBtn(q('#mute'));const cv=q('#cv'),c=cv.getContext('2d'),still=A.RM(),fb=q('#fl');
 let mine,cnt,open,flag,anim,st,t0,raf=0,opened,flags,flagMode=false,boom=-1,shake=0;
 fb.onclick=()=>{flagMode=!flagMode;fb.textContent=flagMode?'🌸':'⛏️';fb.title=flagMode?'Tocco = bandierina':'Tocco = scopri';fb.blur()};
 function reset(){mine=null;open=new Uint8Array(N*N);flag=new Uint8Array(N*N);anim=new Float64Array(N*N);st='ready';opened=0;flags=0;boom=-1;q('#tm').textContent='0:00';q('#mn').textContent=M;q('#go').hidden=true}
 function reveal(i){if(st==='over'||st==='won'||flag[i])return;
  if(!mine){A.audio();({mine,cnt}=gen(i));st='run';t0=performance.now()}
  if(open[i]){chord(i);return}
  if(mine[i])return lose(i);
  const L=flood(i,mine,cnt,open),now=performance.now();let maxd=0;
  L.forEach(([k,d])=>{if(flag[k]){flag[k]=0;flags--}open[k]=1;opened++;anim[k]=now+(still?0:d*28);maxd=Math.max(maxd,d)});
  for(let d=0;d<=Math.min(maxd,14);d++)A.tone('sine',440*Math.pow(2,d/14),.08,still?0:d*.028,L.length>1?.022:.03);
  q('#mn').textContent=M-flags;if(opened===N*N-M)win()}
 function chord(i){const n=nb(i);if(n.filter(j=>flag[j]).length!==cnt[i])return;for(const j of n)if(!open[j]&&!flag[j]){reveal(j);if(st!=='run')return}}
 function toggle(i){if(st==='over'||st==='won'||open[i])return;flag[i]^=1;flags+=flag[i]?1:-1;anim[i]=performance.now();q('#mn').textContent=M-flags;A.tone('triangle',flag[i]?990:660,.05,0,.03)}
 function lose(i){st='over';boom=i;shake=12;A.noise(.5,0,.08,500,80);A.tone('sine',200,.5,0,.05,60);const now=performance.now();let k=0;
  for(let j=0;j<N*N;j++)if(mine[j]){anim[j]=now+(still?0:(k++)*12)}
  msg('Boom! Riprova, i fiori ti aspettano. 🌼');q('#go').hidden=false}
 function win(){st='won';const sec=Math.max(10,Math.ceil((performance.now()-t0)/1000));q('#tm').textContent=fmt(sec);
  [523,659,784,1047,1319].forEach((f,i)=>A.tone('triangle',f,.15,i*.09,.04));
  if(!localStorage.mines_best||sec<+localStorage.mines_best){localStorage.mines_best=sec;q('#rec').textContent=fmt(sec)}
  msg(`Vittoria! Prato ripulito in ${fmt(sec)}.`);q('#go').hidden=false;A.save('mines',sec)}
 function draw(now){const fg=A.col('--fg'),ln=A.col('--line'),soft=A.col('--soft'),card=A.col('--card'),mu=A.col('--mut');c.save();c.clearRect(0,0,N*S,N*S);
  if(shake>0&&!still){c.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);shake*=.88;if(shake<.4)shake=0}
  c.font='700 13px Inter,sans-serif';c.textAlign='center';c.textBaseline='middle';
  for(let i=0;i<N*N;i++){const x=(i%N)*S,y=(i/N|0)*S,p=Math.max(0,Math.min(1,(now-anim[i])/160));
   const showMine=mine&&mine[i]&&st==='over'&&now>=anim[i];
   if(open[i]&&now>=anim[i]||showMine){c.fillStyle=card;c.fillRect(x,y,S,S);c.strokeStyle=ln;c.strokeRect(x+.5,y+.5,S-1,S-1);
    const sc=still?1:.6+.4*p;
    if(showMine){c.fillStyle=i===boom?'#e5413b':fg;c.beginPath();c.arc(x+S/2,y+S/2,5*sc,0,7);c.fill()}
    else if(cnt[i]){c.globalAlpha=p;c.fillStyle=NUMC[cnt[i]];c.fillText(cnt[i],x+S/2,y+S/2+1);c.globalAlpha=1}}
   else{const g=(i%N+(i/N|0))%2;c.fillStyle=g?'#8fd18f':'#7cc47c';c.fillRect(x,y,S,S);
    if(open[i]){c.globalAlpha=1-p;c.fillStyle='#fff';c.fillRect(x,y,S,S);c.globalAlpha=1}
    if(flag[i]){const b=still?1:Math.min(1,.4+p);c.font=`${Math.round(13*b)}px sans-serif`;c.fillText('🌸',x+S/2,y+S/2+1);c.font='700 13px Inter,sans-serif'}}}
  if(st==='ready'){c.fillStyle='rgba(0,0,0,.35)';c.fillRect(0,N*S/2-22,N*S,44);c.fillStyle='#fff';c.font='600 14px Inter,sans-serif';c.fillText('Clicca una casella qualsiasi per iniziare',N*S/2,N*S/2)}
  c.restore();
  if(st==='run')q('#tm').textContent=fmt((now-t0)/1000);
  raf=requestAnimationFrame(draw)}
 const cell=e=>{const r=cv.getBoundingClientRect(),x=Math.floor((e.clientX-r.left)/r.width*N),y=Math.floor((e.clientY-r.top)/r.height*N);return x>=0&&y>=0&&x<N&&y<N?y*N+x:-1};
 let lp=0,lpCell=-1,lpDone=false;
 cv.addEventListener('contextmenu',e=>e.preventDefault());
 cv.addEventListener('pointerdown',e=>{e.preventDefault();if(!A.user)return;const i=cell(e);if(i<0)return;
  if(e.button===2){toggle(i);return}lpCell=i;lpDone=false;clearTimeout(lp);lp=setTimeout(()=>{lpDone=true;toggle(i);if(navigator.vibrate)navigator.vibrate(15)},420)});
 cv.addEventListener('pointerup',e=>{if(e.button===2)return;clearTimeout(lp);if(lpDone||lpCell<0)return;const i=lpCell;lpCell=-1;if(flagMode&&!open[i])toggle(i);else reveal(i)});
 cv.addEventListener('pointerleave',()=>{clearTimeout(lp);lpCell=-1});
 q('#go').onclick=e=>{e.currentTarget.blur();reset();msg('Clic per scoprire, tasto destro o pressione lunga per la bandierina 🌸.')};
 reset();raf=requestAnimationFrame(draw);
 return()=>{cancelAnimationFrame(raf);clearTimeout(lp);st='idle'}}
(window.GIOCHI_EXTRA=window.GIOCHI_EXTRA||{}).mines={t:'Prato fiorito',d:'20×20, 60 mine. Il primo clic è sempre sicuro. Tasto destro o pressione lunga (o il pulsante ⛏️/🌸) per le bandierine. In classifica solo le vittorie: vince il più veloce.',unit:'',asc:true,fmt,lbScore:fmt,lbDesc:'vittoria più veloce',make};
})();
