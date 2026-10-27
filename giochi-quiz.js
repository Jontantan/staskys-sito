/* Staskys — Quiz anime: domande generate dai dati di Jikan (API di MyAnimeList) da un bacino di ~2500 anime,
   15 tipi di domanda + ~300 domande scritte a mano; ogni domanda ha un id e quelle già viste non tornano
   (memoria in localStorage + per account Discord nella tabella Supabase quiz_seen). */
(function(){
const API_URL='https://api.jikan.moe/v4',CACHE_H=24,PER_Q=15,ROUND=10,PAGES=100,SEEN_MAX=1500,SEENQ_MAX=4000,BANK_PER_ROUND=2;
/* Domande di riserva (usate se l'API non risponde): [domanda, giusta, [3 sbagliate]] */
const BANK=[
 ['Quale studio ha animato le prime tre stagioni de "L\'attacco dei giganti"?','Wit Studio',['MAPPA','Bones','Madhouse']],
 ['Chi è l\'autore del manga "One Piece"?','Eiichiro Oda',['Masashi Kishimoto','Akira Toriyama','Tite Kubo']],
 ['In "Naruto", come si chiama il villaggio di Naruto?','Konoha (Villaggio della Foglia)',['Suna (Villaggio della Sabbia)','Kiri (Villaggio della Nebbia)','Kumo (Villaggio della Nuvola)']],
 ['In "Death Note", quale Shinigami lascia cadere il quaderno nel mondo umano?','Ryuk',['Rem','Sidoh','Gelus']],
 ['In "Dragon Ball", come si chiama il pianeta d\'origine dei Saiyan?','Vegeta',['Namecc','Freezer','Yardrat']],
 ['In "Fullmetal Alchemist", come si chiama il fratello di Edward Elric?','Alphonse',['Roy','Maes','Van']],
 ['In che anno è uscito al cinema in Giappone il film "Your Name."?','2016',['2014','2018','2012']],
 ['Quale studio ha realizzato "La città incantata"?','Studio Ghibli',['Studio Ponoc','Toei Animation','Kyoto Animation']],
 ['Quale studio anima "Demon Slayer"?','ufotable',['MAPPA','Bones','A-1 Pictures']],
 ['Quale studio anima "Jujutsu Kaisen"?','MAPPA',['ufotable','Wit Studio','Trigger']],
 ['Come si chiama il protagonista di "One Punch Man"?','Saitama',['Genos','Mumen Rider','Garou']],
 ['Qual è il primo Pokémon di Ash nella serie animata?','Pikachu',['Bulbasaur','Charmander','Squirtle']],
 ['Come si chiama la protagonista di "Sailor Moon"?','Usagi Tsukino',['Rei Hino','Ami Mizuno','Makoto Kino']],
 ['In "Hunter x Hunter", quale amico di Gon usa poteri elettrici?','Killua',['Kurapika','Leorio','Hisoka']],
 ['In "My Hero Academia", come si chiama il Quirk tramandato da All Might a Deku?','One For All',['All For One','Half-Cold Half-Hot','Explosion']],
 ['Chi è il protagonista di "Cowboy Bebop"?','Spike Spiegel',['Jet Black','Vicious','Edward']],
 ['In "Neon Genesis Evangelion", chi pilota l\'EVA-01?','Shinji Ikari',['Rei Ayanami','Asuka Langley Soryu','Kaworu Nagisa']],
 ['In "Steins;Gate", con quale nome si fa chiamare Rintaro Okabe?','Hououin Kyouma',['Daru','Okarin Prime','Mad Scientist Zero']],
 ['In "Chainsaw Man", come si chiama il diavolo motosega?','Pochita',['Power','Kon','Makima']],
 ['In "Spy x Family", quale membro della famiglia Forger legge nel pensiero?','Anya',['Loid','Yor','Bond']],
 ['In "Code Geass", come si chiama il potere di Lelouch?','Geass',['Alchimia','Nen','Stand']],
 ['In "One Piece", qual è il sogno di Monkey D. Luffy?','Diventare il Re dei pirati',['Trovare All Blue','Diventare il più grande spadaccino','Disegnare la mappa del mondo']],
 ['In "One Piece", come si chiama lo spadaccino della ciurma di Cappello di Paglia?','Roronoa Zoro',['Sanji','Usopp','Trafalgar Law']],
 ['In "One Piece", quale frutto del diavolo ha mangiato Luffy (nome originale)?','Gom Gom',['Foco Foco','Paramisha','Ope Ope']],
 ['In "Naruto", quale demone è sigillato dentro Naruto?','La Volpe a Nove Code (Kurama)',['Shukaku','Il Bijuu a otto code','Matatabi']],
 ['In "Naruto", chi è il maestro del Team 7?','Kakashi Hatake',['Jiraiya','Iruka Umino','Might Guy']],
 ['In "Naruto", come si chiama il fratello maggiore di Sasuke?','Itachi',['Obito','Madara','Shisui']],
 ['In "Dragon Ball Z", qual è il nome saiyan di Goku?','Kakarot',['Raditz','Bardock','Nappa']],
 ['In "Dragon Ball", quante sono le sfere del drago della Terra?','7',['5','9','12']],
 ['In "Death Note", qual è il cognome di Light?','Yagami',['Amane','Lawliet','Mikami']],
 ['In "Death Note", qual è il cibo preferito di Ryuk?','Le mele',['I dolci','Il ramen','Le fragole']],
 ['In "L\'attacco dei giganti", come si chiama il protagonista?','Eren Jaeger',['Armin Arlert','Levi Ackerman','Reiner Braun']],
 ['In "L\'attacco dei giganti", come si chiamano le tre mura?','Maria, Rose e Sina',['Maria, Rosa e Sara','Alpha, Beta e Gamma','Shiganshina, Trost e Stohess']],
 ['In "Demon Slayer", come si chiama la sorella di Tanjiro?','Nezuko',['Kanao','Shinobu','Mitsuri']],
 ['In "Demon Slayer", quale respirazione usa Zenitsu?','Respirazione del Tuono',['Respirazione dell\'Acqua','Respirazione della Fiamma','Respirazione della Bestia']],
 ['In "Jujutsu Kaisen", di quale maledizione Yuji Itadori diventa il contenitore?','Ryomen Sukuna',['Mahito','Jogo','Hanami']],
 ['In "Jujutsu Kaisen", chi è il maestro di Yuji che porta una benda sugli occhi?','Satoru Gojo',['Kento Nanami','Masamichi Yaga','Suguru Geto']],
 ['In "My Hero Academia", come si chiama il liceo degli eroi?','U.A.',['Shiketsu','Ketsubutsu','Isamu']],
 ['In "My Hero Academia", qual è il Quirk di Bakugo?','Esplosione',['Fuoco infernale','Indurimento','Gravità zero']],
 ['In "Fullmetal Alchemist", qual è la legge fondamentale dell\'alchimia?','Lo scambio equivalente',['La pietra filosofale','La trasmutazione umana','Il cerchio eterno']],
 ['In "Fullmetal Alchemist", chi è l\'Alchimista di Fuoco?','Roy Mustang',['Alex Louis Armstrong','Scar','Solf J. Kimblee']],
 ['In "Hunter x Hunter", come si chiama l\'energia vitale usata dai combattenti?','Nen',['Chakra','Ki','Haki']],
 ['In "Bleach", come si chiama il protagonista?','Ichigo Kurosaki',['Renji Abarai','Uryu Ishida','Byakuya Kuchiki']],
 ['In "Bleach", come si chiamano le spade dei Shinigami?','Zanpakuto',['Katana del Vuoto','Nichirin','Kusanagi']],
 ['In "Sword Art Online", come si chiama il protagonista nel gioco?','Kirito',['Asuna','Klein','Heathcliff']],
 ['In "Tokyo Ghoul", come si chiama il protagonista?','Ken Kaneki',['Touka Kirishima','Hideyoshi Nagachika','Shu Tsukiyama']],
 ['In "Pokémon", come si chiama la città natale di Ash?','Biancavilla',['Plumbeopoli','Celestopoli','Zafferanopoli']],
 ['In "Pokémon", come si chiamano i due membri umani del Team Rocket che inseguono Ash?','Jessie e James',['Butch e Cassidy','Brock e Misty','Giovanni e Meowth']],
 ['In "Mob Psycho 100", come si chiama il "maestro" di Mob?','Reigen Arataka',['Dimple','Teru Hanazawa','Ritsu Kageyama']],
 ['In "Haikyu!!", in quale ruolo gioca Kageyama?','Alzatore',['Libero','Schiacciatore','Centrale']],
 ['In "Haikyu!!", come si chiama il liceo di Hinata?','Karasuno',['Aoba Johsai','Nekoma','Shiratorizawa']],
 ['In "Kuroko no Basket", quale sport si gioca?','Basket',['Calcio','Pallavolo','Baseball']],
 ['In "Captain Tsubasa" (Holly e Benji), quale sport pratica Tsubasa?','Calcio',['Baseball','Tennis','Rugby']],
 ['Qual è il titolo italiano di "Captain Tsubasa"?','Holly e Benji',['Mila e Shiro','Lupin III','Kiss me Licia']],
 ['Chi ha diretto "Il mio vicino Totoro"?','Hayao Miyazaki',['Isao Takahata','Makoto Shinkai','Mamoru Hosoda']],
 ['Chi ha diretto "Your Name." e "Weathering with You"?','Makoto Shinkai',['Hayao Miyazaki','Mamoru Hosoda','Satoshi Kon']],
 ['Quale film Ghibli ha vinto l\'Oscar come miglior film d\'animazione nel 2003?','La città incantata',['Il castello errante di Howl','Principessa Mononoke','Ponyo sulla scogliera']],
 ['In "Lupin III", come si chiama il pistolero amico di Lupin?','Daisuke Jigen',['Goemon Ishikawa','Koichi Zenigata','Fujiko Mine']],
 ['In "Lupin III", quale ispettore insegue sempre Lupin?','Zenigata',['Megure','Columbo','Akechi']],
 ['In "Detective Conan", qual è il vero nome di Conan?','Shinichi Kudo',['Kaito Kid','Heiji Hattori','Kogoro Mouri']],
 ['In "Doraemon", da quale secolo arriva Doraemon?','XXII secolo',['XXI secolo','XXV secolo','XXX secolo']],
 ['In "Doraemon", qual è il cibo preferito di Doraemon?','I dorayaki',['Il ramen','Gli onigiri','Il sushi']],
 ['In "Sailor Moon", come si chiama la gatta nera che accompagna Usagi?','Luna',['Artemis','Diana','Chibiusa']],
 ['In "JoJo\'s Bizarre Adventure", come si chiamano le manifestazioni dei poteri dalla terza parte in poi?','Stand',['Persona','Nen','Quirk']],
 ['In "JoJo\'s Bizarre Adventure", qual è lo Stand di Jotaro Kujo?','Star Platinum',['The World','Crazy Diamond','Gold Experience']],
 ['In "Evangelion", come si chiama l\'organizzazione che gestisce gli EVA?','NERV',['SEELE','WILLE','GEHIRN Corp']],
 ['In "Re:Zero", qual è il potere di Subaru?','Ritorno dalla morte',['Occhio del Geass','Controllo del tempo','Teletrasporto']],
 ['In "Frieren", di quale razza è Frieren?','Elfa',['Nana','Demone','Umana']],
 ['In "Frieren", come si chiama l\'eroe del gruppo di Frieren?','Himmel',['Heiter','Eisen','Stark']],
 ['In "Solo Leveling", come si chiama il protagonista?','Sung Jinwoo',['Cha Hae-In','Yoo Jinho','Go Gunhee']],
 ['In "Vinland Saga", come si chiama il protagonista?','Thorfinn',['Askeladd','Canute','Thorkell']],
 ['In "Cowboy Bebop", come si chiama il cane della ciurma?','Ein',['Bebop','Jet','Rocco']],
 ['In "Gintama", come si chiama il protagonista?','Gintoki Sakata',['Shinpachi Shimura','Kagura','Toshiro Hijikata']],
 ['In "Dr. Stone", come si chiama lo scienziato protagonista?','Senku Ishigami',['Taiju Oki','Gen Asagiri','Tsukasa Shishio']],
 ['In "Black Clover", qual è il sogno di Asta?','Diventare Re dei Maghi',['Diventare Hokage','Diventare Re dei pirati','Diventare Hunter']],
 ['In "Fairy Tail", come si chiama il drago che ha cresciuto Natsu?','Igneel',['Acnologia','Grandine','Metalicana']],
 ['In "Kaguya-sama: Love is War", in quale organo scolastico lavorano i protagonisti?','Consiglio studentesco',['Club di giornalismo','Club di teatro','Comitato disciplinare']],
 ['In "Oshi no Ko", come si chiama l\'idol madre dei gemelli?','Ai Hoshino',['Kana Arima','Akane Kurokawa','Mem-cho']],
 ['In "Bocchi the Rock!", quale strumento suona Hitori Goto?','Chitarra',['Batteria','Basso','Tastiera']],
 ['In "Blue Lock", quale sport è al centro della storia?','Calcio',['Basket','Pallavolo','Baseball']],
 ['In "Tokyo Revengers", qual è il potere di Takemichi?','Viaggiare indietro nel tempo',['Leggere nel pensiero','Fermare il tempo','Essere immortale']],
 ['In "Neon Genesis Evangelion", come si chiamano i nemici che attaccano Tokyo-3?','Angeli',['Titani','Hollow','Ghoul']]
];
/* Altre domande di riserva scritte a mano (aggiornamento 3) */
BANK.push(
 ['In "Naruto", qual è il cognome di Sakura?','Haruno',['Hyuga','Yamanaka','Uchiha']],
 ['In "Naruto", chi è il Quarto Hokage, padre di Naruto?','Minato Namikaze',['Hiruzen Sarutobi','Tsunade','Hashirama Senju']],
 ['In "Naruto", chi è il Primo Hokage?','Hashirama Senju',['Tobirama Senju','Madara Uchiha','Hiruzen Sarutobi']],
 ['In "Naruto", qual è l\'abilità oculare del clan Hyuga?','Byakugan',['Sharingan','Rinnegan','Tenseigan']],
 ['In "Naruto", come si chiama l\'organizzazione con i mantelli a nuvole rosse?','Akatsuki',['Anbu','Radice','Kara']],
 ['In "Naruto", quale tecnica usa Naruto per creare copie di sé?','Kage Bunshin no Jutsu',['Chidori','Amaterasu','Kamui']],
 ['In "Naruto", chi ha insegnato il Rasengan a Naruto?','Jiraiya',['Kakashi Hatake','Tsunade','Iruka Umino']],
 ['In "Naruto", qual è la tecnica fulminea tipica di Sasuke?','Chidori',['Rasengan','Rasenshuriken','Kage Bunshin']],
 ['In "Naruto", che animale è Gamabunta?','Un rospo',['Una lumaca','Un serpente','Una volpe']],
 ['In "Boruto", come si chiama il figlio di Naruto?','Boruto',['Mitsuki','Kawaki','Shikadai']],
 ['In "One Piece", chi è il cuoco della ciurma di Cappello di Paglia?','Sanji',['Zoro','Brook','Franky']],
 ['In "One Piece", come si chiama la navigatrice della ciurma?','Nami',['Nico Robin','Vivi','Boa Hancock']],
 ['In "One Piece", come si chiama la renna medico della ciurma?','Tony Tony Chopper',['Pell','Carue','Laboon']],
 ['In "One Piece", come si chiama la seconda nave della ciurma di Cappello di Paglia?','Thousand Sunny',['Going Merry','Red Force','Oro Jackson']],
 ['In "One Piece", chi era il pirata noto come "Re dei pirati"?','Gol D. Roger',['Barbabianca','Shanks','Barbanera']],
 ['In "One Piece", quale fratello di Luffy muore durante la guerra di Marineford?','Portgas D. Ace',['Sabo','Marco','Jinbe']],
 ['In "One Piece", chi ha dato a Luffy il suo cappello di paglia?','Shanks',['Gol D. Roger','Garp','Rayleigh']],
 ['In "One Piece", come si chiama il nonno di Luffy, viceammiraglio della Marina?','Monkey D. Garp',['Sengoku','Akainu','Kizaru']],
 ['In "Dragon Ball", come si chiama l\'anziano maestro di arti marziali che vive su un\'isola?','Muten Roshi (il Genio)',['Re Kaio','Junior','Dio della Terra']],
 ['In "Dragon Ball Z", come si chiama il figlio maggiore di Goku?','Gohan',['Goten','Trunks','Pan']],
 ['In "Dragon Ball Z", come si chiama la fusione di Goku e Vegeta con gli orecchini Potara?','Vegeth (Vegito)',['Gogeta','Gotenks','Kefla']],
 ['In "Dragon Ball", qual è la tecnica più famosa di Goku?','Kamehameha',['Final Flash','Makankosappo','Kienzan']],
 ['In "Dragon Ball Z", chi sconfigge Cell?','Gohan',['Goku','Vegeta','Trunks']],
 ['In "Dragon Ball", come si chiama il drago delle sfere della Terra?','Shenron',['Porunga','Ryujin','Baby']],
 ['In "Dragon Ball Super", come si chiama il Dio della Distruzione dell\'Universo 7?','Beerus',['Whis','Zeno','Champa']],
 ['In "Death Note", qual è il vero nome di L?','L Lawliet',['Nate River','Mihael Keehl','Teru Mikami']],
 ['In "Death Note", chi diventa il "secondo Kira"?','Misa Amane',['Kiyomi Takada','Teru Mikami','Naomi Misora']],
 ['In "L\'attacco dei giganti", chi è il capitano considerato il soldato più forte dell\'umanità?','Levi Ackerman',['Erwin Smith','Hange Zoë','Mike Zacharias']],
 ['In "L\'attacco dei giganti", chi è il Gigante Corazzato?','Reiner Braun',['Bertholdt Hoover','Annie Leonhart','Zeke Jaeger']],
 ['In "L\'attacco dei giganti", chi è il Gigante Femmina?','Annie Leonhart',['Ymir','Pieck Finger','Historia Reiss']],
 ['In "L\'attacco dei giganti", come si chiama la sorella adottiva di Eren?','Mikasa Ackerman',['Historia Reiss','Sasha Blouse','Ymir']],
 ['In "L\'attacco dei giganti", in quale distretto vive Eren all\'inizio della storia?','Shiganshina',['Trost','Stohess','Liberio']],
 ['In "Demon Slayer", come si chiama il capo di tutti i demoni?','Muzan Kibutsuji',['Akaza','Doma','Kokushibo']],
 ['In "Demon Slayer", quale Pilastro usa la Respirazione della Fiamma?','Kyojuro Rengoku',['Giyu Tomioka','Tengen Uzui','Gyomei Himejima']],
 ['In "Demon Slayer", che cosa porta sulla testa Inosuke?','Una testa di cinghiale',['Una maschera da volpe','Un elmo da samurai','Un cappello di paglia']],
 ['In "Demon Slayer", dove viaggia Nezuko durante il giorno?','In una scatola di legno sulla schiena di Tanjiro',['In un cesto di vimini','In una gabbia','In una carrozza']],
 ['In "Demon Slayer", di che colore è la lama della spada di Tanjiro?','Nero',['Rosso','Blu','Bianco']],
 ['In "Jujutsu Kaisen", qual è la tecnica innata di Megumi Fushiguro?','Tecnica delle dieci ombre',['Illimitato','Tecnica inversa','Tecnica della bambola di paglia']],
 ['In "Jujutsu Kaisen", quali strumenti usa Nobara Kugisaki?','Martello e chiodi',['Una katana','Un arco','Una catena']],
 ['In "Jujutsu Kaisen", quante sono le dita di Sukuna?','20',['10','12','8']],
 ['In "My Hero Academia", qual è il Quirk di Shoto Todoroki?','Metà ghiaccio, metà fuoco',['Esplosione','Gravità zero','Ombra oscura']],
 ['In "My Hero Academia", chi guida la Lega dei Villain?','Tomura Shigaraki',['Dabi','Himiko Toga','Stain']],
 ['In "My Hero Academia", qual è il nome da eroe di Izuku Midoriya?','Deku',['Ground Zero','Lemillion','Shoto']],
 ['In "My Hero Academia", chi è chiamato il "Simbolo della pace"?','All Might',['Endeavor','Hawks','Eraser Head']],
 ['In "Hunter x Hunter", come si chiama la famiglia di assassini di Killua?','Zoldyck',['Freecss','Kurta','Lucilfer']],
 ['In "Hunter x Hunter", come si chiama il padre di Gon?','Ging Freecss',['Silva Zoldyck','Isaac Netero','Kite']],
 ['In "Hunter x Hunter", di quale clan è l\'ultimo superstite Kurapika?','Kurta',['Zoldyck','Uchiha','Ackerman']],
 ['In "Hunter x Hunter", chi è il capo della Brigata Fantasma?','Chrollo Lucilfer',['Hisoka','Feitan','Meruem']],
 ['In "Bleach", come si chiama la Zanpakuto di Ichigo?','Zangetsu',['Senbonzakura','Hyorinmaru','Zabimaru']],
 ['In "Bleach", chi è il capitano della Sesta Divisione e fratello adottivo di Rukia?','Byakuya Kuchiki',['Toshiro Hitsugaya','Kenpachi Zaraki','Sosuke Aizen']],
 ['In "Bleach", che cosa sono gli Hollow?','Anime corrotte diventate mostri',['Dei della morte','Spiriti guida','Demoni del fuoco']],
 ['In "Fullmetal Alchemist", come si chiamano i nemici che portano i nomi dei peccati capitali?','Homunculus',['Chimere','Golem','Shinigami']],
 ['In "Fullmetal Alchemist: Brotherhood", chi è il Comandante Supremo (Führer) di Amestris?','King Bradley',['Roy Mustang','Father','Grumman']],
 ['In "Code Geass", con quale identità segreta agisce Lelouch?','Zero',['Suzaku','C.C.','Il Cavaliere Nero']],
 ['In "Code Geass", qual è il cibo preferito di C.C.?','La pizza',['Il ramen','Le mele','Il curry']],
 ['In "Neon Genesis Evangelion", chi pilota l\'EVA-02?','Asuka Langley Soryu',['Rei Ayanami','Mari Illustrious Makinami','Misato Katsuragi']],
 ['In "Neon Genesis Evangelion", come si chiama il comandante della NERV, padre di Shinji?','Gendo Ikari',['Kozo Fuyutsuki','Ryoji Kaji','Makoto Hyuga']],
 ['In "Steins;Gate", quale apparecchio permette di mandare messaggi nel passato?','Un forno a microonde collegato a un telefono',['Un orologio da polso','Una cabina telefonica','Un frigorifero']],
 ['In "Steins;Gate", come si chiama la giovane scienziata geniale del laboratorio?','Kurisu Makise',['Mayuri Shiina','Suzuha Amane','Ruka Urushibara']],
 ['In "Cowboy Bebop", come si chiama l\'astronave dei protagonisti?','Bebop',['Swordfish II','Red Tail','Normandy']],
 ['In "Sword Art Online", come si chiama la compagna di Kirito?','Asuna',['Sinon','Leafa','Silica']],
 ['In "Sword Art Online", fino a quale piano bisognava arrivare per finire il gioco?','100',['50','75','99']],
 ['In "Tokyo Ghoul", di che cosa si nutrono i ghoul?','Carne umana',['Sangue di animali','Anime','Elettricità']],
 ['In "One Punch Man", come si chiama il cyborg discepolo di Saitama?','Genos',['Sonic','King','Bang']],
 ['In "One Punch Man", in quale classe di eroi parte Saitama?','Classe C',['Classe S','Classe A','Classe B']],
 ['In "Mob Psycho 100", a quale percentuale "esplode" Mob?','100%',['50%','99%','1000%']],
 ['In "Spy x Family", qual è il nome in codice di Loid Forger?','Twilight',['Thorn Princess','Nightfall','Daybreak']],
 ['In "Spy x Family", qual è il lavoro segreto di Yor?','Assassina',['Spia','Poliziotta','Ladra']],
 ['In "Spy x Family", che potere ha il cane Bond?','Vede il futuro',['Legge nel pensiero','Parla','Diventa invisibile']],
 ['In "Chainsaw Man", come si chiama il protagonista?','Denji',['Aki','Kishibe','Reze']],
 ['In "Chainsaw Man", che diavolo è Power?','Il diavolo del sangue',['Il diavolo della pistola','Il diavolo del controllo','Il diavolo della volpe']],
 ['In "Frieren", come si chiama l\'apprendista maga di Frieren?','Fern',['Stark','Sein','Übel']],
 ['In "Frieren", di quale razza è Eisen?','Nano',['Elfo','Umano','Demone']],
 ['In "Haikyu!!", come viene chiamato Kageyama per il suo modo di fare in campo?','Il re del campo',['Il piccolo gigante','Il capitano','Il corvo']],
 ['In "Haikyu!!", qual è il soprannome dell\'ex asso del Karasuno che ispira Hinata?','Il piccolo gigante',['Il re del campo','Il muro di ferro','L\'asso volante']],
 ['In "Kuroko no Basket", come si chiama il gruppo dei cinque prodigi delle medie?','Generazione dei Miracoli',['Generazione d\'Oro','I Cinque Re','Squadra Fantasma']],
 ['In "Slam Dunk", come si chiama il protagonista dai capelli rossi?','Hanamichi Sakuragi',['Kaede Rukawa','Takenori Akagi','Hisashi Mitsui']],
 ['In "Blue Lock", come si chiama il protagonista?','Yoichi Isagi',['Meguru Bachira','Rin Itoshi','Seishiro Nagi']],
 ['In "Oshi no Ko", in chi si reincarna il medico Goro?','Aquamarine Hoshino',['Ruby Hoshino','Ai Hoshino','Kana Arima']],
 ['In "Bocchi the Rock!", come si chiama la band di Hitori?','Kessoku Band',['Sick Hack','Ho-kago Tea Time','Poppin\'Party']],
 ['In "K-On!", come si chiama la band delle protagoniste?','Ho-kago Tea Time',['Kessoku Band','Afterglow','Roselia']],
 ['In "Your Lie in April", quale strumento suona Kosei Arima?','Pianoforte',['Violino','Chitarra','Violoncello']],
 ['In "Violet Evergarden", che lavoro fa Violet?','Scrive lettere per conto di altri',['Consegna la posta a cavallo','Fa la soldatessa','Fa l\'infermiera']],
 ['In "Made in Abyss", come si chiama il ragazzo robot amico di Riko?','Reg',['Nanachi','Bondrewd','Ozen']],
 ['In "Re:Zero", come si chiama la mezza elfa dai capelli argentati?','Emilia',['Rem','Ram','Beatrice']],
 ['In "Re:Zero", come si chiamano le due cameriere gemelle?','Rem e Ram',['Rin e Len','Ami e Yumi','Mei e Satsuki']],
 ['In "Konosuba", quale magia ossessiona Megumin?','Esplosione',['Teletrasporto','Guarigione','Fulmine']],
 ['In "Konosuba", di che cosa è dea Aqua?','Dell\'acqua',['Della fortuna','Del fuoco','Della guerra']],
 ['In "Vita da Slime" (That Time I Got Reincarnated as a Slime), come si chiama lo slime protagonista?','Rimuru Tempest',['Veldora','Benimaru','Shion']],
 ['In "Overlord", come si chiama il protagonista scheletro?','Ainz Ooal Gown',['Albedo','Demiurge','Shalltear']],
 ['In "No Game No Life", come si chiamano i due fratelli protagonisti?','Sora e Shiro',['Kirito e Suguha','Kazuma e Aqua','Rin e Yukio']],
 ['In "The Promised Neverland", come si chiama l\'orfanotrofio?','Grace Field House',['Wammy\'s House','Sunshine Home','Hogwarts']],
 ['In "Vinland Saga", chi uccide Thors, il padre di Thorfinn?','Askeladd',['Thorkell','Canute','Floki']],
 ['In "Dr. Stone", che cosa ha pietrificato l\'umanità?','Un misterioso lampo di luce',['Un virus','Un meteorite','Una guerra nucleare']],
 ['In "Fire Force", come si chiamano le persone che prendono fuoco spontaneamente?','Infernal',['Ghoul','Titani','Hollow']],
 ['In "Black Clover", quante foglie ha il grimorio di Asta?','Cinque',['Tre','Quattro','Sette']],
 ['In "Fairy Tail", come si chiama il gatto blu che vola?','Happy',['Carla','Lily','Frosch']],
 ['In "Fairy Tail", che magia usa Natsu?','Dragon Slayer del fuoco',['Spiriti stellari','Magia del ghiaccio','Cambio d\'armatura']],
 ['In "Gintama", come si chiama l\'enorme cane bianco di Kagura?','Sadaharu',['Elizabeth','Gengai','Katsura']],
 ['In "JoJo\'s Bizarre Adventure", qual è il grido di Star Platinum quando colpisce?','ORA ORA ORA',['MUDA MUDA MUDA','ARI ARI ARI','DORA DORA DORA']],
 ['In "JoJo\'s Bizarre Adventure", qual è lo Stand di Dio Brando?','The World',['Star Platinum','King Crimson','Killer Queen']],
 ['In "JoJo\'s Bizarre Adventure", chi è il protagonista della parte 4 "Diamond is Unbreakable"?','Josuke Higashikata',['Giorno Giovanna','Jonathan Joestar','Jolyne Cujoh']],
 ['In "Pokémon", quale Pokémon del Team Rocket sa parlare?','Meowth',['Wobbuffet','Ekans','Koffing']],
 ['In "Pokémon", come si chiama il professore di Biancavilla?','Professor Oak',['Professor Elm','Professor Birch','Professor Rowan']],
 ['Qual è il Pokémon numero 1 del Pokédex nazionale?','Bulbasaur',['Pikachu','Mew','Charmander']],
 ['In "Digimon Adventure", qual è il Digimon partner di Tai?','Agumon',['Gabumon','Patamon','Gatomon']],
 ['In "Yu-Gi-Oh!", qual è il mostro preferito di Yugi?','Mago Nero',['Drago Bianco Occhi Blu','Exodia','Kuriboh']],
 ['In "Yu-Gi-Oh!", quale carta è il simbolo di Seto Kaiba?','Drago Bianco Occhi Blu',['Mago Nero','Drago Nero Occhi Rossi','Kuriboh']],
 ['Nei "Cavalieri dello Zodiaco", di quale costellazione è il cavaliere Seiya?','Pegaso',['Dragone','Cigno','Andromeda']],
 ['In "Ken il guerriero", qual è la frase celebre di Kenshiro?','"Tu sei già morto"',['"Credi nel cuore delle carte"','"Ci vediamo, space cowboy"','"Plus Ultra"']],
 ['In "Lupin III", come si chiama il samurai della banda?','Goemon Ishikawa',['Daisuke Jigen','Koichi Zenigata','Hattori Hanzo']],
 ['In "Lupin III", come si chiama l\'affascinante complice (e rivale) di Lupin?','Fujiko Mine',['Rebecca Rossellini','Clarisse','Catherine']],
 ['In "Detective Conan", come si chiama il veleno che ha fatto rimpicciolire Shinichi?','APTX 4869',['Elisir T-90','Siero Z','Formula 37']],
 ['In "Detective Conan", come si chiama la ragazza amica d\'infanzia di Shinichi?','Ran Mouri',['Ai Haibara','Ayumi Yoshida','Kazuha Toyama']],
 ['In "Doraemon", come si chiama il bambino con gli occhiali amico di Doraemon?','Nobita',['Gian','Suneo','Dekisugi']],
 ['In "Sailor Moon", come si chiama Sailor Mars nella vita normale?','Rei Hino',['Ami Mizuno','Minako Aino','Makoto Kino']],
 ['In "Card Captor Sakura", che cosa deve catturare Sakura?','Le carte di Clow',['Le sfere del drago','I Pokémon','Le chiavi dei sogni']],
 ['In "Akira", in quale città è ambientata la storia?','Neo-Tokyo',['Tokyo-3','Neo-Osaka','Mega-Kyoto']],
 ['In "Ghost in the Shell", come si chiama il Maggiore protagonista?','Motoko Kusanagi',['Batou','Togusa','Daisuke Aramaki']],
 ['In "Principessa Mononoke", come si chiama il principe protagonista?','Ashitaka',['Haku','Howl','Pazu']],
 ['In "La città incantata", come si chiama la bambina protagonista?','Chihiro',['Kiki','Sophie','Mei']],
 ['In "Kiki - Consegne a domicilio", come si chiama il gatto nero di Kiki?','Jiji',['Luna','Totoro','Calcifer']],
 ['In "Il castello errante di Howl", come si chiama il demone del fuoco?','Calcifer',['Jiji','Kaonashi','Haku']],
 ['In "La città incantata", come si chiama lo spirito mascherato senza volto?','Kaonashi (Senza Volto)',['Haku','Yubaba','Kamaji']],
 ['Quale studio ha prodotto la serie "Neon Genesis Evangelion" del 1995?','Gainax',['Khara','Production I.G','Sunrise']],
 ['Quale studio ha animato "Fullmetal Alchemist: Brotherhood"?','Bones',['MAPPA','Madhouse','Sunrise']],
 ['Quale studio ha animato la prima stagione di "One Punch Man"?','Madhouse',['J.C.Staff','Bones','ufotable']],
 ['Quale studio ha animato "Violet Evergarden"?','Kyoto Animation',['P.A. Works','Wit Studio','CloverWorks']],
 ['Quale studio ha animato "Chainsaw Man"?','MAPPA',['ufotable','Trigger','Wit Studio']],
 ['Quale studio ha animato "Cyberpunk: Edgerunners"?','Trigger',['MAPPA','Production I.G','Science SARU']],
 ['Quale studio ha animato "Mob Psycho 100"?','Bones',['Madhouse','A-1 Pictures','Shaft']],
 ['Quale studio è famoso per la serie "Monogatari"?','Shaft',['Kyoto Animation','Bones','Gainax']],
 ['Quale studio ha animato "Frieren - Oltre la fine del viaggio"?','Madhouse',['MAPPA','ufotable','Kyoto Animation']],
 ['Quale studio ha animato "Bocchi the Rock!"?','CloverWorks',['Kyoto Animation','A-1 Pictures','Shaft']],
 ['Quale studio ha animato "Kill la Kill"?','Trigger',['Gainax','Bones','Sunrise']],
 ['Chi è l\'autore del manga "Dragon Ball"?','Akira Toriyama',['Eiichiro Oda','Masashi Kishimoto','Rumiko Takahashi']],
 ['Chi è l\'autore del manga "Naruto"?','Masashi Kishimoto',['Akira Toriyama','Tite Kubo','Hirohiko Araki']],
 ['Chi è l\'autore del manga "L\'attacco dei giganti"?','Hajime Isayama',['Gege Akutami','Koyoharu Gotouge','Tatsuki Fujimoto']],
 ['Chi è l\'autore del manga "Demon Slayer"?','Koyoharu Gotouge',['Hajime Isayama','Kohei Horikoshi','Yusuke Murata']],
 ['Chi è l\'autore del manga "Jujutsu Kaisen"?','Gege Akutami',['Tatsuki Fujimoto','Kohei Horikoshi','Yuki Tabata']],
 ['Chi è l\'autore del manga "Chainsaw Man"?','Tatsuki Fujimoto',['Gege Akutami','ONE','Sui Ishida']],
 ['Chi è l\'autore di "Hunter x Hunter" e "Yu Yu Hakusho"?','Yoshihiro Togashi',['Takeshi Obata','Tsugumi Ohba','Nobuhiro Watsuki']],
 ['Chi ha creato "JoJo\'s Bizarre Adventure"?','Hirohiko Araki',['Kentaro Miura','Naoki Urasawa','Yoshihiro Togashi']],
 ['Chi è l\'autore del manga "Berserk"?','Kentaro Miura',['Hirohiko Araki','Naoki Urasawa','Takehiko Inoue']],
 ['Chi è l\'autore di "Slam Dunk" e "Vagabond"?','Takehiko Inoue',['Kentaro Miura','Hiroyuki Takei','Mitsuru Adachi']],
 ['Chi ha creato "Ranma ½" e "Lamù"?','Rumiko Takahashi',['Naoko Takeuchi','CLAMP','Ai Yazawa']],
 ['Chi è l\'autrice di "Sailor Moon"?','Naoko Takeuchi',['Rumiko Takahashi','Ai Yazawa','Natsuki Takaya']],
 ['Chi è l\'autore di "Fairy Tail"?','Hiro Mashima',['Eiichiro Oda','Yuki Tabata','Tite Kubo']],
 ['Chi ha scritto la storia originale di "One Punch Man"?','ONE',['Yusuke Murata','Gege Akutami','Tatsuki Fujimoto']],
 ['Chi è l\'autore di "Death Note" (storia)?','Tsugumi Ohba',['Takeshi Obata','Yoshihiro Togashi','Hajime Isayama']],
 ['Chi ha diretto il film "Akira" (1988)?','Katsuhiro Otomo',['Mamoru Oshii','Satoshi Kon','Hayao Miyazaki']],
 ['Chi ha diretto "Ghost in the Shell" (1995)?','Mamoru Oshii',['Katsuhiro Otomo','Satoshi Kon','Hideaki Anno']],
 ['Chi ha diretto "Perfect Blue" e "Paprika"?','Satoshi Kon',['Mamoru Hosoda','Makoto Shinkai','Mamoru Oshii']],
 ['Chi è il creatore di "Neon Genesis Evangelion"?','Hideaki Anno',['Hayao Miyazaki','Shinichiro Watanabe','Kunihiko Ikuhara']],
 ['Chi ha diretto "Cowboy Bebop"?','Shinichiro Watanabe',['Hideaki Anno','Mamoru Oshii','Satoshi Kon']],
 ['Chi ha diretto "La ragazza che saltava nel tempo" (2006) e "Wolf Children"?','Mamoru Hosoda',['Makoto Shinkai','Hayao Miyazaki','Naoko Yamada']],
 ['Chi ha diretto il film "La forma della voce"?','Naoko Yamada',['Mamoru Hosoda','Makoto Shinkai','Isao Takahata']],
 ['Chi ha diretto "Una tomba per le lucciole"?','Isao Takahata',['Hayao Miyazaki','Goro Miyazaki','Hiromasa Yonebayashi']],
 ['In che anno è uscito il film "Akira"?','1988',['1984','1992','1995']],
 ['In che anno è andata in onda in Giappone la serie "Neon Genesis Evangelion"?','1995',['1993','1997','1999']],
 ['In che anno è iniziata in Giappone la serie TV di "Dragon Ball Z"?','1989',['1986','1992','1995']],
 ['In che anno è iniziata la serie TV di "One Piece"?','1999',['1997','2001','2003']],
 ['In che anno è iniziato l\'anime de "L\'attacco dei giganti"?','2013',['2011','2015','2016']],
 ['In che anno è iniziata in Giappone la serie TV di "Naruto"?','2002',['1999','2004','2007']],
 ['In che anno è uscito in Giappone "La città incantata"?','2001',['1997','2004','2008']],
 ['In che anno è uscito "Il mio vicino Totoro"?','1988',['1984','1992','1997']],
 ['In che anno è iniziata la serie TV di "Demon Slayer"?','2019',['2017','2020','2021']],
 ['In "Ranma ½", in che cosa si trasforma Ranma con l\'acqua fredda?','In una ragazza',['In un panda','In un gatto','In un maialino']],
 ['In "Ranma ½", in che animale si trasforma Genma, il padre di Ranma?','Un panda',['Un maialino','Un gatto','Un\'anatra']],
 ['In "Inuyasha", quale gioiello cerca di ricomporre Kagome?','La Sfera dei Quattro Spiriti',['Le sfere del drago','Le carte di Clow','Il Cristallo d\'argento']],
 ['In "Inuyasha", che tipo di creatura è Inuyasha?','Un mezzo demone cane',['Un mezzo demone volpe','Un lupo mannaro','Uno shinigami']],
 ['In "Berserk", come si chiama il capo della Squadra dei Falchi?','Griffith',['Casca','Judeau','Pippin']],
 ['In "Trigun", come viene soprannominato Vash per la taglia sulla sua testa?','Il Tifone Umanoide',['Lo Spadaccino Nero','Il Cacciatore di Pirati','Il Lampo Giallo']],
 ['In "Samurai Champloo", chi sta cercando Fuu?','Il samurai che profuma di girasoli',['Il re dei pirati','L\'ultimo ninja','Il drago d\'oro']],
 ['In "Erased", che cosa succede a Satoru prima di un evento tragico?','Torna indietro nel tempo di pochi minuti',['Vede il futuro in sogno','Diventa invisibile','Il tempo si ferma']],
 ['In "Death Parade", dove arrivano le persone appena morte?','In un bar dove devono sfidarsi a un gioco',['In una scuola','Su un treno','In un ospedale']],
 ['In "Mushoku Tensei", come si chiama il protagonista reincarnato?','Rudeus Greyrat',['Kazuma Sato','Subaru Natsuki','Naofumi Iwatani']],
 ['In "The Rising of the Shield Hero", qual è l\'arma di Naofumi?','Uno scudo',['Una lancia','Un arco','Una spada']],
 ['In "Mushishi", come si chiama il viaggiatore che studia i Mushi?','Ginko',['Natsume','Mugen','Sesshomaru']],
 ['In "Natsume degli spiriti", come si chiama lo spirito a forma di gatto?','Nyanko-sensei',['Jiji','Luna','Kuroneko']],
 ['In "Toradora!", come viene soprannominata Taiga?','La tigre tascabile',['La regina di ghiaccio','La principessa','Il drago']],
 ['In "Anohana", come si chiama la ragazza fantasma?','Menma',['Anaru','Tsuruko','Poppo']],
 ['In "Kaguya-sama: Love is War", qual è il cognome di Kaguya?','Shinomiya',['Shirogane','Fujiwara','Ishigami']],
 ['In "Horimiya", come si chiamano i due protagonisti?','Hori e Miyamura',['Taki e Mitsuha','Kaguya e Miyuki','Ryuji e Taiga']],
 ['In "Your Name.", in quale cittadina vive Mitsuha?','Itomori',['Tokyo','Kyoto','Hinamizawa']],
 ['In "Weathering with You", quale potere ha Hina?','Far smettere la pioggia',['Volare','Leggere nel pensiero','Fermare il tempo']],
 ['In "Assassination Classroom", come si chiama il professore a forma di polpo?','Koro-sensei',['Karasuma','Gakuho Asano','Nagisa']],
 ['In "Food Wars!", come si chiama la scuola di cucina d\'élite?','Totsuki',['U.A.','Karasuno','Ouran']],
 ['In "Ouran High School Host Club", come si chiama la protagonista?','Haruhi Fujioka',['Haruhi Suzumiya','Tohru Honda','Yuki Sohma']],
 ['In "Fruits Basket", in che cosa si trasformano i Soma se abbracciati da qualcuno del sesso opposto?','Negli animali dello zodiaco cinese',['In gatti neri','In bambini','In statue di pietra']],
 ['In "La malinconia di Haruhi Suzumiya", come si chiama il club fondato da Haruhi?','Brigata SOS',['Club di letteratura','Club dei servizi','Consiglio studentesco']],
 ['In "Hellsing", come si chiama il potentissimo vampiro protagonista?','Alucard',['Dio Brando','Seras Victoria','Walter']],
 ['In "Dororo", che cosa è stato tolto a Hyakkimaru alla nascita?','Molte parti del suo corpo',['La sua anima','Il suo nome','La sua spada']],
 ['In "Kenshin samurai vagabondo", che spada usa Kenshin?','Una sakabato, a lama rovesciata',['Una zanpakuto','Una spada laser','Una nodachi']],
 ['In "Gurren Lagann", come si chiama il "fratello" che ispira Simon?','Kamina',['Viral','Lordgenome','Rossiu']],
 ['In "Mobile Suit Gundam" (1979), chi pilota il Gundam RX-78-2?','Amuro Ray',['Char Aznable','Kira Yamato','Setsuna F. Seiei']],
 ['In "Initial D", quale auto guida Takumi?','Toyota AE86 Trueno',['Nissan Skyline GT-R','Mazda RX-7','Honda NSX']],
 ['In "Hajime no Ippo", quale sport pratica Ippo?','Pugilato',['Judo','Karate','Lotta libera']],
 ['In "Yuri!!! on Ice", quale sport pratica Yuri?','Pattinaggio artistico',['Hockey su ghiaccio','Sci','Curling']],
 ['In "Free!", quale sport praticano i protagonisti?','Nuoto',['Pallanuoto','Tuffi','Canottaggio']],
 ['In "Chihayafuru", su quale gioco di carte si basa la storia?','Karuta',['Hanafuda','Mahjong','Poker']],
 ['In "Hikaru no Go", a quale gioco da tavolo gioca Hikaru?','Go',['Shogi','Scacchi','Mahjong']],
 ['In "March Comes in Like a Lion", a quale gioco gioca Rei?','Shogi',['Go','Scacchi','Karuta']],
 ['In "Cyberpunk: Edgerunners", come si chiama il protagonista?','David Martinez',['Johnny Silverhand','Maine','Viktor']],
 ['In "Tokyo Revengers", come si chiama il protagonista?','Takemichi Hanagaki',['Manjiro Sano','Ken Ryuguji','Naoto Tachibana']],
 ['In "Dandadan", come si chiamano i due protagonisti?','Momo e Okarun',['Denji e Power','Yuji e Megumi','Taki e Mitsuha']],
 ['In "Solo Leveling", come viene chiamato all\'inizio Sung Jinwoo?','Il cacciatore più debole del mondo',['Il re dei demoni','Il cavaliere nero','L\'eroe dello scudo']],
 ['In "Arcane", da quale videogioco è tratta la serie?','League of Legends',['Dota 2','Overwatch','Valorant']],
 ['Che cosa significa la parola giapponese "sensei"?','Maestro, insegnante',['Studente','Amico','Fratello maggiore']],
 ['Che cosa significa "nakama", parola amatissima in "One Piece"?','Compagni, amici fidati',['Nemici','Tesoro','Capitano']],
 ['Come si chiamano i fumetti coreani?','Manhwa',['Manga','Manhua','Bande dessinée']],
 ['Che cosa indica il termine "shonen"?','Opere pensate per ragazzi',['Opere per ragazze','Opere per adulti','Opere comiche']],
 ['Che cosa indica il termine "isekai"?','Storie in cui il protagonista finisce in un altro mondo',['Storie di robot giganti','Storie scolastiche','Storie sportive']],
 ['Che cosa indica il genere "mecha"?','Robot giganti pilotati',['Magia','Cucina','Arti marziali']],
 ['Su quale rivista escono "One Piece" e "Jujutsu Kaisen"?','Weekly Shonen Jump',['Weekly Shonen Magazine','Shonen Sunday','Monthly Afternoon']],
 ['Come si chiama la sigla di apertura di un anime in gergo?','Opening',['Ending','Insert song','OST']],
 ['Che cosa significa la sigla "OVA"?','Original Video Animation',['Opening Video Anime','Official Visual Artbook','Online Viewer Anime']],
 ['Chi doppia (in giapponese) Goku da sempre?','Masako Nozawa',['Megumi Hayashibara','Rie Kugimiya','Kana Hanazawa']]
);

const sh=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const range=(a,b)=>[...Array(b-a+1)].map((_,i)=>a+i);
const hash=s=>{let h=5381;for(let i=0;i<s.length;i++)h=(h*33^s.charCodeAt(i))>>>0;return h.toString(36)};
const BANK_ID=BANK.map(b=>'b'+hash(b[0]));
/* --- memoria per giocatore: anime e domande già viste (localStorage + account Discord su Supabase) --- */
const ls={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const seenA=()=>ls.get('quiz_seen_a',[]),seenQ=()=>ls.get('quiz_seen_q',[]);
const uniq=a=>[...new Set(a.reverse())].reverse(); // tiene l'ultima occorrenza
function remember(qs){const a=seenA(),s=seenQ();qs.forEach(x=>{if(x.aid)a.push(x.aid);if(x.id)s.push(x.id)});
 ls.set('quiz_seen_a',uniq(a).slice(-SEEN_MAX));ls.set('quiz_seen_q',uniq(s).slice(-SEENQ_MAX))}
function mergeSeen(list){if(!Array.isArray(list))return;const s=seenQ(),have=new Set(s);ls.set('quiz_seen_q',uniq(list.filter(x=>typeof x==='string'&&!have.has(x)).concat(s)).slice(-SEENQ_MAX))}
/* --- Jikan con limite di richieste (~2,4/s, sotto il limite di 3/s) e cache 24h per pagina --- */
let qT=0;const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function jget(path,tries=3){const now=Date.now(),at=Math.max(now,qT);qT=at+420;await wait(at-now);
 let r;try{r=await fetch(API_URL+path)}catch(e){if(tries>0){await wait(1200);return jget(path,tries-1)}throw e}if(r.status===429&&tries>0){await wait(1200);return jget(path,tries-1)}if(!r.ok)throw new Error(r.status);return r.json()}
function cget(k){try{const v=JSON.parse(localStorage.getItem(k)||sessionStorage.getItem(k));if(v&&Date.now()-v.t<CACHE_H*36e5)return v.d}catch(e){}return null}
function cset(k,d){const v=JSON.stringify({t:Date.now(),d});try{localStorage.setItem(k,v)}catch(e){try{sessionStorage.setItem(k,v)}catch(e){}}}
const slim=a=>({id:a.mal_id,t:a.title_english||a.title,alt:[a.title,a.title_english,a.title_japanese,...(a.title_synonyms||[])].filter(Boolean).slice(0,6),
 y:a.year||a.aired?.prop?.from?.year||null,st:(a.studios||[]).map(s=>s.name),syn:(a.synopsis||'').slice(0,700),img:a.images?.jpg?.image_url||'',
 ty:a.type||'',ep:a.episodes||0,src:a.source||'',se:a.season||'',sc:a.score||0,mem:a.members||0,tj:a.title_japanese||'',gen:(a.genres||[]).concat(a.themes||[]).map(g=>g.name).slice(0,8)});
async function page(p){const k='quiz3_p'+p;let L=cget(k);if(L)return L;const j=await jget(`/top/anime?filter=bypopularity&sfw=true&limit=25&page=${p}`);L=j.data.filter(a=>!/Music|PV|CM/.test(a.type||'')).map(slim);cset(k,L);return L}
/* 4 pagine a caso: 2 tra le 30 più popolari, 2 da tutto il bacino (PAGES×25 ≈ 2500 anime) + quelle già in cache */
async function pool(){const ps=[...new Set([...sh(range(1,30)).slice(0,2),...sh(range(31,PAGES)).slice(0,2)])];let L=[];
 for(const p of ps){try{L=L.concat(await page(p))}catch(e){if(!L.length&&p===ps[ps.length-1])throw e}}
 const seen=new Set(L.map(a=>a.id));for(let p=1;p<=PAGES;p++){const c=cget('quiz3_p'+p);if(c)c.forEach(a=>{if(!seen.has(a.id)){seen.add(a.id);L.push(a)}})}
 return L}
async function chars(id){const k='quiz_ch_'+id;let c=cget(k);if(c)return c;const j=await jget(`/anime/${id}/characters`);
 c=j.data.filter(x=>x.role==='Main').slice(0,5).map(x=>{const n=x.character.name;return{n:n.includes(', ')?n.split(', ').reverse().join(' '):n,img:x.character.images?.jpg?.image_url||''}});cset(k,c);return c}
function cachedChars(not){const out=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!/^quiz_ch_\d+$/.test(k)||k==='quiz_ch_'+not)continue;const c=cget(k);if(c)c.forEach(x=>out.push(x.n))}}catch(e){}return out}
function strip(s,a){let t=s.replace(/\s*\[Written by MAL Rewrite\]\s*/g,'').replace(/\(Source:[^)]*\)/g,'').trim();
 const names=new Set();a.alt.forEach(x=>{names.add(x);x.split(/[:\-–]/).forEach(p=>{p=p.trim();if(p.length>3)names.add(p)})});
 [...names].sort((x,y)=>y.length-x.length).forEach(n=>{t=t.replace(new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'),'____')});
 const m=t.match(/^(.{60,280}?[.!?])(\s|$)/s);return m?m[1]:t.slice(0,260)+'…'}
/* traduzioni per le domande generate */
const GEN_IT={Action:'Azione',Adventure:'Avventura',Comedy:'Commedia',Drama:'Drammatico',Fantasy:'Fantasy',Horror:'Horror',Mystery:'Mistero',Romance:'Sentimentale','Sci-Fi':'Fantascienza','Slice of Life':'Slice of life',Sports:'Sport',Supernatural:'Soprannaturale',Suspense:'Thriller',Gourmet:'Cucina',
 Music:'Musica',School:'Scolastico',Mecha:'Robot (mecha)',Historical:'Storico',Military:'Militare',Isekai:'Isekai','Martial Arts':'Arti marziali',Space:'Spazio',Vampire:'Vampiri',Samurai:'Samurai',Psychological:'Psicologico',Idols:'Idol','Time Travel':'Viaggi nel tempo',Detective:'Investigativo',Survival:'Sopravvivenza','Video Game':'Videogiochi',Mythology:'Mitologia','Super Power':'Superpoteri',Racing:'Corse',Workplace:'Lavoro','Team Sports':'Sport di squadra'};
const GEN_ALL=[...new Set(Object.values(GEN_IT))];
const SRC_IT={Manga:'Un manga','Light novel':'Una light novel',Original:'Una storia originale','Visual novel':'Una visual novel','Web manga':'Un web manga',Novel:'Un romanzo',Game:'Un videogioco','4-koma manga':'Un manga 4-koma','Web novel':'Una web novel'};
const SRC_ALL=Object.values(SRC_IT);
const SEAS={winter:'Inverno',spring:'Primavera',summer:'Estate',fall:'Autunno'};
const TY_IT={TV:'Serie TV',Movie:'Film',OVA:'OVA',ONA:'ONA (web)',Special:'Special'};
function yearOpts(y){const ds=new Set([y]);while(ds.size<4){const d=y+(Math.random()<.5?-1:1)*(1+(Math.random()*6|0));if(d<=new Date().getFullYear())ds.add(d)}return sh([...ds].map(String))}
function numOpts(n){const c=new Set([12,13,24,25,26,10,11,22,23,36,37,39,48,50,51,52,64,74,75,100,112,148,153,167,201,220,291,366,500,n-1,n+1,n-2,n+2,n*2,Math.round(n/2),Math.round(n*1.5)].filter(x=>x>0&&x!==n));
 const near=[...c].sort((a,b)=>Math.abs(Math.log(a/n))-Math.abs(Math.log(b/n))).slice(0,6);return sh([n,...sh(near).slice(0,3)]).map(String)}
/* Tipi di domanda: ognuno ritorna una domanda (con id stabile, per non ripeterla) oppure null */
function makers(L){
 const titles=a=>sh([a.t,...sh(L.filter(b=>b.t!==a.t).map(b=>b.t)).slice(0,3)]);
 const studios=[...new Set(L.flatMap(a=>a.st))];
 const four=(a,ok)=>{const o=sh(L.filter(b=>b.id!==a.id&&ok(b)));return o.length>=3?[a,...o.slice(0,3)]:null};
 const base=a=>({img:a.img,an:a.t,aid:a.id});
 return{
  year:a=>a.y?{id:'y'+a.id,q:`In che anno è uscito "${a.t}"?`,ok:String(a.y),ch:yearOpts(a.y),...base(a)}:null,
  studio:a=>{if(!a.st.length)return null;const o=sh(studios.filter(s=>!a.st.includes(s))).slice(0,3);return o.length<3?null:{id:'s'+a.id,q:`Quale studio ha animato "${a.t}"?`,ok:a.st[0],ch:sh([a.st[0],...o]),...base(a)}},
  syn:a=>a.syn.length>80?{id:'t'+a.id,q:'A quale anime si riferisce questa trama?',sn:strip(a.syn,a),ok:a.t,ch:titles(a),...base(a)}:null,
  img:a=>a.img?{id:'i'+a.id,q:'Di quale anime è questa locandina?',pic:a.img,ok:a.t,ch:titles(a),an:a.t,aid:a.id}:null,
  eps:a=>a.ty==='TV'&&a.ep>=2&&a.ep<=1200?{id:'e'+a.id,q:`Quanti episodi ha "${a.t}"?`,ok:String(a.ep),ch:numOpts(a.ep),...base(a)}:null,
  src:a=>{const ok=SRC_IT[a.src];if(!ok)return null;return{id:'o'+a.id,q:`Da che cosa è tratto "${a.t}"?`,ok,ch:sh([ok,...sh(SRC_ALL.filter(x=>x!==ok)).slice(0,3)]),...base(a)}},
  genre:a=>{const g=[...new Set(a.gen.map(x=>GEN_IT[x]).filter(Boolean))];if(!g.length)return null;const ok=sh(g)[0],w=sh(GEN_ALL.filter(x=>!g.includes(x))).slice(0,3);
   return{id:'g'+a.id+ok,q:`Quale di questi generi appartiene a "${a.t}"?`,ok,ch:sh([ok,...w]),...base(a)}},
  season:a=>{if(!a.se||!a.y||!SEAS[a.se])return null;const ok=`${SEAS[a.se]} ${a.y}`,o=new Set([ok]);
   while(o.size<4){const s=Object.values(SEAS)[Math.random()*4|0],y=a.y+(Math.random()<.6?0:(Math.random()<.5?-1:1));o.add(`${s} ${y}`)}
   return{id:'n'+a.id,q:`In quale stagione è iniziato "${a.t}"?`,ok,ch:sh([...o]),...base(a)}},
  type:a=>{const ok=TY_IT[a.ty];if(!ok)return null;return{id:'k'+a.id,q:`Che cos'è "${a.t}"?`,ok,ch:sh([ok,...sh(Object.values(TY_IT).filter(x=>x!==ok)).slice(0,3)]),...base(a)}},
  jp:a=>/[\u3040-\u30ff\u4e00-\u9fff]/.test(a.tj)&&a.tj!==a.t?{id:'j'+a.id,q:`Quale anime in Giappone si intitola «${a.tj}»?`,ok:a.t,ch:titles(a),...base(a)}:null,
  first:a=>{if(!a.y)return null;const f=four(a,b=>b.y);if(!f)return null;const ys=new Set();const g=[a,...f.slice(1)].filter(b=>!ys.has(b.y)&&ys.add(b.y));if(g.length<4)return null;
   const ok=g.reduce((m,b)=>b.y<m.y?b:m);return{id:'f'+g.map(b=>b.id).sort().join('.'),q:'Quale di questi anime è uscito per primo?',ok:ok.t,ch:sh(g.map(b=>b.t)),img:ok.img,an:`${ok.t} (${ok.y})`,aid:a.id}},
  score:a=>{if(!a.sc)return null;const f=four(a,b=>b.sc&&Math.abs(b.sc-a.sc)>=.3);if(!f)return null;const s=[...f].sort((x,y)=>y.sc-x.sc);if(s[0].sc-s[1].sc<.25)return null;
   return{id:'v'+f.map(b=>b.id).sort().join('.'),q:'Quale di questi anime ha il voto più alto su MyAnimeList?',ok:s[0].t,ch:sh(f.map(b=>b.t)),img:s[0].img,an:`${s[0].t} (${s[0].sc.toFixed(2)})`,aid:a.id}},
  pop:a=>{if(!a.mem)return null;const f=four(a,b=>b.mem);if(!f)return null;const s=[...f].sort((x,y)=>y.mem-x.mem);if(s[0].mem<s[1].mem*1.4)return null;
   return{id:'p'+f.map(b=>b.id).sort().join('.'),q:'Quale di questi anime ha più fan (membri) su MyAnimeList?',ok:s[0].t,ch:sh(f.map(b=>b.t)),img:s[0].img,an:s[0].t,aid:a.id}},
  char:async a=>{let cs=[];try{cs=await chars(a.id)}catch(e){}if(!cs.length)return null;const c=sh(cs)[0];
   return{id:'c'+a.id+c.n,q:`A quale anime appartiene il personaggio ${c.n}?`,pic:c.img,small:1,ok:a.t,ch:titles(a),...base(a)}},
  who:async a=>{let cs=[];try{cs=await chars(a.id)}catch(e){}if(!cs.length)return null;const mine=new Set(cs.map(x=>x.n)),o=sh([...new Set(cachedChars(a.id))].filter(n=>!mine.has(n))).slice(0,3);if(o.length<3)return null;
   const c=sh(cs)[0];return{id:'w'+a.id+c.n,q:`Quale di questi personaggi compare in "${a.t}"?`,ok:c.n,ch:sh([c.n,...o]),...base(a),pic:a.img}}}}
const TYPES_W=['syn','syn','img','img','char','char','year','studio','eps','src','genre','season','jp','first','score','pop','who','type'];
async function build(){const L=await pool(),out=[],sa=new Set(seenA()),sq=new Set(seenQ()),M=makers(L),used=new Set();
 const fresh=sh(L.filter(a=>!sa.has(a.id))),old=sh(L.filter(a=>sa.has(a.id))),pick=fresh.concat(old); // prima gli anime mai visti
 const types=sh(TYPES_W),cnt={};let net=0;
 for(let round=0;round<3&&out.length<ROUND-BANK_PER_ROUND;round++)for(const ty of types){if(out.length>=ROUND-BANK_PER_ROUND)break;if((cnt[ty]||0)>=2)continue;
  for(const a of pick){if(used.has(a.id))continue;
   if(/char|who/.test(ty)&&net>=4)break; // massimo 4 chiamate extra a Jikan per partita
   if(/char|who/.test(ty))net++;
   const x=await M[ty](a);if(!x){if(/char|who/.test(ty))break;continue}if(sq.has(x.id))continue;
   x.ty=ty;out.push(x);used.add(a.id);cnt[ty]=(cnt[ty]||0)+1;break}}
 return out}
function fallback(n){const sq=new Set(seenQ());let idx=sh(BANK.map((_,i)=>i).filter(i=>!sq.has(BANK_ID[i])));
 if(idx.length<n){const rest=seenQ().map(id=>BANK_ID.indexOf(id)).filter(i=>i>=0&&!idx.includes(i));idx=idx.concat(rest)} // le più vecchie prima
 return idx.slice(0,n).map(i=>{const [q,ok,w]=BANK[i];return{q,ok,ch:sh([ok,...w.slice(0,3)]),id:BANK_ID[i]}})}
/* sincronizzazione con l'account Discord (tabella quiz_seen, vedi aggiornamento-3.sql). Se la tabella non c'è, resta solo il localStorage. */
async function cloudLoad(A){if(!A.sb||!A.user)return;try{const {data,error}=await A.sb.from('quiz_seen').select('seen').eq('user_id',A.user.id).limit(1);if(!error&&data&&data[0])mergeSeen(data[0].seen)}catch(e){}}
async function cloudSave(A){if(!A.sb||!A.user)return;try{await A.sb.from('quiz_seen').upsert({user_id:A.user.id,seen:seenQ().slice(-SEENQ_MAX)},{onConflict:'user_id'})}catch(e){}}
const timeout=(p,ms)=>Promise.race([p,new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),ms))]);
window.__quizTest={BANK,BANK_ID,fallback,strip,build,remember,makers,pool,seenQ};

