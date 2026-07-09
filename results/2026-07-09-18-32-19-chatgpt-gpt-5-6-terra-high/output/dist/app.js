const $ = (s) => document.querySelector(s);
const canvas = $('#space'), ctx = canvas.getContext('2d', { alpha: false });
const ui = { date: $('#dateReadout'), count: $('#countReadout'), search: $('#search'), extent: $('#extent'), extentValue: $('#extentValue'), timeline: $('#timeline'), play: $('#playBtn'), speed: $('#speed'), toast: $('#toast'), selection: $('#selection'), comets: $('#cometsToggle'), orbits: $('#orbitsToggle') };
const DEG = Math.PI / 180, DAY = 86400000, J2000 = 2451545;
let W, H, dpr, planetData = [], asteroids = [], comets = [], sentry = new Map(), approaches = null;
let jd = Number(new URLSearchParams(location.search).get('t')) || 2461200, playing = false, speed = 60, lastFrame = performance.now();
let activeFilter = 'all', query = '', maxExtent = 6, includeComets = false, showOrbits = true, selected = null, focus = false;
let yaw = Number(new URLSearchParams(location.search).get('yaw')) || .52, pitch = .63, zoom = 1, dragging = false, previous = null, pointerStart = null, nearPoints = [], stars = [];

function jdToday() { return Date.now() / DAY + 2440587.5; }
function dateLabel(n) { return new Intl.DateTimeFormat('en-US', { year:'numeric', month:'short', day:'2-digit', hour:'2-digit', minute:'2-digit', timeZone:'UTC' }).format(new Date((n - 2440587.5) * DAY)).toUpperCase() + ' UTC'; }
function orbitPosition(o, when) {
  const a = +o.a, e = +o.e;
  if (!Number.isFinite(a) || !Number.isFinite(e)) return null;
  const om = (+o.om || 0) * DEG, w = (+o.w || 0) * DEG, inc = (+o.i || 0) * DEG;
  let x, y;
  if (e < 1) {
    const n = (+o.n || (a > 0 ? .9856076686 / Math.pow(a, 1.5) : 0)) * DEG;
    let M = ((+o.ma || 0) * DEG + n * (when - (+o.epoch || J2000))) % (Math.PI * 2);
    if (M < -Math.PI) M += Math.PI * 2;
    let E = M;
    for (let k = 0; k < 7; k++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    x = a * (Math.cos(E) - e); y = a * Math.sqrt(1 - e * e) * Math.sin(E);
  } else if (e > 1 && o.tp != null) {
    const aa = Math.abs(a), n = .9856076686 / Math.pow(aa, 1.5) * DEG;
    const M = n * (when - o.tp);
    let F = Math.asinh(M / Math.max(e, 1.01));
    for (let k = 0; k < 8; k++) F -= (e * Math.sinh(F) - F - M) / (e * Math.cosh(F) - 1);
    x = aa * (e - Math.cosh(F)); y = aa * Math.sqrt(e * e - 1) * Math.sinh(F);
  } else return null;
  const cw = Math.cos(w), sw = Math.sin(w), co = Math.cos(om), so = Math.sin(om), ci = Math.cos(inc), si = Math.sin(inc);
  const X = (co*cw - so*sw*ci)*x + (-co*sw - so*cw*ci)*y;
  const Y = (so*cw + co*sw*ci)*x + (-so*sw + co*cw*ci)*y;
  return { x:X, y:Y, z:(sw*si)*x + (cw*si)*y };
}
function project(p, target = null) {
  let x = p.x - (target?.x || 0), y = p.y - (target?.y || 0), z = p.z - (target?.z || 0);
  const cy=Math.cos(yaw), sy=Math.sin(yaw), cp=Math.cos(pitch), sp=Math.sin(pitch);
  const rx = x*cy-y*sy, ry=x*sy+y*cy;
  const rz = ry*sp+z*cp, py=ry*cp-z*sp;
  const base = Math.min(W,H)*.44/maxExtent/zoom, perspective = 1/(1+rz/(maxExtent*9));
  return { x:W/2+rx*base*perspective, y:H/2-py*base*perspective, z:rz, s:perspective };
}
function resize(){ dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0); }
function initStars(){ const rnd=(n)=>{const x=Math.sin(n*878.3)*43758.5;return x-Math.floor(x)}; stars=Array.from({length:360},(_,i)=>({x:rnd(i)*W,y:rnd(i+81)*H,r:rnd(i+189)*1.3+.18,a:rnd(i+314)*.55+.15})); }
function classColor(o){ return sentry.has(o.pdes) ? '#ff74ce' : o.pha ? '#ffc75b' : '#8ad9ff'; }
function validObject(o){ if (!Number.isFinite(o.a)||!Number.isFinite(o.e)||o.e>=1) return false; if (o.q > maxExtent || (o.ad && o.ad < .1)) return false; if(activeFilter==='pha'&&!o.pha)return false; if(activeFilter==='risk'&&!sentry.has(o.pdes))return false; if(query){const q=(o.full_name+' '+o.pdes+' '+(o.name||'')).toLowerCase();if(!q.includes(query))return false} return true; }
function drawOrbit(o, color, target) { if (!o || o.e >= 1) return; ctx.beginPath(); for(let k=0;k<=96;k++){const t=J2000+(o.per||365.25)*k/96;const p=orbitPosition(o,t);const s=project(p,target);k?ctx.lineTo(s.x,s.y):ctx.moveTo(s.x,s.y)}ctx.strokeStyle=color;ctx.lineWidth=1;ctx.stroke(); }
function circle(x,y,r,color){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
function render(){
  ctx.fillStyle='#030914';ctx.fillRect(0,0,W,H);
  for(const s of stars){ctx.fillStyle=`rgba(185,218,255,${s.a})`;ctx.fillRect(s.x,s.y,s.r,s.r)}
  const target=focus&&selected?orbitPosition(selected,jd):null;
  // ecliptic reference plane
  ctx.strokeStyle='rgba(74,124,177,.12)';ctx.lineWidth=1;ctx.beginPath();
  for(let r=1;r<=maxExtent;r+=1){for(let k=0;k<=80;k++){const a=k/80*Math.PI*2,p=project({x:Math.cos(a)*r,y:Math.sin(a)*r,z:0},target);k?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)}}ctx.stroke();
  const sun=project({x:0,y:0,z:0},target);const grad=ctx.createRadialGradient(sun.x,sun.y,0,sun.x,sun.y,25);grad.addColorStop(0,'#fff3c2');grad.addColorStop(.16,'#ffc85c');grad.addColorStop(.55,'rgba(255,147,39,.35)');grad.addColorStop(1,'rgba(255,147,39,0)');ctx.fillStyle=grad;ctx.beginPath();ctx.arc(sun.x,sun.y,27,0,7);ctx.fill();circle(sun.x,sun.y,5.5,'#fff0b5');
  nearPoints=[];
  // planets, orbit guides and points
  const pColors={Mercury:'#aeb7c6',Venus:'#f2c885',Earth:'#71bdf6',Mars:'#e98664',Jupiter:'#dfb179',Saturn:'#e9d494',Uranus:'#8adbe4',Neptune:'#668fea'};
  for(const p of planetData){ if(showOrbits) drawOrbit(p,'rgba(131,170,214,.22)',target);const pos=orbitPosition(p,jd),s=project(pos,target);const r=Math.max(2.2,Math.min(8,1.8+Math.log10(p.radius_km/1000+1)*2.4))*s.s;circle(s.x,s.y,r,pColors[p.name]||'#fff'); if(p.name==='Saturn'){ctx.strokeStyle='rgba(233,212,148,.7)';ctx.beginPath();ctx.ellipse(s.x,s.y,r*1.8,r*.5,-.35,0,7);ctx.stroke()}nearPoints.push({s,o:p,kind:'planet'}); }
  if(showOrbits&&selected) drawOrbit(selected, selected.pha?'rgba(255,199,91,.85)':'rgba(138,217,255,.72)',target);
  let shown=0;const groups={ '#8ad9ff':[], '#ffc75b':[], '#ff74ce':[] };
  for(const o of asteroids){if(!validObject(o))continue;const pos=orbitPosition(o,jd);if(!pos)continue;const s=project(pos,target);if(s.x<-4||s.x>W+4||s.y<-4||s.y>H+4)continue;groups[classColor(o)].push([s.x,s.y,s.s,o]);shown++;}
  for(const [color, points] of Object.entries(groups)){ctx.fillStyle=color;for(const [x,y,scale,o] of points){const r=o===selected?3.8:Math.max(.72,1.15*scale);ctx.fillRect(x-r/2,y-r/2,r,r);if(o===selected)nearPoints.push({s:{x,y},o,kind:'asteroid'});} }
  if(includeComets){ctx.fillStyle='#7de0bb';for(const o of comets){const pos=orbitPosition(o,jd);if(!pos)continue;const s=project(pos,target);if(Math.abs(s.x-W/2)>W*.6||Math.abs(s.y-H/2)>H*.6)continue;ctx.fillRect(s.x-1,s.y-1,2,2);shown++;}}
  if(selected){const p=orbitPosition(selected,jd),s=project(p,target);ctx.strokeStyle='#fff';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(s.x,s.y,8,0,7);ctx.stroke();}
  ui.count.textContent=`${shown.toLocaleString()} DISPLAYED`;
  ui.date.textContent=dateLabel(jd);ui.timeline.value=Math.round(jd);ui.extentValue.textContent=`${maxExtent} au`;
}
function fmt(v, unit=''){ return v==null||!Number.isFinite(v)?'—': `${v < .01 && v > 0 ? v.toExponential(2) : (v<10?v.toFixed(3):v.toFixed(1))}${unit}`; }
function showSelection(o, kind='asteroid'){
 selected=o;focus=false;const risk=sentry.get(o.pdes);const title=o.name||o.full_name||o.name;const approach=approaches?.get(o.pdes);
 ui.selection.classList.remove('hidden');ui.selection.innerHTML=`<button class="close-select" aria-label="Close">×</button><div class="eyebrow">${kind==='planet'?'PLANET':risk?'SENTRY IMPACT MONITOR':'NEAR-EARTH OBJECT'} · ${o.class||'—'}</div><h2>${title}</h2><div class="stats"><div>DESIGNATION<b>${o.pdes||o.name}</b></div><div>ORBIT SIZE<b>${fmt(o.a,' au')}</b></div><div>ECCENTRICITY<b>${fmt(o.e)}</b></div><div>INCLINATION<b>${fmt(o.i,'°')}</b></div><div>DIAMETER<b>${fmt(o.diameter,' km')}</b></div><div>EARTH MOID<b>${fmt(o.moid,' au')}</b></div></div>${risk?`<div class="approach"><strong>SENTRY:</strong> ${(risk.ip*100).toExponential(2)}% cumulative impact probability · Palermo ${risk.ps_max??'—'} · potential window ${risk.range||'—'}</div>`:''}${approach?`<div class="approach"><strong>NEXT CLOSE APPROACH:</strong> ${approach.cd} · ${fmt(approach.dist,' au')} · ${fmt(approach.v_rel,' km/s')}</div>`:''}<button class="focus-button">${focus?'UNFOLLOW':'FOLLOW OBJECT'}</button>`;
 $('.close-select',ui.selection).onclick=()=>{selected=null;focus=false;ui.selection.classList.add('hidden');syncUrl()};$('.focus-button',ui.selection).onclick=()=>{focus=!focus;showSelection(o,kind)};
 syncUrl();if(!approaches) loadApproaches();
}
async function loadApproaches(){try{ const data=await (await fetch('./data/close-approaches.json')).json(); approaches=new Map();for(const a of data){if(a.jd>=jd&&(!approaches.has(a.des)||a.jd<approaches.get(a.des).jd))approaches.set(a.des,a)}if(selected)showSelection(selected,selected.radius_km?'planet':'asteroid');}catch{ approaches=new Map(); }}
function syncUrl(){const u=new URL(location.href);u.searchParams.set('t',Math.round(jd));u.searchParams.set('yaw',yaw.toFixed(2));selected?.pdes?u.searchParams.set('object',selected.pdes):u.searchParams.delete('object');history.replaceState(null,'',u);}
function toast(text){ui.toast.textContent=text;ui.toast.classList.remove('hide');clearTimeout(toast.t);toast.t=setTimeout(()=>ui.toast.classList.add('hide'),2600)}
function pickObject(x, y){
  const target=focus&&selected?orbitPosition(selected,jd):null; let best=null, bestDist=15;
  for(const p of planetData){const s=project(orbitPosition(p,jd),target),d=Math.hypot(s.x-x,s.y-y);if(d<bestDist){best={o:p,kind:'planet'};bestDist=d;}}
  for(const o of asteroids){if(!validObject(o))continue;const p=orbitPosition(o,jd);if(!p)continue;const s=project(p,target),d=Math.hypot(s.x-x,s.y-y);if(d<bestDist){best={o,kind:'asteroid'};bestDist=d;}}
  return best;
}
function tick(now){const dt=(now-lastFrame)/1000;lastFrame=now;if(playing){jd+=dt*speed;if(jd>2524593)jd=2415020;if(jd<2415020)jd=2524593;syncUrl()}render();requestAnimationFrame(tick)}
function bind(){
 resize();initStars();addEventListener('resize',()=>{resize();initStars()});
 canvas.addEventListener('pointerdown',e=>{dragging=true;pointerStart=previous={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(!dragging)return;yaw+=(e.clientX-previous.x)*.006;pitch=Math.max(.12,Math.min(1.35,pitch+(e.clientY-previous.y)*.004));previous={x:e.clientX,y:e.clientY};});canvas.addEventListener('pointerup',e=>{const moved=Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y);dragging=false;if(moved<5){const hit=pickObject(e.clientX,e.clientY);if(hit)showSelection(hit.o,hit.kind);}});canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.35,Math.min(3,zoom*(e.deltaY>0?1.1:.9)))},{passive:false});
 ui.search.oninput=e=>{query=e.target.value.toLowerCase().trim()};ui.extent.oninput=e=>maxExtent=+e.target.value;ui.comets.onchange=e=>{includeComets=e.target.checked;toast(includeComets?'Comet overlay enabled':'Comet overlay hidden')};ui.orbits.onchange=e=>showOrbits=e.target.checked;
 document.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{document.querySelector('.chip.active').classList.remove('active');b.classList.add('active');activeFilter=b.dataset.filter});
 ui.timeline.oninput=e=>{jd=+e.target.value;playing=false;ui.play.textContent='▶';syncUrl()};ui.play.onclick=()=>{playing=!playing;ui.play.textContent=playing?'Ⅱ':'▶'};ui.speed.onchange=e=>speed=+e.target.value;$('#backBtn').onclick=()=>{jd-=30;syncUrl()};$('#forwardBtn').onclick=()=>{jd+=30;syncUrl()};$('#todayBtn').onclick=()=>{jd=jdToday();syncUrl()};
 $('#helpBtn').onclick=()=>$('#helpDialog').showModal();$('[data-close]').onclick=()=>$('#helpDialog').close();
}
async function start(){
 bind();try{const [p,a,c,s]=await Promise.all(['planets','asteroids','comets','sentry'].map(async n=>(await fetch(`./data/${n}.json`)).json()));planetData=p;asteroids=a;comets=c;for(const r of s)sentry.set(r.des,r);const objectId=new URLSearchParams(location.search).get('object');if(objectId){const o=asteroids.find(x=>x.pdes===objectId);if(o)showSelection(o)}toast(`${asteroids.length.toLocaleString()} real NEO orbits loaded`);requestAnimationFrame(tick);}catch(err){toast('Could not load the local orbit catalog. Serve this folder over HTTP.');console.error(err)}}
start();
