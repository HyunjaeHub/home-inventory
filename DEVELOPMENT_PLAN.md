# 집 재고관리 앱 개발 플랜

> 기준: 「집 재고관리 화면 시안」 아티팩트(11개 보드) + Expo 시작 가이드
> 환경: Windows PC + 아이폰 (맥 없음) · 사용자: 부부 2명이 한 가구를 공유

---

## 0. 한눈에 보기

| 항목      | 결정                                                                        |
| --------- | --------------------------------------------------------------------------- |
| 앱        | Expo (React Native, TypeScript) + Expo Router                               |
| 상태      | Zustand(UI 상태) + TanStack Query(서버 데이터)                              |
| 백엔드    | Supabase (Postgres, Auth, Realtime, Edge Functions)                         |
| 웹        | `expo export --platform web` → Vercel                                       |
| iOS       | EAS Build (클라우드, 맥 불필요) → TestFlight → App Store                    |
| 개발 방식 | **UI + 도메인 로직을 로컬 시드 데이터로 먼저 완성 → 그 뒤 Supabase로 교체** |

핵심 원칙: 시안의 `Main.dc.html`에 이미 검증된 도메인 로직(먹기/해동/소분/기한 계산 등)이 들어 있으니, 이를 **순수 TypeScript 모듈로 먼저 옮기고 테스트**한 뒤 화면과 서버를 얹는다.

---

## 1. 시안에서 읽어낸 기능 범위

### 화면 (하단 탭 5개: 홈 · 재고 · 한끼 · 장보기 · 설정)

1. **홈(오늘 할 일)** — 이번 주 기한 임박 품목, 같이 할 일(체크리스트), 인박스(상대가 추가한 항목 확인)
2. **재고 목록** — 보관 장소별 그룹(냉장·냉동·실온·생활), 필터/검색/정렬, 접기
3. **품목 상세(식품)** — 로트별(구매일·기한·수량·장소) 목록, 먹음/해동/냉동 이동, 기록(log)
4. **품목 상세(소모품)** — 수량, 사용 주기(every N일), 예상 소진일 배지, 사용/구매 버튼
5. **장보기** — 살 것/산 것 탭, 체크, 추가한 사람(by), 완료 시 재고로 반영
6. **빠른 추가** — 이름 입력 → 단위 추정(`unitGuess`) → 장소/수량/기한, 대량(g/ml)은 **소분(팩 나누기)**
7. **다음 한끼** — 재고에서 재료를 골라 식사 계획, 완료 시 수량 차감
8. **설정** — A/B/C/D 4개 시안 (아래 "결정 필요" 참고)

### 핵심 도메인 규칙 (시안 코드에서 추출)

- **품목(item)**: `kind`(food/cons), 기본 장소, 단위, `noExp`(기한 없음 — 대파·양파·감자)
- **로트(lot)**: 식품은 같은 품목이라도 구매 건별로 기한이 달라 **로트 단위로 관리**. 기한이 가까운 로트부터 소진(FEFO)
- **대량 단위(g/ml)**: 한 번에 로트 전체를 소진. 소분 시 `size × qty팩`
- **해동/냉동 이동**: 냉동→냉장 시 기한을 최대 2일로 단축, 냉장→냉동 시 최소 30일로 연장
- **기한 배지**: D-day / D-n / n일 지남 / 기한 없음은 "n일째"(14일↑ 주의색)
- **소모품 소진 예측**: `남은 수량 × 사용주기` → "이번 주 / n월 n일쯤 / n월 중"
- **기록(log)**: 모든 변경에 "무엇을 · 누가 · 언제" 남김 (2인 공유의 신뢰 근거)
- **살 것 연동**: 다 먹으면/떨어지면 장보기 제안, 이미 담긴 건 중복 방지

### 설정(우리 집 규칙) 값 — 서버 저장 대상

기한 임박 기준(1/3/5/7일) · 소분 팩 냉장 기한(1/2/3일) · 냉동 시 연장(2주/한 달/두 달) · 야채 관리 방식 · 소모품 경고 시점 · 사용 속도 계산 기준 · 장본 것 처리 방식 · 알림 대상/시간 · 보관 장소 · 같이 할 일 · 백업/가져오기 · 전체 삭제

