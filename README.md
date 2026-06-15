# 🔧 WYNNS — ค้นหาราคาสินค้า

เว็บแอปค้นหาราคาสินค้า WYNNS ด้วยรหัสสินค้า สร้างด้วย **Next.js 16 + TypeScript + Tailwind CSS**
ทำงานเป็น **static site** (ค้นหาทั้งหมดในเบราว์เซอร์ ไม่ต้องมีเซิร์ฟเวอร์) จึงโฮสต์ฟรีได้ทุกที่

## ฟีเจอร์

- 🔤 ค้นด้วยรหัสสินค้า **ไม่สนพิมพ์เล็ก/ใหญ่หรือเว้นวรรค** — `wsb230b`, `WSB230B`, `wsb 230b` เจอเหมือนกัน
- 🔍 ค้นด้วยชื่อสินค้าภาษาไทยก็ได้
- 📊 จัดอันดับผล: ตรงเป๊ะ → ขึ้นต้นด้วย → มีคำนี้ → ชื่อตรง
- 💰 แสดงราคาครบ: ราคาทุน (เน้นสี), ขายส่งพิเศษ, ขายส่ง, ราคาขายปลีก, ราคารวมภาษี, ราคาส่งออก
- ⚡ ค้นหาแบบ real-time จากฐานข้อมูล 5,066 รายการ

## เริ่มต้นใช้งาน

```bash
npm install
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

## คำสั่งที่มี

| คำสั่ง | คำอธิบาย |
| --- | --- |
| `npm run dev` | รัน dev server |
| `npm run build` | build เป็น static export (ผลอยู่ใน `out/`) |
| `npm run start` | preview production build |

## โครงสร้างโปรเจค

```
public/
└── wynns.json              # ฐานข้อมูลสินค้า (โหลดฝั่ง browser)
src/
├── app/
│   ├── layout.tsx          # layout หลัก (header/footer)
│   ├── page.tsx            # หน้าค้นหา
│   └── globals.css         # Tailwind + base styles
├── components/
│   └── PriceLookup.tsx     # กล่องค้นหา + แสดงผลราคา (client)
└── lib/
    ├── products.ts         # ชนิดข้อมูล + ฟังก์ชันค้นหา/จัดอันดับ
    ├── format.ts           # ฟอร์แมตราคา (บาท)
    └── ai/typhoon.ts        # เลเยอร์เชื่อมต่อ Typhoon (optional)
```

## Deploy ขึ้น GitHub Pages (ฟรี)

โปรเจคตั้ง GitHub Actions ไว้แล้ว (`.github/workflows/deploy.yml`) — deploy อัตโนมัติเมื่อ push เข้า `main`

ตั้งค่าครั้งเดียว:

1. รวมโค้ดเข้า branch `main` (merge)
2. ไปที่ repo → **Settings → Pages**
3. ที่ **Source** เลือก **GitHub Actions**
4. รอ workflow รันเสร็จ เว็บจะอยู่ที่ `https://<username>.github.io/<repo>/`

> หมายเหตุ: workflow ตั้งค่า `BASE_PATH=/<ชื่อ repo>` ให้อัตโนมัติ เพราะ GitHub Pages
> โฮสต์โปรเจคไว้ใต้ path ชื่อ repo

### โฮสต์ที่อื่น

เพราะเป็น static export (`out/`) จะนำไปวางบน **Vercel / Netlify / Cloudflare Pages**
ก็ได้เช่นกัน — ถ้าโฮสต์ที่ root domain ไม่ต้องตั้ง `BASE_PATH`

## อัปเดตข้อมูลราคา (จากไฟล์ Excel)

เมื่อมีไฟล์ราคา WYNNS (Excel) ใหม่ — รันคำสั่งเดียวจบ (อ่าน Excel → ดึงรหัสรุ่น →
เข้ารหัสราคาทุน → เขียน `public/wynns.json`):

```bash
COST_PASSPHRASE='รหัสผู้บริหาร' node scripts/import-excel.mjs path/to/price.xlsx
git add -A && git commit -m "update prices" && git push   # (push เข้า main เพื่อ deploy)
```

โครงไฟล์ Excel ที่รองรับ:
- ชีต **"บัญชีราคา (หลัก)"**: ชื่อไทย | ชื่อจีน | หน่วย | ราคารวมภาษี | ราคาส่งออก | **ราคาทุน** | ขายส่งพิเศษ | ขายส่ง | ราคาขายปลีก
- ชีต **"สินค้าใหม่"** (ถ้ามี): รหัสสินค้า | ชื่อไทย | ชื่อจีน | หน่วย | ราคารวมภาษี | หมายเหตุ

> ราคารวมภาษี/ราคาส่งออก ไม่ถูกเก็บลงไฟล์ (เว็บไม่แสดง) เพื่อลดขนาด

## อัปเดต "ราคาตอนนี้" (ราคาขายปัจจุบัน)

ราคาตอนนี้แสดงเป็นบรรทัดเด่นบนการ์ด มาจาก `public/current-prices.json`
แก้ไขได้โดยอัปเดตไฟล์ Word (ตาราง 3 คอลัมน์: รหัส | ชื่อ | ราคา) แล้วรัน:

```bash
python3 scripts/import-current-prices.py path/to/prices.docx
git add -A && git commit -m "update current prices" && git push
```

## โหมดผู้บริหาร — ราคาทุน (เข้ารหัส)

ราคาทุน (`cost`) ถูก **เข้ารหัส AES-256-GCM** เก็บไว้ใน `public/wynns.json`
(ฟิลด์ `costEnc`) คนทั่วไปเห็นแค่ข้อความที่อ่านไม่ออก — ต้องกรอกรหัสผ่านผู้บริหาร
เพื่อให้เบราว์เซอร์ถอดรหัสดูราคาทุน (รหัสผ่านไม่ถูกเก็บในโปรเจค)

### เปลี่ยน/ตั้งรหัสผ่านผู้บริหาร

```bash
# 1) ต้องมีราคาทุนแบบ plaintext ใน public/wynns.json ก่อน (generate จาก Excel)
# 2) เข้ารหัสด้วยรหัสผ่านใหม่:
COST_PASSPHRASE='รหัสผ่านลับใหม่' node scripts/encrypt-cost.mjs
# 3) commit + push — เว็บจะ deploy ใหม่อัตโนมัติ
```

> ทุกครั้งที่ generate ข้อมูลใหม่จาก Excel ต้องรัน `encrypt-cost.mjs` ซ้ำ
> เพื่อเข้ารหัสราคาทุนก่อน push (ไม่งั้นราคาทุนจะเป็น plaintext ที่ทุกคนเห็น)

## ฟีเจอร์ AI (Typhoon) — optional

เผื่อไว้ที่ `src/lib/ai/typhoon.ts` สำหรับต่อยอด เช่น ค้นหาแบบภาษาธรรมชาติ
หรือผู้ช่วยตอบคำถามภาษาไทย (ต้องมีเซิร์ฟเวอร์/serverless — ดู `.env.example`)
