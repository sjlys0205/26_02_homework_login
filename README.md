# 스터디 Q&A 게시판

웹서비스설계 JWT 게시판 과제입니다. 
전공 등을 공부하다 막힌 부분을 질문으로 올리고 함께 해결하는 Q&A 게시판을 구성하고 여기에 JWT 로그인 방식과 작성자 권한 검사를 적용했습니다.

## 작성자와 서비스 소개

- 학번 / 이름: 202012174 / 김선재
- 서비스 목적과 대상 사용자: 같은 과목이나 전공을 공부하는 학생들이 막힌 개념이나 오류를 질문으로 남기는 게시판입니다. 질문 목록과 내용은 로그인하지 않아도 누구나 읽을 수 있습니다. 질문 등록은 로그인한 사용자만 할 수 있고, 수정·삭제는 질문 작성자만 할 수 있습니다. 토큰은 브라우저 탭의 메모리에만 보관해 새로고침하면 해제됩니다.
- 선택한 기술: Vue + Express
- 주요 기능: 공개 질문 목록·상세 조회, 로그인(JWT 발급), 내 정보 조회, 질문 등록, 질문 수정·삭제(본인 질문 한정), 로그아웃, 토큰 없음·변조·만료 처리(401), 다른 작성자 수정·삭제 거부(403), 입력 필드 검사(400), 없는 글 처리(404)

## 보고서와 테스트 증거

- [구현 보고서 PDF](docs/report.pdf)
- [테스트 증거](docs/evidence/)
  - `E01`~`E04`: 새 폴더 clone·설치·빌드·4173포트 실행 화면
  - `T01`~`T17`: 테스트 시나리오별 REST Client 응답과 브라우저 화면·Network 캡처
  - `C01_finalCheck.jpg`, `C02_expiryCheck.jpg`: 검사 스크립트 결과

## 프로젝트 구조

```text
.
├── README.md
├── .gitignore / .gitattributes
├── backend/                 # Express 백엔드
│   ├── .env.example         # 환경설정 예시 (실제 .env는 제출하지 않음)
│   ├── requests.http        # T01~T17 수동 테스트 요청 (VS Code REST Client)
│   └── src/
│       ├── app.js           # 라우트, 입력 검사, 오류 응답(401 WWW-Authenticate)
│       ├── auth.js          # JWT 설정 검사·발급·검증, 작성자 권한 검사 (BE-01~03)
│       ├── errors.js        # ApiError (status, code, message)
│       ├── store.js         # SQLite(sql.js) 게시글 저장
│       └── users.js         # 테스트 계정과 scrypt 비밀번호 검증
├── frontend/                # Vue 3 + Vite 프론트
│   ├── vite.config.js       # /api → 127.0.0.1:8000 프록시 (5173, 4173)
│   └── src/
│       ├── api.js           # 메모리 세션, Authorization 헤더, 응답 처리 (FE-01~03)
│       └── App.vue          # 화면 상태, 오류 안내, 작성자별 버튼, 로그아웃 (FE-03~04)
├── tools/
│   └── check_api.py         # 제공된 API 자동 검사 스크립트
└── docs/
    ├── report.pdf
    └── evidence/
```

## 실행 환경

| 항목 | 사용 버전 |
|---|---|
| 운영체제 | Windows 11 Home (PowerShell) |
| 프론트 런타임 Node.js | Node.js 24.22.0, npm 11.19.1 |
| 백엔드 런타임 | Node.js 24.22.0 |
| 프레임워크 | Vue 3.5.43, Vite 8.3.4, @vitejs/plugin-vue 6.0.9 / Express 5.3.0, jsonwebtoken 9.0.3, dotenv 18.0.7 |
| 데이터 저장 | SQLite (sql.js 1.14.2, 파일 `backend/data/board.sqlite`) |
| 검사 스크립트 | Python 3.14.3 (`tools/check_api.py`) |

## 설치와 실행

