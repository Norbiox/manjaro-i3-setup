// Just use to open a CodinGame tab properly.

function clickHandler(e) {
  if (chrome.app.window.get(APPName + '_Launch') !== null) {
    chrome.app.window.get(APPName + '_Launch').close();
  }
}

// Open a tab, then close the app.
document.addEventListener('DOMContentLoaded', function() {
  document.querySelector('#gotoCG').addEventListener('click', clickHandler);
});