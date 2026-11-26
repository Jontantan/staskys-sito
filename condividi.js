/* Staskys — UPDATE 3: "Condividi" sul passaporto → immagine verticale del profilo (storia Instagram / Discord).
   Corta = solo passaporto (1080×1350) · Completa = passaporto + Top 5 (1080×1920).
   Scarica il PNG oppure, sul telefono, apre la condivisione (Web Share API). Tutto nel browser, niente server. */
(function(){
const A=window.STASKYS,S=window.STASKYS_SOCIAL,D=window.STASKYS_DECO,E=A.E,q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const W=1080;
/* colori dei banner del sito (disegni originali, come nel CSS) */
const BAN={aurora:['#0f766e','#22d3ee','#a78bfa'],sunset:['#7c2d12','#f97316','#f43f5e'],ocean:['#0c4a6e','#0ea5e9','#22d3ee'],sakura:['#831843','#f472b6','#fbcfe8'],circuit:['#052e16','#16a34a','#22d3ee'],galaxy:['#1e1b4b','#7c3aed','#db2777'],ember:['#450a0a','#dc2626','#f59e0b'],none:['#111','#1c1c22','#111']};
const FRAME={fr_pixel:'#a3e635',fr_sakura:'#f9a8d4',fr_neon:'#22d3ee',fr_orbit:'#a78bfa',fr_flame:'#f97316',fr_crown:'#fbbf24'};
/* immagini esterne con CORS; il ?stk=1 evita la copia in cache caricata senza CORS dalla pagina */
const img=src=>new Promise(ok=>{if(!src)return ok(null);const i=new Image();i.crossOrigin='anonymous';i.onload=()=>ok(i);i.onerror=()=>ok(null);
 i.src=/^https?:\/\//.test(src)&&!src.startsWith(location.origin)?src+(src.includes('?')?'&':'?')+'stk=1':src});
async function firstImg(list){for(const s of list){const i=await img(s);if(i)return i}return null}
function cover(x,i,X,Y,w,h){const r=Math.max(w/i.width,h/i.height),sw=w/r,sh=h/r;x.drawImage(i,(i.width-sw)/2,(i.height-sh)/2,sw,sh,X,Y,w,h)}
function rr(x,X,Y,w,h,r){x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath()}
function fit(x,t,max,size,weight='800',fam='Inter'){let s=size;do{x.font=`${weight} ${s}px ${fam},Inter,system-ui,sans-serif`;s-=2}while(x.measureText(t).width>max&&s>20);return t}
function ell(x,t,max){if(x.measureText(t).width<=max)return t;while(t.length>1&&x.measureText(t+'…').width>max)t=t.slice(0,-1);return t+'…'}
function crown(x,cx,cy,s){const g=x.createLinearGradient(cx,cy-s,cx,cy+s*.5);g.addColorStop(0,'#fff7c2');g.addColorStop(.45,'#fbbf24');g.addColorStop(1,'#b45309');
 x.save();x.shadowColor='rgba(251,191,36,.8)';x.shadowBlur=30;x.fillStyle=g;x.beginPath();x.moveTo(cx-s,cy+s*.45);x.lineTo(cx-s,cy-s*.35);x.lineTo(cx-s*.5,cy+s*.05);x.lineTo(cx,cy-s*.7);x.lineTo(cx+s*.5,cy+s*.05);x.lineTo(cx+s,cy-s*.35);x.lineTo(cx+s,cy+s*.45);x.closePath();x.fill();x.restore();
 x.fillStyle='#ef4444';x.beginPath();x.arc(cx,cy+s*.12,s*.13,0,7);x.fill();x.fillStyle='#38bdf8';[-.58,.58].forEach(o=>{x.beginPath();x.arc(cx+s*o,cy+s*.2,s*.09,0,7);x.fill()})}

async function draw(u,ctx,full){
 const H=full?1920:1350,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
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
 x.save();x.shadowColor=ring;x.shadowBlur=fr?60:30;x.fillStyle=ring;x.beginPath();x.arc(cx,cy,R+16,0,7);x.fill();x.restore();
 if(fr==='fr_orbit'||fr==='fr_neon'){x.strokeStyle='rgba(255,255,255,.7)';x.lineWidth=4;x.setLineDash([18,14]);x.beginPath();x.arc(cx,cy,R+34,0,7);x.stroke();x.setLineDash([])}
 x.fillStyle='#09090c';x.beginPath();x.arc(cx,cy,R+4,0,7);x.fill();
 const av=await firstImg(A.avList(u.did,u.avatar));x.save();x.beginPath();x.arc(cx,cy,R,0,7);x.clip();if(av)cover(x,av,cx-R,cy-R,R*2,R*2);else{x.fillStyle='#333';x.fill()}x.restore();
 if(fr==='fr_crown'||(u.stats.pos===1&&u.stats.points>0))crown(x,cx,cy-R-30,62);
 /* nome */
 let y=cy+R+92;x.textAlign='center';const nick=fit(x,u.nick,W-120,84,'900');
 const eff=u.equipped.effect;if(eff==='fx_gold'){g=x.createLinearGradient(cx-300,0,cx+300,0);g.addColorStop(0,'#fde68a');g.addColorStop(.5,'#f59e0b');g.addColorStop(1,'#fde68a');x.fillStyle=g}
 else if(eff==='fx_rainbow'){g=x.createLinearGradient(cx-350,0,cx+350,0);['#f43f5e','#f59e0b','#84cc16','#22d3ee','#8b5cf6'].forEach((col,i)=>g.addColorStop(i/4,col));x.fillStyle=g}else x.fillStyle='#fff';
 if(eff==='fx_glow'){x.shadowColor=acc;x.shadowBlur=30}x.fillText(nick,cx,y);x.shadowBlur=0;
 /* badge */
 const bad=(u.equipped.badges||[]).map(id=>D.byId[id]).filter(Boolean);y+=78;
 if(bad.length){x.font='52px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';const bw0=84,bx=cx-(bad.length-1)*bw0/2;bad.forEach((b,i)=>{rr(x,bx+i*bw0-36,y-38,72,72,20);x.fillStyle='rgba(255,255,255,.08)';x.fill();x.fillStyle='#fff';x.fillText(b.icona,bx+i*bw0,y+2)});y+=66}
 x.font='500 32px Inter,system-ui,sans-serif';x.fillStyle='rgba(255,255,255,.62)';const since=u.joined?new Date(u.joined).toLocaleDateString('it-IT',{month:'long',year:'numeric'}):'';
 x.fillText(ell(x,[u.username?'@'+u.username:'',since?'nel server da '+since:''].filter(Boolean).join(' · ')||'Membro di Staskys',W-120),cx,y);
 if(u.bio){y+=54;x.font='italic 500 30px Inter,system-ui,sans-serif';x.fillStyle='rgba(255,255,255,.8)';x.fillText(ell(x,'“'+u.bio+'”',W-140),cx,y)}
 /* numeri */
 const rated=u.ratings.filter(A.hasR),avg=rated.length?rated.reduce((a,r)=>a+ +r.rating,0)/rated.length:null;
 const ST=[['Titoli votati',String(rated.length)],['Media voti',avg==null?'–':A.fmtR(Math.round(avg*10)/10)],['Punti',Number(u.stats.points||0).toLocaleString('it-IT')],['Classifica',u.stats.pos?'#'+u.stats.pos:'–']];
 y+=60;const bw=(W-96-36)/2,bh=150;
 ST.forEach(([l,v],i)=>{const X=48+(i%2)*(bw+36),Y=y+Math.floor(i/2)*(bh+28);rr(x,X,Y,bw,bh,28);x.fillStyle='rgba(255,255,255,.07)';x.fill();x.strokeStyle='rgba(255,255,255,.12)';x.lineWidth=2;x.stroke();
  x.textAlign='left';x.fillStyle='rgba(255,255,255,.6)';x.font='600 28px Inter,system-ui,sans-serif';x.fillText(l.toUpperCase(),X+32,Y+46);x.fillStyle='#fff';x.font='900 64px Inter,system-ui,sans-serif';x.fillText(v,X+32,Y+108)});
 y+=bh*2+28;x.textAlign='center';
 /* Top 5 */
 if(full){const L=S.top10(u.ratings,ctx.kind).list.slice(0,5),K=A.KINDS[ctx.kind];y+=70;
  x.fillStyle='#fff';x.font='800 40px Inter,system-ui,sans-serif';x.fillText(`Top 5 ${K.t}`,cx,y);y+=40;
  const cw=180,ch=270,gap=(W-96-cw*5)/4,cv=await Promise.all(L.map(r=>img(r.cover)));
  for(let i=0;i<5;i++){const X=48+i*(cw+gap),r=L[i];rr(x,X,y,cw,ch,18);x.fillStyle='rgba(255,255,255,.06)';x.fill();
   if(r&&cv[i]){x.save();rr(x,X,y,cw,ch,18);x.clip();cover(x,cv[i],X,y,cw,ch);x.restore()}
   if(r){x.fillStyle=i===0?'#fbbf24':'rgba(0,0,0,.75)';x.beginPath();x.arc(X+30,y+30,24,0,7);x.fill();x.fillStyle=i===0?'#000':'#fff';x.font='900 26px Inter,system-ui,sans-serif';x.fillText(String(i+1),X+30,y+31);
    if(A.hasR(r)){rr(x,X+cw-74,y+ch-48,64,38,12);x.fillStyle='rgba(0,0,0,.78)';x.fill();x.fillStyle='#fff';x.font='800 24px Inter,system-ui,sans-serif';x.fillText(A.fmtR(r.rating),X+cw-42,y+ch-28)}
    x.fillStyle='rgba(255,255,255,.85)';x.font='600 22px Inter,system-ui,sans-serif';x.fillText(ell(x,r.title,cw),X+cw/2,y+ch+30)}}
  if(!L.length){x.fillStyle='rgba(255,255,255,.5)';x.font='500 28px Inter,system-ui,sans-serif';x.fillText('Ancora nessun voto in questa categoria',cx,y+ch/2)}}
 /* piede */
 x.textAlign='center';x.fillStyle='rgba(255,255,255,.9)';x.font='900 44px Inter,system-ui,sans-serif';x.fillText('staskys.it',cx,H-70);
 x.fillStyle='rgba(255,255,255,.45)';x.font='500 24px Inter,system-ui,sans-serif';x.fillText('Il mio passaporto sul server Staskys',cx,H-30);
 return new Promise(ok=>c.toBlob(b=>ok(b),'image/png'))}

function open(u,ctx){let full=true,blob=null,url='';
 let sh=q('#shsheet');if(!sh){document.body.insertAdjacentHTML('beforeend','<div class="csheet sh-sheet" id="shsheet" hidden><div class="csheet-in" role="dialog" aria-modal="true" aria-label="Condividi il profilo"></div></div>');sh=q('#shsheet')}
 const box=q('.csheet-in',sh),close=()=>{sh.classList.remove('show');setTimeout(()=>{sh.hidden=true;url&&URL.revokeObjectURL(url)},200);removeEventListener('keydown',esc)},esc=e=>{if(e.key==='Escape')close()};
 addEventListener('keydown',esc);sh.onclick=e=>{if(e.target===sh)close()};
 const name=`staskys-${String(u.nick).toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'profilo'}.png`;
 const render=async()=>{box.innerHTML=`<button class="cx" aria-label="Chiudi">×</button><p class="label">Condividi</p><h3 class="cz-h">Il ${u.isMe?'tuo':''} passaporto in un'immagine</h3>
  <div class="seg mini shseg"><button data-f="1" class="${full?'active':''}">Completa (con Top 5)</button><button data-f="0" class="${full?'':'active'}">Corta (solo passaporto)</button></div>
  <div class="shprev"><p class="muted small">Preparo l'immagine…</p></div>
  <div class="cs-act"><button class="btn" id="shgo" disabled>Condividi</button><button class="btn ghost" id="shdl" disabled>Scarica</button></div><p class="muted tiny">Formato verticale, perfetto per le storie di Instagram e per Discord.</p>`;
  q('.cx',box).onclick=close;qa('.shseg button',box).forEach(b=>b.onclick=()=>{full=b.dataset.f==='1';render()});
  try{blob=await draw(u,ctx,full)}catch(e){blob=null}
  const pv=q('.shprev',box);if(!pv)return;if(!blob){pv.innerHTML='<p class="imperr">Non sono riuscito a creare l\'immagine. Riprova.</p>';return}
  url&&URL.revokeObjectURL(url);url=URL.createObjectURL(blob);pv.innerHTML=`<img src="${url}" alt="Anteprima dell'immagine del profilo">`;
  const file=new File([blob],name,{type:'image/png'}),canShare=!!(navigator.canShare&&navigator.canShare({files:[file]}));
  const dl=()=>{const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove()};
  const go=q('#shgo',box),d=q('#shdl',box);go.disabled=d.disabled=false;if(!canShare)go.hidden=true;
  go.onclick=async()=>{try{await navigator.share({files:[file],title:'Il mio passaporto Staskys',text:'Guarda il mio profilo su staskys.it'})}catch(e){}};d.onclick=dl};
 render();sh.hidden=false;requestAnimationFrame(()=>sh.classList.add('show'))}
window.STASKYS_SHARE={open,draw};
})();
