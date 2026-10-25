import { appendFileSync } from 'node:fs';

const payloadRaw = process.env.INPUT_PAYLOAD;
const outputPath = process.env.GITHUB_OUTPUT;

function fail(message) {
  throw new Error(message);
}

if (typeof payloadRaw !== 'string') fail('INPUT_PAYLOAD is required');
if (typeof outputPath !== 'string' || outputPath.length === 0) fail('GITHUB_OUTPUT is required');

let payload;
try {
  payload = JSON.parse(payloadRaw);
} catch {
  fail('INPUT_PAYLOAD must be valid JSON');
}

if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) fail('payload must be an object');
if (!Object.prototype.hasOwnProperty.call(payload, 'value')) fail('payload.value is required');
if (!Object.prototype.hasOwnProperty.call(payload, 'path')) fail('payload.path is required');

const valueRoot = payload.value;
const path = payload.path;

if (valueRoot === null || typeof valueRoot !== 'object' || Array.isArray(valueRoot)) fail('payload.value must be a plain object');
const proto = Object.getPrototypeOf(valueRoot);
if (proto !== Object.prototype && proto !== null) fail('payload.value must be a plain object');

if (typeof path !== 'string' || path.length === 0) fail('payload.path must be a non-empty string');
if (path.startsWith('.') || path.endsWith('.') || path.includes('..')) fail('payload.path format is invalid');

const segmentRe = /^[A-Za-z0-9_-]+$/;
const segments = path.split('.');
if (segments.length === 0) fail('payload.path must contain segments');
for (const seg of segments) {
  if (!segmentRe.test(seg)) fail('payload.path contains invalid segment');
}

let current = valueRoot;
let exists = true;

for (const seg of segments) {
  if (current === null || (typeof current !== 'object' && typeof current !== 'function')) {
    exists = false;
    break;
  }
  if (!Object.prototype.hasOwnProperty.call(current, seg)) {
    exists = false;
    break;
  }
  current = current[seg];
}

const result = exists ? { exists: true, value: current } : { exists: false, value: null };
appendFileSync(outputPath, `result=${JSON.stringify(result)}\n`);