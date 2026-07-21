'use strict';
Sahk.register('DebriefTimer', () => {
  const C = Sahk.get('TimerCommon');
  const P = Sahk.get('Constants').PHASE;
  const Audio = Sahk.get('Audio');

  let isCandidateMode = false;
  let lastSearchValue = '';
  let isIsolated = false;
  let ctrl;

  function getSessionLabel(i) {
    if (ENABLE_PREPARATION && i === PREPARATION_SESSION_INDEX) return P.PREPARATION;
    if (ENABLE_CONCLUSION && i === CONCLUSION_SESSION_INDEX) return P.CONCLUSION;
    const baseIdx = i - (ENABLE_PREPARATION ? 1 : 0);
    return `Session ${baseIdx + 1}`;
  }

  function getDataSessionKey() {
    if (ENABLE_PREPARATION && ctrl.selectedSessionIndex === PREPARATION_SESSION_INDEX) return null;
    if (ENABLE_CONCLUSION && ctrl.selectedSessionIndex === CONCLUSION_SESSION_INDEX) return null;
    const baseIdx = ctrl.selectedSessionIndex - (ENABLE_PREPARATION ? 1 : 0);
    return `Session ${baseIdx + 1}`;
  }

  function getSessionExaminers() {
    const sessionKey = getDataSessionKey();
    if (!sessionKey) return [];
    const result = [];
    for (const [scenario, data] of Object.entries(SCENARIOS)) {
      for (const [examiner, group] of Object.entries(data.schedule[sessionKey] || {})) {
        result.push({ scenario, examiner, group });
      }
    }
    return result;
  }

  function highlightBoxes(searchValue) {
    document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
    if (!searchValue) return;
    const search = searchValue.trim();

    if (isCandidateMode) {
      const cmc = document.getElementById('candidateModeContainer');
      if (!cmc) return;
      const cells = cmc.querySelectorAll('.candidate-cell');
      if (cells.length === 0) return;

      cells.forEach(cell => {
        const num = cell.querySelector('.candidate-number')?.textContent.trim();
        if (num === search) { cell.classList.add('highlight'); }
      });
      if (document.querySelectorAll('.highlight').length > 0) return;

      cells.forEach(cell => {
        const grp = cell.querySelector('.candidate-group')?.textContent.trim();
        if (grp === search) { cell.classList.add('highlight'); }
      });
      if (document.querySelectorAll('.highlight').length > 0) return;

      if (C.hasMinAlphabet(search, 4)) {
        cells.forEach(cell => {
          const examiner = cell.querySelector('.candidate-examiner')?.textContent.trim();
          if (examiner && C.wordMatch(examiner, search)) { cell.classList.add('highlight'); }
        });
      }
    } else {
      const emc = document.getElementById('examinerModeContainer');
      if (!emc) return;
      const boxes = emc.querySelectorAll('.viva-box');
      if (boxes.length === 0) return;

      boxes.forEach(box => {
        const candidates = [...box.querySelectorAll('.examiner-group-list span')].map(s => s.textContent.trim());
        if (candidates.some(c => c === search)) { box.classList.add('highlight'); }
      });
      if (document.querySelectorAll('.highlight').length > 0) return;

      boxes.forEach(box => {
        const group = box.querySelector('.examiner-group-label')?.textContent.trim();
        if (group === search) { box.classList.add('highlight'); }
      });
      if (document.querySelectorAll('.highlight').length > 0) return;

      if (C.hasMinAlphabet(search, 4)) {
        boxes.forEach(box => {
          const title = box.querySelector('.viva-title')?.textContent.trim();
          if (title && C.wordMatch(title, search)) { box.classList.add('highlight'); }
        });
      }
    }
  }

  function updateVisibility() {
    C.updateVisibility(isIsolated, '.viva-box', '.candidate-cell');
  }

  function applySearch() {
    try {
      const input = document.getElementById('searchInput');
      if (input) lastSearchValue = input.value.trim();
      highlightBoxes(lastSearchValue);
      updateVisibility();
    } catch (e) { console.warn('DebriefTimer: search error', e); }
  }

  function toggleIsolate() {
    isIsolated = !isIsolated;
    const btn = document.getElementById('isolateBtn');
    if (btn) btn.textContent = isIsolated ? 'Show All' : 'Isolate';
    updateVisibility();
  }

  function renderExaminerMode() {
    const cmc = document.getElementById('candidateModeContainer');
    const emc = document.getElementById('examinerModeContainer');
    if (cmc) cmc.style.display = 'none';
    if (!emc) return;
    emc.style.display = 'flex';
    const entries = getSessionExaminers();
    if (!entries || entries.length === 0) {
      emc.innerHTML = '<p style="text-align:center;color:#666;">No data available.</p>';
      return;
    }
    const grouped = {};
    for (const e of entries) { if (!grouped[e.scenario]) grouped[e.scenario] = []; grouped[e.scenario].push(e); }
    emc.innerHTML = Object.entries(grouped).map(([scenario, examiners]) =>
      `<div class="scenario-column">
        <div class="scenario-header">${scenario}</div>
        ${examiners.map(({examiner, group}) => {
          const candidates = GROUPS[group] || [];
          return `<div class="viva-box" tabindex="0" aria-label="${examiner} - ${group}">
            <div class="viva-title">${examiner}</div>
            <div class="examiner-group-label">${group}</div>
            <div class="examiner-group-list">${candidates.map(c => `<span>${c}</span>`).join('')}</div>
          </div>`;
        }).join('')}
      </div>`
    ).join('');
    highlightBoxes(lastSearchValue);
    updateVisibility();
  }

  function renderCandidateMode() {
    const emc = document.getElementById('examinerModeContainer');
    const cmc = document.getElementById('candidateModeContainer');
    if (emc) emc.style.display = 'none';
    if (!cmc) return;
    cmc.style.display = 'flex';
    const schedule = getSessionExaminers();
    if (!schedule || schedule.length === 0) {
      cmc.innerHTML = '<p style="text-align:center;color:#666;">No data available.</p>';
      return;
    }
    const entries = [];
    for (const {scenario, examiner, group} of schedule) {
      const candidates = GROUPS[group] || [];
      candidates.forEach(c => entries.push({ id: c, group, examiner, scenario }));
    }
    entries.sort((a, b) => a.id.localeCompare(b.id));
    cmc.innerHTML = entries.map(({id, group, examiner, scenario}) =>
      `<div class="candidate-cell" tabindex="0" aria-label="Candidate ${id}">
        <div class="candidate-number">${id}</div>
        <div class="candidate-group">${group}</div>
        <div class="candidate-examiner">${examiner}</div>
        <div class="candidate-scenario">${scenario}</div>
      </div>`
    ).join('');
    highlightBoxes(lastSearchValue);
    updateVisibility();
  }

  function setupTTS(tts) {
    var status = document.getElementById('speechStatus');

    var rateSlider = document.getElementById('ttsRateSlider');
    var rateLabel = document.getElementById('ttsRateLabel');
    if (rateSlider) {
      rateSlider.addEventListener('input', function() {
        var val = parseFloat(this.value);
        tts.setRate(val);
        if (rateLabel) rateLabel.textContent = 'Speed: ' + val.toFixed(1) + 'x';
      });
    }

    var pitchSlider = document.getElementById('ttsPitchSlider');
    var pitchLabel = document.getElementById('ttsPitchLabel');
    if (pitchSlider) {
      pitchSlider.addEventListener('input', function() {
        var val = parseFloat(this.value);
        tts.setPitch(val);
        if (pitchLabel) pitchLabel.textContent = 'Pitch: ' + val.toFixed(1);
      });
    }

    var voiceSel = document.getElementById('voiceSelect');
    function populateVoices() {
      tts.populateVoiceSelect(voiceSel);
      if (status) status.textContent = 'Speech engine ready';
    }

    if (tts.synthSupported) {
      populateVoices();
      if (window.speechSynthesis) {
        window.speechSynthesis.addEventListener('voiceschanged', populateVoices);
      }
    } else {
      if (status) status.textContent = 'Speech synthesis not supported in this browser';
    }

    if (voiceSel) {
      voiceSel.addEventListener('change', function() {
        tts.setVoice(this.value);
        try { localStorage.setItem('sahk_tts_voice_uri', this.value); } catch(e) {}
      });
      var saved = null;
      try { saved = localStorage.getItem('sahk_tts_voice_uri'); } catch(e) {}
      if (saved && saved !== 'auto') {
        tts.setVoice(saved);
        for (var j = 0; j < voiceSel.options.length; j++) {
          if (voiceSel.options[j].value === saved) { voiceSel.value = saved; break; }
        }
      }
    }

    var testBtn = document.getElementById('testSpeechBtn');
    if (testBtn) {
      testBtn.addEventListener('click', function() {
        if (!tts.voicesReady) {
          if (status) status.textContent = 'Speech engine loading... please try again';
          tts.warmupSynth();
          return;
        }
        tts.warmupSynth();
        if (Audio.isMuted) Audio.setMute(false);
        var u = new SpeechSynthesisUtterance('This is a test of the speech synthesis engine.');
        u.rate = parseFloat(rateSlider ? rateSlider.value : 1.0);
        u.pitch = parseFloat(pitchSlider ? pitchSlider.value : 1.0);
        u.volume = Audio.volume;
        var voice = null;
        if (tts.synthSupported && voiceSel && voiceSel.value !== 'auto') {
          var voices = window.speechSynthesis.getVoices();
          for (var vi = 0; vi < voices.length; vi++) {
            if (voices[vi].voiceURI === voiceSel.value) { voice = voices[vi]; break; }
          }
        }
        if (voice) u.voice = voice;
        u.onstart = function() { if (status) status.textContent = 'Playing test speech...'; };
        u.onend = function() { if (status) status.textContent = 'Speech engine ready'; };
        u.onerror = function() { if (status) status.textContent = 'Speech engine ready'; };
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      });
    }
  }

  function start() {
    ctrl = Sahk.get('TimerCore').createController({
      startTimeStr: START_TIME,
      sessionPhases: SESSION_PHASES,
      examTitle: 'SAHK Final Examination Preparation Course - Debriefing',
      getSessionLabel,
      mutedByDefault: true,
      renderContent: () => {
        try {
          if (isCandidateMode) renderCandidateMode();
          else renderExaminerMode();
        } catch (e) { console.warn('DebriefTimer: render error', e); }
      }
    });

    var tts = Sahk.get('ExamTTS');
    tts.init(ctrl, typeof DEBRIEF_SCRIPT_DATA !== 'undefined' ? DEBRIEF_SCRIPT_DATA : []);
    tts.start();

    setupTTS(tts);

    var stopBtn = document.getElementById('stopBtn');
    if (stopBtn) {
      var existing = stopBtn._sahkStopHandler;
      if (existing) stopBtn.removeEventListener('click', existing);
      var handler = function() { tts.reset(); tts.start(); };
      stopBtn._sahkStopHandler = handler;
      stopBtn.addEventListener('click', handler);
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', Sahk.get('Constants').debounce(applySearch, 200));
    const isolateBtn = document.getElementById('isolateBtn');
    if (isolateBtn) isolateBtn.addEventListener('click', toggleIsolate);

    const toggleModeBtn = document.getElementById('toggleModeBtn');
    if (toggleModeBtn) {
      toggleModeBtn.onclick = () => {
        try {
          isCandidateMode = !isCandidateMode;
          toggleModeBtn.textContent = isCandidateMode ? 'Switch to Examiner Mode' : 'Switch to Candidate Mode';
          toggleModeBtn.setAttribute('aria-pressed', isCandidateMode.toString());
          if (isCandidateMode) renderCandidateMode();
          else renderExaminerMode();
          highlightBoxes(lastSearchValue);
          updateVisibility();
        } catch (e) { console.warn('DebriefTimer: toggle error', e); }
      };
    }

    document.body.addEventListener('click', () => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        if (ctx) ctx.close();
      } catch (e) { console.warn('DebriefTimer: audio init error', e); }
    }, { once: true });

    ctrl.init();
  }

  return { start: start, getController: function() { return ctrl; } };
});
window.DebriefTimer = Sahk.get('DebriefTimer');
