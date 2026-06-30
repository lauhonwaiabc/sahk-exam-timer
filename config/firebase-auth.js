'use strict';
window.SahkAuth = (function() {
  var FIREBASE_CONFIG = {
    apiKey: 'AIzaSyAJQzjpcfrGkpRRkTmayseHeh8nxRDds2s',
    authDomain: 'sahk-timer.firebaseapp.com',
    projectId: 'sahk-timer',
    storageBucket: 'sahk-timer.firebasestorage.app',
    messagingSenderId: '1053340816109',
    appId: '1:1053340816109:web:30d82cca029e481a0bb2e4'
  };

  var auth = null;
  var currentUser = null;
  var authReady = false;
  var listeners = [];

  function getEmailForRole(role) {
    return role + '@sahk-timer.auth';
  }

  function init() {
    if (typeof firebase === 'undefined') {
      console.error('Firebase SDK not loaded');
      return;
    }
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    auth = firebase.auth();
    auth.onAuthStateChanged(function(user) {
      currentUser = user;
      authReady = true;
      listeners.forEach(function(fn) { try { fn(user); } catch(e) {} });
    });
  }

  function onAuthStateChanged(callback) {
    listeners.push(callback);
    if (authReady) setTimeout(function() { callback(currentUser); }, 0);
    return function() {
      var idx = listeners.indexOf(callback);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }

  async function signIn(role, password) {
    if (!auth) init();
    var email = getEmailForRole(role);
    var cred = await auth.signInWithEmailAndPassword(email, password);
    return cred.user;
  }

  async function signOut() {
    if (!auth) return;
    await auth.signOut();
    currentUser = null;
  }

  function getUser() { return currentUser; }

  async function getIdToken(forceRefresh) {
    if (!currentUser) return null;
    return currentUser.getIdToken(forceRefresh || false);
  }

  async function getUserRole(uid) {
    if (typeof firebase === 'undefined' || !firebase.firestore) return null;
    try {
      var doc = await firebase.firestore().collection('users').doc(uid).get();
      return doc.exists ? (doc.data().role || null) : null;
    } catch(e) {
      console.error('getUserRole error:', e);
      return null;
    }
  }

  return {
    init: init,
    onAuthStateChanged: onAuthStateChanged,
    signIn: signIn,
    signOut: signOut,
    getUser: getUser,
    getIdToken: getIdToken,
    getUserRole: getUserRole,
    getEmailForRole: getEmailForRole
  };
})();
