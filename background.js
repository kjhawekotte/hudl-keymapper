// Check to see if hudl when the extension loads
$(document).ready(function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        update_is_hudl(tabs[0].url);
    });
});

// Check to see if hudl when tabs are updated
chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
    update_is_hudl(tab.url);
});

// Check to see if hudl when tabs are activated (focused or pushed to background)
chrome.tabs.onActivated.addListener( function(listen) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        update_is_hudl(tabs[0].url);
    });
});

// Check to see if hudl when window focuses change
chrome.windows.onFocusChanged.addListener(function(window_id) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        update_is_hudl(tabs[0].url);
    });
});

// Check to see if hudl and update the stored value
function update_is_hudl(url) {

    var is_hudl = false;
    if (url.indexOf('hudl.com') != -1 && url.indexOf('pgb') != -1) {
        is_hudl = true;
    }

    chrome.storage.local.set({'is_hudl': is_hudl}, function() {});
}