function make(A){
 const {q,qa,E,stage,msg}=A;
 stage.innerHTML=`<div class="ghud"><span>Domanda <b id="qn">0</b>/${ROUND}</span><span>Punti <b id="sc">0</b></span><span>Record <b id="rec">${+localStorage.quiz_best||0}</b></span><button class="mute" id="mute" aria-label="Audio"></button></div>
 <div class="quiz" id="qz"><div class="qbox"><p class="big" style="font-size:1.6rem">Quiz anime</p><p class="muted">${ROUND} domande, ${PER_Q} secondi ciascuna. Più rispondi in fretta, più bonus prendi.</p></div></div>
 <button class="btn sm" id="go">Gioca</button><p class="gmsg"></p><p class="muted small qsrc">Dati: <a href="https://jikan.moe" target="_blank" rel="noopener">Jikan</a> / MyAnimeList</p>`;
 A.muteBtn(q('#mute'));const z=q('#qz'),still=A.RM();
 let streak=0,Q=[],k=0,score=0,right=0,t0=0,raf=0,lock=false,alive=true,nextT=0,st='idle';
 const SFX={ok:()=>{A.beep(880,.07,0,.05);A.beep(1320,.12,.07,.05)},no:()=>A.beep(200,.25,0,.06,140),tick:()=>A.beep(1200,.02,0,.02),end:()=>[523,659,784,1047].forEach((f,i)=>A.beep(f,.1,i*.1,.05))};
 async function start(){if(!A.user||st==='load')return;A.audio();st='load';q('#go').hidden=true;msg('');z.innerHTML='<div class="qbox"><p class="muted">Preparo le domande…</p><div class="qload"></div></div>';
  await timeout(cloudLoad(A),4000).catch(()=>{});
  let src='api';try{Q=await timeout(build(),14000)}catch(e){Q=[];src='bank'}if(!alive)return;
  if(Q.length===0)src='bank';Q=sh(Q.concat(fallback(ROUND-Q.length))).slice(0,ROUND);remember(Q);cloudSave(A);streak=0;
  if(src==='bank')msg('Domande di riserva (API non disponibile).');k=0;score=0;right=0;st='run';q('#sc').textContent=0;show()}
 function show(){lock=false;const x=Q[k];q('#qn').textContent=k+1;
  z.innerHTML=`<div class="qbox"><div class="qtime"><i id="qt"></i></div><p class="qq">${E(x.q)}</p>${x.pic?`<img src="${E(x.pic)}" alt="" class="qpic${x.small?' sm':''}">`:''}${x.sn?`<blockquote class="qsyn">${E(x.sn)}</blockquote>`:''}
  <div class="qopts">${x.ch.map((c,i)=>`<button class="qopt" data-i="${i}"><kbd>${i+1}</kbd> ${E(c)}</button>`).join('')}</div><div class="qafter" id="qa"></div></div>`;
  qa('.qopt',z).forEach(b=>b.onclick=()=>answer(+b.dataset.i));t0=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(tick)}
 let lastSec=99;function tick(now){if(lock)return;const left=Math.max(0,PER_Q-(now-t0)/1000),bar=q('#qt');if(bar)bar.style.width=(left/PER_Q*100)+'%';
  const s=Math.ceil(left);if(s<=3&&s!==lastSec&&s>0)SFX.tick();lastSec=s;if(left<=0)return answer(-1);raf=requestAnimationFrame(tick)}
 function answer(i){if(lock||st!=='run')return;lock=true;cancelAnimationFrame(raf);const x=Q[k],left=Math.max(0,PER_Q-(performance.now()-t0)/1000),good=i>=0&&x.ch[i]===x.ok;
  qa('.qopt',z).forEach((b,j)=>{b.disabled=true;if(x.ch[j]===x.ok)b.classList.add('ok');else if(j===i)b.classList.add('no')});
  if(good){right++;streak++;score+=100+Math.round(left/PER_Q*100);SFX.ok();if(streak>1){A.tone('triangle',660*Math.pow(2,Math.min(streak,12)/12),.15,.16,.045);msg('Serie di '+streak+' 🔥')}const s=q('#sc');s.textContent=score;A.pop(s)}else{SFX.no();streak=0;msg('');if(!still){z.classList.remove('shake');void z.offsetWidth;z.classList.add('shake')}}
  q('#qa').innerHTML=`${x.img&&!x.pic?`<img src="${E(x.img)}" alt="" class="qimg">`:''}<span>${good?'Giusto!':(i<0?'Tempo scaduto.':'Sbagliato.')} ${x.an?`<b>${E(x.an)}</b>`:''}</span><button class="btn sm" id="qnext">${k+1<Q.length?'Avanti →':'Risultato'}</button>`;
  q('#qnext').onclick=next;clearTimeout(nextT);nextT=setTimeout(next,good?2200:3200)}
 function next(){clearTimeout(nextT);if(st!=='run')return;if(++k<Q.length)return show();end()}
 function end(){st='done';SFX.end();z.innerHTML=`<div class="qbox"><p class="big">${score}</p><p class="muted">${right}/${Q.length} risposte giuste</p></div>`;
  const g=q('#go');g.textContent='Rigioca';g.hidden=false;
  if(score>(+localStorage.quiz_best||0)){localStorage.quiz_best=score;q('#rec').textContent=score;msg(`Nuovo record! ${score} punti.`)}else msg(`Fine! ${score} punti.`);
  if(score>0)A.save('quiz',score)}
 const kd=e=>{if(A.cur!=='quiz'||st!=='run')return;if(/^[1-4]$/.test(e.key)&&!lock){e.preventDefault();answer(+e.key-1)}else if(e.key==='Enter'&&lock){e.preventDefault();next()}};
 addEventListener('keydown',kd);
 q('#go').onclick=e=>{e.currentTarget.blur();start()};
 return()=>{alive=false;cancelAnimationFrame(raf);clearTimeout(nextT);removeEventListener('keydown',kd);st='idle'}}
(window.GIOCHI_EXTRA=window.GIOCHI_EXTRA||{}).quiz={t:'Quiz anime',d:'10 domande da migliaia di anime (personaggi, trame, locandine, anni, studi, episodi, generi, voti e altro) + centinaia di domande scritte a mano: non ti ricapitano le stesse. Rispondi con un tocco o con i tasti 1-4: più sei veloce, più punti fai.',unit:'punti',asc:false,make};
})();
