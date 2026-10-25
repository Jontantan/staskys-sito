/* Staskys — script comune (vanilla, nessuna libreria) */
const S={GUILD:'1244253666295283713',INVITE:'T8cR8zMYcw',MC:'minecraft.staskys.it',
 ch:id=>`https://discord.com/channels/1244253666295283713/${id}`,
 C:{tickets:'1244649352992002170',candidature:'1245381979021643816',requisiti:'1245381846431432765',invito:'1245381887489474691',bump:'1253809769676931235',boost:'1245380099956670576',livelli:'1245382341128355863',verifica:'1245369748993216554',cmds:'1245382186258141214',updates:'1245379873548144661',chat:'1245382051364999168',info:'1245379655855374466',vanity:'1404042819978530876',giveaways:'1245380355184398366'}};
const $=(q,r=document)=>r.querySelector(q),$$=(q,r=document)=>[...r.querySelectorAll(q)];
const STILL=/[?&]still\b/.test(location.search);if(STILL)document.documentElement.classList.add('still');
const RM=STILL||matchMedia('(prefers-reduced-motion: reduce)').matches,FINE=matchMedia('(hover: hover) and (pointer: fine)').matches;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=n=>Number(n).toLocaleString('it-IT');
const BAKED=window.STASKYS_DATA||{};
/* dati: prova il file .json, se non va (es. doppio clic) usa la copia in data.js */
const load=name=>fetch(name+'.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw 0;return r.json()}).catch(()=>BAKED[name]||null);
const INVITE_URL='https://discord.gg/'+S.INVITE;
const PAGES=[['index','Home'],['server','Server'],['minecraft','Minecraft'],['eventi','Eventi'],['livelli','Livelli'],['ruoli','Ruoli'],['guide','Guide'],['staff','Staff'],['stato','Stato'],['supporta','Supporta']];
const PAGE=document.body.dataset.page||'index';

/* ---------- header / footer condivisi ---------- */
(function layout(){
 const nav=PAGES.map(([p,t])=>`<a href="${p}.html"${p===PAGE?' class="active" aria-current="page"':''}>${t}</a>`).join('');
 document.body.insertAdjacentHTML('afterbegin',`<div class="progress" id="progress"></div><div class="spot" id="spot"></div>
 <div id="topbar"></div>
 <header class="nav"><a href="index.html" class="brand"><img src="assets/icon.png" alt="">Staskys</a>
 <nav id="menu">${nav}</nav>
 <button class="theme" id="theme" aria-label="Tema chiaro/scuro"><span></span></button>
 <a class="btn sm magnetic" href="${INVITE_URL}" target="_blank" rel="noopener">Entra</a>
 <button class="burger" aria-label="Menu" aria-expanded="false" id="burger">Menu</button></header>`);
 document.body.insertAdjacentHTML('beforeend',`<footer><div class="foot">
  <div><a href="index.html" class="brand"><img src="assets/icon.png" alt="">Staskys</a><p class="muted small" style="margin-top:.8rem">Chatting · Eventi · Anime. Community italiana su Discord dal 2022.</p>
  <div class="social"><a href="${INVITE_URL}" target="_blank" rel="noopener">Discord</a><a href="https://www.instagram.com/stas.kys" target="_blank" rel="noopener">Instagram</a><a href="https://www.tiktok.com/@stas.kys" target="_blank" rel="noopener">TikTok</a><a href="https://disboard.org/it/server/${S.GUILD}" target="_blank" rel="noopener">Disboard</a></div></div>
  <nav>${PAGES.map(([p,t])=>`<a href="${p}.html">${t}</a>`).join('')}</nav>
  <div class="copy"><span>© Staskys</span><span>Non affiliato a Discord Inc. o Mojang.</span></div></div></footer>
  <button class="totop" id="totop" aria-label="Torna su">↑</button><div class="toast" id="toast"></div>`);
 $('#burger').onclick=()=>{const o=document.body.classList.toggle('open');$('#burger').setAttribute('aria-expanded',o)};
 $('#theme').onclick=()=>{const d=document.documentElement,dark=d.dataset.theme!=='dark';if(dark)d.dataset.theme='dark';else delete d.dataset.theme;try{localStorage.theme=dark?'dark':'light'}catch(e){}};
 $$('[data-invite]').forEach(a=>{a.href=INVITE_URL;a.target='_blank';a.rel='noopener'});
 $$('[data-ch]').forEach(a=>{a.href=S.ch(S.C[a.dataset.ch]||a.dataset.ch);a.target='_blank';a.rel='noopener'});
})();

/* ---------- barra "Novità in arrivo" (config.json) ---------- */
fetch('config.json',{cache:'no-store'}).then(r=>r.json()).catch(()=>BAKED.config).then(c=>{const b=c&&c.banner;if(!b||!b.enabled)return;
 try{if(localStorage['banner_'+b.id])return}catch(e){}
 $('#topbar').outerHTML=`<div class="topbar" id="topbar" role="status"><span>${esc(b.text)}</span>${b.link?`<a href="${esc(b.link)}" target="_blank" rel="noopener">${esc(b.link_text||'Scopri')} →</a>`:''}<button aria-label="Chiudi">×</button></div>`;
 $('#topbar button').onclick=()=>{try{localStorage['banner_'+b.id]=1}catch(e){}const t=$('#topbar');t.style.transition='opacity .3s';t.style.opacity=0;setTimeout(()=>t.remove(),300)}}).catch(()=>{});

/* ---------- effetti ---------- */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);e.target.dispatchEvent(new Event('revealed'))}}),{threshold:.1,rootMargin:'0px 0px -30px'});
function observe(root=document){$$('.reveal:not(.in)',root).forEach((el,i)=>{if(!el.style.getPropertyValue('--d'))el.style.setProperty('--d',(i%6)*.06+'s');io.observe(el)})}
let ticking=false;
function onScroll(){const h=document.documentElement,max=h.scrollHeight-h.clientHeight;$('#progress').style.transform=`scaleX(${max?h.scrollTop/max:0})`;$('#totop').classList.toggle('show',h.scrollTop>700);
 const toc=$$('.toc a');if(toc.length){let cur=-1;toc.forEach((a,i)=>{const s=$(a.getAttribute('href'));if(s&&s.getBoundingClientRect().top<innerHeight*.3)cur=i});toc.forEach((a,i)=>a.classList.toggle('active',i===cur))}ticking=false}
addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(onScroll)}},{passive:true});
$('#totop').onclick=()=>scrollTo({top:0,behavior:RM?'auto':'smooth'});
function magnetic(root=document){if(!FINE||RM)return;$$('.magnetic',root).forEach(b=>{if(b.dataset.mg)return;b.dataset.mg=1;
 b.addEventListener('pointermove',e=>{const r=b.getBoundingClientRect();b.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.18}px,${(e.clientY-r.top-r.height/2)*.28}px)`});
 b.addEventListener('pointerleave',()=>b.style.transform='')})}
if(FINE&&!RM)addEventListener('pointermove',e=>{const s=$('#spot').style;s.setProperty('--x',e.clientX+'px');s.setProperty('--y',e.clientY+'px')},{passive:true});
function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),1800)}
function animate(el,to){if(to==null||isNaN(to))return;const from=el.dataset.v===undefined?null:+el.dataset.v;el.dataset.v=to;
 if(RM||from===to){el.textContent=fmt(to);return}
 if(from!==null){el.classList.remove('tick');void el.offsetWidth;el.classList.add('tick')}
 const start=from??0,t0=performance.now(),d=from===null?1400:800;
 (function f(t){const k=Math.min(1,(t-t0)/d),e=1-Math.pow(1-k,3);el.textContent=fmt(Math.round(start+(to-start)*e));if(k<1)requestAnimationFrame(f)})(t0)}
function countOnReveal(el,to){if(RM||el.closest('.reveal.in')||!el.closest('.reveal'))return animate(el,to);el.closest('.reveal').addEventListener('revealed',()=>animate(el,to),{once:true});el.textContent='0'}
function copy(text,btn,code){const done=()=>{if(btn){const o=btn.textContent;btn.textContent='✓ Copiato';btn.classList.add('ok');code&&code.classList.add('flash');setTimeout(()=>{btn.textContent=o;btn.classList.remove('ok');code&&code.classList.remove('flash')},1800)}toast('Copiato negli appunti')};
 (navigator.clipboard?navigator.clipboard.writeText(text):Promise.reject()).then(done).catch(()=>{const t=document.createElement('textarea');t.value=text;document.body.append(t);t.select();try{document.execCommand('copy')}catch(e){}t.remove();done()})}
function accordion(root=document){$$('details',root).forEach(d=>{const p=$('p',d)||d.lastElementChild;if(p.parentElement.classList.contains('acc'))return;const w=document.createElement('div');w.className='acc';p.before(w);w.append(p);
 $('summary',d).addEventListener('click',e=>{if(RM)return;e.preventDefault();
  if(d.open){w.style.height=w.scrollHeight+'px';requestAnimationFrame(()=>w.style.height='0px');setTimeout(()=>{d.open=false;w.style.height=''},400)}
  else{$$('details[open]',d.parentElement).forEach(o=>o!==d&&$('summary',o).click());d.open=true;w.style.height='0px';requestAnimationFrame(()=>w.style.height=w.scrollHeight+'px');setTimeout(()=>w.style.height='',420)}})})}
const ago=iso=>{const s=(Date.now()-new Date(iso))/1000;if(s<60)return'pochi secondi fa';if(s<3600)return Math.round(s/60)+' min fa';if(s<86400)return Math.round(s/3600)+' ore fa';return Math.round(s/86400)+' giorni fa'};
const dateIT=iso=>new Date(iso).toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'});

/* ---------- servizi live ---------- */
const getInvite=()=>fetch(`https://discord.com/api/v10/invites/${S.INVITE}?with_counts=true`).then(r=>r.json()).then(d=>d.guild?.id===S.GUILD?d:Promise.reject());
const getWidget=()=>fetch(`https://discord.com/api/guilds/${S.GUILD}/widget.json`).then(r=>r.ok?r.json():Promise.reject()).then(w=>({online:w.presence_count,voice:(w.members||[]).filter(m=>m.channel_id).length,rooms:new Set((w.members||[]).filter(m=>m.channel_id).map(m=>m.channel_id)).size}));
const getMC=()=>fetch('https://api.mcsrvstat.us/3/'+S.MC).then(r=>r.json());
function liveCounts(){const go=()=>getInvite().then(d=>{$$('[data-live]').forEach(el=>el.closest('[hidden]')&&(el.closest('[hidden]').hidden=false));
 $$('[data-live=members]').forEach(el=>animate(el,d.approximate_member_count));$$('[data-live=online]').forEach(el=>animate(el,d.approximate_presence_count))}).catch(()=>{});
 const v=()=>getWidget().then(w=>{$$('[data-live=voice]').forEach(el=>{animate(el,w.voice);const h=el.closest('[data-hide-empty]');h&&(h.hidden=false)})}).catch(()=>{});
 go();v();setInterval(go,45000);setInterval(v,60000)}
function mcStatus(el){const f=()=>getMC().then(d=>{const on=d.online;el.innerHTML=`<i class="dot ${on?'':'off'}"></i><span>${on?`Online · ${d.players?.online??0}/${d.players?.max??20} giocatori`:'Offline'}</span>`}).catch(()=>{el.innerHTML='<i class="dot off"></i><span>Stato non disponibile</span>'});f();setInterval(f,60000)}

/* ---------- componenti ---------- */
const md=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/__(.+?)__/g,'$1').replace(/\*(.+?)\*/g,'<i>$1</i>').replace(/^(&gt;|-#)\s?/gm,'').replace(/^#+\s*/gm,'').replace(/https?:\/\/\S+/g,'').replace(/[~`]/g,'');
function newsCard(n){return`<article class="reveal">${n.images&&n.images[0]?`<img src="${esc(n.images[0])}" alt="" loading="lazy" onerror="this.remove()">`:''}<div class="in"><p class="meta">${dateIT(n.date)} · ${esc(n.author)}</p><h3>${esc(n.title)}</h3>${n.body?`<p class="body">${md(n.body)}</p>`:''}<a class="open" href="${esc(n.url)}" target="_blank" rel="noopener">Apri su Discord <span>→</span></a></div></article>`}
function staffCards(list){return list.map(s=>`<div class="member reveal" tabindex="0"><div class="card3d"><img src="${esc(s.avatar)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='assets/icon.png'"><b>${esc(s.name)}</b><span>${esc(s.role)}</span></div></div>`).join('')}
function tilt(root){if(!FINE||RM)return;$$('.member',root).forEach(m=>{const c=m.firstElementChild;m.addEventListener('pointermove',e=>{const r=m.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;c.style.transform=`rotateY(${x*14}deg) rotateX(${-y*14}deg)`});m.addEventListener('pointerleave',()=>c.style.transform='')})}

/* ---------- pagine ---------- */
const INIT={
 index(){liveCounts();
  load('news').then(d=>{const items=(d&&d.items)||[];let shown=3;const g=$('#newsgrid'),r=()=>{g.innerHTML=items.slice(0,shown).map(newsCard).join('')||'<p class="muted">Nessun annuncio al momento.</p>';observe(g);$('#more').hidden=shown>=items.length};r();$('#more').onclick=()=>{shown+=6;r()}});
  load('guild').then(g=>{if(g&&g.motw){$('#motw').hidden=false;$('#motw-card').innerHTML=`<img src="${esc(g.motw.avatar)}" alt="" onerror="this.src='assets/icon.png'"><div><p class="label">Member of the Week</p><h3 style="font-size:1.6rem">${esc(g.motw.name)}</h3><p class="muted small">Complimenti! Riconoscimento settimanale dello staff.</p></div>`}})},
 server(){liveCounts()},
 minecraft(){mcStatus($('#mcstatus'));$('#copy').onclick=()=>copy(S.MC,$('#copy'),$('#ip'))},
 eventi(){load('events').then(d=>{const ev=((d&&d.events)||[]).filter(e=>!e.end||new Date(e.end)>new Date()||e.live),g=$('#events');
  if(!ev.length){g.innerHTML='<div class="empty reveal"><p style="font-size:1.1rem;color:var(--fg);font-weight:600">Nessun evento programmato al momento.</p><p>Gli eventi vengono annunciati sul server: attiva i ruoli <b>Events</b> e <b>Mini events</b> in Canali &amp; Ruoli per ricevere il ping.</p></div>';observe(g);return}
  g.innerHTML=ev.map(e=>`<article class="event reveal">${e.image?`<img src="${esc(e.image)}" alt="" loading="lazy">`:''}<div class="in"><p class="meta">${e.live?'<span class="live-badge"><i class="dot"></i> In corso</span>':new Date(e.start).toLocaleString('it-IT',{weekday:'long',day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'})}${e.location?' · '+esc(e.location):''}</p><h3 style="font-size:1.4rem">${esc(e.name)}</h3>${e.description?`<p class="muted">${md(e.description)}</p>`:''}${e.live?'':`<div class="countdown" data-start="${e.start}"></div>`}<p class="small muted">${e.interested?fmt(e.interested)+' interessati · ':''}<a class="open" style="display:inline" href="${esc(e.url)}" target="_blank" rel="noopener">Apri su Discord →</a></p></div></article>`).join('');observe(g);
  const tick=()=>$$('.countdown',g).forEach(c=>{let s=Math.max(0,(new Date(c.dataset.start)-Date.now())/1000|0);const p=[[86400,'giorni'],[3600,'ore'],[60,'min'],[1,'sec']].map(([u,l])=>{const v=s/u|0;s%=u;return`<div><b>${String(v).padStart(2,'0')}</b><small>${l}</small></div>`});c.innerHTML=p.join('')});tick();setInterval(tick,1000)})},
 livelli(){
  const T=l=>20*l*l+35; /* tabella ufficiale AmariBot: XP totale del livello l */
  const calc=()=>{const a=Math.max(0,+$('#lv-now').value|0),b=Math.max(0,+$('#lv-goal').value|0),x=Math.max(0,+$('#xp-now').value|0);
   const need=b>a?Math.max(0,T(b)-Math.max(T(a),x)):0;animate($('#need'),need);$('#need-note').textContent=b>a?`XP totali per il livello ${b}: ${fmt(T(b))}`:'Il livello obiettivo deve essere più alto di quello attuale.'};
  $$('#calc input').forEach(i=>i.addEventListener('input',calc));calc();
  load('roles').then(d=>{const L=(d&&d.levels)||[],max=Math.max(1,...L.map(l=>l.members||0));
   $('#levels tbody').innerHTML=L.map(l=>`<tr><td><b>Livello ${l.level}</b></td><td>Ruolo <code>lvl ${l.level}</code></td><td class="num hide-m">${fmt(T(l.level))} XP</td>${d.counts?`<td class="num">${l.members!=null?fmt(l.members):'–'}</td><td class="hide-m"><div class="bar"><i data-w="${((l.members||0)/max*100).toFixed(1)}"></i></div></td>`:''}</tr>`).join('');
   if(!d.counts)$$('#levels .cnt').forEach(e=>e.remove());
   const t=$('#levels');const fill=()=>$$('.bar i',t).forEach(i=>i.style.width=i.dataset.w+'%');t.classList.contains('in')?fill():t.addEventListener('revealed',fill,{once:true})})},
 ruoli(){load('roles').then(d=>{if(!d)return;const G=[['colori','Colori','Scegli il colore del tuo nome da Canali & Ruoli.'],['ping','Notifiche','Ricevi un ping solo per ciò che ti interessa.'],['giochi','Giochi','Mostra a cosa giochi e trova compagni. “Minecraft” sblocca anche i canali StaskysMC.'],['supporter','Supporter e riconoscimenti','Ruoli per chi supporta il server o si distingue.'],['tornei','Tornei','Ruoli dei tornei a cui la community ha partecipato.'],['staff','Staff','Ruoli dello staff. Per entrare guarda la pagina Staff.']];
  $('#roles').innerHTML=G.filter(([k])=>(d.groups[k]||[]).length).map(([k,t,p])=>`<div class="rgroup reveal"><div><h3>${t}</h3><p>${p}</p></div><div class="roles">${d.groups[k].map(r=>`<span class="role-pill" title="${esc(r.how||'')}"${r.color?` style="--sw:${r.color}"`:''}><i></i>${esc(r.name)}${d.counts&&r.members?` <small>${fmt(r.members)}</small>`:''}</span>`).join('')}</div></div>`).join('');observe($('#roles'))})},
 staff(){load('staff').then(d=>{const g=$('#staffgrid');g.innerHTML=staffCards((d&&d.staff)||[]);observe(g);tilt(g)})},
 stato(){
  const set=(id,state,val,sub)=>{const r=$('#'+id);$('.dot',r).className='dot '+(state==='ok'?'':state==='warn'?'warn':'off');$('.val',r).innerHTML=`${val}${sub?`<small>${sub}</small>`:''}`;r.dataset.state=state;overall()};
  const overall=()=>{const s=$$('.svc').map(r=>r.dataset.state).filter(Boolean),bad=s.filter(x=>x==='bad').length,warn=s.filter(x=>x==='warn').length;$('#overall').innerHTML=`<i class="dot ${bad?'off':warn?'warn':''}"></i>${bad?'Alcuni servizi non sono raggiungibili':warn?'Servizi operativi, con qualche avviso':'Tutti i servizi sono operativi'}`};
  const run=()=>{const t0=performance.now();
   getInvite().then(d=>set('s-discord','ok','Online',`${fmt(d.approximate_member_count)} membri · ${fmt(d.approximate_presence_count)} online`)).catch(()=>set('s-discord','bad','Non raggiungibile'));
   getWidget().then(w=>set('s-voice','ok',`${fmt(w.voice)} in vocale`,`${fmt(w.rooms)} stanze attive`)).catch(()=>set('s-voice','warn','Non disponibile','widget disattivato'));
   getMC().then(d=>d.online?set('s-mc','ok','Online',`${d.players?.online??0}/${d.players?.max??20} giocatori${d.version?' · '+esc(String(d.version).slice(0,30)):''}`):set('s-mc','bad','Offline',S.MC)).catch(()=>set('s-mc','warn','Stato non disponibile'));
   (location.protocol==='file:'?Promise.resolve(1):fetch('index.html',{cache:'no-store',method:'HEAD'})).then(()=>set('s-web','ok','Online',location.protocol==='file:'?'aperto in locale':`risposta in ${Math.round(performance.now()-t0)} ms`)).catch(()=>set('s-web','bad','Errore'));
   load('guild').then(g=>{if(!g)return set('s-sync','bad','Mai eseguito');const m=(Date.now()-new Date(g.updated))/60000;set('s-sync',m<20?'ok':m<180?'warn':'bad',ago(g.updated),new Date(g.updated).toLocaleString('it-IT'))});
   $('#checked').textContent=new Date().toLocaleTimeString('it-IT')};
  run();setInterval(run,60000)},
 supporta(){load('guild').then(g=>{if(!g)return;countOnReveal($('#boosts'),g.boosts);$('#blevel').textContent=g.boost_level??'–'});
  $$('[data-copy]').forEach(b=>b.onclick=()=>copy(b.dataset.copy,b))},
 guide(){}
};
try{if(INIT[PAGE])INIT[PAGE]()}catch(e){console.error(e)}
accordion();observe();magnetic();onScroll();
