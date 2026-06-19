# 검은 모자 라디오국 — 데이터베이스 스키마 & DB 이전 가이드

> 이 문서는 프로토타입의 **localStorage 기반 mock DB** 를 실제 DB(예: Supabase/PostgreSQL)로
> 이전할 때 기준이 되는 문서입니다. 개발 업체가 이 문서만 보고도 테이블을 설계할 수 있도록 작성되었습니다.

---

## 0. 개요

- 프로토타입은 서버/DB 없이 **브라우저 localStorage** 에 모든 데이터를 저장합니다.
- 각 컬렉션은 `blackhat_*` 키에 **JSON 배열**(또는 단일 객체)로 저장됩니다.
- 모든 localStorage 접근은 `lib/storage.ts` 한 곳에서만 이루어집니다. (컴포넌트 직접 접근 금지)
- 모든 타입 정의는 `types/` 폴더에 있으며, 실제 컬럼명은 이 문서의 snake_case 를 따릅니다.
  (코드에서는 camelCase, DB 에서는 snake_case — 매핑 표 참고)
- 모든 주요 테이블은 `id`, `created_at`, `updated_at` 을 가집니다.
- 삭제는 물리 삭제 대신 `deleted_at`(soft delete) 사용을 권장합니다. (프로토타입의 `softDeleteItem` 과 대응)

### 코드 ↔ DB 네이밍 규칙

| 코드(TypeScript) | DB(PostgreSQL) |
|---|---|
| `camelCase` (예: `caseFileId`) | `snake_case` (예: `case_file_id`) |
| `string` (ISO8601) 시각 | `timestamptz` |
| `string[]` | `text[]` 또는 별도 조인 테이블 |
| union 문자열 (예: 상태) | `text` + `CHECK` 제약 또는 `enum` 타입 |

---

## 1. localStorage 키 ↔ DB 테이블 매핑

| localStorage Key | Export 키(JSON) | DB 테이블 | 형태 |
|---|---|---|---|
| `blackhat_users` | `users` | `users` | 배열 |
| `blackhat_submissions` | `submissions` | `submissions` | 배열 |
| `blackhat_cases` | `caseFiles` | `case_files` | 배열 |
| `blackhat_comments` | `comments` | `comments` | 배열 |
| `blackhat_badges` | `badges` | `badges` | 배열 |
| `blackhat_user_badges` | `userBadges` | `user_badges` | 배열 |
| `blackhat_memberships` | `memberships` | `membership_tiers` | 배열 |
| `blackhat_radio_rooms` | `radioRooms` | `radio_rooms` | 배열 |
| `blackhat_forbidden_zone` | `forbiddenZoneItems` | `forbidden_zone_items` | 배열 |
| `blackhat_writer_works` | `writerWorks` | `writer_works` | 배열 |
| `blackhat_products` | `products` | `products` | 배열 |
| `blackhat_admin_notes` | `adminNotes` | `admin_notes` | 배열 |
| `blackhat_reports` | `reports` | `reports` | 배열 |
| `blackhat_notices` | `notices` | `notices` | 배열 |
| `blackhat_content_pipeline_items` | `contentPipelineItems` | `content_pipeline_items` | 배열 |
| `blackhat_youtube_videos` | `youtubeVideos` | `youtube_videos` | 배열 |
| `blackhat_settings` | `settings` | `settings` | 단일 객체(1 row) |
| `blackhat_youtube_settings` | `youtubeSettings` | `settings`(병합 가능) | 단일 객체 |
| `blackhat_admin_mode` | — | (세션/권한으로 대체) | boolean |
| `blackhat_current_user` | — | (인증 세션으로 대체) | string(user id) |

> `blackhat_admin_mode` / `blackhat_current_user` 는 DB 테이블이 아니라 **인증/세션**으로 대체됩니다.
> 실제 서비스에서는 로그인 사용자 = `current_user`, 관리자 권한 = `users.role in ('admin','moderator')` 로 판단합니다.

---

## 2. 테이블 정의

표기: `PK` 기본키, `FK` 외래키, `NN` NOT NULL.

### users
| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | uuid / text | PK |
| nickname | text | NN |
| email | text | NN, unique |
| role | text | `user` \| `moderator` \| `admin` |
| grade | text | 등급 enum (아래 참고) |
| level | int | 레벨 |
| membership_tier_id | text | FK → membership_tiers.id (nullable) |
| points | int | 검은표식 |
| status | text | `active` \| `warned` \| `restricted` \| `banned` |
| submission_count | int | 통계 캐시 |
| comment_count | int | 통계 캐시 |
| broadcast_adopted_count | int | 통계 캐시 |
| reported_count | int | 통계 캐시 |
| saved_case_count | int | 통계 캐시 |
| last_active_at | timestamptz | |
| warning_count | int | |
| created_at / updated_at | timestamptz | |

