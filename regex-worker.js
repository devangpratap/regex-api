const { workerData, parentPort } = require('worker_threads');

const { pattern, flags, input } = workerData;

const globalRegex = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
const matches = [];
let match;

while ((match = globalRegex.exec(input)) !== null) {
  matches.push({
    match: match[0],
    index: match.index,
    groups: match.groups || null,
    captured: match.slice(1),
  });
  if (match[0].length === 0) globalRegex.lastIndex++;
}

parentPort.postMessage({ matches });
