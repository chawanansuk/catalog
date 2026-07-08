#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
import-current-prices.py — นำเข้า "ราคาตอนนี้" (ราคาขายปัจจุบัน) จากไฟล์ .docx
ตาราง 3 คอลัมน์: รหัส | ชื่อ | ราคา  →  public/current-prices.json  { "CODE": price }

แก้ราคาทีหลัง: อัปเดตไฟล์ .docx แล้วรันใหม่
    python3 scripts/import-current-prices.py path/to/prices.docx
จากนั้น commit + push เพื่อ deploy

แถวที่จับคู่รหัสไม่ได้จะถูกเขียนลง unmatched-current-prices.txt
พร้อมรหัสใกล้เคียงที่ระบบเดาให้ — แก้รหัสในไฟล์ .docx แล้วรันใหม่
"""
import sys, re, json, zipfile, difflib

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
    if not re.match(r"^[0-9.]+$", pr):
        continue
    items.append((code, name, float(pr)))

# จับคู่รหัสกับฐานข้อมูลราคาหลัก (เทียบแบบ normalize: ตัดอักขระพิเศษ + ตัวพิมพ์ใหญ่)
products = json.load(open("public/wynns.json", encoding="utf-8"))
norm = lambda s: re.sub(r"[^A-Z0-9]", "", s.upper())
by_norm = {}
for p in products:
    if p.get("code"):
        by_norm.setdefault(norm(p["code"]), []).append(p["code"])
all_norms = list(by_norm.keys())

def find_match(code):
    """คืน list รหัสจริงที่ตรง หรือ None — ลองแบบตรง แล้วลองเติม/ตัด W นำหน้า"""
    n = norm(code)
    if not n:
        return None
    if n in by_norm:
        return by_norm[n]
    # เคสพบบ่อย: ในไฟล์ราคาพิมพ์ตกตัว W นำหน้า หรือเกินมา
    if not n.startswith("W") and ("W" + n) in by_norm:
        return by_norm["W" + n]
    if n.startswith("W") and n[1:] in by_norm:
        return by_norm[n[1:]]
    return None

out = {}
matched = 0
unmatched = []
for code, name, price in items:
    exacts = find_match(code)
    if exacts:
        for ec in exacts:
            out[ec] = price
        matched += 1
    else:
        # เดารหัสใกล้เคียงช่วย (แสดงเฉยๆ ไม่นำไปใช้ — กันราคาลงผิดตัว)
        n = norm(code)
        sugg = difflib.get_close_matches(n, all_norms, n=3, cutoff=0.75) if n else []
        sugg_codes = [by_norm[s][0] for s in sugg]
        unmatched.append((code, name, price, sugg_codes))

json.dump(out, open("public/current-prices.json", "w", encoding="utf-8"),
          ensure_ascii=False, separators=(",", ":"))
print(f"นำเข้าราคาตอนนี้: {len(items)} แถว, จับคู่รหัสได้ {matched}, "
      f"เขียน public/current-prices.json ({len(out)} รหัส)")

if unmatched:
    lines = [
        "รายการที่จับคู่รหัสไม่ได้ — แก้รหัสในไฟล์ .docx แล้วรันสคริปต์ใหม่",
        "รูปแบบ: รหัสในไฟล์ | ชื่อ | ราคา | รหัสใกล้เคียงที่ระบบเดา",
        "",
    ]
    for code, name, price, sugg in unmatched:
        s = " / ".join(sugg) if sugg else "-"
        lines.append(f"{code or '(ว่าง)'} | {name} | {price:g} | เดา: {s}")
    with open("unmatched-current-prices.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"⚠ จับคู่ไม่ได้ {len(unmatched)} แถว — ดูรายละเอียด+รหัสที่เดาให้ใน "
          f"unmatched-current-prices.txt")
