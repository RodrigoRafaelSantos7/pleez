#!/usr/bin/env python3
import csv
import json
import sys
from pathlib import Path

csv_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('orders.csv')
with csv_path.open(newline='', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))

# Convert numeric fields to int/bool
for r in rows:
    r['quantity']   = int(r['quantity'])
    r['is_promo']  = bool(int(r['is_promo']))

json.dump(rows, sys.stdout, indent=2)