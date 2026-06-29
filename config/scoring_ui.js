'use strict';
window.scoringUI = (function() {
  var cfg = { data: null, names: null, numItems: 0, type: 'station', title: '', modeLabel: 'Station Mode', hasRest: false };

  function init(config) {
    for (var k in config) if (config.hasOwnProperty(k)) cfg[k] = config[k];
  }

  function buildAllCandidates() {
    var seen = {}, arr = [];
    Object.keys(cfg.data).forEach(function(sn) {
      var d = cfg.data[sn]; if (!d) return;
      d.Candidate.forEach(function(cn) { if (cn && !seen[cn]) { seen[cn] = true; arr.push(cn); } });
    });
    arr.sort(function(a, b) { return a.localeCompare(b); });
    return arr;
  }

  function enterScoringMode() {
    isInScoringMode = true;
    scoringIsolateStation = currentRole === 'examiner'
      ? (window.scoringIsolateStation != null ? Number(window.scoringIsolateStation) : activeStationNo)
      : (window.scoringIsolateStation != null ? Number(window.scoringIsolateStation) : null);
    var tr = document.getElementById('transitModeBtn'); if (tr) tr.style.display = 'none';
    var tb = document.getElementById('toggleModeBtn'); if (tb) tb.textContent = cfg.modeLabel;
    SahkScoring.fetchAllScores().then(function() { renderScoringMode(); });
    if (scoringRefreshId !== null) clearInterval(scoringRefreshId);
    scoringRefreshId = setInterval(function() { if (isInScoringMode) { var dirty = document.querySelector('.score-value[data-dirty="1"], .box-score-value[data-dirty="1"]'); if (!dirty) SahkScoring.fetchAllScores().then(function() { renderScoringMode(); }); } }, 30000);
  }

  function exitScoringMode() {
    isInScoringMode = false;
    var tr = document.getElementById('transitModeBtn'); if (tr) tr.style.display = '';
    if (scoringRefreshId !== null) { clearInterval(scoringRefreshId); scoringRefreshId = null; }
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

  function makeScoreEditable(span, onCommit) {
    var oldVal = span.textContent;
    var input = document.createElement('input');
    input.type = 'text';
    input.value = oldVal;
    input.style.width = '36px';
    input.style.fontSize = '1em';
    input.style.fontWeight = '900';
    input.style.textAlign = 'center';
    input.style.border = '2px solid #1976d2';
    input.style.borderRadius = '4px';
    input.style.outline = 'none';
    span.textContent = '';
    span.appendChild(input);
    input.focus();
    input.select();
    function finish() {
      var val = input.value.trim();
      if (val === '' || val === '-') val = '-';
      else {
        var n = Number(val);
        if (isNaN(n) || n < 2 || n > 8 || !Number.isInteger(n)) {
          alert('Score must be 2\u20138 or "-"');
          val = oldVal;
        } else val = String(n);
      }
      span.textContent = val;
      span.style.color = (window.SCORE_COLORS && SCORE_COLORS[val]) ? SCORE_COLORS[val] : '#888';
      if (onCommit) onCommit(val, span);
    }
    input.addEventListener('keydown', function(ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); input.blur(); }
      else if (ev.key === 'Escape') {
        span.textContent = oldVal;
        span.style.color = (window.SCORE_COLORS && SCORE_COLORS[oldVal]) ? SCORE_COLORS[oldVal] : '#888';
      }
    });
    input.addEventListener('blur', finish);
  }

  function setupInlineScoringDelegate() {
    var bc = document.getElementById('bottomContent'); if (!bc) return;
    bc.addEventListener('click', function(e) {
      var t = e.target;
      if (t.classList.contains('box-score-value') && !t.querySelector('input')) {
        makeScoreEditable(t, function(val, cell) {
          cell.setAttribute('data-dirty', '1');
          var row = cell.closest('.box-score-row'); if (!row) return;
          var box = row.closest('.osce-box,.viva-box'); if (!box) box = row.parentNode;
          var saveBtn = box ? box.querySelector('.box-score-save') : null;
          if (saveBtn) saveBtn.style.display = '';
        });
        return;
      }
      if (t.classList.contains('score-value') && !t.querySelector('input')) {
        makeScoreEditable(t, function(val, cell) {
          cell.setAttribute('data-dirty', '1');
          var inner = cell.closest('.scoring-cell-inner'); if (!inner) return;
          var subBtn = inner.querySelector('.score-submit-btn');
          if (subBtn) subBtn.style.display = '';
        });
        return;
      }
      if (t.classList.contains('box-score-btn')) {
        var dir = parseInt(t.dataset.dir), cn = t.dataset.cn, st = t.dataset.st;
        var row = t.closest('.box-score-row'); if (!row) return;
        var cell = row.querySelector('.box-score-value'); if (!cell) return;
        var cur = cell.textContent, idx = SCORE_OPTIONS.indexOf(cur === '-' ? '-' : Number(cur));
        idx = (idx + dir + SCORE_OPTIONS.length) % SCORE_OPTIONS.length;
        var ns = SCORE_OPTIONS[idx]; cell.textContent = ns; cell.style.color = SCORE_COLORS[ns] || '#888';
        cell.setAttribute('data-dirty', '1');
        var box = row.closest('.osce-box,.viva-box'); if (!box) box = row.parentNode;
        var saveBtn = box ? box.querySelector('.box-score-save') : null; if (saveBtn) saveBtn.style.display = '';
      } else if (t.classList.contains('box-score-save')) {
        var cn = t.dataset.cn, st = parseInt(t.dataset.st);
        var box = t.closest('.osce-box,.viva-box'); if (!box) box = t.parentNode; if (!box) return;
        var row = box.querySelector('.box-score-row'); if (!row) return;
        var cell = row.querySelector('.box-score-value'); if (!cell) return;
        var score = cell.textContent;
        t.textContent = '...'; t.disabled = true;
        SahkScoring.submitScoreForStation(cn, null, score, st).then(function(r) {
          t.textContent = 'Submit'; t.disabled = false;
          if (r.success) {
            t.style.display = 'none'; cell.setAttribute('data-dirty', '0');
            if (!document.querySelector('.box-score-value[data-dirty="1"], .score-value[data-dirty="1"]')) SahkScoring.fetchAllScores().then(function() { if (typeof renderScoringMode === 'function') renderScoringMode(); });
          }
          else alert('Failed: ' + (r.error || 'Unknown'));
        });
      }
    });
  }

  function bindScoringEvents(container) {
    if (!container) return;
    container.querySelectorAll('.score-scroll-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var dir = parseInt(btn.dataset.dir), cn = btn.dataset.candidate || btn.dataset.cn, st = btn.dataset.st;
        var inner = btn.closest('.scoring-cell-inner'); if (!inner) return;
        var cell = inner.querySelector('.score-value'); if (!cell) return;
        var cur = cell.textContent, idx = SCORE_OPTIONS.indexOf(cur === '-' ? '-' : Number(cur));
        idx = (idx + dir + SCORE_OPTIONS.length) % SCORE_OPTIONS.length;
        var ns = SCORE_OPTIONS[idx]; cell.textContent = ns; cell.style.color = SCORE_COLORS[ns] || '#888';
        cell.setAttribute('data-dirty', '1');
        var subBtn = inner.querySelector('.score-submit-btn'); if (subBtn) subBtn.style.display = '';
      });
    });
    container.querySelectorAll('.score-submit-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var cn = btn.dataset.candidate || btn.dataset.cn, st = parseInt(btn.dataset.st);
        var inner = btn.closest('.scoring-cell-inner'); if (!inner) return;
        var cell = inner.querySelector('.score-value'); if (!cell) return;
        var score = cell.textContent;
        btn.textContent = '...'; btn.disabled = true;
        SahkScoring.submitScoreForStation(cn, null, score, st).then(function(r) {
          btn.textContent = 'Submit'; btn.disabled = false;
          if (r.success) {
            btn.style.display = 'none'; cell.setAttribute('data-dirty', '0');
            if (!document.querySelector('.score-value[data-dirty="1"], .box-score-value[data-dirty="1"]')) SahkScoring.fetchAllScores().then(function() { if (typeof renderScoringMode === 'function') renderScoringMode(); });
          }
          else alert('Failed: ' + (r.error || 'Unknown'));
        });
      });
    });
  }

  function initScoringModule() {
    SahkScoring.init({
      examId: roleConfig.exam, role: currentRole, stationNo: activeStationNo,
      stationName: roleConfig.stationName || '',
      identifier: currentRole === 'admin' ? 'admin' : (roleConfig.stationName || '') + ' ' + activeStationNo,
      onScoresUpdated: function() { if (isInScoringMode && !document.querySelector('.score-value[data-dirty="1"], .box-score-value[data-dirty="1"]')) renderScoringMode(); }
    });
  }

  function applyExaminerConfig() {
    var sp = roleConfig.searchPrefix || ((roleConfig.stationName || '') + ' ' + activeStationNo);
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
    if (apc) { apc.innerHTML = SahkScoring.createAdminPanel(); SahkScoring.initAdminEvents(); }
    setTimeout(function() {
      var tb = document.getElementById('transitModeBtn');
      if (tb && tb.textContent === 'Transit: Prev') {
        tb.click();
        setTimeout(function() { if (tb.textContent === 'Transit: Next') tb.click(); }, 100);
      }
    }, 400);
  }

  function applyCandidateConfig() {
    var cn = roleConfig.candidateNumber;
    if (!cn) return;
    var si = document.getElementById('searchInput');
    if (si) { si.value = cn; si.classList.add('locked'); si.readOnly = true; si.placeholder = ''; }
    var tb = document.getElementById('toggleModeBtn'); if (tb) tb.style.display = 'none';
    setTimeout(function() {
      var ib = document.getElementById('isolateBtn');
      if (ib && ib.textContent === 'Isolate') ib.click();
      if (ib) ib.style.display = 'none';
      if (si) si.dispatchEvent(new Event('input'));
      var tbn = document.getElementById('transitModeBtn'); if (tbn && tbn.textContent === 'Transit: Prev') tbn.click();
    }, 350);
  }

  function createScoringModeHtml() {
    var candidates = buildAllCandidates();
    var isoSt = scoringIsolateStation != null ? Number(scoringIsolateStation) : null;
    var si = window.curTimerSessionIdx != null ? window.curTimerSessionIdx : 0;
    var pi = window.curTimerPhaseIdx != null ? window.curTimerPhaseIdx : 0;
    var phase = SESSION_PHASES[si] && SESSION_PHASES[si][pi];
    var isTr = phase && phase.title === 'Transit';
    var C = VivaOsceCommon;
    var curKey = C.getDataSessionKey(si);
    var prevIdx = isTr ? C.getPrevExamSession(si, cfg.data) : null;
    var prevKey = prevIdx !== null ? C.getDataSessionKey(prevIdx) : null;

    var html = '<div class="scoring-panel scoring-table-panel"><h3 class="scoring-header">Scoring Table - ' + cfg.title + '</h3>';
    var cols = [];
    for (var s = 1; s <= cfg.numItems; s++) { if (isoSt === null || isoSt === s) cols.push({ no: s, name: cfg.names[s - 1] || '' }); }
    html += '<div class="scoring-table-wrapper"><table class="scoring-matrix"><thead><tr><th class="scoring-corner">Candidate</th>';
    cols.forEach(function(cl) { html += '<th class="scoring-col-header">' + (cfg.type.charAt(0).toUpperCase() + cfg.type.slice(1)) + ' ' + cl.no + '<br><span class="scoring-col-sub">' + cl.name + '</span></th>'; });
    html += '</tr></thead><tbody>';

    candidates.forEach(function(cn) {
      html += '<tr><td class="scoring-row-label">' + cn + '</td>';
      cols.forEach(function(cl) {
        if (cfg.hasRest) {
          var isRest = cfg.names[cl.no - 1] === 'Rest';
          if (isRest) { html += '<td class="scoring-matrix-cell scoring-cell-rest"><div class="scoring-cell-inner"><span class="score-value" style="color:#aaa">-</span></div></td>'; return; }
        }
        var isObsAny = false, isCandAny = false;
        Object.keys(cfg.data).forEach(function(sn) {
          var d = cfg.data[sn]; if (!d) return;
          if (d.Observer && d.Observer[cl.no - 1] === cn) isObsAny = true;
          if (d.Candidate && d.Candidate[cl.no - 1] === cn) isCandAny = true;
        });
        if (isObsAny || !isCandAny) {
          html += '<td class="scoring-matrix-cell scoring-cell-obs"><div class="scoring-cell-inner"><span class="score-value" style="color:#aaa">-</span></div></td>';
          return;
        }
        var sc = SahkScoring.getLatestScoreForStation(cn, cl.no), co = SCORE_COLORS[sc] || '#888';
        var cellClass = 'scoring-matrix-cell';
        var isCurSess = false, isPrevSess = false;
        if (curKey) { var d = cfg.data[curKey]; if (d) { if (d.Candidate && d.Candidate[cl.no - 1] === cn) isCurSess = true; } }
        if (isTr && prevKey) { var pd = cfg.data[prevKey]; if (pd) { if (pd.Candidate && pd.Candidate[cl.no - 1] === cn) isPrevSess = true; } }
        if (isTr && isPrevSess) cellClass += ' scoring-prev-session';
        else if (isTr && isCurSess) cellClass += ' scoring-curr-transit';
        else if (!isTr && isCurSess) cellClass += ' scoring-curr-exam';
        html += '<td class="' + cellClass + '"><div class="scoring-cell-inner"><div class="scoring-score-row"><button class="score-scroll-btn score-down" data-cn="' + cn + '" data-st="' + cl.no + '" data-dir="-1">&#9664;</button><span class="score-value" data-cn="' + cn + '" data-st="' + cl.no + '" data-dirty="0" style="color:' + co + '">' + sc + '</span><button class="score-scroll-btn score-up" data-cn="' + cn + '" data-st="' + cl.no + '" data-dir="1">&#9654;</button></div><button class="score-submit-btn" data-cn="' + cn + '" data-st="' + cl.no + '" style="display:none">Submit</button></div></td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table></div></div>';
    return html;
  }

  window.renderScoringMode = function() { renderScoringMode(); };
  function renderScoringMode() {
    var typeId = cfg.type === 'table' ? 'tableModeContainer' : 'stationModeContainer';
    var mainC = document.getElementById(typeId);
    var candidateC = document.getElementById('candidateModeContainer');
    var scoringC = document.getElementById('scoringModeContainer');
    var adminC = document.getElementById('adminPanelContainer');
    if (!isInScoringMode) {
      if (scoringC) scoringC.style.display = 'none'; if (adminC) adminC.style.display = 'none';
      if (mainC) mainC.style.display = ''; return;
    }
    if (mainC) mainC.style.display = 'none'; if (candidateC) candidateC.style.display = 'none';
    if (scoringC) scoringC.style.display = 'block'; if (adminC) adminC.style.display = 'block';
    scoringC.innerHTML = createScoringModeHtml();
    bindScoringEvents(scoringC);
  }

  function applyRoleConfig() {
    if (currentRole === 'candidate') { applyCandidateConfig(); return; }
    window.showInlineScoring = true;
    initScoringModule();
    if (currentRole === 'examiner') applyExaminerConfig();
    else if (currentRole === 'admin') applyAdminConfig();
    setupExtendedToggle();
    setupInlineScoringDelegate();
  }

  return {
    init: init,
    renderScoringMode: renderScoringMode,
    applyRoleConfig: applyRoleConfig,
    enterScoringMode: enterScoringMode,
    exitScoringMode: exitScoringMode,
    setupExtendedToggle: setupExtendedToggle,
    setupInlineScoringDelegate: setupInlineScoringDelegate,
    bindScoringEvents: bindScoringEvents,
    initScoringModule: initScoringModule,
    applyExaminerConfig: applyExaminerConfig,
    applyAdminConfig: applyAdminConfig,
    applyCandidateConfig: applyCandidateConfig,
    buildAllCandidates: buildAllCandidates,
    createScoringModeHtml: createScoringModeHtml
  };
})();
