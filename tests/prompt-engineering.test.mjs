import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { courses } from '../src/lib/courses.js';
import { foundationsGuideFor, courseHasFoundations } from '../src/lib/foundations.js';
import { composeMessages } from '../src/lib/chat.js';
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const course = courses.find(item => item.slug === 'prompt-engineering');

test('all 30 Prompt Engineering lessons are beginner-first with original topic-specific material', () => {
  assert.equal(courseHasFoundations('prompt-engineering'),true);
  assert.equal(course.lessons.length,30);
  assert.deepEqual(course.lessons.map(lesson=>lesson.id),Array.from({length:30},(_,i)=>i+1));
  const questions = new Set();
  const diagrams = new Set();
  for (const lesson of course.lessons) {
    const guide = foundationsGuideFor(course.slug,lesson.id);
    assert.ok(guide,`Missing guide ${lesson.id}`);
    assert.ok(guide.question.length>45 && guide.plain.length>180, `Lesson ${lesson.id} needs meaningful beginner content`);
    assert.equal(guide.goals.length,3,`Lesson ${lesson.id} needs 3 learning outcomes`);
    assert.ok(guide.concepts.length>=3,`Lesson ${lesson.id} must explain basic terms`);
    for (const [term,basic,deep] of guide.concepts) assert.ok(term && basic.length>40 && deep.length>100,`Lesson ${lesson.id} inadequate concept: ${term}`);
    assert.equal(guide.example.steps.length,4,`Lesson ${lesson.id} needs four worked steps`);
    assert.ok(guide.example.takeaway.length>50);
    assert.equal(guide.views.length,2,`Lesson ${lesson.id} needs two relevant diagram views`);
    for (const view of guide.views) {
      assert.equal(view.steps.length,4,`Lesson ${lesson.id} diagram must have four stages`);
      for (const [name,detail] of view.steps) assert.ok(name.length>=3 && detail.length>40,`Lesson ${lesson.id} stage needs explanatory content`);
    }
    assert.ok(guide.precision.length>80 && guide.engineering.length>90 && guide.interview.endsWith('?'));
    assert.ok(guide.workbench.weak.length>30 && guide.workbench.strong.length>100 && guide.workbench.observation.length>75);
    assert.equal(guide.checkpoint.options.length,3);
    assert.ok(guide.checkpoint.why.length>80);
    assert.ok(Number.isInteger(guide.checkpoint.correct) && guide.checkpoint.correct>=0 && guide.checkpoint.correct<3);
    questions.add(guide.question);
    diagrams.add(guide.views[0].steps.map(([label])=>label).join('|'));
  }
  assert.equal(questions.size,30,'Every topic needs its own motivating question');
  assert.equal(diagrams.size,30,'Diagrams must be topic-specific, not generic copies');
});

test('the original A–F sections are preserved and each Prompt lesson has 5 interview questions and a pressure-test rubric', () => {
  for (const lesson of course.lessons) {
    assert.deepEqual(lesson.sections.map(section=>section.letter),['A','B','C','D','E','F']);
    assert.equal((lesson.sections[0].html.match(/<li>/g)||[]).length,5,`Lesson ${lesson.id} should contain five interviewer questions`);
    assert.ok(lesson.sections[1].text.length>1200,`Lesson ${lesson.id} technical deep dive needs substantial content`);
    assert.match(lesson.sections[3].html,/A strong response must include/);
    assert.ok(lesson.sections[4].text.length>350,`Lesson ${lesson.id} production scenario too thin`);
  }
});

test('Prompt Engineering interactive diagrams, workbenches and specialty labs render in native Mentora lesson pages', () => {
  const lessonPage = read('../src/pages/learn/[course]/[lesson].astro');
  const pathComponent = read('../src/components/FoundationLearningPath.astro');
  const labComponent = read('../src/components/PromptEngineeringExercises.astro');
  const playback = read('../public/foundations-path.js');
  const labs = read('../public/prompt-engineering-exercises.js');
  const css = read('../src/styles/foundations-path.css');
  assert.match(lessonPage,/PromptEngineeringExercises lessonId=\{lesson\.id\}/);
  assert.match(lessonPage,/prompt-engineering-exercises\.js/);
  for (const marker of ['foundations-start','foundations-diagram','foundations-workbench','foundations-check','foundations-sources']) {
    assert.ok(pathComponent.includes(marker),`Missing ${marker}`);
  }
  for (const feature of ['data-foundation-play','data-foundation-next','data-foundation-prev','data-foundation-step-progress','data-prompt-workbench','data-prompt-variant']) {
    assert.ok(pathComponent.includes(feature) && playback.includes(feature),`Missing interaction ${feature}`);
  }
  assert.match(playback,/prefers-reduced-motion: reduce/);
  assert.match(playback,/visibilitychange/);
  for (const id of [2,4,5,11,21]) assert.ok(labComponent.includes(`id === ${id}`), `Missing specialty lab ${id}`);
  for (const marker of ['data-shot','data-vote-slider','data-tree-width','data-input-tokens','data-position']) {
    assert.ok(labComponent.includes(marker) && labs.includes(marker),`Missing lab behavior ${marker}`);
  }
  assert.match(labComponent,/None calls an LLM/);
  assert.match(css,/\.foundation-workbench-frame/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  const colors = css.match(/#[a-f0-9]{6}\b/gi) || [];
  assert.ok(colors.every(hex=>hex.slice(1,3) === hex.slice(3,5) && hex.slice(3,5) === hex.slice(5,7)), 'Keep monochrome palette');
});

test('supplied optional reading links are preserved with the corresponding lessons', () => {
  const expected = new Map([[2,'linkedin.com'],[3,'chain-of-thought'],[5,'tree-of-thoughts'],[6,'react-agent'],[9,'prompt-injection'],[10,'prompt-injection'],[16,'prompt-chaining'],[21,'lost-in-the-middle'],[27,'prompt-injection']]);
  for(const [id,uriFragment] of expected) {
    const links = foundationsGuideFor('prompt-engineering',id).resources;
    assert.ok(links.some(([title,uri]) => title.length>10 && uri.includes(uriFragment) && uri.startsWith('https://')),`Missing supplied reading for ${id}`);
  }
});

test('Mentora Tutor uses Prompt Engineering foundations context and rigorous coach protocol', () => {
  const prompt = composeMessages({course:'prompt-engineering',lesson:'9',message:'Explain prompt injection from basics',history:[]})[0].content;
  assert.match(prompt,/BEGINNER EXPLANATION:/);
  assert.match(prompt,/KEY TERMS:/);
  assert.match(prompt,/EXAMPLE:/);
  assert.match(prompt,/A five applied interviewer questions/);
  assert.match(prompt,/INTERACTIVE LOOP/);
  assert.match(prompt,/PROMPT INJECTION|Prompt Injection|Prompt injection|prompt injection/);
  const interview = composeMessages({course:'prompt-engineering',lesson:'9',message:'Mock interview',mode:'mock',history:[]})[0].content;
  assert.match(interview,/MOCK INTERVIEW MODE/);
});
