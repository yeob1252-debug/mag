from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import KeepTogether, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "downloads" / "matganda-4-checklist.pdf"

pdfmetrics.registerFont(TTFont("Malgun", r"C:\Windows\Fonts\malgun.ttf"))
pdfmetrics.registerFont(TTFont("MalgunBold", r"C:\Windows\Fonts\malgunbd.ttf"))

ink = colors.HexColor("#181B1C")
muted = colors.HexColor("#626B69")
line = colors.HexColor("#DADDD9")
pink = colors.HexColor("#D82B69")
mint = colors.HexColor("#DFF2EB")
green = colors.HexColor("#246C5A")
paper = colors.HexColor("#F7F7F5")

styles = {
    "label": ParagraphStyle("label", fontName="MalgunBold", fontSize=8.5, leading=11, textColor=green, spaceAfter=6),
    "title": ParagraphStyle("title", fontName="MalgunBold", fontSize=23, leading=29, textColor=ink, spaceAfter=8),
    "intro": ParagraphStyle("intro", fontName="Malgun", fontSize=9.2, leading=15, textColor=muted),
    "item_title": ParagraphStyle("item_title", fontName="MalgunBold", fontSize=10.2, leading=14, textColor=ink),
    "question": ParagraphStyle("question", fontName="Malgun", fontSize=8.4, leading=13, textColor=muted),
    "action": ParagraphStyle("action", fontName="MalgunBold", fontSize=8.4, leading=13, textColor=green),
    "note": ParagraphStyle("note", fontName="Malgun", fontSize=8, leading=12, textColor=muted, alignment=TA_LEFT),
    "course": ParagraphStyle("course", fontName="MalgunBold", fontSize=8.5, leading=13, textColor=ink),
}

items = [
    ("01", "휴대폰·SNS 계정 준비", "촬영 가능한 휴대폰과 게시할 SNS 계정이 준비되어 있나요?", "계정 소개 문구를 한 줄로 정하고 촬영 공간을 1GB 이상 비워두세요."),
    ("02", "활동 가능 지역·시간", "실제로 이동 가능한 지역과 촬영 가능한 시간을 말할 수 있나요?", "활동 지역 1~2곳과 가능한 요일·시간대를 메모하세요."),
    ("03", "첫 맛집 영상 주제·촬영·업로드 준비", "첫 영상의 메뉴, 꼭 담을 장면, 업로드 날짜가 정해졌나요?", "메뉴 하나를 고르고 입구·전체 메뉴·한입 장면 순서로 3컷을 적으세요."),
    ("04", "협찬 신청 전 소개 자료·활동 조건", "협찬 신청 전 내 채널과 가능한 활동 조건을 설명할 수 있나요?", "채널 링크, 활동 지역, 가능한 촬영일, 얼굴 노출 여부를 한 화면에 정리하세요."),
]


def numbered_item(number, title, question, action):
    number_box = Table([[Paragraph(number, ParagraphStyle("n", fontName="MalgunBold", fontSize=12, textColor=colors.white, alignment=1))]], colWidths=[13 * mm], rowHeights=[13 * mm])
    number_box.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), pink), ("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
    body = [
        Paragraph(title, styles["item_title"]),
        Spacer(1, 2 * mm),
        Paragraph(f"확인 질문  {question}", styles["question"]),
        Spacer(1, 1.2 * mm),
        Paragraph(f"바로 할 일  {action}", styles["action"]),
    ]
    row = Table([[number_box, body]], colWidths=[18 * mm, 151 * mm], hAlign="LEFT")
    row.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (0, 0), 5 * mm),
        ("RIGHTPADDING", (1, 0), (1, 0), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    band = Table([[row]], colWidths=[176 * mm])
    band.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.white),
        ("BOX", (0, 0), (-1, -1), 0.6, line),
        ("LEFTPADDING", (0, 0), (-1, -1), 4 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 4 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4 * mm),
    ]))
    return KeepTogether([band, Spacer(1, 3 * mm)])


OUTPUT.parent.mkdir(parents=True, exist_ok=True)
doc = SimpleDocTemplate(
    str(OUTPUT), pagesize=A4, rightMargin=17 * mm, leftMargin=17 * mm,
    topMargin=15 * mm, bottomMargin=13 * mm, title="맛집 콘텐츠 부업 4항목 점검표",
    author="맛집감별사",
)

story = [
    Paragraph("맛집감별사 · 무료 시작 가이드", styles["label"]),
    Paragraph("맛집 콘텐츠 부업<br/>시작 전 4항목 점검표", styles["title"]),
    Paragraph("휴대폰으로 맛집채널을 시작하기 전, 내 준비 상태와 먼저 해야 할 일을 차례대로 확인하세요. 체크가 비어 있어도 괜찮습니다. 바로 할 일부터 하나씩 실행하면 됩니다.", styles["intro"]),
    Spacer(1, 7 * mm),
]
for item in items:
    story.append(numbered_item(*item))

story.extend([
    Spacer(1, 2 * mm),
    Table([[Paragraph("점검표는 무료입니다. 협찬·매장 연결·수익은 활동 조건에 따라 달라지며 보장되지 않습니다.", styles["note"])], [Paragraph("직접 해보는 과정이 필요하다면, 맛간다챌린지에서 하루 실습으로 첫 영상 업로드까지 함께합니다. 일정·참가비: www.matgamsa.com/creator-course.html", styles["course"])]], colWidths=[176 * mm], style=TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), paper),
        ("BACKGROUND", (0, 1), (-1, 1), mint),
        ("LINEBEFORE", (0, 1), (0, 1), 3, colors.HexColor("#E2B841")),
        ("LEFTPADDING", (0, 0), (-1, -1), 4 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 3 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3 * mm),
    ])),
])

doc.build(story)
print(OUTPUT)
