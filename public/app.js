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

  function readProgress() { try { return JSON.parse(localStorage.getItem('mentora-progress-v1') || localStorage.getItem('modelcraft-progress-v1') || '{}'); } catch { return {}; } }
  function writeProgress(progress) { try { localStorage.setItem('mentora-progress-v1', JSON.stringify(progress)); } catch {} }
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
  $$('.mark-complete').forEach(button => button.addEventListener('click', () => {
    const progress = readProgress();
    const key = button.dataset.progressKey;
    progress[key] = !progress[key];
    writeProgress(progress);
    updateProgress();
  }));

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
  function closeTutor() { tutor?.classList.remove('tutor-open'); $$('.tutor-toggle').forEach(x => x.setAttribute('aria-expanded', 'false')); }
  $$('.tutor-toggle').forEach(button => button.addEventListener('click', () => tutor.classList.contains('tutor-open') ? closeTutor() : openTutor()));
  $('.tutor-close')?.addEventListener('click', closeTutor);
  function askSuggested(prompt) { if (!prompt) return; openTutor(); $('#tutor-input').value = prompt; $('#tutor-input').focus(); }
  $$('.suggestions [data-suggestion]').forEach(button => button.addEventListener('click', () => askSuggested(button.dataset.suggestion)));
  $('.ask-lesson')?.addEventListener('click', () => askSuggested('Explain this lesson from first principles, derive the most important equations, and give me a production example.'));
  $('.lesson-test')?.addEventListener('click', () => askSuggested('Conduct a difficult senior AI engineering mock interview about this lesson. Start with one question and wait for my answer.'));

  function openSearch() { modal.hidden = false; searchInput.value = ''; renderSearch(''); requestAnimationFrame(() => searchInput.focus()); }
  function closeSearch() { modal.hidden = true; }
  $$('.search-open').forEach(button => button.addEventListener('click', openSearch));
  $('.search-dismiss')?.addEventListener('click', closeSearch);
  modal?.addEventListener('click', event => { if (event.target === modal) closeSearch(); });
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); modal.hidden ? openSearch() : closeSearch(); }
    if (event.key === 'Escape') { if (!modal.hidden) closeSearch(); else { closeTutor(); closeNavigation(); } }
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
      $('#tutor-dot').className = `status-dot ${data.configured ? 'connected' : 'unconfigured'}`;
      $('#tutor-status-text').textContent = data.configured ? `Configured · ${data.model}` : '9router setup required';
    } catch {
      $('#tutor-status-text').textContent = 'Tutor backend unavailable';
      $('#tutor-dot').className = 'status-dot unconfigured';
    }
  }
  initStatus();

  function message(role, content = '') {
    const section = document.createElement('div');section.className = `chat-message ${role === 'user' ? 'from-user' : 'from-assistant'}`;
    const label = document.createElement('div');label.className = 'chat-label';label.textContent = role === 'user' ? 'YOU' : '✧ MENTORA TUTOR';
    const body = document.createElement('div');body.className='chat-body';body.textContent=content;
    section.append(label,body);$('#tutor-thread').append(section);$('#tutor-thread').scrollTop = $('#tutor-thread').scrollHeight;
    return { section, body };
  }
  function setBusy(busy) { inFlight = busy; $('#send-chat').disabled=busy; $('#stop-chat').hidden=!busy; }
  $('#stop-chat')?.addEventListener('click', () => requestAbort?.abort());
  const input = $('#tutor-input');
  input?.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); $('#tutor-form').requestSubmit(); } });
  $('#tutor-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    if (inFlight) return;
    const content = input.value.trim();
    if (!content || content.length > 2000) return;
    input.value = '';
    $('#suggestions')?.remove();$('.tutor-intro')?.remove();
    message('user',content);
    const answer = message('assistant','Thinking through the course material...');
    answer.section.classList.add('streaming');
    setBusy(true);const controller = new AbortController();requestAbort=controller;
    let text = '';
    try {
      const response = await fetch('/api/chat/', { method:'POST', headers:{'Content-Type':'application/json'}, signal:controller.signal,
        body:JSON.stringify({message:content,course:currentCourse,lesson:currentLesson,history}) });
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
        answer.body.textContent = text;
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
              if (typeof delta === 'string') { text += delta; answer.body.textContent = text; $('#tutor-thread').scrollTop = $('#tutor-thread').scrollHeight; }
            } catch(e) { if (!(e instanceof SyntaxError)) throw e; }
          }
        }
      }
      if (!text) throw Error('9router finished without returning any text. Try a different model.');
      history.push({role:'user',content},{role:'assistant',content:text});
      history=history.slice(-8);
      const copy=document.createElement('button');copy.className='chat-copy';copy.type='button';copy.textContent='Copy answer ↗';
      copy.addEventListener('click',()=>navigator.clipboard?.writeText(text));answer.section.append(copy);
    } catch(e) {
      if (e.name === 'AbortError') {answer.body.textContent = `${text}\n[Response stopped]`.trim();}
      else { answer.body.textContent = `Unable to answer: ${e.message || 'Unknown error'}`; answer.body.classList.add('chat-error'); }
    } finally { answer.section.classList.remove('streaming');setBusy(false);requestAbort=null;$('#tutor-thread').scrollTop=$('#tutor-thread').scrollHeight; }
  });
})();
