'use strict';
window.OsceTimer = (() => {
  const C = VivaOsceCommon;

  let startTimeCfg, examTitleCfg;
  let lastSearchValue = '';
  let isIsolated = false;
  let transitDisplayMode = 0;
  let ctrl;

  const REST_INDICES = STATION_NAMES.reduce((acc, name, i) => (name === "Rest" ? acc.concat(i) : acc), []);

  function renderEmptyContent() {
    const stationMode = document.getElementById('stationModeContainer');
    const candidateMode = document.getElementById('candidateModeContainer');
    if (stationMode) stationMode.style.display = 'none';
    if (candidateMode) candidateMode.style.display = 'none';
  }

  function generateStationModeHtml(sessionIdx, label) {
    label = label || 'current';
    const sessionKey = C.getDataSessionKey(sessionIdx);
    const details = osceData[sessionKey];
    if (!details) return '';
    const labelHtml = C.makeLabelHtml(label);
    return Array(NUM_STATIONS).fill(0).map((_, i) => {
      const isRest = REST_INDICES.includes(i) ? ' rest-station' : '';
      const cnRaw = details.Candidate[i];
      var scoreHtml = '';
      if (window.showInlineScoring && cnRaw && !isRest) {
        var sc = '-', sco = '#888';
        if (window.SahkScoring && typeof window.SahkScoring.getLatestScoreForStation === 'function') {
          sc = window.SahkScoring.getLatestScoreForStation(cnRaw, i + 1);
          sco = (window.SCORE_COLORS && window.SCORE_COLORS[sc]) ? window.SCORE_COLORS[sc] : '#888';
        }
        scoreHtml = '<div class="box-score-row"><span class="role-label">Score</span><button class="box-score-btn score-down" data-cn="'+cnRaw+'" data-st="'+(i+1)+'" data-dir="-1">&#9664;</button><span class="box-score-value" style="color:'+sco+'">'+sc+'</span><button class="box-score-btn score-up" data-cn="'+cnRaw+'" data-st="'+(i+1)+'" data-dir="1">&#9654;</button></div><button class="box-score-save" data-cn="'+cnRaw+'" data-st="'+(i+1)+'" style="display:none">Submit</button>';
      }
      return `<div class="osce-box${isRest}" tabindex="0" aria-label="Station ${i + 1} details">
        ${labelHtml}
        <div class="osce-title">${STATION_NAMES[i]}<br><span style="font-size:0.7em;color:#555;">Station ${i + 1}</span></div>
        <div class="candidate-row"><div class="role-label">Candidate</div><div class="candidate-name">${cnRaw || '\u2014'}</div></div>
        <div class="observer-row"><div class="role-label">Observer</div><div class="candidate-name">${details.Observer[i] || '\u2014'}</div></div>
        ${scoreHtml}
      </div>`;
    }).join('');
  }

  function generateCandidateModeHtml(sessionIdx, label) {
    label = label || 'current';
    const sessionKey = C.getDataSessionKey(sessionIdx);
    const details = osceData[sessionKey];
    if (!details) return '';
    const labelHtml = C.makeLabelHtml(label);
    const entries = [];
    for (let i = 0; i < NUM_STATIONS; i++) {
      if (details.Candidate[i]) entries.push({number: details.Candidate[i], stationIndex: i, role: 'Candidate'});
      if (details.Observer[i]) entries.push({number: details.Observer[i], stationIndex: i, role: 'Observer'});
    }
    entries.sort((a, b) => a.number.localeCompare(b.number));
    return entries.map(({number, stationIndex, role}) => {
      let cls = 'candidate-cell' + (role === "Observer" ? " observer-cell" : "") + (REST_INDICES.includes(stationIndex) ? " rest-station" : "");
      return `<div class="${cls}" tabindex="0" aria-label="${role} ${number}, Station ${stationIndex + 1}">
        ${labelHtml}
        <div class="candidate-number">${number}</div>
        <div class="candidate-role ${role.toLowerCase()}">${role}</div>
        <div class="candidate-station">${STATION_NAMES[stationIndex]}<br><span style="font-size:0.8em;color:#555;">Station ${stationIndex + 1}</span></div>
      </div>`;
    }).join('');
  }

  function renderStationMode(sessionIdx, label) {
    if (sessionIdx === undefined) sessionIdx = ctrl.selectedSessionIndex;
    label = label || 'current';
    const candidateMode = document.getElementById('candidateModeContainer');
    if (candidateMode) candidateMode.style.display = 'none';
    const smc = document.getElementById('stationModeContainer');
    if (!smc) return;
    smc.style.display = 'flex';
    const sessionKey = C.getDataSessionKey(sessionIdx);
    const details = osceData[sessionKey];
    if (!details) { smc.innerHTML = ''; return; }
    smc.innerHTML = generateStationModeHtml(sessionIdx, label);
    highlightBoxes(lastSearchValue);
    if (isIsolated) {
      document.querySelectorAll('.osce-box.highlight, .candidate-cell.highlight').forEach(function(b) {
        b.classList.remove('highlight');
        b.setAttribute('data-iso', '');
      });
      if (window.scoringIsolateStation) {
        smc.querySelectorAll('.osce-box[aria-label="Station ' + window.scoringIsolateStation + ' details"]').forEach(function(t) {
          t.setAttribute('data-iso', '');
        });
      }
    }
    updateVisibility();
  }

  function renderCandidateMode(sessionIdx, label) {
    if (sessionIdx === undefined) sessionIdx = ctrl.selectedSessionIndex;
    label = label || 'current';
    const stationMode = document.getElementById('stationModeContainer');
    if (stationMode) stationMode.style.display = 'none';
    const cmc = document.getElementById('candidateModeContainer');
    if (!cmc) return;
    cmc.style.display = 'flex';
    const sessionKey = C.getDataSessionKey(sessionIdx);
    const details = osceData[sessionKey];
    if (!details) { cmc.innerHTML = ''; return; }
    cmc.innerHTML = generateCandidateModeHtml(sessionIdx, label);
    highlightBoxes(lastSearchValue);
    if (isIsolated) {
      document.querySelectorAll('.osce-box.highlight, .candidate-cell.highlight').forEach(function(b) {
        b.classList.remove('highlight');
        b.setAttribute('data-iso', '');
      });
    }
    updateVisibility();
  }

  function highlightBoxes(searchValue) {
    document.querySelectorAll('.osce-box.highlight, .candidate-cell.highlight').forEach(el => el.classList.remove('highlight'));
    if (!searchValue) return;
    const search = searchValue.trim();
    const lowerSearch = search.toLowerCase();

    const smc = document.getElementById('stationModeContainer');
    if (smc) {
      const boxes = smc.querySelectorAll('.osce-box');
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
    if (document.querySelectorAll('.osce-box.highlight, .candidate-cell.highlight').length > 0) return;

    if (!C.hasMinAlphabet(search, 4)) return;

    if (lowerSearch !== 'station') {
      const smc2 = document.getElementById('stationModeContainer');
      if (smc2) {
        smc2.querySelectorAll('.osce-box').forEach(box => {
          const ariaLabel = box.getAttribute('aria-label') || '';
          const m = ariaLabel.match(/Station (\d+)/);
          if (!m) return;
          const stationIdx = parseInt(m[1]) - 1;
          if (C.wordMatch(STATION_NAMES[stationIdx], search)) { box.classList.add('highlight'); return; }
          if (C.wordMatch('Station ' + (stationIdx + 1), search)) { box.classList.add('highlight'); }
        });
      }
      if (document.querySelectorAll('.osce-box.highlight, .candidate-cell.highlight').length > 0) return;
    }

    const smc3 = document.getElementById('stationModeContainer');
    if (smc3) {
      smc3.querySelectorAll('.osce-box').forEach(box => {
        const obsEl = box.querySelector('.observer-row .candidate-name');
        const obs = obsEl ? obsEl.textContent.trim() : '';
        if (obs && obs.toLowerCase().includes(search.toLowerCase())) { box.classList.add('highlight'); }
      });
    }
  }

  function updateVisibility() {
    C.updateVisibility(isIsolated, '.osce-box', '.candidate-cell');
    C.updateIsolateScale('stationModeContainer');
    C.updateIsolateScale('candidateModeContainer');
  }

  function applySearch() {
    try {
      const input = document.getElementById('searchInput');
      if (input) lastSearchValue = input.value.trim();
      highlightBoxes(lastSearchValue);
      updateVisibility();
    } catch (e) { /* search failure is non-critical */ }
  }

  function findStationFromSearch(val) {
    if (!val) return null;
    var m = val.match(/station\s+(\d+)/i);
    if (m) {
      var n = parseInt(m[1]);
      if (n >= 1 && n <= NUM_STATIONS) return n;
    }
    if (C.hasMinAlphabet(val, 4)) {
      for (var i = 0; i < STATION_NAMES.length; i++) {
        if (C.wordMatch(STATION_NAMES[i], val)) return i + 1;
      }
      for (var i = 0; i < NUM_STATIONS; i++) {
        if (C.wordMatch('Station ' + (i + 1), val)) return i + 1;
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
    window.scoringIsolateStation = findStationFromSearch(val);
    si.classList.add('locked');
    si.readOnly = true;
    var btn = document.getElementById('isolateBtn');
    if (btn) btn.textContent = 'Show All';
    document.querySelectorAll('.osce-box, .candidate-cell').forEach(function(b) { b.removeAttribute('data-iso'); });
    highlightBoxes(val);
    document.querySelectorAll('.osce-box.highlight, .candidate-cell.highlight').forEach(function(b) {
      b.classList.remove('highlight');
      b.setAttribute('data-iso', '');
    });
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

  window.refreshTimerDisplay = function() {
    if (!ctrl) return;
    try {
      var si = ctrl.selectedSessionIndex, pi = ctrl.selectedPhaseIndex;
      var phase = SESSION_PHASES[si] ? SESSION_PHASES[si][pi] : null;
      if (phase && phase.title === 'Transit') { renderTransitContent(si); return; }
      renderStationMode();
    } catch(e) {}
  };

  function renderBothSessions(prevIdx, nextIdx) {
    const container = document.getElementById('stationModeContainer');
    const other = document.getElementById('candidateModeContainer');
    if (other) other.style.display = 'none';
    if (!container) return;
    container.style.display = 'flex';
    const prevHtml = generateStationModeHtml(prevIdx, 'previous');
    const nextHtml = generateStationModeHtml(nextIdx, 'upcoming');
    container.innerHTML = prevHtml + nextHtml;
    highlightBoxes(lastSearchValue);
    if (isIsolated) {
      document.querySelectorAll('.osce-box.highlight, .candidate-cell.highlight').forEach(function(b) {
        b.classList.remove('highlight');
        b.setAttribute('data-iso', '');
      });
      if (window.scoringIsolateStation) {
        container.querySelectorAll('.osce-box[aria-label="Station ' + window.scoringIsolateStation + ' details"]').forEach(function(t) {
          t.setAttribute('data-iso', '');
        });
      }
    }
    updateVisibility();
  }

  function renderTransitContent(sessionIdx) {
    const prevIdx = C.getPrevExamSession(sessionIdx, osceData);
    const nextIdx = C.isExamSession(sessionIdx, osceData) ? sessionIdx : null;
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
      renderStationMode(idx, label);
      return;
    }

    const targetIdx = transitDisplayMode === 0 ? prevIdx : nextIdx;
    const label = transitDisplayMode === 0 ? 'previous' : 'upcoming';
    if (targetIdx === null) { renderEmptyContent(); return; }
    renderStationMode(targetIdx, label);
  }

  function start(config) {
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
          renderStationMode();
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
