(()=>{'use strict';
const systems=JSON.parse(document.querySelector('#portfolio-data').textContent);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const phases=[
 ['采集','留下来源','原片、教学内容与商品资料；保存时间、出处与使用范围。'],
 ['分析','找到问题','确认人群、场景、购买任务与内容目标，区分事实与假设。'],
 ['拆解','解释机制','拆出步骤职责、判断条件、证明方式和容易失效的地方。'],
 ['沉淀','形成资产','保留原始证据，整理框架、组件、模板与规则，记录版本。'],
 ['复用','适配任务','按当前问题检索，复核边界，以本次事实执行并交付。'],
 ['反馈','修订方法','绑定采用版本，区分偏好、执行问题与真实效果，再更新。']
];
const routes=[
 ['S','沉淀与新选题','给原片与商品事实','理解结构 → 提炼机制 → 适配本品 → 新选题与脚本','可检索框架、组件与模板；原片宣称不能变成本品事实。'],
 ['A','限定对象替换','给原片、目标对象与范围','建立原片基准 → 检查适配 → 逐镜替换 → 比对差异','锁定指定原片；只改允许的产品、场景或模特，不另套内容模板。'],
 ['B','原片拍摄方案','给原片与可用音轨','观察画面与声音 → 校准时间 → 写清拍法 → 摄影组交付','只还原指定原片，交付后停止；不自动进入替换或新选题。'],
 ['P','商品驱动策划','给商品事实与目标','商品事实 → 人群与场景 → 购买理由 → 可视证明 → 完整脚本','参考可选、可不采用；指定参考时锁定来源，缺证据不拿其他案例顶替。']
];
function branch(m){const d=m.methodology;return `<div class="ml-branch-body"><span class="ml-state">${esc(d.status)}</span><dl class="ml-branch-grid">${[['input','01 · 取什么证据'],['knowledge','02 · 沉淀什么知识'],['reasoning','03 · 如何拆解判断'],['decision','04 · 怎样检索与执行'],['output','05 · 形成什么产物'],['check','06 · 怎样检验'],['feedback','↺ · 反馈改到哪里']].map(([k,t])=>`<div><dt>${t}</dt><dd>${esc(d[k])}</dd></div>`).join('')}</dl>${m.id==='m13'?routeHtml():''}</div>`}
function routeHtml(){return `<div class="ml-routes"><h4>同一知识库，四种调用边界</h4><p>由用户主动发起创作任务；来源学习负责积累知识，不自动替用户开启制作。</p>${routes.map(r=>`<details class="ml-route"><summary><b>${r[0]}</b><span>${r[1]}</span></summary><div><p><strong>输入：</strong>${r[2]}</p><p>${r[3]}</p><p class="ml-note">${r[4]}</p></div></details>`).join('')}</div>`}
function factory(){return `<div class="ml-factory-proof"><div class="ml-proof-head"><span class="ml-eyebrow">一个已沉淀、可检索的实例</span><h4>一条教学来源，如何变成下一次可用的方法？</h4></div><ol class="ml-trace"><li><span>01 / 来源依据</span><h5>作者教学内容</h5><p>核对“动机反差”公式、段落标签与商品示范，保存来源定位。</p><small>来源：大栗呀 · 抖音<br>作品 7625945506939134848</small></li><li><span>02 / 通用框架</span><h5>抽出段落的职责</h5><p>动机反差 → 痛点 → 产品解法 → 选择理由。保留完整结构与适用边界。</p><small>FW-MOTIVATION-CONTRAST-001<br>v1 · 方法候选</small></li><li><span>03 / 类目模板</span><h5>把结构变成填槽规则</h5><p>冰敷眼贴：使用时刻与有依据的体验。<br>充电器：设备、协议、配置与真实价格。</p><small>两个模板各有来源关联<br>填本品事实，不继承原例功效</small></li></ol><p class="ml-return">↳ 检索时带回：命中理由、适用条件、知识版本、来源与限制；是否采用由当前任务决定。</p><div class="ml-proof-note"><p><b>2026-09-29 只读检索核对：</b>上述 1 个框架与 2 个类目模板均被实际返回。这是单一实例，不是知识库总量，也不是三个独立案例。</p><p>方法提炼已形成产物；知识仍为候选，普遍营销效果未验证。网页展示为静态案例说明，不是在线检索工具。</p></div></div>`}
window.portfolioMethodsV46={branch,factory};
const root=document.querySelector('#factory-methodology');
const m=systems.find(s=>s.id==='s04').modules.find(m=>m.id==='m13');
root.innerHTML=`<div class="pf-wrap"><header class="ml-heading"><div><span class="ml-eyebrow">内容与营销增长域 / 全域内容生产与分发 / 站内工厂</span><h2>站内营销内容生产工厂<br>RAG 方法论</h2></div><div class="ml-heading-aside"><p>把采集到的作品变成可检索、可适配的内容方法，服务本工厂的创作与复用。</p><span class="ml-state">适用范围：站内营销内容生产工厂</span></div></header><ol class="ml-cycle">${phases.map((p,i)=>`<li><span class="ml-step">0${i+1}</span><h3>${p[0]}</h3><b>${p[1]}</b><p>${p[2]}</p></li>`).join('')}</ol><p class="ml-cycle-return">将实际采用与反馈，修订为下一版内容知识 ↶</p><details class="ml-factory-more"><summary>展开完整架构、真实沉淀实例与四种应用入口 <span aria-hidden="true">＋</span></summary><div><section class="ml-spotlight" aria-labelledby="ml-factory-title"><div class="ml-spotlight-copy"><span class="ml-eyebrow">实践样本 / 站内营销内容生产工厂</span><h3 id="ml-factory-title">从“收藏爆款”，<br>到“复用方法”。</h3><p>让 AI 先知道为什么这样表达、什么时候适用，再决定本次内容该怎么做。</p><span class="ml-light-state">本地方法与检索已有实践</span><button type="button" class="ml-button ml-light-button" data-method-case="s04">打开内容工厂案例 ↗</button></div><div class="ml-architecture"><div class="ml-architecture-row"><span>来源层</span><div><b>原片观察 / 教学方法 / 当前商品事实</b><p>方法学习读清结构；复刻和拍摄另外核对逐镜视听证据。商品事实始终独立核验。</p></div></div><div class="ml-architecture-row"><span>知识层</span><div><b>视频案例 · 通用框架 · 策略组件 · 类目模板</b><p>同一事实主库；派生资产带来源与版本，说明适配条件、限制和证据等级。</p></div></div><div class="ml-architecture-row"><span>应用层</span><div><b>按任务检索 → 适配 → 交付 → 反馈</b><p>记录实际采用位置。偏好、制作问题、市场表现分别反馈，复核后追加修订。</p></div></div><p class="ml-tech-note">当前实现：关键词、类目、购买任务与有效状态过滤；本页不将其描述为已上线的向量数据库平台。</p></div></section>
${factory()}<section class="ml-factory-branch"><h3>本工厂如何从知识走到交付</h3>${branch(m)}</section><div class="ml-panel-footer"><a class="ml-download" href="downloads/factory-methodology-v46.md" download>下载本工厂方法论 ↓</a><p class="ml-note">本地方法与检索实践；营销效果仍需真实项目验证。</p></div></div></details></div>`;
root.addEventListener('click',e=>{const b=e.target.closest('[data-method-case]');if(b)window.portfolioUI?.openSystem('s04',b,0)});
if(['#methodology','#methodology-library'].includes(location.hash)){history.replaceState(null,'','#factory-methodology');requestAnimationFrame(()=>root.scrollIntoView({block:'start',behavior:'instant'}))}
})();