아래 명령은 Windows PowerShell 기준이며, 백엔드와 프론트는 각각 별도 터미널에서 실행합니다.

### 1 저장소 복제

```powershell
git clone https://github.com/sjlys0205/26_02_homework_login.git
cd 26_02_homework_login
```

### 2 백엔드 준비와 실행 (터미널 1, `backend` 폴더)

```powershell
cd backend
npm ci
Copy-Item .env.example .env
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
# 출력된 64자리 16진수를 .env의 JWT_SECRET= 뒤에 붙여넣고 저장
npm start
```

- 환경설정 예시 파일: `backend/.env.example` → `backend/.env`로 복사해 사용
- JWT_SECRET 설정 방법: 위 명령으로 새 난수(64자리 16진수, 32바이트 키)를 만들어 `.env`에 삽입. 실제 키는 저장소에 기록되지 않음(`.env`는 `.gitignore` 대상). 
빈 값, 형식 오류, 예시 키(`REPLACE_WITH_...`)는 서버가 시작 거부
- TOKEN_TTL: 기본 90초. 만료 테스트는 서버를 종료한 뒤 `$env:TOKEN_TTL="3"; npm start`(검사 스크립트용) 또는 `$env:TOKEN_TTL="10"; npm start`(수동 확인용)로 재시작, 끝나면 `Remove-Item Env:TOKEN_TTL; npm start`로 되돌림.
- 백엔드 주소: http://127.0.0.1:8000
- 정상 실행 확인 방법: 터미널에 `스터디 Q&A 게시판 서버 http://127.0.0.1:8000 (JWT 인증·작성자 권한 적용)`가 표시되고, http://127.0.0.1:8000/api/health 가 `{"status":"ok","stack":"express"}`를 반환.

### 3 프론트 빌드와 로컬 실행 (터미널 2, `frontend` 폴더)

백엔드를 켜 둔 상태에서 실행합니다.

```powershell
cd frontend
npm ci
npm run build
npm run preview
```

- 최종 확인 주소: http://127.0.0.1:4173
- 개발 중 실행: `npm run dev`, http://127.0.0.1:5173
- API 연결 방식: 브라우저는 같은 출처의 `/api`로만 요청하고, Vite(`vite.config.js`의 `preview.proxy`·`server.proxy`)가 이를 `http://127.0.0.1:8000`으로 전달합니다. 백엔드 포트를 바꾸면 `.env`의 `PORT`와 두 proxy 주소를 함께 수정
- 종료: 프론트와 백엔드를 실행한 각 터미널에서 Ctrl+C
- 코드 변경 후 재실행: 프론트는 `npm run build` 후 `npm run preview`를 다시 실행하고, 백엔드는 Ctrl+C 후 `npm start`로 재시작

### 4 테스트 계정과 DB

| 사용자 | 이메일 | 실습용 비밀번호 |
|---|---|---|
| Alice | alice@class.test | Classroom!2026 |
| Bob | bob@class.test | Classroom!2026 |

- SQLite 파일 위치와 자동 생성 방식: `backend` 폴더에서 `npm start`를 실행하면 `backend/data/board.sqlite`가 없을 때 폴더와 파일을 자동으로 만들고 `posts` 테이블을 생성. 경로는 `.env`의 `DB_FILE`로 바꿀 수 있으며 실행 폴더 기준 상대 경로임.
- DB 초기화 방법: 백엔드를 종료하고 `backend/data/board.sqlite`를 삭제한 뒤 다시 `npm start`실행.(기존 글 모두 삭제됨)
- 서버 재시작 후 데이터 유지 확인 결과: 글을 등록한 뒤 백엔드를 Ctrl+C로 종료(화면은 HTTP 502)하고 `npm start`로 재시작했을 때 기존 글의 제목·작성자·내용이 그대로 유지됨(T15).

위 계정은 과제 전용 테스트 계정입니다. 실제 서비스 계정 정보나 서버 비밀 키를 기록하지 않습니다.

## 구현 완료 범위

