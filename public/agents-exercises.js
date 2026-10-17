/* Deterministic, browser-only Agent Engineering labs. Never dispatch actions. */
(() => {
const root=document.querySelector('[data-agent-lab]');if(!root)return;
const q=(s)=>root.querySelector(s), set=(s,value)=>{const n=q(s);if(n)n.textContent=String(value)};
const watch=(selectors,calculate)=>{for(const sel of selectors){const node=q(sel); if(node){node.addEventListener('input',calculate);node.addEventListener('change',calculate)}}calculate()};
switch(root.dataset.agentLab){
case 'loop': watch(['[data-max-steps]','[data-repeat-limit]'],()=>{
 const cap=+q('[data-max-steps]').value,rep=+q('[data-repeat-limit]').value,steps=Math.min(cap,rep);
 set('[data-max-step-value]',cap);set('[data-repeat-limit-value]',rep);set('[data-loop-steps]',steps);
 set('[data-loop-stop]',rep<=cap?'Cycle breaker':'Step cap');
 const trace=q('[data-loop-trace]');trace.replaceChildren();for(let i=0;i<steps;i++){const t=document.createElement('span');t.textContent=`Try ${i+1}`;trace.append(t)}
 set('[data-loop-explanation]',`After ${steps} repeated identical actions with unchanged observations, the controller stops at the ${rep<=cap?'cycle breaker':'global step cap'}. A real detector needs stable action and state fingerprints.`);
 });break;
case 'memory': watch(['[data-memory-range]','[data-memory-pin]'],()=>{
 const keep=+q('[data-memory-range]').value/100,pin=q('[data-memory-pin]').checked;
 const total=pin?180+Math.round(820*keep):Math.round(1000*keep);
 set('[data-memory-value]',`${Math.round(keep*100)}%`);set('[data-memory-tokens]',`${total.toLocaleString()} tokens`);set('[data-memory-integrity]',pin?'Preserved':'At risk');
 set('[data-memory-note]',pin?'Exact IDs, approvals and active goals remain pinned even when optional observations shrink.':'Without separate pinned state, a lossy summary may discard required IDs or approvals; smaller context is not automatically correct.');
 });break;
case 'permissions': watch(['[data-permission-action]','[data-permission-role]','[data-permission-approve]'],()=>{
 const a=q('[data-permission-action]').value,role=q('[data-permission-role]').value,approved=q('[data-permission-approve]').checked;
 const allowed=a==='read'||(a==='write'&&role!=='viewer'&&approved)||(a==='delete'&&role==='admin'&&approved);
 set('[data-permission-result]',allowed?'Allowed':'Blocked');
 set('[data-permission-reason]',a==='egress'?'External exfiltration destinations are not on the allowlist regardless of role or approval.':allowed?'The illustrative backend policy permits this exact operation. A production app must still validate object ownership and scope.':'The backend rejects this proposal based on role and/or missing authenticated approval; prompt compliance is irrelevant.');
 });break;
case 'graph': watch(['[data-graph-check]','[data-graph-approved]'],()=>{
 const pass=q('[data-graph-check]').value==='passed',ok=q('[data-graph-approved]').checked;
 set('[data-graph-result]',pass&&ok?'Ready':'Blocked');set('[data-graph-note]',!pass?'Dependency gate: release cannot run until tests are explicitly passed.':!ok?'An authenticated approval record must exist for the current release artifact.':'Both gates passed; the next real action would still validate identity and artifact version.');
 });break;
case 'tools': watch(['[data-tool-case]'],()=>{
 const c=q('[data-tool-case]').value;
 const status={valid:['Allowed (illustration)','Name, schema, business rules and record ownership match. A real side effect would still require policy and confirmation.'],negative:['Schema rejected','amount_usd must be positive; JSON type alone is not enough.'],wrong:['Forbidden','B-99 belongs to another customer; ownership is enforced after type parsing.'],missing:['Schema rejected','order_id is a required string field.'],unknown:['Unknown tool','Only exact allowlisted tool IDs may be dispatched.']};
 set('[data-tool-result]',status[c][0]);set('[data-tool-reason]',status[c][1]);
 });break;
case 'parallel': watch(['[data-parallel-overhead]','[data-parallel-independent]'],()=>{
 const overhead=+q('[data-parallel-overhead]').value,independent=q('[data-parallel-independent]').value==='yes';const total=(independent?650:1050)+overhead;
 set('[data-parallel-overhead-value]',`${overhead} ms`);set('[data-parallel-total]',`${total.toLocaleString()} ms`);set('[data-parallel-gain]',`${(1050-total).toLocaleString()} ms`);
 set('[data-parallel-note]',independent?'Illustrative parallel critical path = max(400,650) + merge overhead. Additional worker tokens are not included.':'Worker B depends on A; serial execution plus coordination overhead gives no latency gain.');
 });break;
case 'protocol': watch(['[data-protocol-type]'],()=>{
 const v=q('[data-protocol-type]').value;const examples={
 function:['model → {name:"search", arguments:{query:"..."}} → host validator','Model-facing operation request; host still decides whether to execute.'],
 mcp:['host/client → MCP tools/list → MCP tools/call → server','Host–server integration protocol. Standard connectivity does not grant tool permissions.'],
 skill:['SKILL.md → instructions + supporting files → authorized tools','Reusable guidance for a procedure, not the executor or authorization layer.'],
 okf:['knowledge/metrics.md → YAML frontmatter + business rules → model context','Portable business-knowledge documentation, not an executable function or MCP server.']};
 set('[data-protocol-preview]',examples[v][0]);set('[data-protocol-note]',examples[v][1]);
 });break;
case 'recovery':watch(['[data-recovery-state]','[data-recovery-key]'],()=>{
 const s=q('[data-recovery-state]').value,key=q('[data-recovery-key]').checked;
 const act=s==='committed'?'Do not retry':s==='unknown'?'Reconcile':key?'Bounded retry':'Manual review';
 const reason=s==='committed'?'A verified receipt means the effect already occurred.':s==='unknown'?'First check durable transaction status by request ID; timeout is not evidence of failure.':key?'The backend confirmed rejection; a retry with the same idempotency key may be safe under the provider contract.':'Without a deduplication key, a new write may duplicate the effect; request review.';
 set('[data-recovery-action]',act);set('[data-recovery-note]',reason);
 });break;
case 'evaluation':watch(['[data-eval-artifact]','[data-eval-violation]'],()=>{
 const pass=q('[data-eval-artifact]').checked,violation=q('[data-eval-violation]').checked;
 set('[data-eval-result]',pass&&!violation?'Pass':'Fail');set('[data-eval-note]',violation?'A forbidden side effect invalidates the run even if the requested artifact exists.':pass?'The executable acceptance test passed and the policy guard reported no violations.':'The final artifact does not satisfy the fixture even if the model reported success.');
 });break;
case 'cost':watch(['[data-cost-calls]','[data-cost-prefix]'],()=>{
 const n=+q('[data-cost-calls]').value,prefix=+q('[data-cost-prefix]').value;
 // Prompt on each call includes the fixed prefix + 500 accumulated tokens per turn.
 const input=n*prefix+500*n*(n+1)/2,output=200*n,cost=(input*2+output*8)/1e6;
 set('[data-cost-calls-value]',n);set('[data-cost-prefix-value]',`${prefix.toLocaleString()} tokens`);
 set('[data-cost-input]',input.toLocaleString());set('[data-cost-output]',output.toLocaleString());set('[data-cost-total]',`$${cost.toFixed(4)}`);
 set('[data-cost-note]',`Input = calls × prefix + 500 × calls × (calls+1)/2; output = 200 × calls. Actual cache discounts, tokenization and provider bills vary.`);
 });break;
}
})();
