# Manga Translator (모노레포)

만화 이미지 번역 SaaS 서비스. 로그인, 결제, 번역 기능을 포함한 풀스택 프로젝트.

## Architecture

```
[web/ - Next.js 앱]  →  [manga-translator Docker 컨테이너]
 로그인 / 결제 / UI       (포트 5003, manga-image-translator)
        |
   [PostgreSQL DB]
```

- **web/**: 메인 Next.js 앱. 사용자 인증(로그인), 결제, 번역 UI 포함. 자체 PostgreSQL DB 보유.
- **manga-translator**: [manga-image-translator](https://github.com/zyddnys/manga-image-translator)를 Docker로 실행. 이미지 → 텍스트 감지 → 번역 → 인페인팅 수행.

## 배포 환경

AWS EC2. 모든 서비스를 Docker Compose로 운영 예정.

## Project Structure

```
translator/
├── CLAUDE.md                  # 이 파일
├── docker-compose.yml         # manga-image-translator 컨테이너 (포트 5003)
├── .env                       # manga-translator API 키 (git 미추적)
├── .env.example               # 환경 변수 템플릿
├── .gitignore
├── result/                    # 번역 결과 저장 (git 미추적)
└── web/                       # Next.js 메인 앱
    ├── src/
    │   ├── app/               # App Router
    │   └── components/
    ├── docker-compose.yml     # PostgreSQL DB
    ├── .env                   # DB / 인증 / 결제 키 (git 미추적)
    ├── .env.example
    └── package.json
```

## Quick Start

### manga-image-translator 실행

```bash
# 루트에서
cp .env.example .env
docker compose up -d

# 로그 확인
docker compose logs -f manga-translator
```

> 첫 실행 시 이미지 다운로드에 시간이 걸린다 (~15GB)
> Swagger 문서: http://localhost:5003/docs

### web 앱 실행

```bash
cd web
cp .env.example .env
# DB 실행
docker compose up -d
# 개발 서버
pnpm dev
```

## manga-image-translator API

Docker 컨테이너가 제공하는 FastAPI 기반 API. 자세한 엔드포인트는 `/docs`에서 확인.

### 주요 서버 옵션

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `--host` | 호스트 | 127.0.0.1 |
| `--port` | 포트 | 5003 |
| `--use-gpu` | GPU 가속 | off |
| `--start-instance` | 자동 인스턴스 시작 | off |
| `--verbose` | 디버그 출력 | off |

### 지원 번역기

OpenAI, DeepL, DeepSeek, Groq, Baidu, Youdao, Caiyun 등.
사용할 번역기에 맞는 API 키를 루트 `.env`에 설정.

## GPU 사용 (선택)

Mac에서는 CPU 모드만 사용. EC2 Linux + Nvidia GPU 사용 시:

1. [nvidia-container-toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html) 설치
2. 루트 `docker-compose.yml`에서 GPU 관련 주석 해제
