#!/usr/bin/env python3
"""
update_poblacion.py
───────────────────
Updates population figures and recomputes rareza for existing municipalities.

Usage:
    DATABASE_URL=postgresql://... python update_poblacion.py --input new_ine.csv --year 2023

Expected CSV columns:
    codigo_ine, poblacion

Prints a summary of how many municipalities changed rarity tier.
"""

import argparse
import csv
import os
import sys
from collections import defaultdict

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    print("ERROR: psycopg2-binary not installed. Run: pip install psycopg2-binary")
    sys.exit(1)


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


def load_csv(path: str) -> dict[str, int | None]:
    """Returns a dict mapping codigo_ine → poblacion (int or None)."""
    data: dict[str, int | None] = {}
    with open(path, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            codigo = row.get("codigo_ine", "").strip()
            if not codigo:
                continue
            raw = row.get("poblacion", "").strip()
            try:
                data[codigo] = int(raw.replace(".", "").replace(",", ""))
            except (ValueError, AttributeError):
                data[codigo] = None
    return data


def main() -> None:
    parser = argparse.ArgumentParser(description="Update population data in the database")
    parser.add_argument("--input", required=True, help="Path to new INE CSV file")
    parser.add_argument("--year", type=int, required=True, help="Year of the population data")
    args = parser.parse_args()

    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL environment variable not set")
        sys.exit(1)

    print(f"Loading CSV from {args.input}…")
    csv_data = load_csv(args.input)
    print(f"  → {len(csv_data)} entries in CSV")

    print("Connecting to database…")
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()

    # Fetch current population and rareza for all municipalities in the CSV
    csv_codes = list(csv_data.keys())
    cur.execute(
        """
        SELECT "codigoIne", "poblacion", "rareza"
        FROM "Municipio"
        WHERE "codigoIne" = ANY(%s)
        """,
        (csv_codes,),
    )
    existing = {row[0]: {"poblacion": row[1], "rareza": row[2]} for row in cur.fetchall()}
    print(f"  → {len(existing)} municipalities found in DB matching CSV")

    # Build update batch
    updates = []
    rareza_changes: dict[tuple[str, str], int] = defaultdict(int)

    for codigo, new_poblacion in csv_data.items():
        if codigo not in existing:
            continue  # Not in DB, skip

        current = existing[codigo]
        new_rareza = compute_rareza(new_poblacion)
        old_rareza = current["rareza"]

        updates.append({
            "codigoIne": codigo,
            "poblacion": new_poblacion,
            "poblacionYear": args.year,
            "rareza": new_rareza,
        })

        if new_rareza != old_rareza:
            rareza_changes[(old_rareza, new_rareza)] += 1

    print(f"  → {len(updates)} municipalities to update")

    if not updates:
        print("Nothing to update. Exiting.")
        conn.close()
        return

    # Batch update
    psycopg2.extras.execute_batch(
        cur,
        """
        UPDATE "Municipio"
        SET
            "poblacion"     = %(poblacion)s,
            "poblacionYear" = %(poblacionYear)s,
            "rareza"        = %(rareza)s::"Rareza"
        WHERE "codigoIne"   = %(codigoIne)s
        """,
        updates,
        page_size=500,
    )
    conn.commit()

    print(f"\n✓ Updated {len(updates)} municipalities with {args.year} population data.")

    total_changes = sum(rareza_changes.values())
    if total_changes == 0:
        print("  No rarity tier changes.")
    else:
        print(f"\n  Rarity tier changes ({total_changes} total):")
        for (old, new), count in sorted(rareza_changes.items()):
            print(f"    {old:20s} → {new:20s}  {count:>4} municipalities")

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
