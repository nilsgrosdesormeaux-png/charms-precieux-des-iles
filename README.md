# Charms Précieux des Îles — site de la boutique

Le site est une vitrine statique hébergée sur GitHub Pages, avec deux éléments en plus :
- **Supabase** pour la base de données (pièces, commandes, frais de port, photos) ;
- **Stripe Checkout** pour le paiement par carte.

## Pour Kinsy : gérer la boutique

Ouvrir **`…/charms-precieux-des-iles/gestion.html`** sur son téléphone, puis l'ajouter à l'écran d'accueil (Partager → « Sur l'écran d'accueil »).

| Onglet | Ce qu'on y fait |
|---|---|
| **Pièces** | « + Ajouter une pièce » : photos, nom, prix, description, catégorie, collection → **Publier**. La pièce est en ligne tout de suite. Toucher une pièce pour la modifier, la **masquer** (retirée du site sans être perdue) ou la supprimer. Les flèches ▲▼ changent l'ordre d'affichage. |
| **Commandes** | Les ventes arrivent ici automatiquement : nom, adresse (bouton « Copier »), pièces, total. Après l'envoi : saisir le numéro de suivi → « Marquer comme expédiée » → e-mail pré-rempli à envoyer à la cliente. |
| **Réglages** | Frais et délais de livraison par zone (métropole, outre-mer), ouverture ou fermeture d'une zone, mot de passe. |

Ce qui se fait tout seul :
- **Réservation** : une pièce est bloquée environ 30 minutes pendant qu'une cliente paie. Si elle abandonne, la pièce redevient disponible.
- **Pièce vendue** : elle passe en « vendue » dès que le paiement est validé. Elle ne peut jamais être vendue deux fois.
- **Photos** : elles sont réduites automatiquement, en grande taille plus une vignette, pour que le site reste rapide.

## Comment ça marche

```
Site (GitHub Pages) ──lit──> Supabase : pièces publiées, zones de livraison
        │
        └─ « Payer » ──> fonction checkout ──> réserve les pièces ──> page Stripe
                                                                       │
Stripe ──notifie──> fonction stripe-webhook ──> pièces « vendues » + commande enregistrée
gestion.html ──(connexion de Kinsy)──> Supabase : ajout, modification, commandes
```

Sans `config.js` rempli, ou si la base ne répond pas, le site affiche `produits.js` en secours, et le panier envoie une demande par e-mail.

## Fichiers

```
index.html        pages du site (accueil, savoir-faire, boutique, FAQ, merci, 4 pages légales)
gestion.html/.js/.css   espace gestion (mobile)
script.js         boutique, panier, paiement
config.js         adresse et clé PUBLIQUE de Supabase (sans danger)
produits.js       catalogue de secours (et données de départ)
style.css, fonts/, images/
supabase/migrations/   schéma de la base + règles de sécurité (RLS)
supabase/seed_pieces.sql  les 12 pièces de départ
supabase/functions/checkout        ouvre le paiement Stripe
supabase/functions/stripe-webhook  reçoit la confirmation de Stripe
```

## Mise en service (une seule fois)

1. Appliquer `supabase/migrations/20261120000000_boutique.sql`, puis `supabase/seed_pieces.sql`.
2. Créer le compte de Kinsy : Authentication → Users → « Add user », avec e-mail, mot de passe et « Auto confirm ». Ensuite :
   `insert into public.admins (email) values ('son-email');`
3. Déployer les fonctions `checkout` et `stripe-webhook`, **sans vérification JWT** (elles sont publiques et contrôlent tout elles-mêmes).
4. Secrets des fonctions : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SITE_URL=https://nilsgrosdesormeaux-png.github.io/charms-precieux-des-iles/`.
5. Stripe → Développeurs → Webhooks : ajouter `https://<projet>.supabase.co/functions/v1/stripe-webhook` avec les événements `checkout.session.completed` et `checkout.session.expired`.
6. Remplir `config.js` avec l'URL du projet et la clé publique (anon ou publishable).
7. Dans Gestion → Réglages : renseigner les frais de port et ouvrir les zones.
8. Tester en mode test Stripe (carte `4242 4242 4242 4242`), puis passer aux clés « live ».

## Avant l'ouverture

Chercher `À COMPLÉTER`, `À CONFIRMER` et `À VÉRIFIER` dans `index.html` (en orange sur le site) : médiateur de la consommation, téléphone, statut TVA, frais et délais de livraison, frais de retour, transporteur, messagerie, taxes outre-mer.
