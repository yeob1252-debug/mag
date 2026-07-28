"""`.env` 를 읽어 브라우저용 js/config.js (window.MAG_ENV) 를 생성한다.
정적 사이트는 브라우저에서 .env 를 직접 읽을 수 없으므로, .env 를 단일 소스로 두고
이 스크립트로 config.js 를 만들어 <script> 로 로드한다.

사용법:  python tools/gen-config.py
"""
import json
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE, ".env")
OUT_PATH = os.path.join(BASE, "js", "config.js")

# .env 키 → config.js(camelCase) 키
KEY_MAP = {
    "MAG_INFLUENCERS_API": "influencersApi",
    "MAG_EVENTS_API": "eventsApi",
    "MAG_CHALLENGE_API": "challengeApi",
    "MAG_CONTACT_FORM": "contactForm",
    "MAG_CONTACT_ENTRY_TYPE": "contactEntryType",
    "MAG_CONTACT_ENTRY_CHANNEL": "contactEntryChannel",
    "MAG_INFLUENCER_FORM": "influencerForm",
}


def parse_env(path):
    env = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
    return env


def main():
    env = parse_env(ENV_PATH)
    cfg = {out: env.get(src, "") for src, out in KEY_MAP.items()}
    body = json.dumps(cfg, ensure_ascii=False, indent=2)
    js = (
        "/* 이 파일은 tools/gen-config.py 가 .env 에서 자동 생성합니다. 직접 수정하지 마세요. */\n"
        "window.MAG_ENV = " + body + ";\n"
    )
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write(js)
    print("wrote", OUT_PATH)
    for k, v in cfg.items():
        print(f"  {k}: {'(빈값)' if not v else v[:60]}")


if __name__ == "__main__":
    main()
