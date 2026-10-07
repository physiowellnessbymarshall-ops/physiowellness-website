/**
 * Physio Wellness by Marshall — Analytics Module Entrypoint
 * Re-exporta el mòdul principal d'analítica des de ../js/analytics.js
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['../js/analytics.js'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = require('../js/analytics.js');
  } else {
    // A l'entorn de navegador, l'objecte global PW_ANALYTICS està definit per analytics.js
    root.PW_ANALYTICS = root.PW_ANALYTICS || {};
  }
}(typeof self !== 'undefined' ? self : this, function (analytics) {
  return analytics || (typeof window !== 'undefined' ? window.PW_ANALYTICS : {});
}));
