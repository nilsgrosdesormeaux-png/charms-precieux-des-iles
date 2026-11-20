# Charms Précieux des Îles — site de la boutique

Site statique (HTML/CSS/JS, aucun serveur ni base de données), hébergé gratuitement par GitHub Pages.

## Ce qu'on modifie au quotidien

| Je veux…                         | Fichier à ouvrir | Quoi faire |
|----------------------------------|------------------|------------|
| Ajouter une pièce                | `produits.js`    | Copier un bloc `{ ... }`, changer `id`, nom, prix, photos, description |
| Marquer une pièce vendue         | `produits.js`    | `vendue: false` → `vendue: true` |
| Brancher le paiement Stripe      | `produits.js`    | Coller le lien dans `paiement: "https://buy.stripe.com/..."` |
| Ajouter des photos               | dossier `images/`| « Add file » → « Upload files » (format .jpg, 1200 px de large max) |
| Modifier les textes / pages légales | `index.html`  | Chercher le texte avec Ctrl+F dans l'éditeur GitHub |

Sur GitHub : ouvrir le fichier → crayon ✏️ → modifier → bouton vert **Commit changes**.
Le site se met à jour tout seul en 1 à 2 minutes.

## Réglages Stripe pour chaque lien de paiement

- **Limiter le nombre de paiements : 1**. C'est indispensable pour une pièce unique.
- **Collecter l'adresse de livraison**, avec les pays et territoires livrés (France, Martinique, Guadeloupe…).
- **Frais de livraison** : créer un tarif par zone, avec les mêmes montants que la page Livraison & retours.
- **Après le paiement** : rediriger vers l'adresse du site.
- Dans les réglages Stripe : activer l'envoi automatique des **reçus par e-mail**.

## Avant la mise en ligne

Chercher `À COMPLÉTER`, `À CONFIRMER` et `À VÉRIFIER` dans `index.html` (en orange sur le site) et tout remplir :
identité, adresse, SIREN, statut TVA, médiateur de la consommation, frais et délais de livraison, frais de retour, transporteur, fournisseur e-mail.

## Structure

```
index.html     pages du site (accueil, savoir-faire, boutique, FAQ, 4 pages légales)
produits.js    catalogue des pièces
style.css      apparence
script.js      fonctionnement (navigation, panier, fiche produit)
images/        photos
fonts/         polices (hébergées ici, sans appel à Google)
```
