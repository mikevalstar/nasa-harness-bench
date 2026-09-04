export const K=0.01720209895, DEG=Math.PI/180;
export const toJD=date=>Date.parse(date)/86400000+2440587.5;
export const fromJD=jd=>new Date((jd-2440587.5)*86400000);
export function prepare(o){
 const O=o.om*DEG,w=o.w*DEG,i=o.i*DEG;
 o.basis=[Math.cos(O)*Math.cos(w)-Math.sin(O)*Math.sin(w)*Math.cos(i),Math.sin(O)*Math.cos(w)+Math.cos(O)*Math.sin(w)*Math.cos(i),Math.sin(w)*Math.sin(i),-Math.cos(O)*Math.sin(w)-Math.sin(O)*Math.cos(w)*Math.cos(i),-Math.sin(O)*Math.sin(w)+Math.cos(O)*Math.cos(w)*Math.cos(i),Math.cos(w)*Math.sin(i)];return o;
}
export function position(o,jd){
 let x,y;const e=o.e;
 if(e<1){
  const n=o.n!=null?o.n*DEG:K/Math.pow(o.a,1.5);
  let M=o.ma!=null?o.ma*DEG+n*(jd-o.epoch):n*(jd-o.tp);
  M=((M+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
  let lo=-Math.PI,hi=Math.PI,E=M;
  for(let k=0;k<40;k++){const f=E-e*Math.sin(E)-M;if(Math.abs(f)<1e-12)break;if(f>0)hi=E;else lo=E;const next=E-f/(1-e*Math.cos(E));E=next>lo&&next<hi?next:(lo+hi)/2;}
  x=o.a*(Math.cos(E)-e);y=o.a*Math.sqrt(1-e*e)*Math.sin(E);
 }else if(e>1){
  const a=o.q/(e-1),M=K/Math.pow(a,1.5)*(jd-o.tp);let H=Math.asinh(M/e);
  for(let k=0;k<60;k++){const step=(e*Math.sinh(H)-H-M)/(e*Math.cosh(H)-1);H-=Math.max(-1,Math.min(1,step));if(Math.abs(step)<1e-12)break;}
  x=a*(e-Math.cosh(H));y=a*Math.sqrt(e*e-1)*Math.sinh(H);
 }else{
  const B=K*(jd-o.tp)/Math.sqrt(2*o.q**3),D=2*Math.sinh(Math.asinh(1.5*B)/3);
  x=o.q*(1-D*D);y=2*o.q*D;
 }
 const b=o.basis||prepare(o).basis;return [b[0]*x+b[3]*y,b[1]*x+b[4]*y,b[2]*x+b[5]*y];
}
export function orbit(o,count=240){
 const b=o.basis||prepare(o).basis,limit=o.e<1?Math.PI:Math.acos(-1/o.e)-0.03,p=o.e<1?o.a*(1-o.e*o.e):o.q*(1+o.e),out=[];
 for(let j=0;j<=count;j++){const v=-limit+2*limit*j/count,r=p/(1+o.e*Math.cos(v)),x=r*Math.cos(v),y=r*Math.sin(v);out.push([b[0]*x+b[3]*y,b[1]*x+b[4]*y,b[2]*x+b[5]*y]);}return out;
}
