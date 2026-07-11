'use strict';
Sahk.register('ScoringInline', function() {

  var _getScoreColor = function(val) {
    return (window.SCORE_COLORS && window.SCORE_COLORS[val]) ? window.SCORE_COLORS[val] : Sahk.get('Constants').SCORE_COLORS[val] || '#888';
  };
  var _getScoreOptions = function() {
    return (typeof SCORE_OPTIONS !== 'undefined' && SCORE_OPTIONS) ? SCORE_OPTIONS : Sahk.get('Constants').SCORE_OPTIONS;
  };
  var _getScoreColors = function() {
    return (typeof SCORE_COLORS !== 'undefined' && SCORE_COLORS) ? SCORE_COLORS : Sahk.get('Constants').SCORE_COLORS;
  };

  function updateScoringSubmitAllVisibility() {
    var btn = document.getElementById('scoringSubmitAllBtn');
    if (!btn) return;
    if (document.querySelector('.score-value[data-dirty="1"], .box-score-value[data-dirty="1"]')) {
      btn.style.display = '';
    } else {
      btn.style.display = 'none';
    }
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
      if (val === '' || val === '-') {
        val = '-';
      } else {
        var n = Number(val);
        if (isNaN(n) || _getScoreOptions().indexOf(n) === -1) {
          alert('Score must be one of: ' + _getScoreOptions().join(', ') + ' or "-"');
          val = oldVal;
        } else {
          val = String(n);
        }
      }
      span.textContent = val;
      span.style.color = _getScoreColor(val);
      if (onCommit) onCommit(val, span);
    }

    input.addEventListener('keydown', function(ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); input.blur(); }
      else if (ev.key === 'Escape') {
        span.textContent = oldVal;
        span.style.color = _getScoreColor(oldVal);
      }
    });
    input.addEventListener('blur', finish);
  }

  function setupInlineScoringDelegate() {
    var bc = document.getElementById('bottomContent');
    if (!bc) return;
    bc.addEventListener('click', function(e) {
      var t = e.target;
      if (t.classList.contains('box-score-value') && !t.querySelector('input')) {
        makeScoreEditable(t, function(val, cell) {
          cell.setAttribute('data-dirty', '1');
          var row = cell.closest('.box-score-row'); if (!row) return;
          var box = row.closest('.osce-box,.viva-box'); if (!box) box = row.parentNode;
          var saveBtn = box ? box.querySelector('.box-score-save') : null;
          if (saveBtn) saveBtn.style.display = '';
          updateScoringSubmitAllVisibility();
        });
        return;
      }
      if (t.classList.contains('score-value') && !t.querySelector('input') && !t.closest('.scoring-cell-obs') && !t.closest('.scoring-cell-rest')) {
        makeScoreEditable(t, function(val, cell) {
          cell.setAttribute('data-dirty', '1');
          var inner = cell.closest('.scoring-cell-inner'); if (!inner) return;
          var subBtn = inner.querySelector('.score-submit-btn');
          if (subBtn) subBtn.style.display = '';
          updateScoringSubmitAllVisibility();
        });
        return;
      }
      if (t.classList.contains('box-score-btn')) {
        var dir = parseInt(t.dataset.dir), cn = t.dataset.cn, st = t.dataset.st;
        var row = t.closest('.box-score-row'); if (!row) return;
        var cell = row.querySelector('.box-score-value'); if (!cell) return;
        var opts = _getScoreOptions(); var cols = _getScoreColors();
        var cur = cell.textContent, idx = opts.indexOf(cur === '-' ? '-' : Number(cur));
        idx = (idx + dir + opts.length) % opts.length;
        var ns = opts[idx]; cell.textContent = ns; cell.style.color = cols[ns] || '#888';
        cell.setAttribute('data-dirty', '1');
        var box = row.closest('.osce-box,.viva-box'); if (!box) box = row.parentNode;
        var saveBtn = box ? box.querySelector('.box-score-save') : null; if (saveBtn) saveBtn.style.display = '';
        updateScoringSubmitAllVisibility();
      } else if (t.classList.contains('box-score-save')) {
        var cn2 = t.dataset.cn, st2 = parseInt(t.dataset.st);
        var box2 = t.closest('.osce-box,.viva-box'); if (!box2) box2 = t.parentNode; if (!box2) return;
        var row2 = box2.querySelector('.box-score-row'); if (!row2) return;
        var cell2 = row2.querySelector('.box-score-value'); if (!cell2) return;
        var score = cell2.textContent;
        t.textContent = '...'; t.disabled = true;
        Sahk.get('Scoring').submitScoreForStation(cn2, null, score, st2).then(function(r) {
          t.textContent = 'Submit'; t.disabled = false;
          if (r.success) {
            t.style.display = 'none'; cell2.setAttribute('data-dirty', '0');
            updateScoringSubmitAllVisibility();
            if (!document.querySelector('.box-score-value[data-dirty="1"], .score-value[data-dirty="1"]')) {
              Sahk.get('Scoring').fetchAllScores().then(function() {
                if (typeof renderScoringMode === 'function') renderScoringMode();
              });
            }
          } else {
            alert('Failed: ' + (r.error || 'Unknown'));
          }
        }).catch(function(err) {
          t.textContent = 'Submit'; t.disabled = false;
          alert('Error: ' + (err.message || 'Unknown'));
        });
      }
    });
  }

  function buildInlineScoreHtml(cnRaw, stationIdx, hasRest, isRest) {
    if (!window.showInlineScoring || !cnRaw) return '';
    if (hasRest && isRest) return '';
    var sc = '-', sco = '#888';
    if (Sahk.get('Scoring') && typeof Sahk.get('Scoring').getLatestScoreForStation === 'function') {
      sc = Sahk.get('Scoring').getLatestScoreForStation(cnRaw, stationIdx + 1);
      sco = _getScoreColor(sc);
    }
    return '<div class="box-score-row"><span class="role-label">Score</span><button class="box-score-btn score-down" data-cn="' + cnRaw + '" data-st="' + (stationIdx + 1) + '" data-dir="-1">&#9664;</button><span class="box-score-value" style="color:' + sco + '">' + sc + '</span><button class="box-score-btn score-up" data-cn="' + cnRaw + '" data-st="' + (stationIdx + 1) + '" data-dir="1">&#9654;</button></div><button class="box-score-save" data-cn="' + cnRaw + '" data-st="' + (stationIdx + 1) + '" style="display:none">Submit</button>';
  }

  return {
    makeScoreEditable: makeScoreEditable,
    setupInlineScoringDelegate: setupInlineScoringDelegate,
    buildInlineScoreHtml: buildInlineScoreHtml,
    updateScoringSubmitAllVisibility: updateScoringSubmitAllVisibility,
    getScoreColor: _getScoreColor,
    getScoreOptions: _getScoreOptions
  };
});
