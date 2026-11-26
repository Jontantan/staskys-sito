/* Staskys — Fase 2+3: Top 10, compatibilità, membri simili, classifica media voti, punti minigiochi, profili personalizzati.
   Funziona con i dati veri (Supabase) oppure con i dati DEMO (?demo=1), chiaramente segnati. */
(function(){
const A=window.STASKYS;
const MIN_VOTES=2; /* voti minimi perché un titolo entri in classifica */
const K=(r)=>r.kind+':'+r.media_id;
const has=r=>A.hasR(r);

/* ---------- dati DEMO (finti) ---------- */
const T={
 fr:['anime','al154587',"Frieren: Beyond Journey's End",2023,'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-qQTzQnEJJ3oB.jpg'],
 jjk:['anime','al113415','JUJUTSU KAISEN',2020,'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-LHBAeoZDIsnF.jpg'],
 csm:['anime','al127230','Chainsaw Man',2022,'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx127230-DdP4vAdssLoz.png'],
 spy:['anime','al140960','SPY x FAMILY',2022,'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx140960-Kb6R5nYQfjmP.jpg'],
 op:['anime','al21','ONE PIECE',1999,'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-ELSYx3yMPcKM.jpg'],
 aot:['anime','al16498','Attack on Titan',2013,'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-buvcRTBx4NSm.jpg'],
 ds:['anime','al101922','Demon Slayer: Kimetsu no Yaiba',2019,'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-WBsBl0ClmgYL.jpg'],
 sl:['anime','al151807','Solo Leveling',2024,'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-it355ZgzquUd.png'],
 nar:['anime','al20','Naruto',2002,'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20-dE6UHbFFg1A5.jpg'],
 mc:['game','rg22509','Minecraft',2009,'https://media.rawg.io/media/crop/600/400/games/b4e/b4e4c73d5aa4ec66bbf75375c4847a2b.jpg'],
 er:['game','rg326243','Elden Ring',2022,'https://media.rawg.io/media/crop/600/400/games/b29/b294fdd866dcdb643e7bab370a552855.jpg'],
 rl:['game','rg3272','Rocket League',2015,'https://media.rawg.io/media/crop/600/400/games/8cc/8cce7c0e99dcc43d66c8efd42f9d03e3.jpg'],
 hk:['game','rg292844','Hollow Knight: Silksong',2025,'https://media.rawg.io/media/crop/600/400/games/27c/27cd8b7dead05a870f8a514a9a1915ad.jpg'],
 val:['game','rg415171','Valorant',2020,'https://media.rawg.io/media/crop/600/400/games/b11/b11127b9ee3c3701bd15b9af3286d20e.jpg'],
 fn:['game','rg28131','Fortnite',2017,'https://media.rawg.io/media/crop/600/400/games/d97/d97f663b752a6484df105993f17abb49.jpg'],
 zelda:['game','rg22511','The Legend of Zelda: Breath of the Wild',2017,'https://media.rawg.io/media/crop/600/400/games/cc1/cc196a5ad763955d6532cdba236f730c.jpg'],
 hades:['game','rg274755','Hades',2020,'https://media.rawg.io/media/crop/600/400/games/1f4/1f47a270b8f241e4676b14d39ec620f7.jpg'],
 dune:['movie','tm693134','Dune - Parte due',2024,'https://image.tmdb.org/t/p/w342/nhdQxDCI64rMgypYZpsF7UvbdJA.jpg'],
 inter:['movie','tm157336','Interstellar',2014,'https://image.tmdb.org/t/p/w342/bMKiLh0mES4Uiococ240lbbTGXQ.jpg'],
 yn:['movie','tm372058','Your Name.',2016,'https://image.tmdb.org/t/p/w342/uyOd5E0dNTp2AJAJWv0V3asf31u.jpg'],
 opp:['movie','tm872585','Oppenheimer',2023,'https://image.tmdb.org/t/p/w342/fRtaxfyynWMJI6DhejyA6JOzVTB.jpg'],
 spirit:['movie','tm129','La città incantata',2001,'https://image.tmdb.org/t/p/w342/3PV6lq9BNmoyyDXr5tdNeeESEMn.jpg'],
 para:['movie','tm496243','Parasite',2019,'https://image.tmdb.org/t/p/w342/mMM8kcfspicib7AmPTvf97Rarwn.jpg'],
 incep:['movie','tm27205','Inception',2010,'https://image.tmdb.org/t/p/w342/5QHWgqaBxZI1eM5e3YhyKzY5o3z.jpg'],
 bb:['tv','tv1396','Breaking Bad',2008,'https://image.tmdb.org/t/p/w342/anFx9aTOOYqgS3v7x3R84Kz67ly.jpg',62],
 st:['tv','tv66732','Stranger Things',2016,'https://image.tmdb.org/t/p/w342/uOOtwVbSr4QDjAGIifLDwpb2Pdl.jpg',42],
 arc:['tv','tv94605','Arcane',2021,'https://image.tmdb.org/t/p/w342/87C0wecB8bHb1PsrKBI4kJiEkgV.jpg',18],
 tlou:['tv','tv100088','The Last of Us',2023,'https://image.tmdb.org/t/p/w342/6WlffOd3bszyndGgsKGcUL6k28n.jpg',16],
 sq:['tv','tv93405','Squid Game',2021,'https://image.tmdb.org/t/p/w342/nW5rupC5zMeAGgGBYXkr8JL8Xq7.jpg',22],
 bear:['tv','tv136315','The Bear',2022,'https://image.tmdb.org/t/p/w342/eKfVzzEazSIjJMrw9ADa2x8ksLz.jpg',46],
 wed:['tv','tv119051','Mercoledì',2022,'https://image.tmdb.org/t/p/w342/sci4aAuTCWQsIs2uo7LoZVtMdD0.jpg',16]};
const EPS={fr:28,jjk:24,csm:12,spy:25,op:1100,aot:25,ds:26,sl:12,nar:220};
/* voto (numero, anche decimale), 'c' = in corso, 'd' = droppato, 'v' = voglio vederlo; "9c" = voto 9 e in corso */
const U={
 demo:['Membro demo',2,'fr9.8 aot9.2 jjk8.7 csm8 spy7c op:v sl6.5d ds6 mc9 er10 zelda9c rl8 hades8.5 val5 hk:v dune9 inter10 yn9 spirit9.6 para8 incep9 opp:v bb9.7 arc9.4 st7.5c sq6d tlou:v'],
 aki:['Demo Aki',1,'fr10 jjk9 csm9 aot10 ds6 sl6 op8 er10 zelda10 hades9 mc8 inter10 yn9 spirit9 incep9 dune8 bb10 arc9 st8'],
 rin:['Demo Rin',3,'fr9 jjk7 csm6 spy8 aot8 nar7 mc7 rl9 val7 er8 dune8 inter8 yn10 para9 spirit8 arc8.5 tlou9 wed7'],
 kai:['Demo Kai',4,'fr6 jjk10 csm10 ds9 sl10 nar9 val10 fn9 rl8 er7 dune10 opp9 incep10 inter7 sq9 st9 bear6'],
 yuki:['Demo Yuki',5,'fr4 jjk5 spy10 ds10 sl3 aot5 fn10 mc5 val9 yn6 spirit7 para4 incep5 dune5 wed10 st6'],
 sora:['Demo Sora',0,'aot10 op10 nar10 csm5 fr9 hk9 hades10 zelda8 er9 para10 opp8 spirit9 inter9 bb9.5 bear9 tlou8.5']};
const DEMO_TOP={anime:['fr','aot','jjk','csm','spy','sl','ds']}; /* top 10 personalizzata del profilo demo */
function demoRows(){const rows=[];let t=0;
 for(const [id,[name,av,list]] of Object.entries(U))list.split(' ').forEach(tok=>{const m=tok.match(/^([a-z]+):?(\d+(?:\.\d)?)?([cvd])?$/);const [kind,media_id,title,year,cover,teps]=T[m[1]];
  const rating=m[2]?+m[2]:null,status=m[3]==='c'?'in_corso':m[3]==='v'?'voglio':m[3]==='d'?'droppato':'visto';
  const tot=teps||EPS[m[1]]||null,episodes=(status==='in_corso'||status==='droppato')&&tot?Math.max(1,Math.round(tot*(status==='droppato'?.3:.6))):null;
  rows.push({discord_id:'demo-'+id,username:name,avatar_url:`https://cdn.discordapp.com/embed/avatars/${av}.png`,kind,media_id,title,year,cover,rating,status,episodes,total_episodes:tot,updated_at:new Date(Date.UTC(2026,(t%11),1+(t++%25))).toISOString(),top_pos:null})});
 let saved=null;try{saved=JSON.parse(localStorage.demo_top10||'null')}catch(e){}
 const top=saved||Object.fromEntries(Object.entries(DEMO_TOP).map(([k,ids])=>[k,ids.map(x=>T[x][1])]));
 rows.filter(r=>r.discord_id==='demo-demo').forEach(r=>{const i=(top[r.kind]||[]).indexOf(r.media_id);r.top_pos=i>=0?i+1:null});
 return rows}

/* ---------- caricamento ---------- */
let cache=null;
async function loadAll(){if(cache)return cache;
 if(A.DEMO)return cache=regAv(demoRows());
 if(!A.sb)return cache=[];
 const cols='discord_id,user_id,username,avatar_url,kind,media_id,title,cover,year,rating,status,updated_at';
 let r=await A.sb.from('media_ratings').select(cols+',top_pos,episodes,total_episodes').limit(10000);
 if(r.error)r=await A.sb.from('media_ratings').select(cols+',top_pos').limit(10000); /* prima di fase3 */
 if(r.error)r=await A.sb.from('media_ratings').select(cols).limit(10000); /* prima di fase2-top10.sql */
 return cache=regAv((r.data||[]).map(x=>({...x,rating:x.rating==null?null:+x.rating})))}
/* avatar dai voti del catalogo: il più recente per primo (vedi STASKYS.avList) */
function regAv(rows){rows.slice().sort((a,b)=>String(b.updated_at||'').localeCompare(String(a.updated_at||''))).forEach(r=>A.addAv(r.discord_id,r.avatar_url,2));return rows}
/* nome più recente salvato nei voti di un membro */
function lastName(L){let b=null;L.forEach(r=>{if(r.username&&(!b||String(r.updated_at||'')>String(b.updated_at||'')))b=r});return b?b.username:''}
function reset(){cache=null}

/* ---------- Top 10 ---------- */
/* ordine scelto dall'utente (top_pos), poi completata coi voti più alti */
function top10(rows,kind){const L=rows.filter(r=>r.kind===kind);
 const pinned=L.filter(r=>r.top_pos).sort((a,b)=>a.top_pos-b.top_pos);
 const custom=pinned.length>0;
 const rest=custom?[]:L.filter(has).sort((a,b)=>b.rating-a.rating||String(b.updated_at).localeCompare(a.updated_at));
 return{list:(custom?pinned:rest).slice(0,10),custom}}
async function saveTop10(kind,ids){
 if(A.DEMO){let s={};try{s=JSON.parse(localStorage.demo_top10||'null')||Object.fromEntries(Object.entries(DEMO_TOP).map(([k,v])=>[k,v.map(x=>T[x][1])]))}catch(e){}s[kind]=ids;localStorage.demo_top10=JSON.stringify(s);reset();return null}
 const {error}=await A.sb.rpc('set_top10',{p_kind:kind,p_ids:ids});reset();return error}

/* ---------- compatibilità ---------- */
/* titoli votati da entrambi; punteggio = quanto sono vicini i voti (0–100),
   avvicinato al 50% quando i titoli in comune sono pochi (così 1 solo titolo non fa "100%") */
function compare(aRows,bRows){const B=new Map(bRows.filter(has).map(r=>[K(r),r]));
 const shared=aRows.filter(r=>has(r)&&B.has(K(r))).map(r=>{const o=B.get(K(r));return{kind:r.kind,media_id:r.media_id,title:r.title,cover:r.cover,a:+r.rating,b:+o.rating,d:Math.abs(r.rating-o.rating)}});
 const n=shared.length;if(!n)return{n:0,pct:null,shared,agree:[],differ:[]};
 const raw=100*(1-shared.reduce((s,x)=>s+x.d,0)/n/10),k=3,pct=Math.round((raw*n+50*k)/(n+k));
 const agree=shared.slice().sort((x,y)=>x.d-y.d||(y.a+y.b)-(x.a+x.b)).filter(x=>x.d<=1).slice(0,5);
 const differ=shared.slice().sort((x,y)=>y.d-x.d||(y.a+y.b)-(x.a+x.b)).filter(x=>x.d>=3).slice(0,5);
 return{n,pct,shared,agree,differ}}
function label(p){return p>=85?['soulmate','Soulmate']:p>=72?['great','Great match']:p>=60?['good','Good match']:null}
function byUser(rows){const m=new Map();rows.forEach(r=>{const id=String(r.discord_id||'');if(!id)return;if(!m.has(id))m.set(id,[]);m.get(id).push(r)});return m}
/* membri più compatibili con did (servono almeno 3 titoli in comune) */
function similar(rows,did,max=5){const M=byUser(rows),mine=M.get(did)||[];const out=[];
 M.forEach((L,id)=>{if(id===did)return;const c=compare(mine,L);if(c.n>=3&&label(c.pct))out.push({did:id,name:A.nameOf(id,lastName(L)),avatar:A.avList(id)[0],...c,label:label(c.pct)})});
 return out.sort((a,b)=>b.pct-a.pct||b.n-a.n).slice(0,max)}

/* ---------- classifica per media voti (PONDERATA, patch 2.2) ---------- */
/* Media ponderata "alla IMDb": punteggio = v/(v+m)·R + m/(v+m)·C
   R = media del titolo, v = numero di voti, C = media di TUTTI i voti della categoria, m = WEIGHT_M.
   Con pochi voti il punteggio resta vicino alla media generale; più voti ha, più conta la sua media vera.
   Così due 10 non battono un 9,8 con 6 voti. Sul sito si mostra comunque la media vera. */
const WEIGHT_M=5;
function weigh(list,C,min=MIN_VOTES){if(C==null){const v=list.reduce((s,o)=>s+o.votes,0);C=v?list.reduce((s,o)=>s+o.avg_rating*o.votes,0)/v:0}
 return list.filter(o=>o.votes>=min).map(o=>({...o,C,score:(o.votes/(o.votes+WEIGHT_M))*o.avg_rating+(WEIGHT_M/(o.votes+WEIGHT_M))*C}))
  .sort((a,b)=>b.score-a.score||b.votes-a.votes||b.avg_rating-a.avg_rating||String(a.title).localeCompare(String(b.title)))}
function ranking(rows,kind,min=MIN_VOTES){const m=new Map();rows.filter(r=>r.kind===kind&&has(r)).forEach(r=>{const k=K(r);const o=m.get(k)||{kind:r.kind,media_id:r.media_id,title:r.title,cover:r.cover,year:r.year,sum:0,votes:0};o.sum+=+r.rating;o.votes++;m.set(k,o)});
 const all=[...m.values()],v=all.reduce((s,o)=>s+o.votes,0),C=v?all.reduce((s,o)=>s+o.sum,0)/v:0;
 return weigh(all.map(o=>({...o,avg_rating:Math.round(o.sum/o.votes*10)/10})),C,min)}
async function loadRanking(kind){
 if(A.DEMO)return ranking(await loadAll(),kind);
 if(!A.sb)return[];
 /* tutti i titoli votati della categoria (anche con 1 voto, servono per la media generale C), ordinati qui */
 const {data,error}=await A.sb.from('media_avg').select('kind,media_id,title,cover,year,avg_rating,votes').eq('kind',kind).limit(5000);
 return error?ranking(await loadAll(),kind):weigh((data||[]).map(r=>({...r,avg_rating:+r.avg_rating,votes:+r.votes})))}


/* ---------- minigiochi: record, posizioni, streak e PUNTI ---------- */
/* PUNTI (provvisorio): 10 per ogni minigioco giocato, +50/+30/+20 per 1°/2°/3° posto, +5 se sei in top 10, +5 per ogni giorno di streak */
const ASC=new Set(['reaction','mines','wordle']); /* giochi dove vince il punteggio più basso */
const GAME_NAMES={snake:'Snake',reaction:'Tempo di reazione',clicker:'Clicker veloce',flappy:'Flappy',tetris:'Tetris',dino:'Dino runner',quiz:'Quiz anime',wordle:'Wordle',2048:'2048',breakout:'Breakout',stack:'Stack',suika:'Suika',mines:'Prato fiorito',typing:'Battitura'};
function points(rec,streak){return rec.reduce((s,r)=>s+10+(r.rank===1?50:r.rank===2?30:r.rank===3?20:r.rank<=10?5:0),0)+(streak||0)*5}
function demoGames(){/* partite finte, solo per la DEMO */
 const P=[['demo-demo','Membro demo',2,{snake:41,wordle:3,tetris:2210,flappy:27,2048:1388},7,12],['demo-aki','Demo Aki',1,{snake:55,tetris:3100,quiz:9,typing:88,suika:2400,stack:31},12,20],['demo-rin','Demo Rin',3,{wordle:2,reaction:212,mines:48,flappy:19},3,5],
  ['demo-kai','Demo Kai',4,{snake:38,flappy:44,dino:1810,breakout:930,clicker:118,2048:2048,tetris:1500},21,30],['demo-yuki','Demo Yuki',5,{quiz:10,reaction:188,typing:102},0,4],['demo-sora','Demo Sora',0,{dino:2400,stack:40,suika:3300,mines:61},5,9],
  ['demo-x1','Neko',1,{snake:22,tetris:900},1,2],['demo-x2','Hiro',3,{flappy:12,wordle:4,dino:700},0,3],['demo-x3','Mika',5,{clicker:140,breakout:400},2,6]];
 const lb=[],st=[];P.forEach(([did,name,av,games,streak,best])=>{Object.entries(games).forEach(([game,score])=>lb.push({game,user_id:did,discord_id:did,username:name,avatar_url:`https://cdn.discordapp.com/embed/avatars/${av}.png`,score}));st.push({user_id:did,streak,best,last_day:new Date().toISOString().slice(0,10),username:name,avatar_url:`https://cdn.discordapp.com/embed/avatars/${av}.png`})});
 return{lb,st}}
let gcache=null;
async function loadGames(){if(gcache)return gcache;
 let lb=[],st=[];const rname={};
 if(A.DEMO)({lb,st}=demoGames());
 else if(A.sb){const [a,b]=await Promise.all([A.sb.from('leaderboard').select('game,user_id,discord_id,username,avatar_url,score').limit(5000),A.sb.from('streaks').select('*').limit(5000),A.loadMembers(),
   /* avatar e nomi più recenti dai voti del catalogo (se non già caricati) */
   cache?null:A.sb.from('media_ratings').select('discord_id,username,avatar_url,updated_at').order('updated_at',{ascending:false}).limit(5000).then(r=>{(r.data||[]).forEach(x=>{A.addAv(x.discord_id,x.avatar_url,2);const d=String(x.discord_id||'');if(d&&x.username&&!rname[d])rname[d]=x.username})},()=>{})]);
  lb=a.data||[];st=b.data||[];if(cache)byUser(cache).forEach((L,d)=>rname[d]=lastName(L))}
 const byGame={};lb.forEach(r=>(byGame[r.game]=byGame[r.game]||[]).push(r));
 Object.entries(byGame).forEach(([g,L])=>L.sort((x,y)=>ASC.has(g)?x.score-y.score:y.score-x.score).forEach((r,i)=>r.rank=i+1));
 const users=new Map(),uid2did={};
 lb.forEach(r=>{const did=String(r.discord_id||'');if(!did)return;uid2did[r.user_id]=did;const u=users.get(did)||{did,uid:r.user_id,name:r.username,avatar:r.avatar_url,rec:[],streak:0,bestStreak:0};u.rec.push({game:r.game,score:r.score,rank:r.rank});users.set(did,u)});
 st.forEach(r=>{const did=uid2did[r.user_id];if(!did)return;const u=users.get(did);const d=(Date.now()-new Date(r.last_day+'T00:00:00'))/864e5;u.streak=d<2?(r.streak||0):0;u.bestStreak=Math.max(u.streak,+(r.best||r.best_streak||r.max_streak||0)||0,r.streak||0)});
 /* streak (prio 3) e punteggi (prio 4): indirizzi salvati quando si è giocato, possono essere vecchi */
 st.forEach(r=>A.addAv(uid2did[r.user_id],r.avatar_url,3));lb.forEach(r=>A.addAv(r.discord_id,r.avatar_url,4));
 users.forEach(u=>{u.name=A.nameOf(u.did,rname[u.did]||u.name);u.avatar=A.avList(u.did)[0]});
 users.forEach(u=>{u.rec.sort((a,b)=>a.rank-b.rank);u.points=points(u.rec,u.streak);u.firsts=u.rec.filter(r=>r.rank===1).length;u.podiums=u.rec.filter(r=>r.rank<=3).length;u.best=Object.fromEntries(u.rec.map(r=>[r.game,r.score]))});
 const ranked=[...users.values()].sort((a,b)=>b.points-a.points||b.firsts-a.firsts);ranked.forEach((u,i)=>u.pos=i+1);
 return gcache={users,ranked,byGame}}

/* ---------- profilo personalizzato (bio, tema, decorazioni equipaggiate) ---------- */
const DEMO_PROFILES={'demo-demo':{bio:'Qui per gli anime, le serie e per battere tutti a Snake. Frieren > tutto.',theme:{banner:'galaxy'},equipped:{frame:'fr_neon',effect:'fx_rainbow',badges:['b_streak7','b_games5']}},
 'demo-aki':{bio:'Frieren è la risposta a tutto. Main Tetris.',theme:{accent:'#ff4d8d',bg:'grad',banner:'aurora',frame:'ring',font:'serif'},equipped:{frame:'fr_sakura',effect:'fx_glow',badges:['b_first','b_streak7']}},
 'demo-kai':{bio:'Shonen, Valorant e caffè.',theme:{accent:'#22d3ee',bg:'pattern',banner:'circuit',frame:'square',font:'pixel'},equipped:{frame:'fr_neon',effect:'fx_rainbow',badges:['b_first','b_points500','b_streak7']}},
 'demo-sora':{bio:'',theme:{accent:'#f59e0b',bg:'grad',banner:'sunset'},equipped:{badges:['b_first']}}};
let pcache=null;
async function loadProfiles(){if(pcache)return pcache;const m=new Map();
 if(A.DEMO){Object.entries(DEMO_PROFILES).forEach(([k,v])=>m.set(k,v));try{const me=JSON.parse(localStorage.demo_profile||'null');if(me)m.set('demo-demo',me)}catch(e){}return pcache=m}
 if(A.sb){const {data,error}=await A.sb.from('site_profiles').select('user_id,discord_id,bio,theme,equipped').limit(5000);if(!error)(data||[]).forEach(r=>r.discord_id&&m.set(String(r.discord_id),r))}
 return pcache=m}
async function saveProfile(patch){const did=A.DEMO?'demo-demo':(A.user?A.profile(A.user).discord:'');const cur=(await loadProfiles()).get(did)||{};const row={bio:cur.bio||'',theme:cur.theme||{},equipped:cur.equipped||{},...patch};
 if(A.DEMO){localStorage.demo_profile=JSON.stringify(row);pcache.set(did,row);return null}
 if(!A.sb||!A.user)return{message:'login'};
 const {error}=await A.sb.from('site_profiles').upsert({bio:row.bio,theme:row.theme,equipped:row.equipped,updated_at:new Date().toISOString()},{onConflict:'user_id'});
 if(!error)pcache.set(did,{...cur,...row});return error}

/* ---------- cerca membri ---------- */
/* tutti i membri conosciuti (server + chi ha votato/giocato), con compatibilità rispetto a chi guarda */
async function members(all){const map=new Map();const add=(did,name,avatar)=>{did=String(did||'');if(!did)return;const o=map.get(did)||{did,name:'',avatar:''};o.name=o.name||A.clean(name||'');map.set(did,o)};
 if(!A.DEMO){const mem=await A.loadMembers();Object.entries(mem).forEach(([id,m])=>{if(m.in_server!==false&&m.nick)add(id,m.nick,m.avatar)})}
 all.forEach(r=>add(r.discord_id,r.username,r.avatar_url));
 const g=await loadGames();g.users.forEach(u=>add(u.did,u.name,u.avatar));
 map.forEach(o=>{o.avatar=A.avList(o.did)[0]});return[...map.values()]}
function searchMembers(list,all,viewer,term,max=8){const t=String(term||'').trim().toLowerCase();if(!t)return[];const M=byUser(all),mine=M.get(viewer)||[];
 return list.filter(m=>m.did!==viewer&&m.name.toLowerCase().includes(t)).map(m=>{const c=viewer?compare(mine,M.get(m.did)||[]):{n:0,pct:null};return{...m,n:c.n,pct:c.pct,starts:m.name.toLowerCase().startsWith(t)}})
  .sort((a,b)=>b.starts-a.starts||(b.n?1:0)-(a.n?1:0)||(b.pct||0)-(a.pct||0)||a.name.localeCompare(b.name)).slice(0,max)}

window.STASKYS_SOCIAL={MIN_VOTES,WEIGHT_M,loadAll,reset:()=>{cache=null;pcache=null},top10,saveTop10,compare,label,similar,byUser,ranking,loadRanking,DEMO_ME:'demo-demo',
 ASC,GAME_NAMES,points,loadGames,loadProfiles,saveProfile,members,searchMembers};
})();
