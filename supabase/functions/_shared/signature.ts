// Vérifie que la notification vient bien de Stripe (en-tête Stripe-Signature).
export async function signatureValide(corps: string, entete: string, secret: string, maintenant = Date.now()) {
  const parts = Object.fromEntries(
    entete.split(",").map((kv) => kv.split("=")).filter((x) => x.length === 2).map(([k, v]) => [k.trim(), v.trim()]),
  ) as Record<string, string>;
  const signatures = entete.split(",").filter((kv) => kv.trim().startsWith("v1=")).map((kv) => kv.trim().slice(3));
  const t = Number(parts.t);
  if (!t || !signatures.length || Math.abs(maintenant / 1000 - t) > 300) return false;
  const cle = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", cle, new TextEncoder().encode(`${t}.${corps}`));
  const attendu = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return signatures.some((s) => s.length === attendu.length && [...s].reduce((d, c, i) => d | (c.charCodeAt(0) ^ attendu.charCodeAt(i)), 0) === 0);
}
