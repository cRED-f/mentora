import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { courses } from '../src/lib/courses.js';
const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('Mentora homepage and academy routes both exist', () => {
  const home = read('../src/pages/index.astro');
  const academy = read('../src/pages/academy/index.astro');
  assert.match(home, /Mentora — Learn AI from the inside out/);
  assert.match(home, /href="\/academy\/"/);
  assert.match(home, /href="#curriculum"/);
  assert.match(home, /href="#ai-tutor"/);
  assert.match(home, /id="hero-heading"/);
  assert.match(home, /Curiosity meets/);
  // The hero is plain type by decision: no decorative diagram, no scroll cue.
  assert.doesNotMatch(home, /learning-map|node-chip|scroll-cue/);
  assert.match(academy, /course-grid/);
});

test('Homepage features real courses and course links resolve', () => {
  assert.equal(courses.length,11);
  for (const slug of ['llm-foundations','rag','agents']) {
    assert.ok(courses.some(c=>c.slug===slug));
  }
  const source = read('../src/pages/index.astro');
  assert.match(source, /courses\.find\(c=>c\.slug==='rag'\)/);
  assert.match(source, /courses\.find\(c=>c\.slug==='agents'\)/);
  assert.match(source, /href=\{`\/course\/\$\{course\.slug\}\//);
});

test('Landing chrome is keyboard accessible and motion-safe', () => {
  const js = read('../public/landing.js');
  const css = read('../src/styles/landing.css');
  const html = read('../src/pages/index.astro');
  assert.match(js, /Escape/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /Skip to content/);
  assert.match(css, /body\.landing\{[^}]*overflow-x:hidden/);
  // No scroll-triggered entrance animations; content is present on load.
  assert.doesNotMatch(html, /data-reveal|motion-enter/);
  assert.doesNotMatch(css, /is-visible|js-motion/);
});

test('Mentora rebranding preserves data and 9router backend', () => {
  assert.ok(existsSync(new URL('../public/mentora-icon.svg', import.meta.url)));
  const layout = read('../src/layouts/AppLayout.astro');
  const gateway = read('../src/lib/chat.js');
  const app = read('../public/app.js');
  assert.match(layout,/mentora/);
  assert.match(layout,/href="\/academy\/"/);
  assert.match(gateway,/Mentora Tutor/);
  assert.match(gateway,/NINEROUTER_API_KEY/);
  assert.match(app,/mentora-progress-v1/);
  assert.match(app,/modelcraft-progress-v1/); // deliberate migration from the previous edition
});
