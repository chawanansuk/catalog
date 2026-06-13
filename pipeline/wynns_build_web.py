#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
wynns_build_web.py — สร้างเว็บแคตตาล็อก (ไฟล์ HTML เดียว ฝังรูป) จาก out/catalog.json
ผลลัพธ์: out/wynns_catalog.html
ตัวเลือก:  --lion path/to/lion.png   (โลโก้ส่วนหัว, ไม่ใส่ก็ได้)
"""
import json, base64, os, argparse

ap = argparse.ArgumentParser(); ap.add_argument("--lion", default="")
ap.add_argument("--rate", type=float, default=5.0, help="อัตราแปลงหยวน->บาท (โดยประมาณ)")
args = ap.parse_args()

OUTDIR = "out"
data = json.load(open(f"{OUTDIR}/catalog.json", encoding="utf-8"))

def b64(p): return base64.b64encode(open(p, "rb").read()).decode()
for p in data["products"]:
    fp = f"{OUTDIR}/images/{p.get('code','')}.jpg"
    p["img"] = "data:image/jpeg;base64," + b64(fp) if os.path.exists(fp) else ""

lion = ("data:image/png;base64," + b64(args.lion)) if args.lion and os.path.exists(args.lion) else ""
PRODUCTS = json.dumps(data["products"], ensure_ascii=False)
SECTIONS = json.dumps(data.get("sections", []), ensure_ascii=False)

# CSS ฝังในตัว (self-contained ไม่ต้องพึ่งไฟล์ภายนอก)
CSS = r"""
:root{--green:#0B4A2F;--green-deep:#08351F;--ink:#13241C;--gold:#E8920C;--gold-soft:#F3B23E;
--paper:#EEF1EC;--card:#FFF;--line:#D7DCD1;--muted:#6B7A6F;--shadow:0 1px 2px rgba(16,38,28,.06),0 8px 24px rgba(16,38,28,.07);}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--paper);color:var(--ink);font-family:"Sarabun",system-ui,sans-serif;font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased}
.wrap{max-width:1180px;margin:0 auto;padding:0 20px}
header{background:linear-gradient(135deg,var(--green),var(--green-deep));color:#fff}
.topbar{display:flex;align-items:center;gap:18px;padding:20px 0 16px}
.topbar img{height:62px;border-radius:8px}
.brand h1{font-family:"Kanit";font-weight:700;font-size:30px;letter-spacing:.04em;margin:0;line-height:1}
.brand .zh{color:var(--gold-soft);font-weight:600}.brand p{margin:4px 0 0;color:#cfe0d4;font-size:13.5px}
.hero-meta{margin-left:auto;text-align:right;font-family:"IBM Plex Mono";font-size:12px;color:#a9c4b2;line-height:1.7}
.hero-meta b{color:var(--gold-soft);font-size:15px}
.sectabs{display:flex;gap:0;border-top:1px solid rgba(255,255,255,.12)}
.sectabs button{flex:0 0 auto;border:0;background:transparent;color:#bcd2c2;font-family:"Kanit";font-weight:600;
font-size:15px;padding:13px 22px;cursor:pointer;border-bottom:3px solid transparent}
.sectabs button.on{color:#fff;border-bottom-color:var(--gold)}
.controls{position:sticky;top:0;z-index:20;background:rgba(238,241,236,.92);backdrop-filter:blur(8px);border-bottom:1px solid var(--line);padding:14px 0}
.searchrow{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.search{flex:1;min-width:220px;position:relative}
.search input{width:100%;padding:11px 14px 11px 38px;border:1.5px solid var(--line);border-radius:10px;background:#fff;font-family:"Sarabun";font-size:15px;color:var(--ink)}
.search input:focus{outline:none;border-color:var(--green)}
.search svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);opacity:.5}
.toggle{display:flex;border:1.5px solid var(--line);border-radius:10px;overflow:hidden;background:#fff}
.toggle button{border:0;background:#fff;padding:10px 14px;font-family:"IBM Plex Mono";font-size:12.5px;font-weight:600;cursor:pointer;color:var(--muted)}
.toggle button.on{background:var(--green);color:#fff}
.chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.chip{border:1.5px solid var(--line);background:#fff;border-radius:999px;padding:6px 15px;font-size:13.5px;font-weight:500;cursor:pointer;color:var(--ink);white-space:nowrap}
.chip:hover{border-color:var(--green)}.chip.on{background:var(--green);color:#fff;border-color:var(--green)}
.chip .n{font-family:"IBM Plex Mono";opacity:.6;font-size:11.5px;margin-left:4px}.chip.on .n{opacity:.85}
.count{font-family:"IBM Plex Mono";font-size:12px;color:var(--muted);letter-spacing:.04em;margin:18px 0 10px;text-transform:uppercase}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:18px;padding-bottom:60px}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden;display:flex;flex-direction:column;box-shadow:var(--shadow);transition:transform .15s,box-shadow .15s}
.card:hover{transform:translateY(-3px);box-shadow:0 2px 4px rgba(16,38,28,.08),0 16px 38px rgba(16,38,28,.12)}
.photo{background:#fff;height:150px;display:flex;align-items:center;justify-content:center;border-bottom:1px solid var(--line);padding:10px;position:relative}
.photo img{max-height:100%;max-width:100%;object-fit:contain}
.ph-tile{background:repeating-linear-gradient(135deg,#0B4A2F,#0B4A2F 14px,#0d5436 14px,#0d5436 28px);
width:100%;height:100%;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#cfe0d4;gap:6px}
.ph-tile .c{font-family:"IBM Plex Mono";font-weight:600;font-size:20px;color:#fff;letter-spacing:.05em}
.ph-tile .t{font-size:11.5px;color:var(--gold-soft);font-family:"IBM Plex Mono"}
.badges{position:absolute;top:9px;right:9px;display:flex;gap:5px;flex-direction:column;align-items:flex-end}
.badge{font-family:"IBM Plex Mono";font-size:10px;font-weight:600;padding:2px 7px;border-radius:5px;color:#fff;background:var(--green)}
.badge.new{background:var(--gold)}.badge.steel{background:#3a6b4f}
.body{padding:14px 15px 16px;display:flex;flex-direction:column;gap:9px;flex:1}
.code{font-family:"IBM Plex Mono";font-weight:600;font-size:12px;color:var(--gold);letter-spacing:.06em}
.name{font-family:"Kanit";font-weight:600;font-size:17px;line-height:1.25;margin:0}
.feat{list-style:none;margin:2px 0 0;padding:0;display:flex;flex-direction:column;gap:3px}
.feat li{font-size:12.5px;color:#42514a;padding-left:14px;position:relative;line-height:1.45}
.feat li::before{content:"";position:absolute;left:0;top:6px;width:6px;height:6px;background:var(--gold);border-radius:1px}
.vars{display:flex;flex-wrap:wrap;gap:5px}
.var{font-family:"IBM Plex Mono";font-size:10.5px;background:#eef3ee;border:1px solid var(--line);border-radius:6px;padding:2px 7px;color:#2c3b32}
.spec{margin-top:auto;display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--line);border:1px solid var(--line);border-radius:8px;overflow:hidden}
.spec div{background:#fff;padding:6px 9px}
.spec .k{font-family:"IBM Plex Mono";font-size:9.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}
.spec .v{font-size:13px;font-weight:500}
.price{display:flex;align-items:baseline;justify-content:space-between;border-top:1px solid var(--line);padding-top:11px;margin-top:3px}
.price .rmb{font-family:"Kanit";font-weight:700;font-size:21px;color:var(--green)}.price .rmb span{font-size:13px;font-weight:500;color:var(--muted)}
.price .thb{font-family:"IBM Plex Mono";font-size:12.5px;color:var(--muted)}
.empty{text-align:center;padding:60px 20px;color:var(--muted)}
footer{border-top:1px solid var(--line);padding:22px 0 40px;color:var(--muted);font-size:12.5px;text-align:center}footer b{color:var(--green)}
@media(max-width:560px){.topbar img{height:48px}.brand h1{font-size:22px}.hero-meta{display:none}.grid{grid-template-columns:1fr}.sectabs button{padding:11px 16px;font-size:14px}}
"""

HTML = """<!doctype html><html lang="th"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>WYNNS · แคตตาล็อกเครื่องมือ 2026</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Kanit:wght@500;600;700&family=Sarabun:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet">
<style>__CSS__</style></head><body>
<header><div class="wrap topbar">__LIONIMG__<div class="brand"><h1>WYNNS <span class="zh">威力狮</span></h1>
<p>แคตตาล็อกเครื่องมือ 2026 · เวอร์ชันไทย</p></div>
<div class="hero-meta"><b id="total">0</b> รุ่น</div></div>
<div class="wrap"><div class="sectabs" id="sectabs"></div></div></header>
<div class="controls"><div class="wrap">
<div class="searchrow"><div class="search">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
<input id="q" placeholder="ค้นหา รหัส / ชื่อ / คุณสมบัติ…"></div>
<div class="toggle"><button id="t-rmb" class="on" onclick="setCur('rmb')">¥ หยวน</button><button id="t-thb" onclick="setCur('thb')">≈ บาท</button></div></div>
<div class="chips" id="chips"></div></div></div>
<main class="wrap"><div class="count" id="count"></div><div class="grid" id="grid"></div></main>
<footer class="wrap">แปลจาก <b>WYNNS Product Manual 2026</b> · ราคาต้นฉบับเงินหยวน (RMB) · ราคาบาทเป็นค่าประมาณ · เกรดเหล็ก/HRC คงมาตรฐานสากล</footer>
<script>
const PRODUCTS=__PRODUCTS__, SECTIONS=(__SECTIONS__.length?__SECTIONS__:[...new Set(PRODUCTS.map(p=>p.section||'ทั้งหมด'))]), RATE=__RATE__;
let cur='rmb', activeSec=SECTIONS[0], activeCat='ทั้งหมด', query='';
document.getElementById('total').textContent=PRODUCTS.length;
const secList=()=>PRODUCTS.filter(p=>(p.section||SECTIONS[0])===activeSec);
function buildSecTabs(){document.getElementById('sectabs').innerHTML=SECTIONS.map(s=>{const n=PRODUCTS.filter(p=>(p.section||SECTIONS[0])===s).length;
 return `<button class="${s===activeSec?'on':''}" onclick="setSec('${s}')">${s} <span style="opacity:.6;font-family:'IBM Plex Mono';font-size:12px">${n}</span></button>`}).join('');}
function buildChips(){const L=secList();const c={};L.forEach(p=>c[p.cat_th]=(c[p.cat_th]||0)+1);
 const cats=['ทั้งหมด',...new Set(L.map(p=>p.cat_th))];
 document.getElementById('chips').innerHTML=cats.map(x=>{const n=x==='ทั้งหมด'?L.length:c[x];
 return `<button class="chip ${x===activeCat?'on':''}" onclick="setCat('${x}')">${x}<span class="n">${n}</span></button>`}).join('');}
function setSec(s){activeSec=s;activeCat='ทั้งหมด';buildSecTabs();buildChips();render();}
function setCat(x){activeCat=x;buildChips();render();}
function setCur(x){cur=x;document.getElementById('t-rmb').classList.toggle('on',x==='rmb');document.getElementById('t-thb').classList.toggle('on',x==='thb');render();}
document.getElementById('q').addEventListener('input',e=>{query=e.target.value.trim().toLowerCase();render();});
const badge=t=>`<span class="badge ${t==='NEW'?'new':(t==='STANLESS'?'steel':'')}">${t==='STANLESS'?'STAINLESS':t}</span>`;
function price(p){const thb=Math.round((p.price_rmb||0)*RATE);return cur==='rmb'
 ?`<span class="rmb">${p.price_rmb?('¥'+p.price_rmb.toFixed(2)):'-'}</span><span class="thb">${p.price_rmb?('≈ ฿'+thb):''}</span>`
 :`<span class="rmb">${p.price_rmb?('฿'+thb):'-'}</span><span class="thb">${p.price_rmb?('¥'+p.price_rmb.toFixed(2)):''}</span>`}
function card(p){const mat=(p.material_th||'')+(p.hardness?` · ${p.hardness}`:'');
 const photo=p.img?`<img src="${p.img}">`:`<div class="ph-tile"><div class="c">${p.code||''}</div><div class="t">${(p.name_en||'').split(' ').slice(0,3).join(' ')}</div></div>`;
 const vars=(p.variants&&p.variants.length)?`<div class="vars">${p.variants.map(v=>`<span class="var">${v}</span>`).join('')}</div>`:'';
 return `<article class="card"><div class="photo">${photo}<div class="badges">${(p.tags||[]).map(badge).join('')}</div></div>
 <div class="body"><div class="code">${p.code||''} · ${p.name_en||''}</div><h3 class="name">${p.name_th||''}</h3>
 <ul class="feat">${(p.features_th||[]).map(f=>`<li>${f}</li>`).join('')}</ul>${vars}
 <div class="spec"><div><div class="k">ขนาด</div><div class="v">${p.size||'-'}</div></div>
 <div><div class="k">วัสดุ</div><div class="v">${mat||'-'}</div></div>
 <div><div class="k">บรรจุ</div><div class="v">${p.pack||'-'}</div></div>
 <div><div class="k">น้ำหนัก</div><div class="v">${p.weight||p.meas||'-'}</div></div></div>
 <div class="price">${price(p)}</div></div></article>`}
function render(){let L=secList().filter(p=>activeCat==='ทั้งหมด'||p.cat_th===activeCat);
 if(query)L=L.filter(p=>((p.code||'')+' '+(p.name_th||'')+' '+(p.name_en||'')+' '+(p.cat_th||'')+' '+(p.material_th||'')+' '+(p.features_th||[]).join(' ')+' '+(p.variants||[]).join(' ')).toLowerCase().includes(query));
 document.getElementById('count').textContent=`${activeSec} · แสดง ${L.length} รุ่น`;
 document.getElementById('grid').innerHTML=L.length?L.map(card).join(''):`<div class="empty" style="grid-column:1/-1">ไม่พบ “${query}”</div>`;}
buildSecTabs();buildChips();render();
</script></body></html>"""

lion_img = f'<img src="{lion}" alt="WYNNS">' if lion else ""
HTML = (HTML.replace("__CSS__", CSS).replace("__LIONIMG__", lion_img)
            .replace("__PRODUCTS__", PRODUCTS).replace("__SECTIONS__", SECTIONS)
            .replace("__RATE__", str(args.rate)))
open(f"{OUTDIR}/wynns_catalog.html", "w", encoding="utf-8").write(HTML)
print(f"สร้างเว็บ -> {OUTDIR}/wynns_catalog.html  ({round(len(HTML)/1024,1)} KB)")
