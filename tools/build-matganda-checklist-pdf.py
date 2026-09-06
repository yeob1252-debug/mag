from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import HRFlowable, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "downloads" / "matganda-4-checklist.pdf"

pdfmetrics.registerFont(TTFont("Malgun", r"C:\Windows\Fonts\malgun.ttf"))
pdfmetrics.registerFont(TTFont("MalgunBold", r"C:\Windows\Fonts\malgunbd.ttf"))
pdfmetrics.registerFontFamily("Malgun", normal="Malgun", bold="MalgunBold")

INK = colors.HexColor("#17201F")
MUTED = colors.HexColor("#5F6B68")
LINE = colors.HexColor("#D8DEDA")
PINK = colors.HexColor("#D92C69")
PINK_SOFT = colors.HexColor("#FBEAF1")
GREEN = colors.HexColor("#246C5A")
MINT = colors.HexColor("#DFF2EB")
MINT_SOFT = colors.HexColor("#F0F8F5")
GOLD = colors.HexColor("#D5A52B")
PAPER = colors.HexColor("#F6F7F5")
WHITE = colors.white
WIDTH = 180 * mm

S = {
    "part": ParagraphStyle("part", fontName="MalgunBold", fontSize=8.5, leading=11, textColor=GREEN, spaceAfter=5),
    "title": ParagraphStyle("title", fontName="MalgunBold", fontSize=21, leading=26, textColor=INK, spaceAfter=5),
    "subtitle": ParagraphStyle("subtitle", fontName="Malgun", fontSize=9.5, leading=14.5, textColor=MUTED, spaceAfter=5),
    "h2": ParagraphStyle("h2", fontName="MalgunBold", fontSize=13.5, leading=18, textColor=INK, spaceBefore=2, spaceAfter=3),
    "h3": ParagraphStyle("h3", fontName="MalgunBold", fontSize=10.2, leading=14, textColor=INK, spaceAfter=4),
    "body": ParagraphStyle("body", fontName="Malgun", fontSize=9.2, leading=14.5, textColor=INK),
    "muted": ParagraphStyle("muted", fontName="Malgun", fontSize=8.7, leading=13.5, textColor=MUTED),
    "small": ParagraphStyle("small", fontName="Malgun", fontSize=7.3, leading=10.5, textColor=MUTED),
    "table": ParagraphStyle("table", fontName="Malgun", fontSize=7.5, leading=11, textColor=INK),
    "table_bold": ParagraphStyle("table_bold", fontName="MalgunBold", fontSize=7.7, leading=11, textColor=INK),
    "prompt": ParagraphStyle("prompt", fontName="Malgun", fontSize=8.0, leading=12.2, textColor=INK),
    "center": ParagraphStyle("center", fontName="MalgunBold", fontSize=8.2, leading=12, textColor=INK, alignment=TA_CENTER),
}


def p(text, style="body"):
    return Paragraph(text, S[style])


def page_decor(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(GREEN)
    canvas.rect(0, A4[1] - 5 * mm, A4[0], 5 * mm, fill=1, stroke=0)
    canvas.setFont("MalgunBold", 7.5)
    canvas.drawString(15 * mm, A4[1] - 11 * mm, "맛집감별사 · 맛집 콘텐츠 시작 실전 가이드")
    canvas.setStrokeColor(LINE)
    canvas.line(15 * mm, 13 * mm, A4[0] - 15 * mm, 13 * mm)
    canvas.setFont("Malgun", 7)
    canvas.setFillColor(MUTED)
    canvas.drawString(15 * mm, 8.5 * mm, "가상의 작성 예시는 실제 매장·협찬·성과 사례가 아닙니다.")
    canvas.drawRightString(A4[0] - 15 * mm, 8.5 * mm, str(doc.page))
    canvas.restoreState()


def title(part, heading, subtitle):
    return [p(part, "part"), p(heading, "title"), p(subtitle, "subtitle"), HRFlowable(width="100%", thickness=.7, color=LINE), Spacer(1, 3 * mm)]


def heading(text):
    return [Spacer(1, 2 * mm), p(text, "h2")]


def box(box_title, body, tone="mint"):
    palettes = {
        "mint": (MINT_SOFT, GREEN), "pink": (PINK_SOFT, PINK),
        "paper": (PAPER, MUTED), "gold": (colors.HexColor("#FFF8E7"), GOLD),
    }
    bg, edge = palettes[tone]
    table = Table([[p(box_title, "h3")], [p(body, "muted")]], colWidths=[WIDTH])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg), ("LINEBEFORE", (0, 0), (0, -1), 3, edge),
        ("LEFTPADDING", (0, 0), (-1, -1), 5 * mm), ("RIGHTPADDING", (0, 0), (-1, -1), 5 * mm),
        ("TOPPADDING", (0, 0), (-1, 0), 3.5 * mm), ("BOTTOMPADDING", (0, -1), (-1, -1), 3.5 * mm),
    ]))
    return table


