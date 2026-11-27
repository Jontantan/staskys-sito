/* Staskys — suoni degli scacchi, creati da zero con Web Audio (nessun file, niente copyright).
   PATCH 5.1: due pacchetti a scelta.
   · "Default": stile arcade (blip veloci, colpi pieni, COMBO che sale come le kill negli sparatutto).
   · "Tranquilli": "toc" morbido di legno, catture più profonde, niente fuochi d'artificio.
   COMBO: ogni cattura di fila alza il livello (1 → 8); una mossa senza cattura la azzera.
   Volume, muto, pacchetto e "semplice" (modalità veloce) si salvano nel browser. */
(function(){
let ctx=null,master=null,comp=null;
const K='staskys_chess_snd';
const st=(()=>{try{return JSON.parse(localStorage[K]||'{}')}catch(e){return{}}})();
let vol=st.vol==null?0.7:+st.vol,muted=!!st.muted,pack=st.pack==='tranquilli'?'tranquilli':'default',simple=false;
const save=()=>{try{localStorage[K]=JSON.stringify({vol,muted,pack})}catch(e){}};
function ac(){if(!ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;ctx=new C();
  comp=ctx.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=4;master=ctx.createGain();master.connect(comp);comp.connect(ctx.destination)}
 if(ctx.state==='suspended')ctx.resume();master.gain.value=muted?0:vol;return ctx}
/* mattoncini */
function tone(type,f,dur,at,g,f2,dest){const c=ac();if(!c||muted)return;const t=c.currentTime+(at||0),o=c.createOscillator(),v=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);
 v.gain.setValueAtTime(0,t);v.gain.linearRampToValueAtTime(g,t+.005);v.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(v);v.connect(dest||master);o.start(t);o.stop(t+dur+.05)}
function noise(dur,at,g,freq,q,type,decay){const c=ac();if(!c||muted)return;const t=c.currentTime+(at||0),n=Math.max(1,Math.floor(c.sampleRate*dur)),b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);
 for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,decay||3);const s=c.createBufferSource();s.buffer=b;const fl=c.createBiquadFilter();fl.type=type||'bandpass';fl.frequency.value=freq||1800;fl.Q.value=q||1.2;
 const v=c.createGain();v.gain.value=g;s.connect(fl);fl.connect(v);v.connect(master);s.start(t)}
const semi=(f,n)=>f*Math.pow(2,n/12);

/* ===== pacchetto DEFAULT (arcade) ===== */
const D={
 move(){tone('square',740,.045,0,.07,480);noise(.03,0,.35,3200,1.4);tone('sine',180,.06,0,.12,90)},
 capture(l){const base=semi(392,[0,3,5,7,10,12,15,19][l-1]);
  noise(.08,0,.7,1500,.9,'lowpass',2);tone('sawtooth',160,.14,0,.16,55);                     // colpo pieno
  tone('square',base,.09,.01,.08);tone('triangle',base*2,.18,.05,.09);                        // "ding" che sale col livello
  if(l>=2)tone('triangle',semi(base,7)*2,.2,.1,.08);                                          // seconda nota
  if(l>=3){[0,4,7].forEach((n,i)=>tone('square',semi(base*2,n),.07,.14+i*.05,.045))}          // arpeggio veloce
  if(l>=4){tone('sawtooth',base/2,.35,.02,.07,base/4);noise(.25,.12,.18,7000,.8,'highpass')}  // basso + scintille
  if(l>=5){[0,4,7,12].forEach((n,i)=>tone('triangle',semi(base*2,n),.16,.3+i*.06,.06))}        // fanfara
  if(l>=6){tone('square',base*4,.45,.28,.035,base*6)}
  if(l>=7){[0,2,4,7,9,12].forEach((n,i)=>tone('sine',semi(base*4,n),.08,.5+i*.035,.04))}
  if(l>=8){noise(.6,.45,.16,9000,.5,'highpass',1.5);tone('sawtooth',base/4,.7,.4,.08,base/8)}},
 check(){tone('square',988,.07,0,.06);tone('square',1319,.1,.07,.06)},
 castle(){D.move();setTimeout(D.move,85)},
 start(){[523,659,784,1047].forEach((f,i)=>tone('square',f,.12,i*.07,.06))},
 end(win){(win===true?[523,659,784,1047,1319]:win===false?[494,415,349,262]:[523,523,440]).forEach((f,i)=>tone('triangle',f,.26,i*.11,.12))}};

/* ===== pacchetto TRANQUILLI (legno) ===== */
const T={
 wood(g,f){noise(.05,0,g,f||850,3.5,'bandpass',4);tone('sine',f?f/5:170,.07,0,g*.35,f?f/8:110)},
 move(){T.wood(.55)},
 capture(l){T.wood(.75+Math.min(l,4)*.06,620);noise(.07,.03,.3,380,2,'bandpass',3);if(l>=2)tone('sine',semi(330,Math.min(l,6)*2),.25,.05,.035)},
 check(){tone('sine',660,.12,0,.05);tone('sine',880,.16,.09,.04)},
 castle(){T.wood(.5);setTimeout(()=>T.wood(.45,950),110)},
 start(){[392,523].forEach((f,i)=>tone('sine',f,.25,i*.12,.07))},
 end(win){(win===true?[392,494,587]:win===false?[392,330,262]:[392,392])
  .forEach((f,i)=>tone('sine',f,.35,i*.16,.08))}};

const P=()=>pack==='tranquilli'?T:D;
function move(){P().move()}
function capture(level){level=Math.max(1,Math.min(8,level||1));P().capture(simple?1:level)}
function check(){P().check()}
function castle(){P().castle()}
function start(){P().start()}
function end(w){P().end(w)}
function low(){tone('sine',1320,.06,0,.08)}
function notify(){tone('sine',988,.12,0,.12);tone('sine',1319,.16,.1,.12)}
function coin(){for(let i=0;i<9;i++)tone('triangle',2400+i*120,.03,i*.12,.04)}
function tick(){tone('sine',1500,.03,0,.05)}
window.STASKYS_CSND={move,capture,check,castle,start,end,low,notify,coin,tick,unlock:()=>ac(),
 PACKS:{default:'Default (arcade)',tranquilli:'Tranquilli'},
 get pack(){return pack},set pack(v){pack=v==='tranquilli'?'tranquilli':'default';save()},
 get simple(){return simple},set simple(v){simple=!!v},
 get muted(){return muted},set muted(v){muted=!!v;save();if(master)master.gain.value=muted?0:vol},
 get vol(){return vol},set vol(v){vol=Math.max(0,Math.min(1,+v));save();if(master)master.gain.value=muted?0:vol}};
})();
