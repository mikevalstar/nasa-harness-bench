import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { positionAt, orbitPoints, jdFromDate, dateFromJD, formatDateFromJD } from './orbit.js';

const $ = s => document.querySelector(s);
const canvas = $('#c');
const tooltip = $('#tooltip');

// ---- state ----
let scene, camera, renderer, controls;
let sunMesh, planetMeshes=[], planetOrbits=[], planetLabels=[];
let starPoints, gridGroup;
let asteroidData=[], cometData=[], planetData=[], closeApproaches=[], sentryData=[], sentryMap=new Map(), caMap=new Map();
let asteroidPosAttr, asteroidColAttr, asteroidGeom, asteroidPoints;
let cometPosAttr, cometColAttr, cometGeom, cometPoints;
let selectedId=null, selectedType='asteroid'; // asteroid|comet|planet
let jdNow = jdFromDate(new Date());
let jd = jdNow;
let playing=true, speed=5; // days per second
let lastTime=performance.now();
let follow=false;
let showSelectedOrbitLine=null;
let hovered=null;
let visibleIndices=null; // Set or null

// color palette
const C = {
  pha:[1,0.23,0.19],
  up:[1,0.80,0.0],
  sentry:[1,0.42,0.20],
  comet:[0.31,0.76,0.97],
  normal:[0.72,0.73,0.78],
  planet:'#7ec8e3',
};

// ---- helpers ----
function jdToDisplay(j){ return formatDateFromJD(j) + ' · JD ' + j.toFixed(2); }

async function loadJSON(path){
  const r=await fetch(path);
  if(!r.ok) throw new Error('fetch '+path+' '+r.status);
  return r.json();
}

function isPHA(a){ return !!a.pha; }
function isUpcoming(a, jdCur){
  const list = caMap.get(a.pdes);
  if(!list) return false;
  // check if any CA within 30 days future
  for(const ca of list){
    const delta = ca.jd - jdCur;
    if(delta>=0 && delta<=30) return true;
    if(delta>30) break; // sorted
  }
  return false;
}
function hasSentry(a){ return sentryMap.has(a.pdes); }
function getSentry(a){ return sentryMap.get(a.pdes); }

function diameterFor(a){ return a.diameter ?? a.diameter; }

function makeColorFor(a, jdCur, opts){
  const highlightPHA = $('#toggle-hazard').checked;
  const highlightUP = $('#toggle-approaches').checked;
  // Sentry takes precedence if filter sentry only? but we color sentry orange
  if(sentryMap.has(a.pdes)) return C.sentry;
  if(highlightUP && isUpcoming(a,jdCur)) return C.up;
  if(highlightPHA && isPHA(a)) return C.pha;
  return C.normal;
}

function applyFilters(){
  const q = $('#search').value.trim().toLowerCase();
  const cls = $('#filter-class').value;
  const phaOnly = $('#filter-pha').checked;
  const sentryOnly = $('#filter-sentry').checked;
  const maxDist = parseFloat($('#filter-dist').value);
  const sizeThr = $('#filter-size').value ? parseFloat($('#filter-size').value)/1000 : 0; // km to keep consistent
  // update count and visibleIndices
  let visible=0, total=asteroidData.length;
  // For performance, we will compute per-asteroid shouldShow and update color alpha via color brightness
  // Instead of hiding via attribute, we will dim hidden to very dark and handle results list separately
  const results=[];
  const nowPosCache = null; // we compute distance check via position approx? better compute Earth distance quickly? Use heliocentric distance difference approx.
  // For distance filter, we need to know current Earth position; compute once
  const earthBody = planetData.find(p=>p.name==='Earth');
  let earthPos=[1,0,0];
  if(earthBody) earthPos = positionAt(earthBody, jd);
  const cols = asteroidColAttr.array;
  const pos = asteroidPosAttr.array;
  for(let i=0;i<asteroidData.length;i++){
    const a=asteroidData[i];
    let show=true;
    if(q){
      const hay = (a.full_name+' '+a.pdes+' '+(a.name||'')).toLowerCase();
      if(!hay.includes(q)) show=false;
    }
    if(show && cls && a.class!==cls) show=false;
    if(show && phaOnly && !a.pha) show=false;
    if(show && sentryOnly && !sentryMap.has(a.pdes)) show=false;
    if(show && sizeThr){
      const d = a.diameter;
      if(!(isFinite(d) && d>=sizeThr)) show=false;
    }
    // distance filter: compute distance to Earth if show still
    if(show && maxDist < 4.99){
      // compute asteroid position (use current pos array if available else compute)
      let ax,ay,az;
      if(pos){
        ax=pos[i*3]; ay=pos[i*3+1]; az=pos[i*3+2];
      } else {
        const p = positionAt(a, jd);
        ax=p[0]; ay=p[1]; az=p[2];
      }
      const dx=ax-earthPos[0], dy=ay-earthPos[1], dz=az-earthPos[2];
      const dist = Math.sqrt(dx*dx+dy*dy+dz*dz);
      if(dist>maxDist) show=false;
    }
    // update color: if hidden, dim to 0.08 opacity via dark color; if shown, use vivid
    const base = makeColorFor(a, jd);
    let r=base[0],g=base[1],b=base[2];
    if(!show){
      r*=0.15; g*=0.15; b*=0.15;
    } else {
      visible++;
      if(results.length<400) results.push({a,i});
    }
    // scale by size if enabled
    if($('#toggle-scale').checked && isFinite(a.diameter)){
      const d=a.diameter;
      if(d>1) { // boost brightness for large
        const f=Math.min(0.4, Math.log10(d)*0.15);
        r=Math.min(1,r+f); g=Math.min(1,g+f); b=Math.min(1,b+f);
      }
    }
    cols[i*3]=r; cols[i*3+1]=g; cols[i*3+2]=b;
    // also scale point via alpha? no, use color only
  }
  asteroidColAttr.needsUpdate=true;
  // comet visibility
  if(cometPoints){
    const ccols=cometColAttr.array;
    const cshow = $('#toggle-comets').checked;
    for(let i=0;i<cometData.length;i++){
      const base=C.comet;
      if(!cshow){ ccols[i*3]=base[0]*0.08; ccols[i*3+1]=base[1]*0.08; ccols[i*3+2]=base[2]*0.08; }
      else { ccols[i*3]=base[0]; ccols[i*3+1]=base[1]; ccols[i*3+2]=base[2]; }
    }
    cometColAttr.needsUpdate=true;
    cometPoints.visible=cshow;
  }

  $('#visible-count').textContent = visible.toLocaleString() + ' / ' + total.toLocaleString();
  $('#results-count').textContent = '('+visible.toLocaleString()+')';
  renderResults(results, q);
  updatePerfExtra();
}

