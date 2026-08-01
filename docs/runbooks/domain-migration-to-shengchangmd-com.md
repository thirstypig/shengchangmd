---
title: 'Migrating the site from shengchangmd.bahtzang.com to shengchangmd.com'
date: 2026-07-31
updated: 2026-08-01
status: blocked
blocked_on: 'registrar transfer of shengchangmd.com to Squarespace in progress (pendingTransfer); the GoDaddy zone is still authoritative and does not accept edits. Site is up on the old host.'
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

> **Status: blocked; site serving normally on the old host.** A registrar
> transfer of `shengchangmd.com` from GoDaddy to Squarespace was in
> `pendingTransfer` as of 2026-08-01, so the migration cannot proceed. The repo
> is unchanged — `public/CNAME` and `SITE_URL` still name the old host, and the
> Pages custom domain is back on `shengchangmd.bahtzang.com` with HTTPS enforced.

## The outage of 2026-08-01 — read this before touching Settings → Pages

**Resolved the same day.** For about an hour the site was unreachable at every
URL — the old host 404'd, `thirstypig.github.io/shengchangmd/` redirected to the
broken new host, and `shengchangmd.com` served the GoDaddy parking page (a `200`,
which looks healthy in a browser and is not).

Cause: GitHub Pages settings were changed to `cname: shengchangmd.com` ahead of
the DNS records landing, which un-configured the old host without configuring
the new one. `https_enforced` flipped to `false` automatically, because no
certificate existed for the new domain.

Restored by setting the custom domain back explicitly:

```
gh api -X PUT repos/thirstypig/shengchangmd/pages -f cname='shengchangmd.bahtzang.com'
gh api -X PUT repos/thirstypig/shengchangmd/pages -F https_enforced=true
```

Verified after: `200` over HTTPS with real page content, certificate `approved`
for `shengchangmd.bahtzang.com` through 2026-10-27. The repo is unchanged —
`public/CNAME` and `SITE_URL` still name the old host — so the migration itself
has not started.

## Why this document exists

The move is more than a find-and-replace on a hostname. Three things make it
worth writing down before doing it:

1. `shengchangmd.com` is an **apex** domain. The current host is a subdomain.
   The two require structurally different DNS records.
2. The steps have a **required order**. Doing the repo change before the DNS
   change lengthens the outage instead of shortening it.
3. There is an unavoidable **window where HTTPS fails**, and one thing that
   breaks permanently.
4. Two traps have already been hit in practice — see below.

## Mistakes already made (2026-08-01)

Both were reasonable-looking actions that failed silently or destructively.

**Editing DNS while the transfer was pending did nothing.** The records were
entered and the panel reported success, but querying the authoritative
nameservers directly showed the parking IPs unchanged, no AAAA records at all,
and `www` still pointing at `@`. The giveaway was the zone's SOA serial:
`2025040802`, a date-based serial from 2025-04-08. The zone had not been
modified in roughly sixteen months.

Either the edits were made in the gaining registrar's panel — whose nameservers
are not yet authoritative, since the registry still delegates to GoDaddy's
`ns35`/`ns36` — or GoDaddy accepted the form without committing the zone while
in `pendingTransfer`. Either way the lesson is the same: **verify against the
authoritative nameserver, not the DNS panel and not a plain `dig`.**

```
dig +short @ns35.domaincontrol.com shengchangmd.com A     # bypasses all caching
dig +short @ns35.domaincontrol.com shengchangmd.com SOA   # serial should be today
```

**Changing the Pages custom domain in the Settings UI took the site down.**
Setting it to `shengchangmd.com` before DNS resolved un-configured the old host
— which immediately began returning 404 — while the new host still served the
registrar's parking page. There was no working URL at all.

Change it only when DNS already resolves to GitHub. There is no grace period —
the old host stops working the instant the setting changes.

