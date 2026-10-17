/** Supplemental non-repeating interviewer probes and strong-answer rubrics.
 * Existing authored A–F sections in courses.json remain the technical base.
 */
const extraQuestions = {
  1:['Your prompt works for common tickets but fails on high-impact refunds. Which boundary do you change first?', 'How do you attribute a regression when retrieval, model and template versions all changed together?'],
  2:['How do you keep a nearest-neighbor few-shot selection system from leaking holdout labels?', 'What test distinguishes genuine few-shot gains from a label-prior shift?'],
  3:['When is concise structured decomposition preferable to exposing extensive reasoning?', 'How do you separate faulty arithmetic from unsupported intermediate premises?'],
  4:['Estimate how the marginal cost changes if you move from three to seven samples.', 'What evidence shows that your samples are diverse enough to justify voting?'],
  5:['How would you prevent duplicate state expansion across two alternative search branches?', 'What failure mode appears if the branch scorer systematically favors fluent but invalid plans?'],
  6:['A tool call returns 504 after a non-idempotent write. Walk through exact recovery.', 'How do you establish that a tool observation cannot silently approve a new action?'],
  7:['What happens if trusted instructions accidentally interpolate retrieved source text?', 'Can a system message enforce tenant authorization? Explain your architecture instead.'],
  8:['A schema accepts the right keys but marks sum to the wrong total. Where should this fail?', 'How do constrained decoding, parser validation and tool authorization compose?'],
  9:['Design an injection evaluation that measures prohibited actions rather than refusals.', 'How do you test a retrieved summarizer that launders an injected instruction into a later plan?'],
  10:['How do you detect regression in legitimate-user completion after a guardrail update?', 'Which tests establish multilingual coverage without publishing an attack playbook?'],
  11:['A provider reports a cache hit but end-to-end p95 worsens. Where would you trace time?', 'Estimate token cost before and after removing an unnecessary 500-token output.'],
  12:['What is trainable in soft prompt tuning, and how does it differ from LoRA?', 'What evidence would justify supporting a model-specific soft prompt artifact in production?'],
  13:['What tests cover injection in template variables without executing the malicious request?', 'How should template and parser versions be rolled forward or reverted together?'],
  14:['How do you compact chat while preserving source provenance and corrections?', 'A user revokes approval after compaction. Which durable state is authoritative?'],
  15:['How would you ablate persona text while holding the task rubric fixed?', 'Can an expert persona worsen uncertainty calibration on unseen topics?'],
  16:['Compute the serial latency impact of adding three LLM stages to a workflow.', 'Where must retries be idempotent, and how do you stop invalid upstream artifacts?'],
  17:['A candidate improves judge scores but fails exact-match evaluation. Should you ship?', 'How do you prevent contamination of a final holdout during repeated prompt optimization?'],
  18:['Who approves generated prompt instructions before they become trusted configuration?', 'How would you detect candidate overfitting when the generator also critiques its own prompts?'],
  19:['Show an ablation that differentiates missing evidence from weak instruction following.', 'Which observability fields are enough to reproduce a failure without storing secrets?'],
  20:['What happens if a context-truncation method deletes a critical contract exception?', 'How do you measure both false refusals and unauthorized-action prevention?'],
  21:['Design a position-controlled evaluation with a matched context length.', 'What trade-offs arise if reranking drops a qualifying clause in the middle of a section?'],
  22:['How do you treat provider refusal, stream cutoff and schema mismatch differently?', 'A tool side effect completed before parsing failed. What is safe retry behavior?'],
  23:['How do you evaluate romanized Bangla and English technical terms in one request?', 'How do you keep localized output values compatible with a stable API schema?'],
  24:['What experiment quantifies worst-case permutation sensitivity?', 'How do you choose exemplars without introducing test-label leakage or class imbalance?'],
  25:['Explain a metric for prediction disagreement among equivalent paraphrases.', 'Under what traffic and taxonomy constraints would a simple classifier outperform an LLM?'],
  26:['How do you confirm that a generated hidden-prompt reconstruction is a true leak?', 'An authenticated user infers a secret formula from repeated outputs. What changes outside the model?'],
  27:['How can untrusted summary content be prevented from obtaining trusted-tool authority?', 'Which tool scopes and approvals protect the workspace if the model is successfully injected?'],
  28:['A reasoning prompt doubles token use with no accuracy gain. How do you diagnose it?', 'Which failures require retrieval, a calculator or schema validation rather than extra reasoning?'],
  29:['Design a layer-by-layer experiment for a Bengali OCR plus retrieval failure.', 'What test isolates multilingual retrieval recall from generation quality?'],
  30:['How do you know that an English intent label has the same meaning in Bengali?', 'When would a few native demonstrations beat translation, and when is tuning justified?']
};
const strongResponse = {
  1:'Identify the exact task contract, model/prompt/source versions, an enforced backend boundary, matched test cases and a severity-aware rollback gate.',
  2:'Specify the label taxonomy, balanced exemplar selection, leakage-free holdout, order permutations, class-level results and added token cost.',
  3:'Distinguish final-answer correctness from explanation plausibility, select verifiable substeps, calculate tool-versus-reasoning trade-offs and state when no extra steps help.',
  4:'Describe normalized answers, tie handling, sample correlation, aggregation versus verification and the marginal per-request token/latency cost.',
  5:'Define state representation, branch/evaluation logic, pruning risks, bounded complexity and why a deterministic constraint solver may dominate.',
  6:'Name backend authorization, input schemas, idempotency keys, explicit loop limits, untrusted tool observations and side-effect recovery.',
  7:'Explain actual typed API roles, source trust levels, prompt secrecy limits and tool-authorization checks independent of model output.',
  8:'Separate completed-stream detection, syntax parse, schema and cross-field validation, permission checks, bounded retries and failure metrics.',
  9:'Trace attacker control from source to action, isolate the trust boundary, enforce capability restrictions and evaluate both attack blocks and legitimate task completion.',
  10:'Specify threat models and input channels, per-language adversarial/benign slices, tool-level controls and refusal false-positive/false-negative rates.',
  11:'Break latency into queue/network, prefill, decode and tools; estimate cost using input/output token rates, caching behavior and a fixed quality floor.',
  12:'Differentiate discrete text tokens from optimized continuous prompt vectors; explain gradient training, frozen weights, compatibility and deployment rollback.',
  13:'List typed variables, role separation, length/encoding checks, stable schema contracts, template hashes and tests for missing/hostile fields.',
  14:'Specify recent turns, provenance-aware summaries, durable workflow state, explicit approvals and how summaries are prevented from acting as authority.',
  15:'Name the target behavior and rubric, ablate persona text, measure factual quality and uncertainty calibration, and reject unsupported credential claims.',
  16:'Identify stage contracts, validation gates, dependency graph, serial latency/cost, failure propagation, retries and single-call comparisons.',
  17:'Specify representative holdouts, paired control conditions, exact/task metrics, calibrated judges, thresholds declared in advance and rollout/rollback.',
  18:'Keep synthesis separate from approval and independent evaluation; include artifact versioning, input specification, holdout isolation and model-judge limitations.',
  19:'Show a reproducible trace, one-variable ablations, layer-specific failure labels, a targeted repair and a regression fixture.',
  20:'Describe contract validation, honest abstention, data provenance, safe truncation, least privilege and a mixed benign/adversarial edge-case matrix.',
  21:'Control context length and position independently, check citation-supported correctness, evaluate reranking loss and avoid claiming universal U-shaped behavior.',
  22:'Distinguish incomplete generation, parser syntax, schema/semantic validation, refusal and idempotent action recovery with specific error counters.',
  23:'Separate language/script/locale, handle regional units, maintain stable schema IDs and evaluate native, romanized and code-switched user data.',
  24:'Quantify ordering variance, audit contradictory labels, choose diverse demonstrations, protect holdout data and compare against zero-shot.',
  25:'Define reviewed labels, paraphrase-equivalent fixtures, invariance and accuracy metrics, model/temperature controls and a simple classifier baseline.',
  26:'Assume model-visible text can leak, verify actual exposure, move secrets and pricing into scoped backend services and enforce outbound data policy.',
  27:'Keep source provenance through summarization, restrict file/network capabilities, approve side effects and measure attempted versus executed unsafe actions.',
  28:'Classify failure as knowledge, reasoning, arithmetic or format; test matched baselines, tool verification, token cost and final exact correctness.',
  29:'Measure input extraction, multilingual retrieval, grounded generation and locale validation independently with native-language labels.',
  30:'Define zero-shot task transfer precisely, check label equivalence with native annotators, evaluate small bilingual interventions and justify tuning with held-out gains.'
};
const encode = text => text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
export function enrichPromptInterviewSections(lesson) {
  if (!extraQuestions[lesson.id] || lesson.sections?.length !== 6) return lesson;
  return { ...lesson, sections: lesson.sections.map(section => {
    if (section.letter === 'A') {
      const added = extraQuestions[lesson.id].map(q => `<li>${encode(q)}</li>`).join('');
      return { ...section, html: section.html.replace('</ol>',`${added}</ol>`), text: section.text + ' ' + extraQuestions[lesson.id].join(' ') };
    }
    if (section.letter === 'D') {
      const heading = 'A strong response must include';
      const explanation = strongResponse[lesson.id];
      return { ...section, html: section.html + `<div class="pressure-rubric"><h4>${heading}</h4><p>${encode(explanation)}</p></div>`, text: section.text + ' ' + heading + ': ' + explanation };
    }
    return section;
  }) };
}
