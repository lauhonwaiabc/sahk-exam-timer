'use strict';
const START_TIME_AM = "09:00:00";
const START_TIME_PM = "13:00:00";
const NUM_STATIONS = 15;
const BASE_NUM_SESSIONS = 15;

const ENABLE_PREPARATION = true;
const PREPARATION_SESSION_INDEX = 0

const ENABLE_BREAK = false;
const BREAK_SESSION_INDEX_RAW = 0;

const ENABLE_CONCLUSION = true;
const CONCLUSION_SESSION_INDEX = (ENABLE_PREPARATION ? 1 : 0) + BASE_NUM_SESSIONS + (ENABLE_BREAK ? 1 : 0);

const standardPhases = [
  { title: "Transit", duration: 120, info: "2 minutes" },
  { title: "OSCE Exam", duration: 600, info: "10 minutes" }
];

const preparationPhases = [
  { title: "Transit", duration: 120, info: "2 minutes" },
  { title: "Preparation", duration: 1680, info: "28 minutes" }
];

const breakPhase = [
  { title: "Transit", duration: 120, info: "2 minutes" },
  { title: "Break", duration: 780, info: "13 minutes" }
];

const conclusionPhases = [
  { title: "Transit", duration: 120, info: "2 minutes" },
  { title: "Conclusion", duration: 1680, info: "28 minutes" }
];

const BREAK_SESSION_INDEX = ENABLE_PREPARATION ? BREAK_SESSION_INDEX_RAW+1 : BREAK_SESSION_INDEX_RAW;
const SESSION_PHASES = [];

if (ENABLE_PREPARATION) SESSION_PHASES.push([...preparationPhases]);
for (let i = 0; i < BASE_NUM_SESSIONS; i++) {
  if (ENABLE_BREAK && i === BREAK_SESSION_INDEX_RAW) {
    SESSION_PHASES.push([...breakPhase]);
  }
  SESSION_PHASES.push([...standardPhases]);
}
if (ENABLE_CONCLUSION) SESSION_PHASES.push([...conclusionPhases]);
