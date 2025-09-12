const START_TIME = "09:15:00";

const EXAM_TITLE = "SAHK Final Examination Preparation Course - Written Examination";
const SESSION_TITLES = ["Paper I", "Break", "Paper II", "Lunch", "Paper III"];

const SESSION_PHASES = [
    [
        {title: "Break", duration: 600},
        {title: "Preparation", duration: 300},
        {title: "Clinical Scenarios & SAQs", duration: 5400},
        {title: "Collection", duration: 300}
    ],
    [
        {title: "Break", duration: 1200}
    ],
    [
        {title: "Preparation", duration: 300},
        {title: "Critical Appraisal - Reading Time", duration: 1800},
        {title: "Critical Appraisal - Examination", duration: 600},
        {title: "Collection", duration: 150},
        {title: "Break", duration: 300},
        {title: "Preparation", duration: 150},
        {title: "Investigation - Examination", duration: 600},
        {title: "Collection", duration: 150},
        {title: "Break", duration: 300},
        {title: "Preparation", duration: 150},
        {title: "Radiology - Examination", duration: 600},
        {title: "Collection", duration: 300}
    ],
    [
        {title: "Lunch", duration: 3600}
    ],
    [
        {title: "Preparation", duration: 300},
        {title: "Multiple Choice Questions - Examination", duration: 9000},
        {title: "Collection", duration: 300}
    ]
];

const NUM_SESSIONS = SESSION_PHASES.length;
