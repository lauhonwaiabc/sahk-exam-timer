# SAHK Exam Timer

A web-based countdown timer and real-time scoring system for administering mock medical examinations (Written, OSCE, Viva, and Debriefing formats). Built for the SAHK Final Examination Preparation Course.

## Features

- **Phased countdown timers** — automatic phase-to-phase progression with schedule-start that auto-detects the current exam phase based on wall-clock time
- **Written Exam Timer** — full-day timetable (Papers I, II, III) with automated Text-to-Speech invigilator script announcements at precise offsets within each phase
- **OSCE Timer** — 15-station rotation tracking with Transit/Exam/Preparation phases, rest station highlighting, and candidate/observer assignment cards (`?mode=am|pm`)
- **Viva Timer** — 10-table oral exam with Transit/Exam/Debriefing phases and examiner/candidate display (`?mode=am|pm`)
- **Debriefing Timer** — post-exam session management across scenarios, groups, and examiners
- **Real-time scoring** — 2–8 scale inline scoring on station/table cards, full scoring matrix view, batch submit, admin CSV export
- **MCQ Report Generation** — upload Paper III XLS, review/edit answers, compute per-candidate scores with KR-20 statistics, export all reports as a single `.docx`
- **Exam Data Generator** — interactive configuration tool for generating Viva, OSCE, Debriefing, Written, and Candidate Mapping data files (incl. constraint-based candidate rotation)
- **Role-based access** — separate views for Administrators, Examiners, Candidates, and Timekeepers
- **Voice-selection TTS** — choose from all installed English system voices for script announcements
- **NTP time sync** — synchronised countdown via timeapi.io (Asia/Hong_Kong timezone)
- **Keyboard shortcuts** — Space (Start/Pause), Escape (Stop), M (Mute), ? (Help)
- **Screen-reader milestones** — accessibility announcements at key remaining-time points

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JS (ES5), HTML, CSS |
| Module system | Custom registry (`Sahk.register` / `Sahk.get`) |
| Backend | Firebase Cloud Functions (Express.js) |
| Database | Firebase Firestore |
| Auth | Firebase Authentication (role-based) |
| TTS | Browser Speech Synthesis API |
| Audio | Web Audio API (programmatic beep generation) |
| Time sync | timeapi.io NTP |
| Report export | JSZip + OOXML (`.docx`), SheetJS (XLS parsing), Canvas (histograms) |

## Project Structure

```
sahk-exam-timer-main/
├── index.htm                         # Main navigation hub
├── generator.html                    # Exam data generator tool
├── timer_style.css                   # Master CSS (@imports all sub-CSS)
├── firebase.json                     # Firebase deploy config
├── firestore.rules                   # Firestore security rules
├── firestore.indexes.json            # Firestore composite indexes
│
├── timer/                            # HTML page views
│   ├── Written_timer.htm             Written exam countdown + TTS
│   ├── Written_score_login.htm       Written score login
│   ├── Written_score.htm             Written scoring matrix
│   ├── OSCE_timer.htm                OSCE timer (?mode=am|pm)
│   ├── Viva_timer.htm                Viva timer (?mode=am|pm)
│   ├── Viva_OSCE_login.htm           Shared OSCE/Viva login
│   ├── Debrief_timer.htm             Debriefing session timer
│   └── mcq_report.htm                MCQ report generator (Paper III)
│
├── css/                              # Stylesheets
│   ├── base.css                      Theme variables, layout, clock, controls
│   ├── timer.css                     Timer display, station/table cards, responsive
│   ├── scoring.css                   Scoring panels, matrix, admin panel
│   └── login.css                     Login container, form controls, error animation
│
├── config/                           # JavaScript modules
│   │
│   │  # Core infrastructure
│   ├── sahk.js                       Custom module registry
│   ├── constants.js                  Phase enums, score scale/colors
│   ├── error-handler.js              Error reporting and safe wrappers
│   │
│   │  # Time & sync
│   ├── time-utils.js                 Time parsing, formatting, arithmetic
│   ├── time-sync.js                  NTP sync via timeapi.io (Asia/Hong_Kong)
│   ├── phase-engine.js               Phase scheduling and start-time calculation
│   ├── timer-core.js                 Core countdown engine with phase nav, keyboard shortcuts
│   │
│   │  # Audio
│   ├── audio.js                      Web Audio beep generator (1kHz square wave)
│   ├── exam_tts.js                   TTS engine via Speech Synthesis API, script scheduling
│   │
│   │  # Auth
│   ├── firebase-config.js            Firebase project credentials
│   ├── firebase-auth.js              Firebase Auth wrapper, email-based role mapping
│   │
│   │  # Scoring
│   ├── scoring.js                    Firestore REST API client (CRUD, batch, admin CSV)
│   ├── scoring_ui.js                 Scoring UI orchestrator (role config, mode switching)
│   ├── scoring-matrix.js             Full-screen scoring grid renderer
│   ├── scoring-inline.js             Inline scoring widgets on station/table cards
│   │
│   │  # Generic timer (OSCE/Viva shared)
│   ├── common_timer.js               Session labeling, data key lookup, search/isolate
│   ├── generic_timer.js              Station/table display engine (item mode + candidate mode)
│   │
│   │  # Written Exam
│   ├── written_config.js             Phase definitions, timings, page counts
│   ├── written_script.js             Invigilator announcement script (70+ entries)
│   ├── written_score_data.js         Question groups, examiner assignments, candidate lists
│   ├── sahk_written.js               WrittenTimer orchestrator (TimerCore + TTS + script)
│   │
│   │  # OSCE
│   ├── osce_config.js                Phase definitions (15 stations, AM/PM timings)
│   ├── osce_stations.js              Station names (Procedure 1, Anatomy, Rest, ...)
│   ├── osce_data_am.js               AM candidate/observer assignments
│   ├── osce_data_pm.js               PM candidate/observer assignments
│   ├── osce_script.js                TTS script entries
│   ├── osce_timer.js                 OsceTimer module
│   │
│   │  # Viva
│   ├── viva_config.js                Phase definitions (10 tables, AM/PM timings)
│   ├── viva_tables.js                Examiner names per table (AM + PM)
│   ├── viva_data_am.js               AM candidate assignments
│   ├── viva_data_pm.js               PM candidate assignments
│   ├── viva_script.js                TTS script entries with warnings
│   ├── viva_timer.js                 VivaTimer module
│   │
│   │  # Debriefing
│   ├── debrief_config.js             Phase definitions (preparation + 3 sessions)
│   ├── debrief_data.js               Candidate groups, scenarios, examiner scheduling
│   ├── debrief_script.js             TTS script entries
│   ├── debrief_timer.js              DebriefTimer module
│   │
│   │  # Reports & data
│   ├── report_generator.js           .docx report generator (OOXML + JSZip + Canvas)
│   └── candidate_mapping_data.js     Candidate ID → name mapping (35 candidates)
│
├── test/
│   └── timer-core.test.htm           22 unit tests for TimerCore
```