function renderResults(list, q){
  const el=$('#results-list');
  el.innerHTML='';
  if(list.length===0){ el.innerHTML='<div style="color:var(--muted);padding:10px;text-align:center">No matches — relax filters</div>'; return; }
  // sort by: PHA first, then sentry, then upcoming, then by H (brightness)
  list.sort((A,B)=>{
    const a=A.a,b=B.a;
    const sa = (sentryMap.has(b.pdes)?2:0) - (sentryMap.has(a.pdes)?2:0);
    if(sa) return sa;
    const pa = (b.pha?1:0)-(a.pha?1:0);
    if(pa) return pa;
    return (a.H??99)-(b.H??99);
  });
  const frag=document.createDocumentFragment();
  for(let k=0;k<Math.min(list.length,200);k++){
    const {a,i}=list[k];
    const div=document.createElement('div');
    div.className='result'+(String(a.pdes)===String(selectedId) && selectedType==='asteroid'?' active':'');
    div.dataset.pdes=a.pdes;
    const name = a.name || a.pdes;
    const d = a.diameter ? (a.diameter>=1? a.diameter.toFixed(1)+' km' : Math.round(a.diameter*1000)+' m') : '—';
    div.innerHTML=`<div class="r1"><span class="name">${name}</span><span class="cls">${a.class||''}</span></div><div class="r2"><span class="${a.pha?'pha':''}">${a.pha?'PHA':''}</span><span>H ${a.H??'—'}</span><span>${d}</span><span>${a.moid!=null?'MOID '+a.moid.toFixed(3):''}</span></div>`;
    div.onclick=()=>selectObject(a.pdes,'asteroid');
    // double click to follow?
    frag.appendChild(div);
  }
  if(list.length>200){
    const more=document.createElement('div');
    more.style.cssText='color:var(--muted);padding:6px;text-align:center;font-size:11px';
    more.textContent=`…and ${(list.length-200).toLocaleString()} more (refine search)`;
    frag.appendChild(more);
  }
  el.appendChild(frag);
}

// ---- scene setup ----
function initScene(){
  scene=new THREE.Scene();
  scene.background=new THREE.Color(0x04070e);
  scene.fog=new THREE.Fog(0x04070e, 18, 60);

  camera=new THREE.PerspectiveCamera(55, innerWidth/innerHeight, 0.1, 200);
  camera.position.set(0, 4.5, 6);

  renderer=new THREE.WebGLRenderer({canvas, antialias:true, powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  controls=new OrbitControls(camera, renderer.domElement);
  controls.enableDamping=true;
  controls.dampingFactor=0.08;
  controls.minDistance=0.2;
  controls.maxDistance=80;
  controls.target.set(0,0,0);

  // lights
  scene.add(new THREE.AmbientLight(0xffffff,0.55));
  const sunLight=new THREE.PointLight(0xfff6e0, 18, 80, 1.5);
  sunLight.position.set(0,0,0);
  scene.add(sunLight);
  const hemi=new THREE.HemisphereLight(0x6ba7ff, 0x0a0a12, 0.35);
  scene.add(hemi);

  // stars
  makeStars();
  // grid
  makeGrid();
  // sun
  const sg=new THREE.SphereGeometry(0.06, 32,32);
  const sm=new THREE.MeshBasicMaterial({color:0xffcc33});
  sunMesh=new THREE.Mesh(sg, sm);
  scene.add(sunMesh);
  const glowG=new THREE.SphereGeometry(0.14,32,32);
  const glowM=new THREE.MeshBasicMaterial({color:0xffcc33, transparent:true, opacity:0.18});
  const glow=new THREE.Mesh(glowG, glowM);
  sunMesh.add(glow);
  const sunLight2=new THREE.SpriteMaterial({color:0xffcc33, transparent:true, opacity:0.35});
  // label
  // planets group will be added after data load
}

function makeStars(){
  const n=5000;
  const pos=new Float32Array(n*3);
  for(let i=0;i<n;i++){
    const r= 60 + Math.random()*40;
    const theta=Math.random()*Math.PI*2;
    const phi=Math.acos(2*Math.random()-1);
    pos[i*3]= r*Math.sin(phi)*Math.cos(theta);
    pos[i*3+1]= r*Math.sin(phi)*Math.sin(theta);
    pos[i*3+2]= r*Math.cos(phi);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos,3));
  const m=new THREE.PointsMaterial({color:0xffffff, size:0.06, sizeAttenuation:false, transparent:true, opacity:0.75});
  starPoints=new THREE.Points(g,m);
  scene.add(starPoints);
}

function makeGrid(){
  gridGroup=new THREE.Group();
  const gMat=new THREE.LineBasicMaterial({color:0x1e2a44, transparent:true, opacity:0.55});
  for(let r=0.5;r<=5.0;r+=0.5){
    const pts=[];
    for(let i=0;i<=64;i++){
      const a=i/64*Math.PI*2;
      pts.push(new THREE.Vector3(Math.cos(a)*r, 0, Math.sin(a)*r));
    }
    const g=new THREE.BufferGeometry().setFromPoints(pts);
    const line=new THREE.LineLoop(g,gMat);
    gridGroup.add(line);
  }
  // axes
  const axesM=new THREE.LineBasicMaterial({color:0x2a385c, transparent:true, opacity:0.4});
  const axG=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-6,0,0), new THREE.Vector3(6,0,0)]);
  gridGroup.add(new THREE.Line(axG,axesM));
  const azG=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,-6), new THREE.Vector3(0,0,6)]);
  gridGroup.add(new THREE.Line(azG,axesM));
  scene.add(gridGroup);
}

