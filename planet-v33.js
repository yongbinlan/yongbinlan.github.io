/* Original real-time globe, terrain, cities and orbital architecture. No network dependencies. */
(()=>{'use strict';
const canvas=document.querySelector('#planet'),labels=document.querySelector('#planet-labels');
const fallback=()=>{document.querySelector('.scene-fallback').hidden=false;labels.hidden=true;canvas.hidden=true;for(let id of ['zoom-in','zoom-out','reset-world','explore-world'])document.getElementById(id).hidden=true;document.querySelector('.scene-help>span').textContent='下方入口仍可阅读全部项目';};
const gl=new URLSearchParams(location.search).has('read')?null:canvas.getContext('webgl',{alpha:true,antialias:true,preserveDrawingBuffer:true,powerPreference:'low-power'});if(!gl){fallback();return;}
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),unit=a=>{let l=Math.hypot(...a);return a.map(v=>v/l);},add=(a,b)=>a.map((v,i)=>v+b[i]),scale=(a,s)=>a.map(v=>v*s);
function mult(a,b){let o=Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o;}
function look(eye,at){let z=unit(eye.map((v,i)=>v-at[i])),x=unit(cross([0,1,0],z)),y=cross(z,x);return[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];}
function perspective(a,f){let y=1/Math.tan(f/2),n=.1,z=100;return[y/a,0,0,0,0,y,0,0,0,0,(z+n)/(n-z),-1,0,0,2*z*n/(n-z),0];}
const vs=`attribute vec3 p;attribute vec3 n;attribute vec3 c;attribute float e;uniform mat4 vp;uniform mat4 objectMatrix;uniform mat4 lightVP;uniform float yaw;uniform vec3 shift;varying vec3 col;varying vec3 norm;varying vec3 world;varying float emit;varying vec4 lightPos;void main(){float co=cos(yaw),si=sin(yaw);mat3 m=mat3(co,0.,-si,0.,1.,0.,si,0.,co);world=m*(objectMatrix*vec4(p,1.)).xyz+shift;norm=m*mat3(objectMatrix)*n;col=c;emit=e;lightPos=lightVP*vec4(world,1.);gl_Position=vp*vec4(world,1.);}`;
const fs=`precision highp float;varying vec3 col;varying vec3 norm;varying vec3 world;varying float emit;varying vec4 lightPos;uniform vec3 eye;uniform float atmosphere;uniform sampler2D shadowTex;uniform float shadowsEnabled;uniform float seaTime;uniform float waterPass;
float grain(vec3 p){return fract(sin(dot(floor(p*310.),vec3(12.9898,78.233,45.164)))*43758.5453);}
float unpack(vec4 v){return dot(v,vec4(1.,1./256.,1./65536.,1./16777216.));}
float visibility(vec3 N){if(shadowsEnabled<.5)return 1.;vec3 q=lightPos.xyz/lightPos.w*.5+.5;if(q.x<0.||q.x>1.||q.y<0.||q.y>1.)return 1.;float bias=max(.0014,.003*(1.-max(dot(N,normalize(vec3(-.5,1.,.6))),0.)));float v=0.;for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){float depth=unpack(texture2D(shadowTex,q.xy+vec2(float(x),float(y))/700.));v+=q.z-bias<=depth?1.:.52;}return v/9.;}
void main(){vec3 N=normalize(norm),V=normalize(eye-world);float rim=pow(1.-max(dot(N,V),0.),3.);if(atmosphere>.5){float a=pow(1.-abs(dot(N,V)),4.)*.25;gl_FragColor=vec4(.22,.59,.8,a);}else{float d=max(dot(N,normalize(vec3(-.5,1.,.6))),0.);float vis=visibility(N);vec3 light=col*(vec3(.54,.59,.54)+vec3(.17,.16,.14)*max(dot(N,V),0.)+vec3(.47,.43,.37)*d*vis)+vec3(.055,.07,.085)*rim;float texture=grain(world)-.5;light*=1.+texture*.05;if(waterPass>.5){
 float a=world.x*29.+world.z*19.+sin(world.y*13.+world.z*6.-seaTime*.32)*1.5-seaTime*1.15;
 float b=world.z*34.-world.y*21.+sin(world.x*9.+seaTime*.25)-seaTime*.78;
 float crest=smoothstep(.88,.998,sin(a))*(.40+.60*smoothstep(-.45,.8,sin(b*.31)));
 float fine=smoothstep(.95,.999,sin(b))*.24;
 light+=vec3(.105,.135,.115)*(crest+fine)-vec3(.013,.018,.015)*(.5+.5*sin(a));
 }gl_FragColor=vec4(mix(light,col*1.15,emit),1.);}}`;
function shader(type,src){let s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
let pg;try{pg=gl.createProgram();gl.attachShader(pg,shader(gl.VERTEX_SHADER,vs));gl.attachShader(pg,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(pg);if(!gl.getProgramParameter(pg,gl.LINK_STATUS))throw Error('Shader link failed');}catch(e){canvas.dataset.error=e.message;fallback();return;}
gl.useProgram(pg);gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);const U={};for(let k of['vp','objectMatrix','yaw','eye','atmosphere','shift','lightVP','shadowTex','shadowsEnabled','seaTime','waterPass'])U[k]=gl.getUniformLocation(pg,k);const A=['p','n','c','e'].map(k=>gl.getAttribLocation(pg,k));
let data=[],frameBasis=null;const color=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)/255);
const P=v=>frameBasis?add(frameBasis.o,add(scale(frameBasis.x,v[0]),add(scale(frameBasis.y,v[1]),scale(frameBasis.z,v[2])))):v;
const N=v=>frameBasis?add(scale(frameBasis.x,v[0]),add(scale(frameBasis.y,v[1]),scale(frameBasis.z,v[2]))):v;
function tri(a,b,c,n,col,emit=0){const C=typeof col==='string'?color(col):col;for(let v of[a,b,c])data.push(...P(v),...N(n),...C,emit);}
function quad(a,b,c,d,n,col,e=0){tri(a,b,c,n,col,e);tri(a,c,d,n,col,e);}
function box(x,y,z,w,h,d,col,e=0){
const H=[w/2,h/2,d/2],C=[x,y,z],r=Math.min(w,h,d)*.18,Q=v=>v.map((v,i)=>v+C[i]);
for(let a=0;a<3;a++)for(let sg of[-1,1]){let b=(a+1)%3,c=(a+2)%3,pts=[];for(let [u,v] of[[-1,-1],[1,-1],[1,1],[-1,1]]){let p=[0,0,0];p[a]=sg*H[a];p[b]=u*(H[b]-r);p[c]=v*(H[c]-r);pts.push(Q(p));}let n=[0,0,0];n[a]=sg;quad(...pts,n,col,e);}
for(let a=0;a<3;a++)for(let b=a+1;b<3;b++){let c=3-a-b;for(let sa of[-1,1])for(let sb of[-1,1]){let pts=[];for(let [end,side] of[[-1,0],[1,0],[1,1],[-1,1]]){let p=[0,0,0];p[a]=sa*(H[a]-(side?r:0));p[b]=sb*(H[b]-(side?0:r));p[c]=end*(H[c]-r);pts.push(Q(p));}let n=[0,0,0];n[a]=sa;n[b]=sb;quad(...pts,unit(n),col,e);}}
for(let sx of[-1,1])for(let sy of[-1,1])for(let sz of[-1,1]){let sg=[sx,sy,sz],pts=[];for(let a=0;a<3;a++)pts.push(Q(H.map((h,i)=>sg[i]*(h-(i===a?0:r)))));tri(...pts,unit(sg),col,e);}}
function cyl(x,y,z,r,h,col,top=r,sides=20,e=0){for(let i=0;i<sides;i++){let a=i*Math.PI*2/sides,b=(i+1)*Math.PI*2/sides,m=(a+b)/2,p=[x+r*Math.cos(a),y,z+r*Math.sin(a)],q=[x+r*Math.cos(b),y,z+r*Math.sin(b)],u=[x+top*Math.cos(a),y+h,z+top*Math.sin(a)],v=[x+top*Math.cos(b),y+h,z+top*Math.sin(b)];quad(p,q,v,u,unit([Math.cos(m),(r-top)/h,Math.sin(m)]),col,e);tri([x,y+h,z],u,v,[0,1,0],col,e);}}
function sphere(x,y,z,r,col,rings=12,sides=20,hemi=false){let C=typeof col==='string'?color(col):col;
function vertex(t,f){let n=[Math.sin(t)*Math.cos(f),Math.cos(t),Math.sin(t)*Math.sin(f)];data.push(...P([x+r*n[0],y+r*n[1],z+r*n[2]]),...N(n),...C,0);}
for(let j=0;j<rings;j++)for(let i=0;i<sides;i++){let a=j/rings*Math.PI/(hemi?2:1),b=(j+1)/rings*Math.PI/(hemi?2:1),u=i/sides*Math.PI*2,v=(i+1)/sides*Math.PI*2;for(let q of[[a,u],[b,u],[b,v],[a,u],[b,v],[a,v]])vertex(...q);}}
function tube(points,r,col,e=0,sides=6){for(let i=0;i<points.length-1;i++){let p=points[i],q=points[i+1],d=unit(q.map((v,k)=>v-p[k])),u=unit(cross(d,Math.abs(d[1])<.9?[0,1,0]:[1,0,0])),v=cross(d,u);for(let j=0;j<sides;j++){let a=j*Math.PI*2/sides,b=(j+1)*Math.PI*2/sides,n=add(scale(u,Math.cos((a+b)/2)),scale(v,Math.sin((a+b)/2))),off=t=>add(scale(u,Math.cos(t)*r),scale(v,Math.sin(t)*r));quad(add(p,off(a)),add(q,off(a)),add(q,off(b)),add(p,off(b)),n,col,e);}}}
function buffer(){let b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);let out={b,count:data.length/10};data=[];return out;}

