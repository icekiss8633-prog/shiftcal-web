const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert(html.includes('.app-shell { padding-bottom: 8px; }'));
assert(html.includes('.bottom-nav { padding-bottom: calc(4px + env(safe-area-inset-bottom)); }'));
assert(html.includes('.bottom-nav-item { padding-bottom: 3px; }'));

console.log('compact mobile navigation layout: PASS');
