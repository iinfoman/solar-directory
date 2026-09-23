#!/usr/bin/env node
// Generates one static page per installer: site/installer/<slug>/index.html
//
// Why this exists: the directory itself is rendered in the browser from
// Supabase, which is fine for a visitor but invisible to a search engine —
// there is nothing at a URL for Google to index except the front page. These
// pages give every installer a real address with its content already in the
// HTML, plus the structured data that puts a business in a local result.
//
// Netlify runs this on every deploy, so the pages track the database. The
// output is also committed, so a deploy still ships complete pages if Supabase
// is unreachable (it pauses itself on the free tier) rather than losing them.
//
//   node tools/build-installers.mjs

import { mkdir, writeFile, rm, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "site", "installer");
const SITE = "https://solardirectorysa.co.za";

// The publishable key. Row-level security decides what comes back, so the
// build sees exactly what a visitor sees: active listings only.
const SUPABASE_URL = process.env.SUPABASE_URL || "https://alogcohoopgzerrxheiw.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_TcktYEjqHMXgha4tYY8QVA_78xT1aM8";

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Only http(s), and never javascript: — these values come from the database.
function safeUrl(u) {
  const s = String(u || "").trim();
  if (!s) return "";
  const withScheme = /^https?:\/\//i.test(s) ? s : "https://" + s;
  try {
    const url = new URL(withScheme);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
  } catch { return ""; }
}
const hostOf = (u) => { try { return new URL(safeUrl(u)).hostname.replace(/^www\./, ""); } catch { return ""; } };

async function api(pathname) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathname}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  if (!res.ok) throw new Error(`${pathname} → ${res.status} ${await res.text()}`);
  return res.json();
}

const IC_PHONE = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';
const IC_MAIL = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="2"/><path d="m4 7 8 6 8-6" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';
const IC_LINK = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10 13a4 4 0 0 0 6 .5l2-2a4 4 0 0 0-5.7-5.7l-1 1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14 11a4 4 0 0 0-6-.5l-2 2A4 4 0 0 0 11.7 18l1-1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const IC_TICK = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// Same order as the directory: a call gets answered, then a written email,
// then their own site.
function contactHtml(r) {
  const tel = String(r.phone || "").replace(/[^\d+]/g, "");
  const mail = String(r.email || "").trim();
  const site = safeUrl(r.website);
  const subject = encodeURIComponent("Solar enquiry via SolarDirectory South Africa");
  const body = encodeURIComponent(
    `Hi ${r.name || ""},\n\nI found you on SolarDirectory South Africa. I am looking for a quote on a ` +
    `solar installation.\n\nSite location:\nRough system size:\nBest time to call:\n\nThank you.`);
  const out = [];
  if (tel) out.push(`<a class="btn btn-sun" href="tel:${esc(tel)}">${IC_PHONE} Call ${esc(r.phone)}</a>`);
  if (mail) out.push(`<a class="btn ${tel ? "btn-ghost" : "btn-sun"}" href="mailto:${esc(mail)}?subject=${subject}&amp;body=${body}">${IC_MAIL} Email</a>`);
  if (site) out.push(`<a class="btn ${out.length ? "btn-ghost" : "btn-sun"}" href="${esc(site)}" target="_blank" rel="noopener nofollow">${IC_LINK} ${esc(hostOf(r.website))}</a>`);
  return out.length
    ? `<div class="contact">${out.join("")}</div>`
    : `<p class="muted">No contact details on file yet.</p>`;
}

function starsHtml(s) {
  // Only ever called when there are ratings: a profile with none leaves the
  // row out rather than printing an emptiness the visitor did not ask about.
  if (!s || !s.rating_count) return "";
  const pct = (Number(s.rating_avg) / 5) * 100;
  return `<span class="stars"><span class="star-track" aria-hidden="true">★★★★★<span class="star-fill" style="width:${pct.toFixed(1)}%">★★★★★</span></span>
    <span class="star-num">${esc(s.rating_avg)} <span class="muted">(${esc(s.rating_count)} review${Number(s.rating_count) === 1 ? "" : "s"})</span></span></span>`;
}

