const START_TIME_AM = "09:00:00";
const START_TIME_PM = "13:00:00";
const NUM_STATIONS = 15;
const BASE_NUM_SESSIONS = 15;

const ENABLE_PREPARATION = true;
const PREPARATION_SESSION_INDEX = 0

const ENABLE_BREAK = false;
const BREAK_SESSION_INDEX_RAW = 0;

const standardPhases = [
  { title: "Transit", duration: 120, info: "2 minutes" },
  { title: "OSCE Exam", duration: 600, info: "10 minutes" }
];

const preparationPhases = [
  { title: "Preparation", duration: 1800, info: "30 minutes" }
];

const breakPhase = [
  { title: "Break", duration: 900, info: "15 minutes" }
];

const BREAK_SESSION_INDEX = ENABLE_PREPARATION ? BREAK_SESSION_INDEX_RAW+1 : BREAK_SESSION_INDEX_RAW;
const NUM_SESSIONS = (ENABLE_PREPARATION ? 1 : 0) + BASE_NUM_SESSIONS + (ENABLE_BREAK ? 1 : 0);

const SESSION_PHASES = [];

if (ENABLE_PREPARATION) SESSION_PHASES.push([...preparationPhases]);
for (let i = 0; i < BASE_NUM_SESSIONS; i++) {
  if (ENABLE_BREAK && i === BREAK_SESSION_INDEX_RAW) {
    SESSION_PHASES.push([...breakPhase]);
  }
  SESSION_PHASES.push([...standardPhases]);
}
