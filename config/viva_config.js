const START_TIME_AM = "08:30:00";
const START_TIME_PM = "13:25:00";
const NUM_TABLES = 12;
const BASE_NUM_SESSIONS = 10;

const ENABLE_PREPARATION = true;
const PREPARATION_SESSION_INDEX = 0

const ENABLE_BREAK = true;
const BREAK_SESSION_INDEX_RAW = 6;

const standardPhases = [
  { title: 'Transit', duration: 60, info: '1 minute' },
  { title: 'Viva Exam', duration: 900, info: '15 minutes' },
  { title: 'Debriefing', duration: 420, info: '7 minutes' }
];

const preparationPhases = [
  { title: 'Preparation', duration: 1800, info: '30 minutes' }
];

const breakPhase = [
  { title: 'Break', duration: 900, info: '15 minutes' }
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
