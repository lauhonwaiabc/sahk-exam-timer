'use strict';
window.VivaOsceCommon = (() => {
  function getSessionLabel(i) {
    if (ENABLE_PREPARATION && i === PREPARATION_SESSION_INDEX) return 'Preparation';
    if (ENABLE_CONCLUSION && i === CONCLUSION_SESSION_INDEX) return 'Conclusion';
    if (ENABLE_BREAK && i === BREAK_SESSION_INDEX) return 'Break';
    let base = i - (ENABLE_PREPARATION ? 1 : 0) - (ENABLE_BREAK && i > BREAK_SESSION_INDEX ? 1 : 0);
    return base >= 0 ? `Session ${base + 1}` : `Session ${i + 1}`;
  }

  function getDataSessionKey(sessionIndex) {
    if (ENABLE_PREPARATION && sessionIndex === PREPARATION_SESSION_INDEX) return "Preparation";
    if (ENABLE_CONCLUSION && sessionIndex === CONCLUSION_SESSION_INDEX) return "Conclusion";
    if (ENABLE_BREAK && sessionIndex === BREAK_SESSION_INDEX) return "Break";
    let baseIdx = sessionIndex;
    if (ENABLE_PREPARATION && sessionIndex > PREPARATION_SESSION_INDEX) baseIdx--;
    if (ENABLE_BREAK && sessionIndex > BREAK_SESSION_INDEX) baseIdx--;
    return `Session ${baseIdx + 1}`;
  }

  function isExamSession(idx, data) {
    const label = getSessionLabel(idx);
    if (label === 'Preparation' || label === 'Break' || label === 'Conclusion') return false;
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
    if (!isExamSession(idx, data)) return null;
    return idx;
  }

  function hasMinAlphabet(str, min) {
    if (typeof str !== 'string') return false;
    let count = 0;
    for (let i = 0; i < str.length; i++) {
      if (/[a-zA-Z]/.test(str[i])) { count++; if (count >= min) return true; }
    }
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
      const highlighted = document.querySelectorAll(`${boxSelector}.highlight, ${cellSelector}.highlight`);
      if (highlighted.length === 0) {
        document.querySelectorAll(`${boxSelector}, ${cellSelector}`).forEach(box => box.style.display = 'none');
        return;
      }
      document.querySelectorAll(`${boxSelector}, ${cellSelector}`).forEach(box => {
        box.style.display = box.classList.contains('highlight') ? '' : 'none';
      });
    } else {
      document.querySelectorAll(`${boxSelector}, ${cellSelector}`).forEach(box => box.style.display = '');
    }
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
    updateVisibility
  };
})();
