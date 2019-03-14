//Avoid JSINT false positives (global variables)
//-> binding with common.js
var KEYS = KEYS;
var IDEXT = IDEXT;
var removeLocalStorage = removeLocalStorage;
var saveSetting = saveSetting;
var DefaultRefresh = DefaultRefresh;
var APPName = APPName;
//-> global (from Chrome)
var Blob = Blob;
var chrome = chrome;
var console = console;
var angular = angular;
var FileReader = FileReader;
var $ = $;

console.debug('>>>>>> CodinGame Sync App - Loaded');

//All Requests/Responses sent to/by the EXT have the same format : 
//{
//'Status': 'REQUEST_CODE', // REQUIRED (Ex:UploadCode/DownloadCode...)
//'Content': 'REQUEST_CONTENT',
//'SPECIFIC_PARAMS':'SPECIFIC_PARAMS'
//}
//And all follow the same path : => : APP.Request -> EXT.BACKGROUND.Request -> EXT.CONTENT.Request
//<= : EXT.CONTENT.Response -> EXT.BACKGROUND.Response -> APP.Request.Callback

/** ANGULAR */

var app = angular.module('CGSync', []);

//SERVICES

//Manage notifications displayed to the user
app.service('notificationService', ['$log', '$timeout', function($log, $timeout) {
  'use strict';
  var notifs = [];

  this.getNotifs = function() {
    return notifs;
  };

  this.addNotif = function(notif) { // a notif is an object : {'Status': "notif-CSS_CODE",'Content': "DISPLAYED_TEXT"} CSS_CODE : success|warning|error
    notifs.push(notif);

    $timeout(function() {
      notifs.splice(notifs.indexOf(notif), 1);
    }, 2000);
  };
}]);


// FILTERS
app.filter('bytes', function() {
  return function(bytes) {
    var units = ['bytes', 'kB', 'MB'];
    var base = 1000;
    var number = Math.floor(Math.log(bytes) / Math.log(base));
    if (number > 0) {
      return (bytes / Math.pow(base, number)).toFixed(2) +  ' ' + units[number];
    } else {
      return bytes + ' ' + units[0];
    }
  }
});

//CONTROLLERS

