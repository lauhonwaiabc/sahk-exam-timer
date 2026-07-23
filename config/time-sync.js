'use strict';
Sahk.register('TimeSync', function() {

  var syncRetryTimer = null;
  var syncStatus = 'unknown';
  var syncSource = '';
  var statusListeners = [];
  var MAX_OFFSET_MS = 10000;

  var serverBaseTime = null;
  var serverBaseLocal = null;

  var SYNC_SOURCES = [
    { name: 'TimeAPI', url: 'https://timeapi.io/api/Time/current/zone?timeZone=Asia/Hong_Kong', type: 'json', extract: function(d) { return Date.UTC(d.year, d.month - 1, d.day, d.hour, d.minute, d.seconds, d.milliSeconds || 0) - 28800000; } },
    { name: 'Cloudflare', url: 'https://www.cloudflare.com/cdn-cgi/trace', type: 'text', extract: function(t) { var m = t.match(/ts=(\d+)/); return m ? parseInt(m[1], 10) * 1000 : NaN; } },
    { name: 'WorldTimeAPI', url: 'https://worldtimeapi.org/api/timezone/Asia/Hong_Kong', type: 'json', extract: function(d) { return d.unixtime * 1000; } }
  ];

  function getCorrectedNow() {
    if (serverBaseTime !== null) {
      return serverBaseTime + (Date.now() - serverBaseLocal);
    }
    return Date.now();
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
    switch (syncStatus) {
      case 'synced': badge.textContent = 'Source: ' + syncSource; badge.title = 'Using ' + syncSource + ' time'; break;
      default: badge.textContent = 'Source: Local'; badge.title = 'Local time'; break;
    }
  }

  function getCurrentOffset() {
    if (serverBaseTime !== null) {
      return getCorrectedNow() - Date.now();
    }
    return 0;
  }

  async function syncStandardTime() {
    var results = [];

    for (var si = 0; si < SYNC_SOURCES.length; si++) {
      try {
        var src = SYNC_SOURCES[si];
        var reqTime = Date.now();
        var res = await fetch(src.url, { cache: 'no-cache' });
        if (!res.ok) { console.log('TimeSync: ' + src.name + ' HTTP ' + res.status); continue; }
        var data = src.type === 'text' ? await res.text() : await res.json();
        var serverMs = src.extract(data);
        var resTime = Date.now();
        var rtt = resTime - reqTime;
        var latency = Math.floor(rtt / 2);
        var adjustedServerMs = serverMs + latency;
        var diff = adjustedServerMs - resTime;
        console.log('TimeSync: ' + src.name + ' diff=' + diff + 'ms (' + (diff / 60000).toFixed(1) + 'min), rtt=' + rtt + 'ms');
        results.push({ name: src.name, serverMs: adjustedServerMs, localMs: resTime, diff: diff });
      } catch(e) {
        console.log('TimeSync: ' + SYNC_SOURCES[si].name + ' error=' + (e.message || e));
      }
    }

    results.sort(function(a, b) { return Math.abs(a.diff) - Math.abs(b.diff); });

    var accepted = null;
    var acceptedName = 'none';
    for (var ri = 0; ri < results.length; ri++) {
      if (Math.abs(results[ri].diff) <= MAX_OFFSET_MS) {
        accepted = results[ri];
        acceptedName = results[ri].name;
        break;
      }
    }

    if (accepted !== null) {
      serverBaseTime = accepted.serverMs;
      serverBaseLocal = accepted.localMs;
      syncSource = acceptedName;
      console.log('TimeSync: using source="' + acceptedName + '" serverTime=' + new Date(serverBaseTime).toISOString());
      setSyncStatus('synced');
      if (syncRetryTimer) { clearTimeout(syncRetryTimer); syncRetryTimer = null; }
    } else {
      serverBaseTime = null;
      serverBaseLocal = null;
      setSyncStatus('local');
      var delay = 10000 + Math.floor(Math.random() * 5000);
      syncRetryTimer = setTimeout(syncStandardTime, delay);
    }
  }

  function updateClock() {
    var display = document.getElementById('timeDisplay');
    if (display) {
      display.textContent = new Date(getCorrectedNow()).toTimeString().slice(0, 8);
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
    getCurrentOffset: getCurrentOffset
  };
});