// Structured data. aggregateRating is only emitted when real ratings exist —
// claiming a rating that is not there is the fastest way to lose the rich
// result altogether.
function jsonLd(r, rating) {
  const data = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: r.name,
    url: `${SITE}/installer/${r.slug}/`,
    areaServed: r.province || "South Africa",
    address: { "@type": "PostalAddress", addressLocality: r.city || undefined, addressRegion: r.province || undefined, addressCountry: "ZA" },
  };
  if (r.blurb) data.description = r.blurb;
  if (r.phone) data.telephone = r.phone;
  if (r.email) data.email = r.email;
  if (safeUrl(r.website)) data.sameAs = [safeUrl(r.website)];
  if (rating && rating.rating_count) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(rating.rating_avg),
      reviewCount: Number(rating.rating_count),
      bestRating: 5, worstRating: 1,
    };
  }
  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Solar installers", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: r.province || "South Africa", item: `${SITE}/?province=${encodeURIComponent(r.province || "")}` },
      { "@type": "ListItem", position: 3, name: r.name, item: `${SITE}/installer/${r.slug}/` },
    ],
  };
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>
<script type="application/ld+json">${JSON.stringify(crumbs)}</script>`;
}

const CSS = `
:root{--navy:#0E2A47;--navy-2:#1B4B7A;--sun:#F5B324;--sun-deep:#DF9C09;--sun-tint:#FEF4DE;
  --sky:#EAF3FB;--sky-2:#F5F9FD;--paper:#fff;--ink:#12212F;--ink-2:#5A6B7D;--ink-3:#8B99A8;
  --line:#E2E9F0;--line-2:#CFDAE5;--trust:#0F6B4F;--trust-tint:#E7F2EC;--star:#E8A317;
  --shadow:0 2px 6px rgba(14,42,71,.06),0 18px 44px rgba(14,42,71,.1);}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',system-ui,-apple-system,sans-serif;background:var(--sky-2);color:var(--ink);font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased}
h1,h2,h3{font-family:'Poppins','Inter',sans-serif;letter-spacing:-.02em}
a{color:inherit}
:focus-visible{outline:2px solid var(--navy);outline-offset:2px;border-radius:4px}
.wrap{max-width:800px;margin:0 auto;padding:0 20px}
header{background:var(--paper);border-bottom:1px solid var(--line)}
.nav{display:flex;align-items:center;justify-content:space-between;gap:14px;max-width:1180px;margin:0 auto;padding:11px 20px}
.brand-logo{height:36px;width:auto;display:block}
.back{font-size:13.5px;font-weight:600;color:var(--navy-2)}
.crumb{font-size:12.5px;color:var(--ink-2);padding:16px 0 0}
.crumb a{color:var(--navy-2);text-decoration:none}
.card{background:var(--paper);border:1px solid var(--line);border-radius:18px;box-shadow:var(--shadow);padding:22px;margin:14px 0 18px}
.head{display:flex;gap:14px;align-items:flex-start}
.avatar{flex:none;width:56px;height:56px;border-radius:14px;background:var(--sky);color:var(--navy-2);
  display:grid;place-items:center;font-family:'Poppins',sans-serif;font-weight:700;font-size:19px;overflow:hidden}
.avatar img{width:100%;height:100%;object-fit:contain}
h1{font-size:clamp(23px,4.6vw,31px);font-weight:800;color:var(--navy);line-height:1.15}
.loc{color:var(--ink-2);font-size:14px;margin-top:3px}
.listed{display:inline-flex;align-items:center;gap:5px;margin-top:8px;background:var(--trust-tint);color:var(--trust);
  border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700}
