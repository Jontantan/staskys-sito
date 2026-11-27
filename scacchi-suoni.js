/* Staskys — UPDATE 5: suoni degli scacchi, creati da zero con Web Audio (nessun file, niente copyright).
   COMBO: ogni volta che mangi un pezzo il suono sale di tono, diventa più forte e più ricco (fino al livello 5).
   Se in una tua mossa non mangi, la combo riparte da zero. Volume e muto si salvano nel browser. */
(function(){
let ctx=null,master=null;
const K='staskys_chess_snd';
const st=(()=>{try{return JSON.parse(localStorage[K]||'{}')}catch(e){return{}}})();
let vol=st.vol==null?0.7:+st.vol,muted=!!st.muted;
const save=()=>{try{localStorage[K]=JSON.stringify({vol,muted})}catch(e){}};
function ac(){if(!ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;ctx=new C();master=ctx.createGain();master.connect(ctx.destination)}
 if(ctx.state==='suspended')ctx.resume();master.gain.value=muted?0:vol;return ctx}
function tone(type,f,dur,at,g,f2){const c=ac();if(!c||muted)return;const t=c.currentTime+(at||0),o=c.createOscillator(),v=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);
 v.gain.setValueAtTime(0,t);v.gain.linearRampToValueAtTime(g,t+.008);v.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(v);v.connect(master);o.start(t);o.stop(t+dur+.05)}
function noise(dur,at,g,freq,q){const c=ac();if(!c||muted)return;const t=c.currentTime+(at||0),n=Math.floor(c.sampleRate*dur),b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);
 for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3);const s=c.createBufferSource();s.buffer=b;const fl=c.createBiquadFilter();fl.type='bandpass';fl.frequency.value=freq||1800;fl.Q.value=q||1.2;
 const v=c.createGain();v.gain.value=g;s.connect(fl);fl.connect(v);v.connect(master);s.start(t)}
/* mossa: "toc" di legno */
function move(){noise(.07,0,.5,900,2.2);tone('sine',220,.08,0,.12,140)}
/* COMBO di catture: livello 1 → 5+ */
const SC=[0,2,4,7,9,12,14,16,19];
function capture(level){level=Math.max(1,Math.min(8,level||1));const base=330*Math.pow(2,SC[level-1]/12),g=.09+level*.035;
 noise(.09,0,.55+level*.08,1200+level*250,1.5);
 tone('triangle',base,.22+level*.04,0,g);                                   // nota principale che sale
 if(level>=2)tone('sine',base*2,.2+level*.03,.035,g*.6);                     // ottava
 if(level>=3){tone('sawtooth',base*1.5,.16,.06,g*.25);tone('sine',base*.5,.35,0,g*.5)}   // quinta + basso
 if(level>=4){[0,1,2,3].forEach(i=>tone('triangle',base*2*Math.pow(2,(i*4)/12),.12,.09+i*.045,g*.35))}   // arpeggio
 if(level>=5){tone('square',base*4,.5,.2,g*.12,base*6);noise(.5,.18,.18,6000,.7)}   // scintillio finale
 if(level>=6)[0,1,2,3,4,5].forEach(i=>tone('sine',base*3*Math.pow(2,i/12*2),.1,.3+i*.05,g*.2))}
function check(){tone('square',880,.09,0,.07);tone('square',660,.12,.08,.07)}
function castle(){move();setTimeout(move,90)}
function start(){[523,659,784].forEach((f,i)=>tone('triangle',f,.18,i*.09,.12))}
function end(win){(win===true?[523,659,784,1047]:win===false?[440,349,294]:[523,523,440]).forEach((f,i)=>tone('triangle',f,.3,i*.13,.13))}
function low(){tone('sine',1320,.06,0,.08)}
function notify(){tone('sine',988,.12,0,.12);tone('sine',1319,.16,.1,.12)}
function coin(){for(let i=0;i<9;i++)tone('triangle',2400+i*120,.03,i*.12,.04)}
function tick(){tone('sine',1500,.03,0,.05)}
window.STASKYS_CSND={move,capture,check,castle,start,end,low,notify,coin,tick,unlock:()=>ac(),
 get muted(){return muted},set muted(v){muted=!!v;save();if(master)master.gain.value=muted?0:vol},
 get vol(){return vol},set vol(v){vol=Math.max(0,Math.min(1,+v));save();if(master)master.gain.value=muted?0:vol}};
})();
