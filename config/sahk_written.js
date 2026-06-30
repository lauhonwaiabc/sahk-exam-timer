'use strict';
Sahk.register('WrittenTimer', function() {
  var TC = Sahk.get('TimerCore');
  var TU = Sahk.get('TimeUtils');
  var Audio = Sahk.get('Audio');

  var _ctrl, _isTimetableVisible;
  var _startTimeStr, _sessionTitles, _examTitle, _timetable;
  var _paperPages;
  var _scriptData, _scriptOffsets, _processedGroups;
  var _currentScriptGroup, _scriptSentenceIndex;
  var _advanceTimer, _clearTimeout, _speechGen;
  var _synth, _synthSupported, _voicesReady;
  var _ttsRate = 1.0;
  var _ttsPitch = 1.0;
  var _ttsVoiceMode = 'auto';
  var _activeUtterance = null;

  function isMuted() { return Audio.isMuted; }

  function getSessionLabel(i) {
    return _sessionTitles[i] || ('Session ' + (i + 1));
  }

  function isExamPhase(sessionIdx, phaseIdx) {
    var st = _sessionTitles[sessionIdx] || '';
    var pt = SESSION_PHASES[sessionIdx][phaseIdx].title;
    if (/Pre-Examination|Break|Lunch/i.test(st)) return false;
    if (/Paper Collection|Transition|Preparation/i.test(pt)) return false;
    return true;
  }

  function getEnglishVoice() {
    if (!_synthSupported) return null;
    var voices = _synth.getVoices();
    if (!voices || !voices.length) return null;
    var candidates = [];
    for (var i = 0; i < voices.length; i++) {
      if (voices[i].lang && voices[i].lang.startsWith('en') && !/chinese|cantonese|hong.?kong/i.test(voices[i].name))
        candidates.push(voices[i]);
    }
    if (!candidates.length) {
      for (var i = 0; i < voices.length; i++) {
        if (voices[i].lang && voices[i].lang.startsWith('en')) candidates.push(voices[i]);
      }
    }
    if (!candidates.length) return voices[0];
    if (_ttsVoiceMode === 'male') {
      var male = candidates.filter(function(v) {
        return /male|guy|man\b/i.test(v.name);
      });
      if (male.length) return male[0];
    } else if (_ttsVoiceMode === 'female') {
      var female = candidates.filter(function(v) {
        return /female|woman|lady|zira|samantha/i.test(v.name);
      });
      if (female.length) return female[0];
    }
    return candidates[0];
  }

  function prepareSpeechText(text) {
    return text
      .replace(/\bPaper I\b(?!\d)/g, 'Paper 1')
      .replace(/\bPaper II\b(?!\d)/g, 'Paper 2')
      .replace(/\bPaper III\b(?!\d)/g, 'Paper 3');
  }

  function speakText(text, onDone) {
    var status = document.getElementById('speechStatus');
    if (!_synthSupported) {
      if (status) status.textContent = 'Speech synthesis not available';
      if (onDone) setTimeout(onDone, 100);
      return false;
    }
    if (!_voicesReady) {
      if (status) status.textContent = 'Speech engine loading... please try again';
      if (onDone) setTimeout(onDone, 100);
      return false;
    }
    try {
      if (_synth.speaking || _synth.pending) {
        _synth.cancel();
      }
      var u = new SpeechSynthesisUtterance(prepareSpeechText(text));
      u.rate = _ttsRate;
      u.pitch = _ttsPitch;
      u.volume = 1.0;
      var v = getEnglishVoice();
      if (v) u.voice = v;
      u.onstart = function() { };
      u.onend = function() {
        _activeUtterance = null;
        if (onDone) onDone();
      };
      u.onerror = function(e) {
        _activeUtterance = null;
        console.error('Speech error:', e.error || e.message || e);
        if (status) status.textContent = 'Speech error: ' + (e.error || 'unknown');
        if (onDone) setTimeout(onDone, 500);
      };
      _activeUtterance = u;
      _synth.speak(u);
      return true;
    } catch(e) {
      _activeUtterance = null;
      console.error('speakText exception:', e);
      if (onDone) setTimeout(onDone, 500);
      return false;
    }
  }

  function warmupSynth() {
    if (!_synthSupported) return;
    try {
      if (_synth.speaking) _synth.cancel();
      var w = new SpeechSynthesisUtterance('');
      w.volume = 0;
      w.rate = 1.0;
      w.pitch = 1.0;
      _synth.speak(w);
    } catch(e) {}
  }

  function computeScriptOffsets() {
    _scriptOffsets = _scriptData.map(function(entry) {
      var abs = 0;
      for (var s = 0; s < entry.session; s++) {
        for (var p = 0; p < SESSION_PHASES[s].length; p++)
          abs += SESSION_PHASES[s][p].duration;
      }
      for (var p = 0; p < entry.phase; p++)
        abs += SESSION_PHASES[entry.session][p].duration;
      return abs + entry.offset;
    });
  }

  function resetScriptState() {
    if (_advanceTimer) { clearTimeout(_advanceTimer); _advanceTimer = null; }
    if (_clearTimeout) { clearTimeout(_clearTimeout); _clearTimeout = null; }
    _speechGen++;
    _currentScriptGroup = -1;
    _scriptSentenceIndex = 0;
    clearBanner();
    _processedGroups = {};
  }

  function clearBanner() {
    if (_synthSupported && _synth) { try { _synth.cancel(); } catch(e) {} }
    _activeUtterance = null;
    var b = document.getElementById('scriptBanner');
    if (!b) return;
    b.innerHTML = '<div class="script-placeholder">Script announcements will appear here automatically</div>';
    b.classList.remove('speaking', 'done');
    _currentScriptGroup = -1;
    _scriptSentenceIndex = 0;
    if (_advanceTimer) { clearTimeout(_advanceTimer); _advanceTimer = null; }
    if (_clearTimeout) { clearTimeout(_clearTimeout); _clearTimeout = null; }
    var s = document.getElementById('speechStatus');
    if (s) s.textContent = '';
  }

  function finishGroup() {
    var b = document.getElementById('scriptBanner');
    if (b) { b.classList.remove('speaking'); b.classList.add('done'); }
    var s = document.getElementById('speechStatus');
    if (s) s.textContent = 'Script complete for this time';
    _currentScriptGroup = -1;
    _scriptSentenceIndex = 0;
    if (_clearTimeout) clearTimeout(_clearTimeout);
    _clearTimeout = setTimeout(function() {
      var b2 = document.getElementById('scriptBanner');
      if (b2) { b2.innerHTML = '<div class="script-placeholder">Script announcements will appear here automatically</div>'; b2.classList.remove('done'); }
    }, 60000);
  }

  function advanceSentence() {
    if (_currentScriptGroup < 0) return;
    _advanceTimer = null;
    _scriptSentenceIndex++;
    var grp = _scriptData[_currentScriptGroup];
    if (grp && _scriptSentenceIndex < grp.sentences.length) {
      showCurrentSentence();
    } else {
      finishGroup();
    }
  }

  function resolveTimePlaceholders(text, gi) {
    if (gi < 0 || gi >= _scriptData.length) return text;
    var entry = _scriptData[gi];
    var now = new Date(_ctrl.getCorrectedNow()).toTimeString().slice(0, 5);
    var finish = '';
    if (_ctrl.isRunning && _ctrl.endTime) {
      finish = new Date(_ctrl.endTime).toTimeString().slice(0, 5);
    } else {
      var phaseEndSec = TU.parseTimeString(_ctrl.startTimeStr) || 0;
      for (var s = 0; s <= entry.session; s++) {
        for (var p = 0; p < (s === entry.session ? entry.phase + 1 : SESSION_PHASES[s].length); p++)
          phaseEndSec += SESSION_PHASES[s][p].duration;
      }
      finish = TU.secsToHHMM(phaseEndSec);
    }
    var nextStart = '';
    for (var ns = entry.session + 1; ns < _sessionTitles.length; ns++) {
      if (_sessionTitles[ns].indexOf('Paper') >= 0) {
        var baseSec = TU.parseTimeString(_ctrl.startTimeStr) || 0;
        for (var ps = 0; ps < ns; ps++)
          for (var pp = 0; pp < SESSION_PHASES[ps].length; pp++)
            baseSec += SESSION_PHASES[ps][pp].duration;
        for (var pp = 0; pp < SESSION_PHASES[ns].length; pp++) {
          if (SESSION_PHASES[ns][pp].title.indexOf('Preparation') < 0) {
            nextStart = TU.secsToHHMM(baseSec);
            break;
          }
          baseSec += SESSION_PHASES[ns][pp].duration;
        }
        break;
      }
    }
    var debSec = TU.parseTimeString(_ctrl.startTimeStr) || 0;
    for (var ds = 0; ds < SESSION_PHASES.length; ds++)
      for (var dp = 0; dp < SESSION_PHASES[ds].length; dp++)
        debSec += SESSION_PHASES[ds][dp].duration;
    debSec += 1800;
    var debrief = TU.secsToHHMM(debSec);
    return text
      .replace(/\{\{CURRENT\}\}/g, now)
      .replace(/\{\{FINISH\}\}/g, finish)
      .replace(/\{\{NEXT_START\}\}/g, nextStart)
      .replace(/\{\{DEBRIEF_TIME\}\}/g, debrief)
      .replace(/\{\{PAPER_I_PAGES\}\}/g, _paperPages.PAPER_I_PAGES)
      .replace(/\{\{PAPER_CA_PAGES\}\}/g, _paperPages.PAPER_CA_PAGES)
      .replace(/\{\{PAPER_INV_PAGES\}\}/g, _paperPages.PAPER_INV_PAGES)
      .replace(/\{\{PAPER_RAD_PAGES\}\}/g, _paperPages.PAPER_RAD_PAGES)
      .replace(/\{\{PAPER_MCQ_PAGES\}\}/g, _paperPages.PAPER_MCQ_PAGES);
  }

  function showCurrentSentence() {
    var grp = _scriptData[_currentScriptGroup];
    if (!grp || _scriptSentenceIndex >= grp.sentences.length) { finishGroup(); return; }
    var myGen = _speechGen;
    var raw = grp.sentences[_scriptSentenceIndex];
    var sentence = resolveTimePlaceholders(raw, _currentScriptGroup);
    var displayTime = TU.addSeconds(_ctrl.startTimeStr, _scriptOffsets[_currentScriptGroup]).slice(0, 5);
    var sn = _scriptSentenceIndex + 1;
    var st = grp.sentences.length;
    var b = document.getElementById('scriptBanner');
    if (b) {
      b.innerHTML = '<div class="script-time">' + displayTime + ' &mdash; ' + sn + '/' + st + '</div><div class="script-text">' + sentence + '</div>';
      b.classList.remove('done'); b.classList.add('speaking');
    }
    var s = document.getElementById('speechStatus');
    if (s) s.textContent = 'Reading sentence ' + sn + ' of ' + st + '...';
    if (_advanceTimer) clearTimeout(_advanceTimer);

    if (!Audio.isMuted) {
      _advanceTimer = null;
      speakText(sentence, function() {
        if (_speechGen !== myGen) return;
        if (_advanceTimer) clearTimeout(_advanceTimer);
        _advanceTimer = setTimeout(advanceSentence, 300);
      });
    } else {
      _advanceTimer = setTimeout(function() {
        if (_speechGen !== myGen) return;
        advanceSentence();
      }, 8000);
    }
  }

  function showScript(index) {
    if (_advanceTimer) { clearTimeout(_advanceTimer); _advanceTimer = null; }
    if (_clearTimeout) { clearTimeout(_clearTimeout); _clearTimeout = null; }
    _speechGen++;
    _processedGroups[index] = true;
    _currentScriptGroup = index;
    _scriptSentenceIndex = 0;
    showCurrentSentence();
  }

  function checkScript() {
    if (_ctrl.isRunning && _ctrl.startTime) {
      var dur = SESSION_PHASES[_ctrl.selectedSessionIndex][_ctrl.selectedPhaseIndex].duration;
      var elapsed = dur - _ctrl.countdownSecondsLeft;
      for (var i = 0; i < _scriptData.length; i++) {
        if (_processedGroups[i]) continue;
        if (_scriptData[i].session !== _ctrl.selectedSessionIndex) continue;
        if (_scriptData[i].phase !== _ctrl.selectedPhaseIndex) continue;
        if (elapsed >= _scriptData[i].offset && elapsed - _scriptData[i].offset < 30) {
          showScript(i); return;
        }
      }
    } else {
      var now = new Date(_ctrl.getCorrectedNow());
      var currentSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      var scheduleSec = TU.parseTimeString(_ctrl.startTimeStr);
      for (var j = 0; j < _scriptData.length; j++) {
        if (_processedGroups[j]) continue;
        var sec = scheduleSec + _scriptOffsets[j];
        if (currentSec >= sec && currentSec - sec < 30) {
          showScript(j); return;
        }
      }
    }
  }

  function catchUpScripts() {
    var dur = SESSION_PHASES[_ctrl.selectedSessionIndex][_ctrl.selectedPhaseIndex].duration;
    var elapsed = dur - _ctrl.countdownSecondsLeft;
    var found = false;
    for (var i = 0; i < _scriptData.length; i++) {
      if (_processedGroups[i]) continue;
      if (_scriptData[i].session !== _ctrl.selectedSessionIndex) continue;
      if (_scriptData[i].phase !== _ctrl.selectedPhaseIndex) continue;
      var diff = elapsed - _scriptData[i].offset;
      if (diff >= -1 && diff <= 15) { showScript(i); found = true; break; }
    }
    if (!found) {
      for (var j = 0; j < _scriptData.length; j++) {
        if (_processedGroups[j]) continue;
        if (_scriptData[j].session !== _ctrl.selectedSessionIndex) continue;
        if (_scriptData[j].phase !== _ctrl.selectedPhaseIndex) continue;
        if (elapsed >= _scriptData[j].offset) { showScript(j); found = true; break; }
      }
    }
    if (found) {
      for (var k = 0; k < _scriptData.length; k++) {
        if (_processedGroups[k]) continue;
        if (_scriptData[k].session !== _ctrl.selectedSessionIndex) continue;
        if (_scriptData[k].phase !== _ctrl.selectedPhaseIndex) continue;
        if (elapsed >= _scriptData[k].offset + 1) _processedGroups[k] = true;
      }
    }
  }

  function renderTimetable() {
    var body = document.getElementById('timetableBody');
    if (!body) return;
    body.innerHTML = '';
    var activeIdx = -1;
    if (_ctrl && _ctrl.isRunning) {
      activeIdx = 0;
      for (var s = 0; s < _ctrl.selectedSessionIndex; s++) activeIdx += SESSION_PHASES[s].length;
      activeIdx += _ctrl.selectedPhaseIndex;
    }
    _timetable.forEach(function(row, idx) {
      var tr = document.createElement('tr');
      if (_ctrl.isRunning && idx === activeIdx) tr.classList.add('active');
      if (row.session.indexOf('Paper') >= 0 && row.session.indexOf('Collection') < 0) tr.classList.add('exam-session');
      if (row.session === 'Break' || row.session === 'Lunch') tr.classList.add('break-session');
      tr.innerHTML = '<td>' + row.time + '</td><td>' + row.session + '</td>';
      body.appendChild(tr);
    });
  }

  function updateTimerDisplayLocal() {
    var td = document.getElementById('timerDisplay');
    if (!td) return;
    td.textContent = _ctrl.formatTime(_ctrl.countdownSecondsLeft);
    td.classList.toggle('non-exam', !isExamPhase(_ctrl.selectedSessionIndex, _ctrl.selectedPhaseIndex));
  }

  function renderWrittenContent() {
    updateTimerDisplayLocal();
    var p = document.getElementById('timerDisplay');
    if (p) {
      p.classList.remove('non-exam');
      if (!isExamPhase(_ctrl.selectedSessionIndex, _ctrl.selectedPhaseIndex)) p.classList.add('non-exam');
    }
    renderTimetable();
    checkScript();
  }

  function initTtsControls() {
    var rateSlider = document.getElementById('ttsRateSlider');
    var rateLabel = document.getElementById('ttsRateLabel');
    if (rateSlider) {
      rateSlider.value = _ttsRate;
      rateSlider.addEventListener('input', function() {
        _ttsRate = parseFloat(this.value);
        if (rateLabel) rateLabel.textContent = 'Speed: ' + _ttsRate.toFixed(1) + 'x';
      });
    }

    var pitchSlider = document.getElementById('ttsPitchSlider');
    var pitchLabel = document.getElementById('ttsPitchLabel');
    if (pitchSlider) {
      pitchSlider.value = _ttsPitch;
      pitchSlider.addEventListener('input', function() {
        _ttsPitch = parseFloat(this.value);
        if (pitchLabel) pitchLabel.textContent = 'Pitch: ' + _ttsPitch.toFixed(1);
      });
    }

    var voiceSelect = document.getElementById('voiceSelect');
    if (voiceSelect) {
      voiceSelect.value = _ttsVoiceMode;
      voiceSelect.addEventListener('change', function() {
        _ttsVoiceMode = this.value;
      });
    }
  }

  function start(cfg) {
    _startTimeStr = cfg.startTimeStr;
    _sessionTitles = cfg.sessionTitles;
    _examTitle = cfg.examTitle;
    _timetable = cfg.timetable;
    _paperPages = cfg.paperPages || {};
    _scriptData = cfg.scriptData || [];
    _isTimetableVisible = false;
    _processedGroups = {};
    _currentScriptGroup = -1;
    _scriptSentenceIndex = 0;
    _speechGen = 0;
    _ttsRate = 1.0;
    _ttsPitch = 1.0;
    _voicesReady = false;
    _activeUtterance = null;

    Audio.isMuted = true;

    _synthSupported = typeof window.speechSynthesis !== 'undefined' && window.speechSynthesis !== null;
    _synth = window.speechSynthesis;

    if (_synthSupported && _synth) {
      var voices = _synth.getVoices();
      if (voices && voices.length) {
        _voicesReady = true;
      } else {
        _synth.addEventListener('voiceschanged', function() {
          var v = _synth.getVoices();
          if (v && v.length) {
            _voicesReady = true;
            warmupSynth();
            var s = document.getElementById('speechStatus');
            if (s) s.textContent = 'Speech engine ready (' + v.length + ' voices)';
          }
        });
      }
    }

    computeScriptOffsets();

    _ctrl = TC.createController({
      startTimeStr: _startTimeStr,
      sessionPhases: SESSION_PHASES,
      examTitle: _examTitle,
      getSessionLabel: getSessionLabel,
      mutedByDefault: true,
      enableBeep: false,
      renderContent: renderWrittenContent
    });

    initTtsControls();

    _ctrl.init();

    var stpBtn = document.getElementById('stopBtn');
    if (stpBtn) {
      stpBtn.addEventListener('click', function() {
        if (_synthSupported && _synth) { try { _synth.cancel(); } catch(e) {} }
        _activeUtterance = null;
        _speechGen++;
        _currentScriptGroup = -1;
        _scriptSentenceIndex = 0;
        if (_advanceTimer) { clearTimeout(_advanceTimer); _advanceTimer = null; }
        if (_clearTimeout) { clearTimeout(_clearTimeout); _clearTimeout = null; }
        _processedGroups = {};
        var b = document.getElementById('scriptBanner');
        if (b) {
          b.innerHTML = '<div class="script-placeholder">Script announcements will appear here automatically</div>';
          b.classList.remove('speaking', 'done');
        }
        var s = document.getElementById('speechStatus');
        if (s) s.textContent = '';
      });
    }

    var muteBtn = document.getElementById('muteBtn');
    if (muteBtn) {
      muteBtn.textContent = Audio.isMuted ? 'Unmute' : 'Mute';
      muteBtn.setAttribute('aria-pressed', String(!Audio.isMuted));
    }

    var testBtn = document.getElementById('testSpeechBtn');
    if (testBtn) {
      testBtn.onclick = function() {
        var s = document.getElementById('speechStatus');
        if (Audio.isMuted) { if (s) s.textContent = 'Muted - click "Unmute" first'; return; }
        if (!_synthSupported) { if (s) s.textContent = 'Speech synthesis not available'; return; }
        if (!_voicesReady) { if (s) s.textContent = 'Speech engine loading... please try again'; warmupSynth(); return; }
        warmupSynth();
        var voices = _synth.getVoices();
        if (s) s.textContent = 'Speaking... (voices: ' + voices.length + ')';
        speakText('This is a test of the speech synthesis system', function() {
          if (s) s.textContent = 'Test complete';
        });
      };
    }

    var ttBtn = document.getElementById('toggleTimetableBtn');
    if (ttBtn) {
      ttBtn.onclick = function() {
        _isTimetableVisible = !_isTimetableVisible;
        document.getElementById('timetableContainer').style.display = _isTimetableVisible ? 'block' : 'none';
        ttBtn.textContent = _isTimetableVisible ? 'Hide Timetable' : 'Show Timetable';
        if (_isTimetableVisible) renderTimetable();
      };
    }

    var scriptInterval = setInterval(function() {
      if (_ctrl.isRunning) { checkScript(); }
    }, 1000);

    window.addEventListener('beforeunload', function() {
      clearInterval(scriptInterval);
      if (_advanceTimer) clearTimeout(_advanceTimer);
      if (_clearTimeout) clearTimeout(_clearTimeout);
      if (_synthSupported && _synth) _synth.cancel();
    });
  }

  return { start: start };
});
window.WrittenTimer = Sahk.get('WrittenTimer');
