"""신규 이미지 처리:
- 캐릭터 이미지(hero-tiger-filming, curriculum-1~4-scene)는 rembg로 흰 배경 제거 → -transparent.png
  (코드 단계 배경 제거. 원칙 14)
- og-image.png 는 1200x630 센터 크롭/리사이즈 → og-image-1200x630.png
- credential-* 는 사각 카드째 사용하므로 배경 제거하지 않음.
"""
import os
from PIL import Image

IMG = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "images")

CUTOUTS = [
    "hero-tiger-filming.png",
    "curriculum-1-branding-scene.png",
    "curriculum-2-ai-plan-scene.png",
    "curriculum-3-editing-scene.png",
    "curriculum-4-offline-scene.png",
]


def make_transparent():
    from rembg import remove
    for fn in CUTOUTS:
        src = os.path.join(IMG, fn)
        dst = os.path.join(IMG, fn.replace(".png", "-transparent.png"))
        out = remove(Image.open(src).convert("RGBA"))
        bbox = out.getbbox()
        if bbox:
            out = out.crop(bbox)
        out.save(dst)
        print("cutout", os.path.basename(dst), out.size)


def resize_og():
    src = os.path.join(IMG, "og-image.png")
    dst = os.path.join(IMG, "og-image-1200x630.png")
    im = Image.open(src).convert("RGB")
    tw, th = 1200, 630
    # 커버 방식(비율 유지 + 센터 크롭)
    sw, sh = im.size
    scale = max(tw / sw, th / sh)
    nw, nh = int(sw * scale), int(sh * scale)
    im2 = im.resize((nw, nh), Image.LANCZOS)
    left, top = (nw - tw) // 2, (nh - th) // 2
    im2 = im2.crop((left, top, left + tw, top + th))
    im2.save(dst, quality=90)
    print("og", im2.size)


if __name__ == "__main__":
    resize_og()
    make_transparent()
    print("done")
