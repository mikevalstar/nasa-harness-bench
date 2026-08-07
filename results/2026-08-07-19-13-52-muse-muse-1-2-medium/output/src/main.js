import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { computePosition, sampleOrbit, jdFromDate, dateFromJd } from './orbit.js'

const DEG2RAD = Math.PI/180

// --- DOM ---
const canvas = document.getElementById('canvas')
const hud = document.getElementById('hud')
const tooltip = document.getElementById('tooltip')
const listEl = document.getElementById('list')
const statsEl = document.getElementById('stats')
const detailEl = document.getElementById('detail')
const qEl = document.getElementById('q')
const fClassEl = document.getElementById('f-class')
const fSortEl = document.getElementById('f-sort')
const chkComets = document.getElementById('chk-comets')
const chkPhaHL = document.getElementById('chk-phaHL')
const chkRiskHL = document.getElementById('chk-riskHL')
const scrub = document.getElementById('scrub')
const timeLabel = document.getElementById('timeLabel')
const jdLabel = document.getElementById('jdLabel')
const dateInp = document.getElementById('date')
const playBtn = document.getElementById('btn-play')
const revBtn = document.getElementById('btn-rev')
const speedSel = document.getElementById('speed')
const btnNow = document.getElementById('btn-now')
const btnFocus = document.getElementById('btn-focus')
const btnOrbit = document.getElementById('btn-orbit')
const btnReset = document.getElementById('btn-reset')
const btnShare = document.getElementById('btn-share')

// --- Three ---
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:false })
renderer.setPixelRatio(Math.min(devicePixelRatio,2))
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x05070d)
const camera = new THREE.PerspectiveCamera(55, 1, 0.05, 120)
camera.position.set(0, 6, 4)
const controls = new OrbitControls(camera, canvas)
controls.target.set(0,0,0)
controls.minDistance = 0.3
controls.maxDistance = 35
controls.enableDamping = true

// lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.9))
const sunLight = new THREE.PointLight(0xffffff, 2.5, 0, 2)
sunLight.position.set(0,0,0)
scene.add(sunLight)

// sun
const sunGeo = new THREE.SphereGeometry(0.09, 32, 32)
const sunMat = new THREE.MeshBasicMaterial({ color: 0xffd479 })
const sunMesh = new THREE.Mesh(sunGeo, sunMat)
scene.add(sunMesh)
const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ color:0xffb84d, transparent:true, opacity:0.35, depthWrite:false }))
sunGlow.scale.set(0.9,0.9,1)
sunGlow.position.set(0,0,0)
scene.add(sunGlow)

// ecliptic grid
const grid = new THREE.GridHelper(20, 20, 0x1a2a44, 0x13203a)
grid.rotation.x = 0
grid.position.y = -0.001
scene.add(grid)
const axes = new THREE.AxesHelper(2)
scene.add(axes)

// stars
{
  const n=3000
  const g=new THREE.BufferGeometry()
  const pos=new Float32Array(n*3)
  for(let i=0;i<n;i++){
    const r=60+Math.random()*40
    const th=Math.random()*Math.PI*2
    const phi=Math.acos(2*Math.random()-1)
    pos[i*3]=r*Math.sin(phi)*Math.cos(th)
    pos[i*3+1]=r*Math.sin(phi)*Math.sin(th)
    pos[i*3+2]=r*Math.cos(phi)
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos,3))
  const m=new THREE.PointsMaterial({ color:0x6a7da0, size:0.18, sizeAttenuation:false, transparent:true, opacity:0.55 })
  scene.add(new THREE.Points(g,m))
}

// Earth orbit helper scale label
let planets=[], asteroids=[], comets=[], sentryMap=new Map(), closeMap=new Map()

// planet visuals
const planetColors={ Mercury:0xbfbfbf, Venus:0xe6c9a8, Earth:0x6b9eff, Mars:0xff7a59, Jupiter:0xffd27a, Saturn:0xfff0a8, Uranus:0x8af0ff, Neptune:0x5a7dff }
let planetMeshes=[], planetOrbitLines=[]
let asteroidPoints, cometPoints
let asteroidPos, asteroidCol, cometPos, cometCol
let asteroidCount=0, cometCount=0
let selectedId=null, selectedKind='asteroid' // or comet/planet
let follow=false, showOrbit=true

