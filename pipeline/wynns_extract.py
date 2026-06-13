#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
wynns_extract.py
สกัดข้อมูลแคตตาล็อก WYNNS (จีน) -> JSON ภาษาไทย ทีละหน้า ด้วย Claude API (vision)

ใช้งาน:
    pip install anthropic pymupdf pillow
    export ANTHROPIC_API_KEY=sk-ant-...        # หรือ setx บน Windows
    python wynns_extract.py INPUT.pdf --start 30 --model claude-sonnet-4-6

- รันซ้ำได้ (resume): หน้าที่มี out/pages/p{n}.json แล้วจะถูกข้าม
- ผลลัพธ์: out/pages/p{n}.json (รายหน้า) + crop รูปลง out/images/
- จากนั้นรัน  python wynns_merge.py  แล้ว  python wynns_build_web.py
"""
import os, sys, json, re, base64, argparse, time
import fitz  # PyMuPDF
from io import BytesIO
from PIL import Image

# ---------- การตั้งค่า ----------
RASTER_DPI = 170          # ความละเอียดภาพหน้าที่ส่งให้โมเดล
THUMB_DPI  = 200          # ความละเอียดสำหรับ crop รูปสินค้า
THUMB_MAX  = 360          # ขนาด thumbnail สูงสุด (px)
OUTDIR     = "out"

GLOSSARY = json.load(open("glossary.json", encoding="utf-8")) if os.path.exists("glossary.json") else {}

SYSTEM = """คุณคือผู้ช่วยสกัดข้อมูลจากแคตตาล็อกเครื่องมือช่างยี่ห้อ WYNNS (威力狮) ภาษาจีน
แล้วแปลเป็นภาษาไทย หน้าที่ของคุณคืออ่านภาพ 1 หน้าแล้วคืนข้อมูลเป็น JSON เท่านั้น

กฎสำคัญ:
- คืน JSON ล้วน ไม่มีคำอธิบาย ไม่มี markdown fence
- ตัวเลข/รหัสสินค้า/ขนาด/ราคา ให้คัดลอกตรงตามต้นฉบับ ห้ามเดา ถ้าอ่านไม่ชัดให้ใส่ "" 
- คงคำเทคนิคพวกนี้เป็นต้นฉบับ ไม่ต้องแปล: เกรดเหล็ก (3Cr13, 55#, SK-5, CR-V, 5Cr15Mov, 2Cr13 ฯลฯ),
  ค่า HRC, ขนาด mm/นิ้ว, AWG, mm²
- ราคาในเล่มเป็นเงินหยวน (RMB) ใส่ใน price_rmb เป็นตัวเลข
- ถ้า 1 สินค้ามีหลายรหัส/หลายขนาดในตารางเดียว ให้เลือกรหัสแรกเป็น code หลัก
  แล้วใส่รหัสที่เหลือใน variants เป็นสตริง เช่น "W822B (8\\"/200mm) ¥21.42"
- features_th = จุดเด่น (★) แปลเป็นไทยกระชับ
- photo_bbox = กรอบรูป "ตัวสินค้าหลักชิ้นใหญ่" เป็นพิกัด normalize 0..1 [x0,y0,x1,y1]
  (x ซ้าย->ขวา, y บน->ล่าง)
  *** สำคัญมาก: กรอบต้องแนบชิดเฉพาะ "ตัวเครื่องมือ/ผลิตภัณฑ์" เท่านั้น ***
  ห้ามรวมสิ่งเหล่านี้เข้ากรอบเด็ดขาด: แถบหัวข้อสีเขียว, ตัวอักษรจีน/อังกฤษ/ชื่อรุ่น,
  รูปรุ่นย่อยเล็ก (thumbnail ซ้าย/ตรง/ขวา), ป้าย NEW/CR-V, ตารางสเปก/ราคา, ไอคอนหมวด
  ให้กรอบเล็กแนบขอบตัวสินค้าจริง (เผื่อขอบรอบรูปนิดเดียว) ถ้าไม่มีรูปสินค้าจริงใส่ null
- ถ้าหน้านี้ไม่ใช่หน้าสินค้า (หน้าปก/หน้าคั่นหมวด/หน้าอธิบายการทดสอบ/หน้าคีย์ไอคอน)
  ให้คืน {"is_product_page": false, "section_th": "...", "section_en": "...", "products": []}

