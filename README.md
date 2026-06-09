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

## อัปเดตข้อมูลราคา

ข้อมูลทั้งหมดอยู่ใน `public/wynns.json` — ถ้ามีไฟล์ราคา (Excel) ใหม่
สามารถ generate ไฟล์นี้ใหม่แล้ว commit ทับได้เลย

## ฟีเจอร์ AI (Typhoon) — optional

เผื่อไว้ที่ `src/lib/ai/typhoon.ts` สำหรับต่อยอด เช่น ค้นหาแบบภาษาธรรมชาติ
หรือผู้ช่วยตอบคำถามภาษาไทย (ต้องมีเซิร์ฟเวอร์/serverless — ดู `.env.example`)