---

## 2. 개발 단계

각 단계 끝에 **"완료 기준"**을 두었다. 위에서 아래로 진행하고, 앞 단계가 끝나기 전에 다음으로 넘어가지 않는다.

### Phase 0 — 환경 준비 (0.5일)

- [x] 설치: Node.js LTS(v26.13.0), Git(2.49.0) (편집기는 **Cursor** — Expo Tools / ESLint / Prettier 설치 완료)
- [x] 폰: Expo Go 최신판 설치 (SDK 버전 불일치 시 QR이 안 열림)
- [x] 가입: GitHub, **Expo(expo.dev) — Expo Go 접속에도 로그인이 필요해서 지금 가입함**
- [ ] 가입: Supabase (Phase 4 전), Vercel (Phase 9 전)
- [x] 저장소: https://github.com/HyunjaeHub/home-inventory.git → `C:\Git_Project\home-inventory`에 clone, Cursor로 열기
- [ ] (선택) 프로젝트 루트에 `.cursor/rules` 또는 `CLAUDE.md`로 코딩 규칙·폴더 구조 기록
- ✅ 완료 기준: `node -v`, `git --version` 정상, 각 계정 로그인 확인

#### Windows에서 겪은 문제와 해결

| 증상                                                              | 원인                                                        | 해결                                                                                                |
| ----------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `npx : 이 시스템에서 스크립트를 실행할 수 없으므로…`              | PowerShell 실행 정책이 `npx.ps1` 차단                       | `npx.cmd`, `npm.cmd`로 실행. 또는 직접 `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`        |
| QR로 열면 `You need to be signed in to Expo Go and Expo CLI`      | 최신 Expo Go는 PC·폰 모두 로그인 필요                       | PC `npx.cmd expo login`, 폰 Expo Go 앱 로그인 (같은 계정)                                           |
| `expo login` 시 `cmd.exe /c start … exited with non-zero code: 1` | 윈도우에서 브라우저 로그인 주소의 `&` 처리 버그 → 콜백 실패 | `npx.cmd expo login --no-browser` (아이디·비밀번호 입력)                                            |
| `--no-browser` 로그인 시 비밀번호 틀림                            | Google로 가입하면 Expo 비밀번호가 없음                      | expo.dev에서 비밀번호 설정(Forgot password) 후 로그인. 또는 Access token을 `$env:EXPO_TOKEN`에 설정 |
| 로그인 확인                                                       | —                                                           | `npx.cmd expo whoami`                                                                               |

### Phase 1 — 프로젝트 골격 (0.5~1일)

- [x] Expo SDK 58 프로젝트 생성 (기본 템플릿, Expo Router, 라우트 루트는 `src/app`)
  - 저장소에 `README.md`가 있어 임시 폴더에 생성 후 옮김 (템플릿의 `.git`, `README.md`, `LICENSE`는 제외)
  - `app.json`: 이름 "집 재고관리", slug `home-inventory`, scheme `homeinventory`, 웹 출력 `static`(Vercel 정적 배포용)
- [x] `npx.cmd expo start` → 아이폰 Expo Go로 QR 접속 확인 ("Welcome to Expo" 화면)
- [x] 템플릿 예제 정리 (예제 화면·컴포넌트·이미지, `scripts/reset-project.js` 삭제)
- [x] 패키지 설치 (Expo 패키지는 반드시 `npx expo install`)
  ```bash
  npx.cmd expo install @supabase/supabase-js @react-native-async-storage/async-storage expo-secure-store react-native-svg @expo-google-fonts/jua
  npm.cmd install @tanstack/react-query zustand
  npm.cmd install -D prettier
  ```
- [x] 폴더 구조: `src/app/(tabs)`, `src/components`, `src/theme`, `src/lib`
- [x] ESLint(`npx.cmd expo lint`로 자동 설정) / Prettier(`.prettierrc`), TypeScript strict, 경로 별칭(`@/`)
  - 스크립트: `npm run lint`, `npm run typecheck`, `npm run format`
