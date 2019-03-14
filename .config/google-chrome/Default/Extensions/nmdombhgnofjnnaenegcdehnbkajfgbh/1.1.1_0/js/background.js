//Avoid JSINT false positives (global variables)
var chrome = chrome;
var console = console;
var saveSetting = saveSetting;
var KEYS = KEYS;
var APPName = APPName;
var removeLocalStorage = removeLocalStorage;

console.debug('>>>>>> CodinGame Sync Background - Loaded');

removeLocalStorage(KEYS.KEY_IS_HIDE);

//Create a window of the application
var launch = function(testSessionId) {
  'use strict';
  chrome.app.window.create('index.html', {
    id: APPName,
    innerBounds: {
      minHeight: 485,
      minWidth: 550,
      maxHeight: 550,
      maxWidth: 550
    }
  }, function(createdWindow) {
    console.log('set testsessionid:', testSessionId);
    createdWindow.contentWindow.testSessionId = testSessionId;
    
    createdWindow.onClosed.addListener(function() {
      console.log('on Closed');
      chrome.runtime.sendMessage(IDEXT, {'Status': 'Closed'});
    });
  });
};

chrome.app.runtime.onLaunched.addListener(function() {
  launch();
});

//Listen External Messages
chrome.runtime.onMessageExternal.addListener(function(request, sender, sendResponse) {
  'use strict';
  switch (request.Status) {
  case 'ON': // Launch the app or show it if already launched
    console.debug("Receive ON");
    saveSetting('SYNCHRO_LOCAL_ON', request.Status);
    saveSetting('IS_HIDE', false);
    if (chrome.app.window.get(APPName) !== null) {
      chrome.app.window.get(APPName).show();
      // TODO: send request.testSessionId
    } else {
      launch(request.testSessionId);
    }
    break;

  case 'OFF': // Close the app if it exists
    console.debug("Receive OFF");
    saveSetting('SYNCHRO_LOCAL_ON', request.Status);
    saveSetting('IS_HIDE', false);
    sendResponse({
      'Status': 'Synchronized',
      'value': false
    });
    if (chrome.app.window.get(APPName) !== null) {
      chrome.app.window.get(APPName).close();
    }
    break;
  }
  
  return true;
});
