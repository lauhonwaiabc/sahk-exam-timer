'use strict';
const START_TIME = "12:15:00";
const ENABLE_PREPARATION = true;
const PREPARATION_SESSION_INDEX = 0;
const ENABLE_CONCLUSION = true;
const CONCLUSION_SESSION_INDEX = 4;

const SESSION_PHASES = [
  [{ title: 'Preparation', duration: 1800, info: '30 minutes' }],
  [{ title: 'Debriefing', duration: 3600, info: '60 minutes' }],
  [{ title: 'Debriefing', duration: 3600, info: '60 minutes' }],
  [{ title: 'Debriefing', duration: 3600, info: '60 minutes' }]
];

if (ENABLE_CONCLUSION) {
  SESSION_PHASES.push([{ title: 'Conclusion', duration: 1800, info: '30 minutes' }]);
}
