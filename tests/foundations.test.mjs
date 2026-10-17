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

test('every Foundations topic teaches first principles, application, and interview reasoning', async () => {
  const { foundationGuides, getFoundationGuide } = await import('../src/data/llm-foundations-path.js');
  const keys = Object.keys(foundationGuides).map(Number).sort((a, b) => a - b);
  assert.deepEqual(keys, Array.from({length: 10}, (_, i) => i + 1));
  for (const id of keys) {
    const guide = getFoundationGuide(id);
    assert.ok(guide.question.length > 35, `lesson ${id}: motivating question`);
    assert.ok(guide.plain.length > 140, `lesson ${id}: beginner explanation`);
    assert.equal(guide.goals.length, 3, `lesson ${id}: outcomes`);
    assert.equal(guide.concepts.length, 4, `lesson ${id}: key concepts`);
    for (const [name, basic, deeper] of guide.concepts) {
      assert.ok(name && basic.length > 30 && deeper.length > 105, `lesson ${id}: teach ${name} at two levels`);
    }
    assert.equal(guide.example.steps.length, 4, `lesson ${id}: worked example`);
    assert.ok(guide.example.takeaway.length > 75, `lesson ${id}: takeaway`);
    assert.ok(guide.views.length >= 2, `lesson ${id}: comparative interactive diagram`);
    for (const view of guide.views) {
      assert.equal(view.steps.length, 4, `lesson ${id}: four selectable stages`);
      assert.ok(view.note.length > 30);
      assert.ok(view.steps.every(([label, description]) => label.length >= 2 && description.length > 25));
    }
    assert.ok(guide.precision.length > 100 && guide.engineering.length > 100, `lesson ${id}: real-world tradeoff`);
    assert.ok(guide.interview.endsWith('?'), `lesson ${id}: interview challenge`);
    assert.equal(guide.checkpoint.options.length, 3, `lesson ${id}: question with 3 choices`);
    assert.ok(Number.isInteger(guide.checkpoint.correct) && guide.checkpoint.correct >= 0 && guide.checkpoint.correct < 3);
    assert.ok(guide.checkpoint.why.length > 50, `lesson ${id}: reasoned feedback`);
  }
});