// time
let jd = jdFromDate(new Date())
let playing=false, dir=1
function setJd(v, fromScrub=false){
  jd = v
  if(!fromScrub) scrub.value = String(jd)
  updateTimeLabels()
  updatePositions()
  updateDetailDistance()
  updateURL()
}
function updateTimeLabels(){
  const d=dateFromJd(jd)
  const iso=d.toISOString().slice(0,10)
  const jdStr=jd.toFixed(2)
  timeLabel.textContent = `${iso}  •  JD ${jdStr}`
  jdLabel.textContent = `JD ${jdStr}`
  if(dateInp.value !== iso) dateInp.value = iso
}

// filter state
const filter={ q:'', cls:'', pha:false, risk:false, large:false, close:false, upcoming:false, sort:'dist' }

function classColor(cls){
  if(cls==='APO') return new THREE.Color(0x8a9bff)
  if(cls==='AMO') return new THREE.Color(0x6bff9a)
  if(cls==='ATE') return new THREE.Color(0xff8aff)
  if(cls==='IEO') return new THREE.Color(0xff6b6b)
  return new THREE.Color(0x9fb3d1)
}

let filteredIndices=[] // indices into asteroids that pass filter (for list)
let distances=[] // distance to sun per asteroid at current jd
let distToEarth=[]

function applyFilters(){
  const q = filter.q.toLowerCase().trim()
  filteredIndices=[]
  for(let i=0;i<asteroids.length;i++){
    const a=asteroids[i]
    if(filter.cls && a.class !== filter.cls) continue
    if(filter.pha && !a.pha) continue
    if(filter.large && !(a.diameter && a.diameter>1)) continue
    if(q){
      const hay=(a.pdes+' '+(a.name||'')+' '+(a.full_name||'')).toLowerCase()
      if(!hay.includes(q)) continue
    }
    if(filter.risk && !sentryMap.has(a.pdes)) continue
    // close / upcoming need distance; we compute distances first
    filteredIndices.push(i)
  }
  // distance-based filters after distances computed
  if(filter.close || filter.upcoming){
    const tmp=[]
    for(const idx of filteredIndices){
      const dEarth = distToEarth[idx]
      if(filter.close && !(dEarth!=null && dEarth<0.05)) continue
      if(filter.upcoming){
        const arr=closeMap.get(asteroids[idx].pdes)
        let ok=false
        if(arr){
          for(const ca of arr){
            const dj = ca.jd - jd
            if(dj>=0 && dj<=30) { ok=true; break }
          }
        }
        if(!ok) continue
      }
      tmp.push(idx)
    }
    filteredIndices=tmp
  }
  // sort
  if(filter.sort==='dist'){
    filteredIndices.sort((ia,ib)=>(distToEarth[ia]??1e9)-(distToEarth[ib]??1e9))
  } else if(filter.sort==='pha'){
    filteredIndices.sort((ia,ib)=>(asteroids[ib].pha?1:0)-(asteroids[ia].pha?1:0))
  } else if(filter.sort==='diam'){
    filteredIndices.sort((ia,ib)=>(asteroids[ib].diameter||0)-(asteroids[ia].diameter||0))
  } else if(filter.sort==='moid'){
    filteredIndices.sort((ia,ib)=>(asteroids[ia].moid??1e9)-(asteroids[ib].moid??1e9))
  } else if(filter.sort==='H'){
    filteredIndices.sort((ia,ib)=>(asteroids[ia].H??1e9)-(asteroids[ib].H??1e9))
  }
  renderList()
  updatePointColors()
  updateStats()
}

function renderList(){
  // limit to 400 items for perf
  const max=400
  const slice=filteredIndices.slice(0,max)
  listEl.innerHTML=''
  for(const idx of slice){
    const a=asteroids[idx]
    const dEarth=distToEarth[idx]
    const div=document.createElement('div')
    div.className='item'+(selectedKind==='asteroid' && asteroids[idx].pdes===selectedId?' sel':'')
    div.dataset.idx=idx
    const name = a.name || a.pdes
    const diam = a.diameter? `${a.diameter.toFixed(2)} km` : `H ${a.H ?? '—'}`
    div.innerHTML=`<div class="t">${name} <span style="color:#6e839f">(${a.pdes})</span></div><div class="s"><span class="badge ${a.pha?'pha':''}">${a.class||'—'}${a.pha?' • PHA':''}</span>${sentryMap.has(a.pdes)?'<span class="badge risk">risk</span>':''}<span>${diam}</span><span>${dEarth!=null?dEarth.toFixed(3)+' AU':''}</span></div>`
    div.addEventListener('click',()=> selectAsteroid(a.pdes))
    listEl.appendChild(div)
  }
  if(filteredIndices.length>max){
    const more=document.createElement('div')
    more.style.cssText='font-size:11px;color:#6e839f;padding:6px 8px'
    more.textContent=`… and ${filteredIndices.length - max} more (refine filter)`
    listEl.appendChild(more)
  }
}
function updateStats(){
  statsEl.textContent = `${filteredIndices.length.toLocaleString()} / ${asteroids.length.toLocaleString()} shown • ${comets.length.toLocaleString()} comets • ${sentryMap.size.toLocaleString()} Sentry`
}