const R=3.15,domains=window.ATLAS_DATA.domains;
const emit=(name,detail)=>window.dispatchEvent(new CustomEvent(name,{detail}));
let seed=222;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function relief(d,x,z){
 const g=(cx,cz,w,h)=>h*Math.exp(-((x-cx)**2+(z-cz)**2)/(w*w));
 return g(-1.9,-1.35,.82,.25)+g(1.95,-1.25,.75,.33)+g(.15,2.6,.86,.22)+g(-2.6,.45,.62,.15)+g(-.55,-2.05,.70,.52)+g(.60,-2.30,.85,.38);
}
function groundHeight(d,n){const [x,z]=coords(d,n),t=Math.hypot(x,z)/radius(d,Math.atan2(z,x));const coast=clamp((1-t)/.22,0,1);return .028+coast*(.09+relief(d,x,z))}
function terrainAt(n){if(domains.some(d=>!d.center))return .11;for(const d of domains)if(d.basis&&inside(d,n))return groundHeight(d,n);return .028}
function surface(n,h=0){return scale(n,R+terrainAt(n)+h)}
function basisN(n,h=0){const x=unit(cross(Math.abs(n[1])>.99?[0,0,1]:[0,1,0],n));return{o:surface(n,h),x,y:n,z:cross(x,n)}}
function local(d,x,z){return unit(add(d.center,add(scale(d.basis.x,x/R),scale(d.basis.z,z/R))))}
function coords(d,n){const k=dot(n,d.center);return k>0?[R*dot(n,d.basis.x)/k,R*dot(n,d.basis.z)/k]:[100,100]}
// Organic continents stop before their spherical Voronoi boundary: separate coastlines even when lifted.
function radius(d,a){const direction=add(scale(d.basis.x,Math.cos(a)),scale(d.basis.z,Math.sin(a)));let limit=Infinity;for(const other of domains){if(other===d)continue;const den=dot(direction,other.center);if(den>1e-6)limit=Math.min(limit,R*(1-dot(d.center,other.center))/den)}return Math.min(4.4*(1+.06*Math.sin(a*3+d.i)+.04*Math.cos(a*5-d.i*2)),limit*(.87-.085*(.5+.5*Math.sin(a*3+d.i*.8))-.030*(.5+.5*Math.cos(a*7+d.i))))}
function inside(d,n,margin=0){const [x,z]=coords(d,n);return Math.hypot(x,z)<radius(d,Math.atan2(z,x))-margin}
function makeLand(d){
 const rings=42,sides=100;
 const vertex=(j,i)=>{const a=i/sides*Math.PI*2,t=j/rings,rad=radius(d,a)*t,n=local(d,Math.cos(a)*rad,Math.sin(a)*rad);return {n,p:scale(n,R+groundHeight(d,n)),x:Math.cos(a)*rad,z:Math.sin(a)*rad}};
 for(let r=0;r<rings;r++)for(let k=0;k<sides;k++){
  const a=vertex(r,k),b=vertex(r+1,k),c=vertex(r+1,k+1),e=vertex(r,k+1);
  const hill=relief(d,a.x,a.z),m=.025*Math.sin(a.x*3.8+a.z*2.1)+.018*Math.cos(a.z*4.2-a.x);
  const base=r>=rings-1?color('#e1d2aa'):color(d.locked?'#becfa0':hill>.16?'#9fc979':'#b2d884');
  const col=base.map(v=>clamp(v+m,0,1));
  for(const vs of [[a,b,c],[a,c,e]]){let n=unit(cross(vs[1].p.map((v,i)=>v-vs[0].p[i]),vs[2].p.map((v,i)=>v-vs[0].p[i])));if(!Number.isFinite(n[0]))n=a.n;if(dot(n,a.n)<0)n=scale(n,-1);tri(vs[0].p,vs[1].p,vs[2].p,n,col)}
 }
 const coast=[];for(let k=0;k<=160;k++){const a=k/160*Math.PI*2,rad=radius(d,a);coast.push(scale(local(d,Math.cos(a)*rad,Math.sin(a)*rad),R+.032))}tube(coast,.009,'#e3d8b6',0,5);
}
const placements=[[[-.94,-1.30],[.80,-.35],[0,.90]],[[-.94,-1.36],[.83,-.55],[-.78,.83],[.82,.83]],[[-.94,-1.30],[.84,-.38],[0,.90]],[[-.94,-1.30],[.86,-.38],[0,.90]]];
domains.forEach((d,i)=>{d.i=i;const lat=(i===4?-67:22)*Math.PI/180,lon=(i===4?45:i*90)*Math.PI/180;d.center=[Math.sin(lon)*Math.cos(lat),Math.sin(lat),Math.cos(lon)*Math.cos(lat)];d.basis=basisN(d.center);d.lift=0;d.systems.forEach((s,j)=>{[s.x,s.z]=placements[i][j];s.domainId=d.id;s.n=local(d,s.x,s.z);s.npcN=local(d,s.x+(s.x>0?-.55:.55),s.z+.42);s.go=[s.x-.03,s.z+.58]});});


function roof(x,y,z,w,d,h,col){let a=w/2,b=d/2;quad([x-a,y,z-b],[x-a,y,z+b],[x,y+h,z+b],[x,y+h,z-b],unit([-h,a,0]),col);quad([x,y+h,z-b],[x,y+h,z+b],[x+a,y,z+b],[x+a,y,z-b],unit([h,a,0]),col);tri([x-a,y,z+b],[x+a,y,z+b],[x,y+h,z+b],[0,0,1],'#e0c9a2');tri([x+a,y,z-b],[x-a,y,z-b],[x,y+h,z-b],[0,0,-1],'#bda67c');}
function windows(x,y,z,count,w=.8,height=.22){for(let k=0;k<count;k++){let xx=x-w/2+w*(k+.5)/count;box(xx,y,z,w/count*.68,height,.03,'#294658');box(xx,y,z+.02,w/count*.48,height*.82,.012,'#c1dbe0',.16);box(xx,y,z+.035,.018,height,.02,'#e8dabd');}}
function stair(x,y,z,w,n=5){for(let k=0;k<n;k++)box(x,y+k*.038,z-k*.075,w,.07,.11,'#c9b692');}
function pine(x,y,z,h=.5){cyl(x,y,z,.027,h*.40,'#88715b',.024,8);for(let [k,r] of[[.36,.28],[.58,.23],[.78,.16]])sphere(x,y+h*k,z,h*r,k>.6?'#a9d365':'#70af58',8,12);}
function tree(x,y,z,h=.5){cyl(x,y,z,.033,h*.58,'#94735a',.027,8);sphere(x,y+h*.71,z,h*.31,'#93bc65',9,14);sphere(x-h*.21,y+h*.55,z+.05,h*.23,'#c0d991',8,12);sphere(x+h*.20,y+h*.58,z-.045,h*.23,'#73a365',8,12);}
function bench(x,z,turn=0){for(let xx of[-.12,.12])box(x+xx,.11,z,.035,.16,.18,'#667871');for(let zz of[-.065,0,.065])box(x,.19,z+zz,.34,.04,.046,'#c5a27b');box(x,.31,z-.10,.36,.14,.035,'#c5a27b');}
function lamp(x,z){cyl(x,.10,z,.018,.50,'#466366',.015,8);box(x,.63,z,.10,.14,.10,'#ffe2ae',.22);cyl(x,.71,z,.09,.07,'#65857a',.015,12);}
function planter(x,z){box(x,.19,z,.26,.13,.16,'#ceb192');for(let k of[-.08,0,.08]){sphere(x+k,.30,z,.055,'#a5c78a',6,10);sphere(x+k,.34,z,.034,k?'#e5bb9b':'#d6a0be',6,8);}}
function awning(x,y,z){for(let k=0;k<8;k++){box(x+(k-3.5)*.12,y,z,.117,.06,.39,k%2?'#f3e2c4':'#d88e70');sphere(x+(k-3.5)*.12,y-.015,z+.185,.059,k%2?'#f3e2c4':'#d88e70',6,10);}}
function fence(x,z,w){for(let k=0;k<=5;k++){let xx=x-w/2+w*k/5;box(xx,.15,z,.034,.27,.035,'#ddc8a6');}box(x,.13,z,w,.025,.032,'#c8b38f');box(x,.23,z,w,.025,.032,'#c8b38f');}
function flower(x,z){cyl(x,.02,z,.07,.055,'#6c7d50',.08,6);sphere(x,.11,z,.055,'#dda7a6',4,6);}

