const DEG = Math.PI/180;
const RAD = 180/Math.PI;
const K = 0.01720209895; // Gaussian gravitational constant
const MU = K*K; // AU^3 / day^2

function normAngleDeg(a){ a%=360; return a<0?a+360:a; }

function solveKepler(Mdeg,e){
  let M = Mdeg*DEG;
  // initial guess
  let E = M;
  if(e>0.8) E = Math.PI;
  for(let i=0;i<20;i++){
    const f = E - e*Math.sin(E) - M;
    const fp = 1 - e*Math.cos(E);
    const d = f/fp;
    E -= d;
    if(Math.abs(d)<1e-10) break;
  }
  return E; // rad
}

function solveHyperbolic(Mh,e){
  // solve e*sinh H - H = Mh
  // initial guess
  let H = Math.asinh(Mh/e);
  // for large M, log
  if(!isFinite(H)) H = Math.sign(Mh)*Math.log(2*Math.abs(Mh)/e);
  for(let i=0;i<40;i++){
    const sh = Math.sinh(H), ch=Math.cosh(H);
    const f = e*sh - H - Mh;
    const fp = e*ch -1;
    const d = f/fp;
    H -= d;
    if(Math.abs(d)<1e-10) break;
    if(!isFinite(H)) break;
  }
  return H;
}

// core: compute heliocentric ecliptic position in AU for any body
// body expects fields: a,e,i,om,w,ma,epoch,n,per,q,tp (some may be null)
export function positionAt(body, jd){
  const e = body.e;
  // hyperbolic / parabolic (e >= 0.95? treat as elliptic vs hyper via q,tp)
  // If e >= 1, use hyperbolic method from tp/q
  if(e >= 1){
    // compute semi-major a negative from q if needed
    let a = body.a;
    const aValid = a!=null && isFinite(a);
    if(!aValid || a>0) {
      const q = body.q;
      const qValid = q!=null && isFinite(q);
      if(qValid && e!==1) a = q/(1-e);
      else if(qValid) a = -q/0.0005; // parabolic fallback use large -a approx
      else a = -2;
    }
    const tp = body.tp;
    const tpValid = tp!=null && isFinite(tp);
    // fallback to elliptic if tp missing
    if(!tpValid || !isFinite(a) || a===0){
      // deg fallback using ma/n if present
      return positionElliptic(body,jd);
    }
    const dt = jd - tp;
    // n_h = sqrt(mu / (-a)^3)
    const negA = -a; // positive
    if(negA<=0) return positionElliptic(body,jd);
    const n_h = Math.sqrt(MU / (negA*negA*negA)); // rad/day
    const Mh = n_h * dt;
    // parabolic limit e~1: still use hyperbolic with e~1
    const ee = e===1? 1.000001 : e;
    const H = solveHyperbolic(Mh, ee);
    const ch = Math.cosh(H), sh=Math.sinh(H);
    // r = a*(1 - e*cosh H)   (a negative => r positive)
    const r = a*(1 - ee*ch);
    // perifocal coordinates:
    // x = a*(cosh H - e)  -> also negative a, but gives correct sign? Let's use r*cos nu formulation for consistency
    // hyperbolic true anomaly: cos nu = (cosh H - e)/(1 - e cosh H), sin nu = sqrt(e^2-1) sinh H / (1 - e cosh H)
    const denom = 1 - ee*ch;
    const cosNu = (ch - ee)/denom;
    const sinNu = Math.sqrt(ee*ee-1)*sh / denom;
    // x_pf = r*cosNu, y_pf = r*sinNu
    const xpf = r*cosNu;
    const ypf = r*sinNu;
    return rotateToHeliocentric(xpf, ypf, body);
  } else {
    return positionElliptic(body,jd);
  }
}

function positionElliptic(body,jd){
  const a = body.a, e=body.e;
  if(a==null || e==null || !isFinite(a) || !isFinite(e)) return [0,0,0];
  let n = body.n;
  const nValid = n!=null && isFinite(n);
  if(!nValid){
    const perValid = body.per!=null && isFinite(body.per) && body.per!==0;
    if(perValid) n = 360/body.per;
    else n = 0.9856; // fallback
  }
  const d = jd - body.epoch;
  let Mdeg = body.ma + n*d;
  Mdeg = normAngleDeg(Mdeg);
  const E = solveKepler(Mdeg, e);
  const cosE = Math.cos(E), sinE=Math.sin(E);
  const r = a*(1 - e*cosE);
  // true anomaly
  const cosNu = (cosE - e)/(1 - e*cosE);
  const sinNu = Math.sqrt(1-e*e)*sinE/(1 - e*cosE);
  const xpf = r*cosNu;
  const ypf = r*sinNu;
  return rotateToHeliocentric(xpf, ypf, body);
}

