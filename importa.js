/* Staskys — UPDATE 3: importa la tua lista da altri siti nel catalogo.
   Anime e manga: AniList, MyAnimeList (file XML o nome utente), Kitsu · Film e serie: Letterboxd, IMDb, Trakt
   Giochi: MyGameList (file xlsx/csv) · Libri: Goodreads, The StoryGraph (file CSV).
   Prima di salvare si vede SEMPRE un'anteprima dei titoli trovati. Niente Steam, niente scraping.
   Film/serie/giochi si abbinano con la funzione super-endpoint (v3): finché non è pubblicata compare "In arrivo tra poco ⏳". */
(function(){
const A=window.STASKYS,E=A.E,q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const CFG=window.GIOCHI_CONFIG||{},HDR=A.LOCAL?{}:{apikey:CFG.SUPABASE_ANON_KEY,Authorization:'Bearer '+CFG.SUPABASE_ANON_KEY};
const ST=['visto','in_corso','droppato','voglio'];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const r10=v=>v==null||isNaN(v)?null:Math.round(Math.max(0,Math.min(10,v))*10)/10;
const yr=v=>{const n=parseInt(String(v||'').slice(0,4),10);return n>1000&&n<3000?n:null};
const https=u=>/^https:\/\//.test(u||'')?u:null;

/* ---------- fonti ---------- */
const SRC=[
 {id:'anilist',nome:'AniList',kinds:['anime','manga'],what:'Anime e manga',how:'Scrivi il tuo nome utente AniList (la lista deve essere pubblica).',user:true},
 {id:'mal',nome:'MyAnimeList',kinds:['anime','manga'],what:'Anime e manga',how:'Su MyAnimeList apri <a href="https://myanimelist.net/panel.php?go=export" target="_blank" rel="noopener">Export</a>, scarica la lista anime (o manga) e carica qui il file <b>.xml.gz</b> o <b>.xml</b>.',file:'.xml,.gz,application/gzip,text/xml'},
 {id:'kitsu',nome:'Kitsu',kinds:['anime','manga'],what:'Anime e manga',how:'Scrivi il tuo nome utente Kitsu (quello che compare nell\'indirizzo del tuo profilo).',user:true},
 {id:'letterboxd',nome:'Letterboxd',kinds:['movie'],what:'Film',how:'Su Letterboxd vai in <a href="https://letterboxd.com/settings/data/" target="_blank" rel="noopener">Settings → Data → Export your data</a> e carica qui lo <b>.zip</b> (oppure solo <b>ratings.csv</b>). Le stelle diventano voti su 10 (★★★★ = 8); i film visti senza stelle entrano come “Visto” senza voto.',file:'.zip,.csv',need:'v'},
 {id:'imdb',nome:'IMDb',kinds:['movie','tv'],what:'Film e serie',how:'Su IMDb apri <a href="https://www.imdb.com/list/ratings" target="_blank" rel="noopener">I tuoi voti</a>, menu ⋯ → <b>Export</b>, e carica qui il file <b>.csv</b>. Funziona anche la watchlist.',file:'.csv',need:'v'},
 {id:'trakt',nome:'Trakt',kinds:['movie','tv'],what:'Film e serie',how:'Scrivi il tuo nome utente Trakt (il profilo deve essere pubblico).',user:true,need:'trakt'},
 {id:'mgl',nome:'MyGameList',kinds:['game'],what:'Giochi',how:'Nell\'app MyGameList usa <b>Esporta</b> (Impostazioni → Backup/Export) e carica qui il file <b>.xlsx</b> o <b>.csv</b>. Prendo nome, stato (giocando / finito / droppato / da giocare) e voto.',file:'.xlsx,.xls,.csv',need:'v'},
 {id:'goodreads',nome:'Goodreads',kinds:['book'],what:'Libri',how:'Su Goodreads apri <a href="https://www.goodreads.com/review/import" target="_blank" rel="noopener">Import and export</a> → <b>Export Library</b> e carica qui il file <b>.csv</b>.',file:'.csv'},
 {id:'storygraph',nome:'The StoryGraph',kinds:['book'],what:'Libri',how:'Su The StoryGraph apri <a href="https://app.thestorygraph.com/user-export" target="_blank" rel="noopener">Manage account → Export StoryGraph library</a> e carica qui il file <b>.csv</b>.',file:'.csv'}];

/* ---------- strumenti: CSV, ZIP, GZIP ---------- */
function csv(text){text=String(text||'').replace(/^\uFEFF/,'');const rows=[];let row=[],f='',i=0,inq=false;
 for(;i<text.length;i++){const c=text[i];
  if(inq){if(c==='"'){if(text[i+1]==='"'){f+='"';i++}else inq=false}else f+=c}
  else if(c==='"')inq=true;else if(c===','){row.push(f);f=''}else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(f);f='';if(row.length>1||row[0]!=='')rows.push(row);row=[]}else f+=c}
 if(f!==''||row.length){row.push(f);rows.push(row)}
 const H=(rows.shift()||[]).map(h=>h.trim());return rows.map(r=>Object.fromEntries(H.map((h,j)=>[h,(r[j]??'').trim()])))}
async function unzip(buf){const d=new DataView(buf),u8=new Uint8Array(buf);let e=-1;
 for(let i=u8.length-22;i>=Math.max(0,u8.length-66000);i--)if(d.getUint32(i,true)===0x06054b50){e=i;break}
 if(e<0)throw new Error('Il file .zip non è valido.');const n=d.getUint16(e+10,true);let p=d.getUint32(e+16,true);const out={};
 for(let k=0;k<n;k++){if(d.getUint32(p,true)!==0x02014b50)break;
  const method=d.getUint16(p+10,true),csize=d.getUint32(p+20,true),nl=d.getUint16(p+28,true),xl=d.getUint16(p+30,true),cl=d.getUint16(p+32,true),off=d.getUint32(p+42,true);
  const name=new TextDecoder().decode(u8.subarray(p+46,p+46+nl));p+=46+nl+xl+cl;
  out[name.split('/').pop().toLowerCase()]=out[name.split('/').pop().toLowerCase()]||(async()=>{const ln=d.getUint16(off+26,true),lx=d.getUint16(off+28,true),s=off+30+ln+lx,data=u8.subarray(s,s+csize);
   if(method===0)return new TextDecoder().decode(data);
   return new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text()})}
 return out}
const gunzip=file=>new Response(file.stream().pipeThrough(new DecompressionStream('gzip'))).text();
function loadScript(src){return new Promise((ok,ko)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>ko(new Error('Non riesco a leggere il file Excel: riprova o esportalo in CSV.'));document.head.appendChild(s)})}