function house(type,n,importance=1,height=1,landmark=false){const s={id:type};frameBasis=basisN(n,.035);for(const k of ['x','y','z'])frameBasis[k]=scale(frameBasis[k],.56*importance*(k==='y'?height:1));
// A tall civic landmark and lower supporting buildings make each town readable at globe scale.

// Uneven stone foundation: real vertical faces under a landscaped terrace.
cyl(0,-.14,0,.88,.19,'#77877c',.83,13);cyl(0,.05,0,.85,.06,'#d5c9ab',.84,20);cyl(0,.11,0,.78,.045,'#b6cc91',.78,20);
for(let k=0;k<7;k++){let a=k/7*6.283;box(Math.cos(a)*.69,.17,Math.sin(a)*.69,.12,.05,.13,'#d2c5a3');}
if(s.id==='commerce'){
box(0,.58,0,.95,.86,.68,'#ffe7b9');box(0,.2,0,1.06,.14,.77,'#a98b66');roof(0,1.01,0,1.19,.92,.45,'#ea9b62');box(.3,1.39,-.18,.13,.52,.15,'#cbad89');windows(0,.72,.357,3,.83,.23);box(0,.37,.37,.2,.41,.035,'#42635d');box(0,.64,.54,.96,.07,.4,'#d09161');for(let x of[-.45,.45])cyl(x,.15,.66,.024,.52,'#e7d7ba',.024,6);stair(0,.02,.9,.46);fence(0,-.72,1.2);flower(-.6,.5);flower(.58,.48);box(-.5,.29,.64,.22,.16,.22,'#a07951');}
if(s.id==='delivery'){
box(-.13,.7,-.04,.69,1.10,.66,'#f0f4dd');box(.38,.46,.09,.35,.62,.52,'#79c9c4');box(-.13,1.28,-.04,.83,.10,.8,'#558bb3');box(-.13,1.36,-.04,.69,.08,.65,'#a7bec2');for(let y of[.4,.7,1.0])windows(-.13,y,.306,3,.58,.20);for(let y of[.35,.59])windows(.38,y,.36,1,.23,.13);box(.2,1.5,-.2,.33,.035,.34,'#4c7c96');cyl(-.33,1.37,-.2,.018,.45,'#d5dfd5',.018,6);sphere(-.33,1.84,-.2,.046,'#dceacb',5,8);for(let x of[-.42,-.12,.18]){box(x,.26,.59,.18,.21,.14,'#385163');for(let yy of[.23,.29])box(x,yy,.67,.11,.016,.015,'#b8eadb',.45);}stair(.15,.02,.91,.5);}
if(s.id==='studio'){
box(0,.55,0,1.02,.79,.77,'#f5c7d7');roof(0,.99,0,1.2,.96,.40,'#9f91c5');box(0,.58,.40,.74,.43,.025,'#3b4159');box(0,.58,.42,.62,.32,.02,'#b4c3d0',.1);for(let x of[-.58,.58]){cyl(x,.12,.42,.024,.75,'#657775',.024,6);box(x,.94,.42,.17,.13,.14,'#e9d6ac');}box(.28,1.37,0,.23,.15,.2,'#334756');sphere(.24,1.52,0,.11,'#8d9b9c',6,10);sphere(.4,1.5,0,.085,'#708385',6,10);stair(0,.01,.9,.58);flower(-.65,.2);}
if(s.id==='toolbox'){
box(0,.5,0,1.1,.7,.75,'#fff0c9');roof(0,.91,0,1.28,.98,.37,'#54bda0');box(.36,1.18,-.16,.16,.48,.16,'#9a927b');windows(-.26,.59,.39,2,.45,.27);box(.3,.42,.4,.32,.5,.03,'#496156');box(-.13,.98,.50,.58,.25,.09,'#355653');box(-.13,.98,.555,.4,.025,.014,'#d4dcad',.25);box(0,.28,.66,.68,.16,.25,'#a07c51');for(let x of[-.25,0,.25])box(x,.43,.66,.11,.13,.1,'#bfb687');fence(0,-.68,1.3);stair(.3,.01,.9,.42);}
if(s.id==='research'){
cyl(0,.15,0,.47,.77,'#ffedc8',.47,24);cyl(0,.91,0,.54,.1,'#6c8192',.54,28);sphere(0,1.02,0,.53,'#92ccdf',12,28,true);box(0,1.35,.32,.15,.19,.73,'#526d86');box(0,1.35,.68,.22,.24,.07,'#d6e3db');box(0,.45,.48,.23,.55,.025,'#476476');for(let x of[-.31,.31])box(x,.7,.38,.13,.16,.025,'#6e9da8',.15);stair(0,.01,.88,.47);fence(0,-.7,1.25);}

if(s.id==='commerce'){awning(0,.65,.53);for(let x of[-.26,.02,.29]){box(x,.23,.64,.20,.15,.22,'#af8b61');for(let j=0;j<3;j++)sphere(x+(j-1)*.05,.34,.64,.041,j%2?'#deb06c':'#a8bc78',6,8);}planter(-.58,.23);}
if(s.id==='delivery'){for(let i=0;i<3;i++){box(.18+i*.13,1.53,-.17,.10,.025,.27,'#305b70');box(.18+i*.13,1.55,-.17,.085,.01,.235,'#80adb9');}box(.53,.22,.64,.34,.12,.19,'#b6cfd2');for(let xx of[.43,.63])for(let zz of[.55,.73])sphere(xx,.14,zz,.045,'#455b5e',6,10);box(.6,.34,.64,.17,.14,.18,'#e0ebe3');}
if(s.id==='studio'){box(0,.6,.438,.48,.26,.02,'#728fa0');tri([-.07,.49,.452],[-.07,.70,.452],[.12,.60,.452],[0,0,1],'#fff0cb',.15);planter(-.48,.65);planter(.48,.65);}
if(s.id==='toolbox'){cyl(.35,1.25,.29,.16,.06,'#ddb775',.16,12);for(let j=0;j<8;j++){let a=j*Math.PI/4;box(.35+Math.cos(a)*.15,1.30,.29+Math.sin(a)*.15,.07,.08,.07,'#ddb775');}planter(-.53,.57);}
if(s.id==='research'){for(let j=0;j<12;j++){let a=j/12*Math.PI*2;box(Math.cos(a)*.52,.98,Math.sin(a)*.52,.035,.12,.035,'#e8e7d5');}sphere(-.48,.20,.35,.10,'#91b9b7',8,12);}
if(landmark&&type==='commerce'){
 box(-.26,1.53,-.23,.35,.75,.35,'#ffe8bf');windows(-.26,1.61,-.041,1,.22,.22);
 roof(-.26,1.94,-.23,.47,.45,.38,'#507e6c');cyl(-.26,2.30,-.23,.018,.19,'#d9b474',.008,8);sphere(-.26,2.50,-.23,.04,'#f2d995',6,10);
}
if(landmark&&type==='studio'){
 box(.33,1.43,-.22,.30,.67,.32,'#ebc1cd');windows(.33,1.46,-.05,1,.18,.24);
 roof(.33,1.80,-.22,.44,.44,.37,'#8172a6');cyl(.33,2.15,-.22,.016,.20,'#d4b181',.01,6);
}
if(landmark&&type==='delivery'){
 box(-.13,1.67,-.04,.67,.70,.64,'#f1eed7');for(let y of[1.51,1.80])windows(-.13,y,.294,3,.56,.18);
 box(-.13,2.07,-.04,.80,.10,.77,'#497f99');box(-.13,2.15,-.04,.63,.07,.60,'#a9cbd0');
}
if(landmark&&type==='research'){
 // Slender side telescope tower echoes the observatory dome rather than introducing a new style.
 cyl(-.42,.20,-.27,.20,1.49,'#ffe5b5',.18,16);cyl(-.42,1.67,-.27,.25,.08,'#628894',.25,20);
 sphere(-.42,1.76,-.27,.25,'#9eced8',8,18,true);cyl(-.42,2.01,-.27,.015,.23,'#d9b978',.008,8);
}
bench(-.37,-.64);lamp(.67,.47);tree(.62,.15,-.45,.32);planter(-.65,.39);
frameBasis=null;}


