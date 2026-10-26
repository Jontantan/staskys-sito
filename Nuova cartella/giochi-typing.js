/* Staskys — Gara di battitura: 60 secondi, frasi sempre più lunghe. Punteggio = parole al minuto × precisione. */
(function(){
const DUR=60;
const P=[ // livello 0: corte · 1: medie · 2: lunghe
 ['ciao a tutti','benvenuto su Staskys','gioca con noi','ci vediamo in chat','buona serata','pizza e anime','il server è online','entra in vocale','un caffè al volo','che bella giornata','forza e coraggio','ramen per cena','ti aspetto stasera','gg ben giocato','andiamo avanti'],
 ['stasera guardiamo un anime tutti insieme','il bot di Staskys ha sempre ragione','non dimenticare di leggere le regole','chi vince la classifica oggi?','la pizza margherita è un capolavoro','Luffy vuole diventare il re dei pirati','Goku si allena ogni giorno di più','scrivi nel canale giusto per favore','il gelato al pistacchio è il migliore','facciamo una partita a Minecraft','Naruto non si arrende mai','la mia waifu è meglio della tua','domani esce il nuovo episodio','il tramonto sul mare di Sicilia','ho finito tutti gli episodi in una notte'],
 ['su Staskys si gioca, si chiacchiera e si guardano anime fino a tardi','la squadra di Tanjiro combatte i demoni con la respirazione dell\'acqua','prima di mezzanotte voglio battere il record del Tetris','una carbonara vera si fa con guanciale, pecorino e niente panna','il Colosseo, la torre di Pisa e il Duomo di Milano sono famosi nel mondo','chi arriva primo in classifica diventa il re del server','dopo la scuola tutti in vocale per la serata quiz sugli anime','la pazienza di un monaco e la velocità di un ninja di Konoha','Eren guarda oltre le mura e sogna il mare insieme ai suoi amici','ogni giorno di fila che giochi la tua streak cresce un po\' di più','un vero campione scrive veloce senza nemmeno guardare la tastiera']
];
const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’`]/g,"'").toLowerCase();
function make(A){
 const {q,E,stage,msg}=A;
 stage.innerHTML=`<div class="ghud"><span>Tempo <b id="tm">${DUR}</b>s</span><span>WPM <b id="wpm">0</b></span><span>Precisione <b id="acc">100</b>%</span><span>Record <b id="rec">${+localStorage.typing_best||0}</b></span><button class="mute" id="mute" aria-label="Audio"></button></div>
 <div class="typ" id="ty"><div class="tphr" id="ph">Premi Gioca e scrivi le frasi più veloce che puoi.</div><div class="tbar"><i id="tb"></i></div>
 <input id="in" class="tin" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Scrivi qui…" disabled></div>
 <button class="btn sm" id="go">Gioca</button><p class="gmsg"></p>`;
 A.muteBtn(q('#mute'));const inp=q('#in'),ph=q('#ph'),ty=q('#ty'),still=A.RM();
 let st='idle',cur='',done=0,good=0,keys=0,errs=0,t0=0,raf=0,streak=0,used=new Set(),typedOk=0;
 function pick(){const lv=done<3?0:done<8?1:2,L=P[lv].filter(s=>!used.has(s));const arr=L.length?L:P[lv];const s=arr[Math.random()*arr.length|0];used.add(s);return s}
 function render(v){const a=norm(v),b=norm(cur);let h='';for(let i=0;i<cur.length;i++){const ch=E(cur[i]);h+=i<v.length?(a[i]===b[i]?`<span class="ok">${ch}</span>`:`<span class="no">${cur[i]===' '?'·':ch}</span>`):i===v.length?`<span class="cur">${ch}</span>`:ch}ph.innerHTML=h}
 function next(){cur=pick();inp.value='';render('');ph.classList.remove('in');void ph.offsetWidth;ph.classList.add('in')}
 function stats(){const min=Math.max(1/60,(performance.now()-t0)/60000),wpm=(good/5)/min,acc=keys?Math.max(0,(keys-errs)/keys):1;return{wpm,acc,score:Math.round(wpm*acc)}}
 let prev='';
 inp.addEventListener('input',()=>{if(st!=='run')return;const v=inp.value;
  if(v.length>prev.length){const i=v.length-1;keys++;
   if(i<cur.length&&norm(v[i])===norm(cur[i])&&norm(v.slice(0,i))===norm(cur.slice(0,i))){good++;streak++;A.tone('triangle',380+Math.min(streak,40)*14,.03,0,.018)}
   else{errs++;streak=0;A.tone('square',120,.07,0,.03);if(!still){ty.classList.remove('shake');void ty.offsetWidth;ty.classList.add('shake')}}}
  prev=v;render(v);
  if(norm(v)===norm(cur)){done++;good++;A.tone('triangle',880,.06,0,.035);A.tone('triangle',1320,.09,.05,.035);next();prev=''}});
 inp.addEventListener('keydown',e=>{if(e.key==='Enter')e.preventDefault()});
 function tick(){const left=Math.max(0,DUR-(performance.now()-t0)/1000);q('#tm').textContent=Math.ceil(left);q('#tb').style.width=(left/DUR*100)+'%';
  const s=stats();q('#wpm').textContent=Math.round(s.wpm);q('#acc').textContent=Math.round(s.acc*100);
  if(left<=5&&Math.ceil(left)!==tick.l){tick.l=Math.ceil(left);A.tone('sine',1000,.03,0,.02)}
  if(left<=0)return end();raf=requestAnimationFrame(tick)}
 function start(){if(!A.user)return;A.audio();st='run';done=good=keys=errs=streak=0;used.clear();prev='';t0=performance.now();inp.disabled=false;inp.focus();next();q('#go').hidden=true;msg('');tick.l=0;raf=requestAnimationFrame(tick)}
 function end(){st='over';inp.disabled=true;inp.blur();const s=stats();[784,659,523].forEach((f,i)=>A.tone('triangle',f,.12,i*.1,.04));
  ph.innerHTML=`<b class="big">${s.score}</b><span class="muted"> punti · ${Math.round(s.wpm)} WPM · ${Math.round(s.acc*100)}% · ${done} frasi</span>`;
  const g=q('#go');g.textContent='Rigioca';g.hidden=false;
  if(s.score>(+localStorage.typing_best||0)){localStorage.typing_best=s.score;q('#rec').textContent=s.score}
  msg(`Fine! ${s.score} punti.`);if(s.score>0&&s.score<=250)A.save('typing',s.score);else if(s.score>250)msg('Troppo veloce per essere vero: punteggio non salvato.')}
 q('#go').onclick=e=>{e.currentTarget.blur();start()};
 const kd=e=>{if(A.cur==='typing'&&st!=='run'&&e.key==='Enter'&&!q('#go').hidden&&document.activeElement!==inp){e.preventDefault();start()}};addEventListener('keydown',kd);
 return()=>{cancelAnimationFrame(raf);removeEventListener('keydown',kd);st='idle'}}
(window.GIOCHI_EXTRA=window.GIOCHI_EXTRA||{}).typing={t:'Gara di battitura',d:'60 secondi: scrivi le frasi più veloce che puoi, diventano sempre più lunghe. Punti = parole al minuto × precisione. Gli accenti non contano.',unit:'punti',asc:false,make};
})();