/* ---------- AniList ---------- */
const AL=async(query,variables)=>{for(let t=0;t<4;t++){const r=await fetch('https://graphql.anilist.co',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({query,variables})});
 if(r.status===429){await sleep(+(r.headers.get('Retry-After')||20)*1000);continue}return r.json()}throw new Error('AniList è occupato: riprova tra un minuto.')};
const LMAP={COMPLETED:'visto',REPEATING:'visto',CURRENT:'in_corso',PAUSED:'in_corso',DROPPED:'droppato',PLANNING:'voglio'};
function stOf(s){s=String(s||'').toLowerCase().replace(/[^a-z]/g,'');
 if(/^(completed|complete|finished|read|letto|visto)$/.test(s))return'visto';if(/watching|reading|current|onhold|paused|currentlyreading/.test(s))return'in_corso';
 if(/drop|didnotfinish|abandon/.test(s))return'droppato';if(/plan|toread|want|wish/.test(s))return'voglio';return null}
const alRow=(m,kind,o)=>{const man=kind==='manga',tot=(man?m.chapters:m.episodes)||null;let ep=o.progress||null;
 if(o.status==='visto'&&tot)ep=tot;if(o.status==='voglio')ep=null;
 return{kind,media_id:'al'+m.id,title:String(m.title.english||m.title.romaji||'').slice(0,300),cover:https(m.coverImage&&(m.coverImage.large||m.coverImage.extraLarge)),year:(man?m.startDate&&m.startDate.year:m.seasonYear)||(m.startDate&&m.startDate.year)||null,
  rating:o.rating,status:o.status,episodes:ep&&tot?Math.min(ep,tot):ep,total_episodes:tot,updated_at:new Date().toISOString()}};