function makePlanets(){
  const planetColors={Mercury:0xb1a6a1, Venus:0xe6cda3, Earth:0x4a90d9, Mars:0xc1442b, Jupiter:0xd8b98c, Saturn:0xf0e0a0, Uranus:0x7fcde0, Neptune:0x3a5bd6};
  const scaleR = (km)=> {
    // exaggerate: log scale
    if(km>50000) return 0.08;
    if(km>10000) return 0.05;
    if(km>6000) return 0.035;
    return 0.022;
  };
  planetMeshes=[];
  planetOrbits=[];
  for(const p of planetData){
    const rad=scaleR(p.radius_km);
    const geom=new THREE.SphereGeometry(rad,24,16);
    const mat=new THREE.MeshStandardMaterial({color: planetColors[p.name]||0xffffff, roughness:0.7, metalness:0.05, emissive: planetColors[p.name]||0xffffff, emissiveIntensity:0.08});
    const m=new THREE.Mesh(geom, mat);
    m.userData.pdes=p.name;
    m.userData.type='planet';
    m.userData.body=p;
    scene.add(m);
    planetMeshes.push(m);
    // orbit line - map heliocentric (x,y,z) -> three (x,z,y) so ecliptic is XZ plane
    const pts=orbitPoints(p, 180);
    for(let k=0;k<pts.length;k+=3){ const yy=pts[k+1], zz=pts[k+2]; pts[k+1]=zz; pts[k+2]=yy; }
    const g=new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts,3));
    const lineMat=new THREE.LineBasicMaterial({color: planetColors[p.name]||0x666666, transparent:true, opacity:0.55});
    const line=new THREE.LineLoop(g, lineMat);
    line.userData.planet=p.name;
    scene.add(line);
    planetOrbits.push(line);
  }
}

function makeAsteroidPoints(){
  const n=asteroidData.length;
  asteroidGeom=new THREE.BufferGeometry();
  const pos=new Float32Array(n*3);
  const col=new Float32Array(n*3);
  // init colors dim
  for(let i=0;i<n;i++){ col[i*3]=0.5; col[i*3+1]=0.5; col[i*3+2]=0.55; }
  asteroidGeom.setAttribute('position', new THREE.BufferAttribute(pos,3));
  asteroidGeom.setAttribute('color', new THREE.BufferAttribute(col,3));
  const mat=new THREE.PointsMaterial({vertexColors:true, size:1.65, sizeAttenuation:true, transparent:true, opacity:0.95, depthWrite:false});
  // use custom onBeforeCompile to make circular points
  mat.onBeforeCompile = shader=>{
    shader.fragmentShader = shader.fragmentShader.replace('diffuseColor.a = opacity;', `
      float d = distance(gl_PointCoord, vec2(0.5));
      if(d>0.5) discard;
      // soft edge
      float a = 1.0 - smoothstep(0.35,0.5,d);
      diffuseColor.a = opacity * a;
    `);
  };
  asteroidPoints=new THREE.Points(asteroidGeom, mat);
  asteroidPoints.userData.type='asteroidPoints';
  asteroidPosAttr=asteroidGeom.getAttribute('position');
  asteroidColAttr=asteroidGeom.getAttribute('color');
  asteroidPoints.frustumCulled=false;
  scene.add(asteroidPoints);
}

