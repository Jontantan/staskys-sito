/* Staskys — Gara di battitura: 60 secondi, frasi sempre più lunghe. Punteggio = parole al minuto × precisione. */
(function(){
const DUR=60;
const P=[ // livello 0: corte · 1: medie · 2: lunghe
 ['ciao a tutti','benvenuto su Staskys','gioca con noi','ci vediamo in chat','buona serata','pizza e anime','il server è online','entra in vocale','un caffè al volo','che bella giornata','forza e coraggio','ramen per cena','ti aspetto stasera','gg ben giocato','andiamo avanti'],
 ['stasera guardiamo un anime tutti insieme','il bot di Staskys ha sempre ragione','non dimenticare di leggere le regole','chi vince la classifica oggi?','la pizza margherita è un capolavoro','Luffy vuole diventare il re dei pirati','Goku si allena ogni giorno di più','scrivi nel canale giusto per favore','il gelato al pistacchio è il migliore','facciamo una partita a Minecraft','Naruto non si arrende mai','la mia waifu è meglio della tua','domani esce il nuovo episodio','il tramonto sul mare di Sicilia','ho finito tutti gli episodi in una notte'],
 ['su Staskys si gioca, si chiacchiera e si guardano anime fino a tardi','la squadra di Tanjiro combatte i demoni con la respirazione dell\'acqua','prima di mezzanotte voglio battere il record del Tetris','una carbonara vera si fa con guanciale, pecorino e niente panna','il Colosseo, la torre di Pisa e il Duomo di Milano sono famosi nel mondo','chi arriva primo in classifica diventa il re del server','dopo la scuola tutti in vocale per la serata quiz sugli anime','la pazienza di un monaco e la velocità di un ninja di Konoha','Eren guarda oltre le mura e sogna il mare insieme ai suoi amici','ogni giorno di fila che giochi la tua streak cresce un po\' di più','un vero campione scrive veloce senza nemmeno guardare la tastiera']
];
const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’`]/g,"'").toLowerCase();
if(!document.getElementById('css-typing')){const st=document.createElement('style');st.id='css-typing';st.textContent=".typ{width:100%;display:flex;flex-direction:column;gap:.7rem}\n.tbox{position:relative;border:1px solid var(--line);border-radius:18px;background:var(--soft);padding:1.4rem 1.5rem;min-height:9.5rem;cursor:text;transition:border-color .2s,box-shadow .2s}\n.tbox.foc{border-color:var(--fg);box-shadow:0 0 0 3px color-mix(in srgb,var(--fg) 12%,transparent)}\n.tphr{font:600 clamp(1.35rem,4.6vw,1.9rem)/1.55 ui-monospace,\"SF Mono\",Menlo,Consolas,monospace;color:color-mix(in srgb,var(--mut) 70%,transparent);letter-spacing:.01em;word-break:normal;overflow-wrap:anywhere;user-select:none;-webkit-user-select:none}\n.tphr.in{animation:tin .35s var(--ease) both}@keyframes tin{from{opacity:0;transform:translateY(8px)}}\n.tphr .w{display:inline-block;white-space:nowrap}\n.tphr span.c{position:relative;border-radius:4px;transition:color .08s}\n.tphr .ok{color:var(--fg)}.tphr .no{color:#ff5a52;background:rgba(255,90,82,.16);text-decoration:underline wavy rgba(255,90,82,.7);text-underline-offset:5px}\n.tphr .cur:before{content:\"\";position:absolute;left:-1px;top:12%;bottom:12%;width:3px;border-radius:2px;background:var(--fg);animation:tcar 1s steps(1) infinite}\n@keyframes tcar{50%{opacity:0}}\n.tphr .big{font:800 3rem Inter,sans-serif;color:var(--fg);letter-spacing:-.03em}.tphr .res{display:block;font:500 1rem Inter,sans-serif;color:var(--mut);margin-top:.3rem}\n.tidle{font:500 1.05rem Inter,sans-serif;color:var(--mut)}\n.thid{position:absolute;inset:0;width:100%;height:100%;opacity:0;font-size:16px;border:0;background:transparent;color:transparent;caret-color:transparent;cursor:text}\n.tmeta{display:flex;justify-content:space-between;font-size:.8rem;color:var(--mut);padding:0 .3rem}\n.tbar{height:5px;background:var(--line);border-radius:5px;overflow:hidden}.tbar i{display:block;height:100%;width:100%;background:var(--fg);transition:width .1s linear}\n.tbar.low i{background:#ff5a52}\n@media(prefers-reduced-motion:reduce){.tphr.in,.tphr .cur:before{animation:none}}";document.head.appendChild(st)}
function make(A){
 const {q,E,stage,msg}=A;
 stage.innerHTML=`<div class="ghud"><span>Tempo <b id="tm">${DUR}</b>s</span><span>WPM <b id="wpm">0</b></span><span>Precisione <b id="acc">100</b>%</span><span>Record <b id="rec">${+localStorage.typing_best||0}</b></span><button class="mute" id="mute" aria-label="Audio"></button></div>
 <div class="typ" id="ty"><div class="tbar" id="tbw"><i id="tb"></i></div><div class="tbox" id="box"><div class="tphr" id="ph"><span class="tidle">Premi <b>Gioca</b> e scrivi le frasi più veloce che puoi. Gli accenti non contano.</span></div>
 <input id="in" class="thid" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="next" aria-label="Scrivi qui" disabled></div>
 <div class="tmeta"><span id="fr">Frase 0</span><span>tocca il riquadro per scrivere</span></div></div>
 <button class="btn sm" id="go">Gioca</button><p class="gmsg"></p>`;
 A.muteBtn(q('#mute'));const inp=q('#in'),ph=q('#ph'),ty=q('#ty'),still=A.RM();
 let st='idle',cur='',done=0,good=0,keys=0,errs=0,t0=0,raf=0,streak=0,used=new Set(),typedOk=0;
 function pick(){const lv=done<3?0:done<8?1:2,L=P[lv].filter(s=>!used.has(s));const arr=L.length?L:P[lv];const s=arr[Math.random()*arr.length|0];used.add(s);return s}
 function render(v){const a=norm(v),b=norm(cur);let h='<span class="w">';for(let i=0;i<=cur.length;i++){if(i===cur.length){h+=i===v.length?'<span class="c cur">&nbsp;</span>':'';break}
  const raw=cur[i],ch=raw===' '?'&nbsp;':E(raw),cls=i<v.length?(a[i]===b[i]?'ok':'no'):i===v.length?'cur':'';h+=`<span class="c ${cls}">${raw===' '&&cls==='no'?'·':ch}</span>`;if(raw===' ')h+='</span><span class="w">'}ph.innerHTML=h+'</span>'}
 function next(){q('#fr').textContent='Frase '+(done+1);cur=pick();inp.value='';render('');ph.classList.remove('in');void ph.offsetWidth;ph.classList.add('in')}
 function stats(){const min=Math.max(1/60,(performance.now()-t0)/60000),wpm=(good/5)/min,acc=keys?Math.max(0,(keys-errs)/keys):1;return{wpm,acc,score:Math.round(wpm*acc)}}
 let prev='';
 inp.addEventListener('input',()=>{if(st!=='run')return;const v=inp.value;
  if(v.length>prev.length){const i=v.length-1;keys++;
   if(i<cur.length&&norm(v[i])===norm(cur[i])&&norm(v.slice(0,i))===norm(cur.slice(0,i))){good++;streak++;A.tone('triangle',380+Math.min(streak,40)*14,.03,0,.018)}
   else{errs++;streak=0;A.tone('square',120,.07,0,.03);if(!still){ty.classList.remove('shake');void ty.offsetWidth;ty.classList.add('shake')}}}
  prev=v;render(v);
  if(norm(v)===norm(cur)){done++;good++;A.tone('triangle',880,.06,0,.035);A.tone('triangle',1320,.09,.05,.035);next();prev=''}});
 inp.addEventListener('keydown',e=>{if(e.key==='Enter')e.preventDefault()});
 inp.addEventListener('focus',()=>q('#box').classList.add('foc'));inp.addEventListener('blur',()=>q('#box').classList.remove('foc'));
 q('#box').addEventListener('pointerdown',()=>{if(st==='run')setTimeout(()=>inp.focus(),0)});
 function tick(){const left=Math.max(0,DUR-(performance.now()-t0)/1000);q('#tm').textContent=Math.ceil(left);q('#tb').style.width=(left/DUR*100)+'%';
  const s=stats();q('#wpm').textContent=Math.round(s.wpm);q('#acc').textContent=Math.round(s.acc*100);
  q('#tbw').classList.toggle('low',left<=10);if(left<=5&&Math.ceil(left)!==tick.l){tick.l=Math.ceil(left);A.tone('sine',1000,.03,0,.02)}
  if(left<=0)return end();raf=requestAnimationFrame(tick)}
 function start(){if(!A.user)return;A.audio();st='run';done=good=keys=errs=streak=0;used.clear();prev='';t0=performance.now();inp.disabled=false;inp.focus();next();q('#go').hidden=true;msg('');tick.l=0;raf=requestAnimationFrame(tick)}
 function end(){st='over';inp.disabled=true;inp.blur();const s=stats();[784,659,523].forEach((f,i)=>A.tone('triangle',f,.12,i*.1,.04));
  ph.innerHTML=`<b class="big">${s.score}</b> <span class="tidle">punti</span><span class="res">${Math.round(s.wpm)} WPM · ${Math.round(s.acc*100)}% di precisione · ${done} frasi</span>`;
  const g=q('#go');g.textContent='Rigioca';g.hidden=false;
  if(s.score>(+localStorage.typing_best||0)){localStorage.typing_best=s.score;q('#rec').textContent=s.score}
  msg(`Fine! ${s.score} punti.`);if(s.score>0&&s.score<=250)A.save('typing',s.score);else if(s.score>250)msg('Troppo veloce per essere vero: punteggio non salvato.')}
 q('#go').onclick=e=>{e.currentTarget.blur();start()};
 const kd=e=>{if(A.cur==='typing'&&st!=='run'&&e.key==='Enter'&&!q('#go').hidden&&document.activeElement!==inp){e.preventDefault();start()}};addEventListener('keydown',kd);
 return()=>{cancelAnimationFrame(raf);removeEventListener('keydown',kd);st='idle'}}
(window.GIOCHI_EXTRA=window.GIOCHI_EXTRA||{}).typing={t:'Gara di battitura',d:'60 secondi: scrivi le frasi più veloce che puoi, diventano sempre più lunghe. Punti = parole al minuto × precisione. Gli accenti non contano.',unit:'punti',asc:false,make};
})();