async function fetchAniList(user,say){const out=[];let who=null;
 for(const type of['ANIME','MANGA']){say(`Carico la lista ${type==='ANIME'?'anime':'manga'} di ${user}…`);
  const j=await AL('query($u:String,$t:MediaType){MediaListCollection(userName:$u,type:$t){user{name avatar{medium}} lists{entries{status score(format:POINT_10_DECIMAL) progress media{id title{romaji english} seasonYear startDate{year} episodes chapters isAdult coverImage{large}}}}}}',{u:user,t:type});
  if(j.errors&&j.errors.length){const m=j.errors[0].message||'';throw new Error(/not found|private/i.test(m)?'Utente non trovato o lista privata.':m)}
  const C=j.data&&j.data.MediaListCollection;if(!C)continue;who=C.user;
  C.lists.forEach(l=>l.entries.forEach(e=>{const m=e.media,st=LMAP[e.status];if(!m||m.isAdult||!st)return;out.push(alRow(m,type==='ANIME'?'anime':'manga',{status:st,rating:e.score>0?r10(e.score):null,progress:e.progress||null}))}))}
 return{user:who&&{name:who.name,avatar:who.avatar&&who.avatar.medium},rows:out,miss:0}}
/* cerca su AniList partendo dagli id MyAnimeList (o AniList), 50 alla volta */
async function alLookup(ids,type,by,say){const map={},L=[...new Set(ids.filter(Boolean).map(Number))];
 for(let i=0;i<L.length;i+=50){say&&say(`Cerco le copertine… ${Math.min(i+50,L.length)}/${L.length}`);
  const j=await AL(`query($ids:[Int]){Page(perPage:50){media(${by==='al'?'id_in':'idMal_in'}:$ids,type:${type}){id idMal title{romaji english} seasonYear startDate{year} episodes chapters isAdult coverImage{large}}}}`,{ids:L.slice(i,i+50)});
  (j.data&&j.data.Page&&j.data.Page.media||[]).forEach(m=>{if(!m.isAdult)map[by==='al'?m.id:m.idMal]=m});if(i+50<L.length)await sleep(700)}
 return map}

/* ---------- MyAnimeList ---------- */
async function malFile(file,say){let text;
 if(/\.gz$/i.test(file.name)||file.type==='application/gzip'){say('Apro il file…');text=await gunzip(file)}else text=await file.text();
 const x=new DOMParser().parseFromString(text,'text/xml');const man=!!x.querySelector('manga'),type=man?'MANGA':'ANIME',kind=man?'manga':'anime';
 const ents=[...x.querySelectorAll(man?'manga':'anime')].map(n=>{const g=t=>(n.querySelector(t)||{}).textContent||'';
  return{mal:+g(man?'manga_mangadb_id':'series_animedb_id'),st:stOf(g('my_status')),score:+g('my_score')||0,progress:+(man?g('my_read_chapters'):g('my_watched_episodes'))||0}}).filter(e=>e.mal&&e.st);
 if(!ents.length)throw new Error('Non trovo titoli in questo file: è l\'export di MyAnimeList?');
 return malRows(ents,type,kind,say,{name:(x.querySelector('user_name')||{}).textContent||''})}
async function malRows(ents,type,kind,say,user){const map=await alLookup(ents.map(e=>e.mal),type,'mal',say);let miss=0;const rows=[];
 ents.forEach(e=>{const m=map[e.mal];if(!m){miss++;return}rows.push(alRow(m,kind,{status:e.st,rating:e.score>0?r10(e.score):null,progress:e.progress||null}))});return{user,rows,miss}}
async function malUser(user,list,say){say('Carico la lista da MyAnimeList…');
 const r=await fetch(A.SEARCH_URL+'?type=mal&user='+encodeURIComponent(user)+'&list='+list,{headers:HDR});const j=await r.json();if(j.error)throw new Error(/NON_ATTIVO/.test(j.error)?A.SOON:j.error);
 return malRows((j.items||[]).map(e=>({mal:e.mal,st:stOf(e.st),score:e.score,progress:e.progress})).filter(e=>e.st),list==='manga'?'MANGA':'ANIME',list,say,{name:user})}