.listed svg{width:13px;height:13px}
.blurb{margin-top:16px;color:var(--ink)}
.tags{display:flex;flex-wrap:wrap;gap:7px;margin-top:14px}
.tag{background:var(--sky);color:var(--navy-2);border-radius:999px;padding:4px 11px;font-size:12.5px;font-weight:600}
.rating{margin-top:16px;padding-top:14px;border-top:1px solid var(--line);display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.stars{display:inline-flex;align-items:center;gap:8px}
.star-track{position:relative;color:var(--line-2);font-size:15px;letter-spacing:1px;white-space:nowrap}
.star-fill{position:absolute;left:0;top:0;overflow:hidden;color:var(--star);white-space:nowrap}
.star-num{font-size:13.5px;font-weight:700}
.muted{color:var(--ink-3);font-size:13.5px}
.contact{display:flex;flex-wrap:wrap;gap:9px;margin-top:18px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:46px;padding:0 18px;
  border-radius:999px;font-size:14.5px;font-weight:700;text-decoration:none;border:1px solid transparent}
.btn svg{width:17px;height:17px}
.btn-sun{background:var(--sun);color:var(--navy)}
.btn-sun:hover{background:var(--sun-deep)}
.btn-ghost{background:var(--paper);border-color:var(--line-2);color:var(--navy-2)}
.btn-ghost:hover{border-color:var(--navy-2)}
h2{font-size:17px;color:var(--navy);margin:26px 0 10px}
.review{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin-bottom:10px}
.review .s{color:var(--star);font-size:13px;letter-spacing:1px}
.review p{font-size:14px;margin-top:5px}
.near{display:grid;gap:10px;grid-template-columns:1fr}
@media(min-width:620px){.near{grid-template-columns:1fr 1fr}}
.near a{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:13px 15px;text-decoration:none;display:block}
.near a:hover{border-color:var(--line-2)}
.near b{font-size:14.5px;color:var(--navy);display:block}
.near span{font-size:12.5px;color:var(--ink-2)}
.claim{background:var(--sun-tint);border:1px solid #F2DFB4;border-radius:14px;padding:15px 17px;margin:22px 0;font-size:14px}
.claim a{color:var(--navy-2);font-weight:700}
footer{border-top:1px solid var(--line);margin-top:34px;padding:20px 0 34px;font-size:12.5px;color:var(--ink-2)}
`.trim();

function page(r, rating, reviews, nearby) {
  const where = [r.city, r.province].filter(Boolean).join(", ");
  const title = `${r.name} — solar installer${where ? " in " + where : ""} | SolarDirectory South Africa`;
  const desc = (r.blurb || `${r.name} is a solar PV installer${where ? " in " + where : " in South Africa"} listed on SolarDirectory South Africa.`)
    .replace(/\s+/g, " ").slice(0, 300);
  const logo = safeUrl(r.logo_url);
  const initials = String(r.name || "").replace(/[^A-Za-z ]/g, "").split(/\s+/).filter(Boolean)
    .slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}/installer/${esc(r.slug)}/">
<meta property="og:type" content="profile">
<meta property="og:title" content="${esc(r.name)}${where ? " — " + esc(where) : ""}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE}/installer/${esc(r.slug)}/">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='7' fill='%230E2A47'/><circle cx='16' cy='12' r='5' fill='%23F5B324'/><path d='M6 26l4-8h12l4 8z' fill='%231B4B7A'/></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${CSS}</style>
${jsonLd(r, rating)}
</head>
<body>

<header>
  <div class="nav">
    <a href="/" aria-label="SolarDirectory South Africa — home">
      <picture>
        <source type="image/avif" srcset="/assets/logo.avif">
        <source type="image/webp" srcset="/assets/logo.webp">
        <img class="brand-logo" src="/assets/logo.png" width="432" height="120" alt="SolarDirectory South Africa">
      </picture>
    </a>
    <a class="back" href="/">← All installers</a>
  </div>
</header>

<main class="wrap">
  <nav class="crumb" aria-label="Breadcrumb">
    <a href="/">Solar installers</a>${r.province ? ` › <a href="/?province=${encodeURIComponent(r.province)}">${esc(r.province)}</a>` : ""} › ${esc(r.name)}
  </nav>

  <article class="card">
    <div class="head">
      <div class="avatar">${logo ? `<img src="${esc(logo)}" alt="" width="56" height="56">` : esc(initials)}</div>
      <div style="min-width:0">
        <h1>${esc(r.name)}</h1>
        ${where ? `<div class="loc">${esc(where)}</div>` : ""}
        ${r.verified ? `<span class="listed">${IC_TICK}PV GreenCard listed</span>` : ""}
      </div>
    </div>

    ${r.blurb ? `<p class="blurb">${esc(r.blurb)}</p>` : ""}
    ${(r.services || []).length ? `<div class="tags">${(r.services || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>` : ""}

    ${rating && rating.rating_count ? `<div class="rating">${starsHtml(rating)}</div>` : ""}
    ${contactHtml(r)}
  </article>

  ${reviews.length ? `<h2>What customers say</h2>
  ${reviews.map((c) => `<div class="review">
    <div class="s" aria-label="${esc(c.rating)} out of 5">${"★".repeat(c.rating)}${"☆".repeat(5 - c.rating)}</div>
    ${c.comment ? `<p>${esc(c.comment)}</p>` : ""}
  </div>`).join("")}` : ""}

  <div class="claim">
    <strong>Is this your business?</strong> Listing is free. <a href="/list.html">Claim it or correct these details</a> and we will update the page.
  </div>

  ${nearby.length ? `<h2>Other installers in ${esc(r.province || "South Africa")}</h2>
  <div class="near">
    ${nearby.map((n) => `<a href="/installer/${esc(n.slug)}/"><b>${esc(n.name)}</b><span>${esc([n.city, n.province].filter(Boolean).join(", "))}</span></a>`).join("")}
  </div>` : ""}

  <footer>
    Listed from the public PV GreenCard certified installer register.
    SolarDirectory South Africa does not install solar and takes no commission.
    <a href="/" class="back">Browse all installers →</a>
  </footer>
</main>
</body>
</html>
`;
}

function sitemap(rows) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: SITE + "/", pri: "1.0", freq: "daily" },
    { loc: SITE + "/list.html", pri: "0.5", freq: "monthly" },
    ...rows.map((r) => ({ loc: `${SITE}/installer/${r.slug}/`, pri: "0.8", freq: "weekly" })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.pri}</priority>
  </url>`).join("\n")}
</urlset>
`;
}

async function main() {
  let installers, ratings, reviews;
  // --data <file.json> builds from a saved snapshot instead of the network,
  // for working somewhere the database is not reachable.
  const fixture = process.argv.includes("--data") ? process.argv[process.argv.indexOf("--data") + 1] : null;
  if (fixture) {
    const snap = JSON.parse(await readFile(fixture, "utf8"));
    ({ installers, ratings, reviews } = snap);
    console.log(`build-installers: using the snapshot at ${fixture}`);
  } else {
  try {
    [installers, ratings, reviews] = await Promise.all([
      api("installers?select=*&order=name"),
      api("installer_ratings?select=*"),
      api("installer_comments?select=*&order=created_at.desc"),
    ]);
  } catch (e) {
    // A paused or unreachable database must not fail the whole deploy: the
    // pages committed to the repo ship as they are.
    console.warn("build-installers: could not reach Supabase, keeping the committed pages.");
    console.warn(String(e));
    return;
  }
  }

  // Same rule as the directory: a listing nobody can contact is a dead end,
  // and a page for one would be a thin page Google is right to ignore.
  const rows = installers.filter((r) => r.slug && (r.website || r.phone || r.email));
  const rateBy = Object.fromEntries((ratings || []).map((s) => [s.installer_id, s]));

  if (existsSync(OUT)) await rm(OUT, { recursive: true });
  await mkdir(OUT, { recursive: true });

  for (const r of rows) {
    const mine = (reviews || []).filter((c) => c.installer_id === r.id && c.comment).slice(0, 12);
    const nearby = rows.filter((n) => n.id !== r.id && n.province === r.province).slice(0, 4);
    const dir = path.join(OUT, r.slug);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "index.html"), page(r, rateBy[r.id], mine, nearby));
  }

  await writeFile(path.join(ROOT, "site", "sitemap.xml"), sitemap(rows));
  console.log(`build-installers: wrote ${rows.length} pages and a sitemap of ${rows.length + 2} URLs`);
  const skipped = installers.length - rows.length;
  if (skipped) console.log(`build-installers: skipped ${skipped} listing(s) with no contact route`);
}

main().catch((e) => { console.error(e); process.exit(1); });
