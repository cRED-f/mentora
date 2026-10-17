// All experiments operate only on their fixed toy inputs: no backend or model calls.
(() => {
  'use strict';
  document.querySelectorAll('[data-prompt-exercise]').forEach(root => {
    const id = Number(root.dataset.promptExercise);
    if (id === 2) {
      const examples = [
        'Review: "Love the camera" → positive',
        'Review: "Crashes every hour" → negative',
        'Review: "Package arrived" → neutral'
      ];
      function render(shots) {
        root.querySelectorAll('[data-shot]').forEach(btn => btn.setAttribute('aria-pressed',String(Number(btn.dataset.shot) === shots)));
        const text = 'Task: classify a review as positive, negative, or neutral.\n';
        root.querySelector('[data-shots-render]').textContent = text + (shots ? '\nDemonstrations:\n' + examples.slice(0,shots).join('\n') + '\n' : '') + '\nTarget: "The display works as advertised."\nLabel:';
        root.querySelector('[data-shots-summary]').textContent = `${shots} labeled demonstration${shots === 1 ? '' : 's'} in context. Model weights stay unchanged.`;
      }
      root.querySelectorAll('[data-shot]').forEach(btn => btn.addEventListener('click',() => render(Number(btn.dataset.shot))));
      render(0);
    }
    if (id === 4) {
      const samples = [12,14,12,12,14,12,15];
      const slider = root.querySelector('[data-vote-slider]');
      function render() {
        const n = Number(slider.value);
        const selected = samples.slice(0,n);
        const counts = new Map();
        selected.forEach(value => counts.set(value,(counts.get(value) ?? 0) + 1));
        const top = Math.max(...counts.values());
        const leaders = [...counts].filter(([,count]) => count === top).map(([value]) => value);
        root.querySelector('[data-vote-count]').textContent = n;
        const chips = root.querySelector('[data-vote-chips]');
        chips.replaceChildren();
        selected.forEach((value,i) => {
          const chip = document.createElement('span');
          chip.textContent = `Sample ${i + 1}: ${value}`;
          if (leaders.length === 1 && value === leaders[0]) chip.classList.add('is-leading');
          chips.append(chip);
        });
        root.querySelector('[data-vote-result]').textContent = leaders.length === 1 ? `Most common answer: ${leaders[0]} (${top}/${n} votes). Still needs verification.` : `Tie among ${leaders.join(', ')} (${top} vote${top === 1 ? '' : 's'} each). Abstain or use a declared tie-break rule.`;
      }
      slider.addEventListener('input',render); render();
    }
    if (id === 5) {
      const width = root.querySelector('[data-tree-width]');
      const depth = root.querySelector('[data-tree-depth]');
      function render() {
        const b = Number(width.value), d = Number(depth.value);
        const levels = Array.from({length:d + 1},(_,i) => b ** i);
        const total = levels.reduce((a,b) => a + b,0);
        root.querySelector('[data-tree-width-label]').textContent = b;
        root.querySelector('[data-tree-depth-label]').textContent = d;
        root.querySelector('[data-tree-nodes]').textContent = total.toLocaleString('en-US');
        const bars = root.querySelector('[data-tree-bars]'); bars.replaceChildren();
        levels.forEach((size,i) => {
          const line = document.createElement('div');
          const label = document.createElement('span'); label.textContent = `D${i}`;
          const bar = document.createElement('i'); bar.style.width = `${Math.max(3,size / levels[levels.length-1] * 100)}%`;
          const value = document.createElement('b'); value.textContent = size.toLocaleString('en-US');
          line.append(label,bar,value); bars.append(line);
        });
      }
      [width,depth].forEach(el=>el.addEventListener('input',render));render();
    }
    if (id === 11) {
      const input = root.querySelector('[data-input-tokens]'), output = root.querySelector('[data-output-tokens]');
      function render() {
        const inTokens = Number(input.value), outTokens = Number(output.value);
        const inPrice = inTokens * 2 / 1_000_000, outPrice = outTokens * 8 / 1_000_000;
        root.querySelector('[data-input-label]').textContent = inTokens.toLocaleString('en-US');
        root.querySelector('[data-output-label]').textContent = outTokens.toLocaleString('en-US');
        root.querySelector('[data-total-cost]').textContent = `$${(inPrice+outPrice).toFixed(4)}`;
        root.querySelector('[data-cost-breakdown]').textContent = `Input: $${inPrice.toFixed(4)} + Output: $${outPrice.toFixed(4)}. Excludes tool costs, cache discounts and network charges.`;
      }
      [input,output].forEach(el=>el.addEventListener('input',render));render();
    }
    if (id === 21) {
      const summaries = [
        'Beginning selected. For a fair test, hold question, total context length, and evidence wording constant.',
        'Middle selected. Compare actual answer accuracy to beginning/end; do not assume every model has a middle-position penalty.',
        'End selected. Check correctness and citation support; later placement is not a universal guarantee.'
      ];
      function render(index) {
        root.querySelectorAll('[data-position]').forEach(btn=>btn.setAttribute('aria-pressed',String(Number(btn.dataset.position)===index)));
        root.querySelectorAll('[data-context-position]').forEach((block,i)=>{
          block.classList.toggle('is-evidence',i === index);
          block.querySelector('[data-clause]').hidden = i !== index;
        });
        root.querySelector('[data-position-summary]').textContent=summaries[index];
      }
      root.querySelectorAll('[data-position]').forEach(btn=>btn.addEventListener('click',()=>render(Number(btn.dataset.position))));render(0);
    }
  });
})();
