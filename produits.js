/* =====================================================================
   CATALOGUE DE LA BOUTIQUE — c'est le SEUL fichier à modifier au quotidien
   =====================================================================

   Pour modifier sur GitHub : ouvrir ce fichier, cliquer sur le crayon ✏️,
   faire la modification, puis « Commit changes ». Le site se met à jour
   tout seul en 1 à 2 minutes.

   Chaque pièce est un bloc { ... } séparé par une virgule. Les champs :

     id          identifiant unique, sans espace (ex. "p15"). Ne jamais réutiliser.
     nom         nom affiché
     collection  "elixir" (Élixir des Îles) ou "essence" (Essence des Caraïbes)
     categorie   "collier", "bracelet" ou "boucle"
     prix        en euros, avec un POINT (ex. 25.99)
     paiement    le lien Stripe de la pièce (https://buy.stripe.com/...)
                 Laisser "" tant qu'il n'existe pas : le bouton devient alors
                 « Ajouter au panier » (demande par e-mail).
     vendue      false = en vente, true = vendue (ruban « vendue », plus de bouton)
     photos      liste des photos, la 1re est la principale.
                 Déposer les photos dans le dossier images/ (format .jpg,
                 1200 px de large maximum) puis écrire "images/nom-du-fichier.jpg"
     description texte entre deux accents graves ` ... ` (les retours à la ligne
                 sont conservés). Ne pas utiliser d'accent grave dans le texte.

   ⚠️ Quand une pièce est vendue : passer vendue à true ici. Dans Stripe,
   régler chaque lien sur « Limiter le nombre de paiements : 1 » pour qu'une
   pièce unique ne puisse jamais être payée deux fois.
   ===================================================================== */

