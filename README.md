# DearBloom

[English](README.md) · [한국어](README.ko.md)

**Choose flowers for the person, the occasion, and the words you want to say.**

DearBloom recommends up to three flower options from a curated catalog, with reasons, flower meanings, related stories, and a message for the card. It brings relationship context, preferences, budget, season, and pet-related cautions into one flow.

The application UI and its editorial content are currently in Korean. This repository provides English and Korean README files.

## What you can do

| Feature | What it does | Route |
|---|---|---|
| Personal recommendations | Five steps covering relationship, intent, recipient, practical constraints, and review; returns flower options, reasons, and card messages | `/recommend` |
| Group recommendations | Choose flowers for each person or a shared bouquet that considers the group's constraints | `/groups` |
| Bouquet studio | Combine one main flower, up to two accents, and a color; inspect pet-related cautions, color, fragrance, and meanings | `/bouquet` |
| Flower catalog | Browse 59 catalog entries, search by name, look up a birth flower, and open photos, botanical plates, and literature | `/flowers`, `/flowers/[slug]` |
| Seasonal calendar | Explore flowers by blooming month and continue to their catalog pages | `/calendar` |
| Story archive | Search 452 flower stories and filter by theme, family, and mood | `/stories` |
| Reading board | Browse curated festivals, articles, care guides, and color trends, alongside a separately collected festival snapshot | `/reads` |
| Recommendation sharing | Open selected flower IDs, relationship, intent, and date encoded in a link; free-text notes and generated messages are omitted | `/r?c=…` |
| Private letters | Write, edit, and reopen a letter by code; with Supabase configured the code opens it on any device, otherwise it stays in the same browser | `/letter`, `/letter/studio` |
| Flower shops and markets | Explore shop and market information and continue to external destinations | `/partners` |

The home page introduces today's flowers, stories, and birth flower.

## How recommendations work

1. **Interpret the input.** Structured answers go directly to the engine. Optional AI extraction maps the recipient note and episode to the engine's vocabulary; missing keys, timeouts, or failures fall back to a local keyword dictionary.
2. **Apply constraints.** The engine excludes flowers based on serious pet toxicity, budget bands, disliked flowers, and strong fragrance when sensitivity is selected. Mild pet-related effects are shown as cautions.
3. **Rank and explain.** Pure TypeScript functions score candidates, diversify the selection, and attach reasons and related content.
4. **Write the card message.** A separate AI call generates tone and length variants. The server can return the flower results first, then stream message drafts; only schema-validated output becomes the final message. If generation fails, prepared templates remain visible.

Available AI providers run in this order: **Gemini → Anthropic → CLOVA → NVIDIA**, using only configured keys. Extraction has a four-second total budget; message generation has a separate ten-second budget.

See the [recommendation engine](src/lib/engine/index.ts), [provider chain](src/lib/llm/chain.ts), and [streaming route](src/app/recommend/stream/route.ts).

## Current scope

- **No API key or external database is required for local use.** Recommendations, browsing, and browser-stored letters work without them.
- **CSV is the active content source.** Supabase schemas and a seed CLI are included, but seeding the database does not switch the application's content reads to Supabase.
- **Where letters are stored depends on configuration.** Without `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` a letter stays in the browser that wrote it, and clearing storage removes it. With both set, the browser signs in anonymously on save and the letter is stored in Postgres, so the code opens it on any device. This requires migrations `0009` and `0014` and Anonymous sign-ins enabled in Supabase Auth. The on-screen wording follows whichever mode the build is in, and only the bcrypt hash of the code is stored — a lost code cannot be recovered.
- **Recommendation links are separate from letters.** They encode a limited result payload in the URL without creating a server-side share record.
- **Shopping is an external handoff.** An optional 11st product-search adapter exists; without a key or usable results, the UI falls back to site links. The repository notes that real-key responses still need verification.
- **The static demo uses local text interpretation and template messages.** It shares the recommendation engine, but AI-assisted input interpretation on a server deployment can produce different inputs and therefore different recommendations. Some images still load from external hosts.