def checks(items):
    table = Table([[p("[ ]", "table_bold"), p(item)] for item in items], colWidths=[9 * mm, WIDTH - 9 * mm])
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"), ("BOX", (0, 0), (-1, -1), .6, LINE),
        ("INNERGRID", (0, 0), (-1, -1), .35, LINE), ("BACKGROUND", (0, 0), (0, -1), PAPER),
        ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm), ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 2.5 * mm), ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5 * mm),
    ]))
    return table


def decision(ready, improve):
    table = Table([
        [p("준비 완료 기준", "table_bold"), p("보완이 필요한 신호", "table_bold")],
        [p(ready, "table"), p(improve, "table")],
    ], colWidths=[WIDTH / 2, WIDTH / 2])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), MINT), ("BACKGROUND", (1, 0), (1, 0), PINK_SOFT),
        ("BOX", (0, 0), (-1, -1), .6, LINE), ("INNERGRID", (0, 0), (-1, -1), .35, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 4 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4 * mm), ("TOPPADDING", (0, 0), (-1, -1), 3 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3 * mm),
    ]))
    return table


def writing(labels, heights=None, label_width=48 * mm):
    heights = heights or [14 * mm] * len(labels)
    table = Table([[p(label, "table_bold"), ""] for label in labels], colWidths=[label_width, WIDTH - label_width], rowHeights=heights)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), PAPER), ("BOX", (0, 0), (-1, -1), .6, LINE),
        ("INNERGRID", (0, 0), (-1, -1), .35, LINE), ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm), ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 3 * mm),
    ]))
    return table


def ruled_table(rows, widths, header=True, heights=None):
    table = Table(rows, colWidths=widths, rowHeights=heights, repeatRows=1 if header else 0)
    commands = [
        ("BOX", (0, 0), (-1, -1), .6, LINE), ("INNERGRID", (0, 0), (-1, -1), .35, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 2.7 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2.7 * mm), ("TOPPADDING", (0, 0), (-1, -1), 2.7 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.7 * mm),
    ]
    if header:
        commands += [("BACKGROUND", (0, 0), (-1, 0), GREEN), ("TEXTCOLOR", (0, 0), (-1, 0), WHITE)]
    table.setStyle(TableStyle(commands))
    return table


story = []

# 1. Four-part map and primary/secondary channel choice.
story += title("PART 1 · 휴대폰·SNS 채널 준비", "4개 파트로 완성하는 맛집 콘텐츠 시작 워크북", "모든 채널을 한꺼번에 열 필요는 없습니다. 내 목적에 맞는 주력 채널 1개와 무리 없이 재활용할 보조 채널 1개부터 정합니다.")
story.append(box("이 워크북을 끝내면", "주력·보조 채널, 채널명과 프로필, 내 주변 첫 촬영계획, AI 콘티, 첫 영상 컷표, 협찬 전 확인조건까지 한 번에 정리됩니다. 체크보다 빈칸을 직접 채우는 것이 핵심입니다."))
story += heading("01. 시작 전 네 가지 큰 질문")
story.append(checks([
    "로그인 가능한 본인 SNS 계정과 촬영 가능한 휴대폰이 있나요?",
    "실제로 움직일 지역·요일·시간과 식사비 범위를 말할 수 있나요?",
    "직접 확인한 메뉴·장면만으로 첫 영상을 기획할 수 있나요?",
    "협찬 여부와 관계없이 내 샘플·채널 URL·활동조건을 설명할 수 있나요?",
]))
story += heading("02. 주력 1개 + 보조 1개 선택")
story.append(writing(["내 목적", "주력 채널 1개와 이유", "보조 채널과 재활용 방식", "이번 주 하지 않을 채널"], [17 * mm, 17 * mm, 17 * mm, 14 * mm], 51 * mm))
story.append(Spacer(1, 4 * mm))
story.append(box("지금 할 일 하나", "휴대폰에서 주력 채널 앱을 열고 로그인 상태, 공개 프로필 화면, 영상 업로드 버튼 위치까지만 확인합니다. 아직 게시하지 않아도 됩니다.", "pink"))
story.append(PageBreak())

