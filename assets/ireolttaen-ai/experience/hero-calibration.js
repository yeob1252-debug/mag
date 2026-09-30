/* Photographic ribbon composition. Media stay separate and clickable.
   Desktop uses four perspective slots; mobile follows the current subject. */
window.HERO_CALIBRATION=(()=>{
 const active=true;
 const baseWidth=1672,baseHeight=941;
 const clamp=v=>Math.max(0,Math.min(1,v));
 const mix=(a,b,t)=>a+(b-a)*t;
 const smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
 const centers=[[.235,.445,.655,.85],[.14,.39,.64,.85],[.15,.38,.64,.85],[.14,.38,.64,.85]];
 let phase={room:0,step:0,local:0,q:0};
 function frame(w,h,room=phase.room){
  const portrait=w<=900,scale=Math.max(w/baseWidth,h/baseHeight);
  let x=(w-baseWidth*scale)/2;
  if(portrait&&room<4){
   const slots=window.PHOTOREAL_JOURNEY.slots[room],slot=Math.max(0,slots.indexOf(phase.step)>=0?slots.indexOf(phase.step):slots.indexOf(phase.step-1));
   const prior=slots.indexOf(Math.max(0,phase.step-1));
   const target=room===0&&slot===0?.30:centers[room][slot];
   const from=prior>=0?(room===0&&prior===0?.30:centers[room][prior]):target;
   const cx=mix(from,target,smooth(phase.local/.18));
   x=Math.max(w-baseWidth*scale,Math.min(0,w*.5-cx*baseWidth*scale));
  }
  return {x,y:0,width:baseWidth*scale,height:baseHeight*scale,scale,portrait};
 }
 function centerY(x,room=phase.room){
  const c=window.PHOTOREAL_JOURNEY.curves[room];let a=c[0],b=c[1];
  for(let i=1;i<c.length;i++){a=c[i-1];b=c[i];if(x<=b[0])break;}
  return mix(a[1],b[1],clamp((x-a[0])/(b[0]-a[0])));
 }
 function dockQuad(index,w,h,room=phase.room){
  const slot=window.PHOTOREAL_JOURNEY.slots[room].indexOf(index);if(slot<0||room>3)return null;
  const f=frame(w,h,room),isPortrait=index===0;
  let height=isPortrait?(f.portrait?.245:.205):.164;
  const width=isPortrait?height*baseHeight/baseWidth*9/16:(f.portrait?.175:Math.min(.175,w*.20/f.width));
  if(!isPortrait)height=width*baseWidth/baseHeight/1.6;
  const safe=(24+width*f.width/2),natural=f.x+centers[room][slot]*f.width;
  const px=f.portrait?natural:Math.max(safe,Math.min(w-safe,w*[.17,.40,.63,.86][slot]));
  const cx=(px-f.x)/f.width;
  const xl=cx-width/2,xr=cx+width/2,yl=centerY(xl,room),yr=centerY(xr,room);
  return [[xl,yl-height*.51],[xr,yr-height*.49],[xr,yr+height*.49],[xl,yl+height*.51]].map(([x,y])=>[f.x+x*f.width,f.y+y*f.height]);
 }
 function frontQuad(index,w,h){
  const mobile=w<=900,portrait=index===0,ratio=portrait?9/16:16/10;
  const copy=document.querySelector(`.spatial-copy[data-copy="${index}"]`);
  const top=mobile?Math.max(168,(copy?.offsetHeight||180)+h*.03+16):h*.18;
  const bottom=h-48;
  const maxW=mobile?w*.88:w*.46,maxH=mobile?Math.min(h*.57,bottom-top):h*.66;
  const width=Math.min(maxW,maxH*ratio),height=width/ratio;
  const cx=mobile?w*.5:w*.72,cy=mobile?top+(bottom-top)/2:h*.53;
  return [[cx-width/2,cy-height/2],[cx+width/2,cy-height/2],[cx+width/2,cy+height/2],[cx-width/2,cy+height/2]];
 }
 // Solve homography from source rectangle to the four destination corners.
 function projective(quad,width,height){
  const src=[[0,0],[width,0],[width,height],[0,height]],a=[];
  for(let i=0;i<4;i++){const [x,y]=src[i],[u,v]=quad[i];a.push([x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v]);}
  for(let c=0;c<8;c++){
   let p=c;for(let r=c+1;r<8;r++)if(Math.abs(a[r][c])>Math.abs(a[p][c]))p=r;
   if(Math.abs(a[p][c])<1e-10)return null;
   [a[c],a[p]]=[a[p],a[c]];const div=a[c][c];for(let j=c;j<9;j++)a[c][j]/=div;
   for(let r=0;r<8;r++)if(r!==c){const s=a[r][c];for(let j=c;j<9;j++)a[r][j]-=s*a[c][j];}
  }
  const [a0,a1,a2,a3,a4,a5,a6,a7]=a.map(row=>row[8]);
  return [a0,a3,0,a6,a1,a4,0,a7,0,0,1,0,a2,a5,0,1];
 }
 function render({stage,tiles,room,focus,step,w,h,q,local,tail,previousRoom,roomMix}){
  const enabled=active&&room<4;stage.classList.toggle('ribbon-calibrated',enabled);
  stage.classList.toggle('hero-calibrated',enabled&&room===0);
  if(!active||(room===4&&roomMix>=.15))return;
  phase={room,step,local,q};stage.classList.toggle('hero-reading',focus>.6);
  const readingQuad=focus>0?frontQuad(step,w,h):null;
  stage.querySelectorAll('.spatial-rooms>img').forEach((img,n)=>{
   const box=frame(w,h,Math.min(n,3));
   for(const [key,value] of Object.entries({x:box.x,y:box.y,w:box.width,h:box.height}))img.style.setProperty('--plate-'+key,value+'px');
  });
  stage.style.setProperty('--reading-focus',String(focus));
  tiles.forEach((el,index)=>{
   const now=dockQuad(index,w,h),before=dockQuad(index,w,h,previousRoom);
   if(!now&&!before)return;
   let dock=(before||now).map((p,i)=>p.map((v,j)=>mix(v,(now||before)[i][j],room?roomMix:1)));
   const tracked=window.CINEMATIC_JOURNEY?.trackQuad({index,room,roomMix,before,now,dock,w,h});
   if(tracked){dock=tracked.quad;el.style.opacity=String(tracked.opacity);el.dataset.trackedProgress=tracked.progress.toFixed(3)}else delete el.dataset.trackedProgress;
   const f=index===step?focus:0,front=f>0?readingQuad:dock;
   // The same four corners straighten in place before the panel comes forward.
   const travel=smooth((f-.10)/.90),lift=Math.sin(travel*Math.PI)*Math.min(32,h*.045);
   const quad=dock.map((p,i)=>p.map((v,j)=>mix(v,front[i][j],travel)-(j===1?lift:0)));
   const bw=index===0?360:640,bh=index===0?640:400,matrix=projective(quad,bw,bh);
   if(!matrix)return;
   el.style.left='0';el.style.top='0';el.style.width=bw+'px';el.style.height=bh+'px';
   const clean=matrix.map(v=>Math.abs(v)<1e-10?0:v);
   el.style.transform='matrix3d('+clean.join(',')+')';
   el.style.setProperty('--glass-contact',String(1-f));
   el.style.setProperty('--panel-depth',String(f));
  });
  if(w<=900&&q<1.1){const intro=stage.querySelector('.spatial-intro');intro.style.opacity=String(1-smooth((q-.74)/.23));intro.inert=q>.82;}
 }
 return {active,frame,dockQuad,frontQuad,projective,render};
})();
