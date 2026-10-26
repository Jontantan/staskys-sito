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
const WCSS=`
.wwrap{position:relative;width:min(100%,330px);display:flex;flex-direction:column;align-items:center;gap:.7rem;scroll-margin-top:80px}
.wgrid{display:grid;grid-template-rows:repeat(6,auto);gap:7px;width:100%;cursor:text;outline:none}
.wrow{display:grid;grid-template-columns:repeat(5,1fr);gap:7px}
.wrow i{aspect-ratio:1;display:flex;align-items:center;justify-content:center;border:2px solid var(--line);border-radius:10px;font:800 clamp(1.3rem,7vw,1.9rem) Inter,sans-serif;text-transform:uppercase;font-style:normal;color:var(--fg);background:var(--card);transition:border-color .15s,transform .1s;user-select:none;-webkit-user-select:none}
.wrow.now i{border-color:color-mix(in srgb,var(--mut) 55%,var(--line))}
.wrow i.wt{border-color:var(--fg);animation:wtp .12s ease}
.wrow i.wcur{box-shadow:inset 0 -3px 0 var(--fg)}
.wgrid.foc .wrow.now i.wcur{animation:wblink 1s steps(1) infinite}
@keyframes wblink{50%{box-shadow:none}}
@keyframes wtp{50%{transform:scale(1.1)}}
.wrow i.wg{background:#3fa34d;border-color:#3fa34d;color:#fff}.wrow i.wy{background:#d6a924;border-color:#d6a924;color:#fff}.wrow i.wb{background:#5a5a5a;border-color:#5a5a5a;color:#fff}
.wrow i.flip{animation:wflip .5s ease both}@keyframes wflip{0%{transform:rotateX(0)}50%{transform:rotateX(90deg)}100%{transform:rotateX(0)}}
.wrow.wwin i{animation:wjump .5s cubic-bezier(.2,.7,.2,1) both}.wrow.wwin i:nth-child(2){animation-delay:.08s}.wrow.wwin i:nth-child(3){animation-delay:.16s}.wrow.wwin i:nth-child(4){animation-delay:.24s}.wrow.wwin i:nth-child(5){animation-delay:.32s}
@keyframes wjump{40%{transform:translateY(-14px)}}
.winp{position:absolute;left:0;top:0;width:100%;height:100%;opacity:0;font-size:16px;border:0;padding:0;background:transparent;color:transparent;caret-color:transparent;z-index:2}
.wact{display:flex;gap:.5rem;align-items:center;justify-content:center;flex-wrap:wrap}
.wused{font:600 .8rem ui-monospace,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--mut);text-align:center;min-height:1.2em}
.wused b{color:var(--fg)}.wused s{opacity:.45}
.wend{text-align:center;display:flex;flex-direction:column;gap:.6rem;align-items:center}.wans{letter-spacing:.12em}
@media(prefers-reduced-motion:reduce){.wrow i,.wrow i.flip,.wrow.wwin i{animation:none!important}}`;
if(!document.getElementById('css-wordle')){const st=document.createElement('style');st.id='css-wordle';st.textContent=WCSS;document.head.appendChild(st)}
function make(A){
 const {q,qa,stage,msg}=A,today=romeDate(),ans=wordOf(today),KEY='wordle_'+today;
 const saved=(()=>{try{return JSON.parse(localStorage[KEY]||'null')}catch(e){return null}})()||{g:[],done:0,sent:0};
 stage.innerHTML=`<div class="ghud"><span>Il Wordle di Staskys <b>#${numOf(today)}</b></span><span>Tentativo <b id="tn">${Math.min(6,saved.g.length+1)}</b>/6</span><button class="mute" id="mute" aria-label="Audio"></button></div>
 <div class="wwrap" id="ww"><div class="wgrid" id="wg">${[...Array(6)].map(()=>'<div class="wrow">'+'<i></i>'.repeat(5)+'</div>').join('')}</div>
 <input id="wi" class="winp" type="text" inputmode="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" maxlength="5" aria-label="Scrivi la parola"></div>
 <div class="wact" id="wa"><button class="btn sm" id="wok">Invio ⏎</button><button class="btn ghost sm" id="wdel">⌫</button></div>
 <p class="wused" id="wu"></p><div class="wend" id="we" hidden></div><p class="gmsg">Scrivi con la tua tastiera. Da telefono tocca la griglia.</p>`;
 A.muteBtn(q('#mute'));const wg=q('#wg'),wi=q('#wi'),still=A.RM();
 let cur='',st=saved.done?'done':'run',locked=false,tmr=0;const kstate={};
 const rows=()=>qa('.wrow',wg);
 function paint(ri,g,res,anim){const cells=rows()[ri].children;[...g].forEach((ch,i)=>{const el=cells[i];el.textContent=ch;
   const set=()=>{el.className='w'+res[i]};if(anim&&!still){el.className='wt';el.style.animationDelay=(i*.22)+'s';void el.offsetWidth;el.className='wt flip';setTimeout(set,i*220+250);setTimeout(()=>A.tone('triangle',[392,440,494,523,587][i]*(res[i]==='g'?1.5:res[i]==='y'?1.25:1),.09,0,.035),i*220+250)}else set()});
  [...g].forEach((ch,i)=>{const p={g:3,y:2,b:1}[res[i]];if((kstate[ch]||0)<p)kstate[ch]=p});setTimeout(used,anim&&!still?1300:0)}
 function used(){const L='abcdefghijklmnopqrstuvwxyz';q('#wu').innerHTML=[...L].map(ch=>kstate[ch]===1?`<s>${ch}</s>`:kstate[ch]>1?`<b>${ch}</b>`:ch).join(' ')}
 function typed(){rows().forEach((r,i)=>r.classList.toggle('now',i===saved.g.length&&st==='run'));const cells=rows()[saved.g.length]?.children;if(!cells||st!=='run')return;
  for(let i=0;i<5;i++){const was=cells[i].textContent;cells[i].textContent=cur[i]||'';cells[i].className=(cur[i]?(was!==cur[i]?'wt':'wt'):'')+(i===cur.length?' wcur':'')}}
 saved.g.forEach((g,i)=>paint(i,g,grade(g,ans),false));used();
 function setCur(v){if(st!=='run'||locked)return;v=v.toLowerCase().normalize('NFD').replace(/[^a-z]/g,'').slice(0,5);if(v.length>cur.length)A.tone('sine',520+v.length*60,.04,0,.02);cur=v;wi.value=v;typed()}
 function key(k){if(st!=='run'||locked||!A.user)return;A.audio();
  if(k==='Backspace'){setCur(cur.slice(0,-1));return}
  if(k==='Enter'){if(cur.length<5){shake();msg('Servono 5 lettere.');return}submit();return}
  if(/^[a-zA-Z]$/.test(k)&&cur.length<5)setCur(cur+k)}
 function shake(){const r=rows()[saved.g.length];if(r&&!still){r.classList.remove('shake');void r.offsetWidth;r.classList.add('shake')}A.tone('square',140,.08,0,.03)}
 function submit(){const g=cur,res=grade(g,ans);locked=true;rows()[saved.g.length].classList.remove('now');paint(saved.g.length,g,res,true);saved.g.push(g);cur='';wi.value='';msg('');
  if(g===ans||saved.g.length>=6){saved.done=1;st='done'}localStorage[KEY]=JSON.stringify(saved);
  setTimeout(()=>{locked=false;q('#tn').textContent=Math.min(6,saved.g.length+1);typed();if(st==='done')finish(true)},still?0:1350)}
 function grid(){return saved.g.map(g=>grade(g,ans).map(r=>r==='g'?'🟩':r==='y'?'🟨':'⬛').join('')).join('\n')}
 function finish(fresh){const win=saved.g[saved.g.length-1]===ans,n=win?saved.g.length:7;q('#wa').hidden=true;wi.blur();wi.disabled=true;
  if(fresh){if(win){[523,659,784,1047].forEach((f,i)=>A.tone('triangle',f,.14,i*.1,.045));const r=rows()[saved.g.length-1];if(r&&!still)r.classList.add('wwin')}else A.tone('sine',220,.4,0,.05,130)}
  const e=q('#we');e.hidden=false;e.innerHTML=`<p><b>${win?['Geniale!','Magnifico!','Bravissimo!','Ottimo!','Bene!','Per un pelo!'][n-1]:'Peccato!'}</b> La parola era <b class="wans">${ans.toUpperCase()}</b>.</p>
  <div class="wbtn"><button class="btn sm" id="share">Condividi risultato</button></div><p class="muted small" id="cd"></p>`;
  q('#share').onclick=async()=>{const t=`Il Wordle di Staskys #${numOf(today)} ${win?n:'X'}/6\n${grid()}\nhttps://staskys.it/giochi.html#wordle`;
   try{if(navigator.share&&matchMedia('(pointer:coarse)').matches)await navigator.share({text:t});else{await navigator.clipboard.writeText(t);msg('Risultato copiato! Incollalo su Discord.')}}catch(err){}};
  const cd=()=>{const el=q('#cd');if(!el)return;const nx=romeDate(new Date(Date.parse(romeMidnight())+36*36e5)),ms=Date.parse(romeMidnight(nx))-Date.now();
   if(ms<=0){el.textContent='Nuova parola disponibile: ricarica la pagina!';return}const h=ms/36e5|0,mi=(ms%36e5)/6e4|0,s=(ms%6e4)/1e3|0;el.textContent=`Nuova parola tra ${h}h ${String(mi).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`};cd();tmr=setInterval(cd,1000);
  if(fresh)msg('');if(!saved.sent&&A.user){saved.sent=1;localStorage[KEY]=JSON.stringify(saved);A.save('wordle',n)}}
 /* input nascosto: tastiera del telefono / del PC */
 wi.addEventListener('input',()=>setCur(wi.value));
 wi.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();key('Enter')}else if(e.key==='Backspace'&&!wi.value){e.preventDefault()}});
 const keepVisible=()=>setTimeout(()=>{q('#ww')?.scrollIntoView({block:'start',behavior:still?'auto':'smooth'})},300);
 wi.addEventListener('focus',()=>{wg.classList.add('foc');if(matchMedia('(pointer:coarse)').matches)keepVisible()});wi.addEventListener('blur',()=>wg.classList.remove('foc'));
 if(window.visualViewport){const vv=()=>{if(document.activeElement===wi)keepVisible()};visualViewport.addEventListener('resize',vv);var unVV=()=>visualViewport.removeEventListener('resize',vv)}
 q('#wok').onclick=()=>{key('Enter');if(st==='run')wi.focus()};q('#wdel').onclick=()=>{key('Backspace');if(st==='run')wi.focus()};
 const kd=e=>{if(A.cur!=='wordle'||e.ctrlKey||e.metaKey||e.altKey||document.activeElement===wi||/INPUT|TEXTAREA/.test(e.target.tagName))return;
  if(e.key==='Enter'||e.key==='Backspace'||/^[a-zA-Z]$/.test(e.key)){if(st==='run'){e.preventDefault();key(e.key)}}};
 addEventListener('keydown',kd);
 if(st==='done')finish(false);
 (async()=>{if(!A.user||!A.sb||st==='done')return;const {data}=await A.sb.from('scores').select('score').eq('game','wordle').eq('user_id',A.user.id).gte('created_at',romeMidnight()).limit(1);
  if(data&&data.length&&st==='run'&&!saved.g.length){st='done';locked=true;wi.disabled=true;q('#wa').hidden=true;typed();msg(`Hai già giocato il Wordle di oggi (${data[0].score>6?'X':data[0].score}/6). Torna domani!`)}})();
 typed();
 return()=>{removeEventListener('keydown',kd);clearInterval(tmr);if(typeof unVV==='function')unVV();st='idle'}}
(window.GIOCHI_EXTRA=window.GIOCHI_EXTRA||{}).wordle={t:'Il Wordle di Staskys',d:'Indovina la parola italiana di 5 lettere in 6 tentativi. 🟩 lettera giusta al posto giusto, 🟨 lettera presente altrove. Usa la tua tastiera (da telefono tocca la griglia). Una parola al giorno, uguale per tutti: hai un solo tentativo!',
 unit:'/6',asc:true,noRecord:true,noR:true,lbDesc:'oggi · meno tentativi',lbScore:v=>v>6?'X':v,since:()=>romeMidnight(),make};
})();
