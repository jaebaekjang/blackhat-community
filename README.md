# 검은 모자 라디오국 — 커뮤니티 플랫폼 & 어드민

검은 모자 공포라디오 기반 공포 커뮤니티 플랫폼 + 관리자 페이지 프로토타입.
**서버/DB 없이** localStorage 기반 mock DB 로 작동하며, 실제 DB 이전이 가능한 구조로 설계되었습니다.

> 시청자는 단순 소비자가 아니라 **심야 청취자**, **제보자**, **기록자**, **해석자**, **칠죄빌라 입주자**가 됩니다.

---

## 빠른 시작

```bash
npm install
cp .env.example .env.local   # (선택) YOUTUBE_CHANNEL_ID 등 설정
npm run dev                  # http://localhost:3000
# 또는
npm run build && npm start
```

> 환경 변수 없이도 즉시 동작합니다. (외부 API 실패 시 mock 으로 fallback)

### 관리자실 진입

관리자 페이지(`/admin/*`)는 `blackhat_admin_mode === true` 일 때만 접근 가능합니다.

- **내 기록실(`/profile`) → 설정 → 관리자 모드 토글** 을 켜거나
- `/admin` 접근 시 나오는 접근 제한 페이지에서 **"관리자 모드 활성화 (프로토타입)"** 버튼 클릭

---

## 기술 스택

- Next.js 14 (App Router) · TypeScript · React 18
- Tailwind CSS (다크 테마 / 붉은 포인트)
- localStorage 기반 mock persistence (서버/DB 불필요)
- YouTube RSS 연동 (API Route) + mock fallback

---

## 폴더 구조

```text
app/
  (community)/              # 일반 사용자 화면 (좌측 사이드바 + 모바일 하단 탭)
    page.tsx                # 홈 (오늘의 심야 기록 / 최신 영상 / 인기 사건 …)
    submit/                 # 검은 제보함 (제보 → 제보+사건파일 동시 생성)
    cases/ , cases/[id]/    # 사건파일 목록 / 상세 + 댓글
    radio/ map/ forbidden/  # 심야라디오 / 공포지도 / 금지구역(칠죄빌라·나폴리탄)
    writers/ membership/ shop/ profile/
  admin/                    # 라디오국 관리자실 (사이드바 + 상태바, 접근 제어)
    page.tsx                # 대시보드
    submissions/ cases/ content-pipeline/ radio/ users/ memberships/
    forbidden-zone/ writers/ reports/ notices/ shop/ analytics/ settings/
  api/youtube/latest/route.ts   # YouTube 최신 영상 RSS → mock fallback
components/
  ui/                       # Button, Card, Badge, StatusBadge, Modal, Toast, Field …
  community/                # CommunityShell, CaseCard, YouTubeSection, CommentSection …
  admin/                    # AdminShell, AdminPage(Header), DataTable
hooks/useStorage.ts         # localStorage 반응형 hook (useCollection / useStorageValue …)
lib/
  storage.ts                # ⭐ mock DB 핵심 (get/set/CRUD/export/import/reset)
  youtube.ts                # RSS 파싱 + fetchLatestVideos (확장 지점)
  constants.ts              # STORAGE_KEYS, 메뉴, 포인트 규칙, 기본 채널 ID
  utils.ts labels.ts risk.ts
types/                      # 타입 분리 (enums / models / youtube)
data/                       # mock 데이터 분리 (컴포넌트 내 하드코딩 금지)
docs/database-schema.md     # ⭐ DB 이전 가이드 (테이블/컬럼/관계/매핑)
public/database-schema.md   # 관리자실 "DB 이전 문서 열기" 링크용 사본
```

---

## DB 이전 가능 구조 (핵심 원칙)

1. **타입 분리** — 모든 모델은 `types/`. 모든 주요 모델에 `id/createdAt/updatedAt` 포함.
2. **Mock 데이터 분리** — 모든 초기 데이터는 `data/`. 컴포넌트 내부 하드코딩 없음.
3. **localStorage 로직 분리** — 접근은 오직 `lib/storage.ts` 경유.
   `getData / setData / initializeMockData / resetMockData / exportAllData / importAllData / createItem / updateItem / softDeleteItem`
4. **DB 문서화** — `docs/database-schema.md` 에 테이블·컬럼·관계·enum·**localStorage↔테이블 매핑**·Supabase 이전 참고 정리.
5. **Export / Import** — 관리자실 → 설정에서 전체 데이터 JSON Export / Import / 초기화.

### localStorage 키

`blackhat_users, blackhat_cases, blackhat_submissions, blackhat_comments, blackhat_badges, blackhat_user_badges, blackhat_memberships, blackhat_radio_rooms, blackhat_forbidden_zone, blackhat_writer_works, blackhat_products, blackhat_admin_notes, blackhat_reports, blackhat_notices, blackhat_settings, blackhat_admin_mode, blackhat_current_user, blackhat_content_pipeline_items, blackhat_youtube_settings, blackhat_youtube_videos`

---

## YouTube 최신 영상 연동

- 홈 화면 **"검은 모자의 최신 영상"** 섹션이 채널 `UCSF-jV2STm5g66JlHBh6MWg` 의 최신 영상을 표시.
- 흐름: 클라이언트 → `/api/youtube/latest` → 서버에서 RSS fetch → 실패 시 **mock 6개로 fallback** (배지로 `RSS 연동`/`mock 영상` 표시).
- 관리자실 → 설정에서 채널 ID / 표시 개수 / 갱신 주기 / 캐시 초기화 / "지금 최신 영상 불러오기" 제어.
- 확장: `lib/youtube.ts` 의 `fetchLatestVideos()` 한 곳만 교체하면 YouTube Data API 로 전환 가능.

---

## 아직 mock 인 부분 (실서비스 시 교체 대상)

- **인증/권한**: `blackhat_admin_mode` / `blackhat_current_user` (→ 실제 로그인·세션·RLS)
- **결제**: 멤버십/상점 구매는 toast 만 표시하는 mock 결제
- **YouTube**: 기본은 RSS, 실패 시 mock. API Key 연동은 미구현(구조만 분리)
- **실시간 기능**: 심야라디오 채팅·카운트다운·투표는 클라이언트 mock
- **공포지도**: 정확한 지도/주소 API 미사용 — 지역·장소 유형 카드 UI (의도적)
- **콘텐츠 자동 생성**: 파이프라인의 제목/썸네일/후킹 생성은 규칙 기반 mock
- **개인정보 위험 감지**: 키워드/정규식 기반 간이 감지 (→ 실서비스는 서버 검수)
- **통계**: 일부 지표(전환율/재방문율 등)는 mock 값

---

## 주요 동작 확인

- 홈/최신 영상/제보/사건파일/상세/댓글/반응 버튼
- 멤버십 mock 선택, 상점 mock 구매, 내 기록실 + 관리자 모드 토글
- 관리자 대시보드, 제보·사건파일 상태 변경, 콘텐츠 파이프라인 칸반 + 메모 저장
- 설정에서 데이터 Export / Import / 초기화, YouTube 설정
- 모바일 반응형(하단 탭바/드로어), 다크 테마, 상태 배지(위험=붉은색)
