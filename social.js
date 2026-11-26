/* Staskys — Fase 2: Top 10, compatibilità tra profili, membri simili, classifica per media voti.
   Funziona con i dati veri (Supabase) oppure con i dati DEMO (?demo=1), chiaramente segnati. */
(function(){
const A=window.STASKYS;
const MIN_VOTES=2; /* voti minimi perché un titolo entri in classifica */
const K=(r)=>r.kind+':'+r.media_id;

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
 incep:['movie','tm27205','Inception',2010,'https://image.tmdb.org/t/p/w342/5QHWgqaBxZI1eM5e3YhyKzY5o3z.jpg']};
/* voto (numero), 'c' = in corso senza voto, 'v' = voglio vederlo; "9c" = voto 9 e in corso */
const U={
 demo:['Membro demo',2,'fr10 aot9 jjk9 csm8 spy7c op:v sl7 ds6 mc9c er10 zelda9 rl8 hades8 val5 hk:v dune9 inter10 yn9 spirit10 para8 incep9 opp:v'],
 aki:['Demo Aki',1,'fr10 jjk9 csm9 aot10 ds6 sl6 op8 er10 zelda10 hades9 mc8 inter10 yn9 spirit9 incep9 dune8'],
 rin:['Demo Rin',3,'fr9 jjk7 csm6 spy8 aot8 nar7 mc7 rl9 val7 er8 dune8 inter8 yn10 para9 spirit8'],
 kai:['Demo Kai',4,'fr6 jjk10 csm10 ds9 sl10 nar9 val10 fn9 rl8 er7 dune10 opp9 incep10 inter7'],
 yuki:['Demo Yuki',5,'fr4 jjk5 spy10 ds10 sl3 aot5 fn10 mc5 val9 yn6 spirit7 para4 incep5 dune5'],
 sora:['Demo Sora',0,'aot10 op10 nar10 csm5 fr9 hk9 hades10 zelda8 er9 para10 opp8 spirit9 inter9']};
const DEMO_TOP={anime:['fr','aot','jjk','csm','spy','sl','ds']}; /* top 10 personalizzata del profilo demo */
function demoRows(){const rows=[];let t=0;
 for(const [id,[name,av,list]] of Object.entries(U))list.split(' ').forEach(tok=>{const m=tok.match(/^(\w+?):?(\d+)?([cv])?$/);const [kind,media_id,title,year,cover]=T[m[1]];
  const rating=m[2]?+m[2]:null,status=m[3]==='c'?'in_corso':m[3]==='v'?'voglio':'visto';
  rows.push({discord_id:'demo-'+id,username:name,avatar_url:`https://cdn.discordapp.com/embed/avatars/${av}.png`,kind,media_id,title,year,cover,rating,status,updated_at:new Date(Date.UTC(2026,10,1+(t++%25))).toISOString(),top_pos:null})});
 let saved=null;try{saved=JSON.parse(localStorage.demo_top10||'null')}catch(e){}
 const top=saved||Object.fromEntries(Object.entries(DEMO_TOP).map(([k,ids])=>[k,ids.map(x=>T[x][1])]));
 rows.filter(r=>r.discord_id==='demo-demo').forEach(r=>{const i=(top[r.kind]||[]).indexOf(r.media_id);r.top_pos=i>=0?i+1:null});
 return rows}

/* ---------- caricamento ---------- */
let cache=null;
async function loadAll(){if(cache)return cache;
 if(A.DEMO)return cache=demoRows();
 if(!A.sb)return cache=[];
 const cols='discord_id,user_id,username,avatar_url,kind,media_id,title,cover,year,rating,status,updated_at';
 let r=await A.sb.from('media_ratings').select(cols+',top_pos').limit(10000);
 if(r.error)r=await A.sb.from('media_ratings').select(cols).limit(10000); /* prima di fase2-top10.sql */
 return cache=(r.data||[])}
function reset(){cache=null}

/* ---------- Top 10 ---------- */
/* ordine scelto dall'utente (top_pos), poi completata coi voti più alti */
function top10(rows,kind){const L=rows.filter(r=>r.kind===kind);
 const pinned=L.filter(r=>r.top_pos).sort((a,b)=>a.top_pos-b.top_pos);
 const custom=pinned.length>0;
 const rest=custom?[]:L.filter(r=>r.rating).sort((a,b)=>b.rating-a.rating||String(b.updated_at).localeCompare(a.updated_at));
 return{list:(custom?pinned:rest).slice(0,10),custom}}
async function saveTop10(kind,ids){
 if(A.DEMO){let s={};try{s=JSON.parse(localStorage.demo_top10||'null')||Object.fromEntries(Object.entries(DEMO_TOP).map(([k,v])=>[k,v.map(x=>T[x][1])]))}catch(e){}s[kind]=ids;localStorage.demo_top10=JSON.stringify(s);reset();return null}
 const {error}=await A.sb.rpc('set_top10',{p_kind:kind,p_ids:ids});reset();return error}

/* ---------- compatibilità ---------- */
/* titoli votati da entrambi; punteggio = quanto sono vicini i voti (0–100),
   avvicinato al 50% quando i titoli in comune sono pochi (così 1 solo titolo non fa "100%") */
function compare(aRows,bRows){const B=new Map(bRows.filter(r=>r.rating).map(r=>[K(r),r]));
 const shared=aRows.filter(r=>r.rating&&B.has(K(r))).map(r=>{const o=B.get(K(r));return{kind:r.kind,media_id:r.media_id,title:r.title,cover:r.cover,a:r.rating,b:o.rating,d:Math.abs(r.rating-o.rating)}});
 const n=shared.length;if(!n)return{n:0,pct:null,shared,agree:[],differ:[]};
 const raw=100*(1-shared.reduce((s,x)=>s+x.d,0)/n/9),k=3,pct=Math.round((raw*n+50*k)/(n+k));
 const agree=shared.slice().sort((x,y)=>x.d-y.d||(y.a+y.b)-(x.a+x.b)).filter(x=>x.d<=1).slice(0,5);
 const differ=shared.slice().sort((x,y)=>y.d-x.d||(y.a+y.b)-(x.a+x.b)).filter(x=>x.d>=3).slice(0,5);
 return{n,pct,shared,agree,differ}}
function label(p){return p>=85?['soulmate','Soulmate']:p>=72?['great','Great match']:p>=60?['good','Good match']:null}
function byUser(rows){const m=new Map();rows.forEach(r=>{const id=String(r.discord_id||'');if(!id)return;if(!m.has(id))m.set(id,[]);m.get(id).push(r)});return m}
/* membri più compatibili con did (servono almeno 3 titoli in comune) */
function similar(rows,did,max=5){const M=byUser(rows),mine=M.get(did)||[];const out=[];
 M.forEach((L,id)=>{if(id===did)return;const c=compare(mine,L);if(c.n>=3&&label(c.pct))out.push({did:id,name:L[0].username,avatar:L[0].avatar_url,...c,label:label(c.pct)})});
 return out.sort((a,b)=>b.pct-a.pct||b.n-a.n).slice(0,max)}

/* ---------- classifica per media voti ---------- */
function ranking(rows,kind,min=MIN_VOTES){const m=new Map();rows.filter(r=>r.kind===kind&&r.rating).forEach(r=>{const k=K(r);const o=m.get(k)||{kind:r.kind,media_id:r.media_id,title:r.title,cover:r.cover,year:r.year,sum:0,votes:0};o.sum+=r.rating;o.votes++;m.set(k,o)});
 return [...m.values()].filter(o=>o.votes>=min).map(o=>({...o,avg_rating:Math.round(o.sum/o.votes*10)/10})).sort((a,b)=>b.avg_rating-a.avg_rating||b.votes-a.votes)}
async function loadRanking(kind){
 if(A.DEMO)return ranking(await loadAll(),kind);
 if(!A.sb)return[];
 const {data,error}=await A.sb.from('media_avg').select('kind,media_id,title,cover,year,avg_rating,votes').eq('kind',kind).gte('votes',MIN_VOTES).order('avg_rating',{ascending:false}).order('votes',{ascending:false}).limit(50);
 return error?ranking(await loadAll(),kind):(data||[]).map(r=>({...r,avg_rating:+r.avg_rating}))}

window.STASKYS_SOCIAL={MIN_VOTES,loadAll,reset,top10,saveTop10,compare,label,similar,byUser,ranking,loadRanking,DEMO_ME:'demo-demo'};
})();
