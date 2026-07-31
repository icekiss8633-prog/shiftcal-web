# ShiftCal Web

광고·로그인·외부 서버 없이 개인용으로 사용하는 교대근무 PWA 초안.

## 현재 구현
- ShiftCal Swift 원본의 주요 패턴 9개
- 기준일·기준 근무 설정
- 월간 달력
- 오늘 근무 카드
- 날짜별 근무 예외 지정(당직·비번·연가·공가)
- 저장된 사용자 근무 목록(한 번 만든 근무를 재사용)
- 사용자 근무별 색상 선택
- 날짜별 메모(최대 500자)
- 메모 목록 화면
- 월별 근무 통계·근무시간·야간일·메모 개수
- 대한민국 공휴일·대체공휴일·선거일 표시
- 주요 기념일 표시(어버이날·스승의날·국군의날 등)
- 아이폰 모바일용 bottom sheet 입력창
- 하단 달력·메모·통계·설정 메뉴
- 자연스러운 한국어 안내 문구와 간결한 하단 메뉴를 적용한 모바일 중심 화면
- 메모·근무 변경 표시 점
- localStorage 저장
- 검증된 JSON 백업 내보내기·가져오기
- 홈 화면용 아이콘을 포함한 PWA manifest/service worker

## 실행
```sh
python3 -m http.server 4173
```
브라우저에서 `http://localhost:4173` 접속.
아이폰에서는 HTTPS로 배포한 뒤 Safari의 공유 메뉴에서 “홈 화면에 추가”를 사용한다.

## 개발 품질 자동화
- `AGENTS.md`에 ShiftCalWeb 작업 규칙·필수 검증 절차를 기록한다.
- `main` push와 pull request마다 GitHub Actions가 문법 검사와 전체 계약 테스트를 실행한다.
- Pages 배포는 `.github/workflows/pages.yml`이 담당한다.
