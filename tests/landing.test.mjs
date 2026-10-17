import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { courses } from '../src/lib/courses.js';
const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('Mentora homepage and academy routes both exist', () => {
  const home = read('../src/pages/index.astro');
  const academy = read('../src/pages/academy/index.astro');
  assert.match(home, /Mentora — Learn AI from the inside out/);
  assert.match(home, /href="\/academy\/"/);
  assert.match(home, /href="#curriculum"/);
  assert.match(home, /href="#ai-tutor"/);
  assert.match(home, /id="hero-heading"/);
  assert.match(home, /Curiosity meets/);
  // The hero is plain type by decision: no decorative diagram, no scroll cue.
  assert.doesNotMatch(home, /learning-map|node-chip|scroll-cue/);
  assert.match(academy, /course-grid/);
});

test('Homepage has enlarged readable hero copy at left and animated architecture at right', () => {
  const home = read('../src/pages/index.astro');
  const css = read('../src/styles/landing.css');
  const diagram = read('../src/components/TransformerDiagram.astro');
  const hero = home.match(/<section class="landing-hero"[\s\S]*?<\/section>/)?.[0] ?? '';
  const diagramAt = hero.indexOf('<div class="hero-visual"');
  const copyAt = hero.indexOf('<div class="hero-copy">');
  assert.ok(copyAt > -1 && diagramAt > copyAt);
  for (const copy of [
    'THE AI ENGINEERING LEARNING SPACE', 'Curiosity meets',
    "Don't just learn what AI can do.", 'Start learning',
    'Explore the curriculum', 'One place for the'
  ]) assert.ok(hero.indexOf(copy) > copyAt, `Missing left-column copy: ${copy}`);
  assert.match(css, /grid-template-columns: minmax\(0, \.48fr\) minmax\(0, \.52fr\)/);
  assert.match(css, /min-height: calc\(100svh - 57px\)/);
  assert.match(css, /body\.landing \.header-inner \{ min-height: 56px; \}/);
  assert.match(css, /font-size: clamp\(54px, 5\.3vw, 90px\)/);
  assert.match(diagram, /font: 600 15px var\(--sans\)/);
  assert.match(diagram, /91\.4286svh - 81px/);
  assert.match(css, /@media \(max-width: 980px\)/);
  assert.match(diagram, /<svg class="tx-svg"/);
  assert.doesNotMatch(diagram, /tx-caption|tx-tour|tx-toolbar|tx-topline|tx-inspector-label|tx-detail/);
  assert.doesNotMatch(hero, /class="(?:noise|ambient|hero-background-grid)/);
});

test('Homepage features real courses and course links resolve', () => {
  assert.equal(courses.length,11);
  for (const slug of ['llm-foundations','rag','agents']) {
    assert.ok(courses.some(c=>c.slug===slug));
  }
  const source = read('../src/pages/index.astro');
  assert.match(source, /courses\.find\(c=>c\.slug==='rag'\)/);
  assert.match(source, /courses\.find\(c=>c\.slug==='agents'\)/);
  assert.match(source, /href=\{`\/course\/\$\{course\.slug\}\//);
});

test('Landing chrome is keyboard accessible and motion-safe', () => {
  const js = read('../public/landing.js');
  const css = read('../src/styles/landing.css');
  const html = read('../src/pages/index.astro');
  assert.match(js, /Escape/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /Skip to content/);
  assert.match(css, /body\.landing\{[^}]*overflow-x:hidden/);
  // Reveals enhance sections below the fold but never conceal content without JS.
  assert.match(html, /class="section-topline scroll-reveal" data-scroll/);
  assert.match(css, /html\.has-landing-scroll \.scroll-reveal\.is-inview/);
  assert.match(css, /prefers-reduced-motion: no-preference/);
});

test('Mentora rebranding preserves data and 9router backend', () => {
  assert.ok(existsSync(new URL('../public/mentora-icon.svg', import.meta.url)));
  const layout = read('../src/layouts/AppLayout.astro');
  const gateway = read('../src/lib/chat.js');
  const app = read('../public/app.js');
  assert.match(layout,/mentora/);
  assert.match(layout,/href="\/academy\/"/);
  assert.match(gateway,/Mentora AI/);
  assert.match(gateway,/NINEROUTER_API_KEY/);
  assert.match(app,/mentora-progress-v1/);
  assert.match(app,/modelcraft-progress-v1/); // deliberate migration from the previous edition
});

test('Transformer SVG keeps keyboard selection without inspection cards or playback chrome', () => {
  const diagram = read('../src/components/TransformerDiagram.astro');
  const labels = [...diagram.matchAll(/data-part="([a-z-]+)"[^>]*role="button"/g)].map(match => match[1]);
  for (const part of ['tokens', 'embedding', 'position', 'block', 'attention', 'norm-attention', 'ffn', 'norm-ffn', 'linear', 'softmax', 'distribution']) {
    assert.ok(labels.includes(part), `Missing interactive SVG layer: ${part}`);
  }
  assert.match(diagram, /tabindex="0" role="button"/);
  assert.match(diagram, /event\.key === 'Enter' \|\| event\.key === ' '/);
  assert.match(diagram, /pointerenter/);
  assert.match(diagram, /pointerleave/);
  for (const removed of ['EXPLORE THE TRANSFORMER', 'INSPECT LAYER', 'FOLLOW THE DATA FLOW',
    'SELECT A LAYER FOR DETAILS', 'Pause tour', 'data-tx-stage-button', 'data-tx-play',
    'tx-caption', 'tx-detail', 'tx-tour', 'tx-toolbar']) {
    assert.ok(!diagram.includes(removed), `Unwanted explorer UI remains: ${removed}`);
  }
});

test('Transformer architecture remains a valid illustrative, stage-driven teaching diagram', () => {
  const diagram = read('../src/components/TransformerDiagram.astro');
  assert.match(diagram, /causal mask/i);
  assert.match(diagram, /Position \$\{r \+ 1\} cannot attend to future position/);
  assert.match(diagram, /decoder architecture/i);
  assert.match(diagram, /illustrative/i);
  assert.doesNotMatch(diagram, /addEventListener\('scroll'/);
});

test('Transformer animation starts automatically and loops without visible controls', () => {
  const diagram = read('../src/components/TransformerDiagram.astro');
  const css = read('../src/styles/landing.css');
  assert.match(diagram, /selected = defaults\[\(stage \+ 1\) % defaults\.length\]/);
  assert.match(diagram, /setInterval\(\(\) => \{/);
  assert.match(diagram, /4800/);
  assert.match(diagram, /!reducedMotion && !document\.hidden/);
  assert.match(diagram, /prefers-reduced-motion: reduce/);
  assert.match(diagram, /visibilitychange/);
  assert.match(css, /body\.landing \.landing-hero \{ background: #000000; \}/);
  assert.match(css, /backdrop-filter: none/);
});

test('Locomotive v5 adds smooth, accessible scroll-driven motion to the homepage', () => {
  const html = read('../src/pages/index.astro');
  const css = read('../src/styles/landing.css');
  const scroll = read('../src/scripts/landing-scroll.js');
  const pkg = JSON.parse(read('../package.json'));
  assert.match(pkg.dependencies['locomotive-scroll'], /^\^5\./);
  assert.match(scroll, /import\('locomotive-scroll'\)/);
  assert.match(scroll, /locomotive-scroll\/dist\/locomotive-scroll\.css/);
  assert.match(scroll, /scrollCallback:/);
  assert.match(scroll, /smoothTouch: false/);
  assert.match(scroll, /reduced\.matches/);
  assert.match(scroll, /scroll\.destroy\(\)/);
  assert.match(scroll, /catch \(error\)/);
  assert.match(html, /data-scroll-speed="-0\.07"/);
  assert.match(html, /class="metric scroll-reveal" data-scroll/);
  assert.match(html, /featured-card--\$\{i\+1\} scroll-reveal/);
  assert.match(html, /class="method-step scroll-reveal" data-scroll/);
  assert.match(html, /class="tutor-demo scroll-reveal" data-scroll/);
  assert.match(html, /class="cta-inner scroll-reveal" data-scroll/);
  assert.match(html, /class="landing-scroll-progress" aria-hidden="true"/);
  assert.match(html, /href="#curriculum" data-scroll-to/);
  assert.match(css, /html\.has-landing-scroll \.scroll-reveal/);
  assert.match(css, /html\.has-landing-scroll \.scroll-reveal\.is-inview/);
  // Hero must stay visible on load; transforms must not break hover effects.
  const hero = html.match(/<section class="landing-hero"[\s\S]*?<\/section>/)?.[0] ?? '';
  assert.doesNotMatch(hero, /scroll-reveal/);
  assert.match(css, /translate: 0 32px/);
});
