'use strict';
Sahk.register('VivaTimer', function() {
  function start(cfg) {
    Sahk.get('GenericTimer').create({
      type: 'table',
      names: cfg.tableNames,
      numItems: NUM_TABLES,
      hasRest: false,
      data: vivaData,
      restIndices: []
    }).start(cfg);
  }

  return { start: start };
});
window.VivaTimer = Sahk.get('VivaTimer');
