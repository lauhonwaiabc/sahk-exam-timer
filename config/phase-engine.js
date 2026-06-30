'use strict';
Sahk.register('PhaseEngine', function() {
  var TU = Sahk.get('TimeUtils');

  function recalculateScheduledTimes(startTimeStr, sessionPhases) {
    var scheduledTimes = [];
    var t = TU.parseTimeString(startTimeStr);
    for (var s = 0; s < sessionPhases.length; s++) {
      scheduledTimes[s] = [];
      for (var p = 0; p < sessionPhases[s].length; p++) {
        scheduledTimes[s].push(t);
        t += sessionPhases[s][p].duration;
      }
    }
    return scheduledTimes;
  }

  function generateSessionTimes(startTimeStr, sessionPhases) {
    var times = [], current = startTimeStr;
    for (var i = 0; i < sessionPhases.length; i++) {
      var phases = sessionPhases[i];
      var totalDuration = phases.reduce(function(sum, p) { return sum + p.duration; }, 0);
      var next = TU.addSeconds(current, totalDuration);
      times.push(current.slice(0, 5) + '-' + next.slice(0, 5));
      current = next;
    }
    return times;
  }

  function adjustStartTime(startTimeStr, offsetSeconds) {
    var parts = startTimeStr.split(':').map(Number);
    var totalSec = parts[0] * 3600 + parts[1] * 60 + parts[2] + offsetSeconds;
    totalSec = ((totalSec % 86400) + 86400) % 86400;
    var h = Math.floor(totalSec / 3600);
    var m = Math.floor((totalSec % 3600) / 60);
    var s = totalSec % 60;
    return pad(h, 2) + ':' + pad(m, 2) + ':' + pad(s, 2);
  }

  function pad(num, len) {
    return num.toString().padStart(len, '0');
  }

  function findCurrentPhase(nowSeconds, scheduledTimes, sessionPhases) {
    for (var s = 0; s < scheduledTimes.length; s++) {
      for (var p = 0; p < scheduledTimes[s].length; p++) {
        var phaseStart = scheduledTimes[s][p];
        var phaseEnd;
        if (p + 1 < scheduledTimes[s].length) {
          phaseEnd = scheduledTimes[s][p + 1];
        } else if (s + 1 < scheduledTimes.length) {
          phaseEnd = scheduledTimes[s + 1][0];
        } else {
          phaseEnd = phaseStart + sessionPhases[s][p].duration;
        }
        if (nowSeconds >= phaseStart && nowSeconds < phaseEnd) {
          return { session: s, phase: p, remaining: phaseEnd - nowSeconds };
        }
      }
    }
    return null;
  }

  return {
    recalculateScheduledTimes: recalculateScheduledTimes,
    generateSessionTimes: generateSessionTimes,
    adjustStartTime: adjustStartTime,
    findCurrentPhase: findCurrentPhase
  };
});
