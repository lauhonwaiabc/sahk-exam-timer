'use strict';
window.GenericTimer = (function() {
  var C = VivaOsceCommon;

  function create(config) {
    var type = config.type;             // 'station' or 'table'
    var names = config.names;           // STATION_NAMES or TABLE_NAMES
    var numItems = config.numItems;     // NUM_STATIONS or NUM_TABLES
    var hasRest = !!config.hasRest;
    var data = config.data;             // osceData or vivaData
    var restIndices = config.restIndices || [];

    var itemLabel = type === 'station' ? 'Station' : 'Table';
    var boxClass = type === 'station' ? 'osce-box' : 'viva-box';
    var titleClass = type === 'station' ? 'osce-title' : 'viva-title';
    var detailClass = type === 'station' ? 'candidate-station' : 'candidate-table';
    var labelLower = type === 'station' ? 'station' : 'table';
    var containerId = type === 'station' ? 'stationModeContainer' : 'tableModeContainer';

    var lastSearchValue = '';
    var isIsolated = false;
    var transitDisplayMode = 0;
    var ctrl;

    var selector = '.' + boxClass;
    var highlightSelector = selector + '.highlight, .candidate-cell.highlight';

    function renderEmptyContent() {
      var itemMode = document.getElementById(containerId);
      var candidateMode = document.getElementById('candidateModeContainer');
      if (itemMode) itemMode.style.display = 'none';
      if (candidateMode) candidateMode.style.display = 'none';
    }

    function getDataForSession(key) {
      return typeof data === 'function' ? data(key) : (data ? data[key] : null);
    }

    function generateItemModeHtml(sessionIdx, label) {
      label = label || 'current';
      var sessionKey = C.getDataSessionKey(sessionIdx);
      var details = getDataForSession(sessionKey);
      if (!details) return '';
      var labelHtml = C.makeLabelHtml(label);

      return Array(numItems).fill(0).map(function(_, i) {
        var isRest = hasRest && (restIndices.indexOf(i) >= 0) ? ' rest-station' : '';
        var cnRaw = details.Candidate[i];
        var observer = details.Observer[i] || '\u2014';
        var scoreHtml = '';
        if (window.showInlineScoring && cnRaw) {
          if (!hasRest || !isRest) {
            var sc = '-', sco = '#888';
            if (window.SahkScoring && typeof window.SahkScoring.getLatestScoreForStation === 'function') {
              sc = window.SahkScoring.getLatestScoreForStation(cnRaw, i + 1);
              sco = (window.SCORE_COLORS && window.SCORE_COLORS[sc]) ? window.SCORE_COLORS[sc] : '#888';
            }
            scoreHtml = '<div class="box-score-row"><span class="role-label">Score</span><button class="box-score-btn score-down" data-cn="'+cnRaw+'" data-st="'+(i+1)+'" data-dir="-1">&#9664;</button><span class="box-score-value" style="color:'+sco+'">'+sc+'</span><button class="box-score-btn score-up" data-cn="'+cnRaw+'" data-st="'+(i+1)+'" data-dir="1">&#9654;</button></div><button class="box-score-save" data-cn="'+cnRaw+'" data-st="'+(i+1)+'" style="display:none">Submit</button>';
          }
        }
        return '<div class="' + boxClass + isRest + '" tabindex="0" aria-label="' + itemLabel + ' ' + (i + 1) + ' details">' +
          labelHtml +
          '<div class="' + titleClass + '">' + itemLabel + ' ' + (i + 1) + '<br><span style="font-size:0.84em;color:#555;">' + names[i] + '</span></div>' +
          '<div class="candidate-row"><div class="role-label">Candidate</div><div class="candidate-name">' + (cnRaw || '\u2014') + '</div></div>' +
          '<div class="observer-row"><div class="role-label">Observer</div><div class="candidate-name">' + observer + '</div></div>' +
          scoreHtml +
        '</div>';
      }).join('');
    }

    function generateCandidateModeHtml(sessionIdx, label) {
      label = label || 'current';
      var sessionKey = C.getDataSessionKey(sessionIdx);
      var details = getDataForSession(sessionKey);
      if (!details) return '';
      var labelHtml = C.makeLabelHtml(label);
      var entries = [];
      for (var i = 0; i < numItems; i++) {
        if (details.Candidate[i]) entries.push({number: details.Candidate[i], idx: i, role: 'Candidate'});
        if (details.Observer[i]) entries.push({number: details.Observer[i], idx: i, role: 'Observer'});
      }
      entries.sort(function(a, b) { return a.number.localeCompare(b.number); });
      return entries.map(function(e) {
        var cls = 'candidate-cell' + (e.role === 'Observer' ? ' observer-cell' : '') + (hasRest && restIndices.indexOf(e.idx) >= 0 ? ' rest-station' : '');
        var nameOrLabel = type === 'station' ? names[e.idx] : 'Table';
        var secondary = type === 'station' ? (itemLabel + ' ' + (e.idx + 1)) : names[e.idx];
        return '<div class="' + cls + '" tabindex="0" aria-label="' + e.role + ' ' + e.number + ', ' + itemLabel + ' ' + (e.idx + 1) + '">' +
          labelHtml +
          '<div class="candidate-number">' + e.number + '</div>' +
          '<div class="candidate-role ' + e.role.toLowerCase() + '">' + e.role + '</div>' +
          '<div class="' + detailClass + '">' + (type === 'station' ? names[e.idx] : (itemLabel + ' ' + (e.idx + 1))) + '<br><span style="font-size:0.8em;color:#555;">' + secondary + '</span></div>' +
        '</div>';
      }).join('');
    }

    function renderItemMode(sessionIdx, label) {
      if (sessionIdx === undefined) sessionIdx = ctrl.selectedSessionIndex;
      label = label || 'current';
      var candidateMode = document.getElementById('candidateModeContainer');
      if (candidateMode) candidateMode.style.display = 'none';
      var imc = document.getElementById(containerId);
      if (!imc) return;
      imc.style.display = 'flex';
      var details = getDataForSession(C.getDataSessionKey(sessionIdx));
      if (!details) { imc.innerHTML = ''; return; }
      imc.innerHTML = generateItemModeHtml(sessionIdx, label);
      highlightBoxes(lastSearchValue);
      if (isIsolated) {
        document.querySelectorAll(highlightSelector).forEach(function(b) {
          b.classList.remove('highlight');
          b.setAttribute('data-iso', '');
        });
        if (window.scoringIsolateStation) {
          imc.querySelectorAll(selector + '[aria-label="' + itemLabel + ' ' + window.scoringIsolateStation + ' details"]').forEach(function(t) {
            t.setAttribute('data-iso', '');
          });
        }
      }
      updateVisibility();
    }

    function renderCandidateMode(sessionIdx, label) {
      if (sessionIdx === undefined) sessionIdx = ctrl.selectedSessionIndex;
      label = label || 'current';
      var itemMode = document.getElementById(containerId);
      if (itemMode) itemMode.style.display = 'none';
      var cmc = document.getElementById('candidateModeContainer');
      if (!cmc) return;
      cmc.style.display = 'flex';
      var details = getDataForSession(C.getDataSessionKey(sessionIdx));
      if (!details) { cmc.innerHTML = ''; return; }
      cmc.innerHTML = generateCandidateModeHtml(sessionIdx, label);
      highlightBoxes(lastSearchValue);
      if (isIsolated) {
        document.querySelectorAll(highlightSelector).forEach(function(b) {
          b.classList.remove('highlight');
          b.setAttribute('data-iso', '');
        });
      }
      updateVisibility();
    }

    function renderBothSessions(prevIdx, nextIdx) {
      var container = document.getElementById(containerId);
      var candidateContainer = document.getElementById('candidateModeContainer');
      if (candidateContainer) candidateContainer.style.display = 'none';
      if (!container) return;
      container.style.display = 'flex';
      var prevHtml = generateItemModeHtml(prevIdx, 'previous');
      var nextHtml = generateItemModeHtml(nextIdx, 'upcoming');
      container.innerHTML = prevHtml + nextHtml;
      highlightBoxes(lastSearchValue);
      if (isIsolated) {
        document.querySelectorAll(highlightSelector).forEach(function(b) {
          b.classList.remove('highlight');
          b.setAttribute('data-iso', '');
        });
        if (window.scoringIsolateStation) {
          container.querySelectorAll(selector + '[aria-label="' + itemLabel + ' ' + window.scoringIsolateStation + ' details"]').forEach(function(t) {
            t.setAttribute('data-iso', '');
          });
        }
      }
      updateVisibility();
    }

    function renderTransitContent(sessionIdx) {
      var prevIdx = C.getPrevExamSession(sessionIdx, data);
      var nextIdx = C.isExamSession(sessionIdx, data) ? sessionIdx : null;
      var hasPrev = prevIdx !== null;
      var hasNext = nextIdx !== null;

      if (transitDisplayMode === 2) {
        if (hasPrev && hasNext) { renderBothSessions(prevIdx, nextIdx); return; }
        var idx = hasPrev ? prevIdx : nextIdx;
        if (idx === null) { renderEmptyContent(); return; }
        renderItemMode(idx, hasPrev ? 'previous' : 'upcoming');
        return;
      }

      var targetIdx = transitDisplayMode === 0 ? prevIdx : nextIdx;
      if (targetIdx === null) { renderEmptyContent(); return; }
      renderItemMode(targetIdx, transitDisplayMode === 0 ? 'previous' : 'upcoming');
    }

    function highlightBoxes(searchValue) {
      document.querySelectorAll('.highlight').forEach(function(el) { el.classList.remove('highlight'); });
      if (!searchValue) return;
      var search = searchValue.trim();
      var lowerSearch = search.toLowerCase();

      var container = document.getElementById(containerId);
      if (container) {
        var boxes = container.querySelectorAll(selector);
        if (boxes.length > 0) {
          boxes.forEach(function(box) {
            var candEl = box.querySelector('.candidate-row .candidate-name');
            var obsEl = box.querySelector('.observer-row .candidate-name');
            var cand = candEl ? candEl.textContent.trim() : '';
            var obs = obsEl ? obsEl.textContent.trim() : '';
            if (cand === search || obs === search) { box.classList.add('highlight'); }
          });
        }
      }
      if (document.querySelectorAll('.highlight').length > 0) return;

      if (!C.hasMinAlphabet(search, 4)) return;

      if (lowerSearch !== labelLower) {
        var tc = document.getElementById(containerId);
        if (tc) {
          tc.querySelectorAll(selector).forEach(function(box) {
            var ariaLabel = box.getAttribute('aria-label') || '';
            var pattern = new RegExp(itemLabel + ' (\\d+)');
            var m = ariaLabel.match(pattern);
            if (!m) return;
            var idx = parseInt(m[1]) - 1;
            if (C.wordMatch(names[idx], search)) { box.classList.add('highlight'); return; }
            if (C.wordMatch(itemLabel + ' ' + (idx + 1), search)) { box.classList.add('highlight'); }
          });
        }
        if (document.querySelectorAll('.highlight').length > 0) return;
      }

      // Observer substring search (only for station/OSCE - more useful there)
      if (type === 'station') {
        var smc3 = document.getElementById(containerId);
        if (smc3) {
          smc3.querySelectorAll(selector).forEach(function(box) {
            var obsEl = box.querySelector('.observer-row .candidate-name');
            var obs = obsEl ? obsEl.textContent.trim() : '';
            if (obs && obs.toLowerCase().indexOf(lowerSearch) >= 0) { box.classList.add('highlight'); }
          });
        }
      }
    }

    function updateVisibility() {
      C.updateVisibility(isIsolated, selector, '.candidate-cell');
      C.updateIsolateScale(containerId);
      C.updateIsolateScale('candidateModeContainer');
    }

    function applySearch() {
      try {
        var input = document.getElementById('searchInput');
        if (input) lastSearchValue = input.value.trim();
        highlightBoxes(lastSearchValue);
        updateVisibility();
      } catch (e) {}
    }

    function findItemFromSearch(val) {
      if (!val) return null;
      var m = val.match(new RegExp(labelLower + '\\s+(\\d+)', 'i'));
      if (m) {
        var n = parseInt(m[1]);
        if (n >= 1 && n <= numItems) return n;
      }
      if (C.hasMinAlphabet(val, 4)) {
        for (var i = 0; i < names.length; i++) {
          if (C.wordMatch(names[i], val)) return i + 1;
        }
        for (var i = 0; i < numItems; i++) {
          if (C.wordMatch(itemLabel + ' ' + (i + 1), val)) return i + 1;
        }
      }
      return null;
    }

    function applyIsolate() {
      var si = document.getElementById('searchInput');
      if (!si) return;
      var val = si.value.trim();
      if (!val) return;
      isIsolated = true;
      window.isIsolated = true;
      window.scoringIsolateStation = findItemFromSearch(val);
      si.classList.add('locked');
      si.readOnly = true;
      var btn = document.getElementById('isolateBtn');
      if (btn) btn.textContent = 'Show All';
      document.querySelectorAll(selector + ', .candidate-cell').forEach(function(b) { b.removeAttribute('data-iso'); });
      highlightBoxes(val);
      document.querySelectorAll(highlightSelector).forEach(function(b) {
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
        renderItemMode();
      } catch(e) {}
    };

    function renderCurrent() {
      if (window.isInScoringMode && typeof window.renderScoringMode === 'function') {
        window.renderScoringMode();
        return;
      }
      window.isIsolated = isIsolated;
      var si = ctrl.selectedSessionIndex, pi = ctrl.selectedPhaseIndex;
      var phase = SESSION_PHASES[si] ? SESSION_PHASES[si][pi] : null;
      if (phase && phase.title === 'Transit') {
        renderTransitContent(si);
        return;
      }
      renderItemMode();
    }

    function start(externalConfig) {
      ctrl = TimerCore.createController({
        startTimeStr: externalConfig.startTimeStr,
        sessionPhases: SESSION_PHASES,
        examTitle: externalConfig.examTitle,
        getSessionLabel: C.getSessionLabel,
        mutedByDefault: true,
        renderContent: function(sessionIdx, phaseIdx) {
          try {
            window.curTimerSessionIdx = sessionIdx;
            window.curTimerPhaseIdx = phaseIdx;
            renderCurrent();
          } catch (e) {}
        }
      });

      var searchInput = document.getElementById('searchInput');
      if (searchInput) searchInput.addEventListener('input', applySearch);
      var isolateBtn = document.getElementById('isolateBtn');
      if (isolateBtn) isolateBtn.addEventListener('click', toggleIsolate);

      var transitModeBtn = document.getElementById('transitModeBtn');
      if (transitModeBtn) {
        transitModeBtn.onclick = function() {
          try {
            transitDisplayMode = (transitDisplayMode + 1) % 3;
            var labels = ['Transit: Prev', 'Transit: Next', 'Transit: Both'];
            transitModeBtn.textContent = labels[transitDisplayMode];
            transitModeBtn.setAttribute('aria-pressed', (transitDisplayMode !== 0).toString());
            var phase = SESSION_PHASES[ctrl.selectedSessionIndex] ? SESSION_PHASES[ctrl.selectedSessionIndex][ctrl.selectedPhaseIndex] : null;
            if (phase && phase.title === 'Transit') {
              renderTransitContent(ctrl.selectedSessionIndex);
            }
          } catch (e) {}
        };
      }

      document.body.addEventListener('click', function() {
        try {
          var AudioCtx = window.AudioContext || window.webkitAudioContext;
          var ctx = new AudioCtx();
          if (ctx) ctx.close();
        } catch (e) {}
      }, { once: true });

      ctrl.init();
    }

    return {
      start: start,
      get isIsolated() { return isIsolated; },
      set isIsolated(v) { isIsolated = v; },
      get transitDisplayMode() { return transitDisplayMode; },
      set transitDisplayMode(v) { transitDisplayMode = v; }
    };
  }

  return { create: create };
})();