const sceneryStats={version:33,domains:[],trees:0,flowers:0,buildings:[]};
function at(d,x,z,fn,h=0){frameBasis=basisN(local(d,x,z),h);fn();frameBasis=null}
function daisy(x,z,tint='#fff6d3',size=1){
 for(let i=0;i<5;i++){const a=i*Math.PI*2/5;sphere(x+Math.cos(a)*.026*size,.041,z+Math.sin(a)*.026*size,.023*size,tint,3,5)}
 sphere(x,.055,z,.017*size,'#f4cb62',4,6);sceneryStats.flowers++;
}
function groveTree(h=.42,kind=0){
 cyl(.045,.004,.025,h*.31,.006,'#839167',h*.30,10);
 cyl(0,0,0,.027,h*.53,'#987453',.023,6);
 if(kind===2){for(let k=0;k<3;k++)cyl(0,h*(.14+k*.22),0,h*(.30-k*.062),h*.52,k===2?'#a0c36c':k===1?'#82ac5a':'#61924e',.005,6)}
 else{sphere(0,h*.65,0,h*.31,kind===1?'#c9d995':'#9bc175',5,8);sphere(-h*.19,h*.49,.025,h*.23,'#b8ce89',5,8);sphere(h*.20,h*.48,-.024,h*.23,'#82ac6c',5,8);if(kind===1)for(let x of[-.07,.055])sphere(x,h*.70,.10,.029,'#d7a887',4,6)}
 sceneryStats.trees++;
}
function windingPath(d,coords,width=.052){const pts=coords.map(([x,z])=>surface(local(d,x,z),.012));tube(pts,width*1.20,'#c8bd98',0,5);for(let i=0;i<coords.length;i+=2){const[x,z]=coords[i];at(d,x,z,()=>{box(0,.027,0,width*1.8,.024,width*1.20,'#e0d3ac');box(width*1.23,.016,.035,.023,.019,.030,'#b5ad8c')})}}
function park(d){
 // Each stream occupies the new outer park, clear of all entrances, NPCs and the player spawn.
 const stream=[],banks=[[],[]];for(let k=0;k<=42;k++){const t=k/42,x=-1.65+t*3.25,z=1.86+Math.sin(t*5.3+d.i*.3)*.18;
  if(!inside(d,local(d,x,z),.25))continue;stream.push(surface(local(d,x,z),.049));for(let side of[-1,1])banks[(side+1)/2].push(surface(local(d,x,z+side*.09),.049));
 }
 banks.forEach(p=>tube(p,.022,'#ead7a6',0,6));tube(stream,.070,'#79caca',0,8);
 at(d,.0,1.99,()=>{for(let k=0;k<10;k++)box(0,.145,(k-4.5)*.052,.43,.055,.046,'#c9a575');for(let x of[-.20,.20]){box(x,.29,0,.025,.04,.56,'#e2c291');for(let z of[-.25,0,.25])box(x,.21,z,.035,.25,.035,'#b89469')}});
 // Picnic clearing and produce garden, nestled into the coast.
 at(d,-1.82,.72,()=>{cyl(0,.01,0,.29,.024,'#c0d587',.29,18);box(0,.19,0,.27,.045,.22,'#e4c28c');box(0,.095,0,.04,.18,.12,'#98734f');for(let z of[-.18,.18]){box(0,.11,z,.31,.045,.085,'#bc966a');for(let x of[-.1,.1])box(x,.06,z,.035,.10,.055,'#a9855f')}sphere(.06,.245,0,.033,'#e7ae74',4,7);});
 at(d,1.78,-.06,()=>{box(0,.025,0,.42,.065,.50,'#b3996c');for(let z of[-.16,0,.16]){box(0,.065,z,.40,.025,.02,'#d5bd8d');for(let x of[-.13,0,.13]){sphere(x,.10,z,.046,'#81ae5b',5,7);sphere(x,.13,z,.029,'#c8d66f',4,6)}}fence(0,-.29,.51)});
 // A small turquoise pond with stepping stones on the west side.
 at(d,-1.86,-.82,()=>{cyl(0,.005,0,.28,.035,'#eadbb6',.27,20);cyl(0,.042,0,.23,.014,'#8dd7d2',.23,20);for(let k=0;k<7;k++){let a=k/7*6.283;sphere(Math.cos(a)*.25,.066,Math.sin(a)*.25,.047,'#cbd4a9',5,8)}sphere(.04,.082,0,.045,'#9ccf80',4,7)});
 const trail=[];for(let i=0;i<=62;i++){let a=-.7+i/62*Math.PI*1.66,rr=1.62+.16*Math.sin(a*3+d.i*.4);const x=Math.cos(a)*rr,z=Math.sin(a)*rr;if(inside(d,local(d,x,z),.22))trail.push([x,z])}windingPath(d,trail,.044);
 for(let z of[-.5,.4])at(d,1.60,z,()=>{for(let k=0;k<4;k++)daisy(-.1+k*.065,0,d.i%2?'#f1b9c5':'#fff5dc')});
}
sphere(0,0,0,R,'#74b9bb',48,88);const ocean=buffer();
for(const d of domains){
 const initialTrees=sceneryStats.trees,initialFlowers=sceneryStats.flowers;makeLand(d);for(const [i,s] of d.systems.entries()){
 const primary=i===0,importance=primary?1.22:i===1?1.01:.82,height=primary?1.18:i===1?.96:.84;
 s.visualHeight=.035+.56*importance*height*(primary?({commerce:2.54,studio:2.35,delivery:2.22,research:2.25}[s.building]||1.70):({commerce:1.68,studio:1.64,delivery:1.89,research:1.60,toolbox:1.54}[s.building]||1.70));s.footprint=primary?.56:i===1?.49:.42;
 house(s.building,s.n,importance,height,primary);
 sceneryStats.buildings.push({id:s.id,primary,scale:importance,height,visualHeight:s.visualHeight});
 }
 // Retain town layout and its paths: added scenery stays beyond the NPC arrival clearings.
 for(const s of d.systems){const pts=[];for(let k=0;k<=30;k++){const t=k/30;pts.push([s.go[0]*t+Math.sin(t*Math.PI)*.12,s.go[1]*t])}windingPath(d,pts,.061)}
 if(!d.locked)park(d);
 const clear=(x,z)=>Math.hypot(x,z)>.58&&Math.hypot(x,z+1.03)>.44&&d.systems.every(s=>Math.hypot(x-s.x,z-s.z)>(s.footprint+.32)&&Math.hypot(x-(s.x+(s.x>0?-.55:.55)),z-s.z-.42)>.36&&Math.hypot(x-s.go[0],z-s.go[1])>.31);
 // Distribute dense but irregular mixed woodland over the full enlarged land area.
 const clusters=[[-1.82,-1.32],[1.85,-1.24],[.20,2.40],[-2.30,.40],[2.22,.67],[-.70,-2.04],[.65,-2.05]];
 const occupied=[];for(let k=0;k<235;k++){
  const center=clusters[k%clusters.length],angle=rand()*6.283,spread=Math.sqrt(rand())*.63,x=center[0]+Math.cos(angle)*spread,z=center[1]+Math.sin(angle)*spread,rr=Math.hypot(x,z);
  if(!inside(d,local(d,x,z),.18))continue;
  if(!clear(x,z)||occupied.some(p=>Math.hypot(x-p[0],z-p[1])<.26)||(!d.locked&&(z>1.61&&z<2.22||Math.hypot(x+1.82,z-.72)<.39||Math.hypot(x-1.78,z+.06)<.38||Math.hypot(x+1.86,z+.82)<.37))||Math.abs(rr-1.62)<.09)continue;
  occupied.push([x,z]);at(d,x,z,()=>{const h=.25+rand()*.29+(z<-1.7?.10:0);if(k%7===0){sphere(0,.11,0,.15,k%3?'#a9ae8d':'#ba9d91',5,7);sphere(.13,.055,.055,.085,'#c2b5a0',4,6)}else groveTree(h,k%3===0?2:k%8===0?1:0)});
 }
 // Meadows restore the original tiny white and pink flower clusters between the buildings.
 for(let k=0;k<95;k++){const a=rand()*6.283,rr=.48+rand()*(radius(d,a)-.66),x=Math.cos(a)*rr,z=Math.sin(a)*rr;if(!clear(x,z)||(!d.locked&&z>1.64&&z<2.12))continue;at(d,x,z,()=>{for(let j=0;j<3;j++)daisy((j-1)*.048,Math.abs(j-1)*.032,k%3?'#fff7df':'#efbfd0',.65)})}
 if(d.locked){at(d,0,0,()=>{cyl(0,0,0,.54,.05,'#dbd3bc',.54,24);for(let x of[-.42,.42])box(x,.19,0,.045,.34,.05,'#b9a984');for(let y of[.16,.31]){box(0,y,0,.96,.07,.065,'#efe0b5');for(let x of[-.3,0,.3])box(x,y,.038,.1,.07,.01,'#b79566')}box(0,.67,-.12,.46,.30,.09,'#e8e7d7');});}
 else{at(d,0,0,()=>{cyl(0,0,0,.30,.025,'#efdeb9',.30,28);cyl(0,.026,0,.22,.05,'#fff1d1',.22,24);cyl(0,.073,0,.18,.012,'#9cdcd5',.18,24);sphere(0,.18,0,.055,'#b5e2df',7,10);for(let j=0;j<5;j++){const a=j/5*6.283;tube([[0,.18,0],[Math.cos(a)*.07,.20,Math.sin(a)*.07],[Math.cos(a)*.13,.09,Math.sin(a)*.13]],.008,'#d2f3eb',.12,4)}});}
 d.mesh=buffer();sceneryStats.domains.push({id:d.id,trees:sceneryStats.trees-initialTrees,flowers:sceneryStats.flowers-initialFlowers,vertices:d.mesh.count});
}
// Soft orbiting toys frame the lush globe as in the earlier approved miniature world.
for(let i=0;i<9;i++){const a=i/9*Math.PI*2,n=unit([Math.cos(a),Math.sin(a*2)*.60,Math.sin(a)]);frameBasis={...basisN(n),o:scale(n,R+.40)};for(let j=0;j<4;j++)sphere((j-1.5)*.12,0,(j%2)*.04,.12+(j===1||j===2?.035:0),'#fff8e6',7,11);frameBasis=null;}
function toyStar(n){frameBasis={...basisN(n),o:scale(n,R+.64)};for(let j=0;j<10;j++){const a=j*Math.PI/5,b=(j+1)*Math.PI/5,r=j%2?.08:.17,s=j%2?.17:.08;tri([0,.035,0],[Math.cos(a)*r,0,Math.sin(a)*r],[Math.cos(b)*s,0,Math.sin(b)*s],[0,1,0],'#f2d778')}frameBasis=null;}
for(let i=0;i<7;i++)toyStar(unit([Math.cos(i*2.4),Math.sin(i*1.7)*.9,Math.sin(i*2.4)]));
const clouds=buffer();
// Reusable toy spacecraft meshes. Geometry is uploaded once; flights use rigid matrices.
const spaceIdentity=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
function spaceMatrix(p,y,z,size=1){
 y=unit(y);const x=unit(cross(y,z));z=unit(cross(x,y));
 return new Float32Array([...scale(x,size),0,...scale(y,size),0,...scale(z,size),0,...p,1]);
}
frameBasis=null;
// Survey satellite: gold core, ivory frame, gridded blue solar wings and antenna.
box(0,0,0,.23,.26,.22,'#e7c67e');box(0,0,.12,.18,.19,.035,'#fff3d5');
sphere(0,.025,.155,.064,'#75bac6',7,12);
for(const side of[-1,1]){
 box(side*.32,0,0,.48,.25,.037,'#f5e5bd');box(side*.32,0,.023,.43,.205,.018,'#497d98');
 for(let i=0;i<4;i++)box(side*(.13+i*.12),0,.035,.011,.205,.008,'#a9d4d7');
 box(side*.32,0,.036,.43,.012,.008,'#a9d4d7');
}
cyl(0,.13,0,.014,.15,'#e7c67e',.014,8);sphere(0,.30,0,.038,'#fff5d8',6,10);
cyl(0,-.20,0,.055,.06,'#557c79',.055,10);
const satelliteMesh=buffer();
// A rounded little research ship, with a glazed cabin, side pods and amber running lights.
cyl(0,-.06,0,.31,.065,'#e6c987',.35,24);cyl(0,.005,0,.35,.085,'#fff3d8',.22,24);
sphere(0,.11,0,.16,'#83bac1',9,16,true);
for(const side of[-1,1]){box(side*.29,-.005,-.04,.15,.15,.33,'#e4a96b');sphere(side*.29,-.005,.12,.071,'#fff0bd',7,10);}
for(let i=0;i<8;i++){const a=i/8*Math.PI*2;sphere(Math.cos(a)*.29,.048,Math.sin(a)*.29,.023,'#e6c466',5,8);}
const shipMesh=buffer();
// Launch vehicle, made with the same bevels and soft colors as the buildings.
cyl(0,0,0,.105,.37,'#fff2d5',.105,16);cyl(0,.37,0,.105,.17,'#e6a16b',0,16);
cyl(0,.015,0,.112,.055,'#c98555',.112,16);sphere(0,.245,.096,.058,'#e8cc8c',8,12);sphere(0,.245,.13,.042,'#669fab',8,12);
for(let i=0;i<4;i++){const a=i*Math.PI/2,rad=[Math.cos(a),0,Math.sin(a)],tan=[-Math.sin(a),0,Math.cos(a)];
 const q=(r,y,w)=>add(scale(rad,r),add([0,y,0],scale(tan,w)));
 for(const side of[-1,1])tri(q(.09,.21,side*.018),q(.21,-.04,side*.018),q(.09,-.04,side*.018),scale(tan,side),'#dca06c');
 quad(q(.09,.21,-.018),q(.21,-.04,-.018),q(.21,-.04,.018),q(.09,.21,.018),rad,'#edb87c');
}
cyl(0,-.06,0,.062,.06,'#537b79',.087,12);
const rocketMesh=buffer();
cyl(0,-.34,0,.005,.28,'#efb469',.070,12,.55);
cyl(0,-.20,.003,.004,.145,'#fff2b6',.043,10,.75);
const exhaustMesh=buffer();
const orbitalPlanes=[{u:[1,0,0],v:unit([0,.85,-.53]),r:4.48},{u:unit([.91,0,.415]),v:unit([-.20,.86,.44]),r:4.62}];
// One quiet, broken orbit line; it sits in actual 3D space and is occluded by the globe.
const orbitPlane=orbitalPlanes[0];
for(let i=0;i<80;i++){const a=i/80*Math.PI*2,b=a+.021;const at=t=>scale(add(scale(orbitPlane.u,Math.cos(t)),scale(orbitPlane.v,Math.sin(t))),orbitPlane.r);tube([at(a),at(b)],.004,'#b5c6a7',0,4);}
const orbitMesh=buffer();
const flights=[
 {id:'satellite-1',kind:'satellite',plane:0,phase:-.60,period:64,mesh:satelliteMesh,size:1},
 {id:'satellite-2',kind:'satellite',plane:1,phase:3.54,period:83,mesh:satelliteMesh,size:.83},
 {id:'ship-1',kind:'ship',plane:0,phase:2.50,period:92,mesh:shipMesh,size:1.05},
 {id:'ship-2',kind:'ship',plane:1,phase:5.18,period:108,mesh:shipMesh,size:.87}
];
const launches=[{n:unit([-.78,.63,.03]),offset:0,period:22},{n:unit([.82,-.47,.12]),offset:11,period:27}];
let spaceTime=2.4,spaceReadings=[];
const smoothSpace=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
function renderSpacecraft(){
 spaceReadings=[];if(!current)draw(orbitMesh,[0,0,0],spaceIdentity);
 for(const f of flights){const o=orbitalPlanes[f.plane],a=f.phase+spaceTime*Math.PI*2/f.period;
  const radial=unit(add(scale(o.u,Math.cos(a)),scale(o.v,Math.sin(a)))),p=scale(radial,o.r),normal=unit(cross(o.u,o.v));
  const attitude=f.kind==='ship'?unit(add(scale(radial,.50),scale(normal,.86))):radial;
  draw(f.mesh,[0,0,0],spaceMatrix(p,attitude,normal,f.size));
  spaceReadings.push({id:f.id,kind:f.kind,position:p,screen:project(p),angle:a});
 }
 for(let i=0;i<launches.length;i++){const l=launches[i],t=((spaceTime+l.offset)%l.period)/l.period;
  // Dwell, accelerate outward, then shrink away before the next launch resets.
  const ascent=clamp((t-.12)/.72,0,1),radius=3.80+2.30*ascent*ascent;
  const size=smoothSpace(t/.06)*(1-smoothSpace((t-.82)/.15)),p=scale(l.n,radius),z=basisN(l.n).z;
  if(size>.001){draw(rocketMesh,[0,0,0],spaceMatrix(p,l.n,z,size));
   const thrust=smoothSpace((t-.075)/.06)*(1-smoothSpace((t-.84)/.10));
   if(thrust>.001)draw(exhaustMesh,[0,0,0],spaceMatrix(p,l.n,z,size*thrust*(.96+.04*Math.sin(spaceTime*9+i))));
  }
  spaceReadings.push({id:'rocket-'+(i+1),kind:'rocket',position:p,screen:project(p),altitude:radius-R,cycle:t,size});
 }
}