function makeCometPoints(){
  if(cometData.length===0) return;
  const n=cometData.length;
  cometGeom=new THREE.BufferGeometry();
  const pos=new Float32Array(n*3);
  const col=new Float32Array(n*3);
  for(let i=0;i<n;i++){ col[i*3]=C.comet[0]; col[i*3+1]=C.comet[1]; col[i*3+2]=C.comet[2];}
  cometGeom.setAttribute('position', new THREE.BufferAttribute(pos,3));
  cometGeom.setAttribute('color', new THREE.BufferAttribute(col,3));
  const mat=new THREE.PointsMaterial({vertexColors:true, size:3.2, transparent:true, opacity:0.95, depthWrite:false});
  mat.onBeforeCompile=shader=>{
    shader.fragmentShader=shader.fragmentShader.replace('diffuseColor.a = opacity;', `
      float d=distance(gl_PointCoord, vec2(0.5));
      if(d>0.5) discard;
      float a=1.0 - smoothstep(0.25,0.5,d);
      diffuseColor.a=opacity*a;
    `);
  };
  cometPoints=new THREE.Points(cometGeom, mat);
  cometPosAttr=cometGeom.getAttribute('position');
  cometColAttr=cometGeom.getAttribute('color');
  cometPoints.frustumCulled=false;
  cometPoints.visible=$('#toggle-comets').checked;
  scene.add(cometPoints);
}

function updatePositions(jcur){
  // planets
  for(let i=0;i<planetMeshes.length;i++){
    const body=planetMeshes[i].userData.body;
    const p=positionAt(body, jcur);
    planetMeshes[i].position.set(p[0], p[2], p[1]);
  }
  // asteroids: update points
  if(asteroidPosAttr){
    const arr=asteroidPosAttr.array;
    for(let i=0;i<asteroidData.length;i++){
      const p=positionAt(asteroidData[i], jcur);
      arr[i*3]=p[0]; arr[i*3+1]=p[2]; arr[i*3+2]=p[1];
    }
    asteroidPosAttr.needsUpdate=true;
    asteroidGeom.computeBoundingSphere();
  }
  if(cometPosAttr){
    const arr=cometPosAttr.array;
    for(let i=0;i<cometData.length;i++){
      const c=cometData[i];
      const p=positionAt(c, jcur);
      // hyperbolic comets far away: clamp distance for rendering
      let x=p[0], y=p[2], z=p[1];
      const r=Math.sqrt(x*x+y*y+z*z);
      if(r>30){
        const s=30/r; x*=s; y*=s; z*=s;
      }
      arr[i*3]=x; arr[i*3+1]=y; arr[i*3+2]=z;
    }
    cometPosAttr.needsUpdate=true;
    cometGeom.computeBoundingSphere();
  }
  // selected orbit line update?
  if(selectedId) updateSelectedOrbit();
  // follow
  if(follow && selectedId){
    const pos=getSelectedPos();
    if(pos) controls.target.lerp(new THREE.Vector3(pos[0], pos[1], pos[2]), 0.12);
  }
}

function getSelectedBody(){
  if(!selectedId) return null;
  if(selectedType==='planet') return planetData.find(p=>p.name===selectedId);
  if(selectedType==='comet') return cometData.find(c=>c.pdes===selectedId);
  return asteroidData.find(a=>String(a.pdes)===String(selectedId));
}
function getSelectedPos(){
  const b=getSelectedBody();
  if(!b) return null;
  const p=positionAt(b, jd);
  return [p[0], p[2], p[1]];
}

function updateSelectedOrbit(){
  if(showSelectedOrbitLine){ scene.remove(showSelectedOrbitLine); showSelectedOrbitLine=null; }
  if(!$('#toggle-selected-orbit').checked) return;
  if(!selectedId) return;
  const body=getSelectedBody();
  if(!body) return;
  const pts=orbitPoints(body, 180);
  // map y/z
  for(let i=0;i<pts.length;i+=3){ const y=pts[i+1], z=pts[i+2]; pts[i+1]=z; pts[i+2]=y; }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts,3));
  const m=new THREE.LineBasicMaterial({color: 0x4fc3f7, transparent:true, opacity:0.9});
  if(isPHA(body)) m.color.setHex(0xff3b30);
  else if(sentryMap.has(body.pdes)) m.color.setHex(0xff6b35);
  const line=new THREE.LineLoop(g,m);
  scene.add(line);
  showSelectedOrbitLine=line;
  // also add perihelion marker
}

// detail view
function selectObject(id, type){
  selectedId=String(id);
  selectedType=type;
  // highlight results
  document.querySelectorAll('.result').forEach(el=> el.classList.toggle('active', el.dataset.pdes===String(id)));
  // update orbit
  updateSelectedOrbit();
  // camera follow target set
  const pos=getSelectedPos();
  if(pos){
    // pulse
  }
  showDetail();
  syncURL();
}

