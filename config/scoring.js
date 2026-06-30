'use strict';
Sahk.register('Scoring', function() {
  var API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : 'https://us-central1-sahk-timer.cloudfunctions.net/app';
  var examId = '', role = '', stationNo = null, stationName = '', identifier = '';
  var latestScores = {}, allScoresCache = [], onScoresUpdated = null;

  function init(config) {
    examId = config.examId || ''; role = config.role || '';
    stationNo = config.stationNo != null ? config.stationNo : null;
    stationName = config.stationName || '';
    identifier = ((config.stationName || '') + ' ' + config.stationNo).trim();
    onScoresUpdated = config.onScoresUpdated || null;
    fetchAllScores().then(function() { if (stationNo != null) fetchLatestScores(); });
  }

  function setStation(no) { stationNo = no; latestScores = {}; fetchLatestScores(); }

  async function fetchAllScores() {
    if (!examId) return;
    try { var r = await fetch(API_BASE + '/scores/' + examId); if (r.ok) allScoresCache = await r.json(); else console.error('fetchAllScores failed:', r.status); }
    catch(e) { console.error('fetchAllScores error:', e); }
  }

  async function fetchLatestScores() {
    if (!examId || stationNo == null) return;
    try {
      var r = await fetch(API_BASE + '/scores/' + examId + '/station/' + stationNo);
      if (r.ok) { var data = await r.json(); latestScores = {}; for (var i = 0; i < data.length; i++) latestScores[data[i].candidate] = data[i]; }
      else console.error('fetchLatestScores failed:', r.status);
      if (onScoresUpdated && typeof onScoresUpdated === 'function') onScoresUpdated();
    } catch(e) { console.error('fetchLatestScores error:', e); }
  }

  function getLatestScore(cn) { var rec = latestScores[cn]; return rec ? rec.score : '-'; }

  function getLatestScoreForStation(cn, st) {
    for (var i = allScoresCache.length - 1; i >= 0; i--)
      if (allScoresCache[i].candidate === String(cn) && allScoresCache[i].station === Number(st)) return allScoresCache[i].score;
    return '-';
  }

  async function submitScore(cn, obs, score) { return await submitScoreForStation(cn, obs, score, stationNo); }

  async function submitScoreForStation(cn, obs, score, st) {
    if (!examId || !identifier) return { success: false, error: 'Config missing' };
    try {
      var r = await fetch(API_BASE + '/scores', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ exam:examId, candidate:String(cn).trim(), station:Number(st), score:score, identifier:identifier.trim() }) });
      var result = await r.json();
      if (r.ok) { await fetchAllScores(); if (Number(st) === stationNo) latestScores[cn] = result.record; if (onScoresUpdated && typeof onScoresUpdated === 'function') onScoresUpdated(); }
      return result;
    } catch(e) { return { success: false, error: e.message }; }
  }

  async function submitScoreBatch(entries) {
    if (!examId || !identifier) return { success: false, error: 'Config missing' };
    if (!entries || !entries.length) return { success: false, error: 'No entries' };
    try {
      var payload = entries.map(function(e) {
        return { exam: examId, candidate: String(e.candidate).trim(), station: Number(e.station), score: e.score, identifier: identifier.trim() };
      });
      var r = await fetch(API_BASE + '/scores', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(payload) });
      var result = await r.json();
      if (r.ok) { await fetchAllScores(); if (onScoresUpdated && typeof onScoresUpdated === 'function') onScoresUpdated(); }
      return result;
    } catch(e) { return { success: false, error: e.message }; }
  }

  function getExamInfo() { var n = { osce_am:'OSCE AM', osce_pm:'OSCE PM', viva_am:'Viva AM', viva_pm:'Viva PM', written:'Written' }; return n[examId] || examId; }

  function scoreColor(score) { var m = { '-':'#000000', 2:'#d32f2f', 3:'#ff9800', 4:'#fdd835', 5:'#4caf50', 6:'#2196f3', 7:'#3f51b5', 8:'#9c27b0' }; return m[score] || '#888'; }

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
      if (r.ok) { alert('Cleared'); latestScores = {}; allScoresCache = []; if (onScoresUpdated) onScoresUpdated(); }
      else if (r.status === 401 || r.status === 403) { _adminToken = ''; alert('Access denied. You may not have admin privileges.'); }
      else alert('Failed');
    } catch(e) { alert('Failed: ' + e.message); }
  }

  function createAdminPanel() { return '<div class="admin-panel"><h3 class="admin-header">Admin Controls</h3><button class="admin-btn" id="adminExportCSV">Export CSV</button><button class="admin-btn admin-btn-danger" id="adminClearDB">Clear Database</button><span class="admin-exam-label">'+getExamInfo()+'</span><div class="admin-status" id="adminStatus"></div></div>'; }
  function initAdminEvents() { var eb=document.getElementById('adminExportCSV');if(eb)eb.onclick=adminExportCSV;var cb=document.getElementById('adminClearDB');if(cb)cb.onclick=adminClearDatabase; }

  return { init:init, setStation:setStation, fetchLatestScores:fetchLatestScores, fetchAllScores:fetchAllScores, getLatestScore:getLatestScore, getLatestScoreForStation:getLatestScoreForStation, submitScore:submitScore, submitScoreForStation:submitScoreForStation, submitScoreBatch:submitScoreBatch, scoreColor:scoreColor, getExamInfo:getExamInfo, createAdminPanel:createAdminPanel, initAdminEvents:initAdminEvents, get examId(){return examId;}, get role(){return role;}, get stationNo(){return stationNo;}, get identifier(){return identifier;}, get latestScores(){return latestScores;}, get allScoresCache(){return allScoresCache;} };
});
window.SahkScoring = Sahk.get('Scoring');
