import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { courses } from '../src/lib/courses.js';
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('all ten LLM Foundations lessons retain their full six-part instructional content', () => {
  const course = courses.find(course => course.slug === 'llm-foundations');
  assert.equal(course.lessons.length, 10);
  assert.deepEqual(course.lessons.map(x => x.id), [1,2,3,4,5,6,7,8,9,10]);
  for (const lesson of course.lessons) {
    assert.deepEqual(lesson.sections.map(section => section.letter), ['A','B','C','D','E','F']);
    assert.ok(lesson.sections.every(section => section.html.length > 100));
  }
});

test('LLM Foundations exercises render within native Mentora lesson pages', () => {
  const page = read('../src/pages/learn/[course]/[lesson].astro');
  const component = read('../src/components/LLMFoundationsExercises.astro');
  const script = read('../public/llm-foundations-labs.js');
  assert.match(page, /course\.slug === 'llm-foundations' && <LLMFoundationsExercises lessonId=\{lesson\.id\}/);
  assert.match(page, /llm-foundations-labs\.js/);
  assert.match(component, /\[1, 4, 5, 6, 7, 8, 10\]/);
  assert.match(component, /data-foundations-exercise/);
  for (const marker of ['data-flow-step','data-temperature','data-objective','data-architecture','data-pipeline','data-task-type','data-capstone-review']) {
    assert.ok(component.includes(marker), `missing ${marker}`);
  }
  assert.match(script, /mentora:ask-tutor/);
  assert.match(read('../public/app.js'), /addEventListener\('mentora:ask-tutor'/);
});

test('standalone modules are deleted and all navigation remains within Mentora', () => {
  assert.equal(existsSync(new URL('../public/modules/', import.meta.url)), false);
  assert.ok(courses.every(course => !Object.hasOwn(course, 'original')));
  for (const path of [
    '../src/layouts/AppLayout.astro',
    '../src/pages/course/[slug].astro',
    '../src/pages/learn/[course]/[lesson].astro'
  ]) assert.doesNotMatch(read(path), /\/modules\/|course\.original|Open original interactive labs/);
});
