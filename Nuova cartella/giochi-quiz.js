/* Staskys — Quiz anime: domande generate dai dati di Jikan (API di MyAnimeList) da un bacino di ~500 anime,
   5 tipi di domanda, memoria per giocatore delle domande già viste (localStorage), con ~80 domande di riserva. */
(function(){
const API_URL='https://api.jikan.moe/v4',CACHE_H=24,PER_Q=15,ROUND=10,PAGES=20,SEEN_MAX=250,BANK_SEEN_MAX=60;
/* Domande di riserva (usate se l'API non risponde): [domanda, giusta, [3 sbagliate]] */
const BANK=[
 ['Quale studio ha animato le prime tre stagioni de "L\'attacco dei giganti"?','Wit Studio',['MAPPA','Bones','Madhouse']],
 ['Chi è l\'autore del manga "One Piece"?','Eiichiro Oda',['Masashi Kishimoto','Akira Toriyama','Tite Kubo']],
 ['In "Naruto", come si chiama il villaggio di Naruto?','Konoha (Villaggio della Foglia)',['Suna (Villaggio della Sabbia)','Kiri (Villaggio della Nebbia)','Kumo (Villaggio della Nuvola)']],
 ['In "Death Note", quale Shinigami lascia cadere il quaderno nel mondo umano?','Ryuk',['Rem','Sidoh','Gelus']],
 ['In "Dragon Ball", come si chiama il pianeta d\'origine dei Saiyan?','Vegeta',['Namecc','Freezer','Yardrat']],
 ['In "Fullmetal Alchemist", come si chiama il fratello di Edward Elric?','Alphonse',['Roy','Maes','Van']],
 ['In che anno è uscito al cinema in Giappone il film "Your Name."?','2016',['2014','2018','2012']],
 ['Quale studio ha realizzato "La città incantata"?','Studio Ghibli',['Studio Ponoc','Toei Animation','Kyoto Animation']],
 ['Quale studio anima "Demon Slayer"?','ufotable',['MAPPA','Bones','A-1 Pictures']],
 ['Quale studio anima "Jujutsu Kaisen"?','MAPPA',['ufotable','Wit Studio','Trigger']],
 ['Come si chiama il protagonista di "One Punch Man"?','Saitama',['Genos','Mumen Rider','Garou']],
 ['Qual è il primo Pokémon di Ash nella serie animata?','Pikachu',['Bulbasaur','Charmander','Squirtle']],
 ['Come si chiama la protagonista di "Sailor Moon"?','Usagi Tsukino',['Rei Hino','Ami Mizuno','Makoto Kino']],
 ['In "Hunter x Hunter", quale amico di Gon usa poteri elettrici?','Killua',['Kurapika','Leorio','Hisoka']],
 ['In "My Hero Academia", come si chiama il Quirk tramandato da All Might a Deku?','One For All',['All For One','Half-Cold Half-Hot','Explosion']],
 ['Chi è il protagonista di "Cowboy Bebop"?','Spike Spiegel',['Jet Black','Vicious','Edward']],
 ['In "Neon Genesis Evangelion", chi pilota l\'EVA-01?','Shinji Ikari',['Rei Ayanami','Asuka Langley Soryu','Kaworu Nagisa']],
 ['In "Steins;Gate", con quale nome si fa chiamare Rintaro Okabe?','Hououin Kyouma',['Daru','Okarin Prime','Mad Scientist Zero']],
 ['In "Chainsaw Man", come si chiama il diavolo motosega?','Pochita',['Power','Kon','Makima']],
 ['In "Spy x Family", quale membro della famiglia Forger legge nel pensiero?','Anya',['Loid','Yor','Bond']],
 ['In "Code Geass", come si chiama il potere di Lelouch?','Geass',['Alchimia','Nen','Stand']],
 ['In "One Piece", qual è il sogno di Monkey D. Luffy?','Diventare il Re dei pirati',['Trovare All Blue','Diventare il più grande spadaccino','Disegnare la mappa del mondo']],
 ['In "One Piece", come si chiama lo spadaccino della ciurma di Cappello di Paglia?','Roronoa Zoro',['Sanji','Usopp','Trafalgar Law']],
 ['In "One Piece", quale frutto del diavolo ha mangiato Luffy (nome originale)?','Gom Gom',['Foco Foco','Paramisha','Ope Ope']],
 ['In "Naruto", quale demone è sigillato dentro Naruto?','La Volpe a Nove Code (Kurama)',['Shukaku','Il Bijuu a otto code','Matatabi']],
 ['In "Naruto", chi è il maestro del Team 7?','Kakashi Hatake',['Jiraiya','Iruka Umino','Might Guy']],
 ['In "Naruto", come si chiama il fratello maggiore di Sasuke?','Itachi',['Obito','Madara','Shisui']],
 ['In "Dragon Ball Z", qual è il nome saiyan di Goku?','Kakarot',['Raditz','Bardock','Nappa']],
 ['In "Dragon Ball", quante sono le sfere del drago della Terra?','7',['5','9','12']],
 ['In "Death Note", qual è il cognome di Light?','Yagami',['Amane','Lawliet','Mikami']],
 ['In "Death Note", qual è il cibo preferito di Ryuk?','Le mele',['I dolci','Il ramen','Le fragole']],
 ['In "L\'attacco dei giganti", come si chiama il protagonista?','Eren Jaeger',['Armin Arlert','Levi Ackerman','Reiner Braun']],
 ['In "L\'attacco dei giganti", come si chiamano le tre mura?','Maria, Rose e Sina',['Maria, Rosa e Sara','Alpha, Beta e Gamma','Shiganshina, Trost e Stohess']],
 ['In "Demon Slayer", come si chiama la sorella di Tanjiro?','Nezuko',['Kanao','Shinobu','Mitsuri']],
 ['In "Demon Slayer", quale respirazione usa Zenitsu?','Respirazione del Tuono',['Respirazione dell\'Acqua','Respirazione della Fiamma','Respirazione della Bestia']],
 ['In "Jujutsu Kaisen", di quale maledizione Yuji Itadori diventa il contenitore?','Ryomen Sukuna',['Mahito','Jogo','Hanami']],
 ['In "Jujutsu Kaisen", chi è il maestro di Yuji che porta una benda sugli occhi?','Satoru Gojo',['Kento Nanami','Masamichi Yaga','Suguru Geto']],
 ['In "My Hero Academia", come si chiama il liceo degli eroi?','U.A.',['Shiketsu','Ketsubutsu','Isamu']],
 ['In "My Hero Academia", qual è il Quirk di Bakugo?','Esplosione',['Fuoco infernale','Indurimento','Gravità zero']],
 ['In "Fullmetal Alchemist", qual è la legge fondamentale dell\'alchimia?','Lo scambio equivalente',['La pietra filosofale','La trasmutazione umana','Il cerchio eterno']],
 ['In "Fullmetal Alchemist", chi è l\'Alchimista di Fuoco?','Roy Mustang',['Alex Louis Armstrong','Scar','Solf J. Kimblee']],
 ['In "Hunter x Hunter", come si chiama l\'energia vitale usata dai combattenti?','Nen',['Chakra','Ki','Haki']],
 ['In "Bleach", come si chiama il protagonista?','Ichigo Kurosaki',['Renji Abarai','Uryu Ishida','Byakuya Kuchiki']],
 ['In "Bleach", come si chiamano le spade dei Shinigami?','Zanpakuto',['Katana del Vuoto','Nichirin','Kusanagi']],
 ['In "Sword Art Online", come si chiama il protagonista nel gioco?','Kirito',['Asuna','Klein','Heathcliff']],
 ['In "Tokyo Ghoul", come si chiama il protagonista?','Ken Kaneki',['Touka Kirishima','Hideyoshi Nagachika','Shu Tsukiyama']],
 ['In "Pokémon", come si chiama la città natale di Ash?','Biancavilla',['Plumbeopoli','Celestopoli','Zafferanopoli']],
 ['In "Pokémon", come si chiamano i due membri umani del Team Rocket che inseguono Ash?','Jessie e James',['Butch e Cassidy','Brock e Misty','Giovanni e Meowth']],
 ['In "Mob Psycho 100", come si chiama il "maestro" di Mob?','Reigen Arataka',['Dimple','Teru Hanazawa','Ritsu Kageyama']],
 ['In "Haikyu!!", in quale ruolo gioca Kageyama?','Alzatore',['Libero','Schiacciatore','Centrale']],
 ['In "Haikyu!!", come si chiama il liceo di Hinata?','Karasuno',['Aoba Johsai','Nekoma','Shiratorizawa']],
 ['In "Kuroko no Basket", quale sport si gioca?','Basket',['Calcio','Pallavolo','Baseball']],
 ['In "Captain Tsubasa" (Holly e Benji), quale sport pratica Tsubasa?','Calcio',['Baseball','Tennis','Rugby']],
 ['Qual è il titolo italiano di "Captain Tsubasa"?','Holly e Benji',['Mila e Shiro','Lupin III','Kiss me Licia']],
 ['Chi ha diretto "Il mio vicino Totoro"?','Hayao Miyazaki',['Isao Takahata','Makoto Shinkai','Mamoru Hosoda']],
 ['Chi ha diretto "Your Name." e "Weathering with You"?','Makoto Shinkai',['Hayao Miyazaki','Mamoru Hosoda','Satoshi Kon']],
 ['Quale film Ghibli ha vinto l\'Oscar come miglior film d\'animazione nel 2003?','La città incantata',['Il castello errante di Howl','Principessa Mononoke','Ponyo sulla scogliera']],
 ['In "Lupin III", come si chiama il pistolero amico di Lupin?','Daisuke Jigen',['Goemon Ishikawa','Koichi Zenigata','Fujiko Mine']],
 ['In "Lupin III", quale ispettore insegue sempre Lupin?','Zenigata',['Megure','Columbo','Akechi']],
 ['In "Detective Conan", qual è il vero nome di Conan?','Shinichi Kudo',['Kaito Kid','Heiji Hattori','Kogoro Mouri']],
 ['In "Doraemon", da quale secolo arriva Doraemon?','XXII secolo',['XXI secolo','XXV secolo','XXX secolo']],
 ['In "Doraemon", qual è il cibo preferito di Doraemon?','I dorayaki',['Il ramen','Gli onigiri','Il sushi']],
 ['In "Sailor Moon", come si chiama la gatta nera che accompagna Usagi?','Luna',['Artemis','Diana','Chibiusa']],
 ['In "JoJo\'s Bizarre Adventure", come si chiamano le manifestazioni dei poteri dalla terza parte in poi?','Stand',['Persona','Nen','Quirk']],
 ['In "JoJo\'s Bizarre Adventure", qual è lo Stand di Jotaro Kujo?','Star Platinum',['The World','Crazy Diamond','Gold Experience']],
 ['In "Evangelion", come si chiama l\'organizzazione che gestisce gli EVA?','NERV',['SEELE','WILLE','GEHIRN Corp']],
 ['In "Re:Zero", qual è il potere di Subaru?','Ritorno dalla morte',['Occhio del Geass','Controllo del tempo','Teletrasporto']],
 ['In "Frieren", di quale razza è Frieren?','Elfa',['Nana','Demone','Umana']],
 ['In "Frieren", come si chiama l\'eroe del gruppo di Frieren?','Himmel',['Heiter','Eisen','Stark']],
 ['In "Solo Leveling", come si chiama il protagonista?','Sung Jinwoo',['Cha Hae-In','Yoo Jinho','Go Gunhee']],
 ['In "Vinland Saga", come si chiama il protagonista?','Thorfinn',['Askeladd','Canute','Thorkell']],
 ['In "Cowboy Bebop", come si chiama il cane della ciurma?','Ein',['Bebop','Jet','Rocco']],
 ['In "Gintama", come si chiama il protagonista?','Gintoki Sakata',['Shinpachi Shimura','Kagura','Toshiro Hijikata']],
 ['In "Dr. Stone", come si chiama lo scienziato protagonista?','Senku Ishigami',['Taiju Oki','Gen Asagiri','Tsukasa Shishio']],
 ['In "Black Clover", qual è il sogno di Asta?','Diventare Re dei Maghi',['Diventare Hokage','Diventare Re dei pirati','Diventare Hunter']],
 ['In "Fairy Tail", come si chiama il drago che ha cresciuto Natsu?','Igneel',['Acnologia','Grandine','Metalicana']],
 ['In "Kaguya-sama: Love is War", in quale organo scolastico lavorano i protagonisti?','Consiglio studentesco',['Club di giornalismo','Club di teatro','Comitato disciplinare']],
 ['In "Oshi no Ko", come si chiama l\'idol madre dei gemelli?','Ai Hoshino',['Kana Arima','Akane Kurokawa','Mem-cho']],
 ['In "Bocchi the Rock!", quale strumento suona Hitori Goto?','Chitarra',['Batteria','Basso','Tastiera']],
 ['In "Blue Lock", quale sport è al centro della storia?','Calcio',['Basket','Pallavolo','Baseball']],
 ['In "Tokyo Revengers", qual è il potere di Takemichi?','Viaggiare indietro nel tempo',['Leggere nel pensiero','Fermare il tempo','Essere immortale']],
 ['In "Neon Genesis Evangelion", come si chiamano i nemici che attaccano Tokyo-3?','Angeli',['Titani','Hollow','Ghoul']]
];
const sh=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
/* --- memoria per giocatore: anime e domande già viste (evita ripetizioni) --- */
const ls={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const seenA=()=>ls.get('quiz_seen_a',[]),seenB=()=>ls.get('quiz_seen_b',[]);
function remember(qs){const a=seenA(),b=seenB();qs.forEach(x=>{if(x.aid)a.push(x.aid);if(x.bi!=null)b.push(x.bi)});
 ls.set('quiz_seen_a',[...new Set(a.reverse())].reverse().slice(-SEEN_MAX));ls.set('quiz_seen_b',[...new Set(b.reverse())].reverse().slice(-BANK_SEEN_MAX))}
/* --- Jikan con limite di richieste (~2,4/s, sotto il limite di 3/s) e cache 24h per pagina --- */
let qT=0;const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function jget(path,tries=3){const now=Date.now(),at=Math.max(now,qT);qT=at+420;await wait(at-now);
 let r;try{r=await fetch(API_URL+path)}catch(e){if(tries>0){await wait(1200);return jget(path,tries-1)}throw e}if(r.status===429&&tries>0){await wait(1200);return jget(path,tries-1)}if(!r.ok)throw new Error(r.status);return r.json()}
function cget(k){try{const v=JSON.parse(localStorage.getItem(k)||sessionStorage.getItem(k));if(v&&Date.now()-v.t<CACHE_H*36e5)return v.d}catch(e){}return null}
function cset(k,d){const v=JSON.stringify({t:Date.now(),d});try{localStorage.setItem(k,v)}catch(e){try{sessionStorage.setItem(k,v)}catch(e){}}}
const slim=a=>({id:a.mal_id,t:a.title_english||a.title,alt:[a.title,a.title_english,a.title_japanese,...(a.title_synonyms||[])].filter(Boolean).slice(0,6),
 y:a.year||a.aired?.prop?.from?.year||null,st:(a.studios||[]).map(s=>s.name),syn:(a.synopsis||'').slice(0,700),img:a.images?.jpg?.image_url||''});
async function page(p){const k='quiz_p'+p;let L=cget(k);if(L)return L;const j=await jget(`/top/anime?filter=bypopularity&limit=25&page=${p}`);L=j.data.map(slim);cset(k,L);return L}
/* 3 pagine a caso tra le prime 20 (≈500 anime) + sempre una pagina già in cache se c'è */
async function pool(){const ps=sh([...Array(PAGES)].map((_,i)=>i+1)).slice(0,3);let L=[];
 for(const p of ps){try{L=L.concat(await page(p))}catch(e){if(!L.length&&p===ps[ps.length-1])throw e}}
 const seen=new Set(L.map(a=>a.id));for(let p=1;p<=PAGES;p++){const c=cget('quiz_p'+p);if(c)c.forEach(a=>{if(!seen.has(a.id)){seen.add(a.id);L.push(a)}})}
 return L}
async function chars(id){const k='quiz_ch_'+id;let c=cget(k);if(c)return c;const j=await jget(`/anime/${id}/characters`);
 c=j.data.filter(x=>x.role==='Main').slice(0,5).map(x=>{const n=x.character.name;return{n:n.includes(', ')?n.split(', ').reverse().join(' '):n,img:x.character.images?.jpg?.image_url||''}});cset(k,c);return c}
function strip(s,a){let t=s.replace(/\s*\[Written by MAL Rewrite\]\s*/g,'').replace(/\(Source:[^)]*\)/g,'').trim();
 const names=new Set();a.alt.forEach(x=>{names.add(x);x.split(/[:\-–]/).forEach(p=>{p=p.trim();if(p.length>3)names.add(p)})});
 [...names].sort((x,y)=>y.length-x.length).forEach(n=>{t=t.replace(new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'),'____')});
 const m=t.match(/^(.{60,280}?[.!?])(\s|$)/s);return m?m[1]:t.slice(0,260)+'…'}
async function build(){const L=await pool(),out=[],seen=new Set(seenA());
 const fresh=sh(L.filter(a=>!seen.has(a.id))),old=sh(L.filter(a=>seen.has(a.id))),pick=fresh.concat(old); // prima gli anime mai visti
 const studios=[...new Set(L.flatMap(a=>a.st))],used=new Set();
 const titles=a=>sh([a.t,...sh(L.filter(b=>b.t!==a.t).map(b=>b.t)).slice(0,3)]);
 const types=sh(['year','studio','syn','char','img','year','studio','syn','char','img','syn','char','img','year']);
 const cand=()=>pick.find(a=>!used.has(a.id));
 for(const ty of types){if(out.length>=ROUND)break;
  const a=pick.find(a=>!used.has(a.id)&&(ty!=='year'||a.y)&&(ty!=='studio'||a.st.length)&&(ty!=='syn'||a.syn.length>80)&&(ty!=='img'||a.img));if(!a)continue;
  if(ty==='year'){const ds=new Set([a.y]);while(ds.size<4){const d=a.y+(Math.random()<.5?-1:1)*(1+(Math.random()*6|0));if(d<=new Date().getFullYear())ds.add(d)}
   out.push({q:`In che anno è uscito "${a.t}"?`,ok:String(a.y),ch:sh([...ds].map(String)),img:a.img,an:a.t,aid:a.id})}
  else if(ty==='studio'){const o=sh(studios.filter(s=>!a.st.includes(s))).slice(0,3);if(o.length<3)continue;
   out.push({q:`Quale studio ha animato "${a.t}"?`,ok:a.st[0],ch:sh([a.st[0],...o]),img:a.img,an:a.t,aid:a.id})}
  else if(ty==='syn')out.push({q:'A quale anime si riferisce questa trama?',sn:strip(a.syn,a),ok:a.t,ch:titles(a),img:a.img,an:a.t,aid:a.id});
  else if(ty==='img')out.push({q:'Di quale anime è questa locandina?',pic:a.img,ok:a.t,ch:titles(a),an:a.t,aid:a.id});
  else if(ty==='char'){let cs=[];try{cs=await chars(a.id)}catch(e){}if(!cs.length)continue;const c=sh(cs)[0];
   out.push({q:`A quale anime appartiene il personaggio ${c.n}?`,pic:c.img,small:1,ok:a.t,ch:titles(a),img:a.img,an:a.t,aid:a.id})}
  used.add(a.id)}
 return sh(out)}
function fallback(n){const sb=new Set(seenB());let idx=sh(BANK.map((_,i)=>i).filter(i=>!sb.has(i)));if(idx.length<n)idx=idx.concat(sh([...sb].filter(i=>!idx.includes(i))));
 return idx.slice(0,n).map(i=>{const [q,ok,w]=BANK[i];return{q,ok,ch:sh([ok,...w.slice(0,3)]),bi:i}})}
const timeout=(p,ms)=>Promise.race([p,new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),ms))]);
window.__quizTest={BANK,fallback,strip,build,remember};

function make(A){
 const {q,qa,E,stage,msg}=A;
 stage.innerHTML=`<div class="ghud"><span>Domanda <b id="qn">0</b>/${ROUND}</span><span>Punti <b id="sc">0</b></span><span>Record <b id="rec">${+localStorage.quiz_best||0}</b></span><button class="mute" id="mute" aria-label="Audio"></button></div>
 <div class="quiz" id="qz"><div class="qbox"><p class="big" style="font-size:1.6rem">Quiz anime</p><p class="muted">${ROUND} domande, ${PER_Q} secondi ciascuna. Più rispondi in fretta, più bonus prendi.</p></div></div>
 <button class="btn sm" id="go">Gioca</button><p class="gmsg"></p><p class="muted small qsrc">Dati: <a href="https://jikan.moe" target="_blank" rel="noopener">Jikan</a> / MyAnimeList</p>`;
 A.muteBtn(q('#mute'));const z=q('#qz'),still=A.RM();
 let streak=0,Q=[],k=0,score=0,right=0,t0=0,raf=0,lock=false,alive=true,nextT=0,st='idle';
 const SFX={ok:()=>{A.beep(880,.07,0,.05);A.beep(1320,.12,.07,.05)},no:()=>A.beep(200,.25,0,.06,140),tick:()=>A.beep(1200,.02,0,.02),end:()=>[523,659,784,1047].forEach((f,i)=>A.beep(f,.1,i*.1,.05))};
 async function start(){if(!A.user||st==='load')return;A.audio();st='load';q('#go').hidden=true;msg('');z.innerHTML='<div class="qbox"><p class="muted">Preparo le domande…</p><div class="qload"></div></div>';
  let src='api';try{Q=await timeout(build(),12000)}catch(e){Q=[];src='bank'}if(!alive)return;
  if(Q.length<ROUND){if(Q.length===0)src='bank';Q=Q.concat(fallback(ROUND-Q.length))}Q=Q.slice(0,ROUND);remember(Q);streak=0;
  if(src==='bank')msg('Domande di riserva (API non disponibile).');k=0;score=0;right=0;st='run';q('#sc').textContent=0;show()}
 function show(){lock=false;const x=Q[k];q('#qn').textContent=k+1;
  z.innerHTML=`<div class="qbox"><div class="qtime"><i id="qt"></i></div><p class="qq">${E(x.q)}</p>${x.pic?`<img src="${E(x.pic)}" alt="" class="qpic${x.small?' sm':''}">`:''}${x.sn?`<blockquote class="qsyn">${E(x.sn)}</blockquote>`:''}
  <div class="qopts">${x.ch.map((c,i)=>`<button class="qopt" data-i="${i}"><kbd>${i+1}</kbd> ${E(c)}</button>`).join('')}</div><div class="qafter" id="qa"></div></div>`;
  qa('.qopt',z).forEach(b=>b.onclick=()=>answer(+b.dataset.i));t0=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(tick)}
 let lastSec=99;function tick(now){if(lock)return;const left=Math.max(0,PER_Q-(now-t0)/1000),bar=q('#qt');if(bar)bar.style.width=(left/PER_Q*100)+'%';
  const s=Math.ceil(left);if(s<=3&&s!==lastSec&&s>0)SFX.tick();lastSec=s;if(left<=0)return answer(-1);raf=requestAnimationFrame(tick)}
 function answer(i){if(lock||st!=='run')return;lock=true;cancelAnimationFrame(raf);const x=Q[k],left=Math.max(0,PER_Q-(performance.now()-t0)/1000),good=i>=0&&x.ch[i]===x.ok;
  qa('.qopt',z).forEach((b,j)=>{b.disabled=true;if(x.ch[j]===x.ok)b.classList.add('ok');else if(j===i)b.classList.add('no')});
  if(good){right++;streak++;score+=100+Math.round(left/PER_Q*100);SFX.ok();if(streak>1){A.tone('triangle',660*Math.pow(2,Math.min(streak,12)/12),.15,.16,.045);msg('Serie di '+streak+' 🔥')}const s=q('#sc');s.textContent=score;A.pop(s)}else{SFX.no();streak=0;msg('');if(!still){z.classList.remove('shake');void z.offsetWidth;z.classList.add('shake')}}
  q('#qa').innerHTML=`${x.img&&!x.pic?`<img src="${E(x.img)}" alt="" class="qimg">`:''}<span>${good?'Giusto!':(i<0?'Tempo scaduto.':'Sbagliato.')} ${x.an?`<b>${E(x.an)}</b>`:''}</span><button class="btn sm" id="qnext">${k+1<Q.length?'Avanti →':'Risultato'}</button>`;
  q('#qnext').onclick=next;clearTimeout(nextT);nextT=setTimeout(next,good?2200:3200)}
 function next(){clearTimeout(nextT);if(st!=='run')return;if(++k<Q.length)return show();end()}
 function end(){st='done';SFX.end();z.innerHTML=`<div class="qbox"><p class="big">${score}</p><p class="muted">${right}/${Q.length} risposte giuste</p></div>`;
  const g=q('#go');g.textContent='Rigioca';g.hidden=false;
  if(score>(+localStorage.quiz_best||0)){localStorage.quiz_best=score;q('#rec').textContent=score;msg(`Nuovo record! ${score} punti.`)}else msg(`Fine! ${score} punti.`);
  if(score>0)A.save('quiz',score)}
 const kd=e=>{if(A.cur!=='quiz'||st!=='run')return;if(/^[1-4]$/.test(e.key)&&!lock){e.preventDefault();answer(+e.key-1)}else if(e.key==='Enter'&&lock){e.preventDefault();next()}};
 addEventListener('keydown',kd);
 q('#go').onclick=e=>{e.currentTarget.blur();start()};
 return()=>{alive=false;cancelAnimationFrame(raf);clearTimeout(nextT);removeEventListener('keydown',kd);st='idle'}}
(window.GIOCHI_EXTRA=window.GIOCHI_EXTRA||{}).quiz={t:'Quiz anime',d:'10 domande da centinaia di anime (personaggi, anni, studi, trame, locandine), sempre diverse. Rispondi con un tocco o con i tasti 1-4: più sei veloce, più punti fai.',unit:'punti',asc:false,make};
})();
