'use strict';
Sahk.register('ErrorHandler', function() {
  var listeners = [];

  function reportError(error, context) {
    var msg = context ? '[' + context + '] ' : '';
    msg += error && error.message ? error.message : String(error);
    console.error('SAHK Error:', msg, error);
    listeners.forEach(function(fn) {
      try { fn({ message: msg, error: error, context: context }); } catch(e) {}
    });
    return msg;
  }

  function warn(message, context) {
    var msg = context ? '[' + context + '] ' : '';
    msg += message;
    console.warn('SAHK Warning:', msg);
    return msg;
  }

  function onError(callback) {
    listeners.push(callback);
    return function() {
      var idx = listeners.indexOf(callback);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }

  function safe(fn, context) {
    return function() {
      try { return fn.apply(this, arguments); }
      catch(e) { reportError(e, context); }
    };
  }

  async function safeAsync(fn, context) {
    try { return await fn(); }
    catch(e) { reportError(e, context); throw e; }
  }

  return {
    reportError: reportError,
    warn: warn,
    onError: onError,
    safe: safe,
    safeAsync: safeAsync
  };
});