- [x] 디자인 토큰 추출 → `src/theme/index.ts` (색, 배지 톤 4세트, 둥근 정도, 간격, 글자 크기)
  - 제목 폰트는 **Jua**(`@expo-google-fonts/jua`), 본문은 시스템 폰트 — Noto Sans KR은 용량이 커서 보류
  - 라이트 모드 고정 (`app.json` `userInterfaceStyle: light`) — 시안에 다크 모드 없음
- [x] 하단 탭 5개 + 빈 화면 라우팅
  - 시안과 같은 모양을 위해 NativeTabs 대신 **JS Tabs + 직접 만든 탭 바**(`src/components/app-tab-bar.tsx`), 아이콘은 시안 SVG 그대로(`react-native-svg`)
  - 탭 바에 배지 표시 지원 (`tabBarBadge` — 한끼는 초록, 장보기는 파랑)
- [x] TanStack Query `QueryClientProvider` 연결
- ✅ 완료 기준: 폰에서 탭 5개가 보이고 저장 시 핫리로드됨

### Phase 2 — 도메인 로직 이식 + 테스트 (1~2일) ⭐ 가장 중요

시안 `Main.dc.html`의 로직을 UI와 분리해 `src/domain/`에 순수 함수로 이식.

- [x] 타입(`types.ts`): `Item`(식품/소모품), `Lot`, `LogEntry`, `ShopItem`, `InboxItem`, `MealEntry`, `Task`, `Rules`(우리 집 규칙 기본값)
- [x] 날짜(`date.ts`): `todayIso`, `daysBetween`, `addDays`, `monthDay` — 기준일을 인자로 받아 테스트 가능
- [x] 로트(`lots.ts`): `lotsOf`(기한 가까운 순), `lotText`, `totalText`, 부분 팩 분리
- [x] 배지(`badges.ts`): `dBadge`, `foodSummary`, `consDays`, `consBadge`
- [x] 재고 연산(`stock.ts`): `eat`, `moveLot`(해동/냉동), `adjustExp`, `useOne`, `buyOne`, `setLotQty`, `splitLot`
- [x] 빠른 추가(`add.ts`): `unitGuess`, `defaultExpDays`, `prefillFor`, `addStock`(소분 포함), `storeInboxItem`
- [x] 장보기(`shopping.ts`), 다음 한끼(`meal.ts`), 홈 요약(`home.ts`)
- [x] 시안 시드 데이터(`seed.ts`, 기준일 2026-10-23)
- [x] 단위 테스트(Jest, `npm test`): 37개 — 소분, 해동 시 기한 단축, 로트 소진 순서, 배지 경계값, 한끼 차감 등
- 설계 원칙
  - 모든 함수는 **원본을 바꾸지 않고** 새 데이터와 토스트 문구(`{ next, message }`)를 돌려준다. 할 일이 없으면 `null`
  - 오늘 날짜·행동한 사람·ID 생성·규칙은 `Ctx`로 넘긴다 → 나중에 Supabase(uuid, 로그인 사용자)로 그대로 교체
  - 기록(log)은 `{ text, by, date }`로 구조화 (시안은 "1개 먹음 · 나" 문자열)
  - 시안과 다른 점: 정리할 것 중 '생활' 장소의 새 품목은 식품이 아닌 소모품으로 넣는다
- ✅ 완료 기준: 시안 시드 데이터로 시나리오 테스트 통과

### Phase 3 — 로컬 데이터로 화면 구현 (4~6일)

Supabase 없이 Zustand + 시드 데이터(시안 `seed()`)로 전 화면 구현. 화면 순서는 **의존이 적은 것부터**:

