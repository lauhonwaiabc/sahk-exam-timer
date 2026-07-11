'use strict';
window._dataReady = true;
var osceData = {
  "Session 1": {
    "Candidate": ["03", "05", "08", "10", "12", "15", "16", null, "18", "19", "22", "27", "26", "31", "34"],
    "Observer": [null, null, null, null, null, null, "21", null, null, null, null, null, "28", null, null]
  },
  "Session 2": {
    "Candidate": ["34", "03", "05", "08", "10", "12", "15", "21", null, "18", "19", "22", "27", "28", "31"],
    "Observer": [null, null, null, null, null, null, null, "16", null, null, null, null, null, "26", null]
  },
  "Session 3": {
    "Candidate": ["31", "34", "03", "05", "08", "10", "12", "15", "16", null, "18", "19", "22", "27", "26"],
    "Observer": [null, null, null, null, null, null, null, null, "21", null, null, null, null, null, "28"]
  },
  "Session 4": {
    "Candidate": ["26", "31", "34", "03", "05", "08", "10", "12", "15", "16", null, "18", "19", "22", "27"],
    "Observer": ["28", null, null, null, null, null, null, null, null, "21", null, null, null, null, null]
  },
  "Session 5": {
    "Candidate": ["27", "28", "31", "34", "03", "05", "08", "10", "12", "15", "21", null, "18", "19", "22"],
    "Observer": [null, "26", null, null, null, null, null, null, null, null, "16", null, null, null, null]
  },
  "Session 6": {
    "Candidate": ["22", "27", "26", "31", "34", "03", "05", "08", "10", "12", "15", "16", null, "18", "19"],
    "Observer": [null, null, "28", null, null, null, null, null, null, null, null, "21", null, null, null]
  },
  "Session 7": {
    "Candidate": ["19", "22", "27", "26", "31", "34", "03", "05", "08", "10", "12", "15", "16", null, "18"],
    "Observer": [null, null, null, "28", null, null, null, null, null, null, null, null, "21", null, null]
  },
  "Session 8": {
    "Candidate": ["18", "19", "22", "27", "28", "31", "34", "03", "05", "08", "10", "12", "15", "21", null],
    "Observer": [null, null, null, null, "26", null, null, null, null, null, null, null, null, "16", null]
  },
  "Session 9": {
    "Candidate": [null, "18", "19", "22", "27", "26", "31", "34", "03", "05", "08", "10", "12", "15", "16"],
    "Observer": [null, null, null, null, null, "28", null, null, null, null, null, null, null, null, "21"]
  },
  "Session 10": {
    "Candidate": ["16", null, "18", "19", "22", "27", "26", "31", "34", "03", "05", "08", "10", "12", "15"],
    "Observer": ["21", null, null, null, null, null, "28", null, null, null, null, null, null, null, null]
  },
  "Session 11": {
    "Candidate": ["15", "21", null, "18", "19", "22", "27", "28", "31", "34", "03", "05", "08", "10", "12"],
    "Observer": [null, "16", null, null, null, null, null, "26", null, null, null, null, null, null, null]
  },
  "Session 12": {
    "Candidate": ["12", "15", "16", null, "18", "19", "22", "27", "26", "31", "34", "03", "05", "08", "10"],
    "Observer": [null, null, "21", null, null, null, null, null, "28", null, null, null, null, null, null]
  },
  "Session 13": {
    "Candidate": ["10", "12", "15", "16", null, "18", "19", "22", "27", "26", "31", "34", "03", "05", "08"],
    "Observer": [null, null, null, "21", null, null, null, null, null, "28", null, null, null, null, null]
  },
  "Session 14": {
    "Candidate": ["08", "10", "12", "15", "21", null, "18", "19", "22", "27", "28", "31", "34", "03", "05"],
    "Observer": [null, null, null, null, "16", null, null, null, null, null, "26", null, null, null, null]
  },
  "Session 15": {
    "Candidate": ["05", "08", "10", "12", "15", "16", null, "18", "19", "22", "27", "26", "31", "34", "03"],
    "Observer": [null, null, null, null, null, "21", null, null, null, null, null, "28", null, null, null]
  }
};
