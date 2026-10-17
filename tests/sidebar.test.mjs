import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { courses, getCourse, getLesson, lessonUrl } from '../src/lib/courses.js';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('every course and lesson has a valid nested navigation destination', () => {
  assert.equal(courses.length, 11);
  assert.equal(courses.reduce((sum, course) => sum + course.lessons.length, 0), 234);
  for (const course of courses) {
    assert.equal(getCourse(course.slug), course);
    for (const lesson of course.lessons) {
      assert.equal(getLesson(course.slug, lesson.id), lesson);
      assert.equal(lessonUrl(course, lesson), `/learn/${course.slug}/${lesson.id}/`);
    }
  }
});

test('sidebar renders expandable course groups with full dynamic lesson lists', () => {
  const layout = read('../src/layouts/AppLayout.astro');
  assert.match(layout, /courses\.map\(\(course, index\) =>/);
  assert.match(layout, /<details[\s\S]*?class="course-group"[\s\S]*?open=\{activeCourse === course\.slug/);
  assert.match(layout, /<summary class:list=\{\['course-link', 'course-toggle'/);
  assert.match(layout, /course\.lessons\.map\(lesson =>/);
  assert.match(layout, /href=\{`\/learn\/\$\{course\.slug\}\/\$\{lesson\.id\}\/`\}/);
  assert.match(layout, /href=\{`\/course\/\$\{course\.slug\}\/`\}/);
  assert.match(layout, /aria-current=\{activeCourse === course\.slug && String\(activeLesson\) === String\(lesson\.id\) \? 'page'/);
  assert.match(layout, /data-progress-key=\{`\$\{course\.slug\}:\$\{lesson\.id\}`\}/);
});

test('sidebar supports expanding, active lesson visibility, and keyboard focus', () => {
  const js = read('../public/app.js');
  const css = read('../src/styles/global.css');
  assert.match(js, /mentora-sidebar-expanded-v1/);
  assert.match(js, /sessionStorage\.setItem/);
  assert.match(js, /activeLessonLink/);
  assert.match(css, /\.course-toggle:focus-visible/);
  assert.match(css, /\.course-group\[open\]/);
  assert.match(css, /\.lesson-link\.active/);
  assert.match(css, /\.lesson-link\.is-done/);
});