1. [x] **재고 목록** — 장소 필터·개수, 검색, 장소별 접기, 급한 순 정렬, 한끼 담기 토글
2. [x] **품목 상세 — 식품** — 요약(남은 양·가장 급한 것·장소별), 로트별 먹음, 한끼로/양 고치기/나누기/해동·옮기기, 정렬, 기록
3. [x] **품목 상세 — 소모품** — 남은 일수 막대, 1개 썼어요/샀어요, 사용 기록
4. [x] **빠른 추가** — 이름으로 단위 추정(예전 기록·사전), 종류·장소·단위·양, 소분(팩 눌러 냉장↔냉동), 유통기한(바로가기·달력), 저장 후 상세로 이동
5. [x] **장보기** — 살 것 목록(추가·체크·빼기), 곧 떨어질 소모품 추천, 장보기 완료 → 정리할 것, 정리할 것 '그대로'(기본값으로 바로 넣기)·'정리'(빠른 추가 화면으로)
6. [x] **홈** — 이번 주 기한 띠(2주+·오늘~6일, 칸 눌러 목록), 확인할 것·다음 한끼 카드, 같이 할 일(추가·체크·완료 지우기), 곧 떨어지는 생활용품
7. [ ] **다음 한끼**
8. [ ] **설정** — 시안 **A(기본형)**로 확정

- [x] 공통: 토스트, 바텀시트(양 고치기·나누기), 수량 조절, 배지, 아이콘, 빈 상태
- [ ] 공통: 로딩/에러 상태 (서버 연동 때)
- 상태 관리: `src/stores/home-store.ts`(Zustand) — 도메인 함수를 감싼 액션 + 토스트. 시드 데이터 기준일(2026-10-23)로 날짜 고정
- ✅ 완료 기준: 시안의 모든 인터랙션이 폰에서 동일하게 동작 (데이터는 앱 재시작 시 초기화돼도 OK)

### Phase 4 — Supabase 연동: 스키마 & 인증 (2~3일)

- [ ] Supabase 프로젝트 생성, 환경변수는 `EXPO_PUBLIC_SUPABASE_URL` / `..._ANON_KEY` (`.env`는 git 제외)
- [ ] 테이블 설계 (초안)
  | 테이블               | 주요 컬럼                                                                  |
  | -------------------- | -------------------------------------------------------------------------- |
  | `households`         | id, name                                                                   |
  | `household_members`  | household_id, user_id, display_name(나/남편)                               |
  | `items`              | id, household_id, name, kind, place, unit, no_exp, every_days, qty(소모품) |
  | `lots`               | id, item_id, place, qty, unit, size, exp, bought_on, bought_by             |
  | `item_logs`          | id, item_id, text, actor, created_at                                       |
  | `shop_items`         | id, household_id, name, place, added_by, checked                           |
  | `inbox_items`        | id, household_id, name, place, added_by, day                               |
  | `meal_entries`       | id, household_id, item_id, lot_id, qty, checked                            |
  | `tasks`              | id, household_id, text, done                                               |
  | `household_settings` | household_id, jsonb(규칙 값)                                               |
- [ ] **RLS 필수**: 모든 테이블 `household_id`가 내가 속한 가구일 때만 read/write
- [ ] 인증: 이메일 매직링크 또는 이메일+비밀번호 → 세션은 `expo-secure-store`에 저장
- [ ] 가구 생성 + **초대 링크/코드로 배우자 합류** (설정 화면의 "초대 링크로 남편 폰 연결")
- ✅ 완료 기준: 두 계정이 같은 가구에 속하고, 다른 가구 데이터는 조회 불가(RLS 테스트)

### Phase 5 — 데이터 계층 교체 (2~3일)

- [ ] Phase 2 도메인 함수는 유지, 저장소만 Zustand → Supabase(TanStack Query)로 교체
- [ ] 변경 작업은 **낙관적 업데이트** + 실패 시 롤백 (토스트 문구 유지)
- [ ] 다중 행 변경(소분, 해동 시 로트 분리)은 **Postgres 함수(RPC)** 로 트랜잭션 처리
- [ ] 기존 로컬 시드를 "샘플 데이터 채우기" 개발용 스크립트로 이동
- ✅ 완료 기준: 앱 재시작해도 데이터 유지, 모든 화면이 서버 데이터로 동작

### Phase 6 — 실시간 동기화 (1~2일)

- [ ] Supabase Realtime 구독(가구 단위) → Query 캐시 무효화
- [ ] 두 대의 폰으로 동시 수정 테스트 (같은 로트 동시 차감 등 충돌 케이스)
- [ ] 오프라인 시 읽기 가능(Query 캐시 영속화), 쓰기는 일단 "오프라인입니다" 안내 → 이후 큐잉 검토
- ✅ 완료 기준: 한 폰에서 "먹음" 누르면 다른 폰에 수 초 내 반영

