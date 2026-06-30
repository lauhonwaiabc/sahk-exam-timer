'use strict';
window.VivaTimer = (function() {
  function start(cfg) {
    GenericTimer.create({
      type: 'table',
      names: cfg.tableNames,
      numItems: NUM_TABLES,
      hasRest: false,
      data: vivaData,
      restIndices: []
    }).start(cfg);
  }

  return { start: start };
})();