### submissions
| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | uuid/text | PK |
| title | text | NN |
| category | text | 카테고리 enum |
| story_type | text | 사건 유형 enum |
| location_type | text | 장소 유형 enum |
| region | text | 지역 enum |
| content | text | NN |
| author_id | text | FK → users.id (nullable, 익명) |
| author_name | text | |
| is_anonymous | bool | |
| fear_level | text | 공포 정도 enum |
| broadcast_wish | text | 방송 희망 enum |
| broadcast_consent | bool | 방송 사용 동의 |
| edit_consent | bool | 각색 가능 동의 |
| privacy_consent | bool | 개인정보 제외 동의 |
| status | text | 제보 상태 enum |
| risk_level | text | `낮음` \| `주의` \| `높음` |
| detected_risk_keywords | text[] | 위험 키워드 감지 결과 |
| case_file_id | text | FK → case_files.id (1:1) |
| admin_memo | text | nullable (검수 메모) |
| reject_reason | text | nullable |
| follow_up_question | text | nullable |
| created_at / updated_at | timestamptz | |

### case_files
| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | uuid/text | PK |
| submission_id | text | FK → submissions.id (nullable) |
| case_number | text | `GM-YYYY-0001` 형식, unique |
| title | text | NN |
| category | text | 카테고리 enum |
| story_type | text | 사건 유형 enum |
| location_type | text | 장소 유형 enum |
| region | text | 지역 enum |
| content | text | |
| author_id | text | FK → users.id (nullable) |
| author_name | text | |
| is_anonymous | bool | |
| status | text | 사건 상태 enum |
| fear_score | int | 0–100 |
| realism_score | int | 0–100 |
| unease_score | int | 0–100 |
| broadcast_request_count | int | |
| chills_count | int | |
| save_count | int | |
| related_video_url | text | nullable |
| tags | text[] | |
| is_public | bool | |
| is_locked | bool | |
| created_at / updated_at | timestamptz | |

### comments
| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | uuid/text | PK |
| case_file_id | text | FK → case_files.id, NN |
| user_id | text | FK → users.id (nullable) |
| author_name | text | |
| type | text | 댓글 타입 enum |
| content | text | NN |
| likes | int | |
| is_best | bool | 베스트 해석 |
| created_at / updated_at | timestamptz | |

### badges
| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | text | PK |
| name | text | |
| description | text | |
| icon | text | 이모지/아이콘 키 |
| condition | text | 획득 조건 |
| created_at / updated_at | timestamptz | |

### user_badges (다대다 조인)
| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | text | PK |
| user_id | text | FK → users.id |
| badge_id | text | FK → badges.id |
| earned_at | timestamptz | |
| created_at / updated_at | timestamptz | |

> 유니크 제약 권장: `UNIQUE(user_id, badge_id)`

### membership_tiers
| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | text | PK |
| name | text | 멤버십 등급 enum |
| price | int | 월 가격(원), 0=무료 |
| description | text | |
| benefits | text[] | 혜택 목록 |
| access_level | int | 높을수록 상위 |
| subscriber_count | int | 통계(또는 뷰로 대체) |
| created_at / updated_at | timestamptz | |

### radio_rooms
| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | text | PK |
| title | text | |
| case_file_id | text | FK → case_files.id (nullable) |
| scheduled_at | timestamptz | |
| status | text | 방송 상태 enum |
| youtube_url | text | nullable |
| participant_count | int | |
| poll_question | text | nullable |
| created_at / updated_at | timestamptz | |

### forbidden_zone_items
| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | text | PK |
| type | text | 금지구역 유형 enum |
| title | text | |
| content | text | |
| required_level | int | 열람 필요 레벨 |
| is_locked | bool | |
| is_public | bool | |
| related_case_file_id | text | FK → case_files.id (nullable) |
| room_number | text | 칠죄빌라 호실 (nullable) |
| sin | text | 죄악 (nullable) |
| resident_name | text | nullable |
| official_lore | text | nullable |
| user_speculation | text | nullable |
| next_reveal_at | timestamptz | nullable |
| created_at / updated_at | timestamptz | |

