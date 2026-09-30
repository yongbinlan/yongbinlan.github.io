(()=>{'use strict';
const $=s=>document.querySelector(s),reduce=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)'),motion=()=>!reduce.matches&&!window.cosmicMotion?.paused;
const systems=JSON.parse($('#portfolio-data').textContent),dialog=$('#pf-system-dialog');
const floating=document.createElement('aside');floating.className='v56-hover';floating.setAttribute('aria-hidden','true');floating.innerHTML='<div class="v56-hover-media"><img alt=""><video muted playsinline loop preload="none"></video><span>查看案例 ↗</span></div><footer><small></small><b></b></footer>';document.body.append(floating);
let active=null,timer=0,frame=0,point={x:0,y:0};const fv=floating.querySelector('video'),fi=floating.querySelector('img');
function hide(){active=null;clearTimeout(timer);cancelAnimationFrame(frame);floating.dataset.visible='false';fv.pause();fv.removeAttribute('src');fv.load();floating.dataset.playing='false';}
function place(){frame=0;const w=floating.offsetWidth,h=floating.offsetHeight;const right=point.x+28;const x=right+w<innerWidth-16?right:point.x-w-28;floating.style.transform=`translate3d(${Math.max(12,Math.min(innerWidth-w-12,x))}px,${Math.max(12,Math.min(innerHeight-h-12,point.y-h*.4))}px,0)`;}
document.querySelectorAll('.pf-domain .pf-case-pick').forEach(button=>{
 button.classList.add('v56-case-row');
 button.addEventListener('pointerenter',e=>{if(e.pointerType!=='mouse'||!fine.matches)return;hide();active=button;const s=systems.find(s=>s.id===button.dataset.system),c=s?.representativeCases[Number(button.dataset.caseIndex)||0],img=button.querySelector('img');if(!img)return;fi.src=img.currentSrc||img.src;floating.querySelector('b').textContent=c?.title||img.alt;floating.querySelector('small').textContent=c?.status||'';point={x:e.clientX,y:e.clientY};floating.dataset.visible='true';place();if(c?.preview?.type==='video'&&motion()){timer=setTimeout(()=>{if(active!==button)return;fv.src=c.preview.src;fv.muted=true;fv.play().then(()=>{if(active===button)floating.dataset.playing='true';else fv.pause()}).catch(()=>{});},650)}});
 button.addEventListener('pointermove',e=>{if(active!==button)return;point={x:e.clientX,y:e.clientY};if(motion()&&!frame)frame=requestAnimationFrame(place)});
 button.addEventListener('pointerleave',hide);
});
fv.addEventListener('timeupdate',()=>{if(fv.currentTime>8)fv.currentTime=0});window.addEventListener('scroll',hide,{passive:true});window.addEventListener('blur',hide);document.addEventListener('visibilitychange',()=>{if(document.hidden)hide()});
// Progressive shared-cover transition: native dialog still owns focus and dismissal.
let vt=null,source=null,cover=null,closing=false,pendingClose=false,transitioning=false;
function clearNames(){document.querySelectorAll('[data-v56-cover]').forEach(e=>{e.style.viewTransitionName='';e.removeAttribute('data-v56-cover')})}
function name(e){if(e){e.style.viewTransitionName='case-cover';e.dataset.v56Cover='true'}}
function target(){return dialog.querySelector('.fx-case-media img,.fx-case-media video')}
function run(update,finish){transitioning=true;if(!document.startViewTransition||!motion()){update();clearNames();transitioning=false;finish?.();return}vt=document.startViewTransition(update);Promise.allSettled([vt.updateCallbackDone,vt.finished]).then(()=>{clearNames();vt=null;transitioning=false;finish?.();if(pendingClose){pendingClose=false;closeCase()}})}
function openCase(button,id,index){const previewOrigin=active===button&&floating.dataset.visible==='true'?(floating.dataset.playing==='true'?fv:fi):null;source=button;cover=button.closest('article,.pf-case-pick')?.querySelector('img')||button.querySelector('img');clearNames();if(previewOrigin)name(previewOrigin);else if(cover?.getClientRects().length)name(cover);run(()=>{hide();clearNames();window.portfolioUI.openSystem(id,button,index);name(target())})}
function closeCase(){if(closing)return;if(transitioning){pendingClose=true;vt?.skipTransition();return}closing=true;clearNames();name(target());run(()=>{clearNames();dialog.close();if(cover?.isConnected){const r=cover.getBoundingClientRect();if(r.bottom>0&&r.top<innerHeight)name(cover)}},()=>{closing=false})}
document.addEventListener('click',e=>{
 if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
 if(dialog.open&&(e.target.closest('.pf-dialog-close')||e.target===dialog)){if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom)return}e.preventDefault();e.stopImmediatePropagation();closeCase();return}
 const button=e.target.closest('[data-system],.selected-method-image');if(!button||button.closest('dialog')||!button.closest('.pf-domain,.selected-grid-v53'))return;
 const id=button.dataset.system||'s04';e.preventDefault();e.stopImmediatePropagation();openCase(button,id,Number(button.dataset.caseIndex)||0);
},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&(dialog.open||transitioning)&&!$('#fx-lightbox')?.open){e.preventDefault();e.stopImmediatePropagation();closeCase()}},true);
window.addEventListener('portfolio:open',()=>{hide();if(!transitioning){source=null;cover=null}});
dialog.addEventListener('close',()=>{if(!transitioning)clearNames()});
function stopMotion(){hide();if(!motion())vt?.skipTransition()}
reduce.addEventListener('change',stopMotion);fine.addEventListener('change',hide);window.addEventListener('cosmicmotion',stopMotion);
// Evidence exhibits are excerpts of the existing public source record, not a live RAG demo.
const panel=$('#method-panel-v53'),guide=$('.method-guide-v53'),tabs=[...document.querySelectorAll('.method-tabs-v53 button')];
if(panel&&guide){
 guide.classList.add('v56-method-guide');
 const phases=[...document.querySelectorAll('#factory-methodology .ml-cycle li')];tabs.forEach((b,i)=>{const p=document.createElement('em');p.textContent=phases[i]?.querySelector('p')?.textContent||'';b.append(p)});
 const trace=[...document.querySelectorAll('#factory-methodology .ml-trace li')];
 const safe=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const evidence=[
 ()=>`<div class="v56-source"><small>来源记录 / SOURCE</small><h4>${safe(trace[0]?.querySelector('h5')?.textContent)}</h4><p>${safe(trace[0]?.querySelector('p')?.textContent)}</p><code>抖音 · 大栗呀<br>7625945506939134848</code></div>`,
 ()=>'<div class="v56-segments"><span>动机反差</span><span>痛点</span><span>产品解法</span><span>选择理由</span></div><p class="v56-note">段落职责摘录 · 当前商品事实另行核验</p>',
 ()=>`<div class="v56-source"><small>框架摘录 / FRAMEWORK</small><h4>${safe(trace[1]?.querySelector('h5')?.textContent)}</h4><p>${safe(trace[1]?.querySelector('p')?.textContent)}</p><code>FW-MOTIVATION-CONTRAST-001<br>v1 · 方法候选</code></div>`,
 ()=>'<div class="v56-templates"><div><small>类目模板 / 01</small><h4>冰敷眼贴</h4><p>使用时刻与有依据的体验</p></div><div><small>类目模板 / 02</small><h4>充电器</h4><p>设备、协议、配置与真实价格</p></div></div><p class="v56-note">填入本品事实，不继承原例功效</p>',
 ()=>'<div class="v56-retrieval"><span><b>1</b> 通用框架</span><i>＋</i><span><b>2</b> 类目模板</span></div><p class="v56-note">2026-09-29 单次只读检索返回记录<br>不代表稳定批产或营销效果验证</p>',
 ()=>'<div class="v56-feedback"><span>采用版本</span><i>→</i><span>实际交付</span><i>→</i><span>分类反馈</span><i>↺</i><span>修订方法</span></div><p class="v56-note">已有反馈规则 · 效果待验证<br>偏好、制作问题、市场表现分别记录</p>'
 ];
 function render(){const i=Number(panel.dataset.step)||0;tabs.forEach((b,n)=>b.dataset.completed=String(n<i));panel.querySelector('.v56-evidence')?.remove();const exhibit=document.createElement('figure');exhibit.className='v56-evidence';exhibit.dataset.phase=String(i);exhibit.innerHTML=`<figcaption>产物与依据 / 0${i+1}</figcaption>${evidence[i]()}<a href="downloads/factory-methodology-v46.md" download>查看完整方法摘录 ↓</a>`;panel.append(exhibit)}
 new MutationObserver(render).observe(panel,{attributes:true,attributeFilter:['data-step']});render();
 let scheduled=false,lastY=scrollY,manualY=null;
 tabs.forEach(b=>b.addEventListener('click',e=>{if(e.isTrusted)manualY=scrollY}));
 window.addEventListener('scroll',()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;if(innerWidth<901||!motion()||dialog.open)return;if(manualY!==null&&Math.abs(scrollY-manualY)<80)return;manualY=null;const r=guide.getBoundingClientRect(),anchor=innerHeight*.4;if(r.top>anchor||r.bottom<anchor)return;let selected=0,d=Infinity;tabs.forEach((b,i)=>{const br=b.getBoundingClientRect(),n=Math.abs(br.top+br.height*.5-anchor);if(n<d){d=n;selected=i}});if(Number(panel.dataset.step)!==selected)tabs[selected].click();lastY=scrollY;})},{passive:true});
}
window.caseMotionV56={version:56,get transitioning(){return transitioning},state:()=>({hover:!!active,playing:!fv.paused,transitioning,phase:Number(panel?.dataset.step),closing}),close:closeCase};
})();