app.controller('MainCTRL', ['$scope',
  '$log',
  '$timeout',
  'notificationService',
  '$window',
  function($scope, $log, $timeout, notificationService, $window) {
    'use strict';
    
    /** VARIABLES */
    console.log('testSessionId:', testSessionId);

    // INSTANTIATE SERVICES
    $scope.alerts = notificationService.getNotifs();

    // Tabs:
    $scope.settingsTab = {title: 'Settings'}; 
    $scope.tabs = [];
    if (testSessionId) {
      $scope.tabs.push({title: 'Puzzle', testSessionId: testSessionId});
      $scope.selected = $scope.tabs[0];
    } else {
      $scope.selected = $scope.settingsTab;
    }
    console.log($scope.tabs);
    
    $scope.setSelected = function(tab) {
      $scope.selected = tab;
    }
    
    $scope.appReady = false;
    $scope.synchroUP = false; // Does the synchronization is in progress
    
    // Handle messages coming from the extension.
    chrome.runtime.onMessageExternal.addListener(function(request, sender, sendResponse) {
      switch (request.Status) {
      case 'Error':
        showApp();
        notificationService.addNotif({
          'Status': 'error',
          'Content': response.Content
        });
        break;
      case 'Submitted': // Create an entry of 'Fight in Arena'
        if ($scope.fileChosen.questionType === 'MULTI') {
          sendResponse({
            'Status': 'Success',
            'Content': 'Save Arena Received'
          });
          request.PuzzleName = $scope.fileChosen.puzzleName;
          saveSetting('SAVE_ARENA', request);
        }
        break;
      case 'Details':
        console.debug('Receive details ' + request.Title + ' ' + request.Type);
        $scope.fileChosen.puzzleName = request.Title;
        $scope.fileChosen.questionType = request.Type;
        break;
      case 'RequestStatus':
        console.log('Receive request status')
        sendCurrentStatus();
        break
      case 'SuccessUpload':
        notificationService.addNotif({
          'Status': 'success',
          'Content': 'Success Upload'
        });
        autoBackGround();
        $scope.firstAction = true;

        $scope.needUpdate = false;
        break;
      case 'SuccessDownload':
        var response = request;
        if (response.Code !== undefined && (response.Code !== $scope.fileChosen.content || !$scope.firstAction)
          && response.Code.length > 0) {
          printMessage('Download Success');
          notificationService.addNotif({
            'Status': 'success',
            'Content': 'Success Download'
          });
          if (writingToken) {
            writingToken = false;
            writeFile($scope.fileChosen.entry, response.Code, function() {
              autoBackGround();
              $scope.firstAction = true;
              loadFile($scope.fileChosen.entry, {
                'Status': 'Download'
              });
              writingToken = true;
            });
          }
        } else if (downloadManual) {
          printMessage('Download Success');
          downloadManual = false;
          notificationService.addNotif({
            'Status': 'warning',
            'Content': 'Success Download, but no code change'
          });
        } else if (response.Code.length === 0) {
          printMessage('Download Success, Code.length = 0');
          notificationService.addNotif({
            'Status': 'warning',
            'Content': 'There is no code found in the IDE'
          });
        }
        break;
      }
    });

    var sendMessageToEXT = function(obj, sendResponse) {
      obj.testSessionId = testSessionId;
      chrome.runtime.sendMessage(IDEXT, obj, sendResponse);
    };

    var sendSettingReadOnly = function() {
      sendMessageToEXT({
        'Status': 'SetReadOnly',
        'value': !$scope.settings.disableReadOnly
      }, function(resp) {
        console.log(resp);
      });
    };
    
    var sendCurrentStatus = function() {
      sendMessageToEXT({'Status': 'Synchronized', 'value': $scope.firstAction && $scope.fileChosen.loaded}, function(resp) {
        console.log(resp);
      });
      sendSettingReadOnly();
    };
    
    $scope.$watch('settings.disableReadOnly', function(value) {
      sendSettingReadOnly();
    });

    var uploadToken, // Does an upload is already in progress
    downloadToken, // Does an download is already in progress
    writingToken, // Does an writing is already in progress
    newFile, // Reopen the popup if a new file
    storageLoaded, // Enable refresh only after the storage loading
    alreadyMini, // Check if the app is minimized before a prompt
    downloadManual, // Overwrite the file if it's a manual download            

    initialize = function() {
      $scope.fileChosen = {
        'entry': null, // File identification in the user File System 
        'name': 'N/A', // Name of the chosen file
        'content': null, // Content of the chosen file (Preview + Change scanning)
        'size': 0, // Size of the chosen file
        'loaded': false, // Is the chosen file is already loaded
        'url': null, // URL of the puzzle with which the chosen file is currently synchronized
        'puzzleName': null
      // Name of the puzzle with which the chosen file is currently synchronized
      };

      // INFO SETTINGS - DO NOT FORGET TO BIND THEM IN LoadStorage()
      $scope.settings = {
        autoPlay: false,
        autoStart: false, // Automatically start the application        
        autoBackUp: false, // Automatically prompt the user after a submit in the Arena
        autoBackGround: false, // Not USE YET       
        autoFirstAction: 'Ask Me What To Do', // Always perform this action at application startup
        disableReadOnly: false, // Not USE YET
        interval: DefaultRefresh, // Refresh time for scanning file
        showPreview: false
      // Show preview of the currently loaded code in the application

      };
      $scope.firstAction = false; // Does the first action is done
      $scope.needUpdate = false; // Does a code change is detected               
      $scope.labelChooseFile = 'Choose File'; // Label of the ChooseFile button (change when load a file for UX)
      if ($scope.tabs.length > 0) {
        $scope.selected = $scope.tabs[0];
      } else {
        $scope.selected = $scope.settingsTab;
      }

      uploadToken = true; // Does an upload is already in progress
      downloadToken = true; // Does an download is already in progress
      writingToken = true; // Does an writing is already in progress
      newFile = false; // Reopen the popup if a new file
      storageLoaded = false; // Enable refresh only after the storage loading
      alreadyMini = false; // Check if the app is minimized before a prompt
      downloadManual = false; // Overwrite the file if it's a manual download               
    },

    /** FUNCTION USED ONLY HERE */

    // Print debug message if Debug mode is ON
    printMessage = function(message) {
      if ($scope.settings.showPreview) {
        $log.debug(message);
      }
    },

    // Show the window, do nothing if the app is already showed
    showApp = function() {
      printMessage('SHOW APP');
      chrome.app.window.get(APPName).show(true);
    },

    // Hide the window just after the first Action if autoBackGround is true;
    autoBackGround = function() {
      printMessage('IN autoBackGround ' + $scope.settings.autoBackGround);
      if ($scope.settings.autoBackGround) {
        if (!$scope.firstAction) {
          saveSetting('IS_HIDE', true);
          chrome.app.window.get(APPName).hide();
        }
      }
    },

    // Re-Minimized the window, if it was the case, after prompt the user for AutoBackUp
    autoMinimize = function() {
      printMessage('IN autoMinimize ' + alreadyMini);
      if (alreadyMini) {
        chrome.app.window.get(APPName).minimize();
      }
    },

    // Overwrite the content of 'entry' with 'content'
    writeFile = function(entry, content, callback) {
      entry.createWriter(function(writer) {
        writer.onerror = function(e) {
          showApp();
          writingToken = false;
          notificationService.addNotif({
            'Status': 'error',
            'Content': 'Error while writing in the file, more info in the debug output'
          });
          $log.error(e);
        };

        writer.onwriteend = function() {
          if (writer.length === 0 && content.length > 0) {
            writer.write(new Blob([content], {
              type: 'text/plain'
            }));
          }
          printMessage('Writing Done');
          callback();
        };

        writer.truncate(0);

      }, function(e) {
        showApp();
        notificationService.addNotif({
          'Status': 'error',
          'Content': 'Error while writing in the file, more info in the debug output'
        });
        $log.error(e);
      });
    },

    // Send a Upload Request to the EXT background.js
    sendCode = function() {
      if (uploadToken && downloadToken) { // Token : Does not upload the code if we are still awaiting a response from another call
        uploadToken = false; // Take the Token
        sendMessageToEXT({
          'Status': 'UploadCode',
          'Content': $scope.fileChosen.content,
          'AutoPlay': $scope.settings.autoPlay
        }, function(response) {
          uploadToken = true; // Release the Token
          if (response !== undefined) {
            switch (response.Status) {
            case 'Error':
              showApp(); // Shows the application to notify the user the error
              notificationService.addNotif({
                'Status': 'error',
                'Content': response.Content
              });
              break;
            }
          }
        });
      }
    },

    // Get the CodinGame code
    getCode = function() {
      if (downloadToken && uploadToken) { // Token : Does not download the code if we are still awaiting a response from another call
        downloadToken = false; // Take the Token
        sendMessageToEXT({
          'Status': 'DownloadCode'
        }, function(response) {
          console.log('response to download code');
          downloadToken = true; // Release the Token
          if (response !== undefined) {
            switch (response.Status) {
            case 'Error':
              showApp();
              notificationService.addNotif({
                'Status': 'error',
                'Content': response.Content
              });
              break;
            }
          }
        });
      }
    },

    // Load the file 'entry' of the user file system. The 'request' overwrite the loadfile behavior
    loadFile = function(entry, request) {
      $scope.fileChosen.name = entry.name;
      $scope.fileChosen.entry = entry;

      entry.file(function(file) {
        $scope.appReady = false;
        var reader = new FileReader();
        reader.onerror = function(e) {
          showApp();
          notificationService.addNotif({
            'Status': 'error',
            'Content': 'Error while loading the file, more info in the debug output'
          });
          $scope.appReady = true;
          $log.error(e);
        };

        reader.onloadend = function(e) {
          if ($scope.fileChosen.content !== e.target.result) {
            $scope.needUpdate = true;
          }
          $scope.fileChosen.content = e.target.result;
          $scope.fileChosen.size = e.total;

          $scope.$apply();

          // Apply Request
          if (request !== undefined) {
            switch (request.Status) {
            case 'Choose':
              printMessage('IN Choose');
              $scope.appReady = true;
              break;
            case 'Upload':
              printMessage('IN Upload');
              sendCode(); // Used to uploadCode(), to include the latest changes, even in manual upload.
              break;
            case 'Download': // We don't need to send the new code cuz it's up-to-date
              printMessage('IN Download');
              $scope.needUpdate = false;
              break;
            case 'OnChange': // Send the code if a code change is detected
              if ($scope.needUpdate) {
                sendCode();
              } else if ($scope.settings.disableReadOnly && uploadToken && writingToken) { // Else try the Two-way data binding
                getCode();
              }
              break;
            default:
            }
          }
          $scope.appReady = true;
          $scope.fileChosen.loaded = true;
        };
        reader.readAsText(file);
      }, function(error) {
        printMessage('The file couldn\'t be restored, MOVE or DELETED suspected !');
        showApp();
        $scope.appReady = true;
        notificationService.addNotif({
          'Status': 'error',
          'Content': 'The file couldn\'t be restored, reset factory settings...'
        });
        saveSetting('RESET', true);
        initialize();
      });

    },

    // Prompt the user to save their code after a submit in Arena
    saveAs = function(suggestedName, content) {
      printMessage('IN saveAs : ' + suggestedName + ' ' + content);
      var config = {
        type: 'saveFile',
        suggestedName: suggestedName
      };
      alreadyMini = chrome.app.window.get(APPName).isMinimized();

      chrome.fileSystem.chooseEntry(config, function(theEntry) {
        if (!theEntry) {

          printMessage('No file selected.');
          notificationService.addNotif({
            'Status': 'warning',
            'Content': 'AutoSave Cancelled'
          });
          autoMinimize();
        } else {
          writeFile(theEntry, content, function() {
            notificationService.addNotif({
              'Status': 'success',
              'Content': 'Success AutoSave'
            });
            autoMinimize();
          });
        }
      });
    },
    // Retrieves all informations from local storage
    loadStorage = function() {
      printMessage("IN loadStorage");
      chrome.storage.local.get(function(items) {
        // BackUp the last file used
        if (items[KEYS.KEY_LAST_FILE_LOADED] !== undefined) {
          $scope.labelChooseFile = 'Wait, Last File Founded : Backup in progress';
          $scope.$apply();
          chrome.fileSystem.isRestorable(items[KEYS.KEY_LAST_FILE_LOADED], function(isR) {
            chrome.fileSystem.restoreEntry(items[KEYS.KEY_LAST_FILE_LOADED], function(chosenEntry) {

              if (chosenEntry !== undefined && chosenEntry.isFile) {
                printMessage('Last File : ' + chosenEntry);
                loadFile(chosenEntry);
              } else {
                printMessage("Non recovery");
                saveSetting('RESET', true);
                $scope.appReady = true;
              }
            });
          });
        } else {
          $scope.appReady = true;
        }

        if (items[KEYS.KEY_SYNCHRO_LOCAL_ON] !== undefined) {
          $scope.synchroUP = (items[KEYS.KEY_SYNCHRO_LOCAL_ON] === 'ON') ? true : false;
          printMessage('SYNCHRO = ' + $scope.synchroUP);
        }
        if (items[KEYS.KEY_SAVE_ON_SUBMIT] !== undefined) {
          $scope.settings.autoBackUp = items[KEYS.KEY_SAVE_ON_SUBMIT];
          printMessage('AUTOBACKUP = ' + $scope.settings.autoBackUp);
        }
        if (items[KEYS.KEY_SHOW_PREVIEW] !== undefined) {
          $scope.settings.showPreview = items[KEYS.KEY_SHOW_PREVIEW];
          printMessage('PREVIEW = ' + $scope.showPreview);
        }
        if (items[KEYS.KEY_AUTO_FA] !== undefined) {
          $scope.settings.autoFirstAction = items[KEYS.KEY_AUTO_FA];
          printMessage('FA = ' + $scope.settings.autoFirstAction);
        }
        if (items[KEYS.KEY_AUTO_START] !== undefined) {
          $scope.settings.autoStart = items[KEYS.KEY_AUTO_START];
          printMessage('AUTOSTART = ' + $scope.settings.autoStart);
        }
        if (items[KEYS.KEY_AUTO_BACKGROUND] !== undefined) {
          $scope.settings.autoBackGround = items[KEYS.KEY_AUTO_BACKGROUND];
          printMessage('AUTOBACKGROUND = ' + $scope.settings.autoBackGround);
        }
        if (items[KEYS.KEY_AUTO_PLAY] !== undefined) {
          $scope.settings.autoPlay = items[KEYS.KEY_AUTO_PLAY];
          printMessage('AUTOPLAY= ' + $scope.settings.autoPlay);
        }
        if (items[KEYS.KEY_DISABLE_READONLY] !== undefined) {
          $scope.settings.disableReadOnly = items[KEYS.KEY_DISABLE_READONLY];
          printMessage('disableREADONLY = ' + $scope.settings.disableReadOnly);
        }
        storageLoaded = true;
      });

    },

    // Data Refresh function
    interval = function() {
      if (storageLoaded) {
        // Check the chosen file to see if we are up-to-date
        if ($scope.fileChosen.loaded && $scope.synchroUP && $scope.firstAction) {
          loadFile($scope.fileChosen.entry, {
            'Status': 'OnChange'
          });
        }
        // Perform the first action if Upload/Download
        if (!$scope.firstAction
          && (($scope.settings.autoFirstAction === 'Upload' || $scope.settings.autoFirstAction === 'Download') && !newFile)) {
          this.firstAction($scope.settings.autoFirstAction);
        }

        // Check if a new 'Fight in Arena' entry is available
        if ($scope.settings.autoBackUp) {
          chrome.storage.local.get(function(items) {
            if (items[KEYS.KEY_SAVE_ARENA]) {
              var Time = new Date(), Suggested = items[KEYS.KEY_SAVE_ARENA].PuzzleName + ' Submit At ' + Time.getFullYear() + '-'
                + Time.getMonth() + '-' + Time.getDate() + '-' + Time.getHours() + '-' + Time.getMinutes() + '.txt';
              saveAs(Suggested, items[KEYS.KEY_SAVE_ARENA].Content);
              removeLocalStorage(KEYS.KEY_SAVE_ARENA);
            }
          });
        }
      } else {
        loadStorage();
      }
      $timeout(function() {
        interval();
      }, $scope.settings.interval, true);
    }.bind(this);

    /** FUNCTION USED IN VIEW */

    // Upload the current code
    this.uploadCode = function() {
      printMessage('FORCE UPLOAD');
      loadFile($scope.fileChosen.entry, {
        'Status': 'Upload'
      });
    };

    // Download the CodinGame code
    this.downloadCode = function() {
      printMessage('FORCE DOWNLOAD');
      downloadManual = true;
      getCode();
    };

    // Hide the window 
    this.goToBackground = function() {
      saveSetting('IS_HIDE', true);
      chrome.app.window.get(APPName).hide();
    };

    // Prompt the user to choose a file
    this.chooseFile = function() {
      chrome.fileSystem.chooseEntry({
        type: 'openWritableFile'
      }, function(theEntry) {
        if (!theEntry) {
          notificationService.addNotif({
            'Status': 'warning',
            'Content': 'Choose File Cancelled (or File Error)'
          });
        } else {
          $scope.firstAction = false;
          newFile = true;
          saveSetting('LAST_FILE_LOADED', chrome.fileSystem.retainEntry(theEntry));
          loadFile(theEntry, "Choose");
        }
      });
    };
    
    $scope.stopSynchro = function(question) {
      sendMessageToEXT({'Status': 'Synchronized', 'value': false}, function(resp) {
        console.log(resp);
      });
      
      $scope.firstAction = false; // Does the first action is done
      $scope.needUpdate = false; // Does a code change is detected               
      $scope.labelChooseFile = 'Choose File'; // Label of the ChooseFile button (change when load a file for UX)

      uploadToken = true; // Does an upload is already in progress
      downloadToken = true; // Does an download is already in progress
      writingToken = true; // Does an writing is already in progress
      newFile = false; // Reopen the popup if a new file
      storageLoaded = false; // Enable refresh only after the storage loading
      alreadyMini = false; // Check if the app is minimized before a prompt
      downloadManual = false; // Overwrite the file if it's a manual download
      
      $window.close();
    };

    // Do the first action of the user (from the pop-up OR autoFirstAction)
    this.firstAction = function(status) {
      printMessage('First Action : ' + status);
      
      switch (status) {
      case 'Download':
        getCode();
        break;

      case 'Upload':
        this.uploadCode();
        break;

      case 'Choose':
        this.chooseFile();
        break;
      }
      
      sendMessageToEXT({'Status': 'Synchronized', 'value': true}, function(resp) {
        console.log(resp);
      });
      sendMessageToEXT({
        'Status': 'SetReadOnly',
        'value': !$scope.settings.disableReadOnly
      }, function(resp) {
        console.log(resp);
      });
    };

    // Save the setting in the local storage (-> common.js)
    this.saveSettings = function(sender, KEY_LABEL, VALUE) {
      printMessage('Save Settings : ' + KEY_LABEL + ' -> ' + VALUE);
      if (sender !== undefined) {
        $scope.settings[sender] = VALUE;
      }
      if (KEY_LABEL === 'RESET') {
        sendMessageToEXT({'Status': 'Synchronized', 'value': false}, function(resp) {
          console.log(resp);
        });
        initialize();
        notificationService.addNotif({
          'Status': 'success',
          'Content': 'Settings Reset'
        });
      } else {
        notificationService.addNotif({
          'Status': 'success',
          'Content': 'Settings Saved'
        });
      }
      saveSetting(KEY_LABEL, VALUE);
    };

    initialize();
    interval();
  }]);