## Tech stack

| Area | Implementation |
|---|---|
| Application | Next.js 16.3.1 App Router, React 19.2.8, TypeScript |
| Styling and motion | Tailwind CSS 4, CSS Modules, GSAP, Lenis, Three.js |
| Content and validation | CSV, csv-parse, Zod 4; shared row schemas and cross-reference checks |
| Optional integrations | LLM REST APIs, 11st product search, Korea Tourism Organization TourAPI |
| Database preparation | Supabase/Postgres migrations and content upsert CLI |
| Quality checks | ESLint, Next.js route type generation, TypeScript, Vitest, GitHub Actions |

Dependency ranges and scripts are maintained in [package.json](package.json).

## Quick start

Requires **Node.js 24 or newer** and npm.

```bash
git clone https://github.com/jhsoo0211/dearbloom.git
cd dearbloom
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). Stop the server with `Ctrl+C`.

### Windows PowerShell

Use `npm.cmd` if PowerShell blocks `npm.ps1`; changing the global execution policy is unnecessary.

```powershell
npm.cmd ci
npm.cmd run dev
```

The optional launcher checks port availability without stopping an existing process by default:

```powershell
.\scripts\dev.cmd
.\scripts\dev.cmd -Port 3400
```

`-Clean` can terminate the Node process on the selected port. Likewise, `npm run stop` terminates Node process trees on ports 3000 and 3001, including another project's server if it owns those ports.

## Optional configuration

Copy [.env.example](.env.example) to `.env` only when enabling integrations:

```bash
cp .env.example .env
```

PowerShell: `Copy-Item .env.example .env`.

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `CLOVA_API_KEY`, `NVIDIA_API_KEY` | Optional server-side text interpretation and message generation |
| `LLM_MODEL` | Shared model-name override for Gemini and Anthropic; use a model valid for the enabled provider |
| `CLOVA_MODEL`, `NVIDIA_MODEL` | Provider-specific model overrides |
| `ELEVENST_API_KEY` | Optional product-search integration |
| `DATA_GO_API_KEY` | TourAPI festival collection; the script also accepts the legacy name `DATA_GO_KR_API_KEY` |
| `NEXT_PUBLIC_SITE_URL` | Canonical, Open Graph, and sitemap base URL |
| `DEARBLOOM_CONTENT_DIR` | Override the default `content/` directory |
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Local seeding CLIs (`npm run seed`, `npm run letters:seed`); the service-role key is never read by application code |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Used by `/letter` in the browser; together with the URL it switches letters to server storage. Catalog reads still come from CSV |

Keep API keys server-side and out of Git. The service-role key is for the local seed CLI, not browser configuration.

## Content

The twelve CSV files under [content/](content/) are the editorial source of truth. Counts below were checked against the repository on **2026-09-07**.

| File | Content | Rows |
|---|---|---:|
| `flowers.csv` | Flower catalog entries | 59 |
| `meanings.csv` | Flower meanings | 369 |
| `stories.csv` | Flower stories | 452 |
| `rules.csv` | Recommendation and avoidance records | 151 |
| `templates.csv` | Card-message templates | 62 |
| `quotes.csv` | Literary excerpts and general quotations | 89 |
| `pet_safety.csv` | Cat/dog records for all 59 catalog entries | 118 |
| `birth_flowers.csv` | Birth flowers for a leap-year calendar | 366 |
| `birth_photos.csv` | Birth-flower photo records, including unresolved entries | 280 |
| `birth_stories.csv` | Birth-flower stories | 407 |
| `reads.csv` | Curated external reading links | 54 |
| `occasions.csv` | Suggested gifting occasions | 91 |

The 151 rule records include 132 positive rules and 19 avoidance records. The avoidance records are not yet wired into conditional exclusion or penalties; the active exclusions are implemented separately in [exclude.ts](src/lib/engine/exclude.ts).

Use `npm run seed` to validate CSV schemas and references. For database loading, apply [migrations](db/migrations/) **0001 through 0013** in numerical order, configure the local Supabase variables, then run `npm run seed:apply`. The older setup text in the DB/deployment guides and environment example stops at 0011; include 0012 (reads) and 0013 (occasions).

TourAPI data is kept separately in `content/generated/festivals.json`. `npm run reads:festivals` refreshes that snapshot without rewriting the curated CSV. A missing key or collection failure preserves the previous snapshot, so exit code 0 alone does not prove fresh data was collected.

## Commands and verification

Use `npm.cmd` in place of `npm` where needed on PowerShell.

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Generate Next.js route types, then run `tsc --noEmit` |
| `npm run test` / `npm run test:watch` | Run Vitest once / in watch mode |
| `npm run seed` / `npm run seed:apply` | Validate content / validate and upsert it into Supabase |
| `npm run build` / `npm run start` | Build / serve the server application |
| `npm run demo:data` | Regenerate browser demo data from content |
| `npm run build:static` | Regenerate demo data and export to `out/` |
| `npm run reads:festivals` | Refresh the festival snapshot; default collection window is six months |
| `npm run birth:photos` | Download missing birth-flower photos; `-- --force` downloads existing files again |
| `npm run stop` | Windows helper that stops Node processes on ports 3000 and 3001 |

[CI](.github/workflows/ci.yml) runs the following checks on Node.js 24:

```bash
npm run lint
npm run typecheck
npm run test
npm run seed
npm run build
```

## Deployment

| Mode | Build and output | Behavior |
|---|---|---|
| Server application | `npm run build` → `.next/` | Next.js server actions and streaming; optional AI integrations |
| Static demo | `npm run build:static` → `out/` | Browser-side engine, bundled content, local interpretation, template messages |

The repository includes a [Netlify configuration](netlify.toml) and a [deployment guide](deploy/README.md) for GitHub-connected deployment. Set the deployment URL and integration keys in the hosting environment.

Static builds regenerate files under `src/lib/demo/data/` and remove the demo's `.next/` output. Run `npm run build` again before returning to `npm run start`. A static export still needs network access for externally hosted images.

## Repository map and documentation

| Path | Contents |
|---|---|
| `src/app/` | Pages, server actions, and streaming route |
| `src/components/` | Recommendation flow, catalog, bouquet, letters, and other UI |
| `src/lib/engine/` | Recommendation, grouping, bouquet checks, and explanations |
| `src/lib/llm/` | Input extraction, message contracts, prompts, and provider fallback |
| `src/lib/data/`, `content/`, `db/seed/` | CSV loading, editorial data, shared validation, and database seeding |
| `src/lib/demo/` | Static adapters and generated browser data |
| `src/lib/letters/` | Letter store port with two adapters — browser storage and Supabase — selected by environment |
| `public/`, `design/` | Image assets and approved HTML design references |
| `tests/`, `scripts/`, `db/migrations/` | Tests, operational scripts, and database schema history |
| `docs/`, `contest/`, `deploy/` | Product/research records, contest materials, and deployment instructions |

Most detailed documents are in Korean:

- [Design and flow specification](docs/design-spec.md)
- [Product plan v2](docs/기획안_v2.md) · [Integrated plan v3](docs/기획안_v3.md)
- [Content editing guide](content/README.md) · [Database guide](db/README.md)
- [Photo credits and licenses](docs/image-assets.md) · [Botanical illustration credits](docs/illustration-assets.md)
- [Reading-board research](docs/reads-research.md)
- Weekly research: [August 17](docs/weekly-research-2026-08-17.md), [August 24](docs/weekly-research-2026-08-24.md), [August 31](docs/weekly-research-2026-08-31.md)

Product plans also describe future work. Use the current source code and the scope above to distinguish implemented behavior from planned features.