### writer_works
| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | text | PK |
| title | text | |
| author_id | text | FK → users.id (nullable) |
| author_name | text | |
| author_grade | text | 작가 등급 enum |
| genre | text | |
| content | text | |
| fear_score | int | |
| recommendation_count | int | |
| status | text | 작품 상태 enum |
| created_at / updated_at | timestamptz | |

### products
| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | text | PK |
| name | text | |
| price | int | 원 |
| category | text | 상품 유형 enum |
| description | text | |
| is_member_only | bool | |
| is_sold_out | bool | |
| purchase_count | int | mock 통계 |
| created_at / updated_at | timestamptz | |

### admin_notes (콘텐츠 제작 메모)
| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | text | PK |
| target_type | text | `submission` \| `case_file` |
| target_id | text | 대상 id (다형성 FK) |
| youtube_title_1/2/3 | text | 유튜브 제목 후보 |
| thumbnail_copy_1/2/3 | text | 썸네일 문구 후보 |
| hook | text | 도입부 후킹 |
| key_scene | text | 핵심 장면 |
| twist | text | 중간 반전 |
| ending | text | 엔딩 멘트 |
| shorts_point | text | 쇼츠 포인트 |
| community_poll_question | text | 커뮤니티 투표 질문 |
| video_description | text | 영상 설명란 초안 |
| pinned_comment | text | 고정 댓글 초안 |
| tags | text[] | 태그 후보 |
| admin_memo | text | 관리자 메모 |
| created_at / updated_at | timestamptz | |

### reports
| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | text | PK |
| target_type | text | `case_file` \| `comment` \| `user` \| `writer_work` |
| target_id | text | 대상 id (다형성 FK) |
| target_label | text | 표시용 라벨 |
| reporter_id | text | FK → users.id (nullable) |
| reporter_name | text | |
| reason | text | 신고 사유 enum |
| report_count | int | 동일 대상 누적 신고 |
| status | text | 처리 상태 enum |
| admin_memo | text | |
| created_at / updated_at | timestamptz | |

### notices
| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | text | PK |
| title | text | |
| content | text | |
| type | text | 공지 유형 enum |
| visibility | text | 공개 대상 enum |
| is_pinned | bool | |
| scheduled_at | timestamptz | nullable (예약 공개) |
| created_at / updated_at | timestamptz | |

### content_pipeline_items (제작 칸반)
| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | text | PK |
| case_file_id | text | FK → case_files.id, NN |
| case_number | text | 표시 캐시값 |
| title | text | 표시 캐시값 |
| category | text | 표시 캐시값 |
| fear_score | int | 표시 캐시값 |
| broadcast_request_count | int | 표시 캐시값 |
| status | text | 파이프라인 상태 enum |
| priority | text | `낮음` \| `보통` \| `높음` \| `긴급` |
| assignee | text | 담당자 |
| estimated_runtime | text | 예상 러닝타임 |
| due_date | timestamptz | nullable |
| upload_url | text | nullable |
| recording_memo | text | 녹음 메모 |
| editing_memo | text | 편집 메모 |
| created_at / updated_at | timestamptz | |

> 상세 크리에이티브 필드(제목/썸네일/후킹 등)는 `admin_notes` 테이블과 연계됩니다.
> (`admin_notes.target_type='case_file'`, `target_id=content_pipeline_items.case_file_id`)

### youtube_videos
| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | text | PK |
| video_id | text | YouTube videoId |
| title | text | |
| url | text | |
| thumbnail_url | text | |
| published_at | timestamptz | |
| author | text | |
| description | text | nullable |
| source | text | `rss` \| `api` \| `mock` |
| created_at / updated_at | timestamptz | |

### settings (단일 row)
| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | text | PK (단일) |
| site_name | text | |
| operator_name | text | |
| default_submission_status | text | 제보 상태 enum |
| auto_publish_submissions | bool | |
| auto_publish_comments | bool | |
| report_hide_threshold | int | 신고 누적 자동 숨김 기준 |
| broadcast_request_threshold | int | 방송 요청 기준 |
| membership_lock_enabled | bool | |
| forbidden_keywords | text[] | 금지어 |
| privacy_risk_keywords | text[] | 개인정보 위험 키워드 |
| youtube_channel_id | text | |
| youtube_api_key_encrypted | text | ⚠️ 암호화 저장 권장 |
| youtube_uploads_playlist_id | text | |
| youtube_home_display_count | int | |
| youtube_sync_interval | int | 분 |
| youtube_last_synced_at | timestamptz | nullable |
| created_at / updated_at | timestamptz | |

---

## 3. 관계 (외래키)