function updatePointColors(){
  if(!asteroidCol) return
  const c = asteroidCol
  // base colors: dim by default, highlight filtered
  const filteredSet = new Set(filteredIndices)
  const now = jd
  for(let i=0;i<asteroids.length;i++){
    const a=asteroids[i]
    const isFiltered = filteredSet.has(i)
    const isPHA = a.pha
    const hasRisk = sentryMap.has(a.pdes)
    let col
    if(!isFiltered){
      col = new THREE.Color(0x1b263d) // dim
    } else {
      if(chkRiskHL.checked && hasRisk) col = new THREE.Color(0xffcc6b)
      else if(chkPhaHL.checked && isPHA) col = new THREE.Color(0xff6b6b)
      else col = classColor(a.class)
      // fade by H? brighter for brighter (lower H)
      // keep as is
    }
    // selected emmissive bright
    if(selectedKind==='asteroid' && a.pdes===selectedId){
      col = new THREE.Color(0xffffff)
    }
    c[i*3]=col.r; c[i*3+1]=col.g; c[i*3+2]=col.b
  }
  asteroidPoints.geometry.attributes.color.needsUpdate=true

  if(cometCol && cometPoints){
    for(let i=0;i<comets.length;i++){
      const cm=comets[i]
      const isSel = selectedKind==='comet' && cm.pdes===selectedId
      let cc = new THREE.Color(0x6ecbff)
      if(cm.e>=1) cc = new THREE.Color(0xa8f0ff)
      if(isSel) cc = new THREE.Color(0xffffff)
      cometCol[i*3]=cc.r; cometCol[i*3+1]=cc.g; cometCol[i*3+2]=cc.b
    }
    cometPoints.geometry.attributes.color.needsUpdate=true
  }
}

// selection
let orbitLine=null
function selectAsteroid(pdes){
  selectedId=pdes; selectedKind='asteroid'
  // also ensure visible in list
  updatePointColors()
  renderList()
  showDetailFor(pdes,'asteroid')
  drawOrbitFor(pdes,'asteroid')
  updateURL()
}
function selectComet(pdes){
  selectedId=pdes; selectedKind='comet'
  updatePointColors()
  showDetailFor(pdes,'comet')
  drawOrbitFor(pdes,'comet')
  updateURL()
}
function selectPlanet(name){
  selectedId=name; selectedKind='planet'
  updatePointColors()
  showDetailFor(name,'planet')
  drawOrbitFor(name,'planet')
  updateURL()
}
function drawOrbitFor(id,kind){
  if(orbitLine){ scene.remove(orbitLine); orbitLine=null }
  if(!showOrbit) return
  let el
  if(kind==='asteroid') el=asteroids.find(a=>a.pdes===id)
  else if(kind==='comet') el=comets.find(a=>a.pdes===id)
  else if(kind==='planet') el=planets.find(a=>a.name===id)
  if(!el) return
  const pts=sampleOrbit(el, 180)
  const geo=new THREE.BufferGeometry()
  const arr=new Float32Array(pts.length*3)
  for(let i=0;i<pts.length;i++){ arr[i*3]=pts[i].x; arr[i*3+1]=pts[i].z*0.0 + pts[i].y; /* y is ecliptic north, keep y as z? keep original: x,y,z where y is ecliptic y, z is north */ 
  }
  // we stored y as ecliptic y, z as north; Three y is up. Keep mapping: x->x, y->z, z->y? Actually our coords: x,y ecliptic, z north. In Three, y up. So map z->y.
  for(let i=0;i<pts.length;i++){ arr[i*3]=pts[i].x; arr[i*3+1]=pts[i].z; arr[i*3+2]=pts[i].y; }
  geo.setAttribute('position', new THREE.BufferAttribute(arr,3))
  const color = kind==='planet'? 0x6b9eff : kind==='comet'? 0x6ecbff : 0xffffff
  const mat=new THREE.LineBasicMaterial({ color, transparent:true, opacity:0.9 })
  const line=new THREE.Line(geo, mat)
  orbitLine=line
  scene.add(line)
  // also add current position marker
}