function showDetail(){
  const body=getSelectedBody();
  if(!body){ $('#right-panel').classList.add('hidden'); return; }
  const panel=$('#detail');
  const isPlanet=selectedType==='planet';
  let html='';
  const title = isPlanet? body.name : (body.full_name || body.pdes);
  const sub = isPlanet? `${body.a?.toFixed(3)} au · ${body.e?.toFixed(3)} e · ${body.i?.toFixed(2)}°` : `${body.pdes} · ${body.class||''} ${body.pha?'<span class="tag pha">PHA</span>':'<span class="tag ok">non-PHA</span>'} ${sentryMap.has(String(body.pdes))?'<span class="tag" style="background:#ff6b35;color:#fff">SENTRY</span>':''}`;
  html+=`<h2>${title}</h2><div class="sub">${sub}</div>`;
  if(!isPlanet){
    const d = body.diameter ? (body.diameter>=1? body.diameter.toFixed(2)+' km' : Math.round(body.diameter*1000)+' m') : 'unknown';
    html+=`<div class="kv">
      <div><label>Diameter</label><span>${d}</span></div>
      <div><label>Abs. mag H</label><span>${body.H ?? '—'} ${body.G!=null?'G '+body.G:''}</span></div>
      <div><label>Albedo</label><span>${body.albedo??'—'}</span></div>
      <div><label>Rotation</label><span>${body.rot_per? body.rot_per.toFixed(2)+' h':'—'}</span></div>
      <div><label>MOID</label><span>${body.moid!=null? body.moid.toFixed(4)+' au ('+(body.moid*149597870.7/1000).toFixed(0)+'k km)':'—'}</span></div>
      <div><label>Spec type</label><span>${body.spec_B||body.spec_T||'—'}</span></div>
    </div>`;
  }
  // orbit
  html+=`<div class="kv">
    <div><label>Semi-major a</label><span>${body.a!=null? body.a.toFixed(4)+' au':'—'}</span></div>
    <div><label>Eccentricity e</label><span>${body.e!=null? body.e.toFixed(4):'—'}</span></div>
    <div><label>Inclination i</label><span>${body.i!=null? body.i.toFixed(3)+'°':'—'}</span></div>
    <div><label>Ω / ω</label><span>${body.om!=null? body.om.toFixed(2)+'°':'—'} / ${body.w!=null? body.w.toFixed(2)+'°':'—'}</span></div>
    <div><label>Perihelion q</label><span>${body.q!=null? body.q.toFixed(3)+' au':'—'}</span></div>
    <div><label>Aphelion ad</label><span>${body.ad!=null? body.ad.toFixed(3)+' au':'—'}</span></div>
    <div><label>Period</label><span>${body.per? (body.per>365? (body.per/365).toFixed(2)+' yr' : body.per.toFixed(0)+' d') :'—'}</span></div>
    <div><label>Epoch</label><span>JD ${body.epoch}</span></div>
  </div>`;
  // current distance
  const pcur=positionAt(body,jd);
  const rcur=Math.sqrt(pcur[0]*pcur[0]+pcur[1]*pcur[1]+pcur[2]*pcur[2]);
  const earth=planetData.find(p=>p.name==='Earth');
  const epos=earth?positionAt(earth,jd):[1,0,0];
  const dx=pcur[0]-epos[0], dy=pcur[1]-epos[1], dz=pcur[2]-epos[2];
  const distEarth=Math.sqrt(dx*dx+dy*dy+dz*dz);
  html+=`<div style="background:rgba(79,195,247,.10);border:1px solid rgba(79,195,247,.25);border-radius:8px;padding:8px;margin:8px 0;font:12px ui-monospace,monospace">Now: <b>${rcur.toFixed(3)} au</b> from Sun · <b>${distEarth.toFixed(4)} au</b> from Earth (${(distEarth*149.6).toFixed(1)} M km)<br>Heliocentric: [${pcur[0].toFixed(3)}, ${pcur[1].toFixed(3)}, ${pcur[2].toFixed(3)}] au</div>`;

  // sentry
  const s = sentryMap.get(String(body.pdes));
  if(s){
    html+=`<div style="border:1px solid rgba(255,107,53,.4);background:rgba(255,107,53,.12);border-radius:8px;padding:10px;margin:10px 0"><b style="color:#ff6b35">⚠ CNEOS Sentry – impact risk monitored</b><div class="kv" style="margin:6px 0">
      <div><label>Cumul. prob</label><span class="risk-high">${(s.ip*100).toExponential(2)}%</span></div>
      <div><label>Palermo cum/max</label><span>${s.ps_cum?.toFixed(2)} / ${s.ps_max?.toFixed(2)}</span></div>
      <div><label>Torino max</label><span>${s.ts_max}</span></div>
      <div><label>Impacts</label><span>${s.n_imp} in ${s.range}</span></div>
      <div><label>V inf</label><span>${s.v_inf?.toFixed(1)} km/s</span></div>
      <div><label>Last obs</label><span>${s.last_obs}</span></div>
    </div></div>`;
  }
  // close approaches
  const cas = caMap.get(String(body.pdes)) || [];
  if(cas.length){
    const sorted=[...cas].sort((a,b)=>Math.abs(a.jd-jd)-Math.abs(b.jd-jd));
    // find next after jd
    const upcoming = cas.filter(c=>c.jd>=jd).sort((a,b)=>a.jd-b.jd).slice(0,8);
    const past = cas.filter(c=>c.jd<jd).sort((a,b)=>b.jd-a.jd).slice(0,5);
    html+=`<h3 style="margin:12px 0 6px;font:600 11px ui-sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)">Close approaches · Earth</h3>`;
    if(upcoming.length){
      html+=`<div style="color:#ffcc00;font:600 11px ui-sans-serif;margin-bottom:4px">Next ${upcoming.length}</div><table class="ca-table"><tr><th>Date</th><th>Dist (au / LD)</th><th>V km/s</th></tr>`;
      for(const ca of upcoming){
        const LD = (ca.dist*149597870.7/384400).toFixed(2);
        const isNear = ca.dist<0.05;
        html+=`<tr style="${isNear?'color:#ffcc00':''}"><td>${ca.cd}</td><td>${ca.dist.toFixed(5)} · ${LD} LD</td><td>${ca.v_rel?.toFixed(1)??'—'}</td></tr>`;
      }
      html+=`</table>`;
    }
    if(past.length){
      html+=`<table class="ca-table"><tr><th>Past</th><th>Dist</th><th>V</th></tr>`;
      for(const ca of past) html+=`<tr><td>${ca.cd}</td><td>${ca.dist.toFixed(5)}</td><td>${ca.v_rel?.toFixed(1)??'—'}</td></tr>`;
      html+=`</table>`;
    }
    if(cas.length>13) html+=`<div style="color:var(--muted);font:11px ui-sans-serif">${cas.length} total events in dataset</div>`;
  } else if(!isPlanet){
    html+=`<div style="color:var(--muted);padding:8px 0">No close-approach records in dataset for this object.</div>`;
  }

  // actions
  html+=`<div class="row" style="margin-top:14px"><button id="btn-focus-detail">Center on object</button><button id="btn-copy-detail">Copy designation</button></div>`;
  panel.innerHTML=html;
  $('#right-panel').classList.remove('hidden');
  setTimeout(()=>{
    $('#btn-focus-detail')?.addEventListener('click',()=>{
      const pos=getSelectedPos();
      if(pos){ controls.target.set(pos[0],pos[1],pos[2]); camera.position.set(pos[0]+2, pos[1]+1.5, pos[2]+2); }
    });
    $('#btn-copy-detail')?.addEventListener('click',()=> navigator.clipboard.writeText(String(body.pdes||body.name)));
  },0);
}

