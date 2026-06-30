'use strict';
window.OsceTimer = (function() {
  var REST_INDICES = typeof STATION_NAMES !== 'undefined'
    ? STATION_NAMES.reduce(function(acc, name, i) { return name === 'Rest' ? acc.concat(i) : acc; }, [])
    : [];

  function start(cfg) {
    GenericTimer.create({
      type: 'station',
      names: STATION_NAMES,
      numItems: NUM_STATIONS,
      hasRest: true,
      data: osceData,
      restIndices: REST_INDICES
    }).start(cfg);
  }

  return { start: start };
})();
