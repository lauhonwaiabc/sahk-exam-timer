'use strict';
window.Sahk = (function() {
  var modules = {};
  var loadOrder = [];

  function register(name, factory) {
    if (modules[name]) {
      console.warn('Sahk: module "' + name + '" already registered, overwriting');
    }
    modules[name] = typeof factory === 'function' ? factory() : factory;
    loadOrder.push(name);
    return Sahk;
  }

  function get(name) {
    if (!modules[name]) {
      console.error('Sahk: module "' + name + '" not found. Load order: ' + loadOrder.join(' -> '));
      return null;
    }
    return modules[name];
  }

  function list() {
    return loadOrder.slice();
  }

  function isLoaded(name) {
    return !!modules[name];
  }

  return {
    register: register,
    get: get,
    list: list,
    isLoaded: isLoaded,
    _modules: modules,
    _order: loadOrder
  };
})();
