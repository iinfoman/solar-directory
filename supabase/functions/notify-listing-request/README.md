# notify-listing-request

Sends two emails when a business submits the form on `site/list.html`:

1. a confirmation to the business, from the directory's own address
2. an alert to the directory owner

Deployed to the `alogcohoopgzerrxheiw` Supabase project. The source of truth
is `index.ts` next to this file; redeploy from there after any edit.

## Secrets it needs

Set in Supabase → Project Settings → Edge Functions → Secrets. Until all
three exist the function returns `{ok:false, reason:"email not configured"}`
and the form still works — the request is saved either way.

| Secret | Example | What it is |
|---|---|---|
| `RESEND_API_KEY` | `re_xxx` | From resend.com, after the domain is verified |
| `MAIL_FROM` | `SolarDirectory South Africa <admin@solardirectorysa.co.za>` | Must be on the verified domain |
| `ALERT_EMAIL` | your own address | Where new requests are announced |

This is separate from reading mail at `admin@solardirectorysa.co.za` (Zoho Mail, or
whatever inbox is set up) — Resend only sends *on behalf of* that address, it
doesn't need to be able to receive. If both are ever configured on this
domain, the domain's SPF record needs both providers in one `include:`
chain, since a domain can only have one `v=spf1` record.

Not set up yet. Until it is, the dashboard's Reply button is how requests
get answered — it hands the draft to whatever mail app is already signed in
on the device, no secrets required.

## Why verify_jwt is off

The public form calls this straight after its insert, and there is no
logged-in user to carry a token. The endpoint is therefore written to be safe
when called by anyone:

- it accepts an `id` and nothing else, and re-reads the row with the service
  key, so a caller cannot choose the recipient or the wording
- it refuses a row older than 15 minutes, so old ids cannot be replayed
- it stamps `notified_at`, so one request can only ever send once

## Failure behaviour

A send failure returns HTTP 200 with `ok:false`. That is deliberate: by the
time this runs the request is already saved, and an email problem must not
show the visitor an error for a submission that in fact succeeded. Failures
are in the function logs.
