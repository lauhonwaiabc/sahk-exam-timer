const SCRIPT_DATA = [
    {
        session: 1, phase: 0, offset: 60,
        time: "08:56",
        sentences: [
            "Good morning, candidates.",
            "You are going to sit the SAHK Final Examination Preparation Course Mock Written Examination, Paper I \u2013 Clinical Scenarios & SAQs.",
            "Put all the stationery you need to use on your desk.",
            "Calculator is not allowed in the examination.",
            "You should now switch off your mobile phone and place it under your chair in a position clearly visible to the invigilators.",
            "If you have notes, pieces of paper, books, put them in your bag.",
            "If you have brought any electronic devices or articles that can emit sound, switch them off now and put them in your bag or under your chair.",
            "Zip up your bag and put it under your chair.",
            "Put up your hand if you have any questions.",
        ]
    },
    {
        session: 1, phase: 0, offset: 120,
        time: "08:57",
        sentences: [
            "Please remain seated.",
            "We will now distribute the question booklet.",
            "Please wait quietly while the papers are being handed out.",
            "Do not turn over your question-answer book and do not start writing until you are told to do so."
        ]
    },
    {
        session: 1, phase: 0, offset: 180,
        time: "08:58",
        sentences: [
            "You should have on your desk ONE question booklet and THREE answer booklets.",
            "Put up your hand if you do not.",
            "After the start of the examination, you should first write your candidate number in the space provided on the front cover of the answer booklets.",
            "You should mark the scenario alphabet on each of the front cover of the answer booklet and mark the corresponding question number on each page of the answer booklet on which you have written any answers.",
            "Start each question on a new page.",
            "Now, read the instruction on the front page of the question booklet.",
            "Do not turn over your question booklet and do not start writing until you are told to do so."
        ]
    },
    {
        session: 1, phase: 0, offset: 240,
        time: "08:59",
        sentences: [
            "Check your question booklet to make sure that there are no missing questions.",
            "There are {{PAPER_I_PAGES}} pages.",
            "The words \u2018End of Paper\u2019 should appear after the last question.",
            "Close the question booklet after checking.",
            "If you find any issues, please raise your hand now.",
        ]
    },
    {
        session: 1, phase: 1, offset: 0,
        time: "09:00",
        sentences: [
            "According to the hall clock, the time now is {{CURRENT}}.",
            "The finishing time is {{FINISH}}.",
            "You may now start.",
            "You have two hours."
        ]
    },
    {
        session: 1, phase: 1, offset: 3600,
        time: "10:30",
        sentences: [
            "You have 30 minutes left.",
            "Make sure you have written your Candidate Number in the designated spaces on the answer booklets.",
            "Make sure you have marked the scenario alphabet on the cover of the answer booklets or supplementary answer sheets, and the appropriate question number on each page; otherwise, the markers may not know which questions you have answered."
        ]
    },
    {
        session: 1, phase: 1, offset: 5100,
        time: "10:55",
        sentences: [
            "You have 5 minutes left.",
            "Make sure you have written your Candidate Number in the designated spaces on the answer booklets.",
            "Make sure you have marked the scenario alphabet on the cover of the answer booklets or supplementary answer sheets, and the appropriate question number on each page.",
            "Cross out all unwanted materials.",
            "You will NOT be allowed to work on your answer booklets or supplementary answer sheets after the \u2018Stop working\u2019 announcement."
        ]
    },
    {
        session: 1, phase: 2, offset: 0,
        time: "11:00",
        sentences: [
            "The time now is {{CURRENT}}.",
            "Time is up.",
            "Stop working.",
            "Put down all your stationery.",
            "Close your question booklet and answer booklets.",
            "Do not pack your personal belongings until you are told to do so.",
            "Your answer booklets will be collected now.",
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
            "You may now pack your personal belongings.",
            "You can take away your question booklet.",
            "You may now leave for break."
        ]
    },
    {
        session: 3, phase: 0, offset: 120,
        time: "11:27",
        sentences: [
            "Good morning, candidates.",
            "You are going to sit the SAHK Final Examination Preparation Course Mock Written Examination, Paper II.",
            "Put all the stationery you need to use on your desk.",
            "Calculator is not allowed in the critical appraisal examination.",
            "You should now switch off your mobile phone and place it under your chair in a position clearly visible to the invigilators.",
            "If you have question paper(s) from the previous examination session(s), notes, pieces of paper, books, put them in your bag.",
            "If you have brought any electronic devices or articles that can emit sound, switch them off now and put them in your bag or under your chair.",
            "Zip up your bag and put it under your chair.",
            "Put up your hand if you have any questions."
        ]
    },
    {
        session: 3, phase: 0, offset: 180,
        time: "11:28",
        sentences: [
            "Please remain seated.",
            "We will now distribute the article for critical appraisal.",
            "Please wait quietly while the papers are being handed out.",
            "Do not turn over your article until you are told to do so."
        ]
    },
    {
        session: 3, phase: 0, offset: 240,
        time: "11:29",
        sentences: [
            "Check your article to make sure that there are no missing questions.",
            "If you find any issues, please raise your hand now.",
            "You should have on your desk ONE article.",
            "Put up your hand if you do not."
        ]
    },
    {
        session: 3, phase: 1, offset: 0,
        time: "11:30",
        sentences: [
            "According to the hall clock, the time is {{CURRENT}}.",
            "You may now start.",
            "You have thirty minutes to read the article."
        ]
    },
    {
        session: 3, phase: 1, offset: 1620,
        time: "11:57",
        sentences: [
            "Please remain seated.",
            "We will now distribute the question-answer book for critical appraisal.",
            "Please wait quietly while the papers are being handed out.",
            "Do not turn over your question-answer book and do not start writing until you are told to do so."
        ]
    },
    {
        session: 3, phase: 1, offset: 1680,
        time: "11:58",
        sentences: [
            "You should have on your desk ONE question-answer book.",
            "After the start of the examination, you should first write your candidate number in the space provided on the front cover of the answer booklets.",
            "Now, read the instruction on the front page of the question-answer book.",
            "Do not turn over your question-answer book and do not start writing until you are told to do so."
        ]
    },
    {
        session: 3, phase: 1, offset: 1740,
        time: "11:59",
        sentences: [
            "Check your question booklet to make sure that there are no missing questions.",
            "There are {{PAPER_CA_PAGES}} pages.",
            "Words \u2018End of Paper\u2019 should appear after the last question.",
            "If you find any issues, please raise your hand now."
        ]
    },
    {
        session: 3, phase: 2, offset: 0,
        time: "12:00",
        sentences: [
            "According to the hall clock, the time is {{CURRENT}}.",
            "The finishing time is {{FINISH}}.",
            "You may now start.",
            "You have ten minutes to answer the critical appraisal paper."
        ]
    },
    {
        session: 3, phase: 3, offset: 0,
        time: "12:10",
        sentences: [
            "The time now is {{CURRENT}}.",
            "Time is up.",
            "Stop working.",
            "The question-answer book will NOT be collected.",
            "Please keep your script for debriefing later.",
            "Please remain seated."
        ]
    },
    {
        session: 3, phase: 3, offset: 420,
        time: "12:17",
        sentences: [
            "Please remain seated.",
            "We will now distribute the question-answer book for investigation.",
            "Please wait quietly while the papers are being handed out.",
            "Do not turn over your question-answer book and do not start writing until you are told to do so."
        ]
    },
    {
        session: 3, phase: 3, offset: 480,
        time: "12:18",
        sentences: [
            "If you intend to use a calculator during the investigation examination, put the calculator on your desk.",
            "Check your calculator now to make sure that no writings or markings have been made on the calculator.",
            "You should have on your desk ONE question-answer book.",
            "After the start of the examination, you should first write your candidate number in the space provided on the front cover of the answer booklets.",
            "Now, read the instruction on the front page of the question-answer book.",
            "Do not turn over your question-answer book and do not start writing until you are told to do so."
        ]
    },
    {
        session: 3, phase: 3, offset: 540,
        time: "12:19",
        sentences: [
            "Check your question booklet to make sure that there are no missing questions.",
            "There are {{PAPER_INV_PAGES}} pages.",
            "Words \u2018End of Paper\u2019 should appear after the last question.",
            "If you find any issues, please raise your hand now."
        ]
    },
    {
        session: 3, phase: 4, offset: 0,
        time: "12:20",
        sentences: [
            "According to the hall clock, the time is {{CURRENT}}.",
            "The finishing time is {{FINISH}}.",
            "You may now start.",
            "You have ten minutes to answer the investigation paper."
        ]
    },
    {
        session: 3, phase: 5, offset: 0,
        time: "12:30",
        sentences: [
            "The time now is {{CURRENT}}.",
            "Time is up.",
            "Stop working.",
            "The question-answer book will NOT be collected.",
            "Please keep your script for debriefing later.",
            "Please remain seated."
        ]
    },
    {
        session: 3, phase: 5, offset: 420,
        time: "12:37",
        sentences: [
            "Please remain seated.",
            "We will now distribute the question-answer book for radiology.",
            "Please wait quietly while the papers are being handed out.",
            "Do not turn over your question-answer book and do not start writing until you are told to do so."
        ]
    },
    {
        session: 3, phase: 5, offset: 480,
        time: "12:38",
        sentences: [
            "Calculator is not allowed in the radiology examination.",
            "You should have on your desk ONE question-answer book.",
            "After the start of the examination, you should first write your candidate number in the space provided on the front cover of the answer booklets.",
            "Now, read the instruction on the front page of the question-answer book.",
            "Do not turn over your question-answer book and do not start writing until you are told to do so."
        ]
    },
    {
        session: 3, phase: 5, offset: 540,
        time: "12:39",
        sentences: [
            "Check your question booklet to make sure that there are no missing questions.",
            "There are {{PAPER_RAD_PAGES}} pages.",
            "Words \u2018End of Paper\u2019 should appear after the last question.",
            "If you find any issues, please raise your hand now."
        ]
    },
    {
        session: 3, phase: 6, offset: 0,
        time: "12:40",
        sentences: [
            "According to the hall clock, the time is {{CURRENT}}.",
            "The finishing time is {{FINISH}}.",
            "You may now start.",
            "You have ten minutes to answer the radiology paper."
        ]
    },
    {
        session: 3, phase: 7, offset: 0,
        time: "12:50",
        sentences: [
            "The time now is {{CURRENT}}.",
            "Time is up.",
            "Stop working.",
            "The question-answer book will NOT be collected.",
            "Please keep your script for debriefing later.",
            "The Paper III examination will be held at {{NEXT_START}}.",
            "Please come back 5 minutes before the start of the examination.",
            "You may now pack your personal belongings.",
            "You can take away your question-answer books.",
            "You may now leave for lunch.",
            "Sponsored lunch of the course is provided by Baxter."
        ]
    },
    {
        session: 5, phase: 0, offset: 60,
        time: "13:56",
        sentences: [
            "Good afternoon, candidates.",
            "You are going to sit the SAHK Final Examination Preparation Course Mock Written Examination, Paper III \u2013 Multiple Choice Question.",
            "Put all the stationery you need to use on your desk.",
            "Calculator is not allowed in the examination.",
            "You should now switch off your mobile phone and place it under your chair in a position clearly visible to the invigilators.",
            "If you have question paper(s) from the previous examination session(s), notes, pieces of paper, books, put them in your bag.",
            "If you have brought any electronic devices or articles that can emit sound, switch them off now and put them in your bag or under your chair.",
            "Zip up your bag and put it under your chair.",
            "Put up your hand if you have any questions.",
        ]
    },
    {
        session: 5, phase: 0, offset: 120,
        time: "13:57",
        sentences: [
            "Please remain seated.",
            "We will now distribute the question booklet.",
            "Please wait quietly while the papers are being handed out.",
            "Do not turn over your question booklet and do not start writing until you are told to do so."
        ]
    },
    {
        session: 5, phase: 0, offset: 180,
        time: "13:58",
        sentences: [
            "You should have on your desk ONE question booklet and ONE MC answer sheet.",
            "Put up your hand if you do not.",
            "You are advised to use a pencil to mark your answers on the MC answer sheet.",
            "Do not fold or puncture the MC answer sheet.",
            "After the start of the examination, you should first write your candidate number in the designated space provided on the MC answer sheet.",
            "Now, read the instruction on the front page of the question booklet.",
            "Do not turn over your question booklet and do not start writing until you are told to do so."
        ]
    },
    {
        session: 5, phase: 0, offset: 240,
        time: "13:59",
        sentences: [
            "Check your question booklet to make sure that there are no missing questions.",
            "There are {{PAPER_MCQ_PAGES}} pages.",
            "The words \u2018End of Paper\u2019 should appear after the last question.",
            "Close the Question Paper after checking.",
            "If you find any issues, please raise your hand now."
        ]
    },
    {
        session: 5, phase: 1, offset: 0,
        time: "14:00",
        sentences: [
            "According to the hall clock, the time is {{CURRENT}}.",
            "The finishing time is {{FINISH}}.",
            "You may now start.",
            "You have two hours and thirty minutes."
        ]
    },
    {
        session: 5, phase: 1, offset: 7200,
        time: "16:00",
        sentences: [
            "You have 30 minutes left.",
            "Make sure you have written your Candidate Number in the designated spaces on the MC answer sheet."
        ]
    },
    {
        session: 5, phase: 1, offset: 8700,
        time: "16:25",
        sentences: [
            "You have 5 minutes left.",
            "Make sure you have written your Candidate Number in the designated spaces on the MC answer sheet.",
            "You will NOT be allowed to work on your MC answer sheet after the \u2018Stop working\u2019 announcement."
        ]
    },
    {
        session: 5, phase: 2, offset: 0,
        time: "16:30",
        sentences: [
            "The time now is {{CURRENT}}.",
            "Time is up.",
            "Stop working.",
            "Put down all your stationery.",
            "Close your question booklet.",
            "Do not pack your personal belongings until you are told to do so.",
            "Your MC answer sheet will be collected now.",
            "Stay in your seat quietly until you are told to leave."
        ]
    },
    {
        session: 5, phase: 2, offset: 60,
        time: "16:32",
        sentences: [
            "All exam papers have been collected.",
            "The debriefing session for Paper 2 Critical Appraisal examination of this subject will be held at {{DEBRIEF_TIME}}.",
            "Please come back on time.",
            "You may now pack your personal belongings.",
            "You can take away your question booklet.",
            "You may now leave for break."
        ]
    }
];