// Tiny maritime dioramas, sized and placed on tested water patches around the whole globe.
frameBasis=null;
function seaOval(x,y,z,rx,ry,rz,col){
 const C=color(col),rows=8,cols=14;
 const vertex=(a,b)=>{const n=[Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b)];data.push(x+rx*n[0],y+ry*n[1],z+rz*n[2],...unit([n[0]/rx,n[1]/ry,n[2]/rz]),...C,0)};
 for(let j=0;j<rows;j++)for(let k=0;k<cols;k++){const a=j/rows*Math.PI,b=(j+1)/rows*Math.PI,u=k/cols*Math.PI*2,v=(k+1)/cols*Math.PI*2;for(const q of[[a,u],[b,u],[b,v],[a,u],[b,v],[a,v]])vertex(...q)}
}
function seaHull(w,l,col){
 const edge=[[-w,-l*.85],[-w*.75,-l],[w*.75,-l],[w,-l*.85],[w,l*.45],[w*.72,l*.80],[0,l],[-w*.72,l*.80],[-w,l*.45]];
 for(let i=0;i<edge.length;i++){const a=edge[i],b=edge[(i+1)%edge.length],n=unit([b[1]-a[1],.25,a[0]-b[0]]);
  quad([a[0]*.72,-.04,a[1]*.90],[b[0]*.72,-.04,b[1]*.90],[b[0],.055,b[1]],[a[0],.055,a[1]],n,col);
  tri([0,.056,0],[a[0],.056,a[1]],[b[0],.056,b[1]],[0,1,0],'#f5dfb3');
 }
}
function seaWindows(y,zs,x){for(const z of zs)box(x,y,z,.009,.024,.037,'#528da2',.06)}
// Cream cruise liner: stacked decks, glazed bridge, twin funnels and rescue boats.
seaHull(.115,.33,'#fff4d9');box(0,.100,-.018,.185,.083,.45,'#fff6de');box(0,.163,-.042,.148,.05,.32,'#fff5db');
box(0,.196,.042,.13,.024,.13,'#81bdc8');box(0,.213,.02,.15,.018,.17,'#fff2d0');
for(const side of[-1,1]){seaWindows(.103,[-.18,-.10,-.02,.06,.14],side*.095);seaWindows(.163,[-.14,-.07,0],side*.077);for(const z of[-.14,-.04])seaOval(side*.105,.148,z,.027,.025,.052,'#eeaa70');}
for(const z of[-.075,-.14]){cyl(0,.19,z,.026,.065,'#e7a56b',.026,10);cyl(0,.25,z,.028,.012,'#607e83',.028,10)}
cyl(0,.2,.14,.008,.11,'#d1b480',.007,6);box(.032,.278,.14,.06,.032,.008,'#eab576');
const cruiseMesh=buffer();
// Cargo carrier: six distinct containers and a cream bridge at the stern.
seaHull(.125,.35,'#507f91');box(0,.108,-.22,.19,.12,.15,'#fff0cd');box(0,.18,-.23,.21,.035,.17,'#e5b874');box(0,.12,-.14,.135,.042,.008,'#70abb9');
const freightColors=['#e6aa7d','#8cbfc3','#e9c778','#9cbaa0','#e1b1a8','#7dabc6'];
for(let j=0;j<3;j++)for(let i=0;i<2;i++){const x=(i-.5)*.098,z=-.04+j*.095,col=freightColors[j*2+i];box(x,.102,z,.09,.089,.086,col);for(let k=0;k<3;k++)box(x+(k-1)*.022,.150,z,.006,.007,.072,'#ead9b4');}
cyl(.05,.195,-.25,.012,.072,'#c29d69',.012,7);const cargoMesh=buffer();
// Friendly whale with cream belly, fins, two eyes, tail flukes and a little water spout.
seaOval(0,.040,.015,.135,.097,.255,'#79aeba');seaOval(0,.005,.075,.117,.052,.199,'#e5efda');
for(const side of[-1,1]){seaOval(side*.140,.024,-.015,.074,.020,.047,'#5e96a8');seaOval(side*.077,.035,-.259,.109,.022,.063,'#76aab5');sphere(side*.113,.083,.143,.014,'#2d565b',6,9);sphere(side*.118,.089,.148,.005,'#fff8dc',5,7);}
const whaleMesh=buffer();
seaOval(0,.045,0,.073,.075,.205,'#82b6c7');seaOval(0,.040,.211,.033,.025,.087,'#86bac9');seaOval(0,.016,.060,.060,.027,.14,'#edf1d9');
for(const side of[-1,1]){seaOval(side*.078,.022,.008,.072,.013,.045,'#6c9eb6');seaOval(side*.064,.018,-.21,.084,.014,.042,'#6c9eb6');sphere(side*.061,.087,.13,.01,'#33576a',5,8);}
tri([-.008,.087,-.065],[0,.195,-.11],[.008,.093,.035],[-1,.15,0],'#6e9fb5');tri([.008,.093,.035],[0,.195,-.11],[-.008,.087,-.065],[1,.15,0],'#82b2c5');
const dolphinMesh=buffer();
seaOval(0,.027,0,.111,.062,.139,'#e3db9f');seaOval(0,.066,-.014,.105,.076,.126,'#81ad6b');
seaOval(0,.132,-.018,.055,.013,.069,'#a9c77b');
for(const side of[-1,1]){sphere(side*.03,.062,.185,.009,'#42654d',5,8);}
seaOval(0,.038,.155,.052,.042,.070,'#b7cd84');for(const side of[-1,1])sphere(side*.03,.064,.187,.008,'#42654d',5,8);
const turtleMesh=buffer();
function seaWake(rx,rz){for(let side of[-1,1]){const pts=[];for(let i=0;i<=16;i++){const a=.30+i/16*2.45;pts.push([Math.sin(a)*rx*side,.006,Math.cos(a)*rz])}tube(pts,.004,'#c6e7d5',.10,4)}}
seaWake(.16,.39);const boatWake=buffer();seaWake(.17,.28);const animalWake=buffer();
const seaKinds={cruise:{mesh:cruiseMesh,wake:boatWake,radius:.43,halfW:.18,halfL:.41,size:.90},cargo:{mesh:cargoMesh,wake:boatWake,radius:.44,halfW:.18,halfL:.41,size:.84},whale:{mesh:whaleMesh,wake:animalWake,radius:.35,halfW:.23,halfL:.35,size:.82},dolphin:{mesh:dolphinMesh,wake:animalWake,radius:.34,halfW:.18,halfL:.32,size:.91},turtle:{mesh:turtleMesh,wake:animalWake,radius:.31,halfW:.22,halfL:.30,size:.92}};
function seaClear(n,r){
 if(domains.some(d=>inside(d,n)))return false;
 const b=basisN(n);for(let i=0;i<14;i++){const a=i/14*Math.PI*2,q=unit(add(n,add(scale(b.x,Math.cos(a)*r/R),scale(b.z,Math.sin(a)*r/R))));if(domains.some(d=>inside(d,q)))return false;}return true;
}
function seaFootprintClear(n,heading,w,l){const b=basisN(n),x=add(scale(b.x,Math.cos(heading)),scale(b.z,-Math.sin(heading))),z=add(scale(b.z,Math.cos(heading)),scale(b.x,Math.sin(heading)));
 for(let i=-2;i<=2;i++)for(let j=-3;j<=3;j++){const q=unit(n.map((v,k)=>v+(x[k]*w*i/2+z[k]*l*j/3)/R));if(domains.some(d=>inside(d,q)))return false;}return true;
}
const seaCandidates=[];for(let i=0;i<4800;i++){const y=1-2*(i+.5)/4800,a=i*Math.PI*(3-Math.sqrt(5)),q=Math.sqrt(1-y*y),n=[Math.sin(a)*q,y,Math.cos(a)*q];if(seaClear(n,.09))seaCandidates.push(n)}
const marine=[];const kindOrder=['cruise','whale','turtle','cargo','dolphin','whale','cruise','turtle','dolphin','cargo','whale','turtle'];
for(let i=0;i<kindOrder.length;i++){
 const kind=kindOrder[i],spec=seaKinds[kind],lon=(45+90*Math.floor(i/3))*Math.PI/180,lat=[56,9,-35][i%3]*Math.PI/180;
 const desired=[Math.sin(lon)*Math.cos(lat),Math.sin(lat),Math.cos(lon)*Math.cos(lat)];
 const candidates=seaCandidates.filter(n=>marine.every(o=>Math.acos(clamp(dot(n,o.n),-1,1))*R>o.footprint+spec.radius*spec.size+.11));
 candidates.sort((a,b)=>dot(b,desired)-dot(a,desired));let found=null;
 for(const n of candidates){for(let turn=0;turn<16;turn++){const heading=i*.91+.35+turn*Math.PI/16,w=spec.halfW*spec.size+.025,l=spec.halfL*spec.size+.025;if([-.04,0,.04].every(a=>seaFootprintClear(n,heading+a,w,l))){found={id:'marine-'+i,kind,n,heading,phase:i*1.73,footprint:spec.radius*spec.size+.04,halfW:w,halfL:l};break;}}if(found)break;}
 if(found)marine.push(found);
}
let marineReadings=[];
// Water-bounded tidal paths are preflighted once; animation shares the global pause clock.
function marinePose(o,t){
 const s=seaKinds[o.kind],b=basisN(o.n),a=o.heading,forward=add(scale(b.z,Math.cos(a)),scale(b.x,Math.sin(a)));
 const period=o.kind==='cruise'||o.kind==='cargo'?24:17;
 const progress=Math.sin(t*Math.PI*2/period+o.phase),distance=o.drift*progress;
 const n=unit(add(o.n,scale(forward,distance/R))),heading=a+.028*Math.sin(t*.55+o.phase);
 return{n,heading,distance};
}
for(const o of marine){o.drift=0;
 const original=o.n,b=basisN(original),forward=add(scale(b.z,Math.cos(o.heading)),scale(b.x,Math.sin(o.heading))),side=add(scale(b.x,Math.cos(o.heading)),scale(b.z,-Math.sin(o.heading)));
 const centers=[original];for(const along of[.12,-.12,.24,-.24])for(const across of[0,.06,-.06])centers.push(unit(add(original,add(scale(forward,along/R),scale(side,across/R)))));
 let best=null;
 for(const center of centers){if(marine.some(other=>other!==o&&Math.acos(clamp(dot(center,other.n),-1,1))*R<o.footprint+other.footprint+.02))continue;
  const cb=basisN(center),f=add(scale(cb.z,Math.cos(o.heading)),scale(cb.x,Math.sin(o.heading)));
  for(const span of[.48,.36,.26,.18,.12,.07,.035]){let valid=true;
   for(let j=0;j<=20&&valid;j++){const n=unit(add(center,scale(f,span*(j/10-1)/R)));for(const turn of[-.03,0,.03])if(!seaFootprintClear(n,o.heading+turn,o.halfW,o.halfL)){valid=false;break;}}
   if(valid){if(!best||span>best.span)best={center,span};break;}
  }
  if(best&&best.span>=.18)break;
 }
 if(best){o.n=best.center;o.drift=best.span;}
}
frameBasis=null;
seaOval(0,0,0,.071,.014,.031,'#a7c981');const paddleMesh=buffer();
sphere(0,0,0,1,'#d2f2e8',5,8);const seaDropMesh=buffer();
function seaJoint(x,y,z,yaw=0,size=1){const c=Math.cos(yaw)*size,s=Math.sin(yaw)*size;return[c,0,-s,0,0,size,0,0,s,0,c,0,x,y,z,1]}
function renderMarine(){marineReadings=[];for(const o of marine){
 const s=seaKinds[o.kind],pose=marinePose(o,spaceTime),n=pose.n,b=basisN(n),heading=pose.heading;
 const z=add(scale(b.z,Math.cos(heading)),scale(b.x,Math.sin(heading)));
 const animal=!['cruise','cargo'].includes(o.kind),cycle=spaceTime*(animal?1.35:.95)+o.phase;
 const jump=o.kind==='dolphin'?.14*Math.pow(Math.max(0,Math.sin(spaceTime*.85+o.phase)),3):0;
 const bob=(animal?.016:.012)*Math.sin(cycle),pitch=(animal?.055:.025)*Math.sin(cycle+.5);
 const up=unit(add(n,scale(z,pitch))),p=scale(n,R+.023+bob+jump),model=spaceMatrix(p,up,z,s.size);
 draw(s.wake,[0,0,0],spaceMatrix(scale(n,R+.016),n,z,s.size*(1+.06*Math.sin(cycle))));
 draw(s.mesh,[0,0,0],model);
 if(o.kind==='turtle')for(const side of[-1,1]){
  draw(paddleMesh,[0,0,0],mult(model,seaJoint(side*.14,.022,.064,side*(.25+.5*Math.sin(spaceTime*2.5+o.phase)))));
  draw(paddleMesh,[0,0,0],mult(model,seaJoint(side*.10,.018,-.12,side*(-.3+.4*Math.sin(spaceTime*2.5+o.phase+1)),.65)));
 }
 if(o.kind==='whale'){
  const breath=(spaceTime+o.phase)%7;
  if(breath<3.7)for(let j=0;j<5;j++){
   const u=(breath*.8+j*.19)%1,side=j%2?1:-1;
   const size=.015*Math.sin(Math.PI*u);
   draw(seaDropMesh,[0,0,0],mult(model,seaJoint(side*.10*u,.14+.27*Math.sin(Math.PI*u*.88),.04+j*.006,0,size)));
  }
 }
 marineReadings.push({id:o.id,kind:o.kind,n,anchor:o.n,position:p,footprint:o.footprint,halfW:o.halfW,halfL:o.halfL,heading,drift:o.drift,distance:pose.distance,jump,screen:project(p)});
}}


