/* Native scroll remains the only clock. No touch interception, snap or timer. */
(function(scope){
 function create(viewportHeight,rooms){
  const vh=viewportHeight,points=[{y:0,q:0}],scenes=[];
  let y=0;
  const add=(distance,q)=>{y+=distance;points.push({y,q})};
  add(vh*.42,.65);
  rooms.forEach((room,index)=>{
   const start=y,base=index+.65;
   // Give a camera move its own distance before the next panel comes forward.
   add(vh*(index>0&&rooms[index-1]!==room?.32:.14),base+.20);
   const enterStart=y;
   add(vh*.20,base+.38);
   const readStart=y;
   add(Math.max(560,vh*.70),base+.80);
   const readEnd=y;
   add(vh*.18,base+1);
   scenes.push({index,room,start,enterStart,readStart,readEnd,end:y});
  });
  function map(value,from,to){
   if(value<=points[0][from])return points[0][to];
   for(let i=1;i<points.length;i++){
    const b=points[i],a=points[i-1];
    if(value<=b[from])return a[to]+(b[to]-a[to])*(value-a[from])/(b[from]-a[from]);
   }
   return points[points.length-1][to];
  }
  return {distance:y,scenes,qAt:distance=>map(distance,'y','q'),distanceAt:q=>map(q,'q','y')};
 }
 const api={create};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else scope.MOBILE_JOURNEY_TIMING=api;
})(typeof window==='undefined'?{}:window);
