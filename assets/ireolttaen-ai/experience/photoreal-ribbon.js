/* Real photographic plates. Media/UI remain native, individually addressable layers.
   Preview only: background transitions are dissolves, not generated video continuity. */
window.PHOTOREAL_JOURNEY = (() => {
  const base='/assets/ireolttaen-ai/experience/correction/photoreal/';
  const frames=[0,1,2,3,4].map(n=>base+`glass-office-k${n}.webp`);
  frames[0]=base+'glass-office-k0-slim.webp';
  // Knots follow the visible front face in each inspected 1672 x 941 plate.
  const curves=[
    [[.16,.205],[.25,.196],[.40,.253],[.56,.322],[.74,.386],[.90,.386],[1,.34]],
    [[0,.072],[.20,.220],[.40,.338],[.60,.397],[.77,.385],[1,.255]],
    [[0,.360],[.14,.291],[.27,.185],[.39,.213],[.56,.298],[.74,.369],[.86,.349],[1,.283]],
    [[0,.09],[.16,.165],[.30,.22],[.40,.285],[.50,.192],[.63,.248],[.78,.345],[1,.34]],
    [[0,.39],[.17,.385],[.31,.19],[.49,.105],[.68,.195],[.85,.36],[1,.53]]
  ];
  // Four distinct subjects per room. Same DOM node returns to the same slot.
  const slots=[[0,1,2,7],[3,5,0,6],[5,2,1,6],[6,7,4,5],[]];
  function curveAt(room,x){
    const c=curves[room];let a=c[0],b=c[1];
    for(let i=1;i<c.length;i++){a=c[i-1];b=c[i];if(x<=b[0])break;}
    const t=Math.max(0,Math.min(1,(x-a[0])/(b[0]-a[0])));
    return {y:a[1]+(b[1]-a[1])*t,slope:(b[1]-a[1])/(b[0]-a[0])};
  }
  function anchor(index,room,w,h){
    const slot=slots[room].indexOf(index);if(slot<0)return null;
    const mobile=w<=680,compact=w/h<1.35,scale=Math.max(w/1672,h/941),iw=1672*scale,ih=941*scale;
    const ox=(w-iw)*(mobile?.4:.5),oy=(h-ih)*.5;
    // Mobile anchors are re-projected onto the visible cropped glass, not off-screen desktop positions.
    const px=compact?w*(.17+slot*.22):ox+iw*[.23,.44,.65,.85][slot];
    const c=curveAt(room,(px-ox)/iw);
    return {x:px,y:oy+c.y*ih,angle:Math.max(-24,Math.min(24,Math.atan2(c.slope*941,1672)*180/Math.PI)),width:compact?w*.22:iw*.18,height:compact?Math.min(100,h*.15,w*.23):ih*.22};
  }
  return {frames,curves,slots,anchor};
})();