for(const d of domains)for(const s of d.systems)s.go=[s.x+(s.x>0?-.53:.53),s.z+(s.z<0?.95:.65)];
const lightMatrix=mult([1/4.8,0,0,0,0,1/4.8,0,0,0,0,-2/29,0,0,0,-31/29,1],look([-6,12,7.2],[0,0,0]));
const shadowTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,shadowTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,768,768,0,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
const depthBuffer=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,depthBuffer);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,768,768);
const shadowFrame=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,shadowFrame);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,shadowTexture,0);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,depthBuffer);
const shadowReady=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;
if(shadowReady){
 const sp=gl.createProgram();gl.attachShader(sp,shader(gl.VERTEX_SHADER,'attribute vec3 p;uniform mat4 m;void main(){gl_Position=m*vec4(p,1.);}'));gl.attachShader(sp,shader(gl.FRAGMENT_SHADER,'precision highp float;void main(){vec4 v=fract(gl_FragCoord.z*vec4(1.,256.,65536.,16777216.));v-=v.yzww*vec4(1./256.,1./256.,1./256.,0.);gl_FragColor=v;}'));gl.linkProgram(sp);if(!gl.getProgramParameter(sp,gl.LINK_STATUS))throw Error('Landscape shadow shader link');
 gl.useProgram(sp);gl.uniformMatrix4fv(gl.getUniformLocation(sp,'m'),false,new Float32Array(lightMatrix));gl.viewport(0,0,768,768);gl.clearColor(1,1,1,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);const pos=gl.getAttribLocation(sp,'p');gl.enableVertexAttribArray(pos);for(const m of[ocean,...domains.map(d=>d.mesh)]){gl.bindBuffer(gl.ARRAY_BUFFER,m.b);gl.vertexAttribPointer(pos,3,gl.FLOAT,false,40,0);gl.drawArrays(gl.TRIANGLES,0,m.count)}gl.deleteProgram(sp);
}
gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.clearColor(0,0,0,0);sceneryStats.directionalShadows=shadowReady;

