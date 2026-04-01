#!/usr/bin/env python3
"""
enrich_wikipedia.py
───────────────────
Enriches municipality data with Wikipedia URLs and coat of arms images
via Wikidata SPARQL. Saves images to ./images/{codigo_ine}.{ext}.

Usage:
    python enrich_wikipedia.py --input municipios_merged.json --output municipios_enriched.json

Features:
  - Checkpointing: skips already-processed entries on re-run (checkpoint.json)
  - Rate-limiting: max 10 requests/second to Wikidata
  - Idempotent: safe to interrupt and restart
"""

import argparse
import json
import mimetypes
import os
import time
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import urlretrieve

import requests

SPARQL_ENDPOINT = "https://query.wikidata.org/sparql"
RATE_LIMIT = 10  # requests per second
REQUEST_INTERVAL = 1.0 / RATE_LIMIT
CHECKPOINT_FILE = "checkpoint.json"
IMAGES_DIR = Path("images")

SPARQL_TEMPLATE = """
SELECT ?municipio ?wikipediaUrl ?escudo WHERE {{
  ?municipio wdt:P771 "{codigo_ine}" .
  OPTIONAL {{ ?municipio wdt:P94 ?escudo }}
  OPTIONAL {{
    ?wikipediaUrl schema:about ?municipio ;
      schema:inLanguage "es" ;
      schema:isPartOf <https://es.wikipedia.org/> .
  }}
}}
LIMIT 1
"""

HEADERS = {
    "Accept": "application/sparql-results+json",
    "User-Agent": "MunicipioCollector/1.0 (https://municipiocollector.es; contact@municipiocollector.es)",
}


def load_checkpoint(path: str) -> set[str]:
    if not Path(path).exists():
        return set()
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    return set(data.get("processed", []))


def save_checkpoint(path: str, processed: set[str]) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump({"processed": sorted(processed)}, f, ensure_ascii=False)


def query_wikidata(codigo_ine: str) -> dict:
    sparql = SPARQL_TEMPLATE.format(codigo_ine=codigo_ine)
    resp = requests.get(
        SPARQL_ENDPOINT,
        params={"query": sparql, "format": "json"},
        headers=HEADERS,
        timeout=15,
    )
    resp.raise_for_status()
    bindings = resp.json().get("results", {}).get("bindings", [])
    if not bindings:
        return {}
    b = bindings[0]
    return {
        "wikipediaUrl": b.get("wikipediaUrl", {}).get("value"),
        "escudoUrl": b.get("escudo", {}).get("value"),
    }


def download_escudo(url: str, codigo_ine: str) -> str | None:
    """Download escudo image. Returns the saved filename (e.g. '28079.png') or None."""
    IMAGES_DIR.mkdir(exist_ok=True)
    try:
        # Derive extension from URL or content-type
        parsed = urlparse(url)
        ext = Path(parsed.path).suffix.lower() or ".png"
        # Wikimedia special files URL → use thumb to get raster if SVG not desired
        filename = f"{codigo_ine}{ext}"
        out_path = IMAGES_DIR / filename
        if out_path.exists():
            return filename
        urlretrieve(url, out_path)
        return filename
    except Exception as e:
        print(f"    ⚠ Could not download escudo for {codigo_ine}: {e}")
        return None


def main() -> None:
    parser = argparse.ArgumentParser(description="Enrich municipalities with Wikipedia data")
    parser.add_argument("--input", default="municipios_merged.json")
    parser.add_argument("--output", default="municipios_enriched.json")
    parser.add_argument(
        "--checkpoint", default=CHECKPOINT_FILE, help="Checkpoint file for resumable runs"
    )
    args = parser.parse_args()

    with open(args.input, encoding="utf-8") as f:
        municipios: list[dict] = json.load(f)

    processed = load_checkpoint(args.checkpoint)
    print(f"Loaded {len(municipios)} municipalities. Already processed: {len(processed)}")

    total = len(municipios)
    with_wikipedia = 0
    with_escudo = 0
    missing_both = 0

    last_request_time = 0.0

    for i, muni in enumerate(municipios):
        codigo_ine = muni["codigoIne"]

        if codigo_ine in processed:
            # Count stats from existing data
            if muni.get("wikipediaUrl"):
                with_wikipedia += 1
            if muni.get("escudoFilename"):
                with_escudo += 1
            if not muni.get("wikipediaUrl") and not muni.get("escudoFilename"):
                missing_both += 1
            continue

        # Rate limiting
        elapsed = time.monotonic() - last_request_time
        if elapsed < REQUEST_INTERVAL:
            time.sleep(REQUEST_INTERVAL - elapsed)

        print(f"[{i+1}/{total}] {codigo_ine} — {muni['nombre']}…", end=" ", flush=True)

        try:
            last_request_time = time.monotonic()
            result = query_wikidata(codigo_ine)

            if result.get("wikipediaUrl"):
                muni["wikipediaUrl"] = result["wikipediaUrl"]
                with_wikipedia += 1
                print(f"Wikipedia ✓", end=" ")

            if result.get("escudoUrl"):
                filename = download_escudo(result["escudoUrl"], codigo_ine)
                if filename:
                    muni["escudoFilename"] = filename
                    with_escudo += 1
                    print(f"Escudo ✓", end=" ")

            if not result.get("wikipediaUrl") and not result.get("escudoUrl"):
                missing_both += 1

            print()

        except Exception as e:
            print(f"ERROR: {e}")
            # Don't mark as processed so it will be retried on next run
            continue

        processed.add(codigo_ine)

        # Save checkpoint every 50 items
        if len(processed) % 50 == 0:
            save_checkpoint(args.checkpoint, processed)
            out_path = Path(args.output)
            out_path.write_text(
                json.dumps(municipios, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            print(f"  → Checkpoint saved ({len(processed)} processed)")

    # Final save
    save_checkpoint(args.checkpoint, processed)
    out_path = Path(args.output)
    out_path.write_text(json.dumps(municipios, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\n{'='*50}")
    print(f"Summary Report")
    print(f"{'='*50}")
    print(f"Total processed   : {total}")
    print(f"With Wikipedia    : {with_wikipedia} ({with_wikipedia/total*100:.1f}%)")
    print(f"With escudo       : {with_escudo} ({with_escudo/total*100:.1f}%)")
    print(f"Missing both      : {missing_both} ({missing_both/total*100:.1f}%)")
    print(f"Output            : {out_path}")
    print(f"Images directory  : {IMAGES_DIR}/")


if __name__ == "__main__":
    main()
