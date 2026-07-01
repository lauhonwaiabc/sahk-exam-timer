'use strict';
const DEBRIEF_SCRIPT_DATA = (function() {
  var entries = [];
  var firstExam = ENABLE_PREPARATION ? 1 : 0;
  var sessionNum = 0;

  for (var si = firstExam; si < CONCLUSION_SESSION_INDEX; si++) {
    if (typeof BREAK_SESSION_INDEX !== 'undefined' && si === BREAK_SESSION_INDEX) continue;
    sessionNum++;

    entries.push({
      session: si, phase: 0, offset: 0,
      sentences: [
        "Debriefing Session " + sessionNum + " now begins.",
        "Examiners, please proceed to your assigned scenarios."
      ]
    });

    entries.push({
      session: si, phase: 0, offset: 3000,
      sentences: [
        "10 minutes left for Debriefing Session " + sessionNum + ".",
        "Please ensure all candidates are receiving timely feedback."
      ]
    });
  }

  entries.push({
    session: CONCLUSION_SESSION_INDEX, phase: 0, offset: 0,
    sentences: [
      "End of the Examination.",
      "Thank you for participating in the SAHK Final Examination Preparation Course."
    ]
  });

  return entries;
})();
