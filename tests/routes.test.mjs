import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { courses, totalLessons } from '../src/lib/courses.js';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('the academy is the homepage, without a separate marketing landing page', () => {
  const root = read('../src/pages/index.astro');
  const config = read('../astro.config.mjs');
  assert.match(root, /import Layout from '\.\.\/layouts\/AppLayout\.astro'/);
  assert.match(root, /<Layout title=/);
  assert.match(root, /class="course-grid"/);
  assert.match(root, /courses\.map\(\(course, index\)/);
  assert.match(root, /Mentora AI|AI tutor/);
  assert.doesNotMatch(root, /landing-hero|landing\.css|Curiosity meets/);
  assert.match(config, /redirects: \{ '\/academy': '\/' \}/);
  for (const path of [
    '../src/pages/academy/index.astro',
    '../public/landing.js',
    '../src/scripts/landing-scroll.js',
    '../src/styles/landing.css',
    '../src/components/TransformerDiagram.astro',
  ]) assert.ok(!existsSync(new URL(path, import.meta.url)), `Unused landing asset remains: ${path}`);
});

test('academy navigation points directly to the homepage', () => {
  const layout = read('../src/layouts/AppLayout.astro');
  assert.match(layout, /aria-label="Mentora academy"/);
  assert.match(layout, /href="\/" class=\{activeCourse/);
  assert.doesNotMatch(layout, /Mentora homepage|href="\/academy\/"/);
  for (const path of ['../src/pages/course/[slug].astro', '../src/pages/learn/[course]/[lesson].astro']) {
    const source = read(path);
    assert.match(source, /href="\/"/);
    assert.doesNotMatch(source, /href="\/academy\/"/);
  }
});

test('courses, lessons and saved user settings remain available', () => {
  const root = read('../src/pages/index.astro');
  const app = read('../public/app.js');
  const backend = read('../src/lib/chat.js');
  assert.equal(courses.length, 11);
  assert.equal(totalLessons, 234);
  assert.match(root, /href=\{`\/course\/\$\{course\.slug\}/);
  assert.match(app, /mentora-progress-v1/);
  assert.match(app, /mentora-sidebar-expanded-v1/);
  assert.match(backend, /NINEROUTER_API_KEY/);
});
