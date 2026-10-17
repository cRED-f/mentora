import { courses, totalLessons } from '../src/lib/courses.js';
import { foundationsGuideFor, courseHasFoundations } from '../src/lib/foundations.js';
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
  // A course either has no foundations layer or a complete one. A partial
  // guide would render some lessons with basics and some without, which is
  // worse than not having the layer at all.
  if (courseHasFoundations(course.slug)) {
    for (const lesson of course.lessons) {
      const guide = foundationsGuideFor(course.slug, lesson.id);
      assert.ok(guide, `${course.slug}/${lesson.id} has no foundations guide`);
      assert.ok(guide.question.length > 20, `${course.slug}/${lesson.id} guide question is empty`);
      assert.ok(guide.plain.length > 60, `${course.slug}/${lesson.id} guide plain text is empty`);
      assert.ok(guide.concepts.length >= 3, `${course.slug}/${lesson.id} has fewer than 3 concepts`);
      for (const [name, simple, advanced] of guide.concepts) {
        assert.ok(name && simple && advanced, `${course.slug}/${lesson.id} has an incomplete concept`);
      }
      assert.ok(guide.views.length >= 1, `${course.slug}/${lesson.id} has no diagram view`);
      for (const view of guide.views) {
        assert.ok(view.steps.length >= 3, `${course.slug}/${lesson.id} view "${view.name}" has too few steps`);
        for (const [label, explanation] of view.steps) assert.ok(label && explanation, `${course.slug}/${lesson.id} has an incomplete stage`);
      }
      assert.ok(guide.checkpoint.options.length >= 3, `${course.slug}/${lesson.id} checkpoint needs options`);
      assert.ok(guide.checkpoint.correct >= 0 && guide.checkpoint.correct < guide.checkpoint.options.length, `${course.slug}/${lesson.id} checkpoint index out of range`);
    }
  }
  for (const lesson of course.lessons) {
    assert.equal(lesson.sections.length,6,`${course.slug}/${lesson.id} should contain sections A–F`);
    assert.deepEqual(lesson.sections.map(s=>s.letter),['A','B','C','D','E','F']);
    for(const sec of lesson.sections) assert.ok(sec.html.length>10,`${course.slug}/${lesson.id} section ${sec.letter} is empty`);
  }
}
console.log(`Validated ${courses.length} courses, ${totalLessons} lessons, and 1,404 A–F lesson segments.`);
