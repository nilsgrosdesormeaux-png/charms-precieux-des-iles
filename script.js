/* Fonctionnement du site. Le catalogue se modifie dans produits.js, pas ici. */
const EMAIL_CONTACT = "contact@charmsprecieux.fr";
const NOMS_COLLECTIONS = { elixir: "Élixir des Îles", essence: "Essence des Caraïbes" };
const PAGES = ["accueil", "savoir-faire", "boutique", "faq", "mentions-legales", "cgv", "confidentialite", "livraison-retours"];

const pieces = PIECES;
let filtreActuel = "tous";
let panier = [];
let detailActuel = null;
let indexPhoto = 0;

/* Le panier est gardé dans le navigateur du visiteur (rien n'est envoyé). */
try { panier = JSON.parse(localStorage.getItem("panier") || "[]").filter(id => pieces.some(p => p.id === id && !p.vendue)); } catch (e) { panier = []; }
function memoriserPanier() { try { localStorage.setItem("panier", JSON.stringify(panier)); } catch (e) {} }

function escHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function prixTexte(p) { return typeof p.prix === "number" ? p.prix.toFixed(2).replace(".", ",") + " €" : ""; }

/* ---- NAVIGATION (chaque page a sa propre adresse : #boutique, #cgv, ...) ---- */
function afficherPage(nom, sansHistorique) {
  if (!PAGES.includes(nom)) nom = "accueil";
  document.querySelectorAll(".page").forEach(p => p.classList.remove("actif"));
  const page = document.getElementById("page-" + nom);
  page.classList.add("actif");
  document.querySelectorAll(".liens button").forEach(b => b.classList.toggle("actif", b.dataset.page === nom));
  if (!sansHistorique && location.hash !== "#" + nom) history.pushState(null, "", nom === "accueil" ? location.pathname : "#" + nom);
  window.scrollTo(0, 0);
  const reveals = page.querySelectorAll(".reveal");
  reveals.forEach(el => el.classList.remove("visible"));
  reveals.forEach((el, i) => setTimeout(() => el.classList.add("visible"), 70 * i));
}
window.addEventListener("popstate", () => { fermerDetail(); afficherPage(location.hash.slice(1) || "accueil", true); });
document.addEventListener("click", e => {
  const lien = e.target.closest("a[data-page]");
  if (!lien) return;
  e.preventDefault();
  fermerDetail(); fermerTout();
  afficherPage(lien.dataset.page);
});

/* ---- BOUTIQUE ---- */
/* Vignette légère (images/mini/xxx.webp) si elle existe, sinon la photo d'origine. */
function mini(src) { return /^images\/[^/]+\.jpe?g$/i.test(src) ? src.replace(/^images\/(.+)\.jpe?g$/i, "images/mini/$1.webp") : src; }
function imgMini(src, attrs) {
  return `<img src="${escHtml(mini(src))}" data-orig="${escHtml(src)}" onerror="if(this.src.indexOf('/mini/')>-1){this.src=this.dataset.orig}else{this.style.display='none'}" ${attrs}>`;
}
/* La 2e photo n'est chargée qu'au premier survol (inutile sur mobile). */
function chargerSurvol(carte) {
  const img = carte.querySelector("img.sec-img[data-src]");
  if (img) { img.src = img.dataset.src; img.removeAttribute("data-src"); }
}

function carteHtml(p) {
  const photos = p.photos || [];
  const img1 = photos[0] ? imgMini(photos[0], `class="hero-img" alt="${escHtml(p.nom)}" loading="lazy" decoding="async"`) : `<div class="placeholder">photo à venir</div>`;
  const img2 = photos[1] ? `<img class="sec-img" data-src="${escHtml(mini(photos[1]))}" data-orig="${escHtml(photos[1])}" onerror="if(this.src.indexOf('/mini/')>-1)this.src=this.dataset.orig" alt="" decoding="async">` : "";
  return `
    <div class="piece ${p.vendue ? "vendue" : ""}" onclick="ouvrirDetail('${p.id}')" onmouseenter="chargerSurvol(this)">
      <div class="piece-image">
        ${p.vendue ? '<div class="ruban">vendue</div>' : ""}
        ${img1}${img2}
      </div>
      <div class="piece-corps">
        <div class="piece-nom">${escHtml(p.nom)}</div>
        <div class="piece-unique">pièce unique</div>
        <p class="piece-desc">${escHtml(p.description || "")}</p>
        <div class="piece-prix">${prixTexte(p)}</div>
        ${boutonHtml(p, true)}
      </div>
    </div>`;
}

