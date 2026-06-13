#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
wynns_merge.py — รวม out/pages/p*.json ทั้งหมดเป็น out/catalog.json
"""
import json, glob, os, re

OUTDIR = "out"
files = sorted(glob.glob(f"{OUTDIR}/pages/p*.json"),
               key=lambda f: int(re.search(r"p(\d+)\.json", f).group(1)))

products, sections, skipped = [], [], []
for f in files:
    d = json.load(open(f, encoding="utf-8"))
    if not d.get("is_product_page", True):
        skipped.append(d.get("page"))
        continue
    sec = d.get("section_th", "")
    if sec and sec not in sections:
        sections.append(sec)
    for p in d.get("products", []):
        p.setdefault("section", sec)
        # บังคับ price_rmb เป็นตัวเลข (โมเดลอาจคืนมาเป็นสตริง/มี ¥) กัน build พัง
        pr = p.get("price_rmb")
        if isinstance(pr, str):
            m = re.search(r"[\d.]+", pr.replace(",", ""))
            pr = float(m.group()) if m else None
        elif isinstance(pr, (int, float)):
            pr = float(pr)
        else:
            pr = None
        p["price_rmb"] = pr
        for k in ("tags", "variants", "features_th"):
            if not isinstance(p.get(k), list):
                p[k] = []
        # ตรวจว่ามีรูป crop ไหม
        p["has_img"] = os.path.exists(f"{OUTDIR}/images/{p.get('code','')}.jpg")
        products.append(p)

catalog = {
    "brand": "WYNNS / 威力狮",
    "catalog": "Product Manual 2026 (Thai)",
    "sections": sections,
    "count": len(products),
    "products": products,
}
json.dump(catalog, open(f"{OUTDIR}/catalog.json", "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
print(f"รวม {len(products)} รุ่น, {len(sections)} หมวด -> {OUTDIR}/catalog.json")
if skipped:
    print(f"หน้าที่ข้าม (ไม่ใช่หน้าสินค้า): {skipped}")
