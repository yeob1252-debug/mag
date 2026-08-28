from __future__ import annotations

import gzip
import hashlib
import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ERRORS: list[str] = []
PASSES: list[str] = []


def check(condition: bool, label: str) -> None:
    (PASSES if condition else ERRORS).append(label)


def text(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


home = text("index.html")
course = text("creator-course.html")
free_check = text("channel-start-check.html")
main_js = text("js/main.js")
rebuild_js = text("js/structural-rebuild.js")
rebuild_css = text("css/structural-rebuild.css")
favicon = text("assets/images/favicon.svg")
manifest = json.loads(text("assets/generated/manifest.json"))

for required in (
    "맛간다챌린지",
    "사장님 광고 의뢰",
    "진행 방식",
    "문의·신청",
    "나도 맛집채널 도전하기",
    "우리 매장에 맞는 크리에이터 광고 상담받기",
    "무료로 내 맛집채널 유형 확인하기",
):
    check(required in home, f"home contains exact required text: {required}")

check('href="creator-course.html">나도 맛집채널 도전하기</a>' in home, "creator CTA exact route")
check('href="#owner-apply"' in home and 'id="owner-apply"' in home, "owner CTA exact route")
check('href="channel-start-check.html">무료로 내 맛집채널 유형 확인하기</a>' in home, "free pre-value CTA exact route")
check('href="#interest">나도 맛집채널 도전하기</a>' in course, "course primary CTA reaches visible status block")
check('id="interest"' in course and "다음 모집 일정 확정 중" in course and "참가비 확정 후 안내" in course, "course truthful HOLD status")
check("docs.google.com/forms" not in course, "stale Google Form absent")
for stale in ("4회차", "10만원 (1기 한정)"):
    check(stale not in course, f"stale fact absent: {stale}")

all_html = "\n".join(p.read_text(encoding="utf-8") for p in ROOT.glob("*.html"))
public_flow_html = "\n".join((home, course, free_check, text("privacy.html")))
check('<span class="brand-mark"' not in public_flow_html and ">M<" not in public_flow_html, "rejected header/footer M absent from public flow HTML")
check("<path" not in favicon and ">M<" not in favicon and "맛집" in favicon and "감별사" in favicon, "favicon uses code-native Korean wordmark only")

check('font-family:"Pretendard Variable",sans-serif' in rebuild_css, "deterministic Korean variable font family")
check(rebuild_css.count("pretendardvariable-dynamic-subset.css") == 1, "single verified Pretendard v1.3.9 dynamic-subset import")
check("@font-face" not in rebuild_css and "/web/static/woff2/" not in rebuild_css, "full static Korean font payload removed")
check("word-break:keep-all" in rebuild_css, "global Korean keep-all")
check("prefers-reduced-motion:reduce" in rebuild_css and ".sr-narrative-stage{display:none}" in rebuild_css, "static reduced-motion route")
check("직접 알리는 사람으로" in home and "sr-hero-emphasis" in home, "hero emphasis exact phrase")
check(all(label in home for label in ("Instagram", "TikTok", "YouTube", "NAVER Clip", "당근")), "five platform text marks disclosed")
reaction_match = re.search(r'<div class="sr-reactions"[^>]*>(.*?)</div>', home, re.S)
check(bool(reaction_match) and not re.search(r'\d', reaction_match.group(1)), "reaction treatment contains no engagement metrics")
check(all(f'data-course-copy="{state}"' in home for state in ("theory", "ai", "shoot", "edit", "publish")), "five scroll-led one-day course states")
check("8시간 이상" in home and "8시간 이상" in course and "협찬 매장 식사 실습" in course, "confirmed 8H+ and field practice facts")
check('href="https://www.whybe.co.kr/"' in home and 'href="https://www.tigercommercelab.com/"' in home, "canonical YB ecosystem links")
check("내 일정에 맞춰 맛집 콘텐츠 활동에 도전" in course and "활동이나 수입을 보장하지 않습니다" in course, "course opportunity and no-guarantee disclosure")
check(all(f'data-owner-phone="{state}"' in home for state in ("store", "creator", "connect", "coordinate")), "visual-first owner match states")
check("촬영 가능한 날짜를 확인해요" in home and "업로드 채널을 함께 정해요" in home and "협의 완료" in home, "owner coordination uses three short non-claim bubbles")
check("Apple" not in all_html and "아이폰" not in all_html and "iPhone" not in all_html, "code-native device has no Apple/model claim")

copy_states = re.findall(r'data-copy-state="(shot|edit|upload|owner)"', home)
phone_states = re.findall(r'data-phone-state="(shot|edit|upload|owner)"', home)
check(copy_states == ["shot", "edit", "upload", "owner"], "copy state count/order SHOT EDIT UPLOAD OWNER MATCH")
check(phone_states == ["shot", "edit", "upload", "owner"], "phone state count/order SHOT EDIT UPLOAD OWNER MATCH")
check("requestAnimationFrame" in rebuild_js and "IntersectionObserver" not in rebuild_js, "bounded rAF scroll synchronization without animation loop")
check("autoplay" not in all_html.lower() and "<video" not in all_html.lower(), "no autoplay video")
check("webgl" not in rebuild_js.lower() and "three.js" not in rebuild_js.lower(), "no WebGL payload")

endpoint = "https://script.google.com/macros/s/AKfycbzz3dd4gFiqCDpjo9R5sph6uczf_NcLEwtEwYgbNwuio6L_4K1K4Lyj8F17FLPOyMdi1A/exec"
check(endpoint in main_js, "validated Apps Script endpoint preserved")
check("owner_promotion" in main_js and 'id="ownerForm"' in home and 'id="ownerStatus"' in home, "owner_promotion form/handler preserved")
check("creator_free_diagnosis" in main_js and 'id="freeCheckForm"' in free_check, "optional creator receipt handler preserved")
check("응답 시간" not in home and "시간 내" not in home, "no fabricated response promise")

og_url = "https://www.matgamsa.com/assets/og/matgamsa-share-20260828-v2.png"
check(home.count(f'<meta property="og:image" content="{og_url}">') == 1, "singleton OG image preserved")
og_file = ROOT / "assets/og/matgamsa-share-20260828-v2.png"
og_sha = hashlib.sha256(og_file.read_bytes()).hexdigest().upper()
check(og_sha == "B2025C38C80C69CFE61E5B45B8788AFFA64020AAAD5A2778068224AC70BBEE31", "completed OG asset SHA preserved")

expected_generated = {
    "matgamsa-category-korean.webp": "32B9F9DDB169651871929B71F575B93EB4A20B7FFEA9E1C6720C605EB62AE2DA",
    "matgamsa-category-meat.webp": "E3979FFAC0C8AA242ABB3BB043589DDDFA04C9EC91A973694E0F3652FA2A5F80",
    "matgamsa-category-local.webp": "338DB62181E4875DA3AF3FDF8F7322CBE7BD58AE14ACF2160C50A58963E5660F",
    "matgamsa-category-dessert.webp": "A4D0FEF423A103D3DCECD1157F440406C27AAA45567D22820EB3DE09DCEEAA26",
    "matgamsa-category-bakery.webp": "4B79D104C001A4615785E675964B43883B713C07A4BEE458A2C0DCB188ECAAD5",
}
manifest_paths = set()
for asset in manifest["assets"]:
    path = Path(asset["website_path"])
    manifest_paths.add(path.name)
    payload = (ROOT / path).read_bytes()
    actual = hashlib.sha256(payload).hexdigest().upper()
    check(actual == asset["website_sha256"] == expected_generated[path.name], f"generated asset manifest/hash: {path.name}")
    check(asset["alt"].startswith("연출 이미지:"), f"generated asset disclosure alt: {path.name}")
    check(bool(asset.get("prompt")) and bool(asset.get("sections")), f"generated asset prompt/exact sections: {path.name}")
check(manifest_paths == set(expected_generated), "manifest covers exactly five approved support images")
check(manifest["work_id"] == "MATGAMSA_ORYZO_STRUCTURAL_REBUILD_20260828_V1", "generated manifest bound to work ID")

referenced_assets = set(re.findall(r'(?:src|href)="(assets/[^"]+)"', home + course + free_check))
for path in referenced_assets:
    check((ROOT / path).is_file(), f"referenced local asset exists: {path}")

initial_media = (ROOT / "assets/generated/matgamsa-category-korean.webp").stat().st_size
all_editorial_media = sum((ROOT / "assets/generated" / name).stat().st_size for name in expected_generated)
js_gzip = len(gzip.compress((main_js + rebuild_js).encode("utf-8"), compresslevel=9))
check(initial_media <= 1_500_000, f"initial hero media budget {initial_media} <= 1500000")
check(all_editorial_media <= 1_500_000, f"all editorial media budget {all_editorial_media} <= 1500000")
check(js_gzip <= 250_000, f"JS gzip estimate {js_gzip} <= 250000")

summary = {
    "status": "PASS" if not ERRORS else "FAIL",
    "checks_passed": len(PASSES),
    "checks_failed": len(ERRORS),
    "initial_media_bytes": initial_media,
    "all_editorial_media_bytes": all_editorial_media,
    "js_gzip_estimate_bytes": js_gzip,
    "errors": ERRORS,
}
print(json.dumps(summary, ensure_ascii=False, indent=2))
if ERRORS:
    sys.exit(1)