// picking
function pick(event){
  const rect=renderer.domElement.getBoundingClientRect();
  const x=((event.clientX-rect.left)/rect.width)*2-1;
  const y=-((event.clientY-rect.top)/rect.height)*2+1;
  const ray=new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2(x,y), camera);
  ray.params.Points.threshold=0.08;
  // check planets first
  const hits=ray.intersectObjects(planetMeshes, false);
  if(hits.length){ const h=hits[0].object; selectObject(h.userData.pdes, 'planet'); return; }
  // for points, we brute nearest in screen space for efficiency: find closest asteroid projection
  // compute screen projections for nearby candidates (filtered visible only)
  // brute over all: project each pos to screen, find closest within threshold pixels
  const thresholdPix=14;
  let best=null, bestDist=Infinity;
  // we can limit to visible subset: iterate all but early exit if far
  // project
  const proj=new THREE.Vector3();
  // check asteroids
  const arr=asteroidPosAttr?.array;
  if(arr){
    for(let i=0;i<asteroidData.length;i++){
      // quick frustum: if object hidden (dim) skip? still allow selection but prefer visible
      const cx=arr[i*3], cy=arr[i*3+1], cz=arr[i*3+2];
      proj.set(cx,cy,cz).project(camera);
      if(proj.z>1 || proj.z<-1) continue;
      const sx=(proj.x*0.5+0.5)*rect.width;
      const sy=(-proj.y*0.5+0.5)*rect.height;
      const dx=sx-(event.clientX-rect.left), dy=sy-(event.clientY-rect.top);
      const d=Math.hypot(dx,dy);
      if(d<thresholdPix && d<bestDist){
        bestDist=d; best={i,type:'asteroid'};
      }
    }
  }
  // comets if enabled
  if(cometPosAttr && $('#toggle-comets').checked){
    const carr=cometPosAttr.array;
    for(let i=0;i<cometData.length;i++){
      proj.set(carr[i*3],carr[i*3+1],carr[i*3+2]).project(camera);
      if(proj.z>1||proj.z<-1) continue;
      const sx=(proj.x*0.5+0.5)*rect.width;
      const sy=(-proj.y*0.5+0.5)*rect.height;
      const dx=sx-(event.clientX-rect.left), dy=sy-(event.clientY-rect.top);
      const d=Math.hypot(dx,dy);
      if(d<thresholdPix && d<bestDist){
        bestDist=d; best={i,type:'comet'};
      }
    }
  }
  if(best){
    if(best.type==='asteroid') selectObject(asteroidData[best.i].pdes,'asteroid');
    else selectObject(cometData[best.i].pdes,'comet');
  }
}

