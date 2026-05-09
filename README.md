# MangaFlow

만화 이미지를 AI로 번역하는 SaaS 서비스. 이미지를 업로드하면 텍스트를 감지하고, 번역 후 원본 말풍선에 렌더링해서 돌려준다.

## 주요 기능

- 만화 이미지 번역 (일→한, 영→한 등)
- 소셜 로그인 (Google, Kakao, GitHub, Discord)
- 구독 플랜 (Free / Basic / Pro)
- 월별 번역 페이지 사용량 추적
- 조직(팀) 관리 및 초대

## 플랜

| 플랜 | 월 번역 한도 | 가격 |
|------|-------------|------|
| Free | 10장 | 무료 |
| Basic | 100장 | $9/월 |
| Pro | 500장 | $19/월 |

## 아키텍처

```
[web/ - Next.js]  ──docker exec──▶  [manga-translator 컨테이너]
 로그인 / 결제 / UI                   이미지 → 텍스트감지 → 번역 → 인페인팅
        │
   [PostgreSQL]
```

- **web/**: Next.js 앱. 인증(Better Auth), 결제(Stripe), 번역 UI 포함.
- **manga-translator**: `zyddnys/manga-image-translator:main` 도커 이미지. HTTP API 서버 방식이 아닌 `docker exec`으로 `local` 모드를 직접 실행.

> `local` 모드를 사용하는 이유: 현재 `main` 태그 이미지의 HTTP 서버는 내부적으로 `shared` 모드 워커가 필요한데, `shared` 모드가 보안 이슈로 코드 레벨에서 비활성화되어 있어 HTTP API가 동작하지 않는다.

## 프로젝트 구조

```
manga-translator/
├── docker-compose.yml          # manga-image-translator 컨테이너
├── .env                        # 번역기 API 키 (git 미추적)
├── .env.example
├── result/                     # 번역 결과 저장 (git 미추적)
│   └── final.png               # local 모드 단일 파일 번역 결과 고정 경로
└── web/                        # Next.js 메인 앱
    ├── docker-compose.yml      # PostgreSQL DB
    ├── .env                    # DB / 인증 / 결제 키 (git 미추적)
    ├── .env.example
    └── src/
        ├── app/
        │   ├── page.tsx            # 메인 번역 UI
        │   ├── profile/            # 프로필, 구독, 세션 관리
        │   ├── organizations/      # 조직 관리
        │   ├── admin/              # 어드민 패널
        │   └── api/
        │       ├── translate/      # 번역 API (docker exec 방식)
        │       └── auth/           # Better Auth 핸들러
        ├── components/
        │   ├── ImageDropzone.tsx   # 이미지 업로드 드롭존
        │   ├── auth/               # 로그인 다이얼로그
        │   └── layout/             # 헤더
        ├── lib/
        │   ├── auth/               # Better Auth 설정, Stripe 플랜
        │   └── emails/             # Resend 이메일 템플릿
        └── drizzle/                # DB 스키마 및 설정
```

## 시작하기

### 1. 번역기 컨테이너 실행

```bash
# 루트 디렉토리에서
cp .env.example .env
# .env에 번역기 API 키 설정
docker compose up -d
```

첫 실행 시 이미지 다운로드에 시간이 걸린다 (~15GB).

### 2. 웹 앱 실행

```bash
cd web
cp .env.example .env
# .env에 DB, 인증, 결제 키 설정

# DB 실행
docker compose up -d

# 패키지 설치 및 DB 마이그레이션
pnpm install
pnpm db:migrate

# 개발 서버
pnpm dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인.

## 환경 변수

### 루트 `.env` (번역기 컨테이너용)

```env
OPENAI_API_KEY=           # OpenAI 번역
OPENAI_MODEL=chatgpt-4o-latest
DEEPL_AUTH_KEY=           # DeepL 번역
# DEEPSEEK_API_KEY=
# GROQ_API_KEY=
```

### `web/.env` (Next.js 앱용)

```env
# Database
DATABASE_URL=
DB_HOST=
DB_PORT=
DB_PASSWORD=
DB_USER=
DB_NAME=

# Better Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000

# 소셜 로그인
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
KAKAO_CLIENT_ID=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=

# Resend (이메일)
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Stripe (결제)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_BASIC_PRICE_ID=
STRIPE_PRO_PRICE_ID=

# Arcjet (선택, rate limiting)
ARCJET_API_KEY=
```

## 번역기 지원 목록

| 번역기 | 환경 변수 | 한국어 지원 |
|--------|----------|------------|
| `openai` | `OPENAI_API_KEY` | ✅ |
| `gemini` | `GEMINI_API_KEY` | ✅ |
| `deepseek` | `DEEPSEEK_API_KEY` | ✅ |
| `deepl` | `DEEPL_AUTH_KEY` | ✅ |
| `groq` | `GROQ_API_KEY` | ✅ |
| `nllb` | 없음 (오프라인) | ✅ (품질 낮음) |
| `sugoi` | 없음 (오프라인) | ❌ 일→영만 |

현재 코드에서 기본 번역기는 `gemini`로 설정되어 있다.

## 번역 API 동작 방식

`POST /api/translate`에 이미지를 FormData로 전송하면:

1. `result/<jobId>/input.png`에 이미지 저장 (컨테이너와 공유 볼륨)
2. `result/<jobId>/config.json`에 번역 설정 저장
3. `docker exec manga-translator python -m manga_translator local ...` 실행
4. `result/final.png` 읽어서 PNG 응답 반환
5. `result/<jobId>/` 정리

동시 요청은 `translating` 플래그로 막아서 429를 반환한다 (local 모드는 결과를 `final.png` 고정 경로에 저장하므로).

## 기술 스택

- **Frontend/Backend**: Next.js 16, React 19, TypeScript
- **DB**: PostgreSQL 17 + Drizzle ORM
- **인증**: Better Auth (소셜 로그인, 조직 관리, 어드민)
- **결제**: Stripe (@better-auth/stripe)
- **이메일**: Resend
- **스타일**: Tailwind CSS v4, shadcn/ui
- **번역 엔진**: zyddnys/manga-image-translator

## 배포

개인 데스크탑 서버 (Ubuntu + Nvidia GPU)에서 Docker Compose로 운영.

### GPU 활성화

```bash
# 1. nvidia-container-toolkit 설치
# https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html

# 2. 루트 docker-compose.yml에서 GPU 블록 주석 해제
#    deploy:
#      resources:
#        reservations:
#          devices:
#            - driver: nvidia
#              count: all
#              capabilities: [gpu]
```

Mac 로컬 개발 환경에서는 CPU 모드로만 동작한다.
