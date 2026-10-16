import { courses, totalLessons } from '../src/lib/courses.js';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
const base = new URL('../public/', import.meta.url);
assert.equal(courses.length,11);
assert.equal(totalLessons,234);
for (const course of courses) {
  assert.ok(existsSync(new URL('.'+course.original,base)),`Missing original module: ${course.original}`);
  assert.equal(course.count,course.lessons.length);
  for (const lesson of course.lessons) {
    assert.equal(lesson.sections.length,6,`${course.slug}/${lesson.id} should contain sections A–F`);
    assert.deepEqual(lesson.sections.map(s=>s.letter),['A','B','C','D','E','F']);
    for(const sec of lesson.sections) assert.ok(sec.html.length>10,`${course.slug}/${lesson.id} section ${sec.letter} is empty`);
  }
}
console.log(`Validated ${courses.length} courses, ${totalLessons} lessons, and 1,404 A–F lesson segments.`);
