/* V16 independent routes in safe, connected navigation corridors. */
(()=>{'use strict';
const scene=document.querySelector('.cosmos'),layer=document.createElement('div');layer.className='cosmic-crew';layer.setAttribute('aria-hidden','true');layer.innerHTML='<canvas></canvas><span class="crew-mood"></span><span class="crew-mood"></span>';scene.append(layer);
const canvas=layer.querySelector('canvas'),badges=[...layer.querySelectorAll('.crew-mood')],gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true,preserveDrawingBuffer:true,powerPreference:'low-power'});if(!gl){layer.remove();return;}
gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);const renderer=window.createCompanionRenderer(gl,canvas);
let W=0,H=0,time=0,last=0,paint=0,visible=true,actors=[],test=false,plans=[],layoutKey='',obstacles=[];
const mix=(a,b,u)=>a+(b-a)*u,overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
function bounds(a){return {left:a.x-a.half,right:a.x+a.half,top:a.y-a.headroom,bottom:a.y+8}}
function layout(){
 if(document.body.classList.contains('world-open'))return;
 const sr=scene.getBoundingClientRect(),wr=window.cosmicWorldBounds;if(!wr)return;
 const local=r=>({left:r.left-sr.left,top:r.top-sr.top,right:r.right-sr.left,bottom:r.bottom-sr.top});
 const world=local({left:wr.left-scrollX,top:wr.top-scrollY,right:wr.right-scrollX,bottom:wr.bottom-scrollY}),copy=local(document.querySelector('.hero-copy').getBoundingClientRect()),ar=local(document.querySelector('.architect').getBoundingClientRect());
 const face={left:ar.left+(ar.right-ar.left)*.27,right:ar.right-(ar.right-ar.left)*.27,top:ar.top,bottom:ar.top+(ar.bottom-ar.top)*.58};
 const invite=document.querySelector('.journey-invite').getBoundingClientRect();const obs=[world,copy,face,...(invite.width?[local(invite)]:[])],key=[W,H,...Object.values(world)].map(v=>Math.round(v)).join(',');if(key===layoutKey)return;layoutKey=key;obstacles=obs;
 plans=[0,1].map(i=>{
  const size=W<701?32:W<981?44:Math.min(76,W*.043),half=Math.max(size*.98,W<701?47:57),headroom=size*2.05+23;
  const lo=i?W*.51+half:half+10,hi=i?W-half-10:W*.49-half,top=115+headroom,bottom=H-76;
  const nodes=[],cols=13,rows=Math.max(2,Math.ceil((bottom-top)/22)),lookup=new Map();
  for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){
   const a={x:mix(lo,hi,x/cols),y:mix(top,bottom,y/rows),size,half,headroom};
   if(hi>lo&&!obs.some(o=>overlap(bounds(a),o))){const id=nodes.length;nodes.push({...a,gx:x,gy:y,id});lookup.set(x+','+y,id);}
  }
  const neighbors=n=>[[1,0],[-1,0],[0,1],[0,-1]].map(([x,y])=>lookup.get((n.gx+x)+','+(n.gy+y))).filter(v=>v!==undefined);
  let largest=[],seen=new Set();for(const n of nodes){if(seen.has(n.id))continue;const q=[n.id];seen.add(n.id);for(let z=0;z<q.length;z++)for(const v of neighbors(nodes[q[z]]))if(!seen.has(v)){seen.add(v);q.push(v)}if(q.length>largest.length)largest=q;}
  if(!largest.length)return {segments:[],size,half,headroom,total:1};
  const group=largest.map(id=>nodes[id]),pick=(fx,fy)=>group.reduce((a,n)=>Math.hypot(n.x-mix(lo,hi,fx),n.y-mix(top,bottom,fy))<Math.hypot(a.x-mix(lo,hi,fx),a.y-mix(top,bottom,fy))?n:a);
  const targets=(i?[[.85,.1],[.2,.7],[.8,.94],[.1,.2],[.8,.5]]:[[.8,.6],[.1,.94],[.85,.95],[.15,.2],[.8,.35]]).map(([x,y])=>pick(x,y));
  let elapsed=0;const segments=[];
  const add=(path,state,duration)=>{segments.push({path,state,start:elapsed,duration});elapsed+=duration;};
  for(let k=0;k<targets.length;k++){
   const from=targets[k],to=targets[(k+1)%targets.length],q=[from.id],prev=new Map([[from.id,null]]);
   for(let z=0;z<q.length&&!prev.has(to.id);z++)for(const v of neighbors(nodes[q[z]]))if(!prev.has(v)){prev.set(v,q[z]);q.push(v)}
   const path=[];for(let id=to.id;id!==null;id=prev.get(id))path.unshift(nodes[id]);
   let length=0;path.forEach((n,j)=>{if(j)length+=Math.hypot(n.x-path[j-1].x,n.y-path[j-1].y);});
   add(path,'run',Math.max(2,length/(i?37:46)));
   add([to],k%3===0?'think':k%3===1?'sleep':'jump',k%3===0?(i?6.2:3.7):k%3===1?(i?8.1:5.4):1.5);
  }
  return {segments,total:elapsed,size,half,headroom};
 });
}
function actor(i,t){const p=plans[i];if(!p?.segments.length)return {x:-200,y:-200,size:0,state:'idle',heading:0,half:0,headroom:0};
 const q=(t+(i?7.3:0))%p.total,s=p.segments.find(s=>q<s.start+s.duration)||p.segments.at(-1),u=(q-s.start)/s.duration,distances=[0];
 for(let j=1;j<s.path.length;j++)distances.push(distances[j-1]+Math.hypot(s.path[j].x-s.path[j-1].x,s.path[j].y-s.path[j-1].y));
 const dist=u*distances.at(-1);let j=1;while(j<distances.length-1&&distances[j]<dist)j++;
 const a=s.path[Math.max(0,j-1)],b=s.path[Math.min(j,s.path.length-1)],f=distances.length>1?(dist-distances[j-1])/(distances[j]-distances[j-1]||1):0;
 let x=mix(a.x,b.x,f),y=mix(a.y,b.y,f);if(s.state==='jump')y-=Math.sin(Math.PI*u)*18;
 return {x,y,size:p.size,state:s.state,heading:b.x<a.x?-.65:.65,sleep:s.state==='sleep'?1:0,think:s.state==='think'?1:0,half:p.half,headroom:p.headroom-20};
}
function draw(){if(W!==scene.clientWidth||H!==scene.clientHeight){resize();return;}layout();gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);actors=[actor(0,time),actor(1,time)];
 const ready=renderer.free({width:W,height:H,time,actors});api.ready=ready&&plans.length===2;layer.dataset.ready=String(api.ready);
 actors.forEach((a,i)=>{const b=badges[i],label=a.state==='think'?'在想新点子…':a.state==='sleep'?'Z z z':a.state==='jump'?'跃过星轨':'独自探索';b.textContent=(i?'阿零':'芽芽')+' · '+label;b.dataset.state=a.state;b.hidden=!api.ready||!a.size;b.style.transform=`translate(${a.x-b.offsetWidth/2}px,${a.y-a.size*1.95}px)`;b.hidden=!api.ready||!a.size;});
}
function resize(){W=scene.clientWidth;H=scene.clientHeight;layoutKey='';const d=Math.min(devicePixelRatio||1,1.25);canvas.width=Math.round(W*d);canvas.height=Math.round(H*d);draw();}
const api=window.cosmicCrew={ready:false,snapshot:()=>({time,width:W,height:H,actors:actors.map(a=>({...a,bounds:bounds(a)})),obstacles,cycles:plans.map(p=>p.total),visible:visible&&!document.body.classList.contains('world-open')})};
if(new URLSearchParams(location.search).has('crew-test'))api.seek=t=>{test=true;time=t;draw();};
new ResizeObserver(resize).observe(scene);new IntersectionObserver(e=>visible=e[0].isIntersecting).observe(scene);
window.addEventListener('worldmode',e=>{if(!e.detail.open){layoutKey='';draw()}});window.addEventListener('cosmicmotion',draw);
function tick(now){const dt=Math.min((now-last)/1000,.06);last=now;if(visible&&!document.hidden&&!document.body.classList.contains('world-open')){if(!window.cosmicMotion?.paused&&!test)time+=dt;const previousLayout=layoutKey;layout();if((!window.cosmicMotion?.paused||!api.ready||previousLayout!==layoutKey)&&now-paint>40){draw();paint=now;}}requestAnimationFrame(tick)}
resize();requestAnimationFrame(tick);
})();
