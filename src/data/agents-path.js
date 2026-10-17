/**
 * Beginner-first, topic-specific guide for all 54 AI Agents lessons.
 * Diagrams and incidents are authored teaching sketches, not live model traces.
 * Technical A–F content stays in courses.json and is augmented separately.
 */
// Each record: intuition, three conceptual primitives, four mechanism stages,
// failure symptom, failure cause, mitigation, worked incident, measurable validation,
// alternative / boundary. The curriculum is edited as data, not 54 page templates.
const S = {
1: [
 'An AI agent is an application that repeatedly observes a task state, lets a model choose a next step, executes permitted actions through ordinary code, and feeds results back. A single LLM call transforms input to output once; an agent may continue until a verified result, a limit, or a human decision stops it.',
 ['Goal|A task-level objective with a clear definition of done','Policy|A model proposes actions but the host application governs permissions','Observation|A tool response or environment state used for the next decision'],
 ['Define goal|Specify task, success criteria, available tools and limits','Decide|The model proposes an answer or a typed tool call','Execute|The harness validates and runs approved actions','Observe and stop|Return the result to the model; verify completion or halt'],
 'The agent reports success after only proposing an action.','Tool output is confused with an actually committed state change.','Verify observable effects and separate planned, executed and confirmed states.','A billing agent claims a refund was issued even though the payment API timed out.','Track verified-task success, unsafe calls, retries and total cost per completed task.','Use a single inference or a fixed workflow when no adaptive tool loop is necessary.'
],
2: [
 'Agent memory is application-managed information retained across turns or sessions, not magical permanent recall inside model weights. Engineers choose what to write, when to retrieve it, how long it remains valid and which user can access it; forgetting and correcting memories matter as much as storing them.',
 ['Working state|Recent messages, current tool results and the active plan','Persistent store|Durable facts or episodes indexed outside the model context','Recall policy|When and which memories are read into the next prompt'],
 ['Capture|Identify a durable, permitted fact or completed episode','Validate|Assign owner, scope, source, timestamp and retention rules','Store and retrieve|Query under tenant ACLs and rank for the active task','Use and correct|Inject selected evidence, then update or delete stale entries'],
 'An agent uses another customer’s remembered preference.','Vector similarity was applied without tenant authorization or provenance checks.','Apply owner and access filters before memory retrieval and validate the returned record.','A travel assistant imports a frequent-flyer preference into the wrong user session.','Measure memory attribution, permission violations, stale recall and helpfulness on holdout tasks.','Not everything deserves persistent memory; often ephemeral task state is safer.'
],
3: [
 'Harness engineering creates the deterministic control layer around a model. The harness assembles context, exposes validated tools, enforces access and budgets, persists state, recovers from errors and evaluates outcomes. Improving a model cannot compensate for missing transaction boundaries or unsafe execution privileges.',
 ['Model boundary|The model proposes text and tool arguments, not trusted side effects','Controller|Application code that validates, dispatches and observes actions','Evidence loop|Traces and test fixtures showing what changed in reality'],
 ['Prepare|Pin instructions, identity, scoped context and tool contracts','Validate|Parse typed decisions and authorize each proposed action','Execute|Run bounded tools with timeouts, audit and idempotency','Recover|Persist observations, apply retries or halt, and score the outcome'],
 'A coding agent overwrites files outside the repository.','The shell tool can write arbitrary paths even though prompts say stay in scope.','Enforce filesystem sandbox boundaries and test tool permissions directly.','A patch-writing agent calls a command with a parent-directory traversal.','Compare task pass rate, forbidden side effects, trace completeness and recovery time.','Harness quality can determine reliability even when underlying model accuracy stays constant.'
],
4: [
 'For coding agents, the model supplies reasoning and code proposals while the harness controls repository visibility, search, patching, execution, feedback and rollback. There is no universal winner: evaluate model-only, harness-only and combined changes on the same task suite, cost and tool budget.',
 ['Model ability|Plans, infers bugs and proposes patches','Harness affordances|File search, scoped edits, terminal tools and test execution','Interaction quality|How observations and validation feedback support correction'],
 ['Locate|Search files and identify the relevant change surface','Patch|Generate a bounded diff rather than unrestricted replacement','Test|Run focused tests in a restricted environment','Review|Inspect failures, replan and verify the final diff'],
 'The model writes plausible code but never runs the failing test.','The harness has no execution or test-feedback loop.','Add safe test execution, parse failures and allow bounded repair iterations.','An issue-fixing agent produces a syntactically valid patch that breaks integration tests.','Evaluate exact same tasks with fixed budgets, test pass rate, time and security violations.','A stronger model and better harness can be complementary; benchmark the interaction.'
],
5: [
 'ReAct interleaves decision-making with external actions and observations. The model chooses a tool, application code executes it, and the returned evidence changes the next decision. The central engineering task is controlling the loop: validate calls, restrict tool observations and stop when no further tool use is justified.',
 ['Action|A tool invocation with a concrete name and validated arguments','Observation|Untrusted response content returned by the tool','Termination|A verified result or explicit stop condition, not endless reasoning'],
 ['Observe need|Read user goal and current environment evidence','Select action|Choose a tool and construct schema-valid inputs','Run and observe|Call via controller and receive a bounded result','Continue or finish|Update state, check progress and stop or repeat'],
 'A web-search agent repeats the same query indefinitely.','Nothing detects unchanged observation and repeated tool arguments.','Track action signatures and progress; enforce maximum attempts and a no-progress exit.','A research assistant keeps reopening the same failed URL on every turn.','Track repeated-action rate, evidence gain, stop correctness and tool cost.','ReAct is not required for a deterministic, known multi-step data pipeline.'
],
6: [
 'Plan-and-Execute separates high-level decomposition from step execution. A planner produces an inspectable sequence or dependency graph; executors perform individual steps with tools. The plan must be revised when observations invalidate assumptions, rather than followed blindly.',
 ['Plan|Ordered or dependent tasks with acceptance criteria','Executor|Runs the next authorized step and returns evidence','Replanner|Revisits unresolved dependencies after failures or changes'],
 ['Decompose|Convert an outcome into steps and required evidence','Schedule|Choose ready steps based on dependencies and permissions','Execute|Complete a step using bounded calls and record artifacts','Replan and verify|Update dependencies and validate full task completion'],
 'The agent keeps running an outdated plan after a dependency fails.','The planner assumes earlier steps completed successfully despite tool errors.','Persist per-step status and invalidate dependent tasks on failure.','A deployment agent attempts traffic cutover even though smoke tests failed.','Measure dependency violations, successful recovery, wasted calls and end-state quality.','A simple loop may be cheaper for short tasks with no useful decomposition.'
],
7: [
 'Function calling is a structured way for a model to request an application-defined operation. The model does not execute the function itself: the host parses arguments, enforces schema and authorization, runs the function, and returns a result as a new observation.',
 ['Tool schema|Function name, parameters and typed validation constraints','Dispatcher|Maps the proposed call to real permitted code','Result channel|Feeds output or explicit errors back for later decisions'],
 ['Advertise|Provide only relevant tool names and input schemas','Propose|Model emits tool name and serialized arguments','Validate and run|Server enforces types, policy, timeout and idempotency','Observe|Return safe result; model chooses follow-up or answer'],
 'The model calls transfer_funds with a negative amount or wrong account.','A schema-valid shape is mistaken for business-valid or authorized input.','Enforce amount constraints, account ownership and approval in the backend.','A finance assistant proposes an apparently valid transfer with a foreign user ID.','Track invalid arguments, unauthorized attempts, dispatch success and business outcomes.','Tool output is untrusted data even if it arrived from a trusted API.'
],
8: [
 'Structured output asks the model to return data matching a shape; function calling additionally requests execution of an operation by the host. They can use similar JSON schemas, but producing a plan object is not the same as authorizing and performing a side effect.',
 ['Structured result|Typed content returned for parsing or storage','Tool intent|A requested callable operation with arguments','Execution policy|Independent approval and validation before side effects'],
 ['Define contract|Create output schema or tool parameter schema','Generate|Request a typed classification or callable intent','Validate|Parse JSON and check semantics and permissions','Apply|Store content or dispatch a tool only on the appropriate branch'],
 'A parser treats an LLM JSON field marked approved as user approval.','A descriptive output is elevated into execution authority.','Keep approvals in authenticated backend state, never inside generated JSON.','A purchasing assistant emits {approved:true} during a product comparison.','Test parse validity, false actions, approval bypasses and clear rejection paths.','Use structured output for information extraction; use tool calls only when actual work is required.'
],
9: [
 'Good agent tools are narrow, observable operations with descriptive contracts. Their schema explains what arguments mean, but application code must still enforce domain validation, scope, credentials, idempotency and limits. Broad shell or database tools create unnecessarily large authority surfaces.',
 ['Single responsibility|Each tool has a clearly bounded effect','Typed inputs|Required fields, enums, units and error conventions','Policy gate|Scope and permission checks independent of prompting'],
 ['Define|Choose a narrow operation and explicit argument types','Constrain|Validate object ownership, ranges and call permissions','Execute|Run with timeouts, scoped credentials and audit trail','Return|Provide concise structured results and actionable error codes'],
 'An apparently read-only utility silently performs writes.','The tool’s declared semantics disagree with its actual side effects.','Review implementations, separate read/write privileges and test with adversarial inputs.','A search_documents function triggers an unexpected index rebuild with write access.','Measure argument-validity rate, policy rejections, tool misuse and completion.','Prefer three safe explicit tools to one unlimited general-purpose admin command.'
],
10: [
 'Tool selection is a decision under uncertainty: answer directly only when current context is sufficient and risk is low; call a tool when fresh, authoritative or action-dependent evidence is needed. Model-proposed confidence is not a reliable authorization or factuality guarantee.',
 ['Need signal|Does task require state external to the prompt?','Tool cost|Additional latency, tokens, money and potential failure','Decision gate|Rules requiring verification or forbidding unsafe actions'],
 ['Classify task|Separate reasoning, live information and external side effects','Assess evidence|Check whether required facts are available and current','Choose branch|Answer, retrieve, request approval or decline','Verify|Confirm evidence and avoid unsupported success claims'],
 'The agent answers an account balance question from old conversational memory.','The model fails to recognize the need for live authorized state.','Require the account tool for balances and date-stamp factual observations.','A support agent guesses refund status without querying payment records.','Measure unnecessary calls, missing required calls and factual error severity.','Strict routing is better than learned discretion for high-risk mandatory checks.'
],
11: [
 'A single agent runs one main decision policy over a shared task state. A multi-agent system divides work across independent specialist policies or roles with explicit handoff. Parallel workers can help on separable tasks but introduce coordination, conflicting state, message and token overhead.',
 ['Single controller|One policy owns decisions and global task state','Specialist worker|A bounded subtask with its own context and tools','Coordinator|Routes work, merges evidence and resolves conflicts'],
 ['Classify|Find separable tasks and actual specialist boundaries','Delegate|Assign scoped goals, tools, budgets and output contracts','Execute|Run workers serially or concurrently as dependencies permit','Integrate|Verify outputs, reconcile conflicts and record provenance'],
 'Two agents edit the same file and overwrite each other.','There is no ownership protocol or deterministic merge authority.','Use isolated branches, conflict detection and a single commit owner.','A team of code agents concurrently modifies the same shared interface.','Track merge conflicts, coordination tokens, critical path and task quality.','One well-tooled agent often beats an unnecessary team on tightly coupled tasks.'
],
12: [
 'Multi-agent designs fail when delegation cost exceeds decomposition benefit: tasks overlap, context is duplicated, responsibility becomes unclear, and integration creates new errors. Compare against a single-agent baseline before adding concurrency or roles.',
 ['Delegation overhead|Extra prompts, messages, tool catalogs and tokens','Dependency coupling|Workers cannot finish until shared decisions are resolved','Merge ownership|A single arbiter must reconcile or reject incompatible work'],
 ['Map dependencies|Identify independent work versus shared mutable state','Estimate overhead|Count handoffs, context copies and integration steps','Pilot|Trial scoped workers with deterministic contracts','Compare|Use paired tasks to decide whether the extra topology helps'],
 'Adding three review agents raises cost and lowers final accuracy.','Specialists share the same weakness and approve each other’s mistakes.','Replace redundant delegation with independent tests and a single accountable reviewer.','A support ticket is passed among three agents without taking any action.','Measure handoffs per completion, p95 time, total spend and error correlation.','Parallelism helps only when independent work outweighs orchestration overhead.'
],
13: [
 'Model Context Protocol (MCP) defines a standard boundary between AI hosts or clients and external servers offering tools, resources and prompts. The host remains responsible for deciding which capabilities are exposed to the model and for authorization, trust and execution policy.',
 ['Host/client|Discovers and calls server capabilities on behalf of an agent','Server|Publishes tools, resources or reusable prompts','Protocol boundary|Versioned request/response contracts and auth expectations'],
 ['Discover|Client identifies server capabilities and compatible protocol version','List|Read tool schemas and resource descriptors','Call|Validate authorization, send an RPC and process errors','Present|Surface bounded results to model as untrusted evidence'],
 'Connecting an MCP server inadvertently exposes privileged tools.','Protocol interoperability is mistaken for trustworthy or authorized execution.','Approve server trust, scope tokens, filter tools and authorize each request.','An employee connects a document MCP server with access to executive records.','Audit capability exposure, auth failures, latency and cross-tenant retrieval attempts.','As of the 2026-07-28 specification, MCP has a stateless core; avoid outdated mandatory session-handshake claims.'
],
14: [
 'Function calling is typically the model-facing schema and response for requesting a tool. MCP is a host-to-server interoperability protocol for discovering and invoking capabilities. An app can surface MCP tools as model function calls, but MCP does not replace the host policy engine.',
 ['Model-facing call|Selected tool name and arguments produced by a model','MCP RPC|Wire-level request to an external capability provider','Bridge|Host translates model requests to server calls and validates result'],
 ['Connect|Host communicates with a chosen MCP server','Discover|Translate permitted server tools into model-usable definitions','Dispatch|Check identity and arguments before RPC invocation','Observe|Return bounded server output to the agent'],
 'The bridge accepts any remotely advertised tool without scrutiny.','Dynamic capability discovery bypasses allowlists and per-call policy.','Apply tool catalog filtering and per-request authorization after discovery.','A malicious plugin advertises a send_secrets tool in its metadata.','Test unexpected tool exposure, credentials scoping and malicious tool descriptions.','MCP standardizes integration; function calling describes a model-to-host request.'
],
15: [
 'Subagents are scoped workers delegated by a parent agent. Each receives a focused goal, limited context, a tool budget and a return contract; the parent integrates their outputs. Subagents are useful for bounded independent research, but not free independent minds with automatically shared state.',
 ['Delegation envelope|Task objective, scope, budget and permissions','Worker context|Subset of evidence needed for the subtask','Return artifact|Evidence and result for parent verification'],
 ['Split|Identify tasks with clear input/output boundaries','Spawn|Pass minimal context, scoped tools and time limits','Execute|Run workers with traceable artifacts and failure states','Merge|Parent checks correctness, provenance and conflicts'],
 'A delegated worker performs unrelated privileged actions.','It inherits the parent’s full authority without task-specific scoping.','Issue narrowly scoped capability tokens for each subagent call.','A web researcher subagent attempts to delete local cache files.','Track escaped-scope actions, accepted worker artifacts and handoff tokens.','Avoid delegation when the worker cannot produce an independently checkable artifact.'
],
16: [
 'Short-term memory is active context, episodic memory records past experiences, and long-term semantic memory stores stable knowledge or preferences. These are architectural categories, not guaranteed components inside an LLM. Storage selection and retention should follow use case and sensitivity.',
 ['Working context|Immediate messages and observations within token limits','Episodic record|An event with time, outcome, provenance and task owner','Semantic memory|Durable normalized facts for later retrieval'],
 ['Capture|Tag message, episode or candidate stable fact','Classify|Pick retention and scope based on information type','Retrieve|Filter by owner, relevance, time and validity','Refresh|Replace contradicted facts and expire old entries'],
 'A stale past task result overrides the current source of truth.','Recency and provenance are absent from memory ranking.','Use freshness windows, source precedence and explicit memory corrections.','An operations agent reuses a six-month-old API endpoint from episodic memory.','Measure retrieval relevance, stale-memory rate, deletion propagation and leakage.','A summary is lossy; preserve critical execution records in durable state.'
],
17: [
 'Agent error recovery combines structured failures, retry classification, idempotency and checkpoints. A tool timeout is not proof that a write failed: retrying blindly may duplicate effects. The controller must distinguish known failure, unknown outcome and safe-to-retry operations.',
 ['Error taxonomy|Transient, permanent, validation, permission or ambiguous outcome','Idempotency key|Stable identifier preventing duplicate logical effects','Checkpoint|Durable progress saved before or after critical transitions'],
 ['Classify|Inspect code, timeout and whether side effects may have occurred','Reconcile|Check committed state or idempotency record','Retry or halt|Apply bounded backoff only to safe operations','Resume|Load checkpoint and verify the intended end state'],
 'A timed-out refund is submitted twice.','A blind retry treats unknown completion as failure.','Check transaction status by idempotency key before any repeat.','An agent receives no response after creating a customer support ticket.','Track duplicate side effects, recovery success, time-to-reconcile and false success.','Never allow the model alone to decide whether an irreversible call can be replayed.'
],
18: [
 'An agent loop is a state machine around model decisions, tool dispatch and observations. It must stop on verified completion, budget exhaustion, permission denial, repeated no-progress actions or human intervention—not merely because the model says it is done.',
 ['Iteration|One decide/act/observe cycle','Progress signal|New evidence, changed state or completed subgoal','Stop condition|Policy that halts on success, failure, limits or no progress'],
 ['Initialize|Load task state, limits and completion criteria','Step|Choose next action from current observation','Check|Update call counts, elapsed time, budget and state changes','Terminate|Finish on proven success or return recoverable failure'],
 'An agent loops after its tool repeatedly returns the same 404.','The loop lacks progress detection and a bounded failure exit.','Hash action/observation signatures and stop repeated no-progress states.','A repo agent alternates between two files without modifying either.','Measure wasted steps, no-progress detection accuracy and confirmed completions.','Hard budgets are mandatory even when learned stopping appears reliable.'
],
19: [
 'Context engineering designs the exact information presented to a model at each step. Instead of dumping an entire transcript, select task instructions, scoped tools, fresh observations, durable state and relevant references within a token budget; protect the boundary between evidence and instructions.',
 ['Context budget|Available tokens allocated among required information','Selection policy|Ranks recent, relevant and authoritative evidence','Trust boundary|Tool and retrieved text remain data, not commands'],
 ['Inventory|List task, identity, state, tools and candidate evidence','Prioritize|Reserve space for constraints and latest verified facts','Assemble|Order concise context with source labels and delimiters','Evaluate|Check answer/tool quality and dropped-critical-fact failures'],
 'An agent ignores the latest user constraint during a long workflow.','Context assembly truncates the requirement while retaining verbose logs.','Pin non-negotiable task constraints and use relevance-aware trimming.','A research agent forgets that all findings must cite customer-approved sources.','Track token use, context omission, instruction retention and grounded success.','More context does not automatically mean better context.'
],
20: [
 'Context compaction summarizes or structures older observations to fit a finite context window. Because summarization loses details, preserve irreversible facts, approvals, object IDs, unresolved tasks and links to raw trace records before removing transcript material.',
 ['Compression|Reduce historical text into shorter structured state','Invariant|Critical facts that must survive compaction exactly','Reference pointer|Link to original raw evidence for later verification'],
 ['Mark|Identify durable decisions and unresolved dependencies','Summarize|Compress low-value dialogue while retaining exact identifiers','Validate|Compare structured invariants against pre-compact state','Resume|Restore compact context and retrieve raw evidence on demand'],
 'An agent resumes after compaction with the wrong file path.','The summary paraphrases or drops an exact path and approval state.','Persist exact IDs and approval records outside generated summaries.','An overnight coding agent resumes work on a different branch after summarizing history.','Measure post-compaction task drift, recovered invariants and tokens saved.','Never compact away the authoritative execution ledger.'
],
21: [
 'Loop engineering makes repeated agent decisions safe and efficient. Engineers define the observation cadence, progress tests, finite budgets, retry strategies and stop contracts; the loop is runtime control logic, not just a sentence telling the model to keep trying.',
 ['Step bound|Maximum model or tool iterations for one job','Progress predicate|Deterministic evidence that work advanced','Recovery path|Actions allowed after failure or budget exhaustion'],
 ['Observe|Load current state and recent action signatures','Decide|Choose action under step and token budgets','Execute|Validate, run and record a new observation','Gate|Continue only if useful progress and budget remain'],
 'The system burns its entire allowance retrying an identical invalid call.','The controller never correlates error classes with repeated arguments.','Reject duplicate invalid calls and require changed parameters or escalation.','An integration agent keeps sending malformed requests to a third-party API.','Measure repeated errors, useful-steps ratio and stop correctness.','Graph control can be preferable when explicit branching is more important than flexibility.'
],
22: [
 'Graph engineering models a workflow as named nodes, conditional edges and durable state transitions. It makes approval, parallel branches, retries, checkpoints and error routes explicit. A graph is valuable when deterministic control is required, but can add complexity to trivial single-turn tasks.',
 ['Node|Typed unit of work with input/output contract','Edge|Fixed or conditional transition between nodes','Graph state|Versioned data persisted across steps and resumptions'],
 ['Declare|Define nodes, schema and legal transitions','Route|Evaluate conditional edges from state, not vague promises','Checkpoint|Persist state before waits and costly side effects','Resume|Follow next valid edge, recover or terminate'],
 'A resumed workflow skips a required approval node.','The checkpoint does not persist authorization or graph version.','Persist approval IDs and versioned state; validate transitions on resume.','A customer refund workflow resumes after an overnight pause and jumps to payment.','Track illegal transitions, replay accuracy, checkpoint recovery and execution cost.','A straight function pipeline is simpler when there are no branches or cycles.'
],
23: [
 'Agents communicate through structured messages, shared artifacts, event streams or handoff channels. The difficult part is not sending text: it is schema agreement, ownership, correlation IDs, freshness, retries and deciding which participant is accountable for final output.',
 ['Handoff contract|Goal, constraints, evidence, completion conditions','Message envelope|Sender, recipient, version, correlation and payload','Coordinator|Resolves duplicate, conflicting or late responses'],
 ['Define|Choose message schema and task ownership','Send|Publish bounded context and unique handoff ID','Acknowledge|Record delivery receipt, job progress updates and structured error details','Merge|Reject stale results and resolve conflicts against source state'],
 'A delayed worker overwrites a newer coordinator decision.','Handoffs have no revision number or stale-result rejection.','Use correlation IDs, state versions and optimistic concurrency checks.','Two research agents respond after a user changed the requested market.','Track stale merges, duplicate processing, delivery failures and overhead.','Shared databases need authorization and locking; a message bus alone cannot resolve conflicts.'
],
24: [
 'Agent skills package reusable operational instructions and supporting files so a system can load specialized procedures when relevant. A skill describes how to perform a task; a tool executes actions. Skills do not grant permissions or replace validated APIs.',
 ['Skill manifest|Discoverable instructions describing when and how to act','Lazy loading|Read specific references only when task needs them','Capability boundary|Backend enforces the privileges of any referenced tools'],
 ['Discover|Match the user task to installed skill metadata','Load|Read the skill and scoped reference files','Execute|Follow procedure through separately authorized tools','Verify|Use expected outputs and test fixtures to confirm the workflow'],
 'A downloaded skill instructs an agent to send credentials to a website.','Untrusted skill text is treated as privileged control instruction.','Review skill provenance, require explicit tool permissions and block secret egress.','A code-maintenance skill includes an unexpected network-upload step.','Measure skill selection precision, procedure success and unauthorized actions.','Skill text is guidance, not an executable or trusted security boundary.'
],
25: [
 'Evaluating agents requires checking final state and the path to it. A fluent answer can mask failed tools or unsafe behavior, so use executable task fixtures, holdout scenarios, tool-level traces, security assertions and repeat runs with fixed budgets.',
 ['Task fixture|Initial state, permissible actions and expected terminal state','Trajectory|Observable sequence of model decisions and tool effects','Success measure|Verified outcome, cost, latency and constraint satisfaction'],
 ['Define|Write task and deterministic pass/fail conditions','Run|Execute in isolated fixture with trace and bounded budget','Inspect|Evaluate end state and intermediate policy violations','Compare|Use paired tasks, repetitions and confidence intervals'],
 'The agent claims the task passed while the files remain unchanged.','An answer-only judge ignores the real workspace state.','Assert exact file diff, tests and permitted side effects in fixtures.','A coding agent says tests pass but never ran them.','Measure verified task pass@budget, tool errors, violation rate and total spend.','Model-as-judge ratings should supplement, never replace executable ground truth.'
],
26: [
 'Agent security is especially hard because model-chosen tools can change the world. Defend across identity, input trust, tool authorization, execution isolation, outbound network access, data minimization and approval for irreversible actions.',
 ['Least privilege|Provide the minimum authority needed per tool and task','Prompt injection boundary|Never treat web/email/document text as higher-priority commands','Side-effect gate|Confirm privileged actions with authenticated policy'],
 ['Classify|Label untrusted input and sensitive resources','Constrain|Scope credentials and validate tool arguments server-side','Execute|Use sandbox, egress allowlists and logged approvals','Audit|Detect abnormal actions and verify policy invariants'],
 'A website’s hidden text orders the agent to export a private file.','Untrusted content is promoted into a tool instruction.','Treat page content as evidence only; restrict file and network privileges.','A research agent opens a page that embeds a fake system message.','Test injection success, secret exposure, privilege escalation and prevention false positives.','A safety instruction alone cannot contain a side-effect-capable tool.'
],
27: [
 'Indirect prompt injection occurs when an adversary places instructions inside content an agent legitimately reads. The defense is architectural: classify the content as data, isolate secrets and privileged operations, authorize each requested action and disallow arbitrary exfiltration targets.',
 ['Entry point|Email body, page, document or tool response','Instruction crossing|Untrusted text falsely claims authority over the agent','Exfiltration path|Outbound tool destination that can carry private data'],
 ['Read|Fetch untrusted content and preserve its source label','Interpret|Extract task-relevant facts without executing embedded orders','Authorize|Check tool intent against user goal, secrets policy and destination','Block and log|Reject unauthorized egress and capture minimal audit evidence'],
 'The agent forwards a secret-bearing conversation to a URL in a web page.','The page instructs an outbound call and the controller permits any destination.','Use destination allowlists, secret scrubbing and per-tool authorization.','An HR assistant reads a resume with embedded instructions to email salary records.','Measure attack success on varied payloads, false blocks and leaked bytes.','Even perfect detection cannot replace hard egress and access controls.'
],
28: [
 'Reactive agents respond to an immediate request or observed event. Proactive agents run from schedules or watched conditions. Proactivity adds scheduling, state, notification relevance and consent requirements; running without a fresh chat message is not the same as unlimited autonomy.',
 ['Reactive trigger|User message or direct event','Proactive trigger|Timer or explicit condition watcher','Notification policy|Only send meaningful results with authorized context'],
 ['Register|Define condition, cadence, identity and permissions','Poll|Run bounded observation when timer/event fires','Decide|Check novelty and action or alert thresholds','Deliver|Notify, update state or silently skip with an audit record'],
 'An alerting agent sends the same warning every hour.','It does not deduplicate against prior observed state.','Persist last notification key and require new material evidence.','A flight-monitoring agent keeps repeating an unchanged departure time.','Track useful-alert rate, duplicates, missed triggers and polling cost.','Use an ordinary scheduled rule instead of an LLM when the condition is deterministic.'
],
29: [
 'Long-running agents spend tokens on repeated prompts, tool transcripts and unsuccessful retries. Treat token consumption as a bounded resource: limit iterations, summarize or retrieve relevant observations, use cheaper steps where appropriate and account for both input and output tokens.',
 ['Context growth|More observation history raises per-call input size','Budget meter|Track spent and reserved tokens, money and runtime','Selective recall|Keep compact task state and fetch raw detail on demand'],
 ['Profile|Attribute tokens to model calls, tools and transcript segments','Trim|Keep key state, compress logs and limit irrelevant tool responses','Route|Choose simpler model or rule for narrow deterministic subtasks','Enforce|Stop or escalate when remaining budget cannot cover next step'],
 'A 20-step agent resends a multi-megabyte tool response on every call.','History is appended without relevance filtering or compaction.','Persist raw output outside prompt and use bounded summaries or pointers.','A debugging agent repeatedly includes the entire server log.','Measure tokens per verified task, prompt-cache hit rate and quality at equal budget.','Lower token count is not a win if verified task success falls.'
],
30: [
 'Human-in-the-loop (HITL) inserts authenticated approval or review into a workflow before risky transitions. The agent may prepare a proposal, but must not execute protected actions until durable approval is recorded for that exact action and parameters.',
 ['Approval gate|Protected transition requiring a human decision','Immutable proposal|Exact operation, target, cost and version being approved','Resume token|Durable identifier used to continue after a decision'],
 ['Propose|Present precise action, affected resources and risk','Pause|Checkpoint state without executing the protected operation','Authorize|Verify user identity, unchanged parameters and approval scope','Resume|Execute once with idempotency key or record rejection'],
 'The agent changes the amount after approval but reuses an old approval flag.','Approval applies only to an earlier proposal, not current parameters.','Bind approval to operation hash and reject changed payloads.','A purchasing agent requests approval for $50 then submits $500.','Track approval mismatches, unauthorized writes and successful resumption.','Do not ask for approval on every read-only step; reserve HITL for meaningful risk.'
],
31: [
 'Guardrails for agents are layered gates on inputs, proposed actions, tool outputs and resulting state. Prompt-level refusals help but cannot replace authorization, execution isolation, type validation or a policy checked by the backend at the moment of action.',
 ['Input defense|Identify malicious or unsafe instructions in untrusted content','Action gate|Validate identity, scope, approval and allowed side effects','Output audit|Check sensitive content and confirmed outcomes before returning'],
 ['Inspect|Classify entry content and preserve trust labels','Propose|Generate tool intent under explicit task scope','Enforce|Backend rejects unapproved or unsafe operations','Observe|Inspect effects, log decision and trigger rollback when supported'],
 'The model obeys an internal prohibition but a direct tool call can still delete files.','Security exists only in instructions rather than the executor.','Apply allowlists and destructive-action confirmation in the tool adapter.','An assistant uses an admin database tool for a low-privilege user.','Measure escaped actions, false denials, latency overhead and policy coverage.','A single classifier score is not an authorization decision.'
],
32: [
 'Reflection agents critique and revise their own intermediate output, often using separate instructions or an external verifier. Iteration can catch local errors, but self-critique is correlated with the same model’s weaknesses and should be grounded in tests or independent evidence.',
 ['Draft|Candidate answer, plan or code artifact','Critic|Finds checkable faults using requirements or tools','Revision gate|Stops when tests pass or budget is exhausted'],
 ['Draft|Create initial artifact with acceptance criteria','Inspect|Run a critic and executable checks where possible','Revise|Apply a targeted repair to identified failures','Stop|Accept verified result or return unresolved issues'],
 'Two rounds of reflection amplify a confidently wrong assumption.','The critic uses the same unsupported narrative without independent tests.','Require external evidence or executable assertions before accepting revisions.','A coding agent revises stylistic comments while tests still fail.','Track actual defect removal, regressions, reflection calls and cost.','Reflection without new evidence can be expensive rephrasing.'
],
33: [
 'Tool-calling agents invoke predefined functions through controlled interfaces; code-generating agents create programs or scripts which may introduce unexpected side effects when executed. The security boundary changes from fixed capabilities to executing novel logic, so isolation and verification become essential.',
 ['Fixed tool|Known API with parameter validation and scoped effects','Generated code|Novel executable instructions requiring separate review','Sandbox|Constrained environment with filesystem/network/resource isolation'],
 ['Select|Prefer fixed tool if the operation already exists','Generate|Create code under explicit runtime and dependency constraints','Isolate|Execute with quotas, disabled privileged network and restricted mounts','Verify|Inspect artifacts, traces and test results before promotion'],
 'A generated script reads local credentials during data processing.','The executor inherits host environment and unrestricted filesystem mounts.','Run ephemeral sandboxes with no host secrets and allowlisted data.','An analytics agent runs a dynamically generated Python notebook on a shared server.','Measure sandbox escapes, code pass rate, resource consumption and review burden.','Fixed tools are simpler and safer when the domain actions are known in advance.'
],
34: [
 'Multimodal agents interpret text, images, audio or video and may produce text or media artifacts. Each input modality requires extraction, reference identity, quality checks and tool-specific permissions; a screenshot or transcript can carry the same untrusted instructions as a webpage.',
 ['Perception|Convert image/audio/video into model-usable evidence','Alignment|Associate text, regions, timestamps and source IDs','Action output|Perform tool effects or generate media under typed contracts'],
 ['Ingest|Record media type, owner, size and permissions','Perceive|Extract pixels, regions, speech or frames with uncertainty','Plan|Combine modality-specific evidence with the user goal','Verify|Check outputs against original source and action scope'],
 'A screenshot OCR misreads a decimal amount before a transaction.','Perception uncertainty is lost before the action planner.','Require confirmation for sensitive extracted values and preserve source crops.','An invoice-processing agent sees 1,000 as 10,000.','Track extraction accuracy, grounding to regions, latency and high-stakes corrections.','Modality support alone is not proof that the agent understands charts or layout.'
],
35: [
 'Complex workflows need authoritative state outside the language model. Use typed objects for task IDs, transitions, approval records, tool receipts and checkpoints; update them transactionally so retries and parallel branches do not corrupt progress.',
 ['State schema|Typed definition of lifecycle, owners, payloads and revisions','Checkpoint|Atomic persisted snapshot after a transition','Concurrency guard|Version check preventing stale writers overwriting state'],
 ['Initialize|Create typed task record with version and ownership','Transition|Validate legal next step and update under transaction','Persist|Write tool receipts and event IDs durably','Recover|Replay or resume without repeating committed side effects'],
 'An interrupted run restarts from the beginning and repeats a payment.','Only chat messages were saved; no durable transaction checkpoint exists.','Persist side-effect receipts and resume from last committed state.','A workflow server restarts during a refund approval.','Measure replay consistency, duplicate actions and recovery time.','A vector memory is not a substitute for transactional workflow state.'
],
36: [
 'A customer-support agent should resolve low-risk requests with authorized tools and escalate uncertain, policy-sensitive or high-stakes cases. Escalation is a controlled route with context, source evidence and a clear human owner, not an afterthought in the prompt.',
 ['Intent triage|Identify question, complaint, fraud or policy exception','Policy gate|Determine which requests can be auto-fulfilled','Escalation record|Preserve case summary, evidence and customer consent'],
 ['Authenticate|Check customer identity and request scope','Retrieve|Read current policy and case history','Decide|Answer, execute permitted operation or request human review','Handoff|Create auditable ticket with facts and unresolved issues'],
 'The chatbot promises a refund that exceeds its allowed threshold.','Intent confidence is used as authorization instead of explicit business policy.','Enforce refund limits and escalation rules in the service layer.','A customer asks for a large refund with disputed charge evidence.','Measure containment with correctness, escalation precision, CSAT and unauthorized refunds.','Avoid automating exceptions that require legal or discretionary human judgment.'
],
37: [
 'Agent orchestration coordinates models, tools and deterministic services across an end-to-end job. It schedules dependent steps, merges outputs, handles retries and applies shared state and policy. A strong orchestrator optimizes verified completion under latency, budget and risk limits.',
 ['Coordinator|Owns global task lifecycle and routing','Worker|Model or tool performing a bounded unit of work','Control plane|Enforces concurrency, permissions, budgets and retries'],
 ['Decompose|Map tasks and dependencies into an executable plan','Route|Choose available workers under capability and budget constraints','Collect|Receive versioned results and reconcile failures','Finalize|Verify aggregate outcome and commit approved changes'],
 'An orchestrator reports overall success despite one failed critical worker.','The finalization rule ignores required dependency completion.','Use explicit required-node success gates and structured failure propagation.','A report generator sends a report before the finance query returns.','Measure dependency compliance, critical-path latency and per-worker failure impact.','Start with sequential orchestration when concurrency adds little value.'
],
38: [
 'Sakana Fugu studies learned orchestration across a pool of language models. Its fast variant routes an input to one chosen worker using a selection head; Fugu-Ultra uses a conductor to build multi-model collaboration for difficult tasks. Routing and orchestration create new opportunities but also added cost and attribution complexity.',
 ['Worker pool|Models with differing strengths, costs and availability','Selection head|Scores candidate worker models from a learned representation','Conductor|Builds an adaptive multi-model plan and synthesizes results'],
 ['Read task|Encode task requirements and permitted worker pool','Select|Score one worker for Fugu or orchestrate multiple for Fugu-Ultra','Execute|Call selected models with bounded contexts and costs','Combine|Validate outputs and merge under a final evaluation policy'],
 'The orchestrator chooses a costly worker but gains no quality.','Worker selection is optimized on mismatched tasks or old pricing.','Benchmark routing against fixed-model baselines using current cost and held-out tasks.','A mixed coding/math workload must select different worker models under a budget.','Evaluate verified performance against wall-clock time, token spend and routing regret.','Fugu and Fugu-Ultra differ; do not describe the fast single-worker router as a full multi-agent conversation.'
],
39: [
 'A code-execution agent produces or selects code and runs it in an environment. Safe execution requires isolation from host secrets, filesystem restrictions, network policy, CPU/memory/time quotas, image provenance and explicit promotion of approved artifacts.',
 ['Ephemeral sandbox|Short-lived isolated runtime, not the host process','Resource quota|CPU, memory, wall-clock, disk and process limits','Artifact promotion|Only reviewed outputs cross into durable user workspace'],
 ['Prepare|Stage approved input files in a restricted sandbox','Execute|Run code without host credentials and with strict quotas','Inspect|Collect logs, exit status and output artifacts','Promote|Approve safe results and discard the environment'],
 'Generated code reads credentials from inherited environment variables.','The sandbox inherits host env, network and unrestricted mounts.','Use minimal containers or VMs, deny secrets and outbound network by default.','An assistant executes a third-party script to transform customer spreadsheets.','Test sandbox escape resistance, resource exhaustion and artifact correctness.','Containers alone are not a perfect security boundary; threat-model the runtime.'
],
40: [
 'An infinite-looping agent repeatedly acts without approaching the goal. Detect cycles using normalized action arguments, stable observations, repeated errors and stalled state; impose independent time, token and step limits and return recoverable diagnostics.',
 ['Action fingerprint|Normalized tool name, arguments and target state','No-progress detector|Recognizes repeated observations without improvement','Circuit breaker|Stops recurrence and reports a clear failure reason'],
 ['Record|Store last actions, outputs and progress markers','Detect|Compare fingerprints and stalled goal state','Interrupt|Stop on repetition or resource budget expiry','Recover|Change strategy, escalate or return partial results'],
 'A browser agent clicks the same disabled submit button 30 times.','There is no observation-based termination or progress assertion.','Stop after repeated identical post-action DOM states and request intervention.','A ticket agent continually retries a denied permissions API.','Measure no-progress steps, cycle detection false positives and successful recoveries.','A longer timeout can only increase cost when the loop has no progress.'
],
41: [
 'Tool outputs may disagree because of stale caches, differing definitions, source authority, time windows or outright errors. Reconcile by provenance and scope, not majority vote or model confidence. Preserve unresolved conflicts and request verification for high-stakes decisions.',
 ['Provenance|Source, revision, timestamp and tool identity','Scope alignment|Same entity, time interval and metric semantics','Resolution policy|Explicit trusted precedence or escalation path'],
 ['Normalize|Extract claims with time, units and scope','Compare|Identify true incompatibilities, not harmless differences','Resolve|Apply documented authority rules or fetch direct source','Report|Cite both when no justified precedence exists'],
 'The agent averages two incompatible balances and produces a third wrong value.','Two systems cover different account periods and no scope check is applied.','Align time and account IDs; inspect authoritative ledger before answering.','A finance agent sees $200 in cache and $230 in transaction ledger.','Measure conflict detection, correct precedence and unjustified definitive answers.','A semantic similarity score cannot establish source authority.'
],
42: [
 'Excessive token consumption is often a symptom of large repeated tool outputs and uncontrolled agent loops. Profile each context contribution, truncate noise, cache stable prefixes, compact history without losing invariants, and measure task quality at equal budgets.',
 ['Token attribution|Per-call prompt, completion and tool content counts','Context dedup|Avoid resending unchanged bulky observations','Quality gate|Validate savings against the same executable task suite'],
 ['Measure|Log token counts by component and step','Prune|Summarize repeated logs and drop irrelevant tool payloads','Cache|Reuse unchanged prefixes when provider supports it','Compare|Test cost and pass rate for the same tasks'],
 'An agent becomes cheaper but starts forgetting the user’s constraints.','Aggressive trimming removes authoritative task state with noise.','Pin goals, approvals and critical IDs before compaction.','A 50-step debugging task accumulates old stack traces.','Measure tokens per accepted fix, quality regression and p95 latency.','Do not quote savings without a controlled same-task comparison.'
],
43: [
 'Budget enforcement is an application responsibility. Before every model or tool call, reserve enough funds and tokens for a bounded response, track actual usage, and stop when the remaining allocation is insufficient; never rely on prompting the model to spend carefully.',
 ['Hard cap|Maximum cost, tool calls or runtime enforced in code','Reservation|Expected worst-case next-call spending before dispatch','Ledger|Atomic reconciliation of reserved versus actual usage'],
 ['Initialize|Assign task spending and step limits','Estimate|Reserve the next call’s maximal allowed cost','Dispatch|Reject when reservation exceeds remaining budget','Reconcile|Record actual usage and release unused reservation'],
 'Concurrent subagents each believe they have the full $5 task budget.','Budget checks are local and non-atomic across workers.','Use shared atomic reservations and hierarchical per-worker allocations.','Three workers run in parallel with one parent spending limit.','Track overspend rate, budget rejection accuracy and completions per budget.','Token prediction is approximate; strict money guarantees need provider-side limits or pessimistic bounds.'
],
44: [
 'A tool hallucination is when a model requests an unavailable function or invents unsupported fields. The controller must provide a current catalog, reject unknown names, validate nested arguments and return concise repairable errors without silently guessing a dangerous substitute.',
 ['Capability catalog|Current allowlisted tool definitions available for task','Schema validator|Rejects missing, unknown and wrongly typed parameters','Repair path|Bounded attempt to correct a rejected call'],
 ['Expose|Present a minimal relevant subset of available tools','Propose|Generate named call and structured arguments','Validate|Check existence, schema, semantics and permission','Recover|Return explicit error or request a corrected call'],
 'The agent invents delete_everything() because it saw similar text in a webpage.','The system accepts untrusted or nonexistent tool names without validation.','Allowlist tool IDs and return a specific unknown-tool error.','A calendar agent sends a nonexistent timezone field to scheduling API.','Measure unsupported calls, semantic errors and successful bounded repairs.','A syntactically valid JSON object can still describe a nonexistent capability.'
],
45: [
 'Prevent irreversible agent mistakes by denying broad destructive permissions and making high-impact effects contingent on separate authorization, impact preview and tested rollback or backup options. Approval, sandboxing and least privilege operate outside model compliance.',
 ['Blast radius|Maximum permitted damage from one agent identity','Two-phase action|Preview or plan followed by separately approved commit','Recovery design|Backups, soft deletes and restoration drills where possible'],
 ['Classify|Mark delete, payment and production changes as protected','Preview|Show exact affected objects and reversibility','Approve|Authenticate human and bind approval to parameters','Execute|Use idempotent controlled API and verify impact'],
 'A model deletes a production database after seeing an adversarial instruction.','It has permanent administrative credentials and a generic SQL executor.','Remove DROP privileges; require separate approvals and backups for exceptional operations.','A maintenance agent misinterprets a cleanup request as deleting all tables.','Test denial of destructive calls, restoration drills and approval integrity.','Prompt instructions cannot replace database permissions or backup policy.'
],
46: [
 'Agents with many tools can choose an incorrect capability because descriptions overlap or the full catalog exceeds effective attention. Reduce options by task routing, distinguish intents in schemas, add examples and negative cases, and validate against tool-choice gold labels.',
 ['Catalog size|Number of candidate capabilities shown to model','Tool ambiguity|Overlapping names and descriptions that confuse routing','Router|Deterministic or learned filter producing a relevant subset'],
 ['Collect|Label tasks with intended tools and necessary permissions','Group|Separate tool domains, read-only versus write and uncommon options','Route|Expose top relevant tools only, preserving mandatory safety tools','Evaluate|Compare intended calls and task success on holdouts'],
 'A support agent selects delete_customer when asked to view customer details.','Tools use ambiguous names and both are always advertised.','Split read/write catalogs, rename operations and route before selection.','An enterprise assistant has 200 near-duplicate CRM functions.','Measure top-k routing recall, false tool calls, correction cost and end-task success.','Reducing catalog size must not hide a tool needed for valid tasks.'
],
47: [
 'Slow agents accumulate serial model calls, tool network delays, excessive context and unnecessary reflection. Profile the critical path per step, batch compatible reads, parallelize independent work and stop early when acceptance criteria pass; do not parallelize conflicting writes.',
 ['Critical path|Longest dependency chain of sequential work','Concurrency|Run independent reads without unsafe shared mutations','Latency budget|Target end-to-end time with stage-level measurements'],
 ['Trace|Measure queueing, model, network and tool time','Simplify|Remove redundant planning and unneeded agent hops','Parallelize|Batch independent reads under rate limits','Validate|Confirm quality and policy at measured latency'],
 'A 40-second response consists mostly of serialized independent searches.','The orchestrator waits for each independent read before starting next.','Parallelize authorized searches and combine after all required evidence arrives.','A travel agent searches flights and hotels sequentially though neither depends on the other.','Measure p50/p95 end-to-end, critical path and quality at equal workload.','Stage p95 latencies cannot be simply summed to get request p95.'
],
48: [
 'Long-running agents can drift when repeated summaries, partial plans and stale observations replace the original objective. Persist immutable goals, current authoritative constraints, checkpoints and progress evidence; periodically revalidate work against the goal rather than model-generated narrative.',
 ['Goal invariant|Original task and user constraints preserved exactly','Drift check|Compare current plan and artifacts against immutable requirements','Checkpoint ledger|Durable actions, approvals and outstanding work'],
 ['Pin|Store original objective and versioned constraints','Observe|Track completed steps and changed external state','Revalidate|Compare next action against remaining acceptance criteria','Recover|Roll back incorrect branch or request clarification'],
 'A coding agent spends hours refactoring unrelated modules.','Task summary substituted a broader goal and lost acceptance criteria.','Check each planned write against authorized file scope and original task.','An agent fixing a login bug starts rewriting the entire authentication stack.','Measure goal divergence, unrelated diffs, tokens spent after drift and recovery.','Compaction is useful only if it preserves the invariants that define correctness.'
],
49: [
 'Correct tool choice is not enough: entity linking, units, identifiers, dates and optional fields can be extracted incorrectly. Validate arguments against domain state and ask focused clarification when values are ambiguous; never guess customer IDs or money units from prose.',
 ['Slot extraction|Map user intent to typed fields','Grounding|Resolve textual names to authorized backend IDs','Semantic validation|Check cross-field rules beyond JSON syntax'],
 ['Parse|Extract requested operation and candidate parameter values','Resolve|Use authorized lookup for IDs, units and locale','Validate|Check schema, ownership, ranges and dependencies','Execute or clarify|Reject ambiguous values before side effects'],
 'A correct refund tool receives the wrong invoice ID.','The model copies a similarly named identifier from old context.','Bind IDs from verified current records and require confirmation on ambiguity.','An agent refunds order 1842 instead of 1482 after reading a long thread.','Track per-field extraction accuracy, entity mismatches and harmful dispatches.','Schema validation cannot detect semantically wrong but well-formed identifiers.'
],
50: [
 'Computer-use agents interact with applications through screenshots or accessible UI representations and actions such as click, type and scroll. Their control loop resembles observe–act–verify; UI state is volatile, so actions must be grounded to current observations and protected against unsafe clicks.',
 ['Perception|Screenshot or accessibility tree of current UI state','Actuator|Mouse, keyboard or OS interaction API','Feedback loop|Check that intended state transition actually occurred'],
 ['Observe|Capture current screen, accessibility state and window identity','Choose|Select target action from current evidence','Act|Perform bounded click/type/scroll with protected actions gated','Verify|Capture new state and detect navigation or modal changes'],
 'The agent clicks Delete after the page shifted unexpectedly.','It reuses stale screen coordinates following an asynchronous layout change.','Re-observe after transitions and prefer stable semantic targets when possible.','A desktop assistant chooses the wrong dialog button after a pop-up appears.','Measure wrong-click rate, recovery success, time and unauthorized operations.','A screenshot is not a stable API and can contain malicious instructions.'
],
51: [
 'Browser agents control web pages using DOM/accessibility trees, screenshots and browser automation. They must reconcile asynchronous navigation, changing element identities and untrusted page content, while keeping authenticated sessions, downloads and sensitive actions within user-authorized scope.',
 ['DOM target|Semantic locator or accessibility representation','Browser session|Isolated cookies, tabs and navigation state','Post-action check|Assert the expected URL, element or success state'],
 ['Observe|Read page URL, available controls and dynamic state','Decide|Choose action using stable locator and user goal','Interact|Click/type in isolated browser under step and domain limits','Verify|Wait for new state and detect errors or redirects'],
 'A web page uses hidden content to instruct the agent to browse an exfiltration URL.','Tool outputs are treated as commands and browser egress is unlimited.','Apply domain permissions, content trust labels and sensitive action confirmation.','A browser agent filling a form is redirected to a lookalike payment site.','Track task success, wrong-domain navigations, stale selectors and actions per job.','Browser APIs are more stable than screenshots when valid DOM selectors exist.'
],
52: [
 'LangChain provides composable primitives for model calls, prompts, tools, retrievers and runnable sequences. Understand the contracts and data flow rather than framework names: application code still owns secrets, validation, execution policy and verification.',
 ['Runnable|Composable transformation with input and output contracts','Tool wrapper|Bridges schema-defined requests to application functions','Composition|Connects model, retrieval and parser steps'],
 ['Define|Specify prompt, model and output format','Compose|Connect parser, retriever or tool wrapper as needed','Invoke|Run with explicit input, configuration and error handling','Trace|Inspect intermediates and validate actual side effects'],
 'A developer assumes the framework automatically enforces document ACLs.','Retrieval is composed without tenant authorization filters.','Implement ACL filtering in the retriever and test cross-user attempts.','An internal chat chain returns confidential text from an unrestricted vector store.','Measure retrieval scope compliance, task quality, latency and trace coverage.','LangChain abstractions do not replace understanding HTTP calls and state.'
],
53: [
 'LangGraph models workflows as stateful nodes and conditional transitions, with checkpointing for interruption and resumption. The graph runtime coordinates steps, while application nodes still implement tool authorization, schema validation, idempotency and protected human approvals.',
 ['Typed state|Shared workflow data with defined merge and update semantics','Conditional edge|Routing predicate selecting next node from current state','Checkpointer|Persisted execution position and state for resume'],
 ['Declare|Create state schema, nodes and graph edges','Execute|Run ready nodes and merge their typed updates','Interrupt|Checkpoint and request approval before a protected node','Resume|Validate decision and state version before continuing'],
 'A resumed graph executes a purchase node twice.','Node side effects have no idempotency key or committed receipt.','Use durable side-effect IDs, transactional application services and replay tests.','An agent workflow is interrupted for human approval and later restarts.','Measure replay correctness, illegal transitions, state conflicts and task quality.','A graph scheduler is orchestration, not a substitute for secure transactional actions.'
],
54: [
 'Open Knowledge Format (OKF) describes organizational knowledge about data and systems as portable Markdown files with YAML frontmatter and links. It provides reusable context such as schema meaning and business rules; it is not a model memory engine, an execution tool or the MCP transport.',
 ['Knowledge bundle|Organized Markdown descriptions of datasets and business meaning','Metadata|Frontmatter fields linking a record to context and provenance','Knowledge links|Relationships among files that help agents navigate concepts'],
 ['Author|Document schema concepts, definitions, ownership and usage rules','Link|Add references among related knowledge files','Load|Select relevant verified pages as context for current task','Validate|Check stale definitions and source ownership before acting'],
 'An agent calculates revenue from an outdated definition of completed orders.','The knowledge page lacks freshness and owner review.','Version and review business rules; retrieve authoritative definitions before SQL.','A reporting agent needs to know which order states count toward sales.','Measure correctness of business-definition application, stale files and attribution.','OKF represents knowledge; MCP provides capability integration; skills encode procedures.'
]
};

