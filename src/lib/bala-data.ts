export type Genre = "green" | "blue" | "pink" | "orange";

export type Game = {
  slug: string;
  title: string;
  poster: string;
  genre: string;
  genreColor: Genre;
  tagline: string;
  desc: string;
  difficulty: number;
  action: number;
  tag: "first" | "horror" | "popular";
  /** Jei true — kortelėje rodomas cinematinis loop'as iš /assets/loops/<slug>.{webm,mp4,jpg}. */
  loop?: boolean;
};

export const GAMES: Game[] = [
  {
    slug: "dragon-tower",
    title: "Drakonų bokštas",
    poster: "/assets/drakonu-bokstas-vr-pabegimo-kambarys-klaipedoje.webp",
    genre: "Nuotykių",
    genreColor: "green",
    tagline: "Ar spėsite pabėgti prieš sugrįžtant drakonams?",
    desc: "Alchemikas įkalino jus senoviniame bokšte. O danguje jau sukasi drakonai. Šeimai draugiškas nuotykis, puikiai tinkantis pirmą kartą.",
    difficulty: 3,
    action: 2,
    tag: "first",
    loop: true,
  },
  {
    slug: "ninja-trials",
    title: "Nindzių išbandymai",
    poster: "/assets/nindziu-isbandymai-vr-pabegimo-kambarys-klaipedoje.webp",
    genre: "Kovų",
    genreColor: "pink",
    tagline: "Šiąnakt jūs tampate tikrais nindzėmis.",
    desc: "Mokytojas paskyrė tris užduotis: Kovos, Slaptumo ir Dvasios išbandymus. Šeimai draugiškas kambarys, kupinas iššūkių visiems amžiams.",
    difficulty: 1,
    action: 4,
    tag: "first",
  },
  {
    slug: "manor-of-escape",
    title: "Bepročio grafo dvaras",
    poster: "/assets/beprocio-grafo-dvaras-vr-pabegimo-kambarys-klaipedoje.webp",
    genre: "Trileris",
    genreColor: "pink",
    tagline: "Dingstantys žmonės. Keisti eksperimentai. Vidurnaktis artėja.",
    desc: "Miestelio dvare jau seniai girdisi šiurpūs riksmai, o žmonės dingsta be pėdsako. Ar išdrįsite įžengti į dvarą?",
    difficulty: 3,
    action: 2,
    tag: "horror",
    loop: true,
  },
  {
    slug: "space-station-tiberia",
    title: "Kosminė stotis Tiberija",
    poster: "/assets/kosmine-stotis-tiberija-vr-pabegimo-kambarys-klaipedoje.webp",
    genre: "Mokslinė fantastika",
    genreColor: "blue",
    tagline: "Artėja meteoritas. Ar spėsite išgelbėti Žemę?",
    desc: "Didžiulis meteoritas tuoj trenksis į Žemę, o laiko liko visai nedaug. Jūs ir jūsų komanda – vienintelė viltis išgelbėti planetą.",
    difficulty: 4,
    action: 1,
    tag: "popular",
    loop: true,
  },
  {
    slug: "pirates-plague",
    title: "Piratų prakeiksmas",
    poster: "/assets/piratu-prakeiksmas-vr-pabegimo-kambarys-klaipedoje.webp",
    genre: "Nuotykių",
    genreColor: "orange",
    tagline: "Įgulą kausto mirtina liga. Ar spėsite rasti vaistą?",
    desc: "Mirtina liga apėmė visą įgulą, o laiko lieka vis mažiau. Kovokite su piratais, spręskite galvosūkius ir raskite vaistą, kol nevėlu. Aktyvus ir intensyvus nuotykis.",
    difficulty: 2,
    action: 3,
    tag: "popular",
    loop: true,
  },
  {
    slug: "cyberscape",
    title: "Kiberpasaulis",
    poster: "/assets/kiberpasaulis-vr-pabegimo-kambarys-klaipedoje.webp",
    genre: "Kiberpankas",
    genreColor: "blue",
    tagline: "Įžengėte į pagrindinį tinklą. Sunaikinkite virusą. Ištrūkite.",
    desc: "Sukčiaujantis dirbtinis intelektas paleistas miesto pagrindiniame tinkle. Greito tempo neoninis trileris: lengvas pradėti, gilus pasinerti.",
    difficulty: 3,
    action: 2,
    tag: "popular",
  },
  {
    slug: "alien-infection",
    title: "Ateivių infekcija",
    poster: "/assets/ateiviu-infekcija-vr-pabegimo-kambarys-klaipedoje.webp",
    genre: "Sci-fi trileris",
    genreColor: "orange",
    tagline: "Keisti garsai danguje. Dingęs kačiukas. Ir infekcija, kuri plinta.",
    desc: "Keisti įvykiai vyksta vietiniame miške. Jūsų ugniagesių komanda iškviesta surasti dingusį kačiuką.",
    difficulty: 4,
    action: 1,
    tag: "horror",
  },
  {
    slug: "depths-of-osiris",
    title: "Osirio gelmės",
    poster: "/assets/osirio-gelmes-vr-pabegimo-kambarys-klaipedoje.webp",
    genre: "Povandeninis",
    genreColor: "blue",
    tagline: "Po vandeniu laikas bėga greičiau. O deguonies vis mažiau.",
    desc: "Jūs ir komanda leidžiatės į vandenyno gelmes, kur neseniai atrasta prarasta Ozirio šventykla. Įtempta povandeninės archeologijos istorija.",
    difficulty: 4,
    action: 1,
    tag: "popular",
    loop: true,
  },
  {
    slug: "runaway-train",
    title: "Bėgantis traukinys",
    poster: "/assets/begantis-traukinys-vr-pabegimo-kambarys-klaipedoje.webp",
    genre: "Vesternas",
    genreColor: "orange",
    tagline: "Sustabdykite traukinį prieš katastrofą.",
    desc: "Stabdžių nebėra. Konduktoriaus nebėra. Vienintelis dalykas tarp traukinio ir bedugnės – jūsų komanda.",
    difficulty: 5,
    action: 2,
    tag: "popular",
    loop: true,
  },
];