function boutonHtml(p, avecStop) {
  const stop = avecStop ? "event.stopPropagation();" : "";
  if (p.vendue) return '<span class="piece-bouton indisponible">Pièce vendue</span>';
  if (p.paiement) return `<a class="piece-bouton payer" href="${escHtml(p.paiement)}" rel="noopener" onclick="${stop}">Acheter cette pièce</a>`;
  const label = panier.includes(p.id) ? "Ajoutée ✓" : "Ajouter au panier";
  return `<button class="piece-bouton" onclick="${stop}ajouterAuPanier('${p.id}')">${label}</button>`;
}

function listeFiltree(col) {
  let liste = pieces.filter(p => p.collection === col);
  if (filtreActuel !== "tous") liste = liste.filter(p => p.categorie === filtreActuel);
  return liste;
}
function afficherGrille() {
  let total = 0;
  Object.keys(NOMS_COLLECTIONS).forEach(col => {
    const liste = listeFiltree(col);
    total += liste.length;
    document.getElementById("bloc-" + col).style.display = liste.length ? "" : "none";
    document.getElementById("grille-" + col).innerHTML = liste.map(carteHtml).join("");
  });
  if (total === 0) {
    document.getElementById("bloc-elixir").style.display = "";
    document.getElementById("grille-elixir").innerHTML = `<div class="boutique-vide"><h3>Aucune pièce pour l'instant</h3><p>De nouvelles pièces uniques arrivent très vite.</p></div>`;
  }
}

document.getElementById("filtres").addEventListener("click", e => {
  if (!e.target.classList.contains("filtre")) return;
  document.querySelectorAll(".filtre").forEach(b => b.classList.remove("actif"));
  e.target.classList.add("actif");
  filtreActuel = e.target.dataset.cat;
  afficherGrille();
});

/* ---- FICHE PRODUIT ---- */
function ouvrirDetail(id) {
  const p = pieces.find(x => x.id === id);
  if (!p) return;
  detailActuel = p;
  indexPhoto = 0;
  document.getElementById("fp-fil-nom").textContent = p.nom;
  document.getElementById("fp-collection").textContent = NOMS_COLLECTIONS[p.collection] || "";
  document.getElementById("fp-nom").textContent = p.nom;
  document.getElementById("fp-desc").textContent = p.description || "";
  document.getElementById("fp-prix").textContent = prixTexte(p);
  majBoutonDetail();
  dessinerCarrousel();
  document.getElementById("voile-produit").classList.add("ouvert");
  document.body.style.overflow = "hidden";
}
function majBoutonDetail() {
  const p = detailActuel;
  let note = "";
  if (!p.vendue && p.paiement) note = '<p class="note-paiement">Paiement sécurisé par carte via Stripe. Frais de livraison indiqués avant validation. <a href="#livraison-retours" data-page="livraison-retours">Livraison &amp; retours</a></p>';
  document.getElementById("fp-bouton").innerHTML = boutonHtml(p, false) + note;
}
function fermerDetail() {
  document.getElementById("voile-produit").classList.remove("ouvert");
  document.body.style.overflow = "";
}
function dessinerCarrousel() {
  const photos = (detailActuel.photos || []).filter(Boolean);
  const carrousel = document.getElementById("fp-carrousel");
  const points = document.getElementById("fp-points");
  if (photos.length === 0) {
    carrousel.innerHTML = '<div class="placeholder" style="position:absolute;inset:0;">photo à venir</div>';
    points.innerHTML = "";
    return;
  }
  carrousel.innerHTML = photos.map((src, i) => `<img src="${escHtml(src)}" class="${i === indexPhoto ? "actif" : ""}" alt="${escHtml(detailActuel.nom)}, photo ${i + 1}">`).join("") +
    (photos.length > 1 ? `
      <button class="fp-fleche gauche" onclick="changerPhoto(-1)" aria-label="Photo précédente">&#8249;</button>
      <button class="fp-fleche droite" onclick="changerPhoto(1)" aria-label="Photo suivante">&#8250;</button>` : "");
  points.innerHTML = photos.length > 1 ? photos.map((_, i) => `<button class="fp-point ${i === indexPhoto ? "actif" : ""}" onclick="allerPhoto(${i})" aria-label="Photo ${i + 1}"></button>`).join("") : "";
}
function changerPhoto(dir) {
  const total = (detailActuel.photos || []).filter(Boolean).length;
  indexPhoto = (indexPhoto + dir + total) % total;
  dessinerCarrousel();
}
function allerPhoto(i) { indexPhoto = i; dessinerCarrousel(); }

