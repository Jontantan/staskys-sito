/* Pagina news "candidature": quiz, suoni (sintetizzati con WebAudio, niente file esterni), coriandoli e "peggior match" */
(function(){
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];

/* ---------- audio ---------- */
let AC=null,OUT=null,NB=null;
function unlock(){try{
 if(!AC){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;AC=new C();
  const comp=AC.createDynamicsCompressor();OUT=AC.createGain();OUT.gain.value=.32;OUT.connect(comp);comp.connect(AC.destination)}
 if(AC.state!=='running')AC.resume()}catch(e){}}
['pointerdown','touchend','click','keydown'].forEach(e=>addEventListener(e,unlock,{capture:true,passive:true}));
const audioOn=()=>!!AC&&AC.state==='running';
function bus(){const g=AC.createGain();g.connect(OUT);return g}
function kill(b){if(!b||!AC)return;try{b.gain.cancelScheduledValues(AC.currentTime);b.gain.setValueAtTime(b.gain.value,AC.currentTime);b.gain.linearRampToValueAtTime(0,AC.currentTime+.15);setTimeout(()=>b.disconnect(),300)}catch(e){}}
function noiseBuf(){if(!NB){NB=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate);const d=NB.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}return NB}
function tone(b,t,f,d,o={}){const{type='triangle',v=.25,f2=null,a=.01,r=.08,vib=0,lp=0}=o;
 const os=AC.createOscillator(),g=AC.createGain();os.type=type;os.frequency.setValueAtTime(f,t);if(f2)os.frequency.exponentialRampToValueAtTime(f2,t+d);
 let last=os;if(lp){const fl=AC.createBiquadFilter();fl.type='lowpass';fl.frequency.value=lp;os.connect(fl);last=fl}
 if(vib){const l=AC.createOscillator(),lg=AC.createGain();l.frequency.value=vib;lg.gain.value=f*.03;l.connect(lg);lg.connect(os.frequency);l.start(t);l.stop(t+d+.05)}
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+a);g.gain.setValueAtTime(v,t+Math.max(a,d-r));g.gain.linearRampToValueAtTime(0,t+d);
 last.connect(g);g.connect(b);os.start(t);os.stop(t+d+.05)}
function noise(b,t,d,o={}){const{v=.3,type='bandpass',f=1000,Q=1,a=.002}=o;
 const s=AC.createBufferSource();s.buffer=noiseBuf();s.loop=true;const fl=AC.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=Q;
 const g=AC.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+a);g.gain.exponentialRampToValueAtTime(.001,t+d);
 s.connect(fl);fl.connect(g);g.connect(b);s.start(t,Math.random()*1.5);s.stop(t+d+.05)}
const N=n=>440*Math.pow(2,(n-69)/12); /* nota MIDI -> Hz */

