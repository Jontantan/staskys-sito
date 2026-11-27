/* Staskys — CONFIGURAZIONE BADGE (update 4: requisiti definitivi decisi da Jonathan) · un solo file da modificare
   ------------------------------------------------------------------------------
   Per cambiare un badge basta modificare nome, icona, rarità o il requisito; per toglierne uno cancella la riga.
   (Non cambiare gli id dei badge già esistenti: chi li ha messi sul passaporto li perderebbe.)

   Ogni badge:
     id      codice unico (b_…)        nome   nome mostrato        icona  emoji
     rarita  comune · rara · epica · leggendaria · mitico   (i "punti badge" dipendono dalla rarità, vedi PUNTI)
     oro     true = versione d'ORO di un badge (bordo dorato e luccichio)
     req     come si sblocca (tipi possibili in decorazioni-config.js, in alto)
   La scritta corta sotto ogni badge bloccato si genera da sola dal requisito; per cambiarla aggiungi testo:'…'. */
window.STASKYS_BADGES={
 PUNTI:{comune:5,rara:15,epica:30,leggendaria:60,mitico:120},
 LISTA:[
  /* classifica generale (punti dei minigiochi) */
  {id:'b_king',nome:'Re di Staskys',icona:'🫅',rarita:'mitico',req:{tipo:'posizione',valore:1}},
  {id:'b_top3',nome:'Podio',icona:'🏆',rarita:'epica',req:{tipo:'posizione',valore:3}},
  {id:'b_climber',nome:'Scalatore',icona:'🧗',rarita:'rara',req:{tipo:'posizione',valore:10}},
  /* minigiochi */
  {id:'b_games5',nome:'Tuttofare',icona:'🎮',rarita:'comune',req:{tipo:'giochi',valore:5}},
  {id:'b_podium3',nome:'Medagliere',icona:'🏅',rarita:'rara',req:{tipo:'podi',valore:3}},
  {id:'b_first',nome:'Re di un gioco',icona:'👑',rarita:'epica',req:{tipo:'primo',valore:1}},
  {id:'b_points500',nome:'Collezionista',icona:'💎',rarita:'epica',req:{tipo:'punti',valore:750}},
  {id:'b_streak7',nome:'In fiamme',icona:'🔥',rarita:'rara',req:{tipo:'streak',valore:14}},
  {id:'b_night',nome:'Nottambulo',icona:'🦉',rarita:'rara',req:{tipo:'notte'}},
  /* catalogo */
  {id:'b_voti10',nome:'Primi passi',icona:'✍️',rarita:'comune',req:{tipo:'voti',valore:10}},
  {id:'b_top10',nome:'Classifica perfetta',icona:'🔟',rarita:'comune',req:{tipo:'top10',valore:1}},
  {id:'b_voti100',nome:'Giudice',icona:'⚖️',rarita:'epica',req:{tipo:'voti',valore:100}},
  {id:'b_onnivoro',nome:'Onnivoro',icona:'🌈',rarita:'epica',req:{tipo:'categorie',valore:6}},
  {id:'b_harsh',nome:'Critico spietato',icona:'🗡️',rarita:'rara',req:{tipo:'bassi',valore:30}},
  {id:'b_harsh_oro',nome:'Critico spietato · Oro',icona:'🗡️',rarita:'leggendaria',oro:true,req:{tipo:'bassi',valore:100}},
  {id:'b_heart',nome:'Cuore d\'oro',icona:'💛',rarita:'rara',req:{tipo:'dieci',valore:30}},
  {id:'b_heart_oro',nome:'Cuore d\'oro · Oro',icona:'💛',rarita:'leggendaria',oro:true,req:{tipo:'dieci',valore:100}},
  {id:'b_lettore',nome:'Topo di biblioteca',icona:'📖',rarita:'rara',req:{tipo:'categoria',kind:'book',valore:20}},
  {id:'b_lettore_oro',nome:'Topo di biblioteca · Oro',icona:'📖',rarita:'leggendaria',oro:true,req:{tipo:'categoria',kind:'book',valore:100}},
  {id:'b_serie',nome:'Maratoneta',icona:'📺',rarita:'rara',req:{tipo:'categoria',kind:'tv',valore:20}},
  {id:'b_serie_oro',nome:'Maratoneta · Oro',icona:'📺',rarita:'leggendaria',oro:true,req:{tipo:'categoria',kind:'tv',valore:100}},
  {id:'b_cinefilo',nome:'Cinefilo',icona:'🎬',rarita:'rara',req:{tipo:'categoria',kind:'movie',valore:40}},
  {id:'b_cinefilo_oro',nome:'Cinefilo · Oro',icona:'🎬',rarita:'leggendaria',oro:true,req:{tipo:'categoria',kind:'movie',valore:100}},
  {id:'b_gamer',nome:'Gamer',icona:'🕹️',rarita:'rara',req:{tipo:'categoria',kind:'game',valore:35}},
  {id:'b_gamer_oro',nome:'Gamer · Oro',icona:'🕹️',rarita:'leggendaria',oro:true,req:{tipo:'categoria',kind:'game',valore:100}},
  {id:'b_otaku',nome:'Otaku',icona:'🎌',rarita:'epica',req:{tipo:'categoria',kind:'anime',valore:80}},
  {id:'b_otaku_oro',nome:'Otaku · Oro',icona:'🎌',rarita:'leggendaria',oro:true,req:{tipo:'categoria',kind:'anime',valore:150}},
  /* passaporto e sito */
  {id:'b_like10',nome:'Apprezzato',icona:'👍',rarita:'comune',req:{tipo:'like',valore:10}},
  {id:'b_like50',nome:'Popolare',icona:'❤️',rarita:'epica',req:{tipo:'like',valore:50}},
  {id:'b_like100',nome:'Influencer',icona:'🌟',rarita:'leggendaria',req:{tipo:'like',valore:100}},
  {id:'b_pioneer',nome:'Pioniere',icona:'🚩',rarita:'rara',req:{tipo:'entro',data:'2026-12-31'}},
  {id:'b_move',nome:'Traslocato',icona:'📦',rarita:'comune',req:{tipo:'import'}},
  {id:'b_style',nome:'Stilista',icona:'🎨',rarita:'comune',req:{tipo:'stile'}},
  /* assegnato a mano: aggiungi l'ID Discord nella lista ids */
  {id:'b_staff',nome:'Staff',icona:'🛡️',rarita:'epica',req:{tipo:'manuale',ids:['760448374196404236']},testo:'Solo per lo staff di Staskys'}
 ]
};
