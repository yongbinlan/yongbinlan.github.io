/* V8 stardust portrait; fixed smile, ambient depth, pause-aware animation. */
(()=>{'use strict';
const reduce=matchMedia('(prefers-reduced-motion: reduce)'),button=document.querySelector('#pause-motion');
const motion=window.cosmicMotion={paused:reduce.matches,reduced:reduce.matches};
function sync(){button.setAttribute('aria-pressed',String(motion.paused));button.textContent=motion.paused?'播放动态':'暂停动态';document.documentElement.dataset.motion=motion.paused?'paused':'playing';window.dispatchEvent(new Event('cosmicmotion'));}
button.addEventListener('click',()=>{motion.paused=!motion.paused;document.documentElement.dataset.motionOptIn=String(!motion.paused);sync();});reduce.addEventListener('change',e=>{motion.reduced=e.matches;motion.paused=e.matches;document.documentElement.dataset.motionOptIn='false';sync();});sync();
// One complete, approved smile tile; no face patch, crossfade or pose override.
const canvas=document.querySelector('#portrait-canvas'),ctx=canvas.getContext('2d'),portrait=new Image();
let ready=false,visible=true,time=0,last=0,lastDraw=0;
portrait.onload=()=>{
 ctx.clearRect(0,0,canvas.width,canvas.height);
 ctx.drawImage(portrait,0,0,portrait.naturalWidth,portrait.naturalHeight,0,0,canvas.width,canvas.height);
 ready=true;canvas.dataset.loaded='true';canvas.dataset.pose='0';canvas.dataset.phase='smiling';
 document.querySelector('#gaze-state').textContent='自信微笑 · 我的作品世界';
};
portrait.onerror=()=>{canvas.dataset.loaded='error';document.querySelector('.architect').classList.add('image-unavailable');document.querySelector('#gaze-state').textContent='人物资源暂不可用';};
portrait.src='assets/architect-open-arms-v34.png';
const names={commerce:'电商内容工厂',delivery:'自动化交付站',studio:'AI 内容演播室',toolbox:'Skill 工具工坊',research:'选品决策实验室'};
window.setArchitectFocus=id=>{if(names[id])document.querySelector('#gaze-state').textContent='自信微笑 · '+names[id];};
new IntersectionObserver(e=>{visible=e[0].isIntersecting;document.documentElement.dataset.cosmosVisible=String(visible&&!document.hidden);}).observe(document.querySelector('.cosmos'));document.addEventListener('visibilitychange',()=>{document.documentElement.dataset.cosmosVisible=String(visible&&!document.hidden);});
// Deterministic star positions; subtle depth and twinkle without external textures.
const stars=document.querySelector('#starfield'),sc=stars.getContext('2d');let W=0,H=0,dpr=1;let seed=9461;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};const points=Array.from({length:240},()=>({x:rand(),y:rand(),r:.25+rand()*1.1,a:.15+rand()*.6,s:rand()*6.3,depth:rand()}));
function resize(){const r=stars.getBoundingClientRect();W=r.width;H=r.height;dpr=Math.min(devicePixelRatio||1,1.5);stars.width=Math.round(W*dpr);stars.height=Math.round(H*dpr);sc.setTransform(dpr,0,0,dpr,0,0);drawStars();}
function drawStars(){stars.dataset.time=time.toFixed(3);sc.clearRect(0,0,W,H);for(let p of points){let a=p.a*(.65+.35*Math.sin(time*.55+p.s)),x=(p.x*W+time*(2+p.depth*10))%(W+8)-4,y=(p.y*H+time*(.4+p.depth*2))%(H+8)-4;sc.fillStyle=`rgba(239,229,184,${a})`;sc.beginPath();sc.arc(x,y,p.r,0,Math.PI*2);sc.fill();if(p.r>1.2){sc.strokeStyle=`rgba(232,225,190,${a*.3})`;sc.lineWidth=.6;sc.beginPath();sc.moveTo(x-4,y);sc.lineTo(x+4,y);sc.moveTo(x,y-4);sc.lineTo(x,y+4);sc.stroke();}}
// A sparse shooting star moves through the background every 12 seconds.
const meteor=(time+3)%12;if(meteor<1.5){const u=meteor/1.5,alpha=Math.sin(u*Math.PI)*.65;let mx=W*(.93-u*.32),my=H*(.12+u*.18);const tail=Math.min(W*.1,105);const g=sc.createLinearGradient(mx,my,mx+tail,my-tail*.42);g.addColorStop(0,`rgba(248,232,185,${alpha})`);g.addColorStop(1,'rgba(224,213,164,0)');sc.strokeStyle=g;sc.lineWidth=1.4;sc.beginPath();sc.moveTo(mx,my);sc.lineTo(mx+tail,my-tail*.42);sc.stroke();}
// A restrained orbiting point communicates depth.
let t=time*.1,x=W*.69+Math.cos(t)*W*.24,y=H*.67+Math.sin(t)*H*.14;sc.fillStyle='rgba(220,236,190,.8)';sc.beginPath();sc.arc(x,y,1.5,0,Math.PI*2);sc.fill();}
new ResizeObserver(resize).observe(stars);window.addEventListener('cosmicmotion',()=>{if(motion.paused)drawStars();});
function tick(t){let dt=Math.min((t-last)/1000,.05);last=t;if(!document.hidden&&visible&&!motion.paused){time+=dt;if(t-lastDraw>33){drawStars();lastDraw=t;}}requestAnimationFrame(tick);}resize();requestAnimationFrame(tick);
})();
