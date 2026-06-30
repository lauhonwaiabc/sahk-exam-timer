'use strict';
Sahk.register('TimeUtils', function() {

  function addSeconds(timeStr, seconds) {
    var parts = timeStr.split(':').map(Number);
    var date = new Date(0, 0, 0, parts[0], parts[1], parts[2]);
    date.setSeconds(date.getSeconds() + seconds);
    return date.toTimeString().slice(0, 8);
  }

  function parseTimeString(str) {
    if (!str) return 0;
    var parts = str.split(':').map(Number);
    return parts[0] * 3600 + parts[1] * 60 + (parts[2] || 0);
  }

  function formatTimeHMSSec(secs) {
    secs %= 86400;
    var h = Math.floor(secs / 3600);
    var m = Math.floor((secs % 3600) / 60);
    var s = secs % 60;
    return pad(h, 2) + ':' + pad(m, 2) + ':' + pad(s, 2);
  }

  function formatTime(seconds) {
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return pad(m, 2) + ':' + pad(s, 2);
  }

  function formatAbsoluteTime(ms) {
    return new Date(ms).toTimeString().slice(0, 8);
  }

  function secsToHHMM(secs) {
    return formatTimeHMSSec(secs).slice(0, 5);
  }

  function fmtHHMMSS(secs) {
    secs %= 86400;
    var h = Math.floor(secs / 3600);
    var m = Math.floor((secs % 3600) / 60);
    var s = secs % 60;
    return pad(h, 2) + ':' + pad(m, 2) + ':' + pad(s, 2);
  }

  function pad(num, len) {
    return num.toString().padStart(len, '0');
  }

  return {
    addSeconds: addSeconds,
    parseTimeString: parseTimeString,
    formatTimeHMSSec: formatTimeHMSSec,
    formatTime: formatTime,
    formatAbsoluteTime: formatAbsoluteTime,
    secsToHHMM: secsToHHMM,
    fmtHHMMSS: fmtHHMMSS
  };
});