/* ---------- Kitsu ---------- */
const KMAP={current:'in_corso',planned:'voglio',completed:'visto',on_hold:'in_corso',dropped:'droppato'};
async function fetchKitsu(user,say){const H={Accept:'application/vnd.api+json'},base='https://kitsu.io/api/edge/';
 say('Cerco '+user+' su Kitsu…');let u=null;
 for(const f of['slug','name']){const j=await (await fetch(base+'users?filter%5B'+f+'%5D='+encodeURIComponent(user)+'&fields%5Busers%5D=name,slug,avatar',{headers:H})).json();if(j.data&&j.data[0]){u=j.data[0];break}}
 if(!u)throw new Error('Utente Kitsu non trovato.');
 const out=[];let miss=0;
 for(const kind of['anime','manga']){const ents=[];let url=`${base}library-entries?filter%5BuserId%5D=${u.id}&filter%5Bkind%5D=${kind}&include=${kind}.mappings&fields%5BlibraryEntries%5D=status,progress,ratingTwenty,${kind}&fields%5B${kind}%5D=mappings&fields%5Bmappings%5D=externalSite,externalId&page%5Blimit%5D=500`;
  for(let p=0;p<12&&url;p++){say(`Carico la lista ${kind} di ${user}…`);const j=await (await fetch(url,{headers:H})).json();const inc={};(j.included||[]).forEach(x=>inc[x.type+':'+x.id]=x);
   (j.data||[]).forEach(e=>{const rel=e.relationships&&e.relationships[kind]&&e.relationships[kind].data;const media=rel&&inc[kind+':'+rel.id];let mal=null,al=null;
    ((media&&media.relationships&&media.relationships.mappings&&media.relationships.mappings.data)||[]).forEach(r=>{const m=inc['mappings:'+r.id];if(!m)return;const s=m.attributes.externalSite;
     if(s==='myanimelist/'+kind)mal=+m.attributes.externalId;if(s==='anilist/'+kind||s==='anilist')al=+String(m.attributes.externalId).replace(/\D/g,'')});
    const a=e.attributes;ents.push({mal,al,st:KMAP[a.status],score:a.ratingTwenty?a.ratingTwenty/2:0,progress:a.progress||0})});
   url=j.links&&j.links.next||''}
  const T=kind==='manga'?'MANGA':'ANIME',byMal=await alLookup(ents.filter(e=>e.mal).map(e=>e.mal),T,'mal',say),byAl=await alLookup(ents.filter(e=>!e.mal&&e.al).map(e=>e.al),T,'al',say);
  ents.forEach(e=>{const m=(e.mal&&byMal[e.mal])||(e.al&&byAl[e.al]);if(!m||!e.st){miss++;return}out.push(alRow(m,kind,{status:e.st,rating:e.score>0?r10(e.score):null,progress:e.progress||null}))})}
 return{user:{name:u.attributes.name,avatar:u.attributes.avatar&&u.attributes.avatar.small},rows:out,miss}}

/* ---------- abbinamento film / serie / giochi con la funzione super-endpoint ---------- */
async function match(items,say){const out=[];
 for(let i=0;i<items.length;i+=50){say(`Cerco i titoli… ${Math.min(i+50,items.length)}/${items.length}`);
  let j;try{const r=await fetch(A.SEARCH_URL,{method:'POST',headers:{...HDR,'Content-Type':'application/json'},body:JSON.stringify({action:'match',items:items.slice(i,i+50).map(x=>x.m)})});j=await r.json()}catch(e){throw new Error(A.SOON)}
  if(!j||!(j.v>=3))throw new Error(A.SOON);(j.items||[]).forEach(x=>out.push(x))}
 let miss=0;const rows=[];
 items.forEach((x,i)=>{const it=out[i];if(!it){miss++;return}
  rows.push({kind:it.type,media_id:it.id,title:String(it.title||x.m.t||'').slice(0,300),cover:https(it.cover),year:it.year||null,rating:x.rating,status:x.status,episodes:x.status==='visto'&&it.eps?it.eps:null,total_episodes:it.eps||null,updated_at:new Date().toISOString()})});
 return{rows,miss}}

