/* Staskys — UPDATE 3: "Condividi" sul passaporto → immagine verticale del profilo (storia Instagram / Discord).
   PATCH 4.2: scegli tu cosa mettere nell'immagine (numeri e Top 5 di anime, giochi, film, serie, manga, libri: tutto o solo alcune)
   e copia il link diretto al profilo (staskys.it/u/nome).
   Scarica il PNG oppure, sul telefono, apre la condivisione (Web Share API). Tutto nel browser, niente server. */
(function(){
const A=window.STASKYS,S=window.STASKYS_SOCIAL,D=window.STASKYS_DECO,E=A.E,q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const W=1080;
/* colori dei banner del sito (disegni originali, come nel CSS) */
const BAN={aurora:['#0f766e','#22d3ee','#a78bfa'],sunset:['#7c2d12','#f97316','#f43f5e'],ocean:['#0c4a6e','#0ea5e9','#22d3ee'],sakura:['#831843','#f472b6','#fbcfe8'],circuit:['#052e16','#16a34a','#22d3ee'],galaxy:['#1e1b4b','#7c3aed','#db2777'],ember:['#450a0a','#dc2626','#f59e0b'],none:['#111','#1c1c22','#111']};
const FRAME={fr_pixel:'#a3e635',fr_sakura:'#f9a8d4',fr_neon:'#22d3ee',fr_orbit:'#a78bfa',fr_flame:'#f97316',fr_crown:'#fbbf24',fr_king:'#ff2d3d'};
/* immagini esterne con CORS; il ?stk=1 evita la copia in cache caricata senza CORS dalla pagina */
const img=src=>new Promise(ok=>{if(!src)return ok(null);const i=new Image();i.crossOrigin='anonymous';i.onload=()=>ok(i);i.onerror=()=>ok(null);
 i.src=/^https?:\/\//.test(src)&&!src.startsWith(location.origin)?src+(src.includes('?')?'&':'?')+'stk=1':src});
async function firstImg(list){for(const s of list){const i=await img(s);if(i)return i}return null}
function cover(x,i,X,Y,w,h){const r=Math.max(w/i.width,h/i.height),sw=w/r,sh=h/r;x.drawImage(i,(i.width-sw)/2,(i.height-sh)/2,sw,sh,X,Y,w,h)}
function rr(x,X,Y,w,h,r){x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath()}
function fit(x,t,max,size,weight='800',fam='Inter'){let s=size;do{x.font=`${weight} ${s}px ${fam},Inter,system-ui,sans-serif`;s-=2}while(x.measureText(t).width>max&&s>20);return t}
function ell(x,t,max){if(x.measureText(t).width<=max)return t;while(t.length>1&&x.measureText(t+'…').width>max)t=t.slice(0,-1);return t+'…'}
/* UPDATE 5: trono e mantello del Re di Staskys (stessi disegni originali di deco-fx.js) */
function gold(x,a,b,c,d){const g=x.createLinearGradient(a,b,c,d);g.addColorStop(0,'#fff3b0');g.addColorStop(.5,'#f5b82e');g.addColorStop(1,'#9a5b0c');return g}
function throne(x,cx,cy,R){const k=2*R*1.52/120,ox=cx-R-.52*R,oy=cy-R-.94*R;x.save();x.translate(ox,oy);x.scale(k,k);x.shadowColor='rgba(255,45,61,.7)';x.shadowBlur=30/k;
 const v=x.createLinearGradient(0,0,0,140);v.addColorStop(0,'#b91c3c');v.addColorStop(.55,'#7f1028');v.addColorStop(1,'#3b0614');const G=gold(x,0,0,120,140);
 const back=new Path2D('M20 138V62Q20 20 60 12Q100 20 100 62V138Z');x.fillStyle=v;x.fill(back);x.shadowBlur=0;x.strokeStyle=G;x.lineWidth=3.2;x.stroke(back);
 x.fillStyle=G;[[6,46],[103,46]].forEach(([a,b])=>{x.beginPath();x.roundRect?x.roundRect(a,b,11,92,4):x.rect(a,b,11,92);x.fill()});
 [[11.5,40],[108.5,40]].forEach(([a,b])=>{x.beginPath();x.arc(a,b,7,0,7);x.fill()});x.fill(new Path2D('M48 12Q54 2 60 1Q66 2 72 12Q66 9 60 10Q54 9 48 12Z'));
 x.fillStyle='#ff5fa2';const gem=new Path2D('M60 -6L66 3L60 12L54 3Z');x.fill(gem);x.strokeStyle='#fff3b0';x.lineWidth=1.2;x.stroke(gem);x.restore()}
function mantle(x,cx,cy,R){const k=2*R*1.44/120,ox=cx-R-.44*R,oy=cy+R+.62*R-56*k;x.save();x.translate(ox,oy);x.scale(k,k);
 const v=x.createLinearGradient(0,0,0,56);v.addColorStop(0,'#c8174a');v.addColorStop(1,'#4a0718');x.fillStyle=v;x.fill(new Path2D('M0 56Q4 22 30 12Q46 24 60 26Q74 24 90 12Q116 22 120 56Z'));
 x.lineCap='round';x.strokeStyle='#fbf7ef';x.lineWidth=7.5;x.stroke(new Path2D('M3 50Q8 22 30 14Q46 26 60 28Q74 26 90 14Q112 22 117 50'));
 x.fillStyle='#18181b';[[9,36],[17,24],[28,16.5],[41,22.5],[52,26],[68,26],[79,22.5],[92,16.5],[103,24],[111,36]].forEach(([a,b])=>x.fill(new Path2D(`M${a} ${b}l1.4 3.4h-2.8z`)));
 x.fillStyle=gold(x,54,25,66,37);x.beginPath();x.arc(60,31,5.2,0,7);x.fill();x.fillStyle='#c86cf5';x.beginPath();x.arc(60,31,2.6,0,7);x.fill();x.restore()}
function crown(x,cx,cy,s){const g=x.createLinearGradient(cx,cy-s,cx,cy+s*.5);g.addColorStop(0,'#fff7c2');g.addColorStop(.45,'#fbbf24');g.addColorStop(1,'#b45309');
 x.save();x.shadowColor='rgba(251,191,36,.8)';x.shadowBlur=30;x.fillStyle=g;x.beginPath();x.moveTo(cx-s,cy+s*.45);x.lineTo(cx-s,cy-s*.35);x.lineTo(cx-s*.5,cy+s*.05);x.lineTo(cx,cy-s*.7);x.lineTo(cx+s*.5,cy+s*.05);x.lineTo(cx+s,cy-s*.35);x.lineTo(cx+s,cy+s*.45);x.closePath();x.fill();x.restore();
 x.fillStyle='#ef4444';x.beginPath();x.arc(cx,cy+s*.12,s*.13,0,7);x.fill();x.fillStyle='#38bdf8';[-.58,.58].forEach(o=>{x.beginPath();x.arc(cx+s*o,cy+s*.2,s*.09,0,7);x.fill()})}

const KEYS=()=>Object.keys(A.KINDS);
/* link diretto al profilo: staskys.it/u/<nome utente Discord> (lo apre 404.html → profilo.html?u=…) */
function profileUrl(u){if(u.demo)return location.origin+location.pathname.replace(/[^/]*$/,'')+'profilo.html?demo=1';
 return 'https://staskys.it/u/'+encodeURIComponent(u.username||u.did)}
function layout(u,opts){const bad=(u.equipped.badges||[]).length,n=opts.kinds.length,small=n>2;
 const cw=small?150:180,ch=small?225:270,row=70+40+ch+50;
 let y=540-30+170+92+78+(bad?66:0)+(u.bio?54:0);if(opts.stats)y+=60+328;
 const need=y+n*row+170;return{H:Math.max(n?1920:1350,Math.ceil(need/10)*10),cw,ch}}
async function draw(u,ctx,opts){
 if(typeof opts==='boolean')opts={stats:true,kinds:opts?[ctx.kind]:[]};
 const {H,cw,ch}=layout(u,opts),c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
 try{await document.fonts.ready}catch(e){}
 const acc=getComputedStyle(q('.pass')||document.body).getPropertyValue('--c').trim()||u.theme.accent||'#8b5cf6';
 /* sfondo */
 x.fillStyle='#09090c';x.fillRect(0,0,W,H);let g=x.createRadialGradient(W/2,H*.42,50,W/2,H*.42,H*.8);g.addColorStop(0,acc);g.addColorStop(1,'transparent');x.globalAlpha=.28;x.fillStyle=g;x.fillRect(0,0,W,H);x.globalAlpha=1;
 /* banner */
 const BH=540,bk=(()=>{const b=u.theme.banner;if(b==='auto'||b==='discord')return u.banner?'discord':'none';return b})();
 let bimg=bk==='discord'?await img(u.banner):null;
 if(bimg)cover(x,bimg,0,0,W,BH);else{const C=BAN[bk]||BAN.none;g=x.createLinearGradient(0,0,W,BH);C.forEach((col,i)=>g.addColorStop(i/(C.length-1),col));x.fillStyle=g;x.fillRect(0,0,W,BH)}
 g=x.createLinearGradient(0,BH*.35,0,BH+4);g.addColorStop(0,'rgba(9,9,12,0)');g.addColorStop(1,'#09090c');x.fillStyle=g;x.fillRect(0,0,W,BH+4);
 /* logo in alto */
 const logo=await img('assets/icon.png');x.globalAlpha=.9;if(logo)x.drawImage(logo,48,44,64,64);x.font='800 34px Inter,system-ui,sans-serif';x.fillStyle='#fff';x.textBaseline='middle';x.fillText('Passaporto Staskys',128,77);x.globalAlpha=1;
 /* avatar + cornice */
 const cx=W/2,cy=BH-30,R=170,fr=u.equipped.frame,ring=FRAME[fr]||acc;
 if(fr==='fr_king')throne(x,cx,cy,R);
 x.save();x.shadowColor=ring;x.shadowBlur=fr?60:30;x.fillStyle=ring;x.beginPath();x.arc(cx,cy,R+16,0,7);x.fill();x.restore();
 if(fr==='fr_orbit'||fr==='fr_neon'){x.strokeStyle='rgba(255,255,255,.7)';x.lineWidth=4;x.setLineDash([18,14]);x.beginPath();x.arc(cx,cy,R+34,0,7);x.stroke();x.setLineDash([])}
 x.fillStyle='#09090c';x.beginPath();x.arc(cx,cy,R+4,0,7);x.fill();
 const av=await firstImg(A.avList(u.did,u.avatar));x.save();x.beginPath();x.arc(cx,cy,R,0,7);x.clip();if(av)cover(x,av,cx-R,cy-R,R*2,R*2);else{x.fillStyle='#333';x.fill()}x.restore();
 if(fr==='fr_king')mantle(x,cx,cy,R);
 else if(fr==='fr_crown'||(u.stats.pos===1&&u.stats.points>0))crown(x,cx,cy-R-30,62);
 /* nome */
 let y=cy+R+92;x.textAlign='center';const nick=fit(x,u.nick,W-120,84,'900');
 const eff=u.equipped.effect;if(eff==='fx_gold'){g=x.createLinearGradient(cx-300,0,cx+300,0);g.addColorStop(0,'#fde68a');g.addColorStop(.5,'#f59e0b');g.addColorStop(1,'#fde68a');x.fillStyle=g}
 else if(eff==='fx_rainbow'){g=x.createLinearGradient(cx-350,0,cx+350,0);['#f43f5e','#f59e0b','#84cc16','#22d3ee','#8b5cf6'].forEach((col,i)=>g.addColorStop(i/4,col));x.fillStyle=g}else x.fillStyle='#fff';
 if(eff==='fx_glow'){x.shadowColor=acc;x.shadowBlur=30}x.fillText(nick,cx,y);x.shadowBlur=0;
 /* badge */
 const bad=(u.equipped.badges||[]).map(id=>D.byId[id]).filter(Boolean);y+=78;
 if(bad.length){x.font='52px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';const bw0=84,bx=cx-(bad.length-1)*bw0/2;bad.forEach((b,i)=>{rr(x,bx+i*bw0-36,y-38,72,72,20);x.fillStyle='rgba(255,255,255,.08)';x.fill();x.fillStyle='#fff';x.fillText(b.icona,bx+i*bw0,y+2)});y+=66}
 x.font='500 32px Inter,system-ui,sans-serif';x.fillStyle='rgba(255,255,255,.62)';const since=u.joined?new Date(u.joined).toLocaleDateString('it-IT',{month:'long',year:'numeric'}):'';
 const roles=[u.siteRole&&u.siteRole.label,u.role].filter(Boolean).join(' · ');
 x.fillText(ell(x,[roles,u.username?'@'+u.username:'',since?'nel server da '+since:''].filter(Boolean).join(' · ')||'Membro di Staskys',W-120),cx,y);
 if(u.bio){y+=54;x.font='italic 500 30px Inter,system-ui,sans-serif';x.fillStyle='rgba(255,255,255,.8)';x.fillText(ell(x,'“'+u.bio+'”',W-140),cx,y)}
 /* numeri */
 if(opts.stats){const rated=u.ratings.filter(A.hasR),avg=rated.length?rated.reduce((a,r)=>a+ +r.rating,0)/rated.length:null;
  const ST=[['Titoli votati',String(rated.length)],['Media voti',avg==null?'–':A.fmtR(Math.round(avg*10)/10)],['Punti',Number(u.stats.points||0).toLocaleString('it-IT')],['Classifica',u.stats.pos?'#'+u.stats.pos:'–']];
  y+=60;const bw=(W-96-36)/2,bh=150;
  ST.forEach(([l,v],i)=>{const X=48+(i%2)*(bw+36),Y=y+Math.floor(i/2)*(bh+28);rr(x,X,Y,bw,bh,28);x.fillStyle='rgba(255,255,255,.07)';x.fill();x.strokeStyle='rgba(255,255,255,.12)';x.lineWidth=2;x.stroke();
   x.textAlign='left';x.fillStyle='rgba(255,255,255,.6)';x.font='600 28px Inter,system-ui,sans-serif';x.fillText(l.toUpperCase(),X+32,Y+46);x.fillStyle='#fff';x.font='900 64px Inter,system-ui,sans-serif';x.fillText(v,X+32,Y+108)});
  y+=bh*2+28;x.textAlign='center'}
 /* Top 5 delle sezioni scelte */
 for(const kind of opts.kinds){const L=S.top10(u.ratings,kind).list.slice(0,5),K=A.KINDS[kind];y+=70;
  x.fillStyle='#fff';x.font='800 40px Inter,system-ui,sans-serif';x.fillText(`Top 5 ${K.t}`,cx,y);y+=40;
  const gap=(W-96-cw*5)/4,cv=await Promise.all(L.map(r=>img(r.cover)));
  for(let i=0;i<5;i++){const X=48+i*(cw+gap),r=L[i];rr(x,X,y,cw,ch,18);x.fillStyle='rgba(255,255,255,.06)';x.fill();
   if(r&&cv[i]){x.save();rr(x,X,y,cw,ch,18);x.clip();cover(x,cv[i],X,y,cw,ch);x.restore()}
   if(r){x.fillStyle=i===0?'#fbbf24':'rgba(0,0,0,.75)';x.beginPath();x.arc(X+30,y+30,24,0,7);x.fill();x.fillStyle=i===0?'#000':'#fff';x.font='900 26px Inter,system-ui,sans-serif';x.fillText(String(i+1),X+30,y+31);
    if(A.hasR(r)){rr(x,X+cw-74,y+ch-48,64,38,12);x.fillStyle='rgba(0,0,0,.78)';x.fill();x.fillStyle='#fff';x.font='800 24px Inter,system-ui,sans-serif';x.fillText(A.fmtR(r.rating),X+cw-42,y+ch-28)}
    x.fillStyle='rgba(255,255,255,.85)';x.font='600 22px Inter,system-ui,sans-serif';x.fillText(ell(x,r.title,cw),X+cw/2,y+ch+30)}}
  if(!L.length){x.fillStyle='rgba(255,255,255,.5)';x.font='500 28px Inter,system-ui,sans-serif';x.fillText('Ancora nessun voto in questa categoria',cx,y+ch/2)}
  y+=ch+50}
 /* piede: link diretto al profilo */
 const link=u.demo?'staskys.it':'staskys.it/u/'+(u.username||u.did);
 x.textAlign='center';x.fillStyle='rgba(255,255,255,.9)';fit(x,link,W-120,44,'900');x.fillText(link,cx,H-70);
 x.fillStyle='rgba(255,255,255,.45)';x.font='500 24px Inter,system-ui,sans-serif';x.fillText('Il mio passaporto sul server Staskys',cx,H-30);
 return new Promise(ok=>c.toBlob(b=>ok(b),'image/png'))}

function open(u,ctx){let blob=null,url='',seq=0;
 const avail=KEYS().filter(k=>u.ratings.some(r=>r.kind===k));
 const sel={stats:true,kinds:new Set(avail.length?avail:[ctx.kind])};
 let sh=q('#shsheet');if(!sh){document.body.insertAdjacentHTML('beforeend','<div class="csheet sh-sheet" id="shsheet" hidden><div class="csheet-in" role="dialog" aria-modal="true" aria-label="Condividi il profilo"></div></div>');sh=q('#shsheet')}
 const box=q('.csheet-in',sh),close=()=>{sh.classList.remove('show');setTimeout(()=>{sh.hidden=true;url&&URL.revokeObjectURL(url)},200);removeEventListener('keydown',esc)},esc=e=>{if(e.key==='Escape')close()};
 addEventListener('keydown',esc);sh.onclick=e=>{if(e.target===sh)close()};
 const name=`staskys-${String(u.nick).toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'profilo'}.png`;
 const link=profileUrl(u),all=()=>KEYS().filter(k=>sel.kinds.has(k));
 const chips=()=>`<div class="shopts">
   <button class="shchip${sel.stats?' on':''}" data-s="stats" aria-pressed="${sel.stats}">📊 Numeri</button>
   ${(avail.length?avail:KEYS()).map(k=>`<button class="shchip${sel.kinds.has(k)?' on':''}" data-k="${k}" aria-pressed="${sel.kinds.has(k)}">${A.KINDS[k].icon} ${E(A.KINDS[k].t)}</button>`).join('')}</div>
   <div class="shquick"><button data-q="all">Tutto</button><button data-q="none">Solo passaporto</button></div>`;
 const shell=()=>{box.innerHTML=`<button class="cx" aria-label="Chiudi">×</button><p class="label">Condividi</p><h3 class="cz-h">Il ${u.isMe?'tuo ':''}passaporto</h3>
  <p class="label" style="margin-top:.6rem">Link diretto al profilo</p>
  <div class="shlink"><input id="shurl" readonly value="${E(link)}" aria-label="Link al profilo"><button class="btn sm" id="shcopy">Copia link</button></div>
  <p class="label">Cosa mettere nell'immagine</p><div id="shch">${chips()}</div>
  <div class="shprev"><p class="muted small">Preparo l'immagine…</p></div>
  <div class="cs-act"><button class="btn" id="shgo" disabled>Condividi</button><button class="btn ghost" id="shdl" disabled>Scarica</button></div><p class="muted tiny">Formato verticale, perfetto per le storie di Instagram e per Discord.</p>`;
  q('.cx',box).onclick=close;
  const cp=q('#shcopy',box),inp=q('#shurl',box);cp.onclick=async()=>{let ok=false;try{await navigator.clipboard.writeText(link);ok=true}catch(e){inp.select();try{ok=document.execCommand('copy')}catch(e2){}}
   cp.textContent=ok?'Copiato ✓':'Selezionato: copia tu';setTimeout(()=>{cp.textContent='Copia link'},1800)};
  inp.onfocus=()=>inp.select();bindChips()};
 const bindChips=()=>{const ch=q('#shch',box);
  qa('[data-s]',ch).forEach(b=>b.onclick=()=>{sel.stats=!sel.stats;redraw()});
  qa('[data-k]',ch).forEach(b=>b.onclick=()=>{const k=b.dataset.k;sel.kinds.has(k)?sel.kinds.delete(k):sel.kinds.add(k);redraw()});
  qa('[data-q]',ch).forEach(b=>b.onclick=()=>{if(b.dataset.q==='all'){sel.stats=true;(avail.length?avail:KEYS()).forEach(k=>sel.kinds.add(k))}else{sel.stats=false;sel.kinds.clear()}redraw()})};
 const redraw=()=>{q('#shch',box).innerHTML=chips();bindChips();render()};
 const render=async()=>{const my=++seq;const pv=q('.shprev',box),go=q('#shgo',box),d=q('#shdl',box);go.disabled=d.disabled=true;pv.classList.add('busy');
  try{blob=await draw(u,ctx,{stats:sel.stats,kinds:all()})}catch(e){blob=null}
  if(my!==seq||!q('.shprev',box))return;pv.classList.remove('busy');
  if(!blob){pv.innerHTML='<p class="imperr">Non sono riuscito a creare l\'immagine. Riprova.</p>';return}
  url&&URL.revokeObjectURL(url);url=URL.createObjectURL(blob);pv.innerHTML=`<img src="${url}" alt="Anteprima dell'immagine del profilo">`;
  const file=new File([blob],name,{type:'image/png'}),canShare=!!(navigator.canShare&&navigator.canShare({files:[file]}));
  const dl=()=>{const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove()};
  go.disabled=d.disabled=false;if(!canShare)go.hidden=true;
  go.onclick=async()=>{try{await navigator.share({files:[file],title:'Il mio passaporto Staskys',text:'Guarda il mio profilo su Staskys: '+link})}catch(e){}};d.onclick=dl};
 shell();render();sh.hidden=false;requestAnimationFrame(()=>sh.classList.add('show'))}
window.STASKYS_SHARE={open,draw,profileUrl};
})();