**`public/CNAME` does not control the custom domain on this repo — verified.**
An earlier draft of this runbook claimed the `CNAME` file in the build artifact
was the source of truth and that any deploy would reset the Pages setting from
it. That was tested on 2026-08-01 and is **false**: a deploy ran to success with
`public/CNAME` containing `shengchangmd.bahtzang.com` while the Pages setting
stayed on `shengchangmd.com`, and the site stayed down.

This repo is `build_type: workflow`. On workflow-based Pages, the custom domain
lives **only** in the repository setting; the artifact's `CNAME` file is inert.
It is honoured on the legacy branch-based build, which is where the widespread
"just commit a CNAME file" advice comes from.

Two consequences, both load-bearing for Phase 2:

- Editing `public/CNAME` alone **will not switch the domain**. Phase 2 needs an
  explicit settings change as a separate step.
- Conversely, merging to `main` cannot accidentally flip the domain back, so
  ordinary work is safe to land at any point in this migration.

Keep `public/CNAME` accurate anyway. It costs nothing, it documents intent, and
it is what would take effect if the deployment method ever reverts to a branch
build.

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
| Pages custom domain | `shengchangmd.bahtzang.com` — **changed to `shengchangmd.com` on 2026-08-01**, see Current state | `gh api repos/thirstypig/shengchangmd/pages` |
| Pages HTTPS | enforced, cert valid to 2026-10-27 — **now `https_enforced: false`** | same |
| Pages build type | `workflow` (not legacy branch build) | same |
| Transfer status | `pendingTransfer` since 2026-07-30T22:15:02Z | `whois` |
| Zone SOA serial | `2025040802` — stale, zone unmodified | `dig SOA` |

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

To reverse this, set `www.shengchangmd.com` as the Pages custom domain in
Phase 2b (and in `public/CNAME` for consistency) and swap the DNS record roles.
The rest of the runbook is unchanged.

---

## Phase 0 — re-verify after the transfer completes

The transfer invalidates part of the table above. Before touching anything:

```
whois shengchangmd.com | grep -iE "registrar:|name server"
dig +short shengchangmd.com NS
```

You are ready when `Domain Status` reads `ok` rather than `pendingTransfer`, and
the `NS` records name Squarespace's nameservers rather than
`ns35`/`ns36.domaincontrol.com`. Until the delegation moves, nothing entered in
any panel resolves.

Then confirm:

- **Whether the transfer preserved or reset the zone.** Transfers frequently
  reset DNS to the new registrar's defaults, which usually means a fresh parking
  page and a default `www` record. Expect to re-enter everything.
- **That the domain is not simultaneously attached to a Squarespace site.**
  Squarespace will want to point the domain at its own hosting; that must be
  disconnected or it will fight the GitHub Pages records.

**Destination confirmed: Squarespace** (owner, 2026-08-01). Squarespace also
hosts the DNS for `bahtzang.com`, so the panel is already familiar. Squarespace
supports `A`, `AAAA`, `ALIAS` and `CNAME` records, which means Phase 1 has two
valid shapes — see below.

---

## Phase 1 — DNS (do this first)

DNS goes first. Once it resolves to GitHub, the domain returns a 404 until
Phase 2 — which is harmless, because it is a parking page today. Reversing the
order means the site is down for the full DNS propagation instead.

**Pick one of two shapes for the apex, not both.** Squarespace supports each:

- **Four `A` records** (steps 3–4). The better-trodden path with GitHub Pages,
  trivially verifiable with `dig +short … A`, and what most troubleshooting
  guides assume. Downside: the IPs are hardcoded, so a GitHub rotation breaks it.
- **One `ALIAS` record**, name `@`, value `thirstypig.github.io`. Squarespace
  resolves it at query time, so it survives GitHub changing its IPs. GitHub's
  documentation explicitly permits `ALIAS`/`ANAME` for apex domains.

⚠️ **`ALIAS` and `A`/`AAAA` conflict when they share a name field.** Squarespace
rejects an `ALIAS` at `@` if `A` records already exist at `@`. Choose one and
delete the other — do not try to run both as belt-and-braces.

Either is correct. The `A`-record path is written out below because it is easier
to debug; substitute the single `ALIAS` record for steps 3–4 if preferred.

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

