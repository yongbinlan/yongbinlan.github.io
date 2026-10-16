(()=>{'use strict';const data=JSON.parse(document.getElementById('github-project-data').textContent),dialog=document.getElementById('gh-image-dialog');let index=0,opener=null,oldOverflow='';
const render=()=>{const p=data[index],image=document.getElementById('gh-dialog-image');document.getElementById('gh-dialog-title').textContent=p.name;image.src=p.image||`assets/github-v63/${p.id}.webp`;image.alt=`${p.name}：${p.caption}`;document.getElementById('gh-dialog-caption').textContent=`${index+1} / ${data.length} · ${p.caption}`;};
document.querySelectorAll('[data-gh-image]').forEach(button=>button.addEventListener('click',()=>{opener=button;index=data.findIndex(p=>p.id===button.dataset.ghImage);render();oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();}));
dialog.querySelector('.gh-dialog-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
dialog.addEventListener('close',()=>{document.body.style.overflow=oldOverflow;opener?.focus({preventScroll:true});});
dialog.querySelector('[data-gh-prev]').addEventListener('click',()=>{index=(index+data.length-1)%data.length;render();});dialog.querySelector('[data-gh-next]').addEventListener('click',()=>{index=(index+1)%data.length;render();});
dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();index=(index+(e.key==='ArrowLeft'?data.length-1:1))%data.length;render();}});
window.githubProjectsV63={count:data.length};})();