const PIECES = [
  {
    id: "p1",
    nom: "Héritage Tropicale",
    collection: "elixir",
    categorie: "collier",
    prix: 49.99,
    paiement: "",
    vendue: false,
    photos: ["images/p1-1.jpg", "images/p1-2.jpg"],
    description: `Nous ouvrons cette collection avec une pièce d'exception : « Héritage Tropicale »
Un collier inspiré des trésors de l'océan et de la beauté intemporelle des îles.
Orné de détails délicats et d'un pendentif central aux nuances tropicales, ce bijou raconte une histoire de voyage, de nature et d'élégance. Chaque charme a été soigneusement sélectionné pour créer une composition unique, comme un souvenir précieux rapporté d'un paradis lointain.

Chaque création est unique : les pierres, perles et éléments naturels présentent des variations qui font de votre bijou une pièce véritablement exclusive.`
  },
  {
    id: "p2",
    nom: "Eden Tropical",
    collection: "elixir",
    categorie: "boucle",
    prix: 25.99,
    paiement: "",
    vendue: false,
    photos: ["images/p2-1.jpg", "images/p2-2.jpg"],
    description: `Boucles d'oreilles « Éden Tropical »

Un souffle d'évasion, une invitation au voyage...
Avec leurs coquillages aux nuances naturelles et leurs créoles dorées baignées de lumière, les boucles d'oreilles « Eden Tropical » capturent l'âme des îles et la magie des couchers de soleil sur l'océan.
Chaque détail évoque les trésors que la mer dépose sur le rivage, transformés en un bijou élégant et intemporel.
Chaque paire est unique : la nature ne crée jamais deux coquillages identiques, faisant de votre bijou une pièce exclusive, à votre image.`
  },
  {
    id: "p3",
    nom: "Coquillage des Marées",
    collection: "elixir",
    categorie: "collier",
    prix: 60.99,
    paiement: "",
    vendue: false,
    photos: ["images/p3-1.jpg", "images/p3-2.jpg"],
    description: `Né entre les mangroves et les eaux cristallines,
« Coquillage des Marées » rend hommage aux trésors façonnés par l'océan au fil du temps.
Son pendentif coquillage aux nuances délicates est entouré de Charms inspirés de la vie marine, symboles de liberté, d'aventure et de connexion avec la nature. Chaque détail raconte une histoire, celle des marées qui déposent sur le rivage les plus beaux souvenirs des îles.
Chaque création est unique : les coquillages et éléments qui composent ce collier possèdent leurs propres particularités naturelles, faisant de chaque pièce un bijou exclusif.`
  },
  {
    id: "p4",
    nom: "En tchè COCO",
    collection: "elixir",
    categorie: "boucle",
    prix: 25.99,
    paiement: "",
    vendue: false,
    photos: ["images/p4-1.jpg", "images/p4-2.jpg"],
    description: `Un parfum d'évasion, une douceur des îles...
Les boucles d'oreilles « En tchè coco » capturent l'essence même des tropiques : la chaleur du soleil couchant, le sable doré et le murmure des vagues.
Leur pendentif nacré orné d'un délicat palmier évoque ces instants suspendus, cocktail à la main, face à l'horizon.
Chaque paire est unique : les reflets naturels de la nacre varient subtilement, rendant votre bijou aussi singulier que vous.`
  },
  {
    id: "p5",
    nom: "Manman d'Lo",
    collection: "elixir",
    categorie: "collier",
    prix: 49.99,
    paiement: "",
    vendue: false,
    photos: ["images/p5-1.jpg", "images/p5-2.jpg"],
    description: `Inspiré de la légendaire gardienne des eaux et des rivières, « Manman d'Lo » est un collier qui célèbre la force, la beauté et le mystère des eaux tropicales.
Suspendu entre ciel et cascade, ce bijou aux reflets dorés évoque les trésors cachés au cœur de la nature. Ses détails délicats et ses pierres aux teintes profondes rappellent les eaux cristallines, les forêts luxuriantes et l'âme des îles.
Chaque élément raconte une histoire, celle d'un héritage précieux transmis par la nature et porté avec élégance.
Chaque création est unique, réalisée avec soin pour offrir un bijou aussi singulier que celle qui le porte.`
  },
  {
    id: "p6",
    nom: "Nacre Divine",
    collection: "elixir",
    categorie: "boucle",
    prix: 25.99,
    paiement: "",
    vendue: false,
    photos: ["images/p6-1.jpg", "images/p6-2.jpg"],
    description: `Élégantes, lumineuses et empreintes de douceur, les boucles d'oreilles « Nacre Divine » célèbrent la beauté naturelle des îles et la pureté de l'océan.
Leur nacre aux reflets délicats capte la lumière à chaque mouvement, tandis que leur médaille dorée apporte une touche précieuse et intemporelle. Un bijou inspiré par les trésors marins, conçu pour sublimer chaque instant.
Entre ciel, mer et soleil, « Nacre Divine » incarne l'élégance tropicale et la féminité dans toute sa splendeur.`
  },
  {
    id: "p8",
    nom: "Luméa",
    collection: "elixir",
    categorie: "boucle",
    prix: 25.99,
    paiement: "",
    vendue: false,
    photos: ["images/p8-1.jpg", "images/p8-2.jpg"],
    description: `Une pluie de perles délicates qui danse à chacun de vos mouvements, inspirée par la lumière et la beauté des îles !`
  },
  {
    id: "p9",
    nom: "Écume dorée",
    collection: "essence",
    categorie: "boucle",
    prix: 25.99,
    paiement: "",
    vendue: false,
    photos: ["images/p9-1.jpg", "images/p9-2.jpg"],
    description: `Découvrez notre boucle d'oreille « Écume dorée », une création qui évoque la douceur de la mer, la pureté des coquillages blancs et la chaleur des détails dorés. Inspirée des trésors de l'océan, cette pièce unique célèbre la rencontre entre la nacre et l'éclat de l'or, pour illuminer chaque instant avec délicatesse et raffinement.`
  },
  {
    id: "p10",
    nom: "Spirale des Caraïbes",
    collection: "essence",
    categorie: "bracelet",
    prix: 22.99,
    paiement: "",
    vendue: false,
    photos: ["images/p10-1.jpg", "images/p10-2.jpg"],
    description: `Au cœur des eaux turquoise, là où les vagues viennent se briser avec force contre les rochers anciens, naît une énergie indomptable : le fracas répété sculpte la matière.
C'est dans cet équilibre entre puissance et douceur qu'est née la « Spirale des Caraïbes ».`
  },
  {
    id: "p11",
    nom: "Floraison Précieuse",
    collection: "essence",
    categorie: "boucle",
    prix: 25.99,
    paiement: "",
    vendue: false,
    photos: ["images/p11-1.jpg", "images/p11-2.jpg"],
    description: `Une ode délicate à la beauté des îles : elle capture l'instant magique où la nature tropicale s'épanouit sous la lumière dorée du soleil.
Ces boucles d'oreilles finement sculptées en forme de fleurs exotiques évoquent la grâce de l'hibiscus en pleine floraison !`
  },
  {
    id: "p12",
    nom: "Auréa",
    collection: "essence",
    categorie: "bracelet",
    prix: 22.99,
    paiement: "",
    vendue: false,
    photos: ["images/p12-1.jpg", "images/p12-2.jpg"],
    description: `Un éclat de lumière inspiré des trésors naturels des îles. Des cristaux lumineux enlacés d'or pour révéler votre élégance avec délicatesse.`
  },
  {
    id: "p14",
    nom: "Carafes de Madinina",
    collection: "essence",
    categorie: "boucle",
    prix: 25.99,
    paiement: "",
    vendue: false,
    photos: ["images/p14-1.jpg", "images/p14-2.jpg"],
    description: `Un hommage délicat à l'emblématique carafe martiniquaise, réinterprétée en miniature pour devenir une pièce de bijouterie singulière.
Cette reproduction, réalisée avec soin et montée sur des attaches élégantes, transforme un objet chargé de souvenirs en un bijou contemporain, léger et plein de caractère.
Une création inspirée de Madinina, de son patrimoine et de ces petits détails qui racontent notre histoire.
CARAFES DE MADININA
L'élégance de nos souvenirs, autrement.`
  }
];
