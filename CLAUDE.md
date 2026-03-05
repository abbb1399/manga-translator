# Manga Translator API

만화 이미지 번역 서비스의 백엔드 API 프로젝트.
[manga-image-translator](https://github.com/zyddnys/manga-image-translator)를 Docker로 실행하고, 나중에 Next.js 프론트엔드에서 호출할 API를 제공한다.

## Architecture

```
[Next.js Frontend] → [이 프로젝트 API] → [manga-image-translator Docker 컨테이너]
                                            (포트 5003)
```

- **manga-image-translator**: Docker 컨테이너로 실행. 이미지를 받아서 텍스트 감지 → 번역 → 인페인팅 수행
- **이 프로젝트**: manga-image-translator의 API를 감싸는 래퍼 역할 (추후 구현)
- **Next.js Frontend**: 별도 프로젝트로 구현 예정

## Quick Start

### 1. 환경 변수 설정

```bash
cp .env.example .env
# .env 파일에 사용할 번역기의 API 키 입력
```

### 2. Docker 컨테이너 실행

```bash
# CPU 모드 (기본)
docker compose up -d

# 로그 확인
docker compose logs -f manga-translator
```

> 첫 실행 시 이미지 다운로드에 시간이 걸린다 (~15GB)

### 3. API 확인

- Swagger 문서: http://localhost:5003/docs
- 컨테이너가 완전히 시작된 후 접근 가능

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
사용할 번역기에 맞는 API 키를 `.env`에 설정.

## GPU 사용 (선택)

Mac에서는 CPU 모드만 사용. Linux/Windows에서 Nvidia GPU 사용 시:

1. [nvidia-container-toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html) 설치
2. `docker-compose.yml`에서 GPU 관련 주석 해제

## Project Structure

```
translator/
├── CLAUDE.md              # 이 파일
├── docker-compose.yml     # manga-image-translator 컨테이너 설정
├── .env                   # API 키 (git 미추적)
├── .env.example           # 환경 변수 템플릿
├── .gitignore
└── result/                # 번역 결과 저장 (git 미추적)
```

## Development Notes

- manga-image-translator의 Swagger 문서(`/docs`)를 참고하여 API 엔드포인트 파악
- 프론트엔드는 별도 Next.js 프로젝트로 구현 예정
- 이 프로젝트는 백엔드 API 래퍼 역할
