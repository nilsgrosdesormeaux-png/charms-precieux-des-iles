-- Les 12 pièces de départ (photos déjà hébergées sur le site GitHub)
insert into public.pieces (nom, collection, categorie, prix_centimes, description, photos, statut, ordre) values
  ('Héritage Tropicale', 'elixir', 'collier', 4999, 'Nous ouvrons cette collection avec une pièce d''exception : « Héritage Tropicale »
Un collier inspiré des trésors de l''océan et de la beauté intemporelle des îles.
Orné de détails délicats et d''un pendentif central aux nuances tropicales, ce bijou raconte une histoire de voyage, de nature et d''élégance. Chaque charme a été soigneusement sélectionné pour créer une composition unique, comme un souvenir précieux rapporté d''un paradis lointain.

Chaque création est unique : les pierres, perles et éléments naturels présentent des variations qui font de votre bijou une pièce véritablement exclusive.', '[{"full":"images/p1-1.jpg","mini":"images/mini/p1-1.webp"},{"full":"images/p1-2.jpg","mini":"images/mini/p1-2.webp"}]'::jsonb, 'en_vente', 1),
  ('Eden Tropical', 'elixir', 'boucle', 2599, 'Boucles d''oreilles « Éden Tropical »

Un souffle d''évasion, une invitation au voyage...
Avec leurs coquillages aux nuances naturelles et leurs créoles dorées baignées de lumière, les boucles d''oreilles « Eden Tropical » capturent l''âme des îles et la magie des couchers de soleil sur l''océan.
Chaque détail évoque les trésors que la mer dépose sur le rivage, transformés en un bijou élégant et intemporel.
Chaque paire est unique : la nature ne crée jamais deux coquillages identiques, faisant de votre bijou une pièce exclusive, à votre image.', '[{"full":"images/p2-1.jpg","mini":"images/mini/p2-1.webp"},{"full":"images/p2-2.jpg","mini":"images/mini/p2-2.webp"}]'::jsonb, 'en_vente', 2),
  ('Coquillage des Marées', 'elixir', 'collier', 6099, 'Né entre les mangroves et les eaux cristallines,
« Coquillage des Marées » rend hommage aux trésors façonnés par l''océan au fil du temps.
Son pendentif coquillage aux nuances délicates est entouré de Charms inspirés de la vie marine, symboles de liberté, d''aventure et de connexion avec la nature. Chaque détail raconte une histoire, celle des marées qui déposent sur le rivage les plus beaux souvenirs des îles.
Chaque création est unique : les coquillages et éléments qui composent ce collier possèdent leurs propres particularités naturelles, faisant de chaque pièce un bijou exclusif.', '[{"full":"images/p3-1.jpg","mini":"images/mini/p3-1.webp"},{"full":"images/p3-2.jpg","mini":"images/mini/p3-2.webp"}]'::jsonb, 'en_vente', 3),
  ('En tchè COCO', 'elixir', 'boucle', 2599, 'Un parfum d''évasion, une douceur des îles...
Les boucles d''oreilles « En tchè coco » capturent l''essence même des tropiques : la chaleur du soleil couchant, le sable doré et le murmure des vagues.
Leur pendentif nacré orné d''un délicat palmier évoque ces instants suspendus, cocktail à la main, face à l''horizon.
Chaque paire est unique : les reflets naturels de la nacre varient subtilement, rendant votre bijou aussi singulier que vous.', '[{"full":"images/p4-1.jpg","mini":"images/mini/p4-1.webp"},{"full":"images/p4-2.jpg","mini":"images/mini/p4-2.webp"}]'::jsonb, 'en_vente', 4),
  ('Manman d''Lo', 'elixir', 'collier', 4999, 'Inspiré de la légendaire gardienne des eaux et des rivières, « Manman d''Lo » est un collier qui célèbre la force, la beauté et le mystère des eaux tropicales.
Suspendu entre ciel et cascade, ce bijou aux reflets dorés évoque les trésors cachés au cœur de la nature. Ses détails délicats et ses pierres aux teintes profondes rappellent les eaux cristallines, les forêts luxuriantes et l''âme des îles.
Chaque élément raconte une histoire, celle d''un héritage précieux transmis par la nature et porté avec élégance.
Chaque création est unique, réalisée avec soin pour offrir un bijou aussi singulier que celle qui le porte.', '[{"full":"images/p5-1.jpg","mini":"images/mini/p5-1.webp"},{"full":"images/p5-2.jpg","mini":"images/mini/p5-2.webp"}]'::jsonb, 'en_vente', 5),
  ('Nacre Divine', 'elixir', 'boucle', 2599, 'Élégantes, lumineuses et empreintes de douceur, les boucles d''oreilles « Nacre Divine » célèbrent la beauté naturelle des îles et la pureté de l''océan.
Leur nacre aux reflets délicats capte la lumière à chaque mouvement, tandis que leur médaille dorée apporte une touche précieuse et intemporelle. Un bijou inspiré par les trésors marins, conçu pour sublimer chaque instant.
Entre ciel, mer et soleil, « Nacre Divine » incarne l''élégance tropicale et la féminité dans toute sa splendeur.', '[{"full":"images/p6-1.jpg","mini":"images/mini/p6-1.webp"},{"full":"images/p6-2.jpg","mini":"images/mini/p6-2.webp"}]'::jsonb, 'en_vente', 6),
  ('Luméa', 'elixir', 'boucle', 2599, 'Une pluie de perles délicates qui danse à chacun de vos mouvements, inspirée par la lumière et la beauté des îles !', '[{"full":"images/p8-1.jpg","mini":"images/mini/p8-1.webp"},{"full":"images/p8-2.jpg","mini":"images/mini/p8-2.webp"}]'::jsonb, 'en_vente', 7),
  ('Écume dorée', 'essence', 'boucle', 2599, 'Découvrez notre boucle d''oreille « Écume dorée », une création qui évoque la douceur de la mer, la pureté des coquillages blancs et la chaleur des détails dorés. Inspirée des trésors de l''océan, cette pièce unique célèbre la rencontre entre la nacre et l''éclat de l''or, pour illuminer chaque instant avec délicatesse et raffinement.', '[{"full":"images/p9-1.jpg","mini":"images/mini/p9-1.webp"},{"full":"images/p9-2.jpg","mini":"images/mini/p9-2.webp"}]'::jsonb, 'en_vente', 8),
  ('Spirale des Caraïbes', 'essence', 'bracelet', 2299, 'Au cœur des eaux turquoise, là où les vagues viennent se briser avec force contre les rochers anciens, naît une énergie indomptable : le fracas répété sculpte la matière.
C''est dans cet équilibre entre puissance et douceur qu''est née la « Spirale des Caraïbes ».', '[{"full":"images/p10-1.jpg","mini":"images/mini/p10-1.webp"},{"full":"images/p10-2.jpg","mini":"images/mini/p10-2.webp"}]'::jsonb, 'en_vente', 9),
  ('Floraison Précieuse', 'essence', 'boucle', 2599, 'Une ode délicate à la beauté des îles : elle capture l''instant magique où la nature tropicale s''épanouit sous la lumière dorée du soleil.
Ces boucles d''oreilles finement sculptées en forme de fleurs exotiques évoquent la grâce de l''hibiscus en pleine floraison !', '[{"full":"images/p11-1.jpg","mini":"images/mini/p11-1.webp"},{"full":"images/p11-2.jpg","mini":"images/mini/p11-2.webp"}]'::jsonb, 'en_vente', 10),
  ('Auréa', 'essence', 'bracelet', 2299, 'Un éclat de lumière inspiré des trésors naturels des îles. Des cristaux lumineux enlacés d''or pour révéler votre élégance avec délicatesse.', '[{"full":"images/p12-1.jpg","mini":"images/mini/p12-1.webp"},{"full":"images/p12-2.jpg","mini":"images/mini/p12-2.webp"}]'::jsonb, 'en_vente', 11),
  ('Carafes de Madinina', 'essence', 'boucle', 2599, 'Un hommage délicat à l''emblématique carafe martiniquaise, réinterprétée en miniature pour devenir une pièce de bijouterie singulière.
Cette reproduction, réalisée avec soin et montée sur des attaches élégantes, transforme un objet chargé de souvenirs en un bijou contemporain, léger et plein de caractère.
Une création inspirée de Madinina, de son patrimoine et de ces petits détails qui racontent notre histoire.
CARAFES DE MADININA
L''élégance de nos souvenirs, autrement.', '[{"full":"images/p14-1.jpg","mini":"images/mini/p14-1.webp"},{"full":"images/p14-2.jpg","mini":"images/mini/p14-2.webp"}]'::jsonb, 'en_vente', 12);
