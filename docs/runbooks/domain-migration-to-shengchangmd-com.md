---
title: 'Migrating the site from shengchangmd.bahtzang.com to shengchangmd.com'
date: 2026-07-31
updated: 2026-08-01
status: blocked
blocked_on: 'registrar transfer of shengchangmd.com to Squarespace in progress (pendingTransfer); the GoDaddy zone is still authoritative and does not accept edits'
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

> **Status: blocked, and the site is currently down.** See "Current state" below
> before doing anything. A registrar transfer of `shengchangmd.com` from GoDaddy
> to Squarespace was in `pendingTransfer` as of 2026-08-01. The repo itself is
> unchanged — `public/CNAME` and `SITE_URL` still name the old host.

## Current state (2026-08-01) — read this first

**The site is unreachable at every URL, deliberately, pending the transfer.**

| URL | Result |
|-----|--------|
| `https://shengchangmd.bahtzang.com/` | **404** — no longer the configured custom domain |
| `https://thirstypig.github.io/shengchangmd/` | 301 → `http://shengchangmd.com/` |
| `https://shengchangmd.com/` | 200, but it is the **GoDaddy parking page**, not this site |

GitHub Pages settings were changed to `cname: shengchangmd.com` ahead of the DNS
records landing, which un-configured the old host without configuring the new
one. `https_enforced` was automatically set to `false`, because no certificate
exists for the new domain. GitHub's dashboard shows "improperly configured",
which is accurate.

The owner chose on 2026-08-01 to leave it down rather than switch twice. The
site is `noindex` and not publicly promoted, so exposure is limited.

**To restore service before the transfer completes:** `public/CNAME` on `main`
still contains `shengchangmd.bahtzang.com`, so triggering a deploy should reset
the Pages custom domain from the build artifact. Failing that, set it manually
in Settings → Pages and re-tick "Enforce HTTPS".

> ⚠️ **Any push to `main` triggers the deploy workflow**, which uploads
> `public/CNAME` and will therefore probably flip the custom domain back to
> `shengchangmd.bahtzang.com` on its own. That is a side effect of merging *any*
> change while this drift exists, including a documentation-only change. Expect
> it, or land work on a branch without merging.

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

Do not touch Settings → Pages during this migration. This repo is
`build_type: workflow`; the `CNAME` file in the uploaded artifact is the source
of truth, and the UI writes the same underlying setting without syncing it back
to the repo. The two then disagree until the next deploy overwrites the UI. Let
Phase 2 drive the change through `public/CNAME` in a PR, as designed.

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

To reverse this, put `www.shengchangmd.com` in `public/CNAME` instead and swap
the DNS record roles. The rest of the runbook is unchanged.

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
