// Gallery of the set: one self-contained page with every glyph.
// Data and engine are inlined, so the file opens as it is.

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { ICONS } from "../packages/core/dist/index.js";
import { INSTRUMENT_NAMES, SERVICE_NAMES } from "./groups.ts";

const names = Object.keys(ICONS);

// The built engine, module by module, for the page to load.
const coreDir = new URL("../packages/core/dist/", import.meta.url);
const CORE = Object.fromEntries(
  readdirSync(coreDir).filter((file) => file.endsWith(".js")).map((file) => [file, readFileSync(new URL(file, coreDir), "utf8")]),
);
const instruments = new Set(INSTRUMENT_NAMES);
const services = new Set(SERVICE_NAMES);

const groups = [
  { id: "ui", title: "Interface", names: names.filter((n) => !instruments.has(n) && !services.has(n)) },
  { id: "instruments", title: "Instruments and roles", names: names.filter((n) => instruments.has(n)) },
  { id: "services", title: "Creators and services", names: names.filter((n) => services.has(n)) },
];

const html = `<title>Tacet — icon set</title>
<style>
  :root {
    --bg:#fbfaf8; --panel:#f3f0ec; --hover:#ece8e2; --ink:#1c1a17;
    --dim:#6f6a62; --faint:#a8a29a; --tacet-accent:#3f7bf0;
  }
  :root[data-theme="dark"] {
    --bg:#16151a; --panel:#1f1e25; --hover:#292731; --ink:#eceaf2;
    --dim:#9a95a5; --faint:#5d5869; --tacet-accent:#6f9bff;
  }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
    --bg:#16151a; --panel:#1f1e25; --hover:#292731; --ink:#eceaf2;
    --dim:#9a95a5; --faint:#5d5869; --tacet-accent:#6f9bff; } }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--ink);
         font:15px/1.5 ui-sans-serif,-apple-system,"Segoe UI",system-ui,sans-serif;
         -webkit-font-smoothing:antialiased; }
  .wrap { max-width:1160px; margin:0 auto; padding:52px 24px 120px; }
  h1 { font-size:34px; font-weight:620; letter-spacing:-0.025em; margin:0 0 10px; }
  .lede { color:var(--dim); max-width:60ch; margin:0 0 32px; }
  .lede b { color:var(--ink); font-weight:560; }
  .bar { position:sticky; top:0; z-index:5; background:var(--bg); padding:12px 0 14px; margin-bottom:8px;
         display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
  input { font:inherit; font-size:14px; color:var(--ink); background:var(--panel);
          border:0; border-radius:11px; padding:9px 14px; width:230px; outline:none; }
  input::placeholder { color:var(--faint); }
  input:focus { background:var(--hover); }
  .chips { display:flex; gap:3px; background:var(--panel); border-radius:11px; padding:3px; }
  button { font:inherit; font-size:13px; color:var(--dim); background:transparent; border:0;
           border-radius:9px; padding:6px 11px; cursor:pointer; }
  button:hover { color:var(--ink); }
  button[aria-pressed="true"] { color:var(--ink); background:var(--bg); font-weight:560; }
  .count { margin-left:auto; font-size:13px; color:var(--faint); font-variant-numeric:tabular-nums; }
  h2 { font-size:13px; font-weight:600; letter-spacing:0.09em; text-transform:uppercase;
       color:var(--faint); margin:40px 0 14px; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(108px,1fr)); gap:6px; }
  .cell { background:transparent; border-radius:13px; padding:18px 8px 11px; text-align:center;
          cursor:pointer; transition:background .12s ease; }
  .cell:hover { background:var(--panel); }
  .cell:active { background:var(--hover); }
  .cell svg { color:var(--ink); overflow:visible; }
  .cell figcaption { margin-top:11px; font:11px ui-monospace,SFMono-Regular,Menlo,monospace;
                     color:var(--faint); word-break:break-all; line-height:1.35; }
  .cell.copied figcaption { color:var(--tacet-accent); }
  .empty { color:var(--dim); padding:40px 0; }
  .toast { position:fixed; left:50%; bottom:28px; transform:translateX(-50%) translateY(20px);
           background:var(--ink); color:var(--bg); font-size:13.5px; padding:9px 16px;
           border-radius:11px; opacity:0; transition:all .18s ease; pointer-events:none; }
  .toast.on { opacity:1; transform:translateX(-50%) translateY(0); }
  @media (max-width:640px) { .wrap { padding:32px 16px 90px; } h1 { font-size:27px; } input { width:100%; } }
</style>

<div class="wrap">
  <h1>Tacet</h1>
  <p class="lede">Outline with cuts: <b>${names.length} glyphs</b> where the break in the contour is data rather than
  something carved into the geometry. Hence the draw-in animation, four cut densities and the accent detail — from one source.</p>

  <div class="bar">
    <input id="q" placeholder="Search: delete, success, bayan" autocomplete="off">
    <span class="chips" id="sizes"></span>
    <span class="chips" id="variants"></span>
    <span class="chips"><button id="theme">Dark</button></span>
    <span class="count" id="count"></span>
  </div>

  <div id="out"></div>
</div>
<div class="toast" id="toast"></div>

<script type="module">
// The engine itself draws the glyphs (TACET-62). The built modules of
// tacet-core ride inside the page and load from blob URLs, so the file still
// opens as it is and shows exactly what the packages draw: accent spans, dots
// sized by the stroke, and whatever the engine learns next. A drawing of our
// own here fell behind the moment the engine grew.
const CORE = ${JSON.stringify(CORE).replace(/</g, "\\u003c")};
const urls = {};
function load(file){
  if(!urls[file]){
    // Every relative import and re-export: a line whose statement ends in from "./x.js".
    const src=CORE[file]
      .replace(/^([^\\n"]*\\sfrom\\s*)"\\.\\/([^"]+)"/gm,(m,head,dep)=>head+JSON.stringify(load(dep)))
      .replace(/^import\\s*"\\.\\/([^"]+)"/gm,(m,dep)=>"import "+JSON.stringify(load(dep)));
    urls[file]=URL.createObjectURL(new Blob([src],{type:"text/javascript"}));
  }
  return urls[file];
}
const core = await import(load("index.js"));
const META = core.META;
const GROUPS = ${JSON.stringify(groups)};
let size = 24, variant = "D", query = "", drawn = 0;

const NS="http://www.w3.org/2000/svg";
function node(spec){
  const el=document.createElementNS(NS,spec.tag);
  for(const [k,v] of Object.entries(spec.attrs)) el.setAttribute(k,String(v));
  return el;
}
function draw(name,s,v){
  // A suffix per drawing keeps mask ids apart when one glyph is on the page twice.
  const spec=core.renderSpec(name,{ size:s, variant:v, idSuffix:"g"+(drawn++) });
  const svg=document.createElementNS(NS,"svg");
  for(const [k,val] of Object.entries(spec.svgAttrs)) svg.setAttribute(k,String(val));
  if(spec.mask){
    const mask=document.createElementNS(NS,"mask");
    mask.setAttribute("id",spec.mask.id);
    for(const [k,val] of Object.entries(spec.mask.attrs)) mask.setAttribute(k,String(val));
    for(const child of spec.mask.children) mask.appendChild(node(child));
    svg.appendChild(mask);
  }
  for(const part of spec.parts) svg.appendChild(node(part));
  return svg;
}

const toast=document.getElementById("toast");
let toastTimer;
function say(text){
  toast.textContent=text; toast.classList.add("on");
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.remove("on"),1400);
}

function render(){
  const out=document.getElementById("out");
  out.textContent="";
  let shown=0;
  for(const group of GROUPS){
    // Search covers names and synonyms alike: "delete" finds trash, "success"
    // finds check-circle. Without it a set of 320 glyphs cannot be combed.
    const list=group.names.filter(n=>{
      if(n.includes(query)) return true;
      const meta=META[n];
      return meta ? meta.synonyms.some(s=>s.toLowerCase().includes(query)) : false;
    });
    if(!list.length) continue;
    shown+=list.length;
    const h=document.createElement("h2");
    h.textContent=group.title+" · "+list.length;
    out.appendChild(h);
    const grid=document.createElement("div");
    grid.className="grid";
    for(const name of list){
      const cell=document.createElement("figure");
      cell.className="cell"; cell.style.margin="0";
      const meta=META[name];
      if(meta) cell.title=meta.use+(meta.avoid?"\\n\\n"+meta.avoid:"");
      cell.appendChild(draw(name,size,variant));
      const cap=document.createElement("figcaption");
      cap.textContent=name;
      cell.appendChild(cap);
      cell.onclick=()=>{
        navigator.clipboard?.writeText('<Icon name="'+name+'" />');
        cell.classList.add("copied");
        setTimeout(()=>cell.classList.remove("copied"),700);
        say("Copied: "+name);
      };
      grid.appendChild(cell);
    }
    out.appendChild(grid);
  }
  if(!shown){
    const empty=document.createElement("p");
    empty.className="empty";
    empty.textContent="Nothing found. Try another word.";
    out.appendChild(empty);
  }
  document.getElementById("count").textContent=shown+" of "+${names.length};
}

function chips(id,values,current,onPick,label){
  const box=document.getElementById(id);
  box.textContent="";
  for(const v of values){
    const b=document.createElement("button");
    b.textContent=label?label(v):v;
    b.setAttribute("aria-pressed",String(v===current()));
    b.onclick=()=>{ onPick(v); chips(id,values,current,onPick,label); render(); };
    box.appendChild(b);
  }
}
chips("sizes",[16,24,32,48],()=>size,v=>size=v,v=>v+"px");
chips("variants",["A","B","C","D"],()=>variant,v=>variant=v);

document.getElementById("q").oninput=(e)=>{ query=e.target.value.trim().toLowerCase(); render(); };

const root=document.documentElement, themeBtn=document.getElementById("theme");
const isDark=()=>{ const s=root.getAttribute("data-theme"); return s?s==="dark":matchMedia("(prefers-color-scheme: dark)").matches; };
themeBtn.textContent=isDark()?"Light":"Dark";
themeBtn.onclick=()=>{ root.setAttribute("data-theme",isDark()?"light":"dark"); themeBtn.textContent=isDark()?"Light":"Dark"; };

render();
</script>
`;

const out = process.argv[2] ?? "gallery.html";
writeFileSync(out, html, "utf8");
console.log(`gallery: ${out} · glyphs ${names.length} · ${Math.round(html.length / 1024)} KB`);
