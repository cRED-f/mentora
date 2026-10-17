// Native, dependency-free interactions for each LLM Foundations learning path.
// All authored instructional text comes from Astro-rendered HTML; no unsafe HTML injection.
(() => {
  'use strict';
  document.querySelectorAll('[data-foundation-path]').forEach(root => {
    const views = [...root.querySelectorAll('[data-foundation-view]')];
    const viewButtons = [...root.querySelectorAll('[data-foundation-view-button]')];
    const playButton = root.querySelector('[data-foundation-play]');
    const prevButton = root.querySelector('[data-foundation-prev]');
    const nextButton = root.querySelector('[data-foundation-next]');
    const status = root.querySelector('[data-foundation-animation-status]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let activeView = 0;
    let timer = null;

    const currentView = () => views[activeView];
    const getSelected = view => Math.max(0, [...view.querySelectorAll('[data-foundation-step]')].findIndex(step => step.classList.contains('is-active')));
    function stopPlayback() {
      if (timer !== null) { window.clearInterval(timer); timer = null; }
      playButton?.setAttribute('aria-pressed','false');
      if (playButton) playButton.textContent = '▷ Play flow';
      if (status) status.textContent = `Step ${getSelected(currentView()) + 1} selected · Manual mode`;
    }
    function selectStep(view, selectedIndex) {
      const steps = [...view.querySelectorAll('[data-foundation-step]')];
      const selected = steps[selectedIndex];
      if (!selected) return;
      steps.forEach((step, index) => {
        const active = index === selectedIndex;
        step.classList.toggle('is-active', active);
        step.setAttribute('aria-pressed', String(active));
      });
      const counter = view.querySelector('[data-foundation-stage-counter]');
      if (counter) counter.textContent = `STAGE ${String(selectedIndex + 1).padStart(2, '0')} / ${String(steps.length).padStart(2, '0')}`;
      view.querySelector('[data-foundation-stage-title]').textContent = selected.querySelector('.foundation-node-title').textContent;
      view.querySelector('[data-foundation-stage-explanation]').textContent = selected.dataset.explanation;
      const progress = view.querySelector('[data-foundation-step-progress]');
      if (progress) {
        progress.setAttribute('aria-valuenow',String(selectedIndex + 1));
        progress.querySelector('span').style.width = `${(selectedIndex + 1) / steps.length * 100}%`;
      }
      if (status) status.textContent = `Stage ${selectedIndex + 1} of ${steps.length}${timer === null ? ' · Manual mode' : ' · Playing'}`;
    }
    function changeView(index) {
      stopPlayback();
      activeView = index;
      views.forEach((view, i) => { view.hidden = i !== index; });
      viewButtons.forEach((other, i) => {
        const active = i === index;
        other.classList.toggle('is-active', active);
        other.setAttribute('aria-pressed', String(active));
      });
      selectStep(currentView(), getSelected(currentView()));
    }
    viewButtons.forEach((button, index) => button.addEventListener('click', () => changeView(index)));
    views.forEach(view => view.querySelectorAll('[data-foundation-step]').forEach((button, index) => {
      button.addEventListener('click', () => { stopPlayback(); selectStep(view, index); });
    }));
    function advance(direction) {
      const view = currentView();
      const count = view.querySelectorAll('[data-foundation-step]').length;
      selectStep(view, (getSelected(view) + direction + count) % count);
    }
    nextButton?.addEventListener('click', () => { stopPlayback(); advance(1); });
    prevButton?.addEventListener('click', () => { stopPlayback(); advance(-1); });
    playButton?.addEventListener('click', () => {
      if (timer !== null) { stopPlayback(); return; }
      if (reducedMotion.matches) { advance(1); return; }
      playButton.setAttribute('aria-pressed','true');
      playButton.textContent = 'Ⅱ Pause flow';
      timer = window.setInterval(() => advance(1), 1750);
      selectStep(currentView(),getSelected(currentView()));
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopPlayback(); });
    reducedMotion.addEventListener?.('change', () => { if (reducedMotion.matches) stopPlayback(); });

    const workbench = root.querySelector('[data-prompt-workbench]');
    if (workbench) {
      const source = workbench.querySelector('.foundation-workbench-source');
      const visible = workbench.querySelector('[data-prompt-visible]');
      const insight = workbench.querySelector('[data-prompt-insight]');
      workbench.querySelectorAll('[data-prompt-variant]').forEach(button => {
        button.addEventListener('click', () => {
          const strong = button.dataset.promptVariant === 'strong';
          visible.textContent = strong ? source.dataset.strong : source.dataset.weak;
          insight.textContent = strong ? source.dataset.observation : 'The baseline leaves important requirements implicit. Compare it with the stronger, more testable version.';
          workbench.querySelectorAll('[data-prompt-variant]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
          workbench.classList.toggle('is-revised',strong);
        });
      });
    }

    const check = root.querySelector('[data-foundation-check]');
    if (!check) return;
    const feedback = check.querySelector('[data-foundation-feedback]');
    const feedbackHeading = check.querySelector('[data-foundation-feedback-heading]');
    check.querySelectorAll('[data-foundation-answer]').forEach(button => button.addEventListener('click', () => {
      const correct = button.dataset.correct === 'true';
      check.querySelectorAll('[data-foundation-answer]').forEach(other => {
        const selected = button === other;
        other.classList.toggle('is-selected', selected);
        other.classList.toggle('is-correct', selected && correct);
        other.classList.toggle('is-incorrect', selected && !correct);
        other.setAttribute('aria-pressed', String(selected));
      });
      feedback.hidden = false;
      feedback.classList.toggle('is-correct', correct);
      feedbackHeading.textContent = correct ? 'Correct — you have the key idea.' : 'Not quite — read the explanation and try again.';
    }));
  });
})();

// Mechanism exercises use small, explicit toy inputs. No remote model calls.
(() => {
  'use strict';
  document.querySelectorAll('[data-foundation-ask]').forEach(button => {
    button.addEventListener('click', () => window.dispatchEvent(new CustomEvent('mentora:ask-tutor', {
      detail: { prompt: `Teach the topic: "${button.dataset.foundationAsk}". Start with how it works, then why it works, math, alternatives, failure modes and a production example. Use the A–F structure and end with one interview question. Do not reveal that question's answer until I respond.` }
    })));
  });

  const sampling = document.querySelector('[data-foundation-sampling]');
  if (sampling) {
    const slider = sampling.querySelector('[data-foundation-temperature]');
    function render() {
      const t = Number(slider.value);
      const scores = [2,1,0].map(x => Math.exp((x - 2) / t));
      const total = scores.reduce((a,b) => a + b, 0);
      sampling.querySelector('[data-temperature-value]').textContent = t.toFixed(1);
      scores.forEach((score,i) => {
        const value = score / total;
        sampling.querySelector(`[data-foundation-probability="${i}"]`).style.width = `${value*100}%`;
        sampling.querySelector(`[data-foundation-probability-label="${i}"]`).textContent = `${(value*100).toFixed(1)}%`;
      });
    }
    slider.addEventListener('input', render);
    render();
  }

  const mask = document.querySelector('[data-foundation-mask]');
  if (mask) {
    const buttons = [...mask.querySelectorAll('[data-foundation-query]')];
    const cells = [...mask.querySelectorAll('[data-mask-row]')];
    const result = mask.querySelector('[data-foundation-mask-result]');
    function select(query) {
      buttons.forEach((button,i) => button.setAttribute('aria-pressed', String(i === query)));
      cells.forEach(cell => cell.classList.toggle('is-query', Number(cell.dataset.maskRow) === query && Number(cell.dataset.maskCol) <= query));
      const tokens = Array.from({ length: query + 1 },(_,i) => i + 1).join(', ');
      result.textContent = `Token ${query + 1} can attend to tokens ${tokens}; ${4 - query} future position(s) are blocked by the causal mask.`;
    }
    buttons.forEach((button,i) => button.addEventListener('click', () => select(i)));
    select(2);
  }

  const kv = document.querySelector('[data-foundation-kv]');
  if (kv) {
    const length = kv.querySelector('[data-kv-length]');
    const heads = kv.querySelector('[data-kv-heads]');
    function render() {
      const bytes = 2 * 1 * Number(length.value) * 32 * Number(heads.value) * 128 * 2;
      kv.querySelector('[data-kv-length-label]').textContent = Number(length.value).toLocaleString('en-US');
      kv.querySelector('[data-kv-result]').textContent = `${(bytes / 2**20).toLocaleString('en-US', {maximumFractionDigits:1})} MiB`;
    }
    length.addEventListener('input', render);
    heads.addEventListener('change', render);
    render();
  }
})();
