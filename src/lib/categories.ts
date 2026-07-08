/**
 * จัดหมวดหมู่สินค้าอัตโนมัติจากชื่อ (คีย์เวิร์ดเรียงตามลำดับความสำคัญ — เจอคำแรกชนะ)
 */
export type Category = {
  key: string;
  label: string;
  icon: string;
  keywords: string[];
};

export const CATEGORIES: Category[] = [
  { key: "pliers", label: "คีม", icon: "🔧", keywords: ["คีม"] },
  {
    key: "screwdriver",
    label: "ไขควง",
    icon: "🪛",
    keywords: ["ไขควง", "หกเหลี่ยม"],
  },
  {
    key: "wrench",
    label: "ประแจ/บล็อก",
    icon: "⚙️",
    keywords: ["ประแจ", "บล็อก", "ด้ามฟรี", "ข้อต่อ", "ลูกบ๊อก"],
  },
  {
    key: "saw",
    label: "เลื่อย/ใบตัด",
    icon: "🪚",
    keywords: [
      "เลื่อย",
      "ใบตัด",
      "ใบเจียร",
      "ใบเพชร",
      "เครื่องตัด",
      "ตัดท่อ",
      "ตัดกระเบื้อง",
      "โฮลซอว์",
    ],
  },
  {
    key: "hammer",
    label: "ค้อน/สกัด",
    icon: "🔨",
    keywords: ["ค้อน", "สกัด", "สิ่ว", "ชะแลง"],
  },
  {
    key: "drill",
    label: "สว่าน/ดอกเจาะ",
    icon: "🕳️",
    keywords: ["สว่าน", "ดอกเจาะ", "ดอกไข", "ดอกคว้าน", "เจาะ"],
  },
  {
    key: "cutter",
    label: "กรรไกร/มีด",
    icon: "✂️",
    keywords: ["กรรไกร", "มีด", "คัตเตอร์", "กิ่งไม้"],
  },
  {
    key: "measure",
    label: "เครื่องมือวัด",
    icon: "📏",
    keywords: [
      "ตลับเมตร",
      "ระดับน้ำ",
      "เวอร์เนีย",
      "ไมโครมิเตอร์",
      "ฉาก",
      "วัด",
    ],
  },
  {
    key: "electric",
    label: "ไฟฟ้า/มิเตอร์",
    icon: "⚡",
    keywords: [
      "มิเตอร์",
      "หัวแร้ง",
      "บัดกรี",
      "ไฟฉาย",
      "ถ่าน",
      "ย้ำสาย",
      "ปอกสาย",
      "เคเบิล",
      "สายไฟ",
      "เทสเตอร์",
      "โทรศัพท์",
    ],
  },
  { key: "lock", label: "กุญแจ", icon: "🔒", keywords: ["กุญแจ"] },
  {
    key: "glue",
    label: "ปืนกาว/ยาแนว",
    icon: "🧴",
    keywords: ["ปืนยิง", "กาว", "ยาแนว", "ซิลิโคน"],
  },
  {
    key: "grease",
    label: "จาระบี/หล่อลื่น",
    icon: "🛢️",
    keywords: ["จาระบี", "อัดฉีด", "น้ำมัน"],
  },
  {
    key: "paint",
    label: "งานสี/แปรง",
    icon: "🖌️",
    keywords: ["แปรง", "ลูกกลิ้ง", "เกรียง"],
  },
  { key: "other", label: "อื่นๆ", icon: "🧰", keywords: [] },
];

export function categorize(name: string): string {
  for (const c of CATEGORIES) {
    if (c.keywords.some((k) => name.includes(k))) return c.key;
  }
  return "other";
}
