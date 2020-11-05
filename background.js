console.log("Running MicroHunt background.js...");

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url && tab.url.includes("careers.microsoft.com")) {
    console.log("Adding page action to bar");
    chrome.pageAction.show(tabId);
  }
})

chrome.pageAction.onClicked.addListener((tab) => {
  console.log("page action clicked!");
  chrome.tabs.executeScript(
      tab.id,
      {code: 'console.log("Page Action clicked"); run();'});
})