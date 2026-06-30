'use strict';
const SCRIPT_DATA = [
    {
        session: 1, phase: 0, offset: 0,
        time: "08:55",
        sentences: [
            "Good morning, candidates.",
            "You are going to sit the SAHK Final Examination Preparation Course Mock Written Examination, Paper I \u2013 Clinical Scenarios & SAQs.",
            "Place your Candidate Slip and identification document on the top right-hand corner of your desk.",
            "Put all the stationery you need to use on your desk. If you have brought a pencil case, put it in your bag or under your chair.",
            "Calculator is not allowed in the examination. If you have a calculator with you, put it in your bag under your chair now.",
            "If you have brought a mobile phone, take out the phone now. Check to see if it has been switched off, including the alarm and scheduled auto-restart functions.",
            "Now place the phone under your chair in a position clearly visible to the invigilators.",
            "If you have notes, pieces of paper, books, or question papers from any previous examination sessions, put them in your bag. If you have brought any electronic devices or articles that can emit sound, switch them off now and put them in your bag or under your chair.",
            "Zip up your bag and put it under your chair. Do not leave your bag in the aisle.",
            "Please note that if you are found to have any unauthorised materials on your desk, on your body or in your clothing after the Question Papers have been distributed, or any electronic devices (including mobile phones) switched on during the examination, you may face a mark penalty or even disqualification from the whole examination.",
            "Put up your hand if you have any questions."
        ]
    },
    {
        session: 1, phase: 0, offset: 120,
        time: "08:57",
        sentences: [
            "Please remain seated.",
            "The Question Booklet will be distributed to you now. Please wait quietly while the papers are being handed out.",
            "Do not turn over your Question Booklet and do not start writing until you are told to do so."
        ]
    },
    {
        session: 1, phase: 0, offset: 180,
        time: "08:58",
        sentences: [
            "You should have on your desk ONE Question Booklet and THREE Answer Booklets. Put up your hand if you do not.",
            "After the start of the examination, you should first write your Candidate Number in the space provided on the front cover of the Answer Booklets. You should copy this information from your Candidate Slip.",
            "You should mark the scenario alphabet on the front cover of each Answer Booklet and mark the corresponding question number on each page of the Answer Booklet on which you have written any answers.",
            "Start each question on a new page.",
            "Now read the Instructions on the front page of the Question Booklet.",
            "Do not turn over your Question Booklet and do not start writing until you are told to do so."
        ]
    },
    {
        session: 1, phase: 0, offset: 240,
        time: "08:59",
        sentences: [
            "Check your Question Booklet to make sure that there are no missing pages.",
            "There are {{PAPER_I_PAGES}} pages.",
            "The words \u2018End of Paper\u2019 should appear after the last question.",
            "Close the Question Booklet after checking.",
            "If you find any issues, please raise your hand now.",
            "Before the examination begins, make sure that you have switched off your mobile phone, including the alarm and auto-restart functions, and that you do not have any electronic devices on your body. "
        ]
    },
    {
        session: 1, phase: 1, offset: 0,
        time: "09:00",
        sentences: [
            "According to the clock in the hall, the time now is {{CURRENT}}.",
            "The finishing time is {{FINISH}}.",
            "You may now start.",
            "You have two hours."
        ]
    },
    {
        session: 1, phase: 1, offset: 5400,
        time: "10:30",
        sentences: [
            "You have 30 minutes left. You are not allowed to leave the examination hall until you are told to do so.",
            "Make sure you have written your Candidate Number in the designated spaces on the Answer Booklets.",
            "Make sure you have marked the scenario alphabet on the cover of the Answer Booklets or supplementary answer sheets, and the appropriate question number on each page; otherwise, the markers may not know which questions you have answered."
        ]
    },
    {
        session: 1, phase: 1, offset: 6900,
        time: "10:55",
        sentences: [
            "You have 5 minutes left.",
            "Make sure you have written your Candidate Number in the designated spaces on the Answer Booklets.",
            "Make sure you have marked the scenario alphabet on the cover of the Answer Booklets or supplementary answer sheets, and the appropriate question number on each page.",
            "Cross out all unwanted materials.",
            "You will NOT be allowed to work on your Answer Booklets or supplementary answer sheets after the \u2018Stop working\u2019 announcement."
        ]
    },
    {
        session: 1, phase: 2, offset: 0,
        time: "11:00",
        sentences: [
            "The time now is {{CURRENT}}.",
            "Time is up. Stop working.",
            "Put down all your stationery.",
            "Do not pack your personal belongings until you are told to do so.",
            "Close your Question Booklet and Answer Booklets.",
            "You must not work on your answers now, otherwise you may face a mark penalty.",
            "Your Answer Booklets will be collected now.",
            "Stay in your seat quietly until you are told to leave."
        ]
    },
    {
        session: 1, phase: 2, offset: 120,
        time: "11:02",
        sentences: [
            "All exam papers have been collected.",
            "The Paper II examination will be held at {{NEXT_START}}.",
            "Please come back 5 minutes before the start of the examination.",
            "Now make sure you have your Candidate Slip, identification document and other personal belongings.",
            "You can take away the Question Booklet.",
            "You may now leave for break."
        ]
    },
    {
        session: 3, phase: 0, offset: 0,
        time: "11:25",
        sentences: [
            "Good morning, candidates.",
            "You are going to sit the SAHK Final Examination Preparation Course Mock Written Examination, Paper II \u2013 Critical Appraisal, Investigation & Radiology.",
            "Place your Candidate Slip and identification document on the top right-hand corner of your desk.",
            "Put all the stationery you need to use on your desk. If you have brought a pencil case, put it in your bag or under your chair.",
            "Calculator is not allowed in the Critical Appraisal examination. If you have a calculator with you, put it in your bag under your chair now.",
            "If you have brought a mobile phone, take out the phone now. Check to see if it has been switched off, including the alarm and scheduled auto-restart functions.",
            "Now place the phone under your chair in a position clearly visible to the invigilators.",
            "If you have question paper(s) from the previous examination session(s), notes, pieces of paper, books, put them in your bag. If you have brought any electronic devices or articles that can emit sound, switch them off now and put them in your bag or under your chair.",
            "Zip up your bag and put it under your chair. Do not leave your bag in the aisle.",
            "Please note that if you are found to have any unauthorised materials on your desk, on your body or in your clothing after the Question Papers have been distributed, or any electronic devices (including mobile phones) switched on during the examination, you may face a mark penalty or even disqualification from the whole examination.",
            "Put up your hand if you have any questions."
        ]
    },
    {
        session: 3, phase: 0, offset: 120,
        time: "11:27",
        sentences: [
            "Please remain seated.",
            "The Article for Critical Appraisal will be distributed to you now. Please wait quietly while the papers are being handed out.",
            "Do not turn over your Article and do not start reading until you are told to do so."
        ]
    },
    {
        session: 3, phase: 0, offset: 180,
        time: "11:28",
        sentences: [
            "You should have on your desk ONE Article. Put up your hand if you do not.",
            "Do not turn over your Article and do not start writing until you are told to do so."
        ]
    },
    {
        session: 3, phase: 0, offset: 240,
        time: "11:29",
        sentences: [
            "Check your Article to make sure that there are no missing pages. If you find any issues, please raise your hand now.",
            "Before the examination begins, make sure that you have switched off your mobile phone, including the alarm and auto-restart functions, and that you do not have any electronic devices on your body. "
        ]
    },
    {
        session: 3, phase: 1, offset: 0,
        time: "11:30",
        sentences: [
            "According to the clock in the hall, the time now is {{CURRENT}}.",
            "You may now start.",
            "You have thirty minutes to read the Article."
        ]
    },
    {
        session: 3, phase: 1, offset: 1620,
        time: "11:57",
        sentences: [
            "Please remain seated.",
            "The Question-Answer Book for Critical Appraisal will be distributed to you now. Please wait quietly while the papers are being handed out.",
            "Do not turn over your Question-Answer Book and do not start writing until you are told to do so."
        ]
    },
    {
        session: 3, phase: 1, offset: 1680,
        time: "11:58",
        sentences: [
            "You should have on your desk ONE Question-Answer Book. Put up your hand if you do not.",
            "After the start of the examination, you should first write your Candidate Number in the space provided on the front cover of the Answer Booklet. You should copy this information from your Candidate Slip.",
            "Now read the Instructions on the front page of the Question-Answer Book.",
            "Do not turn over your Question-Answer Book and do not start writing until you are told to do so."
        ]
    },
    {
        session: 3, phase: 1, offset: 1740,
        time: "11:59",
        sentences: [
            "Check your Question-Answer Book to make sure that there are no missing pages.",
            "There are {{PAPER_CA_PAGES}} pages.",
            "The words \u2018End of Paper\u2019 should appear after the last question.",
            "If you find any issues, please raise your hand now.",
            "Before the examination begins, make sure that you have switched off your mobile phone, including the alarm and auto-restart functions, and that you do not have any electronic devices on your body."
        ]
    },
    {
        session: 3, phase: 2, offset: 0,
        time: "12:00",
        sentences: [
            "According to the clock in the hall, the time now is {{CURRENT}}.",
            "The finishing time is {{FINISH}}.",
            "You may now start.",
            "You have ten minutes to answer the Critical Appraisal paper."
        ]
    },
    {
        session: 3, phase: 3, offset: 0,
        time: "12:10",
        sentences: [
            "The time now is {{CURRENT}}.",
            "Time is up. Stop working.",
            "Put down all your stationery.",
            "Do not pack your personal belongings until you are told to do so.",
            "Close your Question-Answer Book.",
            "You must not work on your answers now, otherwise you may face a mark penalty.",
            "The Question-Answer Book will NOT be collected. Please keep your script for the debriefing session later.",
            "Please remain seated."
        ]
    },
    {
        session: 3, phase: 3, offset: 420,
        time: "12:17",
        sentences: [
            "Please remain seated.",
            "The Question-Answer Book for Investigation will be distributed to you now. Please wait quietly while the papers are being handed out.",
            "Do not turn over your Question-Answer Book and do not start writing until you are told to do so."
        ]
    },
    {
        session: 3, phase: 3, offset: 480,
        time: "12:18",
        sentences: [
            "If you intend to use a calculator during the Investigation examination, put the calculator on your desk now.",
            "Check your calculator now to make sure that no writings or markings have been made on the calculator. Remove the calculator cover and put it under your chair.",
            "You should have on your desk ONE Question-Answer Book. Put up your hand if you do not.",
            "After the start of the examination, you should first write your Candidate Number in the space provided on the front cover of the Answer Booklet. You should copy this information from your Candidate Slip.",
            "Now read the Instructions on the front page of the Question-Answer Book.",
            "Do not turn over your Question-Answer Book and do not start writing until you are told to do so."
        ]
    },
    {
        session: 3, phase: 3, offset: 540,
        time: "12:19",
        sentences: [
            "Check your Question-Answer Book to make sure that there are no missing pages.",
            "There are {{PAPER_INV_PAGES}} pages.",
            "The words \u2018End of Paper\u2019 should appear after the last question.",
            "If you find any issues, please raise your hand now.",
            "Before the examination begins, make sure that you have switched off your mobile phone, including the alarm and auto-restart functions, and that you do not have any electronic devices on your body."
        ]
    },
    {
        session: 3, phase: 4, offset: 0,
        time: "12:20",
        sentences: [
            "According to the clock in the hall, the time now is {{CURRENT}}.",
            "The finishing time is {{FINISH}}.",
            "You may now start.",
            "You have ten minutes to answer the Investigation paper."
        ]
    },
    {
        session: 3, phase: 5, offset: 0,
        time: "12:30",
        sentences: [
            "The time now is {{CURRENT}}.",
            "Time is up. Stop working.",
            "Put down all your stationery.",
            "Do not pack your personal belongings until you are told to do so.",
            "Close your Question-Answer Book.",
            "You must not work on your answers now, otherwise you may face a mark penalty.",
            "The Question-Answer Book will NOT be collected. Please keep your script for the debriefing session later.",
            "Please remain seated."
        ]
    },
    {
        session: 3, phase: 5, offset: 420,
        time: "12:37",
        sentences: [
            "Please remain seated.",
            "The Question-Answer Book for Radiology will be distributed to you now. Please wait quietly while the papers are being handed out.",
            "Do not turn over your Question-Answer Book and do not start writing until you are told to do so."
        ]
    },
    {
        session: 3, phase: 5, offset: 480,
        time: "12:38",
        sentences: [
            "Calculator is not allowed in the Radiology examination. If you have a calculator with you, put it in your bag under your chair now.",
            "You should have on your desk ONE Question-Answer Book. Put up your hand if you do not.",
            "After the start of the examination, you should first write your Candidate Number in the space provided on the front cover of the Answer Booklet. You should copy this information from your Candidate Slip.",
            "Now read the Instructions on the front page of the Question-Answer Book.",
            "Do not turn over your Question-Answer Book and do not start writing until you are told to do so."
        ]
    },
    {
        session: 3, phase: 5, offset: 540,
        time: "12:39",
        sentences: [
            "Check your Question-Answer Book to make sure that there are no missing pages.",
            "There are {{PAPER_RAD_PAGES}} pages.",
            "The words \u2018End of Paper\u2019 should appear after the last question.",
            "If you find any issues, please raise your hand now.",
            "Before the examination begins, make sure that you have switched off your mobile phone, including the alarm and auto-restart functions, and that you do not have any electronic devices on your body. "
        ]
    },
    {
        session: 3, phase: 6, offset: 0,
        time: "12:40",
        sentences: [
            "According to the clock in the hall, the time now is {{CURRENT}}.",
            "The finishing time is {{FINISH}}.",
            "You may now start.",
            "You have ten minutes to answer the Radiology paper."
        ]
    },
    {
        session: 3, phase: 7, offset: 0,
        time: "12:50",
        sentences: [
            "The time now is {{CURRENT}}.",
            "Time is up. Stop working.",
            "Put down all your stationery.",
            "Close your Question-Answer Book.",
            "You must not work on your answers now, otherwise you may face a mark penalty.",
            "The Question-Answer Book will NOT be collected. Please keep your script for the debriefing session later.",
            "The Paper III examination will be held at {{NEXT_START}}.",
            "Please come back 5 minutes before the start of the examination.",
            "Now make sure you have your Candidate Slip, identification document and other personal belongings.",
            "You may now pack your personal belongings.",
            "You can take away your Question-Answer Books.",
            "You may now leave for lunch. Sponsored lunch of the course is provided by Baxter."
        ]
    },
    {
        session: 5, phase: 0, offset: 0,
        time: "13:55",
        sentences: [
            "Good afternoon, candidates.",
            "You are going to sit the SAHK Final Examination Preparation Course Mock Written Examination, Paper III \u2013 Multiple Choice Questions.",
            "Place your Candidate Slip and identification document on the top right-hand corner of your desk.",
            "Put all the stationery you need to use on your desk. If you have brought a pencil case, put it in your bag or under your chair.",
            "Calculator is not allowed in the examination. If you have a calculator with you, put it in your bag under your chair now.",
            "If you have brought a mobile phone, take out the phone now. Check to see if it has been switched off, including the alarm and scheduled auto-restart functions.",
            "Now place the phone under your chair in a position clearly visible to the invigilators.",
            "If you have question paper(s) from the previous examination session(s), notes, pieces of paper, books, put them in your bag. If you have brought any electronic devices or articles that can emit sound, switch them off now and put them in your bag or under your chair.",
            "Zip up your bag and put it under your chair. Do not leave your bag in the aisle.",
            "Please note that if you are found to have any unauthorised materials on your desk, on your body or in your clothing after the Question Papers have been distributed, or any electronic devices (including mobile phones) switched on during the examination, you may face a mark penalty or even disqualification from the whole examination.",
            "Put up your hand if you have any questions."
        ]
    },
    {
        session: 5, phase: 0, offset: 120,
        time: "13:57",
        sentences: [
            "Please remain seated.",
            "The Question Booklet and MC Answer Sheet will be distributed to you now. Please wait quietly while the papers are being handed out.",
            "Do not turn over your Question Booklet and do not start writing until you are told to do so."
        ]
    },
    {
        session: 5, phase: 0, offset: 180,
        time: "13:58",
        sentences: [
            "You should have on your desk ONE Question Booklet and ONE MC Answer Sheet. Put up your hand if you do not.",
            "You are advised to use a pencil to mark your answers on the MC Answer Sheet.",
            "Do NOT fold or puncture the MC Answer Sheet.",
            "After the start of the examination, you should first write your Candidate Number in the designated space provided on the MC Answer Sheet. You should copy this information from your Candidate Slip.",
            "Now read the Instructions on the front page of the Question Booklet.",
            "Do not turn over your Question Booklet and do not start writing until you are told to do so."
        ]
    },
    {
        session: 5, phase: 0, offset: 240,
        time: "13:59",
        sentences: [
            "Check your Question Booklet to make sure that there are no missing pages.",
            "There are {{PAPER_MCQ_PAGES}} pages.",
            "The words \u2018End of Paper\u2019 should appear after the last question.",
            "Close the Question Booklet after checking.",
            "If you find any issues, please raise your hand now.",
            "Before the examination begins, make sure that you have switched off your mobile phone, including the alarm and auto-restart functions, and that you do not have any electronic devices on your body."
        ]
    },
    {
        session: 5, phase: 1, offset: 0,
        time: "14:00",
        sentences: [
            "According to the clock in the hall, the time now is {{CURRENT}}.",
            "The finishing time is {{FINISH}}.",
            "You may now start.",
            "You have two hours and thirty minutes."
        ]
    },
    {
        session: 5, phase: 1, offset: 7200,
        time: "16:00",
        sentences: [
            "You have 30 minutes left. You are not allowed to leave the examination hall until you are told to do so.",
            "Make sure you have written your Candidate Number in the designated space on the MC Answer Sheet."
        ]
    },
    {
        session: 5, phase: 1, offset: 8700,
        time: "16:25",
        sentences: [
            "You have 5 minutes left.",
            "Make sure you have written your Candidate Number in the designated space on the MC Answer Sheet.",
            "You will NOT be allowed to work on your MC Answer Sheet after the \u2018Stop working\u2019 announcement."
        ]
    },
    {
        session: 5, phase: 2, offset: 0,
        time: "16:30",
        sentences: [
            "The time now is {{CURRENT}}.",
            "Time is up. Stop working.",
            "Put down all your stationery.",
            "Do not pack your personal belongings until you are told to do so.",
            "Close your Question Booklet.",
            "You must not work on your MC Answer Sheet now, otherwise you may face a mark penalty.",
            "Your MC Answer Sheet will be collected now.",
            "Stay in your seat quietly until you are told to leave."
        ]
    },
    {
        session: 5, phase: 2, offset: 60,
        time: "16:32",
        sentences: [
            "All exam papers have been collected.",
            "The Debriefing session for the Paper II Critical Appraisal examination will be held at {{DEBRIEF_TIME}}.",
            "Please come back on time.",
            "Now make sure you have your Candidate Slip, identification document and other personal belongings.",
            "You can take away the Question Booklet.",
            "You may now leave for break."
        ]
    }
];
