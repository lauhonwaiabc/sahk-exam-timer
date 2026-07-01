'use strict';
Sahk.register('OsceTimer', function() {
  var REST_INDICES = typeof STATION_NAMES !== 'undefined'
    ? STATION_NAMES.reduce(function(acc, name, i) { return name === 'Rest' ? acc.concat(i) : acc; }, [])
    : [];

  function start(cfg) {
    var timer = Sahk.get('GenericTimer').create({
      type: 'station',
      names: STATION_NAMES,
      numItems: NUM_STATIONS,
      hasRest: true,
      data: osceData,
      restIndices: REST_INDICES
    });
    timer.start(cfg);

    var tts = Sahk.get('ExamTTS');
    tts.init(timer.getController(), typeof OSCE_SCRIPT_DATA !== 'undefined' ? OSCE_SCRIPT_DATA : []);
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
window.OsceTimer = Sahk.get('OsceTimer');