# 2. Platform comparison.
story += title("PART 1 · 채널 선택", "음식 콘텐츠에 맞는 5개 채널 비교", "아래 표는 시작 방향을 고르는 편집 기준입니다. 노출·팔로워·협찬·수익을 보장하지 않으며 기능과 정책은 바뀔 수 있습니다.")
platform_rows = [
    [p("채널", "table_bold"), p("보여줄 콘텐츠·활용 장면", "table_bold"), p("초보자 선택 기준", "table_bold"), p("시작할 때 주의", "table_bold")],
    [p("YouTube\nShorts", "table_bold"), p("메뉴 정보, 비교, 다시 찾을 검색형 주제. Shorts 피드·검색·채널 홈에서 발견될 수 있는 영상 자산.", "table"), p("검색될 제목과 채널에 영상이 쌓이는 흐름을 원할 때.", "table"), p("직접 촬영했거나 권리가 있는 영상·음악만 사용. 제목·공개설정 확인.", "table")],
    [p("Instagram", "table_bold"), p("음식 장면, 매장 분위기, 저장할 정보. 프로필 전체가 포트폴리오처럼 보이게 운영.", "table"), p("사진·릴스·소개문을 한 프로필에서 정돈하고 싶을 때.", "table"), p("예쁜 화면보다 메뉴·지역·직접 확인한 사실이 먼저. 개인/활동 연락 구분.", "table")],
    [p("TikTok", "table_bold"), p("빠른 맛 반응, 조리 장면, 한 가지 궁금증. 댓글 반응을 다음 주제로 연결.", "table"), p("짧은 훅을 빠르게 시험하고 촬영·편집 감각을 익힐 때.", "table"), p("조회수만으로 성공 판단 금지. 커버·설명·초안 저장 상태 확인.", "table")],
    [p("네이버\n클립", "table_bold"), p("장소·메뉴·정보 태그와 함께 보는 지역 음식 정보. 네이버 안의 검색·장소 확인 맥락.", "table"), p("국내 지역·맛집 정보와 네이버 이용 흐름이 중요할 때.", "table"), p("정보 태그·콘텐츠 링크 범위와 광고·협찬 설정을 게시 직전 확인.", "table")],
    [p("당근", "table_bold"), p("동네 사업자·지역 정보 맥락. 음식점 본인 운영 또는 정식 협업 때 비즈프로필·지역 광고 검토.", "table"), p("내 동네 생활권과 실제 매장 운영 목적이 분명할 때.", "table"), p("일반 창작자 수익채널과 동일 취급하지 않고 지역·상업 정책을 우회하지 않기.", "table")],
]
story.append(ruled_table(platform_rows, [23 * mm, 58 * mm, 47 * mm, 52 * mm]))
story += heading("선택 확인")
story.append(checks([
    "주력 채널은 4주 동안 주 1회라도 올릴 수 있는가?",
    "보조 채널은 추가 촬영 없이 자막·설명만 조정해 재활용할 수 있는가?",
    "연락처·외부 링크·광고표시 기능을 게시 직전 해당 앱에서 확인했는가?",
]))
story.append(Spacer(1, 3 * mm))
story.append(p("공식 기능 확인: YouTube Shorts 도움말, TikTok Support, 네이버 클립 고객센터, 당근비즈니스. 확인일 2026-09-07. 세부 출처는 마지막 쪽에 정리했습니다.", "small"))
story.append(PageBreak())