/* ---- PANIER (demande par e-mail, pour les pièces sans lien Stripe) ---- */
function ajouterAuPanier(id) {
  if (!panier.includes(id)) panier.push(id);
  memoriserPanier(); mettreAJourBadge(); afficherGrille();
  if (detailActuel && detailActuel.id === id) majBoutonDetail();
}
function retirerDuPanier(id) {
  panier = panier.filter(x => x !== id);
  memoriserPanier(); mettreAJourBadge(); afficherGrille(); afficherPanier();
}
function mettreAJourBadge() {
  const badge = document.getElementById("badge-panier");
  badge.textContent = panier.length;
  badge.classList.toggle("vide", panier.length === 0);
}
function ouvrirPanier() { afficherPanier(); document.getElementById("voile-panier").classList.add("ouvert"); }
function fermerTout() { document.getElementById("voile-panier").classList.remove("ouvert"); }
function afficherPanier() {
  const cible = document.getElementById("liste-panier");
  const items = pieces.filter(p => panier.includes(p.id));
  const bouton = document.getElementById("bouton-envoyer-panier");
  if (items.length === 0) {
    cible.innerHTML = '<p style="font-size:0.9rem; color:var(--lagon-clair);">Votre panier est vide pour l\'instant.</p>';
    bouton.style.display = "none";
    return;
  }
  bouton.style.display = "block";
  cible.innerHTML = items.map(p => `
    <div class="ligne-panier">
      ${p.photos && p.photos[0] ? imgMini(p.photos[0], 'alt=""') : `<div style="width:44px;height:44px;background:#EFE6D6;"></div>`}
      <div class="infos"><div class="n">${escHtml(p.nom)}</div><div>${prixTexte(p)}</div></div>
      ${p.paiement ? `<a class="action-mini" href="${escHtml(p.paiement)}" rel="noopener">Payer</a>` : ""}
      <button class="action-mini" onclick="retirerDuPanier('${p.id}')">Retirer</button>
    </div>`).join("");
}
function envoyerPanier() {
  const items = pieces.filter(p => panier.includes(p.id));
  const liste = items.map(p => "- " + p.nom + (p.prix ? " (" + prixTexte(p) + ")" : "")).join("\n");
  const sujet = encodeURIComponent("Ma sélection Charms Précieux des Îles");
  const corps = encodeURIComponent("Bonjour,\n\nJe souhaite réserver les pièces suivantes :\n" + liste + "\n\nMerci de me confirmer la disponibilité.");
  window.location.href = `mailto:${EMAIL_CONTACT}?subject=${sujet}&body=${corps}`;
}

document.addEventListener("keydown", e => {
  if (e.key === "Escape") { fermerDetail(); fermerTout(); }
  if (detailActuel && document.getElementById("voile-produit").classList.contains("ouvert")) {
    if (e.key === "ArrowLeft") changerPhoto(-1);
    if (e.key === "ArrowRight") changerPhoto(1);
  }
});
document.getElementById("voile-panier").addEventListener("click", e => { if (e.target.id === "voile-panier") fermerTout(); });

/* ---- DÉMARRAGE ---- */
mettreAJourBadge();
afficherGrille();
afficherPage(location.hash.slice(1) || "accueil", true);
