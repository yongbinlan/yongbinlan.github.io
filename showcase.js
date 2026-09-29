(()=>{
 'use strict';
 const cases=JSON.parse(document.getElementById('showcase-data').textContent);
 const dialog=document.getElementById('film-dialog');const video=dialog.querySelector('video');
 const status=dialog.querySelector('.play-status');let opener=null;let current=null;
 const stamp=t=>`0:${String(Math.floor(t)).padStart(2,'0')}`;
 function openFilm(id,button){
  const c=cases.find(x=>x.id===id);if(!c)return;current=c;opener=button;
  dialog.querySelector('#film-title').textContent=c.title;
  dialog.querySelector('.film-subtitle').textContent=c.subtitle;
  dialog.querySelector('.film-description').textContent=c.description;
  dialog.querySelector('.film-format').textContent=`${c.category} / ${c.duration.toFixed(1)} 秒`;
  const beats=dialog.querySelector('.film-beats');beats.replaceChildren();
  c.beats.forEach(b=>{const el=document.createElement('button');el.type='button';el.dataset.seek=b.time;const time=document.createElement('b');time.textContent=stamp(b.time);el.append(time,document.createTextNode(b.label));beats.append(el);});
  const tags=dialog.querySelector('.film-tags');tags.replaceChildren();c.skills.forEach(s=>{const e=document.createElement('span');e.textContent=s;tags.append(e)});
  const direct=dialog.querySelector('.film-original');direct.href=c.video;direct.download=c.title+'.mp4';
  video.poster=c.poster;video.src=c.video;video.load();status.textContent='正在加载视频…';
  dialog.showModal();dialog.scrollTop=0;dialog.querySelector('.film-close').focus();
  video.play().catch(()=>{if(!video.error&&dialog.open)status.textContent='点击视频播放键，开始观看。'});
 }
 document.querySelectorAll('[data-film]').forEach(b=>b.addEventListener('click',()=>openFilm(b.dataset.film,b)));
 dialog.querySelector('.film-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',e=>{
  const b=e.target.closest('[data-seek]');if(b&&video.readyState>=1){video.currentTime=Math.min(Number(b.dataset.seek),video.duration);video.play().catch(()=>{});}
  if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}
 });
 video.addEventListener('playing',()=>status.textContent='正在播放 · 可点选镜头节点');
 video.addEventListener('pause',()=>{if(dialog.open&&current&&!video.error)status.textContent='已暂停 · 点击播放键继续'});
 video.addEventListener('ended',()=>status.textContent='播放结束 · 可重播或选择镜头节点');
 video.addEventListener('error',()=>{if(dialog.open)status.textContent='视频暂时无法加载，可尝试下方“下载视频”后观看。'});
 dialog.addEventListener('close',()=>{video.pause();video.removeAttribute('src');video.load();current=null;if(opener?.isConnected)opener.focus()});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause()});
})();
