window.renderServiceOffers=function(media,item){
 const offers=[
 {id:'classes',name:'오프라인 원데이클래스',hook:'오프라인에서 함께,<br>내 상상을 직접 만들기.',desc:'GPT·코덱스 설정부터 실습까지. 내 생활·업무·콘텐츠에 연결하는 하루.',result:'3시간: 설정·이미지·간단한 소개 화면 직접 수정<br>5시간: 같은 수업에 이어 영상·소개 화면 연결',price:'<div class="class-price"><div><span>3시간</span><strong>6만 원</strong></div><div><span>총 5시간</span><strong>10만 원</strong></div></div>',cta:'내가 만들 결과·커리큘럼 보기',art:'learning-example'},
 {id:'content',name:'AI 광고·콘텐츠 제작',hook:'사진 한 장을,<br>내 브랜드 광고로.',desc:'내 상품과 상호로 만드는 이미지, 움직이는 광고, 완성형 쇼츠.',result:'광고 이미지 · 1장 기준 3만 원<br>5초 장면 · 15만 원부터 / 쇼츠 · 20만 원부터',price:'<div class="offer-price"><strong>3만 원</strong><span>1장 기준 · 3장부터 제작<br>부가세 별도</span></div>',cta:'광고 결과물·제작 범위 보기',art:'menu'},
 {id:'website',name:'브랜드 홈페이지 제작',hook:'내 브랜드의 첫인상,<br>문의까지 한 번에.',desc:'브랜드 소개부터 포트폴리오·무료자료·문의 접수까지 연결합니다.',result:'모바일 대응 · 서비스 소개 · 문의폼<br>목적에 맞는 페이지와 기능 구성',price:'<div class="offer-price"><strong>40만 원</strong><span>부터 · 부가세 별도</span></div>',cta:'홈페이지 구성·가격 보기',art:'website'},
 {id:'store',name:'내 브랜드 자사몰 제작',hook:'내 상품을,<br>내 이름의 쇼핑몰에서.',desc:'상품을 보여주는 화면에 결제·주문·배송 관리까지 갖춥니다.',result:'초기 상품 5개 · 기본 결제·배송 설정<br>브랜드 화면 · 방문 촬영 1회 · 운영 안내',price:'<div class="offer-price"><strong>200만 원</strong><span>부터 · 부가세 별도</span></div>',cta:'자사몰 기능·포함 범위 보기',art:null}
 ];
 return offers.map((o,n)=>`<article class="service-card offer-card" data-offer="${o.id}"><div class="offer-image">${o.art?media(item(o.art)):window.renderStoreScene()}<span>${o.id==='classes'?'실습 방향 예시':o.id==='store'?'실제 계약·운영 사례':'자체 제작물'}</span></div><div class="offer-body"><div class="offer-label"><span class="num">0${n+1}</span><span>${o.name}</span></div><h3>${o.hook}</h3><p>${o.desc}</p><div class="offer-gain">${o.result}</div>${o.price}<a class="ribbon-button" href="/index.html?page=${o.id}"><span>${o.cta}</span><b aria-hidden="true">↗</b></a></div></article>`).join('');
};
document.addEventListener('DOMContentLoaded',()=>{
 const cards=[...document.querySelectorAll('.offer-card')];if(!cards.length)return;
 const io=new IntersectionObserver(entries=>entries.forEach(e=>{e.target.classList.toggle('offer-visible',e.isIntersecting)}),{threshold:.1});cards.forEach(c=>io.observe(c));
});