ใช้คำแปลหมวด/คำศัพท์ตาม glossary ที่ให้ เพื่อความสม่ำเสมอ"""

SCHEMA_HINT = """รูปแบบ JSON ที่ต้องคืน:
{
 "is_product_page": true,
 "section_th": "เครื่องมือตัด",
 "section_en": "CUTTING TOOLS",
 "products": [
   {
     "code": "W866",
     "name_th": "กรรไกรตัดกิ่ง (ด้ามไม้แดง)",
     "name_en": "BRANCH SHEARS",
     "cat_th": "กรรไกรตัดกิ่ง",
     "size": "8\\"/200mm",
     "material_th": "ใบมีดสเตนเลส 3Cr13",
     "hardness": "HRC50-54",
     "pack": "10/60",
     "meas": "52×28×23cm",
     "weight": "19.1kg",
     "price_rmb": 60.65,
     "tags": ["STANLESS"],
     "variants": [],
     "features_th": ["ระยะตัด: เส้นผ่านศูนย์กลาง 20 มม.", "ด้ามไม้แดงเกรดสูง แข็งแรงทนทาน"],
     "photo_bbox": [0.18, 0.11, 0.46, 0.20]
   }
 ]
}"""


def render_page(page, dpi):
    pix = page.get_pixmap(matrix=fitz.Matrix(dpi/72, dpi/72), alpha=False)
    return Image.frombytes("RGB", [pix.width, pix.height], pix.samples)


def page_to_b64(page, dpi):
    img = render_page(page, dpi)
    buf = BytesIO(); img.save(buf, format="JPEG", quality=85)
    return base64.b64encode(buf.getvalue()).decode(), img


def parse_json(text):
    text = re.sub(r"^```(json)?|```$", "", text.strip(), flags=re.M).strip()
    i, j = text.find("{"), text.rfind("}")
    if i == -1 or j == -1:
        raise ValueError("no JSON found")
    return json.loads(text[i:j+1])


def crop_thumb(img, bbox, code):
    if not bbox or img is None:
        return
    try:
        W, H = img.size
        pad = 0.01
        x0 = max(0, int((bbox[0]-pad)*W)); y0 = max(0, int((bbox[1]-pad)*H))
        x1 = min(W, int((bbox[2]+pad)*W)); y1 = min(H, int((bbox[3]+pad)*H))
        if x1-x0 < 10 or y1-y0 < 10:
            return
        c = img.crop((x0, y0, x1, y1)); c.thumbnail((THUMB_MAX, THUMB_MAX))
        os.makedirs(f"{OUTDIR}/images", exist_ok=True)
        c.save(f"{OUTDIR}/images/{code}.jpg", quality=82)
    except Exception as e:
        print(f"    [warn] crop {code}: {e}")


def extract_page(client, model, page, page_no):
    b64, _ = page_to_b64(page, RASTER_DPI)
    user = [
        {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": b64}},
        {"type": "text", "text": f"นี่คือหน้า {page_no} ของแคตตาล็อก WYNNS\n\nGLOSSARY:\n"
                                 f"{json.dumps(GLOSSARY, ensure_ascii=False)}\n\n{SCHEMA_HINT}\n\nคืน JSON เท่านั้น"},
    ]
    for attempt in range(3):
        try:
            resp = client.messages.create(
                model=model, max_tokens=8000,
                system=SYSTEM, messages=[{"role": "user", "content": user}],
            )
            txt = "".join(b.text for b in resp.content if b.type == "text")
            return parse_json(txt)
        except Exception as e:
            print(f"    [retry {attempt+1}] {e}")
            time.sleep(2*(attempt+1))
    raise RuntimeError(f"page {page_no}: failed after retries")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf")
    ap.add_argument("--start", type=int, default=1, help="เลขหน้าจริงของหน้าแรกในไฟล์ (เช่น 30)")
    ap.add_argument("--model", default="claude-sonnet-4-6")
    ap.add_argument("--from", dest="pfrom", type=int, default=None, help="เริ่มที่ index หน้าใน PDF (1-based)")
    ap.add_argument("--to", dest="pto", type=int, default=None)
    args = ap.parse_args()

    import anthropic
    client = anthropic.Anthropic()  # อ่าน ANTHROPIC_API_KEY จาก env

    doc = fitz.open(args.pdf)
    os.makedirs(f"{OUTDIR}/pages", exist_ok=True)
    lo = (args.pfrom or 1) - 1
    hi = (args.pto or doc.page_count)
    for idx in range(lo, hi):
        page_no = args.start + idx          # เลขหน้าจริงในเล่ม
        outp = f"{OUTDIR}/pages/p{page_no}.json"
        if os.path.exists(outp):
            print(f"page {page_no}: ข้าม (มีแล้ว)"); continue
        print(f"page {page_no}: กำลังสกัด…")
        data = extract_page(client, args.model, doc[idx], page_no)
        data["page"] = page_no
        products = data.get("products", [])
        # เรนเดอร์ภาพหน้าครั้งเดียว ถ้ามีสินค้าที่ต้อง crop รูป
        thumb_img = None
        if any(p.get("photo_bbox") for p in products):
            thumb_img = render_page(doc[idx], THUMB_DPI)
        for i, prod in enumerate(products):
            prod["page"] = page_no
            prod["section"] = data.get("section_th", "")
            code = prod.get("code") or f"p{page_no}_{i}"
            crop_thumb(thumb_img, prod.get("photo_bbox"), code)
        json.dump(data, open(outp, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        n = len(data.get("products", []))
        print(f"page {page_no}: ✓ {n} รุ่น" + ("" if data.get("is_product_page", True) else " (ไม่ใช่หน้าสินค้า)"))

    print("เสร็จ. ต่อไปรัน:  python wynns_merge.py  แล้ว  python wynns_build_web.py")


if __name__ == "__main__":
    main()
