/* Fonctionnement du site.
   Les pièces viennent de la base Supabase (gérée depuis gestion.html).
   Si la base n'est pas configurée ou ne répond pas, le site utilise produits.js en secours. */
const EMAIL_CONTACT = "contact@charmsprecieux.fr";
const NOMS_COLLECTIONS = { elixir: "Élixir des Îles", essence: "Essence des Caraïbes" };
const PAGES = ["accueil", "savoir-faire", "boutique", "faq", "mentions-legales", "cgv", "confidentialite", "livraison-retours", "merci"];
const EN_LIGNE = !!(window.CONFIG && CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY);

let pieces = [];
let zones = [];
let paiementActif = false;   // vrai quand la base répond et qu'au moins une zone de livraison est ouverte
let zoneChoisie = null;
let filtreActuel = "tous";
let panier = [];
let detailActuel = null;
let indexPhoto = 0;

function lireStock(cle, defaut) { try { return JSON.parse(localStorage.getItem(cle)) ?? defaut; } catch (e) { return defaut; } }
function ecrireStock(cle, val) { try { val === null ? localStorage.removeItem(cle) : localStorage.setItem(cle, JSON.stringify(val)); } catch (e) {} }
function memoriserPanier() { ecrireStock("panier", panier); }

function escHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function euros(n) { return n.toFixed(2).replace(".", ",") + " €"; }
function prixTexte(p) { return typeof p.prix === "number" ? euros(p.prix) : ""; }

/* ---- CHARGEMENT DES PIÈCES ---- */
function depuisProduitsJs() {
  return (typeof PIECES !== "undefined" ? PIECES : []).map(p => ({
    id: p.id, nom: p.nom, collection: p.collection, categorie: p.categorie, prix: p.prix,
    description: p.description, vendue: !!p.vendue, reservee: false, paiement: p.paiement || "",
    photos: p.photos || [], minis: (p.photos || []).map(miniAuto)
  }));
}
function depuisBase(r) {
  const photos = Array.isArray(r.photos) ? r.photos : [];
  return {
    id: r.id, nom: r.nom, collection: r.collection, categorie: r.categorie, prix: r.prix_centimes / 100,
    description: r.description, vendue: r.statut === "vendue",
    reservee: !!r.reservee_jusqua && new Date(r.reservee_jusqua) > new Date(),
    photos: photos.map(x => x.full), minis: photos.map(x => x.mini || miniAuto(x.full))
  };
}
async function lireBase(chemin) {
  const res = await fetch(CONFIG.SUPABASE_URL + "/rest/v1/" + chemin, {
    headers: { apikey: CONFIG.SUPABASE_ANON_KEY }
  });
  if (!res.ok) throw new Error("base " + res.status);
  return res.json();
}
async function chargerPieces() {
  if (EN_LIGNE) {
    try {
      const [lignes, z] = await Promise.all([
        lireBase("pieces?select=id,nom,collection,categorie,prix_centimes,description,photos,statut,reservee_jusqua&order=ordre.asc,cree_le.asc"),
        lireBase("zones_livraison?select=code,libelle,prix_centimes,delai&actif=eq.true&order=ordre.asc")
      ]);
      pieces = lignes.map(depuisBase);
      zones = z;
      paiementActif = zones.length > 0;
      if (zones.length && !zones.some(x => x.code === zoneChoisie)) zoneChoisie = lireStock("zone", null);
      if (!zones.some(x => x.code === zoneChoisie)) zoneChoisie = zones.length === 1 ? zones[0].code : null;
      return;
    } catch (e) { console.warn("Base indisponible, catalogue de secours utilisé.", e); }
  }
  pieces = depuisProduitsJs();
  zones = []; paiementActif = false;
}

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
  if (nom === "merci") { panier = []; memoriserPanier(); ecrireStock("session_paiement", null); mettreAJourBadge(); }
}
window.addEventListener("popstate", () => { fermerDetail(); afficherPage(location.hash.slice(1) || "accueil", true); });
document.addEventListener("click", e => {
  const lien = e.target.closest("a[data-page]");
  if (!lien) return;
  e.preventDefault();
  fermerDetail(); fermerTout();
  afficherPage(lien.dataset.page);
});