export const FEATURED_SLUGS = ["dragon-tower", "depths-of-osiris", "manor-of-escape"];

export const TAG_LABEL: Record<Game["tag"], string> = {
  first: "⭐ Geriausias pirmam kartui",
  horror: "😱 Stipriausias siaubo scenarijus",
  popular: "🏆 Populiariausias",
};

export const TAG_CLASS: Record<Game["tag"], string> = {
  first: "bg-genre-blue text-[#06222b]",
  horror: "bg-genre-pink text-[#3a0410]",
  popular: "bg-volt text-volt-ink",
};

export const DIFFICULTY_LABEL: Record<number, string> = {
  1: "Labai lengva",
  2: "Pradedantiesiems",
  3: "Vidutiniška",
  4: "Sudėtinga",
  5: "Ekspertams",
};

export type GameDetail = {
  year: number;
  players: string;
  time: string;
  description: string[];
  tags: string[];
  /** YouTube video ID (dalis po v= arba youtu.be/), pvz. "dQw4w9WgXcQ". Tuščia = video nerodomas. */
  youtubeId?: string;
};

export const GAME_DETAILS: Record<string, GameDetail> = {
  "dragon-tower": {
    year: 2018,
    players: "2 – 6",
    time: "iki 45 min.",
    description: [
      "Alchemikas įkalino jus senoviniame bokšte. O danguje jau sukasi drakonai.",
      "Virkite eliksyrus, įminkite pilies paslaptis ir raskite kelią laukan – arba tapkite drakono pietumis.",
      "Drakonų bokštas – šeimai draugiškas fantastinis nuotykis, puikiai tinkantis pirmą kartą.",
    ],
    tags: ["Viduramžiai", "Drakonai", "Magija", "Eliksyrai", "Šaudymas", "Šeimai draugiška"],
    youtubeId: "q5j8YFyfsHo",
  },
  "ninja-trials": {
    year: 2023,
    players: "2 – 6",
    time: "iki 45 min.",
    description: [
      "Šiąnakt jūs tampate tikrais nindzėmis. Bet tai nebus lengva.",
      "Mokytojas paskyrė tris užduotis: Kovos, Slaptumo ir Dvasios išbandymus. Tik įvaldę šiuos įgūdžius būsite pasiruošę.",
      "Nindzių išbandymai – šeimai draugiškas kambarys, kupinas pramogų ir iššūkių visiems amžiams.",
    ],
    tags: ["Japonija", "Kardai", "Kova", "Magija", "Boso kova", "Šeimai draugiška"],
    youtubeId: "ScEbCy35OVo",
  },
  "manor-of-escape": {
    year: 2021,
    players: "2 – 6",
    time: "iki 45 min.",
    description: [
      "Miestelio dvare jau seniai girdisi šiurpūs riksmai, o žmonės dingsta be pėdsako.",
      "Meras nusamdė jus sugauti išprotėjusį grafą Molumą, kuris atlieka siaubingus eksperimentus.",
      "Ar išdrįsite įžengti į dvarą, įvykdyti misiją ir išgelbėti miestelį?",
    ],
    tags: ["Šiurpu", "Vaiduoklių dvaras", "Beprotis mokslininkas", "Šaudymas", "Lankas", "Boso kova"],
    youtubeId: "N6-DvwH4g34",
  },
  "space-station-tiberia": {
    year: 2017,
    players: "2 – 6",
    time: "iki 45 min.",
    description: [
      "Didžiulis meteoritas tuoj trenksis į Žemę, o laiko liko visai nedaug.",
      "Turite nuskristi į kosminę stotį ir ją suremontuoti, kol dar ne vėlu.",
      "Jūs ir jūsų komanda – vienintelė viltis išgelbėti planetą.",
    ],
    tags: ["Kosmosas", "Raketos", "Nesvarumas", "Astronautai", "Šeimai draugiška"],
    youtubeId: "DBWe9lacAps",
  },
  "pirates-plague": {
    year: 2021,
    players: "2 – 6",
    time: "iki 45 min.",
    description: [
      "Mirtina liga apėmė visą jūsų įgulą, o laiko lieka vis mažiau.",
      "Kovokite su kitais piratais, spręskite galvosūkius ir raskite vaistą, kol dar ne vėlu! Aktyvus ir intensyvus – puikiai tinka norintiems azarto.",
      "Piratų prakeiksmas – šurmuliuojanti istorija komandoms, nebijančioms susitepti rankų.",
    ],
    tags: ["Piratai", "Kardai", "Lobiai", "Monstrai", "Navigacija", "Boso kova"],
    youtubeId: "nEgKuMh1lIQ",
  },
  cyberscape: {
    year: 2025,
    players: "2 – 6",
    time: "iki 45 min.",
    description: [
      "Sukčiaujantis dirbtinis intelektas paleistas miesto pagrindiniame tinkle, ir jis išalkęs.",
      "Užsidėkite akinius ir leiskitės skaitmeniniais bėgiais pačios sistemos viduje. Suraskite virusą, nukirskite šaltinį ir sprukite, kol jis jūsų neatsekė.",
      "Kiberpasaulis – greito tempo neoninis trileris: lengvas pradėti, gilus pasinerti.",
    ],
    tags: ["Kiberpankas", "Logika", "Virusas", "Lazeriai", "Statymas", "Komandinis"],
    youtubeId: "9kSQ-MLwWJY",
  },
  "alien-infection": {
    year: 2024,
    players: "2 – 6",
    time: "iki 45 min.",
    description: [
      "Keisti įvykiai vyksta vietiniame miške. Jūsų ugniagesių komanda iškviesta surasti dingusį kačiuką.",
      "Garsai ir šviesos danguje šiurpina žmones. Drąsūs gelbėtojai leidžiasi į mišką, nežinodami, kokie priešai jų laukia.",
      "Ar spėsite pabėgti, išgelbėti kačiuką ir visą pasaulį nuo mirtinos infekcijos?",
    ],
    tags: ["Ateiviai", "NSO", "Šiurpu", "Kosmosas", "Sci-fi"],
    youtubeId: "ZyLLaPA9yQI",
  },
  "depths-of-osiris": {
    year: 2020,
    players: "2 – 6",
    time: "iki 45 min.",
    description: [
      "Jūs ir komanda leidžiatės į vandenyno gelmes, kur neseniai atrasta prarasta Ozirio šventykla.",
      "Jūsų tikslas – atgauti legendinį artefaktą. Bet paslaptinga šventykla saugo daugiau nei paslaptis.",
      "Osirio gelmės – įtempta povandeninės archeologijos istorija komandoms, mėgstančioms tamsą.",
    ],
    tags: ["Po vandeniu", "Rykliai", "Atlantida", "Steampunk", "Nardymas"],
    youtubeId: "Kt1WQiFVwso",
  },
  "runaway-train": {
    year: 2022,
    players: "2 – 6",
    time: "iki 45 min.",
    description: [
      "Stabdžių nebėra. Konduktoriaus nebėra. Vienintelis dalykas tarp traukinio ir bedugnės – jūsų komanda.",
      "Eikite per judančius vagonus, traukite teisingas svirtis ir melskitės, kad nukirpote tinkamą laidą.",
      "Aukšto intensyvumo Laukinių Vakarų trileris komandoms, mokančioms išlaikyti šaltą galvą.",
    ],
    tags: ["Vesternas", "Kaubojai", "Traukiniai", "Ginklai", "Boso kova"],
    youtubeId: "8iGISrU-Da0",
  },
};

