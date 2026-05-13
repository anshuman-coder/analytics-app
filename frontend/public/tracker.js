(function () {
  'use strict';

  var BACKEND_URL = window.__ANALYTICS_BACKEND__ || 'http://localhost:4000';
  var SITE_TOKEN = window.__ANALYTICS_SITE_TOKEN__ || '';
  var SESSION_KEY = 'ua_session_id';
  var BATCH_INTERVAL = 3000;

  if (!SITE_TOKEN) {
    console.warn('[analytics] No site token configured. Set window.__ANALYTICS_SITE_TOKEN__ before loading tracker.js.');
  }

  // ── Session ID ──────────────────────────────────────────────────────────────
  function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return 'sess_' + crypto.randomUUID();
    }
    // Fallback: RFC-4122 v4 UUID via getRandomValues
    return 'sess_xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (crypto.getRandomValues(new Uint8Array(1))[0] & 15) >> (c === 'x' ? 0 : 1);
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function getSessionId() {
    var id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = generateId();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  }

  var sessionId = getSessionId();
  var queue = [];
  var flushTimer = null;

  // ── Queue & flush ───────────────────────────────────────────────────────────
  function enqueue(event) {
    queue.push(event);
    if (!flushTimer) {
      flushTimer = setTimeout(flush, BATCH_INTERVAL);
    }
  }

  function flush() {
    flushTimer = null;
    if (queue.length === 0) return;
    var batch = queue.slice();
    queue = [];

    var body = JSON.stringify(batch);
    fetch(BACKEND_URL + '/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body,
      keepalive: true,
      credentials: 'omit',
    }).catch(function () {});
  }

  // Flush on page hide / unload
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') flush();
  });
  window.addEventListener('beforeunload', flush);

  // ── Event builders ──────────────────────────────────────────────────────────
  function baseEvent(type) {
    return {
      site_token: SITE_TOKEN,
      session_id: sessionId,
      event_type: type,
      page_url: window.location.href,
      timestamp: new Date().toISOString(),
    };
  }

  // ── page_view ───────────────────────────────────────────────────────────────
  function trackPageView() {
    enqueue(baseEvent('page_view'));
  }

  // ── click ───────────────────────────────────────────────────────────────────
  function trackClicks() {
    document.addEventListener('click', function (e) {
      var ev = baseEvent('click');
      ev.x = e.clientX;
      ev.y = e.clientY;
      ev.vw = window.innerWidth;
      ev.vh = window.innerHeight;
      enqueue(ev);
    });
  }

  // ── Init ────────────────────────────────────────────────────────────────────
  trackPageView();
  trackClicks();

  // Expose for manual use if needed
  window.__analytics = { flush: flush, sessionId: sessionId };
})();