/* ---- PHOTOS ---- */
/* Vignette légère (images/mini/xxx.webp) pour les photos du site ; les photos envoyées depuis Gestion ont déjà la leur. */
function miniAuto(src) { return /^images\/[^/]+\.jpe?g$/i.test(src) ? src.replace(/^images\/(.+)\.jpe?g$/i, "images/mini/$1.webp") : src; }
function imgMini(mini, orig, attrs) {
  return `<img src="${escHtml(mini || orig)}" data-orig="${escHtml(orig)}" onerror="if(this.src!==this.dataset.orig&&this.dataset.orig){this.src=this.dataset.orig}else{this.style.display='none'}" ${attrs}>`;
}
/* La 2e photo n'est chargée qu'au premier survol (inutile sur mobile). */
function chargerSurvol(carte) {
  const img = carte.querySelector("img.sec-img[data-src]");
  if (img) { img.src = img.dataset.src; img.removeAttribute("data-src"); }
}

/* ---- BOUTIQUE ---- */
function carteHtml(p) {
  const img1 = p.photos[0] ? imgMini(p.minis[0], p.photos[0], `class="hero-img" alt="${escHtml(p.nom)}" loading="lazy" decoding="async"`) : `<div class="placeholder">photo à venir</div>`;
  const img2 = p.photos[1] ? `<img class="sec-img" data-src="${escHtml(p.minis[1] || p.photos[1])}" data-orig="${escHtml(p.photos[1])}" onerror="if(this.src!==this.dataset.orig)this.src=this.dataset.orig" alt="" decoding="async">` : "";
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
  if (p.reservee && !panier.includes(p.id)) return '<span class="piece-bouton indisponible" title="Une cliente est en train de la payer. Si elle abandonne, la pièce revient dans 30 minutes.">Réservée, paiement en cours</span>';
  if (!paiementActif && p.paiement) return `<a class="piece-bouton payer" href="${escHtml(p.paiement)}" rel="noopener" onclick="${stop}">Acheter cette pièce</a>`;
  if (panier.includes(p.id)) return `<button class="piece-bouton" onclick="${stop}ouvrirPanier()">Dans le panier ✓</button>`;
  return `<button class="piece-bouton ${avecStop ? "" : "payer"}" onclick="${stop}ajouterAuPanier('${p.id}', ${avecStop ? "false" : "true"})">${avecStop ? "Ajouter au panier" : "Acheter cette pièce"}</button>`;
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
  const note = !p.vendue ? '<p class="note-paiement">Paiement sécurisé par carte via Stripe. Frais de livraison indiqués avant le paiement. <a href="#livraison-retours" data-page="livraison-retours">Livraison &amp; retours</a></p>' : "";
  document.getElementById("fp-bouton").innerHTML = boutonHtml(p, false) + note;
}
function fermerDetail() {
  document.getElementById("voile-produit").classList.remove("ouvert");
  document.body.style.overflow = "";
}
function dessinerCarrousel() {
  const photos = detailActuel.photos.filter(Boolean);
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
  const total = detailActuel.photos.filter(Boolean).length;
  if (!total) return;
  indexPhoto = (indexPhoto + dir + total) % total;
  dessinerCarrousel();
}
function allerPhoto(i) { indexPhoto = i; dessinerCarrousel(); }