export function getGame(slug: string) {
  const game = GAMES.find((g) => g.slug === slug);
  const detail = GAME_DETAILS[slug];
  if (!game || !detail) return null;
  return { ...game, ...detail };
}

export const PRICING = [
  { players: "2 žaidėjai", price: "50", unit: "€", per: "25 €/asm.", popular: false },
  { players: "3 žaidėjai", price: "65", unit: "€", per: "21,67 €/asm.", popular: false },
  { players: "4–6 žaidėjai", price: "20", unit: "€/asm.", per: "Viena komanda", popular: true },
  { players: "7–10 žaidėjų", price: "20", unit: "€/asm.", per: "Dvi komandos vienu metu", popular: false },
];

export const REVIEWS = [
  {
    text: `„Labai patiko! Žaidėme „Bepročio grafo dvarą" — kai puola, slepiesi po stalu, labai daug juoko."`,
    initial: "I",
    name: "Indrė V.",
    game: "Bepročio grafo dvaras",
  },
  {
    text: `„Praėjome pabėgimo kambarį — buvo ir apie ką pagalvoti, ir iš ko pasijuokti. Vedėjas išsamiai paaiškino taisykles. Būtinai grįšime."`,
    initial: "M",
    name: "Maryna K.",
    game: "Grupė 35+ metų",
  },
  {
    text: `„Labai patiko, išgelbėjom kačiuką! Tikrai sugrįšim dar kartą."`,
    initial: "D",
    name: "Deimantas R.",
    game: "Ateivių infekcija",
  },
  {
    text: `„Belekoks prikolas — komandiškai nusikelti į kitą pasaulį, spręsti iššūkius kartu. Labai geras dalykas teambuildingui."`,
    initial: "L",
    name: "Lukas Č.",
    game: "Kolektyvo šventė",
  },
  {
    text: `„Pirmas kartas! Ir toks geras įspūdis. Laikas ištirpo, o geros emocijos liko. Personalas pasitinka su šypsena."`,
    initial: "I",
    name: "Ilona S.",
    game: "Pirmas kartas VR",
  },
  {
    text: `„Esu sužavėta virtualios realybės grafika. Tiek daug emocijų! Puiki galimybė pasitikrinti komandinio darbo stiprybes."`,
    initial: "D",
    name: "Dovilė S.",
    game: "Komandinis nuotykis",
  },
];

