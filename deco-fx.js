/* Staskys — UPDATE 4: disegni animati delle decorazioni (cornici, sfondi). Disegni ORIGINALI in CSS/SVG (stili in update4.css).
   Leggeri: solo transform/opacity, pochi elementi; con "riduci movimento" del sistema restano fermi. */
(function(D){if(!D)return;
 let seed=7;const rnd=()=>(seed=(seed*9301+49297)%233280)/233280;
 const rep=(n,f)=>{let o='';for(let i=0;i<n;i++)o+=f(i);return o};
 const st=o=>Object.entries(o).map(([k,v])=>`--${k}:${v}`).join(';');
 const P=(n,cls,f)=>{seed=n*31+cls.length*7;return rep(n,i=>`<i class="${cls}" style="${st(f(i))}"></i>`)};
 const r2=(a,b)=>(a+rnd()*(b-a)).toFixed(2);
 /* corona originale (SVG) per Corona e Re di Staskys */
 const crown=(id,c1,c2,c3,gem)=>`<i class="dx crw"><svg viewBox="0 0 64 44" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset=".5" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></linearGradient></defs><path d="M4 40V14l14 12L32 3l14 23 14-12v26z" fill="url(#${id})" stroke="${c1}" stroke-width="1.6" stroke-linejoin="round"/><rect x="4" y="35" width="56" height="6" rx="2" fill="${c3}" opacity=".7"/><circle class="gem" cx="32" cy="27" r="4.2" fill="${gem}"/><circle class="gem g2" cx="17" cy="31" r="2.8" fill="#fff"/><circle class="gem g3" cx="47" cy="31" r="2.8" fill="#fff"/><circle cx="4" cy="14" r="3" fill="${c1}"/><circle cx="32" cy="3" r="3.2" fill="${c1}"/><circle cx="60" cy="14" r="3" fill="${c1}"/></svg></i>`;
 const FR={
  fr_pixel:()=>'<i class="dx px"></i><i class="dx px2"></i>'+rep(4,i=>`<i class="dx pxs" style="--i:${i}"></i>`),
  fr_sakura:()=>'<i class="dx skr"></i>'+rep(7,i=>`<i class="dx pet" style="--i:${i}"></i>`),
  fr_neon:()=>'<i class="dx tube"></i><i class="dx tube t2"></i><i class="dx trail"></i>',
  fr_orbit:()=>'<i class="dx oring"></i><i class="dx o1"><b></b></i><i class="dx o2"><b></b></i><i class="dx o3"><b></b></i>',
  fr_flame:()=>'<i class="dx fcore"></i>'+rep(14,i=>`<i class="dx fl" style="--i:${i}"></i>`)+rep(6,i=>`<i class="dx fsp" style="--i:${i}"></i>`),
  fr_crown:()=>'<i class="dx rays"></i><i class="dx halo"></i><i class="dx gring"></i><i class="dx gring in"></i>'+rep(6,i=>`<i class="dx stl" style="--i:${i}"></i>`)+crown('cg-c','#fff7c2','#fbbf24','#a16207','#ef4444'),
  fr_king:()=>'<i class="dx rays"></i><i class="dx rays r2"></i><i class="dx halo"></i><i class="dx kring"></i><i class="dx kring in"></i>'+rep(10,i=>`<i class="dx emb" style="--i:${i}"></i>`)+rep(6,i=>`<i class="dx stl" style="--i:${i}"></i>`)+crown('cg-k','#ffe4e6','#ef4444','#7f1d1d','#fde047')
 };
 D.frameHTML=id=>FR[id]?FR[id]():'';
 const CH='アカサタナハマヤラワ01234567ｦｱｳｴｵｶｷｸｹｺ';
 const BG={
  bg_ocean:()=>'<i class="sc-ray"></i><i class="sc-ray r2"></i><i class="sc-ray r3"></i>'+P(9,'sc-bub',i=>({x:r2(4,96)+'%',s:r2(4,12)+'px',d:r2(0,8)+'s',t:r2(6,11)+'s'}))+'<i class="sc-jel"></i><i class="sc-jel j2"></i>',
  bg_stars:()=>'<i class="sc-moon"></i><i class="sc-st"></i><i class="sc-st s2"></i><i class="sc-shoot"></i><i class="sc-shoot h2"></i>',
  bg_snow:()=>'<i class="sc-sn"></i><i class="sc-sn n2"></i><i class="sc-sn n3"></i><i class="sc-glow"></i>',
  bg_neon:()=>'<i class="sc-hz"></i><i class="sc-city"></i><i class="sc-win"></i><i class="sc-win w2"></i><i class="sc-rain"></i>',
  bg_lava:()=>P(5,'sc-lb',i=>({x:r2(-10,80)+'%',y:r2(20,85)+'%',d:r2(0,6)+'s',s:r2(.8,1.4)}))+'<i class="sc-ck"></i><i class="sc-ck c2"></i><i class="sc-vig"></i>',
  bg_ember:()=>'<i class="sc-eglow"></i>'+P(14,'sc-e',i=>({x:r2(2,98)+'%',s:r2(2,5)+'px',d:r2(0,7)+'s',t:r2(4,8)+'s',w:r2(-30,30)+'px'})),
  bg_petals:()=>P(11,'sc-pt',i=>({x:r2(0,100)+'%',s:r2(7,13)+'px',d:r2(0,10)+'s',t:r2(7,13)+'s',w:r2(20,70)+'px'})),
  bg_galaxy:()=>'<i class="sc-neb"></i><i class="sc-neb n2"></i><i class="sc-st"></i><i class="sc-st s2"></i><i class="sc-comet"></i>',
  bg_storm:()=>'<i class="sc-cl"></i><i class="sc-cl c2"></i><i class="sc-cl c3"></i><i class="sc-rain light"></i><i class="sc-bolt"></i><i class="sc-flash"></i>',
  bg_autumn:()=>'<i class="sc-sun"></i>'+P(11,'sc-lf',i=>({x:r2(0,100)+'%',s:r2(9,15)+'px',d:r2(0,10)+'s',t:r2(7,12)+'s',w:r2(30,90)+'px',h:Math.round(rnd()*40)+'deg'})),
  bg_retro:()=>'<i class="sc-rsun"></i><i class="sc-mtn"></i><i class="sc-grid"><b></b></i>',
  bg_code:()=>{seed=99;return rep(12,i=>`<i class="sc-col" style="${st({x:(i*8.4+ +r2(0,3)).toFixed(1)+'%',d:r2(0,6)+'s',t:r2(4,9)+'s',o:r2(.45,1)})}">${rep(18,()=>CH[Math.floor(rnd()*CH.length)])}</i>`)},
  bg_fireworks:()=>P(6,'sc-fw',i=>({x:r2(8,92)+'%',y:r2(10,60)+'%',d:(i*1.15).toFixed(2)+'s',c:['#f472b6','#facc15','#22d3ee','#a3e635','#c084fc','#fb923c'][i],s:r2(.7,1.2)}))+'<i class="sc-glowb"></i>',
  bg_zen:()=>'<i class="sc-zmoon"></i><i class="sc-hill"></i><i class="sc-branch"></i><i class="sc-lan"></i><i class="sc-lan l2"></i>'+P(7,'sc-pt',i=>({x:r2(30,100)+'%',s:r2(6,10)+'px',d:r2(0,9)+'s',t:r2(8,13)+'s',w:r2(-60,-10)+'px'})),
  bg_lightning:()=>'<i class="sc-lgrid"></i><i class="sc-lz"></i><i class="sc-lz z2"></i><i class="sc-lflash"></i>'+P(8,'sc-spk',i=>({x:r2(5,95)+'%',y:r2(10,90)+'%',d:r2(0,3)+'s'})),
  bg_aurora:()=>'<i class="sc-st"></i><i class="sc-au"></i><i class="sc-au a2"></i><i class="sc-au a3"></i><i class="sc-amtn"></i>'
 };
 D.bgHTML=id=>`<div class="dbg-layer sc-${id}" aria-hidden="true">${BG[id]?BG[id]():''}</div>`;
 /* badge: classi CSS (rarità + oro) */
 D.badgeCls=d=>`r-${d.rarita}${d.oro?' oro':''}`;
})(window.STASKYS_DECO);
