window.TimerCore = (() => {
  'use strict';
  function addSeconds(timeStr, seconds) {
    let [h, m, s] = timeStr.split(':').map(Number);
    let date = new Date(0, 0, 0, h, m, s);
    date.setSeconds(date.getSeconds() + seconds);
    return date.toTimeString().slice(0, 8);
  }

  function parseTimeString(str) {
    if (!str) return 0;
    const [h, m, s = 0] = str.split(':').map(Number);
    return h * 3600 + m * 60 + s;
  }

  function formatTimeHMSSec(secs) {
    secs %= 86400;
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${(secs % 60).toString().padStart(2, '0')}`;
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  function formatAbsoluteTime(ms) {
    return new Date(ms).toTimeString().slice(0, 8);
  }

  function createController(config) {
    const {
      startTimeStr: initialStartTime,
      sessionPhases,
      examTitle,
      getSessionLabel,
      renderContent,
      mutedByDefault = true,
    } = config;

    const el = id => document.getElementById(id);

    let startTimeStr = initialStartTime;
    let isRunning = false;
    let isStarting = false;
    let selectedSessionIndex = 0;
    let selectedPhaseIndex = 0;
    let countdownInterval = null;
    let countdownSecondsLeft = 0;
    let startTime = null;
    let endTime = null;
    let isMuted = mutedByDefault;
    let timeOffset = 0;
    let beeping = false;
    let beepAudioCtx = null;
    let lastDisplayedSecond = -1;
    let syncFailureWarning = false;

    let scheduledTimes = [];
    let SESSION_TIMES = [];

    function recalculateScheduledTimes() {
      scheduledTimes = [];
      let t = parseTimeString(startTimeStr);
      for (let s = 0; s < sessionPhases.length; s++) {
        scheduledTimes[s] = [];
        for (const phase of sessionPhases[s]) {
          scheduledTimes[s].push(t);
          t += phase.duration;
        }
      }
    }

    function generateSessionTimes() {
      let times = [], current = startTimeStr;
      for (const phases of sessionPhases) {
        const totalDuration = phases.reduce((sum, p) => sum + p.duration, 0);
        let next = addSeconds(current, totalDuration);
        times.push(`${current.slice(0, 5)}-${next.slice(0, 5)}`);
        current = next;
      }
      return times;
    }

    recalculateScheduledTimes();
    SESSION_TIMES = generateSessionTimes();

    function initBeep() {
      if (!beepAudioCtx) beepAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    function beep(times = 1) {
      if (isMuted || beeping) return;
      beeping = true;
      initBeep();
      let count = 0;
      function play() {
        if (count >= times) { beeping = false; return; }
        const osc = beepAudioCtx.createOscillator();
        const gain = beepAudioCtx.createGain();
        osc.frequency.value = 1000;
        osc.type = 'square';
        osc.connect(gain);
        gain.connect(beepAudioCtx.destination);
        osc.start();
        setTimeout(() => {
          osc.stop();
          count++;
          setTimeout(play, 150);
        }, 200);
      }
      play();
    }

    function getCorrectedNow() {
      return Date.now() + timeOffset;
    }

    let syncFailures = 0;
    let syncRetryTimer = null;

    async function syncStandardTime() {
      try {
        const response = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=Asia/Hong_Kong');
        const data = await response.json();
        const standardTime = new Date(data.dateTime).getTime();
        timeOffset = standardTime - Date.now();
        syncFailures = 0;
        syncFailureWarning = false;
        if (syncRetryTimer) { clearTimeout(syncRetryTimer); syncRetryTimer = null; }
        const warn = el('syncWarning');
        if (warn) warn.style.display = 'none';
      } catch (e) {
        console.error('Failed to fetch standard time, using local time', e);
        syncFailures++;
        if (syncFailures === 1) {
          timeOffset = 0;
          syncFailureWarning = true;
          const warn = el('syncWarning');
          if (warn) {
            warn.textContent = '\u26A0 Time sync unavailable \u2014 using local time';
            warn.style.display = 'block';
          }
        } else if (syncFailures >= 5) {
          const warn = el('syncWarning');
          if (warn) {
            warn.textContent = '\u26A0 Time sync stale (' + syncFailures + ' attempts) \u2014 using local time';
            warn.style.display = 'block';
          }
        }
        if (syncRetryTimer) clearTimeout(syncRetryTimer);
        var delay = Math.min(2000 * Math.pow(2, Math.min(syncFailures - 1, 4)), 32000);
        syncRetryTimer = setTimeout(syncStandardTime, delay);
      }
    }

    function updateClock() {
      const c = el('clock');
      if (c) c.textContent = new Date(getCorrectedNow()).toTimeString().slice(0, 8);
    }

    function setSessionPhaseMenusEnabled(enabled) {
      const toggleElements = (list, selectedIdx) => {
        [...list.children].forEach((li, idx) => {
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
      const sectionsList = el('sectionsList');
      if (!sectionsList) return;
      sectionsList.innerHTML = '';
      for (let i = 0; i < sessionPhases.length; i++) {
        const li = document.createElement('li');
        li.textContent = getSessionLabel ? getSessionLabel(i) : `Session ${i + 1}`;
        if (i === selectedSessionIndex) li.classList.add('selected');
        li.addEventListener('click', () => {
          if (isRunning) return;
          if (selectedSessionIndex !== i) {
            selectedSessionIndex = i;
            selectedPhaseIndex = 0;
            resetTimerToCurrentPhase();
            startTime = endTime = null;
            renderSections();
            renderPhases();
            renderBottomContent();
          }
        });
        sectionsList.appendChild(li);
      }
      setSessionPhaseMenusEnabled(!isRunning);
    }

    function renderPhases() {
      const subsectionsList = el('subsectionsList');
      if (!subsectionsList) return;
      subsectionsList.innerHTML = '';
      const phases = sessionPhases[selectedSessionIndex];
      phases.forEach((phase, idx) => {
        const li = document.createElement('li');
        li.textContent = phase.title;
        if (idx === selectedPhaseIndex) li.classList.add('selected');
        li.addEventListener('click', () => {
          if (isRunning) return;
          if (selectedPhaseIndex !== idx) {
            selectedPhaseIndex = idx;
            resetTimerToCurrentPhase();
            startTime = endTime = null;
            renderPhases();
            renderBottomContent();
          }
        });
        subsectionsList.appendChild(li);
      });
      setSessionPhaseMenusEnabled(!isRunning);
    }

    function renderBottomContent() {
      const phase = sessionPhases[selectedSessionIndex][selectedPhaseIndex];
      updateTimerDisplay();
      const td = el('timerDisplay');
      if (td) {
        td.classList.remove('transit', 'debriefing');
        if (phase.title === 'Transit' || phase.title === 'Preparation' || phase.title === 'Conclusion') td.classList.add('transit');
        else if (phase.title === 'Debriefing') td.classList.add('debriefing');
      }

      const sessionLabel = getSessionLabel ? getSessionLabel(selectedSessionIndex) : `Session ${selectedSessionIndex + 1}`;
      const sessionTime = SESSION_TIMES[selectedSessionIndex] || '';
      const schedSec = scheduledTimes[selectedSessionIndex]?.[selectedPhaseIndex];
      const schedTimeStr = schedSec ? formatTimeHMSSec(schedSec) : '';
      const displayStartTime = isRunning && startTime !== null ? formatAbsoluteTime(startTime) : schedTimeStr;
      const displayEndTime = isRunning && endTime !== null ? formatAbsoluteTime(endTime) : '';
      const sessionLine = isRunning
        ? `${sessionLabel} (${phase.title}), ${sessionTime} (${phase.info})<br><span style="color:#1976d2;">Current: ${displayStartTime} - ${displayEndTime}</span>`
        : `${sessionLabel} (${phase.title}), ${sessionTime} (${phase.info})<br><span style="color:#1976d2;">Scheduled Start: ${displayStartTime}</span>`;

      const info = el('infoDisplay');
      if (info) {
        info.innerHTML = `<div style="font-weight:700;font-size:1em;margin-bottom:6px;text-align:center;">${examTitle}</div><div style="font-weight:600;font-size:1em;margin-bottom:10px;text-align:center;">${sessionLine}</div>`;
      }

      if (renderContent) renderContent(selectedSessionIndex, selectedPhaseIndex);
    }

    function updateTimerDisplay() {
      const td = el('timerDisplay');
      if (td) td.textContent = formatTime(countdownSecondsLeft);
    }

    function resetTimerToCurrentPhase() {
      countdownSecondsLeft = sessionPhases[selectedSessionIndex][selectedPhaseIndex].duration;
    }

    function moveToNextPhase() {
      let s = selectedSessionIndex;
      let p = selectedPhaseIndex + 1;
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
      const dur = sessionPhases[s][p].duration;
      if (endTime) {
        startTime = endTime;
        endTime = startTime + dur * 1000;
      } else {
        startTime = getCorrectedNow();
        endTime = startTime + dur * 1000;
      }
      countdownSecondsLeft = dur;
      lastDisplayedSecond = -1;
      renderSections();
      renderPhases();
      renderBottomContent();
      if (isRunning) startCountdownForSelected();
    }

    function startCountdownForSelected() {
      clearInterval(countdownInterval);
      updateTimerDisplay();
      lastDisplayedSecond = -1;
      countdownInterval = setInterval(() => {
        if (!isRunning) return;
        const now = getCorrectedNow();
        const diff = endTime - now;
        countdownSecondsLeft = diff > 0 ? Math.ceil(diff / 1000) : 0;

        if (countdownSecondsLeft !== lastDisplayedSecond) {
          lastDisplayedSecond = countdownSecondsLeft;
          updateTimerDisplay();
        }

        if (countdownSecondsLeft <= 0) {
          beep(5);
          moveToNextPhase();
        }
      }, 100);
    }

    async function startTimers() {
      if (isRunning || isStarting) return;
      isStarting = true;
      await syncStandardTime();
      isRunning = true;
      isStarting = false;
      if (countdownSecondsLeft <= 0) resetTimerToCurrentPhase();
      startTime = getCorrectedNow();
      endTime = startTime + countdownSecondsLeft * 1000;
      lastDisplayedSecond = -1;
      const sb = el('startBtn'); if (sb) sb.disabled = true;
      const pb = el('pauseBtn'); if (pb) pb.disabled = false;
      const stb = el('stopBtn'); if (stb) stb.disabled = false;
      const ssb = el('scheduleStartBtn'); if (ssb) ssb.disabled = true;
      setSessionPhaseMenusEnabled(false);
      renderBottomContent();
      startCountdownForSelected();
    }

    function pauseTimers() {
      if (!isRunning) return;
      isRunning = false;
      const sb = el('startBtn'); if (sb) sb.disabled = false;
      const pb = el('pauseBtn'); if (pb) pb.disabled = true;
      const stb = el('stopBtn'); if (stb) stb.disabled = false;
      const ssb = el('scheduleStartBtn'); if (ssb) ssb.disabled = false;
      clearInterval(countdownInterval);
      const diff = endTime - getCorrectedNow();
      countdownSecondsLeft = diff > 0 ? Math.ceil(diff / 1000) : 0;
      startTime = endTime = null;
      setSessionPhaseMenusEnabled(true);
      updateTimerDisplay();
    }

    function stopTimers() {
      isRunning = false;
      const sb = el('startBtn'); if (sb) sb.disabled = false;
      const pb = el('pauseBtn'); if (pb) pb.disabled = true;
      const stb = el('stopBtn'); if (stb) stb.disabled = true;
      const ssb = el('scheduleStartBtn'); if (ssb) ssb.disabled = false;
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
      const now = new Date(getCorrectedNow());
      const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      let found = false;
      outerLoop: for (let s = 0; s < scheduledTimes.length; s++) {
        for (let p = 0; p < scheduledTimes[s].length; p++) {
          const phaseStart = scheduledTimes[s][p];
          let phaseEnd;
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
            startTime = getCorrectedNow();
            endTime = startTime + countdownSecondsLeft * 1000;
            found = true;
            break outerLoop;
          }
        }
      }
      if (!found) {
        selectedSessionIndex = 0;
        selectedPhaseIndex = 0;
        resetTimerToCurrentPhase();
        startTime = getCorrectedNow();
        endTime = startTime + countdownSecondsLeft * 1000;
      }
      renderSections();
      renderPhases();
      renderBottomContent();
      startTimers();
    }

    function adjustStartTime(offsetSeconds) {
      let [h, m, s] = startTimeStr.split(':').map(Number);
      let totalSec = h * 3600 + m * 60 + s + offsetSeconds;
      totalSec = ((totalSec % 86400) + 86400) % 86400;
      h = Math.floor(totalSec / 3600);
      m = Math.floor((totalSec % 3600) / 60);
      s = totalSec % 60;
      startTimeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      const sti = el('startTimeInput');
      if (sti) sti.value = startTimeStr;
      recalculateScheduledTimes();
      SESSION_TIMES = generateSessionTimes();
      renderSections();
      renderPhases();
      renderBottomContent();
    }

    function init() {
      const sti = el('startTimeInput');
      if (sti) sti.value = startTimeStr;

      const applyBtn = el('applyStartTimeBtn');
      if (applyBtn) {
        applyBtn.onclick = () => {
          startTimeStr = (el('startTimeInput')?.value || initialStartTime);
          recalculateScheduledTimes();
          SESSION_TIMES = generateSessionTimes();
          renderSections();
          renderPhases();
          renderBottomContent();
        };
      }

      document.querySelectorAll('.offset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          adjustStartTime(parseInt(btn.dataset.offset, 10));
        });
      });

      const mBtn = el('muteBtn');
      if (mBtn) {
        mBtn.onclick = () => {
          isMuted = !isMuted;
          mBtn.textContent = isMuted ? 'Unmute' : 'Mute';
          mBtn.setAttribute('aria-pressed', (!isMuted).toString());
        };
      }

      const sBtn = el('startBtn');
      if (sBtn) sBtn.onclick = startTimers;
      const pBtn = el('pauseBtn');
      if (pBtn) pBtn.onclick = pauseTimers;
      const stpBtn = el('stopBtn');
      if (stpBtn) stpBtn.onclick = stopTimers;
      const ssBtn = el('scheduleStartBtn');
      if (ssBtn) ssBtn.onclick = scheduleStart;

      setInterval(updateClock, 1000);
      updateClock();

      setInterval(() => {
        if (isRunning) return;
        const now = new Date(getCorrectedNow());
        const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        outerLoop: for (let s = 0; s < scheduledTimes.length; s++) {
          for (let p = 0; p < scheduledTimes[s].length; p++) {
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
              break outerLoop;
            }
          }
        }
      }, 1000);

      renderSections();
      renderPhases();
      resetTimerToCurrentPhase();
      renderBottomContent();
      startTime = endTime = null;

      syncStandardTime();
      setInterval(syncStandardTime, 60000);

      const muteBtn = el('muteBtn');
      if (muteBtn) {
        muteBtn.textContent = isMuted ? 'Unmute' : 'Mute';
        muteBtn.setAttribute('aria-pressed', (!isMuted).toString());
      }

      window.addEventListener('beforeunload', () => {
        clearInterval(countdownInterval);
        if (beepAudioCtx) beepAudioCtx.close();
      });
    }

    return {
      init,
      getCorrectedNow,
      formatTime,
      formatTimeHMSSec,
      formatAbsoluteTime,
      parseTimeString,
      addSeconds,
      beep,
      syncStandardTime,
      renderSections,
      renderPhases,
      renderBottomContent,
      setSessionPhaseMenusEnabled,
      recalculateScheduledTimes,
      resetTimerToCurrentPhase,
      adjustStartTime,
      startTimers,
      pauseTimers,
      stopTimers,
      scheduleStart,
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
      get isMuted() { return isMuted; },
      set isMuted(v) { isMuted = v; },
      get scheduledTimes() { return scheduledTimes; },
      get SESSION_TIMES() { return SESSION_TIMES; },
      get startTimeStr() { return startTimeStr; },
      set startTimeStr(v) { startTimeStr = v; },
    };
  }

  return { createController };
})();
