# Manga Translator (모노레포)

만화 이미지 번역 SaaS 서비스. 로그인, 결제, 번역 기능을 포함한 풀스택 프로젝트.

## Architecture

```
[web/ - Next.js 앱]  →  docker exec  →  [manga-translator 컨테이너]
 로그인 / 결제 / UI      (local 모드)      이미지 → 텍스트감지 → 번역 → 인페인팅
        |
   [PostgreSQL DB]
```

- **web/**: 메인 Next.js 앱. 사용자 인증(로그인), 결제, 번역 UI 포함. 자체 PostgreSQL DB 보유.
- **manga-translator**: `zyddnys/manga-image-translator:main` Docker 이미지. HTTP API 서버가 아닌 `docker exec`으로 `local` 모드를 직접 실행하는 방식으로 사용.

## 배포 환경

AWS EC2. 모든 서비스를 Docker Compose로 운영 예정.

## Project Structure

```
translator/
├── CLAUDE.md                  # 이 파일
├── docker-compose.yml         # manga-image-translator 컨테이너
├── .env                       # manga-translator API 키 (git 미추적)
├── .env.example               # 환경 변수 템플릿
├── .gitignore
├── result/                    # 번역 결과 저장 (git 미추적)
│   └── final.png              # local 모드 단일 파일 번역 결과 고정 경로
└── web/                       # Next.js 메인 앱
    ├── src/
    │   ├── app/               # App Router
    │   │   └── api/translate/ # 번역 API 라우트 (docker exec 방식)
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
# .env에 번역기 API 키 설정 (아래 번역기 섹션 참고)
docker compose up -d
```

> 첫 실행 시 이미지 다운로드에 시간이 걸린다 (~15GB)

### web 앱 실행

```bash
cd web
cp .env.example .env
# DB 실행
docker compose up -d
# 개발 서버
pnpm dev
```

## manga-image-translator 실행 방식

### 핵심: HTTP API 서버가 아닌 docker exec 방식 사용

현재 이미지(`main` 태그)의 `server/main.py`는 내부적으로 `shared` 모드 워커를 필요로 하는데,
`shared` 모드가 보안 문제로 코드레벨에서 비활성화(`raise Exception`)되어 있어 HTTP API가 동작하지 않는다.

**해결책**: 컨테이너를 상시 대기(`tail -f /dev/null`)시키고, `docker exec`으로 `local` 모드를 직접 실행.

### docker-compose.yml 구조

```yaml
entrypoint: ["tail", "-f", "/dev/null"]  # HTTP 서버 대신 상시 대기
volumes:
  - ./result:/app/result  # 호스트↔컨테이너 결과 파일 공유
  - manga-translator-models:/app/models  # 모델 캐시
```

### local 모드 번역 실행

```bash
docker exec manga-translator python -m manga_translator local \
  -i /app/result/<jobId>/input.png \
  --config-file /app/result/<jobId>/config.json \
  --overwrite
```

**결과 파일 위치**: 단일 파일 번역 시 항상 `result/final.png`에 고정 저장됨 (`-o` 옵션 무시).

### config.json 형식

번역기 설정은 `--config-file`로 JSON 파일을 전달:

```json
{
  "translator": {
    "translator": "openai",
    "target_lang": "KOR"
  }
}
```

### local 모드 CLI 옵션

```
-i, --input     입력 이미지 경로 (필수)
-o, --dest      출력 폴더 (배치 모드에서만 유효, 단일 파일은 result/final.png 고정)
--config-file   번역 설정 JSON 파일 경로
--overwrite     결과 파일 덮어쓰기
```

### Next.js API 라우트 구조 (web/src/app/api/translate/route.ts)

1. 이미지를 `result/<jobId>/input.png`에 저장 (공유 볼륨)
2. config.json을 `result/<jobId>/config.json`에 저장
3. `docker exec manga-translator python -m manga_translator local ...` 실행
4. `result/final.png` 읽어서 응답
5. `result/<jobId>/` 정리

동시 요청 방지: `let translating = false` 플래그로 단순 lock (429 반환).

## 지원 번역기

| 번역기 | 키 이름 | API 키 필요 | 한국어 지원 |
|--------|---------|------------|------------|
| `openai` | `OPENAI_API_KEY` | ✅ (유료) | ✅ |
| `deepseek` | `DEEPSEEK_API_KEY` | ✅ (저렴) | ✅ |
| `deepl` | `DEEPL_AUTH_KEY` | ✅ | ✅ |
| `gemini` | `GEMINI_API_KEY` | ✅ | ✅ |
| `groq` | `GROQ_API_KEY` | ✅ | ✅ |
| `sugoi` | 없음 | ❌ 오프라인 | ❌ (일→영만) |
| `nllb` | 없음 | ❌ 오프라인 | ✅ (품질 낮음) |

API 키는 루트 `.env`에 설정 (컨테이너에 `env_file`로 주입됨).

## GPU 사용 (선택)

Mac에서는 CPU 모드만 사용. EC2 Linux + Nvidia GPU 사용 시:

1. [nvidia-container-toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html) 설치
2. 루트 `docker-compose.yml`에서 GPU 관련 주석 해제
