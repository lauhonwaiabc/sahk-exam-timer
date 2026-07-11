'use strict';
window._dataReady = true;
var osceData = {
  "Session 1": {
    "Candidate": ["01", "04", "06", "07", "11", "13", "14", null, "17", "20", "24", "25", "29", "32", "33"],
    "Observer": [null, null, null, null, null, null, null, null, null, null, "23", null, null, "30", null]
  },
  "Session 2": {
    "Candidate": ["33", "01", "04", "06", "07", "11", "13", "14", null, "17", "20", "23", "25", "29", "30"],
    "Observer": [null, null, null, null, null, null, null, null, null, null, null, "24", null, null, "32"]
  },
  "Session 3": {
    "Candidate": ["30", "33", "01", "04", "06", "07", "11", "13", "14", null, "17", "20", "23", "25", "29"],
    "Observer": ["32", null, null, null, null, null, null, null, null, null, null, null, "24", null, null]
  },
  "Session 4": {
    "Candidate": ["29", "32", "33", "01", "04", "06", "07", "11", "13", "14", null, "17", "20", "24", "25"],
    "Observer": [null, "30", null, null, null, null, null, null, null, null, null, null, null, "23", null]
  },
  "Session 5": {
    "Candidate": ["25", "29", "30", "33", "01", "04", "06", "07", "11", "13", "14", null, "17", "20", "23"],
    "Observer": [null, null, "32", null, null, null, null, null, null, null, null, null, null, null, "24"]
  },
  "Session 6": {
    "Candidate": ["23", "25", "29", "30", "33", "01", "04", "06", "07", "11", "13", "14", null, "17", "20"],
    "Observer": ["24", null, null, "32", null, null, null, null, null, null, null, null, null, null, null]
  },
  "Session 7": {
    "Candidate": ["20", "24", "25", "29", "32", "33", "01", "04", "06", "07", "11", "13", "14", null, "17"],
    "Observer": [null, "23", null, null, "30", null, null, null, null, null, null, null, null, null, null]
  },
  "Session 8": {
    "Candidate": ["17", "20", "23", "25", "29", "30", "33", "01", "04", "06", "07", "11", "13", "14", null],
    "Observer": [null, null, "24", null, null, "32", null, null, null, null, null, null, null, null, null]
  },
  "Session 9": {
    "Candidate": [null, "17", "20", "23", "25", "29", "30", "33", "01", "04", "06", "07", "11", "13", "14"],
    "Observer": [null, null, null, "24", null, null, "32", null, null, null, null, null, null, null, null]
  },
  "Session 10": {
    "Candidate": ["14", null, "17", "20", "24", "25", "29", "32", "33", "01", "04", "06", "07", "11", "13"],
    "Observer": [null, null, null, null, "23", null, null, "30", null, null, null, null, null, null, null]
  },
  "Session 11": {
    "Candidate": ["13", "14", null, "17", "20", "23", "25", "29", "30", "33", "01", "04", "06", "07", "11"],
    "Observer": [null, null, null, null, null, "24", null, null, "32", null, null, null, null, null, null]
  },
  "Session 12": {
    "Candidate": ["11", "13", "14", null, "17", "20", "23", "25", "29", "30", "33", "01", "04", "06", "07"],
    "Observer": [null, null, null, null, null, null, "24", null, null, "32", null, null, null, null, null]
  },
  "Session 13": {
    "Candidate": ["07", "11", "13", "14", null, "17", "20", "24", "25", "29", "32", "33", "01", "04", "06"],
    "Observer": [null, null, null, null, null, null, null, "23", null, null, "30", null, null, null, null]
  },
  "Session 14": {
    "Candidate": ["06", "07", "11", "13", "14", null, "17", "20", "23", "25", "29", "30", "33", "01", "04"],
    "Observer": [null, null, null, null, null, null, null, null, "24", null, null, "32", null, null, null]
  },
  "Session 15": {
    "Candidate": ["04", "06", "07", "11", "13", "14", null, "17", "20", "23", "25", "29", "30", "33", "01"],
    "Observer": [null, null, null, null, null, null, null, null, null, "24", null, null, "32", null, null]
  }
};
