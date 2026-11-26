/* Staskys — CONFIGURAZIONE BADGE (update 3) · un solo file da modificare
   ------------------------------------------------------------------------------
   ⚠️ TUTTI I BADGE QUI SOTTO SONO ESEMPI PROVVISORI (provvisorio:true): Jonathan dirà quelli veri.
   Per cambiarli basta modificare nome, icona, punti o il requisito; per toglierne uno cancella la riga.
   (Non cambiare gli id dei badge già esistenti: chi li ha messi sul passaporto li perderebbe.)

   Ogni badge:
     id        codice unico (b_…)          nome   nome mostrato        icona  emoji
     rarita    comune · rara · epica · leggendaria
     punti     quanti "punti badge" vale (servono per la classifica Badge)
     req       come si sblocca (sotto i tipi possibili)
   Tipi di requisito — minigiochi:
     {tipo:'punti', valore:N}   almeno N punti      {tipo:'primo', valore:N}  primo in N minigiochi
     {tipo:'podi', valore:N}    sul podio in N      {tipo:'streak', valore:N} streak di N giorni
     {tipo:'giochi', valore:N}  N minigiochi diversi {tipo:'posizione', valore:N} tra i primi N della classifica punti
     {tipo:'record', gioco:'snake', valore:N}  record in un gioco
   Tipi di requisito — catalogo:
     {tipo:'voti', valore:N}                     almeno N titoli votati (tutte le categorie)
     {tipo:'categoria', kind:'anime', valore:N}  almeno N titoli votati/segnati in una categoria (anime, game, movie, tv, manga, book)
     {tipo:'categorie', valore:N}                titoli in almeno N categorie diverse
     {tipo:'top10', valore:N}                    almeno N Top 10 complete (10 titoli) */
window.STASKYS_BADGES={
 PROVVISORI:true,
 LISTA:[
  /* minigiochi (gli stessi di prima, ora con i punti badge) */
  {id:'b_first',nome:'Re di un gioco',icona:'👑',rarita:'epica',punti:30,req:{tipo:'primo',valore:1},provvisorio:true},
  {id:'b_streak7',nome:'Costante',icona:'🔥',rarita:'rara',punti:20,req:{tipo:'streak',valore:7},provvisorio:true},
  {id:'b_games5',nome:'Tuttofare',icona:'🎮',rarita:'comune',punti:10,req:{tipo:'giochi',valore:5},provvisorio:true},
  {id:'b_podium3',nome:'Da podio',icona:'🏅',rarita:'rara',punti:20,req:{tipo:'podi',valore:3},provvisorio:true},
  {id:'b_points500',nome:'Collezionista',icona:'💎',rarita:'epica',punti:30,req:{tipo:'punti',valore:300},provvisorio:true},
  {id:'b_top3',nome:'Leggenda',icona:'⭐',rarita:'leggendaria',punti:50,req:{tipo:'posizione',valore:3},provvisorio:true},
  /* catalogo (nuovi) */
  {id:'b_voti10',nome:'Primi passi',icona:'✍️',rarita:'comune',punti:5,req:{tipo:'voti',valore:10},provvisorio:true},
  {id:'b_voti100',nome:'Critico',icona:'🧐',rarita:'epica',punti:30,req:{tipo:'voti',valore:100},provvisorio:true},
  {id:'b_otaku',nome:'Otaku',icona:'🎌',rarita:'rara',punti:15,req:{tipo:'categoria',kind:'anime',valore:50},provvisorio:true},
  {id:'b_cinefilo',nome:'Cinefilo',icona:'🎬',rarita:'rara',punti:15,req:{tipo:'categoria',kind:'movie',valore:50},provvisorio:true},
  {id:'b_lettore',nome:'Topo di biblioteca',icona:'📖',rarita:'rara',punti:15,req:{tipo:'categoria',kind:'book',valore:20},provvisorio:true},
  {id:'b_onnivoro',nome:'Onnivoro',icona:'🌈',rarita:'epica',punti:25,req:{tipo:'categorie',valore:5},provvisorio:true},
  {id:'b_top10',nome:'Classifica perfetta',icona:'🔟',rarita:'comune',punti:10,req:{tipo:'top10',valore:1},provvisorio:true}
 ]
};
