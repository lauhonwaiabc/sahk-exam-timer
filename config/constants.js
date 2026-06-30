'use strict';
Sahk.register('Constants', function() {
  return {
    PHASE: {
      TRANSIT: 'Transit',
      PREPARATION: 'Preparation',
      BREAK: 'Break',
      CONCLUSION: 'Conclusion',
      DEBRIEFING: 'Debriefing'
    },
    SCORE_OPTIONS: ['-', 2, 3, 4, 5, 6, 7, 8],
    SCORE_COLORS: {
      '-': '#000000',
      2: '#d32f2f',
      3: '#ff9800',
      4: '#fdd835',
      5: '#4caf50',
      6: '#2196f3',
      7: '#3f51b5',
      8: '#9c27b0'
    },
    debounce: function(fn, delay) {
      var timer;
      return function() {
        var ctx = this, args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function() { fn.apply(ctx, args); }, delay);
      };
    }
  };
});
window.SAHK_CONSTANTS = Sahk.get('Constants');