const SFX={
 drumroll(b,t,dur){let x=0;while(x<dur){const k=x/dur;noise(b,t+x,.07,{v:.12+.38*k,f:1800+600*k,Q:.7});if(Math.random()<.5)tone(b,t+x,190,.05,{v:.08+.12*k,type:'sine'});x+=.034+Math.random()*.01}
  /* piatto + cassa finale */
  noise(b,t+dur,2.2,{v:.5,type:'highpass',f:5000,Q:.5});tone(b,t+dur,130,.5,{type:'sine',f2:40,v:.6})},
 horn(b,t){const f=N(62+Math.floor(Math.random()*3));
  tone(b,t,f*.7,.85,{type:'sawtooth',f2:f,v:.22,a:.03,r:.15,vib:11,lp:2400});tone(b,t,f*.7*1.005,.85,{type:'square',f2:f*1.005,v:.08,a:.03,r:.15,lp:1800});
  noise(b,t,.25,{v:.2,f:3000,Q:.6});noise(b,t+.8,.35,{v:.12,f:2200,Q:.5})},
 applause(b,t,dur){for(let i=0;i<dur*70;i++){const x=Math.random()*dur,k=Math.min(1,x/.8)*(x>dur-1.5?(dur-x)/1.5:1);noise(b,t+x,.04+Math.random()*.05,{v:(.05+Math.random()*.12)*k,f:900+Math.random()*1800,Q:1.2})}
  [.3,.9,1.6,2.4,3.3].forEach(o=>{const f=N(70+Math.floor(Math.random()*7));tone(b,t+o,f*.8,.7,{type:'sawtooth',f2:f*1.3,v:.05,a:.08,r:.3,lp:1600})})},
 party(b,t){/* musichetta di festa ~19s: C G Am F, 152 bpm */
  const bt=60/152,ch=[[60,64,67],[55,59,62],[57,60,64],[53,57,60]],mel=[
   [72,0],[76,1],[79,2],[76,3],[74,4],[76,5],[72,6],[67,7],
   [71,0],[74,1],[79,2],[74,3],[72,4],[71,5],[67,6],[71,7],
   [72,0],[76,1],[81,2],[79,3],[76,4],[72,5],[74,6],[76,7],
   [77,0],[76,1],[74,2],[72,3],[74,4],[77,5],[76,6],[74,7]];
  for(let bar=0;bar<16;bar++){const c=ch[bar%4],T=t+bar*4*bt;
   for(let s=0;s<4;s++){tone(b,T+s*bt,90,.18,{type:'sine',f2:45,v:.35});noise(b,T+s*bt+bt/2,.05,{v:.06,type:'highpass',f:7000})}
   noise(b,T+bt,.12,{v:.12,f:1800,Q:.8});noise(b,T+3*bt,.12,{v:.12,f:1800,Q:.8});
   for(let s=0;s<8;s++)tone(b,T+s*bt/2,N(c[0]-24+(s%2?12:0)),bt/2*.9,{type:'triangle',v:.16});
   tone(b,T,N(c[0]),bt*4,{type:'triangle',v:.05,a:.05,r:.4});tone(b,T,N(c[1]),bt*4,{type:'triangle',v:.05,a:.05,r:.4});tone(b,T,N(c[2]),bt*4,{type:'triangle',v:.05,a:.05,r:.4});
   const ph=mel.slice((bar%4)*8,(bar%4)*8+8),oct=bar>=8?12:0;ph.forEach(([n,s])=>tone(b,T+s*bt/2,N(n+oct*(bar>=12?1:0)),bt/2*.85,{type:'square',v:.07,lp:3000}))}
  const E=t+16*4*bt;[60,64,67,72].forEach(n=>tone(b,E,N(n),1.6,{type:'square',v:.06,lp:3000,r:1}));tone(b,E,130,.6,{type:'sine',f2:40,v:.5});noise(b,E,1.8,{v:.35,type:'highpass',f:5000})},
 fanfare(b,t,high){const s=high?[67,72,76,79,84]:[60,64,67,72];s.forEach((n,i)=>tone(b,t+i*.13,N(n),.16,{type:'square',v:.09,lp:3500}));
  const e=t+s.length*.13;(high?[72,76,79,84]:[60,64,67,72]).forEach(n=>tone(b,e,N(n),high?1.8:1.2,{type:'sawtooth',v:.05,lp:2500,r:.8,vib:5}));
  noise(b,e,1.2,{v:.2,type:'highpass',f:6000})},
 sad(b,t){/* trombone triste + melodia in minore */
  [[67,.55],[66,.55],[65,.55],[64,1.8]].forEach(([n,d],i)=>tone(b,t+i*.6,N(n-12),d,{type:'sawtooth',v:.16,lp:900,a:.05,r:.2,vib:i===3?6:0}));
  const t2=t+4.2,bt=.75;[[57,60,64,69],[50,57,62,65],[52,56,59,64],[45,57,60,64]].forEach((c,i)=>{c.forEach((n,j)=>tone(b,t2+i*4*bt+j*bt,N(n),bt*1.9,{type:'triangle',v:.09,a:.05,r:.6}));tone(b,t2+i*4*bt,N(c[0]-12),4*bt,{type:'sine',v:.12,a:.1,r:.8})});
  [[76,0],[74,2],[72,4],[71,6],[69,8],[67,10],[68,12],[69,14]].forEach(([n,s])=>tone(b,t2+s*bt,N(n),bt*1.8,{type:'sine',v:.08,a:.08,r:.5,vib:5}))}
};

