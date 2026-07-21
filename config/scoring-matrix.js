'use strict';
Sahk.register('ScoringMatrix', function() {
  var P = Sahk.get('Constants').PHASE;
  var _lastScoringHtml = '';
  var SI = null;

  function getSI() {
    if (!SI) SI = Sahk.get('ScoringInline');
    return SI;
  }

  function buildAllCandidates(data) {
    var seen = {}, arr = [];
    if (!data) return arr;
    Object.keys(data).forEach(function(sn) {
      var d = data[sn]; if (!d) return;
      d.Candidate.forEach(function(cn) { if (cn && !seen[cn]) { seen[cn] = true; arr.push(cn); } });
    });
    arr.sort(function(a, b) { return a.localeCompare(b); });
    return arr;
  }

  function createScoringModeHtml(cfg, obsAtStation, candAtStation, candidateSession) {
    var candidates = buildAllCandidates(cfg.data);
    var isoSt = window.scoringIsolateStation != null ? Number(window.scoringIsolateStation) : null;
    var si_idx = window.curTimerSessionIdx != null ? window.curTimerSessionIdx : 0;
    var pi = window.curTimerPhaseIdx != null ? window.curTimerPhaseIdx : 0;
    var phase = SESSION_PHASES[si_idx] && SESSION_PHASES[si_idx][pi];
    var isTr = phase && phase.title === P.TRANSIT;
    var C = Sahk.get('TimerCommon');
    var curKey = C.getDataSessionKey(si_idx);
    var prevIdx = isTr ? C.getPrevExamSession(si_idx, cfg.data) : null;
    var prevKey = prevIdx !== null ? C.getDataSessionKey(prevIdx) : null;
    var SCO = getSI().getScoreColor;

    var html = '<h3 class="scoring-header">Scoring Table - ' + cfg.title + '</h3>';
    var cols = [];
    for (var s = 1; s <= cfg.numItems; s++) {
      if (isoSt === null || isoSt === s) {
        cols.push({ no: s, name: cfg.names[s - 1] || '' });
      }
    }
    html += '<div class="scoring-table-wrapper"><table class="scoring-matrix"><thead><tr><th class="scoring-corner">Candidate</th>';
    cols.forEach(function(cl) {
      html += '<th class="scoring-col-header">' + (cfg.type.charAt(0).toUpperCase() + cfg.type.slice(1)) + ' ' + cl.no + '<br><span class="scoring-col-sub">' + cl.name + '</span></th>';
    });
    html += '</tr></thead><tbody>';

    candidates.forEach(function(cn) {
      html += '<tr><td class="scoring-row-label">' + cn + '</td>';
      cols.forEach(function(cl) {
        if (cfg.hasRest) {
          var isRest = cfg.names[cl.no - 1] === 'Rest';
          if (isRest) { html += '<td class="scoring-matrix-cell scoring-cell-rest"><div class="scoring-cell-inner"><span class="score-value" style="color:#aaa">-</span></div></td>'; return; }
        }
        var colIdx = cl.no - 1;
        var isObsAny = !!(obsAtStation[cn] && obsAtStation[cn][colIdx]);
        var isCandAny = !!(candAtStation[cn] && candAtStation[cn][colIdx]);
        if (isObsAny || !isCandAny) {
          html += '<td class="scoring-matrix-cell scoring-cell-obs"><div class="scoring-cell-inner"><span class="score-value" style="color:#aaa">-</span></div></td>';
          return;
        }
        var sc = Sahk.get('Scoring').getLatestScoreForStation(cn, cl.no), co = SCO(sc);
        var comment = Sahk.get('Scoring').getLatestComment(cn, cl.no);
        var iconColor = comment ? '#f9a825' : (sc !== '-' ? '#999' : '#ccc');
        var iconStyle = sc === '-' ? 'display:none' : '';
        var iconClass = comment ? ' has-comment' : '';
        var cellClass = 'scoring-matrix-cell';
        var isCurSess = false, isPrevSess = false;
        if (curKey) { var d = cfg.data[curKey]; if (d) { if (d.Candidate && d.Candidate[colIdx] === cn) isCurSess = true; } }
        if (isTr && prevKey) { var pd = cfg.data[prevKey]; if (pd) { if (pd.Candidate && pd.Candidate[colIdx] === cn) isPrevSess = true; } }
        var cellSessionIdx = candidateSession[cn + '|' + colIdx];
        if (cellSessionIdx == null) cellSessionIdx = -1;
        if (isTr && isPrevSess) cellClass += ' scoring-prev-session';
        else if (isTr && isCurSess) cellClass += ' scoring-curr-transit';
        else if (!isTr && isCurSess) cellClass += ' scoring-curr-exam';
        else if (cellSessionIdx >= 0 && cellSessionIdx !== si_idx) {
          if (cellSessionIdx < si_idx) cellClass += ' scoring-past-session';
          else cellClass += ' scoring-future-session';
        }
        html += '<td class="' + cellClass + '"><div class="scoring-cell-inner"><div class="scoring-score-row"><button class="score-scroll-btn score-down" data-cn="' + cn + '" data-st="' + cl.no + '" data-dir="-1">&#9664;</button><span class="score-value" data-cn="' + cn + '" data-st="' + cl.no + '" data-dirty="0" style="color:' + co + '">' + sc + '</span><button class="score-scroll-btn score-up" data-cn="' + cn + '" data-st="' + cl.no + '" data-dir="1">&#9654;</button><span class="score-comment-icon' + iconClass + '" data-cn="' + cn + '" data-st="' + cl.no + '" style="cursor:pointer;font-size:1.1em;color:' + iconColor + ';' + iconStyle + '" title="' + (comment ? 'Edit comment' : 'Add comment') + '">&#x1F4AC;</span></div><div class="score-comment-area" data-cn="' + cn + '" data-st="' + cl.no + '" style="display:none;width:100%;min-width:100%"><textarea class="score-comment" data-cn="' + cn + '" data-st="' + cl.no + '" rows="2" placeholder="Comment..." style="width:100%;max-width:100%;box-sizing:border-box;resize:vertical;font-size:0.8em;font-family:inherit;padding:4px;border:1px solid #bbb;border-radius:4px;min-width:100%">' + (comment || '') + '</textarea></div><button class="score-submit-btn" data-cn="' + cn + '" data-st="' + cl.no + '" style="display:none">Submit</button></div></td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    html += '<div style="text-align:center;margin-top:16px"><button id="scoringSubmitAllBtn" style="font-size:1.1em;padding:10px 32px;border-radius:8px;border:none;background:#2e7d32;color:white;font-weight:700;cursor:pointer;transition:background 0.3s;display:none">Submit All Changes</button></div>';
    return html;
  }

  function bindScoringEvents(container) {
    if (!container) return;
    container.querySelectorAll('.score-scroll-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var dir = parseInt(btn.dataset.dir), cn = btn.dataset.candidate || btn.dataset.cn, st = btn.dataset.st;
        var inner = btn.closest('.scoring-cell-inner'); if (!inner) return;
        var cell = inner.querySelector('.score-value'); if (!cell) return;
        var opts = getSI().getScoreOptions(); var cols = (typeof SCORE_COLORS !== 'undefined' && SCORE_COLORS) ? SCORE_COLORS : Sahk.get('Constants').SCORE_COLORS;
        var cur = cell.textContent, idx = opts.indexOf(cur === '-' ? '-' : Number(cur));
        idx = (idx + dir + opts.length) % opts.length;
        var ns = opts[idx]; cell.textContent = ns; cell.style.color = cols[ns] || '#888';
        cell.setAttribute('data-dirty', '1');
        var icon = inner.querySelector('.score-comment-icon');
        if (icon) {
          icon.style.display = ns === '-' ? 'none' : '';
          if (ns === '-') {
            var commentArea = inner.querySelector('.score-comment-area');
            if (commentArea) commentArea.style.display = 'none';
          }
        }
        var subBtn = inner.querySelector('.score-submit-btn'); if (subBtn) subBtn.style.display = '';
        getSI().updateScoringSubmitAllVisibility();
      });
    });
    container.querySelectorAll('.score-submit-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var cn = btn.dataset.candidate || btn.dataset.cn, st = parseInt(btn.dataset.st);
        var inner = btn.closest('.scoring-cell-inner'); if (!inner) return;
        var cell = inner.querySelector('.score-value'); if (!cell) return;
        var score = cell.textContent;
        var commentEl = inner.querySelector('.score-comment');
        var comment = commentEl ? commentEl.value.trim() : '';
        btn.textContent = '...'; btn.disabled = true;
        Sahk.get('Scoring').submitScoreForStation(cn, null, score, st, comment).then(function(r) {
          btn.textContent = 'Submit'; btn.disabled = false;
          if (r.success) {
            btn.style.display = 'none'; cell.setAttribute('data-dirty', '0');
            var commentArea = inner.querySelector('.score-comment-area');
            if (commentArea) commentArea.style.display = 'none';
            var icon = inner.querySelector('.score-comment-icon');
            if (icon) { icon.style.color = comment ? '#f9a825' : '#999'; if (comment) icon.classList.add('has-comment'); else icon.classList.remove('has-comment'); }
            getSI().updateScoringSubmitAllVisibility();
            if (!document.querySelector('.score-value[data-dirty="1"], .box-score-value[data-dirty="1"]')) {
              Sahk.get('Scoring').fetchAllScores().then(function() {
                if (typeof renderScoringMode === 'function') renderScoringMode();
              });
            }
          } else {
            alert('Failed: ' + (r.error || 'Unknown'));
          }
        }).catch(function(err) {
          btn.textContent = 'Submit'; btn.disabled = false;
          alert('Error: ' + (err.message || 'Unknown'));
        });
      });
    });
    var submitAllBtn = document.getElementById('scoringSubmitAllBtn');
    if (submitAllBtn) {
      submitAllBtn.addEventListener('click', function() {
        var dirtyCells = document.querySelectorAll('.score-value[data-dirty="1"]');
        if (!dirtyCells.length) return;
        var entries = [];
        dirtyCells.forEach(function(cell) {
          var st = cell.dataset.st != null ? cell.dataset.st : (cell.dataset.q || null);
          if (st == null) return;
          var inner = cell.closest('.scoring-cell-inner');
          var commentEl = inner ? inner.querySelector('.score-comment') : null;
          entries.push({
            candidate: cell.dataset.cn,
            station: Number(st),
            score: cell.textContent,
            comment: commentEl ? commentEl.value.trim() : ''
          });
        });
        if (!entries.length) return;
        submitAllBtn.textContent = 'Submitting...';
        submitAllBtn.disabled = true;
        Sahk.get('Scoring').submitScoreBatch(entries).then(function(r) {
          submitAllBtn.textContent = 'Submit All Changes';
          submitAllBtn.disabled = false;
          if (r.success) {
            dirtyCells.forEach(function(cell) {
              cell.setAttribute('data-dirty', '0');
              var inner = cell.closest('.scoring-cell-inner');
              if (inner) {
                var subBtn = inner.querySelector('.score-submit-btn');
                if (subBtn) subBtn.style.display = 'none';
                var commentArea = inner.querySelector('.score-comment-area');
                if (commentArea) commentArea.style.display = 'none';
              }
            });
            getSI().updateScoringSubmitAllVisibility();
            Sahk.get('Scoring').fetchAllScores().then(function() {
              if (typeof renderScoringMode === 'function') renderScoringMode();
            });
          } else {
            alert('Failed: ' + (r.error || 'Unknown'));
          }
        }).catch(function(err) {
          submitAllBtn.textContent = 'Submit All Changes';
          submitAllBtn.disabled = false;
          alert('Error: ' + (err.message || 'Unknown'));
        });
      });
    }
    container.querySelectorAll('.score-comment-icon').forEach(function(icon) {
      icon.addEventListener('click', function(e) {
        e.stopPropagation();
        var cn = icon.dataset.cn, st = icon.dataset.st;
        var inner = icon.closest('.scoring-cell-inner'); if (!inner) return;
        var area = inner.querySelector('.score-comment-area[data-cn="' + cn + '"][data-st="' + st + '"]');
        if (!area) return;
        if (area.style.display !== 'none') {
          area.style.display = 'none';
        } else {
          area.style.display = '';
          var ta = area.querySelector('.score-comment');
          if (ta) setTimeout(function() { ta.focus(); }, 50);
        }
      });
    });
    container.querySelectorAll('.score-comment').forEach(function(ta) {
      ta.addEventListener('input', function() {
        var cn = ta.dataset.cn, st = ta.dataset.st;
        var inner = ta.closest('.scoring-cell-inner'); if (!inner) return;
        var cell = inner.querySelector('.score-value');
        if (cell) cell.setAttribute('data-dirty', '1');
        var subBtn = inner.querySelector('.score-submit-btn');
        if (subBtn) subBtn.style.display = '';
        getSI().updateScoringSubmitAllVisibility();
      });
    });
    getSI().updateScoringSubmitAllVisibility();
  }

  function renderScoringMode(cfg, obsAtStation, candAtStation, candidateSession) {
    var typeId = cfg.type === 'table' ? 'tableModeContainer' : 'stationModeContainer';
    var mainC = document.getElementById(typeId);
    var candidateC = document.getElementById('candidateModeContainer');
    var scoringC = document.getElementById('scoringModeContainer');
    var adminC = document.getElementById('adminPanelContainer');
    if (!window.isInScoringMode) {
      if (scoringC) scoringC.style.display = 'none';
      if (adminC) adminC.style.display = window.currentRole === 'admin' ? 'block' : 'none';
      if (mainC) mainC.style.display = '';
      return;
    }
    if (mainC) mainC.style.display = 'none';
    if (candidateC) candidateC.style.display = 'none';
    if (scoringC) scoringC.style.display = 'block';
    if (adminC) adminC.style.display = 'block';
    var html = createScoringModeHtml(cfg, obsAtStation, candAtStation, candidateSession);
    if (html !== _lastScoringHtml) {
      _lastScoringHtml = html;
      scoringC.innerHTML = html;
      bindScoringEvents(scoringC);
    }
  }

  return {
    createScoringModeHtml: createScoringModeHtml,
    bindScoringEvents: bindScoringEvents,
    renderScoringMode: renderScoringMode,
    buildAllCandidates: buildAllCandidates,
    get lastScoringHtml() { return _lastScoringHtml; },
    set lastScoringHtml(v) { _lastScoringHtml = v; }
  };
});
