# SAHK Exam Timer

A web-based countdown timer and real-time scoring system for administering mock medical examinations (Written, OSCE, and Viva formats). Built for the SAHK Final Examination Preparation Course.

## Features

- **Phased countdown timers** — automatic phase-to-phase progression with schedule-start that auto-detects the current exam phase based on wall-clock time
- **Written Exam Timer** — full-day timetable (Papers I, II, III) with automated Text-to-Speech invigilator script announcements at precise offsets within each phase
- **OSCE Timer** — 15-station rotation tracking with Transit/Exam phases, rest station highlighting, and candidate/observer assignment cards
- **Viva Timer** — 10-table oral exam with Transit/Exam/Debriefing phases and examiner assignment display
- **Debriefing Timer** — post-exam session management across scenarios, groups, and examiners
- **Real-time scoring** — 2–8 scale inline scoring on station/table cards, full scoring matrix view, batch submit, and CSV export
- **Role-based access** — separate views for Administrators, Examiners, Candidates, and Timekeepers
- **Voice-selection TTS** — choose from all installed English system voices for script announcements
- **NTP time sync** — synchronised countdown via timeapi.io (Asia/Hong_Kong timezone)
- **Keyboard shortcuts** — Space (Start/Pause), Escape (Stop), M (Mute), ? (Help)
- **Per-phase time display** — shows the exact start–end time of the current phase, not just the session range
- **Accessible** — screen-reader announcements at key remaining-time milestones

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

## Project Structure

```
sahk-exam-timer/
├── index.htm                     # Main navigation hub
├── timer_style.css               # Master CSS import
├── timer/
│   ├── Written_timer.htm         # Written exam countdown + TTS
│   ├── Written_score_login.htm   # Written score login
│   ├── Written_score.htm         # Written scoring grid
│   ├── OSCE_timer.htm            # OSCE timer (?mode=am|pm)
│   ├── Viva_timer.htm            # Viva timer (?mode=am|pm)
│   ├── Viva_OSCE_login.htm       # OSCE/Viva login (role-based)
│   └── Debrief_timer.htm         # Debriefing session timer
├── config/
│   ├── sahk.js                   # Module registry
│   ├── constants.js              # Phase enums, score scale, colors
│   ├── timer-core.js             # Core countdown timer engine
│   ├── phase-engine.js           # Phase scheduling calculations
│   ├── time-utils.js             # Time formatting/parsing
│   ├── time-sync.js              # NTP sync via timeapi.io
│   ├── audio.js                  # Web Audio beep generator
│   ├── firebase-config.js        # Firebase project configuration
│   ├── firebase-auth.js          # Role-based auth wrapper
│   ├── generic_timer.js          # OSCE/Viva station display engine
│   ├── common_timer.js           # Shared station/search utilities
│   ├── scoring.js                # Score REST API client
│   ├── scoring-ui.js             # Role-based scoring views
│   ├── scoring-matrix.js         # Full scoring grid renderer
│   ├── scoring-inline.js         # Inline card scoring widgets
│   ├── error-handler.js          # Error reporting
│   ├── osce_timer.js             # OSCE timer setup
│   ├── osce_config.js            # OSCE phase/timing config
│   ├── osce_stations.js          # Station names
│   ├── osce_data_am.js           # OSCE AM candidate/observer data
│   ├── osce_data_pm.js           # OSCE PM candidate/observer data
│   ├── viva_timer.js             # Viva timer setup
│   ├── viva_config.js            # Viva phase/timing config
│   ├── viva_tables.js            # Table/examiner names
│   ├── viva_data_am.js           # Viva AM candidate data
│   ├── viva_data_pm.js           # Viva PM candidate data
│   ├── sahk_written.js           # Written exam timer + TTS
│   ├── written_config.js         # Written exam phases + timetable
│   ├── written_script.js         # Invigilator announcement scripts
│   ├── written_score_data.js     # Written question groups + examiners
│   ├── debrief_timer.js          # Debriefing display engine
│   ├── debrief_config.js         # Debriefing phase config
│   └── debrief_data.js           # Debriefing groups/scenarios
├── css/
│   ├── base.css                  # Theme variables, layout, controls
│   ├── timer.css                 # Timer display, cards, responsive
│   ├── scoring.css               # Scoring panel, matrix, admin
│   └── login.css                 # Login page styling
├── backend/
│   ├── server.js                 # Local Express API (dev)
│   ├── migrate_to_firestore.js   # JSON-to-Firestore migration
│   └── package.json
├── functions/
│   ├── index.js                  # Firebase Cloud Function (Express API)
│   └── package.json
├── test/
│   └── timer-core.test.htm       # 22 unit tests for TimerCore
├── firebase.json                 # Firebase deploy config
├── firestore.rules               # Firestore security rules
└── firestore.indexes.json        # Firestore indexes
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
cd sahk-exam-timer

# Install backend dependencies
cd backend && npm install
cd ..

# Start the local API server
node backend/server.js

# Serve the frontend (any HTTP server works)
npx serve .
# or: python -m http.server 8080
```

Open `http://localhost:8080/index.htm` in your browser.

### Firebase Deployment

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and deploy
firebase login
firebase deploy
```

## Usage

### Roles & Login

| Role | Email Format | Purpose |
|------|-------------|---------|
| Admin | `admin@sahk-timer.auth` | Full scoring matrix, CSV export, all timers |
| Examiner | `examiner@sahk-timer.auth` | View assigned station, enter scores |
| Candidate | No login required | View own station assignment |

For OSCE/Viva, candidates can also use candidate number `00` for the Timekeeper overview.

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

## Documentation

See `timer_user_guide.docx` for the full user manual covering all roles, workflows, troubleshooting, and FAQ.

## License

[Specify license here]
