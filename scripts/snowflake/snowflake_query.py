#!/usr/bin/env python3
"""
Wrapper para correr queries Snowflake con SSO (externalbrowser).
Uso:
    python3 snowflake_query.py "SELECT 1"            # Imprime resultado
    python3 snowflake_query.py -f query.sql          # Ejecuta archivo SQL
    python3 snowflake_query.py -f query.sql -o out.csv  # Exporta a CSV

Requiere: pip3 install --user snowflake-connector-python
"""
import argparse
import csv
import sys
from pathlib import Path

import snowflake.connector

# Config — leído del URL https://app.snowflake.com/bbcoxzm/lbb44019/
ACCOUNT = "bbcoxzm-lbb44019"
USER = "lucas.mayorca@r2capital.co"
DATABASE = "DEV_ANALYTICS"
SCHEMA = "RBF_V3_RAW"
WAREHOUSE = "PRODUCT_WH_XS"
ROLE = "PRODUCT_BASIC"


def run_query(sql: str, output_csv: str | None = None) -> None:
    print(f"Conectando a Snowflake (SSO)...", file=sys.stderr)
    conn = snowflake.connector.connect(
        account=ACCOUNT,
        user=USER,
        authenticator="externalbrowser",
        database=DATABASE,
        schema=SCHEMA,
        warehouse=WAREHOUSE,
        role=ROLE,
        client_session_keep_alive=True,
    )
    try:
        cur = conn.cursor()
        cur.execute(sql)
        rows = cur.fetchall()
        cols = [d[0] for d in cur.description]

        if output_csv:
            with open(output_csv, "w", newline="", encoding="utf-8") as f:
                w = csv.writer(f)
                w.writerow(cols)
                w.writerows(rows)
            print(f"OK — {len(rows)} filas escritas en {output_csv}", file=sys.stderr)
        else:
            # Print pretty para terminal
            print(",".join(cols))
            for r in rows[:50]:
                print(",".join(str(c) if c is not None else "" for c in r))
            if len(rows) > 50:
                print(f"\n... ({len(rows) - 50} filas más, total={len(rows)})", file=sys.stderr)
            print(f"\nTotal: {len(rows)} filas", file=sys.stderr)
    finally:
        conn.close()


def main():
    p = argparse.ArgumentParser()
    g = p.add_mutually_exclusive_group(required=True)
    g.add_argument("sql", nargs="?", help="SQL inline")
    g.add_argument("-f", "--file", help="Archivo .sql con la query")
    p.add_argument("-o", "--output", help="Exportar resultado a CSV")
    args = p.parse_args()

    if args.file:
        sql = Path(args.file).read_text()
    else:
        sql = args.sql

    run_query(sql, args.output)


if __name__ == "__main__":
    main()