/* ---------- coriandoli ---------- */
const cv=q('#confetti'),cx=cv.getContext('2d');let parts=[],raf=0,until=0;
const COL=['#f94144','#f3722c','#f9c74f','#90be6d','#43aa8b','#577590','#c77dff','#ff70a6','#ffffff','#111111'];
function fit(){const d=Math.min(2,devicePixelRatio||1);cv.width=innerWidth*d;cv.height=innerHeight*d;cx.setTransform(d,0,0,d,0,0)}
addEventListener('resize',fit);fit();
function burst(n,dur){until=Math.max(until,performance.now()+dur);
 for(let i=0;i<n;i++)parts.push({x:Math.random()*innerWidth,y:-20-Math.random()*innerHeight*.5,vx:(Math.random()-.5)*3,vy:2+Math.random()*3,r:Math.random()*6.28,vr:(Math.random()-.5)*.3,w:6+Math.random()*6,h:8+Math.random()*8,c:COL[i%COL.length]});
 if(!raf)raf=requestAnimationFrame(step)}
function step(now){cx.clearRect(0,0,innerWidth,innerHeight);
 if(now<until&&parts.length<500&&Math.random()<.6)for(let i=0;i<4;i++)parts.push({x:Math.random()*innerWidth,y:-20,vx:(Math.random()-.5)*3,vy:2+Math.random()*3,r:Math.random()*6.28,vr:(Math.random()-.5)*.3,w:6+Math.random()*6,h:8+Math.random()*8,c:COL[(Math.random()*COL.length)|0]});
 parts=parts.filter(p=>p.y<innerHeight+30);
 for(const p of parts){p.x+=p.vx+Math.sin(p.y/40);p.y+=p.vy;p.r+=p.vr;cx.save();cx.translate(p.x,p.y);cx.rotate(p.r);cx.fillStyle=p.c;cx.fillRect(-p.w/2,-p.h/4,p.w,p.h/2*Math.abs(Math.cos(p.r*2))+1);cx.restore()}
 raf=parts.length||now<until?requestAnimationFrame(step):0;if(!raf)cx.clearRect(0,0,innerWidth,innerHeight)}
function stopConfetti(){parts=[];until=0}

/* ---------- quiz ---------- */
const form=q('#quiz'),res=q('#result');let rbus=null;
qa('.opts button',form).forEach(btn=>btn.addEventListener('click',()=>{const fs=btn.closest('fieldset');qa('button',fs).forEach(x=>{x.classList.toggle('on',x===btn);x.setAttribute('aria-pressed',x===btn)});fs.classList.add('done');fs.classList.remove('miss');
 if(audioOn()){const b=bus();tone(b,AC.currentTime,N(btn.dataset.v==='1'?79:74),.09,{type:'sine',v:.15});setTimeout(()=>b.disconnect(),400)}}));
const ans=n=>{const on=q(`fieldset[data-q="${n}"] button.on`,form);return on?on.dataset.v==='1':null};
form.addEventListener('submit',e=>{e.preventDefault();
 const a=[1,2,3,4].map(ans),miss=[1,2,3,4].filter((n,i)=>a[i]===null);
 if(miss.length){miss.forEach(n=>{const f=q(`fieldset[data-q="${n}"]`,form);f.classList.remove('miss');void f.offsetWidth;f.classList.add('miss')});q('#qhint').textContent='Manca qualche risposta!';return}
 const[q1,q2,q3,q4]=a,fail=!q1||!q2||(!q3&&!q4),high=!fail&&q1&&q2&&q3&&q4;
 show(fail?'sad':high?'high':'win')});
function show(kind){kill(rbus);rbus=audioOn()?bus():null;const t=AC?AC.currentTime+.05:0;
 res.className='nresult '+kind;res.hidden=false;document.body.classList.toggle('sadmode',kind==='sad');
 const rain=q('#rain');rain.innerHTML='';
 if(kind==='sad'){q('#remoji').textContent='😢';q('#rtitle').textContent='sarà per la prossima volta😢';q('#rtext').textContent='prova a conoscere ele!';
  for(let i=0;i<70;i++){const d=document.createElement('i');d.style.left=Math.random()*100+'%';d.style.animationDuration=.6+Math.random()*.7+'s';d.style.animationDelay=-Math.random()*2+'s';d.style.opacity=.3+Math.random()*.6;rain.append(d)}
  if(rbus)SFX.sad(rbus,t)}
 else{const h=kind==='high';q('#remoji').textContent=h?'👑':'🎉';q('#rtitle').textContent=h?'hai tutti i requisiti per entrare nello high staff!':'hai tutti i requisiti per entrare nello staff!';
  q('#rtext').textContent=h?'Bonus sbloccato: hai chiesto a ele come sta. Benvenuto ai piani alti.':'Requisito principale verificato. Benvenuto nello staff!';
  burst(h?260:160,h?4500:2500);if(rbus)SFX.fanfare(rbus,t,h)}
 q('#retry').focus({preventScroll:true})}
