/* Fixed arrival, reading and return windows, independent of browser toolbar height. */
(function(scope){
 const clamp=v=>Math.max(0,Math.min(1,v));
 const ease=v=>{v=clamp(v);return v*v*(3-2*v)};
 function phase(local){
  if(local<.20)return {name:'transition',focus:0};
  if(local<.32)return {name:'enter',focus:ease((local-.20)/.12)};
  if(local<=.88)return {name:'hold',focus:1};
  if(local<.98)return {name:'return',focus:1-ease((local-.88)/.10)};
  return {name:'docked',focus:0};
 }
 function create(viewportHeight,rooms,compact=true){
  const vh=viewportHeight,points=[{y:0,q:0}],scenes=[];let y=0;
  const add=(distance,q)=>{y+=distance;points.push({y,q})};
  add(vh*.42,.65);
  rooms.forEach((room,index)=>{
   const start=y,base=index+.65;
   add(vh*(index>0&&rooms[index-1]!==room?.32:.12),base+.20);
   const enterStart=y;add(vh*.14,base+.32);
   const readStart=y;add(Math.max(compact?620:640,vh*.9),base+.88);
   const readEnd=y;add(vh*.14,base+.98);add(vh*.05,base+1);
   scenes.push({index,room,start,enterStart,readStart,readEnd,end:y});
  });
  function map(value,from,to){
   if(value<=points[0][from])return points[0][to];
   for(let i=1;i<points.length;i++){const b=points[i],a=points[i-1];if(value<=b[from])return a[to]+(b[to]-a[to])*(value-a[from])/(b[from]-a[from]);}
   return points[points.length-1][to];
  }
  return {distance:y,scenes,qAt:distance=>map(distance,'y','q'),distanceAt:q=>map(q,'q','y')};
 }
 const api={create,phase};if(typeof module!=='undefined'&&module.exports)module.exports=api;else scope.MOBILE_JOURNEY_TIMING=api;
})(typeof window==='undefined'?{}:window);
