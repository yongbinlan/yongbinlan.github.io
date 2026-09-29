/* Matching 2.5D gesture art; source alpha defines hover, not an invisible rectangle. */
(()=>{'use strict';
 const base=document.querySelector('#portrait-canvas'),host=base?.parentElement;
 if(!host)return;
 const hero=document.querySelector('.cosmos'),fine=matchMedia('(hover: hover) and (pointer: fine)');
 const reaction=document.createElement('div');reaction.className='portrait-reaction';reaction.setAttribute('aria-hidden','true');
 const src='assets/architect-thumbs-up-v48.png';
 reaction.innerHTML=`<img class="portrait-reaction-body" src="${src}" alt="" draggable="false">`;
 const trigger=document.createElement('button');trigger.type='button';trigger.className='portrait-greeting-trigger';trigger.disabled=true;
 trigger.setAttribute('aria-label','和斌哥打个招呼，查看挑眉点赞');trigger.setAttribute('aria-pressed','false');
 const hint=document.createElement('span');hint.className='portrait-greeting-hint';hint.textContent='打个招呼 · 自信点赞';hint.setAttribute('aria-hidden','true');
 host.classList.add('portrait-interactive');host.setAttribute('role','group');host.setAttribute('aria-label','兰勇斌的星尘宇宙化身');base.setAttribute('aria-hidden','true');host.append(reaction,trigger,hint);
 let ready=false,hover=false,pinned=false,focused=false,frame=0,lastEvent=null,alphas=null;
 const masks=document.createElement('canvas');masks.width=masks.height=160;const mc=masks.getContext('2d',{willReadFrequently:true});
 // Union of original and greeting silhouettes keeps the extended hand stable under the pointer.
 async function prepare(){
  const old=new Image();old.src='assets/architect-open-arms-v34.png';
  try{await Promise.all([old.decode(),...Array.from(reaction.children,x=>x.decode())]);
   mc.drawImage(old,0,0,160,160);mc.drawImage(reaction.firstElementChild,0,0,160,160);alphas=mc.getImageData(0,0,160,160).data;
   ready=true;host.dataset.greetingReady='true';trigger.disabled=false;
  }catch{host.dataset.greetingReady='error';reaction.remove();trigger.remove();hint.remove();}
 }
 function sync(){const active=ready&&!document.body.classList.contains('world-open')&&(hover||pinned||focused);
  host.classList.toggle('is-greeting',active);trigger.setAttribute('aria-pressed',String(active));host.dataset.greeting=active?'thumbs-up':'rest';
 }
 function reset(){hover=pinned=focused=false;sync();}
 function hit(e){
  if(!ready||e.buttons||document.body.classList.contains('world-open'))return false;
  if(e.target.closest('a,button,dialog,.planet-stage')&&!e.target.closest('.portrait-greeting-trigger'))return false;
  const r=base.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
  if(x<0||x>=1||y<0||y>=.8)return false;
  return alphas[(Math.floor(y*160)*160+Math.floor(x*160))*4+3]>90;
 }
 hero.addEventListener('pointermove',e=>{if(!fine.matches||e.pointerType==='touch')return;lastEvent=e;if(!frame)frame=requestAnimationFrame(()=>{frame=0;hover=hit(lastEvent);sync();});},{passive:true});
 hero.addEventListener('pointerleave',()=>{hover=false;sync();});
 trigger.addEventListener('focus',()=>{focused=trigger.matches(':focus-visible');sync();});
 trigger.addEventListener('blur',()=>{focused=false;pinned=false;sync();});
 trigger.addEventListener('click',e=>{if(e.detail===0){pinned=!pinned;focused=false;}else if(!fine.matches){pinned=!pinned;}else{hover=true;}sync();});
 document.addEventListener('pointerdown',e=>{if(!host.contains(e.target)){pinned=false;focused=false;sync();}},{passive:true});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')reset();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
 window.addEventListener('blur',reset);window.addEventListener('scroll',()=>{hover=false;sync();},{passive:true});
 new MutationObserver(()=>{if(document.body.classList.contains('world-open'))reset();}).observe(document.body,{attributes:true,attributeFilter:['class']});
 fine.addEventListener('change',reset);prepare();sync();
})();
