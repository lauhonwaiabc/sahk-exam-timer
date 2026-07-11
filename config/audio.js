'use strict';
Sahk.register('Audio', function() {

  var beepAudioCtx = null;
  var beeping = false;
  var isMuted = true;
  var volume = 0.5;

  function initBeep() {
    if (!beepAudioCtx) {
      beepAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  function beep(times) {
    times = times || 1;
    if (isMuted || beeping) return;
    beeping = true;
    initBeep();
    var count = 0;
    function play() {
      if (count >= times) { beeping = false; return; }
      var osc = beepAudioCtx.createOscillator();
      var gain = beepAudioCtx.createGain();
      gain.gain.value = volume;
      osc.frequency.value = 1000;
      osc.type = 'square';
      osc.connect(gain);
      gain.connect(beepAudioCtx.destination);
      osc.start();
      setTimeout(function() {
        osc.stop();
        count++;
        setTimeout(play, 150);
      }, 200);
    }
    play();
  }

  function setVolume(v) {
    volume = Math.max(0, Math.min(1, v));
    var slider = document.getElementById('volumeSlider');
    if (slider) slider.value = volume;
    var label = document.getElementById('volumeLabel');
    if (label) label.textContent = 'Vol: ' + Math.round(volume * 100) + '%';
  }

  function toggleMute() {
    isMuted = !isMuted;
    var muteBtn = document.getElementById('muteBtn');
    if (muteBtn) {
      muteBtn.textContent = isMuted ? 'Unmute' : 'Mute';
      muteBtn.setAttribute('aria-pressed', String(!isMuted));
    }
    return isMuted;
  }

  function setMuted(v) {
    isMuted = v;
    var muteBtn = document.getElementById('muteBtn');
    if (muteBtn) {
      muteBtn.textContent = isMuted ? 'Unmute' : 'Mute';
      muteBtn.setAttribute('aria-pressed', String(!isMuted));
    }
  }

  function cleanup() {
    beeping = false;
    if (beepAudioCtx) {
      try { beepAudioCtx.close(); } catch(e) {}
      beepAudioCtx = null;
    }
  }

  return {
    beep: beep,
    setVolume: setVolume,
    toggleMute: toggleMute,
    setMuted: setMuted,
    cleanup: cleanup,
    get isMuted() { return isMuted; },
    set isMuted(v) { setMuted(v); },
    get volume() { return volume; },
    set volume(v) { setVolume(v); }
  };
});
