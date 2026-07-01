'use strict';
Sahk.register('VivaTimer', function() {
  function start(cfg) {
    var timer = Sahk.get('GenericTimer').create({
      type: 'table',
      names: cfg.tableNames,
      numItems: NUM_TABLES,
      hasRest: false,
      data: vivaData,
      restIndices: []
    });
    timer.start(cfg);

    var tts = Sahk.get('ExamTTS');
    tts.init(timer.getController(), typeof VIVA_SCRIPT_DATA !== 'undefined' ? VIVA_SCRIPT_DATA : []);
    tts.start();

    var stopBtn = document.getElementById('stopBtn');
    if (stopBtn) {
      var existing = stopBtn._sahkStopHandler;
      if (existing) stopBtn.removeEventListener('click', existing);
      var handler = function() { tts.reset(); tts.start(); };
      stopBtn._sahkStopHandler = handler;
      stopBtn.addEventListener('click', handler);
    }

    return timer;
  }

  return { start: start };
});
window.VivaTimer = Sahk.get('VivaTimer');
