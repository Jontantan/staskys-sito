/* Staskys — CONFIGURAZIONE PASSAPORTO E DECORAZIONI (update 4: requisiti definitivi) · un solo file da modificare
   ------------------------------------------------------------------------------
   • TEMA: colori, sfondi, banner, cornici, font e sezioni che ognuno può scegliere liberamente.
   • DECORAZIONI SBLOCCABILI: cornici animate, effetti sul nome e sfondi animati (i BADGE sono in badge-config.js).
   Rarità, dalla più comune alla più rara: comune · rara · epica · leggendaria · mitico
   Tipi di requisito (req):
     minigiochi
     {tipo:'punti', valore:N}            almeno N punti nella classifica generale (Wordle, Clicker e Higher or Lower non contano)
     {tipo:'posizione', valore:N}        tra i primi N della classifica generale (1 = primo)
     {tipo:'regno', ore:N}               primo in classifica generale per N ore di fila (contate dal server; resta sbloccato)
     {tipo:'primo', valore:N}            primo posto in almeno N minigiochi
     {tipo:'podi', valore:N}             sul podio in almeno N minigiochi
     {tipo:'streak', valore:N}           streak di almeno N giorni (vale anche la migliore di sempre)
     {tipo:'giochi', valore:N}           aver giocato almeno N minigiochi diversi
     {tipo:'record', gioco:'snake', valore:N}   record in un gioco (reaction e mines: "N o meno")
     {tipo:'notte'}                      una partita salvata tra le 2:00 e le 4:59
     catalogo
     {tipo:'voti', valore:N}             N titoli votati in tutto
     {tipo:'categoria', kind:'anime', valore:N}  N titoli votati in una categoria (anime, game, movie, tv, manga, book)
     {tipo:'categorie', valore:N}        titoli in N categorie diverse (6 = tutte)
     {tipo:'top10', valore:N}            N Top 10 complete
     {tipo:'bassi', valore:N}            N voti sotto il 5        {tipo:'dieci', valore:N}  N voti da 10
     passaporto e sito
     {tipo:'like', valore:N}             N like ricevuti sul passaporto
     {tipo:'giorni', valore:N}           iscritto al sito da almeno N giorni (dal primo accesso)
     {tipo:'entro', data:'2026-12-31'}   primo accesso entro quella data
     {tipo:'badge', valore:N}            N badge sbloccati
     {tipo:'import'}  ha importato una lista     {tipo:'stile'}  ha personalizzato il passaporto
     {tipo:'manuale', ids:['ID Discord',…]}       assegnato a mano
   La scritta corta sotto ogni cosa bloccata si genera dal requisito; per cambiarla aggiungi testo:'…'.
   Le grafiche sono disegni originali (CSS in update4.css + deco-fx.js), non copiati da Discord. */
