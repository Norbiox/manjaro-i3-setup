//Common.js is duplicated (not a singleton) between app and background => Only put constants in this file
var chrome = chrome;

//Name of the APP Window
var APPName = "Codingame Sync";

//ID used to send a message to the Extension
var IDEXT = "ldjnbdgcceengbjkalemckffhaajkehd"; // PROD

//ID used to send a message to the Extension
//var IDEXT = "opfopkgcfedpiehldmmchcfloeklieie"; // DEVTEST

//ID used to send a message to the Extension
//var IDEXT = "cmkhffdnklkiknooegenamcehjcapcdk"; // LIVETEST

//File Scanning interval
var DefaultRefresh = 1000; // (ms)

//Key used by the local storage
//DO NOT RENAME the KEY_NAME ALREADY USED
var KEYS = {
  KEY_AUTO_FA: 'CG_AUTO_FA',
  KEY_AUTO_PLAY: 'CG_AUTO_PLAY',
  KEY_SAVE_ARENA: 'CG_SAVE_ARENA',
  KEY_AUTO_START: 'CG_AUTO_START',
  KEY_SHOW_PREVIEW: 'CG_SHOW_PREVIEW',
  KEY_AUTO_BACKGROUND: 'CG_AUTO_BACKGROUND',
  KEY_SAVE_ON_SUBMIT: 'CG_SAVE_ON_SUBMIT',
  KEY_LAST_FILE_LOADED: 'CG_LAST_FILE_LOADED',
  KEY_SYNCHRO_LOCAL_ON: 'CG_SYNCHRO_LOCAL_ON',
  KEY_DISABLE_READONLY: 'CG_DISABLE_READONLY',
  KEY_IS_HIDE: 'CG_IS_HIDE'
};

//Set a KEY/Value to the localStorage
var saveLocalStorage = function(KEY, VALUE) {
  'use strict';
  var objectToSave = {};
  objectToSave[KEY] = VALUE;
  chrome.storage.local.set(objectToSave);
};

//Remove a KEY to the localStorage
function removeLocalStorage(KEY) {
  'use strict';
  var objectToRemove = {};
  objectToRemove.name = KEY;
  chrome.storage.local.remove(objectToRemove.name);
}

//Update KEY/Value used by app.js and background.js
//DO NOT CHANGE THE LABEL ALREADY USED
function saveSetting(KEY_LABEL, VALUE) {
  'use strict';
  switch (KEY_LABEL) {

  case 'SAVE_ON_SUBMIT':
    saveLocalStorage(KEYS.KEY_SAVE_ON_SUBMIT, VALUE);
    break;

  case 'AUTO_START':
    saveLocalStorage(KEYS.KEY_AUTO_START, VALUE);
    break;

  case 'SYNCHRO_LOCAL_ON':
    saveLocalStorage(KEYS.KEY_SYNCHRO_LOCAL_ON, VALUE);
    break;

  case 'SAVE_ARENA':
    saveLocalStorage(KEYS.KEY_SAVE_ARENA, VALUE);
    break;

  case 'LAST_FILE_LOADED':
    saveLocalStorage(KEYS.KEY_LAST_FILE_LOADED, VALUE);
    break;

  case 'SHOW_PREVIEW':
    saveLocalStorage(KEYS.KEY_SHOW_PREVIEW, VALUE);
    break;

  case 'AUTO_FA':
    saveLocalStorage(KEYS.KEY_AUTO_FA, VALUE);
    break;

  case 'AUTO_PLAY':
    saveLocalStorage(KEYS.KEY_AUTO_PLAY, VALUE);
    break;

  case 'DISABLE_RO':
    saveLocalStorage(KEYS.KEY_DISABLE_READONLY, VALUE);
    break;

  case 'AUTO_BACKGROUND':
    saveLocalStorage(KEYS.KEY_AUTO_BACKGROUND, VALUE);
    break;

  case 'IS_HIDE':
    saveLocalStorage(KEYS.KEY_IS_HIDE, VALUE);
    break;

  case 'HERE':
    // YOU CAN ADD YOUR OWN KEY HERE
    break;

  case 'RESET': // Reset all the storage and close the app
    chrome.storage.local.clear();
    break;

  default:
  }

}