function showDetailFor(id,kind){
  let html=''
  if(kind==='asteroid'){
    const a=asteroids.find(x=>x.pdes===id)
    if(!a) return
    const sentry=sentryMap.get(a.pdes)
    const approaches=(closeMap.get(a.pdes)||[]).slice().sort((x,y)=>x.jd - y.jd)
    const cur = computePosition(a, jd)
    const earth = planets.find(p=>p.name==='Earth')
    let earthDist=null
    if(earth){
      const ep=computePosition(earth, jd)
      earthDist=Math.hypot(cur.x-ep.x, cur.y-ep.y, cur.z-ep.z)
    }
    html+=`<h2>${a.full_name||a.pdes}</h2><div class="meta">${a.name?`Name: ${a.name} • `:''}Des: ${a.pdes} • SPK ${a.spkid}<br/>Class ${a.class} • ${a.pha?'PHA • ':''}${a.neo?'NEO':''} • MOID ${a.moid?.toFixed(4)??'—'} AU<br/>H ${a.H??'—'}${a.G!=null?` G ${a.G}`:''} • D ${a.diameter? a.diameter+' km':'—'} • albedo ${a.albedo??'—'}<br/>a ${a.a} AU • e ${a.e} • i ${a.i}° • Ω ${a.om}° • ω ${a.w}°<br/>ma ${a.ma}° @ JD ${a.epoch} • per ${a.per?.toFixed(1)??'—'} d • n ${a.n?.toFixed(4)??'—'}°/d</div>`
    html+=`<div class="kv"><span>Sun distance now</span><b>${cur.r.toFixed(4)} AU</b></div><div class="kv"><span>Earth distance now</span><b>${earthDist!=null?earthDist.toFixed(4)+' AU':''}</b></div>`
    if(sentry){
      const riskColor = sentry.ps_cum > -2 ? '#ff6b6b' : '#ffcc6b'
      html+=`<div class="sep"></div><div style="color:${riskColor};font-weight:700;font-size:12px">Sentry impact risk</div><div class="meta">IP ${Number(sentry.ip).toExponential(2)} • Palermo ${sentry.ps_cum?.toFixed(2)} (max ${sentry.ps_max?.toFixed(2)}) • Torino ${sentry.ts_max} • ${sentry.range} • ${sentry.n_imp} potential impacts<br/>V∞ ${sentry.v_inf?.toFixed(1)} km/s • H ${sentry.h} • D ${sentry.diameter} km</div>`
    }
    // upcoming approaches: filter near current time
    const upcoming = approaches.filter(ca=> Math.abs(ca.jd - jd) < 365*5).slice(0,12)
    html+=`<div class="sep"></div><div style="font-size:11px;font-weight:700;color:#d6e6ff">Close approaches to Earth (${approaches.length})</div>`
    if(approaches.length===0) html+=`<div class="meta">No recorded approaches in dataset for this object.</div>`
    else {
      html+=`<table class="table"><tr><th>Date</th><th>Dist (AU)</th><th>Vrel</th></tr>`
      for(const ca of (upcoming.length?upcoming:approaches.slice(0,8))){
        const d=dateFromJd(ca.jd).toISOString().slice(0,10)
        const isNear = Math.abs(ca.jd - jd) < 30 ? ' style="color:#ffcc6b"' : ''
        html+=`<tr${isNear}><td>${d}</td><td>${ca.dist.toFixed(4)}</td><td>${ca.v_rel.toFixed(1)} km/s</td></tr>`
      }
      html+=`</table>`
      // next approach
      const next = approaches.find(ca=> ca.jd >= jd)
      if(next) html+=`<div class="meta" style="margin-top:6px;color:#ffcc6b">Next: ${dateFromJd(next.jd).toISOString().slice(0,10)} • ${next.dist.toFixed(4)} AU</div>`
    }
  } else if(kind==='comet'){
    const c=comets.find(x=>x.pdes===id)
    if(!c) return
    const cur=computePosition(c, jd)
    html+=`<h2>${c.full_name}</h2><div class="meta">Des ${c.pdes} • class ${c.class} • e ${c.e} • q ${c.q} AU • i ${c.i}° • Ω ${c.om}° • ω ${c.w}°<br/>tp JD ${c.tp} • a ${c.a??'—'} • per ${c.per??'—'} d<br/>M1 ${c.M1??'—'} • D ${c.diameter??'—'} km</div><div class="kv"><span>Sun distance now</span><b>${cur.r.toFixed(4)} AU</b></div><div class="meta" style="margin-top:6px">${c.e>=1?'Hyperbolic/parabolic — propagated from perihelion.': 'Elliptic — propagated from epoch.'}</div>`
  } else if(kind==='planet'){
    const p=planets.find(x=>x.name===id)
    const cur=computePosition(p, jd)
    html+=`<h2>${p.name}</h2><div class="meta">a ${p.a} AU • e ${p.e} • i ${p.i}°<br/>Radius ${p.radius_km} km (scaled)</div><div class="kv"><span>Sun distance</span><b>${cur.r.toFixed(4)} AU</b></div>`
  }
  detailEl.innerHTML=html
}
function updateDetailDistance(){
  if(!selectedId) return
  // refresh distances in detail without rebuilding full html? simple rebuild
  showDetailFor(selectedId, selectedKind)
}

