#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
import-current-prices.py — นำเข้า "ราคาตอนนี้" (ราคาขายปัจจุบัน) จากไฟล์ .docx
ตาราง 3 คอลัมน์: รหัส | ชื่อ | ราคา  →  public/current-prices.json  { "CODE": price }

แก้ราคาทีหลัง: อัปเดตไฟล์ .docx แล้วรันใหม่
    python3 scripts/import-current-prices.py path/to/prices.docx
จากนั้น commit + push เพื่อ deploy
"""
import sys, re, json, zipfile

if len(sys.argv) < 2:
    print("ใช้: python3 scripts/import-current-prices.py <prices.docx>")
    sys.exit(1)

docx = sys.argv[1]
with zipfile.ZipFile(docx) as z:
    xml = z.read("word/document.xml").decode("utf-8")

def cell_text(tc):
    return "".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", tc)).strip()

rows = re.findall(r"<w:tr\b.*?</w:tr>", xml, re.S)
items = []
for r in rows:
    cells = [cell_text(c) for c in re.findall(r"<w:tc\b.*?</w:tc>", r, re.S)]
    if len(cells) < 3:
        continue
    code, name, price = cells[0], cells[1], cells[2]
    pr = price.replace(",", "")
    if not code or not re.match(r"^[0-9.]+$", pr):
        continue
    items.append((code, float(pr)))

# จับคู่รหัสกับฐานข้อมูลราคาหลัก (เทียบแบบ normalize: ตัดอักขระพิเศษ + ตัวพิมพ์ใหญ่)
products = json.load(open("public/wynns.json", encoding="utf-8"))
norm = lambda s: re.sub(r"[^A-Z0-9]", "", s.upper())
by_norm = {}
for p in products:
    if p.get("code"):
        by_norm.setdefault(norm(p["code"]), []).append(p["code"])

out = {}
matched = 0
for code, price in items:
    exacts = by_norm.get(norm(code))
    if exacts:
        for ec in exacts:
            out[ec] = price
        matched += 1

json.dump(out, open("public/current-prices.json", "w", encoding="utf-8"),
          ensure_ascii=False, separators=(",", ":"))
print(f"นำเข้าราคาตอนนี้: {len(items)} แถว, จับคู่รหัสได้ {matched}, เขียน public/current-prices.json ({len(out)} รหัส)")