## Getting Started

### Prerequisites

- A modern browser (Chrome, Edge, or Firefox)
- Node.js 18+ (for local backend and Firebase deployment)
- Firebase project with Firestore and Authentication enabled

### Local Development

```bash
# Clone the repository
git clone <repo-url>
cd sahk-exam-timer-main

# Serve the frontend (any HTTP server works)
npx serve .
# or: python -m http.server 8080
```

Open `http://localhost:8080/index.htm` in your browser.

**Note:** Scoring features require the Firebase backend. See `functions/` for the Cloud Function API. The timer and TTS features work offline without the backend.

### Firebase Deployment

```bash
npm install -g firebase-tools
firebase login
firebase deploy
```

## Usage

### Pages

| Page | Path | Purpose |
|------|------|---------|
| Main Menu | `index.htm` | Navigation hub to all timers and tools |
| Written Timer | `timer/Written_timer.htm` | Full Written exam countdown with TTS invigilator scripts |
| Written Score Login | `timer/Written_score_login.htm` | Login for Written scoring |
| Written Score | `timer/Written_score.htm` | Full scoring matrix for Paper I |
| OSCE Timer | `timer/OSCE_timer.htm?mode=am|pm` | OSCE 15-station timer |
| Viva Timer | `timer/Viva_timer.htm?mode=am|pm` | Viva 10-table timer |
| OSCE/Viva Login | `timer/Viva_OSCE_login.htm` | Role-based login for OSCE/Viva |
| Debriefing Timer | `timer/Debrief_timer.htm` | Post-exam debriefing session |
| MCQ Report | `timer/mcq_report.htm` | Paper III MCQ analysis and .docx export |
| Data Generator | `generator.html` | Interactive exam data file generator |

### Timer Controls

| Key/Button | Action |
|-----------|--------|
| Space | Start / Pause |
| Escape | Stop & Reset |
| M | Mute / Unmute |
| ? | Show shortcuts |
| Schedule Start | Auto-detect phase from real clock |
| +1m / +5m / +15m / +60m | Shift start time forward |
| –1m / –5m / –15m / –60m | Shift start time backward |

### Score Scale

| Score | Label | Color |
|-------|-------|-------|
| – | No score | Black |
| 2 | Poor | Red |
| 3 | Below Average | Orange |
| 4 | Average | Yellow |
| 5 | Good | Green |
| 6 | Very Good | Blue |
| 7 | Excellent | Indigo |
| 8 | Outstanding | Purple |

## Firestore Data Model

### `scores` collection
```json
{
  "exam": "osce_am | osce_pm | viva_am | viva_pm | written",
  "timestamp": "ISO-8601",
  "identifier": "Station 5 | Table 3 | admin",
  "candidate": "26005",
  "station": 5,
  "score": "- | 2-8"
}
```

### `users` collection
```json
{
  "role": "admin | examiner",
  "uid": "Firebase Auth UID"
}
```