test('monochrome, interactive Foundation guides integrate into native lesson navigation', () => {
  const page = read('../src/pages/learn/[course]/[lesson].astro');
  const overview = read('../src/pages/course/[slug].astro');
  const path = read('../src/components/FoundationLearningPath.astro');
  const css = read('../src/styles/foundations-path.css');
  const js = read('../public/foundations-path.js');
  assert.match(page, /<FoundationLearningPath lessonId=\{lesson\.id\}/);
  assert.match(page, /foundations-path\.js/);
  for (const anchor of ['foundations-start', 'foundations-diagram', 'foundations-check']) {
    assert.ok(page.includes(`#${anchor}`) && path.includes(`id="${anchor}"`));
  }
  for (const attribute of ['data-foundation-view-button', 'data-foundation-view', 'data-foundation-step', 'data-foundation-answer', 'data-foundation-feedback']) {
    assert.ok(path.includes(attribute), `missing ${attribute} in component`);
    assert.ok(js.includes(attribute), `missing ${attribute} in behavior`);
  }
  assert.match(path, /aria-pressed/);
  assert.match(path, /aria-live="polite"/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /focus-visible/);
  const hues = css.match(/#[a-f0-9]{6}\b/gi) || [];
  assert.ok(hues.every(color => color.slice(1,3) === color.slice(3,5) && color.slice(3,5) === color.slice(5,7)), 'palette must remain monochrome');
  assert.doesNotMatch(path, /#[a-f0-9]{6}/i);
  for (const feature of ['data-foundation-sampling', 'data-foundation-mask', 'data-foundation-kv', 'data-foundation-ask']) {
    assert.ok(path.includes(feature), `${feature} markup missing`);
    assert.ok(js.includes(feature), `${feature} behavior missing`);
  }
  assert.match(overview, /10 diagrams/);
  assert.match(overview, /\[9, 'Hosting and licensing choices'\]/);
});

test('Page-aware Mentora AI includes first-principles lesson text and technical A–F context', async () => {
  const { composeMessages } = await import('../src/lib/chat.js');
  const messages = composeMessages({ course: 'llm-foundations', lesson: '3', message: 'explain training and inference simply', history: [] });
  const prompt = messages[0].content;
  assert.match(prompt, /CURRENT PAGE:/);
  assert.match(prompt, /How LLMs learn patterns and generate language/);
  assert.match(prompt, /not an interviewer/);
  assert.match(prompt, /A\. /);
  assert.match(prompt, /B\. /);
});

test('lesson 10 renders model routing inside the capstone instead of a blank lab', () => {
  const labs = read('../src/components/LLMFoundationsExercises.astro');
  assert.match(labs, /\(id === 10 && mode === 'capstone'\)/);
  assert.match(labs, /data-task-type/);
  assert.match(labs, /data-capstone-review/);
});

test('all 80 supplied questions map to a lesson and preserve supplied reading references', async () => {
  const { default: syllabus } = await import('../src/data/llm-fundamentals-syllabus.json', { with: { type: 'json' } });
  assert.equal(syllabus.length, 80);
  assert.deepEqual(syllabus.map(x=>x.id), Array.from({length:80},(_,i)=>i+1));
  for (const entry of syllabus) {
    assert.ok(entry.question.length >= 15);
    assert.ok(Number.isInteger(entry.lesson) && entry.lesson>=1 && entry.lesson<=10);
    for (const resource of entry.resources) {
      assert.match(resource.url, /^https:\/\/|^http:\/\//);
      assert.ok(resource.label);
    }
  }
});

test('ten original lessons are replaced by genuine six-part advanced engineering material', async () => {
  const { createDeepSections, deepLessons } = await import('../src/data/llm-foundations-deep.js');
  assert.equal(Object.keys(deepLessons).length, 10);
  for (const lesson of courses.find(c=>c.slug==='llm-foundations').lessons) {
    const deep = deepLessons[lesson.id];
    assert.equal(deep.questions.length, 5, `lesson ${lesson.id}: five applied interview questions`);
    assert.ok(deep.mechanism.length >= 3, `lesson ${lesson.id}: detailed mechanism`);
    assert.ok(deep.equations.length >= 2, `lesson ${lesson.id}: math and assumptions`);
    assert.equal(deep.pressure.length, 4);
    assert.equal(deep.incident.length, 5);
    assert.ok(deep.design.length > 140 && deep.performance.length > 130 && deep.failures.length > 130);
    assert.ok(deep.spoken.length > 230);
    assert.deepEqual(lesson.sections.map(x=>x.letter), ['A','B','C','D','E','F']);
    assert.ok(lesson.sections[1].html.includes('Mathematics and assumptions'));
    assert.ok(lesson.sections[4].html.includes('ILLUSTRATIVE INCIDENT'));
    assert.ok(createDeepSections(lesson.id)[1].html.length > 1700);
  }
});

test('Mentora AI is a single chatbot with page context and no fixed tutoring modes', async () => {
  const { composeMessages } = await import('../src/lib/chat.js');
  const context = composeMessages({course:'llm-foundations',lesson:'6',message:'Help me understand attention',pageText:'Attention uses query and key vectors.'})[0].content;
  assert.match(context,/Attention uses query and key vectors/);
  assert.match(context,/You are Mentora AI/);
  assert.match(context,/do not force an A–F format/);
  assert.doesNotMatch(context,/MOCK INTERVIEW MODE/);
  const layout=read('../src/layouts/AppLayout.astro');
  assert.match(layout,/id="tutor-settings-toggle"/);
  assert.doesNotMatch(layout,/data-tutor-mode/);
  assert.match(read('../public/app.js'),/pageText:/);
});