function rotateToHeliocentric(xpf, ypf, body){
  const Om = (body.om||0)*DEG;
  const inc = (body.i||0)*DEG;
  const w = (body.w||0)*DEG;
  const cosOm=Math.cos(Om), sinOm=Math.sin(Om);
  const cosI=Math.cos(inc), sinI=Math.sin(inc);
  const cosWNu = Math.cos(w) * (xpf) - Math.sin(w) * (ypf); // actually rotate by w: but we already have xpf,y pf in perifocal where x axis is perihelion.
  // simpler: combine w + nu via xpf,ypf rotation: w rotation applied to pf coords.
  // pf coords already oriented so that x along perihelion, so rotate by w around z before inclination.
  // So: x1 = xpf*cos w - ypf*sin w, y1 = xpf*sin w + ypf*cos w
  const cosW=Math.cos(w), sinW=Math.sin(w);
  const x1 = xpf*cosW - ypf*sinW;
  const y1 = xpf*sinW + ypf*cosW;
  const x = x1*cosOm - y1*sinOm*cosI;
  const y = x1*sinOm + y1*cosOm*cosI;
  const z = y1*sinI;
  return [x,y,z];
}

// generate orbit line points (heliocentric) for visualization
export function orbitPoints(body, steps=128, jdForHyperCenter=null){
  const pts=[];
  const e=body.e;
  if(e<1){
    // sample nu uniformly
    const a=body.a, ecc=e;
    for(let i=0;i<=steps;i++){
      const nu = (i/steps)*Math.PI*2;
      const r = a*(1-ecc*ecc)/(1+ecc*Math.cos(nu));
      const xpf=r*Math.cos(nu), ypf=r*Math.sin(nu);
      const p = rotateToHeliocentric(xpf, ypf, body);
      pts.push(p[0],p[1],p[2]);
    }
  } else {
    // hyperbolic: sample true anomaly near perihelion, limited
    // max nu = acos(-1/e) - epsilon
    let maxNu = Math.acos(-1/Math.max(1.001, e)) * 0.95;
    // for near parabola, limit to ~ 150 deg
    maxNu = Math.min(maxNu, 2.6);
    for(let i=0;i<=steps;i++){
      const t=(i/steps)*2-1; // -1 to 1
      // use non-linear sampling denser near perihelion
      const nu = t*maxNu;
      // r = q*(1+e)/(1+e cos nu)  but q = a*(1-e) negative? better compute q
      let q = body.q;
      if(q==null || !isFinite(q)){
        const a=body.a;
        if(a!=null && isFinite(a)) q = a*(1-e);
        else q=0.5;
      }
      // for hyperbola, r = q*(1+e)/(1+e cos nu) ??? for parabola/hyperbola with perihelion distance
      // General conic: r = p/(1+e cos nu), p = q*(1+e)
      const p = q*(1+e);
      const denom = 1+e*Math.cos(nu);
      if(denom<=0.05) continue;
      const r = p/denom;
      const xpf=r*Math.cos(nu), ypf=r*Math.sin(nu);
      const pt=rotateToHeliocentric(xpf, ypf, body);
      pts.push(pt[0],pt[1],pt[2]);
    }
  }
  return pts;
}

export function jdFromDate(d){
  // d is Date (UTC)
  const y=d.getUTCFullYear(), m=d.getUTCMonth()+1, day=d.getUTCDate();
  const hr=d.getUTCHours(), mn=d.getUTCMinutes(), sc=d.getUTCSeconds()+d.getUTCMilliseconds()/1000;
  // Julian date algorithm
  const a=Math.floor((14-m)/12);
  const yy=y+4800-a;
  const mm=m+12*a-3;
  const jdn = day + Math.floor((153*mm+2)/5) +365*yy + Math.floor(yy/4) - Math.floor(yy/100) + Math.floor(yy/400) -32045;
  const jd = jdn + (hr-12)/24 + mn/1440 + sc/86400;
  return jd;
}
export function dateFromJD(jd){
  // convert JD to Date UTC
  const Z = Math.floor(jd+0.5);
  const F = (jd+0.5)-Z;
  let A=Z;
  if(Z>=2299161){ const alpha=Math.floor((Z-1867216.25)/36524.25); A=Z+1+alpha-Math.floor(alpha/4); }
  const B=A+1524;
  const C=Math.floor((B-122.1)/365.25);
  const D=Math.floor(365.25*C);
  const E=Math.floor((B-D)/30.6001);
  const day = B-D - Math.floor(30.6001*E) + F;
  const month = E<14?E-1:E-13;
  const year = month>2?C-4716:C-4715;
  const dayInt=Math.floor(day);
  const frac=day-dayInt;
  const hrs=Math.floor(frac*24);
  const mins=Math.floor((frac*24 - hrs)*60);
  const secs=Math.floor((((frac*24 - hrs)*60)-mins)*60);
  return new Date(Date.UTC(year, month-1, dayInt, hrs, mins, secs));
}
export function formatDateFromJD(jd){
  const d=dateFromJD(jd);
  const y=d.getUTCFullYear(), m=String(d.getUTCMonth()+1).padStart(2,'0'), day=String(d.getUTCDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