| 기능 | 완료 여부 | 주요 파일 또는 함수 |
|---|---|---|
| 공개 목록과 상세 | 완료 | `app.js` GET `/api/posts`, `/api/posts/:id` / `api.js` `api.list`, `api.detail` |
| 로그인과 JWT 발급 | 완료 | `auth.js` `loadConfig`, `issueToken` / `api.js` `login` |
| JWT 검증과 내 정보 조회 | 완료 | `auth.js` `readBearer`, `currentUserId`, `validClaims` / `app.js` GET `/api/me` |
| 글 작성과 작성자 저장 | 완료 | `app.js` POST `/api/posts` (작성자는 `currentUserId` 결과로 결정) |
| 본인 글 수정·삭제 | 완료 | `auth.js` `assertOwner` / `api.js` `canEdit` / `App.vue` 수정·삭제 버튼 |
| 토큰 만료와 로그아웃 | 완료 | `auth.js` TokenExpiredError → `TOKEN_EXPIRED` / `api.js` `clearSession` / `App.vue` `logout` |
| 입력 오류와 권한 오류 처리 | 완료 | `app.js` `fields`, `postId`, 오류 처리 미들웨어 / `App.vue` `describe`, `run` |

알려진 문제와 미완성 기능: 없음. 로그아웃은 이 탭에서 토큰을 지우는 방식이며, 이미 발급된 토큰을 서버에서 무효화하지는 않음(서버에서는 만료 시각까지 유효)

## 테스트 방법과 결과 요약

- 실행한 검사 명령과 실행 위치: 저장소 루트에서 백엔드 실행 후 `python tools/check_api.py --mode final` → **All 40 checks passed**. 백엔드를 `$env:TOKEN_TTL="3"`으로 재시작한 뒤 `python tools/check_api.py --mode final --expiry` → **All 48 checks passed**.
- 수동 테스트: `backend/requests.http`(VS Code REST Client)로 T01~T09, T12~T14, T17, T06을 순차 실행하고, T02·T10·T11·T15·T16은 프론트엔드 빌드 화면과 브라우저 개발자 도구 Network 탭에서 추가 확인
- Alice/Bob 권한 구분 확인 결과: Bob이 Alice 글을 수정·삭제하면 **403 FORBIDDEN**이고 재조회 시 글 유지 됨(T07, T08). 화면에서는 다른 사용자의 질문에 수정·삭제 버튼 표시 안 됨(별개로 백엔드에서 권한 검사는 진행함). Bob은 본인 글을 등록(201)·수정(200)·삭제(204)할 수 있음(T17).
- HTTP 상태와 오류 code 확인: 200(목록·상세·로그인·/me·수정), 201(등록), 204(삭제), 400 `BAD_INPUT`(testCase: 빈 제목·공백 본문·101자 제목·authorId/userId 추가·잘못된 ID), 401 `INVALID_CREDENTIALS`·`TOKEN_REQUIRED`·`INVALID_TOKEN`·`TOKEN_EXPIRED`, 403 `FORBIDDEN`, 404 `NOT_FOUND`를 응답으로 확인
- 응답 헤더와 본문 확인: 201 응답의 `Location: /api/posts/{id}`, 보호 API 401 응답의 `WWW-Authenticate: Bearer`, 204 응답의 빈 본문을 확인.
- 토큰 없음·변조·만료 확인 결과: 토큰 없음은 `TOKEN_REQUIRED`(T04, T17, 로그아웃 후 /me는 Authorization 헤더 자체가 없음 T11), 서명 첫 글자를 바꾼 토큰은 /me·POST·PUT·DELETE 모두 `INVALID_TOKEN`(T09), TTL 10초로 발급한 토큰은 만료 후 /me·POST·PUT·DELETE 모두 401이고 화면이 로그아웃 상태로 바뀌며 재로그인 안내(T10). 실패한 요청 이후 데이터 유지 확인.
- 전체 T01~T17 결과와 증거: [보고서](docs/report.pdf)의 테스트 결과 부분, [docs/evidence/](docs/evidence/)