const avatar=window.createDabinRenderer(gl),crew=window.createCompanionRenderer(gl);
let width=1,height=1,vp=null,eye=null,target=[0,0,0],cam={lon:.28,lat:-.16,distance:18.8},motion=null,active=false,current=null,hover=null,focusSystem=null,paused=false;
let hero=[0,-1.03],route=[],phase=0,moving=false,clock=0,keys=new Set(),drag=null,pointers=new Map(),pinchDistance=0,boxMode=false,last=performance.now();
let labelNodes=new Map(),systemNodes=new Map();labels.innerHTML='';
const layer=document.createElement('div');layer.className='atlas-labels';canvas.parentElement.append(layer);
const selectBox=document.createElement('div');selectBox.className='atlas-selection';selectBox.hidden=true;canvas.parentElement.append(selectBox);
for(const d of domains){const b=document.createElement(d.locked?'span':'button');b.className='continent-label'+(d.locked?' locked':'');b.dataset.domain=d.id;b.innerHTML=`<small>${String(d.i+1).padStart(2,'0')} · ${d.nick}</small><strong>${d.name}</strong><em>${d.locked?'待开发 · 敬请期待':d.systems.length+' 套系统 · 点击探索 ↗'}</em>`;if(!d.locked){b.onmouseenter=()=>setHover(d.id);b.onmouseleave=()=>setHover(null);b.onfocus=()=>setHover(d.id);b.onblur=()=>setHover(null);b.onclick=()=>enter(d.id);}layer.append(b);labelNodes.set(d.id,b);
 for(const s of d.systems){const q=document.createElement('button');q.className='system-label';q.dataset.system=s.id;q.innerHTML=`<span>${s.id.slice(1)}</span><b>${s.short}</b><i>↗</i>`;q.title=d.nick+' · '+s.short+'：点击前往系统';q.onclick=()=>current===d?travel(s.id):enter(d.id,s.id);layer.append(q);systemNodes.set(s.id,q);}
}
function project(p){const v=[0,0,0,0];for(let r=0;r<4;r++)for(let c=0;c<4;c++)v[r]+=vp[c*4+r]*[...p,1][c];const front=v[3]>0&&dot(unit(p),unit(eye))>.18;return{x:(v[0]/v[3]*.5+.5)*width,y:(.5-v[1]/v[3]*.5)*height,front}}
function point(n,d,h=0){return add(surface(n,h),scale(d.center,d.lift))}
function setHover(id){const d=domains.find(d=>d.id===id);hover=d&&!d.locked&&!current?d.id:null;emit('atlashover',{id:hover});}
function resize(){const r=canvas.getBoundingClientRect();width=Math.max(1,r.width);height=Math.max(1,r.height);const ratio=Math.min(devicePixelRatio||1,1.6);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio)}
function animateView(to){if(window.cosmicMotion?.reduced||window.cosmicMotion?.paused){cam={...to.cam};target=to.target.slice();motion=null;return}let lon=to.cam.lon;while(lon-cam.lon>Math.PI)lon-=Math.PI*2;while(lon-cam.lon< -Math.PI)lon+=Math.PI*2;motion={start:performance.now(),from:{cam:{...cam},target:[...target]},to:{cam:{...to.cam,lon},target:to.target}};}
function enter(id,sid=null){const d=domains.find(d=>d.id===id);if(!d||d.locked)return false;if(!active){document.querySelector('#explore-world').click();}current=d;hover=null;keys.clear();hero=[0,-1.03];route=[];moving=false;focusSystem=sid;animateView({target:scale(d.center,2.95),cam:{lon:Math.atan2(d.center[0],d.center[2]),lat:Math.asin(d.center[1])-.70,distance:width<700?9.0:10.8}});emit('atlasmode',{domain:id,system:sid});if(sid)travel(sid);return true}
function overview(){current=null;route=[];moving=false;focusSystem=null;keys.clear();animateView({target:[0,0,0],cam:{lon:.28,lat:-.16,distance:18.8}});emit('atlasmode',{domain:null,system:null})}
function rotateTo(id){const d=domains.find(d=>d.id===id);if(!d)return;current=null;animateView({target:[0,0,0],cam:{lon:Math.atan2(d.center[0],d.center[2]),lat:Math.asin(d.center[1])-.50,distance:18.8}});emit('atlasmode',{domain:null,system:null});}
function safe(x,z){return current&&inside(current,local(current,x,z),.21)&&current.systems.every(s=>Math.hypot(x-s.x,z-s.z)>s.footprint)}
function pathTo(goal){const step=.12,lo=-3.48,count=59,points=[];for(let z=0;z<count;z++)for(let x=0;x<count;x++)points.push({x:lo+x*step,z:lo+z*step,ok:safe(lo+x*step,lo+z*step)});const nearest=p=>points.reduce((b,q,i)=>q.ok&&Math.hypot(q.x-p[0],q.z-p[1])<b.d?{i,d:Math.hypot(q.x-p[0],q.z-p[1])}:b,{i:-1,d:Infinity}).i;const start=nearest(hero),end=nearest(goal);if(start<0||end<0)return[];const open=[start],dist=Array(points.length).fill(Infinity),parent=Array(points.length).fill(-1),done=new Set();dist[start]=0;while(open.length){open.sort((a,b)=>dist[a]+Math.hypot(points[a].x-points[end].x,points[a].z-points[end].z)-dist[b]-Math.hypot(points[b].x-points[end].x,points[b].z-points[end].z));const a=open.shift();if(a===end){const out=[];for(let j=end;j!==start;j=parent[j])out.unshift([points[j].x,points[j].z]);return out}done.add(a);for(const [dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]]){let xx=a%count+dx,zz=Math.floor(a/count)+dz,j=zz*count+xx;if(xx<0||xx>=count||zz<0||zz>=count||!points[j].ok||done.has(j))continue;const v=dist[a]+step;if(v<dist[j]){dist[j]=v;parent[j]=a;if(!open.includes(j))open.push(j)}}}return[]}
function travel(id){const s=current?.systems.find(s=>s.id===id);if(!s)return false;focusSystem=id;route=pathTo(s.go);moving=route.length>0;emit('atlastravel',{id,moving});if(window.cosmicMotion?.reduced&&route.length){hero=route.at(-1);route=[];moving=false;emit('atlasarrive',{id});}else if(!moving){if(Math.hypot(hero[0]-s.go[0],hero[1]-s.go[1])<.25)emit('atlasarrive',{id});else{focusSystem=null;emit('atlasblocked',{id});return false}}return true}
function zoom(delta){cam.distance=clamp(cam.distance+delta,current?7:11,current?15:24);motion=null;return cam.distance}
function hit(x,y){
 const forward=unit(target.map((v,i)=>v-eye[i])),right=unit(cross(forward,[0,1,0])),up=cross(right,forward),f=Math.tan(.51/2)*Math.max(1,1/(width/height*.92));
 const ray=unit(add(forward,add(scale(right,(x/width*2-1)*f*width/height),scale(up,(1-y/height*2)*f))));
 const b=dot(eye,ray),c=dot(eye,eye)-(R+.85)**2,det=b*b-c;if(det<0)return null;
 const start=Math.max(0,-b-Math.sqrt(det)),end=-b+Math.sqrt(det),sample=t=>{const p=add(eye,scale(ray,t)),n=unit(p);return {n,gap:Math.hypot(...p)-R-terrainAt(n)}};
 let prev=start;for(let i=1;i<=56;i++){const t=start+(end-start)*i/56,q=sample(t);if(q.gap<=0){let lo=prev,hi=t;for(let j=0;j<9;j++){let m=(lo+hi)/2;if(sample(m).gap>0)lo=m;else hi=m}const n=sample(hi).n;return {n,domain:domains.find(d=>inside(d,n))}}prev=t}return null;
}
function pickSystem(x,y){let best=null;for(const d of domains){if(d.locked)continue;for(const s of d.systems){const base=project(point(s.n,d,.07)),top=project(point(s.n,d,s.visualHeight)),npc=project(point(s.npcN,d,.40));if(!base.front)continue;const h=Math.max(22,Math.hypot(top.x-base.x,top.y-base.y));const cx=(top.x+base.x)/2,cy=(top.y+base.y)/2,score=Math.hypot(x-cx,y-cy);if((score<h*.65+13||(current===d&&Math.hypot(x-npc.x,y-npc.y)<24))&&(!best||score<best.score))best={d,s,score}}}return best}
function positionEvent(e){const r=canvas.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]}
canvas.addEventListener('pointerdown',e=>{canvas.focus({preventScroll:true});const p=positionEvent(e);pointers.set(e.pointerId,p);canvas.setPointerCapture(e.pointerId);if(pointers.size===2){pinchDistance=Math.hypot(...[...pointers.values()][0].map((v,i)=>v-[...pointers.values()][1][i]));drag=null;return}drag={id:e.pointerId,start:p,last:p,moved:false,box:active&&!current&&(boxMode||e.shiftKey)};motion=null;if(drag.box){selectBox.hidden=false;selectBox.style.cssText=`left:${p[0]}px;top:${p[1]}px;width:0;height:0`;}});
canvas.addEventListener('pointermove',e=>{const p=positionEvent(e);if(pointers.has(e.pointerId))pointers.set(e.pointerId,p);if(pointers.size===2){const a=[...pointers.values()],dd=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]);if(pinchDistance)zoom((pinchDistance-dd)*.025);pinchDistance=dd;return}if(drag){const dx=p[0]-drag.last[0],dy=p[1]-drag.last[1];drag.moved||=Math.hypot(p[0]-drag.start[0],p[1]-drag.start[1])>5;if(drag.box){selectBox.style.left=Math.min(p[0],drag.start[0])+'px';selectBox.style.top=Math.min(p[1],drag.start[1])+'px';selectBox.style.width=Math.abs(p[0]-drag.start[0])+'px';selectBox.style.height=Math.abs(p[1]-drag.start[1])+'px';}else{cam.lon-=dx*.007;cam.lat=clamp(cam.lat+dy*.006,-1.42,1.42)}drag.last=p;setHover(null);}else if(!current){setHover(hit(...p)?.domain?.id);}});
function release(e){const p=positionEvent(e);pointers.delete(e.pointerId);if(pointers.size<2)pinchDistance=0;if(!drag||drag.id!==e.pointerId)return;const d=drag;drag=null;selectBox.hidden=true;if(e.type==='pointercancel')return;if(d.box&&d.moved){const rect={l:Math.min(p[0],d.start[0]),r:Math.max(p[0],d.start[0]),t:Math.min(p[1],d.start[1]),b:Math.max(p[1],d.start[1])};const choices=domains.filter(c=>!c.locked).filter(c=>{const q=project(point(c.center,c,.08));return q.front&&q.x>=rect.l&&q.x<=rect.r&&q.y>=rect.t&&q.y<=rect.b});if(choices.length){setHover(choices[0].id);emit('atlasbox',{ids:choices.map(c=>c.id)});}else emit('atlasbox',{ids:[]});}else if(!d.moved){const chosen=pickSystem(...p);if(chosen){if(current===chosen.d)travel(chosen.s.id);else enter(chosen.d.id,chosen.s.id);return}const h=hit(...p);if(!h)return;if(current&&h.domain&&h.domain!==current){if(!h.domain.locked)enter(h.domain.id);return}if(current){const q=coords(current,h.n);if(safe(...q)){route=pathTo(q);moving=route.length>0;focusSystem=null;}}else if(h.domain&&!h.domain.locked)enter(h.domain.id);} }
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('pointerleave',()=>{if(!drag)setHover(null)});canvas.addEventListener('wheel',e=>{if(active){e.preventDefault();zoom(e.deltaY*.008)}},{passive:false});
document.addEventListener('keydown',e=>{if(!active||document.querySelector('dialog[open]')||e.target.matches('input,textarea,select,button'))return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){e.preventDefault();keys.add(k);route=[];focusSystem=null;}if(k==='e'&&current){const s=current.systems.reduce((best,s)=>Math.hypot(hero[0]-s.go[0],hero[1]-s.go[1])<best.dist?{s,dist:Math.hypot(hero[0]-s.go[0],hero[1]-s.go[1])}:best,{s:null,dist:Infinity});if(s.dist<.65)emit('atlasarrive',{id:s.s.id});}});document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());
function draw(buf,shift=[0,0,0],model=null){gl.useProgram(pg);gl.uniformMatrix4fv(U.vp,false,new Float32Array(vp));gl.uniformMatrix4fv(U.objectMatrix,false,model||spaceIdentity);gl.uniform1f(U.yaw,0);gl.uniform1f(U.atmosphere,0);gl.uniform1f(U.seaTime,spaceTime);gl.uniform1f(U.waterPass,buf===ocean?1:0);gl.uniform1f(U.shadowsEnabled,shadowReady&&!model?1:0);gl.uniformMatrix4fv(U.lightVP,false,new Float32Array(lightMatrix));gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,shadowTexture);gl.uniform1i(U.shadowTex,1);gl.activeTexture(gl.TEXTURE0);gl.uniform3fv(U.eye,eye);gl.uniform3fv(U.shift,shift);gl.bindBuffer(gl.ARRAY_BUFFER,buf.b);A.forEach((a,i)=>{gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,i===3?1:3,gl.FLOAT,false,40,i*12)});gl.drawArrays(gl.TRIANGLES,0,buf.count)}
function render(){
 const dir=[Math.sin(cam.lon)*Math.cos(cam.lat),Math.sin(cam.lat),Math.cos(cam.lon)*Math.cos(cam.lat)];eye=add(target,scale(dir,cam.distance));vp=mult(perspective(width/height,2*Math.atan(Math.tan(.51/2)*Math.max(1,1/(width/height*.92)))),look(eye,target));gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.depthMask(true);gl.disable(gl.BLEND);draw(ocean);domains.forEach(d=>draw(d.mesh,scale(d.center,d.lift)));renderMarine();if(!current)draw(clouds);renderSpacecraft();
 const actors=[];for(const d of domains)for(const s of d.systems){if(current===d)actors.push({n:s.npcN,d,model:s.npcModel,size:.19})}
 if(current){actors.push({n:local(current,...hero),d:current,model:0,size:.245});actors.push({n:local(current,hero[0]-.26,hero[1]+.10),d:current,crew:0});actors.push({n:local(current,hero[0]+.27,hero[1]+.13),d:current,crew:1})}
 // Characters are a foreground sprite pass: scenery depth cannot cut out faces or paws.
 // Keep the party above NPCs, and retain far-to-near ordering within each group.
 const party=a=>a.model===0||a.crew!==undefined;
 actors.sort((a,b)=>Number(party(a))-Number(party(b))||Math.hypot(...point(b.n,b.d).map((v,i)=>v-eye[i]))-Math.hypot(...point(a.n,a.d).map((v,i)=>v-eye[i])));
 gl.disable(gl.DEPTH_TEST);
 try{for(const a of actors){const p=point(a.n,a.d,a.model===0?.035:.17);
  // Hide far-side inhabitants at the globe horizon, rather than showing them through the entire planet.
  if(!project(p).front)continue;
  if(a.crew!==undefined)crew.render({vp,yaw:0,time:clock,moving,fox:a.crew===0?p:null,robot:a.crew===1?p:null,size:.34});
  else avatar.render({vp,yaw:0,phase,moving:a.model===0&&moving,point:p,model:a.model,size:a.size});
 }}finally{gl.enable(gl.DEPTH_TEST);gl.depthMask(true);}
 canvas.dataset.actorLayer='foreground';

 for(const d of domains){const el=labelNodes.get(d.id),q=project(point(d.center,d,.1));el.hidden=!!current||!q.front||q.x<65||q.x>width-65;el.classList.toggle('hovered',hover===d.id);el.style.left=q.x+'px';el.style.top=(q.y-(active?80:32))+'px';for(const s of d.systems){const e=systemNodes.get(s.id),p=project(point(s.n,d,s.visualHeight+.12));e.hidden=!p.front||!current||(!active)||p.x<80||p.x>width-80||p.y<0||p.y>height-35;e.classList.toggle('current',focusSystem===s.id);e.style.left=p.x+'px';e.style.top=Math.max(innerWidth>760?155:76,p.y)+'px';}}
 canvas.dataset.rendered='true';canvas.dataset.mode=current?'continent':'overview';canvas.dataset.longitude=String(cam.lon);canvas.dataset.continent=current?.id||'';
}
function tick(now){const dt=Math.min((now-last)/1000,.045);last=now;if(!document.hidden){clock+=dt;const reduced=window.cosmicMotion?.reduced||window.cosmicMotion?.paused;if(!reduced)spaceTime+=dt;if(motion){const t=clamp((now-motion.start)/750,0,1),u=1-(1-t)**3;for(const k of['lon','lat','distance'])cam[k]=motion.from.cam[k]+(motion.to.cam[k]-motion.from.cam[k])*u;target=motion.from.target.map((v,i)=>v+(motion.to.target[i]-v)*u);if(t===1)motion=null;}
 for(const d of domains){const to=hover===d.id?.17:0;d.lift=reduced?to:d.lift+(to-d.lift)*Math.min(1,dt*12)}
 const beforeStep=[...hero];moving=false;
 if(current&&!document.querySelector('dialog[open]')){let dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),dz=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);if(dx||dz){const x=hero[0]+dx*dt*.7,z=hero[1]+dz*dt*.7;if(safe(x,z)){hero=[x,z];moving=true}}else if(route.length){const q=route[0],dist=Math.hypot(q[0]-hero[0],q[1]-hero[1]),step=dt*.72;moving=true;if(dist<=step){hero=q;route.shift();if(!route.length){moving=false;if(focusSystem)emit('atlasarrive',{id:focusSystem})}}else hero=hero.map((v,i)=>v+(q[i]-v)*step/dist);}else moving=false;}
 const walked=Math.hypot(hero[0]-beforeStep[0],hero[1]-beforeStep[1]);
 if(walked>0&&walked<.15){phase+=walked*(Math.PI*2/.68);moving=true;}
 if(reduced)moving=false;
 render();}requestAnimationFrame(tick)}