// positions update
function updatePositions(){
  // planets
  for(let i=0;i<planets.length;i++){
    const p=planets[i]
    const pos=computePosition(p, jd)
    // map z north to Three y
    planetMeshes[i].position.set(pos.x, pos.z, pos.y)
  }
  // asteroids
  if(asteroidPos){
    for(let i=0;i<asteroids.length;i++){
      const pos=computePosition(asteroids[i], jd)
      asteroidPos[i*3]=pos.x
      asteroidPos[i*3+1]=pos.z
      asteroidPos[i*3+2]=pos.y
      distances[i]=pos.r
      // earth distance
      // compute earth pos once
    }
    // compute earth pos for distances
    const earth = planets.find(p=>p.name==='Earth')
    let ex=0,ey=0,ez=0
    if(earth){
      const ep=computePosition(earth,jd)
      ex=ep.x; ey=ep.y; ez=ep.z
    }
    for(let i=0;i<asteroids.length;i++){
      const x=asteroidPos[i*3], y=asteroidPos[i*3+1], z=asteroidPos[i*3+2]
      // y is north, z is ecliptic y
      // earth y is north? stored as z in three but original ey is ecliptic y, ez is north
      // asteroidPos y = north, z = ecliptic y
      // so convert earth similarly
      const ay=y, az=z // but need mapping: asteroid y = north, z = ecliptic y
      // earth north = ep.z, ecliptic y = ep.y
      const dx=x-ex, dy=az - ey, dz=ay - ez
      distToEarth[i]=Math.hypot(dx,dy,dz)
    }
    asteroidPoints.geometry.attributes.position.needsUpdate=true
    asteroidPoints.geometry.computeBoundingSphere()
  }
  if(cometPos){
    const vis = chkComets.checked
    cometPoints.visible=vis
    if(vis){
      for(let i=0;i<comets.length;i++){
        const pos=computePosition(comets[i], jd)
        cometPos[i*3]=pos.x; cometPos[i*3+1]=pos.z; cometPos[i*3+2]=pos.y
      }
      cometPoints.geometry.attributes.position.needsUpdate=true
      cometPoints.geometry.computeBoundingSphere()
    }
  }
  // re-apply filter sorting because distance changed
  if(distances.length) applyFilters()
}

function onResize(){
  const rect=document.getElementById('center').getBoundingClientRect()
  const w=rect.width, h=rect.height
  renderer.setSize(w,h,false)
  camera.aspect=w/h
  camera.updateProjectionMatrix()
}
window.addEventListener('resize', onResize)