## 핵심 구현 설명

1. **로그인**: 화면의 로그인 폼 → `api.js` `login()`이 `POST /api/auth/login` → 백엔드가 `users.js` `verifyCredentials`로 비밀번호를 확인하고 `auth.js` `issueToken`이 HS256으로 `sub`(문자열 사용자 ID)·`iss`·`aud`·`exp`를 담은 토큰을 발급
2. **토큰 보관·전송**: 프론트는 토큰과 user를 `api.js`의 모듈 변수(메모리)에만 저장(localStorage 미사용). `authorizationHeaders()`가 토큰이 있을 때만 `Authorization: Bearer <JWT>`를 붙임.
3. **서버 검증**: 보호 API는 `currentUserId(req)`로 Bearer 형식을 확인하고 `jwt.verify`에 허용 알고리즘(HS256)·발급자·사용 대상을 지정해 서명과 만료를 검증한 뒤, `sub`가 실제 계정인지 확인한 사용자 ID만 반환
4. **작성자 권한**: 수정·삭제는 인증 → ID 형식(400) → 글 존재(404) → `assertOwner`(403) → 입력 검사(400) 순서로 검사 후 모두 이상이 없어야 DB를 수정(중간에 오류 발생시 즉시 오류코드 응답). 작성자 ID는 추가 요청으로 받지 않고 토큰을 검증해서 백엔드에서 지정
5. **응답 처리**: `api.js` `request()`는 401을 받으면 세션을 비우고, `App.vue` `describe()`가 code별 안내를 표시. 403은 로그인을 유지하고, 204는 JSON을 파싱하지 않음

## AI 활용 요약과 참고 자료

- AI 사용 여부: 사용
- 도구와 사용 목적: Claude Code (Anthropic, 모델 Claude Opus 5.5). 구현 단계 계획, `auth.js`·`api.js`·`App.vue` 코드 작성 보조, 테스트 요청(`requests.http`) 구성, 테스트 캡처 검토, 보고서 초안 작성에 사용.
- 반영 위치와 직접 수정·검증한 내용: AI의 보조로 작성한 코드를 단계별로 확인, 이후 작성된 코드에 대한 테스트(T01~T17, 검사 스크립트)는 직접 실행해보고 결과 정리 `requests.http`의 항목별 테스트는 과제 요구사항과 다시 비교 대조 해보고 관련 내용 주석 정리.
- 상세 활용 기록: [보고서](docs/report.pdf)의 AI 활용 기록 부분
- 참고한 수업 자료·외부 코드·공식 문서:
  - 수업 예제 `jwt-basic/auth.mjs` (토큰 발급·Bearer 읽기·검증 구조) → `backend/src/auth.js`
  - 수업 예제 `jwt-basic/public/app.js` (메모리 토큰 보관, Authorization 헤더 첨부) → `frontend/src/api.js`
  - 과제 제공 시작 코드(Vue, Express)와 `tools/check_api.py`
  - jsonwebtoken 문서: https://github.com/auth0/node-jsonwebtoken
  - RFC 7519 (JSON Web Token): https://www.rfc-editor.org/rfc/rfc7519
  - RFC 6750 (Bearer Token, WWW-Authenticate): https://www.rfc-editor.org/rfc/rfc6750

## 제출 확인

- [x] README의 안내 문구를 실제 내용으로 교체했다.
- [x] 새 폴더에 clone하여 README만으로 설치·환경설정·빌드·로컬 실행했다.
- [x] 4173번 빌드 화면에서 API 연결과 전체 필수 기능을 확인했다.
- [ ] GitHub에서 보고서와 증거 링크가 열린다.
- [ ] 교수자가 저장소를 열람·복제할 수 있다.
- [x] 비밀 키·실제 토큰·DB·node_modules·.venv·target을 커밋하지 않았다.
- [ ] 최종 push 후 저장소 URL과 제출 기준 커밋 SHA를 LMS에 제출했다.
