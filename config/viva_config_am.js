const START_TIME = "09:00:00";
const NUM_SESSIONS = 11;
const NUM_TABLES = 12;
const BREAK_SESSION = 5;

const standardPhases = [
  { title: 'Transit', duration: 60, info: '1 minute' },
  { title: 'Viva Exam', duration: 900, info: '15 minutes' },
  { title: 'Debriefing', duration: 420, info: '7 minutes' }
];

const breakPhase = [
  { title: 'Break', duration: 900, info: '15 minutes' }
];