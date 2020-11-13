function save_options() {
  var debugLogs = document.getElementById('debugLogs').checked;
  chrome.storage.sync.set({
    debugLogs: debugLogs
  }, function() {
    // Update status to let the user know options were saved
    var status = document.getElementById('status')
    status.textContent = "Options saved.";
    setTimeout(function() {
      status.textContent = ""
    }, 1500)
  })
}

function restore_options() {
  chrome.storage.sync.get({
    debugLogs: false
  }, function(items) {
    document.getElementById("debugLogs").checked = items.debugLogs
  })
}

document.addEventListener('DOMContentLoaded', restore_options)
document.getElementById('save').addEventListener('click', save_options);