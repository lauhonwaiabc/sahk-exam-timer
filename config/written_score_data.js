'use strict';

const WRITTEN_QUESTION_GROUPS = {
  "Scenario A + Q.4": ["Q.1", "Q.2", "Q.3", "Q.4"],
  "Scenario B + Q.8": ["Q.5", "Q.6", "Q.7", "Q.8"],
  "SAQ Q.9-Q.12": ["Q.9", "Q.10", "Q.11", "Q.12"]
};

const ALL_QUESTIONS = ["Q.1", "Q.2", "Q.3", "Q.4", "Q.5", "Q.6", "Q.7", "Q.8", "Q.9", "Q.10", "Q.11", "Q.12"];

const WRITTEN_EXAMINERS = {
  "Zion Yeung": { group: "Scenario A + Q.4", candidates: ["26005","26104","26213","26006","26110","26216","26031","26111","26221"] },
  "Swan Lau": { group: "Scenario A + Q.4", candidates: ["26014","26208","26223","26012","26129","26227"] },
  "Matthew Wong": { group: "Scenario A + Q.4", candidates: ["26022","26232","26226","26101","26230","26103","26207","26228"] },
  "Irving Teng": { group: "Scenario B + Q.8", candidates: ["26031","26111","26221","26005","26104","26213","26006","26110","26216"] },
  "Vicki Li": { group: "Scenario B + Q.8", candidates: ["26012","26129","26227","26014","26208","26223"] },
  "Jason Fong": { group: "Scenario B + Q.8", candidates: ["26022","26232","26226","26101","26230","26103","26207","26228"] },
  "Amy Mang": { group: "SAQ Q.9-Q.12", candidates: ["26006","26110","26216","26031","26111","26221","26005","26104","26213"] },
  "Zoey Tam": { group: "SAQ Q.9-Q.12", candidates: ["26014","26208","26223","26012","26129","26227"] },
  "Adrie Chan": { group: "SAQ Q.9-Q.12", candidates: ["26022","26232","26226","26101","26230","26103","26207","26228"] }
};

function getWrittenExaminerNames() {
  return Object.keys(WRITTEN_EXAMINERS).sort();
}

function getWrittenExaminerInfo(name) {
  return WRITTEN_EXAMINERS[name] || null;
}

function getWrittenGroupQuestions(groupName) {
  return WRITTEN_QUESTION_GROUPS[groupName] || [];
}

function getAllWrittenCandidates() {
  var seen = {}, arr = [];
  Object.keys(WRITTEN_EXAMINERS).forEach(function(e) {
    WRITTEN_EXAMINERS[e].candidates.forEach(function(c) {
      if (!seen[c]) { seen[c] = true; arr.push(c); }
    });
  });
  return arr.sort();
}