# 3. Naming, profile, bio and URL strategy.
story += title("PART 1 · 채널 브랜딩", "채널명·프로필사진·소개문을 한 번에 정리하기", "화려한 이름보다 지역·주제·기억성·확장성을 한눈에 이해시키는 것이 먼저입니다.")
story.append(decision("소리 내 읽기 쉽고 지역·음식 주제 중 하나가 보이며, 검색했을 때 같은 이름과 혼동이 적습니다.", "특수문자·숫자가 많거나 특정 매장 하나에만 묶여 확장이 어렵고, 검색 시 다른 유명 계정과 구분되지 않습니다."))
story += heading("채널명 작명 패턴")
story.append(ruled_table([
    [p("패턴", "table_bold"), p("가상의 작성 예시", "table_bold"), p("확인할 점", "table_bold")],
    [p("지역 + 한 끼", "table"), p("대구한입노트", "table"), p("활동 지역이 바로 보이는가", "table")],
    [p("상황 + 메뉴", "table"), p("퇴근길혼밥지도", "table"), p("누구를 위한 채널인지 보이는가", "table")],
    [p("취향 + 기록", "table"), p("국물좋아식탁일기", "table"), p("메뉴가 바뀌어도 확장 가능한가", "table")],
], [43 * mm, 55 * mm, 82 * mm]))
story.append(Spacer(1, 4 * mm))
story.append(box("프로필사진 선택 기준", "사람 중심: 얼굴 공개가 편하고 말하는 콘텐츠가 중심일 때. 음식/심볼 중심: 얼굴 공개 없이 지역·메뉴 기록을 할 때. 어느 쪽이든 원형 크롭에서 중심이 잘리지 않고, 작은 화면에서 한 가지 색·한 가지 대상이 보이게 합니다. 무단 상표·허위 인물·성과처럼 보이는 이미지는 사용하지 않습니다.", "paper"))
story += heading("복사해 수정하는 소개문 틀")
story.append(box("[대상]을 위해 [지역]에서 [콘텐츠 가치]를 기록합니다. [업로드 기준]. 활동·문의: [구분된 연락수단]", "가상의 완성 예시: 혼자 편하게 먹을 곳을 찾는 분을 위해 대구 북구의 한 끼를 직접 방문해 기록합니다. 주 1회, 메뉴와 분위기를 짧은 영상으로 남깁니다. 활동 문의는 프로필 연락수단으로 받습니다."))
story.append(Spacer(1, 4 * mm))
story.append(writing(["채널명 후보 3개", "최종 채널명 / 핸들", "프로필사진 방식·원형크롭", "내 소개문 완성본"], [15 * mm, 15 * mm, 16 * mm, 25 * mm]))
story.append(PageBreak())

# 4. Public URLs and local activity plan.
story += title("PART 1 → PART 2 · 공개주소와 활동계획", "로그아웃 상태에서도 열리는 주소 + 내 주변 첫 주 계획", "먼 유명맛집보다 평소 식사 동선에서 촬영 부담이 낮은 한 곳으로 시작합니다. 처음부터 협찬을 전제로 잡지 않습니다.")
url_rows = [
    [p("정리 항목", "table_bold"), p("내 실제 정보", "table_bold"), p("확인", "table_bold")],
    [p("주력 채널 공개 URL", "table"), "", p("[ ] 로그아웃 열림", "table")],
    [p("보조 채널 공개 URL", "table"), "", p("[ ] 로그아웃 열림", "table")],
    [p("채널 핸들", "table"), "", p("[ ] 철자 확인", "table")],
    [p("연락받을 수단", "table"), "", p("[ ] 공개범위 확인", "table")],
    [p("소개자료 주소", "table"), "", p("[ ] 권한 확인", "table")],
]
story.append(ruled_table(url_rows, [45 * mm, 95 * mm, 40 * mm], heights=[11 * mm] + [15 * mm] * 5))
story.append(Spacer(1, 3 * mm))
story.append(p("실무 절차: ① 프로필에서 공유 주소 복사 → ② 시크릿/로그아웃 창에 붙여넣기 → ③ 채널명·사진·게시물이 맞는지 확인 → ④ 권한요청 또는 404가 뜨면 공유범위를 수정한 뒤 다시 확인.", "muted"))
story += heading("내 주변 첫 주 계획")
story.append(box("가상의 작성 예시", "활동 지역: 대구 북구 집에서 20분 이내 / 가능 시간: 토요일 12:00~14:00 / 평소 식사 동선: 시장-집 사이 / 첫 후보: 평소 직접 결제해 먹는 분식집 / 예산: 식사비 1회 범위 안 / 목표: 이번 주 영상 1편.", "pink"))
story.append(Spacer(1, 3 * mm))
story.append(writing(["활동 지역·최대 이동시간", "가능 요일·시간", "평소 식사 동선", "첫 매장 후보 3곳", "식사비 예산·첫 주 한 편 날짜"], [12 * mm, 12 * mm, 12 * mm, 18 * mm, 13 * mm], 50 * mm))
story.append(PageBreak())

