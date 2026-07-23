'use strict';
Sahk.register('Scoring', function() {
  var API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : 'https://us-central1-sahk-timer.cloudfunctions.net/app';
  var examId = '', role = '', stationNo = null, stationName = '', identifier = '';
  var allScoresCache = [], onScoresUpdated = null;

  function init(config) {
    examId = config.examId || ''; role = config.role || '';
    stationNo = config.stationNo != null ? config.stationNo : null;
    stationName = config.stationName || '';
    identifier = ((config.stationName || '') + ' ' + config.stationNo).trim();
    onScoresUpdated = config.onScoresUpdated || null;
    return fetchAllScores().then(function() {
      if (onScoresUpdated && typeof onScoresUpdated === 'function') onScoresUpdated();
    });
  }

  function setStation(no) { stationNo = no; }

  async function fetchAllScores() {
    if (!examId) return;
    try { var r = await fetch(API_BASE + '/scores/' + examId); if (r.ok) allScoresCache = await r.json(); else console.error('fetchAllScores failed:', r.status); }
    catch(e) { console.error('fetchAllScores error:', e); }
  }

  function getLatestScore(cn) {
    for (var i = allScoresCache.length - 1; i >= 0; i--)
      if (allScoresCache[i].candidate === String(cn) && Number(allScoresCache[i].station) === stationNo) return allScoresCache[i].score;
    return '-';
  }

  function getLatestScoreForStation(cn, st) {
    for (var i = allScoresCache.length - 1; i >= 0; i--)
      if (allScoresCache[i].candidate === String(cn) && allScoresCache[i].station === Number(st)) return allScoresCache[i].score;
    return '-';
  }

  function getLatestComment(cn, st) {
    for (var i = allScoresCache.length - 1; i >= 0; i--)
      if (allScoresCache[i].candidate === String(cn) && allScoresCache[i].station === Number(st)) return allScoresCache[i].comment || '';
    return '';
  }

  async function submitScore(cn, obs, score, comment) { return await submitScoreForStation(cn, obs, score, stationNo, comment); }

  async function submitScoreForStation(cn, obs, score, st, comment) {
    if (!examId || !identifier) return { success: false, error: 'Config missing' };
    try {
      var body = { exam:examId, candidate:String(cn).trim(), station:Number(st), score:score, identifier:identifier.trim() };
      if (comment !== undefined && comment !== null) body.comment = comment;
      var r = await fetch(API_BASE + '/scores', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(body) });
      var result = await r.json();
      if (r.ok) { await fetchAllScores(); if (onScoresUpdated && typeof onScoresUpdated === 'function') onScoresUpdated(); }
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
      var r = await fetch(API_BASE + '/scores', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(payload) });
      var result = await r.json();
      if (r.ok) { await fetchAllScores(); if (onScoresUpdated && typeof onScoresUpdated === 'function') onScoresUpdated(); }
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
    var token = await _getAdminToken();
    if (!token) return;
    try {
      var r = await fetch(API_BASE + '/export/' + examId, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (r.ok) { var b = await r.blob(); var u = window.URL.createObjectURL(b); var a = document.createElement('a'); a.href = u; a.download = examId + '_scores.csv'; a.click(); window.URL.revokeObjectURL(u); }
      else if (r.status === 401 || r.status === 403) { _adminToken = ''; alert('Access denied. You may not have admin privileges.'); }
      else alert('Failed');
    } catch(e) { alert('Failed: ' + e.message); }
  }

  async function adminClearDatabase() {
    var token = await _getAdminToken();
    if (!token) return;
    if (!confirm('Delete ALL scores for ' + getExamInfo() + '?')) return;
    try {
      var r = await fetch(API_BASE + '/scores/' + examId, { method:'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
      if (r.ok) { alert('Cleared'); allScoresCache = []; if (onScoresUpdated) onScoresUpdated(); }
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

  return { init:init, setStation:setStation, fetchAllScores:fetchAllScores, getLatestScore:getLatestScore, getLatestScoreForStation:getLatestScoreForStation, getLatestComment:getLatestComment, submitScore:submitScore, submitScoreForStation:submitScoreForStation, submitScoreBatch:submitScoreBatch, getExamInfo:getExamInfo, createAdminPanel:createAdminPanel, initAdminEvents:initAdminEvents, adminGenerateCandidateReport:adminGenerateCandidateReport, get examId(){return examId;}, get role(){return role;}, get stationNo(){return stationNo;}, get identifier(){return identifier;}, get allScoresCache(){return allScoresCache;} };
});
window.SahkScoring = Sahk.get('Scoring');
