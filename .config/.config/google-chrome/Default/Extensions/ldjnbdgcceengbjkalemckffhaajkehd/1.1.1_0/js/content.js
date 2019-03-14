//Avoid JSINT false positives (global variables)
var console = console;
var chrome = chrome;
var $ = $;
var CustomEvent = CustomEvent;
var Event = Event;

////// Structure EVENT 
// IDE -> EXT
//      FIXED : 'IDEToExternalEditor' 
//      DYNAMIC : 
//      data.detail = 
//      {
//          Status = NAMESTATUS,
//          KEY = VALUE
//      }

// EXT -> IDE
//      FIXED : 'ExternalEditorToIDE'
//      DYNAMIC : 
//      data.detail = 
//      {
//          Status = NAMESTATUS,
//          KEY = VALUE
//      }

// LIST OF EVENTS SENT BY CODINGAME:
// status: 'updateCode', 'code': CODE IN THE IDE
// status: 'connect': order to start sync
// status: 'disconnect': order to stop sync
// status: 'submitted': submit button pushed

// LIST OF EVENTS CAUGHT BY CODINGAME:
// status: 'getCode': ask code
// status: 'synchronized': code is now synchronized
// status: 'updateCode': send new code
// status: 'setReadOnly': switch to read only mode
// status: 'play': play all test cases
// status: 'status': version of the extension

(function() {
  'use strict';

  console.debug('>>>>>> CodinGame Sync Content - Loaded');

  var CGCode = null; // Cache of the Code in the CG IDE
  var port = null; // communication channel
  var codeRequested = false;
  var questionId;
  var testSessionId;
  var questionDetails = {};

  // --------------------------------------
  // Communication with the IDE:
  // --------------------------------------
  var emitEvent = function(eventName, data) {
    data.status = eventName;
    var eventToSend = new CustomEvent('ExternalEditorToIDE', {
      'detail': data
    });
    window.document.dispatchEvent(eventToSend);
  };

  // Emit the readOnly state STATE
  var emitReadOnly = function(state) {
    emitEvent('setReadOnly', {'value': state});
  };

  // Emit the code CONTENT
  var emitSendCode = function(content) {
    emitEvent('updateCode', {'code': content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')});
  };

  var emitPlay = function() {
    emitEvent('play', {});
  };
  
  var emitGetCode = function() {
    emitEvent('getCode', {});
  };
  
  var emitSynchronized = function(value) {
    emitEvent('synchronized', {'value': value});
  };

  // Listen from messages sent by the IDE
  document.addEventListener('IDEToExternalEditor', function(data) {    
    switch (data.detail.status) {
    case 'connect':
      launch();
      break;
    case 'disconnect':
      stop();
      break;
    case 'questionDetails':
      questionId = data.detail.questionId;
      testSessionId = data.detail.testSessionId;
      connectExtension(testSessionId, questionId);
      updatePageActionIcon(true, false);
      questionDetails = data.detail;
      emitEvent('status', {'name': 'CG-Sync', 'version': '1.1.0'});
      break;
    case 'updateCode': // sent when code is loaded or changed.
      if (data.detail.code !== undefined) {
        CGCode = data.detail.code;
      }
      if (codeRequested) {
        port.postMessage({
          'Status': 'SuccessDownload',
          'Code': CGCode
        });
        codeRequested = false;
      }
      break;
    case 'submitted':
      sendMessage({
        'Status': 'Submitted',
        'Content': CGCode
      });
    }
  });

  // ------------------------
  // Communication with popup
  // ------------------------
  
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch (request.Status) {
      case 'activate':
        launch();
        break;
      case 'deactivate':
        stop();
        break;
    }
  });

  // ------------------------------------------
  // Communication with APP through background:
  // ------------------------------------------
  var connectExtension = function(testSessionId, questionId) {
    port = chrome.runtime.connect({name: testSessionId + '-' + questionId});
    
    var sendResponse = function(obj) {
      port.postMessage(obj);
    };

    // Listen for messages from background
    port.onMessage.addListener(function(request) {
      try {
        // Switch request Code
        switch (request.Status) {
        case 'Disconnect':
          updatePageActionIcon(true, false, true);
          emitSynchronized(false);
          port.disconnect();
          port = null;
          break;
        case 'UploadCode':
          emitSendCode(request.Content);
          if (request.AutoPlay === true) {
            emitPlay();
          }
          sendResponse({
            'Status': 'SuccessUpload'
          });

          break;
        case 'DownloadCode':
          if (CGCode) {
            sendResponse({
              'Status': 'SuccessDownload',
              'Code': CGCode
            });
          } else {
            emitGetCode();
            codeRequested = true;
          }
          break;
        case 'SetReadOnly':
          emitReadOnly(request.value);
          break;
        case 'Synchronized':
          updatePageActionIcon(true, request.value);
          emitSynchronized(request.value);
          sendResponse({
            'Status': 'Details',
            'Title': questionDetails.title,
            'Type': questionDetails.type
          });
          break;
        case 'Success':
          console.log('Success', request.Content);
          break;
        default:
          sendResponse({
            'Status': 'Error',
            'Content': 'Unknown Action',
            'URL': request.URL
          });
        }
      } catch (e) {
        sendResponse({
          'Status': 'Error',
          'Content': 'Exception',
          'URL': request.URL,
          'PuzzleName': 'None'
        });
      }
    });
  };

  var sendMessage = function(obj) {
    if (port == null) {
      connectExtension(testSessionId, questionId);
    }
    port.postMessage(obj);
  };
  
  var updatePageActionIcon = function(visible, isSynchronized, message) {
    sendMessage({'Status': 'PageAction', 'visible': visible, 'activated': isSynchronized, 'message': message});
  };

  // Launch/Close the App
  var launch = function() {
    sendMessage({'Status': 'ON'});
  };
  
  var stop = function() {
    sendMessage({'Status': 'OFF'});
    emitReadOnly(false);
    emitSynchronized(false);
  };

}());
