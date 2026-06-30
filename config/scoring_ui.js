'use strict';
Sahk.register('ScoringUI', function() {
  var cfg = { data: null, names: null, numItems: 0, type: 'station', title: '', modeLabel: 'Station Mode', hasRest: false };
  var _obsAtStation = {};
  var _candAtStation = {};
  var _candidateSession = {};
  var P = Sahk.get('Constants').PHASE;
  var SM = Sahk.get('ScoringMatrix');
  var SI = Sahk.get('ScoringInline');

  function init(config) {
    cfg.data = config.data;
    cfg.names = config.names;
    cfg.numItems = config.numItems;
    cfg.type = config.type;
    cfg.title = config.title;
    cfg.modeLabel = config.modeLabel;
    cfg.hasRest = config.hasRest || false;
    _precomputeMaps();
  }

  function _precomputeMaps() {
    _obsAtStation = {};
    _candAtStation = {};
    _candidateSession = {};
    if (!cfg.data) return;
    var dataObj = cfg.data;
    if (typeof dataObj === 'function') return;
    Object.keys(dataObj).forEach(function(sn) {
      var d = dataObj[sn];
      if (!d) return;
      if (d.Observer) {
        d.Observer.forEach(function(cn, colIdx) {
          if (cn) {
            if (!_obsAtStation[cn]) _obsAtStation[cn] = {};
            _obsAtStation[cn][colIdx] = true;
          }
        });
      }
      if (d.Candidate) {
        d.Candidate.forEach(function(cn, colIdx) {
          if (cn) {
            if (!_candAtStation[cn]) _candAtStation[cn] = {};
            _candAtStation[cn][colIdx] = true;
          }
        });
      }
    });
    var C = Sahk.get('TimerCommon');
    var totalSessions = typeof SESSION_PHASES !== 'undefined' ? SESSION_PHASES.length : 0;
    for (var si = 0; si < totalSessions; si++) {
      var sk = C.getDataSessionKey(si);
      var sd = dataObj[sk];
      if (sd && sd.Candidate) {
        sd.Candidate.forEach(function(cn, colIdx) {
          if (cn) {
            var key = cn + '|' + colIdx;
            if (!(key in _candidateSession)) { _candidateSession[key] = si; }
          }
        });
      }
    }
  }

  function buildAllCandidates() {
    return SM.buildAllCandidates(cfg.data);
  }

  function enterScoringMode() {
    window.isInScoringMode = true;
    SM.lastScoringHtml = '';
    window.scoringIsolateStation = window.currentRole === 'examiner'
      ? (window.scoringIsolateStation != null ? Number(window.scoringIsolateStation) : window.activeStationNo)
      : (window.scoringIsolateStation != null ? Number(window.scoringIsolateStation) : null);
    var tr = document.getElementById('transitModeBtn'); if (tr) tr.style.display = 'none';
    var tb = document.getElementById('toggleModeBtn'); if (tb) tb.textContent = cfg.modeLabel;
    Sahk.get('Scoring').fetchAllScores().then(function() { renderScoringMode(); });
    if (window.scoringRefreshId !== null) clearInterval(window.scoringRefreshId);
    window.scoringRefreshId = setInterval(function() {
      if (window.isInScoringMode) {
        var dirty = document.querySelector('.score-value[data-dirty="1"], .box-score-value[data-dirty="1"]');
        if (!dirty) Sahk.get('Scoring').fetchAllScores().then(function() { if (typeof renderScoringMode === 'function') renderScoringMode(); });
      }
    }, 30000);
  }

  function exitScoringMode() {
    window.isInScoringMode = false;
    var tr = document.getElementById('transitModeBtn'); if (tr) tr.style.display = '';
    if (window.scoringRefreshId !== null) { clearInterval(window.scoringRefreshId); window.scoringRefreshId = null; }
    renderScoringMode();
    if (typeof window.refreshTimerDisplay === 'function') window.refreshTimerDisplay();
  }

  function setupExtendedToggle() {
    var btn = document.getElementById('toggleModeBtn'); if (!btn) return;
    btn.onclick = function() {
      var text = this.textContent || '';
      if (text === cfg.modeLabel) { exitScoringMode(); this.textContent = 'Scoring Mode'; return; }
      if (text === 'Scoring Mode') { enterScoringMode(); renderScoringMode(); return; }
      enterScoringMode(); renderScoringMode();
    };
  }

  function initScoringModule() {
    Sahk.get('Scoring').init({
      examId: window.roleConfig.exam, role: window.currentRole, stationNo: window.activeStationNo,
      stationName: window.roleConfig.stationName || '',
      identifier: (window.roleConfig.stationName || '') + ' ' + window.activeStationNo,
      onScoresUpdated: function() {
        if (window.isInScoringMode && !document.querySelector('.score-value[data-dirty="1"], .box-score-value[data-dirty="1"]')) renderScoringMode();
      }
    });
  }

  function applyExaminerConfig() {
    var sp = window.roleConfig.searchPrefix || ((window.roleConfig.stationName || '') + ' ' + window.activeStationNo);
    var si = document.getElementById('searchInput');
    if (si) { si.value = sp; si.classList.add('locked'); si.readOnly = true; si.placeholder = ''; }
    setTimeout(function() {
      var ib = document.getElementById('isolateBtn');
      if (ib) { if (ib.textContent === 'Isolate') ib.click(); ib.style.display = 'none'; }
      if (si) si.dispatchEvent(new Event('input'));
    }, 350);
  }

  function applyAdminConfig() {
    var apc = document.getElementById('adminPanelContainer');
    if (apc) { apc.innerHTML = Sahk.get('Scoring').createAdminPanel(); apc.style.display = 'block'; Sahk.get('Scoring').initAdminEvents(); }
    setTimeout(function() {
      var tb = document.getElementById('transitModeBtn');
      if (tb && tb.textContent === 'Transit: Prev') {
        tb.click();
        setTimeout(function() { if (tb.textContent === 'Transit: Next') tb.click(); }, 100);
      }
    }, 400);
  }

  function applyCandidateConfig() {
    var cn = window.roleConfig.candidateNumber;
    if (!cn) return;
    var tb = document.getElementById('toggleModeBtn'); if (tb) tb.style.display = 'none';
    if (cn === '00') return;
    var si = document.getElementById('searchInput');
    if (si) { si.value = cn; si.classList.add('locked'); si.readOnly = true; si.placeholder = ''; }
    setTimeout(function() {
      var ib = document.getElementById('isolateBtn');
      if (ib && ib.textContent === 'Isolate') ib.click();
      if (ib) ib.style.display = 'none';
      if (si) si.dispatchEvent(new Event('input'));
      var tbn = document.getElementById('transitModeBtn'); if (tbn && tbn.textContent === 'Transit: Prev') tbn.click();
    }, 350);
  }

  window.renderScoringMode = function() {
    SM.renderScoringMode(cfg, _obsAtStation, _candAtStation, _candidateSession);
  };

  function renderScoringMode() {
    SM.renderScoringMode(cfg, _obsAtStation, _candAtStation, _candidateSession);
  }

  function applyRoleConfig() {
    if (window.currentRole === 'candidate') { applyCandidateConfig(); return; }
    window.showInlineScoring = true;
    initScoringModule();
    if (window.currentRole === 'examiner') applyExaminerConfig();
    else if (window.currentRole === 'admin') applyAdminConfig();
    setupExtendedToggle();
    SI.setupInlineScoringDelegate();
  }

  return {
    init: init,
    renderScoringMode: renderScoringMode,
    applyRoleConfig: applyRoleConfig,
    enterScoringMode: enterScoringMode,
    exitScoringMode: exitScoringMode,
    setupExtendedToggle: setupExtendedToggle,
    initScoringModule: initScoringModule,
    applyExaminerConfig: applyExaminerConfig,
    applyAdminConfig: applyAdminConfig,
    applyCandidateConfig: applyCandidateConfig,
    buildAllCandidates: buildAllCandidates,
    get obsAtStation() { return _obsAtStation; },
    get candAtStation() { return _candAtStation; },
    get candidateSession() { return _candidateSession; }
  };
});
window.scoringUI = Sahk.get('ScoringUI');
