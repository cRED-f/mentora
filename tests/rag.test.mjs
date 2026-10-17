import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { courses } from '../src/lib/courses.js';
import { foundationsGuideFor, courseHasFoundations } from '../src/lib/foundations.js';
import { RAG_GUIDE_COUNT } from '../src/data/rag-path.js';
import { RAG_LAB_GROUPS, ragLessonHasLab } from '../src/data/rag-labs.js';
import { ragMath } from '../src/data/rag-math.js';
import { composeMessages } from '../src/lib/chat.js';
const read = path => readFileSync(new URL(path, import.meta.url),'utf8');
const course = courses.find(c => c.slug==='rag');

test('all 42 RAG lessons have complete, distinct foundations before the six interview sections',()=>{
  assert.equal(RAG_GUIDE_COUNT,42);
  assert.equal(courseHasFoundations('rag'),true);
  assert.equal(course.lessons.length,42);
  assert.deepEqual(course.lessons.map(l=>l.id),Array.from({length:42},(_,i)=>i+1));
  const descriptions=new Set(),flowNames=new Set(),failNames=new Set();
  for(const l of course.lessons){
    const g=foundationsGuideFor('rag',l.id);
    assert.ok(g,`missing RAG guide ${l.id}`);
    assert.ok(g.plain.length>170,`RAG ${l.id} foundation too short`);
    assert.ok(g.mechanism.length>180,`RAG ${l.id} mechanism too short`);
    assert.equal(g.goals.length,3);
    assert.equal(g.concepts.length,3);
    for (const [term,simple,advanced] of g.concepts){
      assert.ok(term && simple.length>32 && advanced.length>70,`RAG ${l.id} incomplete concept ${term}`);
    }
    assert.equal(g.views.length,2);
    for(const v of g.views){assert.equal(v.steps.length,4);for(const [label,detail] of v.steps)assert.ok(label.length>=3 && detail.length>32,`RAG ${l.id} incomplete stage`);}
    assert.equal(g.example.steps.length,4);
    for(const step of g.example.steps)assert.ok(step.length>35,`RAG ${l.id} example too short`);
    assert.ok(g.example.takeaway.length>70);
    assert.ok(g.precision.length>75 && g.engineering.length>90);
    assert.ok(g.interview.endsWith('?'));
    assert.equal(g.checkpoint.options.length,3);
    assert.equal(new Set(g.checkpoint.options).size,3,`RAG ${l.id} options duplicated`);
    assert.ok(g.checkpoint.why.length>60);
    assert.ok(g.checkpoint.correct>=0 && g.checkpoint.correct<3);
    assert.equal(g.resources.every(([name,url])=>name.length>5&&url.startsWith('https://')),true);
    descriptions.add(g.plain);flowNames.add(g.views[0].steps.map(x=>x[0]).join('|'));failNames.add(g.views[1].steps.map(x=>x[0]).join('|'));
  }
  assert.equal(descriptions.size,42);
  assert.equal(flowNames.size,42);
  assert.equal(failNames.size,42);
});

test('each RAG lesson preserves the six technical A–F sections and provides five questions and a specific pressure rubric',()=>{
  for(const l of course.lessons){
    assert.deepEqual(l.sections.map(s=>s.letter),['A','B','C','D','E','F']);
    assert.equal((l.sections[0].html.match(/<li>/g)||[]).length,5,`RAG lesson ${l.id} has wrong question count`);
    assert.ok(l.sections[1].text.length>1200,`RAG ${l.id} lost technical deep dive`);
    assert.ok(l.sections[2].text.length>240,`RAG ${l.id} needs an interview-ready spoken answer`);
    assert.match(l.sections[3].html,/A strong response must include/);
    assert.ok(l.sections[4].text.length>320,`RAG ${l.id} lost its production incident`);
    assert.ok(l.sections[5].text.length>100,`RAG ${l.id} lost its takeaways`);
  }
});

