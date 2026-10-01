/* Background-only video contract. Content, prices and click targets remain HTML.
   An entry is enabled only after that exact exported clip passes visual QA. */
window.CINEMATIC_ASSETS={
 "version": 5,
 "loops": [
  {
   "src": "/assets/ireolttaen-ai/experience/cinematic/main-flow-v2.mp4",
   "verified": true,
   "method": "fixed approved plate; locally advected photographic glass material; no reverse frames"
  },
  {
   "src": "/assets/ireolttaen-ai/experience/cinematic/showroom-flow-v2.mp4",
   "verified": true,
   "method": "fixed approved plate; locally advected photographic glass material; no reverse frames"
  },
  {
   "src": "/assets/ireolttaen-ai/experience/cinematic/workspace-flow-v2.mp4",
   "verified": true,
   "method": "fixed approved plate; locally advected photographic glass material; no reverse frames"
  },
  {
   "src": "/assets/ireolttaen-ai/experience/cinematic/exit-flow-v2.mp4",
   "verified": true,
   "method": "fixed approved plate and protected person; locally advected photographic glass material; no reverse frames"
  },
  {
   "src": "/assets/ireolttaen-ai/experience/cinematic/meadow-flow-v2.mp4",
   "verified": true,
   "method": "fixed approved rainbow arch; locally advected photographic glass material in one direction"
  }
 ],
 "transitions": [
  {
   "src": "/assets/ireolttaen-ai/experience/cinematic/transition-01.mp4?v=2",
   "verified": true,
   "job": "53b36865-6b4f-41a8-ba97-911e2c347fe0",
   "track": "office-showroom"
  },
  {
   "src": "/assets/ireolttaen-ai/experience/cinematic/transition-12.mp4?v=2",
   "verified": true,
   "job": "a3f4ff1a-7133-4a53-8dcc-a167c93ebadb",
   "track": "showroom-workspace"
  },
  {
   "src": "/assets/ireolttaen-ai/experience/cinematic/transition-23.mp4?v=2",
   "verified": true,
   "job": "8d46208e-849a-4a84-aa03-f14656504b94",
   "track": "workspace-exit"
  },
  {
   "src": "/assets/ireolttaen-ai/experience/cinematic/transition-34.mp4?v=2",
   "verified": true,
   "job": "a0b21b03-18c4-4e83-a974-b6b499112f35",
   "track": null
  }
 ],
 "outdoorTransitionMobile": {
  "src": "/assets/ireolttaen-ai/experience/cinematic/transition-34-mobile.mp4",
  "verified": true,
  "portrait": true,
  "job": "af0e10e0-54aa-4680-b7ec-346f6965e283"
 },
 "outdoorMobile": {
  "src": "/assets/ireolttaen-ai/experience/cinematic/meadow-mobile-flow-v2.mp4",
  "verified": true,
  "method": "fixed approved portrait rainbow arch; locally advected photographic glass material in one direction"
 }
};
window.CINEMATIC_JOURNEY=(()=>{
 let root,stage,layer,roomVideos=[],transition,drawAgain=()=>{},scheduled=false;
 const clamp=v=>Math.max(0,Math.min(1,v));
 const mix=(a,b,t)=>a+(b-a)*t;
 function makeVideo(kind){
  const v=document.createElement('video');v.className=kind;v.muted=true;v.defaultMuted=true;v.playsInline=true;v.preload='none';v.setAttribute('aria-hidden','true');
  v.addEventListener('loadeddata',()=>{v.dataset.ready='true';drawAgain()});
  v.addEventListener('error',()=>{v.dataset.ready='false';v.dataset.failed='true';v.style.opacity='0'});
  layer.append(v);return v;
 }
 function source(v,asset){
  if(!asset?.src||asset.verified!==true)return false;
  if(v.dataset.source!==asset.src){v.pause();v.dataset.ready='false';v.dataset.failed='false';v.dataset.presentedTime='0';v.dataset.source=asset.src;v.src=asset.src;v.load()}
  return true;
 }
 function place(v,box){for(const [key,value]of Object.entries({left:box.x,top:box.y,width:box.width,height:box.height}))v.style[key]=value+'px'}
 function fit(w,h,room){
  if(room===4&&w<=680)return{x:0,y:0,width:w,height:h};
  return window.HERO_CALIBRATION.frame(w,h,room);
 }
 function pause(){roomVideos.forEach(v=>v.pause());transition?.pause()}
 function attach(s,r,redraw){
  if(stage===s)return;stage=s;root=r;drawAgain=redraw;layer=s.querySelector('.spatial-rooms');
  roomVideos=Array.from({length:5},(_,n)=>{const v=makeVideo('cinematic-loop');v.loop=true;v.dataset.room=String(n);return v});
  transition=makeVideo('cinematic-transition');
  transition.addEventListener('seeked',()=>{transition.dataset.seeking='false';transition.dataset.presentedTime=String(transition.currentTime);if(!scheduled){scheduled=true;requestAnimationFrame(()=>{scheduled=false;drawAgain()})}});
 }
 function render({room,previousRoom,roomMix,tail,w,h,reduced,onScreen,q}){
  if(!stage)return;
  const A=window.CINEMATIC_ASSETS,allowed=!reduced&&!document.hidden&&onScreen;
  const isTransit=room>0&&roomMix>0&&roomMix<1;
  roomVideos.forEach((v,n)=>{
   const opacity=n===room?(room?roomMix:1):n===previousRoom?1-roomMix:0;
   const asset=n===4&&w<=680?(A.outdoorMobile||A.loops[n]):A.loops[n];
   const active=opacity>.001&&allowed;
   if(active)source(v,asset);
   const fullBleed=n===4;
   place(v,fullBleed?{x:0,y:0,width:w,height:h}:fit(w,h,n));
   v.style.objectFit=fullBleed?'cover':'fill';
   v.style.objectPosition=fullBleed&&n!==4&&w<=680?'40% center':'center';
   v.style.opacity=v.dataset.ready==='true'?String(opacity):'0';
   if(active&&v.dataset.ready==='true'&&!isTransit){if(v.paused)v.play().catch(()=>{});}else if(!v.paused)v.pause();
  });
  const nextBoundary=room<3?room+1+.65:(window.SPATIAL_CHAPTERS?.length||4)+.65;
  const transitionAsset=n=>n===3&&w<=680&&A.outdoorTransitionMobile?.verified?A.outdoorTransitionMobile:A.transitions[n];
  if(allowed&&!isTransit&&room<4&&Number.isFinite(q)&&q>nextBoundary-.95){const next=transitionAsset(room);if(next?.verified){transition.preload="auto";source(transition,next)}}
  const asset=transitionAsset(room-1);
  const enabled=allowed&&isTransit&&asset?.verified===true;
  if(enabled&&source(transition,asset)){
   const from=fit(w,h,previousRoom),to=fit(w,h,room),box={};
   for(const k of ['x','y','width','height'])box[k]=mix(from[k],to[k],roomMix);
   // Outdoor portrait framing is separate from the landscape camera move.
   if(asset.portrait)Object.assign(box,{x:0,y:0,width:w,height:h});
   else if(room===4&&w<=680){const scale=Math.max(w/1672,h/941);Object.assign(box,{x:mix(from.x,(w-1672*scale)/2,roomMix),y:0,width:mix(from.width,1672*scale,roomMix),height:mix(from.height,941*scale,roomMix)})}
   transition.style.objectFit=asset.portrait?'cover':'fill';
   place(transition,box);
   if(Number.isFinite(transition.duration)&&transition.duration>0){
    const time=clamp(roomMix)*Math.max(0,transition.duration-.04);
    if(!transition.seeking&&Math.abs(transition.currentTime-time)>.035){transition.dataset.seeking='true';transition.currentTime=time;}
    const edge=Math.min(clamp(roomMix/.08),clamp((1-roomMix)/.08));
    transition.style.opacity=transition.dataset.ready==='true'?String(edge):'0';
   }
  }else{transition.style.opacity='0';transition.pause();}
  stage.dataset.backgroundVideo=enabled?'transition':roomVideos[room]?.dataset.ready==='true'?'loop':'poster';
  stage.dataset.videoContract='five-loops-four-transitions';
 }
 // Measured centerline samples from the generated office-to-showroom footage.
 // A generated camera move is not the straight interpolation between two posters.
 const showroomTrack=[
 [[.16,.205],[.25,.196],[.40,.253],[.56,.322],[.74,.386],[.90,.386],[1,.34]],
 [[.13,.21],[.25,.22],[.40,.28],[.60,.36],[.80,.39],[1,.32]],
 [[.11,.22],[.25,.245],[.40,.32],[.55,.40],[.75,.38],[1,.13]],
 [[.045,.25],[.20,.285],[.40,.39],[.54,.40],[.74,.255],[1,-.05]],
 [[0,.18],[.10,.26],[.30,.35],[.45,.33],[.57,.20],[.75,-.07]],
 [[0,.16],[.12,.23],[.25,.265],[.32,.22],[.40,.12],[.47,.045],[.57,-.05]],
 [[0,.155],[.12,.08],[.25,.09],[.38,.18],[.49,.27],[.59,.285]],
 [[0,.115],[.12,.20],[.25,.35],[.44,.49],[.65,.49],[.86,.42]],
 [[0,.11],[.20,.29],[.40,.42],[.60,.49],[.80,.44],[1,.25]],
 [[0,.09],[.20,.24],[.40,.365],[.60,.45],[.80,.45],[1,.29]],
 [[0,.072],[.20,.220],[.40,.338],[.60,.397],[.77,.385],[1,.255]]
 ];
 const videoTracks={"office-showroom":showroomTrack,"showroom-workspace":[[[0, 0.072], [0.2, 0.22], [0.4, 0.338], [0.6, 0.397], [0.77, 0.385], [1, 0.255]], [[0, 0.1], [0.2, 0.3], [0.4, 0.43], [0.6, 0.5], [0.8, 0.49], [1, 0.3]], [[0, 0.13], [0.2, 0.32], [0.4, 0.48], [0.6, 0.55], [0.8, 0.55], [1, 0.35]], [[0, 0.18], [0.2, 0.38], [0.4, 0.5], [0.6, 0.55], [0.8, 0.54], [1, 0.36]], [[0, 0.22], [0.2, 0.39], [0.4, 0.48], [0.6, 0.55], [0.8, 0.52], [1, 0.33]], [[0, 0.28], [0.2, 0.4], [0.35, 0.43], [0.5, 0.49], [0.62, 0.515], [0.8, 0.46], [1, 0.28]], [[0, 0.3], [0.12, 0.35], [0.3, 0.32], [0.5, 0.45], [0.7, 0.49], [0.85, 0.4], [1, 0.22]], [[0, 0.28], [0.15, 0.29], [0.3, 0.16], [0.42, 0.25], [0.6, 0.39], [0.78, 0.4], [1, 0.24]], [[0, 0.29], [0.15, 0.25], [0.3, 0.14], [0.42, 0.22], [0.6, 0.35], [0.8, 0.36], [1, 0.27]], [[0, 0.33], [0.14, 0.27], [0.27, 0.17], [0.39, 0.2], [0.56, 0.28], [0.74, 0.35], [0.86, 0.34], [1, 0.27]], [[0, 0.36], [0.14, 0.291], [0.27, 0.185], [0.39, 0.213], [0.56, 0.298], [0.74, 0.369], [0.86, 0.349], [1, 0.283]]],"workspace-exit":[[[0, 0.36], [0.14, 0.291], [0.27, 0.185], [0.39, 0.213], [0.56, 0.298], [0.74, 0.369], [0.86, 0.349], [1, 0.283]], [[0, 0.29], [0.2, 0.17], [0.35, 0.13], [0.5, 0.27], [0.7, 0.35], [0.8, 0.37], [1, 0.27]], [[0, 0.3], [0.16, 0.16], [0.3, 0.08], [0.45, 0.15], [0.6, 0.3], [0.8, 0.36], [1, 0.23]], [[0, 0.2], [0.13, 0.09], [0.25, 0.14], [0.4, 0.25], [0.6, 0.37], [0.8, 0.35], [1, 0.22]], [[0, 0.1], [0.13, 0.11], [0.3, 0.23], [0.5, 0.38], [0.7, 0.4], [0.9, 0.35], [1, 0.28]], [[0, 0.07], [0.2, 0.14], [0.4, 0.26], [0.6, 0.38], [0.75, 0.4], [1, 0.29]], [[0, 0.09], [0.2, 0.19], [0.4, 0.25], [0.5, 0.37], [0.7, 0.4], [0.9, 0.3], [1, 0.23]], [[0, 0.09], [0.2, 0.15], [0.4, 0.22], [0.6, 0.4], [0.8, 0.3], [1, 0.2]], [[0, 0.09], [0.16, 0.165], [0.3, 0.22], [0.4, 0.285], [0.5, 0.192], [0.63, 0.248], [0.78, 0.345], [1, 0.34]], [[0, 0.09], [0.16, 0.165], [0.3, 0.22], [0.4, 0.285], [0.5, 0.192], [0.63, 0.248], [0.78, 0.345], [1, 0.34]], [[0, 0.09], [0.16, 0.165], [0.3, 0.22], [0.4, 0.285], [0.5, 0.192], [0.63, 0.248], [0.78, 0.345], [1, 0.34]]]};
 function trackQuad({index,room,roomMix,before,now,dock,w,h}){
  const asset=window.CINEMATIC_ASSETS.transitions[room-1];
  if(!videoTracks[asset?.track]||roomMix<=0||roomMix>=1||transition?.dataset.ready!=='true'||transition.dataset.source!==asset.src)return null;
  const p=clamp(Number(transition.dataset.presentedTime||0)/Math.max(.1,transition.duration-.04));
  const track=videoTracks[asset.track],u=p*(track.length-1),a=track[Math.floor(u)],b=track[Math.min(track.length-1,Math.floor(u)+1)],t=u-Math.floor(u);
  const at=(curve,x)=>{let i=1;while(i<curve.length-1&&x>curve[i][0])i++;const A=curve[i-1],B=curve[i];return mix(A[1],B[1],clamp((x-A[0])/(B[0]-A[0])))};
  const y=x=>mix(at(a,x),at(b,x),t);
  const smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
  const from=fit(w,h,room-1),to=fit(w,h,room),box={};for(const k of ['x','y','width','height'])box[k]=mix(from[k],to[k],roomMix);
  const oldSlot=window.PHOTOREAL_JOURNEY.slots[room-1].indexOf(index),newSlot=window.PHOTOREAL_JOURNEY.slots[room].indexOf(index);
  // Replace subjects one slot at a time. A subject leaves before another enters;
  // keeping two independently interpolated subjects would make them cross/overlap.
  const exits=oldSlot<0?0:1-smooth((p-([.2,.4,.6,.8][oldSlot]-.07))/.07);
  const enters=newSlot<0?0:smooth((p-[.2,.4,.6,.8][newSlot])/.07);
  const incoming=enters>exits,slot=incoming?newSlot:oldSlot,presence=Math.max(exits,enters);
  if(slot<0)return{quad:dock,opacity:0,progress:p};
  const min=Math.max(0,mix(a[0][0],b[0][0],t)),max=Math.min(1,mix(a.at(-1)[0],b.at(-1)[0],t));
  const x=mix(min,max,[.10,.365,.635,.90][slot]);
  const selected=(incoming?now:before)||now||before;
  const base=(incoming?to:from),originalWidth=(selected[1][0]-selected[0][0])/base.width;
  const width=Math.min(originalWidth,(max-min)*(index===0?.09:.22));
  const height=width*1672/941/(index===0?9/16:1.6);
  const xl=x-width/2,xr=x+width/2;
  let quad=[[xl,y(xl)-height/2],[xr,y(xr)-height/2],[xr,y(xr)+height/2],[xl,y(xl)+height/2]].map(([X,Y])=>[box.x+X*box.width,box.y+Y*box.height]);
  const edge=Math.min(smooth(p/.1),smooth((1-p)/.1));
  quad=quad.map((v,i)=>v.map((n,j)=>mix(dock[i][j],n,edge)));
  return{quad,opacity:presence,progress:p};
 }
 return{attach,render,pause,trackQuad};
})();
