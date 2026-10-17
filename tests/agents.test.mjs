import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import original from '../src/data/courses.json' with { type:'json' };
import {courses} from '../src/lib/courses.js';
import {courseHasFoundations,foundationsGuideFor} from '../src/lib/foundations.js';
import {getAgentsGuide,AGENTS_GUIDE_COUNT} from '../src/data/agents-path.js';
import {AGENT_LAB_GROUPS,agentLabType,agentLessonHasLab} from '../src/data/agents-labs.js';
import {agentsMath} from '../src/data/agents-math.js';
import {composeMessages} from '../src/lib/chat.js';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const agents=courses.find(c=>c.slug==='agents');

test('All 54 Agents topics have complete, distinct foundations, mechanisms and knowledge checks',()=>{
  assert.equal(AGENTS_GUIDE_COUNT,54);
  assert.equal(courseHasFoundations('agents'),true);
  assert.deepEqual(agents.lessons.map(l=>l.id),Array.from({length:54},(_,i)=>i+1));
  const blurbs=new Set(), flows=new Set(), cases=new Set();
  for(const lesson of agents.lessons){
    const g=foundationsGuideFor('agents',lesson.id);
    assert.ok(g,`guide ${lesson.id}`);
    assert.ok(g.plain.length>190,`plain too short ${lesson.id}`);
    assert.ok(g.mechanism.length>155,`data flow too short ${lesson.id}`);
    assert.equal(g.goals.length,3);
    assert.equal(g.concepts.length,3);
    for(const [name,short,advanced] of g.concepts)assert.ok(name.length>2 && short.length>25 && advanced.length>90,`incomplete concept ${lesson.id} / ${name}`);
    assert.equal(g.views.length,2);
    for(const view of g.views){assert.equal(view.steps.length,4);for(const [step,desc] of view.steps)assert.ok(step.length>2 && desc.length>36,`incomplete diagram ${lesson.id} / ${step}`);}
    assert.equal(g.example.steps.length,4);
    for(const step of g.example.steps)assert.ok(step.length>65,`case step too short ${lesson.id}`);
    assert.ok(g.precision.length>100&&g.engineering.length>120);
    assert.equal(g.checkpoint.options.length,3);
    assert.equal(new Set(g.checkpoint.options).size,3);
    assert.ok(g.checkpoint.options[g.checkpoint.correct].length>40);
    assert.ok(g.checkpoint.why.length>90);
    assert.ok(g.resources.every(([label,url])=>label.length>5&&url.startsWith('https://')));
    blurbs.add(g.plain);flows.add(g.views[0].steps.map(x=>x[0]).join('|'));cases.add(g.example.steps.join('|'));
  }
  assert.equal(blurbs.size,54);
  assert.equal(cases.size,54);
  assert.ok(flows.size>45);
});

test('Interviews retain the original technical B/E/F content; A has five applied questions; D has topic-specific pressure rubric',()=>{
  const base=original.find(c=>c.slug==='agents');
  for(const l of agents.lessons){
    assert.deepEqual(l.sections.map(x=>x.letter),['A','B','C','D','E','F']);
    assert.equal((l.sections[0].html.match(/<li>/g)||[]).length,5,`A questions for lesson ${l.id}`);
    assert.ok(l.sections[1].text.length>1200);
    assert.ok(l.sections[2].text.length>250);
    assert.match(l.sections[3].html,/A strong response must include/);
    assert.ok(l.sections[4].text.length>1000);
    for(const key of ['B','C','E','F']){
      const orig=base.lessons.find(x=>x.id===l.id).sections.find(x=>x.letter===key);
      assert.deepEqual(l.sections.find(x=>x.letter===key),orig,`original lesson ${l.id} section ${key} modified`);
    }
  }
});