# 5. On-site care and complete AI prompt.
story += title("PART 2 → PART 3 · 현장 준비와 AI 콘티", "촬영 허락·동선 배려 뒤 AI에는 확인한 사실만 넣기", "AI는 대신 방문한 사람이 아닙니다. 내가 입력한 사실로 촬영 순서를 정리하는 보조 도구로만 사용합니다.")
story.append(checks([
    "매장에 촬영 가능 여부와 촬영 가능한 범위를 먼저 물었나요?",
    "다른 손님 얼굴·차량번호·결제정보가 보이지 않게 구도를 정했나요?",
    "직원 동선을 막지 않고 짧게 찍을 장면만 정했나요?",
    "직접 확인한 메뉴명·가격·특징과 모르는 정보를 구분했나요?",
]))
story += heading("그대로 붙여 넣는 AI 콘티 프롬프트")
prompt_text = """나는 휴대폰으로 첫 맛집 세로영상을 촬영하려는 초보자입니다.<br/>
활동 지역: [지역]<br/>대상 시청자: [누구에게 보여줄지]<br/>
직접 확인한 매장·메뉴 정보: [메뉴명/가격/특징/운영정보 중 직접 확인한 것만]<br/>
현장에서 촬영 가능한 장면: [외관/메뉴판/조리/전체상/한입/포장 등]<br/>
영상 목적: [정보/분위기/메뉴선택/방문 전 확인 중 하나]<br/>촬영 가능한 시간: [총 몇 분]<br/><br/>
15~30초 세로영상 기준으로 ①첫 2초 후킹 ②장면 순서와 초수 ③각 장면 화면자막 ④내가 말할 짧은 문장 ⑤현장 체크목록을 표로 만들어 주세요. 가격·방문경험·매장사실은 내가 입력한 내용만 사용하고, 모르는 사실은 '확인 필요'로 표시하세요. 어려운 장비, 드론, 재촬영이 힘든 장면, 과장광고, 성과보장 표현은 제외하세요. 다른 손님 얼굴과 개인정보가 나오지 않는 구도를 제안하고, 마지막 행동유도는 저장/댓글/프로필/매장정보 확인 중 이 영상에 맞는 하나만 제안하세요."""
prompt_table = Table([[p(prompt_text, "prompt")]], colWidths=[WIDTH])
prompt_table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), PAPER), ("BOX", (0, 0), (-1, -1), .8, GREEN), ("LEFTPADDING", (0, 0), (-1, -1), 5 * mm), ("RIGHTPADDING", (0, 0), (-1, -1), 5 * mm), ("TOPPADDING", (0, 0), (-1, -1), 4 * mm), ("BOTTOMPADDING", (0, 0), (-1, -1), 4 * mm)]))
story.append(prompt_table)
story += heading("내 입력값 먼저 적기")
story.append(writing(["지역 / 대상 시청자", "직접 확인한 메뉴·정보", "찍을 수 있는 장면 / 총 시간", "영상 목적 1개"], [14 * mm, 20 * mm, 18 * mm, 14 * mm]))
story.append(PageBreak())

