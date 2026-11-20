// Ouvre une page de paiement Stripe pour les pièces du panier.
// POST { pieces: string[], zone: string }      -> { url }
// POST { annuler: string (id de session) }      -> { ok }   (cliente revenue sans payer)
//
// Secrets nécessaires : STRIPE_SECRET_KEY, SITE_URL (ex. https://…github.io/charms-precieux-des-iles/)
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const SITE_URL = (Deno.env.get("SITE_URL") ?? "").replace(/\/?$/, "/");
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function stripe(path: string, params?: Record<string, string>) {
  const res = await fetch("https://api.stripe.com/v1/" + path, {
    method: "POST",
    headers: { Authorization: `Bearer ${STRIPE_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: params ? new URLSearchParams(params) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? "Erreur Stripe");
  return data;
}

function urlAbsolue(src: string) {
  try { return new URL(src, SITE_URL).toString(); } catch { return ""; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ erreur: "Méthode non autorisée" }, 405);
  if (!STRIPE_KEY || !SITE_URL.startsWith("https://")) return json({ erreur: "Le paiement n'est pas encore configuré." }, 503);

  let corps: { pieces?: unknown; zone?: unknown; annuler?: unknown };
  try { corps = await req.json(); } catch { return json({ erreur: "Requête invalide" }, 400); }

  // ---- La cliente est revenue sans payer : on libère tout de suite ses pièces ----
  if (typeof corps.annuler === "string") {
    if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(corps.annuler)) return json({ erreur: "Session invalide" }, 400);
    try {
      const session = await fetch(`https://api.stripe.com/v1/checkout/sessions/${corps.annuler}`, {
        headers: { Authorization: `Bearer ${STRIPE_KEY}` },
      }).then((r) => r.json());
      if (session?.status === "open") {
        await stripe(`checkout/sessions/${corps.annuler}/expire`);
        const ids = String(session.metadata?.piece_ids ?? "").split(",").filter((x: string) => UUID.test(x));
        if (ids.length) await db.rpc("liberer_pieces", { ids });
      }
    } catch (_) { /* la session expirera d'elle-même */ }
    return json({ ok: true });
  }

  // ---- Nouveau paiement ----
  const ids = Array.isArray(corps.pieces) ? [...new Set(corps.pieces.map(String))] : [];
  if (ids.length < 1 || ids.length > 10 || !ids.every((x) => UUID.test(x))) return json({ erreur: "Panier invalide" }, 400);
  if (typeof corps.zone !== "string") return json({ erreur: "Choisissez une zone de livraison" }, 400);

  const { data: zone } = await db.from("zones_livraison").select("*").eq("code", corps.zone).eq("actif", true).maybeSingle();
  if (!zone) return json({ erreur: "Zone de livraison indisponible" }, 400);

  // Réservation atomique : toutes les pièces, ou aucune.
  const { data: pieces, error } = await db.rpc("reserver_pieces", { ids, minutes: 35 });
  if (error || !pieces || pieces.length !== ids.length) {
    return json({ erreur: "Une pièce de votre panier vient d'être vendue ou réservée. Actualisez la page." }, 409);
  }

  try {
    const p: Record<string, string> = {
      mode: "payment",
      locale: "fr",
      success_url: SITE_URL + "#merci",
      cancel_url: SITE_URL + "?paiement=annule#boutique",
      expires_at: String(Math.floor(Date.now() / 1000) + 31 * 60), // minimum Stripe : 30 min
      "phone_number_collection[enabled]": "true",
      "metadata[piece_ids]": ids.join(","),
      "metadata[zone]": zone.code,
      "payment_intent_data[description]": "Charms Précieux des Îles",
      "custom_text[submit][message]":
        "En validant, vous acceptez nos conditions générales de vente. Vous disposez de 14 jours pour changer d'avis après réception.",
      "shipping_options[0][shipping_rate_data][type]": "fixed_amount",
      "shipping_options[0][shipping_rate_data][fixed_amount][amount]": String(zone.prix_centimes),
      "shipping_options[0][shipping_rate_data][fixed_amount][currency]": "eur",
      "shipping_options[0][shipping_rate_data][display_name]": `Livraison ${zone.libelle}`.slice(0, 100),
    };
    (zone.pays as string[]).forEach((c, i) => (p[`shipping_address_collection[allowed_countries][${i}]`] = c));
    pieces.forEach((piece: any, i: number) => {
      p[`line_items[${i}][quantity]`] = "1";
      p[`line_items[${i}][price_data][currency]`] = "eur";
      p[`line_items[${i}][price_data][unit_amount]`] = String(piece.prix_centimes);
      p[`line_items[${i}][price_data][product_data][name]`] = piece.nom;
      p[`line_items[${i}][price_data][product_data][description]`] = "Pièce unique faite main";
      p[`line_items[${i}][price_data][product_data][metadata][piece_id]`] = piece.id;
      const photo = urlAbsolue(piece.photos?.[0]?.full ?? "");
      if (photo.startsWith("https://")) p[`line_items[${i}][price_data][product_data][images][0]`] = photo;
    });

    const session = await stripe("checkout/sessions", p);
    return json({ url: session.url, session: session.id });
  } catch (e) {
    await db.rpc("liberer_pieces", { ids });
    console.error(e);
    return json({ erreur: "Le paiement n'a pas pu être ouvert. Réessayez dans un instant." }, 502);
  }
});
