'use strict';
window.SahkScoring = (function() {
  var API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : 'https://us-central1-sahk-timer.cloudfunctions.net/api';
  var examId = '', role = '', stationNo = null, stationName = '', identifier = '';
  var latestScores = {}, allScoresCache = [], onScoresUpdated = null;

  function init(config) {
    examId = config.examId || ''; role = config.role || '';
    stationNo = config.stationNo != null ? config.stationNo : null;
    stationName = config.stationName || ''; identifier = config.identifier || '';
    onScoresUpdated = config.onScoresUpdated || null;
    fetchAllScores().then(function() { if (stationNo != null) fetchLatestScores(); });
  }

  function setStation(no) { stationNo = no; latestScores = {}; fetchLatestScores(); }

  async function fetchAllScores() {
    if (!examId) return;
    try { var r = await fetch(API_BASE + '/scores/' + examId); if (r.ok) allScoresCache = await r.json(); }
    catch(e) {}
  }

  async function fetchLatestScores() {
    if (!examId || stationNo == null) return;
    try {
      var r = await fetch(API_BASE + '/scores/' + examId + '/station/' + stationNo);
      if (r.ok) { var data = await r.json(); latestScores = {}; for (var i = 0; i < data.length; i++) latestScores[data[i].candidate] = data[i]; }
      if (onScoresUpdated && typeof onScoresUpdated === 'function') onScoresUpdated();
    } catch(e) {}
  }

  function getLatestScore(cn) { var rec = latestScores[cn]; return rec ? rec.score : '-'; }

  function getLatestScoreForStation(cn, st) {
    for (var i = allScoresCache.length - 1; i >= 0; i--)
      if (allScoresCache[i].candidate === String(cn) && allScoresCache[i].station === Number(st)) return allScoresCache[i].score;
    return '-';
  }

  async function submitScore(cn, obs, score) { return submitScoreForStation(cn, obs, score, stationNo); }

  async function submitScoreForStation(cn, obs, score, st) {
    if (!examId || !identifier) return { success: false, error: 'Config missing' };
    try {
      var r = await fetch(API_BASE + '/scores', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ exam:examId, candidate:String(cn), station:Number(st), score:score, identifier:identifier }) });
      var result = await r.json();
      if (r.ok) { await fetchAllScores(); if (Number(st) === stationNo) latestScores[cn] = result.record; if (onScoresUpdated && typeof onScoresUpdated === 'function') onScoresUpdated(); }
      return result;
    } catch(e) { return { success: false, error: e.message }; }
  }

  function getExamInfo() { var n = { osce_am:'OSCE AM', osce_pm:'OSCE PM', viva_am:'Viva AM', viva_pm:'Viva PM' }; return n[examId] || examId; }

  function scoreColor(score) { var m = { '-':'#000000', 2:'#d32f2f', 3:'#ff9800', 4:'#fdd835', 5:'#4caf50', 6:'#2196f3', 7:'#3f51b5', 8:'#9c27b0' }; return m[score] || '#888'; }

  // Admin
  async function adminExportCSV() { var pw=prompt('Admin password:'); if(pw!=='sahk_admin'){alert('Wrong');return;} try{var r=await fetch(API_BASE+'/export/'+examId+'?admin_password='+encodeURIComponent(pw));if(r.ok){var b=await r.blob();var u=window.URL.createObjectURL(b);var a=document.createElement('a');a.href=u;a.download=examId+'_scores.csv';a.click();window.URL.revokeObjectURL(u);}else alert('Failed');}catch(e){alert('Failed: '+e.message);} }
  async function adminClearDatabase() { var pw=prompt('Admin password:');if(pw!=='sahk_admin'){alert('Wrong');return;}if(!confirm('Delete ALL scores for '+getExamInfo()+'?'))return;try{var r=await fetch(API_BASE+'/scores/'+examId,{method:'DELETE',headers:{'X-Admin-Password':pw}});if(r.ok){alert('Cleared');latestScores={};allScoresCache=[];if(onScoresUpdated)onScoresUpdated();}else alert('Failed');}catch(e){alert('Failed: '+e.message);} }
  async function adminResetDatabase() { var pw=prompt('Admin password:');if(pw!=='sahk_admin'){alert('Wrong');return;}if(!confirm('FACTORY RESET all exams?'))return;if(!confirm('ARE YOU SURE?'))return;try{var r=await fetch(API_BASE+'/scores',{method:'DELETE',headers:{'X-Admin-Password':pw}});if(r.ok){alert('All reset');latestScores={};allScoresCache=[];if(onScoresUpdated)onScoresUpdated();}else alert('Failed');}catch(e){alert('Failed: '+e.message);} }

  function createAdminPanel() { return '<div class="admin-panel"><h3 class="admin-header">Admin Controls</h3><button class="admin-btn" id="adminExportCSV">Export CSV</button><button class="admin-btn admin-btn-danger" id="adminClearDB">Clear Database</button><button class="admin-btn admin-btn-danger" id="adminResetDB">Factory Reset All</button><span class="admin-exam-label">'+getExamInfo()+'</span><div class="admin-status" id="adminStatus"></div></div>'; }
  function initAdminEvents() { var eb=document.getElementById('adminExportCSV');if(eb)eb.onclick=adminExportCSV;var cb=document.getElementById('adminClearDB');if(cb)cb.onclick=adminClearDatabase;var rb=document.getElementById('adminResetDB');if(rb)rb.onclick=adminResetDatabase; }

  return { init:init, setStation:setStation, fetchLatestScores:fetchLatestScores, fetchAllScores:fetchAllScores, getLatestScore:getLatestScore, getLatestScoreForStation:getLatestScoreForStation, submitScore:submitScore, submitScoreForStation:submitScoreForStation, scoreColor:scoreColor, getExamInfo:getExamInfo, createAdminPanel:createAdminPanel, initAdminEvents:initAdminEvents, get examId(){return examId;}, get role(){return role;}, get stationNo(){return stationNo;}, get identifier(){return identifier;}, get latestScores(){return latestScores;}, get allScoresCache(){return allScoresCache;} };
})();
