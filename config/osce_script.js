'use strict';
const OSCE_SCRIPT_DATA = (function() {
  var entries = [];
  var firstExam = ENABLE_PREPARATION ? 1 : 0;
  var stationNum = 0;

  for (var si = firstExam; si < CONCLUSION_SESSION_INDEX; si++) {
    if (ENABLE_BREAK && si === BREAK_SESSION_INDEX) {
      var breakMin = Math.round(SESSION_PHASES[si][1].duration / 60);

      entries.push({
        session: si, phase: 0, offset: 0,
        sentences: ["Please proceed to the break area."]
      });

      entries.push({
        session: si, phase: 1, offset: 0,
        sentences: ["Break for " + breakMin + " minutes."]
      });
      continue;
    }

    stationNum++;

    entries.push({
      session: si, phase: 0, offset: 0,
      sentences: ["Please transit to your next station."]
    });

    entries.push({
      session: si, phase: 1, offset: 0,
      sentences: ["OSCE Station " + stationNum + " now begins."]
    });
  }

  entries.push({
    session: CONCLUSION_SESSION_INDEX, phase: 1, offset: 0,
    sentences: [
      "End of the Examination.",
      "Thank you for participating in the SAHK Final Examination Preparation Course OSCE Examination."
    ]
  });

  return entries;
})();
