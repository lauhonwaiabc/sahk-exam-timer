'use strict';
Sahk.register('TimerCommon', function() {
  var P = Sahk.get('Constants').PHASE;

  function getSessionLabel(i) {
    if (ENABLE_PREPARATION && i === PREPARATION_SESSION_INDEX) return P.PREPARATION;
    if (ENABLE_CONCLUSION && i === CONCLUSION_SESSION_INDEX) return P.CONCLUSION;
    if (ENABLE_BREAK && i === BREAK_SESSION_INDEX) return P.BREAK;
    let base = i - (ENABLE_PREPARATION ? 1 : 0) - (ENABLE_BREAK && i > BREAK_SESSION_INDEX ? 1 : 0);
    return base >= 0 ? `Session ${base + 1}` : `Session ${i + 1}`;
  }

  function getDataSessionKey(sessionIndex) {
    if (ENABLE_PREPARATION && sessionIndex === PREPARATION_SESSION_INDEX) return P.PREPARATION;
    if (ENABLE_CONCLUSION && sessionIndex === CONCLUSION_SESSION_INDEX) return P.CONCLUSION;
    if (ENABLE_BREAK && sessionIndex === BREAK_SESSION_INDEX) return P.BREAK;
    let baseIdx = sessionIndex;
    if (ENABLE_PREPARATION && sessionIndex > PREPARATION_SESSION_INDEX) baseIdx--;
    if (ENABLE_BREAK && sessionIndex > BREAK_SESSION_INDEX) baseIdx--;
    return `Session ${baseIdx + 1}`;
  }

  function isExamSession(idx, data) {
    const label = getSessionLabel(idx);
    if (label === P.PREPARATION || label === P.BREAK || label === P.CONCLUSION) return false;
    const key = getDataSessionKey(idx);
    return !!data[key];
  }

  function getPrevExamSession(idx, data) {
    for (let i = idx - 1; i >= 0; i--) {
      if (ENABLE_BREAK && i === BREAK_SESSION_INDEX) return null;
      if (isExamSession(i, data)) return i;
    }
    return null;
  }

  function getNextExamSession(idx, data) {
    const totalSessions = SESSION_PHASES.length;
    for (let i = idx + 1; i < totalSessions; i++) {
      if (ENABLE_BREAK && i === BREAK_SESSION_INDEX) return null;
      if (isExamSession(i, data)) return i;
    }
    return null;
  }

  var _alphaCache = new Map();
  var _cacheMax = 100;

  function hasMinAlphabet(str, min) {
    if (typeof str !== 'string') return false;
    var key = min + ':' + str;
    var cached = _alphaCache.get(key);
    if (cached !== undefined) return cached;
    var count = 0;
    for (var i = 0; i < str.length; i++) {
      if (/[a-zA-Z]/.test(str[i])) { count++; if (count >= min) { _alphaCache.set(key, true); return true; } }
    }
    if (_alphaCache.size >= _cacheMax) {
      var firstKey = _alphaCache.keys().next().value;
      _alphaCache.delete(firstKey);
    }
    _alphaCache.set(key, false);
    return false;
  }

  function wordMatch(text, term) {
    if (!hasMinAlphabet(term, 4)) return false;
    try {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp('\\b' + escaped + '\\b', 'i').test(text);
    } catch (e) { return false; }
  }

  function makeLabelHtml(label) {
    const text = label === 'previous' ? 'Previous Session' : label === 'upcoming' ? 'Upcoming Session' : 'Current Session';
    return `<div class="transit-label ${label}">${text}</div>`;
  }

  function updateVisibility(isIsolated, boxSelector, cellSelector) {
    if (isIsolated) {
      document.querySelectorAll(`${boxSelector}, ${cellSelector}`).forEach(box => {
        box.style.display = box.hasAttribute('data-iso') ? '' : 'none';
      });
    } else {
      document.querySelectorAll(`${boxSelector}, ${cellSelector}`).forEach(box => {
        box.style.display = '';
        box.removeAttribute('data-iso');
      });
    }
  }

  var SCALE_CLASS = 'scale-isolate-1';
  function updateIsolateScale(containerId) {
    var c = document.getElementById(containerId);
    if (!c) return;
    c.classList.remove(SCALE_CLASS);
    var count = c.querySelectorAll('[data-iso]').length;
    if (count === 1) c.classList.add(SCALE_CLASS);
  }

  return {
    getSessionLabel,
    getDataSessionKey,
    isExamSession,
    getPrevExamSession,
    getNextExamSession,
    hasMinAlphabet,
    wordMatch,
    makeLabelHtml,
    updateVisibility,
    updateIsolateScale
  };
});
window.VivaOsceCommon = Sahk.get('TimerCommon');