window.atlasWorld={enter,overview,rotateTo,hover:setHover,travel,zoom,setBox(v){boxMode=v},key(k,down){if(down)keys.add(k);else keys.delete(k)},state(){return{active,domain:current?.id||null,hover,longitude:cam.lon,latitude:cam.lat,distance:cam.distance,hero:[...hero],moving,phase,remaining:route.length,focusSystem,lifts:domains.map(d=>d.lift)}},projectSystem(id){const d=domains.find(d=>d.systems.some(s=>s.id===id)),s=d?.systems.find(s=>s.id===id);return s?{base:project(point(s.n,d,.07)),top:project(point(s.n,d,s.visualHeight)),npc:project(point(s.npcN,d,.40))}:null},projectDomain(id){const d=domains.find(d=>d.id===id);return d?project(point(d.center,d,.1)):null},landContains(id,n){const d=domains.find(d=>d.id===id);return !!d&&inside(d,n)},marineLife(){return{time:spaceTime,objects:marineReadings}},spacecraft(){return{time:spaceTime,paused:!!(window.cosmicMotion?.paused||window.cosmicMotion?.reduced),objects:spaceReadings}},scenery(){return sceneryStats},setActive(v){active=v;if(v)overview();else{current=null;target=[0,0,0];cam={lon:.28,lat:-.16,distance:18.8};emit('atlasmode',{domain:null,system:null})}resize();},ready:true};window.worldJourney={setActive:v=>atlasWorld.setActive(v)};
document.querySelector('#zoom-in').onclick=()=>zoom(-.7);document.querySelector('#zoom-out').onclick=()=>zoom(.7);document.querySelector('#reset-world').onclick=overview;
new ResizeObserver(resize).observe(canvas);resize();emit('atlasready',{});requestAnimationFrame(tick);
})();
