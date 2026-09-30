/* Local material study; existing routes, media, copy and timing remain authoritative. */
(()=>{
 const NS='http://www.w3.org/2000/svg';let surface,mesh,facets,bevel,edgeA,edgeB,lightA,lightB,lastKey='';
 const make=(name,attrs)=>{const el=document.createElementNS(NS,name);for(const[k,v]of Object.entries(attrs))el.setAttribute(k,v);return el;};
 const line=pts=>pts.map((p,i)=>(i?'L':'M')+p.map(v=>v.toFixed(2)).join(' ')).join(' '),closed=pts=>line(pts)+'Z';
 window.renderRibbonMaterial=(path,stage,room)=>{
  if(!surface){
   surface=make('svg',{class:'ribbon-surface',viewBox:'0 0 1000 700',preserveAspectRatio:'none','aria-hidden':'true'});
   surface.innerHTML='<defs><linearGradient id="ribbon-body" x1="0" y1="0" x2=".25" y2="1"><stop stop-color="#1a58bd" stop-opacity=".36"/><stop offset=".17" stop-color="#afecff" stop-opacity=".25"/><stop offset=".39" stop-color="#f3fcff" stop-opacity=".08"/><stop offset=".64" stop-color="#719ecc" stop-opacity=".18"/><stop offset=".84" stop-color="#114db0" stop-opacity=".36"/><stop offset="1" stop-color="#d6f9ff" stop-opacity=".68"/></linearGradient><linearGradient id="ribbon-spectrum"><stop stop-color="#316fc5"/><stop offset=".21" stop-color="#d7f6ff"/><stop offset=".43" stop-color="#79c5ec"/><stop offset=".66" stop-color="#e5f7ff"/><stop offset=".86" stop-color="#4181cc"/><stop offset="1" stop-color="#c2e8ff"/></linearGradient><linearGradient id="rainbow-spectrum" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ee997d" stop-opacity=".42"/><stop offset=".20" stop-color="#edd49b" stop-opacity=".36"/><stop offset=".4" stop-color="#9be0c1" stop-opacity=".22"/><stop offset=".61" stop-color="#80b9ed" stop-opacity=".32"/><stop offset=".82" stop-color="#ac9bdd" stop-opacity=".34"/><stop offset="1" stop-color="#dcbbee" stop-opacity=".4"/></linearGradient></defs>';
   mesh=make('path',{class:'ribbon-mesh'});facets=make('g',{class:'ribbon-facets'});bevel=make('path',{class:'ribbon-bevel'});edgeA=make('path',{class:'ribbon-contour'});edgeB=make('path',{class:'ribbon-contour ribbon-contour-b'});lightA=make('path',{class:'ribbon-current'});lightB=make('path',{class:'ribbon-current ribbon-current-b'});surface.append(bevel,mesh,facets,edgeA,edgeB,lightA,lightB);stage.querySelector('.spatial-film').after(surface);
  }
  const mobile=innerWidth<=680,outdoor=room===4,key=path.getAttribute('d')+'|'+mobile+'|'+outdoor;if(key===lastKey)return;lastKey=key;
  const len=path.getTotalLength(),grid=[],upper=[],lower=[],flow=[],base=outdoor?(mobile?23:36):(mobile?47:64),columns=64,rows=4;
  for(let i=0;i<=columns;i++){
   const t=i/columns,l=t*len,p=path.getPointAtLength(l),a=path.getPointAtLength(Math.max(0,l-1)),b=path.getPointAtLength(Math.min(len,l+1)),dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,nx=-dy/d,ny=dx/d,width=base*(outdoor?1:.80+.20*Math.cos(t*Math.PI*3+room*.8)),strip=[];
   for(let j=0;j<=rows;j++){const v=-1+j*2/rows;strip.push([p.x+nx*width*v,p.y+ny*width*v]);}
   grid.push(strip);upper.push(strip[rows]);lower.push(strip[0]);flow.push([p.x+nx*width*.76,p.y+ny*width*.76]);
  }
  mesh.setAttribute('d',closed([...upper,...lower.slice().reverse()]));mesh.setAttribute('fill',outdoor?'url(#rainbow-spectrum)':'url(#ribbon-body)');const depth=mobile?3:5;bevel.setAttribute('d',closed([...upper,...upper.slice().reverse().map(([x,y])=>[x,y+depth])]));
  const fragments=document.createDocumentFragment();
  for(let i=0;i<columns;i++)for(let j=0;j<rows;j++){
   const p=[grid[i][j],grid[i+1][j],grid[i+1][j+1],grid[i][j+1]],triangles=(i+j)%2?[[p[0],p[1],p[3]],[p[1],p[2],p[3]]]:[[p[0],p[1],p[2]],[p[0],p[2],p[3]]];
   triangles.forEach((tri,k)=>{const value=Math.abs((Math.sin(i*17.13+j*43.7+k*7.91)*43758.54)%1),hue=outdoor?25+(j/rows)*235:199+value*22,color=value>.57?'#f4fcff':`hsl(${hue} 66% ${outdoor?61:43}%)`;fragments.append(make('path',{d:closed(tri),fill:color,'fill-opacity':(.035+value*.14).toFixed(3)}));});
  }
  facets.replaceChildren(fragments);edgeA.setAttribute('d',line(upper));edgeB.setAttribute('d',line(lower));lightA.setAttribute('d',line(upper));lightB.setAttribute('d',line(flow));surface.dataset.outdoor=String(outdoor);
 };
})();