/* Letterboxd: zip (ratings + watched + watchlist) o un solo csv */
async function letterboxd(file,say){const files={};
 if(/\.zip$/i.test(file.name)){say('Apro lo zip…');const z=await unzip(await file.arrayBuffer());for(const n of['ratings.csv','watched.csv','watchlist.csv'])if(z[n])files[n]=csv(await z[n]())}
 else{const rows=csv(await file.text());files[rows[0]&&'Rating' in rows[0]?'ratings.csv':'watched.csv']=rows}
 if(!files['ratings.csv']&&!files['watched.csv']&&!files['watchlist.csv'])throw new Error('Nello zip non trovo ratings.csv o watched.csv.');
 const M=new Map(),k=r=>r['Letterboxd URI']||(r.Name+'|'+r.Year);
 (files['watchlist.csv']||[]).forEach(r=>r.Name&&M.set(k(r),{m:{k:'movie',t:r.Name,y:+r.Year||0},rating:null,status:'voglio'}));
 (files['watched.csv']||[]).forEach(r=>r.Name&&M.set(k(r),{m:{k:'movie',t:r.Name,y:+r.Year||0},rating:null,status:'visto'}));
 (files['ratings.csv']||[]).forEach(r=>{if(!r.Name)return;const v=parseFloat(String(r.Rating).replace(',','.'));const o=M.get(k(r))||{m:{k:'movie',t:r.Name,y:+r.Year||0},status:'visto'};o.status='visto';o.rating=isNaN(v)?null:r10(v*2);M.set(k(r),o)});
 return match([...M.values()].slice(0,3000),say)}
/* IMDb: voti (Const = id IMDb) o watchlist */
async function imdb(file,say){const rows=csv(await file.text());if(!rows.length||!('Const' in rows[0]))throw new Error('Non sembra un export di IMDb (manca la colonna “Const”).');
 const items=rows.filter(r=>/^tt\d+/.test(r.Const)).map(r=>{const t=String(r['Title Type']||'').toLowerCase().replace(/\s/g,''),tv=/tvseries|tvminiseries|series/.test(t);const v=parseFloat(r['Your Rating']);
  return{m:{k:tv?'tv':'movie',imdb:r.Const,t:r.Title,y:+r.Year||0},rating:isNaN(v)?null:r10(v),status:isNaN(v)?'voglio':'visto'}});
 return match(items.slice(0,3000),say)}
/* Trakt: profilo pubblico (serve TRAKT_CLIENT_ID nella funzione) */
async function trakt(user,say){say('Carico il profilo Trakt…');const r=await fetch(A.SEARCH_URL+'?type=trakt&user='+encodeURIComponent(user),{headers:HDR});let j;try{j=await r.json()}catch(e){throw new Error(A.SOON)}
 if(!j.v)throw new Error(A.SOON);if(j.error)throw new Error(/NON_ATTIVO/.test(j.error)?A.SOON:j.error);
 const res=await match((j.items||[]).map(x=>({m:{k:x.k,tmdb:x.tmdb,t:x.t,y:x.y},rating:x.rating?r10(x.rating):null,status:x.status||'visto'})),say);res.user={name:user};return res}
/* MyGameList: xlsx o csv, colonne riconosciute dal nome */
async function mygamelist(file,say){let rows;
 if(/\.xlsx?$/i.test(file.name)){say('Apro il file Excel…');if(!window.XLSX)await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
  const wb=XLSX.read(await file.arrayBuffer(),{type:'array'});rows=[];wb.SheetNames.forEach(n=>rows.push(...XLSX.utils.sheet_to_json(wb.Sheets[n],{defval:''})))}
 else rows=csv(await file.text());
 if(!rows.length)throw new Error('Il file è vuoto.');
 const H=Object.keys(rows[0]),col=re=>H.find(h=>re.test(h.toLowerCase()));
 const cN=col(/^(name|title|nome|titolo|game|gioco)/)||col(/name|title|nome|titolo|game|gioco/),cS=col(/status|stato|list|lista/),cR=col(/rating|score|voto|stars|stelle/),cY=col(/year|anno|release|uscita/);
 if(!cN)throw new Error('Non trovo la colonna con il nome dei giochi.');
 const nums=rows.map(r=>parseFloat(String(r[cR]||'').replace(',','.'))).filter(v=>!isNaN(v)&&v>0),mx=Math.max(0,...nums),scale=mx<=5?2:mx<=10?1:.1;
 const stG=v=>{v=String(v||'').toLowerCase();if(/complet|finish|beat|finit|100|platin|done/.test(v))return'visto';if(/playing|in corso|current|gioc|sto/.test(v))return'in_corso';if(/drop|abandon|abbandon|shelv/.test(v))return'droppato';if(/plan|want|backlog|wish|voglio|da giocare/.test(v))return'voglio';return null};
 const items=rows.filter(r=>String(r[cN]||'').trim()).map(r=>{const v=parseFloat(String(r[cR]||'').replace(',','.')),rating=!isNaN(v)&&v>0?r10(v*scale):null;
  return{m:{k:'game',t:String(r[cN]).trim(),y:yr(r[cY])||0},rating,status:stG(r[cS])||(rating!=null?'visto':'voglio')}});
 return match(items.slice(0,2000),say)}

