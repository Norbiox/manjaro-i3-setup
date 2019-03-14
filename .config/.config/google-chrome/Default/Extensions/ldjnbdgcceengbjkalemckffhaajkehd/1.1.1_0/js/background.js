//Avoid JSINT false positives (global variables)
var console = console;
var chrome = chrome;

//ID used to send a message to the Application
var IDAPP = "nmdombhgnofjnnaenegcdehnbkajfgbh"; // PROD

//ID used to send a message to the Application
//var IDAPP = "eojglbifjibkpcfdeoedpheglmikpdhg"; // DEVTEST

//ID used to send a message to the Application
//var IDAPP = "knlekjndnjollankampefoadcgfagima"; // LIVETEST

var mapper = {};

(function() {
  'use strict';
  console.debug('>>>>>> Ext Background - Loaded');
  
  var isIdeTab = function(tab) {
    return tab.url.indexOf('codingame.com/ide') >= 0 && tab.url.indexOf('codingame.com/ide/fileservlet?id') < 0;
  };

  var closeAll = function() {
    for (var key in mapper) {
      if (mapper.hasOwnProperty(key) && mapper[key]) {
        mapper[key].postMessage({'Status': 'Disconnect'});
        mapper[key] = null;
      }
    }
  };
  
  // -------------------
  // Page Action button:
  // -------------------
  chrome.pageAction.onClicked.addListener(function(tab) {
    chrome.tabs.sendMessage(tab.id, {'Status': 'activate'});
  });

  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (!isIdeTab(tab)) {
      chrome.pageAction.hide(tabId);
    }
  });

  // ------------------------
  // Listen External Messages 
  // ------------------------
  chrome.runtime.onMessageExternal.addListener(function(request, sender, sendResponse) {
    console.log('ext message: ', request, sender);
    var sent = false;
    
    if (request.Status === 'Closed') {
      closeAll();
      return;
    }
    
    if (request.testSessionId && mapper[request.testSessionId]) {
      try {
        mapper[request.testSessionId].postMessage(request);
        sent = true;
      } catch (e) {
        mapper[request.testSessionId] = null;
        console.log(e);
      }
    }
      
    if (sent) {
      sendResponse({'Status': 'Success'});
    } else {
      sendResponse({'Status': 'Error', 'Content': 'IDE not found. Open the puzzle page.'});
    }
  });

  // ------------------------------------------
  // Listen Internal Messages (from content.js)
  // ------------------------------------------

  // The content script establish the connexion, we save the port and the testSessionId.
  chrome.runtime.onConnect.addListener(function(port) {
    if (mapper[port.name]) {
      try {
        mapper[port.name].postMessage({'Status': 'Disconnect'});
      } catch (e) {
        console.log(e);
      }
      mapper[port.name] = port;
      chrome.runtime.sendMessage(IDAPP, {'Status': 'RequestStatus'}, function(response) {
        port.postMessage(response);
      });
    }
    mapper[port.name] = port;

    port.onMessage.addListener(function(request) {
      var sender = port.sender;
      if (request.Status === 'PageAction') {
        if (request.visible) {
          chrome.pageAction.show(sender.tab.id);
        } else {
          chrome.pageAction.hide(sender.tab.id);
        }
        chrome.pageAction.setIcon({'tabId': sender.tab.id, 'path': request.activated ? 'images/icon_codingame_sync_01.png' : 'images/icon_codingame_sync_02.png'});
      } else {
        // Forward the request to background.js of the APP
        request.testSessionId = port.name;
        console.log('send to app: ', request);
        chrome.runtime.sendMessage(IDAPP, request, function(response) {
          port.postMessage(response);
        });
      }
      return true;
    });

    port.onDisconnect.addListener(function() {
      if (mapper[port.name] == port) {
        chrome.runtime.sendMessage(IDAPP, {'Status': 'OFF', 'testSessionId': port.name});
        mapper[port.name] = null;
      }
    });
    
  });
}());
