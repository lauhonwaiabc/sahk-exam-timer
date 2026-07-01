'use strict';
const VIVA_SCRIPT_DATA = (function() {
  var entries = [];
  var firstExam = ENABLE_PREPARATION ? 1 : 0;
  var tableNum = 0;

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

    tableNum++;

    entries.push({
      session: si, phase: 0, offset: 0,
      sentences: ["Please transit to your next station."]
    });

    entries.push({
      session: si, phase: 1, offset: 0,
      sentences: ["Viva Table " + tableNum + " now begins."]
    });

    entries.push({
      session: si, phase: 1, offset: 600,
      sentences: ["5 minutes left for Viva Table " + tableNum + "."]
    });

    entries.push({
      session: si, phase: 2, offset: 0,
      sentences: ["Debriefing for Viva Table " + tableNum + " now begins."]
    });

    entries.push({
      session: si, phase: 2, offset: 300,
      sentences: ["2 minutes left for debriefing."]
    });
  }

  entries.push({
    session: CONCLUSION_SESSION_INDEX, phase: 1, offset: 0,
    sentences: [
      "End of the Examination.",
      "Thank you for participating in the SAHK Final Examination Preparation Course Viva Examination."
    ]
  });

  return entries;
})();