# 6. Fictional AI output and corrections.
story += title("PART 3 · AI 콘티 실습", "가상의 입력을 촬영 가능한 콘티로 바꾸는 예시", "아래 매장·메뉴·문장은 모두 가상의 작성 예시입니다. 실제 영상에는 직접 확인한 정보만 사용합니다.")
story.append(box("가상의 입력 예시", "지역: 대구 북구 / 대상: 혼자 점심 먹을 곳을 찾는 직장인 / 직접 확인: 김치찌개, 기본 반찬, 점심 방문 / 가능한 장면: 외관·메뉴판·찌개 끓는 장면·한 숟갈 / 목적: 메뉴 선택 도움 / 촬영시간: 10분.", "pink"))
story += heading("AI가 정리한 촬영 가능 콘티 예시")
story.append(ruled_table([
    [p("초수", "table_bold"), p("내가 할 일", "table_bold"), p("화면 자막", "table_bold"), p("말할 문장", "table_bold")],
    [p("0~2", "table"), p("끓는 찌개 가까이 1컷", "table"), p("혼자 점심, 메뉴 고민될 때", "table"), p("오늘은 따뜻한 한 끼로 골랐어요.", "table")],
    [p("2~5", "table"), p("외관 또는 입구 1컷", "table"), p("대구 북구 · 직접 방문", "table"), p("점심시간에 직접 방문했습니다.", "table")],
    [p("5~10", "table"), p("메뉴판에서 메뉴명 확인", "table"), p("메뉴명·가격은 현장 확인", "table"), p("주문한 메뉴는 김치찌개입니다.", "table")],
    [p("10~18", "table"), p("전체상 → 한 숟갈", "table"), p("국물·반찬 구성 확인", "table"), p("개인적으로 따뜻한 국물이 먼저 좋았어요.", "table")],
    [p("18~23", "table"), p("얼굴 없는 식탁 마무리", "table"), p("메뉴 선택 전 저장", "table"), p("근처에서 점심 찾을 때 참고하세요.", "table")],
], [19 * mm, 47 * mm, 56 * mm, 58 * mm]))
story += heading("AI 결과를 그대로 쓰지 않는 4단계")
story.append(checks([
    "현장에서 찍을 수 없는 장면은 삭제하고 가진 장면으로 교체합니다.",
    "입력하지 않은 가격·재료·운영시간·방문경험은 삭제하거나 '확인 필요'로 돌립니다.",
    "'무조건', '최고', '인생맛집'처럼 근거 없는 과장표현은 실제 판단 문장으로 바꿉니다.",
    "말하기 어려운 문장은 한 호흡 10~15자로 줄이고 화면자막도 같은 뜻으로 맞춥니다.",
]))
story += heading("내 콘티에서 반드시 고칠 것")
story.append(writing(["삭제할 장면", "확인 필요한 사실", "줄일 문장", "내 실제 판단"], [13 * mm] * 4, 42 * mm))
story.append(PageBreak())

# 7. First video shot worksheet.
story += title("PART 3 · 첫 영상", "후킹 → 매장·메뉴 → 먹는 장면 → 개인 판단 → 마무리", "첫 영상의 목표는 완벽함이 아니라, 사실을 지키며 한 편을 끝까지 촬영·편집·업로드하는 것입니다.")
story.append(decision("첫 2초 장면, 메뉴·매장 정보, 직접 느낀 한 문장, 마지막 행동 1개가 있고 15~30초 안에 끝납니다.", "장면은 많지만 무엇을 알려주는지 모르거나, 직접 확인하지 않은 사실·다른 손님 얼굴·권리 없는 음악이 들어갑니다."))
story += heading("내 첫 영상 컷표")
first_rows = [[p("순서", "table_bold"), p("찍을 장면", "table_bold"), p("화면 자막", "table_bold"), p("말할 문장", "table_bold")]]
for label in ["1 · 첫 후킹", "2 · 매장/메뉴", "3 · 먹는 장면", "4 · 개인 판단", "5 · 마무리"]:
    first_rows.append([p(label, "table_bold"), "", "", ""])
story.append(ruled_table(first_rows, [33 * mm, 45 * mm, 48 * mm, 54 * mm], heights=[10 * mm] + [19 * mm] * 5))
story += heading("스마트폰 촬영 실수 방지")
story.append(checks([
    "렌즈를 닦고 알림을 끈 뒤 세로 화면으로 촬영합니다.",
    "밝은 창을 등지지 않고 음식이 자연스럽게 보이는 자리에 섭니다.",
    "한 장면을 길게 흔들며 찍지 말고 2~4초 고정 컷을 두 번씩 찍습니다.",
    "디지털 줌 대신 한 걸음 가까이 가고, 뜨거운 음식·직원 동선을 방해하지 않습니다.",
]))
story.append(PageBreak())

