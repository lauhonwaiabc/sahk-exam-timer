'use strict';
window.VivaTimer = (() => {
  const C = VivaOsceCommon;

  let TABLE_NAMES, startTimeCfg, examTitleCfg;
  let lastSearchValue = '';
  let isIsolated = false;
  let transitDisplayMode = 0;
  let ctrl;

  function renderEmptyContent() {
    const tableMode = document.getElementById('tableModeContainer');
    const candidateMode = document.getElementById('candidateModeContainer');
    if (tableMode) tableMode.style.display = 'none';
    if (candidateMode) candidateMode.style.display = 'none';
  }

  function generateTableModeHtml(sessionIdx, label) {
    label = label || 'current';
    const sessionKey = C.getDataSessionKey(sessionIdx);
    const details = vivaData[sessionKey];
    if (!details) return '';
    const labelHtml = C.makeLabelHtml(label);
    return Array(NUM_TABLES).fill(0).map((_, i) => {
      const cnRaw = details.Candidate[i];
      const observer = details.Observer[i] || '\u2014';
      var scoreHtml = '';
      if (window.showInlineScoring && cnRaw) {
        var sc = '-', sco = '#888';
        if (window.SahkScoring && typeof window.SahkScoring.getLatestScoreForStation === 'function') {
          sc = window.SahkScoring.getLatestScoreForStation(cnRaw, i + 1);
          sco = (window.SCORE_COLORS && window.SCORE_COLORS[sc]) ? window.SCORE_COLORS[sc] : '#888';
        }
        scoreHtml = '<div class="box-score-row"><span class="role-label">Score</span><button class="box-score-btn score-down" data-cn="'+cnRaw+'" data-st="'+(i+1)+'" data-dir="-1">&#9664;</button><span class="box-score-value" style="color:'+sco+'">'+sc+'</span><button class="box-score-btn score-up" data-cn="'+cnRaw+'" data-st="'+(i+1)+'" data-dir="1">&#9654;</button></div><button class="box-score-save" data-cn="'+cnRaw+'" data-st="'+(i+1)+'">Submit</button><span class="box-score-status"></span>';
      }
      return `<div class="viva-box" tabindex="0" aria-label="Table ${i + 1} details">
        ${labelHtml}
        <div class="viva-title">Table ${i + 1}<br><span style="font-size:0.7em;color:#555;">${TABLE_NAMES[i]}</span></div>
        <div class="candidate-row"><div class="role-label">Candidate</div><div class="candidate-name">${cnRaw || '\u2014'}</div></div>
        <div class="observer-row"><div class="role-label">Observer</div><div class="candidate-name">${observer}</div></div>
        ${scoreHtml}
      </div>`;
    }).join('');
  }

  function generateCandidateModeHtml(sessionIdx, label) {
    label = label || 'current';
    const sessionKey = C.getDataSessionKey(sessionIdx);
    const details = vivaData[sessionKey];
    if (!details) return '';
    const labelHtml = C.makeLabelHtml(label);
    const entries = [];
    for (let i = 0; i < NUM_TABLES; i++) {
      if (details.Candidate[i]) entries.push({number: details.Candidate[i], tableIndex: i, role: 'Candidate'});
      if (details.Observer[i]) entries.push({number: details.Observer[i], tableIndex: i, role: 'Observer'});
    }
    entries.sort((a, b) => a.number.localeCompare(b.number));
    return entries.map(({number, tableIndex, role}) => {
      return `<div class="${role === 'Observer' ? 'candidate-cell observer-cell' : 'candidate-cell'}" tabindex="0" aria-label="${role} ${number}, Table ${tableIndex + 1}">
        ${labelHtml}
        <div class="candidate-number">${number}</div>
        <div class="candidate-role ${role.toLowerCase()}">${role}</div>
        <div class="candidate-table">Table ${tableIndex + 1}<br><span style="font-size:0.8em;color:#555;">${TABLE_NAMES[tableIndex]}</span></div>
      </div>`;
    }).join('');
  }

  function renderTableMode(sessionIdx, label) {
    if (sessionIdx === undefined) sessionIdx = ctrl.selectedSessionIndex;
    label = label || 'current';
    const tableMode = document.getElementById('tableModeContainer');
    const candidateMode = document.getElementById('candidateModeContainer');
    if (candidateMode) candidateMode.style.display = 'none';
    if (tableMode) tableMode.style.display = 'flex';
    const sessionKey = C.getDataSessionKey(sessionIdx);
    const details = vivaData[sessionKey];
    if (!details) {
      if (tableMode) tableMode.innerHTML = '';
      return;
    }
    if (tableMode) tableMode.innerHTML = generateTableModeHtml(sessionIdx, label);
    highlightBoxes(lastSearchValue);
    if (isIsolated && window.scoringIsolateStation) {
      var t = tableMode.querySelector('.viva-box[aria-label="Table ' + window.scoringIsolateStation + ' details"]');
      if (t) t.classList.add('highlight');
    }
    updateVisibility();
  }

  function renderCandidateMode(sessionIdx, label) {
    if (sessionIdx === undefined) sessionIdx = ctrl.selectedSessionIndex;
    label = label || 'current';
    const tableMode = document.getElementById('tableModeContainer');
    const candidateMode = document.getElementById('candidateModeContainer');
    if (tableMode) tableMode.style.display = 'none';
    if (candidateMode) candidateMode.style.display = 'flex';
    const sessionKey = C.getDataSessionKey(sessionIdx);
    const details = vivaData[sessionKey];
    if (!details) {
      if (candidateMode) candidateMode.innerHTML = '';
      return;
    }
    if (candidateMode) candidateMode.innerHTML = generateCandidateModeHtml(sessionIdx, label);
    highlightBoxes(lastSearchValue);
    updateVisibility();
  }

  function renderBothSessions(prevIdx, nextIdx) {
    const container = document.getElementById('tableModeContainer');
    const candidateContainer = document.getElementById('candidateModeContainer');
    if (candidateContainer) candidateContainer.style.display = 'none';
    if (container) container.style.display = 'flex';
    const prevHtml = generateTableModeHtml(prevIdx, 'previous');
    const nextHtml = generateTableModeHtml(nextIdx, 'upcoming');
    if (container) container.innerHTML = prevHtml + nextHtml;
    highlightBoxes(lastSearchValue);
    updateVisibility();
  }

  window.refreshTimerDisplay = function() {
    if (!ctrl) return;
    try {
      var si = ctrl.selectedSessionIndex, pi = ctrl.selectedPhaseIndex;
      var phase = SESSION_PHASES[si] ? SESSION_PHASES[si][pi] : null;
      if (phase && phase.title === 'Transit') { renderTransitContent(si); return; }
      renderTableMode();
    } catch(e) {}
  };

  function renderTransitContent(sessionIdx) {
    const prevIdx = C.getPrevExamSession(sessionIdx, vivaData);
    const nextIdx = C.getNextExamSession(sessionIdx, vivaData);
    const hasPrev = prevIdx !== null;
    const hasNext = nextIdx !== null;

    if (transitDisplayMode === 2) {
      if (hasPrev && hasNext) {
        renderBothSessions(prevIdx, nextIdx);
        return;
      }
      const idx = hasPrev ? prevIdx : nextIdx;
      if (idx === null) { renderEmptyContent(); return; }
      const label = hasPrev ? 'previous' : 'upcoming';
      renderTableMode(idx, label);
      return;
    }

    const targetIdx = transitDisplayMode === 0 ? prevIdx : nextIdx;
    const label = transitDisplayMode === 0 ? 'previous' : 'upcoming';
    if (targetIdx === null) { renderEmptyContent(); return; }
    renderTableMode(targetIdx, label);
  }

  function highlightBoxes(searchValue) {
    document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
    if (!searchValue) return;
    const search = searchValue.trim();

    const container = document.getElementById('tableModeContainer');
    if (container) {
      const boxes = container.querySelectorAll('.viva-box');
      if (boxes.length > 0) {
        boxes.forEach(box => {
          const candEl = box.querySelector('.candidate-row .candidate-name');
          const obsEl = box.querySelector('.observer-row .candidate-name');
          const cand = candEl ? candEl.textContent.trim() : '';
          const obs = obsEl ? obsEl.textContent.trim() : '';
          if (cand === search || obs === search) { box.classList.add('highlight'); }
        });
      }
    }
    if (document.querySelectorAll('.highlight').length > 0) return;

    if (!C.hasMinAlphabet(search, 4)) return;
    const lowerSearch = search.toLowerCase();

    if (lowerSearch !== 'table') {
      const tc = document.getElementById('tableModeContainer');
      if (tc) {
        tc.querySelectorAll('.viva-box').forEach(box => {
          const ariaLabel = box.getAttribute('aria-label') || '';
          const m = ariaLabel.match(/Table (\d+)/);
          if (!m) return;
          const tableIdx = parseInt(m[1]) - 1;
          if (C.wordMatch(TABLE_NAMES[tableIdx], search)) { box.classList.add('highlight'); return; }
          if (C.wordMatch('Table ' + (tableIdx + 1), search)) { box.classList.add('highlight'); }
        });
      }
    }
  }

  function updateVisibility() {
    C.updateVisibility(isIsolated, '.viva-box', '.candidate-cell');
  }

  function applySearch() {
    try {
      const input = document.getElementById('searchInput');
      if (input) lastSearchValue = input.value.trim();
      highlightBoxes(lastSearchValue);
      updateVisibility();
    } catch (e) { /* search failure is non-critical */ }
  }

  function findTableFromSearch(val) {
    if (!val) return null;
    var m = val.match(/table\s+(\d+)/i);
    if (m) {
      var n = parseInt(m[1]);
      if (n >= 1 && n <= NUM_TABLES) return n;
    }
    if (C.hasMinAlphabet(val, 4)) {
      for (var i = 0; i < TABLE_NAMES.length; i++) {
        if (C.wordMatch(TABLE_NAMES[i], val)) return i + 1;
      }
      for (var i = 0; i < NUM_TABLES; i++) {
        if (C.wordMatch('Table ' + (i + 1), val)) return i + 1;
      }
    }
    return null;
  }

  function applyIsolate() {
    const si = document.getElementById('searchInput');
    if (!si) return;
    var val = si.value.trim();
    if (!val) return;
    isIsolated = true;
    window.isIsolated = true;
    window.scoringIsolateStation = findTableFromSearch(val);
    si.classList.add('locked');
    si.readOnly = true;
    var btn = document.getElementById('isolateBtn');
    if (btn) btn.textContent = 'Show All';
    var foundSt = window.scoringIsolateStation;
    if (foundSt) {
      var tmc = document.getElementById('tableModeContainer');
      if (tmc) {
        var boxes = tmc.querySelectorAll('.viva-box');
        boxes.forEach(function(b) { b.classList.remove('highlight'); });
        var target = tmc.querySelector('.viva-box[aria-label="Table ' + foundSt + ' details"]');
        if (target) target.classList.add('highlight');
      }
    }
    refreshDisplay();
  }

  function clearIsolate() {
    isIsolated = false;
    window.isIsolated = false;
    window.scoringIsolateStation = null;
    var si = document.getElementById('searchInput');
    if (si) { si.value = ''; si.classList.remove('locked'); si.readOnly = false; }
    var btn = document.getElementById('isolateBtn');
    if (btn) btn.textContent = 'Isolate';
    refreshDisplay();
  }

  function refreshDisplay() {
    if (window.isInScoringMode && typeof window.renderScoringMode === 'function') {
      window.renderScoringMode();
      return;
    }
    updateVisibility();
  }

  function toggleIsolate() {
    if (isIsolated) { clearIsolate(); }
    else { applyIsolate(); }
  }

  function start(config) {
    TABLE_NAMES = config.tableNames;
    startTimeCfg = config.startTimeStr;
    examTitleCfg = config.examTitle;

    ctrl = TimerCore.createController({
      startTimeStr: startTimeCfg,
      sessionPhases: SESSION_PHASES,
      examTitle: examTitleCfg,
      getSessionLabel: C.getSessionLabel,
      mutedByDefault: true,
      renderContent: (sessionIdx, phaseIdx) => {
        try {
          window.curTimerSessionIdx = sessionIdx;
          window.curTimerPhaseIdx = phaseIdx;
          if (window.isInScoringMode && typeof window.renderScoringMode === 'function') {
            window.renderScoringMode();
            return;
          }
          window.isIsolated = isIsolated;
          const phase = SESSION_PHASES[sessionIdx] ? SESSION_PHASES[sessionIdx][phaseIdx] : null;
          if (phase && phase.title === 'Transit') {
            renderTransitContent(sessionIdx);
            return;
          }
          renderTableMode();
        } catch (e) { /* render failure is non-critical */ }
      }
    });

    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', applySearch);
    const isolateBtn = document.getElementById('isolateBtn');
    if (isolateBtn) isolateBtn.addEventListener('click', toggleIsolate);

    const transitModeBtn = document.getElementById('transitModeBtn');
    if (transitModeBtn) {
      transitModeBtn.onclick = () => {
        try {
          transitDisplayMode = (transitDisplayMode + 1) % 3;
          const labels = ['Transit: Prev', 'Transit: Next', 'Transit: Both'];
          transitModeBtn.textContent = labels[transitDisplayMode];
          transitModeBtn.setAttribute('aria-pressed', (transitDisplayMode !== 0).toString());
          const phase = SESSION_PHASES[ctrl.selectedSessionIndex] ? SESSION_PHASES[ctrl.selectedSessionIndex][ctrl.selectedPhaseIndex] : null;
          if (phase && phase.title === 'Transit') {
            renderTransitContent(ctrl.selectedSessionIndex);
          }
        } catch (e) { /* transit toggle failure is non-critical */ }
      };
    }

    document.body.addEventListener('click', () => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        if (ctx) ctx.close();
      } catch (e) { /* audio init not critical */ }
    }, { once: true });

    ctrl.init();
  }

  return { start };
})();
