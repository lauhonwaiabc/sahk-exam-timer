'use strict';
Sahk.register('ExamTTS', function() {
  var Audio = Sahk.get('Audio');
  var _ctrl = null;
  var _scriptData = [];
  var _processed = {};
  var _intervalId = null;
  var _synth = null;
  var _synthSupported = false;
  var _voicesReady = false;
  var _ttsRate = 1.0;
  var _ttsPitch = 1.0;
  var _ttsVoiceURI = 'auto';

  _synthSupported = typeof window.speechSynthesis !== 'undefined' && window.speechSynthesis !== null;
  _synth = _synthSupported ? window.speechSynthesis : null;

  function warmupSynth() {
    if (!_synthSupported || !_synth) return;
    try {
      if (_synth.speaking) _synth.cancel();
      var w = new SpeechSynthesisUtterance('');
      w.volume = 0;
      w.rate = 1.0;
      w.pitch = 1.0;
      _synth.speak(w);
    } catch (e) {}
  }

  function ensureVoicesReady() {
    if (!_synthSupported || !_synth) return;
    var voices = _synth.getVoices();
    if (voices && voices.length) {
      _voicesReady = true;
      warmupSynth();
      return;
    }
    warmupSynth();
    var listener = function() {
      var v = _synth.getVoices();
      if (v && v.length) {
        _voicesReady = true;
        _synth.removeEventListener('voiceschanged', listener);
      }
    };
    _synth.addEventListener('voiceschanged', listener);
    setTimeout(function() {
      if (!_voicesReady) {
        _voicesReady = true;
        _synth.removeEventListener('voiceschanged', listener);
      }
    }, 5000);
  }

  ensureVoicesReady();

  function init(controller, scriptData) {
    _ctrl = controller;
    _scriptData = scriptData || [];
    _processed = {};
    if (!_voicesReady) ensureVoicesReady();
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
    if (Audio.isMuted) {
      if (onDone) setTimeout(onDone, 100);
      return;
    }
    if (!_synthSupported || !_synth) {
      if (onDone) setTimeout(onDone, 100);
      return;
    }
    if (!_voicesReady) {
      console.warn('ExamTTS: voices not ready, warming up');
      warmupSynth();
      if (onDone) setTimeout(onDone, 100);
      return;
    }

    Audio.beep(2);

    setTimeout(function() {
      try {
        if (_synth.speaking || _synth.pending) _synth.cancel();
        var u = new SpeechSynthesisUtterance(text);
        u.rate = _ttsRate;
        u.pitch = _ttsPitch;
        u.volume = Audio.volume;
        var voice = getSelectedVoice();
        if (voice) u.voice = voice;
        u.onstart = function() {};
        u.onend = function() { if (onDone) onDone(); };
        u.onerror = function(e) {
          console.error('ExamTTS speech error:', e.error || e.message || e);
          if (onDone) setTimeout(onDone, 500);
        };
        _synth.speak(u);
      } catch (e) {
        console.error('ExamTTS speakText exception:', e);
        if (onDone) setTimeout(onDone, 500);
      }
    }, 600);
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

  function getSelectedVoice() {
    if (!_synthSupported || _ttsVoiceURI === 'auto') return null;
    var voices = _synth.getVoices();
    for (var i = 0; i < voices.length; i++) {
      if (voices[i].voiceURI === _ttsVoiceURI) return voices[i];
    }
    return null;
  }

  function setRate(val) { _ttsRate = val; }

  function setPitch(val) { _ttsPitch = val; }

  function setVoice(uri) { _ttsVoiceURI = uri; }

  function populateVoiceSelect(sel) {
    if (!sel) return;
    while (sel.options.length > 1) sel.remove(1);
    if (!_synthSupported) return;
    var voices = _synth.getVoices();
    if (!voices.length) return;
    var seen = {};
    for (var i = 0; i < voices.length; i++) {
      var v = voices[i];
      if (!v.lang || !v.lang.startsWith('en')) continue;
      if (seen[v.voiceURI]) continue;
      seen[v.voiceURI] = true;
      var opt = document.createElement('option');
      opt.value = v.voiceURI;
      opt.textContent = v.name + ' (' + v.lang + ')';
      sel.appendChild(opt);
    }
    if (_ttsVoiceURI !== 'auto') {
      for (var j = 0; j < sel.options.length; j++) {
        if (sel.options[j].value === _ttsVoiceURI) { sel.value = _ttsVoiceURI; break; }
      }
    }
  }

  function setupControls() {
    var status = document.getElementById('speechStatus');

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

    var voiceSel = document.getElementById('voiceSelect');
    function populateVoices() {
      populateVoiceSelect(voiceSel);
      if (status) status.textContent = 'Speech engine ready';
    }
    if (_synthSupported) {
      populateVoices();
      if (window.speechSynthesis) {
        window.speechSynthesis.addEventListener('voiceschanged', populateVoices);
      }
    } else if (status) {
      status.textContent = 'Speech synthesis not supported in this browser';
    }

    if (voiceSel) {
      voiceSel.addEventListener('change', function() {
        _ttsVoiceURI = this.value;
        try { localStorage.setItem('sahk_tts_voice_uri', this.value); } catch(e) {}
      });
      var saved = null;
      try { saved = localStorage.getItem('sahk_tts_voice_uri'); } catch(e) {}
      if (saved && saved !== 'auto') {
        _ttsVoiceURI = saved;
        for (var j = 0; j < voiceSel.options.length; j++) {
          if (voiceSel.options[j].value === saved) { voiceSel.value = saved; break; }
        }
      }
    }

    var testBtn = document.getElementById('testSpeechBtn');
    if (testBtn) {
      testBtn.addEventListener('click', function() {
        if (!_voicesReady) {
          if (status) status.textContent = 'Speech engine loading... please try again';
          warmupSynth();
          return;
        }
        warmupSynth();
        if (Audio.isMuted) Audio.setMuted(false);
        var u = new SpeechSynthesisUtterance('This is a test of the speech synthesis engine.');
        u.rate = parseFloat(rateSlider ? rateSlider.value : 1.0);
        u.pitch = parseFloat(pitchSlider ? pitchSlider.value : 1.0);
        u.volume = Audio.volume;
        var voice = null;
        if (_synthSupported && voiceSel && voiceSel.value !== 'auto') {
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

  return {
    init: init,
    start: start,
    stop: stop,
    reset: reset,
    setRate: setRate,
    setPitch: setPitch,
    setVoice: setVoice,
    populateVoiceSelect: populateVoiceSelect,
    setupControls: setupControls,
    warmupSynth: warmupSynth,
    get isActive() { return !!_intervalId; },
    get voicesReady() { return _voicesReady; },
    get synthSupported() { return _synthSupported; }
  };
});
window.ExamTTS = Sahk.get('ExamTTS');
