---
title: 'Migrating the site from shengchangmd.bahtzang.com to shengchangmd.com'
date: 2026-07-31
status: blocked
blocked_on: 'registrar transfer of shengchangmd.com in progress; DNS records cannot be edited until it completes'
component: DNS / GitHub Pages / astro.config.mjs / deploy.yml
tags:
  - deployment
  - dns
  - github-pages
  - apex-domain
  - custom-domain
  - runbook
---

# Migrating to shengchangmd.com

> **Status: not started, and deliberately so.** A registrar transfer of
> `shengchangmd.com` was in progress as of 2026-07-31 and the owner could not
> edit DNS records yet. Nothing in this repo has been changed. Do not begin
> Phase 1 until the transfer has completed and the DNS panel accepts edits.

## Why this document exists

The move is more than a find-and-replace on a hostname. Three things make it
worth writing down before doing it:

1. `shengchangmd.com` is an **apex** domain. The current host is a subdomain.
   The two require structurally different DNS records.
2. The steps have a **required order**. Doing the repo change before the DNS
   change lengthens the outage instead of shortening it.
3. There is an unavoidable **window where HTTPS fails**, and one thing that
   breaks permanently.

## What was verified on 2026-07-31

These were checked directly — `whois`, `dig`, `curl`, and the GitHub API — not
recalled. Re-verify before acting; a transfer changes several of them by
definition.

| Fact | Value at time of check | Method |
|------|------------------------|--------|
| Registration | Created 2023-12-27, expires 2028-12-27 | `whois` |
| Registrar | GoDaddy — **will change if the transfer is to another registrar** | `whois` |
| Nameservers | `ns35`/`ns36.domaincontrol.com` — **will likely change** | `dig NS` |
| Apex resolves to | `15.197.148.33`, `3.33.130.190` (parking) | `dig A` |
| What it serves | GoDaddy parking page, redirects to `/lander` | `curl` |
| `www` | CNAME → apex, i.e. also parked | `dig` |
| Pages custom domain | `shengchangmd.bahtzang.com` | `gh api repos/thirstypig/shengchangmd/pages` |
| Pages HTTPS | enforced; cert valid to 2026-10-27 | same |
| Pages build type | `workflow` (not legacy branch build) | same |

The domain was already registered — this is a repoint, not a purchase. Nothing
of value is currently served at it, so Phase 1 destroys nothing.

## Why the apex domain changes the approach

`shengchangmd.bahtzang.com` is a subdomain, so it points at GitHub with a single
`CNAME` → `thirstypig.github.io`. That is not available at an apex.

RFC 1034 defines a `CNAME` as "this name is an alias and has no other records."
An apex must carry its own `NS` and `SOA` records to exist as a zone at all.
The two are therefore mutually exclusive, and every DNS provider enforces it.

The consequence: the apex needs **four A records** pointing at GitHub Pages'
published IPv4 addresses, rather than one CNAME.

Some providers (Cloudflare, and others offering `ALIAS`/`ANAME`) synthesise
apex-CNAME behaviour and would let you point the apex at `thirstypig.github.io`
directly. GitHub's documentation explicitly permits this. **Whether it applies
here depends on where the domain lands after the transfer** — see the re-verify
step below.

## Decision taken: apex is primary

`shengchangmd.com` is the canonical host; `www.shengchangmd.com` redirects to
it. Reasons: it is shorter for print materials and business cards, and it is
what a patient types. GitHub Pages issues the `www` → apex redirect
automatically once both DNS records are correct.

To reverse this, put `www.shengchangmd.com` in `public/CNAME` instead and swap
the DNS record roles. The rest of the runbook is unchanged.

---

## Phase 0 — re-verify after the transfer completes

The transfer invalidates part of the table above. Before touching anything:

```
whois shengchangmd.com | grep -iE "registrar:|name server"
dig +short shengchangmd.com NS
```

Then confirm:

- **Which registrar and DNS panel** now hold the zone. The Phase 1 wording below
  is generic; the labels differ per provider.
- **Whether the new provider supports `ALIAS`/`ANAME`/CNAME-flattening.** If it
  does, a single apex record pointing at `thirstypig.github.io` is simpler and
  more robust than four hardcoded IPs, because GitHub can change those IPs.
- **Whether the transfer preserved or reset the zone.** Transfers frequently
  reset DNS to the new registrar's defaults, which usually means a fresh parking
  page and a default `www` record.

---

## Phase 1 — DNS (do this first)

DNS goes first. Once it resolves to GitHub, the domain returns a 404 until
Phase 2 — which is harmless, because it is a parking page today. Reversing the
order means the site is down for the full DNS propagation instead.

1. **Disable domain forwarding / parking.** Whatever the provider calls it,
   delete the rule. This is the most common failure: parking re-injects its own
   A records and silently fights the ones you add.

2. **Delete the existing apex `A` records** (the parking pair).

3. **Add four `A` records**, name `@`, TTL 600:

   ```
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```

   Verified live on 2026-07-31: each returned `301` to HTTPS for a GitHub Pages
   `Host` header. Source: GitHub Pages custom-domain documentation.

4. **Optionally add four `AAAA` records**, name `@`, for IPv6:

   ```
   2606:50c0:8000::153
   2606:50c0:8001::153
   2606:50c0:8002::153
   2606:50c0:8003::153
   ```

