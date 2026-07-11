'use strict';
const START_TIME = "08:45:00";
const EXAM_TITLE = "SAHK Final Examination Preparation Course - Written Examination";
const SESSION_TITLES = ["Pre-Examination", "Paper I", "Break", "Paper II", "Lunch", "Paper III"];

const SESSION_PHASES = [
    [
        {title: "Pre-Examination", duration: 600, info: "10 min"}
    ],
    [
        {title: "Preparation", duration: 300, info: "5 min"},
        {title: "Clinical Scenarios & SAQs", duration: 7200, info: "2 hours"},
        {title: "Paper Collection", duration: 300, info: "5 min"}
    ],
    [
        {title: "Break", duration: 1200, info: "20 min"}
    ],
    [
        {title: "Preparation", duration: 300, info: "5 min"},
        {title: "CA Article", duration: 1800, info: "30 min"},
        {title: "CA Exam", duration: 600, info: "10 min"},
        {title: "Transition", duration: 600, info: "10 min"},
        {title: "Investigation", duration: 600, info: "10 min"},
        {title: "Transition", duration: 600, info: "10 min"},
        {title: "Radiology", duration: 600, info: "10 min"},
        {title: "Paper Collection", duration: 300, info: "5 min"}
    ],
    [
        {title: "Lunch", duration: 3600, info: "60 min"}
    ],
    [
        {title: "Preparation", duration: 300, info: "5 min"},
        {title: "MCQ Examination", duration: 9000, info: "2 hours 30 min"},
        {title: "Paper Collection", duration: 300, info: "5 min"}
    ]
];

const PAPER_I_PAGES = 4;
const PAPER_CA_PAGES = 5;
const PAPER_INV_PAGES = 8;
const PAPER_RAD_PAGES = 6;
const PAPER_MCQ_PAGES = 40;

const TIMETABLE = [
    {time: "08:45 - 09:55", session: "Pre-Examination"},
    {time: "08:55 - 09:00", session: "Preparation"},
    {time: "09:00 - 11:00", session: "Paper I: Clinical Scenarios & SAQs"},
    {time: "11:00 - 11:05", session: "Paper I: Paper Collection"},
    {time: "11:05 - 11:25", session: "Break"},
    {time: "11:25 - 11:30", session: "Preparation"},
    {time: "11:30 - 12:00", session: "Paper II: Critical Appraisal (Article Reading)"},
    {time: "12:00 - 12:10", session: "Paper II: Critical Appraisal (Examination)"},
    {time: "12:10 - 12:20", session: "Transition"},
    {time: "12:20 - 12:30", session: "Paper II: Investigation"},
    {time: "12:30 - 12:40", session: "Transition"},
    {time: "12:40 - 12:50", session: "Paper II: Radiology"},
    {time: "12:50 - 12:55", session: "Paper Collection"},
    {time: "12:55 - 13:55", session: "Lunch"},
    {time: "13:55 - 14:00", session: "Preparation"},
    {time: "14:00 - 16:30", session: "Paper III: Multiple Choice Questions"},
    {time: "16:30 - 16:35", session: "Paper Collection & Dismissal"}
];