export const FAQ_ITEMS = [
  {
    q: "Ar reikia patirties su VR?",
    a: "Visiškai ne. Prieš žaidimą instruktorius supažindina su įranga ir valdymu. Dauguma mūsų klientų VR išbando pirmą kartą — ir puikiai susitvarko.",
  },
  {
    q: "Ar žaidžiant pykina?",
    a: "Mūsų VR pabėgimo kambariuose jūs judate po realią erdvę, o ne sėdite vietoje, todėl pykinimas beveik nepasireiškia. Jei pajusite nuovargį — visada galima trumpam nusiimti akinius.",
  },
  {
    q: "Nuo kokio amžiaus galima žaisti?",
    a: "Vieniems paaugliams rekomenduojame nuo 13 metų. Jaunesni gali žaisti kartu su suaugusiais — padėsime parinkti tinkamą, šeimai draugišką scenarijų.",
  },
  {
    q: "Kiek trunka žaidimas?",
    a: "Pačiame kitame pasaulyje praleidžiate 35–50 min., priklausomai nuo scenarijaus ir komandos patirties. Su instruktažu bei aptarimu iš viso apie 1 val.",
  },
  {
    q: "Kiek žmonių telpa komandoje?",
    a: "Pabėgimo kambaryje žaidžia nuo 2 iki 6 žaidėjų vienoje komandoje. Didesniems kolektyvams sudarome kelias grupes — parašykite mums.",
  },
  {
    q: "O jeigu neišspręsime?",
    a: "Nieko baisaus. Instruktorius stebi visą žaidimą ir prireikus duoda užuominų. Svarbiausia — kartu smagiai praleisti laiką, o ne bet kokia kaina pabėgti.",
  },
  {
    q: "Ar galime tarpusavyje kalbėtis?",
    a: "Būtinai! Girdite ir matote vieni kitus visą nuotykį, kartu laisvai judate ta pačia erdve. Bendravimas ir komandinis darbas — tikrasis raktas į pergalę.",
  },
  {
    q: "Ar baisu?",
    a: "Priklauso nuo scenarijaus. Yra šeimai draugiškų nuotykių (Drakonų bokštas, Nindzių išbandymai) ir įtemptesnių istorijų (Ateivių infekcija, Bepročio grafo dvaras). Padėsime išsirinkti pagal jūsų komandą.",
  },
];

