'use strict';
Sahk.register('TimeSync', function() {

  var timeOffset = 0;
  var syncFailures = 0;
  var syncRetryTimer = null;
  var syncStatus = 'unknown';
  var statusListeners = [];

  function getCorrectedNow() {
    return Date.now() + timeOffset;
  }

  function setSyncStatus(status) {
    syncStatus = status;
    updateStatusBadge();
    statusListeners.forEach(function(fn) {
      try { fn(status); } catch(e) {}
    });
  }

  function updateStatusBadge() {
    var badge = document.getElementById('syncStatusBadge');
    if (!badge) return;
    var icon, color, text;
    switch (syncStatus) {
      case 'synced': icon = '\uD83D\uDFE2'; color = '#2e7d32'; text = 'Synced'; break;
      case 'local': icon = '\uD83D\uDFE1'; color = '#e65100'; text = 'Local Time'; break;
      case 'stale': icon = '\uD83D\uDFE0'; color = '#f57c00'; text = 'Stale'; break;
      case 'offline': icon = '\uD83D\uDD34'; color = '#d32f2f'; text = 'Offline'; break;
      default: icon = '\u26AA'; color = '#888'; text = 'Unknown'; break;
    }
    badge.innerHTML = '<span style="color:' + color + ';font-size:1.2em;margin-right:4px">' + icon + '</span><span style="color:' + color + ';font-weight:700">' + text + '</span>';
    badge.title = 'Time sync status: ' + text + (syncStatus === 'stale' ? ' (' + syncFailures + ' attempts)' : '');
  }

  async function syncStandardTime() {
    try {
      var response = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=Asia/Hong_Kong');
      var data = await response.json();
      var standardTime = new Date(data.dateTime).getTime();
      timeOffset = standardTime - Date.now();
      syncFailures = 0;
      setSyncStatus('synced');
      if (syncRetryTimer) { clearTimeout(syncRetryTimer); syncRetryTimer = null; }
      var warn = document.getElementById('syncWarning');
      if (warn) warn.style.display = 'none';
    } catch (e) {
      console.error('Failed to fetch standard time, using local time', e);
      syncFailures++;
      if (syncFailures === 1) {
        timeOffset = 0;
        setSyncStatus('local');
        var warn = document.getElementById('syncWarning');
        if (warn) {
          warn.textContent = '\u26A0 Time sync unavailable \u2014 using local time';
          warn.style.display = 'block';
        }
      } else if (syncFailures >= 5) {
        setSyncStatus('stale');
        var warn2 = document.getElementById('syncWarning');
        if (warn2) {
          warn2.textContent = '\u26A0 Time sync stale (' + syncFailures + ' attempts) \u2014 using local time';
          warn2.style.display = 'block';
        }
      } else {
        setSyncStatus('local');
      }
      if (syncRetryTimer) clearTimeout(syncRetryTimer);
      var delay = Math.min(2000 * Math.pow(2, Math.min(syncFailures - 1, 4)), 32000);
      syncRetryTimer = setTimeout(syncStandardTime, delay);
    }
  }

  function updateClock() {
    var clock = document.getElementById('clock');
    if (clock) {
      clock.textContent = new Date(getCorrectedNow()).toTimeString().slice(0, 8);
    }
  }

  function onStatusChange(callback) {
    statusListeners.push(callback);
    return function() {
      var idx = statusListeners.indexOf(callback);
      if (idx >= 0) statusListeners.splice(idx, 1);
    };
  }

  return {
    syncStandardTime: syncStandardTime,
    updateClock: updateClock,
    getCorrectedNow: getCorrectedNow,
    onStatusChange: onStatusChange,
    get syncStatus() { return syncStatus; },
    get timeOffset() { return timeOffset; },
    set timeOffset(v) { timeOffset = v; }
  };
});