### Phase 7 — 알림 (2~3일)

- [ ] 알림 종류: 기한 임박(설정의 n일 전), 소모품 소진 임박, 상대가 인박스에 추가
- [ ] 방식 결정: ① 기기 로컬 예약 알림(간단) vs ② 서버 푸시(Edge Function + 스케줄) — 설정의 "누구에게/몇 시에"를 지키려면 ②가 필요
- [ ] `npx expo install expo-notifications`, 푸시 토큰을 `household_members`에 저장
- ⚠️ **푸시 테스트는 Expo Go 제약이 있을 수 있어 Development Build(EAS)가 필요할 수 있음** — 이 시점에 첫 EAS 빌드 진행
- ✅ 완료 기준: 설정한 시간에 지정한 사람에게만 알림 도착

### Phase 8 — 마감 & QA (2~3일)

- [ ] 접근성(터치 영역 44px↑, 대비), 큰 글씨 설정 대응
- [ ] 빈 상태/에러/로딩 정비, 키보드·바텀시트 동작(iOS 안전영역)
- [ ] 백업·가져오기(JSON), 전체 삭제(확인 절차 2단계)
- [ ] 성능: 재고 수백 건 목록(FlatList/FlashList)
- [ ] 실사용 2주 (부부 둘이 실제 사용하며 피드백 수집)

### Phase 9 — 배포

- [ ] **웹**: `npx expo export --platform web` → `dist`를 Vercel 배포 (환경변수 Vercel에도 등록)
- [ ] **iOS**: `npm i -g eas-cli` → `eas login` → `eas build:configure` → `eas build --platform ios`
- [ ] Apple Developer Program 가입($99/년) → TestFlight로 부부 폰 설치 → (선택) App Store 제출
- [ ] 개인용이면 TestFlight만으로도 충분 (App Store 심사 생략 가능)

---

## 3. 일정 감각 (1인 개발, 주 15~20시간 가정)

| 마일스톤                 | 포함      | 대략                    |
| ------------------------ | --------- | ----------------------- |
| **M1 로컬 앱 동작**      | Phase 0~3 | 2~3주                   |
| **M2 둘이 같이 쓰는 앱** | Phase 4~6 | 1.5~2주                 |
| **M3 알림 + 마감**       | Phase 7~8 | 1.5주                   |
| **M4 배포**              | Phase 9   | 3~5일 (Apple 심사 제외) |

> M1 시점에서 이미 혼자 써볼 수 있고, M2부터 부부가 함께 쓸 수 있다. **M2를 첫 목표로 잡는 것을 추천**.

---

## 4. 권장 폴더 구조

```
home-inventory/            # GitHub 저장소 루트
├─ src/app/                  # Expo Router (SDK 58 템플릿 기준 src 아래)
│  ├─ (tabs)/
│  │  ├─ index.tsx           # 홈
│  │  ├─ stock.tsx           # 재고
│  │  ├─ meal.tsx            # 한끼
│  │  ├─ shopping.tsx        # 장보기
│  │  └─ settings.tsx        # 설정
│  ├─ item/[id].tsx          # 품목 상세 (kind로 식품/소모품 분기)
│  ├─ add.tsx                # 빠른 추가 (모달)
│  └─ _layout.tsx
├─ src/
│  ├─ domain/                # 순수 로직 + 테스트 (UI/서버 의존 없음)
│  ├─ features/              # stock, shopping, meal, settings 별 컴포넌트·훅
│  ├─ components/            # 공통 UI (Badge, LotRow, Sheet, Toast ...)
│  ├─ lib/                   # supabase client, query client
│  ├─ stores/                # zustand
│  └─ theme/                 # 색·타이포·간격
├─ supabase/
│  ├─ migrations/            # SQL 스키마 + RLS
│  └─ functions/             # Edge Functions (알림)
└─ DEVELOPMENT_PLAN.md
```

---

## 5. 시작 전 결정이 필요한 것

