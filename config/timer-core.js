'use strict';
Sahk.register('TimerCore', function() {
  var TU = Sahk.get('TimeUtils');
  var PE = Sahk.get('PhaseEngine');
  var Audio = Sahk.get('Audio');
  var TimeSync = Sahk.get('TimeSync');

  function createController(config) {
    var startTimeStr = config.startTimeStr;
    var sessionPhases = config.sessionPhases;
    var examTitle = config.examTitle;
    var getSessionLabel = config.getSessionLabel;
    var renderContent = config.renderContent;
    var mutedByDefault = config.mutedByDefault !== undefined ? config.mutedByDefault : true;
    var enableBeep = config.enableBeep !== undefined ? config.enableBeep : true;

    var el = function(id) { return document.getElementById(id); };

    var P = Sahk.get('Constants').PHASE;

    var isRunning = false;
    var isStarting = false;
    var selectedSessionIndex = 0;
    var selectedPhaseIndex = 0;
    var countdownInterval = null;
    var countdownSecondsLeft = 0;
    var startTime = null;
    var endTime = null;
    var lastDisplayedSecond = -1;

    var scheduledTimes = [];
    var SESSION_TIMES = [];

    Audio.isMuted = mutedByDefault;

    function recalculateScheduledTimes() {
      scheduledTimes = PE.recalculateScheduledTimes(startTimeStr, sessionPhases);
    }

    function generateSessionTimes() {
      SESSION_TIMES = PE.generateSessionTimes(startTimeStr, sessionPhases);
      return SESSION_TIMES;
    }

    recalculateScheduledTimes();
    SESSION_TIMES = generateSessionTimes();

    function setSessionPhaseMenusEnabled(enabled) {
      var toggleElements = function(list, selectedIdx) {
        Array.from(list.children).forEach(function(li, idx) {
          if (enabled) {
            li.classList.remove('disabled');
            li.tabIndex = 0;
            li.style.pointerEvents = '';
            li.style.opacity = '';
          } else {
            if (idx === selectedIdx) {
              li.classList.add('disabled', 'selected');
              li.tabIndex = -1;
              li.style.pointerEvents = 'none';
              li.style.opacity = '1';
            } else {
              li.classList.add('disabled');
              li.classList.remove('selected');
              li.tabIndex = -1;
              li.style.pointerEvents = 'none';
              li.style.opacity = '0.5';
            }
          }
        });
      };
      toggleElements(el('sectionsList'), selectedSessionIndex);
      toggleElements(el('subsectionsList'), selectedPhaseIndex);
    }

    function renderSections() {
      var sectionsList = el('sectionsList');
      if (!sectionsList) return;
      sectionsList.innerHTML = '';
      for (var i = 0; i < sessionPhases.length; i++) {
        var li = document.createElement('li');
        li.textContent = getSessionLabel ? getSessionLabel(i) : 'Session ' + (i + 1);
        if (i === selectedSessionIndex) li.classList.add('selected');
        li.addEventListener('click', function(boundSessionIndex) {
          return function() {
            if (isRunning) return;
            if (selectedSessionIndex !== boundSessionIndex) {
              selectedSessionIndex = boundSessionIndex;
              selectedPhaseIndex = 0;
              resetTimerToCurrentPhase();
              startTime = endTime = null;
              renderSections();
              renderPhases();
              renderBottomContent();
            }
          };
        }(i));
        sectionsList.appendChild(li);
      }
      setSessionPhaseMenusEnabled(!isRunning);
    }

    function renderPhases() {
      var subsectionsList = el('subsectionsList');
      if (!subsectionsList) return;
      subsectionsList.innerHTML = '';
      var phases = sessionPhases[selectedSessionIndex];
      phases.forEach(function(phase, idx) {
        var li = document.createElement('li');
        li.textContent = phase.title;
        if (idx === selectedPhaseIndex) li.classList.add('selected');
        li.addEventListener('click', function(boundPhaseIndex) {
          return function() {
            if (isRunning) return;
            if (selectedPhaseIndex !== boundPhaseIndex) {
              selectedPhaseIndex = boundPhaseIndex;
              resetTimerToCurrentPhase();
              startTime = endTime = null;
              renderPhases();
              renderBottomContent();
            }
          };
        }(idx));
        subsectionsList.appendChild(li);
      });
      setSessionPhaseMenusEnabled(!isRunning);
    }

    function updateProgressBar() {
      var prog = el('progressBarContainer');
      if (!prog) return;
      var dur = sessionPhases[selectedSessionIndex][selectedPhaseIndex].duration;
      if (dur <= 0) { prog.style.display = 'none'; return; }
      prog.style.display = '';
      var elapsed = dur - countdownSecondsLeft;
      var pct = Math.min(100, Math.max(0, (elapsed / dur) * 100));
      var fill = prog.querySelector('.progress-fill');
      if (fill) fill.style.width = pct + '%';
    }

    function updateTimerDisplay() {
      var td = el('timerDisplay');
      if (td) {
        td.textContent = TU.formatTime(countdownSecondsLeft);
        var phase = sessionPhases[selectedSessionIndex] ? sessionPhases[selectedSessionIndex][selectedPhaseIndex] : null;
        td.classList.remove('transit', 'debriefing');
        if (phase && (phase.title === P.TRANSIT || phase.title === P.PREPARATION || phase.title === P.CONCLUSION)) {
          td.classList.add('transit');
        } else if (phase && phase.title === P.DEBRIEFING) {
          td.classList.add('debriefing');
        }
      }
      updateProgressBar();
    }

    var _announcedMilestones = {};

    function _announceTimeRemaining() {
      var mins = Math.floor(countdownSecondsLeft / 60);
      var secs = countdownSecondsLeft % 60;
      var key = countdownSecondsLeft;
      if (_announcedMilestones[key]) return;
      var text = '';
      if (countdownSecondsLeft <= 5 && countdownSecondsLeft > 0) {
        text = countdownSecondsLeft.toString();
      } else if (key === 10) {
        text = '10 seconds remaining';
      } else if (key === 30) {
        text = '30 seconds remaining';
      } else if (key === 60) {
        text = '1 minute remaining';
      } else if (key === 300) {
        text = '5 minutes remaining';
      } else if (key === 600) {
        text = '10 minutes remaining';
      } else if (key === 900) {
        text = '15 minutes remaining';
      }
      if (text) {
        _announcedMilestones[key] = true;
        var announcer = document.getElementById('sahkAnnouncer');
        if (!announcer) {
          announcer = document.createElement('div');
          announcer.id = 'sahkAnnouncer';
          announcer.setAttribute('aria-live', 'polite');
          announcer.setAttribute('aria-atomic', 'true');
          announcer.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;';
          document.body.appendChild(announcer);
        }
        announcer.textContent = text;
      }
    }

    function resetTimerToCurrentPhase() {
      countdownSecondsLeft = sessionPhases[selectedSessionIndex][selectedPhaseIndex].duration;
      _announcedMilestones = {};
    }

    function moveToNextPhase() {
      var s = selectedSessionIndex;
      var p = selectedPhaseIndex + 1;
      if (p >= sessionPhases[s].length) {
        s++;
        p = 0;
        if (s >= sessionPhases.length) {
          stopTimers();
          alert('All sessions completed!');
          return;
        }
      }
      selectedSessionIndex = s;
      selectedPhaseIndex = p;
      resetTimerToCurrentPhase();
      var dur = sessionPhases[s][p].duration;
      if (endTime) {
        startTime = endTime;
        endTime = startTime + dur * 1000;
      } else {
        startTime = TimeSync.getCorrectedNow();
        endTime = startTime + dur * 1000;
      }
      countdownSecondsLeft = dur;
      _announcedMilestones = {};
      lastDisplayedSecond = -1;
      renderSections();
      renderPhases();
      renderBottomContent();
      if (isRunning) startCountdownForSelected();
    }

    function renderBottomContent() {
      var si = selectedSessionIndex;
      var pi = selectedPhaseIndex;
      var phase = sessionPhases[si][pi];
      updateTimerDisplay();

      var sessionLabel = getSessionLabel ? getSessionLabel(si) : 'Session ' + (si + 1);

      var phaseStartSec = scheduledTimes[si] ? scheduledTimes[si][pi] : undefined;
      var phaseEndSec;
      if (pi + 1 < sessionPhases[si].length) {
        phaseEndSec = scheduledTimes[si][pi + 1];
      } else if (si + 1 < scheduledTimes.length) {
        phaseEndSec = scheduledTimes[si + 1][0];
      } else {
        phaseEndSec = phaseStartSec + phase.duration;
      }
      var phaseTime = phaseStartSec !== undefined
        ? TU.formatTimeHMM(phaseStartSec) + ' - ' + TU.formatTimeHMM(phaseEndSec)
        : '';

      var schedStr = phaseStartSec !== undefined ? TU.formatTimeHMSSec(phaseStartSec) : '';
      var displayStartTime = isRunning && startTime !== null ? TU.formatAbsoluteTime(startTime) : schedStr;
      var displayEndTime = isRunning && endTime !== null ? TU.formatAbsoluteTime(endTime) : '';
      var sessionLine = isRunning
        ? sessionLabel + ' (' + phase.title + '), ' + phaseTime + ' (' + phase.info + ')<br><span style="color:#1976d2;">Current: ' + displayStartTime + ' - ' + displayEndTime + '</span>'
        : sessionLabel + ' (' + phase.title + '), ' + phaseTime + ' (' + phase.info + ')<br><span style="color:#1976d2;">Scheduled Start: ' + displayStartTime + '</span>';

      var info = el('infoDisplay');
      if (info) {
        info.innerHTML = '<div style="font-weight:700;font-size:1em;margin-bottom:6px;text-align:center;">' + examTitle + '</div><div style="font-weight:600;font-size:1em;margin-bottom:10px;text-align:center;">' + sessionLine + '</div>';
      }

      if (renderContent) renderContent(selectedSessionIndex, selectedPhaseIndex);
    }

    function startCountdownForSelected() {
      clearInterval(countdownInterval);
      updateTimerDisplay();
      lastDisplayedSecond = -1;
      countdownInterval = setInterval(function() {
        if (!isRunning) return;
        var now = TimeSync.getCorrectedNow();
        var diff = endTime - now;
        countdownSecondsLeft = diff > 0 ? Math.ceil(diff / 1000) : 0;

        if (countdownSecondsLeft !== lastDisplayedSecond) {
          lastDisplayedSecond = countdownSecondsLeft;
          updateTimerDisplay();
          _announceTimeRemaining();
        }

        if (countdownSecondsLeft <= 0) {
          if (enableBeep) Audio.beep(5);
          moveToNextPhase();
        }
      }, 100);
    }

    async function startTimers() {
      if (isRunning || isStarting) return;
      isStarting = true;
      await TimeSync.syncStandardTime();
      isRunning = true;
      isStarting = false;
      if (countdownSecondsLeft <= 0) resetTimerToCurrentPhase();
      startTime = TimeSync.getCorrectedNow();
      endTime = startTime + countdownSecondsLeft * 1000;
      lastDisplayedSecond = -1;
      var sb = el('startBtn'); if (sb) sb.disabled = true;
      var pb = el('pauseBtn'); if (pb) pb.disabled = false;
      var stb = el('stopBtn'); if (stb) stb.disabled = false;
      var ssb = el('scheduleStartBtn'); if (ssb) ssb.disabled = true;
      setSessionPhaseMenusEnabled(false);
      renderBottomContent();
      startCountdownForSelected();
    }

    function pauseTimers() {
      if (!isRunning) return;
      isRunning = false;
      var sb = el('startBtn'); if (sb) sb.disabled = false;
      var pb = el('pauseBtn'); if (pb) pb.disabled = true;
      var stb = el('stopBtn'); if (stb) stb.disabled = false;
      var ssb = el('scheduleStartBtn'); if (ssb) ssb.disabled = false;
      clearInterval(countdownInterval);
      var diff = endTime - TimeSync.getCorrectedNow();
      countdownSecondsLeft = diff > 0 ? Math.ceil(diff / 1000) : 0;
      startTime = endTime = null;
      setSessionPhaseMenusEnabled(true);
      updateTimerDisplay();
    }

    function stopTimers() {
      isRunning = false;
      var sb = el('startBtn'); if (sb) sb.disabled = false;
      var pb = el('pauseBtn'); if (pb) pb.disabled = true;
      var stb = el('stopBtn'); if (stb) stb.disabled = true;
      var ssb = el('scheduleStartBtn'); if (ssb) ssb.disabled = false;
      clearInterval(countdownInterval);
      resetTimerToCurrentPhase();
      startTime = null;
      endTime = null;
      updateTimerDisplay();
      renderBottomContent();
      setSessionPhaseMenusEnabled(true);
    }

    function scheduleStart() {
      if (isRunning) return;
      var now = new Date(TimeSync.getCorrectedNow());
      var nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      var found = false;
      for (var s = 0; s < scheduledTimes.length; s++) {
        for (var p = 0; p < scheduledTimes[s].length; p++) {
          var phaseStart = scheduledTimes[s][p];
          var phaseEnd;
          if (p + 1 < scheduledTimes[s].length) {
            phaseEnd = scheduledTimes[s][p + 1];
          } else if (s + 1 < scheduledTimes.length) {
            phaseEnd = scheduledTimes[s + 1][0];
          } else {
            phaseEnd = phaseStart + sessionPhases[s][p].duration;
          }
          if (nowSeconds >= phaseStart && nowSeconds < phaseEnd) {
            selectedSessionIndex = s;
            selectedPhaseIndex = p;
            countdownSecondsLeft = phaseEnd - nowSeconds;
            startTime = TimeSync.getCorrectedNow();
            endTime = startTime + countdownSecondsLeft * 1000;
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (!found) {
        selectedSessionIndex = 0;
        selectedPhaseIndex = 0;
        resetTimerToCurrentPhase();
        startTime = TimeSync.getCorrectedNow();
        endTime = startTime + countdownSecondsLeft * 1000;
      }
      renderSections();
      renderPhases();
      renderBottomContent();
      startTimers();
    }

    function adjustStartTime(offsetSeconds) {
      startTimeStr = PE.adjustStartTime(startTimeStr, offsetSeconds);
      var sti = el('startTimeInput');
      if (sti) sti.value = startTimeStr;
      _saveOffset();
      recalculateScheduledTimes();
      SESSION_TIMES = generateSessionTimes();
      renderSections();
      renderPhases();
      renderBottomContent();
    }

    function _saveOffset() {
      try {
        var key = 'sahk_offset_' + (window.location.pathname + window.location.search).replace(/[^a-zA-Z0-9]/g, '_');
        localStorage.setItem(key, startTimeStr);
      } catch(e) {}
    }

    function _restoreOffset() {
      try {
        var key = 'sahk_offset_' + (window.location.pathname + window.location.search).replace(/[^a-zA-Z0-9]/g, '_');
        var saved = localStorage.getItem(key);
        if (saved) startTimeStr = saved;
      } catch(e) {}
    }

    function initVolumeControl() {
      var volSlider = el('volumeSlider');
      var volLabel = el('volumeLabel');
      if (volSlider) {
        volSlider.value = Audio.volume;
        volSlider.addEventListener('input', function() {
          Audio.volume = parseFloat(this.value);
          if (volLabel) volLabel.textContent = 'Vol: ' + Math.round(Audio.volume * 100) + '%';
        });
      }
    }

    function showKeyboardHelp() {
      var existing = document.querySelector('.keyboard-help-overlay');
      if (existing) { existing.remove(); return; }
      var overlay = document.createElement('div');
      overlay.className = 'keyboard-help-overlay';
      overlay.innerHTML = '<div class="keyboard-help-box"><h3>Keyboard Shortcuts</h3><table><tr><td><kbd>Space</kbd></td><td>Start / Pause</td></tr><tr><td><kbd>Esc</kbd></td><td>Stop &amp; Reset</td></tr><tr><td><kbd>M</kbd></td><td>Mute / Unmute</td></tr></table><button class="keyboard-help-close">Close</button></div>';
      overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
      overlay.querySelector('.keyboard-help-close').addEventListener('click', function() { overlay.remove(); });
      document.body.appendChild(overlay);
    }

    function init() {
      _restoreOffset();
      recalculateScheduledTimes();
      SESSION_TIMES = generateSessionTimes();
      var sti = el('startTimeInput');
      if (sti) sti.value = startTimeStr;

      var applyBtn = el('applyStartTimeBtn');
      if (applyBtn) {
        applyBtn.onclick = function() {
          startTimeStr = (el('startTimeInput') ? el('startTimeInput').value : startTimeStr);
          _saveOffset();
          recalculateScheduledTimes();
          SESSION_TIMES = generateSessionTimes();
          renderSections();
          renderPhases();
          renderBottomContent();
        };
      }

      document.querySelectorAll('.offset-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          adjustStartTime(parseInt(btn.dataset.offset, 10));
        });
      });

      var mBtn = el('muteBtn');
      if (mBtn) {
        mBtn.onclick = Audio.toggleMute;
      }

      var sBtn = el('startBtn');
      if (sBtn) sBtn.onclick = startTimers;
      var pBtn = el('pauseBtn');
      if (pBtn) pBtn.onclick = pauseTimers;
      var stpBtn = el('stopBtn');
      if (stpBtn) stpBtn.onclick = stopTimers;
      var ssBtn = el('scheduleStartBtn');
      if (ssBtn) ssBtn.onclick = scheduleStart;

      var helpBtn = el('keyboardHelpBtn');
      if (helpBtn) helpBtn.onclick = showKeyboardHelp;

      initVolumeControl();

      setInterval(function() { TimeSync.updateClock(); }, 1000);
      TimeSync.updateClock();

      setInterval(function() {
        if (isRunning) return;
        var now = new Date(TimeSync.getCorrectedNow());
        var nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        for (var s = 0; s < scheduledTimes.length; s++) {
          for (var p = 0; p < scheduledTimes[s].length; p++) {
            if (Math.abs(nowSec - scheduledTimes[s][p]) < 1) {
              if (selectedSessionIndex !== s || selectedPhaseIndex !== p) {
                selectedSessionIndex = s;
                selectedPhaseIndex = p;
                resetTimerToCurrentPhase();
                startTime = endTime = null;
                renderSections();
                renderPhases();
                renderBottomContent();
              }
              startTimers();
              return;
            }
          }
        }
      }, 1000);

      renderSections();
      renderPhases();
      resetTimerToCurrentPhase();
      renderBottomContent();
      startTime = endTime = null;

      TimeSync.syncStandardTime();
      setInterval(function() { TimeSync.syncStandardTime(); }, 60000);

      var muteBtnEl = el('muteBtn');
      if (muteBtnEl) {
        muteBtnEl.textContent = Audio.isMuted ? 'Unmute' : 'Mute';
        muteBtnEl.setAttribute('aria-pressed', String(!Audio.isMuted));
      }

      document.addEventListener('keydown', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
        if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); isRunning ? pauseTimers() : startTimers(); return; }
        if (e.key === 'Escape') { e.preventDefault(); stopTimers(); return; }
        if (e.key === 'm' || e.key === 'M') { e.preventDefault(); Audio.toggleMute(); return; }
        if (e.key === '?' || (e.key === '/' && e.shiftKey)) { e.preventDefault(); showKeyboardHelp(); return; }
      });

      window.addEventListener('beforeunload', function() {
        clearInterval(countdownInterval);
        Audio.cleanup();
      });
    }

    return {
      init: init,
      getCorrectedNow: function() { return TimeSync.getCorrectedNow(); },
      formatTime: TU.formatTime,
      formatTimeHMSSec: TU.formatTimeHMSSec,
      formatAbsoluteTime: TU.formatAbsoluteTime,
      parseTimeString: TU.parseTimeString,
      addSeconds: TU.addSeconds,
      beep: function(times) { Audio.beep(times); },
      syncStandardTime: function() { return TimeSync.syncStandardTime(); },
      renderSections: renderSections,
      renderPhases: renderPhases,
      renderBottomContent: renderBottomContent,
      setSessionPhaseMenusEnabled: setSessionPhaseMenusEnabled,
      recalculateScheduledTimes: recalculateScheduledTimes,
      resetTimerToCurrentPhase: resetTimerToCurrentPhase,
      adjustStartTime: adjustStartTime,
      startTimers: startTimers,
      pauseTimers: pauseTimers,
      stopTimers: stopTimers,
      scheduleStart: scheduleStart,
      get isRunning() { return isRunning; },
      get selectedSessionIndex() { return selectedSessionIndex; },
      get selectedPhaseIndex() { return selectedPhaseIndex; },
      set selectedSessionIndex(v) { selectedSessionIndex = v; },
      set selectedPhaseIndex(v) { selectedPhaseIndex = v; },
      get countdownSecondsLeft() { return countdownSecondsLeft; },
      set countdownSecondsLeft(v) { countdownSecondsLeft = v; },
      get startTime() { return startTime; },
      set startTime(v) { startTime = v; },
      get endTime() { return endTime; },
      set endTime(v) { endTime = v; },
      get isMuted() { return Audio.isMuted; },
      set isMuted(v) { Audio.isMuted = v; },
      get scheduledTimes() { return scheduledTimes; },
      get SESSION_TIMES() { return SESSION_TIMES; },
      get startTimeStr() { return startTimeStr; },
      set startTimeStr(v) { startTimeStr = v; }
    };
  }

  return { createController: createController };
});
window.TimerCore = Sahk.get('TimerCore');
