/* Espace gestion de la boutique : pièces, commandes, frais de livraison. */
const NOMS_COLLECTIONS = { elixir: "Élixir des Îles", essence: "Essence des Caraïbes" };
const NOMS_CATEGORIES = { collier: "Collier", bracelet: "Bracelet", boucle: "Boucles d'oreilles" };
const NOMS_STATUTS = { en_vente: "En vente", vendue: "Vendue", masquee: "Masquée" };
const MAX_PHOTOS = 6;
const BUCKET = "photos";

const $ = id => document.getElementById(id);
const configOk = !!(window.CONFIG && CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY);
const sb = configOk ? supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY) : null;

let pieces = [];
let commandes = [];
let zones = [];
let filtrePieces = "tous";
let filtreCommandes = "a_expedier";
let edition = null;          // pièce en cours d'édition (null = nouvelle)
let photosEd = [];           // [{full, mini}] ou [{fichier, apercu}] pour les nouvelles
let photosASupprimer = [];   // chemins de stockage à effacer à l'enregistrement

/* ---------- Utilitaires ---------- */
function esc(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function euros(c) { return (c / 100).toFixed(2).replace(".", ",") + " €"; }
function toast(texte, erreur) {
  const t = $("toast");
  t.textContent = texte; t.className = "toast visible" + (erreur ? " erreur" : "");
  clearTimeout(toast.minuteur); toast.minuteur = setTimeout(() => t.className = "toast", erreur ? 5000 : 2500);
}
function urlPhoto(src) { return /^https?:/.test(src) ? src : "./" + src; }
function cheminStockage(url) {
  const marque = `/storage/v1/object/public/${BUCKET}/`;
  const i = String(url || "").indexOf(marque);
  return i >= 0 ? decodeURIComponent(url.slice(i + marque.length)) : null;
}
function prixEnCentimes(texte) {
  const n = Number(String(texte).replace(/\s|€/g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
}
function dateCourte(d) { return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); }

/* ---------- Connexion ---------- */
$("form-connexion").addEventListener("submit", async e => {
  e.preventDefault();
  if (!sb) { $("c-erreur").textContent = "La base n'est pas encore configurée (config.js)."; return; }
  $("c-erreur").textContent = "";
  const { error } = await sb.auth.signInWithPassword({ email: $("c-email").value.trim(), password: $("c-mdp").value });
  if (error) { $("c-erreur").textContent = "E-mail ou mot de passe incorrect."; return; }
  await entrer();
});
$("btn-deconnexion").addEventListener("click", async () => { await sb.auth.signOut(); location.reload(); });

async function entrer() {
  const { data: admin } = await sb.rpc("est_admin");
  if (!admin) {
    await sb.auth.signOut();
    $("c-erreur").textContent = "Ce compte n'a pas accès à la gestion de la boutique.";
    return;
  }
  $("ecran-connexion").hidden = true;
  $("ecran-app").hidden = false;
  await Promise.all([chargerPieces(), chargerCommandes(), chargerZones()]);
}

/* ---------- Onglets ---------- */
document.querySelectorAll(".onglet").forEach(b => b.addEventListener("click", () => {
  document.querySelectorAll(".onglet").forEach(x => x.classList.toggle("actif", x === b));
  ["pieces", "commandes", "reglages"].forEach(v => $("vue-" + v).hidden = v !== b.dataset.vue);
  window.scrollTo(0, 0);
  if (b.dataset.vue === "commandes") chargerCommandes();
}));
function brancherFiltres(idConteneur, rappel) {
  $(idConteneur).addEventListener("click", e => {
    const b = e.target.closest(".puce"); if (!b) return;
    $(idConteneur).querySelectorAll(".puce").forEach(x => x.classList.toggle("actif", x === b));
    rappel(b.dataset.f);
  });
}
brancherFiltres("filtre-statut", f => { filtrePieces = f; afficherPieces(); });
brancherFiltres("filtre-commandes", f => { filtreCommandes = f; afficherCommandes(); });

/* ---------- Pièces ---------- */
async function chargerPieces() {
  const { data, error } = await sb.from("pieces").select("*").order("ordre").order("cree_le");
  if (error) { toast("Impossible de charger les pièces.", true); return; }
  pieces = data;
  afficherPieces();
}
function afficherPieces() {
  const cible = $("liste-pieces");
  const liste = pieces.filter(p => filtrePieces === "tous" || p.statut === filtrePieces);
  if (!liste.length) { cible.innerHTML = `<p class="vide-liste">Aucune pièce ici pour l'instant.</p>`; return; }
  let html = "";
  Object.keys(NOMS_COLLECTIONS).forEach(col => {
    const dansCol = liste.filter(p => p.collection === col);
    if (!dansCol.length) return;
    html += `<div class="titre-collection">${NOMS_COLLECTIONS[col]}</div>`;
    html += dansCol.map((p, i) => {
      const photo = p.photos?.[0];
      const reservee = p.statut === "en_vente" && p.reservee_jusqua && new Date(p.reservee_jusqua) > new Date();
      return `
      <div class="ligne" onclick="ouvrirEditeur('${p.id}')">
        ${photo ? `<img src="${esc(urlPhoto(photo.mini || photo.full))}" alt="" loading="lazy">` : `<div class="vide"></div>`}
        <div class="infos">
          <div class="nom">${esc(p.nom)}</div>
          <div class="sous">${euros(p.prix_centimes)} · ${NOMS_CATEGORIES[p.categorie] || ""}</div>
          <span class="statut ${reservee ? "reservee" : p.statut}">${reservee ? "Paiement en cours" : NOMS_STATUTS[p.statut]}</span>
        </div>
        ${filtrePieces === "tous" ? `<div class="fleches" onclick="event.stopPropagation()">
          <button type="button" aria-label="Monter" onclick="deplacer('${p.id}', -1)" ${i === 0 ? "disabled" : ""}>▲</button>
          <button type="button" aria-label="Descendre" onclick="deplacer('${p.id}', 1)" ${i === dansCol.length - 1 ? "disabled" : ""}>▼</button>
        </div>` : ""}
      </div>`;
    }).join("");
  });
  cible.innerHTML = html;
}

async function deplacer(id, sens) {
  const p = pieces.find(x => x.id === id);
  const freres = pieces.filter(x => x.collection === p.collection);
  const i = freres.indexOf(p), j = i + sens;
  if (j < 0 || j >= freres.length) return;
  [freres[i], freres[j]] = [freres[j], freres[i]];
  freres.forEach((x, k) => x.ordre = k + 1);
  pieces.sort((a, b) => a.ordre - b.ordre);
  afficherPieces();
  const res = await Promise.all(freres.map(x => sb.from("pieces").update({ ordre: x.ordre }).eq("id", x.id)));
  if (res.some(r => r.error)) { toast("L'ordre n'a pas pu être enregistré.", true); chargerPieces(); }
}

/* ---------- Éditeur ---------- */
function choisirPuce(idGroupe, valeur) {
  $(idGroupe).querySelectorAll(".puce").forEach(b => b.classList.toggle("actif", b.dataset.v === valeur));
}
function valeurPuce(idGroupe) { return $(idGroupe).querySelector(".puce.actif")?.dataset.v; }
["ed-categorie", "ed-collection", "ed-statut"].forEach(id =>
  $(id).addEventListener("click", e => { const b = e.target.closest(".puce"); if (b) choisirPuce(id, b.dataset.v); }));

function ouvrirEditeur(id) {
  edition = id ? pieces.find(p => p.id === id) : null;
  photosEd = edition ? (edition.photos || []).map(x => ({ ...x })) : [];
  photosASupprimer = [];
  $("ed-titre").textContent = edition ? "Modifier la pièce" : "Nouvelle pièce";
  $("ed-nom").value = edition?.nom || "";
  $("ed-prix").value = edition ? (edition.prix_centimes / 100).toFixed(2).replace(".", ",") : "";
  $("ed-desc").value = edition?.description || "";
  choisirPuce("ed-categorie", edition?.categorie || "collier");
  choisirPuce("ed-collection", edition?.collection || "elixir");
  choisirPuce("ed-statut", edition?.statut || "en_vente");
  $("ed-bloc-statut").hidden = !edition;
  $("ed-supprimer").hidden = !edition;
  $("ed-enregistrer").textContent = edition ? "Enregistrer" : "Publier";
  $("ed-enregistrer").disabled = false;
  $("ed-erreur").textContent = "";
  afficherPhotosEd();
  $("editeur").hidden = false;
  $("editeur").scrollTop = 0;
  document.body.style.overflow = "hidden";
}
function fermerEditeur() {
  photosEd.forEach(p => p.apercu && URL.revokeObjectURL(p.apercu));
  $("editeur").hidden = true;
  document.body.style.overflow = "";
}
function afficherPhotosEd() {
  $("ed-photos").innerHTML = photosEd.map((p, i) => `
    <div class="photo" onclick="mettreEnPremier(${i})">
      <img src="${esc(p.apercu || urlPhoto(p.mini || p.full))}" alt="">
      ${i === 0 ? '<span class="principale">principale</span>' : ""}
      <button type="button" class="retirer" aria-label="Retirer la photo" onclick="event.stopPropagation(); retirerPhoto(${i})">×</button>
    </div>`).join("");
  document.querySelector(".ajout-photo").hidden = photosEd.length >= MAX_PHOTOS;
}
function mettreEnPremier(i) { if (i > 0) { photosEd.unshift(photosEd.splice(i, 1)[0]); afficherPhotosEd(); } }
function retirerPhoto(i) {
  const [p] = photosEd.splice(i, 1);
  if (p.apercu) URL.revokeObjectURL(p.apercu);
  [p.full, p.mini].map(cheminStockage).filter(Boolean).forEach(c => photosASupprimer.push(c));
  afficherPhotosEd();
}
$("ed-fichiers").addEventListener("change", e => {
  const fichiers = [...e.target.files].filter(f => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name));
  const place = MAX_PHOTOS - photosEd.length;
  fichiers.slice(0, place).forEach(f => photosEd.push({ fichier: f, apercu: URL.createObjectURL(f) }));
  if (fichiers.length > place) toast(`${MAX_PHOTOS} photos maximum par pièce.`);
  e.target.value = "";
  afficherPhotosEd();
});

/* Redimensionne une photo dans le navigateur : grande version JPEG + vignette WebP (JPEG si WebP indisponible). */
async function chargerImage(fichier) {
  if ("createImageBitmap" in window) {
    try { return await createImageBitmap(fichier, { imageOrientation: "from-image" }); } catch (e) {}
  }
  return new Promise((ok, ko) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => ko(new Error("Format de photo non reconnu. Essayez une photo JPEG ou PNG."));
    img.src = URL.createObjectURL(fichier);
  });
}
function versBlob(source, largeurMax, type, qualite) {
  const l = source.width, h = source.height;
  const r = Math.min(1, largeurMax / Math.max(l, h));
  const c = document.createElement("canvas");
  c.width = Math.round(l * r); c.height = Math.round(h * r);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(source, 0, 0, c.width, c.height);
  return new Promise(ok => c.toBlob(ok, type, qualite));
}
async function envoyerPhoto(fichier) {
  const img = await chargerImage(fichier);
  const grande = await versBlob(img, 1400, "image/jpeg", 0.85);
  let mini = await versBlob(img, 600, "image/webp", 0.76);
  if (!mini || mini.type !== "image/webp") mini = await versBlob(img, 600, "image/jpeg", 0.78);
  const base = `pieces/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const extMini = mini.type === "image/webp" ? "webp" : "jpg";
  const envois = await Promise.all([
    sb.storage.from(BUCKET).upload(`${base}.jpg`, grande, { contentType: "image/jpeg", cacheControl: "31536000" }),
    sb.storage.from(BUCKET).upload(`${base}-mini.${extMini}`, mini, { contentType: mini.type, cacheControl: "31536000" })
  ]);
  const err = envois.find(x => x.error);
  if (err) throw new Error("L'envoi d'une photo a échoué : " + err.error.message);
  return {
    full: sb.storage.from(BUCKET).getPublicUrl(`${base}.jpg`).data.publicUrl,
    mini: sb.storage.from(BUCKET).getPublicUrl(`${base}-mini.${extMini}`).data.publicUrl
  };
}

$("form-piece").addEventListener("submit", async e => {
  e.preventDefault();
  const erreur = t => { $("ed-erreur").textContent = t; };
  const nom = $("ed-nom").value.trim();
  const prix = prixEnCentimes($("ed-prix").value);
  if (!photosEd.length) return erreur("Ajoutez au moins une photo.");
  if (!nom) return erreur("Donnez un nom à la pièce.");
  if (!prix || prix < 100) return erreur("Indiquez un prix valide (ex. 25,99).");
  erreur("");

  const bouton = $("ed-enregistrer");
  bouton.disabled = true;
  try {
    const finales = [];
    for (let i = 0; i < photosEd.length; i++) {
      const p = photosEd[i];
      if (p.fichier) {
        bouton.textContent = `Envoi des photos… ${i + 1}/${photosEd.length}`;
        finales.push(await envoyerPhoto(p.fichier));
      } else finales.push({ full: p.full, mini: p.mini });
    }
    bouton.textContent = "Enregistrement…";
    const donnees = {
      nom, prix_centimes: prix, description: $("ed-desc").value.trim(),
      categorie: valeurPuce("ed-categorie"), collection: valeurPuce("ed-collection"), photos: finales
    };
    let res;
    if (edition) {
      donnees.statut = valeurPuce("ed-statut");
      res = await sb.from("pieces").update(donnees).eq("id", edition.id);
    } else {
      // les nouveautés apparaissent en premier dans leur collection
      const ordres = pieces.filter(p => p.collection === donnees.collection).map(p => p.ordre);
      donnees.ordre = (ordres.length ? Math.min(...ordres) : 1) - 1;
      res = await sb.from("pieces").insert(donnees);
    }
    if (res.error) throw new Error(res.error.message);
    if (photosASupprimer.length) await sb.storage.from(BUCKET).remove(photosASupprimer);
    toast(edition ? "Pièce enregistrée ✓" : "Pièce publiée sur le site ✓");
    fermerEditeur();
    await chargerPieces();
  } catch (err) {
    erreur(err.message || "Une erreur est survenue. Réessayez.");
    bouton.disabled = false;
    bouton.textContent = edition ? "Enregistrer" : "Publier";
  }
});

async function supprimerPiece() {
  if (!edition) return;
  if (!confirm(`Supprimer définitivement « ${edition.nom} » ?\n\nAstuce : pour la retirer du site sans la perdre, choisissez plutôt le statut « Masquée ».`)) return;
  const { error } = await sb.from("pieces").delete().eq("id", edition.id);
  if (error) { toast("Suppression impossible : " + error.message, true); return; }
  const chemins = (edition.photos || []).flatMap(p => [p.full, p.mini]).map(cheminStockage).filter(Boolean);
  if (chemins.length) await sb.storage.from(BUCKET).remove(chemins);
  toast("Pièce supprimée");
  fermerEditeur();
  await chargerPieces();
}

/* ---------- Commandes ---------- */
async function chargerCommandes() {
  const { data, error } = await sb.from("commandes").select("*").order("cree_le", { ascending: false });
  if (error) { toast("Impossible de charger les commandes.", true); return; }
  commandes = data;
  const n = commandes.filter(c => c.statut === "a_expedier").length;
  $("pastille-commandes").hidden = !n;
  $("pastille-commandes").textContent = n;
  afficherCommandes();
}
function adresseTexte(c) {
  const a = c.adresse || {};
  return [c.client_nom, a.line1, a.line2, [a.postal_code, a.city].filter(Boolean).join(" "), a.state, a.country && a.country !== "FR" ? a.country : ""]
    .filter(Boolean).join("\n");
}
function lienSuivi(numero) { return "https://www.laposte.fr/outils/suivre-vos-envois?code=" + encodeURIComponent(numero); }
function mailExpedition(c) {
  const articles = (c.articles || []).map(a => "« " + a.nom + " »").join(", ");
  const sujet = "Votre commande Charms Précieux des Îles est en route";
  const corps = `Bonjour ${(c.client_nom || "").split(" ")[0]},\n\nBonne nouvelle : votre commande (${articles}) vient d'être expédiée !` +
    (c.suivi ? `\n\nNuméro de suivi : ${c.suivi}\nSuivre le colis : ${lienSuivi(c.suivi)}` : "") +
    `\n\nMerci pour votre confiance, et belle découverte de votre pièce unique.\n\nKinsy\nCharms Précieux des Îles`;
  return `mailto:${encodeURIComponent(c.client_email || "")}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;
}
function afficherCommandes() {
  const liste = commandes.filter(c => c.statut === filtreCommandes);
  const cible = $("liste-commandes");
  if (!liste.length) {
    cible.innerHTML = `<p class="vide-liste">${filtreCommandes === "a_expedier" ? "Aucune commande à expédier. 🌴" : "Rien ici pour l'instant."}</p>`;
    return;
  }
  cible.innerHTML = liste.map(c => `
    <div class="commande">
      <div class="entete"><span>${dateCourte(c.cree_le)}</span><span>${esc(c.zone === "outre-mer" ? "Outre-mer" : c.zone === "metropole" ? "Métropole" : c.zone || "")}</span></div>
      <div class="client">${esc(c.client_nom || "Client")}</div>
      <div class="sous">${esc(c.client_email || "")}${c.client_tel ? " · " + esc(c.client_tel) : ""}</div>
      <ul>${(c.articles || []).map(a => `<li>${esc(a.nom)} · ${euros(a.prix_centimes)}</li>`).join("")}</ul>
      <div>Total payé : <strong>${euros(c.total_centimes)}</strong> <span class="sous">(dont livraison ${euros(c.port_centimes)})</span></div>
      <div class="adresse">${esc(adresseTexte(c))}</div>
      <button class="btn petit" onclick="copierAdresse('${c.id}')">Copier l'adresse</button>
      ${c.statut === "a_expedier" ? `
        <input type="text" id="suivi-${c.id}" placeholder="Numéro de suivi (facultatif)" autocomplete="off">
        <button class="btn principal" onclick="marquerExpediee('${c.id}')">Marquer comme expédiée</button>
        <button class="btn petit" onclick="changerStatutCommande('${c.id}', 'remboursee')">Marquer remboursée</button>` : ""}
      ${c.statut === "expediee" ? `
        <p class="sous">Expédiée le ${dateCourte(c.expediee_le)}${c.suivi ? ` · suivi <a class="lien" href="${lienSuivi(c.suivi)}" target="_blank" rel="noopener">${esc(c.suivi)}</a>` : ""}</p>
        <a class="btn" href="${mailExpedition(c)}">✉️ Prévenir la cliente par e-mail</a>
        <button class="btn petit" onclick="changerStatutCommande('${c.id}', 'a_expedier')">Remettre « à expédier »</button>` : ""}
      ${c.statut === "remboursee" ? `<button class="btn petit" onclick="changerStatutCommande('${c.id}', 'a_expedier')">Remettre « à expédier »</button>` : ""}
    </div>`).join("");
}
async function copierAdresse(id) {
  const c = commandes.find(x => x.id === id);
  try { await navigator.clipboard.writeText(adresseTexte(c)); toast("Adresse copiée ✓"); }
  catch (e) { toast("Copie impossible : sélectionnez l'adresse à la main.", true); }
}
async function marquerExpediee(id) {
  const suivi = $("suivi-" + id).value.trim() || null;
  const { error } = await sb.from("commandes").update({ statut: "expediee", suivi, expediee_le: new Date().toISOString() }).eq("id", id);
  if (error) { toast("Erreur : " + error.message, true); return; }
  toast("Commande expédiée ✓ Pensez à prévenir la cliente.");
  await chargerCommandes();
  const c = commandes.find(x => x.id === id);
  if (c && confirm("Envoyer maintenant l'e-mail « votre commande est en route » à la cliente ?")) location.href = mailExpedition(c);
}
async function changerStatutCommande(id, statut) {
  if (statut === "remboursee" && !confirm("Marquer cette commande comme remboursée ?\n\nLe remboursement lui-même se fait dans Stripe (Paiements → Rembourser). Si la pièce revient, remettez-la « En vente » dans l'onglet Pièces.")) return;
  const maj = { statut };
  if (statut === "a_expedier") { maj.expediee_le = null; }
  const { error } = await sb.from("commandes").update(maj).eq("id", id);
  if (error) { toast("Erreur : " + error.message, true); return; }
  await chargerCommandes();
}

/* ---------- Réglages ---------- */
async function chargerZones() {
  const { data, error } = await sb.from("zones_livraison").select("*").order("ordre");
  if (error) return;
  zones = data;
  $("liste-zones").innerHTML = zones.map(z => `
    <div class="zone-reglage">
      <strong>${esc(z.libelle)}</strong>
      <div class="ligne-zone">
        <label>Frais (€)<input type="text" inputmode="decimal" id="z-prix-${z.code}" value="${(z.prix_centimes / 100).toFixed(2).replace(".", ",")}"></label>
        <label>Délai affiché<input type="text" id="z-delai-${z.code}" value="${esc(z.delai)}"></label>
      </div>
      <label class="interrupteur"><input type="checkbox" id="z-actif-${z.code}" ${z.actif ? "checked" : ""}> Livraison ouverte pour cette zone</label>
    </div>`).join("");
}
async function enregistrerZones() {
  for (const z of zones) {
    const brut = $("z-prix-" + z.code).value.trim();
    const prix = brut === "" || /^0+([,.]0*)?$/.test(brut) ? 0 : prixEnCentimes(brut);
    if (prix === null) { toast(`Frais invalides pour « ${z.libelle} ».`, true); return; }
    const { error } = await sb.from("zones_livraison").update({
      prix_centimes: prix, delai: $("z-delai-" + z.code).value.trim(), actif: $("z-actif-" + z.code).checked
    }).eq("code", z.code);
    if (error) { toast("Erreur : " + error.message, true); return; }
  }
  toast("Frais de livraison enregistrés ✓");
  chargerZones();
}
async function changerMotDePasse() {
  const mdp = $("r-mdp").value;
  if (mdp.length < 8) { toast("8 caractères minimum.", true); return; }
  const { error } = await sb.auth.updateUser({ password: mdp });
  if (error) { toast("Erreur : " + error.message, true); return; }
  $("r-mdp").value = "";
  toast("Mot de passe changé ✓");
}

/* ---------- Démarrage ---------- */
(async () => {
  if (!sb) { $("c-erreur").textContent = "La base n'est pas encore configurée (config.js)."; return; }
  const { data } = await sb.auth.getSession();
  if (data.session) await entrer();
})();