**Gate — do not proceed until this is true.** Query the authoritative
nameserver, not just your resolver; a plain `dig` can return a cached answer and
tell you nothing. Substitute the real nameservers once Squarespace holds the
zone:

```
NS=$(dig +short shengchangmd.com NS | head -1)
dig +short @"$NS" shengchangmd.com A          # four 185.199.x.153 (or ALIAS target)
dig +short @"$NS" www.shengchangmd.com CNAME  # thirstypig.github.io.
dig +short @"$NS" shengchangmd.com SOA        # serial should carry today's date
```

The SOA serial is the cheapest proof the zone was actually written. If it still
shows an old date, the edits did not commit — see "Mistakes already made".

## Phase 2 — repo changes, then the settings flip

Four files, shipped as one PR. **Merging is not the cutover** — see Phase 2b.
The merge only makes the built HTML self-consistent with the new domain.

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

## Phase 2b — the actual cutover

The Pages custom domain lives in the repository setting, not in `public/CNAME`
— see "Mistakes already made". Nothing switches until this runs:

```
gh api -X PUT repos/thirstypig/shengchangmd/pages -f cname='shengchangmd.com'
```

Or Settings → Pages → Custom domain. **This is the moment the old host starts
404ing**, so do it only once Phase 1's gate check passes. If DNS is not yet
correct, this is precisely the failure of 2026-08-01: no working URL at all.

To roll back at any point, put the old host back the same way and re-enable
HTTPS:

```
gh api -X PUT repos/thirstypig/shengchangmd/pages -f cname='shengchangmd.bahtzang.com'
gh api -X PUT repos/thirstypig/shengchangmd/pages -F https_enforced=true
```

Rollback is near-instant, because the certificate for the old host stays valid
until 2026-10-27.

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
exactly one custom domain per repository. The moment Phase 2b sets the Pages
custom domain to the new host, the old one is no longer recognised.

**It 404s — this is now verified, not predicted.** When the Pages custom domain
was switched on 2026-08-01, `https://shengchangmd.bahtzang.com/` began returning
404 immediately. GitHub issues no redirect from a superseded custom domain; its
documentation covers redirects from the default `*.github.io` host and between
an apex/`www` pair, and that is the full extent of it.

The default `thirstypig.github.io/shengchangmd/` *does* redirect to whatever the
current custom domain is, so it is not a usable fallback either.

If anything links to the bahtzang subdomain, configure an explicit redirect in
the Squarespace DNS zone for `bahtzang.com`, or accept the breakage deliberately.

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

- **Transfer completion date.** `pendingTransfer` was set 2026-07-30T22:15:02Z.
  ICANN allows the losing registrar up to five days, so it may run to about
  2026-08-04. Approving the transfer-out at GoDaddy usually accelerates it.
- **Whether the Squarespace zone arrives empty or pre-populated**, and whether
  Squarespace attaches the domain to one of its own site templates by default.

Resolved since the first draft:

- ~~Destination registrar~~ — Squarespace, confirmed by the owner 2026-08-01.
  It supports `ALIAS`, so the four hardcoded A records are optional.
- ~~Old-host behaviour after cutover~~ — verified 404, no redirect.
- ~~Registrar account access~~ — the owner can see the transfer in the
  Squarespace panel, so the destination account is his.

## Sources

- GitHub Pages, "Managing a custom domain for your GitHub Pages site" — apex A
  and AAAA addresses, `www` CNAME target, `ALIAS`/`ANAME` alternative.
- GitHub Pages, "Troubleshooting custom domains and GitHub Pages" — HTTPS
  provisioning delay, remove/re-add to re-trigger.
- RFC 1034 §3.6.2 — why a CNAME cannot coexist with other records at a zone apex.
- Squarespace Help Center, "Edit your domain's DNS records" and "Troubleshooting
  issues with DNS records" — supported record types (`A`, `AAAA`, `ALIAS`,
  `CNAME`) and the `ALIAS`/`A` name-field conflict.
