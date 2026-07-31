const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const source = ['index.html', 'app.js', 'storage.js', 'shift-engine.js']
  .map(file => fs.readFileSync(path.join(root, file), 'utf8'))
  .join('\n');

[
  '저장해.',
  '메모가 없어',
  '남길 수 있어',
  '지정할 수 있어',
  '입력해줘',
  '확인해줘',
  '선택해줘',
  '광고·로그인·추적 없음',
  '직접 근무명',
  '직접 만들기',
  '근무시간 없는 일정',
  '다음날',
].forEach(phrase => assert(!source.includes(phrase), `legacy UI copy remains: ${phrase}`));

[
  '일정과 설정은 이 브라우저에만 저장됩니다.',
  '작성한 메모가 없습니다',
  '달력에서 날짜를 선택해 메모를 남겨 보세요.',
  'ShiftCal에서 내보낸 JSON 파일인지 확인해 주세요.',
  '근무 시간이 없는 일정',
  '근무 변경 해제',
].forEach(phrase => assert(source.includes(phrase), `expected UI copy missing: ${phrase}`));

console.log('natural Korean UI copy: PASS');