// controls + picking
const raycaster=new THREE.Raycaster()
const mouse=new THREE.Vector2()
let hoverId=null
canvas.addEventListener('mousemove', e=>{
  const rect=canvas.getBoundingClientRect()
  mouse.x=((e.clientX-rect.left)/rect.width)*2-1
  mouse.y=-((e.clientY-rect.top)/rect.height)*2+1
  // find nearest asteroid under cursor via CPU projection
  // project asteroid positions to screen
  // simple: iterate filteredIndices nearest to ray
  raycaster.setFromCamera(mouse, camera)
  const ray = raycaster.ray
  let best=null, bestDist=0.08 // world units threshold
  // check planets first
  for(let i=0;i<planetMeshes.length;i++){
    const m=planetMeshes[i]
    const d=ray.distanceToPoint(m.position)
    if(d<0.15 && (!best || d<bestDist)){
      bestDist=d; best={kind:'planet', id:planets[i].name, pos:m.position.clone()}
    }
  }
  // comets
  if(chkComets.checked){
    for(let i=0;i<comets.length;i++){
      const x=cometPos[i*3], y=cometPos[i*3+1], z=cometPos[i*3+2]
      const p=new THREE.Vector3(x,y,z)
      const d=ray.distanceToPoint(p)
      const camDist=camera.position.distanceTo(p)
      const thr = Math.max(0.06, camDist*0.015)
      if(d<thr && d<bestDist){ bestDist=d; best={kind:'comet', id:comets[i].pdes, pos:p} }
      if(best && bestDist<0.06) break
    }
  }
  // asteroids: check only filtered or all? check all but limited to near camera?
  // iterate filteredIndices first for responsiveness
  const candidates = filteredIndices.length<5000 ? filteredIndices : filteredIndices.slice(0,5000)
  for(const idx of candidates){
    const x=asteroidPos[idx*3], y=asteroidPos[idx*3+1], z=asteroidPos[idx*3+2]
    const p=new THREE.Vector3(x,y,z)
    const d=ray.distanceToPoint(p)
    const camDist=camera.position.distanceTo(p)
    const thr = Math.max(0.05, camDist*0.012)
    if(d<thr && d<bestDist){ bestDist=d; best={kind:'asteroid', id:asteroids[idx].pdes, pos:p} }
  }
  if(best){
    hoverId=best.id
    tooltip.style.display='block'
    tooltip.textContent=best.id + (best.kind==='planet'?' (planet)':'')
    // project pos to screen
    const proj=best.pos.clone().project(camera)
    const cx=rect.left + (proj.x*0.5+0.5)*rect.width
    const cy=rect.top + (-proj.y*0.5+0.5)*rect.height
    tooltip.style.left=cx+'px'
    tooltip.style.top=cy+'px'
    canvas.style.cursor='pointer'
  } else {
    hoverId=null
    tooltip.style.display='none'
    canvas.style.cursor='grab'
  }
})
canvas.addEventListener('click', ()=>{
  if(hoverId){
    // determine kind by searching
    if(planets.some(p=>p.name===hoverId)) selectPlanet(hoverId)
    else if(comets.some(c=>c.pdes===hoverId)) selectComet(hoverId)
    else selectAsteroid(hoverId)
  }
})
canvas.addEventListener('mousedown',()=> canvas.style.cursor='grabbing')
canvas.addEventListener('mouseup',()=> canvas.style.cursor='grab')

// UI events
qEl.addEventListener('input', ()=>{ filter.q=qEl.value; applyFilters(); updateURL() })
fClassEl.addEventListener('change', ()=>{ filter.cls=fClassEl.value; applyFilters(); updateURL() })
fSortEl.addEventListener('change', ()=>{ filter.sort=fSortEl.value; applyFilters(); updateURL() })
document.querySelectorAll('.pill').forEach(el=>{
  el.addEventListener('click', ()=>{
    el.classList.toggle('active')
    const t=el.dataset.toggle
    filter[t]=el.classList.contains('active')
    applyFilters(); updateURL()
  })
})
chkComets.addEventListener('change',()=>{ updatePositions(); updatePointColors(); updateURL() })
chkPhaHL.addEventListener('change', updatePointColors)
chkRiskHL.addEventListener('change', updatePointColors)
scrub.addEventListener('input', ()=> setJd(parseFloat(scrub.value), true))
dateInp.addEventListener('change', ()=>{
  const d=new Date(dateInp.value+'T00:00:00Z')
  if(!isNaN(d)) setJd(jdFromDate(d))
})
playBtn.addEventListener('click', ()=>{
  if(playing && dir===1){ playing=false; playBtn.textContent='▶ Play'; playBtn.classList.remove('active'); }
  else { playing=true; dir=1; playBtn.classList.add('active'); revBtn.classList.remove('active'); revBtn.textContent='◀ Rev'; playBtn.textContent='⏸ Pause' }
})
revBtn.addEventListener('click', ()=>{
  if(playing && dir===-1){ playing=false; revBtn.classList.remove('active'); revBtn.textContent='◀ Rev'; }
  else { playing=true; dir=-1; revBtn.classList.add('active'); playBtn.classList.remove('active'); playBtn.textContent='▶ Play'; revBtn.textContent='⏸ Pause' }
})
btnNow.addEventListener('click', ()=>{ setJd(jdFromDate(new Date())) })
btnFocus.addEventListener('click', ()=>{
  follow=!follow
  btnFocus.textContent=`Focus & follow: ${follow?'ON':'OFF'}`
  updateURL()
})
btnOrbit.addEventListener('click', ()=>{
  showOrbit=!showOrbit
  btnOrbit.textContent= showOrbit?'Hide orbit':'Show orbit'
  if(!showOrbit && orbitLine){ scene.remove(orbitLine); orbitLine=null }
  else if(showOrbit && selectedId) drawOrbitFor(selectedId, selectedKind)
})
btnReset.addEventListener('click', ()=>{
  camera.position.set(0,6,4); controls.target.set(0,0,0); controls.update(); follow=false; btnFocus.textContent='Focus & follow: OFF'
})
btnShare.addEventListener('click', async()=>{
  const url=location.href
  try{ await navigator.clipboard.writeText(url); btnShare.textContent='Copied!'; setTimeout(()=>btnShare.textContent='Copy link',1500)}catch{ prompt('Copy link',url)}
})
speedSel.addEventListener('change', updateURL)

