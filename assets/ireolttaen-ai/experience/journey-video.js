/* Background camera obeys scroll; foreground videos keep their independent loop. */
(()=>{
 const stage=document.querySelector('.spatial-stage');if(!stage)return;
 const rooms=stage.querySelector('.spatial-rooms'),still=[...rooms.querySelectorAll('img')];
 const mobile=matchMedia('(max-width:680px)').matches;
 const videos=[0,1,2,3].map(n=>{const v=document.createElement('video');v.className='journey-video';v.muted=true;v.playsInline=true;v.preload='none';v.setAttribute('aria-hidden','true');v.dataset.src='/assets/ireolttaen-ai/journey/transition-'+n+(mobile?'-mobile':'')+'.mp4';rooms.append(v);return v;});
 let active=-1,frame=0;const target=new Map(),clamp=n=>Math.max(0,Math.min(1,n));
 function seek(v,time){target.set(v,time);if(v.seeking||!v.duration)return;if(Math.abs(v.currentTime-time)>.025)v.currentTime=time;}
 videos.forEach(v=>{v.addEventListener('seeked',()=>{const t=target.get(v);if(t!==undefined&&Math.abs(v.currentTime-t)>.04)seek(v,t);});v.addEventListener('loadeddata',schedule);v.addEventListener('error',()=>{v.dataset.failed='true';v.style.opacity=0;});});
 function draw(){frame=0;const q=Number(stage.dataset.progress||0),room=Number(stage.dataset.room||0),tail=stage.classList.contains('tail-mode');
  if(document.body.classList.contains('motion-off')||navigator.connection?.saveData){videos.forEach(v=>v.style.opacity=0);return;}
  let index=-1,t=0;
  // Use the return/docked interval and next emergence for camera travel.
  for(const [i,start,end] of [[0,3.35,3.86],[1,5.35,5.86],[2,6.35,6.86]])if(q>=start&&q<=end){index=i;t=clamp((q-start)/(end-start));}
  if(tail&&room===4){index=3;const p=document.querySelector('#portfolio').getBoundingClientRect();t=clamp((innerHeight-p.top)/(innerHeight*.65));}
  if(index!==active){videos.forEach(v=>v.style.opacity=0);active=index;}
  const near=q<3?0:q<5?1:q<6?2:3;
  if(!videos[near].src){videos[near].src=videos[near].dataset.src;videos[near].load();}
  if(index>=0){const v=videos[index];if(!v.src){v.src=v.dataset.src;v.load();}if(v.readyState>=2&&!v.dataset.failed){seek(v,Math.min(v.duration-.04,t*v.duration));v.style.opacity='1';}else v.style.opacity='0';}
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(draw);}
 new MutationObserver(schedule).observe(stage,{attributes:true,attributeFilter:['data-progress','data-room','class']});
 new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});addEventListener('resize',schedule,{passive:true});schedule();
})();
