// 기존 운영 데이터는 읽기만 한다. 새 작품은 고유 id/분야/미디어/자료 URL로 추가한다.
window.REVIEW_CATALOG={categories:window.AI_CONTENT.categories,items:[
...window.AI_CONTENT.portfolio.filter(item=>item.published).map(item=>({...item,kind:'actual',poster:'/'+item.poster,video:'/'+item.preview,detail:'/case.html?id='+encodeURIComponent(item.id),resource:item.resource?'/'+item.resource:null,motion:'video'})),
{id:'design-example',title:'디자인·브랜드 콘텐츠',summary:'하나의 콘셉트를 포스터와 상품 디자인으로.',categories:['디자인·콘텐츠','홍보·판매'],kind:'example',motion:'light',sprite:{x:584,y:319,w:273,h:184},resource:null},
{id:'office-example',title:'문서·업무 자동화',summary:'흩어진 내용을 표와 실행 순서로 정리하는 예시.',categories:['문서·업무'],kind:'example',motion:'scan',sprite:{x:875,y:319,w:307,h:184},resource:null},
{id:'life-example',title:'여행 준비, 한눈에.',summary:'일정·준비물·이동 동선을 보기 쉽게 정리하는 예시.',categories:['생활·정보'],kind:'example',motion:'pan',poster:'/assets/ireolttaen-ai/experience/example-life-v10.webp',resource:null},
{id:'learning-example',title:'배우고 싶은 것을, 내 속도로.',summary:'학습 목표를 이해와 실습 순서로 나누는 예시.',categories:['학습·성장'],kind:'example',motion:'pan',poster:'/assets/ireolttaen-ai/experience/example-learning-v10.webp',resource:null},
{id:'family-example',title:'사진 복원·가족 추억',summary:'오래된 사진과 복원 결과를 비교하는 예시.',categories:['가족·추억','영상·사진'],kind:'example',motion:'compare',sprite:{x:1207,y:319,w:336,h:184},resource:null}
]};
