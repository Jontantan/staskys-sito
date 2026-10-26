/* Staskys — 2048: colori originali, scorrimento/fusione animati, swipe su telefono. */
(function(){
const COL={2:['#eee4da','#776e65'],4:['#ede0c8','#776e65'],8:['#f2b179','#f9f6f2'],16:['#f59563','#f9f6f2'],32:['#f67c5f','#f9f6f2'],64:['#f65e3b','#f9f6f2'],
 128:['#edcf72','#f9f6f2'],256:['#edcc61','#f9f6f2'],512:['#edc850','#f9f6f2'],1024:['#edc53f','#f9f6f2'],2048:['#edc22e','#f9f6f2']};
const colOf=v=>COL[v]||['#3c3a32','#f9f6f2'];
/* logica pura: tiles=[{id,v,r,c}], dir 0=su 1=destra 2=giù 3=sinistra → {tiles,moved,gain,merges,removed} */
function slide(tiles,dir,N=4,nid=()=>0){
 const grid=[...Array(N)].map(()=>Array(N).fill(null));tiles.forEach(t=>grid[t.r][t.c]=t);
 const out=[],removed=[];let moved=false,gain=0,merges=[];
 for(let i=0;i<N;i++){const line=[];for(let j=0;j<N;j++){const [r,c]=dir===0?[j,i]:dir===2?[N-1-j,i]:dir===3?[i,j]:[i,N-1-j];if(grid[r][c])line.push(grid[r][c])}
  let k=0;for(let j=0;j<line.length;j++){const t=line[j],[r,c]=dir===0?[k,i]:dir===2?[N-1-k,i]:dir===3?[i,k]:[i,N-1-k];
   if(j+1<line.length&&line[j+1].v===t.v){const u=line[j+1],v=t.v*2;
    removed.push({...t,r,c},{...u,r,c});const m={id:nid(),v,r,c,m:1};out.push(m);merges.push(v);gain+=v;moved=true;j++}
   else{if(t.r!==r||t.c!==c)moved=true;out.push({id:t.id,v:t.v,r,c})}k++}}
 return{tiles:out,moved,gain,merges,removed}}
function canMove(tiles,N=4){if(tiles.length<N*N)return true;const g=[...Array(N)].map(()=>Array(N).fill(0));tiles.forEach(t=>g[t.r][t.c]=t.v);
 for(let r=0;r<N;r++)for(let c=0;c<N;c++){if(c+1<N&&g[r][c]===g[r][c+1])return true;if(r+1<N&&g[r][c]===g[r+1][c])return true}return false}
window.__t2048={slide,canMove};
function make(A){
 const {q,stage,msg}=A,N=4;
 stage.innerHTML=`<div class="ghud"><span>Punti <b id="sc">0</b></span><span>Record <b id="rec">${+localStorage['2048_best']||0}</b></span><span>Max <b id="mx">2</b></span><button class="mute" id="mute" aria-label="Audio"></button></div>
 <div class="b2048" id="bd" tabindex="0" aria-label="2048">${'<i></i>'.repeat(16)}</div>
 <button class="btn sm" id="go">Nuova partita</button><p class="gmsg">Scorri o usa le frecce per unire le tessere.</p>`;
 A.muteBtn(q('#mute'));const bd=q('#bd'),still=A.RM();
 let tiles=[],els=new Map(),score=0,id=1,st='idle',busy=0,over=false;
 const nid=()=>id++;
 function pos(el,t){el.style.setProperty('--r',t.r);el.style.setProperty('--c',t.c)}
 function tileEl(t,cls){const el=document.createElement('div'),[b,f]=colOf(t.v);el.className='t2 '+(cls||'');el.textContent=t.v;el.style.background=b;el.style.color=f;
  el.style.fontSize=t.v>=1024?'1.35em':t.v>=128?'1.65em':'2em';if(t.v>=2048)el.style.boxShadow='0 0 24px 4px rgba(237,194,46,.55)';pos(el,t);bd.appendChild(el);els.set(t.id,el);return el}
 function add(){const free=[];for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(!tiles.some(t=>t.r===r&&t.c===c))free.push([r,c]);if(!free.length)return;
  const [r,c]=free[Math.random()*free.length|0],t={id:nid(),v:Math.random()<.9?2:4,r,c};tiles.push(t);tileEl(t,'new')}
 function reset(){els.forEach(e=>e.remove());els.clear();tiles=[];score=0;over=false;q('#sc').textContent=0;q('#mx').textContent=2;add();add();st='run';msg('Scorri o usa le frecce per unire le tessere.')}
 function move(dir){if(st!=='run'||busy)return;const res=slide(tiles,dir,N,nid);if(!res.moved){if(!still){bd.classList.remove('nudge');void bd.offsetWidth;bd.classList.add('nudge')}return}
  A.audio();busy=1;
  res.removed.forEach(t=>{const el=els.get(t.id);if(el){pos(el,t);el.style.zIndex=1;els.delete(t.id);setTimeout(()=>el.remove(),still?0:110)}});
  res.tiles.forEach(t=>{if(!t.m){const el=els.get(t.id);if(el)pos(el,t)}});
  A.tone('sine',180,.06,0,.025,120);
  setTimeout(()=>{res.tiles.forEach(t=>{if(t.m)tileEl(t,'merge')});tiles=res.tiles.map(({m,...t})=>t);
   res.merges.sort((a,b)=>a-b).forEach((v,i)=>A.tone('triangle',220*Math.pow(2,Math.log2(v)/3),.12,i*.04,.04));
   if(res.merges.length>2)A.tone('sine',1320,.18,.12,.03);
   if(res.gain){score+=res.gain;const s=q('#sc');s.textContent=score.toLocaleString('it-IT');A.pop(s);
    const f=document.createElement('span');f.className='plus';f.textContent='+'+res.gain;bd.appendChild(f);setTimeout(()=>f.remove(),800)}
   const mx=Math.max(...tiles.map(t=>t.v));if(+q('#mx').textContent<mx){q('#mx').textContent=mx;if(mx>=128){A.pop(q('#mx'));if(mx===2048)msg('2048! Sei una leggenda. Continua pure!')}}
   add();busy=0;if(!canMove(tiles))end()},still?0:110)}
 function end(){st='over';over=true;[392,330,262].forEach((f,i)=>A.tone('triangle',f,.25,i*.15,.05));if(!still){bd.classList.remove('shake');void bd.offsetWidth;bd.classList.add('shake')}
  const g=q('#go');g.textContent='Rigioca';
  if(score>(+localStorage['2048_best']||0)){localStorage['2048_best']=score;q('#rec').textContent=score.toLocaleString('it-IT')}
  msg(`Nessuna mossa! ${score.toLocaleString('it-IT')} punti.`);if(score>=4)A.save('2048',score)}
 const K={ArrowUp:0,ArrowRight:1,ArrowDown:2,ArrowLeft:3,w:0,d:1,s:2,a:3};
 const kd=e=>{if(A.cur!=='2048'||!A.user)return;const d=K[e.key.length===1?e.key.toLowerCase():e.key];if(d!=null&&st==='run'){e.preventDefault();move(d)}};
 addEventListener('keydown',kd);
 let p0=null;bd.addEventListener('pointerdown',e=>{p0={x:e.clientX,y:e.clientY};e.preventDefault()});
 bd.addEventListener('pointerup',e=>{if(!p0||!A.user)return;const dx=e.clientX-p0.x,dy=e.clientY-p0.y;p0=null;if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;
  move(Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?2:0))});
 bd.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
 q('#go').onclick=e=>{e.currentTarget.blur();if(!A.user)return;
  if(st==='run'&&score>0&&!confirm('Ricominciare? La partita in corso non verrà salvata.'))return;
  reset();q('#go').textContent='Nuova partita'};
 reset();st='run';
 return()=>{removeEventListener('keydown',kd);st='idle'}}
(window.GIOCHI_EXTRA=window.GIOCHI_EXTRA||{})['2048']={t:'2048',d:'Unisci le tessere uguali fino a 2048 (e oltre). Frecce/WASD su PC, scorri su telefono. Il punteggio si salva quando non hai più mosse.',unit:'punti',asc:false,noR:false,make};
})();
