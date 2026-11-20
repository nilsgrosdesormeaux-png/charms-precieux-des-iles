// Reçoit les notifications de Stripe :
//  - paiement réussi  -> pièces passées en « vendue » + commande enregistrée
//  - paiement expiré  -> pièces de nouveau disponibles
// Secrets nécessaires : STRIPE_WEBHOOK_SECRET (whsec_…)
// À déployer SANS vérification JWT (Stripe n'envoie pas de jeton Supabase).
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { signatureValide } from "../_shared/signature.ts";

const SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const idsDe = (session: any) => String(session?.metadata?.piece_ids ?? "").split(",").filter((x) => UUID.test(x));

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Méthode non autorisée", { status: 405 });
  const corps = await req.text();
  if (!SECRET || !(await signatureValide(corps, req.headers.get("stripe-signature") ?? "", SECRET))) {
    return new Response("Signature invalide", { status: 400 });
  }
  const evt = JSON.parse(corps);
  const session = evt.data?.object;

  try {
    if (evt.type === "checkout.session.completed" && session?.payment_status === "paid") {
      const ids = idsDe(session);
      if (ids.length) {
        const { error } = await db.rpc("vendre_pieces", { ids });
        if (error) throw error;
      }
      const { data: pieces } = await db.from("pieces").select("id, nom, prix_centimes").in("id", ids);
      const livraison = session.collected_information?.shipping_details ?? session.shipping_details ?? null;
      const client = session.customer_details ?? {};
      const { error } = await db.from("commandes").upsert({
        stripe_session_id: session.id,
        articles: pieces ?? [],
        zone: session.metadata?.zone ?? null,
        total_centimes: session.amount_total ?? 0,
        port_centimes: session.total_details?.amount_shipping ?? session.shipping_cost?.amount_total ?? 0,
        client_nom: livraison?.name ?? client.name ?? null,
        client_email: client.email ?? null,
        client_tel: client.phone ?? null,
        adresse: livraison?.address ?? client.address ?? null,
      }, { onConflict: "stripe_session_id", ignoreDuplicates: true });
      if (error) throw error;
    } else if (evt.type === "checkout.session.expired") {
      const ids = idsDe(session);
      if (ids.length) await db.rpc("liberer_pieces", { ids });
    }
  } catch (e) {
    console.error(e);
    return new Response("Erreur, Stripe réessaiera", { status: 500 });
  }
  return new Response(JSON.stringify({ recu: true }), { headers: { "Content-Type": "application/json" } });
});
