(()=>{'use strict';
const $=s=>document.querySelector(s),reduce=matchMedia('(prefers-reduced-motion: reduce)'),scene=$('.cosmos');
const phases=[
 ['先记清楚来源','留下原视频、来源和基本信息，重复的先合并，免得以后找不到依据。','已有来源记录','方法实例来自“大栗呀”的教学内容，保留作品编号 7625945506939134848。','#factory-methodology .ml-factory-more'],
 ['看懂它在讲什么','对照画面和声音，确认商品、使用场景，以及想让观众做什么。','已有分析依据','当前公开实例分析的是“动机反差”的段落职责；不把原视频的商品功效当作新商品的事实。','#factory-methodology .ml-factory-more'],
 ['拆清每段的作用','哪段吸引注意，哪段解释卖点，哪段提供证明；同时记下不能随便替换的事实。','已有框架摘录','动机反差 → 痛点 → 产品解法 → 选择理由。框架编号 FW-MOTIVATION-CONTRAST-001，v1，仍为方法候选。','#factory-methodology .ml-factory-more'],
 ['存成以后能查的材料','原案例、通用写法和类目模板分开存，并保留彼此的来源关系。','已有类目模板','公开实例包含冰敷眼贴、充电器两个模板。各有来源和适用限制，填入本品事实后才能使用。','#factory-methodology .ml-factory-more'],
 ['有新任务，先查库','按当前商品、购买问题和产物要求找方法，再核对能不能用。找不到依据的地方，先留出来。','已有单次检索记录','2026-09-29 检索返回了一个框架与两个类目模板。这证明该实例能被调用，不是稳定批产或营销效果验证。','#factory-methodology .ml-factory-more'],
 ['用完再记一笔','采用了什么、返工了哪里、为什么要改。是否有效，要结合后续实际表现判断。','已有反馈规则，效果待验证','采用记录绑定知识版本；偏好、制作问题和市场表现分开记录。这里展示规则，不展示尚未取得的效果。','#factory-methodology .ml-factory-more']
];
const root=$('#factory-methodology'),cycle=root?.querySelector('.ml-cycle');
if(cycle){
 const guide=document.createElement('div');guide.className='method-guide-v53';guide.innerHTML='<div class="method-tabs-v53" role="tablist" aria-label="内容工厂六个步骤" aria-orientation="vertical"></div><section class="method-panel-v53" role="tabpanel" id="method-panel-v53" tabindex="0"></section>';cycle.after(guide);
 const tabs=guide.querySelector('.method-tabs-v53'),panel=guide.querySelector('.method-panel-v53');
 phases.forEach((p,i)=>{const b=document.createElement('button');b.type='button';b.id='method-step-'+i;b.setAttribute('role','tab');b.setAttribute('aria-controls','method-panel-v53');b.innerHTML=`<span>0${i+1}</span><b>${p[0]}</b><i aria-hidden="true">↗</i>`;tabs.append(b);b.addEventListener('click',()=>show(i));b.addEventListener('keydown',e=>{let to=i;if(['ArrowDown','ArrowRight'].includes(e.key))to=(i+1)%6;else if(['ArrowUp','ArrowLeft'].includes(e.key))to=(i+5)%6;else if(e.key==='Home')to=0;else if(e.key==='End')to=5;else return;e.preventDefault();show(to);tabs.children[to].focus();});});
 function show(i){const p=phases[i];[...tabs.children].forEach((b,n)=>{b.setAttribute('aria-selected',String(n===i));b.tabIndex=n===i?0:-1});panel.setAttribute('aria-labelledby','method-step-'+i);panel.innerHTML=`<small>方法 / 0${i+1}</small><h3>${p[0]}</h3><p>${p[1]}</p><div class="method-evidence-v53"><strong>${p[2]}</strong><p>${p[3]}</p><a href="#factory-methodology" data-method-evidence>展开已有实例与具体规则 ↗</a></div>`;panel.classList.remove('is-changing');if(!reduce.matches&&!window.cosmicMotion?.paused){void panel.offsetWidth;panel.classList.add('is-changing')}panel.dataset.step=String(i)}show(0);
}
function reveal(target){let e=target;while(e){if(e.tagName==='DETAILS')e.open=true;e=e.parentElement}}
function navigate(hash){const target=document.getElementById(decodeURIComponent(hash.slice(1)));if(!target)return;reveal(target);if(hash==='#system-overview')$('#directory-details-v53').open=true;target.scrollIntoView({block:'start',behavior:reduce.matches?'instant':'smooth'});}
document.addEventListener('click',e=>{
 const explore=e.target.closest('[data-explore-v53]');if(explore){if(!document.body.classList.contains('world-open'))$('#explore-world').click();return;}
 const domain=e.target.closest('[data-domain-explore]');if(domain){window.atlasWorld?.enter(domain.dataset.domainExplore);return;}
 const evidence=e.target.closest('[data-method-evidence]');if(evidence){e.preventDefault();const d=root.querySelector('.ml-factory-more');d.open=true;d.scrollIntoView({block:'start',behavior:reduce.matches?'instant':'smooth'});return;}
 const a=e.target.closest('a[href^="#"]');if(a&&a.hash.length>1&&!e.defaultPrevented){const target=document.getElementById(decodeURIComponent(a.hash.slice(1)));if(target){e.preventDefault();history.pushState(null,'',a.hash);navigate(a.hash)}}
 const toggle=e.target.closest('[data-video-original]');if(toggle){const v=toggle.closest('figure')?.querySelector('video');if(!v)return;const normal=toggle.dataset.mode!=='normal';v.pause();v.src=normal?toggle.dataset.videoOriginal:toggle.dataset.videoQuick;v.muted=!normal;v.load();toggle.dataset.mode=normal?'normal':'quick';toggle.textContent=normal?'切到快速看一遍 · 静音':'切到正常速度 · 原声';v.play().catch(()=>{});}
});
window.addEventListener('hashchange',()=>navigate(location.hash));window.addEventListener('popstate',()=>navigate(location.hash));if(location.hash)requestAnimationFrame(()=>navigate(location.hash));
// One passive scroll observer, no wheel capture or page scrolling replacement.
let frame=0;function update(){frame=0;const off=reduce.matches||window.cosmicMotion?.paused||innerWidth<701||document.body.classList.contains('world-open');const phase=off?0:Math.max(0,Math.min(1,scrollY/(scene.offsetHeight*.7)));scene.style.setProperty('--scroll-phase',phase.toFixed(4));scene.dataset.scrollPhase=phase.toFixed(3)}function schedule(){if(!frame)frame=requestAnimationFrame(update)}
window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);window.addEventListener('worldmode',schedule);window.addEventListener('cosmicmotion',schedule);reduce.addEventListener('change',schedule);update();
// Only the actively viewed media should continue playing.
document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('video').forEach(v=>v.pause())});
window.siteExperienceV53={version:53,reveal,navigate};
})();
