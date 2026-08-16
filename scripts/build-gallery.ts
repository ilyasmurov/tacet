// Gallery of the set: one self-contained page with every glyph.
// Data and engine are inlined, so the file opens as it is.

import { writeFileSync } from "node:fs";
import { ICONS, META } from "../packages/core/dist/index.js";
import { INSTRUMENT_NAMES, SERVICE_NAMES } from "./groups.ts";

const names = Object.keys(ICONS);
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

<script>
const ICONS = ${JSON.stringify(ICONS)};
const META = ${JSON.stringify(META)};
const GROUPS = ${JSON.stringify(groups)};
const STROKE_AT_24 = 1.5, EXP = 0.45;
let size = 24, variant = "D", query = "";

function insetFor(s){ if(s<=12) return 0.9; if(s<=16) return 0.9+((s-12)/4)*0.5; if(s<=20) return 1.4+((s-16)/4)*0.4; return 1.8; }
function onScreen(s){ return STROKE_AT_24*Math.pow(s/24,EXP); }
function dashFor(gaps){ const g=[...gaps].sort((a,b)=>a[0]-b[0]); const out=[]; let pos=0;
  for(const [s,w] of g){ out.push(Math.max(s-pos,0.01),w); pos=s+w; } out.push(Math.max(100-pos,0.01)); return out.join(" "); }

const NS="http://www.w3.org/2000/svg";
function draw(name,s,v){
  const def=ICONS[name]||[], inset=insetFor(s), visible=24-2*inset, sc=onScreen(s), sw=sc*visible/s;
  const svg=document.createElementNS(NS,"svg");
  svg.setAttribute("viewBox",inset+" "+inset+" "+visible+" "+visible);
  svg.setAttribute("width",s); svg.setAttribute("height",s); svg.setAttribute("fill","none");
  const holes=def.filter(p=>p&&p.t==="hole");
  let maskId=null;
  if(holes.length){
    maskId="m-"+name;
    const mask=document.createElementNS(NS,"mask");
    mask.setAttribute("id",maskId); mask.setAttribute("maskUnits","userSpaceOnUse");
    mask.setAttribute("x","0"); mask.setAttribute("y","0"); mask.setAttribute("width","24"); mask.setAttribute("height","24");
    const bg=document.createElementNS(NS,"rect");
    bg.setAttribute("x","0"); bg.setAttribute("y","0"); bg.setAttribute("width","24"); bg.setAttribute("height","24"); bg.setAttribute("fill","#fff");
    mask.appendChild(bg);
    for(const h of holes){
      let el;
      if(h.d){ el=document.createElementNS(NS,"path"); el.setAttribute("d",h.d); el.setAttribute("fill","none");
               el.setAttribute("stroke","#000"); el.setAttribute("stroke-width",String(h.sw??2.2));
               el.setAttribute("stroke-linecap","round"); el.setAttribute("stroke-linejoin","round"); }
      else { el=document.createElementNS(NS,"circle"); el.setAttribute("cx",h.cx); el.setAttribute("cy",h.cy); el.setAttribute("r",h.r); el.setAttribute("fill","#000"); }
      mask.appendChild(el);
    }
    svg.appendChild(mask);
  }
  for(const part of def){
    if(!part||part.t==="hole") continue;
    const accentOn=(v==="C"||v==="D")&&part.accent;
    const color=part.col?part.col:(accentOn?"var(--tacet-accent)":"currentColor");
    let el;
    if(part.t==="circle"){ el=document.createElementNS(NS,"circle"); el.setAttribute("cx",part.cx); el.setAttribute("cy",part.cy); el.setAttribute("r",part.r); }
    else if(part.t==="rect"){ el=document.createElementNS(NS,"rect"); el.setAttribute("x",part.x); el.setAttribute("y",part.y);
                              el.setAttribute("width",part.w); el.setAttribute("height",part.h); el.setAttribute("rx",part.rx); }
    else { el=document.createElementNS(NS,"path"); el.setAttribute("d",part.d); }
    let nonScaling=false;
    if(part.tf){ el.setAttribute("transform",part.tf); if(!part.scaleStroke){ el.setAttribute("vector-effect","non-scaling-stroke"); nonScaling=true; } }
    if(part.masked&&maskId) el.setAttribute("mask","url(#"+maskId+")");
    if(part.fill||part.activeFill){ el.setAttribute("fill",color); }
    else {
      let dash="100 0";
      if(part.dashArray) dash=part.dashArray;
      else if(part.gaps&&part.gaps.length) dash=dashFor(v==="B"||v==="D"?part.gaps:part.gaps.slice(0,1));
      el.setAttribute("fill","none"); el.setAttribute("stroke",color);
      el.setAttribute("stroke-width",nonScaling?sc:sw);
      el.setAttribute("stroke-linecap","round"); el.setAttribute("stroke-linejoin","round");
      el.setAttribute("pathLength","100"); el.setAttribute("stroke-dasharray",dash);
    }
    svg.appendChild(el);
  }
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