test('Every Agents lesson has one of ten unique exercise types and animation wiring is retained',()=>{
  assert.equal(Object.keys(AGENT_LAB_GROUPS).length,10);
  const ids=Object.values(AGENT_LAB_GROUPS).flat();
  assert.equal(ids.length,54);assert.equal(new Set(ids).size,54);
  for(let id=1;id<=54;id++)assert.ok(agentLessonHasLab(id)&&agentLabType(id));
  assert.equal(agentLessonHasLab(55),false);
  const component=read('../src/components/AgentsExercises.astro');
  const script=read('../public/agents-exercises.js');
  const path=read('../src/components/FoundationLearningPath.astro');
  const lesson=read('../src/pages/learn/[course]/[lesson].astro');
  const overview=read('../src/pages/course/[slug].astro');
  for(const group of Object.keys(AGENT_LAB_GROUPS)){
    assert.ok(component.includes(`lab === '${group}'`),`missing lab panel ${group}`);
    assert.ok(script.includes(`case '${group}':`),`missing lab script ${group}`);
  }
  for(const phrase of ['agentLessonHasLab','AgentsMath lessonId={lesson.id}','AgentsExercises lessonId={lesson.id}','/agents-exercises.js','id="agents-workbench"'])
    assert.ok((lesson+component).includes(phrase),`missing integration ${phrase}`);
  assert.match(path,/data-foundation-play/);assert.match(path,/data-foundation-prev/);
  assert.match(read('../public/foundations-path.js'),/prefers-reduced-motion: reduce/);
  assert.match(overview,/54 animated mechanisms/);
  assert.match(read('../src/styles/foundations-path.css'),/agents-lab/);
});

test('Math explanations are accessible, qualified and use LaTeX and MathML',()=>{
  assert.ok(Object.keys(agentsMath).length>=9);
  for(const [id,e] of Object.entries(agentsMath)){
    assert.ok(+id>=1&&+id<=54);
    assert.match(e.latex,/^\$\$[\s\S]*\$\$$/);
    assert.ok(e.mathml.length>70&&e.explanation.length>90&&e.assumption.length>60);
    assert.doesNotMatch(e.mathml,/<script|onerror|onclick/i);
  }
  assert.match(agentsMath[38].latex,/exp/);
  assert.match(agentsMath[43].latex,/reserved/);
});

test('Important user-supplied resources are attached to the correct lesson',()=>{
  const expected={1:'youtube.com',3:'harness-engineering',5:'react-agent',6:'plan-and-execute',7:'function-calling',11:'multi-agent',13:'model-context-protocol',18:'ai-agent-loop',20:'context-compaction',22:'graph-engineering',24:'agent-skills',25:'agent-evaluation',27:'prompt-injection',38:'decoding-sakana-fugu',40:'linkedin.com',50:'computer-use-agents',51:'browser-agents',52:'langchain',53:'langgraph',54:'open-knowledge-format'};
  for(const [id,needle] of Object.entries(expected))assert.ok(getAgentsGuide(id).resources.some(([,url])=>url.includes(needle)),`Resource missing lesson ${id}`);
  assert.equal(getAgentsGuide(4).resources.length,2);
  assert.equal(getAgentsGuide(13).resources.length,3);
});

test('Tutor uses Agents course foundation grounding and the same senior interview training protocol',()=>{
  const input={course:'agents',lesson:'43',message:'Explain agent budgets',history:[]};
  const teach=composeMessages(input)[0].content;
  assert.match(teach,/BEGINNER EXPLANATION:/);
  assert.match(teach,/KEY TERMS:/);
  assert.match(teach,/A five applied interviewer questions/);
  assert.match(teach,/INTERACTIVE LOOP/);
  assert.match(teach,/atomic reservations/);
  const mock=composeMessages({...input,mode:'mock'})[0].content;
  assert.match(mock,/MOCK INTERVIEW MODE/);
});

test('All prior courses and count are unchanged by the Agents update',()=>{
  assert.deepEqual(courses.map(c=>[c.slug,c.lessons.length]),original.map(c=>[c.slug,c.lessons.length]));
  assert.ok(courses.find(c=>c.slug==='rag').lessons[0].sections[0].html.includes('<ol>'));
  assert.ok(courses.find(c=>c.slug==='prompt-engineering').lessons[0].sections[0].html.includes('<ol>'));
});
