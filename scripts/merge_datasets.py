#!/usr/bin/env python3
"""
merge_datasets.py
─────────────────
Joins INE municipality data with IGN geographic data and computes rarity tiers.

Usage:
    python merge_datasets.py --ine ine_municipios.csv --ign ign_municipios.csv --out municipios_merged.json

Expected INE CSV columns:
    codigo_ine, nombre, provincia, comunidad_autonoma, poblacion, superficie_km2

Expected IGN CSV columns:
    codigo_ine, latitud, longitud, altitud_m

Output: municipios_merged.json
"""

import argparse
import csv
import json
import sys
from pathlib import Path


def compute_rareza(poblacion: int | None) -> str:
    if poblacion is None:
        return "ESPANA_VACIA"
    if poblacion > 100_000:
        return "GRAN_CIUDAD"
    if poblacion >= 10_000:
        return "CIUDAD"
    if poblacion >= 1_000:
        return "GRAN_PUEBLO"
    if poblacion >= 100:
        return "PUEBLO"
    return "ESPANA_VACIA"


def load_csv(path: str) -> list[dict]:
    with open(path, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        return [row for row in reader]


def parse_float(value: str | None) -> float | None:
    if not value or value.strip() == "":
        return None
    try:
        return float(value.replace(",", "."))
    except ValueError:
        return None


def parse_int(value: str | None) -> int | None:
    if not value or value.strip() == "":
        return None
    try:
        return int(value.replace(".", "").replace(",", ""))
    except ValueError:
        return None


def main() -> None:
    parser = argparse.ArgumentParser(description="Merge INE + IGN municipality datasets")
    parser.add_argument("--ine", required=True, help="Path to INE CSV file")
    parser.add_argument("--ign", required=True, help="Path to IGN CSV file")
    parser.add_argument("--out", default="municipios_merged.json", help="Output JSON file")
    args = parser.parse_args()

    print(f"Loading INE data from {args.ine}…")
    ine_rows = load_csv(args.ine)
    print(f"  → {len(ine_rows)} rows")

    print(f"Loading IGN data from {args.ign}…")
    ign_rows = load_csv(args.ign)
    print(f"  → {len(ign_rows)} rows")

    # Index IGN by codigo_ine for O(1) lookup
    ign_index: dict[str, dict] = {row["codigo_ine"].strip(): row for row in ign_rows}

    merged: list[dict] = []
    no_ign_match = 0

    for row in ine_rows:
        codigo_ine = row["codigo_ine"].strip()
        if not codigo_ine:
            continue

        poblacion = parse_int(row.get("poblacion"))
        ign = ign_index.get(codigo_ine)

        if ign is None:
            no_ign_match += 1

        record = {
            "codigoIne": codigo_ine,
            "nombre": row["nombre"].strip(),
            "provincia": row["provincia"].strip(),
            "codigoProvincia": codigo_ine[:2],
            "comunidadAutonoma": row["comunidad_autonoma"].strip(),
            "poblacion": poblacion,
            "poblacionYear": parse_int(row.get("poblacion_year")),
            "superficieKm2": parse_float(row.get("superficie_km2")),
            "latitud": parse_float(ign.get("latitud")) if ign else None,
            "longitud": parse_float(ign.get("longitud")) if ign else None,
            "altitudM": parse_int(ign.get("altitud_m")) if ign else None,
            "rareza": compute_rareza(poblacion),
            "wikipediaUrl": None,
            "escudoFilename": None,
        }
        merged.append(record)

    out_path = Path(args.out)
    out_path.write_text(json.dumps(merged, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\n✓ Merged {len(merged)} municipalities → {out_path}")
    print(f"  IGN matches missing: {no_ign_match}")

    # Rareza breakdown
    rareza_counts: dict[str, int] = {}
    for m in merged:
        rareza_counts[m["rareza"]] = rareza_counts.get(m["rareza"], 0) + 1
    print("\n  Rareza breakdown:")
    for k, v in sorted(rareza_counts.items()):
        print(f"    {k:20s} {v:>5}")


if __name__ == "__main__":
    main()
