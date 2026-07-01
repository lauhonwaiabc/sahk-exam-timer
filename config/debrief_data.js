'use strict';
const GROUPS = {
  "Group 1": ["26005", "26104", "26213"],
  "Group 2": ["26006", "26110", "26216"],
  "Group 3": ["26031", "26111", "26221"],
  "Group 4": ["26022", "26208", "26234"],
  "Group 5": ["26017", "26119", "26224"],
  "Group 6": ["26012", "26129", "26227"],
  "Group 7": ["26014", "26232", "26226"],
  "Group 8": ["26101", "26230", "26223"],
  "Group 9": ["26103", "26207", "26228"]
};

const SCENARIOS = {
  "Scenario A + Q.4": {
    schedule: {
      "Session 1": { "Zion Yeung": "Group 1", "Swan Lau": "Group 4", "Matthew Wong": "Group 7" },
      "Session 2": { "Zion Yeung": "Group 2", "Swan Lau": "Group 5", "Matthew Wong": "Group 8" },
      "Session 3": { "Zion Yeung": "Group 3", "Swan Lau": "Group 6", "Matthew Wong": "Group 9" }
    }
  },
  "Scenario B + Q.8": {
    schedule: {
      "Session 1": { "Irving Teng": "Group 3", "Vicki Li": "Group 6", "Jason Fong": "Group 7" },
      "Session 2": { "Irving Teng": "Group 1", "Vicki Li": "Group 4", "Jason Fong": "Group 8" },
      "Session 3": { "Irving Teng": "Group 2", "Vicki Li": "Group 5", "Jason Fong": "Group 9" }
    }
  },
  "SAQ Q.9-Q.12": {
    schedule: {
      "Session 1": { "Amy Mang": "Group 2", "Zoey Tam": "Group 5", "Adrie Chan": "Group 7" },
      "Session 2": { "Amy Mang": "Group 3", "Zoey Tam": "Group 6", "Adrie Chan": "Group 8" },
      "Session 3": { "Amy Mang": "Group 1", "Zoey Tam": "Group 4", "Adrie Chan": "Group 9" }
    }
  }
};