const R = (title,slug) => [title,`https://outcomeschool.com/blog/${slug}`];
const V = ['AI Engineering Explained: LLM, RAG, MCP, Agent, Fine-Tuning, Quantization','https://www.youtube.com/watch?v=lnfWvX66FUk'];
const resources = {
  1:[V,R('AI Agent Explained','ai-agent')], 2:[R('AI Agent Memory','ai-agent-memory')],
  3:[R('Harness Engineering in AI','harness-engineering-in-ai')], 4:[R('Harness Engineering','harness-engineering-in-ai'),R('How does Claude Code work?','how-does-claude-code-work')],
  5:[R('ReAct Agent','react-agent')], 6:[R('Plan-and-Execute Agent','plan-and-execute-agent')],
  7:[V,R('How does Function Calling work in LLMs?','how-does-function-calling-work-in-llms')],8:[R('How does Function Calling work in LLMs?','how-does-function-calling-work-in-llms')],9:[V],
  11:[R('Multi-Agent Systems','multi-agent-systems')],12:[R('Multi-Agent Systems','multi-agent-systems')],
  13:[V,R('What is MCP?','what-is-mcp-model-context-protocol'),['MCP specification (2026-07-28)','https://blog.modelcontextprotocol.io/posts/2026-07-28/']],
  14:[R('What is MCP?','what-is-mcp-model-context-protocol'),R('Function Calling','how-does-function-calling-work-in-llms')],
  15:[R('AI SubAgents','ai-subagents')],16:[R('AI Agent Memory','ai-agent-memory')],18:[R('AI Agent Loop','ai-agent-loop')],
  19:[R('Context Engineering','context-engineering')],20:[R('How does context compaction work?','how-does-context-compaction-work')],
  21:[R('Loop Engineering','what-is-loop-engineering')],22:[R('Graph Engineering','what-is-graph-engineering')],
  23:[R('How AI Agents Communicate','how-ai-agents-communicate')],24:[R('What are Agent Skills?','what-are-agent-skills')],
  25:[R('AI Agent Evaluation','ai-agent-evaluation')],26:[R('Prompt Injection in LLMs','prompt-injection-in-llms')],27:[R('Prompt Injection in LLMs','prompt-injection-in-llms')],
  29:[R('How does context compaction work?','how-does-context-compaction-work'),['Reducing agent token consumption','https://www.linkedin.com/posts/pallavi-shekhar_ai-aiagents-machinelearning-activity-7439550125015994368-LTmE']],
  31:[R('How do LLM guardrails work?','how-do-llm-guardrails-work')],32:[R('Reflection Agent','reflection-agent')],
  35:[R('How does LangGraph work?','how-does-langgraph-work')],37:[R('AI Orchestration','ai-orchestration')],
  38:[R('Sakana Fugu — The Technical Report Explained','decoding-sakana-fugu')],
  40:[['Fix an infinite loop in an AI agent','https://www.linkedin.com/posts/pallavi-shekhar_ai-aiagents-machinelearning-share-7440257380707364864-5Ycc']],
  42:[['Reducing agent token consumption','https://www.linkedin.com/posts/pallavi-shekhar_ai-aiagents-machinelearning-activity-7439550125015994368-LTmE']],
  43:[R('AI Agent Loop','ai-agent-loop')],50:[R('How do Computer-Use Agents work?','how-do-computer-use-agents-work')],
  51:[R('How do Browser Agents work?','how-do-browser-agents-work')],52:[R('How does LangChain work?','how-does-langchain-work')],
  53:[R('How does LangGraph work?','how-does-langgraph-work')],54:[R('What is OKF (Open Knowledge Format)?','what-is-okf-open-knowledge-format')]
};
const pair = string => { const pos=string.indexOf('|'); if(pos<0)throw Error(`Invalid concept or stage: ${string}`); return [string.slice(0,pos),string.slice(pos+1)]; };
function alternate(id, stages, symptom, cause, remediation, metric) {
  return [
    [stages[0][0]+' failure',symptom],
    [stages[1][0]+' diagnosis',cause],
    [stages[2][0]+' repair',remediation],
    [stages[3][0]+' proof',metric]
  ];
}
export function getAgentsGuide(id) {
  const record=S[Number(id)]; if(!record)return undefined;
  const [plain,concepts,rawFlow,symptom,cause,mitigation,scenario,metric,alternative]=record;
  const flow=rawFlow.map(pair);
  const terms=concepts.map(pair);
  const precision=alternative;
  const counter=alternate(Number(id),flow,symptom,cause,mitigation,metric);
  const correct=mitigation;
  const distractors=[
    'Trust the model to follow an extra warning in the prompt, without any host-level validation.',
    'Increase model calls and tool privileges first, without establishing a baseline or reproducing the failure.'
  ];
  const answerOrder=Number(id)%3;
  const ordered=[correct,...distractors];
  const options=[ordered[answerOrder],ordered[(answerOrder+1)%3],ordered[(answerOrder+2)%3]];
  const title=flow[0][0];
  return {
    question:`How does ${terms[0][0].toLowerCase()} work, and what can go wrong when you build this agent?`,
    plain,
    mechanism:flow.map(([name,details])=>`${name}: ${details}.`).join(' '),
    goals:[`Define ${terms[0][0].toLowerCase()} from first principles.`,`Trace the four stages of ${title.toLowerCase()} and name the responsible application boundary.`,`Diagnose the worked failure, choose a mitigation and defend its validation.`],
    concepts:terms.map(([name,explanation],i)=>[
      name, explanation.endsWith('.')?explanation:`${explanation}.`,
      `In the agent runtime, this interacts with ${flow[i+1][0].toLowerCase()}: ${flow[i+1][1]}. The failure to guard against is: ${cause}`
    ]),
    views:[{name:'How it operates',note:'Schematic decision and tool sequence, not a live agent trace. Select steps or play the animation to see the control boundary.',steps:flow.map(([name,description])=>[name,description+'.'])},
    {name:'Failure and recovery',note:'Follow a plausible failure, its diagnosis and the deterministic safeguard. This does not execute any real tools.',steps:counter}],
    example:{title:'Work through a production-grade decision',steps:[
      `Production scenario to diagnose: ${scenario}`,
      `Failure observation: ${symptom} Root cause to investigate: ${cause}`,
      `Engineering intervention: ${mitigation} Competing design constraint: ${alternative}`,
      `Validation on a replayable test task: ${metric}`
    ],takeaway:`${alternative} To make the change credible, prove it with held-out tasks and inspect the actual end state rather than relying on model claims.`},
    precision:`${alternative} ${cause} Treat model-chosen actions as proposals and independently check the corresponding application boundary.`,
    engineering:`${metric} Instrument model and tool spans, record versions and authorization decisions, compare matched workloads, and reject regressions in verified task completion.`,
    interview:`If ${symptom[0].toLowerCase()+symptom.slice(1)} how would you locate the fault, compare alternative designs and prove the fix without invented performance gains?`,
    checkpoint:{question:`An agent incident: ${symptom} What is the best first engineering response?`,options,correct:options.indexOf(correct),why:`${cause} Therefore: ${mitigation} The alternatives rely on unverified model obedience or uncontrolled resource usage.`},
    resources:resources[Number(id)]||[]
  };
}
export const AGENTS_GUIDE_COUNT=Object.keys(S).length;
