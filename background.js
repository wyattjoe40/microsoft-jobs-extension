console.log("Running MicroHunt background.js...");

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log("Tab changed listener, tab: ");
  console.log(tab);
  let url = changeInfo.url;
  if (url && url.includes("careers.microsoft.com")) {
    chrome.pageAction.show(tabId, () => {
      console.log("PAGE ACTION WAS CLICKED");
    });
  }
})

chrome.pageAction.onClicked.addListener((tab) => {
  console.log("page action clicked!");
  chrome.tabs.executeScript(
      tab.id,
      {code: 'console.log("Page Action clicked"); run();'});
})