```text
users 1 ── N submissions        (submissions.author_id → users.id)
users 1 ── N case_files          (case_files.author_id → users.id)
users 1 ── N comments            (comments.user_id → users.id)
users 1 ── N writer_works        (writer_works.author_id → users.id)
users 1 ── N reports             (reports.reporter_id → users.id)
users N ── N badges              (user_badges 조인)
membership_tiers 1 ── N users    (users.membership_tier_id → membership_tiers.id)

submissions 1 ── 1 case_files    (submissions.case_file_id ↔ case_files.submission_id)
case_files 1 ── N comments       (comments.case_file_id → case_files.id)
case_files 1 ── N radio_rooms    (radio_rooms.case_file_id → case_files.id)
case_files 1 ── N content_pipeline_items (content_pipeline_items.case_file_id → case_files.id)
case_files 1 ── N forbidden_zone_items   (forbidden_zone_items.related_case_file_id → case_files.id)

admin_notes / reports : 다형성(polymorphic) — (target_type, target_id)
```

---

## 4. 상태값 enum 모음

| 도메인 | 값 |
|---|---|
| user.role | `user`, `moderator`, `admin` |
| user.status | `active`, `warned`, `restricted`, `banned` |
| user.grade | 신입 청취자, 심야 청취자, 제보자, 목격자, 기록자, 방송 채택자, 검은 모자의 단골, 금지구역 출입자, 칠죄빌라 입주자, 라디오국 기록관리자 |
| category | 친무썰, 실화 괴담, 가족 괴담, 군대 괴담, 학교 괴담, 회사 괴담, 아파트 괴담, 엘리베이터 괴담, 꿈/가위눌림, 나폴리탄, 칠죄빌라, 사진/녹음 제보, 창작 괴담 |
| story_type | 실화 주장, 들은 이야기, 창작 괴담, 각색 가능 |
| location_type | 아파트, 학교, 군부대, 회사, 병원, 모텔, 지하철, 엘리베이터, 폐건물, 시골집, 기타 |
| region | 서울, 경기, 인천, 대구, 부산, 광주, 대전, 울산, 강원, 충청, 전라, 경상, 제주, 비공개 |
| fear_level | 찝찝함, 소름, 잠 못 잠, 혼자 보면 안 됨, 검은 모자에게만 보낼 수준 |
| broadcast_wish | 친무썰에 읽어주세요, 나폴리탄으로 각색해주세요, 칠죄빌라 세계관에 넣어주세요, 커뮤니티에만 올릴게요 |
| submission.status | 접수됨, 검토 중, 방송 후보, 각색 중, 녹음 예정, 방송 완료, 반려됨, 후속 제보 요청, 해석 필요, 위험 파일, 칠죄빌라 연결 의심, 금지 파일 |
| case_file.status | 미확인 제보, 접수됨, 검토 중, 방송 후보, 방송 완료, 해석 필요, 후속 제보 대기, 위험 파일, 칠죄빌라 연결 의심, 금지 파일 |
| risk_level | 낮음, 주의, 높음 |
| comment.type | 해석, 비슷한 경험, 단서 발견, 현실적 설명, 더 무서운 가설, 후속 요청, 방송 요청 |
| membership.name | 무료 회원, 심야 청취자, 기록자, 칠죄빌라 입주자, 라디오국 관계자 |
| radio_room.status | 방송 전, 대기방 오픈, 방송 중, 방송 완료, 해석방 오픈 |
| forbidden_zone.type | 칠죄빌라, 나폴리탄 문서실, 검은 모자의 편지함, 열람 제한 파일, 사라진 제보자 기록, 세계관 이벤트 |
| writer_work.status | 접수됨, 검토 중, 공식 낭독 후보, 채택, 반려, 수정 요청, 유료 공개 후보 |
| writer.author_grade | 신입 작가, 심야 작가, 채택 작가, 공식 낭독 작가, 검은 모자 전속 기록자 |
| product.category | 굿즈, 디지털 배지, 칠죄빌라 입주 카드, 사건파일 PDF, 한정 포스터, 오디오북, 멤버 전용 상품 |
| report.reason | 개인정보 노출, 특정인 비방, 허위 사실, 혐오/차별, 과도한 폭력 묘사, 스팸, 저작권 문제, 기타 |
| report.status | 접수됨, 검토 중, 조치 완료, 반려, 보류 |
| notice.type | 일반 공지, 방송 공지, 제보 안내, 멤버십 공지, 칠죄빌라 공지, 이벤트 |
| notice.visibility | 전체, 무료 회원, 심야 청취자 이상, 기록자 이상, 칠죄빌라 입주자, 관리자 전용 |
| pipeline.status | 제보 접수, 검토 중, 방송 후보, 각색 중, 대본 작성, 녹음 예정, 편집 중, 업로드 대기, 업로드 완료 |
| pipeline.priority | 낮음, 보통, 높음, 긴급 |
| youtube.source | rss, api, mock |

