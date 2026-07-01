'use strict';
const DEBRIEF_SCRIPT_DATA = (function() {
  var entries = [];
  var firstExam = ENABLE_PREPARATION ? 1 : 0;
  var sessionNum = 0;

  for (var si = firstExam; si < CONCLUSION_SESSION_INDEX; si++) {
    sessionNum++;

    entries.push({
      session: si, phase: 0, offset: 0,
      sentences: [
        "Debriefing Session " + sessionNum + " now begins.",
      ]
    });

    entries.push({
      session: si, phase: 0, offset: 3000,
      sentences: [
        "10 minutes left for Debriefing Session " + sessionNum + ".",
      ]
    });
  }

  entries.push({
    session: CONCLUSION_SESSION_INDEX, phase: 0, offset: 0,
    sentences: [
      "End of the Examination.",
      "Thank you for participating in the SAHK Final Examination Preparation Course Debriefing."
    ]
  });

  return entries;
})();
