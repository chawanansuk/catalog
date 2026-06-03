# 🛍️ Catalog

เว็บแอปแคตตาล็อกสินค้า สร้างด้วย **Next.js 16 (App Router) + TypeScript + Tailwind CSS**
พร้อมเลเยอร์ AI แบบ optional ที่เชื่อมต่อ **Typhoon** (Thai LLM โดย SCB 10X) ไว้รองรับ

## ฟีเจอร์

- 📦 หน้ารายการสินค้าแบบ grid
- 🔍 ค้นหาสินค้า (ชื่อ / คำอธิบาย / แท็ก)
- 🏷️ กรองตามหมวดหมู่
- 📄 หน้ารายละเอียดสินค้า (pre-render เป็น static)
- 🇹🇭 รองรับภาษาไทยเต็มรูปแบบ
- 🤖 เลเยอร์ AI เผื่อ Typhoon (เปิดใช้เมื่อพร้อม — ดูด้านล่าง)

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
| `npm run build` | build สำหรับ production |
| `npm run start` | รัน production server |
| `npm run lint` | ตรวจโค้ดด้วย ESLint |

## โครงสร้างโปรเจค

```
src/
├── app/
│   ├── layout.tsx              # layout หลัก (header/footer)
│   ├── page.tsx                # หน้าแรก — รายการสินค้า
│   ├── globals.css             # Tailwind + base styles
│   └── products/[id]/page.tsx  # หน้ารายละเอียดสินค้า
├── components/
│   ├── CatalogBrowser.tsx      # ค้นหา + กรองหมวดหมู่ (client)
│   └── ProductCard.tsx         # การ์ดสินค้า
├── data/
│   └── products.ts             # ข้อมูลสินค้าตัวอย่าง + ชนิดข้อมูล
└── lib/
    ├── format.ts               # ฟอร์แมตราคา (บาท)
    └── ai/typhoon.ts           # เลเยอร์เชื่อมต่อ Typhoon (optional)
```

## เปิดใช้งานฟีเจอร์ AI (Typhoon)

ฟีเจอร์ AI เป็น optional — แอปรันได้ปกติแม้ไม่ตั้งค่า เมื่อพร้อมใช้:

1. สมัครและรับ API key ที่ [playground.opentyphoon.ai](https://playground.opentyphoon.ai/)
2. คัดลอกไฟล์ตั้งค่า:
   ```bash
   cp .env.example .env.local
   ```
3. ใส่ค่า `TYPHOON_API_KEY` ใน `.env.local`

ฟังก์ชันพร้อมใช้ใน `src/lib/ai/typhoon.ts` เช่น `generateProductDescription()`
สำหรับสร้างคำอธิบายสินค้าภาษาไทยอัตโนมัติ

## แนวทางพัฒนาต่อ

- เชื่อมต่อฐานข้อมูลจริง (แทน `src/data/products.ts`)
- เพิ่มตะกร้าสินค้า / ระบบสั่งซื้อ
- เพิ่มฟีเจอร์ AI: ค้นหาแบบภาษาธรรมชาติ, แชตบอตผู้ช่วยช้อปปิ้ง
- เพิ่มระบบ auth สำหรับผู้ดูแล