window.STASKYS_DECO={
 PALETTE:['#ffffff','#ff4d4d','#ff8a3d','#ffc83d','#a3e635','#22c55e','#2dd4bf','#22d3ee','#3b82f6','#8b5cf6','#d946ef','#ff4d8d'],
 SFONDI:{nero:'Nero',grad:'Sfumato',pattern:'Motivo'},
 BANNER:{none:'Nessuno',aurora:'Aurora',sunset:'Tramonto',ocean:'Oceano',sakura:'Sakura',circuit:'Circuito',galaxy:'Galassia',ember:'Brace'},
 CORNICI:{round:'Tonda',ring:'Anello',square:'Squadrata',hex:'Esagono'},
 FONT:{inter:['Classico','Inter',''],serif:['Elegante','Playfair Display','Playfair+Display:wght@700'],pixel:['Pixel','Press Start 2P','Press+Start+2P'],bold:['Potente','Archivo Black','Archivo+Black']},
 SEZIONI:{t10:'Top 10',cats:'Categorie'},
 RARITA:{comune:'Comune',rara:'Rara',epica:'Epica',leggendaria:'Leggendaria',mitico:'Mitico'},
 ORD:{comune:0,rara:1,epica:2,leggendaria:3,mitico:4},
 TIPI:{frame:'Cornici',effect:'Effetti nome',bg:'Sfondi',badge:'Badge'},
 DECO:[
  /* cornici animate dell'avatar */
  {id:'fr_pixel',tipo:'frame',nome:'Pixel',rarita:'comune',req:{tipo:'giochi',valore:3}},
  {id:'fr_sakura',tipo:'frame',nome:'Petali',rarita:'rara',req:{tipo:'voti',valore:30}},
  {id:'fr_neon',tipo:'frame',nome:'Neon',rarita:'rara',req:{tipo:'streak',valore:7}},
  {id:'fr_orbit',tipo:'frame',nome:'Orbita',rarita:'epica',req:{tipo:'like',valore:25}},
  {id:'fr_flame',tipo:'frame',nome:'Fiamma',rarita:'epica',req:{tipo:'streak',valore:30}},
  {id:'fr_crown',tipo:'frame',nome:'Corona',rarita:'leggendaria',req:{tipo:'posizione',valore:1}},
  {id:'fr_king',tipo:'frame',nome:'Re di Staskys',rarita:'mitico',req:{tipo:'regno',ore:30}},
  /* effetti sul nome */
  {id:'fx_glow',tipo:'effect',nome:'Bagliore',rarita:'comune',req:{tipo:'punti',valore:100}},
  {id:'fx_rainbow',tipo:'effect',nome:'Arcobaleno',rarita:'rara',req:{tipo:'podi',valore:3}},
  {id:'fx_gold',tipo:'effect',nome:'Oro',rarita:'epica',req:{tipo:'primo',valore:1}},
  {id:'fx_glitch',tipo:'effect',nome:'Glitch',rarita:'leggendaria',req:{tipo:'punti',valore:500}},
  /* sfondi animati del passaporto */
  {id:'bg_ocean',tipo:'bg',nome:'Oceano profondo',rarita:'comune',req:{tipo:'streak',valore:3}},
  {id:'bg_stars',tipo:'bg',nome:'Notte stellata',rarita:'rara',req:{tipo:'giorni',valore:30}},
  {id:'bg_snow',tipo:'bg',nome:'Neve',rarita:'rara',req:{tipo:'record',gioco:'stack',valore:150}},
  {id:'bg_neon',tipo:'bg',nome:'Città al neon',rarita:'rara',req:{tipo:'record',gioco:'typing',valore:70}},
  {id:'bg_lava',tipo:'bg',nome:'Lava',rarita:'rara',req:{tipo:'record',gioco:'snake',valore:40}},
  {id:'bg_ember',tipo:'bg',nome:'Brace',rarita:'rara',req:{tipo:'record',gioco:'quiz',valore:1750}},
  {id:'bg_petals',tipo:'bg',nome:'Pioggia di petali',rarita:'epica',req:{tipo:'categorie',valore:6}},
  {id:'bg_galaxy',tipo:'bg',nome:'Galassia',rarita:'epica',req:{tipo:'record',gioco:'flappy',valore:30}},
  {id:'bg_storm',tipo:'bg',nome:'Tempesta',rarita:'epica',req:{tipo:'record',gioco:'2048',valore:2500}},
  {id:'bg_autumn',tipo:'bg',nome:'Autunno',rarita:'epica',req:{tipo:'record',gioco:'suika',valore:30000}},
  {id:'bg_retro',tipo:'bg',nome:'Retrowave',rarita:'epica',req:{tipo:'record',gioco:'dino',valore:12500}},
  {id:'bg_code',tipo:'bg',nome:'Codice',rarita:'epica',req:{tipo:'record',gioco:'tetris',valore:8000}},
  {id:'bg_fireworks',tipo:'bg',nome:'Fuochi d\'artificio',rarita:'epica',req:{tipo:'record',gioco:'breakout',valore:2500}},
  {id:'bg_zen',tipo:'bg',nome:'Giardino giapponese',rarita:'leggendaria',req:{tipo:'record',gioco:'mines',valore:300}},
  {id:'bg_lightning',tipo:'bg',nome:'Lampo',rarita:'leggendaria',req:{tipo:'record',gioco:'reaction',valore:180}},
  {id:'bg_aurora',tipo:'bg',nome:'Aurora boreale',rarita:'leggendaria',req:{tipo:'badge',valore:10}}
  /* i BADGE stanno in badge-config.js: vengono aggiunti qui sotto in automatico */
 ],
 MAX_BADGE:3
};
/* controllo sblocchi e progressi (stats = dati di un membro, vedi profilo.js / classifica.js) */
(function(D){
 const ASC=new Set(['reaction','mines','wordle']);
 const B=window.STASKYS_BADGES;
 if(B&&Array.isArray(B.LISTA))B.LISTA.forEach(b=>D.DECO.push({punti:(B.PUNTI||{})[b.rarita]||0,...b,tipo:'badge'}));
 D.byId=Object.fromEntries(D.DECO.map(d=>[d.id,d]));
 /* ordina per rarità crescente (comune → mitico), a parità lascia l'ordine del file */
 D.sortR=L=>L.map((d,i)=>[d,i]).sort((a,b)=>(D.ORD[a[0].rarita]||0)-(D.ORD[b[0].rarita]||0)||a[1]-b[1]).map(x=>x[0]);
 const GN={snake:['Snake','mele'],typing:['Battitura','punti'],quiz:['Quiz anime','punti'],flappy:['Flappy','tubi'],2048:['2048','punti'],suika:['Suika','punti'],dino:['Dino runner','punti'],stack:['Stack','punti'],tetris:['Tetris','punti'],breakout:['Breakout','mattoncini'],mines:['Prato fiorito','s'],reaction:['Riflessi','ms'],wordle:['Wordle','tentativi']};
 const KN={anime:'anime',game:'giochi',movie:'film',tv:'serie',manga:'manga',book:'libri'};
 const n=v=>Number(v).toLocaleString('it-IT');
 D.GN=GN;
 /* scritta corta: cosa fare per sbloccarla */
 D.reqText=(r,d)=>{if(d&&d.testo)return d.testo;r=r||{};const v=r.valore;switch(r.tipo){
  case'punti':return`${n(v)} punti in classifica`;case'posizione':return v>1?`Top ${v} classifica generale`:'Primo in classifica generale';case'regno':return`Primo in classifica generale per ${r.ore} ore di fila`;
  case'primo':return v>1?`Primo in ${v} minigiochi`:'Primo in un minigioco';case'podi':return`Podio in ${v} minigiochi`;
  case'streak':return`Streak di ${v} giorni`;case'giochi':return`Gioca ${v} minigiochi diversi`;case'notte':return'Gioca tra le 2 e le 5 di notte';
  case'record':{const g=GN[r.gioco]||[r.gioco,''];if(r.gioco==='mines')return`Vinci a ${g[0]} in ${v%60?n(v)+' s':v/60+' minuti'} o meno`;if(r.gioco==='reaction')return`Media di ${v} ms o meno a Riflessi`;return`${n(v)} ${g[1]} a ${g[0]}`}
  case'voti':return`Vota ${n(v)} titoli`;case'categoria':return`Vota ${n(v)} ${KN[r.kind]||r.kind}`;case'categorie':return v>=6?'Titoli in tutte le 6 categorie':`Titoli in ${v} categorie`;
  case'top10':return v>1?`Completa ${v} Top 10`:'Completa una Top 10';case'bassi':return`${n(v)} voti sotto il 5`;case'dieci':return`${n(v)} voti da 10`;
  case'like':return`${n(v)} like al passaporto`;case'giorni':return`Iscritto da ${v} giorni`;case'entro':return`Primo accesso entro il ${r.data.split('-').reverse().join('/')}`;
  case'badge':return`Sblocca ${v} badge`;case'import':return'Importa la tua lista nel catalogo';case'stile':return'Personalizza il passaporto';case'manuale':return'Assegnato dallo staff';default:return'Requisito da definire'}};
 const days=s=>s.firstAt?Math.floor((Date.now()-new Date(s.firstAt))/864e5):0;
 /* progresso: {cur,max,asc} (asc = più basso è meglio) oppure null se è sì/no */
 D.prog=(d,s)=>{const r=d.req||{},c=s&&s.cat||{},v=r.valore;s=s||{};switch(r.tipo){
  case'punti':return{cur:s.points||0,max:v};case'primo':return{cur:s.firsts||0,max:v};case'podi':return{cur:s.podiums||0,max:v};
  case'streak':return{cur:Math.max(s.streak||0,s.bestStreak||0),max:v};case'giochi':return{cur:(s.rec||[]).length,max:v};
  case'record':{const b=s.best&&s.best[r.gioco];return{cur:b==null?null:b,max:v,asc:ASC.has(r.gioco)}}
  case'posizione':return{cur:s.points>0&&s.pos?s.pos:null,max:v,asc:true};
  case'regno':return{cur:Math.floor(s.kingHours||0),max:r.ore,regno:true};
  case'voti':return{cur:c.voti||0,max:v};case'categoria':return{cur:(c.rated||{})[r.kind]||0,max:v};case'categorie':return{cur:c.cats||0,max:v};case'top10':return{cur:c.top10||0,max:v};
  case'bassi':return{cur:c.low||0,max:v};case'dieci':return{cur:c.tens||0,max:v};case'like':return{cur:s.likes||0,max:v};case'giorni':return{cur:days(s),max:v};case'badge':return{cur:s.nBadges||0,max:v};
  default:return null}};
 D.has=(d,s)=>{if(!s)return false;const r=d.req||{};
  switch(r.tipo){case'notte':return!!s.night;case'import':return!!s.imported;case'stile':return!!s.styled;case'manuale':return(r.ids||[]).includes(String(s.did||''));
   case'entro':return!!s.firstAt&&String(s.firstAt).slice(0,10)<=r.data;case'posizione':return!!s.pos&&s.pos<=r.valore&&s.points>0}
  const p=D.prog(d,s);if(!p||p.cur==null)return false;return p.asc?p.cur<=p.max:p.cur>=p.max};
 /* punti badge = somma dei punti dei badge sbloccati */
 D.badgePoints=unl=>unl.reduce((a,id)=>a+(D.byId[id]&&D.byId[id].tipo==='badge'?+D.byId[id].punti||0:0),0);
 /* prima i badge (servono per "Sblocca N badge"), poi il resto */
 D.unlocked=s=>{if(!s)return[];const bad=D.DECO.filter(d=>d.tipo==='badge'&&d.req.tipo!=='badge'&&D.has(d,s));s.nBadges=bad.length;return D.DECO.filter(d=>D.has(d,s)).map(d=>d.id)};
})(window.STASKYS_DECO);
