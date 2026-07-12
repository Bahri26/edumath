#!/usr/bin/env node
/**
 * Hızlı sözdizimi taraması (node --check).
 * JSX/eksik parantez benzeri kırılmaları lint’ten önce yakalar.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..', '..');
const backendRoot = path.join(__dirname, '..');

const IGNORE_DIRS = new Set(['node_modules', 'uploads', 'coverage', '.git']);

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (IGNORE_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (name.endsWith('.js')) out.push(full);
  }
  return out;
}

const files = walk(backendRoot);
let failed = 0;

for (const file of files) {
  const rel = path.relative(root, file);
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    failed += 1;
    console.error(`✗ ${rel}`);
    if (result.stderr) console.error(result.stderr.trim());
  }
}

if (failed) {
  console.error(`\nSyntax check failed: ${failed}/${files.length} file(s)`);
  process.exit(1);
}

console.log(`Syntax OK (${files.length} files)`);