// URL deep link
function updateURL(){
  const params=new URLSearchParams()
  params.set('jd', jd.toFixed(4))
  if(selectedId) { params.set('sel', selectedId); params.set('kind', selectedKind) }
  if(filter.q) params.set('q', filter.q)
  if(filter.cls) params.set('cls', filter.cls)
  if(filter.pha) params.set('pha','1')
  if(filter.risk) params.set('risk','1')
  if(follow) params.set('follow','1')
  if(!chkComets.checked) params.set('nocomets','1')
  const cam=`${camera.position.x.toFixed(3)},${camera.position.y.toFixed(3)},${camera.position.z.toFixed(3)},${controls.target.x.toFixed(3)},${controls.target.y.toFixed(3)},${controls.target.z.toFixed(3)}`
  params.set('cam', cam)
  params.set('speed', speedSel.value)
  history.replaceState(null,'','?'+params.toString())
}
function loadURL(){
  const p=new URLSearchParams(location.search)
  if(p.has('jd')) jd=parseFloat(p.get('jd'))
  if(p.has('q')){ filter.q=p.get('q'); qEl.value=filter.q }
  if(p.has('cls')){ filter.cls=p.get('cls'); fClassEl.value=filter.cls }
  if(p.has('pha')){ filter.pha=true; document.querySelector('[data-toggle="pha"]').classList.add('active') }
  if(p.has('risk')){ filter.risk=true; document.querySelector('[data-toggle="risk"]').classList.add('active') }
  if(p.has('nocomets')) chkComets.checked=false
  if(p.has('speed')) speedSel.value=p.get('speed')
  if(p.has('follow')) follow=p.get('follow')==='1'
  if(p.has('cam')){
    const parts=p.get('cam').split(',').map(Number)
    if(parts.length===6 && parts.every(v=>!isNaN(v))){
      camera.position.set(parts[0],parts[1],parts[2])
      controls.target.set(parts[3],parts[4],parts[5])
    }
  }
  if(p.has('sel')){
    selectedId=p.get('sel'); selectedKind=p.get('kind')||'asteroid'
  }
  btnFocus.textContent=`Focus & follow: ${follow?'ON':'OFF'}`
}

// load data
async function load(){
  const [planetsData, asteroidsData, cometsData, sentryData, closeData] = await Promise.all([
    fetch('data/planets.json').then(r=>r.json()),
    fetch('data/asteroids.json').then(r=>r.json()),
    fetch('data/comets.json').then(r=>r.json()),
    fetch('data/sentry.json').then(r=>r.json()),
    fetch('data/close-approaches.json').then(r=>r.json()),
  ])
  planets=planetsData
  asteroids=asteroidsData
  comets=cometsData
  // build maps
  for(const s of sentryData) sentryMap.set(s.des, s)
  for(const ca of closeData){
    if(!closeMap.has(ca.des)) closeMap.set(ca.des, [])
    closeMap.get(ca.des).push(ca)
  }
  initScene()
  loadURL()
  // need distances before filter
  distances=new Array(asteroids.length)
  distToEarth=new Array(asteroids.length)
  setJd(jd) // triggers updatePositions -> applyFilters
  // restore selection after init
  if(selectedId){
    if(selectedKind==='asteroid' && asteroids.some(a=>a.pdes===selectedId)) selectAsteroid(selectedId)
    else if(selectedKind==='comet' && comets.some(c=>c.pdes===selectedId)) selectComet(selectedId)
    else if(selectedKind==='planet') selectPlanet(selectedId)
  }
  onResize()
}

