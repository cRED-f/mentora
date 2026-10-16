import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { chatHandler, composeMessages, sanitizeHistory } from '../src/lib/chat.js';
import { courses, totalLessons, getCourse, getLesson, retrieveLessons } from '../src/lib/courses.js';
const backup = { ...process.env };
let originalFetch = globalThis.fetch;
function request(body, origin = 'http://localhost:4321') {return new Request('http://localhost:4321/api/chat/', { method:'POST', headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(body)});}
beforeEach(() => { process.env.NINEROUTER_API_KEY='test-key';process.env.NINEROUTER_MODEL='mock/model';process.env.NINEROUTER_BASE_URL='http://127.0.0.1:20128/v1';process.env.ALLOWED_ORIGINS='http://localhost:4321';process.env.CHAT_RATE_LIMIT='20'; });
afterEach(() => { globalThis.fetch = originalFetch; for(const k of ['NINEROUTER_API_KEY','NINEROUTER_MODEL','NINEROUTER_BASE_URL','ALLOWED_ORIGINS','CHAT_RATE_LIMIT']) { if (backup[k]===undefined) delete process.env[k];else process.env[k]=backup[k]; }});
test('all 11 imported courses and 234 lessons are present with six sections', () => {assert.equal(courses.length,11);assert.equal(totalLessons,234);for (const c of courses) for (const l of c.lessons) assert.deepEqual(l.sections.map(s=>s.letter),['A','B','C','D','E','F']);});
test('lesson lookup is stable and search is grounded',()=>{assert.match(getLesson('agents','1').title,/AI agent/);assert.equal(getCourse('rag').lessons.length,42);assert.ok(retrieveLessons('flashattention','advanced-transformers','6')[0]);});
test('system context contains actual current lesson and a valid link',()=>{const m=composeMessages({course:'rag',lesson:'1',message:'Explain RAG',history:[]}); assert.equal(m[0].role,'system');assert.match(m[0].content,/Retrieval-Augmented Generation/);assert.match(m[0].content,/\/learn\/rag\/1\//);assert.equal(m.at(-1).content,'Explain RAG');});
test('history is restricted to supported roles and bounded size',()=>{const h=sanitizeHistory([{role:'system',content:'evil'},{role:'user',content:'x'.repeat(5000)},{role:'tool',content:'x'}]);assert.equal(h.length,1);assert.equal(h[0].content.length,2000);});
test('missing key produces clear 503',async()=>{delete process.env.NINEROUTER_API_KEY;const r=await chatHandler(request({message:'How does RAG work?'}),'missing-key');assert.equal(r.status,503); assert.match((await r.json()).error,/not configured/);});
test('origin allowlist rejects foreign browser origin',async()=>{const r=await chatHandler(request({message:'Hi'},'https://malicious.example'),'bad-origin');assert.equal(r.status,403);});
test('invalid course and lesson are rejected',async()=>{assert.equal((await chatHandler(request({message:'hi',course:'bad'}),'bad-course')).status,400);assert.equal((await chatHandler(request({message:'hi',course:'rag',lesson:'888'}),'bad-lesson')).status,400);});
test('empty and too-long messages are rejected',async()=>{assert.equal((await chatHandler(request({message:'   '}),'bad-empty')).status,400);assert.equal((await chatHandler(request({message:'x'.repeat(2001)}),'bad-long')).status,400);});
test('streams model tokens from OpenAI-compatible 9router',async()=>{
  let args;
  globalThis.fetch=async(url,options)=>{args={url,options};return new Response(new ReadableStream({start(out){out.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\ndata: [DONE]\n\n'));out.close();}}),{status:200,headers:{'content-type':'text/event-stream'}})};
  const r=await chatHandler(request({message:'Explain embeddings',course:'tokenization-embeddings',lesson:'1'}),'stream-success');assert.equal(r.status,200);assert.match(await r.text(),/Hello/); assert.equal(args.url.pathname,'/v1/chat/completions'); const payload=JSON.parse(args.options.body);assert.equal(payload.model,'mock/model'); assert.equal(payload.stream,true); assert.equal(args.options.headers.Authorization,'Bearer test-key');
});
test('rejects upstream authorization errors without leaking upstream response',async()=>{globalThis.fetch=async()=>new Response('secret credential here',{status:401});const r=await chatHandler(request({message:'Hello'}),'auth-error');assert.equal(r.status,502);assert.doesNotMatch((await r.json()).error,/secret credential/);});
test('handles gateway connection errors',async()=>{globalThis.fetch=async()=>{throw Error('connection refused')};const r=await chatHandler(request({message:'Hello'}),'conn-error');assert.equal(r.status,502);assert.match((await r.json()).error,/Cannot reach/);});