function hide(){res.hidden=true;document.body.classList.remove('sadmode');q('#rain').innerHTML='';kill(rbus);rbus=null;stopConfetti()}
q('#rclose').onclick=hide;
q('#retry').onclick=()=>{hide();qa('.opts button',form).forEach(x=>{x.classList.remove('on');x.removeAttribute('aria-pressed')});qa('fieldset',form).forEach(f=>f.classList.remove('done'));q('#qhint').textContent='Rispondi a tutte le domande e premi Invia.';q('#modulo').scrollIntoView({behavior:'smooth'})};
addEventListener('keydown',e=>{if(e.key==='Escape'&&!res.hidden)hide()});

/* ---------- congratulazioni: entra con animazione e coriandoli (una volta) ---------- */
const cg=q('#congrats'),RMq=matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.classList.contains('still');
if(cg&&!RMq&&'IntersectionObserver' in window){cg.classList.add('wait');
 new IntersectionObserver((es,o)=>es.forEach(e=>{if(!e.isIntersecting)return;o.disconnect();cg.classList.remove('wait');cg.classList.add('go');
  setTimeout(()=>burst(180,1600),250);
  if(audioOn()){const b=bus();SFX.fanfare(b,AC.currentTime+.2,false);setTimeout(()=>b.disconnect(),4000)}}),{threshold:.6}).observe(cg)}

/* ---------- peggior match ---------- */
const stage=q('#stage'),cue=q('#cue'),who=qa('.who',stage),rp=q('#replay');let timers=[],mbus=null,played=false;
const at=(ms,f)=>timers.push(setTimeout(f,ms));
function reset(){timers.forEach(clearTimeout);timers=[];kill(mbus);mbus=null;stage.className='stage';cue.className='cue';cue.innerHTML='&nbsp;';who.forEach(w=>w.classList.remove('in'))}
/* tempi (secondi): 0 rullo · 3.2 silenzio · 5.2/6.6/8.0 entrano i tre · 9.6 applausi, coriandoli e musica */
const TL={roll:0,silence:3.2,p:[5.2,6.6,8.0],party:9.6};
function play(){reset();played=true;const sound=audioOn();rp.textContent=sound?'🔁 rivedi da capo':'🔊 attiva audio';
 if(sound){mbus=bus();const t=AC.currentTime+.08;SFX.drumroll(mbus,t+TL.roll,TL.silence-.25);TL.p.forEach(p=>SFX.horn(mbus,t+p));SFX.applause(mbus,t+TL.party,6);SFX.party(mbus,t+TL.party+.4)}
 at(TL.roll*1000,()=>{cue.textContent='*rullo di tamburi*';cue.classList.add('drum')});
 at(TL.silence*1000,()=>{cue.classList.remove('drum');cue.textContent='*silenzio*';stage.classList.add('dark')});
 TL.p.forEach((p,i)=>at(p*1000,()=>{if(i===0){stage.classList.remove('dark');cue.textContent='🎺'}who[i].classList.add('in')}));
 at(TL.party*1000,()=>{stage.classList.add('party');cue.textContent='👏 👏 👏';burst(220,7000)})}
new IntersectionObserver((es,o)=>es.forEach(e=>{if(e.isIntersecting&&!played){o.disconnect();play()}}),{threshold:.5}).observe(stage);
rp.onclick=()=>{unlock();/* aspetta che l'audio sia davvero attivo, poi riparte da capo */
 const go=()=>{play();stage.scrollIntoView({behavior:'smooth',block:'center'})};
 if(AC&&AC.state!=='running')AC.resume().then(go,go);else go()};
})();
