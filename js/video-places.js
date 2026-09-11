(() => {
  'use strict';
  // MAIN releases the four exact files after visual review; posters remain usable before release.
  const released = true;
  const rootPath = '/assets/video-places/';
  const files = {meal:'m01-meal-v1',filming:'m02-filming-v1',editing:'m03-editing-v1',japan:'m04-japan-v1'};
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const entries = [];
  let active = null, frame = 0, manuallyPaused = false;
  const hero = document.querySelector('#hero-preview');
  const gallery = document.querySelector('[data-phone-scene]');
  const svg = name => {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="/assets/icons/video-controls.svg#${name}"></use></svg>`;
  };
  const stage = root => Number(root?.dataset.storyIndex || 0);
  function install(selector, key, allowed = () => true, className = '') {
    const image = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!image) return null;
    const wrapper = document.createElement('span');
    wrapper.className = `mv-media ${className}`;
    wrapper.dataset.mediaKey = key;
    const originalClasses = image.className;
    image.src = `${rootPath}${files[key]}.webp`;
    image.before(wrapper);
    wrapper.append(image);
    const video = document.createElement('video');
    video.muted = true; video.defaultMuted = true; video.playsInline = true; video.preload = 'none';
    video.setAttribute('aria-hidden','true'); video.tabIndex=-1;
    if (released) video.poster = `${rootPath}${files[key]}.webp`;
    wrapper.append(video);
    const entry = {wrapper,video,key,allowed,done:false,failed:false,loaded:false,originalClasses};
    entries.push(entry);
    video.addEventListener('loadeddata',()=>{wrapper.dataset.ready='true';});
    video.addEventListener('playing',()=>{wrapper.dataset.playing='true';});
    video.addEventListener('pause',()=>{wrapper.dataset.playing='false';});
    video.addEventListener('ended',()=>{entry.done=true;wrapper.dataset.state='held';sync();});
    video.addEventListener('error',()=>{entry.failed=true;wrapper.dataset.ready='false';wrapper.dataset.state='fallback';video.pause();});
    return entry;
  }
  function controls(parent, includeSkip = false) {
    if(!parent)return;
    const bar=document.createElement('div');bar.className='mv-controls';bar.setAttribute('role','group');bar.setAttribute('aria-label','영상 재생 제어');
    const button=(name,label,handler)=>{const b=document.createElement('button');b.type='button';b.title=label;b.setAttribute('aria-label',label);b.dataset.mediaControl=name;b.innerHTML=svg(name);b.addEventListener('click',handler);bar.append(b);return b;};
    if(!includeSkip)button('pause','영상 일시정지',()=>{manuallyPaused=!manuallyPaused;sync();});
    button('replay','현재 영상 다시 보기',()=>{manuallyPaused=false;if(active&&!active.failed){active.done=false;active.video.currentTime=0;}sync();});
    if(includeSkip)button('skip','과정·매장 홍보 선택으로 건너뛰기',()=>window.matgamsaScrollStories?.goTo(hero,6));
    parent.append(bar);
  }
  if(hero){
    const first=document.createElement('img');first.src='/assets/generated/matgamsa-category-korean.webp';first.alt='한 끼를 콘텐츠로 준비하는 메뉴';
    const thumb=document.createElement('div');thumb.className='mv-plan-meal';thumb.append(first);
    hero.querySelector('.phone-app')?.after(thumb);
    install(first,'meal',()=>stage(hero)===1);
    install('.screen-shoot>img','filming',()=>stage(hero)===2);
    const editScene=document.createElement('div');editScene.className='mv-editing-scene';
    const editImage=document.createElement('img');editImage.alt='촬영한 장면을 휴대폰으로 편집하는 과정';editScene.append(editImage);
    hero.querySelector('.phone-share')?.append(editScene);
    install(editImage,'editing',()=>stage(hero)===3 && gallery?.dataset.shareState==='edit');
    install('.editor-preview>img','meal',()=>stage(hero)===3 && ['caption','upload'].includes(gallery?.dataset.shareState));
    const feed=install('.feed-photo>img','meal',()=>stage(hero)===3 && gallery?.dataset.shareState==='feed');
    if(feed)feed.wrapper.dataset.result='post';
    const particles=document.createElement('div');particles.className='mv-social-rise';particles.setAttribute('aria-hidden','true');
    hero.querySelectorAll('.feed-icons>svg').forEach((node,i)=>{if(i===2)return;const part=document.createElement('span');part.style.setProperty('--order',String(i));part.append(node.cloneNode(true));particles.append(part);});
    hero.querySelector('.phone-share')?.append(particles);
    const rail=document.createElement('div');rail.className='mv-hero-rail';
    rail.innerHTML='<a href="#preview-handoff">과정·매장 홍보 선택</a>';
    controls(rail,true);hero.querySelector('.hero-sticky')?.append(rail);
    document.querySelector('[data-motion-toggle]')?.addEventListener('click',event=>{manuallyPaused=event.currentTarget.getAttribute('aria-pressed')==='true';sync();});
  }
  const benefit=document.querySelector('[data-story-kind="benefits"]');
  install('[data-benefit-screen="1"]>img','filming',()=>stage(benefit)===1 || benefit?.dataset.mobileLayout==='flow');
  install('[data-benefit-screen="2"]>img','meal',()=>stage(benefit)===2 || benefit?.dataset.mobileLayout==='flow','mv-benefit-post');
  controls(document.querySelector('.benefit-device'));
  const owner=document.querySelector('#selection-standard');
  install('.post-one>img','meal',()=>stage(owner)===0 || owner?.dataset.mobileLayout==='flow');
  install('.post-two>img','meal',()=>stage(owner)>0 || owner?.dataset.mobileLayout==='flow','mv-owner-output');
  const output=document.querySelector('.post-two>div');
  if(output){
    output.insertAdjacentHTML('beforeend','<p class="mv-owner-format"><span>세로 숏폼</span><span>메뉴·지역 정보</span></p>');
  }
  controls(document.querySelector('.content-network'));
  const courseHero=document.querySelector('[data-story-kind="course-hero"]');
  install('.course-phone--plan .course-phone-screen>img','meal',()=>stage(courseHero)===0);
  install('.course-phone--shoot .course-phone-screen>img','filming',()=>stage(courseHero)<=1);
  // The upload scene is a stable result; the middle course story carries the editing action.
  const course=document.querySelector('#course-flow');
  install('[data-lesson-screen="shoot"]>img','filming',()=>stage(course)===2);
  install('[data-lesson-screen="edit"]>img','editing',()=>stage(course)===3);
  install('[data-lesson-screen="upload"]>img','meal',()=>stage(course)===4);
  controls(document.querySelector('.course-lesson-device'));
  controls(document.querySelector('.course-phone-scene'));
  const channelImage=document.querySelector('[data-video-slot="places-channel"]');
  let channel=install(channelImage,'meal');
  if(channel)controls(document.querySelector('.places-hero-copy'));
  document.addEventListener('matgamsa:countrychange',event=>{
    if(!channel)return;
    const key=event.detail.country==='jp'?'japan':'meal';
    if(channel.key===key)return;
    channel.video.pause();channel.key=key;channel.loaded=false;channel.done=false;channel.failed=false;
    channel.wrapper.dataset.mediaKey=key;channel.wrapper.dataset.ready='false';
    channel.wrapper.querySelector('img').src=`${rootPath}${files[key]}.webp`;
    if(released)channel.video.poster=`${rootPath}${files[key]}.webp`;
    active=null;sync();
  });
  function visible(entry){
    if(!entry.allowed())return 0;
    for(let node=entry.wrapper;node && node!==document.body;node=node.parentElement){
      const style=getComputedStyle(node);
      if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)<.05||node.getAttribute('aria-hidden')==='true')return 0;
    }
    const rect=entry.wrapper.getBoundingClientRect();
    const height=Math.max(0,Math.min(innerHeight,rect.bottom)-Math.max(0,rect.top));
    const width=Math.max(0,Math.min(innerWidth,rect.right)-Math.max(0,rect.left));
    return height*width;
  }
  function syncHero(){
    if(!hero||!gallery)return;
    const index=stage(hero),local=parseFloat(hero.style.getPropertyValue('--story-local'))||0;
    const phase=reduced.matches || index>3?'feed':index<3?'edit':local<.23?'edit':local<.49?'caption':local<.72?'upload':'feed';
    if(gallery.dataset.shareState!==phase)gallery.dataset.shareState=phase;
    hero.dataset.videoResult=phase;
  }
  function sizeCourse(){
    if(!course || innerWidth>700 || reduced.matches)return;
    const pin=course.querySelector('.course-flow-sticky');
    const phone=course.querySelector('.course-lesson-phone');
    const style=getComputedStyle(pin);
    const items=['.course-flow-intro','.course-flow-list','.course-story-nav','.course-lesson-progress','.course-screen-note','.mv-controls'];
    const used=items.reduce((sum,selector)=>{const el=course.querySelector(selector);if(!el)return sum;const s=getComputedStyle(el);return sum+el.getBoundingClientRect().height+(parseFloat(s.marginTop)||0)+(parseFloat(s.marginBottom)||0);},parseFloat(style.paddingTop)+parseFloat(style.paddingBottom)+40);
    const height=Math.max(260,Math.min(410,innerHeight-used));
    phone.style.setProperty('--course-video-phone-width',`${Math.floor(height*.512)}px`);
  }
  function sync(){
    frame=0;syncHero();
    sizeCourse();
    const ranked=entries.map(entry=>({entry,area:visible(entry)})).filter(item=>item.area>1500).sort((a,b)=>b.area-a.area);
    const next=ranked[0]?.entry || null;
    if(active!==next){active?.video.pause();active=next;}
    entries.forEach(entry=>{if(entry!==active)entry.video.pause();});
    if(active && released && !reduced.matches && !document.hidden && !manuallyPaused && !active.done && !active.failed){
      if(!active.loaded){active.loaded=true;active.video.src=`${rootPath}${files[active.key]}.mp4`;active.video.load();}
      if(active.video.paused)active.video.play().catch(()=>{if(active)active.wrapper.dataset.state='autoplay-blocked';});
    }else active?.video.pause();
    document.querySelectorAll('[data-media-control="pause"]').forEach(button=>{button.innerHTML=svg(manuallyPaused?'play':'pause');button.title=manuallyPaused?'영상 재생':'영상 일시정지';button.setAttribute('aria-label',button.title);button.setAttribute('aria-pressed',String(manuallyPaused));});
    document.body.dataset.activeMedia=active?.key || 'none';
  }
  const request=()=>{if(!frame)frame=requestAnimationFrame(sync);};
  new MutationObserver(request).observe(document.body,{subtree:true,attributes:true,attributeFilter:['data-story-index','data-mobile-layout','data-hero-stage','aria-hidden']});
  addEventListener('scroll',request,{passive:true});addEventListener('resize',request,{passive:true});
  document.addEventListener('visibilitychange',request);reduced.addEventListener('change',request);
  document.addEventListener('transitionend',event=>{if(['opacity','visibility'].includes(event.propertyName) && event.target.closest('[data-scroll-story]'))request();});
  const observer=new IntersectionObserver(request,{threshold:[0,.1,.5,1]});entries.forEach(e=>observer.observe(e.wrapper));
  window.matgamsaVideoPlaces={sync,entries,get active(){return active;},released};
  request();
})();
