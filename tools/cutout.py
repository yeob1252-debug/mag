"""hero-tiger.png / logo.png 의 흰 배경을 제거해 투명 PNG(cutout)를 만든다.

- hero-tiger.png: rembg(u2net)로 인물(캐릭터) 누끼. 히어로/신뢰섹션에서 사용.
- logo.png: 빈티지 스탬프(원형)라 배경 흰색만 투명화하고 원형은 그대로 둔다.
  (헤더 로고/파비콘용. 원형 스탬프 자체가 디자인이므로 원은 남긴다.)
결과물:
  assets/images/hero-tiger-cutout.png
  assets/images/logo-cutout.png
"""
import os
from PIL import Image
import numpy as np

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(BASE, "assets", "images")


def hero_cutout():
    from rembg import remove
    src = os.path.join(IMG, "hero-tiger.png")
    dst = os.path.join(IMG, "hero-tiger-cutout.png")
    inp = Image.open(src).convert("RGBA")
    out = remove(inp)
    # 여백 잘라내기(투명 픽셀 기준 bbox)
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)
    out.save(dst)
    print("saved", dst, out.size)


def logo_cutout():
    """흰 배경만 제거. 캐릭터/글자는 빨강, 배경은 순백이라
    밝기(≈흰색) + 저채도 픽셀을 코너 flood 없이 단순 임계로 투명화한다."""
    src = os.path.join(IMG, "logo.png")
    dst = os.path.join(IMG, "logo-cutout.png")
    img = Image.open(src).convert("RGBA")
    arr = np.array(img)
    rgb = arr[:, :, :3].astype(np.int16)
    # 흰색에 가까운 픽셀: 세 채널 모두 매우 높고 서로 비슷함
    near_white = (rgb.min(axis=2) > 232)
    arr[near_white, 3] = 0
    out = Image.fromarray(arr, "RGBA")
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)
    out.save(dst)
    print("saved", dst, out.size)


if __name__ == "__main__":
    logo_cutout()
    hero_cutout()