function initScene(){
  // planets meshes + orbits
  for(const p of planets){
    const radius = Math.max(0.03, Math.min(0.18, Math.log10(p.radius_km)*0.03)) // scaled
    const geo=new THREE.SphereGeometry(radius, 16, 16)
    const mat=new THREE.MeshStandardMaterial({ color: planetColors[p.name]||0xffffff, roughness:0.8 })
    const mesh=new THREE.Mesh(geo, mat)
    scene.add(mesh)
    planetMeshes.push(mesh)
    // orbit line
    const pts=sampleOrbit(p, 180)
    const arr=new Float32Array(pts.length*3)
    for(let i=0;i<pts.length;i++){ arr[i*3]=pts[i].x; arr[i*3+1]=pts[i].z; arr[i*3+2]=pts[i].y }
    const g=new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(arr,3))
    const line=new THREE.Line(g, new THREE.LineBasicMaterial({ color: planetColors[p.name]||0xaaaaaa, transparent:true, opacity:0.35 }))
    scene.add(line)
    planetOrbitLines.push(line)
  }
  // asteroid Points
  asteroidCount=asteroids.length
  const g=new THREE.BufferGeometry()
  asteroidPos=new Float32Array(asteroidCount*3)
  asteroidCol=new Float32Array(asteroidCount*3)
  for(let i=0;i<asteroidCount;i++){
    const col=classColor(asteroids[i].class)
    asteroidCol[i*3]=col.r; asteroidCol[i*3+1]=col.g; asteroidCol[i*3+2]=col.b
  }
  g.setAttribute('position', new THREE.BufferAttribute(asteroidPos,3))
  g.setAttribute('color', new THREE.BufferAttribute(asteroidCol,3))
  const mat=new THREE.PointsMaterial({ size:0.028, vertexColors:true, transparent:true, opacity:0.95, sizeAttenuation:true })
  // improve with alpha
  asteroidPoints=new THREE.Points(g, mat)
  asteroidPoints.frustumCulled=false
  scene.add(asteroidPoints)

  // comets
  cometCount=comets.length
  const cg=new THREE.BufferGeometry()
  cometPos=new Float32Array(cometCount*3)
  cometCol=new Float32Array(cometCount*3)
  for(let i=0;i<cometCount;i++){ cometCol[i*3]=0.42; cometCol[i*3+1]=0.8; cometCol[i*3+2]=1 }
  cg.setAttribute('position', new THREE.BufferAttribute(cometPos,3))
  cg.setAttribute('color', new THREE.BufferAttribute(cometCol,3))
  const cmat=new THREE.PointsMaterial({ size:0.038, vertexColors:true, transparent:true, opacity:0.95, sizeAttenuation:true })
  cometPoints=new THREE.Points(cg,cmat)
  scene.add(cometPoints)
}

// animate
let last=performance.now()
function animate(){
  requestAnimationFrame(animate)
  const now=performance.now()
  const dt=(now-last)/1000
  last=now
  if(playing){
    const speed=parseFloat(speedSel.value)||1
    const djd = dir * speed * dt
    jd += djd
    scrub.value=String(jd)
    updateTimeLabels()
    updatePositions()
    updateDetailDistance()
    if(Math.abs(djd)>0.01){
      // throttle URL update
    }
  }
  controls.enableDamping=true
  // focus & follow
  if(follow && selectedId){
    let pos=null
    if(selectedKind==='planet'){
      const idx=planets.findIndex(p=>p.name===selectedId)
      if(idx>=0) pos=planetMeshes[idx].position.clone()
    } else if(selectedKind==='asteroid'){
      const idx=asteroids.findIndex(a=>a.pdes===selectedId)
      if(idx>=0) pos=new THREE.Vector3(asteroidPos[idx*3], asteroidPos[idx*3+1], asteroidPos[idx*3+2])
    } else if(selectedKind==='comet'){
      const idx=comets.findIndex(c=>c.pdes===selectedId)
      if(idx>=0) pos=new THREE.Vector3(cometPos[idx*3], cometPos[idx*3+1], cometPos[idx*3+2])
    }
    if(pos){
      const offset=camera.position.clone().sub(controls.target)
      controls.target.copy(pos)
      camera.position.copy(pos.clone().add(offset))
    }
  }
  controls.update()
  // hud
  const shown=filteredIndices.length
  hud.innerHTML=`<b>${shown.toLocaleString()}</b> asteroids shown • <b>${cometCount.toLocaleString()}</b> comets • Camera ${camera.position.x.toFixed(2)},${camera.position.y.toFixed(2)},${camera.position.z.toFixed(2)}`
  renderer.render(scene,camera)
}
load().then(()=>{ onResize(); animate() }).catch(e=>{ console.error(e); detailEl.innerHTML='<div style="color:#ff6b6b">Failed to load data: '+e.message+'</div>' })
