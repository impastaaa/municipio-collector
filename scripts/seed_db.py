#!/usr/bin/env python3
"""
seed_db.py
──────────
Seeds the database with municipalities and achievements.
Idempotent: safe to run multiple times (upserts).

Usage:
    DATABASE_URL=postgresql://... python seed_db.py --input municipios_enriched.json

Requires: psycopg2-binary
    pip install psycopg2-binary
"""

import argparse
import json
import os
import sys
from typing import Any

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    print("ERROR: psycopg2-binary not installed. Run: pip install psycopg2-binary")
    sys.exit(1)


# ── Hardcoded achievement definitions ────────────────────────────────────────

MILESTONE_ACHIEVEMENTS = [
    {
        "slug": "col_1",
        "nombre": "Primer municipio",
        "descripcion": "Consigue tu primer municipio.",
        "icono": "🗺️",
        "categoria": "COLECCIONISTA",
    },
    {
        "slug": "col_10",
        "nombre": "Coleccionista novel",
        "descripcion": "Consigue 10 municipios.",
        "icono": "📦",
        "categoria": "COLECCIONISTA",
    },
    {
        "slug": "col_50",
        "nombre": "En racha",
        "descripcion": "Consigue 50 municipios.",
        "icono": "🔥",
        "categoria": "COLECCIONISTA",
    },
    {
        "slug": "col_100",
        "nombre": "Centenario",
        "descripcion": "Consigue 100 municipios.",
        "icono": "💯",
        "categoria": "COLECCIONISTA",
    },
    {
        "slug": "col_250",
        "nombre": "Explorador",
        "descripcion": "Consigue 250 municipios.",
        "icono": "🧭",
        "categoria": "COLECCIONISTA",
    },
    {
        "slug": "col_500",
        "nombre": "Medio millar",
        "descripcion": "Consigue 500 municipios.",
        "icono": "🎖️",
        "categoria": "COLECCIONISTA",
    },
    {
        "slug": "col_1000",
        "nombre": "Millar",
        "descripcion": "Consigue 1.000 municipios.",
        "icono": "🏅",
        "categoria": "COLECCIONISTA",
    },
    {
        "slug": "col_2000",
        "nombre": "Gran coleccionista",
        "descripcion": "Consigue 2.000 municipios.",
        "icono": "🥈",
        "categoria": "COLECCIONISTA",
    },
    {
        "slug": "col_4000",
        "nombre": "Medio España",
        "descripcion": "Consigue 4.000 municipios.",
        "icono": "🥇",
        "categoria": "COLECCIONISTA",
    },
    {
        "slug": "col_complete",
        "nombre": "España completa",
        "descripcion": "Consigue los 8.131 municipios de España.",
        "icono": "🏆",
        "categoria": "COLECCIONISTA",
    },
]

