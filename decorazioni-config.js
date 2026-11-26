/* Staskys — CONFIGURAZIONE PASSAPORTO E DECORAZIONI (un solo file da modificare)
   ------------------------------------------------------------------------------
   • TEMA: colori, sfondi, banner, cornici, font e sezioni che ognuno può scegliere liberamente.
   • DECORAZIONI SBLOCCABILI: si ottengono con i minigiochi. I requisiti qui sotto sono
     ESEMPI PROVVISORI (provvisorio:true): Jonathan dirà quelli veri, basta cambiare i numeri.
   Tipi di requisito (req):
     {tipo:'punti', valore:N}            → almeno N punti totali
     {tipo:'primo', valore:N}            → primo posto in almeno N minigiochi
     {tipo:'podi', valore:N}             → nei primi 3 in almeno N minigiochi
     {tipo:'streak', valore:N}           → streak di almeno N giorni
     {tipo:'giochi', valore:N}           → aver giocato almeno N minigiochi diversi
     {tipo:'record', gioco:'snake', valore:N} → record in un gioco (per reaction/mines/wordle vale "N o meno")
     {tipo:'posizione', valore:N}        → essere tra i primi N della classifica punti
   Rarità: comune · rara · epica · leggendaria
   Le grafiche sono disegni originali (CSS), ispirati allo stile delle decorazioni di Discord ma non copiati. */
