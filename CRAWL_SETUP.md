# 로컬 크롤링 실행 방법

크롤링은 로컬 환경에서만 동작합니다 (배포 서버는 한국 IP가 아니라 올리브영 차단됨).

## 1. Python 의존성 설치 (최초 1회)

```bash
cd backend
pip install playwright==1.49.0
playwright install chromium
```

## 2. 백엔드 실행

```bash
cd backend
uvicorn main:app --reload --port 8000
```

## 3. 프론트엔드 실행

```bash
cd frontend
npm run dev
```

> `frontend/.env.local`의 `VITE_API_URL`이 `http://localhost:8000`으로 설정돼 있어야 합니다.

## 4. 크롤링

브라우저에서 `http://localhost:5173` 접속 → **도구 > 크롤링** 탭 사용
(배포된 Vercel 사이트에서는 크롤링 탭이 보이지 않음)
