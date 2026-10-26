/* Staskys — Il Wordle di Staskys: una parola italiana di 5 lettere al giorno (mezzanotte di Roma), uguale per tutti, un solo tentativo al giorno.
   L'elenco delle 400 parole è offuscato (XOR + base64) per non leggere la soluzione a occhio. */
(function(){
const D='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';
const K='StaskysWordle';
let WORDS=null;function words(){if(WORDS)return WORDS;const b=atob(D);let s='';for(let i=0;i<b.length;i++)s+=String.fromCharCode(b.charCodeAt(i)^K.charCodeAt(i%K.length));WORDS=s.match(/.{5}/g);return WORDS}
/* data di Roma "YYYY-MM-DD", numero del giorno e istante UTC della mezzanotte di Roma */
const romeDate=(d=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
const dayNum=ds=>{const [y,m,d]=ds.split('-').map(Number);return Math.round(Date.UTC(y,m-1,d)/864e5)};
function romeMidnight(ds=romeDate()){const [y,m,d]=ds.split('-').map(Number),g=Date.UTC(y,m-1,d,0);
 const h=+new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Rome',hour:'2-digit',hourCycle:'h23'}).format(new Date(g));return new Date(g-h*36e5).toISOString()}
const START=dayNum('2026-10-26');
const wordOf=ds=>{const w=words(),n=dayNum(ds);return w[(((n*263+71)%w.length)+w.length)%w.length]}; // 263 primo con 400: nessuna ripetizione per 400 giorni
const numOf=ds=>dayNum(ds)-START+1;
function grade(g,a){const r=Array(5).fill('b'),left={};for(let i=0;i<5;i++){if(g[i]===a[i])r[i]='g';else left[a[i]]=(left[a[i]]||0)+1}
 for(let i=0;i<5;i++)if(r[i]!=='g'&&left[g[i]]){r[i]='y';left[g[i]]--}return r}
window.__twordle={words,romeDate,dayNum,romeMidnight,wordOf,grade};
const ROWS=['qwertyuiop','asdfghjkl','⏎zxcvbnm⌫'];
function make(A){
 const {q,qa,stage,msg}=A,today=romeDate(),ans=wordOf(today),KEY='wordle_'+today;
 const saved=(()=>{try{return JSON.parse(localStorage[KEY]||'null')}catch(e){return null}})()||{g:[],done:0,sent:0};
 stage.innerHTML=`<div class="ghud"><span>Il Wordle di Staskys <b>#${numOf(today)}</b></span><span>Tentativo <b id="tn">${Math.min(6,saved.g.length+1)}</b>/6</span><button class="mute" id="mute" aria-label="Audio"></button></div>
 <div class="wgrid" id="wg">${'<div class="wrow">'+'<i></i>'.repeat(5)+'</div>'.repeat(1)}</div>
 <div class="wkb" id="kb">${ROWS.map(r=>'<div>'+[...r].map(k=>`<button data-k="${k}" class="${k.length&&/⏎|⌫/.test(k)?'wide':''}">${k==='⏎'?'Invio':k}</button>`).join('')+'</div>').join('')}</div>
 <div class="wend" id="we" hidden></div><p class="gmsg"></p>`;
 A.muteBtn(q('#mute'));const wg=q('#wg'),still=A.RM();
 wg.innerHTML=[...Array(6)].map(()=>'<div class="wrow">'+'<i></i>'.repeat(5)+'</div>').join('');
 let cur='',st=saved.done?'done':'run',locked=false;
 const rows=()=>qa('.wrow',wg),kstate={};
 function paint(ri,g,res,anim){const cells=rows()[ri].children;[...g].forEach((ch,i)=>{const el=cells[i];el.textContent=ch;
   const set=()=>{el.className='w'+res[i];};if(anim&&!still){el.style.animationDelay=(i*.22)+'s';el.classList.add('flip');setTimeout(set,i*220+160);setTimeout(()=>A.tone('triangle',[392,440,494,523,587][i]*(res[i]==='g'?1.5:res[i]==='y'?1.25:1),.09,0,.035),i*220+160)}else set()});
  [...g].forEach((ch,i)=>{const p={g:3,y:2,b:1}[res[i]];if((kstate[ch]||0)<p)kstate[ch]=p});setTimeout(paintKb,anim&&!still?1300:0)}
 function paintKb(){qa('#kb button').forEach(b=>{const s=kstate[b.dataset.k];b.className=(b.className.includes('wide')?'wide ':'')+(s?['','kb','ky','kg'][s]:'')})}
 function typed(){const cells=rows()[saved.g.length]?.children;if(!cells)return;for(let i=0;i<5;i++){cells[i].textContent=cur[i]||'';cells[i].className=cur[i]?'wt':''}}
 saved.g.forEach((g,i)=>paint(i,g,grade(g,ans),false));
 function key(k){if(st!=='run'||locked||!A.user)return;A.audio();
  if(k==='⌫'||k==='Backspace'){cur=cur.slice(0,-1);typed();return}
  if(k==='⏎'||k==='Enter'){if(cur.length<5){shake();msg('Servono 5 lettere.');return}submit();return}
  k=k.toLowerCase();if(/^[a-z]$/.test(k)&&cur.length<5){cur+=k;typed();A.tone('sine',600,.03,0,.02);const c=rows()[saved.g.length].children[cur.length-1];A.pop(c)}}
 function shake(){const r=rows()[saved.g.length];if(r&&!still){r.classList.remove('shake');void r.offsetWidth;r.classList.add('shake')}A.tone('square',140,.08,0,.03)}
 function submit(){const g=cur,res=grade(g,ans);locked=true;paint(saved.g.length,g,res,true);saved.g.push(g);cur='';msg('');
  const win=g===ans;if(win||saved.g.length>=6){saved.done=1;st='done'}localStorage[KEY]=JSON.stringify(saved);
  setTimeout(()=>{locked=false;q('#tn').textContent=Math.min(6,saved.g.length+1);if(st==='done')finish(true)},still?0:1300)}
 function grid(){return saved.g.map(g=>grade(g,ans).map(r=>r==='g'?'🟩':r==='y'?'🟨':'⬛').join('')).join('\n')}
 function finish(fresh){const win=saved.g[saved.g.length-1]===ans,n=win?saved.g.length:7;
  if(fresh){if(win){[523,659,784,1047].forEach((f,i)=>A.tone('triangle',f,.14,i*.1,.045));const r=rows()[saved.g.length-1];if(r&&!still)r.classList.add('wwin')}else A.tone('sine',220,.4,0,.05,130)}
  const e=q('#we');e.hidden=false;e.innerHTML=`<p><b>${win?['Geniale!','Magnifico!','Bravissimo!','Ottimo!','Bene!','Per un pelo!'][n-1]:'Peccato!'}</b> La parola era <b class="wans">${ans.toUpperCase()}</b>.</p>
  <div class="wbtn"><button class="btn sm" id="share">Condividi risultato</button></div><p class="muted small" id="cd"></p>`;
  q('#share').onclick=async()=>{const t=`Il Wordle di Staskys #${numOf(today)} ${win?n:'X'}/6\n${grid()}\nhttps://staskys.it/giochi.html#wordle`;
   try{if(navigator.share&&matchMedia('(pointer:coarse)').matches)await navigator.share({text:t});else{await navigator.clipboard.writeText(t);msg('Risultato copiato! Incollalo su Discord.')}}catch(err){}};
  const cd=()=>{const el=q('#cd');if(!el)return;const [y,m,d]=today.split('-').map(Number),nx=romeDate(new Date(Date.parse(romeMidnight())+36*36e5)),ms=Date.parse(romeMidnight(nx))-Date.now();
   if(ms<=0){el.textContent='Nuova parola disponibile: ricarica la pagina!';return}const h=ms/36e5|0,mi=(ms%36e5)/6e4|0,s=(ms%6e4)/1e3|0;el.textContent=`Nuova parola tra ${h}h ${String(mi).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`};cd();tmr=setInterval(cd,1000);
  if(!saved.sent&&A.user){saved.sent=1;localStorage[KEY]=JSON.stringify(saved);A.save('wordle',n)}}
 let tmr=0;
 qa('#kb button').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();key(b.dataset.k)}));
 const kd=e=>{if(A.cur!=='wordle'||e.ctrlKey||e.metaKey||e.altKey)return;if(e.key==='Enter'||e.key==='Backspace'||/^[a-zA-Z]$/.test(e.key)){if(st==='run'){e.preventDefault();key(e.key)}}};
 addEventListener('keydown',kd);
 if(st==='done')finish(false);
 /* già giocato oggi su un altro dispositivo? */
 (async()=>{if(!A.user||!A.sb||st==='done')return;const {data}=await A.sb.from('scores').select('score').eq('game','wordle').eq('user_id',A.user.id).gte('created_at',romeMidnight()).limit(1);
  if(data&&data.length&&st==='run'&&!saved.g.length){st='done';locked=true;msg(`Hai già giocato il Wordle di oggi (${data[0].score>6?'X':data[0].score}/6). Torna domani!`)}})();
 typed();
 return()=>{removeEventListener('keydown',kd);clearInterval(tmr);st='idle'}}
(window.GIOCHI_EXTRA=window.GIOCHI_EXTRA||{}).wordle={t:'Il Wordle di Staskys',d:'Indovina la parola italiana di 5 lettere in 6 tentativi. 🟩 lettera giusta al posto giusto, 🟨 lettera presente altrove. Una parola al giorno, uguale per tutti: hai un solo tentativo!',
 unit:'/6',asc:true,noRecord:true,noR:true,lbDesc:'oggi · meno tentativi',lbScore:v=>v>6?'X':v,since:()=>romeMidnight(),make};
})();