/* ---------- libri (Open Library, senza chiavi) ---------- */
const slug=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
async function olFind(b){const F='fields=key,title,author_name,first_publish_year,cover_i,number_of_pages_median&limit=1';
 const get=async u=>{try{const j=await (await fetch('https://openlibrary.org/search.json?'+u+'&'+F)).json();return j.docs&&j.docs[0]}catch(e){return null}};
 return(b.isbn&&await get('isbn='+b.isbn))||await get('title='+encodeURIComponent(b.title)+(b.author?'&author='+encodeURIComponent(b.author):''))}
async function books(list,say){const rows=[];let done=0,miss=0;const Q=list.slice(0,2000);
 const work=async()=>{while(Q.length){const b=Q.shift(),d=await olFind(b);done++;if(done%5===0)say(`Cerco i libri su Open Library… ${done}/${list.length}`);
  const tot=(d&&d.number_of_pages_median)||b.pages||null;if(!d)miss++;
  rows.push({kind:'book',media_id:d?'ol'+d.key.replace('/works/',''):('bk'+slug(b.title+'-'+(b.author||''))).slice(0,40),title:String((d&&d.title)||b.title).slice(0,300),cover:d&&d.cover_i?`https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`:null,
   year:(d&&d.first_publish_year)||b.year||null,rating:b.rating,status:b.status,episodes:b.status==='visto'&&tot?tot:null,total_episodes:tot,updated_at:new Date().toISOString()})}};
 await Promise.all(Array.from({length:6},work));return{rows,miss:0,soft:miss}}
