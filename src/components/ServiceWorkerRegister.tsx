"use client";

import { useEffect } from "react";

/** ลงทะเบียน service worker เพื่อให้ติดตั้งเป็นแอป (PWA) และใช้งาน offline ได้ */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    navigator.serviceWorker
      .register(`${base}/sw.js`, { scope: `${base}/` })
      .catch(() => {
        /* เงียบไว้ — ถ้าลงทะเบียนไม่ได้ เว็บก็ยังใช้งานได้ปกติ */
      });
  }, []);
  return null;
}