> PostgreSQL 에서는 한글 enum 값을 그대로 `text + CHECK` 로 쓰거나, 영문 코드값으로 정규화 후
> 표시 라벨을 프론트에서 매핑하는 방식(권장)을 선택할 수 있습니다.

---

## 5. YouTube 연동 (테이블 & 흐름)

- 테이블: `youtube_videos`, 설정은 `settings` 의 `youtube_*` 컬럼.
- 흐름:
  1. 클라이언트가 `/api/youtube/latest?channelId=...&limit=...` 호출 (직접 RSS 호출 금지).
  2. 서버(API Route)가 `lib/youtube.ts.fetchLatestVideos()` 로 RSS(`https://www.youtube.com/feeds/videos.xml?channel_id=...`) fetch.
  3. 성공 → `source: "rss"`, 실패 → mock(`data/mockYouTubeVideos.ts`)로 fallback (`source: "mock"`).
  4. 응답 형식: `{ videos: YouTubeVideo[], source: "rss" | "mock", fetchedAt: string }`.
  5. 클라이언트는 결과를 `blackhat_youtube_videos` 에 캐시하고, 동기화 시각을 `settings.youtube_last_synced_at` 에 기록.
- 확장: `settings.youtube_api_key` 가 채워지면 YouTube Data API(Uploads Playlist)로 교체 가능.
  교체 지점은 `lib/youtube.ts.fetchLatestVideos()` 한 곳뿐입니다.
- 기본 채널 ID: `UCSF-jV2STm5g66JlHBh6MWg` (검은 모자 공포라디오).

---

## 6. Export / Import 방식

- **Export**: `lib/storage.ts.exportAllData()` → 아래 키를 가진 단일 JSON 객체를 반환, 파일로 다운로드.
  ```text
  users, submissions, caseFiles, comments, badges, userBadges, memberships,
  radioRooms, forbiddenZoneItems, writerWorks, products, adminNotes, reports,
  notices, settings, contentPipelineItems, youtubeVideos, youtubeSettings
  ```
- **Import**: `importAllData(json)` → 존재하는 키만 해당 localStorage 키에 덮어씀.
- **마이그레이션 시나리오**:
  1. 관리자실 → 설정 → "전체 데이터 JSON Export" 로 백업 JSON 확보.
  2. 각 최상위 키(`users`, `caseFiles` …)를 위 매핑표의 DB 테이블로 그대로 적재.
  3. camelCase → snake_case 컬럼 변환 (간단한 스크립트로 자동화 가능).
  4. 문자열 시각(ISO8601) → `timestamptz` 캐스팅.
  5. `id` 는 그대로 사용하거나 uuid 로 재발급 후 FK 재매핑.

---

## 7. Supabase / PostgreSQL 이전 참고사항

- **PK**: 프로토타입은 `text` id(예: `case-1`, 동적 생성 시 `case-...`). 운영은 `uuid default gen_random_uuid()` 권장.
- **RLS(Row Level Security)**: `users.role` 기반 정책. 공개 콘텐츠는 `is_public = true` AND `deleted_at IS NULL` 만 노출.
- **인덱스 권장**: `case_files(status)`, `case_files(category)`, `comments(case_file_id)`,
  `submissions(status)`, `reports(status)`, `content_pipeline_items(status)`, `youtube_videos(published_at desc)`.
- **통계 캐시 컬럼**(`*_count`)은 트리거/뷰 또는 집계 쿼리로 대체 권장.
- **개인정보**: `youtube_api_key` 등 비밀값은 평문 저장 금지(`*_encrypted` 또는 Secrets Manager).
  제보 본문의 개인정보는 `detected_risk_keywords` + 검수 워크플로(`status='위험 파일'`)로 관리.
- **soft delete**: 모든 테이블에 `deleted_at timestamptz null` 추가, 조회 시 `WHERE deleted_at IS NULL`.
- **다형성 FK**(`admin_notes`, `reports`의 `target_type`/`target_id`)는 운영에서
  대상별 테이블 분리 또는 `CHECK` + 부분 인덱스로 무결성 보강 권장.