function onPointerMove(e){
  const rect=renderer.domElement.getBoundingClientRect();
  const x=((e.clientX-rect.left)/rect.width)*2-1;
  const y=-((e.clientY-rect.top)/rect.height)*2+1;
  const ray=new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2(x,y),camera);
  const hits=ray.intersectObjects(planetMeshes);
  if(hits.length){
    const h=hits[0].object.userData.body;
    showTip(e.clientX,e.clientY, `${h.name}\na=${h.a.toFixed(3)} au`);
    return;
  }
  // quick hover for closest asteroid within 16px
  const arr=asteroidPosAttr?.array;
  if(!arr){ hideTip(); return; }
  let best=null,bd=Infinity;
  const proj=new THREE.Vector3();
  // sample every Nth for hover performance
  for(let i=0;i<asteroidData.length;i+= Math.max(1, Math.floor(asteroidData.length/6000)) ){
    proj.set(arr[i*3],arr[i*3+1],arr[i*3+2]).project(camera);
    if(proj.z>1||proj.z<-1) continue;
    const sx=(proj.x*0.5+0.5)*rect.width;
    const sy=(-proj.y*0.5+0.5)*rect.height;
    const d=Math.hypot(sx-(e.clientX-rect.left), sy-(e.clientY-rect.top));
    if(d<16 && d<bd){ bd=d; best=asteroidData[i]; }
  }
  if(best){
    const d = best.diameter? (best.diameter>=1? best.diameter.toFixed(1)+' km':Math.round(best.diameter*1000)+' m') : '';
    showTip(e.clientX,e.clientY, `${best.name||best.pdes} · ${best.class||''} ${best.pha?'PHA':''}\nH ${best.H??'—'} ${d} MOID ${best.moid?.toFixed(3)??'—'}`);
  } else hideTip();
}
function showTip(x,y,txt){
  tooltip.style.left=(x+14)+'px';
  tooltip.style.top=(y+10)+'px';
  tooltip.textContent=txt;
  tooltip.style.display='block';
}
function hideTip(){ tooltip.style.display='none'; }

// URL deep links
function syncURL(){
  const cam=camera.position, tgt=controls.target;
  const hash=`jd=${jd.toFixed(4)}&sel=${selectedId||''}&type=${selectedType}&cam=${cam.x.toFixed(2)},${cam.y.toFixed(2)},${cam.z.toFixed(2)}&tgt=${tgt.x.toFixed(2)},${tgt.y.toFixed(2)},${tgt.z.toFixed(2)}&spd=${speed}&play=${playing?1:0}`;
  history.replaceState(null,'','#'+hash);
}
function loadURL(){
  const h=location.hash.slice(1);
  if(!h) return;
  const p=new URLSearchParams(h);
  const j=p.get('jd'); if(j) jd=parseFloat(j);
  const sel=p.get('sel'); if(sel) { selectedId=sel; selectedType=p.get('type')||'asteroid'; }
  const cam=p.get('cam'); if(cam){ const [x,y,z]=cam.split(',').map(parseFloat); if(isFinite(x)) camera.position.set(x,y,z); }
  const tgt=p.get('tgt'); if(tgt){ const [x,y,z]=tgt.split(',').map(parseFloat); if(isFinite(x)) controls.target.set(x,y,z); }
  const sp=p.get('spd'); if(sp) speed=parseFloat(sp);
  const pl=p.get('play'); if(pl!=null) playing=pl==='1';
}

// time UI
function updateTimeUI(){
  $('#date-display').textContent=formatDateFromJD(jd);
  $('#jd-display').textContent='JD '+jd.toFixed(2);
  const d=dateFromJD(jd);
  const iso=d.toISOString().slice(0,10);
  const inp=$('#date-input');
  if(document.activeElement!==inp) inp.value=iso;
  // slider centered at jdNow
  const delta = jd - jdNow;
  const clamp = Math.max(-1825, Math.min(1825, delta));
  $('#time-slider').value=clamp;
}
function setJD(newJD){
  jd=newJD;
  updatePositions(jd);
  applyFilters(); // for distance/upcoming colors may change with time
  updateTimeUI();
  if(selectedId) showDetail();
}

// ---- boot ----
async function boot(){
  initScene();
  $('#loading-text').textContent='Fetching data…';
  const [planets, asteroids, comets, cas, sentry] = await Promise.all([
    loadJSON('./data/planets.json'),
    loadJSON('./data/asteroids.json'),
    loadJSON('./data/comets.json').catch(()=>[]),
    loadJSON('./data/close-approaches.json').catch(()=>[]),
    loadJSON('./data/sentry.json').catch(()=>[]),
  ]);
  planetData=planets;
  asteroidData=asteroids;
  // keep comets as is (4000)
  cometData=comets;
  closeApproaches=cas;
  sentryData=sentry;
  // build maps
  for(const c of cas){
    if(!caMap.has(c.des)) caMap.set(c.des, []);
    caMap.get(c.des).push(c);
  }
  for(const [,arr] of caMap) arr.sort((a,b)=>a.jd-b.jd);
  for(const s of sentry) sentryMap.set(s.des, s);

  // pre-cache comets tp etc normal
  makePlanets();
  makeAsteroidPoints();
  makeCometPoints();

  loadURL();
  updatePositions(jd);
  applyFilters();
  updateTimeUI();
  $('#loading').classList.add('hidden');
  // controls
  setupEvents();
  syncURL();
  // init ui values
  $('#speed-select').value=String(speed);
  $('#btn-play').textContent = playing?'⏸':'▶';
  $('#btn-play').classList.toggle('playing', playing);
  animate();
}

