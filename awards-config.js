/* Staskys — STASKYS AWARDS: categorie e premi (un solo file da modificare)
   La FASE la decide Jonathan da Supabase > Table Editor > award_settings (presto → nomination → finale → risultati).
   modo:  'titolo'  = scegli un titolo dal tuo catalogo
          'dettaglio' = scrivi un nome (personaggio, opening, momento…) e, se vuoi, collega il titolo
          'membro'  = scegli un membro del server
          'auto'    = calcolato in automatico dal sito */
window.STASKYS_AWARDS={
 YEAR:2026,
 CATS:{game:['🎮','Giochi'],anime:['🎌','Anime'],movie:['🎬','Film'],tv:['📺','Serie'],special:['✨','Speciali']},
 AWARDS:[
  {id:'g_year',cat:'game',nome:"Gioco dell'anno",modo:'titolo',top:true},
  {id:'g_story',cat:'game',nome:'Miglior storia',modo:'titolo'},
  {id:'g_ost',cat:'game',nome:'Miglior colonna sonora',modo:'titolo'},
  {id:'g_art',cat:'game',nome:'Miglior art design',modo:'titolo'},
  {id:'g_play',cat:'game',nome:'Miglior gameplay',modo:'titolo'},
  {id:'g_indie',cat:'game',nome:'Miglior indie',modo:'titolo'},
  {id:'g_multi',cat:'game',nome:'Miglior multiplayer',modo:'titolo'},
  {id:'g_char',cat:'game',nome:'Miglior personaggio',modo:'dettaglio',ph:'Nome del personaggio'},
  {id:'g_boss',cat:'game',nome:'Miglior boss fight',modo:'dettaglio',ph:'Nome del boss'},
  {id:'g_flop',cat:'game',nome:"Delusione dell'anno",modo:'titolo'},
  {id:'a_year',cat:'anime',nome:"Anime dell'anno",modo:'titolo',top:true},
  {id:'a_story',cat:'anime',nome:'Miglior storia',modo:'titolo'},
  {id:'a_op',cat:'anime',nome:'Miglior opening',modo:'dettaglio',ph:'Titolo della opening'},
  {id:'a_ed',cat:'anime',nome:'Miglior ending',modo:'dettaglio',ph:'Titolo della ending'},
  {id:'a_anim',cat:'anime',nome:'Miglior animazione',modo:'titolo'},
  {id:'a_fight',cat:'anime',nome:'Miglior combattimento',modo:'dettaglio',ph:'Chi contro chi / episodio'},
  {id:'a_char',cat:'anime',nome:'Miglior personaggio',modo:'dettaglio',ph:'Nome del personaggio'},
  {id:'a_vill',cat:'anime',nome:'Miglior villain',modo:'dettaglio',ph:'Nome del villain'},
  {id:'a_moment',cat:'anime',nome:'Momento più emozionante',modo:'dettaglio',ph:'Descrivi il momento (breve)'},
  {id:'a_flop',cat:'anime',nome:"Delusione dell'anno",modo:'titolo'},
  {id:'f_year',cat:'movie',nome:"Film dell'anno",modo:'titolo',top:true},
  {id:'f_story',cat:'movie',nome:'Miglior storia',modo:'titolo'},
  {id:'f_ost',cat:'movie',nome:'Miglior colonna sonora',modo:'titolo'},
  {id:'f_photo',cat:'movie',nome:'Miglior fotografia',modo:'titolo'},
  {id:'f_char',cat:'movie',nome:'Miglior personaggio',modo:'dettaglio',ph:'Nome del personaggio'},
  {id:'f_flop',cat:'movie',nome:"Delusione dell'anno",modo:'titolo'},
  {id:'s_year',cat:'tv',nome:"Serie dell'anno",modo:'titolo',top:true},
  {id:'s_story',cat:'tv',nome:'Miglior storia',modo:'titolo'},
  {id:'s_char',cat:'tv',nome:'Miglior personaggio',modo:'dettaglio',ph:'Nome del personaggio'},
  {id:'s_final',cat:'tv',nome:'Miglior finale di stagione',modo:'titolo'},
  {id:'s_binge',cat:'tv',nome:"Binge dell'anno",modo:'titolo'},
  {id:'s_flop',cat:'tv',nome:"Delusione dell'anno",modo:'titolo'},
  {id:'sp_member',cat:'special',nome:"Membro dell'anno",modo:'membro',top:true},
  {id:'sp_champ',cat:'special',nome:'Campione dei minigiochi',modo:'auto',info:'Chi ha più punti nella classifica minigiochi alla fine della finale.'},
  {id:'sp_couple',cat:'special',nome:'Coppia più compatibile',modo:'auto',info:'I due membri con la compatibilità più alta (almeno 8 titoli votati in comune).'}
 ],
 FASI:{presto:'Presto',nomination:'Nomination',finale:'Finale',risultati:'Risultati'}
};
(function(W){const A=window.STASKYS;
 W.byId=Object.fromEntries(W.AWARDS.map(a=>[a.id,a]));
 /* impostazioni: dal database; in DEMO si può provare ogni fase con ?fase=nomination|finale|risultati */
 W.loadSettings=async()=>{const def={year:W.YEAR,phase:'presto'};
  if(A&&A.DEMO){const f=new URLSearchParams(location.search).get('fase');return{...def,phase:W.FASI[f]?f:'presto',demo:true}}
  if(!A||!A.sb)return def;
  const {data,error}=await A.sb.from('award_settings').select('*').eq('id',1).limit(1);
  return error||!data||!data[0]?{...def,missing:!!error}:{...def,...data[0]}};
 /* "vissuto nel 2026": titoli del tuo catalogo visti/in corso/droppati aggiornati nel 2026 o usciti nel 2026 */
 /* i miei voti: {nom:{award_id:{choice_key,title,detail,cover}}, final:{…}} (in DEMO salvati nel browser) */
 const DK='demo_awards_'+W.YEAR;
 W.myVotes=async()=>{const out={nom:{},final:{}};
  if(A.DEMO){try{return Object.assign(out,JSON.parse(localStorage[DK]||'{}'))}catch(e){return out}}
  await A.ready;if(!A.sb||!A.user)return out;
  const {data}=await A.sb.from('award_votes').select('round,award_id,choice_key,title,detail,cover').eq('user_id',A.user.id);
  (data||[]).forEach(v=>out[v.round][v.award_id]=v);return out};
 W.saveVote=async(round,award_id,c)=>{const row={round,award_id,choice_key:String(c.choice_key).slice(0,200),title:String(c.title||'').slice(0,300),detail:c.detail?String(c.detail).slice(0,120):null,cover:c.cover&&/^https:\/\//.test(c.cover)?c.cover:null};
  if(A.DEMO){const v=await W.myVotes();v[round][award_id]=row;localStorage[DK]=JSON.stringify(v);return null}
  if(!A.user)return{message:'login'};
  const {error}=await A.sb.from('award_votes').upsert(row,{onConflict:'user_id,round,award_id'});return error};
 W.removeVote=async(round,award_id)=>{if(A.DEMO){const v=await W.myVotes();delete v[round][award_id];localStorage[DK]=JSON.stringify(v);return null}
  const {error}=await A.sb.from('award_votes').delete().eq('user_id',A.user.id).eq('round',round).eq('award_id',award_id);return error};
 W.eligible=(rows,kind)=>rows.filter(r=>r.kind===kind&&r.status!=='voglio'&&(String(r.updated_at||'').startsWith(String(W.YEAR))||+r.year===W.YEAR));
})(window.STASKYS_AWARDS);
