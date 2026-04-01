# MunicipioCollector

> Colecciona los 8.132 municipios de España como cartas coleccionables.  
> Pokémon cards meets Spanish geography — pull every 2 hours, collect by rarity, share your finds.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + scoped CSS-in-JS |
| Database | PostgreSQL via Supabase |
| ORM | Prisma |
| Image storage | Cloudflare R2 |
| Hosting | Vercel |
| Card export | `html2canvas` + Web Share API |
| Data pipeline | Python 3.10+ (`/scripts`) |

---

## Local Development Setup

### 1. Prerequisites

- Node.js 18+
- npm or pnpm
- PostgreSQL (local or Supabase free tier)
- Python 3.10+ (for data pipeline only)

### 2. Clone and install

```bash
git clone https://github.com/yourname/municipio-collector
cd municipio-collector
npm install
```

### 3. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local and fill in DATABASE_URL, R2_*, NEXT_PUBLIC_APP_URL
```

### 4. Set up the database

```bash
npm run db:push         # dev (push schema directly)
npm run db:migrate      # prod (migration files)
```

### 5. Run the data pipeline (first time)

```bash
cd scripts

# 1. Merge INE + IGN CSVs
python merge_datasets.py --ine ine_municipios.csv --ign ign_municipios.csv

# 2. Enrich with Wikipedia & escudos (resumable, takes a few hours)
python enrich_wikipedia.py

# 3. Upload escudo images to R2
R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... R2_BUCKET_NAME=municipios \
  python upload_images_r2.py --images-dir images

# 4. Seed the database
DATABASE_URL=postgresql://... python seed_db.py
```

### 6. Start dev server

```bash
npm run dev
# Open http://localhost:3000
```

---

## R2 CORS Setup (required for card export)

In Cloudflare R2 dashboard → Bucket → Settings → CORS Policy:

```json
[
  {
    "AllowedOrigins": ["https://municipiocollector.es", "http://localhost:3000"],
    "AllowedMethods": ["GET"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 86400
  }
]
```

---

## Rarity Tiers

| Tier | Population | ~Count |
|---|---|---|
| Gran Ciudad | > 100,000 | 60 |
| Ciudad | 10,000–100,000 | 360 |
| Gran Pueblo | 1,000–10,000 | 1,450 |
| Pueblo | 100–1,000 | 3,800 |
| España Vacía | < 100 | 2,460 |

España Vacía cards use a sepia/grain aged visual treatment distinct from all other tiers.

---

## Achievements (72 total)

- **Coleccionista (10)** — milestone counts: 1, 10, 50, 100, 250, 500, 1k, 2k, 4k, 8131
- **Rareza (10)** — first/all of each rarity tier
- **Provincia (52)** — complete all municipalities in each province (data-driven, not hardcoded)

---

## Security

- UUID is the sole identity — no passwords, no sessions
- Pull timing recomputed server-side on every call
- Random draw is server-side — uncollected list never sent to client
- Achievement evaluation is atomic with the collection insert
