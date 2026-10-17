import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL(path,import.meta.url),'utf8');

test('selection action and quoted text preview are present in every course layout', () => {
  const layout = read('../src/layouts/AppLayout.astro');
  assert.match(layout,/id="selection-ask"[^>]+hidden/);
  assert.match(layout,/> Ask Mentora /);
  assert.match(layout,/id="tutor-selection"[^>]*hidden/);
  assert.match(layout,/id="tutor-selection-clear"/);
  assert.match(layout,/id="tutor-selection-text"/);
});

test('only the current main page is selectable and selection is bounded before submission', () => {
  const script = read('../public/app.js');
  assert.match(script,/page\.contains\(range\.startContainer\)/);
  assert.match(script,/page\.contains\(range\.endContainer\)/);
  assert.match(script,/window\.getSelection\(\)/);
  assert.match(script,/MAX_QUOTE = 3000/);
  assert.match(script,/selectionAction\?\.addEventListener\('click'/);
  assert.match(script,/renderSelectedText\(\)/);
  assert.match(script,/selectedText:quote/);
});

test('floating popup and composer quotation match Mentora grayscale UI', () => {
  const style = read('../src/styles/global.css');
  assert.match(style,/\.selection-ask\[hidden\]/);
  assert.match(style,/\.selection-ask\{position:fixed/);
  assert.match(style,/\.tutor-selection\{/);
  assert.match(style,/\.chat-selection-quote\{/);
});

test('README contains short, actionable 9Router and text-selection instructions', () => {
  const readme = read('../README.md');
  assert.ok(readme.trim().split(/\r?\n/).length <= 90);
  for(const term of ['NINEROUTER_BASE_URL','Load models','Save settings','Ask Mentora','sessionStorage']) {
    assert.ok(readme.includes(term),term);
  }
});