RAREZA_ACHIEVEMENTS = [
    {
        "slug": "rareza_gran_ciudad_1",
        "nombre": "Primera Gran Ciudad",
        "descripcion": "Consigue tu primera carta de Gran Ciudad.",
        "icono": "🏙️",
        "categoria": "RAREZA",
    },
    {
        "slug": "rareza_gran_ciudad_all",
        "nombre": "Todas las Grandes Ciudades",
        "descripcion": "Consigue todas las cartas de Gran Ciudad.",
        "icono": "🌆",
        "categoria": "RAREZA",
    },
    {
        "slug": "rareza_ciudad_10",
        "nombre": "10 Ciudades",
        "descripcion": "Consigue 10 cartas de Ciudad.",
        "icono": "🏘️",
        "categoria": "RAREZA",
    },
    {
        "slug": "rareza_ciudad_all",
        "nombre": "Todas las Ciudades",
        "descripcion": "Consigue todas las cartas de Ciudad.",
        "icono": "🏛️",
        "categoria": "RAREZA",
    },
    {
        "slug": "rareza_gran_pueblo_50",
        "nombre": "50 Grandes Pueblos",
        "descripcion": "Consigue 50 cartas de Gran Pueblo.",
        "icono": "🌄",
        "categoria": "RAREZA",
    },
    {
        "slug": "rareza_gran_pueblo_all",
        "nombre": "Todos los Grandes Pueblos",
        "descripcion": "Consigue todas las cartas de Gran Pueblo.",
        "icono": "⛰️",
        "categoria": "RAREZA",
    },
    {
        "slug": "rareza_pueblo_100",
        "nombre": "100 Pueblos",
        "descripcion": "Consigue 100 cartas de Pueblo.",
        "icono": "🏡",
        "categoria": "RAREZA",
    },
    {
        "slug": "rareza_pueblo_all",
        "nombre": "Todos los Pueblos",
        "descripcion": "Consigue todas las cartas de Pueblo.",
        "icono": "🌾",
        "categoria": "RAREZA",
    },
    {
        "slug": "rareza_espana_vacia_1",
        "nombre": "España Vacía",
        "descripcion": "Consigue tu primera carta de España Vacía.",
        "icono": "🌵",
        "categoria": "RAREZA",
    },
    {
        "slug": "rareza_espana_vacia_all",
        "nombre": "La España Olvidada",
        "descripcion": "Consigue todas las cartas de España Vacía.",
        "icono": "🏜️",
        "categoria": "RAREZA",
    },
]


def get_connection(database_url: str):
    return psycopg2.connect(database_url)


def parse_float(value) -> float | None:
    if value is None:
        return None
    try:
        return float(str(value).replace(",", "."))
    except (ValueError, TypeError):
        return None


def parse_int(value) -> int | None:
    if value is None:
        return None
    try:
        return int(str(value).replace(",", ".").split(".")[0])
    except (ValueError, TypeError):
        return None


def upsert_municipios(cur, municipios: list[dict]) -> int:
    upserted = 0
    for raw in municipios:
        m = {
            "codigoIne": raw.get("codigo_ine"),
            "nombre": raw.get("nombre"),
            "provincia": raw.get("provincia"),
            "codigoProvincia": raw.get("codigo_provincia")
            or (raw.get("codigo_ine", "")[:2]),
            "comunidadAutonoma": raw.get("comunidad_autonoma"),
            "poblacion": parse_int(raw.get("poblacion")),
            "poblacionYear": parse_int(
                raw.get("poblacion_year") or raw.get("poblacionYear")
            ),
            "superficieKm2": parse_float(raw.get("superficie_km2")),
            "latitud": parse_float(raw.get("latitud")),
            "longitud": parse_float(raw.get("longitud")),
            "altitudM": parse_int(raw.get("altitud_m")),
            "wikipediaUrl": raw.get("wikipediaUrl"),
            "escudoFilename": raw.get("escudoFilename"),
            "rareza": raw.get("rareza"),
        }
        cur.execute(
            """
            INSERT INTO "Municipio" (
                "codigoIne", "nombre", "provincia", "codigoProvincia",
                "comunidadAutonoma", "poblacion", "poblacionYear",
                "superficieKm2", "latitud", "longitud", "altitudM",
                "wikipediaUrl", "escudoFilename", "rareza"
            ) VALUES (
                %(codigoIne)s, %(nombre)s, %(provincia)s, %(codigoProvincia)s,
                %(comunidadAutonoma)s, %(poblacion)s, %(poblacionYear)s,
                %(superficieKm2)s, %(latitud)s, %(longitud)s, %(altitudM)s,
                %(wikipediaUrl)s, %(escudoFilename)s, %(rareza)s
            )
            ON CONFLICT ("codigoIne") DO UPDATE SET
                "nombre"            = EXCLUDED."nombre",
                "provincia"         = EXCLUDED."provincia",
                "codigoProvincia"   = EXCLUDED."codigoProvincia",
                "comunidadAutonoma" = EXCLUDED."comunidadAutonoma",
                "poblacion"         = EXCLUDED."poblacion",
                "poblacionYear"     = EXCLUDED."poblacionYear",
                "superficieKm2"     = EXCLUDED."superficieKm2",
                "latitud"           = EXCLUDED."latitud",
                "longitud"          = EXCLUDED."longitud",
                "altitudM"          = EXCLUDED."altitudM",
                "wikipediaUrl"      = EXCLUDED."wikipediaUrl",
                "escudoFilename"    = EXCLUDED."escudoFilename",
                "rareza"            = EXCLUDED."rareza"
            """,
            m,
        )
        upserted += 1
    return upserted


