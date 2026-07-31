const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '..', 'service-worker.js'), 'utf8');

assert(source.includes("const CACHE = 'shiftcal-web-v10'"));
assert(source.includes('self.skipWaiting()'), 'new service worker should activate without waiting for every tab to close');
assert(source.includes('self.clients.claim()'), 'new service worker should control open pages after activation');
assert(source.includes("'./app.js'"), 'application script should remain in the offline cache');

console.log('service worker update contract: PASS');
