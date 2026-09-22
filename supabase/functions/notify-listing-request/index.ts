// Sends two emails when a business submits the listing form:
//   1. a confirmation to the business, from the directory's own address
//   2. an alert to the directory owner
//
// verify_jwt is off because the public form calls this straight after its
// insert, so there is no logged-in user to carry a token. The endpoint is
// therefore treated as hostile input and defends itself:
//   - it accepts an id only, and re-reads the row with the service key, so a
//     caller cannot choose the recipient or the wording
//   - it refuses a row older than 15 minutes, so old ids cannot be replayed
//   - it stamps notified_at, so one request can only ever send once
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const MAX_AGE_MS = 15 * 60 * 1000;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

async function sendMail(key: string, payload: Record<string, unknown>) {
  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const MAIL_FROM = Deno.env.get("MAIL_FROM");
  const ALERT_EMAIL = Deno.env.get("ALERT_EMAIL");
  if (!RESEND_API_KEY || !MAIL_FROM || !ALERT_EMAIL) {
    // Nothing is configured yet. Say so plainly rather than failing the form:
    // the request is already saved, the email is the only thing missing.
    console.error("missing env: RESEND_API_KEY, MAIL_FROM or ALERT_EMAIL");
    return json({ ok: false, reason: "email not configured" }, 200);
  }

  let id: string;
  try {
    ({ id } = await req.json());
  } catch {
    return json({ error: "bad body" }, 400);
  }
  if (!id || typeof id !== "string") return json({ error: "id required" }, 400);

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: row, error } = await sb
    .from("listing_requests")
    .select("id, kind, company_name, contact_name, email, phone, website, city, province, message, created_at, notified_at")
    .eq("id", id)
    .maybeSingle();

  if (error) return json({ error: error.message }, 500);
  if (!row) return json({ error: "not found" }, 404);
  if (row.notified_at) return json({ ok: true, already: true });
  if (Date.now() - new Date(row.created_at).getTime() > MAX_AGE_MS) {
    return json({ error: "too old" }, 403);
  }

  const name = esc(row.contact_name || row.company_name);
  const kindWord = row.kind === "claim"
    ? "claim your listing"
    : row.kind === "correction"
    ? "correct a listing"
    : "list your business";

  const confirmation = {
    from: MAIL_FROM,
    to: [row.email],
    reply_to: ALERT_EMAIL,
    subject: "We have your request — SolarDirectory South Africa",
    html: `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.6;color:#12212F;max-width:520px">
      <p>Hi ${name},</p>
      <p>Thank you for asking us to ${kindWord}. We have your request for
         <strong>${esc(row.company_name)}</strong> and we check every one by hand,
         so give us a day or two.</p>
      <p>Here is what you sent us:</p>
      <table style="border-collapse:collapse;font-size:14px">
        ${[["Company", row.company_name], ["Where", [row.city, row.province].filter(Boolean).join(", ")],
           ["Website", row.website], ["Phone", row.phone], ["Email", row.email]]
          .filter(([, v]) => v)
          .map(([k, v]) => `<tr><td style="padding:3px 14px 3px 0;color:#5A6B7D">${esc(k)}</td><td style="padding:3px 0">${esc(v)}</td></tr>`)
          .join("")}
      </table>
      ${row.message ? `<p style="background:#F5F9FD;border:1px solid #E2E9F0;border-radius:10px;padding:11px 13px;white-space:pre-wrap">${esc(row.message)}</p>` : ""}
      <p>If any of that is wrong, just reply to this email and tell us.</p>
      <p style="color:#5A6B7D;font-size:13px;margin-top:22px">SolarDirectory South Africa<br>
        <a href="https://solardirectorysa.co.za" style="color:#1B4B7A">solardirectorysa.co.za</a></p>
    </div>`,
  };

  const alert = {
    from: MAIL_FROM,
    to: [ALERT_EMAIL],
    reply_to: row.email,
    subject: `New listing request: ${row.company_name}`,
    html: `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.6;color:#12212F">
      <p><strong>${esc(row.company_name)}</strong> — ${esc(row.kind)}</p>
      <p>${esc([row.city, row.province].filter(Boolean).join(", "))}<br>
         ${esc(row.email)}${row.phone ? " · " + esc(row.phone) : ""}${row.website ? " · " + esc(row.website) : ""}</p>
      ${row.message ? `<p style="white-space:pre-wrap">${esc(row.message)}</p>` : ""}
      <p><a href="https://solardirectorysa.co.za/admin.html">Open the dashboard</a></p>
    </div>`,
  };

  try {
    // The business hearing back matters more than the alert, so it goes first
    // and a failed alert does not lose their confirmation.
    await sendMail(RESEND_API_KEY, confirmation);
    await sendMail(RESEND_API_KEY, alert);
  } catch (e) {
    console.error("send failed", e);
    return json({ ok: false, reason: String(e) }, 200);
  }

  await sb.from("listing_requests")
    .update({ notified_at: new Date().toISOString() })
    .eq("id", row.id);

  return json({ ok: true });
});