def upsert_achievements(cur, achievements: list[dict]) -> int:
    upserted = 0
    for a in achievements:
        cur.execute(
            """
            INSERT INTO "Achievement" ("slug", "nombre", "descripcion", "icono", "categoria")
            VALUES (%(slug)s, %(nombre)s, %(descripcion)s, %(icono)s, %(categoria)s::"AchievementCategory")
            ON CONFLICT ("slug") DO UPDATE SET
                "nombre"      = EXCLUDED."nombre",
                "descripcion" = EXCLUDED."descripcion",
                "icono"       = EXCLUDED."icono",
                "categoria"   = EXCLUDED."categoria"
            """,
            a,
        )
        upserted += 1
    return upserted


def generate_province_achievements(cur) -> list[dict]:
    """Generate province achievements from distinct codigoProvincia + provincia in the DB."""
    cur.execute(
        """
        SELECT DISTINCT "codigoProvincia", "provincia"
        FROM "Municipio"
        ORDER BY "codigoProvincia"
        """
    )
    rows = cur.fetchall()
    achievements = []
    for codigo_provincia, provincia in rows:
        achievements.append(
            {
                "slug": f"provincia_{codigo_provincia}",
                "nombre": provincia,
                "descripcion": f"Consigue todos los municipios de {provincia}.",
                "icono": "📍",
                "categoria": "PROVINCIA",
            }
        )
    return achievements


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Seed the database with municipalities and achievements"
    )
    parser.add_argument("--input", default="municipios_enriched.json")
    args = parser.parse_args()

    """
    TODO en local es lo de debajo, para deploy hay que usar esto
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL environment variable not set")
        sys.exit(1)
    """

    database_url = "postgresql://postgres:password@localhost:5433/municipio_collector"

    with open(args.input, encoding="utf-8") as f:
        municipios: list[dict] = json.load(f)

    print(f"Connecting to database…")
    conn = get_connection(database_url)
    conn.autocommit = False
    cur = conn.cursor()

    try:
        # 1. Upsert municipalities
        print(f"Upserting {len(municipios)} municipalities…")
        count = upsert_municipios(cur, municipios)
        print(f"  → {count} upserted")

        # 2. Seed milestone achievements
        print(f"Seeding {len(MILESTONE_ACHIEVEMENTS)} milestone achievements…")
        upsert_achievements(cur, MILESTONE_ACHIEVEMENTS)

        # 3. Seed rareza achievements
        print(f"Seeding {len(RAREZA_ACHIEVEMENTS)} rareza achievements…")
        upsert_achievements(cur, RAREZA_ACHIEVEMENTS)

        # 4. Generate + seed province achievements from DB data
        province_achievements = generate_province_achievements(cur)
        print(f"Seeding {len(province_achievements)} province achievements…")
        upsert_achievements(cur, province_achievements)

        conn.commit()
        print(f"\n✓ Seed complete.")
        total_achievements = (
            len(MILESTONE_ACHIEVEMENTS)
            + len(RAREZA_ACHIEVEMENTS)
            + len(province_achievements)
        )
        print(f"  Municipalities : {count}")
        print(
            f"  Achievements   : {total_achievements} ({len(MILESTONE_ACHIEVEMENTS)} milestone + {len(RAREZA_ACHIEVEMENTS)} rareza + {len(province_achievements)} provincia)"
        )

    except Exception as e:
        conn.rollback()
        print(f"\nERROR: {e}")
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
