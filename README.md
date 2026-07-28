# Projects — James Chang

Personal workspace containing all active and archived projects. Each folder is a self-contained product.

---

## Active Projects

| Folder                | Product / Domain              | Stack                          | Status   |
|-----------------------|-------------------------------|--------------------------------|----------|
| `thefantasticleagues` | thefantasticleagues.com       | React + Vite / Node + Express  | Active   |
| `bbq-judge`           | thejudgetool.com              | Next.js / Node API             | Active   |
| `ktv-singer`          | ktv app + server              | React Native / Express + WS    | Active   |
| `tastemakers`         | tastemakersapp.com            | Next.js / Laravel / iOS / Android | Active |
| `alephco.io`          | alephco.io                    | React + Vite + Express (unified) / Static | Active |
| `bahtzang-trader`     | bahtzang.com                  | Next.js 14 / FastAPI (Python)  | Active   |
| `tabledrop`           | tabledrop app                 | Next.js (Turborepo monorepo)   | Active   |
| `jameschang.co`       | jameschang.co                 | Static HTML/CSS                | Active   |
| `thirstypig`          | thirstypig content site       | Astro                          | Active   |
| `cooper-stack3`       | internal tool                 | React / Express                | Occasional |
| `vouch`               | vouch app                     | Next.js 16 / Supabase          | Active   |
| `spar`                | spar.bahtzang.com (staging)   | Next.js 16 / Retell + Stripe   | Active   |

---

## Port Registry

**See [MASTER-PORTS.md](./MASTER-PORTS.md) for the full registry** — reserved blocks, conventions, conflict-check script, and Claude context prompt.

**See [PORTS.md](./PORTS.md) for the quick-reference table.**

Each project folder contains its own:
- `MASTER-PORTS.md` — full global registry (byte-identical copy of this root file)
- `PORTS.md` — port assignments for that project only

### Port Summary

| Project                     | Frontend | API  | WS   | PG   | Redis |
|-----------------------------|----------|------|------|------|-------|
| thefantasticleagues (app)   | 3010     | 4010 | —    | 5442 | 6381  |
| thefantasticleagues (www)   | 3011     | —    | —    | —    | —     |
| bbq-judge (app)             | 3030     | 4030 | —    | 5444 | 6383  |
| bbq-judge (www)             | 3031     | —    | —    | —    | —     |
| ktv-singer                  | 3040     | 4040 | 8040 | —    | 6385  |
| tastemakers (web)           | 3050     | —    | —    | —    | —     |
| tastemakers (backend)       | —        | 4050 | —    | 5446 | 6384  |
| alephco.io (app, unified)   | —        | 4060 | —    | —    | —     |
| alephco.io (www, static)    | 3060     | —    | —    | —    | —     |
| bahtzang-trader (frontend)  | 3070     | —    | —    | —    | —     |
| bahtzang-trader (backend)   | —        | 4070 | —    | —    | —     |
| tabledrop                   | 3080     | —    | —    | 5448 | 6387  |
| jameschang.co               | 3090     | —    | —    | —    | —     |
| thirstypig                  | 4321     | —    | —    | —    | —     |
| cooper-stack3               | —        | 4100 | —    | —    | —     |
| vouch                       | 3020     | —    | —    | —    | —     |
| spar                        | 3110     | —    | —    | —    | —     |
| **FUTURE-2** (reserved)     | 3120     | 4120 | —    | 5450 | 6389  |
| **FUTURE-3** (reserved)     | 3130     | 4130 | —    | 5451 | 6390  |

---

## Quick Conflict Check

```bash
lsof -i -P -n | grep LISTEN | grep -E '3010|3011|3020|3030|3031|3040|3050|3060|3070|3080|3090|3110|4010|4030|4040|4050|4051|4060|4070|4100|4321|5442|5444|5445|5446|5448|6381|6383|6384|6385|6387|8040|24680|24681'
```

---

## Conventions

- Each product owns a **10-port block**: e.g., thefantasticleagues owns 3010–3019 (frontend) and 4010–4019 (API).
- `-www` marketing sites share the same block as the `-app`, offset by 1.
- PG ports start at 5442 (+1 per product). Redis at 6381 (+1 per product).
- Claim a **FUTURE** slot before creating a new product — never freelance a port number.
- When retiring a product, mark its block `AVAILABLE` in `MASTER-PORTS.md` for 30 days before reclaiming.
