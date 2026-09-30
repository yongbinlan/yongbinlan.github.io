(()=>{'use strict';
const $=s=>document.querySelector(s),reduce=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover: hover) and (pointer: fine)'),canMove=()=>!reduce.matches&&!window.cosmicMotion?.paused;
const cards=[...document.querySelectorAll('.selected-grid-v53 article,.pf-case-pick')];cards.forEach(e=>e.classList.add('fx-card'));
const cursor=document.createElement('div');cursor.className='fx-cursor';cursor.setAttribute('aria-hidden','true');document.body.append(cursor);
let active=null,rect=null,point=null,raf=0;const animations=new Set();
function reset(){if(active){active.classList.remove('fx-hover');['--fx-x','--fx-y','--fx-rx','--fx-ry'].forEach(k=>active.style.removeProperty(k))}active=null;rect=null;cursor.dataset.visible='false';if(raf)cancelAnimationFrame(raf);raf=0;}
function renderPointer(){raf=0;if(!active||!canMove())return;const x=Math.max(0,Math.min(1,(point.x-rect.left)/rect.width)),y=Math.max(0,Math.min(1,(point.y-rect.top)/rect.height));active.style.setProperty('--fx-x',`${x*100}%`);active.style.setProperty('--fx-y',`${y*100}%`);active.style.setProperty('--fx-rx',`${(0.5-y)*4}deg`);active.style.setProperty('--fx-ry',`${(x-.5)*5}deg`);cursor.style.transform=`translate3d(${Math.min(innerWidth-84,Math.max(8,point.x+18))}px,${Math.max(8,point.y-72)}px,0)`;}
cards.forEach(card=>{
 card.addEventListener('pointerenter',e=>{if(e.pointerType!=='mouse'||!fine.matches||!canMove())return;reset();active=card;rect=card.getBoundingClientRect();card.classList.add('fx-hover')});
 card.addEventListener('pointermove',e=>{if(active!==card||!canMove())return;point={x:e.clientX,y:e.clientY};const preview=e.target.closest('.pf-preview,.selected-image,.selected-method-image');cursor.dataset.visible=String(!!preview);cursor.textContent=preview?.classList.contains('video')?'播放 ↗':'查看 ↗';if(!raf)raf=requestAnimationFrame(renderPointer)});
 card.addEventListener('pointerleave',reset);
});
window.addEventListener('scroll',reset,{passive:true});window.addEventListener('blur',reset);document.addEventListener('pointerdown',()=>cursor.dataset.visible='false',{passive:true});
function animate(el,frames,options){if(!canMove()||!el?.animate)return;const a=el.animate(frames,{easing:'cubic-bezier(.22,.61,.36,1)',...options});animations.add(a);a.finished.catch(()=>{}).finally(()=>animations.delete(a));return a;}
function motionChanged(){reset();if(!canMove()){animations.forEach(a=>a.cancel());animations.clear()}}
reduce.addEventListener('change',motionChanged);fine.addEventListener('change',reset);window.addEventListener('cosmicmotion',motionChanged);
// A one-time arrival cue below the first screen. Visibility never depends on JS or this animation.
if('IntersectionObserver' in window){const io=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){io.unobserve(e.target);animate(e.target,[{transform:'translateY(18px)',opacity:.65},{transform:'translateY(0)',opacity:1}],{duration:360})}})},{threshold:.12});document.querySelectorAll('.selected-grid-v53,.domain-map-v53,.pf-domain-head').forEach(e=>io.observe(e));}
const dialog=$('#pf-system-dialog'),content=$('#pf-dialog-content'),systems=JSON.parse($('#portfolio-data').textContent),sequence=systems.flatMap(s=>s.representativeCases.map((c,index)=>({id:s.id,index,c})));let current=-1,entry=null,dialogAnimation=null;
const lightbox=document.createElement('dialog');lightbox.className='fx-lightbox';lightbox.id='fx-lightbox';lightbox.setAttribute('aria-labelledby','fx-lightbox-title');lightbox.innerHTML='<header><p id="fx-lightbox-title"></p><button type="button" data-image-zoom aria-pressed="false">原尺寸</button><button type="button" data-lightbox-close aria-label="关闭大图">×</button></header><div class="fx-image-stage"><img alt=""></div>';document.body.append(lightbox);
function lock(){document.documentElement.toggleAttribute('data-fx-dialog',dialog.open||lightbox.open)}
function transformStory(){
 const story=content.querySelector('.pf-dlg-case,.pf-gongbei-detail,.pf-reference-detail');if(!story)return;
 const media=story.querySelector('.pf-artifact,.pf-gongbei-screen,.pf-reference-watch');if(!media)return;
 const shell=document.createElement('div');shell.className='fx-case-shell';const visual=document.createElement('aside');visual.className='fx-case-media';visual.setAttribute('aria-label','案例产物');const notes=document.createElement('div');notes.className='fx-case-notes';story.before(shell);shell.append(visual,notes);visual.append(media);notes.append(story);
}
window.addEventListener('portfolio:open',e=>{
 reset();lock();current=sequence.findIndex(c=>c.id===e.detail.id&&c.index===e.detail.index);entry=e.detail.from||entry;
 const toolbar=document.createElement('nav');toolbar.className='fx-toolbar';toolbar.setAttribute('aria-label','浏览代表案例');toolbar.innerHTML=`<span>案例展览 / ${String(current+1).padStart(2,'0')} — ${sequence.length}</span><button type="button" data-case-prev aria-label="上一个案例" ${current<=0?'disabled':''}>←</button><button type="button" data-case-next aria-label="下一个案例" ${current>=sequence.length-1?'disabled':''}>→</button>`;content.prepend(toolbar);transformStory();
 dialogAnimation?.cancel();dialogAnimation=animate(dialog,[{opacity:.6,transform:'translateY(12px) scale(.985)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:240});
});
dialog.addEventListener('click',e=>{
 const step=e.target.closest('[data-case-prev],[data-case-next]');if(step){const n=current+(step.hasAttribute('data-case-next')?1:-1),next=sequence[n];if(next){const selector=step.hasAttribute('data-case-next')?'[data-case-next]':'[data-case-prev]';window.portfolioUI.openSystem(next.id,null,next.index);const focus=content.querySelector(selector);if(!focus.disabled)focus.focus({preventScroll:true});}return;}
 const link=e.target.closest('.pf-artifact-frame.image a');if(link){e.preventDefault();const img=link.querySelector('img');lightbox.querySelector('img').src=img.currentSrc||img.src;lightbox.querySelector('img').alt=img.alt;lightbox.querySelector('#fx-lightbox-title').textContent=content.querySelector('.fx-case-notes h3')?.textContent||img.alt;lightbox.dataset.zoom='false';const toggle=lightbox.querySelector('[data-image-zoom]');toggle.setAttribute('aria-pressed','false');toggle.textContent='原尺寸';lightbox.showModal();lightbox.querySelector('[data-lightbox-close]').focus({preventScroll:true});lock();animate(lightbox,[{opacity:.5,transform:'scale(.985)'},{opacity:1,transform:'scale(1)'}],{duration:220});}
});
lightbox.querySelector('[data-lightbox-close]').addEventListener('click',()=>lightbox.close());
lightbox.querySelector('[data-image-zoom]').addEventListener('click',e=>{const zoom=lightbox.dataset.zoom!=='true';lightbox.dataset.zoom=String(zoom);e.currentTarget.setAttribute('aria-pressed',String(zoom));e.currentTarget.textContent=zoom?'适应窗口':'原尺寸';lightbox.querySelector('.fx-image-stage').scrollTo(0,0)});
lightbox.addEventListener('click',e=>{if(e.target===lightbox){const r=lightbox.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)lightbox.close()}});
lightbox.addEventListener('close',lock);
dialog.addEventListener('close',()=>{if(dialog.open)return;dialogAnimation?.cancel();if(lightbox.open)lightbox.close();lock();if(entry?.isConnected&&entry.getClientRects().length)entry.focus({preventScroll:true});});
window.siteInteractionsV55={version:55,state:()=>({current,hover:!!active,animations:animations.size,lightbox:lightbox.open,canMove:canMove()}),reset};
})();