window.STASKYS_DECO={
 PALETTE:['#ffffff','#ff4d4d','#ff8a3d','#ffc83d','#a3e635','#22c55e','#2dd4bf','#22d3ee','#3b82f6','#8b5cf6','#d946ef','#ff4d8d'],
 SFONDI:{nero:'Nero',grad:'Sfumato',pattern:'Motivo'},
 BANNER:{none:'Nessuno',aurora:'Aurora',sunset:'Tramonto',ocean:'Oceano',sakura:'Sakura',circuit:'Circuito',galaxy:'Galassia',ember:'Brace'},
 CORNICI:{round:'Tonda',ring:'Anello',square:'Squadrata',hex:'Esagono'},
 FONT:{inter:['Classico','Inter',''],serif:['Elegante','Playfair Display','Playfair+Display:wght@700'],pixel:['Pixel','Press Start 2P','Press+Start+2P'],bold:['Potente','Archivo Black','Archivo+Black']},
 SEZIONI:{t10:'Top 10',cats:'Categorie',awards:'I miei Awards'}, /* ordine sotto il passaporto; "Le mie stelle" si può nascondere */
 RARITA:{comune:'Comune',rara:'Rara',epica:'Epica',leggendaria:'Leggendaria'},
 TIPI:{frame:'Cornici animate',effect:'Effetti nome',bg:'Sfondi',badge:'Badge'},
 DECO:[
  /* cornici animate dell'avatar */
  {id:'fr_pixel',tipo:'frame',nome:'Pixel',rarita:'comune',req:{tipo:'giochi',valore:1},provvisorio:true},
  {id:'fr_sakura',tipo:'frame',nome:'Petali',rarita:'rara',req:{tipo:'punti',valore:150},provvisorio:true},
  {id:'fr_neon',tipo:'frame',nome:'Neon',rarita:'rara',req:{tipo:'streak',valore:7},provvisorio:true},
  {id:'fr_orbit',tipo:'frame',nome:'Orbita',rarita:'epica',req:{tipo:'giochi',valore:5},provvisorio:true},
  {id:'fr_flame',tipo:'frame',nome:'Fiamma',rarita:'epica',req:{tipo:'record',gioco:'snake',valore:40},provvisorio:true},
  {id:'fr_crown',tipo:'frame',nome:'Corona',rarita:'leggendaria',req:{tipo:'posizione',valore:1},provvisorio:true},
  /* effetti sul nome */
  {id:'fx_glow',tipo:'effect',nome:'Bagliore',rarita:'comune',req:{tipo:'punti',valore:50},provvisorio:true},
  {id:'fx_rainbow',tipo:'effect',nome:'Arcobaleno',rarita:'rara',req:{tipo:'podi',valore:2},provvisorio:true},
  {id:'fx_gold',tipo:'effect',nome:'Oro',rarita:'epica',req:{tipo:'primo',valore:1},provvisorio:true},
  {id:'fx_glitch',tipo:'effect',nome:'Glitch',rarita:'leggendaria',req:{tipo:'punti',valore:400},provvisorio:true},
  /* sfondi animati del passaporto */
  {id:'bg_stars',tipo:'bg',nome:'Notte stellata',rarita:'rara',req:{tipo:'streak',valore:3},provvisorio:true},
  {id:'bg_petals',tipo:'bg',nome:'Pioggia di petali',rarita:'epica',req:{tipo:'record',gioco:'wordle',valore:3},provvisorio:true},
  {id:'bg_aurora',tipo:'bg',nome:'Aurora boreale',rarita:'leggendaria',req:{tipo:'primo',valore:3},provvisorio:true},
  /* badge accanto al nome (se ne possono mettere fino a 3) */
  {id:'b_first',tipo:'badge',nome:'Re di un gioco',icona:'👑',rarita:'epica',req:{tipo:'primo',valore:1},provvisorio:true},
  {id:'b_streak7',tipo:'badge',nome:'Costante',icona:'🔥',rarita:'rara',req:{tipo:'streak',valore:7},provvisorio:true},
  {id:'b_games5',tipo:'badge',nome:'Tuttofare',icona:'🎮',rarita:'comune',req:{tipo:'giochi',valore:5},provvisorio:true},
  {id:'b_podium3',tipo:'badge',nome:'Da podio',icona:'🏅',rarita:'rara',req:{tipo:'podi',valore:3},provvisorio:true},
  {id:'b_points500',tipo:'badge',nome:'Collezionista',icona:'💎',rarita:'epica',req:{tipo:'punti',valore:300},provvisorio:true},
  {id:'b_top3',tipo:'badge',nome:'Leggenda',icona:'⭐',rarita:'leggendaria',req:{tipo:'posizione',valore:3},provvisorio:true}
 ],
 MAX_BADGE:3
};
/* controllo sblocchi (stats = dati minigiochi di un membro) */
(function(D){
 const ASC=new Set(['reaction','mines','wordle']);
 D.byId=Object.fromEntries(D.DECO.map(d=>[d.id,d]));
 D.reqText=r=>({punti:`Raggiungi ${r.valore} punti`,primo:r.valore>1?`Primo posto in ${r.valore} minigiochi`:'Primo posto in un minigioco',podi:`Sul podio in ${r.valore} minigiochi`,streak:`Streak di ${r.valore} giorni`,giochi:r.valore>1?`Gioca ${r.valore} minigiochi diversi`:'Gioca un minigioco',
  record:`Record di ${r.valore}${ASC.has(r.gioco)?' o meno':''} a ${({snake:'Snake',wordle:'Wordle',tetris:'Tetris',flappy:'Flappy',reaction:'Tempo di reazione (ms)',mines:'Prato fiorito (s)'})[r.gioco]||r.gioco}`,posizione:r.valore>1?`Entra nei primi ${r.valore} della classifica punti`:'Primo nella classifica punti'})[r.tipo]||'Requisito da definire';
 D.has=(d,s)=>{if(!s)return false;const r=d.req||{};switch(r.tipo){case'punti':return s.points>=r.valore;case'primo':return s.firsts>=r.valore;case'podi':return s.podiums>=r.valore;case'streak':return Math.max(s.streak||0,s.bestStreak||0)>=r.valore;
  case'giochi':return s.rec.length>=r.valore;case'record':{const v=s.best&&s.best[r.gioco];return v!=null&&(ASC.has(r.gioco)?v<=r.valore:v>=r.valore)}case'posizione':return!!s.pos&&s.pos<=r.valore&&s.points>0;default:return false}};
 D.unlocked=s=>D.DECO.filter(d=>D.has(d,s)).map(d=>d.id);
})(window.STASKYS_DECO);
