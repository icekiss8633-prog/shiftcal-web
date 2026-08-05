const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

assert(!html.includes('<header class="app-header">'), 'the visual app title header should be removed');
assert(html.includes('<button class="today-card" id="todayCard"'), 'the compact today summary should open its date');
['month', 'week', 'list'].forEach(mode => assert(html.includes(`data-calendar-mode="${mode}"`), `${mode} view control missing`));
assert(/\.bottom-nav\s*\{[\s\S]*?position:\s*fixed/.test(styles), 'bottom navigation should remain fixed to the viewport');
assert(styles.includes('calc(76px + env(safe-area-inset-bottom))'), 'content should clear the fixed navigation');
assert(styles.includes('min-height: clamp(58px, calc((100dvh - 275px) / 6), 96px)'), 'month cells should adapt to the available screen height');
assert(app.includes('class="today-note"'), 'today summary should expose note text');
assert(app.includes('class="calendar-note"'), 'month cells should expose note text');
assert(app.includes("className = 'agenda-row'"), 'week and list views should render agenda rows');

console.log('calendar-first mobile layout: PASS');
