from __future__ import annotations

import json
import struct
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG = {
    "canonical": "https://www.matgamsa.com/",
    "title": "맛집감별사 | 맛집채널과 음식점을 연결합니다",
    "description": "대구 맛간다챌린지 · 크리에이터 광고 매칭",
    "image": "https://www.matgamsa.com/assets/og/matgamsa-share-20260828-v2.png",
    "alt": "맛집감별사 — 맛집채널과 음식점을 연결합니다. 대구 맛간다챌린지 · 크리에이터 광고 매칭",
    "asset": "assets/og/matgamsa-share-20260828-v2.png",
}


class Head(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.values: dict[str, list[str]] = {}
        self.canonical: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_map = {key.lower(): value or "" for key, value in attrs}
        if tag.lower() == "meta":
            key = attrs_map.get("property") or attrs_map.get("name")
            if key:
                self.values.setdefault(key.lower(), []).append(attrs_map.get("content", ""))
        if tag.lower() == "link" and "canonical" in attrs_map.get("rel", "").lower().split():
            self.canonical.append(attrs_map.get("href", ""))


def only(parser: Head, key: str) -> str:
    values = parser.values.get(key, [])
    assert len(values) == 1, f"{key}: expected one authoritative value, got {values}"
    return values[0]


def main() -> None:
    parser = Head()
    parser.feed((ROOT / "index.html").read_text(encoding="utf-8"))
    assert parser.canonical == [CONFIG["canonical"]], parser.canonical
    expected = {
        "og:type": "website", "og:url": CONFIG["canonical"], "og:title": CONFIG["title"],
        "og:description": CONFIG["description"], "og:image": CONFIG["image"],
        "og:image:secure_url": CONFIG["image"], "og:image:type": "image/png",
        "og:image:width": "1200", "og:image:height": "630", "og:image:alt": CONFIG["alt"],
        "twitter:card": "summary_large_image", "twitter:title": CONFIG["title"],
        "twitter:description": CONFIG["description"], "twitter:image": CONFIG["image"],
        "twitter:image:alt": CONFIG["alt"],
    }
    for key, value in expected.items():
        assert only(parser, key) == value, key
    assert CONFIG["image"].startswith("https://") and "?" not in CONFIG["image"]
    data = (ROOT / CONFIG["asset"]).read_bytes()
    assert data[:8] == b"\x89PNG\r\n\x1a\n" and data[12:16] == b"IHDR"
    width, height = struct.unpack(">II", data[16:24])
    assert (width, height) == (1200, 630)
    assert data[24] == 8 and data[25] == 2, "expected 8-bit opaque RGB PNG"
    assert b"iCCP" in data or b"sRGB" in data, "sRGB profile/chunk missing"
    assert len(data) <= 500_000, len(data)
    print(json.dumps({"status": "PASS", "fields": len(expected), "bytes": len(data), "dimensions": [width, height]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
