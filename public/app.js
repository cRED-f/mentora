(() => {
  'use strict';
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const currentCourse = document.body.dataset.course || '';
  const currentLesson = document.body.dataset.lesson || '';
  const tutor = $('#tutor-panel');
  const scrim = $('#mobile-scrim');
  const left = $('.left-sidebar');
  const modal = $('#search-modal');
  const searchInput = $('#search-input');
  const searchResults = $('#search-results');
  let searchItems = [];
  let requestAbort = null;
  let history = [];
  let activeResultIndex = 0;
  let inFlight = false;
  // Browser storage belongs to the current origin (scheme, hostname AND port).
  // Saving a key on this device is convenient but exposes it to page scripts;
  // server-side environment variables remain the safer option for public sites.
  const KEY_STORAGE = 'mentora-9router-key-v1';
  const MODEL_STORAGE = 'mentora-9router-model-v1';
  const REMEMBER_STORAGE = 'mentora-9router-remember-v1';
  const PROGRESS_STORAGE = 'mentora-progress-v1';
  const LEGACY_PROGRESS_STORAGE = 'modelcraft-progress-v1';
  let localStore = null;
  let tabStore = null;
  try { localStore = localStorage; } catch { /* Storage API may be blocked. */ }
  try { tabStore = sessionStorage; } catch { /* Storage API may be blocked. */ }
  function readStorage(store, key) {
    try { return store.getItem(key) || ''; } catch { return ''; }
  }
  function writeStorage(store, key, value) {
    try {
      if (value) store.setItem(key, value);
      else store.removeItem(key);
      return true;
    } catch { return false; }
  }
  let activeApiKey = readStorage(localStore, KEY_STORAGE) || readStorage(tabStore, KEY_STORAGE);
  let activeModel = readStorage(localStore, MODEL_STORAGE) || readStorage(tabStore, MODEL_STORAGE);
  let rememberKeyPreference = readStorage(localStore, REMEMBER_STORAGE) !== 'false';
  let serverConfigured = false;
  let serverModel = '';
  const modelIdPattern = /^[\w][\w./:@+-]{0,159}$/;
  const settingsPanel = $('#tutor-settings');
  const settingsToggle = $('#tutor-settings-toggle');
  const keyInput = $('#settings-api-key');
  const modelSelect = $('#settings-model');
  const customModel = $('#settings-custom-model');
  const feedback = $('#settings-feedback');
  const rememberKey = $('#settings-remember-key');

  function modelOption(id, description = id) {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = description;
    return option;
  }
  function showModelSelection(models = [], selected = activeModel || serverModel) {
    modelSelect.replaceChildren(modelOption('', 'Choose a model'));
    const ids = [...new Set(models.filter(id => typeof id === 'string' && modelIdPattern.test(id)))];
    if (selected && !ids.includes(selected)) ids.unshift(selected);
    ids.forEach(id => modelSelect.append(modelOption(id)));
    modelSelect.append(modelOption('__custom__', 'Enter a model ID…'));
    modelSelect.value = selected || '';
    customModel.hidden = true;
    customModel.value = '';
  }
  function effectiveModel() { return activeModel || serverModel; }
  function updateAiStatus() {
    const configured = !!effectiveModel() && (!!activeApiKey || serverConfigured);
    $('#tutor-dot').className = `status-dot ${configured ? 'connected' : 'unconfigured'}`;
    $('#tutor-status-text').textContent = configured ? `Ready · ${effectiveModel()}` : 'Open Settings to connect 9Router';
    return configured;
  }
  function toggleSettings(open) {
    settingsPanel.hidden = !open;
    settingsToggle.setAttribute('aria-expanded', String(open));
    settingsToggle.classList.toggle('active', open);
    if (open) {
      keyInput.value = activeApiKey;
      rememberKey.checked = rememberKeyPreference;
      showModelSelection();
      feedback.textContent = '';
      keyInput.focus();
    }
  }
  settingsToggle?.addEventListener('click', () => toggleSettings(settingsPanel.hidden));
  $('#settings-reveal')?.addEventListener('click', () => {
    const shown = keyInput.type === 'text';
    keyInput.type = shown ? 'password' : 'text';
    $('#settings-reveal').textContent = shown ? 'Show' : 'Hide';
    $('#settings-reveal').setAttribute('aria-pressed', String(!shown));
  });
  modelSelect?.addEventListener('change', () => {
    customModel.hidden = modelSelect.value !== '__custom__';
    if (!customModel.hidden) customModel.focus();
  });
  async function loadModels() {
    const refresh = $('#settings-refresh-models');
    refresh.disabled = true;
    feedback.textContent = 'Loading models from 9Router…';
    try {
      const result = await fetch('/api/chat/models/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: keyInput.value.trim() }),
      });
      const json = await result.json();
      if (!result.ok) throw Error(json.error || `HTTP ${result.status}`);
      const previouslySelected = modelSelect.value === '__custom__' ? customModel.value.trim() : modelSelect.value;
      showModelSelection(json.models || [], previouslySelected || activeModel || serverModel);
      feedback.textContent = json.models?.length ? `${json.models.length} available models loaded.` : 'No models returned. Use “Enter a model ID” if you know it.';
    } catch (e) { feedback.textContent = `${e.message} You can still enter a model ID manually.`; }
    finally { refresh.disabled = false; }
  }
  $('#settings-refresh-models')?.addEventListener('click', loadModels);
  $('#settings-clear')?.addEventListener('click', () => {
    const clearedLocal = writeStorage(localStore, KEY_STORAGE, '');
    const clearedTab = writeStorage(tabStore, KEY_STORAGE, '');
    if (!clearedLocal || !clearedTab) {
      feedback.textContent = 'Could not clear the stored key. Check your browser storage settings.';
      return;
    }
    keyInput.value = '';
    activeApiKey = '';
    updateAiStatus();
    feedback.textContent = 'Saved API key cleared from this browser. Server defaults, if configured, remain available.';
  });
  $('#tutor-settings-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const key = keyInput.value.trim();
    const model = modelSelect.value === '__custom__' ? customModel.value.trim() : modelSelect.value;
    if (key.length > 4096 || /[\r\n]/.test(key)) { feedback.textContent = 'Invalid API key.'; return; }
    if (!model || !modelIdPattern.test(model)) { feedback.textContent = 'Choose a model or enter a valid 9Router model ID.'; return; }
    const remember = rememberKey.checked;
    // Persist the model for every session; the key is persistent only when
    // requested, otherwise it is kept in sessionStorage for this tab alone.
    const modelSaved = writeStorage(localStore, MODEL_STORAGE, model);
    const keySaved = writeStorage(localStore, KEY_STORAGE, remember ? key : '');
    const tabSaved = writeStorage(tabStore, KEY_STORAGE, remember ? '' : key);
    const preferenceSaved = writeStorage(localStore, REMEMBER_STORAGE, String(remember));
    // Retain the current tab's model as a fallback if durable storage is disabled.
    writeStorage(tabStore, MODEL_STORAGE, model);
    activeApiKey = key;
    activeModel = model;
    rememberKeyPreference = remember;
    updateAiStatus();
    if (!modelSaved || !keySaved || !tabSaved || !preferenceSaved) {
      feedback.textContent = 'Settings work in this tab, but could not be fully saved. Allow browser site storage to keep them after restarting.';
      return;
    }
    toggleSettings(false);
  });

  function readProgress() {
    try {
      const saved = readStorage(localStore, PROGRESS_STORAGE) || readStorage(localStore, LEGACY_PROGRESS_STORAGE);
      const data = JSON.parse(saved || '{}');
      return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
    } catch { return {}; }
  }
  function writeProgress(progress) {
    return writeStorage(localStore, PROGRESS_STORAGE, JSON.stringify(progress));
  }
  function updateProgress() {
    const progress = readProgress();
    const count = Object.values(progress).filter(Boolean).length;
    const counter = $('#progress-count');
    const fill = $('#global-progress');
    if (counter) counter.textContent = `${count} / 234`;
    if (fill) fill.style.width = `${Math.min(count / 234 * 100, 100)}%`;
    $$('[data-progress-key]').forEach(el => {
      const done = Boolean(progress[el.dataset.progressKey]);
      el.classList.toggle('is-done', done);
      if (el.matches('button.mark-complete')) el.innerHTML = `<span class="complete-icon">${done ? '✓' : '○'}</span> ${done ? 'Completed · click to undo' : 'Mark as complete'}`;
      const indicator = $('.lesson-completion-indicator', el);
      if (indicator) { indicator.textContent = done ? '✓' : '○'; indicator.setAttribute('aria-label', done ? 'Completed' : 'Not completed'); }
    });
  }
  updateProgress();

  // Preserve manually expanded courses between full-page lesson navigations.
  // The course containing the active lesson always opens on arrival.
  const courseGroups = $$('.course-group', left);
  if (courseGroups.length) {
    const storageKey = 'mentora-sidebar-expanded-v1';
    try {
      const expanded = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
      if (Array.isArray(expanded)) {
        for (const group of courseGroups) {
          group.open = group.dataset.courseSlug === currentCourse || expanded.includes(group.dataset.courseSlug);
        }
      }
    } catch { /* Keep the server-rendered default if storage is unavailable. */ }
    for (const group of courseGroups) {
      group.addEventListener('toggle', () => {
        try {
          sessionStorage.setItem(storageKey, JSON.stringify(courseGroups.filter(item => item.open).map(item => item.dataset.courseSlug)));
        } catch { /* Navigation remains usable without storage. */ }
      });
    }
    // A long curriculum may place the current lesson below the sidebar viewport.
    const activeLessonLink = $('.lesson-link.active', left);
    if (activeLessonLink && left) {
      const sidebarBounds = left.getBoundingClientRect();
      const linkBounds = activeLessonLink.getBoundingClientRect();
      if (linkBounds.bottom > sidebarBounds.bottom - 22) left.scrollTop += linkBounds.bottom - sidebarBounds.bottom + 34;
      else if (linkBounds.top < sidebarBounds.top + 22) left.scrollTop -= sidebarBounds.top + 34 - linkBounds.top;
    }
  }

  $$('.mark-complete').forEach(button => button.addEventListener('click', () => {
    const progress = readProgress();
    const key = button.dataset.progressKey;
    progress[key] = !progress[key];
    const saved = writeProgress(progress);
    const progressFeedback = $('#progress-feedback');
    if (progressFeedback) progressFeedback.textContent = saved ? '' : 'Progress could not be saved. Enable browser site storage.';
    // Always render the actual stored state, never a completion that failed to save.
    updateProgress();
  }));
  window.addEventListener('storage', event => {
    if (event.key === PROGRESS_STORAGE || event.key === LEGACY_PROGRESS_STORAGE) updateProgress();
    if ([KEY_STORAGE, MODEL_STORAGE, REMEMBER_STORAGE].includes(event.key)) {
      activeApiKey = readStorage(localStore, KEY_STORAGE) || readStorage(tabStore, KEY_STORAGE);
      activeModel = readStorage(localStore, MODEL_STORAGE) || readStorage(tabStore, MODEL_STORAGE);
      rememberKeyPreference = readStorage(localStore, REMEMBER_STORAGE) !== 'false';
      if (settingsPanel.hidden) showModelSelection();
      updateAiStatus();
    }
  });

  function closeNavigation() {
    left?.classList.remove('mobile-open'); scrim?.classList.remove('visible');
    $('.menu-toggle')?.setAttribute('aria-expanded', 'false');
  }
  $('.menu-toggle')?.addEventListener('click', () => {
    const open = !left.classList.contains('mobile-open');
    left.classList.toggle('mobile-open', open); scrim?.classList.toggle('visible', open);
    $('.menu-toggle').setAttribute('aria-expanded', String(open));
  });
  scrim?.addEventListener('click', () => { closeNavigation(); closeTutor(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 760) closeNavigation(); });

  function openTutor() { tutor?.classList.add('tutor-open'); $$('.tutor-toggle').forEach(x => x.setAttribute('aria-expanded', 'true')); $('#tutor-input')?.focus(); }

  // Selecting readable lesson content offers a contextual question without changing the page.
  // Selection in the sidebar, settings, inputs, or assistant replies is intentionally ignored.
  const page = $('#main-content');
  const selectionAction = $('#selection-ask');
  const selectionPreview = $('#tutor-selection');
  const selectionBody = $('#tutor-selection-text');
  const MAX_QUOTE = 3000;
  let candidateText = '';
  let selectedText = '';
  let selectionFrame = 0;
  function hideSelectionAction() { if (selectionAction) selectionAction.hidden = true; }
  function renderSelectedText() {
    selectionPreview.hidden = !selectedText;
    selectionBody.textContent = selectedText;
    if (input) input.placeholder = selectedText ? 'Ask about this selection…' : 'What would you like clarified?';
  }
  function clearSelectedText() { selectedText = ''; renderSelectedText(); }
  $('#tutor-selection-clear')?.addEventListener('click', () => { clearSelectedText(); input?.focus(); });
  function refreshTextSelection() {
    hideSelectionAction();
    candidateText = '';
    const selection = window.getSelection();
    if (!page || !selection || selection.isCollapsed || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (!page.contains(range.startContainer) || !page.contains(range.endContainer)) return;
    const nearestElement = node => node.nodeType === 1 ? node : node.parentElement;
    const excluded = 'input, textarea, select, button, [contenteditable], [role="textbox"]';
    if (nearestElement(range.startContainer)?.closest(excluded) || nearestElement(range.endContainer)?.closest(excluded)) return;
    const text = selection.toString().replace(/\s+/g, ' ').trim();
    if (text.length < 2) return;
    candidateText = text.slice(0, MAX_QUOTE);
    const bounds = range.getBoundingClientRect();
    if (!bounds || (!bounds.width && !bounds.height)) return;
    // Use fixed positioning so the action remains visible near selections in a scrolling lesson.
    selectionAction.hidden = false;
    const buttonWidth = selectionAction.offsetWidth || 135;
    const buttonHeight = selectionAction.offsetHeight || 36;
    const x = Math.max(10, Math.min(window.innerWidth - buttonWidth - 10, bounds.left + bounds.width / 2 - buttonWidth / 2));
    const y = bounds.top > buttonHeight + 16 ? bounds.top - buttonHeight - 8 : bounds.bottom + 8;
    selectionAction.style.left = `${x}px`;
    selectionAction.style.top = `${Math.max(8, Math.min(window.innerHeight - buttonHeight - 8, y))}px`;
  }
  document.addEventListener('selectionchange', () => {
    if (selectionFrame) cancelAnimationFrame(selectionFrame);
    selectionFrame = requestAnimationFrame(() => { selectionFrame = 0; refreshTextSelection(); });
  });
  document.addEventListener('pointerup', event => {
    if (event.target !== selectionAction) refreshTextSelection();
  });
  document.addEventListener('keyup', event => {
    if (event.key === 'Shift' || event.key.startsWith('Arrow')) refreshTextSelection();
  });
  page?.addEventListener('scroll', hideSelectionAction, { passive: true });
  window.addEventListener('resize', hideSelectionAction);
  // Prevent a mouse click from collapsing the selection before the click handler runs.
  selectionAction?.addEventListener('pointerdown', event => { if (event.pointerType === 'mouse') event.preventDefault(); });
  selectionAction?.addEventListener('click', () => {
    if (!candidateText) return;
    selectedText = candidateText;
    candidateText = '';
    hideSelectionAction();
    window.getSelection()?.removeAllRanges();
    renderSelectedText();
    openTutor();
  });
  function closeTutor() { if (settingsPanel && !settingsPanel.hidden) toggleSettings(false); tutor?.classList.remove('tutor-open'); $$('.tutor-toggle').forEach(x => x.setAttribute('aria-expanded', 'false')); }
  $$('.tutor-toggle').forEach(button => button.addEventListener('click', () => tutor.classList.contains('tutor-open') ? closeTutor() : openTutor()));
  $('.tutor-close')?.addEventListener('click', closeTutor);
  function askSuggested(prompt) { if (!prompt) return; openTutor(); $('#tutor-input').value = prompt; $('#tutor-input').focus(); }
  $$('.suggestions [data-suggestion]').forEach(button => button.addEventListener('click', () => askSuggested(button.dataset.suggestion)));
  $('.ask-lesson')?.addEventListener('click', () => askSuggested('I do not understand this lesson. Explain its core ideas simply, with one concrete example.'));
  $('.lesson-test')?.addEventListener('click', () => askSuggested('Help me check whether I understand this lesson by asking one question.'));
  window.addEventListener('mentora:ask-tutor', (event) => {
    const prompt = event.detail?.prompt;
    if (typeof prompt === 'string') askSuggested(prompt.slice(0, 2000));
  });

  function openSearch() { modal.hidden = false; searchInput.value = ''; renderSearch(''); requestAnimationFrame(() => searchInput.focus()); }
  function closeSearch() { modal.hidden = true; }
  $$('.search-open').forEach(button => button.addEventListener('click', openSearch));
  $('.search-dismiss')?.addEventListener('click', closeSearch);
  modal?.addEventListener('click', event => { if (event.target === modal) closeSearch(); });
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); modal.hidden ? openSearch() : closeSearch(); }
    if (event.key === 'Escape') { if (!modal.hidden) closeSearch(); else if (!settingsPanel.hidden) toggleSettings(false); else { closeTutor(); closeNavigation(); } }
    if (event.key === 'Enter' && !modal.hidden && document.activeElement === searchInput) {
      const result = searchResults.querySelectorAll('.search-item')[activeResultIndex];
      if (result) window.location.assign(result.href);
    }
    if (event.key === 'ArrowDown' && !modal.hidden && document.activeElement === searchInput) { event.preventDefault(); activeResultIndex = Math.min(activeResultIndex + 1, searchResults.querySelectorAll('.search-item').length - 1); updateActive(); }
    if (event.key === 'ArrowUp' && !modal.hidden && document.activeElement === searchInput) { event.preventDefault(); activeResultIndex = Math.max(activeResultIndex - 1, 0); updateActive(); }
  });
  function updateActive() { $$('.search-item',searchResults).forEach((a,i) => a.classList.toggle('search-active',i===activeResultIndex)); }
  function renderSearch(query) {
    const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const scored = searchItems.map(item => {
      let score = 0;
      const title = item.lesson.toLowerCase(), course = item.course.toLowerCase();
      for (const term of terms) { if (title.includes(term)) score += 4; if (course.includes(term)) score += 2; }
      return {...item,score};
    }).filter(item => !terms.length || item.score >= terms.length * 2).sort((a,b) => b.score - a.score).slice(0,20);
    searchResults.replaceChildren();
    activeResultIndex = 0;
    if (!scored.length) { const empty = document.createElement('div');empty.className = 'search-empty';empty.textContent = 'No matching lessons. Try a different term.';searchResults.append(empty);return; }
    for (const item of scored) {
      const a = document.createElement('a');a.href = item.url;a.className = 'search-item';
      const num = document.createElement('span');num.textContent = String(item.num).padStart(2,'0');
      const content = document.createElement('div');
      const strong = document.createElement('strong');strong.textContent = item.lesson;
      const small = document.createElement('small');small.textContent = item.course;
      content.append(strong,small);
      const arrow = document.createElement('b');arrow.textContent = '↗';
      a.append(num, content, arrow);searchResults.append(a);
    }
    updateActive();
  }
  searchInput?.addEventListener('input', () => renderSearch(searchInput.value));
  fetch('/search-index.json').then(resp => resp.json()).then(courses => {
    searchItems = courses.flatMap(c => c.lessons.map(l => ({ num:l.id,lesson:l.title,course:c.title,url:`/learn/${c.slug}/${l.id}/` })));
    if (!modal.hidden) renderSearch(searchInput.value);
  }).catch(() => {});

  async function initStatus() {
    try {
      const res = await fetch('/api/status', {cache:'no-store'});
      if (!res.ok) throw Error('Status unavailable');
      const data = await res.json();
      serverConfigured = Boolean(data.configured);
      serverModel = data.model || '';
    } catch { serverConfigured = false; }
    if (settingsPanel.hidden) showModelSelection();
    updateAiStatus();
  }
  initStatus();

  // Render a small safe Markdown subset with DOM nodes: no HTML parsing or unsanitized innerHTML.
  function renderInline(container, source) {
    const pattern = /(\[([^\]]{1,120})\]\((https:\/\/[^\s)]+|http:\/\/[^\s)]+|\/(?:learn|course)\/[^\s)]*)\)|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
    let from = 0;
    for (const match of source.matchAll(pattern)) {
      const at = match.index ?? 0;
      if (at > from) container.append(document.createTextNode(source.slice(from, at)));
      let node;
      if (match[2] && match[3]) {
        node = document.createElement('a');
        node.href = match[3];
        node.textContent = match[2];
        if (match[3].startsWith('http')) { node.target = '_blank'; node.rel = 'noopener noreferrer'; }
      } else if (match[4]) {
        node = document.createElement('code'); node.textContent = match[4];
      } else if (match[5]) {
        node = document.createElement('strong'); node.textContent = match[5];
      } else {
        node = document.createElement('em'); node.textContent = match[6];
      }
      container.append(node);
      from = at + match[0].length;
    }
    if (from < source.length) container.append(document.createTextNode(source.slice(from)));
  }

  function renderAssistantText(body, source) {
    const lines = source.replace(/\r\n?/g, '\n').split('\n');
    const output = document.createDocumentFragment();
    let paragraph = [];
    let list = null;
    let listType = null;
    function flushParagraph() {
      if (!paragraph.length) return;
      const p = document.createElement('p');
      renderInline(p, paragraph.join(' '));
      output.append(p);
      paragraph = [];
    }
    function flushList() { list = null; listType = null; }
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const clean = line.trim();
      if (/^```/.test(clean)) {
        flushParagraph();flushList();
        const language = clean.slice(3).trim().slice(0, 28);
        const codeLines = [];
        while (++i < lines.length && !/^```/.test(lines[i].trim())) codeLines.push(lines[i]);
        const pre = document.createElement('pre');
        const code = document.createElement('code');
        if (language) code.dataset.language = language;
        code.textContent = codeLines.join('\n');
        pre.append(code);output.append(pre);
        continue;
      }
      if (!clean) { flushParagraph();flushList();continue; }
      const heading = clean.match(/^(#{1,4})\s+(.+)$/);
      if (heading) {
        flushParagraph();flushList();
        const h = document.createElement('h4');
        h.className = 'chat-heading';
        renderInline(h, heading[2]); output.append(h);continue;
      }
      const bullet = clean.match(/^[-*+]\s+(.+)$/);
      const numbered = clean.match(/^\d+[.)]\s+(.+)$/);
      if (bullet || numbered) {
        flushParagraph();
        const type = bullet ? 'ul' : 'ol';
        if (!list || listType !== type) {
          list = document.createElement(type);listType = type;output.append(list);
        }
        const li = document.createElement('li');
        renderInline(li, (bullet || numbered)[1]);list.append(li);continue;
      }
      // Standard Markdown table: header + separator row + optional body rows.
      if (clean.includes('|') && i + 1 < lines.length && /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(lines[i + 1].trim())) {
        flushParagraph();flushList();
        const cells = row => row.replace(/^\||\|$/g, '').split('|').map(cell => cell.trim());
        const headers = cells(clean);
        const table = document.createElement('table');
        const headRow = document.createElement('tr');
        headers.forEach(value => { const th = document.createElement('th');renderInline(th,value);headRow.append(th); });
        const thead = document.createElement('thead');thead.append(headRow);table.append(thead);
        const tbody = document.createElement('tbody');
        i++;
        while (i + 1 < lines.length && lines[i + 1].trim().includes('|') && lines[i + 1].trim()) {
          const values = cells(lines[++i]);const tr = document.createElement('tr');
          headers.forEach((_, j) => {const td = document.createElement('td');renderInline(td, values[j] || '');tr.append(td);});
          tbody.append(tr);
        }
        table.append(tbody);output.append(table);continue;
      }
      if (/^---+$/.test(clean)) { flushParagraph();flushList();output.append(document.createElement('hr'));continue; }
      flushList();paragraph.push(clean);
    }
    flushParagraph();
    body.replaceChildren(output);
  }

  function message(role, content = '', quote = '') {
    const section = document.createElement('div');section.className = `chat-message ${role === 'user' ? 'from-user' : 'from-assistant'}`;
    const label = document.createElement('div');label.className = 'chat-label';label.textContent = role === 'user' ? 'YOU' : '✧ MENTORA TUTOR';
    const body = document.createElement('div');body.className='chat-body';body.textContent=content;
    section.append(label);
    if (quote) {
      const excerpt = document.createElement('blockquote');
      excerpt.className = 'chat-selection-quote';
      excerpt.textContent = quote;
      section.append(excerpt);
    }
    section.append(body);$('#tutor-thread').append(section);$('#tutor-thread').scrollTop = $('#tutor-thread').scrollHeight;
    return { section, body };
  }
  function setBusy(busy) { inFlight = busy; $('#send-chat').disabled=busy; $('#stop-chat').hidden=!busy; }
  $('#stop-chat')?.addEventListener('click', () => requestAbort?.abort());
  const input = $('#tutor-input');
  input?.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); $('#tutor-form').requestSubmit(); } });
  $('#tutor-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    if (inFlight) return;
    const quote = selectedText;
    const content = input.value.trim() || (quote ? 'Explain this selected passage in simple words.' : '');
    if (!content || content.length > 2000) return;
    if (!updateAiStatus()) { toggleSettings(true); feedback.textContent = 'Enter your key and select a model to chat.'; return; }
    input.value = '';
    clearSelectedText();
    $('#suggestions')?.remove();$('.tutor-intro')?.remove();
    message('user', content, quote);
    const answer = message('assistant','Reading this page…');
    answer.section.classList.add('streaming');
    setBusy(true);const controller = new AbortController();requestAbort=controller;
    let text = '';
    try {
      const response = await fetch('/api/chat/', { method:'POST', headers:{'Content-Type':'application/json'}, signal:controller.signal,
        body:JSON.stringify({message:content,selectedText:quote,course:currentCourse,lesson:currentLesson,history,model:effectiveModel(),apiKey:activeApiKey,pageText:($('#main-content')?.innerText || '').trim().slice(0,48000)}) });
      if (!response.ok) {
        let detail;
        try {detail=(await response.json()).error;}catch{detail=`HTTP ${response.status}`;}
        throw Error(detail || `HTTP ${response.status}`);
      }
      if (!response.body) throw Error('The model returned an empty response stream.');
      if (!response.headers.get('content-type')?.includes('text/event-stream')) {
        const data = await response.json();
        text = data?.choices?.[0]?.message?.content || '';
        if (!text) throw Error('9router returned an unexpected response format.');
        renderAssistantText(answer.body, text);
      } else {
        let buffer = '';
        const decoder = new TextDecoder();
        const reader = response.body.getReader();
        let done = false;
        while (!done) {
          const result = await reader.read();
          if (result.done) break;
          buffer += decoder.decode(result.value,{stream:true});
          let pos;
          while ((pos = buffer.indexOf('\n')) !== -1) {
            const line = buffer.slice(0,pos).trim();buffer = buffer.slice(pos+1);
            if (!line.startsWith('data:')) continue;
            const payload = line.slice(5).trim();
            if (payload === '[DONE]') { done = true;break; }
            try {
              const obj = JSON.parse(payload);
              if (obj.error) throw Error(typeof obj.error === 'string' ? obj.error : obj.error.message || 'Provider error');
              let delta = obj.choices?.[0]?.delta?.content;
              if (Array.isArray(delta)) delta = delta.map(x => x.text || '').join('');
              if (typeof delta === 'string') { text += delta; renderAssistantText(answer.body, text); $('#tutor-thread').scrollTop = $('#tutor-thread').scrollHeight; }
            } catch(e) { if (!(e instanceof SyntaxError)) throw e; }
          }
        }
      }
      if (!text) throw Error('9router finished without returning any text. Try a different model.');
      history.push({role:'user',content:quote ? `${content}\nSelected excerpt: ${quote}`.slice(0,2000) : content},{role:'assistant',content:text});
      history=history.slice(-8);
      const copy=document.createElement('button');copy.className='chat-copy';copy.type='button';copy.textContent='Copy answer ↗';
      copy.addEventListener('click',()=>navigator.clipboard?.writeText(text));answer.section.append(copy);
    } catch(e) {
      if (e.name === 'AbortError') {answer.body.textContent = `${text}\n[Response stopped]`.trim();}
      else { answer.body.textContent = `Unable to answer: ${e.message || 'Unknown error'}`; answer.body.classList.add('chat-error'); }
    } finally { answer.section.classList.remove('streaming');setBusy(false);requestAbort=null;$('#tutor-thread').scrollTop=$('#tutor-thread').scrollHeight; }
  });
})();
