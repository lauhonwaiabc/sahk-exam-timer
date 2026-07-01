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
    var totalSec = parts[0] * 3600 + parts[1] * 60 + (parts[2] || 0) + offsetSeconds;
    totalSec = ((totalSec % 86400) + 86400) % 86400;
    var h = Math.floor(totalSec / 3600);
    var m = Math.floor((totalSec % 3600) / 60);
    var s = totalSec % 60;
    return TU.pad(h, 2) + ':' + TU.pad(m, 2) + ':' + TU.pad(s, 2);
  }

  return {
    recalculateScheduledTimes: recalculateScheduledTimes,
    generateSessionTimes: generateSessionTimes,
    adjustStartTime: adjustStartTime
  };
});