const isbnOf=v=>String(v||'').replace(/[^0-9X]/gi,'');
async function goodreads(file,say){const R=csv(await file.text());if(!R.length||!('Exclusive Shelf' in R[0]||'My Rating' in R[0]))throw new Error('Non sembra un export di Goodreads.');
 const sh={read:'visto','currently-reading':'in_corso','to-read':'voglio'};
 return books(R.filter(r=>r.Title).map(r=>{const v=+r['My Rating']||0;return{title:r.Title.replace(/\s*\(.*?#\d+\)\s*$/,''),author:r.Author,isbn:isbnOf(r.ISBN13)||isbnOf(r.ISBN),rating:v>0?r10(v*2):null,status:sh[r['Exclusive Shelf']]||(v>0?'visto':'voglio'),pages:+r['Number of Pages']||null,year:yr(r['Original Publication Year'])||yr(r['Year Published'])}}),say)}
async function storygraph(file,say){const R=csv(await file.text());if(!R.length||!('Read Status' in R[0]))throw new Error('Non sembra un export di The StoryGraph.');
 const sh={read:'visto','currently-reading':'in_corso','to-read':'voglio','did-not-finish':'droppato',paused:'in_corso'};
 return books(R.filter(r=>r.Title).map(r=>{const v=parseFloat(r['Star Rating'])||0;return{title:r.Title,author:String(r.Authors||'').split(',')[0],isbn:isbnOf(r['ISBN/UID']).length>=10?isbnOf(r['ISBN/UID']):'',rating:v>0?r10(v*2):null,status:sh[r['Read Status']]||(v>0?'visto':'voglio')}}),say)}

/* ---------- interfaccia ---------- */
function open(ctx){const {box,openBox,close}=ctx,canSave=A.DEMO||A.user;let caps={v:0};
 const ok=s=>!s.need||(s.need==='v'?caps.v>=3:caps.v>=3&&caps[s.need]);
 const pick=()=>{const first=SRC.filter(s=>s.kinds.includes(ctx.kind)),rest=SRC.filter(s=>!s.kinds.includes(ctx.kind));
  box.innerHTML=`<button class="cx" aria-label="Chiudi">×</button><p class="label">Importa</p><h3 id="cs-title" style="font-size:1.35rem">Da quale sito?</h3>
  <p class="muted small">Porta qui la lista che hai già altrove: prima vedi un'anteprima, poi decidi tu se salvarla.</p>
  ${canSave?`<div class="impsrc">${[...first,...rest].map(s=>`<button data-src="${s.id}" class="${ok(s)?'':'soon'}"><b>${E(s.nome)}</b><small>${E(s.what)}</small>${ok(s)?'':`<em>${E(A.SOON)}</em>`}</button>`).join('')}</div>`
  :`<div class="cs-login"><p>Accedi con Discord per importare la tua lista.</p><button class="btn" id="cs-login">Accedi con Discord</button></div>`}`;
  q('.cx',box).onclick=close;q('#cs-login',box)&&(q('#cs-login',box).onclick=()=>A.login());
  qa('[data-src]',box).forEach(b=>b.onclick=()=>source(SRC.find(s=>s.id===b.dataset.src)))};
 const source=s=>{const soon=!ok(s),malU=s.id==='mal'&&caps.mal&&caps.v>=3;
  box.innerHTML=`<button class="cx" aria-label="Chiudi">×</button><button class="linkbtn impback" id="impback">← Altri siti</button><p class="label">Importa · ${E(s.what)}</p><h3 id="cs-title" style="font-size:1.35rem">${E(s.nome)}</h3>
  ${soon?`<div class="impsoon"><b>${E(A.SOON)}</b><p class="muted small">L'import da ${E(s.nome)} si attiva da solo tra poco, appena finiamo di aggiornare il sito. Riprova più tardi!</p></div>`
  :`<p class="muted small">${s.how}</p>
  ${s.user||malU?`<form class="impf" id="impf">${malU?`<select id="impl" class="epsel" style="max-width:8rem"><option value="anime">Anime</option><option value="manga">Manga</option></select>`:''}<input id="impu" placeholder="Nome utente ${E(s.nome)}" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="40" required><button class="btn" type="submit">Anteprima</button></form>`:''}
  ${s.file?`${malU?'<p class="muted tiny" style="margin:.4rem 0">…oppure carica il file:</p>':''}<label class="impfile"><input type="file" id="impfile" accept="${s.file}"><span>📁 Scegli il file</span><small id="impfn">nessun file scelto</small></label>`:''}`}
  <div id="impv"></div>`;
  q('.cx',box).onclick=close;q('#impback',box).onclick=pick;
  const out=q('#impv',box),say=t=>{out.innerHTML=`<p class="muted small imploading">${E(t)}</p>`};
  const run=async fn=>{try{const res=await fn();preview(s,res)}catch(e){out.innerHTML=`<p class="imperr">${E(e.message||'Qualcosa è andato storto. Riprova.')}</p>`}};
  const f=q('#impf',box);f&&(f.onsubmit=ev=>{ev.preventDefault();const u=q('#impu',box).value.trim();if(!/^[\w.-]{2,40}$/.test(u)){out.innerHTML='<p class="imperr">Nome utente non valido.</p>';return}
   run(()=>s.id==='anilist'?fetchAniList(u,say):s.id==='kitsu'?fetchKitsu(u,say):s.id==='trakt'?trakt(u,say):malUser(u,q('#impl',box).value,say))});
  const fi=q('#impfile',box);fi&&(fi.onchange=()=>{const file=fi.files[0];if(!file)return;q('#impfn',box).textContent=file.name;
   if(file.size>60e6){out.innerHTML='<p class="imperr">Il file è troppo grande (max 60 MB).</p>';return}
   run(()=>({mal:malFile,letterboxd,imdb,mgl:mygamelist,goodreads,storygraph})[s.id](file,say))});
  setTimeout(()=>{const i=q('#impu',box);i&&i.focus()},200)};
 const preview=(s,res)=>{const out=q('#impv',box),mine=ctx.mine(),key=ctx.key;
  const M=new Map();res.rows.forEach(r=>{if(!r.media_id||!r.title)return;const k=key(r.kind,r.media_id),o=M.get(k);if(!o||(o.rating==null&&r.rating!=null))M.set(k,r)});const rows=[...M.values()];
  if(!rows.length){out.innerHTML=`<p class="imperr">Non ho trovato titoli da importare${res.miss?` (${res.miss} non riconosciuti)`:''}.</p>`;return}
  const kinds=[...new Set(rows.map(r=>r.kind))],c=s=>rows.filter(r=>r.status===s).length,voted=rows.filter(r=>r.rating!=null),already=rows.filter(r=>mine[key(r.kind,r.media_id)]).length;
  const prev=rows.slice().sort((a,b)=>(b.rating??-1)-(a.rating??-1)).slice(0,12),k0=kinds.length===1?kinds[0]:'';
  out.innerHTML=`<div class="impuser">${res.user&&res.user.avatar?`<img src="${E(res.user.avatar)}" alt="">`:''}<div><b>${E(res.user&&res.user.name||s.nome)}</b><small>${kinds.map(k=>`${rows.filter(r=>r.kind===k).length} ${E(A.KINDS[k].t.toLowerCase())}`).join(' · ')} · ${voted.length} con voto${voted.length?' · media '+A.fmtR(voted.reduce((a,r)=>a+r.rating,0)/voted.length):''}</small></div></div>
  <div class="impstats">${ST.map(st=>`<span class="sdot s-${st}">${E(A.statusLabel(k0,st))} <b>${c(st)}</b></span>`).join('')}</div>
  <ul class="implist">${prev.map(r=>`<li>${r.cover?`<img src="${E(r.cover)}" alt="" loading="lazy">`:'<i></i>'}<span><b>${E(r.title)}</b><small>${E(A.KINDS[r.kind].t)} · ${E(A.statusLabel(r.kind,r.status))}${E(A.progTxt(r))}</small></span><em>${r.rating!=null?A.fmtR(r.rating):'–'}</em></li>`).join('')}</ul>
  ${rows.length>12?`<p class="muted tiny">…e altri ${rows.length-12}.</p>`:''}
  ${res.miss?`<p class="muted tiny">⚠️ ${res.miss} titoli non trovati: non verranno importati.</p>`:''}${res.soft?`<p class="muted tiny">ℹ️ ${res.soft} libri non trovati su Open Library: entrano lo stesso, senza copertina.</p>`:''}
  ${already?`<label class="impover"><input type="checkbox" id="impo"> Sovrascrivi i ${already} titoli che hai già nel catalogo</label>`:''}
  <div class="cs-act"><button class="btn" id="impgo">Importa ${rows.length} ${rows.length===1?"titolo":"titoli"}</button><button class="btn ghost" id="impno">Annulla</button></div><p class="muted small" id="impmsg"></p>`;
  q('#impno',out).onclick=ctx.close;
  q('#impgo',out).onclick=async()=>{const over=q('#impo',out)&&q('#impo',out).checked;const todo=rows.filter(r=>over||!mine[key(r.kind,r.media_id)]);const msg=q('#impmsg',out);
   if(!todo.length){msg.textContent='Niente da importare: hai già tutti questi titoli.';return}q('#impgo',out).disabled=true;
   for(let i=0;i<todo.length;i+=200){msg.textContent=`Importo… ${Math.min(i+200,todo.length)}/${todo.length}`;const err=await ctx.DB.upsert(todo.slice(i,i+200));if(err){msg.textContent=ctx.errText(err);q('#impgo',out).disabled=false;return}}
   msg.textContent=`Fatto! ${todo.length} titoli importati.`;setTimeout(ctx.done,700)}};
 pick();openBox();A.caps().then(c=>{caps=c;if(q('.impsrc',box))pick()})}
window.STASKYS_IMPORT={open,SRC,_t:{csv,unzip,stOf}};
})();
