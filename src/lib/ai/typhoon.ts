/**
 * เลเยอร์เชื่อมต่อ Typhoon (Thai LLM by SCB 10X) แบบบางๆ
 *
 * Typhoon ใช้ API ที่เข้ากันได้กับ OpenAI จึงเรียกผ่าน fetch ตรงๆ ได้เลย
 * โดยไม่ต้องติดตั้ง SDK เพิ่ม
 *
 * ฟีเจอร์ AI ทั้งหมดเป็น "optional" — ถ้ายังไม่ได้ตั้งค่า TYPHOON_API_KEY
 * แอปจะยังทำงานปกติ เพียงแต่ส่วน AI จะไม่ทำงาน (graceful degradation)
 *
 * วิธีเปิดใช้: คัดลอก .env.example เป็น .env.local แล้วใส่ค่า TYPHOON_API_KEY
 */

const BASE_URL =
  process.env.TYPHOON_BASE_URL ?? "https://api.opentyphoon.ai/v1";
const MODEL = process.env.TYPHOON_MODEL ?? "typhoon-v2.1-12b-instruct";

export function isTyphoonEnabled(): boolean {
  return Boolean(process.env.TYPHOON_API_KEY);
}

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/**
 * เรียก Typhoon chat completion (รูปแบบ OpenAI-compatible)
 * โยน error ถ้ายังไม่ได้ตั้งค่า key — ผู้เรียกควรเช็ค isTyphoonEnabled() ก่อน
 */
export async function typhoonChat(
  messages: ChatMessage[],
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const apiKey = process.env.TYPHOON_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ยังไม่ได้ตั้งค่า TYPHOON_API_KEY — ดูวิธีตั้งค่าได้ที่ .env.example"
    );
  }

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: options.temperature ?? 0.4,
      max_tokens: options.maxTokens ?? 512,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Typhoon API error (${res.status}): ${detail}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

/**
 * ตัวอย่างฟีเจอร์: สร้างคำอธิบายสินค้าภาษาไทยจากข้อมูลดิบ
 * เรียกใช้จาก server (เช่น API route หรือ server action) เท่านั้น
 */
export async function generateProductDescription(input: {
  name: string;
  category: string;
  tags: string[];
}): Promise<string> {
  return typhoonChat([
    {
      role: "system",
      content:
        "คุณเป็นนักเขียนคำโฆษณาสินค้ามืออาชีพ เขียนคำอธิบายสินค้าภาษาไทยที่กระชับ น่าสนใจ ความยาว 2-3 ประโยค",
    },
    {
      role: "user",
      content: `ชื่อสินค้า: ${input.name}\nหมวดหมู่: ${input.category}\nคุณสมบัติ: ${input.tags.join(", ")}`,
    },
  ]);
}
