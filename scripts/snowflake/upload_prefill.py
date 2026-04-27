#!/usr/bin/env python3
"""
Sube un CSV al endpoint /full-revenue/prefill-links/bulk del backend.
Guarda los tokens y URLs resultantes en otro CSV para outreach.
"""
import csv
import json
import sys
import urllib.request
from pathlib import Path

BACKEND_URL = "https://full-revenue-backend-production.up.railway.app"
BASE_URL = "https://full-revenue-frontend-zw22.vercel.app"
EXPIRES_IN_DAYS = 30

def upload(csv_path: str, output_path: str) -> None:
    csv_text = Path(csv_path).read_text(encoding="utf-8")
    payload = json.dumps({
        "csv": csv_text,
        "base_url": BASE_URL,
        "expires_in_days": EXPIRES_IN_DAYS,
    }).encode("utf-8")

    req = urllib.request.Request(
        f"{BACKEND_URL}/full-revenue/prefill-links/bulk",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    print(f"POST {req.full_url} ({len(csv_text)} bytes)...", file=sys.stderr)

    with urllib.request.urlopen(req, timeout=300) as resp:
        body = resp.read().decode("utf-8")
        result = json.loads(body)

    print(f"\nRespuesta:", file=sys.stderr)
    print(f"  total:   {result['total']}", file=sys.stderr)
    print(f"  created: {result['created']}", file=sys.stderr)
    print(f"  errors:  {len(result['errors'])}", file=sys.stderr)
    if result["errors"]:
        print(f"\nPrimeros errores:", file=sys.stderr)
        for e in result["errors"][:5]:
            print(f"  fila {e['row']}: {e['error']}", file=sys.stderr)

    # Cargar source CSV para join con partner_code/email
    source_rows = list(csv.DictReader(open(csv_path, encoding="utf-8")))
    source_by_merchant = {r["MERCHANT_ID"]: r for r in source_rows}

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow([
            "merchant_id", "partner_code", "first_name", "last_name",
            "email", "phone", "base_amount",
            "token", "url",
        ])
        for link in result["links"]:
            mid = link["merchant_id"]
            src = source_by_merchant.get(mid, {})
            w.writerow([
                mid,
                src.get("PARTNER_CODE", ""),
                src.get("FIRST_NAME", ""),
                src.get("LAST_NAME", ""),
                src.get("EMAIL", ""),
                src.get("PHONE", ""),
                src.get("BASE_AMOUNT", ""),
                link["token"],
                link["url"],
            ])
    print(f"\nLinks exportados a: {output_path}", file=sys.stderr)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Uso: upload_prefill.py <input.csv> <output_links.csv>", file=sys.stderr)
        sys.exit(1)
    upload(sys.argv[1], sys.argv[2])