1. ~~**설정 화면 시안 선택**~~ — ✅ **A(기본형)**로 확정 (B·C·D 시안은 삭제)
2. **로그인 방식** — 이메일 매직링크 vs 비밀번호 vs Apple/Google 로그인(Apple 로그인은 App Store 정식 출시 시 요구될 수 있음)
3. **알림 방식** — 로컬 예약 vs 서버 푸시 (Phase 7 진입 시 결정)
4. **소모품 구매 단위** — 시안은 개수 기반. 용량(ml) 기반 관리는 v2로 미룰지
5. **배포 범위** — TestFlight(부부 전용)로 끝낼지, 정식 출시까지 갈지

## 6. 리스크 / 주의

- **Expo Go 버전**: 앱 SDK와 Expo Go가 어긋나면 열리지 않음 → 항상 `@latest` + 앱 최신화
- **RLS 누락**: 가구 간 데이터 노출 방지의 핵심. 테이블 추가할 때마다 정책 같이 작성
- **날짜/타임존**: 시안은 오늘이 고정(2026-10-23). 실제는 기기 로컬 날짜 기준 `YYYY-MM-DD` 문자열로 통일해 타임존 버그 방지
- **동시 수정 충돌**: 두 사람이 같은 로트를 동시에 차감 → RPC에서 `qty = qty - 1 where qty > 0` 식으로 서버가 판정
- **푸시 알림**: Expo Go 한계로 중간에 Development Build 전환 필요할 수 있음
- **Apple 비용/심사**: 개발 중엔 불필요, TestFlight 배포 시점에 $99/년 필요

## 7. Git 규칙

### 커밋 메시지 — Conventional Commits + 한국어

```
<type>(<scope>): <제목>

<본문: 왜 바꿨는지, 필요할 때만>
```

- **제목**: 한국어, 50자 이내, 마침표 없이, "~함/~추가/~수정"처럼 무엇을 했는지
- **type**
  | type       | 언제                                         | 예시                                          |
  | ---------- | -------------------------------------------- | --------------------------------------------- |
  | `feat`     | 새 기능·화면                                 | `feat(stock): 재고 목록 장소별 그룹 추가`     |
  | `fix`      | 버그 수정                                    | `fix(lot): 해동 시 기한이 늘어나는 문제 수정` |
  | `refactor` | 동작 변화 없는 구조 개선                     | `refactor(domain): 로트 정렬 함수 분리`       |
  | `style`    | UI 스타일·디자인 토큰 (포맷팅만이면 `chore`) | `style(theme): 배지 색상 토큰 정리`           |
  | `test`     | 테스트 추가·수정                             | `test(domain): 소분 계산 경계값 테스트`       |
  | `docs`     | 문서                                         | `docs: 개발 플랜에 Windows 이슈 정리`         |
  | `chore`    | 설정·패키지·빌드                             | `chore: Supabase 패키지 설치`                 |
  | `db`       | Supabase 스키마·RLS·마이그레이션             | `db: lots 테이블과 RLS 정책 추가`             |
- **scope**(선택): `stock` `item` `add` `shop` `meal` `home` `settings` `domain` `auth` `db` `theme` `notif`
- 한 커밋에는 한 가지 목적만. 여러 목적이면 커밋을 나눈다

### 브랜치

- `main`: 항상 폰에서 실행되는 상태 유지
- 작업 브랜치: `feat/stock-list`, `fix/thaw-exp`, `chore/setup-supabase` 처럼 `<type>/<짧은-설명>`
- 혼자 개발이므로 PR 없이 머지해도 되지만, Phase 단위로 PR을 만들면 변경 이력 보기가 편하다

### 커밋하지 않을 것

- `.env`(Supabase 키 등), `node_modules/`, `.expo/`, `dist/` — `.gitignore`에 포함

## 8. 다음 액션

1. ~~Phase 0 설치/가입, 저장소 clone, Expo 프로젝트 생성, 폰 QR 확인~~ ✅
2. Phase 1 나머지: 템플릿 예제 정리 → 패키지 설치 → 디자인 토큰 → 하단 탭 5개 골격
3. 시안 `seed()` 데이터와 로직을 `src/domain/`으로 옮기기 (Phase 2)