# 8. Edit, upload and feedback.
story += title("PART 3 · 편집·업로드·다음 편", "조회수보다 실제 반응을 읽고 한 가지만 개선하기", "플랫폼 수익률이나 노출을 예측하지 않습니다. 내 영상에서 확인 가능한 반응과 제작 과정을 다음 한 편에 반영합니다.")
story += heading("휴대폰 편집 순서")
edit_rows = [
    [p("1", "center"), p("불필요한 앞뒤를 자르고 컷 순서를 정합니다.")],
    [p("2", "center"), p("첫 2초에 핵심 음식 장면과 한 줄 후킹을 둡니다.")],
    [p("3", "center"), p("말이 안 들리는 구간만 짧은 자막으로 보완합니다.")],
    [p("4", "center"), p("음악은 직접 사용 권한이 있거나 플랫폼이 제공하는 범위에서 고릅니다.")],
    [p("5", "center"), p("마지막 행동유도 하나를 남기고 전체 영상을 처음부터 봅니다.")],
]
edit_table = ruled_table(edit_rows, [12 * mm, WIDTH - 12 * mm], header=False)
edit_table.setStyle(TableStyle([("BACKGROUND", (0, 0), (0, -1), PINK), ("TEXTCOLOR", (0, 0), (0, -1), WHITE), ("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
story.append(edit_table)
story += heading("업로드 전 최종 확인")
story.append(checks([
    "메뉴명·가격·위치·운영정보는 촬영일 기준으로 직접 확인했나요?",
    "다른 손님 얼굴·차량번호·결제정보·대화가 식별되지 않나요?",
    "음악·사진·로고·영상은 사용할 권리가 있나요?",
    "식사·제품·비용 등 경제적 제공이 있었다면 관계를 알아보기 쉽게 표시했나요?",
    "설명·공개범위·커버·장소/정보 태그와 마지막 행동유도를 확인했나요?",
]))
story.append(Spacer(1, 3 * mm))
story.append(box("게시 후 24~72시간에 볼 것", "조회수만 보지 말고 ①끝까지 본 반응 ②저장·댓글의 구체적 질문 ③프로필·매장정보 확인 행동 ④내가 가장 힘들었던 제작단계를 적습니다. 다음 영상에서는 네 가지 중 한 가지만 개선합니다."))
story += heading("첫 영상 회고 → 다음 한 편")
story.append(writing(["실제 반응·질문", "어려웠던 제작단계", "다음 편에서 바꿀 한 가지", "다음 주제·촬영일"], [14 * mm] * 4, 51 * mm))
story.append(PageBreak())

# 9. Sponsorship readiness.
story += title("PART 4 · 협찬 신청 전 소개자료·활동조건", "팔로워 수보다 실제 샘플과 가능한 범위를 정확히 보여주기", "협찬 합격 공식은 없습니다. 협찬 전에도 직접 만든 샘플과 활동 기준이 있으면 내 채널을 계속 운영할 수 있습니다.")
story.append(checks([
    "직접 만든 공개 샘플 2~3개와 최근 게시물 URL이 있나요?",
    "채널 주제·활동 지역·촬영 가능한 요일을 한 문장으로 설명할 수 있나요?",
    "제공받는 것과 내가 제공할 콘텐츠 범위를 글로 확인할 수 있나요?",
    "업로드 채널·시점·원본 제공·광고 재사용·수정요청 범위를 먼저 물을 수 있나요?",
]))
story += heading("한 화면 소개자료 · 가상의 작성 예시")
story.append(box("채널명: 대구한입노트 / 주제: 대구 북구의 혼밥·점심 기록 / 활동지역: 대구 북구·수성구 / 공개 샘플: 직접 촬영한 세로영상 3편 / 가능한 범위: 20~30초 세로영상 1편, 현장 사진 3장 / 방문 가능: 토요일 점심 / 원본·광고 재사용: 반드시 사전 협의", "위 문구는 가상의 작성 예시입니다. 숫자·지역·콘텐츠 수를 내 실제 조건으로 바꾸고, 없는 실적이나 가짜 URL을 넣지 않습니다.", "pink"))
story += heading("내 소개자료에 넣을 실제 정보")
story.append(writing(["채널명·주제·대상", "활동 지역·가능 요일", "본인 샘플·최근 게시물 URL", "가능 콘텐츠·불가능한 범위", "문의받을 수단"], [13 * mm, 13 * mm, 18 * mm, 18 * mm, 13 * mm], 51 * mm))
story += heading("정중한 문의 문장 틀")
story.append(box("안녕하세요. 저는 [지역]에서 [주제] 콘텐츠를 만드는 [채널명]입니다. [매장/메뉴]를 [직접 알게 된 경로]를 통해 확인했고, 제 채널의 [대상 시청자]에게 도움이 될 내용이라 생각해 문의드립니다. 협업을 검토하신다면 제공 범위와 방문 일정, 요청 콘텐츠, 광고 활용 조건을 먼저 확인하고 싶습니다. 채널과 최근 샘플: [실제 URL]", "계약 완료처럼 표현하지 않고, 답변 전에는 방문·촬영·업로드를 확정하지 않습니다.", "paper"))
story.append(PageBreak())

# 10. Conditions, seven-day plan, sources and a soft class note.
story += title("PART 4 · 조건 확인 + 나의 다음 7일", "협찬 여부와 관계없이 실행 가능한 계획으로 마무리", "말로 합의한 내용을 기억에만 두지 말고 아래 표에 적습니다. 제공이 없으면 '직접 결제'로 기록합니다.")
condition_rows = [
    [p("먼저 확인할 것", "table_bold"), p("합의·확인한 실제 내용", "table_bold")],
    [p("제공 범위 / 본인 부담", "table"), ""], [p("방문 날짜·촬영 가능 범위", "table"), ""],
    [p("업로드 채널·형식·시점", "table"), ""], [p("원본 제공 여부", "table"), ""],
    [p("매장 광고 재사용 범위·기간", "table"), ""], [p("사실 오류 외 수정요청 범위", "table"), ""],
    [p("광고·협찬 관계 표시 문구·위치", "table"), ""],
]
story.append(ruled_table(condition_rows, [64 * mm, 116 * mm], heights=[10 * mm] + [11 * mm] * 7))
story.append(Spacer(1, 3 * mm))
story.append(p("공정거래위원회는 추천·보증 내용에 영향을 줄 수 있는 경제적 이해관계가 있을 때 소비자가 쉽게 알 수 있도록 명확히 공개하도록 안내합니다. 제공 형태와 매체에 맞는 최신 표시방식은 게시 직전 공정위와 각 플랫폼 공식 안내에서 다시 확인하세요.", "small"))
story += heading("내 다음 7일 실행표")
week_rows = [
    [p("DAY 1", "table_bold"), p("주력 1개·보조 1개 결정, 채널명 후보 3개 검색", "table")],
    [p("DAY 2", "table_bold"), p("프로필사진 원형크롭, 소개문, 공개 URL 로그아웃 확인", "table")],
    [p("DAY 3", "table_bold"), p("내 주변 첫 매장·예산·촬영가능 여부 확인, AI 프롬프트 입력", "table")],
    [p("DAY 4~5", "table_bold"), p("5컷 촬영 → 편집 → 사실·개인정보·음악·광고표시 확인", "table")],
    [p("DAY 6~7", "table_bold"), p("첫 영상 게시 또는 비공개 점검, 실제 반응 기록, 다음 한 편 개선 1개 결정", "table")],
]
story.append(ruled_table(week_rows, [29 * mm, 151 * mm], header=False))
story.append(Spacer(1, 3 * mm))
story.append(writing(["이번 주 완료할 한 가지", "실행 날짜·시간"], [12 * mm, 12 * mm], 54 * mm))
story.append(Spacer(1, 3 * mm))
story.append(box("오프라인 원데이 클래스 안내", "직접 기획·촬영·편집을 함께 실습하고 싶다면, 맛간다챌린지 오프라인 원데이 클래스에 참여하실 수 있습니다. 신청은 맛집감별사 홈페이지에서 가능합니다.", "gold"))
story.append(Spacer(1, 3 * mm))
story.append(p("공식자료 확인일 2026-09-07 · YouTube Shorts 도움말: support.google.com/youtube/answer/10059070 · TikTok Support: support.tiktok.com/en/using-tiktok/creating-videos · 네이버 클립 고객센터: help.naver.com/service/30048/contents/24422 · 당근비즈니스: business.daangn.com · 공정거래위원회 추천·보증 심사지침 개정(2024-12-01 시행): ftc.go.kr", "small"))

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
doc = SimpleDocTemplate(
    str(OUTPUT), pagesize=A4, rightMargin=15 * mm, leftMargin=15 * mm,
    topMargin=14 * mm, bottomMargin=14 * mm,
    title="맛집 콘텐츠 시작 실전 가이드 + 4파트 워크북",
    author="맛집감별사",
    subject="SNS 채널 준비, 활동계획, AI 콘티, 첫 영상, 협찬 준비",
)
doc.build(story, onFirstPage=page_decor, onLaterPages=page_decor)
print(OUTPUT)
