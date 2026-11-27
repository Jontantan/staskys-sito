/* Staskys — UPDATE 5: pezzi degli scacchi. Disegni ORIGINALI (SVG), non presi da altri siti.
   STASKYS_PEZZI.svg('w','k')  → SVG del re bianco · opzione {staskys:true} = re del 1° in classifica scacchi (colori del logo) */
(function(){
const BASE='M10.5 44.5h29c.8 0 1.5-.7 1.5-1.5v-2c0-1.4-1.1-2.5-2.5-2.5h-27c-1.4 0-2.5 1.1-2.5 2.5v2c0 .8.7 1.5 1.5 1.5z';
const BODY='M16 38l2.2-6.5h13.6L34 38z';
const P={
 p:[BASE,'M20.6 38c1.6-4.4 2.8-7.3 2.9-10.6h3c.1 3.3 1.3 6.2 2.9 10.6z','M19.5 25.5h11l-1 2.6h-9z','M25 9.2a6.4 6.4 0 1 1 0 12.8 6.4 6.4 0 0 1 0-12.8z'],
 r:[BASE,'M16.5 38l1.8-15h13.4l1.8 15z','M15.5 20h19v3.2h-19z','M14 10h5v3.2h3.4V10h5.2v3.2H31V10h5v10H14z'],
 b:[BASE,BODY,'M18.5 31.5c-1.8-1.3-2.6-3.2-2.6-5.6 0-4.8 3.6-9.6 9.1-13.4 5.5 3.8 9.1 8.6 9.1 13.4 0 2.4-.8 4.3-2.6 5.6z','M25 6.1a2.9 2.9 0 1 1 0 5.8 2.9 2.9 0 0 1 0-5.8z'],
 n:[BASE,'M34.6 38H15.6c.3-5.6 2.6-8.8 6.6-11.8-2.9.4-5.2 1.6-7.1 3.4-1.5.2-2.7-.6-3.3-1.9-.5-1.1-.3-2.3.6-3.3 2.5-2.7 5.5-5.7 8-9l.6-4.9 3.4 3.2c9 .3 11.1 9.3 10.2 24.3z'],
 q:[BASE,BODY,'M12.4 17.5L17 31.5h16l4.6-14-6.8 6.3L28.3 13 25 23.6 21.7 13l-2.5 10.8z','M12.4 13.6a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8zM37.6 13.6a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8zM21.7 9.4a2.3 2.3 0 1 1 0 4.6 2.3 2.3 0 0 1 0-4.6zM28.3 9.4a2.3 2.3 0 1 1 0 4.6 2.3 2.3 0 0 1 0-4.6z'],
 k:[BASE,BODY,'M25 14.2c-7.6 0-12.2 3.9-12.2 8.8 0 3.9 2.6 6.4 4.4 8.5h15.6c1.8-2.1 4.4-4.6 4.4-8.5 0-4.9-4.6-8.8-12.2-8.8z','M23.5 3.5h3v3.6h3.4v3h-3.4v4h-3v-4h-3.4v-3h3.4z']
};
/* dettagli (linee) disegnati sopra, nel colore opposto */
const D={
 p:'',r:'M18.6 29h12.8',b:'M27.8 16.5l-4.6 5.6M20 34.5h10',n:'M21 16.2a1.3 1.3 0 1 0 .1 0zM27.5 14.6c2.6 3.4 3.5 8 3.4 13.5',
 q:'M19 34.5h12',k:'M25 14.5v16.5M18.5 34.5h13M16.3 22.6c5.6-2.2 11.8-2.2 17.4 0'
};
const LOGO=['#ff5fa2','#c86cf5','#5fd3ea'];
let gid=0;
function svg(c,t,o){o=o||{};const w=c==='w';let fill=w?'#f7f5fb':'#2b2735',stroke=w?'#262230':'#0c0a11',det=w?'#262230':'#d9d2e9',defs='';
 if(o.staskys&&t==='k'){const id='stk'+(++gid);defs=`<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${LOGO[0]}"/><stop offset=".5" stop-color="${LOGO[1]}"/><stop offset="1" stop-color="${LOGO[2]}"/></linearGradient></defs>`;fill=`url(#${id})`;stroke=w?'#3b1d4a':'#0c0a11';det='#fff'}
 const parts=P[t].map(d=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="1.7" stroke-linejoin="round"/>`).join('');
 const dl=D[t]?`<path d="${D[t]}" fill="none" stroke="${det}" stroke-width="1.5" stroke-linecap="round" opacity=".85"/>`:'';
 const sh=w&&!o.staskys?'<path d="M12 42.5h26" stroke="#fff" stroke-width="1" opacity=".6"/>':'';
 return`<svg viewBox="0 0 50 50" class="pc pc-${c}${t}${o.staskys&&t==='k'?' pc-staskys':''}" aria-hidden="true">${defs}${parts}${dl}${sh}</svg>`}
window.STASKYS_PEZZI={svg,LOGO};
})();
