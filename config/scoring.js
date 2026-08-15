'use strict';
Sahk.register('Scoring', function() {
  var API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : 'https://us-central1-sahk-timer.cloudfunctions.net/app';
  var examId = '', role = '', stationNo = null, stationName = '', identifier = '';
  var allScoresCache = [], onScoresUpdated = null;
  var _scoreIndex = {};
  var _lastFetchMs = 0;
  var _singleFresh = {};
  var CACHE_FRESH_MS = 2000;

  function _rebuildIndex() {
    _scoreIndex = {};
    for (var i = 0; i < allScoresCache.length; i++) {
      var it = allScoresCache[i];
      _scoreIndex[String(it.candidate).trim() + '|' + Number(it.station)] = i;
    }
  }

  function _findCached(cn, st) {
    var idx = _scoreIndex[String(cn).trim() + '|' + Number(st)];
    return idx === undefined ? null : allScoresCache[idx];
  }

  function _removeLocalScore(cn, st) {
    var key = String(cn).trim() + '|' + Number(st);
    if (key in _scoreIndex) {
      allScoresCache.splice(_scoreIndex[key], 1);
      _rebuildIndex();
    }
    delete _singleFresh[key];
  }

  function notifyScoresUpdated() {
    if (onScoresUpdated && typeof onScoresUpdated === 'function') onScoresUpdated();
  }

  function init(config) {
    examId = config.examId || ''; role = config.role || '';
    stationNo = config.stationNo != null ? config.stationNo : null;
    stationName = config.stationName || '';
    identifier = ((config.stationName || '') + ' ' + config.stationNo).trim();
    onScoresUpdated = config.onScoresUpdated || null;
    return Promise.resolve();
  }

  function setStation(no) { stationNo = no; }

  async function _authHeaders() {
    var headers = { 'Content-Type': 'application/json' };
    try {
      if (window.SahkAuth && window.SahkAuth.getIdToken) {
        var token = await window.SahkAuth.getIdToken(false);
        if (token) headers['Authorization'] = 'Bearer ' + token;
      }
    } catch(e) { console.warn('Could not obtain auth token:', e); }
    return headers;
  }

  async function fetchAllScores(station) {
    if (!examId) return;
    var url = API_BASE + '/scores/' + examId + (station != null ? '/station/' + station : '');
    try { var r = await fetch(url, { headers: await _authHeaders() }); if (r.ok) { allScoresCache = await r.json(); _lastFetchMs = Date.now(); _rebuildIndex(); } else console.error('fetchAllScores failed:', r.status); }
    catch(e) { console.error('fetchAllScores error:', e); }
  }

  function refreshScores() {
    var st = (role === 'examiner' && stationNo != null) ? stationNo : null;
    return fetchAllScores(st).then(function() { notifyScoresUpdated(); });
  }

  async function fetchScoreFor(cn, st) {
    if (!examId) return null;
    var stNum = Number(st);
    var key = String(cn).trim() + '|' + stNum;
    var cached = _findCached(cn, stNum);
    var lastGood = Math.max(_lastFetchMs, _singleFresh[key] || 0);
    if (cached && Date.now() - lastGood < CACHE_FRESH_MS) return cached;
    try {
      var url = API_BASE + '/scores/' + encodeURIComponent(examId) + '/' + encodeURIComponent(String(cn).trim()) + '/' + stNum;
      var r = await fetch(url, { headers: await _authHeaders() });
      if (r.ok) {
        var rec = await r.json();
        if (rec) {
          upsertLocalScores([{ exam: rec.exam || examId, candidate: rec.candidate, station: rec.station, score: rec.score, comment: rec.comment, identifier: rec.identifier }]);
          _singleFresh[key] = Date.now();
        } else {
          _removeLocalScore(cn, stNum);
        }
        return rec;
      }
      console.error('fetchScoreFor failed:', r.status);
    } catch(e) { console.error('fetchScoreFor error:', e); }
    return _findCached(cn, stNum);
  }

  function upsertLocalScores(entries) {
    if (!entries || !entries.length) return;
    entries.forEach(function(e) {
      var keyExam = e.exam || examId;
      var keyCand = String(e.candidate).trim();
      var keySt = Number(e.station);
      var key = keyCand + '|' + keySt;
      var idx = _scoreIndex[key];
      var now = Date.now();
      if (idx !== undefined && idx >= 0 && idx < allScoresCache.length) {
        allScoresCache[idx] = { id: allScoresCache[idx].id, exam: keyExam, timestamp: now, identifier: e.identifier || identifier, candidate: keyCand, station: keySt, score: e.score, comment: e.comment != null ? e.comment : (allScoresCache[idx].comment != null ? allScoresCache[idx].comment : null) };
      } else {
        allScoresCache.push({ id: '', exam: keyExam, timestamp: now, identifier: e.identifier || identifier, candidate: keyCand, station: keySt, score: e.score, comment: e.comment != null ? e.comment : null });
        _scoreIndex[key] = allScoresCache.length - 1;
      }
    });
  }

  function getLatestScore(cn) {
    var rec = _findCached(cn, stationNo);
    return rec ? rec.score : '-';
  }

  function getLatestScoreForStation(cn, st) {
    var rec = _findCached(cn, Number(st));
    return rec ? rec.score : '-';
  }

  function getLatestComment(cn, st) {
    var rec = _findCached(cn, Number(st));
    return rec && rec.comment ? rec.comment : '';
  }

  async function submitScore(cn, obs, score, comment) { return await submitScoreForStation(cn, obs, score, stationNo, comment); }

  async function submitScoreForStation(cn, obs, score, st, comment) {
    if (!examId || !identifier) return { success: false, error: 'Config missing' };
    try {
      var body = { exam:examId, candidate:String(cn).trim(), station:Number(st), score:score, identifier:identifier.trim() };
      if (comment !== undefined && comment !== null) body.comment = comment;
      var r = await fetch(API_BASE + '/scores', { method:'POST', headers: await _authHeaders(), body:JSON.stringify(body) });
      var result = await r.json();
      if (r.ok) {
        upsertLocalScores([body]);
        notifyScoresUpdated();
      }
      return result;
    } catch(e) { return { success: false, error: e.message }; }
  }

  async function submitScoreBatch(entries) {
    if (!examId || !identifier) return { success: false, error: 'Config missing' };
    if (!entries || !entries.length) return { success: false, error: 'No entries' };
    try {
      var payload = entries.map(function(e) {
        var entry = { exam: examId, candidate: String(e.candidate).trim(), station: Number(e.station), score: e.score, identifier: identifier.trim() };
        if (e.comment !== undefined && e.comment !== null) entry.comment = e.comment;
        return entry;
      });
      var r = await fetch(API_BASE + '/scores', { method:'POST', headers: await _authHeaders(), body:JSON.stringify(payload) });
      var result = await r.json();
      if (r.ok) {
        upsertLocalScores(payload);
        notifyScoresUpdated();
      }
      return result;
    } catch(e) { return { success: false, error: e.message }; }
  }

  function getExamInfo() { var n = { osce_am:'OSCE AM', osce_pm:'OSCE PM', viva_am:'Viva AM', viva_pm:'Viva PM', written:'Written' }; return n[examId] || examId; }

  var _adminToken = '';

  async function _getAdminToken() {
    if (_adminToken) return _adminToken;
    try {
      _adminToken = window.SahkAuth ? await window.SahkAuth.getIdToken(true) : null;
      if (!_adminToken) {
        alert('You must be logged in as an admin to perform this action.');
      }
      return _adminToken;
    } catch(e) {
      alert('Authentication error. Please log in again.');
      return null;
    }
  }

  async function adminExportCSV() {
    if (role !== 'admin') { alert('Access denied. Admin privileges required.'); return; }
    try {
      await fetchAllScores();
      var items = allScoresCache.slice();
      if (!items.length) { alert('No scores available to export.'); return; }
      items.sort(function(a, b) { return String(a.timestamp).localeCompare(String(b.timestamp)); });
      var headers = ['Exam', 'Timestamp', 'Identifier', 'Candidate', 'Station', 'Score', 'Comment'];
      var rows = items.map(function(s) { return [s.exam, s.timestamp, s.identifier, s.candidate, s.station, s.score, s.comment || '']; });
      var csv = [headers.join(',')].concat(rows.map(function(r) {
        return r.map(function(v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(',');
      })).join('\n');
      var blob = new Blob([csv], { type: 'text/csv' });
      var u = window.URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = u;
      a.download = examId + '_scores.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(u);
    } catch(e) { alert('Failed: ' + e.message); }
  }

  async function adminClearDatabase() {
    var token = await _getAdminToken();
    if (!token) return;
    if (!confirm('Delete ALL scores for ' + getExamInfo() + '?')) return;
    try {
      var r = await fetch(API_BASE + '/scores/' + examId, { method:'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
      if (r.ok) { alert('Cleared'); allScoresCache = []; _rebuildIndex(); if (onScoresUpdated) onScoresUpdated(); }
      else if (r.status === 401 || r.status === 403) { _adminToken = ''; alert('Access denied. You may not have admin privileges.'); }
      else alert('Failed');
    } catch(e) { alert('Failed: ' + e.message); }
  }

  function getStatusEl() { return document.getElementById('adminStatus'); }

  function setStatus(msg, good) { var s=getStatusEl(); if(s){ s.textContent=msg; s.style.color=good?'#2e7d32':'#c62828'; } }

  function isSplitExam() { return examId.indexOf('osce_')===0 || examId.indexOf('viva_')===0; }

  function getPairedExam() { if (!isSplitExam()) return null; return examId.indexOf('_am') !== -1 ? examId.replace('_am','_pm') : examId.replace('_pm','_am'); }

  function createAdminPanel() {
    var html = '<div class="admin-panel"><h3 class="admin-header">Admin Controls</h3><button class="admin-btn" id="adminExportCSV">Export CSV</button>';
    if (isSplitExam()) {
      html += '<button class="admin-btn admin-btn-report" id="adminCandidateReport" style="background:#00897b;color:#fff;">Candidate Report (Current Session)</button>';
      html += '<button class="admin-btn admin-btn-report" id="adminCandidateCombined" style="background:#00897b;color:#fff;">Candidate Report (All Sessions)</button>';
      html += '<button class="admin-btn" id="adminPreviewReport" style="background:#7c4dff;color:#fff;">Preview (Current Session)</button>';
      html += '<button class="admin-btn" id="adminPreviewCombined" style="background:#7c4dff;color:#fff;">Preview (All Sessions)</button>';
    } else {
      html += '<button class="admin-btn admin-btn-report" id="adminCandidateReport" style="background:#00897b;color:#fff;">Candidate Report</button>';
      html += '<button class="admin-btn" id="adminPreviewReport" style="background:#7c4dff;color:#fff;">Preview Report</button>';
    }
    html += '<button class="admin-btn admin-btn-danger" id="adminClearDB">Clear Database</button><span class="admin-exam-label">'+getExamInfo()+'</span><div class="admin-status" id="adminStatus"></div></div>';
    return html;
  }

  function initAdminEvents() {
    var eb=document.getElementById('adminExportCSV'); if(eb) eb.onclick=adminExportCSV;
    var cb=document.getElementById('adminClearDB'); if(cb) cb.onclick=adminClearDatabase;
    var cr=document.getElementById('adminCandidateReport'); if(cr) cr.onclick=adminGenerateCandidateReport;
    var cc=document.getElementById('adminCandidateCombined'); if(cc) cc.onclick=adminGenerateCombinedReport;
    var pv=document.getElementById('adminPreviewReport'); if(pv) pv.onclick=adminPreviewReport;
    var pv2=document.getElementById('adminPreviewCombined'); if(pv2) pv2.onclick=adminPreviewCombined;
  }

  async function adminGenerateCandidateReport() {
    setStatus('Generating Candidate Report...', true);
    try {
      if (window.SahkReportGenerator && window.SahkReportGenerator.generateReport) {
        await window.SahkReportGenerator.generateReport(examId);
      } else {
        setStatus('Report generator module not loaded.', false);
      }
    } catch(e) { setStatus('Failed: ' + e.message, false); }
  }

  async function adminPreviewReport() {
    setStatus('Generating Preview...', true);
    try {
      await fetchAllScores();
      if (!window.SahkReportGenerator || !window.SahkReportGenerator.buildPreview) {
        setStatus('Report generator module not loaded.', false);
        return;
      }
      var html = window.SahkReportGenerator.buildPreview(examId, allScoresCache);
      var container = document.getElementById('previewContainer');
      if (!container) { container = document.createElement('div'); container.id = 'previewContainer'; var parent = document.getElementById('scoreContainer') || document.getElementById('adminPanelContainer') || document.body; parent.appendChild(container); }
      container.innerHTML = html;
      container.style.display = 'block';
      container.scrollIntoView({ behavior: 'smooth' });
      setStatus('Preview ready.', true);
    } catch(e) { setStatus('Failed: ' + e.message, false); }
  }

  async function adminPreviewCombined() {
    setStatus('Generating Combined Preview...', true);
    try {
      if (!window.SahkReportGenerator || !window.SahkReportGenerator.buildCombinedPreview) {
        setStatus('Report generator module not loaded.', false);
        return;
      }
      var html = await window.SahkReportGenerator.buildCombinedPreview(examId, getPairedExam());
      var container = document.getElementById('previewContainer');
      if (!container) { container = document.createElement('div'); container.id = 'previewContainer'; var parent = document.getElementById('scoreContainer') || document.getElementById('adminPanelContainer') || document.body; parent.appendChild(container); }
      container.innerHTML = html;
      container.style.display = 'block';
      container.scrollIntoView({ behavior: 'smooth' });
      setStatus('Combined preview ready.', true);
    } catch(e) { setStatus('Failed: ' + e.message, false); }
  }

  async function adminGenerateCombinedReport() {
    setStatus('Generating Combined Candidate Report...', true);
    try {
      if (window.SahkReportGenerator && window.SahkReportGenerator.generateCombinedReport) {
        await window.SahkReportGenerator.generateCombinedReport(examId, getPairedExam());
      } else {
        setStatus('Report generator module not loaded.', false);
      }
    } catch(e) { setStatus('Failed: ' + e.message, false); }
  }

  return { init:init, setStation:setStation, fetchAllScores:fetchAllScores, refreshScores:refreshScores, fetchScoreFor:fetchScoreFor, getLatestScore:getLatestScore, getLatestScoreForStation:getLatestScoreForStation, getLatestComment:getLatestComment, submitScore:submitScore, submitScoreForStation:submitScoreForStation, submitScoreBatch:submitScoreBatch, getExamInfo:getExamInfo, createAdminPanel:createAdminPanel, initAdminEvents:initAdminEvents, adminGenerateCandidateReport:adminGenerateCandidateReport, get examId(){return examId;}, get role(){return role;}, get stationNo(){return stationNo;}, get identifier(){return identifier;}, get allScoresCache(){return allScoresCache;} };
});
window.SahkScoring = Sahk.get('Scoring');