export const PROCESS_STEPS = [
  {
    num: "01",
    title: "Rezervuoji",
    desc: "Pasirenki datą, laiką ir žaidėjų skaičių internetu arba paskambinęs. Patvirtinimą gauni akimirksniu, jokio išankstinio mokėjimo nereikia.",
    meta: "2 min rezervacija",
    icon: "calendar" as const,
  },
  {
    num: "02",
    title: "Atvyksti, pasirenki scenarijų",
    desc: "Susirenkate su komanda Pajūrio g. 5B. Kartu su instruktoriumi išsirenkate scenarijų, tinkantį jūsų komandos patirčiai ir norimam įtampos lygiui.",
    meta: "9 scenarijai",
    icon: "people" as const,
  },
  {
    num: "03",
    title: "Instruktažas ir akiniai",
    desc: "Instruktorius paaiškina valdymą, atsako į visus klausimus ir padeda tinkamai užsidėti VR akinius. Jokios išankstinės patirties nereikia.",
    meta: "~10 min pasiruošimas",
    icon: "headset" as const,
  },
  {
    num: "04",
    title: "Azartas ir galvosūkiai",
    desc: "Įžengiate į kitą pasaulį. Judate, dairotės, kalbatės su komanda, ieškote užuominų ir sprendžiate galvosūkius taip, lyg būtumėte pačiame žaidime.",
    meta: "iki 50 min žaidimo",
    icon: "face" as const,
    active: true,
  },
  {
    num: "05",
    title: "Aptarimas su komanda",
    desc: "Nusiimate akinius, kartu aptariate nuotykį ir nusprendžiate, į kurį pasaulį grįšite kitą kartą.",
    meta: "Bendra nuotrauka",
    icon: "chat" as const,
  },
];

export const AUDIENCES = [
  { emoji: "🎂", title: "Gimtadienis", body: "Kitoks gimtadienis be telefonų rankose – ar tai paauglių, ar suaugusiųjų šventė, apie kurią dar ilgai kalbės visi svečiai." },
  { emoji: "💍", title: "Bernvakaris / mergvakaris", body: "Azartas, juokas ir gera pradžia nepamirštamam vakarui." },
  { emoji: "❤️", title: "Pasimatymas", body: "Pamirškite kiną – kartu spręskite galvosūkius ir patirkite tikrą nuotykį." },
  { emoji: "🏢", title: "Komandos formavimas", body: "Bendradarbiavimas, emocijos ir daug juoko." },
  { emoji: "👥", title: "Vakaras su draugais", body: "Puiki idėja savaitgalio vakarui ar spontaniškam susitikimui." },
  { emoji: "👨‍👩‍👧", title: "Laikas su šeima", body: "Padėkite telefonus į šalį ir kartu leiskitės į nuotykį." },
];

/* ── Verslo kontaktai (NAP – vienodi visur, SEO nuoseklumui) ─────────── */
export const BUSINESS = {
  name: "Bala VR",
  legalName: "Bala VR",
  legalNote: "Šarūnas Valius, Individualios veiklos vykdymo pažyma Nr. 1379347",
  url: "https://bala-vr-nextjs.vercel.app",
  phoneDisplay: "+370 684 26686",
  phoneHref: "tel:+37068426686",
  phoneE164: "+37068426686",
  email: "",
  streetAddress: "Paj\u016Brio g. 5B",
  addressExtra: "Prekybos centro 2 auk\u0161tas",
  addressLocality: "Klaip\u0117da",
  addressRegion: "Klaip\u0117dos apskritis",
  addressCountry: "LT",
  bookingUrl: "https://bala.lt/",
  facebookUrl: "https://www.facebook.com/BalaVRzaidimai/",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Paj%C5%ABrio%20g.%205B%2C%20Klaip%C4%97da",
  openingHours: [
    { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "12:00", closes: "21:00" },
    { days: ["Saturday", "Sunday"], opens: "11:00", closes: "20:00" },
  ],
} as const;
