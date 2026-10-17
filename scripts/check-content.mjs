import { courses, totalLessons } from '../src/lib/courses.js';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
const base = new URL('../public/', import.meta.url);
assert.ok(!existsSync(new URL('modules/',base)),'Legacy standalone modules should be removed');
assert.equal(courses.length,11);
assert.equal(totalLessons,234);
for (const course of courses) {
  assert.ok(!Object.hasOwn(course,'original'),`Legacy course source link in ${course.slug}`);
  assert.equal(course.count,course.lessons.length);
  // Capstones are course-level, not lessons: they have a scenario, a question
  // and a rubric that explicitly withholds the answer, so they cannot carry a
  // C-section model answer. Keep them out of the A–F contract.
  assert.ok(course.capstone,`${course.slug} has no capstone`);
  assert.ok(course.capstone.html.length>100,`${course.slug} capstone body is empty`);
  assert.ok(course.capstone.text.length>80,`${course.slug} capstone text is empty`);
  assert.ok(course.capstone.title||course.capstone.label,`${course.slug} capstone has no title`);
  assert.ok(!/<button|<textarea/i.test(course.capstone.html),`${course.slug} capstone kept interactive chrome`);
  for (const lesson of course.lessons) {
    assert.equal(lesson.sections.length,6,`${course.slug}/${lesson.id} should contain sections A–F`);
    assert.deepEqual(lesson.sections.map(s=>s.letter),['A','B','C','D','E','F']);
    for(const sec of lesson.sections) assert.ok(sec.html.length>10,`${course.slug}/${lesson.id} section ${sec.letter} is empty`);
  }
}
console.log(`Validated ${courses.length} courses, ${totalLessons} lessons, and 1,404 A–F lesson segments.`);
