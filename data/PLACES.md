# 맛집정보 관리

`places.json`이 목록·도시 건수·정적 상세 페이지의 공통 입력입니다. `id`는 공개 후 바꾸지 않습니다. 제목이나 `sort`를 바꿔도 URL은 유지됩니다.

목록 사진은 선택입니다. `listing.showThumbnail`은 생략하거나 `false`가 기본이며, `true`와 실제 `thumbnail`이 함께 있을 때만 행에 사진이 표시됩니다. 상세 사진과 OG는 이 옵션으로 삭제되지 않습니다.
사진 없이 승인된 원고를 게시할 때만 해당 항목의 `publicationApproval.entryId`를 자기 `id`와 맞추고 `coverPolicy: "text-only-approved"`를 명시합니다. 승인 없는 빈 표지나 다른 draft를 일괄 공개하지 않습니다. 표지가 없는 상세는 빈 이미지 자리 없이 내용을 표시하고 기존 공통 OG를 사용합니다.

1. 실제 자료만 추가하고 `country`/`city`를 기존 국가·도시 ID에 결속합니다. 주변 업소는 같은 자료의 `nearby`에 기록합니다.
2. 실제 썸네일을 `assets/places/`에 저장하고 상대경로를 `thumbnail`에 넣습니다. SNS URL·방문일 등 미확인은 `null`로 둡니다. 생성 장면을 방문 썸네일로 쓰지 않습니다.
3. `node tools/build-places.mjs --check`로 필수 입력·ID·URL·공개 썸네일을 검사합니다. `status: published`는 대표가 공개할 실제자료에만 지정합니다.
4. `node tools/build-places.mjs`로 `/places/`와 상세 HTML을 만듭니다. `node tools/build-places.mjs --preview-drafts`는 배포 제외 `outputs/video-places/draft/`에만 초안을 출력합니다.
5. 로컬 화면·링크·새로고침을 확인하고 명시적 공개승인 범위에서만 선별 commit/push합니다. 자동 DM·메일 전송은 하지 않습니다.

지도는 Natural Earth 1:50m 원본 geometry에서 투영합니다. 지도 재수집은 명시적 유지보수 때만 `node tools/build-places.mjs --refresh-maps`로 실행합니다. 국가별 도형은 지역 탐색용이며 국경/항로 안내가 아닙니다.
