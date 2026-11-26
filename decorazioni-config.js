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
   COME FISSARE I REQUISITI DEFINITIVI: cambia solo "valore" (o il tipo) nella riga della decorazione
   e togli provvisorio:true. I BADGE (con requisiti anche dal catalogo) sono in badge-config.js.
   Rarità: comune · rara · epica · leggendaria
   Le grafiche sono disegni originali (CSS), ispirati allo stile delle decorazioni di Discord ma non copiati. */
window.STASKYS_DECO={
 PALETTE:['#ffffff','#ff4d4d','#ff8a3d','#ffc83d','#a3e635','#22c55e','#2dd4bf','#22d3ee','#3b82f6','#8b5cf6','#d946ef','#ff4d8d'],
 SFONDI:{nero:'Nero',grad:'Sfumato',pattern:'Motivo'},
 BANNER:{none:'Nessuno',aurora:'Aurora',sunset:'Tramonto',ocean:'Oceano',sakura:'Sakura',circuit:'Circuito',galaxy:'Galassia',ember:'Brace'},
 CORNICI:{round:'Tonda',ring:'Anello',square:'Squadrata',hex:'Esagono'},
 FONT:{inter:['Classico','Inter',''],serif:['Elegante','Playfair Display','Playfair+Display:wght@700'],pixel:['Pixel','Press Start 2P','Press+Start+2P'],bold:['Potente','Archivo Black','Archivo+Black']},
 SEZIONI:{t10:'Top 10',cats:'Categorie'}, /* Awards: rimessi nel terzo update (aggiungere awards:'I miei Awards') */ /* ordine sotto il passaporto; "Le mie stelle" si può nascondere */
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
  /* i BADGE ora stanno in badge-config.js (update 3): vengono aggiunti qui sotto in automatico */
 ],
 MAX_BADGE:3
};
/* controllo sblocchi (stats = dati minigiochi di un membro) */
(function(D){
 const ASC=new Set(['reaction','mines','wordle']);
 /* badge da badge-config.js (se il file manca restano solo cornici, effetti e sfondi) */
 const B=window.STASKYS_BADGES;if(B&&Array.isArray(B.LISTA))B.LISTA.forEach(b=>D.DECO.push({...b,tipo:'badge'}));
 D.byId=Object.fromEntries(D.DECO.map(d=>[d.id,d]));
 D.reqText=r=>({punti:`Raggiungi ${r.valore} punti`,primo:r.valore>1?`Primo posto in ${r.valore} minigiochi`:'Primo posto in un minigioco',podi:`Sul podio in ${r.valore} minigiochi`,streak:`Streak di ${r.valore} giorni`,giochi:r.valore>1?`Gioca ${r.valore} minigiochi diversi`:'Gioca un minigioco',
  record:`Record di ${r.valore}${ASC.has(r.gioco)?' o meno':''} a ${({snake:'Snake',wordle:'Wordle',tetris:'Tetris',flappy:'Flappy',reaction:'Tempo di reazione (ms)',mines:'Prato fiorito (s)'})[r.gioco]||r.gioco}`,posizione:r.valore>1?`Entra nei primi ${r.valore} della classifica punti`:'Primo nella classifica punti',
  voti:`Vota ${r.valore} titoli nel catalogo`,categoria:`${r.valore} ${({anime:'anime',game:'giochi',movie:'film',tv:'serie',manga:'manga',book:'libri'})[r.kind]||r.kind} nel catalogo`,categorie:`Titoli in ${r.valore} categorie diverse del catalogo`,top10:r.valore>1?`Completa ${r.valore} Top 10`:'Completa una Top 10 (10 titoli)'})[r.tipo]||'Requisito da definire';
 D.has=(d,s)=>{if(!s)return false;const r=d.req||{};switch(r.tipo){case'punti':return s.points>=r.valore;case'primo':return s.firsts>=r.valore;case'podi':return s.podiums>=r.valore;case'streak':return Math.max(s.streak||0,s.bestStreak||0)>=r.valore;
  case'giochi':return s.rec.length>=r.valore;case'record':{const v=s.best&&s.best[r.gioco];return v!=null&&(ASC.has(r.gioco)?v<=r.valore:v>=r.valore)}case'posizione':return!!s.pos&&s.pos<=r.valore&&s.points>0;
  /* catalogo: s.cat = {voti, kind:{anime:N…}, cats, top10} (vedi STASKYS_SOCIAL.catStats) */
  case'voti':return!!s.cat&&s.cat.voti>=r.valore;case'categoria':return!!s.cat&&(s.cat.kind[r.kind]||0)>=r.valore;case'categorie':return!!s.cat&&s.cat.cats>=r.valore;case'top10':return!!s.cat&&s.cat.top10>=r.valore;default:return false}};
 /* punti badge = somma dei punti dei badge sbloccati */
 D.badgePoints=unl=>unl.reduce((a,id)=>a+(D.byId[id]&&D.byId[id].tipo==='badge'?+D.byId[id].punti||0:0),0);
 D.unlocked=s=>D.DECO.filter(d=>D.has(d,s)).map(d=>d.id);
})(window.STASKYS_DECO);
