'use strict';
Sahk.register('TimeSync', function() {

  var syncRetryTimer = null;
  var syncStatus = 'unknown';
  var statusListeners = [];
  var MAX_OFFSET_MS = 10000;

  var serverBaseTime = null;
  var serverBaseLocal = null;
  var activeSourceName = 'Local';

  var lastResults = [];
  var currentResultIndex = -1;
  var arrowsEnabled = true;
  var locked = false;

  var SYNC_SOURCES = [
    { name: 'TimeAPI', url: 'https://timeapi.io/api/Time/current/zone?timeZone=Asia/Hong_Kong', type: 'json', extract: function(d) { return Date.UTC(d.year, d.month - 1, d.day, d.hour, d.minute, d.seconds, d.milliSeconds || 0) - 28800000; } },
    { name: 'Cloudflare', url: 'https://www.cloudflare.com/cdn-cgi/trace', type: 'text', extract: function(t) { var m = t.match(/ts=(\d+)/); return m ? parseInt(m[1], 10) * 1000 : NaN; } },
    { name: 'WorldTimeAPI', url: 'https://worldtimeapi.org/api/timezone/Asia/Hong_Kong', type: 'json', extract: function(d) { return d.unixtime * 1000; } },
    { name: 'CurrentMillis', url: 'https://currentmillis.com/time/minutes-since-unix-epoch.php', type: 'text', extract: function(t) { return parseInt(t.trim(), 10) * 60000; } },
    { name: 'Google', url: 'https://www.google.com', type: 'header' }
  ];

  function getCorrectedNow() {
    if (serverBaseTime !== null) {
      return serverBaseTime + (Date.now() - serverBaseLocal);
    }
    return Date.now();
  }

  function applyResult(result) {
    if (result) {
      serverBaseTime = result.serverMs;
      serverBaseLocal = result.localMs;
      activeSourceName = result.name;
      currentResultIndex = lastResults.indexOf(result);
    } else {
      serverBaseTime = null;
      serverBaseLocal = null;
      activeSourceName = 'Local';
      currentResultIndex = -1;
    }
    setSyncStatus(result ? 'synced' : 'local');
  }

  function cycleSource(direction) {
    if (locked || lastResults.length === 0) return;
    var idx = currentResultIndex < 0 ? (direction > 0 ? -1 : 0) : currentResultIndex;
    idx += direction;
    if (idx < 0) idx = lastResults.length - 1;
    if (idx >= lastResults.length) idx = 0;
    applyResult(lastResults[idx]);
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
    var hasChoices = lastResults.length > 0;
    var arrowStyle = 'cursor:' + (arrowsEnabled ? 'pointer' : 'default') + ';opacity:' + (arrowsEnabled ? '1' : '0.4');
    var leftArrow = hasChoices ? '<span class="sync-arrow" data-dir="-1" style="' + arrowStyle + '">&#9664;</span>' : '';
    var rightArrow = hasChoices ? '<span class="sync-arrow" data-dir="1" style="' + arrowStyle + '">&#9654;</span>' : '';
    badge.innerHTML = leftArrow + '<span class="sync-name" style="display:inline-block;min-width:70px;text-align:center;margin:0 2px">' + activeSourceName + '</span>' + rightArrow;
    badge.title = syncStatus === 'synced' ? 'Using ' + activeSourceName + ' time' : 'Local time';
  }

  function getCurrentOffset() {
    if (serverBaseTime !== null) {
      return getCorrectedNow() - Date.now();
    }
    return 0;
  }

  function initBadgeArrows() {
    var badge = document.getElementById('syncStatusBadge');
    if (!badge) return;
    badge.addEventListener('click', function(e) {
      if (!arrowsEnabled) return;
      var arrow = e.target.closest('.sync-arrow');
      if (arrow) {
        var dir = parseInt(arrow.getAttribute('data-dir'), 10);
        if (dir) cycleSource(dir);
      }
    });
  }

  async function syncStandardTime() {
    var results = [];

    for (var si = 0; si < SYNC_SOURCES.length; si++) {
      try {
        var src = SYNC_SOURCES[si];
        var reqTime = Date.now();
        var opts = { cache: 'no-cache' };
        if (src.type === 'header') opts.method = 'HEAD';
        var res = await fetch(src.url, opts);
        if (!res.ok) { continue; }
        var serverMs;
        if (src.type === 'header') {
          var dateStr = res.headers.get('Date');
          if (!dateStr) { continue; }
          serverMs = new Date(dateStr).getTime();
        } else {
          var data = src.type === 'text' ? await res.text() : await res.json();
          serverMs = src.extract(data);
        }
        var resTime = Date.now();
        var rtt = resTime - reqTime;
        var latency = Math.floor(rtt / 2);
        var adjustedServerMs = serverMs + latency;
        var diff = adjustedServerMs - resTime;
        results.push({ name: src.name, serverMs: adjustedServerMs, localMs: resTime, diff: diff });
      } catch(e) {
      }
    }

    results.sort(function(a, b) { return Math.abs(a.diff) - Math.abs(b.diff); });
    results.push({ name: 'Local', serverMs: Date.now(), localMs: Date.now(), diff: 0 });
    lastResults = results;

    if (!locked) {
      var accepted = null;
      for (var ri = 0; ri < results.length; ri++) {
        if (Math.abs(results[ri].diff) <= MAX_OFFSET_MS) {
          accepted = results[ri];
          break;
        }
      }
      if (accepted !== null) {
        applyResult(accepted);
        if (syncRetryTimer) { clearTimeout(syncRetryTimer); syncRetryTimer = null; }
      } else {
        applyResult(null);
        var delay = 10000 + Math.floor(Math.random() * 5000);
        syncRetryTimer = setTimeout(syncStandardTime, delay);
      }
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

  var badgeInitialized = false;

  return {
    syncStandardTime: syncStandardTime,
    updateClock: updateClock,
    getCorrectedNow: getCorrectedNow,
    onStatusChange: onStatusChange,
    get syncStatus() { return syncStatus; },
    getCurrentOffset: getCurrentOffset,
    initArrows: function() {
      if (!badgeInitialized) { initBadgeArrows(); badgeInitialized = true; }
    },
    setArrowsEnabled: function(enabled) { arrowsEnabled = enabled; updateStatusBadge(); },
    lock: function() { locked = true; arrowsEnabled = false; updateStatusBadge(); },
    unlock: function() { locked = false; arrowsEnabled = true; updateStatusBadge(); }
  };
});