5. **Point `www` at GitHub.** `CNAME` record, name `www`, value
   `thirstypig.github.io` — host only, no scheme, no path. Most providers ship a
   default `www` → `@`; edit it rather than adding a second one.

6. **Use TTL 600**, not the default hour, for the duration of the migration. A
   short TTL makes a mistake cheap to undo. Raise it once stable.

**Gate — do not proceed until this is true:**

```
dig +short shengchangmd.com A          # the four 185.199.x.153 addresses
dig +short www.shengchangmd.com CNAME  # thirstypig.github.io.
```

## Phase 2 — repo changes

Four files. Ship as one PR; merging is what triggers the switch, so the merge
is the cutover moment.

| File | Line (as of 2026-07-31) | Change |
|------|------------------------|--------|
| `public/CNAME` | 1 | → `shengchangmd.com` |
| `.github/workflows/deploy.yml` | 48 | `SITE_URL: https://shengchangmd.com` |
| `astro.config.mjs` | 7 | fallback default → `https://shengchangmd.com` |
| `CLAUDE.md` | ~139 | update the Deployment section |

`MASTER-PORTS.md` also names the old host in the project table and in the
2026-07-30 changelog entry. That file is a mirror of the canonical registry at
`~/Projects/MASTER-PORTS.md` — update the canonical copy first, then re-mirror,
rather than editing this repo's copy in isolation.

**Both `SITE_URL` and the `astro.config.mjs` default must change.** The workflow
sets `SITE_URL` explicitly, so the config default only affects local builds —
but leaving it stale means `npm run build` locally emits different canonical
URLs than CI does, which is exactly the kind of divergence nobody notices until
it ships.

`SITE_URL` is load-bearing well beyond the visible URL: it drives every
canonical link, every sitemap entry, all hreflang alternates, and the JSON-LD
`@id`. A migration that fixes `public/CNAME` but not `SITE_URL` produces a site
that serves at the new domain while declaring the old one canonical.

## Phase 3 — HTTPS

1. Repo → **Settings → Pages**. The custom domain should read
   `shengchangmd.com` with a DNS check running.
2. **"Enforce HTTPS" is greyed out** while Let's Encrypt provisions. GitHub
   documents up to an hour.
3. Tick it once available.
4. If still stuck after an hour: remove the custom domain, save, re-add, save.
   GitHub's own troubleshooting guide recommends this to re-trigger provisioning.

**Expect HTTPS to fail during this window.** The existing certificate covers
only `shengchangmd.bahtzang.com`. Between the cutover and the new certificate
being issued, the site is genuinely unreachable over HTTPS. Schedule
accordingly.

## Phase 4 — verify

```
curl -sSI https://shengchangmd.com | head -5
curl -sSI https://www.shengchangmd.com | head -5      # expect 301 → apex
curl -s https://shengchangmd.com | grep -i 'rel="canonical"'
curl -s https://shengchangmd.com/zh-hant/ | grep -i hreflang
curl -s https://shengchangmd.com/sitemap-0.xml | head -5
```

Check the canonical, hreflang and sitemap output, not just that the homepage
renders. A page that loads correctly while emitting stale canonical URLs is the
failure mode this project has already shipped once in a different form.

---

## What breaks

**`shengchangmd.bahtzang.com` stops serving the site.** GitHub Pages honours
exactly one custom domain per repository. Once `public/CNAME` names the new
domain, the old host is no longer recognised.

Whether GitHub 404s the old host or redirects it to the new one is
**unverified** — GitHub's documentation covers redirects from the default
`*.github.io` domain and between an apex/`www` pair, but does not describe
changing from one custom domain to another. Plan for a 404. If anything links to
the bahtzang subdomain, configure an explicit redirect in the Squarespace DNS
zone for `bahtzang.com`, or accept the breakage deliberately.

**Indexing does not change, and must not.** `ALLOW_INDEXING` stays commented out
in `.github/workflows/deploy.yml`, so all pages continue to emit
`noindex, nofollow`. That gate exists because the insurance carrier list on
`insurance.astro` was generated rather than supplied by the practice. Moving to
the real domain while still `noindex` is correct and safe. Do not treat the
domain migration as "going live" — those are two separate decisions with two
separate blockers.

## Optional but recommended

**Verify the domain with GitHub** (Settings → Pages → "Verify domain"). Adds a
`_github-pages-challenge-thirstypig` TXT record and prevents anyone else from
claiming `shengchangmd.com` on GitHub Pages if it is ever unlinked. Costs two
minutes.

## Open questions

- **Registrar account access.** WHOIS registrant details are privacy-redacted,
  and the 2023-12-27 registration predates this project. Confirm the owner
  controls the destination account before scheduling the cutover.
- **Destination registrar unknown** at the time of writing — see Phase 0.
- **Old-host behaviour after cutover** — unverified, see above.

## Sources

- GitHub Pages, "Managing a custom domain for your GitHub Pages site" — apex A
  and AAAA addresses, `www` CNAME target, `ALIAS`/`ANAME` alternative.
- GitHub Pages, "Troubleshooting custom domains and GitHub Pages" — HTTPS
  provisioning delay, remove/re-add to re-trigger.
- RFC 1034 §3.6.2 — why a CNAME cannot coexist with other records at a zone apex.
