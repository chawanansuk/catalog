export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  /** URL หรือ emoji สำหรับแสดงแทนรูปสินค้า (ตอนนี้ใช้ emoji เพื่อความง่าย) */
  image: string;
  description: string;
  inStock: boolean;
  tags: string[];
};

export const products: Product[] = [
  {
    id: "p001",
    name: "หูฟังไร้สาย Aura Pro",
    category: "อิเล็กทรอนิกส์",
    price: 2990,
    image: "🎧",
    description:
      "หูฟังไร้สายตัดเสียงรบกวน แบตเตอรี่ใช้งานได้นาน 30 ชั่วโมง เสียงคมชัดทุกย่าน เหมาะกับการฟังเพลงและประชุมออนไลน์",
    inStock: true,
    tags: ["หูฟัง", "บลูทูธ", "ตัดเสียงรบกวน"],
  },
  {
    id: "p002",
    name: "กระเป๋าเป้ Urban Daypack",
    category: "แฟชั่น",
    price: 1490,
    image: "🎒",
    description:
      "กระเป๋าเป้ผ้ากันน้ำ ดีไซน์มินิมอล มีช่องใส่โน้ตบุ๊กขนาด 15 นิ้ว เหมาะสำหรับเดินทางและทำงาน",
    inStock: true,
    tags: ["กระเป๋า", "กันน้ำ", "โน้ตบุ๊ก"],
  },
  {
    id: "p003",
    name: "แก้วเก็บอุณหภูมิ ThermoCup 500ml",
    category: "ของใช้ในบ้าน",
    price: 590,
    image: "🥤",
    description:
      "แก้วสเตนเลสเก็บความเย็นได้ 24 ชั่วโมง เก็บความร้อนได้ 12 ชั่วโมง ฝาปิดสนิทไม่หกเลอะ",
    inStock: true,
    tags: ["แก้วน้ำ", "สเตนเลส", "เก็บอุณหภูมิ"],
  },
  {
    id: "p004",
    name: "คีย์บอร์ดเมคานิคอล KeyMaster TKL",
    category: "อิเล็กทรอนิกส์",
    price: 3290,
    image: "⌨️",
    description:
      "คีย์บอร์ดเมคานิคอลแบบ TKL สวิตช์ hot-swap ไฟ RGB ปรับแต่งได้ สัมผัสนุ่มพิมพ์ลื่น เหมาะกับเกมเมอร์และสายทำงาน",
    inStock: false,
    tags: ["คีย์บอร์ด", "เมคานิคอล", "RGB"],
  },
  {
    id: "p005",
    name: "เสื่อโยคะ ZenMat 6mm",
    category: "กีฬา",
    price: 790,
    image: "🧘",
    description:
      "เสื่อโยคะหนา 6 มม. กันลื่นทั้งสองด้าน วัสดุ TPE เป็นมิตรกับสิ่งแวดล้อม น้ำหนักเบาพกพาสะดวก",
    inStock: true,
    tags: ["โยคะ", "ออกกำลังกาย", "กันลื่น"],
  },
  {
    id: "p006",
    name: "โคมไฟตั้งโต๊ะ LumiDesk",
    category: "ของใช้ในบ้าน",
    price: 1190,
    image: "💡",
    description:
      "โคมไฟ LED ปรับความสว่างได้ 3 ระดับ ถนอมสายตา มีพอร์ต USB ชาร์จมือถือในตัว ดีไซน์โมเดิร์น",
    inStock: true,
    tags: ["โคมไฟ", "LED", "ถนอมสายตา"],
  },
  {
    id: "p007",
    name: "รองเท้าวิ่ง SwiftRun",
    category: "กีฬา",
    price: 2490,
    image: "👟",
    description:
      "รองเท้าวิ่งน้ำหนักเบา พื้นรองรับแรงกระแทกดีเยี่ยม ระบายอากาศได้ดี เหมาะกับการวิ่งระยะไกล",
    inStock: true,
    tags: ["รองเท้า", "วิ่ง", "น้ำหนักเบา"],
  },
  {
    id: "p008",
    name: "เซตเครื่องเขียน NoteKit",
    category: "เครื่องเขียน",
    price: 350,
    image: "✏️",
    description:
      "เซตเครื่องเขียนครบชุด สมุดโน้ต ปากกา และปากกาเน้นข้อความ ดีไซน์น่ารัก เหมาะเป็นของขวัญ",
    inStock: true,
    tags: ["เครื่องเขียน", "ของขวัญ", "สมุด"],
  },
];

export const categories: string[] = [
  ...new Set(products.map((p) => p.category)),
];

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}
