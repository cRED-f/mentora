import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const script = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');

function storage(map = new Map(), blocked = false) {
  return {
    getItem(key) { if (blocked) throw Error('Blocked'); return map.get(key) ?? null; },
    setItem(key, value) { if (blocked) throw Error('Blocked'); map.set(key, String(value)); },
    removeItem(key) { if (blocked) throw Error('Blocked'); map.delete(key); },
  };
}

function boot(local, session = storage()) {
  function element() {
    const listeners = new Map();
    const classes = new Set();
    return {
      listeners,
      hidden: false, value: '', textContent: '', dataset: {}, style: {},
      classList: {
        add(name) { classes.add(name); },
        remove(name) { classes.delete(name); },
        toggle(name, forced) {
          if (forced === undefined ? !classes.has(name) : forced) classes.add(name);
          else classes.delete(name);
        },
        contains(name) { return classes.has(name); },
      },
      setAttribute() {}, focus() {},
      addEventListener(type, callback) { listeners.set(type, callback); },
      replaceChildren(...children) { this.children = children; },
      append(child) { (this.children ||= []).push(child); },
      matches(query) { return query === 'button.mark-complete' && this === complete; },
      querySelector() { return null; },
      querySelectorAll() { return []; },
      fire(type) { return listeners.get(type)?.({ preventDefault() {}, target: this }); },
    };
  }
  const ids = new Map();
  const get = id => { if (!ids.has(id)) ids.set(id, element()); return ids.get(id); };
  const complete = get('.mark-complete');
  complete.dataset.progressKey = 'rag:1';
  const settings = get('#tutor-settings'); settings.hidden = true;
  const remember = get('#settings-remember-key'); remember.checked = true;
  const modal = get('#search-modal'); modal.hidden = true;
  const windowListeners = new Map();
  const document = {
    body: {dataset: { course: 'rag', lesson: '1' }},
    querySelector(selector) { return get(selector); },
    querySelectorAll(selector) {
      if (selector === '.mark-complete' || selector === '[data-progress-key]') return [complete];
      return [];
    },
    createElement: () => element(),
    addEventListener() {},
  };
  const window = {
    innerWidth: 1200, innerHeight: 800,
    addEventListener(type, callback) { windowListeners.set(type, callback); },
  };
  const fetch = async url => ({
    ok: true,
    json: async () => url === '/api/status' ? { configured: false, model: '' } : [],
  });
  runInNewContext(script, { document, window, fetch, localStorage: local, sessionStorage: session });
  return { get, complete, windowListeners, openSettings: () => get('#tutor-settings-toggle').fire('click') };
}

function saveSettings(view, { apiKey, model, remember = true }) {
  view.openSettings();
  view.get('#settings-api-key').value = apiKey;
  view.get('#settings-model').value = '__custom__';
  view.get('#settings-custom-model').value = model;
  view.get('#settings-remember-key').checked = remember;
  view.get('#tutor-settings-form').fire('submit');
}

test('9Router key and model survive closing the tab and reopening with the same origin', () => {
  const local = storage();
  const first = boot(local);
  saveSettings(first, { apiKey: 'demo-secret', model: 'provider/example' });
  assert.equal(local.getItem('mentora-9router-key-v1'), 'demo-secret');
  assert.equal(local.getItem('mentora-9router-model-v1'), 'provider/example');
  const reopened = boot(local); // fresh context AND sessionStorage, same localStorage
  reopened.openSettings();
  assert.equal(reopened.get('#settings-api-key').value, 'demo-secret');
  assert.equal(reopened.get('#settings-model').value, 'provider/example');
});

test('disabling key persistence clears durable key without removing durable model', () => {
  const local = storage();
  saveSettings(boot(local), { apiKey: 'durable', model: 'provider/example' });
  const view = boot(local);
  saveSettings(view, { apiKey: 'session-only', model: 'provider/updated', remember: false });
  assert.equal(local.getItem('mentora-9router-key-v1'), null);
  assert.equal(local.getItem('mentora-9router-model-v1'), 'provider/updated');
  const reopened = boot(local);
  reopened.openSettings();
  assert.equal(reopened.get('#settings-api-key').value, '');
  assert.equal(reopened.get('#settings-model').value, 'provider/updated');
});

test('completed lessons persist and legacy progress is preserved on upgrade', () => {
  const local = storage(new Map([['modelcraft-progress-v1', JSON.stringify({ 'rag:2': true })]]));
  const first = boot(local);
  assert.equal(first.get('#progress-count').textContent, '1 / 234');
  first.complete.fire('click');
  assert.equal(first.get('#progress-count').textContent, '2 / 234');
  assert.equal(JSON.parse(local.getItem('mentora-progress-v1'))['rag:1'], true);
  const reopened = boot(local);
  assert.equal(reopened.get('#progress-count').textContent, '2 / 234');
  assert.equal(reopened.complete.classList.contains('is-done'), true);
  reopened.complete.fire('click');
  assert.equal(boot(local).get('#progress-count').textContent, '1 / 234');
});

test('blocked browser storage reports failures instead of pretending progress or settings saved', () => {
  const blocked = storage(new Map(), true);
  const view = boot(blocked);
  saveSettings(view, { apiKey: 'temporary', model: 'provider/example' });
  assert.match(view.get('#settings-feedback').textContent, /could not be fully saved/i);
  assert.equal(view.get('#tutor-settings').hidden, false);
  view.complete.fire('click');
  assert.match(view.get('#progress-feedback').textContent, /could not be saved/i);
  assert.equal(view.get('#progress-count').textContent, '0 / 234');
});

test('changes to progress in another browser tab update the display', () => {
  const local = storage();
  const view = boot(local);
  local.setItem('mentora-progress-v1', JSON.stringify({ 'rag:1': true }));
  view.windowListeners.get('storage')({ key: 'mentora-progress-v1' });
  assert.equal(view.get('#progress-count').textContent, '1 / 234');
});
