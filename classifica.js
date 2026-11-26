/* Staskys — Classifica generale: titoli con la media voti più alta (media_avg), per categoria */
(function(){
const A=window.STASKYS,S=window.STASKYS_SOCIAL,E=A.E,q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const P=new URLSearchParams(location.search);let kind=A.KINDS[P.get('tipo')]?P.get('tipo'):'anime',seq=0;
q('#minv').textContent=S.MIN_VOTES;
if(A.DEMO){q('main').insertAdjacentHTML('afterbegin','<div class="demo-ribbon">DEMO · classifica di esempio con voti finti</div>');q('#tocat').href='catalogo.html?demo=1'}
async function render(){const my=++seq,box=q('#rank');box.innerHTML='<div class="rk-list">'+Array.from({length:6},()=>'<div class="rk-row sk"></div>').join('')+'</div>';
 const L=await S.loadRanking(kind);if(my!==seq)return;
 if(!L.length){box.innerHTML=`<div class="cempty"><p><b>Ancora nessun titolo in classifica.</b><br><span class="muted">Appena almeno ${S.MIN_VOTES} membri votano lo stesso titolo nel <a href="catalogo.html?tipo=${kind}">catalogo</a>, compare qui.</span></p></div>`;return}
 const [a,b,c]=L,podium=[b,a,c].filter(Boolean);
 box.innerHTML=`<div class="podium">${podium.map(r=>{const n=L.indexOf(r)+1;return`<div class="pod p${n}"><span class="cv">${r.cover?`<img src="${E(r.cover)}" alt="" loading="lazy">`:''}<b class="pod-n">${n}</b></span><b class="pod-t">${E(r.title)}</b><span class="pod-a">${r.avg_rating.toFixed(1)}<small>/10</small></span><small class="muted">${r.votes} voti</small></div>`}).join('')}</div>
 ${L.length>3?`<ol class="rk-list" start="4">${L.slice(3).map((r,i)=>`<li class="rk-row"><span class="rk-n">${i+4}</span><span class="cv xs">${r.cover?`<img src="${E(r.cover)}" alt="" loading="lazy">`:''}</span><span class="rk-t"><b>${E(r.title)}</b><small>${[r.year,r.votes+' voti'].filter(Boolean).join(' · ')}</small></span><span class="rk-bar"><i style="width:${r.avg_rating*10}%"></i></span><span class="rk-a">${r.avg_rating.toFixed(1)}</span></li>`).join('')}</ol>`:''}`}
qa('#rtabs button').forEach(b=>{b.classList.toggle('active',b.dataset.kind===kind);b.onclick=()=>{kind=b.dataset.kind;qa('#rtabs button').forEach(x=>x.classList.toggle('active',x===b));q('#tocat').href='catalogo.html?'+(A.DEMO?'demo=1&':'')+'tipo='+kind;render()}});
A.ready.then(render);
})();
