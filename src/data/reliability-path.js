/**
 * Beginner → engineering bridge for Mentora's sixteen Production Reliability
 * lessons. Diagrams are conceptual teaching illustrations, not benchmarks.
 * Keep interview A–F sections in courses.json as the next stage of study.
 */
export const reliabilityGuides = {
  1: {
    question: 'The model gives different answers to the same question. Where do you start?',
    plain: 'First establish whether anything actually changed. Sampling makes output non-deterministic by design, so variation may be expected. Fix temperature to zero, capture the full request, and reproduce. If it still differs with an identical request, the difference is upstream — a version, a cache, or a data path — not the model.',
    goals: ['Separate expected sampling variation from a real defect', 'Establish reproducibility before diagnosing', 'Trace the layers that can change output'],
    concepts: [
      ['Non-determinism is by design', 'Sampling produces different draws.', 'At temperature above zero the same distribution yields different tokens. Variation is not evidence of a defect until settings are fixed.'],
      ['Fix the conditions', 'Pin everything that can vary.', 'Temperature, top-p, model version, prompt template, and retrieval results must be held constant before any comparison is meaningful.'],
      ['Layers that change output', 'Model, prompt, context, and decoding.', 'A change in any of them alters the answer. Classifying which layer moved is most of the diagnosis.'],
      ['Reproduce first', 'A defect you cannot reproduce cannot be fixed.', 'Capture the exact request, the model identifier, and the returned output. Without that, any change you make is untested.']
    ],
    example: { title: 'Report of "the model changed its mind"', steps: ['Replay the identical request with temperature zero and fixed seed.', 'If it reproduces, compare the prompt template and model version.', 'If it does not, the original difference was sampling or context.', 'Check whether retrieval results differ between runs.'], takeaway: 'Fix the conditions first. Most "inconsistency" reports are unfixed variables.' },
    views: [
      { name: 'Where variation enters', note: 'Four layers, one symptom.', steps: [['Sampling', 'Temperature and top-p above deterministic.'], ['Prompt', 'Template or instruction changed.'], ['Context', 'Retrieved documents differ.'], ['Model', 'Version or endpoint differs.']] },
      { name: 'Diagnosis order', note: 'Reproduce before you theorize.', steps: [['Capture request', 'Exact input and settings.'], ['Pin decoding', 'Temperature zero.'], ['Replay', 'Same endpoint.'], ['Diff', 'Isolate what moved.']] }
    ],
    precision: 'Non-determinism does not imply a bug. It implies a configuration you have not fixed yet.',
    engineering: 'Log model version, decoding settings, and retrieval identifiers with every response. Without them, "it changed" cannot be investigated.',
    checkpoint: { question: 'What is the first step when output looks inconsistent?', options: ['Increase temperature to see more variety', 'Fix decoding settings and attempt to reproduce with an identical request', 'Switch to a different model', 'Fine-tune the model'], correct: 1, why: 'Without reproducible conditions you cannot tell expected sampling variation from a real defect, so pin every variable before theorizing.' }
  },
  2: {
    question: 'JSON output is sometimes malformed. How do you find the cause?',
    plain: 'Start by measuring the failure rate by field and by input shape rather than in aggregate. Then determine whether the schema was conveyed as a constraint or merely described in the prompt, whether the model was allowed to run past a token limit, and whether a repair step exists at all. Most malformed output is a missing constraint, not a model failure.',
    goals: ['Measure failure precisely before fixing', 'Distinguish prompting from constraining', 'Design a bounded recovery path'],
    concepts: [
      ['Measure by field and shape', 'Aggregate rates hide the pattern.', 'One required field or one input type failing is a targeted problem. A global rate suggests a structural constraint problem.'],
      ['Description versus constraint', 'Prompting asks; constraining guarantees.', 'Describing a schema in the prompt yields probabilistic compliance. Token-level constraint makes invalid output unreachable.'],
      ['Truncation causes malformed output', 'A cut-off string is invalid JSON.', 'If the output token budget ends mid-structure, the JSON is necessarily incomplete. Check for truncation before blaming the model.'],
      ['Bounded repair', 'Validate, attempt repair, then fail visibly.', 'A repair loop with a strict retry budget converts occasional failures into successes without allowing runaway latency or cost.']
    ],
    example: { title: 'Downstream parser rejects a rising share of responses', steps: ['Measure failure by field and by input shape.', 'Check whether outputs are being truncated at the token limit.', 'Confirm the schema is enforced, not only described.', 'Add validation with a bounded repair attempt and a visible failure.'], takeaway: 'Most malformed JSON is truncation or an unenforced constraint.' },
    views: [
      { name: 'Where malformation comes from', note: 'Four separable causes.', steps: [['Truncated', 'Token budget ended mid-object.'], ['Constraint absent', 'Schema described, not enforced.'], ['Ambiguous field', 'Model unsure what belongs.'], ['Conflict', 'Schema contradicts instructions.']] },
      { name: 'Recovery path', note: 'Bounded and observable.', steps: [['Validate', 'Parse against schema.'], ['Repair once', 'Cheap structural fix.'], ['Retry bounded', 'Small fixed budget.'], ['Fail visibly', 'Never silently return bad data.']] }
    ],
    precision: 'A model producing valid JSON most of the time has not met a contract. Contracts are met by validation on the receiving side.',
    engineering: 'Always validate downstream regardless of generation strategy. Enforcement at generation reduces failures; it does not remove the need to check.',
    checkpoint: { question: 'Which cause of malformed JSON is most often overlooked?', options: ['The schema being too complex', 'The response being truncated at the output token limit', 'Temperature being too high', 'The JSON library version'], correct: 1, why: 'A response cut off mid-structure is necessarily invalid. Truncation looks like a model failure but is a budgeting failure.' }
  },
  3: {
    question: 'How do you make a model stop inventing answers?',
    plain: 'You cannot prompt your way there. Give it evidence, require it to cite, verify the citation actually supports the claim, and provide an explicit abstention path with a threshold you have measured. Then report answer accuracy together with abstention rate, or the metric will hide exactly the failure you are trying to catch.',
    goals: ['Explain why prompting alone fails', 'Design evidence-linked generation with verification', 'Measure risk and coverage together'],
    concepts: [
      ['Generation always continues', 'The model will produce something.', 'A model asked a question with no support will answer, because answering is the behaviour it has. Abstention must be engineered, not requested.'],
      ['Citations make claims checkable', 'Bind each assertion to a span.', 'Citations convert a fluent unverifiable answer into something testable — but a citation can exist and still not entail the claim.'],
      ['Entailment is a separate check', 'Verify support, not just presence.', 'Whether the cited passage actually says what the answer asserts requires an independent verification step.'],
      ['Risk–coverage reporting', 'Two numbers or the metric is gameable.', 'Raising the evidence threshold reduces coverage and raises accuracy on what remains. Reporting only accuracy rewards answering everything confidently.']
    ],
    example: { title: 'Assistant invents policy details', steps: ['Build a set with known unanswerable inputs.', 'Measure factual-support rate and abstention recall together.', 'Require citations and verify entailment per claim.', 'Tune the threshold to the accuracy target, then re-measure both.'], takeaway: 'Accuracy without abstention recall hides fabrication on hard inputs.' },
    views: [
      { name: 'Evidence-linked answering', note: 'Make every claim testable.', steps: [['Retrieve', 'Fetch candidate evidence.'], ['Generate with citations', 'Bind claims to spans.'], ['Verify entailment', 'Does the span support it?'], ['Accept or abstain', 'Threshold decides.']] },
      { name: 'Risk and coverage', note: 'Both must be reported.', steps: [['Set threshold', 'Evidence required.'], ['Reject weak', 'Coverage falls.'], ['Accepted answers', 'Accuracy rises.'], ['Report both', 'Or the metric is meaningless.']] }
    ],
    precision: 'Asking a model to say it does not know changes its tone, not its reliability. Verification is what makes abstention trustworthy.',
    engineering: 'Never publish answer accuracy without abstention recall on the same set. Optimizing one alone is how confident fabrication survives review.',
    checkpoint: { question: 'Why is prompting a model to admit uncertainty insufficient?', options: ['It is too slow', 'The underlying behaviour is still to generate an answer, so compliance is not reliable', 'It costs extra tokens', 'It requires fine-tuning'], correct: 1, why: 'Abstention requested in a prompt is a preference, not a guarantee. Structural enforcement with verification is what makes it dependable.' }
  },
  4: {
    question: 'The model writes code using deprecated APIs. How do you fix it?',
    plain: 'This is a knowledge-currency problem, not a reasoning one. The model learned from a corpus with a cutoff, and it has no way to know what changed after. Fix it by supplying current context — documentation, version pins, and retrieved examples — rather than by trying to make the model reason harder.',
    goals: ['Identify the failure as knowledge currency', 'Explain why prompting cannot supply facts', 'Choose a context-based remedy'],
    concepts: [
      ['Training cutoff', 'Knowledge stops at a fixed date.', 'Anything released after the corpus snapshot is absent. The model cannot infer newer API signatures from older ones reliably.'],
      ['Retrieval supplies currency', 'Put current documentation in context.', 'Retrieving the specific library’s current API and requiring the answer to use it converts a knowledge problem into a context problem.'],
      ['Version pinning as a constraint', 'State the target explicitly.', 'Naming exact versions in the prompt narrows the space the model draws from and makes violations detectable.'],
      ['Why more reasoning does not help', 'Missing facts are not recoverable.', 'Additional reasoning tokens only elaborate what the model already has. If the information is post-cutoff, no amount of deliberation produces it.']
    ],
    example: { title: 'Generated code breaks on a current SDK', steps: ['Confirm the SDK version is newer than the model’s cutoff.', 'Retrieve current API docs and include them in context.', 'State the target version explicitly in the prompt.', 'Add a lint or import check in CI to catch regressions.'], takeaway: 'Supply the facts. Reasoning cannot recover information the model never saw.' },
    views: [
      { name: 'Where the failure is', note: 'Knowledge, not capability.', steps: [['Corpus cutoff', 'Knowledge stops here.'], ['SDK released after', 'Absent from training.'], ['Model generates', 'From what it has.'], ['Result', 'Plausible, outdated API.']] },
      { name: 'Remedies by strength', note: 'Escalate from cheap to structural.', steps: [['State version', 'Cheap, helps somewhat.'], ['Retrieve docs', 'Supplies actual facts.'], ['Verify in CI', 'Catches regressions.'], ['Retrain', 'Rarely justified.']] }
    ],
    precision: 'A deprecated-API failure is missing knowledge, not poor reasoning. Prompting for better reasoning cannot recover post-cutoff facts.',
    engineering: 'For version-sensitive tasks, retrieve current documentation and validate the output mechanically — a linter catches what the model cannot.',
    checkpoint: { question: 'Why does asking the model to "be careful about versions" fail?', options: ['The model ignores instructions', 'Careful reasoning cannot recover facts absent from its training data', 'It increases latency too much', 'The tokenizer drops version strings'], correct: 1, why: 'The information was never learned. Reasoning elaborates available knowledge; it cannot supply knowledge the model does not have.' }
  },
  5: {
    question: 'How do you tell whether your tokenizer is the problem?',
    plain: 'Measure tokens per character on your real traffic, broken down by language, domain, and term. A single global average conceals exactly the failures that matter. If one population consumes far more tokens per sentence, it gets shorter effective context and higher latency for the same service — a cost and an equity problem at once.',
    goals: ['Measure fragmentation per population', 'Separate tokenizer failure from model failure', 'Choose a remedy at the right cost level'],
    concepts: [
      ['Fragmentation measurement', 'Tokens per character is the diagnostic.', 'Compute it per language, per code type, and per domain term on real traffic. Aggregate averages hide the tail that matters.'],
      ['Attribution', 'Four candidates, only one is the tokenizer.', 'Segmentation, retrieval, generation, and prompt design all produce bad answers. Fix the measured cause, not the assumed one.'],
      ['Remediation ladder', 'Cheapest fix first.', 'Prompt clarification, then context injection with correct spelling, then vocabulary extension, then a custom tokenizer requiring full retraining.'],
      ['Service equity', 'Unequal fragmentation is unequal service.', 'Higher token cost per sentence means shorter effective context for those users at the same nominal context window.']
    ],
    example: { title: 'One language underperforms despite identical prompts', steps: ['Measure tokens per character for each supported language.', 'Check whether domain terms fragment into unrelated common pieces.', 'Verify retrieval returns correct passages before blaming segmentation.', 'Escalate the ladder only as far as the measurement requires.'], takeaway: 'Fragmentation is measurable and population-specific. Fix the measured cause.' },
    views: [
      { name: 'Attribution path', note: 'Do not assume it is the tokenizer.', steps: [['Segmentation', 'Does it fragment badly?'], ['Retrieval', 'Right evidence returned?'], ['Generation', 'Evidence used?'], ['Decide', 'Fix what the data shows.']] },
      { name: 'Remediation ladder', note: 'Escalate only when cheaper steps fail.', steps: [['Clarify prompt', 'State expected form.'], ['Inject context', 'Supply correct spelling.'], ['Extend vocabulary', 'Add domain terms.'], ['Custom tokenizer', 'Requires retraining.']] }
    ],
    precision: 'High fragmentation is a cost and context-length problem, not necessarily a correctness defect. Severity depends on your traffic mix.',
    engineering: 'Track tokens per request segmented by language. Aggregate cost metrics hide service inequality between user populations.',
    checkpoint: { question: 'How does high fragmentation affect users of one language?', options: ['It shortens their effective context at the same nominal window', 'It changes their model version', 'It disables caching', 'It blocks tool use'], correct: 1, why: 'The window counts tokens, not characters. Higher fragmentation consumes more of the same fixed budget, so fewer effective tokens remain for context.' }
  },
  6: {
    question: 'A long-document app runs out of context. What actually fixes it?',
    plain: 'Widening the window is usually the wrong first move. Identify where the required evidence sits, whether it is retrieved or just passed through, and whether the output budget is being reserved. Most long-document failures are retrieval and budgeting problems wearing a context-length costume.',
    goals: ['Diagnose context exhaustion precisely', 'Distinguish retrieval from truncation problems', 'Reserve output before filling context'],
    concepts: [
      ['Measure what is filling the window', 'Prompt, history, evidence, and output.', 'Break usage down by segment. Often the prompt is dominated by a fixed overhead that could be reduced rather than by evidence you actually need.'],
      ['Retrieval over stuffing', 'Select instead of including everything.', 'Chunking and retrieval convert an unbounded problem into a bounded one and keep evidence traceable, rather than hoping it all fits.'],
      ['Reserve output first', 'The budget is shared.', 'Output tokens must be set aside before the context is filled. Running out because the prompt consumed everything is a design bug, not a model limit.'],
      ['Summarization has a cost', 'Compression is lossy by construction.', 'Summarizing overflow fits more content but loses provenance and can drop exactly the detail the question needed.']
    ],
    example: { title: 'Answers degrade on documents over 100 pages', steps: ['Break context usage into segments and find what dominates.', 'Test whether moving to retrieval changes the failure.', 'Confirm output tokens are reserved before filling the context.', 'Measure quality at the actual usable length, not the stated window.'], takeaway: 'Budget first, retrieve second, widen the window last.' },
    views: [
      { name: 'What fills the window', note: 'Four segments, one budget.', steps: [['System prompt', 'Fixed overhead.'], ['History', 'Grows per turn.'], ['Evidence', 'Grows with retrieval.'], ['Output reserve', 'Must be set aside first.']] },
      { name: 'Remedies by cost', note: 'Cheapest first.', steps: [['Trim overhead', 'Reduce fixed prompt.'], ['Reserve output', 'Fix budgeting.'], ['Retrieve', 'Stop stuffing the prompt.'], ['Widen window', 'Last resort.']] }
    ],
    precision: 'Stated context length and usable context length differ. Degradation begins before the hard limit is reached.',
    engineering: 'Instrument context usage by segment in production. Knowing that history, not evidence, dominates changes the fix entirely.',
    checkpoint: { question: 'What is the most common self-inflicted cause of context exhaustion?', options: ['The tokenizer producing too many tokens', 'Not reserving output tokens before filling the context', 'Too many attention heads', 'Temperature being too high'], correct: 1, why: 'Prompt, history, and evidence compete with generated output for one budget. If output is not reserved first, the request fails at generation time.' }
  },
  7: {
    question: 'How do you get more concurrency out of the same KV cache budget?',
    plain: 'Reduce what each sequence holds, or share more between them. Fewer KV heads through GQA, lower cache precision, shorter sequences, and prefix sharing for common prompts all shrink per-sequence cost. Budgeting cache explicitly — rather than discovering it in an OOM — is what turns memory into concurrency.',
    goals: ['Compute cache per sequence', 'Apply the four reduction levers', 'Convert cache budget into concurrency'],
    concepts: [
      ['Compute the per-sequence cost', 'The formula before any optimization.', '2 × layers × tokens × kv_heads × head_dim × bytes. Everything else is guesswork until this number exists.'],
      ['Four levers', 'Heads, precision, length, sharing.', 'GQA reduces heads; quantized cache halves precision; bounding length caps growth; prefix sharing lets sequences reuse identical prompts.'],
      ['Concurrency follows from budget', 'Total memory divided by per-sequence cost.', 'Once per-sequence cost is known, concurrency is arithmetic — minus weights and workspace, which must be reserved first.'],
      ['Prefix sharing is often free', 'Shared prompts should not be duplicated.', 'Identical system prompts across thousands of requests can be stored once if the cache supports block sharing.']
    ],
    example: { title: 'Concurrency is lower than the hardware should allow', steps: ['Compute cache per sequence at working length.', 'Subtract weights and workspace from total memory.', 'Divide remaining by per-sequence cost to find true concurrency.', 'Attack the largest term: heads, precision, length, or sharing.'], takeaway: 'Convert memory into concurrency with arithmetic, not intuition.' },
    views: [
      { name: 'Four reduction levers', note: 'Each attacks a different term.', steps: [['KV heads', 'GQA or MQA.'], ['Precision', 'Store cache at fewer bits.'], ['Length', 'Bound sequence growth.'], ['Sharing', 'Reuse common prefixes.']] },
      { name: 'Budget to concurrency', note: 'A subtraction and a division.', steps: [['Total memory', 'What the device has.'], ['Subtract weights', 'Fixed resident cost.'], ['Subtract workspace', 'Peak buffers.'], ['Divide', 'By per-sequence cache.']] }
    ],
    precision: 'Reducing KV cache memory increases concurrency, not the speed of any single sequence. The benefit is throughput under a fixed budget.',
    engineering: 'Log cache bytes per sequence and per-request cache growth in production. It is the number that decides your concurrency ceiling.',
    checkpoint: { question: 'Which change reduces KV cache per sequence without changing the architecture?', options: ['Adding more layers', 'Storing the cache at lower numeric precision', 'Increasing output length', 'Raising temperature'], correct: 1, why: 'Cache bytes scale directly with bytes per stored value. Lower precision halves the cache while leaving the model architecture untouched.' }
  },
  8: {
    question: 'A long-context request crashes with out-of-memory. What is the cause?',
    plain: 'Almost always attention, and almost always the score matrix rather than the weights. Long sequences make the [T, T] intermediate enormous, and peak memory during prefill exceeds steady-state use. Memory-efficient attention kernels avoid materializing it; if the crash is during prefill of a very long prompt, this is the first thing to check.',
    goals: ['Identify attention as the OOM source', 'Distinguish peak from steady-state memory', 'Apply the right mitigation'],
    concepts: [
      ['The score matrix is the peak', '[T, T] per head and layer.', 'Naive attention materializes it during prefill. At long T this dominates every other consumer and creates a sharp peak.'],
      ['Peak versus steady state', 'Weights and cache are steady; attention spikes.', 'A request can fit comfortably at rest and crash during the one forward pass that needs the largest intermediate buffer.'],
      ['Memory-efficient attention', 'Compute without materializing.', 'Tiled kernels with online softmax produce the same result without writing the full matrix. This is the primary fix and it exists in common frameworks.'],
      ['Secondary fixes', 'Batching, precision, and chunking.', 'Reducing concurrent long sequences, running attention at lower precision, or chunking prefill all lower the peak when the kernel alone is not enough.']
    ],
    example: { title: 'OOM only on the longest prompts', steps: ['Confirm the crash occurs during prefill of long inputs.', 'Check which attention kernel is in use at runtime.', 'Enable the memory-efficient path and re-test the same request.', 'If it persists, reduce concurrent long sequences or chunk prefill.'], takeaway: 'An OOM that only hits long prompts is attention memory, not model size.' },
    views: [
      { name: 'Where the peak is', note: 'One pass dominates.', steps: [['Weights', 'Steady resident.'], ['KV cache', 'Grows with sequence.'], ['Score matrix', 'Spikes during prefill.'], ['Peak', 'Determined by the spike.']] },
      { name: 'Mitigations in order', note: 'Cheapest effective fix first.', steps: [['Memory-efficient kernel', 'Avoids materializing.'], ['Reduce concurrency', 'Fewer long prompts at once.'], ['Chunk prefill', 'Lower the peak per step.'], ['Lower precision', 'Last resort.']] }
    ],
    precision: 'An OOM during long-context prefill is a peak-memory problem, not a sustained-usage problem. Average memory reports will not show it.',
    engineering: 'Log peak memory, not just average. Attention peaks are brief and are exactly what crashes a request that otherwise fits.',
    checkpoint: { question: 'Which tensor usually causes OOM on long-context prefill?', options: ['The model weights', 'The [T, T] attention score matrix', 'The tokenizer vocabulary', 'The optimizer state'], correct: 1, why: 'The score matrix grows quadratically with sequence length and is materialized during naive attention. Weights and cache grow much more slowly in comparison.' }
  },
  9: {
    question: 'Latency spiked and throughput dropped. How do you tell what happened?',
    plain: 'Decompose before you speculate. Split time into queue, prefill, and decode, then check whether prompt lengths or concurrency changed at the same moment. A spike coinciding with longer prompts is prefill; one coinciding with higher concurrency is queueing or batching. Token usage spikes usually mean stop conditions or verbosity changed.',
    goals: ['Decompose latency into attributable phases', 'Correlate spikes with workload shape', 'Diagnose token usage separately'],
    concepts: [
      ['Phase decomposition', 'Queue, prefill, decode — each has its own cause.', 'Without splitting the phases, a single latency number cannot distinguish capacity shortage from a workload shift.'],
      ['Correlate with workload shape', 'Prompt length and concurrency are the usual suspects.', 'Spikes that align with longer prompts implicate prefill. Spikes aligning with arrival rate implicate queueing. Unaligned spikes implicate infrastructure.'],
      ['Token usage is a separate axis', 'More tokens is not slower generation.', 'Excessive token consumption usually traces to missing stop conditions, verbose outputs, or a prompt that invites long answers.'],
      ['Percentiles over averages', 'The tail carries the incident.', 'A p50 that never moves with a p95 that doubles is the classic signature of a capacity or scheduling problem affecting only some requests.']
    ],
    example: { title: 'p95 latency doubled overnight', steps: ['Split p95 into queue, prefill, and decode before anything else.', 'Correlate each against prompt length and arrival rate.', 'If only prefill moved, inspect prompt composition for a change.', 'Separately check tokens per request for stop-condition regressions.'], takeaway: 'Decompose first. The phase that moved names the cause.' },
    views: [
      { name: 'Latency decomposition', note: 'Three segments, three causes.', steps: [['Queue', 'Capacity and arrival rate.'], ['Prefill', 'Prompt length.'], ['Decode', 'Batching and bandwidth.'], ['Compare p95', 'The tail reveals it.']] },
      { name: 'Token usage spike', note: 'A different axis entirely.', steps: [['Tokens per request', 'Measure against baseline.'], ['Stop conditions', 'Did a stop rule stop firing?'], ['Prompt drift', 'Did instructions invite longer output?'], ['Output cap', 'Confirm it is set.']] }
    ],
    precision: 'Latency and token consumption are independent failure axes. Fixing one does not imply the other improved.',
    engineering: 'Keep phase-level percentiles and tokens-per-request on the same dashboard. Their divergence is the diagnostic.',
    checkpoint: { question: 'A p95 spike appears while p50 is unchanged. What does that suggest?', options: ['A global slowdown affecting every request', 'A problem affecting only a subset — capacity, queueing, or a workload shift', 'A model weight change', 'A tokenizer regression'], correct: 1, why: 'If the median is unaffected, the typical request is fine. The problem is concentrated in the tail, which is characteristic of queueing and workload-dependent effects.' }
  },
  10: {
    question: 'After fine-tuning, the model forgot capabilities it had before. How do you investigate?',
    plain: 'Establish that the regression is real with a held-out baseline run before and after using the identical set. Then check whether the fine-tuning distribution overlapped the lost capability at all. If the old data was absent, forgetting is the expected outcome — the fix is replay data or a narrower scope, not a better optimizer.',
    goals: ['Confirm the regression against a baseline', 'Explain forgetting as a distribution problem', 'Choose between replay and scope reduction'],
    concepts: [
      ['Baseline first', 'Compare the same held-out set before and after.', 'Without a pre-tuning evaluation you have no evidence of regression — only a feeling. The set must exist before the run.'],
      ['Distribution explains it', 'What is absent gets overwritten.', 'Fine-tuning on a narrow distribution exerts gradient pressure on shared parameters. Capabilities with no representation in the new data have no counter-signal.'],
      ['Replay is the primary fix', 'Mix old data back in.', 'Keeping a measured fraction of earlier examples in the tuning set directly protects those capabilities, at the cost of some new-task focus.'],
      ['Scope reduction', 'Tune less, or on fewer parameters.', 'If replay is insufficient, narrowing what the tuning is asked to change reduces collateral damage — fewer steps, fewer parameters, or a smaller target behaviour.']
    ],
    example: { title: 'Support-tuning broke general reasoning', steps: ['Run the pre- and post-tuning model on the original held-out set.', 'Confirm the regression is measured, not anecdotal.', 'Check whether old-domain data appeared in the tuning set at all.', 'Add replay at a measured ratio and re-run both evaluations.'], takeaway: 'You cannot protect a capability you never measured or included.' },
    views: [
      { name: 'Confirming regression', note: 'Evidence before remedy.', steps: [['Pre-tuning baseline', 'Run and store.'], ['Tune', 'Apply the change.'], ['Post-tuning', 'Same set, same settings.'], ['Diff', 'Quantify the loss.']] },
      { name: 'Fixes in order', note: 'Escalate only as needed.', steps: [['Replay data', 'Mix in old examples.'], ['Fewer steps', 'Reduce pressure.'], ['Narrow scope', 'Smaller target change.'], ['Partial tuning', 'Adapt fewer parameters.']] }
    ],
    precision: 'Catastrophic forgetting is a property of the training distribution, not a defect in the optimizer. Data mix is the primary lever.',
    engineering: 'Build the regression evaluation before the first adaptation run. Afterward there is no baseline to compare against.',
    checkpoint: { question: 'What most directly explains forgetting after fine-tuning?', options: ['The learning rate being too low', 'The tuning distribution omitting the old capability, so nothing counteracts the update', 'Insufficient model capacity', 'Too much training data'], correct: 1, why: 'Capabilities absent from the tuning data exert no gradient. Shared parameters move toward the new distribution with no signal preserving the old one.' }
  },
  11: {
    question: 'The model is scoring well but behaving badly. Is it reward hacking?',
    plain: 'Check whether the reward and an independent quality measure have diverged. If reward rises while held-out quality is flat or falling, the policy has found a way to satisfy the signal without satisfying the intent — often through verbosity, sycophancy, or confident-sounding unsupported claims.',
    goals: ['Recognize divergence between reward and quality', 'Identify common hacking signatures', 'Design monitoring that catches it'],
    concepts: [
      ['Divergence is the signal', 'Two curves moving apart.', 'Reward is optimized directly; held-out quality is not. When they split, the policy is exploiting something in the reward rather than the goal.'],
      ['Common signatures', 'Verbose, agreeable, confident output.', 'Length, flattery, and assured tone often correlate with preference labels. The policy amplifies these regardless of correctness.'],
      ['Independent evaluation', 'Something the policy cannot see.', 'Held-out human judgement, verifiable checks, or task-level tests that were never part of the training signal.'],
      ['KL divergence as a secondary clue', 'Drift from the reference grows.', 'Rising reward with rising KL from the reference model is a recognizable pattern, though not proof on its own.']
    ],
    example: { title: 'Reward improved but user ratings did not', steps: ['Plot reward and held-out quality on the same timeline.', 'Look for divergence onset and correlate with a training change.', 'Sample outputs and check for length and tone correlations.', 'Add an independent metric to the training loop.'], takeaway: 'Reward alone can never confirm improvement.' },
    views: [
      { name: 'Detecting divergence', note: 'Two measurements, one truth.', steps: [['Training reward', 'Optimized directly.'], ['Held-out quality', 'Never optimized.'], ['Compare', 'Divergence exposes exploitation.'], ['Sample outputs', 'Confirm what changed.']] },
      { name: 'Hacking signatures', note: 'What to look for in text.', steps: [['Verbose', 'Longer answers with the same content.'], ['Sycophantic', 'Agrees regardless of correctness.'], ['Confident', 'Unsupported claims stated as fact.'], ['Style over substance', 'Well-formed, wrong.']] }
    ],
    precision: 'Reward hacking and the alignment tax are distinct failures: one optimizes the wrong target, the other achieves the right one at a cost.',
    engineering: 'Keep reward and independent quality on separate charts forever. Converging lines are fine; divergence means you are measuring the wrong thing.',
    checkpoint: { question: 'What is the clearest sign of reward hacking?', options: ['Training loss failing to decrease', 'Reward rising while held-out quality is flat or falling', 'The model producing shorter outputs', 'Higher GPU utilization'], correct: 1, why: 'The policy is directly optimizing reward, so reward alone will rise regardless. Only an independent measure reveals whether the underlying goal was achieved.' }
  },
  12: {
    question: 'How do you stop proprietary training data from leaking?',
    plain: 'Prevention belongs before training: deduplicate, filter, and scan for sensitive or rare strings, because verbatim retention is most likely for distinctive low-frequency text. After training you can only detect — membership tests and extraction attempts. Prompt-level instructions do nothing; the data was encoded into weights.',
    goals: ['Explain why rare text leaks most', 'Distinguish prevention from detection', 'Design a leakage test'],
    concepts: [
      ['Rarity drives memorization', 'Distinctive low-frequency text is retained.', 'Common text is learned statistically. Rare, unique strings — identifiers, credentials, contract clauses — are memorized nearly verbatim.'],
      ['Prevention is upstream', 'Filtering before training is the only reliable point.', 'Once a secret is in the weights, extraction risk exists permanently. Scrubbing afterwards means retraining.'],
      ['Detection after the fact', 'Membership and extraction testing.', 'Given a candidate string, test whether the model reproduces it at higher rate than a matched control. That is evidence of memorization.'],
      ['Prompt instructions do not help', 'The data is already encoded.', 'Asking the model not to reveal training data is not a control. The mechanism that stored it does not consult the prompt.']
    ],
    example: { title: 'Customer records may have entered training data', steps: ['Identify distinctive strings from the suspected corpus.', 'Test whether the model reproduces them above matched controls.', 'Treat confirmed memorization as requiring retraining, not prompting.', 'Add filtering and dedup to the pipeline for future runs.'], takeaway: 'Leakage prevention is a data-pipeline problem, not a prompt problem.' },
    views: [
      { name: 'Why it memorizes', note: 'Frequency determines retention.', steps: [['Frequent text', 'Learned as patterns.'], ['Rare distinctive text', 'Stored almost verbatim.'], ['Reproduction', 'Prompted correctly, it leaks.'], ['Risk', 'Highest for unique strings.']] },
      { name: 'Prevention then detection', note: 'Two different phases.', steps: [['Before training', 'Dedup and filter — only reliable point.'], ['After training', 'Membership testing.'], ['Confirmed', 'Requires retraining.'], ['Prompting', 'Not a control.']] }
    ],
    precision: 'Detection can show memorization after the fact; it cannot remove it. Remediation means retraining without the data.',
    engineering: 'Run leakage tests on known-sensitive strings as part of release. Their absence from prompts is not evidence of safety.',
    checkpoint: { question: 'Why is prompting the model not to reveal training data ineffective?', options: ['Prompts are too short', 'The data was encoded in the weights during training, independent of the prompt', 'The tokenizer strips the instruction', 'Temperature prevents compliance'], correct: 1, why: 'Memorization happened in the parameters. Nothing at inference time removes it, and instruction text has no access to that mechanism.' }
  },
  13: {
    question: 'How do you evaluate four different quality dimensions at once?',
    plain: 'Do not collapse them. Instruction following, reasoning, factuality, and fluency fail independently — a model can be fluent and well-instructed while reasoning badly. Build a separate measurement for each, with its own data and its own metric, and only then decide what a combined score means for your use case.',
    goals: ['Separate dimensions into distinct measurements', 'Choose metrics that fit each dimension', 'Avoid premature aggregation'],
    concepts: [
      ['Dimensions fail independently', 'One score hides which broke.', 'Fluency is easy to measure and routinely masks reasoning failures. Aggregating first makes regression invisible.'],
      ['Instruction following', 'Did it obey format and constraints?', 'Measured mechanically where possible: schema validity, required sections present, length within bounds, prohibited content absent.'],
      ['Reasoning and factuality', 'Different mechanisms, different tests.', 'Reasoning is checked by verifiable outcomes; factuality by evidence grounding. Neither is captured by a preference rating.'],
      ['Aggregate only at the end', 'Combine after each metric is reported.', 'A weighted composite is a product decision. Publish the components first so the weighting is visible and contestable.']
    ],
    example: { title: 'Define an evaluation for a new deployment', steps: ['List the dimensions that matter for this specific task.', 'Build a separate held-out set per dimension.', 'Choose a metric per dimension — mechanical where possible.', 'Report components; decide any composite weighting explicitly.'], takeaway: 'Measure separately, combine only when the trade-off is a deliberate choice.' },
    views: [
      { name: 'Dimension by dimension', note: 'Each needs its own test.', steps: [['Instruction following', 'Mechanical checks on format.'], ['Reasoning', 'Verifiable outcomes.'], ['Factuality', 'Evidence entailment.'], ['Fluency', 'Surface quality only.']] },
      { name: 'Aggregation order', note: 'Components before composite.', steps: [['Measure each', 'Separate held-out sets.'], ['Report separately', 'Expose what moved.'], ['Decide weights', 'A product decision.'], ['Then combine', 'With weights visible.']] }
    ],
    precision: 'A single "quality" score is not a measurement. It is a weighting choice that can conceal which dimension regressed.',
    engineering: 'If you report one number, publish the components beside it. Otherwise a regression in one dimension can hide behind gains in another.',
    checkpoint: { question: 'Why should dimensions be measured separately before combining?', options: ['It is faster', 'A composite score hides which specific dimension regressed', 'Combined metrics are invalid', 'It requires less test data'], correct: 1, why: 'Aggregating first lets improvements in a cheap-to-measure dimension mask failures in a critical one. Components must be visible before any weighting is applied.' }
  },
  14: {
    question: 'Do Transformers handle images the same way they handle text?',
    plain: 'The attention mechanism transfers, but the input does not. Images are cut into fixed-size patches, each patch becomes a vector, and from there the sequence is processed exactly like tokens. The architecture is largely unchanged; what changed is how a raw image becomes a sequence.',
    goals: ['Describe patch-based input for images', 'Explain why attention transfers', 'Identify what differs from language models'],
    concepts: [
      ['Patching replaces tokenizing', 'Images become a sequence of patches.', 'An image is divided into a grid of fixed patches, each flattened and projected to a vector. The count of patches plays the role token count plays in language.'],
      ['Attention transfers directly', 'The mechanism is modality-agnostic.', 'Once patches are vectors, self-attention, residuals, and normalization operate exactly as they do on text. The architecture needs no rethinking.'],
      ['Position still matters', 'Grid structure must be encoded.', 'Patch order carries the spatial arrangement of the image, so positional information is required for exactly the same reason it is in text.'],
      ['Pretraining scale still decides', 'The recipe carries over.', 'Large-scale pretraining on diverse data produces transferable representations here too, which is why vision transformers follow the same scaling story.']
    ],
    example: { title: 'Explain a vision transformer to someone who knows LLMs', steps: ['Say images are cut into patches, and each patch becomes a vector.', 'Say from there attention works identically to text.', 'Say positional information preserves the grid layout.', 'Say the training recipe — scale and data — is the same lesson again.'], takeaway: 'The architecture is shared; only the input representation differs.' },
    views: [
      { name: 'Image to sequence', note: 'Patching plays the tokenizing role.', steps: [['Image', 'Raw pixel grid.'], ['Patch grid', 'Fixed-size cells.'], ['Flatten and project', 'Each patch becomes a vector.'], ['Sequence', 'Processed like tokens.']] },
      { name: 'What carries over', note: 'Mechanism versus input.', steps: [['Self-attention', 'Unchanged.'], ['Residuals and norm', 'Unchanged.'], ['Positional signal', 'Still required.'], ['Input encoding', 'The real difference.']] }
    ],
    precision: 'A vision transformer is not a different architecture. It is the same architecture with a different input representation scheme.',
    engineering: 'When evaluating multimodal systems, remember the modality gap is usually in the input pipeline and fusion, not in the attention mechanism.',
    checkpoint: { question: 'What replaces tokenization for images in a vision transformer?', options: ['Byte-pair encoding on pixels', 'Dividing the image into fixed-size patches projected to vectors', 'A convolutional stem only', 'Running text captions instead'], correct: 1, why: 'Images are split into a grid of patches, each projected to a vector, producing a sequence that attention then processes exactly like tokens.' }
  },
  15: {
    question: 'Does watermarking actually let you tell who generated a text?',
    plain: 'Statistical watermarking biases token choices so a detectable pattern is present, allowing a detector to score whether text likely came from a model. It works best on reasonably long, unedited text. Paraphrasing, translation, or heavy editing weakens it, and a detector result is a probability, never a proof.',
    goals: ['Describe how statistical watermarking works', 'State where detection is reliable', 'Recognize what it cannot establish'],
    concepts: [
      ['Biased token choice', 'The generator nudges its own sampling.', 'A watermark splits the vocabulary into preferred and non-preferred sets and biases sampling toward one, embedding a statistical signature without obvious text changes.'],
      ['Longer text is easier to detect', 'Signal accumulates with length.', 'Detection is a statistical test over many token choices. Short outputs produce weak evidence and higher error rates.'],
      ['Editing weakens the signal', 'Paraphrase and translation degrade it.', 'Rewriting changes the token sequence, so much of the embedded pattern is lost. Robustness to rewriting is the central limitation.'],
      ['A probability, not a verdict', 'Detectors report likelihood.', 'No watermarking scheme establishes authorship with certainty. A detector score is evidence about a distribution, not proof about a document.']
    ],
    example: { title: 'A detector flagged a student submission', steps: ['Check the text length — short texts give unreliable scores.', 'Confirm whether the model in question actually applies watermarking.', 'Test robustness against any editing the document may have seen.', 'Treat the score as evidence requiring corroboration, not a verdict.'], takeaway: 'Detection is statistical evidence on long unedited text — never proof about one document.' },
    views: [
      { name: 'How detection works', note: 'Pattern embedded at generation.', steps: [['Generator', 'Biases token choice.'], ['Text carries pattern', 'Statistical, not visible.'], ['Detector', 'Scores the sequence.'], ['Result', 'A likelihood, not a verdict.']] },
      { name: 'Where it weakens', note: 'The practical limits.', steps: [['Short text', 'Too few samples.'], ['Paraphrase', 'Pattern partly lost.'], ['Translation', 'Token sequence replaced.'], ['Conclusion', 'Corroborate, do not convict.']] }
    ],
    precision: 'Watermarking establishes a statistical likelihood of machine origin for a given text under a given model. It does not establish authorship.',
    engineering: 'Never act on a detector score alone. Require corroboration, and document the detector’s known false-positive behaviour.',
    checkpoint: { question: 'When is watermark detection most reliable?', options: ['On very short texts', 'On long, unedited text generated by a model that applies watermarking', 'After the text has been paraphrased', 'On handwritten text'], correct: 1, why: 'Detection is a statistical test over many token choices, so it needs length and needs the original token sequence to be intact.' }
  },
  16: {
    question: 'Is recursive self-improvement something you can evaluate today?',
    plain: 'Mostly no, and the honest answer matters. Claims about recursive self-improvement often describe systems that improve code or tools under human supervision, not systems that redesign themselves. Evaluate what a system actually does — measurable task gains, autonomy level, and human involvement — rather than the framing attached to it.',
    goals: ['Separate measurable behaviour from claims', 'Define what autonomy actually means', 'Design evaluation for capability claims'],
    concepts: [
      ['Evaluate the behaviour, not the label', 'Claims outrun evidence.', 'Terms like recursive self-improvement carry connotations the system may not support. Ask what was measured and by whom.'],
      ['Autonomy is a spectrum', 'From suggest to act to redesign.', 'A system that proposes changes under review is different from one that applies them unattended. State the level explicitly.'],
      ['Improvement must be measured', 'On a held-out task, against a baseline.', 'A claim of self-improvement requires measured gains on tasks the system was not tuned against, with the baseline fixed in advance.'],
      ['Alternative architectures deserve the same scrutiny', 'Novelty is not evidence.', 'New reasoning architectures should be evaluated by the same standard: what did they measure, on what set, against what baseline.']
    ],
    example: { title: 'Evaluating an ambitious capability claim', steps: ['Ask what was measured, on which set, against what baseline.', 'Determine the actual autonomy level and human involvement.', 'Separate demonstrated behaviour from projected capability.', 'State uncertainty explicitly in any report.'], takeaway: 'Measured behaviour on a fixed baseline, not terminology, is what you can evaluate.' },
    views: [
      { name: 'What to ask', note: 'Four questions for any claim.', steps: [['What was measured?', 'The actual metric.'], ['On what set?', 'Held-out, not tuned.'], ['Against what baseline?', 'Fixed in advance.'], ['At what autonomy?', 'Suggest or act.']] },
      { name: 'Autonomy spectrum', note: 'Where the system actually sits.', steps: [['Suggests', 'Human decides and applies.'], ['Acts', 'Within scoped tools.'], ['Iterates', 'Repeated cycles with review.'], ['Self-modifies', 'Not demonstrated in practice.']] }
    ],
    precision: 'Most systems described as recursive improve artifacts under supervision. True self-redesign without human involvement is not an established, measurable capability.',
    engineering: 'Report demonstrated behaviour and measured gains. Keep projected capability clearly separated and marked as projection.',
    checkpoint: { question: 'What would support a claim of self-improvement?', options: ['A compelling system name', 'Measured held-out task gains against a baseline fixed in advance, at a stated autonomy level', 'A large model parameter count', 'Positive user feedback'], correct: 1, why: 'Improvement is a comparative claim. Without a held-out set, a pre-fixed baseline, and an explicit autonomy level, there is nothing measurable to evaluate.' }
  }
};

export function getReliabilityGuide(id) {
  return reliabilityGuides[id];
}