/* ---- PANIER ---- */
function ajouterAuPanier(id, ouvrir) {
  if (!panier.includes(id)) panier.push(id);
  memoriserPanier(); mettreAJourBadge(); afficherGrille();
  if (detailActuel && detailActuel.id === id) majBoutonDetail();
  if (ouvrir) { fermerDetail(); ouvrirPanier(); }
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
function messagePanier(texte, erreur) {
  const m = document.getElementById("panier-message");
  m.textContent = texte || "";
  m.className = "panier-message" + (erreur ? " erreur" : "");
}

function afficherPanier() {
  const cible = document.getElementById("liste-panier");
  const items = pieces.filter(p => panier.includes(p.id));
  const blocPaiement = document.getElementById("bloc-paiement");
  const boutonEmail = document.getElementById("bouton-envoyer-panier");
  if (items.length === 0) {
    cible.innerHTML = '<p style="font-size:0.9rem; color:var(--lagon-clair);">Votre panier est vide pour l\'instant.</p>';
    blocPaiement.style.display = "none"; boutonEmail.style.display = "none";
    return;
  }
  cible.innerHTML = items.map(p => `
    <div class="ligne-panier">
      ${p.photos[0] ? imgMini(p.minis[0], p.photos[0], 'alt=""') : `<div style="width:44px;height:44px;background:#EFE6D6;"></div>`}
      <div class="infos"><div class="n">${escHtml(p.nom)}</div><div>${p.vendue ? "<em>vendue entre-temps</em>" : prixTexte(p)}</div></div>
      <button class="action-mini" onclick="retirerDuPanier('${p.id}')">Retirer</button>
    </div>`).join("");

  if (!paiementActif) {
    blocPaiement.style.display = "none";
    boutonEmail.style.display = "block";
    return;
  }
  boutonEmail.style.display = "none";
  blocPaiement.style.display = "block";
  const sousTotal = items.filter(p => !p.vendue).reduce((s, p) => s + p.prix, 0);
  const zone = zones.find(z => z.code === zoneChoisie);
  document.getElementById("choix-zone").innerHTML = zones.map(z => `
    <label class="zone ${z.code === zoneChoisie ? "choisie" : ""}">
      <input type="radio" name="zone" value="${escHtml(z.code)}" ${z.code === zoneChoisie ? "checked" : ""} onchange="choisirZone(this.value)">
      <span><strong>${escHtml(z.libelle)}</strong><small>${escHtml(z.delai)}</small></span>
      <span class="zone-prix">${z.prix_centimes ? euros(z.prix_centimes / 100) : "offerte"}</span>
    </label>`).join("");
  document.getElementById("totaux").innerHTML = `
    <div><span>Sous-total</span><span>${euros(sousTotal)}</span></div>
    <div><span>Livraison</span><span>${zone ? (zone.prix_centimes ? euros(zone.prix_centimes / 100) : "offerte") : "à choisir"}</span></div>
    <div class="total"><span>Total</span><span>${euros(sousTotal + (zone ? zone.prix_centimes / 100 : 0))}</span></div>`;
  const bouton = document.getElementById("bouton-payer");
  bouton.disabled = !zone || items.some(p => p.vendue);
  bouton.textContent = "Payer par carte";
}
function choisirZone(code) { zoneChoisie = code; ecrireStock("zone", code); afficherPanier(); }

async function payer() {
  const bouton = document.getElementById("bouton-payer");
  bouton.disabled = true; bouton.textContent = "Ouverture du paiement sécurisé…";
  messagePanier("");
  try {
    const res = await fetch(CONFIG.SUPABASE_URL + "/functions/v1/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: CONFIG.SUPABASE_ANON_KEY },
      body: JSON.stringify({ pieces: panier, zone: zoneChoisie })
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.url) {
      ecrireStock("session_paiement", data.session || null);
      window.location.href = data.url;
      return;
    }
    messagePanier(data.erreur || "Le paiement n'a pas pu s'ouvrir. Réessayez dans un instant.", true);
    if (res.status === 409) { await chargerPieces(); afficherGrille(); }
  } catch (e) {
    messagePanier("Connexion impossible. Vérifiez votre réseau et réessayez.", true);
  }
  afficherPanier();
}

function envoyerPanier() {
  const items = pieces.filter(p => panier.includes(p.id));
  const liste = items.map(p => "- " + p.nom + (p.prix ? " (" + prixTexte(p) + ")" : "")).join("\n");
  const sujet = encodeURIComponent("Ma sélection Charms Précieux des Îles");
  const corps = encodeURIComponent("Bonjour,\n\nJe souhaite réserver les pièces suivantes :\n" + liste + "\n\nMerci de me confirmer la disponibilité.");
  window.location.href = `mailto:${EMAIL_CONTACT}?subject=${sujet}&body=${corps}`;
}

/* Retour depuis Stripe sans payer : on libère les pièces tout de suite. */
async function gererRetourPaiement() {
  const params = new URLSearchParams(location.search);
  if (params.get("paiement") !== "annule") return;
  history.replaceState(null, "", location.pathname + location.hash);
  const session = lireStock("session_paiement", null);
  ecrireStock("session_paiement", null);
  if (session && EN_LIGNE) {
    try {
      await fetch(CONFIG.SUPABASE_URL + "/functions/v1/checkout", {
        method: "POST", headers: { "Content-Type": "application/json", apikey: CONFIG.SUPABASE_ANON_KEY },
        body: JSON.stringify({ annuler: session })
      });
    } catch (e) {}
  }
  return true;
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
(async function demarrer() {
  afficherPage(location.hash.slice(1) || "accueil", true);
  const annule = await gererRetourPaiement();
  await chargerPieces();
  panier = lireStock("panier", []).filter(id => pieces.some(p => p.id === id && !p.vendue));
  memoriserPanier();
  mettreAJourBadge();
  afficherGrille();
  if (annule && panier.length) { ouvrirPanier(); messagePanier("Paiement annulé : vos pièces sont toujours dans votre panier."); }
})();