test('RAG animations, lessons, math and labs use existing Mentora components and keep navigation accurate',()=>{
  const lesson=read('../src/pages/learn/[course]/[lesson].astro');
  const overview=read('../src/pages/course/[slug].astro');
  const path=read('../src/components/FoundationLearningPath.astro');
  const labs=read('../src/components/RagExercises.astro');
  const code=read('../public/rag-exercises.js');
  const css=read('../src/styles/foundations-path.css');
  for(const marker of ['RagMath lessonId={lesson.id}','RagExercises lessonId={lesson.id}','/rag-exercises.js','ragLessonHasLab(lesson.id)']) assert.ok(lesson.includes(marker));
  assert.match(overview,/42 guided diagrams/);
  assert.match(path,/data-foundation-play/);
  assert.match(path,/data-foundation-prev/);
  assert.match(path,/data-foundation-step-progress/);
  assert.match(read('../public/foundations-path.js'),/prefers-reduced-motion: reduce/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  for(const key of Object.keys(RAG_LAB_GROUPS))assert.ok(labs.includes(`data-rag-${key === 'chunking' ? 'chunk' : key === 'evaluation' ? 'metrics' : key === 'vectors' ? 'vectors' : key === 'fusion' ? 'fusion' : key}`) || ['pdf','hops','colbert','freshness','acl','latency'].includes(key),`missing lab category ${key}`);
  for(const attr of ['data-rag-chunk','data-rag-fusion','data-rag-colbert','data-rag-metrics','data-rag-vectors','data-rag-acl','data-rag-freshness','data-rag-pdf','data-rag-hops','data-rag-latency']){
    assert.ok(labs.includes(attr) && code.includes(attr),`missing wired lab ${attr}`);
  }
  assert.equal(Object.keys(RAG_LAB_GROUPS).length,10);
  assert.equal(new Set(Object.values(RAG_LAB_GROUPS).flat()).size,30);
  assert.ok(!ragLessonHasLab(1));assert.ok(ragLessonHasLab(42));
  const hex=css.match(/#[a-f0-9]{6}\b/gi)||[];
  assert.ok(hex.every(c=>c.slice(1,3)===c.slice(3,5)&&c.slice(3,5)===c.slice(5,7)),'RAG styles must stay monochrome');
});

test('formal lenses contain defined assumptions and correct source equations',()=>{
  assert.deepEqual(Object.keys(ragMath).map(Number),[1,4,7,10,12,16,23,29]);
  for(const [id,entry] of Object.entries(ragMath)){
    assert.match(entry.latex,/^\$\$.*\$\$$/s,`LaTeX missing $$ for ${id}`);
    assert.ok(entry.mathml.length>70 && entry.assumption.length>50 && entry.explanation.length>70);
    assert.doesNotMatch(entry.mathml,/<script|onload|onclick/i);
  }
  assert.ok(ragMath[12].latex.includes('max'));
  assert.ok(ragMath[10].latex.includes('rank'));
  assert.ok(ragMath[16].latex.includes('Recall'));
});

test('all linked user supplied RAG resources appear on their relevant lessons',()=>{
  const expected=new Map([[1,'youtube.com'],[4,'chunking-strategies'],[6,'contextual-retrieval'],[7,'what-are-embeddings'],[9,'agentic-rag'],[10,'hybrid-search'],[12,'decoding-colbert'],[14,'graphrag'],[15,'lost-in-the-middle'],[16,'llm-evaluation'],[18,'graphrag'],[19,'vectorless-rag'],[24,'vector-database'],[27,'how-does-hyde'],[29,'approximate-nearest-neighbor'],[30,'chunking-strategies'],[36,'hybrid-search'],[39,'agentic-rag']]);
  for(const [id,fragment] of expected){const sources=foundationsGuideFor('rag',id).resources;assert.ok(sources.some(([,url])=>url.includes(fragment)),`Resource missing lesson ${id}`);}
  assert.equal(foundationsGuideFor('rag',13).resources.length,2);
});

test('RAG AI assistant includes the active lesson rather than a mock interview protocol',()=>{
  const text=composeMessages({course:'rag',lesson:'35',message:'Explain RAG tenant permissions',history:[]})[0].content;
  assert.match(text,/permitted documents/i);
  assert.match(text,/CURRENT PAGE:/);
  assert.match(text,/Mentora AI/);
  assert.doesNotMatch(text,/MOCK INTERVIEW MODE/);
});
