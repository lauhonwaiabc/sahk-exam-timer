'use strict';
Sahk.register('ExamTTS', function() {
  var Audio = Sahk.get('Audio');
  var _ctrl = null;
  var _scriptData = [];
  var _processed = {};
  var _intervalId = null;
  var _synth = null;
  var _synthSupported = false;

  _synthSupported = typeof window.speechSynthesis !== 'undefined' && window.speechSynthesis !== null;
  _synth = window.speechSynthesis || null;

  if (_synthSupported && _synth) {
    if (!_synth.getVoices().length) {
      _synth.addEventListener('voiceschanged', function() {});
      var w = new SpeechSynthesisUtterance('');
      w.volume = 0;
      try { _synth.speak(w); } catch (e) {}
    }
  }

  function init(controller, scriptData) {
    _ctrl = controller;
    _scriptData = scriptData || [];
    _processed = {};
  }

  function checkScript() {
    if (!_ctrl || !_ctrl.isRunning || _ctrl.startTime == null) return;
    var si = _ctrl.selectedSessionIndex;
    var pi = _ctrl.selectedPhaseIndex;
    var dur = SESSION_PHASES[si][pi].duration;
    var elapsed = dur - _ctrl.countdownSecondsLeft;

    for (var i = 0; i < _scriptData.length; i++) {
      if (_processed[i]) continue;
      var e = _scriptData[i];
      if (e.session !== si || e.phase !== pi) continue;
      var diff = elapsed - e.offset;
      if (diff >= -1 && diff <= 15) { showScript(i); return; }
    }

    for (var j = 0; j < _scriptData.length; j++) {
      if (_processed[j]) continue;
      if (_scriptData[j].session !== si || _scriptData[j].phase !== pi) continue;
      if (elapsed >= _scriptData[j].offset) showScript(j);
    }
  }

  function showScript(index) {
    var entry = _scriptData[index];
    if (!entry) return;
    _processed[index] = true;

    var banner = document.getElementById('scriptBanner');
    if (banner) {
      var sentences = entry.sentences.slice();
      var displayText = sentences.join(' ');
      banner.innerHTML = '<div class="script-text">' + displayText + '</div>';
      banner.classList.remove('done');
      banner.classList.add('speaking');
    }

    var sentences = entry.sentences.slice();
    function next() {
      if (sentences.length === 0) {
        if (banner) { banner.classList.remove('speaking'); banner.classList.add('done'); }
        return;
      }
      var text = sentences.shift();
      speakText(text, next);
    }
    next();
  }

  function speakText(text, onDone) {
    if (Audio.isMuted) { if (onDone) setTimeout(onDone, 100); return; }
    if (!_synthSupported || !_synth) { if (onDone) setTimeout(onDone, 100); return; }

    Audio.beep(2);

    var delay = 1200;
    setTimeout(function() {
      try {
        if (_synth.speaking || _synth.pending) _synth.cancel();
        var u = new SpeechSynthesisUtterance(text);
        u.rate = 1.0;
        u.pitch = 1.0;
        u.volume = Audio.volume;
        u.onend = function() { if (onDone) onDone(); };
        u.onerror = function() { if (onDone) setTimeout(onDone, 500); };
        _synth.speak(u);
      } catch (e) { if (onDone) setTimeout(onDone, 500); }
    }, delay);
  }

  function start() {
    if (_intervalId) stop();
    _intervalId = setInterval(checkScript, 1000);
  }

  function stop() {
    if (_intervalId) { clearInterval(_intervalId); _intervalId = null; }
    if (_synth) { try { _synth.cancel(); } catch (e) {} }
    _processed = {};
  }

  function reset() {
    _processed = {};
    if (_synth) { try { _synth.cancel(); } catch (e) {} }
  }

  return {
    init: init,
    start: start,
    stop: stop,
    reset: reset,
    get isActive() { return !!_intervalId; }
  };
});
window.ExamTTS = Sahk.get('ExamTTS');
