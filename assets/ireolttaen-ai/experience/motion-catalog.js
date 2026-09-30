// 기존 운영 데이터는 읽기만 한다. 새 작품은 고유 id/분야/미디어/자료 URL로 추가한다.
window.REVIEW_CATALOG={categories:window.AI_CONTENT.categories,items:[
...window.AI_CONTENT.portfolio.filter(item=>item.published).map(item=>({...item,kind:'actual',poster:'/'+item.poster,video:'/'+item.preview,detail:'/case.html?id='+encodeURIComponent(item.id),resource:item.resource?'/'+item.resource:null,motion:'video'})),
{id:'design-example',title:'디자인·브랜드 콘텐츠',summary:'하나의 콘셉트를 포스터와 상품 디자인으로.',categories:['디자인·콘텐츠','홍보·판매'],kind:'example',motion:'light',poster:'/assets/ireolttaen-ai/experience/correction/grapefruit-ad.webp',resource:null},
{id:'office-example',title:'문서·업무 자동화',summary:'흩어진 내용을 표와 실행 순서로 정리하는 예시.',categories:['문서·업무'],kind:'example',motion:'scan',sprite:{x:875,y:319,w:307,h:184},resource:null},
{id:'life-example',title:'내 아이디어를, 사람들이 찾는 콘텐츠로.',summary:'쇼츠·릴스 기획과 제작에서 채널 운영, 자료·문의 연결까지.',categories:['콘텐츠·채널'],kind:'example',motion:'channel',poster:'/assets/ireolttaen-ai/chicken-poster.webp',resource:null},
{id:'learning-example',title:'배우고 싶은 것을, 내 속도로.',summary:'학습 목표를 이해와 실습 순서로 나누는 예시.',categories:['학습·성장'],kind:'example',motion:'pan',poster:'/assets/ireolttaen-ai/experience/example-learning-v10.webp',resource:null},
{id:'family-example',title:'사진 복원·가족 추억',summary:'오래된 사진과 복원 결과를 비교하는 예시.',categories:['가족·추억','영상·사진'],kind:'example',motion:'compare',poster:'/assets/ireolttaen-ai/experience/correction/family-restoration.webp',resource:null}
]};