function setupEvents(){
  window.addEventListener('resize',()=>{
    camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
  $('#btn-play').onclick=()=>{
    playing=!playing;
    $('#btn-play').textContent=playing?'⏸':'▶';
    $('#btn-play').classList.toggle('playing', playing);
    syncURL();
  };
  $('#btn-rewind').onclick=()=>{ speed=Math.max(0.1, speed/2); $('#speed-select').value=String(speed); syncURL();};
  $('#btn-forward').onclick=()=>{ speed=Math.min(500, speed*2); $('#speed-select').value=String(speed); syncURL();};
  $('#speed-select').onchange=e=>{ speed=parseFloat(e.target.value); syncURL();};
  $('#time-slider').oninput=e=>{
    const delta=parseFloat(e.target.value);
    setJD(jdNow+delta);
    syncURL();
  };
  $('#date-input').onchange=e=>{
    const v=e.target.value; if(!v) return;
    const d=new Date(v+'T12:00:00Z'); const j=jdFromDate(d); setJD(j); syncURL();
  };
  $('#btn-now').onclick=()=>{ jd=jdFromDate(new Date()); jdNow=jd; setJD(jd); syncURL(); };
  $('#btn-reset').onclick=()=>{ setJD(2451545.0); syncURL(); };
  // filters
  let t;
  $('#search').oninput=()=>{ clearTimeout(t); t=setTimeout(()=>applyFilters(),250); };
  $('#filter-class').onchange=applyFilters;
  $('#filter-size').onchange=applyFilters;
  $('#filter-pha').onchange=applyFilters;
  $('#filter-sentry').onchange=applyFilters;
  $('#toggle-hazard').onchange=applyFilters;
  $('#toggle-approaches').onchange=applyFilters;
  $('#toggle-comets').onchange=applyFilters;
  $('#filter-dist').oninput=e=>{ $('#dist-val').textContent=parseFloat(e.target.value).toFixed(1)+' au'; };
  $('#filter-dist').onchange=applyFilters;
  $('#toggle-scale').onchange=applyFilters;
  $('#toggle-selected-orbit').onchange=()=>updateSelectedOrbit();
  $('#toggle-orbits').onchange=e=>{ planetOrbits.forEach(l=>l.visible=e.target.checked); };
  $('#toggle-grid').onchange=e=>{ gridGroup.visible=e.target.checked; };
  $('#toggle-stars').onchange=e=>{ starPoints.visible=e.target.checked; };
  $('#toggle-follow').onchange=e=>{ follow=e.target.checked; };
  $('#btn-close-detail').onclick=()=>{ selectedId=null; $('#right-panel').classList.add('hidden'); updateSelectedOrbit(); syncURL(); document.querySelectorAll('.result.active').forEach(el=>el.classList.remove('active')); };
  $('#btn-jump').onclick=()=>{
    const v=$('#jump-des').value.trim(); if(!v) return;
    const f=asteroidData.find(a=>String(a.pdes)===v || (a.name&&a.name.toLowerCase()===v.toLowerCase()));
    if(f) selectObject(f.pdes,'asteroid');
    else if(cometData.find(c=>c.pdes===v)) selectObject(v,'comet');
    else alert('Not found');
  };
  $('#jump-des').onkeydown=e=>{ if(e.key==='Enter') $('#btn-jump').click(); };
  $('#btn-share').onclick=async()=>{
    syncURL();
    const url=location.href;
    try{ await navigator.clipboard.writeText(url); $('#btn-share').textContent='Copied!'; setTimeout(()=>$('#btn-share').textContent='Copy link',1200);}catch{ prompt('Copy link:',url); }
  };
  $('#btn-help').onclick=()=>$('#help-overlay').classList.remove('hidden');
  $('#btn-help-close').onclick=()=>$('#help-overlay').classList.add('hidden');
  $('#help-overlay').onclick=e=>{ if(e.target.id==='help-overlay') e.currentTarget.classList.add('hidden'); };

  renderer.domElement.addEventListener('click', pick);
  renderer.domElement.addEventListener('mousemove', onPointerMove);
  renderer.domElement.addEventListener('mouseleave', hideTip);

  // deep link camera throttle
  let camT;
  controls.addEventListener('change',()=>{ clearTimeout(camT); camT=setTimeout(syncURL,400); });
}

let lastFilterUpdate=0;
function updatePerfExtra(){
  // called from applyFilters
}

let frame=0;
function animate(){
  requestAnimationFrame(animate);
  const now=performance.now();
  const dt=(now-lastTime)/1000;
  lastTime=now;
  if(playing){
    jd += speed * dt;
    updatePositions(jd);
    // re-apply filter colors periodically (every 0.5s) for distance/approach dependent colors
    frame++;
    if(frame%30===0){
      // update colors that depend on time without full filter recompute? just update approach colors
      // lightweight: re-colour asteroids that are upcoming
      const cols=asteroidColAttr.array;
      const highlightUP=$('#toggle-approaches').checked, highlightPHA=$('#toggle-hazard').checked;
      for(let i=0;i<asteroidData.length;i++){
        const a=asteroidData[i];
        // skip hidden? we still need to know hidden state; we can check if currently dimmed? simpler skip to avoid expensive: only recolour those that are upcomingPHA? Actually recompute via makeColorFor but need visibility.
        // For speed, only adjust upcoming asteroids (those with upcoming flag changes slowly)
        // We'll just keep as is; full filter periodic every 2s for distance
      }
      if(frame%180===0) applyFilters();
      updateTimeUI();
    }
  }
  controls.update();
  renderer.render(scene, camera);
  if(frame%60===0){
    const fps=(1000/dt).toFixed(0); // approx
    $('#perf').textContent=`${asteroidData.length.toLocaleString()} NEOs · ${fps} fps · ${formatDateFromJD(jd)}`;
  }
}

boot().catch(e=>{
  console.error(e);
  $('#loading-text').textContent='Failed to load data';
  $('#loading-sub').textContent=e.message;
});
