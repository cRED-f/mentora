(() => {
  'use strict';
  const root = document.querySelector('[data-foundations-exercise]');
  if (!root) return;
  const find = (selector) => root.querySelector(selector);
  const all = (selector) => [...root.querySelectorAll(selector)];
  const select = (selector, active, value) => {
    all(selector).forEach(button => {
      const selected = button.dataset[active] === String(value);
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  };

  if (root.dataset.foundationsExercise === '1') {
    const steps = [
      ['Data selection', 'Broad data determines coverage, gaps, contamination, licensing constraints, and bias before optimization starts.'],
      ['Pretraining objective', 'Loss functions such as next-token cross-entropy update shared parameters with gradient-based optimization.'],
      ['Reusable weights', 'The resulting θ is an imperfect statistical model; it is not a verified store of facts or permissions.'],
      ['Application adaptation', 'Prompting, external context, retrieval, tools, and optional fine-tuning specialize behavior for a real task.'],
      ['Deployment and evaluation', 'Runtime software enforces access, retries, side-effect controls, output validation, logging, and measurable acceptance criteria.']
    ];
    all('[data-flow-step]').forEach(button => button.addEventListener('click', () => {
      const index = Number(button.dataset.flowStep);
      select('[data-flow-step]', 'flowStep', index);
      find('[data-flow-description]').replaceChildren();
      const title = document.createElement('strong'); title.textContent = steps[index][0];
      const paragraph = document.createElement('p'); paragraph.textContent = steps[index][1];
      find('[data-flow-description]').append(title, paragraph);
    }));
  }

  if (root.dataset.foundationsExercise === '4') {
    const vocab = ['a reliable API', 'the update', 'a new model', 'a database'];
    const logits = [[2.3, 1.5, .6, -.3], [.9, 2.4, 1.2, 0], [1.3, .5, 2.1, -.2], [.7, 1.6, 1.4, .1]];
    let tokens = [];
    function probabilities() {
      const previous = tokens.length ? vocab.indexOf(tokens[tokens.length - 1]) : -1;
      const source = logits[Math.min(tokens.length, 3)].map((value, i) => value + (i === previous ? .35 : 0));
      const temperature = Number(find('[data-temperature]').value);
      const weights = source.map(x => Math.exp((x - Math.max(...source)) / temperature));
      const total = weights.reduce((a, b) => a + b, 0);
      return weights.map(x => x / total);
    }
    function draw() {
      find('[data-temp-label]').textContent = Number(find('[data-temperature]').value).toFixed(1);
      const phrase = find('[data-generated]');
      phrase.replaceChildren(document.createTextNode('The engineer deployed'));
      tokens.forEach(token => {
        const el = document.createElement('span'); el.className = 'mentora-token generated'; el.textContent = token;
        phrase.append(' ', el);
      });
      const chart = find('[data-probabilities]'); chart.replaceChildren();
      probabilities().forEach((p, i) => {
        const line = document.createElement('div'); line.className = 'mentora-prob-row';
        const label = document.createElement('span'); label.textContent = vocab[i];
        const rail = document.createElement('div'); rail.className = 'mentora-prob-rail';
        const fill = document.createElement('div'); fill.className = 'mentora-prob-fill'; fill.style.width = `${(p * 100).toFixed(1)}%`; rail.append(fill);
        const percentage = document.createElement('b'); percentage.textContent = `${(p * 100).toFixed(1)}%`;
        line.append(label, rail, percentage); chart.append(line);
      });
      find('[data-generation-note]').textContent = `Teaching distribution · ${tokens.length ? `Illustrative step ${tokens.length + 1} (prior selected tokens condition the next distribution)` : 'Probability of the first continuation'}. Temperature controls concentration, not correctness.`;
    }
    const append = (greedy) => {
      if (tokens.length >= 8) return;
      const p = probabilities();
      let index = 0;
      if (greedy) index = p.indexOf(Math.max(...p));
      else {
        let r = Math.random();
        for (index = 0; index < p.length - 1; index++) { r -= p[index]; if (r <= 0) break; }
      }
      tokens.push(vocab[index]); draw();
    };
    find('[data-temperature]').addEventListener('input', draw);
    find('[data-greedy]').addEventListener('click', () => append(true));
    find('[data-sample]').addEventListener('click', () => append(false));
    find('[data-reset]').addEventListener('click', () => { tokens = []; draw(); });
    draw();
  }

  if (root.dataset.foundationsExercise === '5') {
    function showObjective(mode) {
      select('[data-objective]', 'objective', mode);
      const ar = mode === 'ar';
      const values = ar ? ['The', 'bank', 'approved', 'the', '?', '(unseen)', '(unseen)'] : ['The', 'bank', 'approved', 'the', '[MASK]', 'yesterday', '.'];
      const target = find('[data-context-tokens]'); target.replaceChildren();
      values.forEach((token, i) => {
        const span = document.createElement('span'); span.className = `mentora-token${i === 4 ? ' masked' : ''}${ar && i > 4 ? ' muted' : ''}`;
        span.textContent = token; target.append(span);
      });
      const description = find('[data-context-description]'); description.replaceChildren();
      const title = document.createElement('strong'); title.textContent = ar ? 'Autoregressive (AR)' : 'Masked language modeling (MLM)';
      const paragraph = document.createElement('p'); paragraph.textContent = ar
        ? 'The model predicts the next token using only the preceding tokens. Future text has not been generated yet.'
        : 'The model can use both earlier and later unmasked context to reconstruct the hidden token. This objective does not inherently train a streaming text generator.';
      description.append(title, paragraph);
    }
    all('[data-objective]').forEach(button => button.addEventListener('click', () => showObjective(button.dataset.objective)));
    showObjective('ar');
  }

  if (root.dataset.foundationsExercise === '6') {
    const architectures = [
      ['Encoder-only', 'Every source position can attend to earlier and later source tokens. Use contextual representations for classification, tagging, or embeddings; next-token generation is not its core objective.'],
      ['Decoder-only', 'Causal attention hides future positions. Prompt and continuation form a common prefix; each decode step emits next-token logits, while prefill can process prompt positions in parallel.'],
      ['Encoder-decoder', 'The bidirectional encoder represents the source. The causal target decoder uses cross-attention with Q from its hidden states and K/V from encoder outputs.']
    ];
    function describe(index) {
      select('[data-architecture]', 'architecture', index);
      const el = find('[data-architecture-description]'); el.replaceChildren();
      const title = document.createElement('strong'); title.textContent = architectures[index][0];
      const paragraph = document.createElement('p'); paragraph.textContent = architectures[index][1];
      el.append(title, paragraph);
    }
    all('[data-architecture]').forEach(button => button.addEventListener('click', () => describe(Number(button.dataset.architecture))));
    describe(0);
  }

  if (root.dataset.foundationsExercise === '8') {
    const stages = [
      ['Client + auth', 'User sends content and conversation state; the serving layer authenticates, rate-limits, and checks permissions.'],
      ['Context assembly', 'Application composes instructions, conversation history, retrieved documents, and tools within a token budget.'],
      ['Tokenize', 'The model-specific tokenizer converts serialized content to token IDs; input length affects prefill.'],
      ['Prefill', 'The model processes prompt tokens, computes attention, and generally writes a KV cache for subsequent decoding.'],
      ['Decode', 'Next-token logits and a decoding policy select one new token at a time; cached keys and values reduce recomputation.'],
      ['Tools (optional)', 'A structured tool call may trigger an external operation after authorization, and its result becomes model context.'],
      ['Stream + finish', 'Chunks reach the UI; the application handles validation, stop conditions, persistence, disconnects, and errors.']
    ];
    const wrapper = find('[data-pipeline]');
    stages.forEach((step, i) => {
      const button = document.createElement('button'); button.type = 'button'; button.dataset.stage = String(i);
      button.textContent = `${i + 1}. ${step[0]}`; button.addEventListener('click', () => show(i)); wrapper.append(button);
    });
    let index = 0, timer = null;
    function show(i) {
      index = (i + stages.length) % stages.length;
      all('[data-stage]').forEach((button, j) => { button.classList.toggle('selected', j === index); button.setAttribute('aria-pressed', String(j === index)); });
      const target = find('[data-pipeline-description]'); target.replaceChildren();
      const heading = document.createElement('strong'); heading.textContent = `${index + 1}. ${stages[index][0]}`;
      const body = document.createElement('p'); body.textContent = stages[index][1];
      target.append(heading, body);
    }
    function stop() {
      if (timer !== null) window.clearInterval(timer);
      timer = null; find('[data-stage-play]').textContent = '▶ Auto-play'; find('[data-stage-play]').setAttribute('aria-pressed', 'false');
    }
    find('[data-stage-previous]').addEventListener('click', () => { stop(); show(index - 1); });
    find('[data-stage-next]').addEventListener('click', () => { stop(); show(index + 1); });
    find('[data-stage-play]').addEventListener('click', () => {
      if (timer !== null) { stop(); return; }
      timer = window.setInterval(() => show(index + 1), 1350);
      find('[data-stage-play]').textContent = 'Ⅱ Pause'; find('[data-stage-play]').setAttribute('aria-pressed', 'true');
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
    show(0);
  }

  if (root.dataset.foundationsExercise === '10') {
    function route() {
      const task = find('[data-task-type]').value;
      const latency = Number(find('[data-latency]').value);
      const privacy = Number(find('[data-privacy]').value);
      const budget = Number(find('[data-budget]').value);
      const picks = {
        classification: ['Compact encoder / SLM', 'Fixed labels and tight quality metrics make a small calibrated classifier a strong baseline; test simpler rules first.'],
        generation: ['LLM + grounded retrieval', 'Source-grounded open-ended writing favors a generative model with permissions, citation checks, and output validation.'],
        reasoning: ['Reasoning-capable LLM + verifier', 'Multi-step tasks may justify more inference-time compute, with verifiers and escalation when possible.']
      };
      const [choice, base] = picks[task];
      let reason = base;
      if (privacy > 0) reason += ' Restrict deployment to approved infrastructure and license-eligible weights; confirm operational data isolation.';
      if (latency <= 2 || budget >= 4) reason += ' Favor the smallest passing model, bounded output, caching, and measured routing at matched quality.';
      find('[data-router-choice]').textContent = task === 'reasoning' && (latency <= 2 || budget >= 4) ? 'Tiered SLM → reasoning-model escalation' : choice;
      find('[data-router-why]').textContent = reason;
      find('[data-latency-label]').textContent = `${latency} / 5`;
      find('[data-privacy-label]').textContent = ['None', 'Preferred', 'Required'][privacy];
      find('[data-budget-label]').textContent = `${budget} / 5`;
    }
    all('input, select').forEach(input => input.addEventListener('input', route)); route();
  }

  const review = document.querySelector('[data-capstone-review]');
  review?.addEventListener('click', () => {
    const answer = document.querySelector('[data-capstone-answer]').value.trim();
    const status = document.querySelector('[data-capstone-status]');
    if (!answer) { status.textContent = 'Write an answer before asking the tutor to review it.'; return; }
    const prompt = `Evaluate my LLM Foundations capstone answer as a senior AI engineering interviewer. Judge correctness, technical depth, completeness, clarity, and engineering trade-offs; identify missing validation and failure modes, then ask a harder follow-up.\n\nChallenge: Design an enterprise document platform for 12-label classification, cited summaries, and multi-document question answering with approved-infrastructure privacy, bursty traffic, and low p95 latency.\n\nMy answer:\n${answer}`;
    // The normal Mentora tutor workflow handles the request: no separate model UI.
    window.dispatchEvent(new CustomEvent('mentora:ask-tutor', { detail: { prompt } }));
    status.textContent = 'Draft placed in the Mentora tutor. Review and send when ready.';
  });
  document.querySelector('[data-capstone-clear]')?.addEventListener('click', () => {
    document.querySelector('[data-capstone-answer]').value = '';
    document.querySelector('[data-capstone-status]').textContent = 'Draft cleared.';
  });
})();
