// tests/run-all.js — corre todas las suites: node tests/run-all.js
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.test.js')).sort();
let failed = 0;

for (const f of files) {
  try {
    execFileSync(process.execPath, [path.join(dir, f)], { stdio: 'pipe' });
    console.log(`  ✔ ${f}`);
  } catch (e) {
    failed++;
    console.error(`  ✘ ${f}`);
    console.error(String(e.stdout || '') + String(e.stderr || ''));
  }
}

console.log(failed === 0 ? `\n${files.length} suites OK` : `\n${failed}/${files.length} suites FALLARON`);
process.exit(failed === 0 ? 0 : 1);
